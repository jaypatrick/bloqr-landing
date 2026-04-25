/**
 * src/workflows/waitlistSignup.ts — Durable post-signup orchestration workflow
 *
 * Cloudflare Workflows provide **durable, per-step retryable execution** backed
 * by persistent state.  Unlike `ctx.waitUntil()`, a Workflow step that fails
 * due to a Worker crash, timeout, or transient network error is automatically
 * resumed from the last completed checkpoint — not restarted from scratch.
 *
 * ## What this workflow does
 *
 * After the HTTP handler inserts a new signup row and returns 200, this
 * workflow orchestrates the non-blocking side-effects:
 *
 *   Step 1 — `enqueue-email`      (3 retries, exponential backoff, 30 s timeout)
 *             Publishes an `EmailQueueMessage` to the `email-queue` Cloudflare
 *             Queue.  The queue consumer handles actual delivery, giving email
 *             its own independent retry budget.
 *
 *   Step 2 — `apollo-enrichment`  (2 retries, linear backoff, 15 s timeout)
 *             POSTs the new contact to the Apollo.io contacts API.  A failure
 *             here does NOT re-send the confirmation email.
 *
 *   Step 3 — `track-analytics`    (0 retries, 5 s timeout)
 *             Writes a `waitlist_signup` data point to the Analytics Engine
 *             dataset.  Non-critical; loss is acceptable.
 *
 * ## Why keep the DB INSERT in the HTTP handler?
 *
 * The HTTP response depends on the INSERT outcome: a duplicate row returns
 * a 409 Conflict.  Steps that affect the HTTP response must remain synchronous
 * in the handler.  Only fire-and-forget side effects belong in this workflow.
 *
 * ## Activation
 *
 * 1. Ensure the `email-queue` Queue producer binding is also active (Step 1
 *    publishes to it).
 * 2. Uncomment the `[[workflows]]` block in `wrangler.toml`:
 *    ```toml
 *    [[workflows]]
 *    binding     = "WAITLIST_WORKFLOW"
 *    name        = "waitlist-signup"
 *    class_name  = "WaitlistSignupWorkflow"
 *    script_name = "adblock-landing"
 *    ```
 * 3. Add `WAITLIST_WORKFLOW?: Workflow` to `src/types/env.ts` (already done).
 * 4. Verify `src/worker.ts` exports this class at the top level (already done).
 * 5. Deploy (`npm run deploy` / push to main).
 *
 * @see wrangler.toml — workflow binding configuration
 * @see functions/waitlist.ts — creates workflow instances after DB INSERT
 * @see https://developers.cloudflare.com/workflows/
 */

import type { Env } from '../types/env';
import type { EmailQueueMessage } from '../types/emailQueue';

// ─── Workflow parameters ───────────────────────────────────────────────────────

/**
 * Parameters passed to the workflow when `env.WAITLIST_WORKFLOW.create()` is
 * called from the HTTP handler.
 *
 * Keep this interface stable — changing field names or types will silently
 * break in-flight workflow instances that were created with the old shape.
 * Add new optional fields rather than renaming/removing existing ones.
 */
export interface WaitlistWorkflowParams {
  /** Validated recipient email address (normalised to lowercase). */
  email: string;
  /** Validated waitlist segment, or `null` if the user did not select one. */
  segment: string | null;
}

// ─── Private helpers ───────────────────────────────────────────────────────────

/** Human-readable Apollo contact label per segment. */
const SEGMENT_LABELS: Record<string, string> = {
  'list-maker':     'Waitlist: List Maker',
  'privacy-vendor': 'Waitlist: Privacy Vendor',
  'individual':     'Waitlist: Individual',
};

// ─── Workflow class ────────────────────────────────────────────────────────────

/**
 * `WaitlistSignupWorkflow` — durable orchestrator for post-signup side effects.
 *
 * Exported from `src/worker.ts` so Wrangler registers it in the Worker bundle.
 *
 * Each `step.do()` call is a **durable checkpoint**: if the Worker crashes
 * mid-step, the Workflows runtime will resume from the last *completed* step
 * rather than restarting the entire workflow.  This eliminates the need for
 * manual idempotency guards across steps — each step runs exactly once on
 * success.
 *
 * @example
 * ```typescript
 * // In the waitlist HTTP handler, after a successful DB INSERT:
 * if (env.WAITLIST_WORKFLOW) {
 *   ctx.waitUntil(
 *     env.WAITLIST_WORKFLOW
 *       .create({ id: `waitlist-${email}`, params: { email, segment } })
 *       .catch((err) => console.warn('Workflow create failed:', err)),
 *   );
 * }
 * ```
 */
export class WaitlistSignupWorkflow
  extends CloudflareWorkersModule.WorkflowEntrypoint<Env, WaitlistWorkflowParams>
{
  /**
   * Workflow entry point — called once per workflow instance.
   *
   * @param event - contains `event.payload` with the `WaitlistWorkflowParams`
   * @param step  - durable execution context; each `step.do()` is a checkpoint
   */
  async run(
    event: Readonly<CloudflareWorkersModule.WorkflowEvent<WaitlistWorkflowParams>>,
    step: CloudflareWorkersModule.WorkflowStep,
  ): Promise<void> {
    const { email, segment } = event.payload;

    // ── Step 1: Enqueue confirmation email ─────────────────────────────────────
    //
    // Publishes an `EmailQueueMessage` to `EMAIL_QUEUE`.  The queue consumer
    // (`handleEmailQueue`) performs the actual delivery with its own retry
    // policy and deduplication logic.
    //
    // Separating "enqueue durably" (this step) from "send reliably" (consumer)
    // gives each concern an independent retry budget, avoiding a scenario where
    // a transient MailChannels error causes Apollo enrichment to re-run too.
    await step.do(
      'enqueue-email',
      {
        retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
        timeout: '30 seconds',
      },
      async () => {
        if (!this.env.EMAIL_QUEUE || !this.env.FROM_EMAIL) {
          // Queue or FROM_EMAIL binding not yet active — skip gracefully.
          // This allows the workflow to be registered before the queue is
          // created without causing perpetual failures.
          return { queued: false, messageId: null };
        }

        const messageId = crypto.randomUUID();
        const message: EmailQueueMessage = {
          id:         messageId,
          template:   'waitlistWelcome',
          to:         email,
          params:     { email, segment },
          enqueuedAt: new Date().toISOString(),
        };

        await this.env.EMAIL_QUEUE.send(message);

        return { queued: true, messageId };
      },
    );

    // ── Step 2: Apollo.io contact enrichment ───────────────────────────────────
    //
    // Retried independently from the email step.  A failure here will NOT
    // cause Step 1 to re-run — each step's success is checkpointed separately.
    //
    // We throw on non-2xx so the step is retried according to its retry policy.
    // On 409 Conflict (contact already exists), we swallow the error since
    // deduplication at Apollo's end is acceptable.
    await step.do(
      'apollo-enrichment',
      {
        retries: { limit: 2, delay: '5 seconds', backoff: 'linear' },
        timeout: '15 seconds',
      },
      async () => {
        if (!this.env.APOLLO_API_KEY) return { ok: false };

        const label = segment ? (SEGMENT_LABELS[segment] ?? 'Waitlist') : 'Waitlist';
        const res   = await fetch('https://api.apollo.io/v1/contacts', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Cache-Control': 'no-cache',
            'X-Api-Key':     this.env.APOLLO_API_KEY,
          },
          body: JSON.stringify({ email, label_names: [label] }),
        });

        // 409 = already exists — treat as success.
        if (!res.ok && res.status !== 409) {
          const text = await res.text().catch(() => '(no body)');
          // Throw so the step is retried per its retry policy.
          throw new Error(`Apollo contact push failed (${res.status}): ${text}`);
        }

        return { ok: true };
      },
    );

    // ── Step 3: Analytics Engine data point ────────────────────────────────────
    //
    // Non-critical observability event.  0 retries — analytics data loss is
    // acceptable and we don't want a transient Analytics Engine hiccup to delay
    // the workflow or trigger a noisy alert.
    await step.do(
      'track-analytics',
      { retries: { limit: 0, delay: 0 }, timeout: '5 seconds' },
      async () => {
        if (!this.env.ANALYTICS) return;
        this.env.ANALYTICS.writeDataPoint({
          blobs:   ['waitlist_signup', email, segment ?? 'none'],
          doubles: [1],
          indexes: ['waitlist_signup'],
        });
      },
    );
  }
}

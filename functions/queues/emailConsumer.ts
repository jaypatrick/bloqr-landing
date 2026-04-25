/**
 * functions/queues/emailConsumer.ts — Cloudflare Queue consumer for email delivery
 *
 * Processes messages from the `email-queue` Cloudflare Queue.  Each message is
 * an `EmailQueueMessage` envelope that identifies the template, recipient, and
 * render parameters.
 *
 * ## Consumer pipeline (per message)
 *
 *   1. **Schema validation** — invalid messages are ACKed immediately and
 *      routed to the DLQ (retrying a malformed message is futile)
 *   2. **Deduplication** — checks `EMAIL_DEDUP_KV` for the message ID; skips
 *      the send if the key exists (prevents duplicate emails on consumer retry)
 *   3. **Stale message check** — skips messages older than `MAX_MESSAGE_AGE_MS`
 *      (24 hours by default) to avoid sending belated confirmations
 *   4. **Template rendering** — looks up and calls the render function for the
 *      message's template name; unknown templates → ACK (not retried)
 *   5. **Email delivery** — calls `createEmailService(env).sendEmail(...)`;
 *      prefers the `EMAIL_WORKER` service binding, falls back to MailChannels
 *   6. **Dedup key write** — writes the message ID to `EMAIL_DEDUP_KV` (TTL 24h)
 *   7. **Analytics event** — writes an `email_sent` data point
 *   8. **ACK** — removes the message from the queue
 *
 * On transient failure (e.g. MailChannels 5xx): `message.retry()` — the
 * Cloudflare runtime re-enqueues the message up to `max_retries` times (see
 * wrangler.toml).  After `max_retries`, the message is moved to `email-dlq`.
 *
 * ## Wiring
 *
 * ```toml
 * # wrangler.toml (uncomment to activate)
 * [[queues.consumers]]
 * queue             = "email-queue"
 * max_batch_size    = 10
 * max_batch_timeout = 30
 * max_retries       = 3
 * dead_letter_queue = "email-dlq"
 * ```
 *
 * ```typescript
 * // src/worker.ts
 * import { handleEmailQueue } from '../functions/queues/emailConsumer';
 *
 * export default {
 *   async fetch(request, env, ctx) { ... },
 *   async queue(batch, env, ctx) { return handleEmailQueue(batch, env, ctx); },
 * } satisfies ExportedHandler<Env, EmailQueueMessage>;
 * ```
 *
 * @see src/types/emailQueue.ts — message envelope type
 * @see src/worker.ts — queue handler wiring
 * @see https://developers.cloudflare.com/queues/
 */

import { ZodError } from 'zod';
import { EmailQueueMessageSchema, type EmailQueueMessage } from '../../src/types/emailQueue';
import { createEmailService, EmailValidationError } from '../../src/services/emailService';
import { renderWaitlistWelcome } from '../../src/email/templates/waitlistWelcome';
import type { Env } from '../../src/types/env';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Maximum age (in milliseconds) for a message to be delivered.
 *
 * Messages older than this threshold are ACKed without sending.  This prevents
 * a DLQ backlog from triggering a flood of belated confirmation emails after a
 * prolonged outage.
 *
 * Default: 24 hours.  Adjust in `wrangler.toml [vars]` if needed.
 */
const MAX_MESSAGE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * KV TTL (in seconds) for the deduplication key written after a successful send.
 *
 * Must be ≥ the maximum time a message can remain in the queue (including retries).
 * 86 400 s = 24 hours; safe for the default max_retries + max_batch_timeout settings.
 */
const DEDUP_TTL_SECONDS = 86_400; // 24 hours

// ─── Template registry ────────────────────────────────────────────────────────

/**
 * Maps template names to their render functions.
 *
 * **Must be kept in sync with `functions/admin/email.ts → TEMPLATE_REGISTRY`.**
 *
 * To add a new template:
 *   1. Create `src/email/templates/<name>.ts` exporting a render function.
 *   2. Add the name to `EmailTemplateNameSchema` in `src/services/emailSchemas.ts`.
 *   3. Register it here AND in `functions/admin/email.ts`.
 */
const CONSUMER_TEMPLATE_REGISTRY: Record<
  string,
  (params: Record<string, string | null>) => { subject: string; html: string; text: string }
> = {
  waitlistWelcome: (params) =>
    renderWaitlistWelcome(
      // `email` is validated as present in the schema and rendered params must
      // match the template contract.  A missing `email` key at this point means
      // the queue message was malformed despite passing schema validation — treat
      // it as a programmer error by throwing so the consumer can ACK without retry.
      params['email'] ?? (() => { throw new Error('waitlistWelcome: params.email is required'); })(),
      params['segment'] ?? null,
    ),
};

// ─── Public consumer ──────────────────────────────────────────────────────────

/**
 * Queue consumer entry point — processes a batch of email queue messages.
 *
 * Called by the Worker's `queue` export in `src/worker.ts`.  Each message is
 * processed independently; a failure on one message does not affect others in
 * the same batch.
 *
 * Message outcomes:
 *   - `message.ack()`   — permanent success or permanent failure (invalid schema,
 *     unknown template, stale message, missing FROM_EMAIL).  Removes the message.
 *   - `message.retry()` — transient failure (network error, MailChannels 5xx).
 *     Re-enqueues up to `max_retries` times; then automatically routes to DLQ.
 *
 * @param batch - the batch of messages received from the Cloudflare Queue
 * @param env   - Worker environment bindings (EMAIL_WORKER, FROM_EMAIL, etc.)
 */
export async function handleEmailQueue(
  batch: MessageBatch<EmailQueueMessage>,
  env: Env,
): Promise<void> {
  for (const message of batch.messages) {
    await processMessage(message, env);
  }
}

// ─── Per-message processor ────────────────────────────────────────────────────

async function processMessage(
  message: Message<EmailQueueMessage>,
  env: Env,
): Promise<void> {
  // ── 1. Schema validation ────────────────────────────────────────────────────
  let parsed: EmailQueueMessage;
  try {
    parsed = EmailQueueMessageSchema.parse(message.body);
  } catch (err) {
    if (err instanceof ZodError) {
      console.error(
        '[email-queue] Invalid message schema — ACKing without retry (routes to DLQ):',
        err.issues,
      );
      // ACK: schema violations cannot be fixed by retrying.
      message.ack();
      return;
    }
    throw err;
  }

  const { id, template, to, params, enqueuedAt } = parsed;

  // ── 2. Stale message check ──────────────────────────────────────────────────
  const ageMs = Date.now() - new Date(enqueuedAt).getTime();
  if (ageMs > MAX_MESSAGE_AGE_MS) {
    console.warn(
      `[email-queue] Message ${id} is stale (${Math.round(ageMs / 60_000)} min old) — skipping`,
    );
    message.ack();
    return;
  }

  // ── 3. Deduplication ────────────────────────────────────────────────────────
  // Check if this message ID has already been successfully delivered.
  // Prevents duplicate sends when the consumer is retried after sending but
  // before ACKing (e.g. Worker crash between send and ack).
  if (env.EMAIL_DEDUP_KV) {
    const dedupKey    = `email-sent:${id}`;
    const alreadySent = await env.EMAIL_DEDUP_KV.get(dedupKey).catch(() => null);
    if (alreadySent !== null) {
      console.info(`[email-queue] Skipping duplicate message ${id} (already delivered)`);
      message.ack();
      return;
    }
  }

  // ── 4. Template rendering ───────────────────────────────────────────────────
  const renderer = CONSUMER_TEMPLATE_REGISTRY[template];
  if (!renderer) {
    console.error(
      `[email-queue] Unknown template "${template}" for message ${id} — ACKing without retry`,
    );
    // ACK: unknown templates cannot be fixed by retrying.
    message.ack();
    return;
  }

  let rendered: { subject: string; html: string; text: string };
  try {
    rendered = renderer(params);
  } catch (err) {
    console.error(`[email-queue] Template render error for "${template}" (message ${id}):`, err);
    // Render errors are not transient — ACK to avoid retry loops.
    message.ack();
    return;
  }

  // ── 5. Email delivery ───────────────────────────────────────────────────────
  if (!env.FROM_EMAIL) {
    // FROM_EMAIL is required to send.  ACK (not retry) to drain the queue
    // rather than spinning on retries that will always fail.
    console.warn(`[email-queue] FROM_EMAIL not configured — skipping message ${id} for ${to}`);
    message.ack();
    return;
  }

  try {
    await createEmailService({
      FROM_EMAIL:       env.FROM_EMAIL,
      DKIM_DOMAIN:      env.DKIM_DOMAIN,
      DKIM_SELECTOR:    env.DKIM_SELECTOR,
      DKIM_PRIVATE_KEY: env.DKIM_PRIVATE_KEY,
      EMAIL_WORKER:     env.EMAIL_WORKER,
    }).sendEmail({ to, ...rendered });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email-queue] Send failed for message ${id} (to: ${to}): ${msg}`);

    // EmailValidationError is a permanent failure — retrying cannot fix a bad
    // payload.  ACK to remove the message rather than filling the DLQ with it.
    if (err instanceof EmailValidationError) {
      message.ack();
      return;
    }

    // Transient failure — retry (CF Queues will respect max_retries setting).
    message.retry();
    return;
  }

  // ── 6. Deduplication key write ──────────────────────────────────────────────
  // Write after a successful send so that consumer retries (e.g. if the Worker
  // crashes here) check the key and skip re-sending.
  if (env.EMAIL_DEDUP_KV) {
    const dedupKey = `email-sent:${id}`;
    await env.EMAIL_DEDUP_KV.put(dedupKey, '1', { expirationTtl: DEDUP_TTL_SECONDS }).catch(
      (err: unknown) => console.warn(`[email-queue] KV dedup write failed for ${id}:`, err),
    );
  }

  // ── 7. Analytics event ──────────────────────────────────────────────────────
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs:   ['email_sent', template, to],
      doubles: [1],
      indexes: ['email_sent'],
    });
  }

  // ── 8. ACK ──────────────────────────────────────────────────────────────────
  message.ack();
  console.info(`[email-queue] Delivered ${template} to ${to} (message ${id})`);
}

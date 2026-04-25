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
 *      dropped permanently (retrying a malformed message is futile)
 *   2. **Stale message check** — ACKs messages older than `MAX_MESSAGE_AGE_MS`
 *      (24 hours by default) and skips sending to avoid belated confirmations
 *   3. **Deduplication** — checks `EMAIL_DEDUP_KV` for the message ID; skips
 *      the send if the key exists (prevents duplicate emails on consumer retry)
 *   4. **Template rendering** — checks `EMAIL_DB` for a custom DB override;
 *      falls back to the compiled default in `src/email/templates/` if none
 *   5. **Email delivery** — calls `createEmailService(env).sendEmail(...)`;
 *      prefers the `EMAIL_WORKER` service binding, falls back to MailChannels
 *   6. **Dedup key write** — writes the message ID to `EMAIL_DEDUP_KV` (TTL 24h)
 *   7. **D1 delivery log** — writes a row to `email_sends` in `EMAIL_DB`
 *   8. **Analytics event** — writes an `email_sent` data point
 *   9. **ACK** — removes the message from the queue
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
 *   async queue(batch, env, ctx) { return handleEmailQueue(batch, env); },
 * } satisfies ExportedHandler<Env, EmailQueueMessage>;
 * ```
 *
 * @see src/types/emailQueue.ts — message envelope type
 * @see src/worker.ts — queue handler wiring
 * @see https://developers.cloudflare.com/queues/
 */

import { z, ZodError } from 'zod';
import { EmailQueueMessageSchema, type EmailQueueMessage } from '../../src/types/emailQueue';
import { createEmailService, EmailValidationError } from '../../src/services/emailService';
import { WaitlistWelcomeParamsSchema } from '../../src/services/emailSchemas';
import { renderWaitlistWelcome } from '../../src/email/templates/waitlistWelcome';
import { logEmailSend, getEmailTemplate } from '../../src/db/emailDb';
import type { EmailSendStatus } from '../../src/db/emailDb';
import type { Env } from '../../src/types/env';
import { SITE_URL } from '../../src/config';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Maximum age (in milliseconds) for a message to be delivered.
 *
 * Messages older than this threshold are ACKed without sending.  This prevents
 * a DLQ backlog from triggering a flood of belated confirmation emails after a
 * prolonged outage.
 *
 * Default: 24 hours.  To change it, update this constant in code.
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
 * Exported so tests can temporarily remove entries to simulate the
 * "template in schema but not in registry" scenario (e.g. a template that was
 * removed from code but whose queue messages are still in flight).
 *
 * To add a new template:
 *   1. Create `src/email/templates/<name>.ts` exporting a render function.
 *   2. Add the name to `EmailTemplateNameSchema` in `src/services/emailSchemas.ts`.
 *   3. Register it here AND in `functions/admin/email.ts`.
 */
export const CONSUMER_TEMPLATE_REGISTRY: Record<
  string,
  (params: Record<string, string | null>) => { subject: string; html: string; text: string }
> = {
  waitlistWelcome: (params) =>
    renderWaitlistWelcome(
      // `email` is validated by CONSUMER_PARAMS_SCHEMA_REGISTRY before this
      // function is called.  The null-coalesce throw here is a last-resort
      // defensive guard; in practice it should never trigger.
      params['email'] ?? (() => { throw new Error('waitlistWelcome: params.email is required'); })(),
      params['segment'] ?? null,
    ),
};

/**
 * Maps template names to per-template Zod schemas for validating `params`
 * extracted from queue messages before rendering.
 *
 * Validation happens in step 4 of `processMessage` — before calling the
 * renderer.  Invalid params are treated as permanent failures (ACK, no retry)
 * because retrying a message with a bad `email` address cannot fix the problem.
 *
 * To add a new template: export a params schema from `src/services/emailSchemas.ts`
 * and add an entry here.
 */
const CONSUMER_PARAMS_SCHEMA_REGISTRY: Record<string, z.ZodTypeAny> = {
  waitlistWelcome: WaitlistWelcomeParamsSchema,
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
        '[email-queue] Invalid message schema — ACKing without retry (message will NOT be retried or routed to DLQ):',
        err.issues,
      );
      // Log selected fields to D1 so admin can identify and investigate
      // the failing message.  The raw message body is not persisted — only
      // the extracted fields (id, to, template) and the validation error string.
      if (env.EMAIL_DB) {
        const rawBody = message.body as Record<string, unknown>;
        await logEmailSend(env.EMAIL_DB, {
          message_id:    typeof rawBody['id'] === 'string' ? rawBody['id'] : 'unknown',
          attempt:       message.attempts,
          to_address:    typeof rawBody['to'] === 'string' ? rawBody['to'] : 'unknown',
          template_name: typeof rawBody['template'] === 'string' ? rawBody['template'] : 'unknown',
          status:        'invalid',
          strategy:      'none',
          error_message: `Schema validation failed: ${err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        });
      }
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
    if (env.EMAIL_DB) {
      await logEmailSend(env.EMAIL_DB, {
        message_id:    id,
        attempt:       message.attempts,
        to_address:    to,
        template_name: template,
        status:        'stale',
        strategy:      'none',
        error_message: `Message age ${Math.round(ageMs / 60_000)} min exceeds 24h limit`,
      });
    }
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
      if (env.EMAIL_DB) {
        await logEmailSend(env.EMAIL_DB, {
          message_id:    id,
          attempt:       message.attempts,
          to_address:    to,
          template_name: template,
          status:        'deduplicated',
          strategy:      'none',
          error_message: null,
        });
      }
      message.ack();
      return;
    }
  }

  // ── 4. Template rendering ───────────────────────────────────────────────────
  // Check EMAIL_DB for a custom template override before using the hard-coded
  // default.  This allows subject lines and copy to be updated via the admin
  // UI without a code deploy.
  const renderer = CONSUMER_TEMPLATE_REGISTRY[template];
  if (!renderer) {
    console.error(
      `[email-queue] Unknown template "${template}" for message ${id} — ACKing without retry`,
    );
    if (env.EMAIL_DB) {
      await logEmailSend(env.EMAIL_DB, {
        message_id:    id,
        attempt:       message.attempts,
        to_address:    to,
        template_name: template,
        status:        'invalid',
        strategy:      'none',
        error_message: `Unknown template: "${template}"`,
      });
    }
    // ACK: unknown templates cannot be fixed by retrying.
    message.ack();
    return;
  }

  // Validate template-specific params (e.g. email must be a valid address).
  // A bad `email` value can never be fixed by retrying — ACK immediately.
  const paramsValidator = CONSUMER_PARAMS_SCHEMA_REGISTRY[template];
  if (paramsValidator) {
    const validation = paramsValidator.safeParse(params);
    if (!validation.success) {
      const detail = validation.error.issues
        .map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      console.error(
        `[email-queue] Invalid params for template "${template}" (message ${id}): ${detail}`,
      );
      if (env.EMAIL_DB) {
        await logEmailSend(env.EMAIL_DB, {
          message_id:    id,
          attempt:       message.attempts,
          to_address:    to,
          template_name: template,
          status:        'invalid',
          strategy:      'none',
          error_message: `Invalid params: ${detail}`,
        });
      }
      message.ack();
      return;
    }
  }

  let rendered: { subject: string; html: string; text: string };
  try {
    // Check for a custom DB override first — it takes priority over the
    // compiled default.  If EMAIL_DB is not configured or no override exists
    // the compiled template is used.
    let customTemplate: { subject: string; html: string; text: string } | null = null;
    if (env.EMAIL_DB) {
      const dbTemplate = await getEmailTemplate(env.EMAIL_DB, template);
      if (dbTemplate) {
        // Substitute {{email}} and {{site_url}} placeholders in the DB template.
        // Fall back to the canonical site URL when site_url is not in params.
        const email   = params['email'] ?? to;
        const siteUrl = params['site_url'] ?? SITE_URL;
        customTemplate = {
          subject: dbTemplate.subject,
          html:    dbTemplate.html.replace(/\{\{email\}\}/g, email).replace(/\{\{site_url\}\}/g, siteUrl),
          text:    dbTemplate.text.replace(/\{\{email\}\}/g, email).replace(/\{\{site_url\}\}/g, siteUrl),
        };
      }
    }
    rendered = customTemplate ?? renderer(params);
  } catch (err) {
    console.error(`[email-queue] Template render error for "${template}" (message ${id}):`, err);
    if (env.EMAIL_DB) {
      await logEmailSend(env.EMAIL_DB, {
        message_id:    id,
        attempt:       message.attempts,
        to_address:    to,
        template_name: template,
        status:        'invalid',
        strategy:      'none',
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
    // Render errors are not transient — ACK to avoid retry loops.
    message.ack();
    return;
  }

  // ── 5. Email delivery ───────────────────────────────────────────────────────
  if (!env.FROM_EMAIL) {
    // FROM_EMAIL is required to send.  ACK (not retry) to drain the queue
    // rather than spinning on retries that will always fail.
    console.warn(`[email-queue] FROM_EMAIL not configured — skipping message ${id} for ${to}`);
    if (env.EMAIL_DB) {
      await logEmailSend(env.EMAIL_DB, {
        message_id:    id,
        attempt:       message.attempts,
        to_address:    to,
        template_name: template,
        status:        'invalid',
        strategy:      'none',
        error_message: 'FROM_EMAIL not configured',
      });
    }
    message.ack();
    return;
  }

  // Determine which strategy will be used so we can log it accurately.
  const strategy: 'service-binding' | 'mailchannels' = env.EMAIL_WORKER
    ? 'service-binding'
    : 'mailchannels';

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

    // Log the failed attempt to D1.
    if (env.EMAIL_DB) {
      await logEmailSend(env.EMAIL_DB, {
        message_id:    id,
        attempt:       message.attempts,
        to_address:    to,
        template_name: template,
        status:        (err instanceof EmailValidationError ? 'invalid' : 'failed') as EmailSendStatus,
        strategy,
        error_message: msg,
      });
    }

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

  // ── 7. D1 delivery log ──────────────────────────────────────────────────────
  // Log the successful send to EMAIL_DB for admin history and audit trail.
  if (env.EMAIL_DB) {
    await logEmailSend(env.EMAIL_DB, {
      message_id:    id,
      attempt:       message.attempts,
      to_address:    to,
      template_name: template,
      status:        'sent',
      strategy,
      error_message: null,
    });
  }

  // ── 8. Analytics event ──────────────────────────────────────────────────────
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs:   ['email_sent', template, to, strategy],
      doubles: [1],
      indexes: ['email_sent'],
    });
  }

  // ── 9. ACK ──────────────────────────────────────────────────────────────────
  message.ack();
  console.info(`[email-queue] Delivered ${template} to ${to} via ${strategy} (message ${id})`);
}

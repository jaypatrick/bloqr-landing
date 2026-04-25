/**
 * src/types/emailQueue.ts — Cloudflare Queue message envelope for email delivery
 *
 * Published by the waitlist handler (or `WaitlistSignupWorkflow`) to the
 * `email-queue` Cloudflare Queue.  Consumed by the `handleEmailQueue` function
 * exported from `src/worker.ts`.
 *
 * ## Why Cloudflare Queues?
 *
 * Using a Queue instead of `ctx.waitUntil(fetch(...))` provides:
 *   - **Durable delivery** — messages survive Worker crashes or timeouts
 *   - **Automatic retries** — up to `max_retries` attempts with configurable
 *     backoff (exponential or linear), no code changes needed
 *   - **Dead Letter Queue** — undeliverable messages land in `email-dlq` for
 *     inspection and manual replay via the Cloudflare dashboard
 *   - **Batching** — up to `max_batch_size` messages processed per consumer
 *     invocation, reducing per-message overhead
 *   - **Backpressure** — the runtime pauses producers when the queue is full,
 *     preventing unbounded memory growth during traffic spikes
 *   - **Observability** — queue depth, throughput, and DLQ metrics available
 *     in the Cloudflare dashboard with no additional instrumentation
 *
 * ## Activation
 *
 * 1. Create the queues:
 *    ```sh
 *    wrangler queues create email-queue
 *    wrangler queues create email-dlq
 *    ```
 * 2. Uncomment the `[[queues.producers]]` and `[[queues.consumers]]` blocks
 *    in `wrangler.toml`.
 * 3. Deploy (`npm run deploy` or push to main — CI deploys automatically).
 *
 * @see wrangler.toml — queue binding configuration
 * @see functions/queues/emailConsumer.ts — consumer implementation
 * @see https://developers.cloudflare.com/queues/
 */

import { z } from 'zod';
import { EmailTemplateNameSchema } from '../services/emailSchemas';

// ─── Schema ───────────────────────────────────────────────────────────────────

/**
 * Zod schema for the envelope published to the email Queue.
 *
 * The consumer validates every message against this schema before attempting
 * to render or send.  Messages that fail schema validation are immediately
 * ACKed (not retried) because invalid messages cannot be fixed by retrying —
 * they are effectively dead letters and should be investigated manually.
 *
 * IMPORTANT: All parameter values must be `string | null` (not `number`,
 * `boolean`, or nested objects) so they serialise cleanly over the queue.
 * Cloudflare Queues serialises payloads as JSON; non-serialisable values are
 * silently dropped.
 */
export const EmailQueueMessageSchema = z.object({
  /**
   * UUIDv4 identifier for this delivery attempt.
   *
   * Used for deduplication: the consumer writes this ID to `EMAIL_DEDUP_KV`
   * after a successful send (TTL: 24 hours).  Subsequent consumer retries for
   * the same message skip the send when this key exists, preventing duplicate
   * confirmation emails even if the worker crashes after sending but before
   * ACKing.
   *
   * Generate with `crypto.randomUUID()`.
   */
  id: z.string().uuid(),

  /**
   * Template name from the `TEMPLATE_REGISTRY`.
   *
   * Must match an entry in `EmailTemplateNameSchema`
   * (`src/services/emailSchemas.ts`).  Adding a new template requires:
   *   1. Creating `src/email/templates/<name>.ts`
   *   2. Adding the name to `EmailTemplateNameSchema`
   *   3. Registering the render function in `functions/queues/emailConsumer.ts`
   *      AND `functions/admin/email.ts`
   */
  template: EmailTemplateNameSchema,

  /**
   * Recipient email address.
   *
   * Validated by the consumer with Zod before rendering.  Invalid addresses
   * cause the message to be ACKed (not retried) since retrying cannot fix a
   * bad address.
   */
  to: z.email(),

  /**
   * Template-specific render parameters.
   *
   * All values must be `string | null` — numbers and booleans are not
   * supported at this level.  Each template's render function is responsible
   * for coercing values as needed.
   */
  params: z.record(z.string(), z.string().nullable()),

  /**
   * ISO 8601 UTC timestamp when the message was first published to the queue.
   *
   * Used for:
   *   - **Stale message detection**: the consumer can skip messages that are
   *     older than a configurable threshold (e.g. > 24 h) to avoid sending
   *     belated confirmation emails.
   *   - **Observability**: included in Analytics Engine data points.
   */
  enqueuedAt: z.string().datetime(),
});

/** TypeScript type inferred from `EmailQueueMessageSchema`. */
export type EmailQueueMessage = z.infer<typeof EmailQueueMessageSchema>;

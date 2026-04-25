/**
 * src/services/emailService.ts — Transactional email for the Bloqr Worker
 *
 * Supports three delivery strategies — automatically selected at runtime:
 *
 *  1. **Service binding** (`EMAIL_WORKER`): Routes the request through the
 *     dedicated `adblock-email` Cloudflare Worker via a service binding.
 *     Preferred when the binding is present because it centralises delivery
 *     logic, retries, and logging in a single place.
 *
 *  2. **CF Email Sending** (`SEND_EMAIL`): Delivers directly via the native
 *     Cloudflare Email Workers binding (`cloudflare:email`, `[[send_email]]`
 *     in `wrangler.toml`).  No third-party API key required.
 *
 *  3. **Null (no-op)**: Logs a warning and drops the email.  Used when neither
 *     `EMAIL_WORKER` nor `SEND_EMAIL` is configured (local dev without bindings,
 *     CI, etc.).
 *
 * The service validates the payload with Zod before attempting delivery.
 * Invalid payloads throw `EmailValidationError` — treat as permanent failures.
 * Delivery failures (including non-2xx responses) are thrown so queue consumers
 * and other retry-capable callers can retry the operation.
 *
 * Usage:
 *   import { createEmailService } from '@/services/emailService';
 *
 *   // Inside a Worker handler:
 *   const svc = createEmailService(env);
 *   await svc.sendEmail({ to, subject, html, text });
 *
 *   // Fire-and-forget (never blocks the primary response):
 *   ctx.waitUntil(
 *     svc.sendEmail({ to, subject, html, text })
 *        .catch((err) => console.warn('Email failed:', err)),
 *   );
 */

import { EmailMessage } from 'cloudflare:email';
import { ZodError } from 'zod';
import { EmailPayloadSchema, type EmailPayload } from './emailSchemas';
import { renderWaitlistWelcome } from '../email/templates/waitlistWelcome';

// ─── Error types ─────────────────────────────────────────────────────────────

/**
 * Thrown by `EmailService.sendEmail()` when Zod payload validation fails.
 *
 * Use `instanceof EmailValidationError` to distinguish permanent validation
 * failures (which should be ACKed, not retried) from transient delivery errors
 * (which should be retried).
 *
 * @example
 * ```typescript
 * try {
 *   await emailService.sendEmail(payload);
 * } catch (err) {
 *   if (err instanceof EmailValidationError) {
 *     // Permanent failure — ACK the queue message, do not retry
 *     message.ack();
 *   } else {
 *     // Transient failure — retry
 *     message.retry();
 *   }
 * }
 * ```
 */
export class EmailValidationError extends Error {
  /** Structured list of failing field paths + messages from Zod. */
  readonly issues: Array<{ path: string; message: string }>;

  constructor(issues: Array<{ path: string; message: string }>) {
    const details = issues.map((i) => `${i.path}: ${i.message}`).join(', ');
    super(`Invalid email payload: ${details}`);
    this.name = 'EmailValidationError';
    this.issues = issues;
  }
}

// ─── Re-export EmailPayload so callers only need one import ───────────────────
export type { EmailPayload } from './emailSchemas';
export { EmailPayloadSchema } from './emailSchemas';

// ─── Environment ──────────────────────────────────────────────────────────────

/**
 * Local definition of the CF `SEND_EMAIL` Workers binding.
 * Defined locally to avoid a hard dependency on `@cloudflare/workers-types`
 * in this service module.
 *
 * Wire in wrangler.toml:
 *   [[send_email]]
 *   name = "SEND_EMAIL"
 *
 * @see https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
 */
interface SendEmailBinding {
  send(message: unknown): Promise<void>;
}

/**
 * Minimum environment bindings required by the email service.
 *
 * `FROM_EMAIL` is the only strictly required field.
 *
 * `EMAIL_WORKER` is the service binding to the `adblock-email` Cloudflare
 * Worker.  When present the service forwards the payload there instead of
 * calling the CF Email Sending binding.  Wire it in `wrangler.toml`:
 *
 *   [[services]]
 *   binding = "EMAIL_WORKER"
 *   service = "adblock-email"
 *
 * `SEND_EMAIL` is the native CF Email Workers binding.  When present (and
 * `EMAIL_WORKER` is absent), `CfEmailSendingStrategy` is selected.
 */
export interface EmailEnv {
  /** Sender address, e.g. `"Bloqr <hello@bloqr.dev>"` */
  FROM_EMAIL: string;
  /**
   * Cloudflare service binding to the `adblock-email` Worker.
   * When present, email delivery is routed through this binding instead of
   * calling the CF Email Sending binding directly.
   */
  EMAIL_WORKER?: Fetcher;
  /**
   * Cloudflare Email Workers `SEND_EMAIL` binding.
   * When present (and `EMAIL_WORKER` is absent), `CfEmailSendingStrategy` is used.
   */
  SEND_EMAIL?: SendEmailBinding;
}

// ─── Service binding payload ──────────────────────────────────────────────────

/**
 * JSON body sent to the `adblock-email` worker via the service binding.
 * The worker receives this and forwards to its configured provider,
 * allowing the delivery implementation to be updated independently.
 */
interface EmailWorkerPayload {
  to:      string;
  from:    string;
  subject: string;
  html:    string;
  text:    string;
}

// ─── MIME helpers ─────────────────────────────────────────────────────────────

/**
 * Parses a display-name email address (RFC 5322) into its name and email parts.
 *
 * @example
 * parseEmailAddress('Bloqr <hello@bloqr.dev>') // { name: 'Bloqr', email: 'hello@bloqr.dev' }
 * parseEmailAddress('hello@bloqr.dev')          // { name: '', email: 'hello@bloqr.dev' }
 */
function parseEmailAddress(displayAddress: string): { name: string; email: string } {
  const match = displayAddress.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1]!.trim(), email: match[2]!.trim() };
  }
  return { name: '', email: displayAddress.trim() };
}

/**
 * RFC 2047 Base64 encoding for non-ASCII email subjects.
 * Returns the subject unchanged if it contains only printable ASCII.
 */
function encodeSubjectRfc2047(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  const bytes  = new TextEncoder().encode(subject);
  const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Strips CR and LF from a MIME header field value to prevent header injection.
 * Applies to `To` and `Subject` fields before they are embedded in the raw message.
 */
function stripHeaderInjection(value: string): string {
  return value.replace(/[\r\n]/g, '');
}

/**
 * Builds a minimal multipart/alternative MIME message string suitable for
 * passing directly to `new EmailMessage(from, to, rawMime)`.
 */
function buildRawMimeMessage(
  from:    string,
  to:      string,
  subject: string,
  text:    string,
  html:    string,
): string {
  const safeTo      = stripHeaderInjection(to);
  const safeSubject = stripHeaderInjection(subject);
  const boundary = `----bloqr-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const lines = [
    `From: ${from}`,
    `To: ${safeTo}`,
    `Subject: ${encodeSubjectRfc2047(safeSubject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    '',
    `--${boundary}--`,
  ];
  return lines.join('\r\n');
}

// ─── Send strategies ─────────────────────────────────────────────────────────

/**
 * Pluggable delivery strategy.  Both concrete strategies below implement this
 * interface so the `EmailService` class does not need to know which one is
 * active — the factory selects the right strategy based on `env`.
 */
export interface EmailSendStrategy {
  send(payload: EmailPayload, env: EmailEnv): Promise<void>;
}

// ─── Shared default sender ────────────────────────────────────────────────────

/**
 * Default sender address used when `FROM_EMAIL` is not explicitly configured
 * (direct waitlist send path only).
 *
 * Other send paths (queue consumer, admin send-test) still require `FROM_EMAIL`
 * to be set explicitly.  Import this constant from call sites that need to fall
 * back to it to keep the sender address in a single place.
 */
export const DEFAULT_FROM_EMAIL = 'Bloqr <hello@bloqr.dev>';

/**
 * Delivers via the `adblock-email` Worker service binding.
 *
 * Forwards a JSON payload to `env.EMAIL_WORKER.fetch()`.  A non-2xx response
 * or network error throws so callers (e.g. the queue consumer) can choose to
 * retry.  HTTP handler callers that use `ctx.waitUntil` should wrap with
 * `.catch((err) => console.warn('Email failed:', err))`.
 */
export class ServiceBindingStrategy implements EmailSendStrategy {
  async send(payload: EmailPayload, env: EmailEnv): Promise<void> {
    if (!env.EMAIL_WORKER) {
      throw new Error('ServiceBindingStrategy requires EMAIL_WORKER binding');
    }

    const body: EmailWorkerPayload = {
      to:      payload.to,
      from:    env.FROM_EMAIL,
      subject: payload.subject,
      html:    payload.html,
      text:    payload.text,
    };

    let res: Response;
    try {
      res = await env.EMAIL_WORKER.fetch(
        new Request('https://send-email', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        }),
      );
    } catch (err) {
      // Re-throw so queue consumers can call message.retry().
      // HTTP handler callers must wrap with .catch().
      console.warn('adblock-email service binding request failed:', err);
      throw err;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '(no body)');
      const msg  = `adblock-email service binding returned ${res.status}: ${text}`;
      console.warn(msg);
      throw new Error(msg);
    }
  }
}

/**
 * Delivers via the native Cloudflare Email Workers `SEND_EMAIL` binding.
 *
 * Constructs a raw MIME message and sends it through the CF Email Routing
 * infrastructure.  No third-party API key required — delivery authority is
 * granted by the binding itself.
 *
 * Prerequisites:
 *   1. Enable Cloudflare Email Routing on the bloqr.dev zone.
 *   2. Verify the sending address as an allowed sender in Email Routing.
 *   3. Add `[[send_email]] name = "SEND_EMAIL"` to `wrangler.toml`.
 *
 * @see https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
 */
export class CfEmailSendingStrategy implements EmailSendStrategy {
  async send(payload: EmailPayload, env: EmailEnv): Promise<void> {
    if (!env.SEND_EMAIL) {
      throw new Error('CfEmailSendingStrategy requires SEND_EMAIL binding');
    }
    const sanitized    = env.FROM_EMAIL.replace(/[\r\n]/g, '');
    const envelopeFrom = parseEmailAddress(sanitized).email;
    const rawMime      = buildRawMimeMessage(sanitized, payload.to, payload.subject, payload.text, payload.html);
    const message      = new EmailMessage(envelopeFrom, payload.to, rawMime);
    try {
      await env.SEND_EMAIL.send(message);
    } catch (err) {
      const msg = `CF Email Sending failed: ${err instanceof Error ? err.message : String(err)}`;
      console.warn(msg);
      throw new Error(msg);
    }
  }
}

/**
 * No-op fallback strategy used when neither `EMAIL_WORKER` nor `SEND_EMAIL`
 * is configured.  Logs a warning and resolves without sending — prevents
 * crashes in local dev or CI where email bindings are absent.
 */
export class NullEmailStrategy implements EmailSendStrategy {
  async send(payload: EmailPayload, _env: EmailEnv): Promise<void> {
    console.warn(
      `[email] NullEmailStrategy: no send provider configured — dropping email to ${payload.to}`,
    );
  }
}

// ─── EmailService ─────────────────────────────────────────────────────────────

/**
 * Primary email service class.
 *
 * Validates the payload with Zod then delegates to the injected strategy.
 * Construct via `createEmailService(env)` rather than directly so the correct
 * strategy is chosen automatically.
 *
 * @example
 * ```typescript
 * const svc = createEmailService(env);
 *
 * // Blocking send (awaited directly):
 * await svc.sendEmail({ to, subject, html, text });
 *
 * // Non-blocking (fire-and-forget via ctx.waitUntil):
 * ctx.waitUntil(
 *   svc.sendEmail({ to, subject, html, text })
 *      .catch((err) => console.warn('Email failed:', err)),
 * );
 * ```
 */
export class EmailService {
  private readonly env:      EmailEnv;
  private readonly strategy: EmailSendStrategy;

  constructor(env: EmailEnv, strategy: EmailSendStrategy) {
    this.env      = env;
    this.strategy = strategy;
  }

  /**
   * Validates `payload` with the `EmailPayloadSchema` Zod schema, then
   * delegates to the configured send strategy.
   *
   * @throws {Error} If the payload fails Zod validation. The message includes
   *   the failing field path and Zod error message, e.g.
   *   `"Invalid email payload: to: Invalid email"`.
   *
   * @throws {Error} If the delivery strategy encounters a network error or
   *   returns a non-2xx response.  The error message includes the HTTP status
   *   code and response body.  Queue consumers should catch this and call
   *   `message.retry()` for transient failures.  HTTP handler callers that use
   *   `ctx.waitUntil` must wrap with `.catch((err) => console.warn(...))`.
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    let validated: EmailPayload;
    try {
      validated = EmailPayloadSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new EmailValidationError(
          err.issues.map((issue) => ({
            path:    issue.path.length > 0 ? issue.path.join('.') : 'root',
            message: issue.message,
          })),
        );
      }
      throw err;
    }

    await this.strategy.send(validated, this.env);
  }

  /**
   * Renders the waitlist welcome template for `to` and `segment`, then sends
   * via the configured strategy.
   *
   * **Validation:** `to` is validated as a well-formed email address by the
   * Zod schema inside `sendEmail()`.  An invalid address throws
   * `EmailValidationError` before any network call is made.  Callers that
   * pass the email directly from a Zod-validated request body (e.g. the
   * waitlist handler) do not need to re-validate here.
   *
   * Non-critical — callers should fire-and-forget with `.catch()`:
   * ```typescript
   * ctx.waitUntil(
   *   emailService.sendWaitlistConfirmation(email, segment)
   *     .catch((err) => console.error('[waitlist] email notification failed:', err)),
   * );
   * ```
   *
   * @param to      Recipient email address.
   * @param segment Signup segment (controls personalised copy), or null.
   */
  async sendWaitlistConfirmation(to: string, segment: string | null): Promise<void> {
    const { subject, html, text } = renderWaitlistWelcome(to, segment);
    return this.sendEmail({ to, subject, html, text });
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Creates an `EmailService` configured for the current Worker environment.
 *
 * Strategy selection (in priority order):
 * - **`EMAIL_WORKER` present** → `ServiceBindingStrategy` (routes through the
 *   `adblock-email` Worker via a Cloudflare service binding).
 * - **`SEND_EMAIL` present** → `CfEmailSendingStrategy` (delivers via the
 *   native CF Email Routing binding — no third-party API key required).
 * - **Neither present** → `NullEmailStrategy` (logs a warning, drops the email).
 *
 * @example
 * ```typescript
 * // In a Worker handler (FROM_EMAIL set in wrangler.toml [vars]):
 * const svc = createEmailService({
 *   FROM_EMAIL:   env.FROM_EMAIL ?? DEFAULT_FROM_EMAIL,
 *   SEND_EMAIL:   env.SEND_EMAIL,
 *   EMAIL_WORKER: env.EMAIL_WORKER,
 * });
 * ctx.waitUntil(
 *   svc.sendWaitlistConfirmation(email, segment)
 *      .catch((err) => console.warn('Email failed:', err)),
 * );
 * ```
 */
export function createEmailService(env: EmailEnv): EmailService {
  let strategy: EmailSendStrategy;
  if (env.EMAIL_WORKER) {
    strategy = new ServiceBindingStrategy();
  } else if (env.SEND_EMAIL) {
    strategy = new CfEmailSendingStrategy();
  } else {
    strategy = new NullEmailStrategy();
  }
  return new EmailService(env, strategy);
}


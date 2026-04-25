/**
 * src/services/emailService.ts — Transactional email for the Bloqr Worker
 *
 * Supports two delivery strategies — automatically selected at runtime:
 *
 *  1. **Service binding** (`EMAIL_WORKER`): Routes the request through the
 *     dedicated `adblock-email` Cloudflare Worker via a service binding.
 *     Preferred when the binding is present because it centralises delivery
 *     logic, retries, and logging in a single place.
 *
 *  2. **MailChannels direct** (fallback): POSTs directly to the MailChannels
 *     TX API (`https://api.mailchannels.net/tx/v1/send`).  Used when the
 *     service binding is absent (local dev without `npm run preview`, CI, etc.).
 *
 * Both strategies validate the payload with Zod before any network call.
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

import { Resend } from 'resend';
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
 * Minimum environment bindings required by the email service.
 *
 * `FROM_EMAIL` is the only strictly required field.  DKIM fields are optional
 * but must ALL be present together to enable DKIM signing; if any one is
 * missing the service sends without DKIM rather than failing.
 *
 * `EMAIL_WORKER` is the service binding to the `adblock-email` Cloudflare
 * Worker.  When present the service forwards the payload there instead of
 * calling MailChannels directly.  Wire it in `wrangler.toml`:
 *
 *   [[services]]
 *   binding = "EMAIL_WORKER"
 *   service = "adblock-email"
 *
 * ### Resend (preferred outbound provider)
 * When `RESEND_API_KEY` is present and `EMAIL_WORKER` is absent, the
 * `ResendStrategy` is selected automatically.  Add the domain to Resend
 * and set SPF/DKIM DNS records before enabling.
 *
 * Set as a Worker Secret:  `wrangler secret put RESEND_API_KEY`
 */
export interface EmailEnv {
  /** Sender address, e.g. `"Bloqr <hello@bloqr.app>"` */
  FROM_EMAIL: string;
  /**
   * Resend API key for outbound transactional email.
   * When present (and `EMAIL_WORKER` is absent), the `ResendStrategy` is used.
   * Set as a Worker Secret — never put this in `wrangler.toml [vars]`.
   * `wrangler secret put RESEND_API_KEY`
   */
  RESEND_API_KEY?: string;
  /** Domain used for DKIM signing (e.g. `"bloqr.dev"`). Must match the DNS TXT record. */
  DKIM_DOMAIN?: string;
  /** DKIM selector (e.g. `"mailchannels"`). Must match the DNS TXT record. */
  DKIM_SELECTOR?: string;
  /**
   * DKIM private key (base64-encoded RSA private key).
   * Set as a Worker Secret: `wrangler secret put DKIM_PRIVATE_KEY`
   * Never put this in `wrangler.toml [vars]` or source code.
   */
  DKIM_PRIVATE_KEY?: string;
  /**
   * Cloudflare service binding to the `adblock-email` Worker.
   * When present, email delivery is routed through this binding instead of
   * calling MailChannels directly.
   */
  EMAIL_WORKER?: Fetcher;
}

// ─── MailChannels internal types ─────────────────────────────────────────────

interface MailChannelsPersonalization {
  to:                [{ email: string }];
  dkim_domain?:      string;
  dkim_selector?:    string;
  dkim_private_key?: string;
}

interface MailChannelsBody {
  personalizations: MailChannelsPersonalization[];
  from:             { email: string };
  subject:          string;
  content:          { type: string; value: string }[];
}

// ─── Service binding payload ──────────────────────────────────────────────────

/**
 * JSON body sent to the `adblock-email` worker via the service binding.
 * The worker receives this and forwards to MailChannels (or any provider it
 * chooses), allowing the delivery implementation to be updated independently.
 */
interface EmailWorkerPayload {
  to:               string;
  from:             string;
  subject:          string;
  html:             string;
  text:             string;
  dkimDomain?:      string;
  dkimSelector?:    string;
  dkimPrivateKey?:  string;
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

    const hasDkim =
      env.DKIM_DOMAIN      != null &&
      env.DKIM_SELECTOR    != null &&
      env.DKIM_PRIVATE_KEY != null;

    const body: EmailWorkerPayload = {
      to:      payload.to,
      from:    env.FROM_EMAIL,
      subject: payload.subject,
      html:    payload.html,
      text:    payload.text,
      ...(hasDkim && {
        dkimDomain:     env.DKIM_DOMAIN,
        dkimSelector:   env.DKIM_SELECTOR,
        dkimPrivateKey: env.DKIM_PRIVATE_KEY,
      }),
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

/** URL of the MailChannels TX Send API. */
const MAILCHANNELS_API = 'https://api.mailchannels.net/tx/v1/send';

/**
 * Delivers directly to the MailChannels TX API.
 *
 * Used when the `EMAIL_WORKER` service binding is not present.  Network errors
 * and non-2xx responses are logged then re-thrown so queue consumers can call
 * `message.retry()`.  HTTP handler callers that use `ctx.waitUntil` should
 * wrap with `.catch((err) => console.warn('Email failed:', err))`.
 */
export class MailChannelsStrategy implements EmailSendStrategy {
  async send(payload: EmailPayload, env: EmailEnv): Promise<void> {
    const hasDkim =
      env.DKIM_DOMAIN      != null &&
      env.DKIM_SELECTOR    != null &&
      env.DKIM_PRIVATE_KEY != null;

    const personalization: MailChannelsPersonalization = {
      to: [{ email: payload.to }],
      ...(hasDkim && {
        dkim_domain:      env.DKIM_DOMAIN,
        dkim_selector:    env.DKIM_SELECTOR,
        dkim_private_key: env.DKIM_PRIVATE_KEY,
      }),
    };

    const body: MailChannelsBody = {
      personalizations: [personalization],
      from:             { email: env.FROM_EMAIL },
      subject:          payload.subject,
      content: [
        { type: 'text/plain', value: payload.text },
        { type: 'text/html',  value: payload.html  },
      ],
    };

    let res: Response;
    try {
      res = await fetch(MAILCHANNELS_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
    } catch (err) {
      // Re-throw so queue consumers can call message.retry().
      // HTTP handler callers must wrap with .catch().
      console.warn('MailChannels request failed:', err);
      throw err;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '(no body)');
      const msg  = `MailChannels send failed (${res.status}): ${text}`;
      console.warn(msg);
      throw new Error(msg);
    }
  }
}

// ─── ResendStrategy ───────────────────────────────────────────────────────────

/**
 * Delivers via the Resend HTTP API (https://resend.com).
 *
 * Preferred over `MailChannelsStrategy` when `env.RESEND_API_KEY` is present
 * and `env.EMAIL_WORKER` is absent.  Uses the official `resend` npm package
 * which is compatible with the Cloudflare Workers runtime (HTTP-only, no TCP).
 *
 * A Resend error is logged then re-thrown so queue consumers can call
 * `message.retry()` for transient failures.  HTTP handler callers that use
 * `ctx.waitUntil` should wrap with `.catch((err) => console.warn(...))`.
 *
 * Prerequisites:
 *   1. Add `bloqr.app` (or your sending domain) in the Resend dashboard.
 *   2. Add the SPF/DKIM DNS records Resend provides to your Cloudflare zone.
 *   3. Set `RESEND_API_KEY` as a Worker Secret:
 *        `wrangler secret put RESEND_API_KEY`
 */
export class ResendStrategy implements EmailSendStrategy {
  async send(payload: EmailPayload, env: EmailEnv): Promise<void> {
    if (!env.RESEND_API_KEY) {
      throw new Error('ResendStrategy requires RESEND_API_KEY');
    }

    const resend = new Resend(env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from:    env.FROM_EMAIL,
      to:      [payload.to],
      subject: payload.subject,
      html:    payload.html,
      text:    payload.text,
    });

    if (error) {
      const msg = `Resend send failed (${error.statusCode ?? 'unknown'}): ${error.message}`;
      console.warn(msg);
      throw new Error(msg);
    }
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
 * - **`RESEND_API_KEY` present** → `ResendStrategy` (calls the Resend HTTP API
 *   directly — compatible with CF Workers, preferred for outbound email).
 * - **Neither present** → `MailChannelsStrategy` (calls the MailChannels
 *   TX API directly — legacy fallback for CF Workers).
 *
 * @example
 * ```typescript
 * // In a Worker handler:
 * if (env.RESEND_API_KEY || env.FROM_EMAIL) {
 *   const svc = createEmailService(env);
 *   ctx.waitUntil(
 *     svc.sendWaitlistConfirmation(email, segment)
 *        .catch((err) => console.warn('Email failed:', err)),
 *   );
 * }
 * ```
 */
export function createEmailService(env: EmailEnv): EmailService {
  let strategy: EmailSendStrategy;
  if (env.EMAIL_WORKER) {
    strategy = new ServiceBindingStrategy();
  } else if (env.RESEND_API_KEY) {
    strategy = new ResendStrategy();
  } else {
    strategy = new MailChannelsStrategy();
  }
  return new EmailService(env, strategy);
}


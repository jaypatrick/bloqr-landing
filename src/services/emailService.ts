/**
 * src/services/emailService.ts — Transactional email via MailChannels
 *
 * Sends outbound email from the Cloudflare Worker using the MailChannels
 * Send API (https://api.mailchannels.net/tx/v1/send). This is the correct
 * outbound mechanism for CF Workers; Email Routing is inbound-only.
 *
 * Usage:
 *   const svc = createEmailService(env);
 *   await svc.sendEmail({ to, subject, html, text });
 */

import { z, ZodError } from 'zod';

// ─── Environment ──────────────────────────────────────────────────────────────

export interface EmailEnv {
  /** Sender address, e.g. "Bloqr <hello@bloqr.dev>" */
  FROM_EMAIL: string;
  /** Domain used for DKIM signing (e.g. "bloqr.dev"). Must match DNS TXT record. */
  DKIM_DOMAIN?: string;
  /** DKIM selector (e.g. "mailchannels"). */
  DKIM_SELECTOR?: string;
  /**
   * DKIM private key (base64-encoded RSA private key).
   * Set as a Worker Secret: wrangler secret put DKIM_PRIVATE_KEY
   */
  DKIM_PRIVATE_KEY?: string;
}

// ─── Payload schema ───────────────────────────────────────────────────────────

export const EmailPayloadSchema = z.object({
  to:      z.string().email(),
  subject: z.string().min(1),
  html:    z.string().min(1),
  text:    z.string().min(1),
});

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;

// ─── MailChannels types (internal) ───────────────────────────────────────────

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

// ─── Service ─────────────────────────────────────────────────────────────────

const MAILCHANNELS_API = 'https://api.mailchannels.net/tx/v1/send';

export class EmailService {
  private readonly env: EmailEnv;

  constructor(env: EmailEnv) {
    this.env = env;
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    // Validate at the trust boundary — unknown callers must pass a well-formed payload.
    let validated: EmailPayload;
    try {
      validated = EmailPayloadSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new Error(`Invalid email payload: ${err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw err;
    }

    const hasDkim =
      this.env.DKIM_DOMAIN != null &&
      this.env.DKIM_SELECTOR != null &&
      this.env.DKIM_PRIVATE_KEY != null;

    const personalization: MailChannelsPersonalization = {
      to: [{ email: validated.to }],
      ...(hasDkim && {
        dkim_domain:      this.env.DKIM_DOMAIN,
        dkim_selector:    this.env.DKIM_SELECTOR,
        dkim_private_key: this.env.DKIM_PRIVATE_KEY,
      }),
    };

    const body: MailChannelsBody = {
      personalizations: [personalization],
      from:             { email: this.env.FROM_EMAIL },
      subject:          validated.subject,
      content: [
        { type: 'text/plain', value: validated.text },
        { type: 'text/html',  value: validated.html  },
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
      // Network or CF-side failure — log and resolve without throwing so callers
      // using ctx.waitUntil don't see an unhandled rejection.
      console.warn('MailChannels request failed:', err);
      return;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '(no body)');
      console.warn(`MailChannels send failed (${res.status}):`, text);
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createEmailService(env: EmailEnv): EmailService {
  return new EmailService(env);
}

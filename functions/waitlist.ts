/**
 * Waitlist edge handler — POST /waitlist
 *
 * Accepts: { email: string, segment?: 'list-maker' | 'privacy-vendor' | 'individual' }
 * Writes to: Neon bloqr database (waitlist table)
 * Also creates/enriches an Apollo contact (fire-and-forget, non-blocking)
 *
 * Exported as plain functions so they can be imported by the Worker entry
 * point (src/worker.ts) without duplicating logic.
 */

import { neon } from '@neondatabase/serverless';
import { createEmailService } from '../src/services/emailService';
import { renderWaitlistWelcome } from '../src/email/templates/waitlistWelcome';
import type { EmailQueueMessage } from '../src/types/emailQueue';

export interface Env {
  DATABASE_URL: string;
  /** Apollo.io API key for contact enrichment. Optional — enrichment is fire-and-forget. */
  APOLLO_API_KEY?: string;
  FROM_EMAIL?: string;
  DKIM_DOMAIN?: string;
  DKIM_SELECTOR?: string;
  DKIM_PRIVATE_KEY?: string;
  /** Service binding to the `adblock-email` Cloudflare Worker (preferred over direct MailChannels). */
  EMAIL_WORKER?: Fetcher;
  /**
   * Cloudflare Queue producer for durable email delivery.
   * When present, confirmation emails are enqueued here instead of sent directly.
   * @see src/types/emailQueue.ts — EmailQueueMessage envelope
   */
  EMAIL_QUEUE?: Queue<EmailQueueMessage>;
  /**
   * Cloudflare Workflow binding for durable post-signup orchestration.
   * When present, this takes priority over EMAIL_QUEUE and direct send.
   * @see src/workflows/waitlistSignup.ts — WaitlistSignupWorkflow
   */
  WAITLIST_WORKFLOW?: Workflow;
  /**
   * Analytics Engine dataset for signup event tracking.
   * @see https://developers.cloudflare.com/analytics/analytics-engine/
   */
  ANALYTICS?: AnalyticsEngineDataset;
}

interface WaitlistBody {
  email?: string;
  segment?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SEGMENTS = new Set(['list-maker', 'privacy-vendor', 'individual']);

const SEGMENT_LABELS: Record<string, string> = {
  'list-maker':     'Waitlist: List Maker',
  'privacy-vendor': 'Waitlist: Privacy Vendor',
  'individual':     'Waitlist: Individual',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });

export function handleOptions(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Push a new signup to Apollo as a contact (fire-and-forget).
 * Failures here are logged but never surface to the user.
 */
async function pushToApollo(
  apiKey: string,
  email: string,
  segment: string | null,
): Promise<void> {
  const label = segment ? SEGMENT_LABELS[segment] ?? 'Waitlist' : 'Waitlist';

  try {
    const res = await fetch('https://api.apollo.io/v1/contacts', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key':     apiKey,
      },
      body: JSON.stringify({
        email,
        label_names: [label],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`Apollo contact push failed (${res.status}):`, text);
    }
  } catch (err) {
    console.warn('Apollo push error:', err);
  }
}

export async function handlePost(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Parse body
  let body: WaitlistBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email   = (body.email ?? '').trim().toLowerCase();
  const segment = body.segment ?? null;

  // Validate email
  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: 'A valid email address is required.' }, 400);
  }

  // Validate segment if provided
  if (segment && !VALID_SEGMENTS.has(segment)) {
    return json({ error: 'Invalid segment.' }, 400);
  }

  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  const sql = neon(env.DATABASE_URL);

  // Generate a message ID up-front so it can be stored in the waitlist row
  // and used as the queue/workflow message ID, enabling cross-referencing of
  // signup records with the email_sends delivery log.
  const emailMessageId = crypto.randomUUID();

  // Capture IP and referrer for analytics
  const ip       = request.headers.get('CF-Connecting-IP') ?? null;
  const referrer = request.headers.get('Referer') ?? null;

  try {
    await sql`
      INSERT INTO waitlist (email, segment, ip, referrer, email_message_id)
      VALUES (${email}, ${segment}, ${ip}, ${referrer}, ${emailMessageId})
    `;

    // ── Post-insert side effects ───────────────────────────────────────────────
    //
    // Priority chain for email delivery and Apollo enrichment:
    //
    //   1. WAITLIST_WORKFLOW present → create a durable Workflow instance that
    //      handles both email (via EMAIL_QUEUE) and Apollo enrichment with
    //      per-step retry policies and crash recovery.
    //
    //   2. EMAIL_QUEUE present (no Workflow) → publish to the Queue for durable
    //      delivery, and fire Apollo enrichment via ctx.waitUntil.
    //
    //   3. Neither binding active (e.g. local dev without npm run preview) →
    //      fall back to direct email send + direct Apollo via ctx.waitUntil.

    if (env.WAITLIST_WORKFLOW) {
      // Strategy 1: Durable Workflow orchestrates email + Apollo.
      // Both side effects run with per-step retry policies and crash recovery.
      // The HTTP response is already sent — no need to await the workflow.
      ctx.waitUntil(
        env.WAITLIST_WORKFLOW.create({
          // Use the email as the stable workflow ID so a retried HTTP
          // request does not create a second workflow instance for the
          // same signup.  If the DB UNIQUE constraint prevents duplicate
          // INSERTs, this code path will only ever run once per email.
          id:     `waitlist-${email}`,
          params: { email, segment, messageId: emailMessageId },
        }).catch((err: unknown) => console.warn('Workflow create failed:', err)),
      );
    } else {
      // Strategy 2/3: Queue or direct delivery + Apollo enrichment.

      if (env.EMAIL_QUEUE && env.FROM_EMAIL) {
        // Strategy 2: Publish to the durable Queue.
        // Use the pre-generated emailMessageId so the waitlist row and the
        // queue consumer's email_sends log share the same message ID.
        const message: EmailQueueMessage = {
          id:         emailMessageId,
          template:   'waitlistWelcome',
          to:         email,
          params:     { email, segment },
          enqueuedAt: new Date().toISOString(),
        };
        ctx.waitUntil(
          env.EMAIL_QUEUE.send(message)
            .catch((err: unknown) => console.warn('Email queue publish failed:', err)),
        );
      } else if (env.FROM_EMAIL) {
        // Strategy 3: Direct email send (fallback for local dev / no queue).
        const { subject, html, text } = renderWaitlistWelcome(email, segment);
        ctx.waitUntil(
          createEmailService({
            FROM_EMAIL:       env.FROM_EMAIL,
            DKIM_DOMAIN:      env.DKIM_DOMAIN,
            DKIM_SELECTOR:    env.DKIM_SELECTOR,
            DKIM_PRIVATE_KEY: env.DKIM_PRIVATE_KEY,
            EMAIL_WORKER:     env.EMAIL_WORKER,
          })
            .sendEmail({ to: email, subject, html, text })
            .catch((err: unknown) => console.warn('Waitlist email failed:', err)),
        );
      }

      // Apollo enrichment runs whenever the Workflow is not handling it.
      if (env.APOLLO_API_KEY) {
        ctx.waitUntil(pushToApollo(env.APOLLO_API_KEY, email, segment));
      }
    }

    // Analytics event — always track the signup regardless of email strategy.
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs:   ['waitlist_signup', email, segment ?? 'none'],
        doubles: [1],
        indexes: ['waitlist_signup'],
      });
    }

    return json({ success: true });
  } catch (err: unknown) {
    // Unique constraint violation = already registered
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('waitlist_email_unique')) {
      return json({ error: 'already_registered' }, 409);
    }
    console.error('Waitlist insert error:', msg);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}


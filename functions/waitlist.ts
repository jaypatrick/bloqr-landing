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
import { createEmailService, DEFAULT_FROM_EMAIL } from '../src/services/emailService';
import type { EmailQueueMessage } from '../src/types/emailQueue';
import { getPostHogServer } from '../src/lib/posthog-server';

export interface Env {
  DATABASE_URL: string;
  /** Apollo.io API key for contact enrichment. Optional — enrichment is fire-and-forget. */
  APOLLO_API_KEY?: string;
  FROM_EMAIL?: string;
  /** PostHog project token for server-side event tracking. Set as a CF secret. */
  POSTHOG_PROJECT_TOKEN?: string;
  /** PostHog ingest host (defaults to US cloud if unset). */
  POSTHOG_HOST?: string;
  /**
   * Cloudflare Email Workers `SEND_EMAIL` binding.
   * When present (and EMAIL_WORKER is absent), CfEmailSendingStrategy is used.
   */
  SEND_EMAIL?: {
    send(message: unknown): Promise<void>;
  };
  /** Service binding to the `adblock-email` Cloudflare Worker (preferred over direct send). */
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

/** Type guard for Neon / postgres-js errors that carry a `code` string. */
function isPgError(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof err.code === 'string'
  );
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
    // Try to write email_message_id so signups can be cross-referenced with
    // the email_sends D1 delivery log.  If the Neon migration hasn't been
    // applied yet (Postgres error 42703 = undefined_column), fall back to the
    // legacy INSERT schema so the endpoint keeps working during the rollout.
    try {
      await sql`
        INSERT INTO waitlist (email, segment, ip, referrer, email_message_id)
        VALUES (${email}, ${segment}, ${ip}, ${referrer}, ${emailMessageId})
      `;
    } catch (insertErr: unknown) {
      // Postgres error 42703 = undefined_column: the email_message_id migration
      // has not been applied yet.  Retry without the column so signups keep working.
      if (isPgError(insertErr) && insertErr.code === '42703') {
        await sql`
          INSERT INTO waitlist (email, segment, ip, referrer)
          VALUES (${email}, ${segment}, ${ip}, ${referrer})
        `;
      } else {
        throw insertErr; // re-throw (e.g. unique constraint 23505 → handled by outer catch)
      }
    }

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
        // FROM_EMAIL is required by the queue consumer — do not queue without it.
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
        // createEmailService() auto-selects the strategy (CfEmailSendingStrategy
        // when SEND_EMAIL is present, NullEmailStrategy otherwise).
        ctx.waitUntil(
          createEmailService({
            FROM_EMAIL:   env.FROM_EMAIL,
            SEND_EMAIL:   env.SEND_EMAIL,
            EMAIL_WORKER: env.EMAIL_WORKER,
          })
            .sendWaitlistConfirmation(email, segment)
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

    // PostHog server-side signup event — authoritative conversion tracking.
    if (env.POSTHOG_PROJECT_TOKEN) {
      const posthog = getPostHogServer(env.POSTHOG_PROJECT_TOKEN, env.POSTHOG_HOST);
      const sessionId = request.headers.get('X-PostHog-Session-Id') ?? undefined;
      posthog.capture({
        distinctId: emailMessageId,
        event: 'waitlist_signup_server',
        properties: {
          $session_id: sessionId,
          segment: segment ?? 'none',
          has_segment: segment !== null,
          referrer: referrer ?? undefined,
          source: 'worker',
        },
      });
      ctx.waitUntil(posthog.flush());
    }

    return json({ success: true });
  } catch (err: unknown) {
    // Unique constraint violation = already registered
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('waitlist_email_unique')) {
      // PostHog server-side duplicate detection event.
      if (env.POSTHOG_PROJECT_TOKEN) {
        const posthog = getPostHogServer(env.POSTHOG_PROJECT_TOKEN, env.POSTHOG_HOST);
        const sessionId = request.headers.get('X-PostHog-Session-Id') ?? undefined;
        posthog.capture({
          distinctId: crypto.randomUUID(),
          event: 'waitlist_signup_duplicate_server',
          properties: {
            $session_id: sessionId,
            segment: segment ?? 'none',
            source: 'worker',
          },
        });
        ctx.waitUntil(posthog.flush());
      }
      return json({ error: 'already_registered' }, 409);
    }
    console.error('Waitlist insert error:', msg);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}


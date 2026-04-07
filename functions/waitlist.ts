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

export interface Env {
  DATABASE_URL: string;
  APOLLO_API_KEY: string;
  BROWSER: Fetcher;
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

  // Capture IP and referrer for analytics
  const ip       = request.headers.get('CF-Connecting-IP') ?? null;
  const referrer = request.headers.get('Referer') ?? null;

  try {
    await sql`
      INSERT INTO waitlist (email, segment, ip, referrer)
      VALUES (${email}, ${segment}, ${ip}, ${referrer})
    `;

    // Fire Apollo sync in the background via waitUntil so it isn't cancelled
    // after the response is returned.
    if (env.APOLLO_API_KEY) {
      ctx.waitUntil(pushToApollo(env.APOLLO_API_KEY, email, segment));
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


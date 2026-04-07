/**
 * Cloudflare Pages Function — GET /waitlist/count
 *
 * Returns the number of waitlist signups, rounded down to the nearest 10,
 * so we show "40+" rather than revealing exact numbers.
 *
 * Cache-Control: public, max-age=300, stale-while-revalidate=3600
 */

import { neon } from '@neondatabase/serverless';

interface Env {
  DATABASE_URL: string;
}

const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  try {
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`SELECT COUNT(*)::int AS count FROM waitlist`;
    const exact: number = rows[0]?.count ?? 0;

    // Round down to nearest 10 to avoid revealing exact numbers
    const rounded = Math.floor(exact / 10) * 10;

    return json(
      { count: rounded },
      200,
      { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Waitlist count error:', msg);
    return json({ error: 'Something went wrong.' }, 500);
  }
};

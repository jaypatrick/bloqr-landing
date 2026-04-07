/**
 * Cloudflare Pages/Workers Function — POST /admin/config
 *
 * Updates a single key in site_config (Neon adblock-compiler DB),
 * then invalidates that key in the D1 cache so the next GET /config
 * fetches fresh data from Neon.
 *
 * Body:  { key: string, value: string }
 * Auth:  Authorization: Bearer <ADMIN_SECRET>
 *
 * IMPORTANT: Uses @neondatabase/serverless with DATABASE_URL pointing to
 * the adblock-compiler Neon project. NOT neondb.
 */

import { neon } from '@neondatabase/serverless';
import { invalidateD1Key } from '../config';

interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET: string;
  CONFIG_CACHE?: D1Database;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });

export const onRequestOptions = () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.ADMIN_SECRET || token !== env.ADMIN_SECRET) {
    return json({ error: 'Forbidden' }, 403);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { key?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const key = body.key?.trim();
  const { value } = body;
  if (!key) return json({ error: 'key is required' }, 400);
  if (value === undefined || typeof value !== 'string') return json({ error: 'value is required' }, 400);
  if (!env.DATABASE_URL) return json({ error: 'Service unavailable.' }, 503);

  // ── Write to Neon ─────────────────────────────────────────────────────────
  const sql = neon(env.DATABASE_URL);
  try {
    const rows = await sql`
      UPDATE site_config
      SET value = ${value}, updated_at = now()
      WHERE key   = ${key}
      RETURNING key
    `;
    if (!rows.length) return json({ error: `Unknown config key: ${key}` }, 404);

    // ── Invalidate D1 cache for this key (non-blocking) ─────────────────────
    if (env.CONFIG_CACHE) {
      void invalidateD1Key(env.CONFIG_CACHE, key).catch((e) =>
        console.warn('D1 invalidation failed:', e)
      );
    }

    return json({ success: true, key });
  } catch (err: unknown) {
    console.error('Admin config error:', err instanceof Error ? err.message : err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};

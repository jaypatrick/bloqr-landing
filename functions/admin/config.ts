/**
 * Cloudflare Pages/Workers Function — POST /admin/config
 *
 * Writes a single site_config row to Neon and invalidates the D1 cache for
 * that key so the next GET /config gets fresh data.
 *
 * Request body: { key: string; value: string }
 * Auth: requires `Authorization: Bearer <ADMIN_SECRET>` header
 */

import { neon } from '@neondatabase/serverless';
import { invalidateD1Key } from '../config';

interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET: string;
  CONFIG_CACHE: D1Database; // D1 binding
}

interface ConfigBody {
  key?: string;
  value?: string;
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
  // Auth check
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!env.ADMIN_SECRET || token !== env.ADMIN_SECRET) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  // Parse body
  let body: ConfigBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const key = (body.key ?? '').trim();
  const value = (body.value ?? '').trim();

  if (!key) {
    return json({ error: 'key is required.' }, 400);
  }
  if (value === '') {
    return json({ error: 'value is required.' }, 400);
  }

  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  const sql = neon(env.DATABASE_URL);

  try {
    await sql`
      INSERT INTO site_config (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;

    // Invalidate the D1 cache for this key (non-blocking)
    if (env.CONFIG_CACHE) {
      void invalidateD1Key(env.CONFIG_CACHE, key).catch((err) =>
        console.warn('D1 cache invalidation failed:', err),
      );
    }

    return json({ success: true, key, value });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Config update error:', msg);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};

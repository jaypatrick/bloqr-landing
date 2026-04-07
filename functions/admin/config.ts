/**
 * Cloudflare Pages/Workers Function — POST /admin/config
 *
 * Accepts: { key: string, value: string }
 * Updates the matching row in site_config (Neon adblock-compiler DB)
 * then invalidates the D1 cache for that key.
 *
 * Auth: Authorization: Bearer <ADMIN_SECRET>
 * DB: adblock-compiler Neon project (DATABASE_URL secret — NOT neondb)
 */

import { neon } from '@neondatabase/serverless';
import { invalidateD1Key } from '../config';

interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET: string;
  CONFIG_CACHE: D1Database;
}

interface AdminConfigBody {
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
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.ADMIN_SECRET || token !== env.ADMIN_SECRET) {
    return json({ error: 'Forbidden' }, 403);
  }

  let body: AdminConfigBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { key, value } = body;
  if (typeof key !== 'string' || !key.trim()) {
    return json({ error: 'key is required' }, 400);
  }
  if (value === undefined || typeof value !== 'string') {
    return json({ error: 'value is required' }, 400);
  }

  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  const sql = neon(env.DATABASE_URL);

  try {
    const result = await sql`
      UPDATE site_config
      SET value = ${value}, updated_at = now()
      WHERE key = ${key.trim()}
      RETURNING key
    `;

    if (result.length === 0) {
      return json({ error: `Unknown config key: ${key}` }, 404);
    }

    if (env.CONFIG_CACHE) {
      void invalidateD1Key(env.CONFIG_CACHE, key.trim()).catch((err) =>
        console.warn('D1 invalidation failed:', err)
      );
    }

    return json({ success: true, key: key.trim() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Admin config update error:', msg);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};

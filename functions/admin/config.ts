/**
 * functions/admin/config.ts — POST /admin/config handler
 *
 * Updates a single site_config row.
 * Auth: Better Auth session (primary) or legacy ADMIN_SECRET bearer token (fallback).
 *
 * Exported as plain functions for import by src/worker.ts.
 */

import { neon } from '@neondatabase/serverless';
import { getSession, isAdminUser } from '../../src/lib/auth';

export interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
}

interface ConfigUpdateBody {
  key?:   string;
  value?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });

/**
 * Dual-auth: Better Auth session first, legacy ADMIN_SECRET bearer as fallback.
 */
async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  // 1. Try Better Auth session (the new way)
  if (env.DATABASE_URL && env.BETTER_AUTH_SECRET) {
    try {
      const session = await getSession(request, env as Parameters<typeof getSession>[1]);
      if (session?.user && isAdminUser(session.user.name ?? '')) return true;
    } catch {
      // fall through to legacy check
    }
  }

  // 2. Fall back to legacy ADMIN_SECRET bearer token (backward compat)
  const authHeader = request.headers.get('Authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme === 'Bearer' && env.ADMIN_SECRET && token === env.ADMIN_SECRET) return true;

  return false;
}

export function handleOptions(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function handlePost(request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  let body: ConfigUpdateBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const key   = (body.key   ?? '').trim();
  const value = (body.value ?? '').trim();

  if (!key)   return json({ error: 'key is required.' }, 400);
  if (!value) return json({ error: 'value is required.' }, 400);

  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql`
      UPDATE site_config
      SET    value      = ${value},
             updated_at = now()
      WHERE  key        = ${key}
      RETURNING key
    `;
    if (!rows.length) {
      return json({ error: `No config row found for key: ${key}` }, 404);
    }
    return json({ success: true });
  } catch (err) {
    console.error('POST /admin/config error:', err);
    return json({ error: 'Failed to update config.' }, 500);
  }
}

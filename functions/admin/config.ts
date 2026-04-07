/**
 * functions/admin/config.ts — POST /admin/config
 *
 * Updates a single site_config row.
 * Requires: Authorization: Bearer <ADMIN_SECRET>
 *
 * Body: { key: string, value: string }
 * Returns: { success: true } or an error object.
 */

import { neon } from '@neondatabase/serverless';

interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET: string;
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

function isAuthorized(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');
  return scheme === 'Bearer' && token === env.ADMIN_SECRET;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ADMIN_SECRET) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }

  if (!isAuthorized(request, env)) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  let body: ConfigUpdateBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const key   = (body.key   ?? '').trim();
  const value = (body.value ?? '').trim();

  if (!key) {
    return json({ error: 'key is required.' }, 400);
  }
  if (!value) {
    return json({ error: 'value is required.' }, 400);
  }

  const sql = neon(env.DATABASE_URL);

  try {
    const result = await sql`
      UPDATE site_config
      SET    value      = ${value},
             updated_at = now()
      WHERE  key        = ${key}
    `;

    // The Neon tagged-template result exposes rowCount on the raw array object
    const rowCount = (result as { rowCount?: number | null }).rowCount ?? 0;
    if (rowCount === 0) {
      return json({ error: `No config row found for key: ${key}` }, 404);
    }

    return json({ success: true });
  } catch (err) {
    console.error('POST /admin/config error:', err);
    return json({ error: 'Failed to update config.' }, 500);
  }
};

export const onRequestOptions: PagesFunction = () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });

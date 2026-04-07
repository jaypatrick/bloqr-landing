/**
 * functions/config.ts — GET /config handler
 *
 * Returns all site_config rows as a flat JSON object { key: value }.
 * PUBLIC endpoint. Cached 5 min at the edge.
 *
 * Exported as plain functions for import by src/worker.ts.
 */

import { neon } from '@neondatabase/serverless';

export interface Env {
  DATABASE_URL: string;
}

interface SiteConfigRow {
  key:   string;
  value: string;
}

const json = (data: unknown, status = 200, extraHeaders?: Record<string, string>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });

export function handleOptions(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function handleGet(_request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503, { 'Cache-Control': 'no-store' });
  }

  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql<SiteConfigRow[]>`SELECT key, value FROM site_config ORDER BY key`;
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return json(config);
  } catch (err) {
    console.error('GET /config error:', err);
    return json({ error: 'Failed to load config.' }, 500, { 'Cache-Control': 'no-store' });
  }
}

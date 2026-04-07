/**
 * Cloudflare Pages/Workers Function — GET /config
 *
 * Returns all site_config rows as { [key]: value }.
 * Read path: D1 cache (< 5 min old) → Neon (on miss/stale) → write back to D1
 * Write invalidation: POST /admin/config calls invalidateD1Cache() after each update.
 *
 * Cache TTL: 5 minutes (300 seconds) in D1; CF edge cache also set to 5 min.
 *
 * DB: adblock-compiler Neon project (DATABASE_URL secret)
 */

import { neon } from '@neondatabase/serverless';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET: string;
  CONFIG_CACHE: D1Database;
}

interface CacheRow {
  key: string;
  value: string;
  cached_at: number;
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

async function readFromD1(db: D1Database): Promise<Record<string, string> | null> {
  const cutoff = Date.now() - CACHE_TTL_MS;
  const result = await db
    .prepare('SELECT key, value, cached_at FROM config_cache WHERE cached_at > ?')
    .bind(cutoff)
    .all<CacheRow>();

  if (!result.results || result.results.length === 0) return null;
  return Object.fromEntries(result.results.map((r) => [r.key, r.value]));
}

async function writeToD1(db: D1Database, config: Record<string, string>): Promise<void> {
  const now = Date.now();
  const stmts = Object.entries(config).map(([key, value]) =>
    db
      .prepare('INSERT INTO config_cache (key, value, cached_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, cached_at = excluded.cached_at')
      .bind(key, value, now)
  );
  await db.batch(stmts);
}

export async function invalidateD1Key(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM config_cache WHERE key = ?').bind(key).run();
}

export async function invalidateD1Cache(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM config_cache').run();
}

async function fetchFromNeon(databaseUrl: string): Promise<Record<string, string>> {
  const sql = neon(databaseUrl);
  const rows = await sql`SELECT key, value FROM site_config ORDER BY key`;
  return Object.fromEntries(rows.map((r) => [r.key as string, r.value as string]));
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (env.CONFIG_CACHE) {
    const cached = await readFromD1(env.CONFIG_CACHE);
    if (cached) {
      return json(cached, 200, {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'HIT',
      });
    }
  }

  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  const config = await fetchFromNeon(env.DATABASE_URL);

  if (env.CONFIG_CACHE) {
    void writeToD1(env.CONFIG_CACHE, config).catch((err) =>
      console.warn('D1 cache write failed:', err)
    );
  }

  return json(config, 200, {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    'X-Cache': 'MISS',
  });
};

export const onRequestOptions = () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

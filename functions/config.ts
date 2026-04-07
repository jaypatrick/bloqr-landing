/**
 * Cloudflare Pages/Workers Function — GET /config
 *
 * Returns all site_config rows from the Neon adblock-compiler DB as { [key]: value }.
 *
 * Read path (fastest to slowest):
 *   1. D1 cache — rows fresher than 5 minutes → near-zero latency
 *   2. Neon adblock-compiler DB — on miss → writes result back to D1 (non-blocking)
 *
 * Response headers:
 *   Cache-Control: public, max-age=300, stale-while-revalidate=600  (CF edge cache)
 *   X-Cache: HIT | MISS  (D1 cache status)
 *
 * IMPORTANT: Uses @neondatabase/serverless with DATABASE_URL pointing to the
 * adblock-compiler Neon project. NOT neondb.
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

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extra,
    },
  });

async function readFromD1(db: D1Database): Promise<Record<string, string> | null> {
  const cutoff = Date.now() - CACHE_TTL_MS;
  const { results } = await db
    .prepare('SELECT key, value FROM config_cache WHERE cached_at > ?')
    .bind(cutoff)
    .all<CacheRow>();
  if (!results?.length) return null;
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

async function writeToD1(db: D1Database, config: Record<string, string>): Promise<void> {
  const now = Date.now();
  await db.batch(
    Object.entries(config).map(([key, value]) =>
      db
        .prepare(
          `INSERT INTO config_cache (key, value, cached_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, cached_at = excluded.cached_at`
        )
        .bind(key, value, now)
    )
  );
}

/** Invalidate a single key in D1. Called by POST /admin/config after a successful Neon write. */
export async function invalidateD1Key(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM config_cache WHERE key = ?').bind(key).run();
}

/** Invalidate entire D1 cache. */
export async function invalidateD1Cache(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM config_cache').run();
}

async function fetchFromNeon(url: string): Promise<Record<string, string>> {
  const sql = neon(url);
  const rows = await sql`SELECT key, value FROM site_config ORDER BY key`;
  return Object.fromEntries(rows.map((r) => [r.key as string, r.value as string]));
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  // ── Layer 1: D1 cache ─────────────────────────────────────────────────────
  if (env.CONFIG_CACHE) {
    try {
      const cached = await readFromD1(env.CONFIG_CACHE);
      if (cached) {
        return json(cached, 200, {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        });
      }
    } catch (err) {
      console.warn('D1 read failed, falling through to Neon:', err);
    }
  }

  // ── Layer 2: Neon ─────────────────────────────────────────────────────────
  if (!env.DATABASE_URL) return json({ error: 'Service unavailable.' }, 503);

  let config: Record<string, string>;
  try {
    config = await fetchFromNeon(env.DATABASE_URL);
  } catch (err) {
    console.error('Neon fetch failed:', err);
    return json({ error: 'Service unavailable.' }, 503);
  }

  // ── Write-back to D1 (non-blocking — never fails the response) ───────────
  if (env.CONFIG_CACHE) {
    void writeToD1(env.CONFIG_CACHE, config).catch((e) =>
      console.warn('D1 write-back failed:', e)
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

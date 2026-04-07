/**
 * Cloudflare Pages/Workers Function — GET /config
 *
 * Returns all site_config rows from the Neon adblock-compiler DB as { [key]: value }.
 *
 * Read path (fastest to slowest):
 *   1. D1 cache — single JSON snapshot row fresher than 5 minutes → near-zero latency
 *   2. Neon adblock-compiler DB — on miss → writes full snapshot back to D1 (non-blocking)
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
  CONFIG_CACHE?: D1Database;
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

// D1 stores the entire config as a single JSON snapshot row under this key.
// A single-row approach avoids partial-cache HITs that would occur if individual
// key rows were invalidated one at a time while other rows remained in the cache.
const D1_SNAPSHOT_KEY = '__config__';

async function readFromD1(db: D1Database): Promise<Record<string, string> | null> {
  const cutoff = Date.now() - CACHE_TTL_MS;
  const row = await db
    .prepare('SELECT value FROM config_cache WHERE key = ? AND cached_at > ?')
    .bind(D1_SNAPSHOT_KEY, cutoff)
    .first<{ value: string }>();
  if (!row) return null;
  try {
    return JSON.parse(row.value) as Record<string, string>;
  } catch {
    return null;
  }
}

async function writeToD1(db: D1Database, config: Record<string, string>): Promise<void> {
  await db
    .prepare(
      `INSERT INTO config_cache (key, value, cached_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, cached_at = excluded.cached_at`
    )
    .bind(D1_SNAPSHOT_KEY, JSON.stringify(config), Date.now())
    .run();
}

/**
 * Invalidate the D1 snapshot. Called by POST /admin/config after a successful Neon write.
 * Always invalidates the full snapshot so the next GET /config repopulates all keys from Neon —
 * partial invalidation is not safe with snapshot storage.
 */
export async function invalidateD1Key(db: D1Database, _key: string): Promise<void> {
  await invalidateD1Cache(db);
}

/** Invalidate entire D1 cache. */
export async function invalidateD1Cache(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM config_cache WHERE key = ?').bind(D1_SNAPSHOT_KEY).run();
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

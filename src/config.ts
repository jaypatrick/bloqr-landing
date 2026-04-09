/**
 * Site configuration — single source of truth for all external URLs.
 *
 * ── URL Migration Guide ────────────────────────────────────────────────────────
 * Current (temporary): bloqr.jaysonknight.com subdomain scheme
 * Target (production):  bloqr.ai subdomain scheme
 *
 * To migrate to bloqr.ai when the domain is secured:
 *   1. Update the URL constants in EXTERNAL_URLS below (4 values)
 *   2. Update CANONICAL_DOMAIN below
 *   3. Update wrangler.toml [[routes]] pattern
 *   4. Run `npm run build && wrangler deploy`
 *   No other files need changes — all components consume from LINKS.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── External service URLs — edit these to change domains ──────────────────────
// These are the ONLY values that need updating for a domain migration.
const EXTERNAL_URLS = {
  /** Landing page / this site */
  landing: 'https://bloqr.jaysonknight.com',
  /** Angular app frontend */
  app:     'https://app.bloqr.jaysonknight.com',
  /** Backend API worker */
  api:     'https://api.bloqr.jaysonknight.com',
  /** mdBook documentation site */
  docs:    'https://docs.bloqr.jaysonknight.com',
} as const;

/**
 * The canonical production domain. Used by the Worker to set
 * `X-Robots-Tag: noindex, nofollow` on responses from non-canonical hosts.
 * Update to 'bloqr.ai' when the domain is live.
 */
export const CANONICAL_DOMAIN = 'bloqr.jaysonknight.com';

/**
 * SITE_URL — the canonical URL of this landing site.
 * Read from the SITE_URL build-time env var if set (Cloudflare Pages dashboard),
 * falls back to the value in EXTERNAL_URLS.
 */
export const SITE_URL: string =
  (import.meta.env.SITE_URL as string | undefined) ?? EXTERNAL_URLS.landing;

/**
 * LINKS — all external and internal URLs consumed by components and pages.
 * Internal routes (blog, changelog, etc.) stay as relative paths — never absolute.
 */
export const LINKS = {
  // ── External services (update via EXTERNAL_URLS above) ────────────────────
  app:    EXTERNAL_URLS.app,
  api:    EXTERNAL_URLS.api,
  docs:   EXTERNAL_URLS.docs,
  // ── Third-party ───────────────────────────────────────────────────────────
  github:  'https://github.com/jaypatrick/adblock-compiler',
  jsr:     'https://jsr.io/@jk-com/adblock-compiler',
  author:  'https://jaysonknight.com',
  // ── Internal routes ───────────────────────────────────────────────────────
  vpnMyths:      '/vpn-myths',
  whyNotPrivate: '/why-not-private',
  about:         '/about',
  blog:          '/blog',
  changelog:     '/changelog',
  rss:           '/rss.xml',
  privacy:       '/privacy',
  terms:         '/terms',
} as const;

/**
 * CHANGELOG_URL — raw URL for the upstream CHANGELOG.md.
 * Used by the changelog Content Layer loader at build time.
 * Centralised here so a repo move only requires a single edit.
 */
export const CHANGELOG_URL =
  'https://raw.githubusercontent.com/jaypatrick/adblock-compiler/main/CHANGELOG.md';

/**
 * Static metadata — used at build time for <title>, OG tags, and the manifest.
 */
export const META = {
  title:       'Bloqr — Internet Hygiene: Automated.',
  description: 'AI-powered adblock list management and real-time threat intelligence. Block ads, trackers, and malware at the network level — without routing your traffic anywhere.',
  ogImage:     '/og-image.png',
} as const;

// ── TypeScript types for site_config keys ─────────────────────────────────────
export type SiteConfigKey =
  | 'SITE_URL'
  | 'APP_URL'
  | 'DOCS_URL'
  | 'API_URL'
  | 'JSR_URL'
  | 'GITHUB_URL'
  | 'AUTHOR_URL'
  | 'PRODUCT_NAME'
  | 'PRODUCT_TAGLINE'
  | 'OG_IMAGE_PATH';

export type SiteConfig = Record<SiteConfigKey, string>;

/**
 * getConfig() — reads from Neon `site_config` at runtime when DATABASE_URL is
 * available, otherwise returns the EXTERNAL_URLS-derived fallbacks.
 * Static/prerendered pages use LINKS above at build time.
 *
 * **Callers MUST pass `databaseUrl` explicitly** — in Cloudflare Workers, env
 * vars are available only on the `env` binding (not `process.env`), so always
 * call `getConfig(env.DATABASE_URL)` from a Worker handler.
 *
 * The `process.env` fallback exists only for Node.js script contexts such as
 * the migration script (`scripts/migrate-site-config.ts`), where `process.env`
 * is available. It will never be set in a Worker invocation.
 */
export async function getConfig(databaseUrl?: string): Promise<SiteConfig> {
  const DEFAULTS: SiteConfig = {
    SITE_URL:        SITE_URL,
    APP_URL:         EXTERNAL_URLS.app,
    DOCS_URL:        EXTERNAL_URLS.docs,
    API_URL:         EXTERNAL_URLS.api,
    JSR_URL:         'https://jsr.io/@jk-com/adblock-compiler',
    GITHUB_URL:      'https://github.com/jaypatrick/adblock-compiler',
    AUTHOR_URL:      'https://jaysonknight.com',
    PRODUCT_NAME:    'Bloqr',
    PRODUCT_TAGLINE: 'Good Internet Hygiene. Automated.',
    OG_IMAGE_PATH:   '/og-image.png',
  };

  const url =
    databaseUrl ??
    (typeof process !== 'undefined' && typeof process.env !== 'undefined'
      ? process.env.DATABASE_URL
      : undefined);

  if (!url) return { ...DEFAULTS };

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    const rows = await sql<{ key: string; value: string }[]>`
      SELECT key, value FROM site_config
    `;
    const config = { ...DEFAULTS };
    for (const row of rows) {
      if (row.key in config) {
        (config as Record<string, string>)[row.key] = row.value;
      }
    }
    return config;
  } catch (err) {
    console.warn('getConfig: failed to read site_config from DB, using fallbacks.', err);
    return { ...DEFAULTS };
  }
}

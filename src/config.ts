/**
 * Site configuration
 *
 * Hardcoded values below serve as build-time fallbacks for static pages.
 *
 * ── site_config table pattern ────────────────────────────────────────────────
 * All URL and branding values are also stored in the `site_config` Neon DB table
 * (see scripts/migrate-site-config.ts for the migration).
 *
 * • To flip a URL without a code change:
 *   1. Update the relevant row in `site_config` via /admin/config
 *   2. Trigger a Cloudflare Pages redeploy — static pages use the module-level
 *      exports in this file, which are derived from the hardcoded defaults below.
 *
 * • Runtime edge functions (functions/*.ts) and other server-side callers can
 *   call getConfig() directly to read the live DB value without a redeploy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── TypeScript type for all site_config keys ──────────────────────────────────
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

// ── Hardcoded fallbacks (used at static build time or when DB is unavailable) ─
const DEFAULTS: SiteConfig = {
  SITE_URL:        import.meta.env.SITE_URL ?? 'https://adblock-compiler-landing.pages.dev',
  APP_URL:         'https://adblock-frontend.jayson-knight.workers.dev',
  DOCS_URL:        'https://adblock-compiler-docs.pages.dev',
  API_URL:         'https://adblock-compiler-docs.pages.dev',
  JSR_URL:         'https://jsr.io/@jk-com/adblock-compiler',
  GITHUB_URL:      'https://github.com/jaypatrick/adblock-compiler',
  AUTHOR_URL:      'https://jaysonknight.com',
  PRODUCT_NAME:    'Bloqr',
  PRODUCT_TAGLINE: 'Good Internet Hygiene. Automated.',
  OG_IMAGE_PATH:   '/og-image.png',
};

/**
 * getConfig() — async, reads from Neon `site_config` when DATABASE_URL is
 * available, otherwise returns the hardcoded fallbacks above.
 *
 * Use in Astro server endpoints or edge functions. For static pages the
 * module-level exports below (SITE_URL, LINKS, META) are used at build time.
 *
 * @param databaseUrl - Optional Neon connection string. Pass `env.DATABASE_URL`
 *                      from a Cloudflare Pages Function context.
 */
export async function getConfig(databaseUrl?: string): Promise<SiteConfig> {
  // Prefer the explicitly-passed URL (required in Cloudflare Workers / Pages Functions
  // where process.env is not available). The process.env fallback is only for Node.js
  // contexts (e.g., running the migration script locally with tsx/ts-node).
  const url =
    databaseUrl ??
    (typeof process !== 'undefined' && typeof process.env !== 'undefined'
      ? process.env.DATABASE_URL
      : undefined);

  if (!url) return { ...DEFAULTS };

  try {
    // Dynamic import keeps @neondatabase/serverless out of the static bundle
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

// ── Static build-time exports (unchanged — nothing else breaks) ───────────────

/** Canonical site URL */
export const SITE_URL = DEFAULTS.SITE_URL;

/** External URLs — one place to update if they ever change */
export const LINKS = {
  app:       DEFAULTS.APP_URL,
  github:    DEFAULTS.GITHUB_URL,
  docs:      DEFAULTS.DOCS_URL,
  api:       DEFAULTS.API_URL,
  jsr:       DEFAULTS.JSR_URL,
  author:    DEFAULTS.AUTHOR_URL,
  vpnMyths:  '/vpn-myths',
  about:     '/about',
  blog:      '/blog',
  changelog: '/changelog',
  rss:       '/rss.xml',
} as const;

/** Site metadata */
export const META = {
  title:       `${DEFAULTS.PRODUCT_NAME} — ${DEFAULTS.PRODUCT_TAGLINE}`,
  description: 'AI-powered filter list compilation and real-time threat intelligence. Block ads, trackers, and malware at the network level — without routing your traffic anywhere.',
  ogImage:     DEFAULTS.OG_IMAGE_PATH,
} as const;

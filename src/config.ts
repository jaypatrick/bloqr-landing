/**
 * Site configuration
 *
 * SITE_URL is read from environment at build time.
 * Set it in your Cloudflare Pages dashboard under Settings → Environment variables,
 * or in a local .env file during development.
 *
 * Once bloqr.ai is confirmed, update SITE_URL here or in the env variable.
 */
export const SITE_URL =
  import.meta.env.SITE_URL ?? 'https://adblock-compiler-landing.pages.dev'; // ← update to https://bloqr.ai when domain confirmed (update env var in CF Pages dashboard and redeploy)

/**
 * External URLs — managed here for build-time static pages.
 * To update for bloqr.ai launch: update these values (or the SITE_URL env var in
 * Cloudflare Pages dashboard) and trigger a redeploy.
 */
export const LINKS = {
  app:       'https://adblock-frontend.jayson-knight.workers.dev',
  github:    'https://github.com/jaypatrick/adblock-compiler',
  docs:      'https://adblock-compiler-docs.pages.dev',
  api:       'https://adblock-compiler-docs.pages.dev', // /api path not yet live — points to docs root
  jsr:       'https://jsr.io/@jk-com/adblock-compiler',
  author:    'https://jaysonknight.com',
  vpnMyths:  '/vpn-myths',
  about:     '/about',
  blog:      '/blog',
  changelog: '/changelog',
  rss:       '/rss.xml',
  privacy:   '/privacy',
  terms:     '/terms',
} as const;

/** Site metadata */
export const META = {
  title:       'Bloqr — Good Internet Hygiene. Automated.',
  description: 'AI-powered filter list compilation and real-time threat intelligence. Block ads, trackers, and malware at the network level — without routing your traffic anywhere.',
  ogImage:     '/og-image.png', // regenerate once bloqr.ai brand assets are confirmed
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
 * getConfig() — async, reads from Neon `site_config` when DATABASE_URL is
 * available, otherwise returns hardcoded fallbacks.
 *
 * Use in edge functions or SSR callers. Static pages use the module-level
 * SITE_URL / LINKS / META exports at build time.
 */
export async function getConfig(databaseUrl?: string): Promise<SiteConfig> {
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

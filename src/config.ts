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
  vpnMyths:     '/vpn-myths',
  whyNotPrivate: '/why-not-private',
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

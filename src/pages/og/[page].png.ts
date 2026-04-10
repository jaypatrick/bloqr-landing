/**
 * /og/[page].png — prerendered per-page Open Graph image for static pages.
 *
 * Generates a 1200×630 PNG with the page title and description baked in at
 * build time.  Covered pages: about, changelog, vpn-myths, why-not-private.
 *
 * Each page's <BaseHead> ogImage prop points to its corresponding URL:
 *   about          → /og/about.png
 *   changelog      → /og/changelog.png
 *   vpn-myths      → /og/vpn-myths.png
 *   why-not-private → /og/why-not-private.png
 */
export const prerender = true;

import type { APIRoute } from 'astro';
import { generateOgImage } from '../../lib/og-image';

const PAGES = {
  about: {
    title:       'About Bloqr — Why We Exist',
    description: 'Bloqr started as a two-minute automation that exposed a twenty-year gap at the center of consumer internet privacy.',
  },
  changelog: {
    title:       'Bloqr Changelog — What\'s New',
    description: 'A running log of every Bloqr release: features added, bugs fixed, things we broke and fixed again.',
  },
  'vpn-myths': {
    title:       'Consumer VPN Myths, Examined',
    description: 'A sourced, honest look at what consumer VPNs actually do — and don\'t do. Fingerprinting, DNS, jurisdiction, and more.',
  },
  'why-not-private': {
    title:       'Why Your Browsing Isn\'t as Private as You Think',
    description: 'HTTPS encrypts page content. Your DNS lookups still travel in plain text.',
  },
} as const;

export function getStaticPaths() {
  return Object.keys(PAGES).map((page) => ({ params: { page } }));
}

export const GET: APIRoute = async ({ params }) => {
  const key  = params.page as keyof typeof PAGES;
  const meta = PAGES[key];
  const buffer = await generateOgImage(meta.title, meta.description);
  return new Response(buffer, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

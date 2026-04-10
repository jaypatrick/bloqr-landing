/**
 * /og/[page].png — prerendered per-page Open Graph image for static pages.
 *
 * Generates a 1200×630 PNG with the page title and description baked in at
 * build time.  Covered pages: about, changelog, vpn-myths, why-not-private.
 *
 * Titles and descriptions are imported from `src/config.ts` (PAGE_META) —
 * the single source of truth shared with the page's own <BaseHead> props.
 *
 * Each page's <BaseHead> ogImage prop points to its corresponding URL:
 *   about           → /og/about.png
 *   changelog       → /og/changelog.png
 *   vpn-myths       → /og/vpn-myths.png
 *   why-not-private → /og/why-not-private.png
 */
export const prerender = true;

import type { APIRoute } from 'astro';
import { PAGE_META } from '../../config';
import { generateOgImage } from '../../lib/og-image';

export function getStaticPaths() {
  return Object.keys(PAGE_META).map((page) => ({ params: { page } }));
}

export const GET: APIRoute = async ({ params }) => {
  const page = params.page;

  if (typeof page !== 'string' || !(page in PAGE_META)) {
    return new Response('Not Found', { status: 404 });
  }

  const meta   = PAGE_META[page as keyof typeof PAGE_META];
  const buffer = await generateOgImage(meta.title, meta.description);
  return new Response(buffer, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

/**
 * /og/blog/[slug].png — prerendered per-post Open Graph image.
 *
 * Generates a 1200×630 PNG with the post title and description baked in at
 * build time using the Bloqr brand template.  The resulting static PNG is
 * served from the Cloudflare ASSETS binding alongside the rest of the site.
 *
 * Referenced in blog/[slug].astro as the OG image fallback (used when a
 * post has no `image` frontmatter field).
 */
export const prerender = true;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../../lib/og-image';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title:       post.data.title,
      description: post.data.description,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const buffer = await generateOgImage(props.title, props.description);
  return new Response(buffer, {
    headers: {
      'Content-Type':  'image/png',
      // 1 year — slug URLs are stable and post titles rarely change;
      // `immutable` is intentionally omitted so title edits eventually propagate.
      'Cache-Control': 'public, max-age=31536000',
    },
  });
};

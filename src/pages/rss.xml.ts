import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_URL, META } from '../config';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title:       'Bloqr — Blog',
    description: META.description,
    site:        context.site ?? SITE_URL,
    items: posts.map((post) => ({
      title:       post.data.title,
      description: post.data.description,
      pubDate:     post.data.pubDate,
      link:        `/blog/${post.slug}/`,
      categories:  [post.data.category, ...post.data.tags],
      author:      post.data.author,
    })),
    customData: `<language>en-us</language>`,
  });
}

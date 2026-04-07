/**
 * src/lib/blog-post-schema.ts
 *
 * Shared Zod validation schema for blog posts.
 * Used by the admin API and the sync-blog-from-db script.
 * Compatible with the Astro content collection schema in src/content/config.ts.
 */

import { z } from 'zod';

export const BlogPostSchema = z.object({
  slug:        z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title:       z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  content:     z.string().min(1),
  pubDate:     z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author:      z.string().default('Jayson Knight'),
  category:    z.enum(['education', 'industry', 'release']),
  tags:        z.array(z.string()).default([]),
  draft:       z.boolean().default(true),
  image:       z.string().optional(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

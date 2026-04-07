import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author:      z.string().default('Bloqr Team'),
    category:    z.enum(['education', 'industry', 'release']),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
    image:       z.string().optional(),
  }),
});

export const collections = { blog };

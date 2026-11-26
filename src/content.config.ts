import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const HUBS = ['everest-base-camp-trek', 'trekking-basics', 'altitude-sickness', 'trekking-food', 'everest-trekking-pictures'] as const;

const posts = defineCollection({
  // one folder per legacy slug: src/content/posts/<slug>/index.md → /<slug>/
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date(),
      type: z.enum(['post', 'page']),
      layout: z.enum(['article', 'gallery']),
      hub: z.enum(HUBS),
      categories: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      // banner above the article: archived = "written in 20xx", medical = stronger health notice, none = off
      notice: z.enum(['archived', 'medical', 'none']).default('archived'),
      cover: image().optional(),
      legacy: z.object({ wpId: z.number() }),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };

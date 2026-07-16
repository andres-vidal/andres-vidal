import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // One directory per post; one file per language (en.mdx, es.mdx, …).
  // Language and translation key are derived from the path, not frontmatter.
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

export const collections = { blog };

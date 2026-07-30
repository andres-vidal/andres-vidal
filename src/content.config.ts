import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

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
    // Cover art shown beside the title, e.g. a package's hex logo.
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    // Image for link previews. Wants opaque pixels at about 1200x630; the
    // cover itself is usually the wrong shape and often has transparency,
    // which the social networks fill with black.
    ogImage: z.string().optional(),
    glossary: z
      .record(
        z.string(),
        z.object({
          abbr: z.string().optional(),
          full: z.string().optional(),
          def: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { blog };

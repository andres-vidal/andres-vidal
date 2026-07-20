import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import rehypeCitation from "rehype-citation";
import rehypeCitationBacklinks from "./src/plugins/rehype-citation-backlinks.mjs";
import rehypeGlossary from "./src/plugins/rehype-glossary.mjs";
import rehypeFootnotes from "./src/plugins/rehype-footnotes.mjs";

export default defineConfig({
  site: "https://andresvidal.dev",
  // Astro's default markdown processor (Shiki, GFM, smartypants), extended with
  // BibTeX/CSL citations (rehype-citation) and back-links to their in-text
  // occurrences, plus a matching glossary. MDX inherits it.
  markdown: {
    processor: unified({
      rehypePlugins: [
        [
          rehypeCitation,
          {
            bibliography: "./src/data/references.bib",
            linkCitations: true,
            csl: "apa",
          },
        ],
        rehypeCitationBacklinks,
        rehypeGlossary,
        rehypeFootnotes,
      ],
    }),
  },
  integrations: [mdx(), sitemap()],
});

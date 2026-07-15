import { getCollection, type CollectionEntry } from "astro:content";
import { isPublished } from "./posts";

export interface SeriesNav {
  label: string;
  posts: CollectionEntry<"blog">[];
  index: number;
  total: number;
  prev: CollectionEntry<"blog"> | null;
  next: CollectionEntry<"blog"> | null;
}

// Returns the series-navigation context for a post, or null if it is not part
// of a (multi-post) series. The series and its order live in each post's own
// frontmatter (`series` + `seriesOrder`); membership is derived at build time,
// so there is no separate manifest to keep in sync. Only visible posts are
// listed, so prev/next never point to a page that was not generated.
export async function getSeriesNav(
  post: CollectionEntry<"blog">,
): Promise<SeriesNav | null> {
  const label = post.data.series;
  if (!label) return null;

  const ordered = (await getCollection("blog"))
    .filter(isPublished)
    .filter((p) => p.data.series === label && p.data.lang === post.data.lang)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));

  const index = ordered.findIndex((p) => p.id === post.id);
  if (index === -1 || ordered.length < 2) return null;

  return {
    label,
    posts: ordered,
    index,
    total: ordered.length,
    prev: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
  };
}

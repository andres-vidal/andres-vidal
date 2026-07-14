import { getCollection, type CollectionEntry } from "astro:content";
import { series as manifest } from "../data/series";

export interface SeriesNav {
  label: string;
  posts: CollectionEntry<"blog">[];
  index: number;
  total: number;
  prev: CollectionEntry<"blog"> | null;
  next: CollectionEntry<"blog"> | null;
}

// Returns the series-navigation context for a post, or null if it is not part
// of a (multi-post) series. Draft posts are skipped, so prev/next only ever
// point to pages that actually exist.
export async function getSeriesNav(
  post: CollectionEntry<"blog">
): Promise<SeriesNav | null> {
  const found = Object.values(manifest).find((s) => s.posts.includes(post.id));
  if (!found) return null;

  const all = await getCollection("blog");
  const byId = new Map(all.map((p) => [p.id, p]));
  const published = new Set(all.filter((p) => !p.data.draft).map((p) => p.id));

  const ordered = found.posts
    .filter((id) => published.has(id))
    .map((id) => byId.get(id))
    .filter((p): p is CollectionEntry<"blog"> => Boolean(p));

  const index = ordered.findIndex((p) => p.id === post.id);
  if (index === -1 || ordered.length < 2) return null;

  return {
    label: found.label,
    posts: ordered,
    index,
    total: ordered.length,
    prev: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
  };
}

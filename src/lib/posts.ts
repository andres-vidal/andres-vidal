import { getCollection, type CollectionEntry } from "astro:content";

// Drafts are visible while developing so they can be previewed and edited,
// but excluded from production builds until they are explicitly published.
export const isPublished = ({ data }: CollectionEntry<"blog">) =>
  import.meta.env.DEV || !data.draft;

export const getVisiblePosts = () => getCollection("blog", isPublished);

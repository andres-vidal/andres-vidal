import { getCollection, type CollectionEntry } from "astro:content";

// Drafts are visible while developing so they can be previewed and edited,
// but excluded from production builds until they are explicitly published.
export const isPublished = ({ data }: CollectionEntry<"blog">) =>
  import.meta.env.DEV || !data.draft;

export const getVisiblePosts = () => getCollection("blog", isPublished);

// --- Translations -----------------------------------------------------------
// Each post is a directory, one file per language: <slug>/<lang>.mdx. Both the
// language and the shared translation key are derived from that path, so there
// is nothing to declare in frontmatter and nothing to keep in sync. A post with
// only <slug>/en.mdx has no translations: English at /blog/<slug>/, no switcher.

const LANG_ORDER: Record<string, number> = { en: 0, es: 1, pt: 2 };

export type PostLang = "en" | "es" | "pt";
export interface PostTranslation {
  lang: PostLang;
  path: string;
}

// The post's language, from the file name (<slug>/en → "en"). A flat id with no
// directory (legacy) is treated as English.
export const postLang = (p: CollectionEntry<"blog">): PostLang => {
  const last = p.id.split("/").pop() ?? "en";
  return (["en", "es", "pt"].includes(last) ? last : "en") as PostLang;
};

// The stable id shared across a post's translations: the directory part of the
// id (<slug>/en → "<slug>"). A flat id keys on itself.
export const postKey = (p: CollectionEntry<"blog">) => {
  const parts = p.id.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : p.id;
};

// URL for a given language + key. English lives at the root; others under /<lang>/.
export const postPath = (lang: string, key: string) =>
  lang === "en" ? `/blog/${key}/` : `/${lang}/blog/${key}/`;

// All published language versions of a post, ordered en → es → pt. Length 1
// means "no translations" (the caller renders no switcher / no hreflang).
export async function getTranslations(
  post: CollectionEntry<"blog">,
): Promise<PostTranslation[]> {
  const key = postKey(post);
  return (await getCollection("blog", isPublished))
    .filter((p) => postKey(p) === key)
    .map((p) => ({ lang: postLang(p), path: postPath(postLang(p), key) }))
    .sort((a, b) => (LANG_ORDER[a.lang] ?? 9) - (LANG_ORDER[b.lang] ?? 9));
}

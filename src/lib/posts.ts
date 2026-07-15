import { getCollection, type CollectionEntry } from "astro:content";

// Drafts are visible while developing so they can be previewed and edited,
// but excluded from production builds until they are explicitly published.
export const isPublished = ({ data }: CollectionEntry<"blog">) =>
  import.meta.env.DEV || !data.draft;

export const getVisiblePosts = () => getCollection("blog", isPublished);

// --- Translations -----------------------------------------------------------
// A post declares its language (`lang`, default "en") and, when it is one of
// several language versions of the same article, a shared `translationKey`.
// Posts with no translations behave exactly as before: English at /blog/<slug>/
// with no language switcher.

const LANG_ORDER: Record<string, number> = { en: 0, es: 1, pt: 2 };

export type PostLang = "en" | "es" | "pt";
export interface PostTranslation {
  lang: PostLang;
  path: string;
}

// The stable id shared across a post's translations. Defaults to the file id,
// so untranslated English posts key on their own slug.
export const postKey = (p: CollectionEntry<"blog">) =>
  p.data.translationKey ?? p.id;

// URL for a given language + key. English lives at the root; others under /<lang>/.
export const postPath = (lang: string, key: string) =>
  lang === "en" ? `/blog/${key}/` : `/${lang}/blog/${key}/`;

// All published language versions of a post, ordered en → es → pt. Length 1
// means "no translations" (the caller renders no switcher / no hreflang).
export async function getTranslations(
  post: CollectionEntry<"blog">
): Promise<PostTranslation[]> {
  const key = postKey(post);
  return (await getCollection("blog", isPublished))
    .filter((p) => postKey(p) === key)
    .map((p) => ({ lang: p.data.lang, path: postPath(p.data.lang, key) }))
    .sort((a, b) => (LANG_ORDER[a.lang] ?? 9) - (LANG_ORDER[b.lang] ?? 9));
}

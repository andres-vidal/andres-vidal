// Companion to GFM footnotes. remark-gfm turns [^label] / [^label]: … into an
// in-text <sup> reference and a <section data-footnotes> at the end of the body.
// This plugin, at build, pulls that section out of the content flow and stashes
// it in the post's frontmatter, so the layout can place it in the backmatter
// alongside the glossary and references instead of dangling after the prose.
// The reference links stay in place; a small client script (see BlogPost) turns
// them into popovers whose content is sourced from this same section, so the
// notes have one home and still work with no JS (the number links to it).
import { toHtml } from "hast-util-to-html";
import { BACK } from "./rehype-citation-backlinks.mjs";

export default function rehypeFootnotes() {
  return (tree, file) => {
    const classOf = (n) => {
      const c = n.properties && n.properties.className;
      return Array.isArray(c) ? c : [];
    };
    let section = null;
    const visit = (n, fn) => {
      fn(n);
      if (n.children) for (const c of n.children) visit(c, fn);
    };
    visit(tree, (n) => {
      if (
        n.type === "element" &&
        n.tagName === "section" &&
        classOf(n).includes("footnotes")
      ) {
        section = n;
      }
    });
    if (!section) return;

    // GFM writes its back-references with a bare U+21A9, which iOS renders as
    // an emoji sticker. Pin them to the text glyph, as the citation and
    // glossary back-links already are.
    visit(section, (n) => {
      if (n.type !== "text") return;
      n.value = n.value.replace(/↩(?!︎)/g, BACK);
    });

    const astro = ((file.data ||= {}).astro ||= {});
    (astro.frontmatter ||= {}).footnotesHtml = toHtml(section);
    removeWhere(tree, (n) => n === section);
  };
}

function removeWhere(node, pred) {
  if (!node.children) return;
  node.children = node.children.filter((c) => !pred(c));
  for (const c of node.children) removeWhere(c, pred);
}

// Glossary, mirroring the citation system, rendered by the layout (not inline).
// Authoring: mark every occurrence of a term inline with
// <abbr data-term="KEY">visible text</abbr>. This plugin, at build:
//   - turns each marker into <a class="gloss" id="term-KEY-N" href="#gloss-KEY">
//     <abbr title="full term">text</abbr></a>, recording every occurrence;
//   - builds the glossary from the terms actually used (each entry with
//     back-links: a single ↩, or lettered a, b, c… when used more than once),
//     serializes it to HTML, and stashes it in the post's frontmatter for the
//     layout to place after the article body.
import { toHtml } from "hast-util-to-html";
import { glossary } from "../data/glossary.js";

export default function rehypeGlossary() {
  return (tree, file) => {
    const seen = {};
    const instances = {};
    const terms = {}; // resolved (global + per-article override) for used keys

    // Per-article overrides from the post's frontmatter merge over the global
    // registry, key by key: setting only `def` keeps the global `full`/`abbr`,
    // and a key present only here is an article-only term.
    const local =
      (file.data &&
        file.data.astro &&
        file.data.astro.frontmatter &&
        file.data.astro.frontmatter.glossary) ||
      {};
    const resolve = (key) => {
      const g = glossary[key];
      const l = local[key];
      if (!g && !l) return null;
      return { ...(g || {}), ...(l || {}) };
    };

    const isJsx = (n) =>
      n.type === "mdxJsxTextElement" || n.type === "mdxJsxFlowElement";
    const nameOf = (n) =>
      n.type === "element" ? n.tagName : isJsx(n) ? n.name : null;
    const getAttr = (n, name) => {
      if (isJsx(n)) {
        const a = (n.attributes || []).find(
          (a) => a.type === "mdxJsxAttribute" && a.name === name,
        );
        return a ? (typeof a.value === "string" ? a.value : "") : undefined;
      }
      return undefined;
    };
    const visit = (n, fn) => {
      fn(n);
      if (n.children) for (const c of n.children) visit(c, fn);
    };

    // Turn inline markers into linked, id'd occurrences.
    visit(tree, (node) => {
      if (nameOf(node) !== "abbr") return;
      const key = getAttr(node, "data-term");
      const term = key && resolve(key);
      if (!term) return;
      terms[key] = term;
      const i = seen[key] ?? 0;
      seen[key] = i + 1;
      const id = `term-${key}-${i}`;
      (instances[key] ||= []).push(id);
      const label = node.children;
      node.type = "element";
      node.tagName = "a";
      node.name = undefined;
      node.attributes = undefined;
      node.properties = { className: ["gloss"], id, href: `#gloss-${key}` };
      node.children = [
        {
          type: "element",
          tagName: "abbr",
          properties: { title: term.full },
          children: label,
        },
      ];
    });

    const keys = Object.keys(instances).sort((a, b) =>
      terms[a].abbr.localeCompare(terms[b].abbr),
    );
    if (keys.length === 0) return;

    const dl = {
      type: "element",
      tagName: "dl",
      properties: {},
      children: keys.map((key) => entry(key, terms[key], instances[key])),
    };
    const astro = ((file.data ||= {}).astro ||= {});
    (astro.frontmatter ||= {}).glossaryHtml = toHtml(dl);
  };
}

function entry(key, term, ids) {
  const dd = [{ type: "text", value: `${term.full}. ${term.def} ` }];
  if (ids.length === 1) {
    dd.push(backLink(ids[0], "↩", "Back to the term in text"));
  } else {
    dd.push({ type: "text", value: "↩ " });
    ids.forEach((id, i) => {
      if (i > 0) dd.push({ type: "text", value: " " });
      dd.push(
        backLink(
          id,
          String.fromCharCode(97 + i),
          `Back to occurrence ${i + 1} in text`,
        ),
      );
    });
  }
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["gloss-entry"], id: `gloss-${key}` },
    children: [
      {
        type: "element",
        tagName: "dt",
        properties: {},
        children: [{ type: "text", value: term.abbr }],
      },
      { type: "element", tagName: "dd", properties: {}, children: dd },
    ],
  };
}

function backLink(targetId, label, aria) {
  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["gloss-back"],
      href: `#${targetId}`,
      ariaLabel: aria,
    },
    children: [{ type: "text", value: label }],
  };
}

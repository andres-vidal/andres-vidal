// Companion to rehype-citation. Runs after it, on its output:
//   - adds back-links from each bibliography entry to the in-text citations
//     that reference it (single ↩, or lettered a, b, c… when cited more than
//     once), closing the loop rehype-citation only links forward;
//   - makes the DOIs/URLs it renders as bare text clickable;
//   - extracts the finished bibliography, stashes it in the post's frontmatter
//     for the layout to place after the article body, and removes it from the
//     content flow.
import { toHtml } from "hast-util-to-html";

export default function rehypeCitationBacklinks() {
  return (tree, file) => {
    const instances = {}; // key -> [citation span ids in document order]

    const visit = (node, fn) => {
      fn(node);
      if (node.children) for (const child of node.children) visit(child, fn);
    };

    visit(tree, (node) => {
      if (node.type !== "element") return;
      const id = node.properties && node.properties.id;
      if (typeof id !== "string") return;
      const m = id.match(/^citation--(.+)--\d+$/);
      if (m) (instances[m[1]] ||= []).push(id);
    });

    let bib = null;
    visit(tree, (node) => {
      if (node.type !== "element") return;
      const id = node.properties && node.properties.id;
      if (typeof id !== "string") return;
      const m = id.match(/^bib-(.+)$/);
      if (!m) return;
      linkifyUrls(node);
      const ids = instances[m[1]] || [];
      if (ids.length === 0) return;
      node.children.push({ type: "text", value: " " });
      if (ids.length === 1) {
        node.children.push(
          backLink(ids[0], "↩", "Back to the citation in text"),
        );
      } else {
        node.children.push({ type: "text", value: "↩ " });
        ids.forEach((cid, i) => {
          if (i > 0) node.children.push({ type: "text", value: " " });
          node.children.push(
            backLink(
              cid,
              String.fromCharCode(97 + i),
              `Back to citation ${i + 1} in text`,
            ),
          );
        });
      }
    });

    // Pull the bibliography out of the content and hand it to the layout.
    const classOf = (n) => {
      const c = n.properties && n.properties.className;
      return Array.isArray(c) ? c : [];
    };
    visit(tree, (node) => {
      if (node.type === "element" && classOf(node).includes("csl-bib-body")) {
        bib = node;
      }
    });
    if (bib) {
      const astro = ((file.data ||= {}).astro ||= {});
      (astro.frontmatter ||= {}).bibliographyHtml = toHtml(bib);
      removeWhere(
        tree,
        (n) => n.type === "element" && n.properties?.id === "refs",
      );
    }
  };
}

function removeWhere(node, pred) {
  if (!node.children) return;
  node.children = node.children.filter((c) => !pred(c));
  for (const c of node.children) removeWhere(c, pred);
}

function linkifyUrls(node) {
  if (!node.children) return;
  const out = [];
  for (const child of node.children) {
    if (child.type === "text" && /https?:\/\//.test(child.value)) {
      for (const part of child.value.split(/(https?:\/\/[^\s]+)/)) {
        if (!part) continue;
        out.push(
          /^https?:\/\//.test(part)
            ? {
                type: "element",
                tagName: "a",
                properties: { href: part },
                children: [{ type: "text", value: part }],
              }
            : { type: "text", value: part },
        );
      }
    } else {
      linkifyUrls(child);
      out.push(child);
    }
  }
  node.children = out;
}

function backLink(targetId, label, aria) {
  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["cite-back"],
      href: `#${targetId}`,
      ariaLabel: aria,
    },
    children: [{ type: "text", value: label }],
  };
}

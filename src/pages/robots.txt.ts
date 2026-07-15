import type { APIRoute } from "astro";

// Served at /robots.txt. The sitemap URL is derived from `site` in
// astro.config, so the domain lives in exactly one place.
export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL("sitemap-index.xml", site).href}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

export const CLOUDFLARE_BEACON_TOKEN = "752fbcad646e4703a96b59684a21d97b";

// The stylesheets live in public/ so they ship unhashed, and the host serves
// them with max-age=600. Bump this whenever one of them changes: the query
// makes the URL new, so a deploy is never masked by a cached stylesheet.
export const ASSET_VERSION = "9";

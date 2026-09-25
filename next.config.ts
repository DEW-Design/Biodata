import type { NextConfig } from "next";

// GitHub Pages build (.github/workflows/nextjs.yml sets PAGES_BASE_PATH, e.g. "/Biodata"): a fully
// static export served from a sub-path. Every other build (next dev, a normal next build) is
// unaffected - no export, no base path.
const pagesBasePath = process.env.PAGES_BASE_PATH;
const isPagesBuild = pagesBasePath !== undefined;
const basePath = pagesBasePath ?? "";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: false,
    browserToTerminal: false,
  },
  // Read by lib/base-path.ts - Next only prefixes next/link, router and its own assets with
  // basePath; plain <img src> strings and react-aria links need it added by hand.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isPagesBuild && {
    output: "export",
    basePath,
    // GitHub Pages serves /foo/ from foo/index.html and redirects /foo to /foo/, so both URL
    // forms work. Without this, only /foo (foo.html) resolves and /foo/ is a 404.
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;

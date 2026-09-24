import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
// Change this if you rename the repo
const repoName = "dew-design-system";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: false,
    browserToTerminal: false,
  },

  // Produces a static ./out folder instead of a server build
  output: "export",

  // GitHub Pages serves this repo at /dew-design-system/, not at the domain root
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : "",

  // GitHub Pages has no image-optimization server
  images: {
    unoptimized: true,
  },

  // GitHub Pages needs /about/index.html, not /about.html, for clean routes
  trailingSlash: true,
};

export default nextConfig;

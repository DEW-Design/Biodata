// The site's base path - "" everywhere except the GitHub Pages build, where it's the repo sub-path
// (e.g. "/Biodata"). Set via next.config.ts.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes a root-relative path to a file in public/ with the base path. Next does this for
 *  next/link and next/image, but not for a plain `<img src>` or a string handed to a library. */
export function assetPath(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}

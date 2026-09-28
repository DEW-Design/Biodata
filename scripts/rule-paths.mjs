// How Claude Code decides that a `.claude/rules/*.md` file's `paths` cover a file, shared by the rules hook
// (rules-for-tools.mjs) and the benchmark (bench-rules.mjs) so both predict exactly what the loader does.
//
// Measured, not assumed (context/decisions/2026-09-29-35): throwaway probe rules read by fresh subagents,
// 14 observations, all explained by this model. A trailing `/**` is dropped, then gitignore rules apply:
//   - a pattern with no `/` in it (`page.tsx`, `components` from `components/**`) matches a file or folder
//     of that name at ANY depth: `components/**` also covers `app/(docs)/components/...`;
//   - a pattern with a `/` in it (`app/pages`, `lib/nav.ts`), or a leading `/`, is anchored at the repo root;
//   - a matched folder covers everything inside it; `*` stays within one path segment, `**` spans segments.
// To keep a rule to the top-level folder, write it anchored: `/components/**`.

const globBody = (glob) => {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      i++;
      if (glob[i + 1] === "/") {
        i++;
        re += "(?:.*/)?";
      } else re += ".*";
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return re;
};

/** A test for one `paths` pattern: `(repoRelativePath) => boolean`. */
export const ruleMatcher = (pattern) => {
  let p = pattern.trim().replace(/\/\*\*$/, "");
  const leading = p.startsWith("/");
  p = p.replace(/^\/+/, "").replace(/\/+$/, "");
  const anchored = leading || p.includes("/");
  const re = new RegExp(`${anchored ? "^" : "(?:^|/)"}${globBody(p)}(?:/.*)?$`);
  return (path) => re.test(path);
};

/** The `paths` list from a rule file's frontmatter, or null for a rule that loads at launch. */
export const frontmatterPaths = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const paths = [...m[1].matchAll(/^\s*-\s*"?([^"\n]+)"?\s*$/gm)].map((x) => x[1].trim());
  return paths.length ? paths : null;
};

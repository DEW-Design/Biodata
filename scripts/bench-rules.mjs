#!/usr/bin/env node
// Benchmarks how much contract and reference text a session carries, before and after rules were split by
// scope (CONTRACTS.md 5.5): `npm run bench:rules [-- <baseline-commit>]`.
//
// Before: the baseline commit's CLAUDE.md imported whole files, so every task carried all of them.
// After: CLAUDE.md, its imports, and the unscoped rule files load at launch; a scoped rule file loads when a
// task touches a file its `paths` match (the same glob matching the loader uses). Each task below is the
// set of files that kind of work opens. Matching is Claude Code's own (rule-paths.mjs). Sizes are bytes of text; tokens are estimated at 4 bytes each.

import { readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { frontmatterPaths, ruleMatcher } from "./rule-paths.mjs";

const BASELINE = process.argv[2] || "62d5015"; // the last commit before the split
const root = process.cwd();

// The files a CLAUDE.md pulls in with `@file` lines, and their total size.
const importsOf = (read) => {
  const files = ["CLAUDE.md", ...read("CLAUDE.md").split("\n").filter((l) => l.startsWith("@")).map((l) => l.slice(1).trim())];
  return { files, bytes: files.reduce((n, f) => n + Buffer.byteLength(read(f)), 0) };
};
const readAt = (commit) => (f) => {
  try {
    return execSync(`git show ${commit}:${f}`, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
};
const readNow = (f) => readFileSync(`${root}/${f}`, "utf8");

const before = importsOf(readAt(BASELINE));
const nowImports = importsOf(readNow);
const rules = readdirSync(`${root}/.claude/rules`)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const text = readNow(`.claude/rules/${f}`);
    const globs = frontmatterPaths(text);
    return { f, bytes: Buffer.byteLength(text), matchers: globs && globs.map(ruleMatcher) };
  });
const launch = nowImports.bytes + rules.filter((r) => !r.matchers).reduce((n, r) => n + r.bytes, 0);

const tasks = [
  ["Answer a question (no files)", []],
  ["Change the contracts or checks", ["CONTRACTS.md", "scripts/check-contracts.mjs"]],
  ["Prototype lab (/proto/tools)", ["app/proto/tools/page.tsx", "app/_prototype-tools/status-bar.tsx"]],
  ["Record page (DSA detail)", ["app/pages/_shared/dsa/dsa-detail.tsx", "app/pages/_shared/record-hero.tsx"]],
  ["Explore / map search", ["app/pages/_shared/map-search/record-detail.tsx", "app/pages/observations/page.tsx"]],
  ["Edit a doc page", ["app/(docs)/components/tooltip/page.tsx", "lib/nav.ts"]],
  ["Change a component", ["components/base/buttons/button.tsx"]],
  ["Build a screen (Template Finder)", ["lib/registered-user-nav.ts", "config/role-access.config.ts", "app/pages/_shared/nominations/nomination-shell.tsx", "app/pages/template-finder/page.tsx", "app/_prototype-tools/prototype-tools.tsx"]],
];

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
const tok = (b) => `${(b / 4000).toFixed(1)}k`;
console.log(`Baseline ${BASELINE}: CLAUDE.md imports ${before.files.join(", ")} = ${kb(before.bytes)} (~${tok(before.bytes)} tokens), on every task.`);
console.log(`Now: launch = ${nowImports.files.join(", ")} + unscoped rules = ${kb(launch)} (~${tok(launch)} tokens).\n`);
console.log("| Task | Before | After | Saving | Scoped rules loaded |");
console.log("| --- | --- | --- | --- | --- |");
for (const [name, files] of tasks) {
  const hit = rules.filter((r) => r.matchers && files.some((p) => r.matchers.some((m) => m(p))));
  const after = launch + hit.reduce((n, r) => n + r.bytes, 0);
  console.log(`| ${name} | ${kb(before.bytes)} | ${kb(after)} (~${tok(after)} tok) | ${(100 * (1 - after / before.bytes)).toFixed(1)}% | ${hit.map((r) => r.f.replace(".md", "")).join(", ") || "none"} |`);
}
console.log("\n| Rule file | Size | Loads |");
console.log("| --- | --- | --- |");
for (const r of rules.sort((a, b) => b.bytes - a.bytes)) console.log(`| ${r.f} | ${kb(r.bytes)} | ${r.matchers ? "when a matching file is touched" : "at launch"} |`);

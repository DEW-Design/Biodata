#!/usr/bin/env node
// The design system audit (CONTRACTS.md section 9.3). Run at the end of every working day:
//   npm run audit                 compare with the default base (biodata/main, origin/main or main)
//   npm run audit -- --base X     compare with ref X
//   npm run audit -- --fetch      git fetch the base first
// Writes audit/audit-YYYY-MM-DD.md and prints the verdict. Exit code 1 when anything is flagged, so CI
// can fail on it.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { componentFiles, readJson, runChecks } from "./check-contracts.mjs";

const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : undefined);

const REMOTE_URL = "https://github.com/DEW-Design/Biodata.git";
let base = opt("base");
if (flag("fetch")) {
  git("fetch", REMOTE_URL, "main:refs/remotes/biodata/main");
}
if (!base) base = ["biodata/main", "origin/main", "main"].find((r) => git("rev-parse", "--verify", "--quiet", r));
const flags = [];
const flag_ = (level, text) => flags.push({ level, text });
const lines = [];
const out = (s = "") => lines.push(s);

const today = new Date().toLocaleDateString("sv-SE"); // local YYYY-MM-DD
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const head = git("rev-parse", "--short", "HEAD");

out(`# Design system audit - ${today}`);
out();
out(`- Branch: \`${branch}\` at \`${head}\``);
out(`- Compared with: \`${base ?? "NONE FOUND"}\``);
out();

if (!base) {
  flag_("ATTENTION", "No main ref found to compare against. Run with --fetch or --base <ref>.");
}


// Files under `dir` that exist locally (tracked or not, working tree) vs on the base ref.
function compareTree(dir, filter = () => true) {
  const local = new Set([...git("ls-files", "--cached", "--others", "--exclude-standard", "--", dir).split("\n"), ].filter((f) => f && existsSync(f) && filter(f)));
  const main = new Set(base ? git("ls-tree", "-r", "--name-only", base, "--", dir).split("\n").filter((f) => f && filter(f)) : []);
  const added = [...local].filter((f) => !main.has(f)).sort();
  const removed = [...main].filter((f) => !local.has(f)).sort();
  const changed = base ? git("diff", "--name-only", base, "--", dir).split("\n").filter((f) => f && filter(f) && local.has(f) && main.has(f)).sort() : [];
  return { added, removed, changed };
}

const mergeBase = base ? git("merge-base", "HEAD", base) : "";
const localOnly = base ? git("log", "--oneline", `${base}..HEAD`).split("\n").filter(Boolean) : [];
const mainOnly = base ? git("log", "--oneline", `HEAD..${base}`).split("\n").filter(Boolean) : [];

// ------------------------------------------------------------------ 1. what happened on main / locally
out(`## 1. What is happening on main and locally`);
out();
out(`- On main, not here (${mainOnly.length}):`);
for (const c of mainOnly.slice(0, 40)) out(`  - ${c}`);
if (!mainOnly.length) out(`  - none`);
out(`- Here, not on main (${localOnly.length}):`);
for (const c of localOnly.slice(0, 40)) out(`  - ${c}`);
if (!localOnly.length) out(`  - none`);
const dirty = git("status", "--porcelain").split("\n").filter(Boolean);
out(`- Uncommitted changes: ${dirty.length} file(s)`);
if (mainOnly.length) flag_("NOTE", `main has ${mainOnly.length} commit(s) not merged here. Normalise before building on top.`);
out();

// ------------------------------------------------------------------ 2. contract check
out(`## 2. Contract check (\`npm run check:contracts\`)`);
out();
const { violations, improvements } = runChecks();
if (!violations.length) out(`All contracts pass.`);
for (const v of violations) {
  out(`- **VIOLATION §${v.clause}** \`${v.file}\`: ${v.message}`);
  flag_("VIOLATION", `§${v.clause} ${v.file}`);
}
if (improvements.length) {
  out();
  out(`Improved since baseline (debt paid down, lock in with \`--update-baseline\`):`);
  for (const i of improvements.slice(0, 20)) out(`- ${i}`);
}
out();

// ------------------------------------------------------------------ 3. components
out(`## 3. New or changed components`);
out();
const overrides = readJson("contracts/overrides.json", { overrides: [] }).overrides;
const ovrByPath = new Map(overrides.map((o) => [o.component, o]));
const cmp = compareTree("components", (f) => /\.tsx?$/.test(f));
if (!cmp.added.length && !cmp.removed.length && !cmp.changed.length) out(`No component files differ from main.`);
for (const path of cmp.added) {
  const o = ovrByPath.get(path);
  const status = o ? `override ${o.id} by ${o.designer} (${o.date}): ${o.reason}` : "**NO DESIGNER OVERRIDE - VIOLATION (1.4)**";
  out(`- NEW \`${path}\` ${status}`);
  if (!o) flag_("VIOLATION", `new component without override: ${path}`);
  else flag_("REVIEW", `new component ${path} (override ${o.id}) - confirm it does not duplicate an existing one`);
}
for (const path of cmp.changed) {
  out(`- CHANGED \`${path}\``);
  flag_("REVIEW", `component changed vs main: ${path}`);
}
for (const path of cmp.removed) {
  out(`- REMOVED (in main, not here) \`${path}\``);
  flag_("REVIEW", `component in main but missing here: ${path}`);
}
out();

// ------------------------------------------------------------------ 4. duplicates
out(`## 4. Duplicate components (same name in more than one tier)`);
out();
const byName = new Map();
for (const f of componentFiles()) {
  const key = basename(f).replace(/\.tsx?$/, "").toLowerCase();
  byName.set(key, [...(byName.get(key) ?? []), f]);
}
const allowedDupes = readJson("contracts/allowed-duplicates.json", { allowed: {} }).allowed;
const dupes = [...byName].filter(([name, v]) => v.length > 1 && new Set(v.map((p) => p.split("/")[1])).size > 1 && !allowedDupes[name]);
if (!dupes.length) out(`None.`);
for (const [name, files] of dupes) {
  out(`- \`${name}\`: ${files.map((f) => `\`${f}\``).join(", ")}`);
  flag_("REVIEW", `duplicate component name "${name}" across tiers (1.7)`);
}
const custom = componentFiles().filter((f) => f.startsWith("components/custom/"));
out();
out(`Unpromoted \`components/custom/**\` (${custom.length}): ${custom.map((f) => `\`${f.replace("components/custom/", "")}\``).join(", ") || "none"}`);
out();

// ------------------------------------------------------------------ 5. open gaps
out(`## 5. Open \`?\` gaps`);
out();
function* walkTs(dir) {
  if (!existsSync(dir)) return;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walkTs(p);
    else if (/\.tsx$/.test(n)) yield p;
  }
}
const gaps = [];
for (const dir of ["app"]) for (const f of walkTs(dir)) {
  const src = readFileSync(f, "utf8");
  const shared = (src.match(/<Gap[\s>]/g) ?? []).length;
  const legacy = (src.match(/\b(GapField|GapRadio|GapDateRange)\b/g) ?? []).length;
  if (shared || legacy) gaps.push({ f, shared, legacy });
}
if (!gaps.length) out(`No open gap markers.`);
for (const g of gaps) out(`- \`${g.f}\`: ${g.shared} shared \`<Gap>\`${g.legacy ? `, ${g.legacy} legacy local marker(s) (migrate to \`<Gap>\`)` : ""}`);
if (gaps.some((g) => g.legacy)) flag_("NOTE", "legacy local gap markers exist; migrate them to the shared <Gap> (1.2)");
out();

// ------------------------------------------------------------------ 6. tokens
out(`## 6. Token and utility changes (app/globals.css)`);
out();
if (base) {
  const diff = git("diff", "-U0", base, "--", "app/globals.css").split("\n");
  const added = diff.filter((l) => l.startsWith("+") && !l.startsWith("+++") && /(@utility|--ui-|--color-)/.test(l));
  const removed = diff.filter((l) => l.startsWith("-") && !l.startsWith("---") && /(@utility|--ui-|--color-)/.test(l));
  out(`Added ${added.length}, removed ${removed.length}.`);
  for (const l of added.slice(0, 25)) out(`- + \`${l.slice(1).trim().slice(0, 110)}\``);
  for (const l of removed.slice(0, 25)) out(`- - \`${l.slice(1).trim().slice(0, 110)}\``);
  if (added.length || removed.length) flag_("REVIEW", `globals.css token/utility changes vs main (+${added.length}/-${removed.length})`);
} else out(`(no base)`);
out();

// ------------------------------------------------------------------ 7. routes
out(`## 7. Routes added or removed`);
out();
if (base) {
  const r = compareTree("app", (f) => /(^|\/)page\.tsx$/.test(f));
  if (!r.added.length && !r.removed.length) out(`No routes added or removed.`);
  for (const p of r.added) out(`- ADDED here (not in main) \`${p}\``);
  for (const p of r.removed) out(`- MISSING here (in main) \`${p}\``);
  if (r.added.length || r.removed.length) flag_("NOTE", `${r.added.length} route(s) only here, ${r.removed.length} only on main`);
}
out();

// ------------------------------------------------------------------ 8. nav integrity
out(`## 8. Navigation integrity (lib/nav.ts vs pages)`);
out();
const nav = existsSync("lib/nav.ts") ? readFileSync("lib/nav.ts", "utf8") : "";
const hrefs = [...nav.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
const missing = hrefs.filter((h) => !existsSync(join("app", "(docs)", h, "page.tsx")));
if (!missing.length) out(`All ${hrefs.length} nav entries resolve to a page.`);
for (const m of missing) {
  out(`- **Broken nav entry** \`${m}\``);
  flag_("VIOLATION", `nav entry with no page: ${m}`);
}
out();

// ------------------------------------------------------------------ 9. guarding the guard
out(`## 9. Changes to the contract files themselves (9.4)`);
out();
const guarded = ["CONTRACTS.md", "contracts/baseline.json", "contracts/component-inventory.json", "contracts/overrides.json", "contracts/allowed-duplicates.json", "scripts/check-contracts.mjs", "scripts/audit.mjs"];
let guardChanged = false;
for (const f of guarded) {
  if (!base) break;
  const stat = git("diff", "--numstat", base, "--", f);
  const wt = git("status", "--porcelain", "--", f);
  if (stat || wt) {
    guardChanged = true;
    let extra = "";
    if (f === "contracts/baseline.json" && stat) {
      const oldB = git("show", `${base}:${f}`);
      if (oldB) {
        const sum = (t) => { try { return Object.values(JSON.parse(t).counts).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0); } catch { return NaN; } };
        const a = sum(oldB), b = sum(readFileSync(f, "utf8"));
        extra = ` (allowed debt ${a} -> ${b}${b > a ? " - INCREASED" : ""})`;
        if (b > a) flag_("VIOLATION", `baseline debt increased ${a} -> ${b} (9.4)`);
      }
    }
    if (f === "CONTRACTS.md" && stat) {
      const [add, del] = stat.split("\t");
      extra = ` (+${add}/-${del} lines${Number(del) > 0 ? " - clauses removed or reworded" : ""})`;
      if (Number(del) > 0) flag_("REVIEW", "CONTRACTS.md had lines removed or reworded (9.4)");
    }
    out(`- Changed: \`${f}\`${extra}`);
    flag_("REVIEW", `contract file changed: ${f}`);
  }
}
if (!guardChanged) out(`No contract files changed.`);
out();
out(`### Override register (${overrides.length})`);
out();
for (const o of overrides) out(`- ${o.id} \`${o.component}\` - ${o.designer}, ${o.date}, status ${o.status}: ${o.reason}`);
if (!overrides.length) out(`Empty.`);
out();

// ------------------------------------------------------------------ verdict
const attention = flags.filter((f) => f.level === "VIOLATION" || f.level === "ATTENTION");
const review = flags.filter((f) => f.level === "REVIEW");
const notes = flags.filter((f) => f.level === "NOTE");
out(`## Verdict`);
out();
out(`**${attention.length ? "ATTENTION" : review.length ? "REVIEW NEEDED" : "CLEAN"}** - ${attention.length} violation(s), ${review.length} item(s) to review, ${notes.length} note(s).`);
out();
for (const f of attention) out(`- VIOLATION: ${f.text}`);
for (const f of review) out(`- REVIEW: ${f.text}`);
for (const f of notes) out(`- NOTE: ${f.text}`);

mkdirSync("audit", { recursive: true });
const file = join("audit", `audit-${today}.md`);
writeFileSync(file, lines.join("\n") + "\n");
console.log(`Audit written to ${file}`);
console.log(`Verdict: ${attention.length ? "ATTENTION" : review.length ? "REVIEW NEEDED" : "CLEAN"} - ${attention.length} violation(s), ${review.length} to review, ${notes.length} note(s)`);
process.exit(attention.length ? 1 : 0);

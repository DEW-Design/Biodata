#!/usr/bin/env node
// Enforces CONTRACTS.md. Run: npm run check:contracts
//
// Two kinds of rule:
//   hard    - must be zero (the shell contracts, the form pattern, the component inventory)
//   ratchet - existing debt is recorded in contracts/baseline.json and may not GROW; new code must be
//             clean. Lower a count by fixing code, then lock it in with --update-baseline.
//
// `--update-baseline` rewrites contracts/baseline.json and contracts/component-inventory.json. That is
// itself an audited act (CONTRACTS.md section 9.4): the audit report flags any change to them.
// `--json` prints machine-readable results.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const rel = (f) => relative(ROOT, f).split(sep).join("/");

// ---------------------------------------------------------------- shell + pattern rules (hard)
const PAGES = join(ROOT, "app", "pages");
const PAGE_EXEMPT = [["biodata-home"], ["auth"], ["projects", "page.tsx"], ["projectsv2", "page.tsx"]];

const hardRules = [
  { id: "3.1", name: "header", test: (s) => /<header[\s>]/.test(s), allow: ["_shared/app-header.tsx"], message: 'Hand-rolled <header>. Render <AppHeader /> from "@/app/pages/_shared/app-header".' },
  { id: "3.2", name: "primary rail", test: (s) => /aria-label="Primary"/.test(s), allow: ["_shared/primary-rail.tsx", "_shared/mobile-nav.tsx"], message: 'Hand-rolled primary rail. Render <PrimaryRail /> from "@/app/pages/_shared/primary-rail".' },
  { id: "3.3", name: "section icon map", test: (s) => /const sectionIcons\b/.test(s), allow: ["_shared/nav-icons.ts"], message: 'Local sectionIcons map. Import { sectionIcons } from "@/app/pages/_shared/nav-icons".' },
  { id: "3.4", name: "account controls", test: (s) => /function (ProfileMenu|GuestAuthActions)\b/.test(s), allow: ["_shared/profile-menu.tsx", "_shared/guest-auth-actions.tsx"], message: "Local ProfileMenu/GuestAuthActions. They live in AppHeader." },
  { id: "3.5", name: "sidebar footer links", test: (s) => /registeredUserFooterLinks\.map/.test(s), allow: ["_shared/sidebar-footer-links.tsx"], message: "Inline footer links. Render <SidebarFooterLinks />." },
  {
    id: "4.1",
    name: "form pattern",
    test: (s) => /<FormRow[\s>]/.test(s) && !/from "@\/app\/pages\/_shared\/form-page"/.test(s),
    allow: ["_shared/form-row.tsx", "_shared/form-page.tsx", "project-registration/option-2/form-sections.tsx"], // form-sections holds the field rows that option-2 renders inside FormPage
    message: "Uses <FormRow> without <FormPage>. Every form renders FormPage (see /patterns/forms).",
  },
  {
    id: "4.1b",
    name: "form sections in column 2",
    test: (s) => /from "@\/app\/pages\/_shared\/form-page"/.test(s) && /\b(TabList|Tabs)\b/.test(s),
    allow: [],
    message: "A FormPage screen uses tabs. Form sections live in column 2 as a FormSectionList (rendered through FormSidebar), never tabs or a stepper.",
  },
  {
    id: "4.2b",
    name: "table fits the viewport",
    test: (s) => /<TableCard\.Root\b/.test(s) && !/\bbodyScrollable\b/.test(s),
    // Tables embedded in a detail tab: the page is the scroll container there, and rows are few.
    allow: ["_shared/dsa/dsa-detail.tsx", "observation-detail/page.tsx"],
    message: "A collection table without bodyScrollable. Every collection screen's table fits the viewport: header, search and pagination stay put and only the rows scroll (Table bodyScrollable + Table.Header sticky, see CONTRACTS.md 4.2).",
  },
];

// ---------------------------------------------------------------- ratchet rules
const SCAN_DIRS = ["app", "components", "lib", "config"];
const SCAN_SKIP = [/^app\/proto\//, /^app\/globals\.css$/, /^node_modules\//];
const DEAD = /\b(?:text-md|bg-quaternary|bg-border-secondary|border-secondary_hover|border-l-brand-solid|border-error-subtle|ring-offset-bg-primary)\b/;
const isComment = (line) => /^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line);

const ratchetRules = [
  { id: "2.1a", name: "dead utility class", test: (line) => DEAD.test(line) && !isComment(line) },
  { id: "2.1b", name: "hard-coded colour", test: (line) => !isComment(line) && (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/.test(line) || /\brgba?\(/.test(line)) },
  { id: "2.3a", name: "em-dash", test: (line) => /—/.test(line) },
  { id: "2.3b", name: "arrow character", test: (line) => /[←-↓⇒]/.test(line) },
];

// ---------------------------------------------------------------- component inventory (hard, 1.4)
const COMPONENT_TIERS = ["base", "application", "foundations", "marketing", "custom", "scaffold"];

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(tsx?|css)$/.test(name)) yield full;
  }
}

export function componentFiles() {
  const out = [];
  for (const tier of COMPONENT_TIERS) for (const f of walk(join(ROOT, "components", tier))) if (/\.tsx?$/.test(f)) out.push(rel(f));
  return out.sort();
}

export function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
  } catch {
    return fallback;
  }
}

export function currentRatchetCounts() {
  const counts = {};
  for (const r of ratchetRules) counts[r.id] = {};
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const f = rel(file);
      if (SCAN_SKIP.some((re) => re.test(f)) || !/\.tsx?$/.test(f)) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      for (const r of ratchetRules) {
        const n = lines.filter((l) => r.test(l)).length;
        if (n) counts[r.id][f] = n;
      }
    }
  }
  return counts;
}

export function runChecks() {
  const violations = [];
  const improvements = [];

  // hard shell / pattern rules
  for (const file of walk(PAGES)) {
    const parts = relative(PAGES, file).split(sep);
    if (PAGE_EXEMPT.some((e) => e.every((seg, i) => parts[i] === seg))) continue;
    if (!/\.tsx?$/.test(file)) continue;
    const r = parts.join("/");
    const src = readFileSync(file, "utf8");
    for (const rule of hardRules) {
      if (rule.allow.includes(r)) continue;
      if (rule.test(src)) violations.push({ clause: rule.id, file: `app/pages/${r}`, message: rule.message });
    }
  }

  // ratchet rules
  const baseline = readJson("contracts/baseline.json", { counts: {} }).counts;
  const counts = currentRatchetCounts();
  for (const r of ratchetRules) {
    for (const [file, n] of Object.entries(counts[r.id])) {
      const was = baseline[r.id]?.[file] ?? 0;
      if (n > was) violations.push({ clause: r.id, file, message: `${r.name}: ${n} occurrence(s), baseline allows ${was}. New code must not add any.` });
    }
    for (const [file, was] of Object.entries(baseline[r.id] ?? {})) {
      const n = counts[r.id][file] ?? 0;
      if (n < was) improvements.push(`${r.id} ${file}: ${was} -> ${n}`);
    }
  }

  // component inventory
  const inventory = new Set(readJson("contracts/component-inventory.json", { files: [] }).files);
  const overrides = readJson("contracts/overrides.json", { overrides: [] }).overrides;
  const overridden = new Map(overrides.map((o) => [o.component, o]));
  for (const f of componentFiles()) {
    if (inventory.has(f)) continue;
    const o = overridden.get(f);
    if (!o) violations.push({ clause: "1.4", file: f, message: "New component with no designer override in contracts/overrides.json. A new component is a designer decision (CONTRACTS.md 1.4)." });
    else if (!o.designer || !o.reason || !o.approvedBy || !o.date) violations.push({ clause: "1.4", file: f, message: `Override ${o.id ?? "?"} is missing designer, date, reason or approvedBy.` });
  }

  return { violations, improvements, counts };
}

function updateBaseline() {
  const { counts } = runChecks();
  writeFileSync(join(ROOT, "contracts", "baseline.json"), JSON.stringify({ note: "Existing debt per rule and file. May only shrink. Changing this file is an audited act (CONTRACTS.md 9.4).", counts }, null, 2) + "\n");
  writeFileSync(join(ROOT, "contracts", "component-inventory.json"), JSON.stringify({ note: "Approved component files. A file not listed here needs an entry in contracts/overrides.json (CONTRACTS.md 1.4).", files: componentFiles() }, null, 2) + "\n");
  console.log("Baseline and component inventory rewritten. This change will be flagged in the audit.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--update-baseline")) {
    updateBaseline();
    process.exit(0);
  }
  const { violations, improvements } = runChecks();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ violations, improvements }, null, 2));
    process.exit(violations.length ? 1 : 0);
  }
  if (improvements.length) console.log(`Improved since baseline (run with --update-baseline to lock in):\n${improvements.map((i) => "  + " + i).join("\n")}\n`);
  if (violations.length) {
    console.error(`Contract violations (${violations.length}):\n` + violations.map((v) => `  - §${v.clause} ${v.file}: ${v.message}`).join("\n"));
    console.error("\nSee CONTRACTS.md. A violation blocks completion (section 0.6).");
    process.exit(1);
  }
  console.log("Contracts: OK (shell, form pattern, tokens, copy, component inventory).");
}

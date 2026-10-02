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
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkIndex } from "./build-context-index.mjs";
import { checkRules } from "./build-contract-rules.mjs";

const ROOT = process.cwd();
const rel = (f) => relative(ROOT, f).split(sep).join("/");

// ---------------------------------------------------------------- shell + pattern rules (hard)
const PAGES = join(ROOT, "app", "pages");
const PAGE_EXEMPT = [["biodata-home"], ["auth"], ["projects", "page.tsx"], ["projectsv2", "page.tsx"]];

// 3.10: column 2 (the contextual <aside>) holds navigation and actions only. Explanatory content in
// it (steps, headings, alerts, accordions, task cards) belongs in main, above the content it explains.
const asideBlocks = (s) => [...s.matchAll(/^[ \t]*<aside\b[\s\S]*?<\/aside>/gm)].map((m) => m[0]);
const ASIDE_INFO = /<h[1-6]\b|<Progress\.|<Accordion\b|<AlertFullWidth\b|<AlertFloating\b|<TaskItem\b/;

// 3.10, second half: a component rendered inside column 2 must not hold information either. The "What is a project?"
// block sat in column 2 as a `<ProjectsGuide />` whose headings lived in its own file, so looking at the aside's own
// markup found nothing (the nominations steps explainer was the first time, the project block the second, CONTRACTS 0.8).
// Column 2 is the left-hand aside (`border-r`); the tags it renders are followed to the function that defines them.
const leftAsides = (s) => asideBlocks(s).filter((b) => /^[ \t]*<aside\b[^>]*\bborder-r\b/.test(b));
const importTarget = (file, spec) => {
  const base = spec.startsWith("@/") ? join(ROOT, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(file), spec) : null;
  return base ? [".tsx", ".ts", "/index.tsx"].map((ext) => base + ext).find((f) => existsSync(f)) : undefined;
};
function columnTwoComponentsHoldInformation(src, file) {
  if (!file) return false;
  return leftAsides(src).some((block) =>
    [...new Set([...block.matchAll(/<([A-Z]\w+)/g)].map((m) => m[1]))].some((tag) => {
      const spec = src.match(new RegExp(`import[^;]*\\b${tag}\\b[^;]*from "([^"]+)"`))?.[1];
      const target = spec && importTarget(file, spec);
      if (!target) return false;
      const body = readFileSync(target, "utf8").match(new RegExp(`(?:export )?function ${tag}\\b[\\s\\S]*?\\n}\\n`))?.[0] ?? "";
      return ASIDE_INFO.test(body);
    }),
  );
}

const hardRules = [
  {
    id: "3.10",
    name: "column 2 is navigation and actions",
    test: (s, file) => asideBlocks(s).some((b) => ASIDE_INFO.test(b)) || columnTwoComponentsHoldInformation(s, file),
    // The one exception is the signed-out visitor's column 2 (public-user): what BioData SA is, and guides.
    allow: ["_shared/guest-home.tsx"],
    message: "Explanatory content (heading, steps, alert, accordion or task card) inside the column 2 <aside>, or in a component it renders. Column 2 is navigation and actions only; put information in main above the content, as an ExplainerCard (CONTRACTS.md 3.10). Only the public-user column 2 is exempt.",
  },
  {
    // 3.11: column 2's items are the vertical tab lists (scope, area and view switchers); each tab carries an icon.
    id: "3.11",
    name: "column 2 items have icons",
    test: (s) =>
      [...s.matchAll(/<TabList\b[^>]*orientation="vertical"[^>]*>[\s\S]*?<\/TabList>/g)].some((list) =>
        [...list[0].matchAll(/<Tab\b[\s\S]*?\/>/g)].some((tab) => !/\bicon=/.test(tab[0])),
      ),
    allow: [],
    message: "A column 2 tab (a vertical TabList item) without an icon. Every navigation item in column 2 carries an icon left of its label: Tab icon={...} (CONTRACTS.md 3.11).",
  },
  {
    // 3.13: an underline tab list is a row of sections; each tab carries an icon (a mapped list passes one per tab).
    id: "3.13",
    name: "underline tabs have icons",
    test: (s) => [...s.matchAll(/<TabList\b[^>]*type="underline"[^>]*>[\s\S]*?<\/TabList>/g)].some((list) => !/\bicon=/.test(list[0])),
    // Explore's results card is too narrow for icons; the record sections' titles come from the data.
    allow: ["observations/observations-search.tsx", "project-list/[id]/project-details/project-details-view.tsx"],
    message: "An underline tab list whose tabs have no icon. Every tab carries the icon of what it holds: Tab icon={...} (CONTRACTS.md 3.13).",
  },
  {
    id: "2.11",
    name: "a date field has a calendar",
    test: (s) => /<InputDate\b(?!Picker)/.test(s),
    allow: [],
    message: 'A date field without a calendar (<InputDate>). Use <InputDatePicker> from "@/components/custom/date-picker/input-date-picker": type the date or pick it (CONTRACTS.md 2.11).',
  },
  { id: "3.1", name: "header", test: (s) => /<header[\s>]/.test(s), allow: ["_shared/app-header.tsx"], message: 'Hand-rolled <header>. Render <AppHeader /> from "@/app/pages/_shared/app-header".' },
  { id: "3.2", name: "primary rail", test: (s) => /aria-label="Primary"/.test(s), allow: ["_shared/primary-rail.tsx", "_shared/mobile-nav.tsx"], message: 'Hand-rolled primary rail. Render <PrimaryRail /> from "@/app/pages/_shared/primary-rail".' },
  { id: "3.3", name: "section icon map", test: (s) => /const sectionIcons\b/.test(s), allow: ["_shared/nav-icons.ts"], message: 'Local sectionIcons map. Import { sectionIcons } from "@/app/pages/_shared/nav-icons".' },
  { id: "3.4", name: "account controls", test: (s) => /function (ProfileMenu|GuestAuthActions)\b/.test(s), allow: ["_shared/profile-menu.tsx", "_shared/guest-auth-actions.tsx"], message: "Local ProfileMenu/GuestAuthActions. They live in AppHeader." },
  { id: "3.5", name: "legal links in the rail", test: (s) => /registeredUserFooterLinks\.map/.test(s), allow: ["_shared/primary-rail.tsx"], message: "Inline legal links. They are icons at the foot of <PrimaryRail /> (CONTRACTS.md 3.2)." },
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
    id: "4.7",
    name: "role belongs to the data owner's contact",
    test: (s) => /\bRegistered by\b/i.test(s),
    allow: [],
    message: 'A "Registered by" label. A role belongs to each data owner contact and is shown with that contact; never as a separate "registered by" / "your role" field or a "Project team" card (CONTRACTS.md 4.7).',
  },
  {
    id: "4.2b",
    name: "table fits the viewport",
    test: (s) => /<TableCard\.Root\b/.test(s) && !/\bbodyScrollable\b/.test(s),
    // Tables embedded in a detail tab: the page is the scroll container there, and rows are few.
    allow: ["_shared/dsa/dsa-detail.tsx", "observation-detail/page.tsx", "_shared/user-management/um-detail.tsx"],
    message: "A collection table without bodyScrollable. Every collection screen's table fits the viewport: header, search and pagination stay put and only the rows scroll (Table bodyScrollable + Table.Header sticky, see CONTRACTS.md 4.2).",
  },
  {
    id: "4.2d",
    name: "one filter",
    // The three filters this replaced were a popover of every section, an "Add filter" popover and an "All Filters" side
    // panel. A table has the contextual Filter menu (FilterMenu) and nothing else.
    test: (s) => /(?:title="All Filters"|>\s*All Filters\b|>\s*Add filter\s*<)/.test(s),
    allow: [],
    message: 'A hand-built filter ("All Filters" panel or "Add filter" button). A table has the one Filter menu: <FilterMenu> with useAttributeFilter, useListFilter or useSelectionFilter (CONTRACTS.md 4.2d).',
  },
  {
    id: "4.2c",
    name: "one toolbar search width",
    // A collection toolbar is where the Filter menu lives. Its search box is ToolbarSearch (384px),
    // never a hand-rolled Input that grows to fill the row or picks its own width.
    test: (s) => /<FilterMenu\b/.test(s) && /<Input\b[^>]*icon=\{Search(?:Md|Lg|Sm)\}/.test(s),
    allow: ["_shared/map-search/species-results.tsx", "observations/observations-search.tsx"], // Explore's full-width results search: the designer's call, open (CONTRACTS 4.2c)
    message: "A toolbar with a Filter button whose search is a hand-rolled <Input>. Use <ToolbarSearch> (app/pages/_shared/toolbar-search.tsx): one 384px search width on every collection toolbar (CONTRACTS.md 4.2c).",
  },
  {
    id: "4.2g",
    name: "one gap under the header",
    // Between a SectionHeader and the first toolbar search after it, some wrapping <div> must carry the
    // 24px top padding every list uses (p-6). `px-6 pb-6` leaves the search flush against the divider.
    test: (s) =>
      [...s.matchAll(/<\/SectionHeader\.Root>/g)].some((m) => {
        const rest = s.slice(m.index);
        const at = rest.indexOf("<ToolbarSearch");
        if (at < 0) return false;
        const divs = [...rest.slice(0, at).matchAll(/<div\b[^>]*className="([^"]*)"/g)].map((d) => d[1]);
        return !divs.some((c) => /(?:^|\s)(?:p|pt|py)-6(?:\s|$)/.test(c));
      }),
    allow: [],
    message: "The list body under </SectionHeader.Root> has no top padding before the toolbar search, so the search sits flush against the header's divider. Wrap it in a div with p-6 (flex min-h-0 flex-1 flex-col gap-4 p-6), as every list does (CONTRACTS.md 4.2g).",
  },
  {
    id: "4.2f",
    name: "stable table columns",
    // A collection table is one with bodyScrollable. Its columns must not reflow as the rows change, so it is a
    // fixed layout with a width on every column (the automatic layout sizes each column to its widest cell).
    test: (s) => {
      for (const m of s.matchAll(/<Table(?![.\w])/g)) {
        const tag = s.slice(m.index, m.index + 500);
        if (/\bbodyScrollable\b/.test(tag) && !/layout="fixed"/.test(tag)) return true;
      }
      return false;
    },
    // The Explore results table lets the person choose its columns; the ingestion report view is lab-only.
    allow: ["_shared/map-search/results-table.tsx", "_shared/reports/ingestion-report.tsx"],
    message: 'A collection table (Table bodyScrollable) without layout="fixed". Its columns must keep their width whatever rows show: fixed layout, a width on every Table.Head, a min-w on the table (CONTRACTS.md 4.2f).',
  },
  {
    id: "4.2f",
    name: "scrollbar gutter",
    // A scrolling main that overflows in one state and not another moves its content by a scrollbar's width on a
    // classic-scrollbar system. It reserves the space.
    test: (s) => /<main\b[^>]*className="[^"]*\boverflow-y-auto\b(?![^"]*scrollbar-gutter)[^"]*"/.test(s),
    allow: [],
    message: "A scrolling <main> (overflow-y-auto) without [scrollbar-gutter:stable]. Reserve the scrollbar so the content does not move when it appears (CONTRACTS.md 4.2f).",
  },
];

// ---------------------------------------------------------------- ratchet rules
const SCAN_DIRS = ["app", "components", "lib", "config"];
// components/foundations/payment-icons/**: third-party payment-brand logo SVGs (Visa, Mastercard,
// PayPal, ...). Their hardcoded hex is each brand's own trademarked colour, required exact - not a
// DEW colour choice, so it's not "invented" or "hardcoded instead of tokenised" in any sense CONTRACTS
// 2.1 means. Out of scope for every colour rule, same tier as the /proto exemption below.
const SCAN_SKIP = [/^app\/proto\//, /^app\/globals\.css$/, /^node_modules\//, /^components\/foundations\/payment-icons\//];
const DEAD = /\b(?:text-md|bg-quaternary|bg-border-secondary|border-secondary_hover|border-l-brand-solid|border-error-subtle|ring-offset-bg-primary|divide-secondary)\b/;
const isComment = (line) => /^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line);

// 2.1c/2.1d: colour is never invented. contracts/figma-colours.json is the real DS - Foundations
// file's own Colors page, extracted via the Figma MCP - see CONTRACTS.md 2.1 and that file's own
// "note". Flattened once into a lowercase hex set so a hardcoded literal can be checked against it.
const FIGMA_COLOURS = readJson("contracts/figma-colours.json", null);
const FIGMA_HEX_SET = FIGMA_COLOURS
  ? new Set(
      [
        ...Object.values(FIGMA_COLOURS.base ?? {}),
        ...Object.values(FIGMA_COLOURS.semantic ?? {}),
        ...Object.values(FIGMA_COLOURS.primitives ?? {}).flatMap((p) => Object.values(p.steps ?? {})),
      ].map((h) => h.toLowerCase()),
    )
  : null;

function coloursInLine(line) {
  const out = [];
  for (const m of line.matchAll(/#([0-9a-fA-F]{6})\b/g)) out.push(`#${m[1].toLowerCase()}`);
  for (const m of line.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,[^)]+)?\)/g)) {
    const [, r, g, b] = m;
    out.push(`#${[r, g, b].map((x) => Math.min(255, Number(x)).toString(16).padStart(2, "0")).join("")}`);
  }
  return out;
}

const ratchetRules = [
  { id: "2.1a", name: "dead utility class", test: (line) => DEAD.test(line) && !isComment(line) },
  { id: "2.1b", name: "hard-coded colour", test: (line) => !isComment(line) && (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/.test(line) || /\brgba?\(/.test(line)) },
  {
    id: "2.1d",
    name: "invented colour",
    test: (line) => {
      if (isComment(line) || !FIGMA_HEX_SET) return false;
      return coloursInLine(line).some((c) => !FIGMA_HEX_SET.has(c));
    },
  },
  { id: "2.3a", name: "em-dash", test: (line) => /—/.test(line) },
  { id: "2.3b", name: "arrow character", test: (line) => /[←-↓⇒]/.test(line) },
];

// 2.1c: app/globals.css's own --color-* primitives must match contracts/figma-colours.json exactly.
// Hard, never ratcheted - a primitive is either the real Figma value or it's wrong; there is no
// legitimate "existing debt" tier for the design system's own declared source of truth drifting from
// its source. See CONTRACTS.md 2.1's own --color-gray-950 origin line.
function checkPrimitiveDrift() {
  const violations = [];
  if (!FIGMA_COLOURS) return violations;
  const cssPath = join(ROOT, "app", "globals.css");
  if (!existsSync(cssPath)) return violations;
  const css = readFileSync(cssPath, "utf8");
  for (const [name, def] of Object.entries(FIGMA_COLOURS.primitives)) {
    if (!def.cssVar) continue; // documented in Figma, not yet ingested - nothing to check
    const escaped = def.cssVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const [step, hex] of Object.entries(def.steps)) {
      const m = css.match(new RegExp(`${escaped}${step}:\\s*(#[0-9a-fA-F]{6})`, "i"));
      if (m && m[1].toLowerCase() !== hex.toLowerCase()) {
        violations.push({
          clause: "2.1c",
          file: "app/globals.css",
          message: `${def.cssVar}${step} is ${m[1]}, the DS - Foundations Figma file (${name}) gives ${hex}. Fix the primitive to match, don't leave it drifted.`,
        });
      }
    }
  }
  return violations;
}

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

// 3.12: every action button carries an icon that names its action. An action button is a filled or outlined
// `<Button>` with a text label: `color` primary, secondary (the default), tertiary or a destructive one. Link-style
// buttons (`link-color`, `link-gray`, `link-destructive`) are links, and a button with only an aria-label (or only
// an ellipsis) is icon-only; neither needs one. The stale unlinked drafts are exempt, like the shell rules.
const ACTION_COLOURS = /^(primary|secondary|tertiary|primary-destructive|secondary-destructive)$/;
function actionButtonsWithoutIcon(src) {
  const found = [];
  let i = 0;
  while ((i = src.indexOf("<Button", i)) !== -1) {
    if (!/[\s>/]/.test(src[i + 7] ?? " ")) {
      i += 7;
      continue;
    }
    let depth = 0;
    let j = i + 7;
    let quote = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (quote) {
        if (c === quote && src[j - 1] !== "\\") quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0 && src[j - 1] !== "=") break;
    }
    const tag = src.slice(i, j + 1);
    const label = tag.endsWith("/>") ? "" : src.slice(j + 1, src.indexOf("</Button>", j)).replace(/\s+/g, " ").trim();
    const color = tag.match(/color="([^"]+)"/)?.[1] ?? (/color=\{/.test(tag) ? "primary" : "secondary");
    const iconOnly = label === "" || /^[.\u2026\s]*$/.test(label);
    if (ACTION_COLOURS.test(color) && !iconOnly && !/icon(Leading|Trailing)=/.test(tag)) found.push(src.slice(0, i).split("\n").length);
    i = j;
  }
  return found;
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
      if (rule.test(src, file)) violations.push({ clause: rule.id, file: `app/pages/${r}`, message: rule.message });
    }
  }

  // 3.12: action buttons carry an icon (every screen, the auth flow and the home page included)
  for (const file of walk(PAGES)) {
    const parts = relative(PAGES, file).split(sep);
    if ((parts[0] === "projects" || parts[0] === "projectsv2") && parts[1] === "page.tsx") continue;
    if (!/\.tsx$/.test(file)) continue;
    for (const line of actionButtonsWithoutIcon(readFileSync(file, "utf8")))
      violations.push({ clause: "3.12", file: `app/pages/${parts.join("/")}:${line}`, message: "An action button (primary, secondary, tertiary or destructive, with a text label) without an icon. Every action button carries an icon that names the action: iconLeading, or iconTrailing for a forward arrow (CONTRACTS.md 3.12)." });
  }
  // ... and in the shared components that render buttons of their own (modals, alerts, the file field, multi-select):
  // a modal's Cancel and its confirm button are action buttons too.
  for (const dir of ["application", "base", "custom"]) {
    const root = join(ROOT, "components", dir);
    if (!existsSync(root)) continue;
    for (const file of walk(root)) {
      if (!/\.tsx$/.test(file)) continue;
      for (const line of actionButtonsWithoutIcon(readFileSync(file, "utf8")))
        violations.push({ clause: "3.12", file: `${rel(file)}:${line}`, message: "An action button (primary, secondary, tertiary or destructive, with a text label) without an icon in a shared component. Give it an icon prop, required where the action varies (CONTRACTS.md 3.12)." });
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

  // 2.1c: primitives must match the real Figma Colors page, hard, zero tolerance
  violations.push(...checkPrimitiveDrift());

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

  // 1.4b: an override's reviewBy is a real deadline, checked against today every run - not just at
  // creation. Once it passes, check:contracts fails until someone consciously renews it (a new
  // reviewBy) or retires it (status: "retired"). CONTRACTS.md 9.2.
  const today = new Date().toLocaleDateString("sv-SE");
  for (const o of overrides) {
    if (o.status !== "active") continue;
    if (!o.reviewBy) violations.push({ clause: "1.4b", file: o.component, message: `Override ${o.id} has no reviewBy date. Every override needs one (CONTRACTS.md 1.4, 9.2).` });
    else if (o.reviewBy < today) violations.push({ clause: "1.4b", file: o.component, message: `Override ${o.id}'s reviewBy (${o.reviewBy}) has passed. Renew it with a new reviewBy, or retire it - it MUST NOT just sit there overdue (CONTRACTS.md 9.2).` });
  }

  // 1.9a behaviour patterns: a multiple-selection listbox in a component must switch off react-aria's
  // default of clearing the whole selection on Escape (Escape closes, it never changes the value).
  for (const f of componentFiles()) {
    const src = readFileSync(join(ROOT, f), "utf8");
    for (const m of src.matchAll(/<(?:Aria)?ListBox\b/g)) {
      const tag = src.slice(m.index, m.index + 900);
      if (/selectionMode="multiple"/.test(tag) && !/escapeKeyBehavior=/.test(tag)) {
        violations.push({ clause: "1.9a", file: f, message: 'Multiple-selection ListBox without escapeKeyBehavior="none": Escape would clear the selection (CONTRACTS.md 1.9).' });
      }
    }
  }

  // 1.9a, menus: a menu component can carry a multiple selection (a filter's ticks) whatever its caller passes, so a react-aria
  // Menu in a component must switch off the clear-on-Escape default itself.
  for (const f of componentFiles()) {
    const src = readFileSync(join(ROOT, f), "utf8");
    for (const m of src.matchAll(/<AriaMenu\b/g)) {
      if (!/escapeKeyBehavior=/.test(src.slice(m.index, m.index + 900))) {
        violations.push({ clause: "1.9a", file: f, message: 'A react-aria Menu without escapeKeyBehavior="none": Escape would clear a multiple selection (CONTRACTS.md 1.9).' });
      }
    }
  }

  // 5.4 labs never ship: the deployed build removes app/proto, so nothing outside it may import from it
  // (the build would break) or link to it (the link would 404). A dev-only link goes through
  // lib/lab-href.ts, which returns null in production.
  const LAB_IMPORT = /from\s+["'](?:@\/app\/proto\/|(?:\.\.\/)+proto\/)/;
  const LAB_LINK = /["'`]\/proto(?:\/|["'`?#])/;
  for (const dir of ["app", "components", "lib", "config"]) {
    for (const file of walk(join(ROOT, dir))) {
      const r = rel(file);
      if (r.startsWith("app/proto/") || r === "lib/lab-href.ts" || !/\.tsx?$/.test(r)) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (isComment(line)) return;
        if (LAB_IMPORT.test(line)) violations.push({ clause: "5.4", file: `${r}:${i + 1}`, message: "Imports from app/proto. Labs are left out of the deployed build, so production code must never depend on one; move what is shared into app/pages/_shared (CONTRACTS.md 5.4)." });
        else if (LAB_LINK.test(line)) violations.push({ clause: "5.4", file: `${r}:${i + 1}`, message: "Links to a /proto lab. Labs aren't deployed, so the link would 404; use labHref() from lib/lab-href.ts, which hides it in production (CONTRACTS.md 5.4)." });
      });
    }
  }

  // 5.1b the decision index is generated from context/decisions/*.md and nothing dated is appended to
  // CONTEXT.md; 5.5 the scoped rule files are generated from CONTRACTS.md and every clause has a scope.
  const indexProblem = checkIndex();
  if (indexProblem) violations.push({ clause: "5.1b", file: "context/decisions/INDEX.md", message: indexProblem });
  for (const message of checkRules()) violations.push({ clause: "5.5", file: ".claude/rules", message });

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

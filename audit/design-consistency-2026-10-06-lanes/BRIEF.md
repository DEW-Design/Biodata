# Consistency audit brief (shared by every audit agent)

Repo: /Users/smaniganahalli/conductor/workspaces/biodata/biarritz (Next.js 16 app, DEW design system, Barlow, Untitled UI + react-aria).
Goal of the whole audit: the webapp must look, read and behave like ONE product. We are FINDING and REPORTING
inconsistencies, not fixing them. DO NOT edit, create or delete any file inside the repo except under
`.context/audit/` (gitignored). Do not run `npm install`, do not touch package.json, do not commit, do not stash.

## Read first (in this order)
1. `CONTRACTS.md` (binding; clauses are also split in `.claude/rules/contracts-*.md`). Pay attention to
   §0.9 (borrow patterns), §1.x, §2.1-2.12, §3.x, §4.x. Reference docs: `.claude/rules/ref-shell.md`, `ref-roles.md`.
2. `audit/type-audit-2026-09-29.md` (previous type audit; its decisions D1-D12 and statuses).
3. `config/role-access.config.ts`, `lib/registered-user-nav.ts`, `app/pages/_shared/screen-index.ts` (the 72-screen index = route list).
4. Next.js here is v16 with breaking changes; if you need Next specifics read `node_modules/next/dist/docs/`.

## Live app
Dev server for THIS worktree is already running: http://localhost:3000 (verified). Do not start another.
Persona switch = query param `?userRole=<role>` (roles: public-user, registered-user, privileged-user, biodata-user,
biodata-admin, biodata-super-admin - confirm exact slugs in `config/role-access.config.ts`/`ref-roles.md`).
Routes: `/pages/...` (product). `/proto/**` are labs and never ship: OUT OF SCOPE. `app/pages/projects` and
`app/pages/projectsv2` are confirmed stale drafts: OUT OF SCOPE. Doc site (`/components`, `/patterns`, `/primitives`) is doc
chrome (Geist): out of scope except where noted in your task. Leaflet's own map internals: out of scope.

Live measurement recipe (repo has no Playwright dependency on purpose):
```
mkdir -p /tmp/dc-<yourname> && cd /tmp/dc-<yourname> && npm init -y >/dev/null && npm i playwright-core >/dev/null 2>&1
```
Chromium is cached at ~/Library/Caches/ms-playwright (chromium-1243, chromium_headless_shell-1243); launch with
`chromium.launch()` from playwright-core, and if it cannot find the browser pass `executablePath` pointing into that cache.
Use a 1708x1024 viewport (the designer's working size) unless your task says otherwise. Record every `pageerror` and
console `error` per page: a console error is itself a finding. Save screenshots under
`/Users/smaniganahalli/conductor/workspaces/biodata/biarritz/.context/audit/shots/<yourname>-*.png`.
Delete /tmp/dc-<yourname> when done. Other agents run Playwright at the same time against the same server: be gentle
(sequential page loads, one browser, close it), and use a unique localStorage state (new context each time).

## Already decided by the designer - do NOT re-raise these as findings (you may mention them as "known/accepted")
- `text-quaternary` (gray-500, 3.4:1) contrast: deliberately left as is (decision 2026-09-30-16).
- The header "DEW" org pill at 10px: accepted. Rail count badge 10px is an accepted exception.
- Project detail "Option 2" is kept until the designer says otherwise; `projects`/`projectsv2` stale drafts stay.
- Disabled-with-"Not available in this preview yet" controls (legal icons, template downloads, validation map/download) are intentional.
- Explore option 1 has no column 2; project page + its record pages have no column 2 (logged overrides, §3.7).
- Unwired features (Reports "not wired up" toast, uploads never read) are prototype settings.
- The Prototype tools bar (`app/_prototype-tools`) is Scaffold, not product.
- Filters: ONE pattern - `FilterMenu` contextual menu (§4.2d). Breadcrumb: `BreadcrumbSwitcher` on every deep-dive (§4.6.5).
- Underline tabs carry 16px icons (§3.13); every action button carries an icon (§3.12); column-2 items carry icons (§3.11).

## What the designer keeps correcting (recurring themes: treat any new instance as HIGH priority and say which theme)
T1 "Dancing layouts": widths/positions shift when state changes (All/My, default->results, tab switches, row counts, pagination numbers).
T2 Hand-built lookalike instead of the design-system component (alert with extra classes, plain dropdown instead of ComboBox, huge tags vs the standard small Badge, emoji as an icon).
T3 Same role, different type treatment (heading weights, label/value, table cells, captions, KPI numbers).
T4 Icon rules: icon on every action/nav item/tab; one icon per concept; icon size optically proportionate (tabs 16px).
T5 Information placed in column 2 (column 2 = navigation + actions only); actions sitting at the bottom of column 2.
T6 Detail/record pages not following the project page (hero card, back link, tabs, breadcrumb switcher, no restated facts, borrowed patterns §0.9). Latest rule from the designer (6 Oct): "*-details pages: column 2 is hidden and the entire real estate used for the details page; bring over behaviours/patterns already documented in *-detail pages".
T7 Controls that float to the wrong side / inconsistent positions (Tree/Table toggle right, expand-vs-fullscreen map buttons, overlay too close to its trigger button).
T8 "My X / All X": All comes first, My is a filter on All; labels read like a human would say them.
T9 Naming drift for one concept (e.g. "Reports (All Users)" vs "Reports"; section header vs column 2 header on Taxonomy management).
T10 Brevity: nothing on screen without a purpose (§2.12); explanatory copy belongs in a dismissable banner/ExplainerCard above content, not in column 2.
T11 Empty states, loading states and "Not provided" must look and read the same everywhere.
T12 Sentence case vs Title Case, punctuation, spelling (Australian English: licence/organisation/colour), date/number formats.

## Output contract
Write your FULL report to `/Users/smaniganahalli/conductor/workspaces/biodata/biarritz/.context/audit/<yourname>.md` using this shape:
1. "Scope and method" (what you actually ran / read; counts; what you did NOT cover - be honest).
2. "What holds" (max ~10 one-line confirmations, only the important ones).
3. "Findings": a numbered list. Each finding:
   `### <ID>-<n> [HIGH|MED|LOW] <short title>` then bullets:
   - **What:** the inconsistency in one or two sentences, with the competing treatments side by side.
   - **Evidence:** exact `file:line` citations (verify each by actually reading the line) and/or measured values + route + role + screenshot path. Counts of occurrences for each competing treatment.
   - **Where it shows:** routes/screens and roles.
   - **Winner:** which treatment should be canonical and WHY, following the source order (design system / contract clause -> the dominant sibling pattern already in the app -> emil skills). If the contracts are silent, say "contracts silent - needs designer decision".
   - **Clause / theme:** the CONTRACTS clause it violates (or "no clause - candidate new clause") and the T-theme if any.
   - **Fix size:** number of files/sites and whether it touches a shared component.
   - **Mechanical?** could an AUTO check in scripts/check-contracts.mjs catch it? (§0.8 promotion candidate) yes/no + how.
4. "Decisions needed" table (only items where you recommend something and the designer must choose).
Be precise, verify before you claim, do not pad. Prefer fewer well-evidenced findings over many vague ones, but be exhaustive within your lane.
Your final chat reply must be a SUMMARY of at most 500 words: counts by severity, the top 8 findings (ID + one line), and the path of your report file.

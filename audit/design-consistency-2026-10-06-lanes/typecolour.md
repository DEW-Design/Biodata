# typecolour: typography hierarchy (CONTRACTS 2.9) and colour / token fidelity (2.1), delta on `audit/type-audit-2026-09-29.md`

Auditor: `typecolour`. Date of run: 6 Oct 2026. Branch `saimaniganahalli1/log-pending-decisions`, dev server http://localhost:3000.
Read-only: nothing in the repo was changed. Only `.context/audit/` was written (this file + `shots/typecolour-*.png`).

## 1. Scope and method

What I actually ran:

- **Live sweep (Playwright-core, Chromium 1243, 1708x1024, fresh context per page).** 187 page loads: 82 distinct routes
  (every route in `screen-index.ts` except the two stale drafts and `/proto`, plus 8 routes that are NOT in the index:
  `/pages/flagged-concepts`, the six `*/edit` routes, `/pages/project-detail/created`) across `biodata-admin` (80 loads),
  `registered-user` (47), `public-user` (27), `biodata-super-admin` (33: vouchers, controlled vocabulary, Home, user management, reports).
  Restricted-state loads (dsa, user-management, vouchers, ctrl-vocab, dla, nominations, reports as a role without access) were included for the lower roles.
- **78 interaction states** (opened menu / popover / modal / tab / empty search / error state): Filter menu, Columns popover, BreadcrumbSwitcher popup
  (reports, DLA, user), hero "..." menus, Approve modal, Add menu, Template Finder download menu, tooltip, Audit Log tab and "Show all changes", project page tabs, user record tabs
  (Overview/Roles/Permissions), nomination and notification record tabs, taxonomy tree view, Explore search results (option 1 and 2), Add Project validation error and
  "Draft saved" toast, DLA "Add location" modal, empty-search state on 12 lists, form error states, keyboard focus rings (Tab x22 on DSA list, x24 on DSA new, DLA record, login), hover on 11 table rows, hover/selected on tabs and column-2 tabs.
- **Per text node** (23,519 nodes) I read `getComputedStyle` for family, size, weight, line-height, letter-spacing, text-transform, colour (converted to hex through a canvas, so `color-mix`/`oklab` resolve), tabular-nums, font-style, `text-wrap-style`, then assigned a ROLE with DOM heuristics (tag, ARIA role, `th/td` + cell index, ancestor `aside/header/nav/dialog`, badge geometry, gradient ancestor). Roles are heuristics: the "button hNN" bucket also catches card-like buttons, and "other" is the residue (label/value rows, captions). I checked every finding below against the DOM and the source line, not the bucket.
- **Per element colour** (45,205 element-colour observations): background, text, border (per side, width > 0), outline, box-shadow colours, SVG fill/stroke, diffed against the flattened `contracts/figma-colours.json` (base + semantic + 8 primitive scales, 79 values + 2 not-yet-ingested scales). Also: every `background-image` gradient, every bordered card surface (radius >= 8, > 200x60), every horizontal divider, page / rail / column-2 / header backgrounds, every status badge (text -> bg, fg, border), links, disabled controls, form controls and placeholders.
- **Static:** `grep` of arbitrary Tailwind values, `!` modifiers on type, `style={{`, hex literals, font overrides, `font-bold`, `italic`, `tabular-nums`, `text-balance`; a computed-style probe of 19 class names in the browser to prove which utilities compile; `npm run check:contracts` (passes: "Contracts: OK"); read of `/emil-typography` and `/emil-design-foundations` and applied as the judging layer (tabular figures, balance, small-caps tracking, token colours, disabled token vs opacity, italic only for citations, focus rings).
- **Zero console errors and zero `pageerror`** on all 187 loads and 78 states.

What I did NOT cover (honest gaps):

- Mobile widths; dark surfaces other than gradient cards; print stylesheet (`map-search/export-utils.ts:67-72` is a separate Arial print sheet with its own hex, noted only).
- The text editor (`components/base/text-editor`) is only reachable on step 3 of New notification; I could not get a live editor on screen, so its type is static only (`text-editor.tsx:125`: `text-sm leading-[1.5]`, i.e. 14/21 against Input's 14/20).
- `ButtonUtility` is not used under `app/pages` (0 files); static read only.
- Tooltip body text, toast variants other than "Draft saved", selected table rows, and hover on cards were not captured.
- Direct URL loads of `/pages/vouchers/1012`, `/pages/vouchers/option-2/1012` and `?record=` render an EMPTY `<main>` for BioData Super Admin (0 characters after 5 s, no error, no console message); they only work through a click from the list. I measured the screen through the list instead. This is outside my lane but is a T11 / blank-state finding for whoever owns Voucher Management (screen-index.ts lists these as deep links).
- My page-background sampler at fixed coordinates sometimes hit the floating Prototype tools bar (flindersViolet #4a465d); I discarded those samples. All Scaffold chrome (tools bar, agentation toolbar, Leaflet internals) is excluded from the counts.
- Counts below are DOM nodes across role-repeated loads (the same screen is loaded as up to 4 roles), so I give both node count and "screens" (role + route pairs).

## 2. What holds

- One product typeface: 24,613 of 24,631 text nodes are Barlow (the other 18: Fredoka on the marketing hero, plus a visually hidden react-aria "N options available" live region in Geist). Weights in product screens are 400/500/600 only (700 only on `biodata-home`, the auth wordmark and 3 marketing nodes).
- D5 holds: scientific names compute `font-style: italic` in Barlow itself (a loaded italic), `font-synthesis: none` is on `html` (`globals.css:571`).
- Record hero title is one treatment: 24/600/32 white on gradient, 69 of 69 screens. Table header is one treatment: 12/600/16 quaternary, 1,285 nodes, 67 screens, no minority.
- Badge text is one treatment: 12/600/12 uppercase 0.3px; the status colours for Active, Rejected, On hold, Under review, Draft, Closed, Cancelled, Low/Medium/High are identical on every surface (but see COL-1 for the ones that are not).
- The hero gradient is the same on 106 elements (`brand-900 0% -> brand-800 63.942% -> brand-700 100%`): every RecordHero, the Home banner and the report heroes.
- Row hover is one token on 11 of 11 tables (`bg-secondary`, #f8f8f7). Card border is one token (`#e5e4e2`, 12px radius) on 94+ cards; divider colour is `border-secondary` (#e5e4e2) on 756 of 756 horizontal dividers in product shells (the exceptions are state borders: brand, amber, and gray-300 dropzones).
- Breadcrumb is one treatment on 153 screens (14/400 tertiary, current 14/400 primary). Back link is one treatment on 68 screens (14/500 tertiary).
- Caption/meta has converged: 12/400 tertiary on 640 nodes / 71 screens (quaternary only 21 nodes / 5 routes).
- Changing numbers use tabular figures in the pagination buttons (14/500 tnum, 65 screens), CountBadge, the rail badge, MetricTile, KPI values and project-page counts (D-list item "tabular-nums pagination" done).
- Wrapping description copy is almost entirely `text-balance` (680 balanced nodes; only the gaps in TYPE-13 are unbalanced).
- No product text under 12px except the two accepted 10px exceptions (org pill, rail count).
- No hard-coded hex in product pages outside `biodata-home` (marketing), the print sheet and 3 component files listed in COL-4.

## 3. Part A: status of each open decision of the 29 Sept audit, against today's code

Status words: **done**, **open**, **better**, **worse**, **regressed**. Counts are fresh (live count first, source count second).

| # | Item | Status today | Fresh evidence |
|---|---|---|---|
| A1 | `text-md` dead class (D1) | **open, slightly better** | 55 non-comment uses in 26 files (was 63; `contracts/baseline.json` 2.1a = 55), still resolves to 14px / **21px** (probe: `text-md` -> `14px / 21px`; body is 14px / 1.5). 314 live nodes carry the 21px line height: the header avatar initials on every screen, `Tabs size="md"` on 29 screens (vs 20px at `sm`, 14 screens), Input `md` (223 + 52 + 28 nodes), Select / ComboBox triggers (37px high), Button `lg` on biodata-home. See TYPE-1. |
| A2 | Docs vs code scale (D3) | **open** | `app/(docs)/primitives/typography/page.tsx:10-14` unchanged: lists `text-md` 16/24, xs 12/**18** (code 12/16), xl 20/**30** (code 28), Display lines 90/72/60/44/38/32 and tracking -1 to -2% (code: `clamp()` sizes at 1.5 line-height, no tracking). Measured: display-xs 24/36, display-sm 30/45. |
| A3 | `text-quaternary` contrast (D4) | **known / accepted** (decision 2026-09-30-16) | not re-raised |
| A4 | Italic synthesized (D5) | **done** | live italic nodes all `Barlow`; `layout.tsx:32` loads `["normal","italic"]`. |
| A5 | Sub-12px text (D6) | **better** | only the accepted 10px org pill (99 screens + 2 hand-built copies `project-detail-view.tsx:508`, `observation-detail/page.tsx:373`, `components/scaffold/breadcrumb.tsx:61`) and rail count (35 screens, `primary-rail.tsx:51`). The "Primary" chip (`registration-summary.tsx`) no longer exists; `avatar-count.tsx` (10/700) is used only by marketing/docs. |
| B2 | Card and section headings (D2) | **done, with residue** | 140+ headings now 600. Residual medium: `flagged-concepts/page.tsx:109` (h1 18/500), `project-detail/flagged-home-queue.tsx:46` (h2 18/500, shown on admin Home), `project-detail/project-detail-template.tsx:115` (h1 18/500). Home `TaskItem` title is `p` 16/500 (`home-dashboard.tsx:189`, also the DLA review banner `dla-list.tsx:65`). The size split (14 / 16 / 18) is NOT fixed. See TYPE-6. |
| B1 | Page title (H1) | **better** | hero 24/600 (69), shell 18/600 (21), plain `observation-detail` H1 24/600 (`observation-detail/page.tsx:974`), `sm:text-3xl` is gone. The 18/500 residue above. List pages carry the title as an `h2` (SectionHeader), no `h1` on lists or on any auth screen. |
| B3 | Modal vs alert vs toast title | **open** | dialog title 16/600 **primary** ("Approve request", `h2.text-base`), alert and toast title 14/600 **secondary** ("Details missing", "Draft saved"). See TYPE-7. |
| B4 | Field label | **open** | `Label` 14/500 secondary (115 nodes, 41 screens, plus 287 hand-built `p` of the same look, 91 screens); `Field` in `dla-detail.tsx:56-62` and `dsa-detail.tsx:60-66` 14/500 **tertiary**; `RecordRow` label 14/**400 secondary** (`record-hero.tsx:76`); `MetaField` 12/600 uppercase. See TYPE-4. |
| B5 | Read-only value weight | **open** | 14/400 primary (RecordRow, 258 nodes / 26 screens) vs 14/500 primary (`dla-detail.tsx:86,420,460`, `dsa-detail.tsx:106,276,296,334`, `um-detail.tsx:95,511,634`; 123 nodes / 26 screens). |
| B6 | Label column width | **better** | 176px (`sm:w-44`) in RecordRow, `vm-record.tsx:141`, `vm-parts.tsx:337`, `record-detail.tsx:93`; 224px (`w-56`) only on the two kept/hand-built screens (`project-detail-view.tsx:629`, `observation-detail/page.tsx:494,521,621,689,745`). |
| B7 | MetaField copies | **better** | 7 product copies (was 12): `project-detail-view.tsx:600`, `observation-detail/page.tsx:453`, `artefact-lightbox.tsx:73`, `dla-detail.tsx:65`, `dsa-detail.tsx:71`, `um-detail.tsx:50`, `record-detail.tsx:727` (+2 in `/proto`). Variants remain: `gap-1` vs `gap-1.5` (record-detail), `onDark` prop vs always-white (um-detail). |
| B8 | Eyebrow | **open, small** | 68 standard sites (12/600 tracking-wide quaternary). Deviations: medium instead of semibold `record-detail.tsx:310,321`; no tracking `step-1-project-details.tsx:300`, `step-2-data-collection.tsx:177` (+1); tertiary `form-section-list.tsx:80`, `reports-landing.tsx:150`; brand `form-page.tsx:71`, `typeform-card.tsx:93`. Live: white/70 283 nodes (66 screens), quaternary 53 (24), brand-tertiary 23 (23), tertiary 18. See TYPE-10. |
| B9 | Table cells (D10) | **open, wider** | see TYPE-3. Secondary is the majority in plain columns (10,187 nodes) because the 9 new report tables are all secondary, while the list pages mix secondary and tertiary inside one table. |
| B11 | Count badges (D11) | **better** | six -> three implementations: `CountBadge` (20px, 12/600/16 tnum), `Tab` badge (`Badge` 12/600/12 uppercase tnum, same look), rail (10/600). `dla-detail` copy and `TableCard.Header` uppercase badge are gone. See TYPE-14. |
| B12 | Chips vs Badge | **open** | still 5 local sentence-case chips (`landscape-editor.tsx:72`, `project-tab.tsx:113`, `landscape-view.tsx:47`, `results-table.tsx:370`, `species-photo-carousel.tsx:82`; live 12/500 h26 gray, 18 nodes on the project page); `BadgeWithDot lg` is `text-sm` (`badges.tsx:221`) where `Badge lg` is `text-base` (`badges.tsx:151`). |
| B13 | Caption / meta | **better** | 12/400 tertiary 640 nodes / 71 screens vs quaternary 21 / 5 routes (DLA and nominations list sub-lines `dla-list.tsx:187,358`, upload hints, 2 on Home). |
| B15 | Input text | **open, partly fixed** | `base/textarea` is now 14px (`textarea.tsx:36-39`, fixed). Still: Input / InputNumber / Date 14/400; Select, ComboBox, MultiSelect selected values 14/**500** (`select.tsx:78`, `combobox.tsx:132`, `multi-select.tsx:244,251`); NativeSelect 14/500 (87 nodes: rows-per-page, filters) but 14/400 inside an InputGroup (32 nodes, notifications). `components/custom/textarea/textarea.tsx:66` is 16px (docs only, not in product). |
| B17 | KPI value (D8) | **open, worse** | see TYPE-5: 36/400, 36/500, 24/500, 18/500 in product, plus 30/700 and 24/700 on biodata-home. The reports added `MetricTile` usage (18/500) and the project page uses it at 24/500. |
| B18 | Empty states | **better but split** | `ListEmptyState` (18/600 + balanced body + "Show all X") on 7 of the 12 lists tested; a bare grey line on 5. See TYPE-2. |
| B21 | Nav and tree groups | **better** | depth-0 label 12/600 uppercase quaternary 105 nodes / 79 screens; column-2 item 14/600 (brand-700 selected, quaternary inactive); FormSectionList item 14/600 secondary; tree rows 14/600 secondary (taxonomy, Survey records) but 14/600 tertiary on project option 2 (`project-detail-view.tsx`, 23 nodes). |
| C | Wordmark (D7) | **open** | header 17/600 -0.425px (`app-header.tsx:61`, `text-[17px]`, 156 screens) "BioData SA"; auth 30/700 brand "Biodata SA" (`auth-shell.tsx:22`, 30 screens); biodata-home `text-[17px]` (`page.tsx:520`) + Fredoka hero. Two spellings. See TYPE-11. |
| C | `text-display-xs` on paragraphs | **open** | `setup-profile/page.tsx:126,190,288` (24/600 brand `p`), `typeform-card.tsx:97` (h2), `landscape-view.tsx:120`. |
| C | Curly quotes (D12) | **open** | 142 rendered text nodes with a straight apostrophe vs 12 with a curly one; within one control family the empty-search message is curly on Notifications (`nt-list.tsx:122`) and straight on Taxonomy (`tx-records.tsx:187`). |
| C | `text-pretty` vs `text-balance` | **open, small** | 163 `text-balance`, 5 `text-pretty` (all in `guest-home.tsx`); the 5 are measured as balance-less on the public Home. |

## 4. Part B: findings

Severity is by how many screens carry the minority treatment and how visible it is. Theme tags follow the brief.

### TYPE-1 [HIGH] `text-md` still compiles to nothing: a 1px line-height split between controls of the same family (T3, T1)
- **What:** `text-md` is a known-dead class (CONTRACTS 2.1) kept alive by a ratchet. It renders 14px with the body's inherited 21px line height, so any component that asks for `md` is 1px taller than the same component at `sm`.
- **Evidence:** 55 uses / 26 files (`components/base/input/input.tsx:88,94`, `button.tsx`, `radio-groups/*`, `select/*`, `checkbox.tsx`, `toggle.tsx`, `avatar*.tsx`, `tabs.tsx:75`, `home-dashboard.tsx:94,491,655`, `projects/page.tsx`, the docs page). Browser probe: `text-md` -> `fontSize 14px, lineHeight 21px`; `text-sm` -> 14/20. Measured: Input `md` 37px high (`/pages/notifications/new`, `/pages/dsa/new`: 720px field) beside the date picker at 36px in the same form; Select trigger 37px; tab 33px (`md`, 29 screens) vs 32px (`sm`, 14 screens); Button `lg` text 21px (biodata-home). 314 text nodes at 21px. The Home banner subtitle "Platform activity at a glance" is `text-md text-white` (`home-dashboard.tsx:491,655`).
- **Where it shows:** header avatar on every screen; DLA/DSA/nominations/user/ctrl-vocab/vouchers/report record pages (Tabs md); every form (Input md); notifications and DSA forms.
- **Winner:** contracts prohibit the class (2.1) but are silent on the value; D1 is waiting on the Figma frames for Input / Button / Tab. Whatever Figma draws, the 20 vs 21 split must go. Designer decision.
- **Clause / theme:** 2.1 known-dead, 2.9; T3, T1 (heights).
- **Fix size:** 26 files, shared components (Input, Button, Tab, Select, Checkbox, Toggle, Radio, Avatar).
- **Mechanical?** Already AUTO 2.1a but only ratcheted at 55 lines; a "no new" guard exists, the removal needs the decision. A live check (`getComputedStyle` of Input md vs sm height) is not in the AUTO set.

### TYPE-2 [HIGH] Empty search/filter states: two treatments across the list screens (T11, T2)
- **What:** CONTRACTS 4.2e requires `ListEmptyState` (icon, 18/600 title, one balanced line, a named action). Five list screens still render a bare grey sentence, and the sentence is built differently each time.
- **Evidence (live, empty search "zzzzqq", admin/super-admin):**
  - `ListEmptyState` (18/600 primary heading, 14/400 tertiary balanced body, secondary button "Show all X"): DLA, DSA, Nominations, Projects, Template Finder, Data Ingestion report, Project Detail report (7 of 12 screens tested).
  - Bare 14/400 tertiary line: Notifications (`nt-list.tsx:122`, `nt-list-2.tsx:148`, with a brand link button "Clear search and filters"), Taxonomy (`tx-records.tsx:187`, no action, **straight** quotes `"zzzzqq"`), User Management (`um-lists.tsx:116`, "Nothing matches your search and filters.", no action), Controlled Vocabulary (`cv-list.tsx:145`, link button), Vouchers (`vm-list.tsx:117`, link button). Also record-tab lists: `cv-detail.tsx:101`, `um-detail.tsx:495,619`, `dsa-detail.tsx:321`.
  - Inline project-page empties are a third style: "No datasets yet. Uploading one adds its ..." and "No restrictions. ..." as 14/400 tertiary `p`, not balanced (`project-details-view`, `/pages/project-list/*/project-details`); `observation-detail` has "No custom properties" 14/500 + 14/400 body.
  - Quote glyphs: Notifications, Controlled Vocabulary, Vouchers use curly “ ”; Taxonomy uses straight ".
- **Winner:** `ListEmptyState` (contract 4.2e names it; 13 files already use it).
- **Clause / theme:** 4.2e (REVIEW only), 2.3 (balance), T11, T2.
- **Fix size:** 6 list files + 4 tab-list sites. No shared component change.
- **Mechanical?** Yes: in `app/pages`, a `<p className="... text-tertiary">` whose text matches `/match|Nothing matches/` outside `ListEmptyState`. This is the second recurrence of the Section 4.2e bullet ("first occurrence ... AUTO due if it recurs"), so Section 0.8 says the check is now owed.

### TYPE-3 [HIGH] Table body cells: lists and reports disagree, and lists disagree with themselves (T3; D10 open)
- **What:** Plain columns are 14/400 but in two colours. Every new report table uses secondary; the list pages mix secondary and tertiary inside one table; sub-lines are 12/400 in two colours, plus a 14px description and two italic sub-lines.
- **Evidence (live node counts, per route):**
  - Lists, mixed in one table: DLA 18 tertiary + 9 secondary (`dla-list.tsx:186` secondary requestor, `:192,:199,:207` tertiary); DSA 28 secondary + 14 tertiary (`dsa-list.tsx:192,207` secondary vs `:196,:225` tertiary); Nominations 14/14; Notifications 39/13; User Management 32/32; Roles 27 secondary + 48 tertiary; Permissions 40 secondary + 120 tertiary.
  - Reports: all 9 new reports + dla/dsa-agreement reports are secondary (`report-table.tsx:78,92,110` `text-sm text-secondary`), 10,187 nodes. Same role, different colour on the sibling screen of the same collection: `/pages/dla` tertiary vs `/pages/reports/dla-agreement` secondary.
  - First (identity) column: 14/500 primary on 25 list screens (957 nodes); 14/400 tertiary on Projects (`BD-5039`, 176 nodes, 11 screens); 14/400 secondary tnum on the seq-first report tables (project, species, DLA, DSA, events); 14/600 tertiary on tree views (111 nodes, project option 2).
  - Sub-line: 12/400 tertiary (395 nodes, projects/notifications/templates/reports) vs 12/400 **quaternary** (DLA requestor organisation `dla-list.tsx:187,358`, Nominations species) vs 12/400 quaternary **italic** (`nomination-list.tsx:234`) vs **14**/400 tertiary (Permissions description, 40 nodes; Taxonomy scientific name `tx-records.tsx:209` italic, 14 nodes).
  - Dates in lists are not tabular (233 nodes, 12 screens: `dla-list.tsx:207`, `dsa-list.tsx:225`), dates in reports are (`report-table.tsx:92` tabular).
- **Winner:** design-system source is silent; the previous recommendation (D10: identity 14/500 primary, others 14/400 tertiary, sub-line 12/400 tertiary) matches the majority of the list pages and the sub-line majority; secondary is used by reports. Contracts silent: designer decision, but one rule for lists AND reports.
- **Clause / theme:** 2.9 item 2, T3.
- **Fix size:** about 8 list files and `report-table.tsx` (one component), no component API change.
- **Mechanical?** Partly: a check that a file with `Table.Cell` never mixes `text-secondary` and `text-tertiary` for `text-sm` spans in the same file is feasible but noisy.

### TYPE-4 [HIGH] Read-only label/value: three layouts and two value weights (T3; D9 open, T6)
- **What:** The same "a fact on a record" is drawn as (a) `RecordRow`: row, label 14/400 secondary, value 14/400 primary, 176px label column; (b) `Field`: stacked, label 14/500 tertiary, value 14/400 primary (`dla-detail.tsx:56-62`, `dsa-detail.tsx:60-66`); (c) `MetaField`: stacked, label 12/600 uppercase quaternary (or white/70), value 14/400. Values inside the DLA, DSA and user records are then 14/500 primary (spans) where `RecordRow` values are 14/400.
- **Evidence:** live "other" role: 14/400 primary 258 nodes / 26 screens vs 14/500 primary 123 / 26; label 14/500 secondary 287 / 91 vs 14/400 secondary 173 / 26 vs 14/500 tertiary. `MetaField` copies in 7 product files (Part A B7); `DetailRow` forks at `project-detail-view.tsx:626` and `observation-detail/page.tsx:481` (224px label column).
- **Where it shows:** DLA, DSA, user, nomination records; project option 2; observation detail; Explore record panel (`record-detail.tsx:727`).
- **Winner:** `RecordRow` (record-hero.tsx:73-79): it is the shared component the record pages are told to borrow (4.6) and the new reports use; value 14/400 (the project page's own rows).
- **Clause / theme:** 2.9 items 1 and 2, 0.9; T3, T6.
- **Fix size:** about 10 files; extract one `RecordField` (hero-variant) to replace 7 `MetaField` copies.
- **Mechanical?** Yes: `function MetaField` / `function DetailRow` / `function Field` defined outside `record-hero.tsx` fails (the same pattern as AUTO 1.7 for components).

### TYPE-5 [MED] KPI value and label: four value shapes, four label shapes (T3; D8 open)
- **What:** Same role, different weights and sizes.
- **Evidence (live and source):** value 36/**400** primary (`bento-card.tsx:43`, `data-overview.tsx:127`: public and registered Home, 3 screens), 36/**500** (`home-dashboard.tsx:515`, admin Home), 24/500 white on the banner (`home-dashboard.tsx:93`) and 24/500 primary on the project page (`project-tab.tsx:469`), 20/500 (`bento-card.tsx:35`), 18/500 (`metric-tile.tsx:54`, reports error counts and project-page tiles; 36 nodes / 10 screens). Labels: 12/600 uppercase quaternary (MetricCard md), 14/500 white (banner), 14/400 tertiary (MetricTile), 12/500 tertiary (MetricCard sm). biodata-home adds 30/700 and 24/700 (marketing).
- **Winner:** previous D8 (value 36/500 tabular, label eyebrow; small variant 24/500). Contracts silent; designer decision.
- **Clause / theme:** 2.9, T3. **Fix size:** 5 components. **Mechanical?** No (judgement).

### TYPE-6 [MED] Card / section heading: three sizes in play, three medium stragglers, and `!` overrides (T3)
- **What:** After D2 every heading is 600 except three, but the size per role is not settled: 14/600 on record-page cards (`dsa-detail.tsx` "Agreement requested by", project page "Datasets", 10 + 6 screens), 16/600 on the report cards, the Explore card ("Search the map", 10 screens), Home cards ("DLA requests", "Featured Projects"), 18/600 on Home sections (84 nodes / 59 screens). Residual 500: Section 3 B2. Home `TaskItem` titles are 16/500 `p` (`home-dashboard.tsx:189`).
- **Related:** nine headings fight their own element with `!` modifiers (`m-0! text-lg! font-semibold! tracking-normal! text-primary!`): `list-empty-state.tsx:29`, `artefact-table.tsx:66`, `walkthrough-modal.tsx:83`, `dla-detail.tsx:531`, `dsa-detail.tsx:442`, `nomination-list.tsx:159`, `record-peek-card.tsx:73`, `project-registration/option-2/review-section.tsx:34`, `observations-search.tsx:2137`. Nothing in `globals.css` styles bare headings, so the `!` is dead weight and, on a real component heading (`Heading slot="title"`, walkthrough modal), it restyles text inside a real component at the call site.
- **Winner:** hierarchy rule from the docs: section 18, card 14 (project page), with 16 only where there is no 14. Designer decision needed for the 16 group (reports cards, Explore card).
- **Clause / theme:** 2.9 items 1-2; T3. **Fix size:** about 12 sites + 3 residual. **Mechanical?** `!` on type utilities in `app/pages`: yes (AUTO candidate, 9 hits). `font-medium` on `h1-h3`: yes.

### TYPE-7 [MED] Modal title vs alert/toast title (T3; conflict B3 open)
- Dialog title 16/600 **primary** (`Approve request`, `walkthrough-modal` 18/600 with `!`), alert and toast titles 14/600 **secondary**; menu items 14/600 secondary (hero "..." menus, 30 nodes / 6 screens) while listbox options are 14/500 primary (DLA switcher 36 nodes). Winner: design system (each is a real component; the difference is inside `Modal`, `Alert`, `Toast`, `Dropdown`); contracts silent: designer decision. **Fix size:** 3 shared components. **Mechanical?** No.

### TYPE-8 [MED] Scientific names: italic is right everywhere that renders one, but not at one size or colour, and 3 places are not italic (T3)
- **What:** Italic is applied on 63 distinct names across 22 source files. Size/colour varies: 14 tertiary (`tx-records.tsx:209`, `species-view.tsx:340`, `record-inspector.tsx:261`, `record-panel.tsx:813`, `species-picker.tsx:115`, `record-peek-card.tsx:74`), 12 tertiary (`records-explorer.tsx:573`, `species-view.tsx:405`, `nomination-form.tsx:319`, `result-card.tsx:54`), 12 **quaternary** (`nomination-list.tsx:234`), 16 tertiary (`record-full-view.tsx:382`), 14 primary (report cells), 14 white/80 on a hero.
- **Not italic (live):** `/pages/ctrl-vocab/BIODATA-115` ("Malurus cyaneus", 10 nodes, `td` plain), `/pages/project-list/kangaroo-island/project-details/occurrences/occ-7` ("Lasiorhinus latifrons" in a `font-medium` span, 3 nodes), `/pages/taxonomy/P01937` ("Eucalyptus" genus in a `dd`). (`Xanthorrhoeaceae`/`Grevillea` matches are false positives.)
- **Winner:** italic, tertiary, at the row's own size (the 14 tertiary group is the plurality: 6 sites). **Fix size:** 4 + 3 sites. **Mechanical?** No (needs data awareness); could grep for a `scientific` field rendered without `italic`.

### TYPE-9 [MED] Input text weight across the field family (T3; conflict B15 open)
- Input / InputNumber / InputDate / Textarea 14/400; Select / ComboBox / MultiSelect / NativeSelect selected value 14/**500** (`select.tsx:78`, `combobox.tsx:132`, `multi-select.tsx:244`; native `select-native.tsx:53`); the native select drops to 400 only inside an `InputGroup` (32 nodes, notification forms). Line height 20 vs 21 (TYPE-1). Winner: Input (14/400); a selected value is data, not a label. **Fix size:** 4 shared components. **Mechanical?** No.

### TYPE-10 [MED] Eyebrow and section-label variants (T3; conflict B8)
- Live: white/70 on gradient 283 nodes / 66 screens (RecordHero), quaternary 53 / 24 (card eyebrows), brand-tertiary 23 / 23 (form header, `form-page.tsx:71`), tertiary 18 / 3 (Reports landing group headings are `h2` 12/600 uppercase **tertiary**, `reports-landing.tsx:150`; Add Project option 2 `form-section-list.tsx:80`), 1.8px tracking on biodata-home. Column-2 section label is quaternary on 105 nodes / 79 screens and tertiary on 6 / 2 (project-registration option 2). Static: no tracking at `step-1-project-details.tsx:300`, `step-2-data-collection.tsx:177` (+1); medium at `record-detail.tsx:310,321`. Winner: quaternary for labels on the page, white/70 on the gradient, brand only for the form step eyebrow (already the pattern). **Fix size:** 6 sites. **Mechanical?** Yes for "uppercase without tracking" and "uppercase with font-medium".

### TYPE-11 [MED] Auth screens and the wordmark: a second type scale, no headings, two spellings (T3, T9, T12)
- **What:** All 10 auth screens set the page title as a `p` 20/600 (no `h1`; 0 headings on any auth page), body `text-base` 16/400 secondary where the product is 14, wordmark 30/700 brand-tertiary "Biodata SA" (`auth-shell.tsx:22`) versus the header's 17/600 "BioData SA" (`app-header.tsx:61`). Titles mix Title Case ("Account Created!", "Forgot Password?", "Set New Password", "Setup your Profile") with sentence case ("Check your email", "Sign in to your account"). Setup-profile uses `text-display-xs` 24/600 brand on a `p` (`setup-profile/page.tsx:126,190,288`).
- **Winner:** header wordmark = logo lockup exception (D7), documented; sentence case (contract voice). Contracts silent on auth body size: designer decision.
- **Fix size:** auth-shell + 10 titles. **Mechanical?** Partly: `<p className="text-xl font-semibold">` in `auth/**`.

### TYPE-12 [MED] Dates: four formats and a tabular split (T12, T3)
- Measured month abbreviations: "Sep" 101 nodes (two hand-written `formatShortDate` copies, `dla-data.ts:147` and `dsa-data.ts:81`: DLA, DSA, nominations, notifications, ctrl-vocab, vouchers, dashboard) vs "Sept" 316 nodes (`Intl` en-AU: `um-data.ts:98`, `ingestion-report-data.ts:396-398`, `post-ingestion-report-data.ts:119`, `survey-data.ts:1048`, `tx-store.ts:53`: all reports, user management, permissions), both on `/reports/dla-agreement` and `/reports/dsa-agreement`; long month ("30 July 2026") 243 nodes; ISO (`2026-05-14`) 63 nodes (occurrence record, SpecimenDB report). Tabular: reports yes, lists no (TYPE-3). Winner: one shared formatter ("Sep", tabular figures; en-AU's "Sept" is an ICU quirk, not a choice). **Fix size:** 2 copies + about 8 `Intl`/`toLocaleDateString` call sites. **Mechanical?** Yes: ban `toLocaleDateString` / `DateTimeFormat("en-AU"` and a second `formatShortDate` in `app/pages`.

### TYPE-13 [LOW-MED] Wrapping copy without `text-balance` (CONTRACTS 2.3)
- Live (lines >= 2, `text-wrap: auto`): auth success/body copy `p.text-base.text-secondary` (3 routes, `account-created` etc.), DSA/DLA edit hint "Set when this agreement was submitted ..." (`p.text-sm.text-tertiary`, 3 routes), project page empty lines ("No datasets yet ...", "No restrictions ..."), Add Project option 1 sub-copy (`text-xs hidden sm:block`, `text-base text-tertiary`), Permissions list description (user-management/permissions, 24 nodes), notification mail preview body (acceptable: it imitates an email), public Home body copy (`text-pretty`, `guest-home.tsx:86,116,149`). Everything else measured balances. **Fix size:** about 8 sites. **Mechanical?** Yes for static paragraphs: a `<p className>` with `text-sm|text-base` and no `text-balance|text-pretty|truncate|line-clamp` is noisy, so do it as a live check.

### TYPE-14 [LOW] Count badges: three implementations (D11 better)
- `CountBadge` 12/600/16 tnum (44 + 22 nodes), `Tab` badge via `Badge` 12/600/12 uppercase tnum (17 + 17 + 14 screens; visually the same circle), rail 10/600 (accepted). Remaining: a numeric badge without `tabular-nums` is the form section list "0 of N sections complete" (`form-section-list.tsx:73`, changes as the person works) and the step markers (static). Winner: `CountBadge` for a number by a label. **Fix size:** 1-2 sites.

### TYPE-15 [LOW] Empty value marker: five spellings and three colours (T11, 2.3)
- "Not provided" quaternary (67 nodes, the contract), "Not applicable" quaternary (16, permissions/roles), "None" tertiary (79 in the Ingestion report; 2 primary elsewhere), "Not set" quaternary (`dla-list.tsx:203`), and a bare "-" (`observation-detail`: 42 primary + 39 tertiary nodes, project-detail table 39, `occ-7` 15 at 14/500). 2.3 says "Not provided", never a stray `-`. **Fix size:** about 6 sites. **Mechanical?** Yes: JSX text exactly `-`.

### TYPE-16 [LOW] Straight quotes (D12) and ellipsis
- 142 rendered nodes with straight apostrophes vs 12 curly; recommendation unchanged (curly for new copy, a check for `'` in JSX text). Ellipsis is the `…` character (4 nodes), no `...` rendered.

### TYPE-17 [LOW] Docs typography page still disagrees with the code (D3)
- See Part A A2. Unchanged since 29 Sept; waits on TYPE-1.

### TYPE-18 [LOW] Semantics: list pages and auth pages have no `h1`
- Lists render the title as `h2` (`SectionHeader.Heading`), shells as `h1`; auth none. Visual type is right; document outline is not. Low because the designer has not raised it.

### COL-1 [HIGH] The same status label has different colours on different screens (T3, T11)
- **What:** Status is the highest-signal colour in the product and it is not one mapping.
- **Evidence (live, per-status badge bg/fg):**
  - **Approved:** brand teal (#edf7f9 / #0d576e) on DLA, DSA, DLA/DSA agreement reports, nominations (16 nodes; `agreement-status.ts:49`) but **green** (#ecfdf3 / #067647) in the Data Ingestion and Post-ingestion reports (82 nodes; `ingestion-report-data.ts:40`, `dataset-data.ts:55`).
  - **Submitted:** brand teal on DLA, DSA, nominations (`agreement-status.ts:46`, `nomination-data.ts:23`, `dataset-data.ts:51`) but **green** in the Ingestion report's Submission column (186 nodes; `ingestion-report-data.ts:34`).
  - **Completed:** **blue** #eff8ff / #175cd3 / #b2ddff (Untitled `blue`, not in Figma) on the Projects list and Post-ingestion report (27 nodes, `project-list-data.ts:71`) but **gray** on the project page hero (`Completed`, 7 nodes) and Explore events (`search-data.ts` `statusColor: "gray"`).
  - **Current:** green on Taxonomy (14) vs a white bordered gray "Current" chip, radius 6, on the Audit Log (`audit-feed`).
  - **Size / shape of the same badge:** 24px high on records, **16px** with a dot on the project page hero (`Active`, `Completed`, 9 nodes), **30px** (`lg`) on notification and vocabulary edit pages (2 nodes), 20px / 24px for plain counts.
- **Winner:** the 3-colour semantic set the app already uses (success green for done/live, warning amber, error red, gray neutral) and brand for in-flight is the dominant pattern in the agreement family; the Ingestion report uses green for "Approved/Submitted". Needs a status-colour table; contracts silent. At minimum "Approved" must be one colour. Designer decision.
- **Clause / theme:** 2.9 item 2 (same role same treatment), 2.1; T3, T11.
- **Fix size:** 5 status maps; no component change.
- **Mechanical?** Yes: a registry check that each status label maps to one colour across `*-status.ts` / `*-data.ts` maps (a shared `statusColour(label)` would remove the problem).

### COL-2 [HIGH] Focus ring: three colours and four offsets, one of them the browser default (2.1, 1.9 item 4)
- **What:** Keyboard focus is drawn in a different colour depending on the control.
- **Evidence (live, Tab key):** header and rail buttons, auth links and every `Button` (`Add`, `Sign in`): solid 2px **#9ca9b3 (brand-300)**, offset 2 (`button.tsx:13` `outline-brand`; `globals.css:420` `--ui-outline-brand: brand-300`). Table-page action rows, tabs, legal links, form step list, "Switch request" crumb: solid 2px **#2a667c (brand-500)**, offset 0 / -2 / 4 / 2. The header breadcrumb links ("Home", the section crumb) draw the **UA default** `auto 1px #005fcc` (blue): `components/scaffold/breadcrumb.tsx:56` is a bare `<Link className="hover:text-primary">` with no focus style (every product screen). Combobox inputs report `outline: none` and rely on the wrapper ring.
- **Source contradiction:** `globals.css:385-406` records that Figma's focus ring is brand-500 ("not the paler brand-300 both tokens used to carry") and moved `--ui-outline-focus-ring` to brand-500, but `--ui-outline-brand` (the Button's token) is still brand-300. `button-utility.tsx:64` uses `outline-focus-ring` (brand-500) while `button.tsx:13` uses `outline-brand` (brand-300): two rings inside the Button family.
- **Winner:** Figma (brand-500, 2px, offset 2): the globals comment already states it. **Fix size:** 1 token (`--ui-outline-brand`) or `button.tsx`, + the breadcrumb links (1 file). **Mechanical?** Yes: any `<Link|a>` in `components/scaffold`/`app/pages` with `hover:` but no `focus-visible:`; the token change is a one-liner.
- **Clause / theme:** 2.1, 2.5, 1.9 item 4.

### COL-3 [MED] Utilities that compile to nothing in product code (the dead-class list in 2.1a is incomplete)
- Verified in the browser (`getComputedStyle` of an element carrying the class):
  - `border-brand-solid` -> border colour falls back to `rgb(46,41,37)` (`project-registration/stepper.tsx:42,43`: Add Project option 1 stepper, current and complete circles).
  - `text-success-primary` -> `rgb(46,41,37)` instead of success green (`dataset-upload/upload-dropzone.tsx:114`: the success line in the upload dropzone renders dark gray, not green).
  - `ring-bg-primary` -> `box-shadow: none` (`project-detail/project-tab.tsx:391`, `avatar-company-icon.tsx:24`, `avatar-online-indicator.tsx:25`: the white ring that separates overlapping avatars is missing).
  - `var(--color-bg-brand-solid, #7f56d9)` in `components/application/tree-view/tree-view-utils.ts:135`: that variable is not defined (only `--ui-bg-brand-solid` is), so the multi-row drag badge renders Untitled purple `#7f56d9`, which is not in the Figma set.
  - Comment-only (not live): `bg-quaternary`, `divide-secondary`.
  - `stroke-border-secondary` (payment icons, exempt).
- **Winner:** each should use the token that exists (`border-brand-600`/`bg-brand-solid`, `text-success-secondary` or the real success token, `ring-primary`...). **Fix size:** 6 sites in 5 files. **Mechanical?** Yes: add the three names to the `DEAD` regex in `scripts/check-contracts.mjs:191` (or better, compare class names to compiled CSS in CI). §0.8: this is the Nth silent-no-op class (the previous ones are why 2.1a exists).

### COL-4 [MED] Colour that traces to nothing in `figma-colours.json`
- **Palettes in `globals.css` outside the 2.1c check:** 43 of 165 hex custom properties are not in the Figma set: the Untitled `utility-slate / sky / blue / indigo / purple / pink / orange` 50-700 scales and `utility-neutral`. They are live: Completed badge (blue #eff8ff/#175cd3/#b2ddff; Badge `color="blue"` also on video artefacts `artefact-lightbox.tsx:64`, Observation record kind `record-inspector.tsx:40`), species-group dots and pie slices (orange #ef6820, blue #2e90fa / #0ba5ec, purple #7a5af8, pink #ee46bc, indigo/slate #4e5ba6: `species-group-icons.ts:27-33`, Home pie chart, 3 + 5 screens). Not a violation of 2.1c as written (that check covers primitives only), a hole in the reference.
- **Shadows:** every `--shadow-*` token uses `rgba(16,24,40,...)` = Untitled `#101828`, not the DEW warm gray-900 `#2e2925` (`globals.css:280-290`). Visible on 183 of 183 product screens (the skeuomorphic Button shadow, cards, popovers). The Figma colour reference has no Effects page; needs a designer check.
- **Chart defaults, unthemed:** Highcharts' own `#333333` title, `#666666` subtitle, `#cccccc` plot border, `#e6e6e6` grid on `observation-detail` and `biodata-home` (12 screens).
- **Component literals:** `components/base/textarea/textarea.tsx:27-28` resize handle `#D5D7DA` / `#373A41` (Untitled grays); `map-search/export-utils.ts:67-72` print stylesheet (`#2e2925`, `#706b68`, `#d2d0ce`, `#f2f2f1` are in the set; Arial font).
- **biodata-home (marketing):** `#b3dbdb`, `#f5f5f5` (`bg-[#f5f5f5]`), `#414651`, 11 uses of `text-[#0d576e]` (equal to brand-700, so a token spelled as a literal), a hero overlay `rgba(10,42,51,0.72)` and an extra gradient. Exempt from the 3-column rule (3.7) but not from 2.1.
- **Winner:** Figma; the designer decides whether the utility families and the shadow base get ingested (a 1.4-tier call, 0.4). **Fix size:** reference + 6 files. **Mechanical?** Extend 2.1c to cover `--color-utility-*` and every hex custom property in `globals.css`.

### COL-5 [MED] State colours that disagree with each other (1.9 item 4)
- **Hover = selected on underline and line tabs:** `tabs.tsx:53,58` apply `(isSelected || isHovered)` the same classes, so a hovered inactive tab shows brand-700 text and a brand-500 underline, identical to the selected one (measured on `/pages/dla/DLA-2026-00502`: normal #8f8b87 / transparent, hovered #0d576e / #2a667c, selected #0d576e / #2a667c). Column-2 (vertical) tabs keep hover distinct (brand-100 selected `#dcecef`, gray-100 hover `#f2f2f1`, `tabs.tsx:31`).
- **Disabled:** `Button` disables by `opacity: 0.5` (173 + 20 nodes: pagination Previous/Next, primary buttons on auth) while other disabled controls use the gray-500 token (646 span nodes, date field segments), and `/emil-design-foundations` says a dedicated muted token, not opacity. Contracts silent: designer decision.
- **Links:** `link-color` buttons 14/600 brand-700 (45 nodes); table links 14/500 brand-700 (28); back links 14/500 tertiary (105); inline "Atlas of Living Australia" 12/400 tertiary underlined (`occ-7`); `MetaLink` brand underlined (`artefact-lightbox.tsx`). No clause fixes the in-text link style.
- **Fix size:** 1 shared component + 2 decisions.

### COL-6 [LOW] Page background and card geometry
- App canvas is `--bg-page` `#fcfcfc` (gray-25) on all shell screens; auth screens and Add Project option 1 sit on `#f8f8f7` (gray-50, `bg-secondary`); biodata-home is white. Rail and column 2 are `#f8f8f7`, header white. Card radius is 12 on 94+ surfaces; 8 on setup-profile choice cards (153 nodes) and the confirm panels; 16 on Add Project option 1; the Explore floating card alone has a shadow. Contracts silent (3.7 describes columns, not backgrounds): designer decision on the auth/Add Project canvas.

### COL-7 [LOW] The hero gradient is copy-pasted, with one stop missing
- The same class string `bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700` is repeated in 5 files (`record-hero.tsx:56`, `home-dashboard.tsx:485,652`, `guest-home.tsx:81`, `project-detail-view.tsx:1343`) with an arbitrary `via-[63.942%]` each time; `notifications/nt-email.tsx:174` omits the stop (`via-brand-800` at 50%, 3 screens). Suggest one `@utility`. **Mechanical?** Yes: a second `via-[63.942%]` outside the shared component.

### COL-8 [LOW] Arbitrary `var()` colour utilities where the utility could exist
- 15 `bg-[var(--ui-border-primary|secondary)]`, 10 `border-[var(--color-brand-500|100|error-300)]`, 5 `ring-[var(--color-brand-50|100)]` in app/pages and components (e.g. `text-editor-toolbar.tsx`, `accordion.tsx`, `project-tab.tsx:...`). They are tokens, so not a 2.1b violation, but 2.1 says to add the utility first. Counts: `text-[` 27, `bg-[` 31, `border-[` 18, `rounded-[` 23, `ring-[` 14, `stroke-[` 42, `outline-[` 6, `w-[` 330 (layout only). Non-token colours: only biodata-home and the items in COL-4.

## 5. Part C: new surfaces never audited (what was measured, what is consistent, where the treatment is new)

| Surface | Type verdict |
|---|---|
| Reports landing (cards + table view) | Cards: title `h2` 16/600 primary inside the `a` (new 16 card-heading size, TYPE-6), description 14/400 tertiary balanced, "Open report" 14/600 brand, "Not opened yet" 12/400 tertiary; group labels are `h2` 12/600 uppercase tertiary (TYPE-10); page title 18/600 as `h2`. Column 2 has a section label and no items. |
| Nine report pages | RecordHero identical to DLA/DSA (24/600; eyebrow "Report" white/70; facts label eyebrow + value 14/400 white). Tables: th 12/600 quaternary; every plain cell 14/400 **secondary**, identity 14/500 primary (TYPE-3). MetricTile 18/500 tnum value with 14/400 tertiary label (TYPE-5). Column chooser: item 14/500, "Pinned" 12/400 tertiary, "41 of 41 shown" 12/400. Filter menu items 14/500. |
| AuditLog / AuditFeed | Person name 14/500 primary, "moved this to" 14/400 secondary, date 14/400 tertiary tnum, Badge standard, "Current" chip radius 6 white (COL-1). "Show all changes" link-color 14/600. Consistent with 4.6.6. |
| BreadcrumbSwitcher popup | Search field standard; rows 14/500 primary (selected tick), foot bar "View all X" 14/600 secondary. 20 popup nodes measured; no minority. Trigger crumb 14/400 tertiary, focus ring correct (`breadcrumb-switcher.tsx:71`), unlike the plain breadcrumb links (COL-2). |
| Taxonomy | First col 14/500 primary + 14/400 tertiary **italic 14px** sub-line (TYPE-3, TYPE-8); empty search bare line (TYPE-2); tree rows 14/600 secondary + 12/600 level badges. |
| Template Finder | First col 14/500 primary + 12/400 tertiary balanced description (the standard sub-line); column 2 groups with `CountBadge`; empty state is `ListEmptyState`. |
| Vouchers | Direct deep links render blank (see Section 1); list 14/400 secondary/primary, sub-lines 12/400 tertiary, mismatch dates 12/400 **error** tnum; one `th`-like cell is 14/600 uppercase ("Status") in the batch page (hand-built header). Empty search bare line (TYPE-2). |
| Controlled Vocabulary | Same table pattern; entries grid th 12/600; "Not applicable" quaternary; BIODATA-115 species not italic (TYPE-8); empty search bare line. |
| Flagged concepts review (not in screen-index) | h1 18/**500** (`flagged-concepts/page.tsx:109`) and h2 18/500 on admin Home (TYPE-6); custom option list 14/600 secondary with 12/400 sub-line (not the DS listbox pattern). |
| Notifications management | Standard list; first col 14/500 primary + 12/400 tertiary sub-line; empty state bare line; the New/Edit selects are NativeSelect-in-InputGroup 14/400 and Select md 37px (TYPE-1, TYPE-9). |
| Pages tool / tree view | Scaffold; excluded from counts. Note only: tools bar Geist 14 white on flindersViolet-800, which is the one sanctioned use of that scale. |
| Text editor | static only: 14/21 (`leading-[1.5]`), `p-5`, toolbar buttons with arbitrary `bg-[var(--ui-border-primary)]` dividers (COL-8). |
| ButtonUtility | static: not used in product. `outline-focus-ring` (brand-500) while `Button` uses brand-300 (COL-2). |
| Explore floating search card + results | Card title 16/600 with `!` overrides (`observations-search.tsx:2137`), species name 14/500 primary + 12/400 tertiary **italic** (12px, TYPE-8) + 12/400 secondary meta; results tab labels 14/600 with `CountBadge` circles (tabs without icons, exempt per 3.13). |
| Project page tabs + record inspector | Title 24/600; section headings 18/600 ("Project at a glance", "Overview"); card titles 14/600 with `CountBadge`; counts 24/500 and 18/500 (TYPE-5); "On this page" nav 14/500 brand active / 12px sub-items; records tree 14/600 secondary (TYPE-3 first-column row); chips 12/500 sentence-case h26 (Part A B12). |
| User record (Overview / Roles / Permissions) | Tabs with `CountBadge`; roll-up lists use `RecordRow`; user name link 14/500 primary hover brand-700 underlined (`um-detail.tsx:511,634`); permission names 14/500 secondary (`um-detail.tsx:95`). Value weights as TYPE-4. |
| Nomination record | RecordHero, scientific name italic white/80 14px in the hero subtitle (TYPE-8), audit feed. |
| DLA / DSA records | `Field` 14/500 tertiary + 14/500 values (TYPE-4); mid-card headings `h2` 18/600 with `!` (`dla-detail.tsx:531`); locations card title 14/500 (`dla-detail.tsx:86`). |
| Add Project form | Option 2 uses `FormPage`; field labels 14/500 secondary; error text 14/400 error-primary; required `*` brand-tertiary 14/500 (Label) vs **600** in FormRow (`p>span` 62 nodes) vs **error red** on option 2 (1 node). Option 1 (typeform) uses 24/600 `h2` `text-display-xs`, no tracking on eyebrows (TYPE-10). |
| Dataset upload flow | Dropzone success text falls back to dark gray (COL-3); "Details missing" alert 14/600 secondary (TYPE-7). |
| Auth screens (10) | TYPE-11. |
| Home, per persona | Registered: banner 24/600, KPI 24/500 white, sections 18/600, card titles 16/600 + `TaskItem` 16/500. Admin: banner KPIs 24/500 white; "Flagged concepts" 18/500 (TYPE-6); a 36/500 count `247`; "Needs your review" 14/500 brand. Public: 36/400 KPIs (MetricCard md), body 16/400 white/80 `text-pretty`, column-2 body 14/400 `text-pretty` (the sanctioned guest aside). |

## 6. Role table as measured today

Winner = the treatment with the most nodes/screens that also matches the design-system component. "scr" = role-by-route screens. Minorities are listed with where they appear.

| Role | Winning treatment (measured) | Minority treatments (screens / where) |
|---|---|---|
| Record hero title (H1 on gradient) | 24/600/32 white; 69 nodes, 69 scr | none |
| Page / shell title | `h1` 18/600/28 primary, 21 scr (shells); list titles `h2` 18/600 via SectionHeader | 18/**500** (flagged-concepts, project-detail-template: 2 scr); 24/600 plain H1 (observation-detail, 3 scr) |
| Section heading (Home) | `h2` 18/600/28 primary; 84 nodes / 59 scr | 18/500 "Flagged concepts" (admin Home, 2 scr) |
| Card / record-panel heading | none (14/600 record cards 16 scr; 16/600 report cards + Explore + Home cards ~15 scr; 18/600 empty-state title) | 16/500 Home `TaskItem` + DLA review banner (5 scr); 24/600 notification preview; `!`-overridden at 9 sites |
| Field label (`Label`) | 14/500/20 secondary; 115 nodes / 41 scr (+287 hand-built `p`, 91 scr, same look) | 14/500 tertiary (`Field` in DLA/DSA records), 14/400 secondary (RecordRow, 26 scr), 12/600 uppercase quaternary (MetaField, 7 files); required `*` 500 (Label) vs 600 (FormRow, 26 scr) vs red (1) |
| Read-only value | 14/400/20 primary (RecordRow, 258 nodes / 26 scr) | 14/500 primary (DLA/DSA/user records, 123 nodes / 26 scr) |
| Hint | 14/400 tertiary (17 nodes / 12 scr); 12/400 at size sm (3) | none |
| Input text / placeholder | 14/400/20 primary; placeholder 14/400 `#b5b2af` (gray-400) | 14/500 (Select, ComboBox, MultiSelect, NativeSelect: 87 + ~40 nodes); lh **21** at Input md (303 nodes); OTP boxes 18/500 (verify-email); Add Project option 1 inputs 18/400 |
| Table th | 12/600/16 quaternary; 1,285 nodes / 67 scr | none |
| Table td, identity column | 14/500 primary; 957 nodes / ~48 scr | 14/400 tertiary (Projects ID, 11 scr); 14/400 secondary tnum (seq column, 5 reports); 14/600 tertiary (tree rows, 6 scr); 14/500 brand link tnum (ingestion) |
| Table td, other columns | 14/400 secondary 10,187 nodes / 64 scr (all reports, lists in part) | 14/400 tertiary (20 scr: lists inside the same table as secondary); 14/400 primary (title columns); 14/500 primary tnum (id columns); 14/400 quaternary (not applicable) |
| Table td sub-line | 12/400/16 tertiary (395 nodes) | 12/400 quaternary (DLA, nominations); 12/400 quaternary italic (nominations); 14/400 tertiary (permissions description, taxonomy italic) |
| Badge / status | 12/600/12 uppercase 0.3px, semantic 700 on 50, h24; 1,314 nodes in td | h16 with dot (project hero, 9), h30 lg (edit pages, 2); sentence-case chips 12/500 h26 (5 local sites); status **colours** differ for Approved, Submitted, Completed, Current (COL-1) |
| Count badge | `CountBadge` 12/600/16 tnum 20px circle (66 nodes / 41 scr) | Tab badge (`Badge` 12/600/12 uppercase, same look, 48 scr); rail 10/600 white (35 scr, accepted) |
| Tab (underline) | 14/600 selected brand-700, inactive quaternary; lh 21 (`md`, 29 scr) | lh 20 (`sm`, 14 scr); hover looks selected (COL-5) |
| Column-2 item | tab 14/600 (brand-700 / quaternary), 28 + 61 nodes; FormSectionList item 14/600 secondary (20 scr) | none large |
| Column-2 section label | 12/600/16 uppercase 0.3px quaternary; 105 nodes / 79 scr | tertiary (project-registration option 2, reports landing, 3 scr) |
| Eyebrow (card / hero / form) | 12/600/16 uppercase 0.3px; white/70 on hero (283 / 66 scr), quaternary (53 / 24 scr), brand-tertiary (23 / 23 scr, form step) | no tracking (3 typeform steps); medium (`record-detail.tsx:310,321`); 1.8px (biodata-home) |
| Button (DS, all sizes) | 14/600/20; primary white, secondary #585451, link brand-700 | lh 21 at lg/xl (3 scr); column-2 `ActionRow` 14/600 quaternary (22 scr) |
| KPI value | none (36/400, 36/500, 24/500, 18/500) | 30/700 and 24/700 (biodata-home) |
| KPI label | none (12/600 uppercase quaternary; 14/500 white; 14/400 tertiary; 12/500 tertiary) | |
| Dialog title / body | 16/600 primary; body 14/400 tertiary balanced | walkthrough modal 18/600 with `!` |
| Alert / toast title and description | 14/600 secondary; 14/400 tertiary balanced | none (differs from dialog title, TYPE-7) |
| Tooltip | 12/600 white (title; body not captured) | |
| Menu item | 14/600 secondary (hero menus, 30 nodes / 6 scr); sub-line 12/500 quaternary ("Coming soon") | listbox option 14/500 primary + 14/400 tertiary (Select / ComboBox / switcher) |
| Breadcrumb | 14/400 tertiary, current 14/400 primary; 153 scr | org pill 10/500 (accepted; 2 hand-built copies) |
| Back link | 14/500 tertiary; 68 scr | none |
| Pagination | page button 14/500 tnum; Previous/Next 14/600 | none |
| Empty state | `ListEmptyState`: 18/600 title + 14/400 tertiary balanced body + 14/600 button (7 of 12 lists tested) | bare 14/400 tertiary line (5 lists + 4 tab lists); inline project-page lines (not balanced); observation-detail 14/500 + body |
| Caption / meta | 12/400/16 tertiary; 640 nodes / 71 scr | quaternary (21 nodes / 5 routes) |
| Link (in text / table) | `link-color` 14/600 brand-700; table link 14/500 brand-700; back link above | 12/400 tertiary underlined (occ-7); brand underlined `MetaLink` |
| Scientific name | italic Barlow everywhere it appears | size/colour 14 tertiary, 12 tertiary, 12 quaternary, 16 tertiary, 14 primary; **not italic** ctrl-vocab/115, occ-7, taxonomy genus |
| Empty value marker | "Not provided" 14/400 quaternary (67 nodes) | "None" tertiary (79), "Not applicable" (16), "Not set", bare "-" (96 across 3 screens) |
| Auth title / body / wordmark | 20/600 `p` primary; 16/400 secondary; 30/700 brand "Biodata SA" | (the whole auth set differs from the 14-based product scale; header wordmark 17/600 "BioData SA") |
| Focus ring | none (brand-300 on Button/header/rail/auth; brand-500 elsewhere; UA #005fcc on breadcrumb links) | COL-2 |
| Row hover / selected col-2 | `bg-secondary` #f8f8f7 on 11/11 tables; col-2 selected #dcecef (brand-100), hover #f2f2f1 | none |
| Page background | `#fcfcfc` app canvas (rail/column-2 `#f8f8f7`, header white) | `#f8f8f7` auth + Add Project option 1; white marketing |
| Hero gradient | brand-900 / 800 @ 63.942% / 700; 106 elements | email preview header without the 63.942% stop (3) |

## 7. Decisions needed

| # | Decision | Recommendation | Blast radius |
|---|---|---|---|
| 1 | `text-md` (TYPE-1): make 16/24 real or retire | Check Input, Button, Tab frames in Figma; they are drawn at 14 in the product, so replace `text-md` with `text-sm` everywhere and drop the ratchet entries | 26 files, shared components |
| 2 | One status-colour table (COL-1) | success green for done/live (Approved, Submitted-in-pipeline, Current, Active), brand for "waiting on someone" only if that is the intent; Completed gray | 5 status maps |
| 3 | Focus ring colour (COL-2) | brand-500 per Figma (change `--ui-outline-brand`), add focus style to breadcrumb links | 1 token + 1 file |
| 4 | Table cell colours, one rule for lists and reports (TYPE-3) | identity 14/500 primary, others 14/400 tertiary, sub-line 12/400 tertiary, secondary not used in tables (D10) | ~9 files |
| 5 | Ingest or reject the Untitled `utility-*` palettes and the `#101828` shadow base (COL-4) | designer + Figma Effects page; extend 2.1c to cover them | globals + 6 files |
| 6 | Card-heading size (TYPE-6) and KPI shape (TYPE-5) | 18 section, 14 card (16 only where there is no 14); KPI 36/500 + eyebrow (D8) | ~12 + 5 sites |
| 7 | Auth page scale (TYPE-11) and canvas (COL-6) | bring auth to the 14-based scale, headings as `h1`, sentence case; one canvas colour | auth-shell + 10 titles |
| 8 | Disabled and hover states (COL-5) | token colour for disabled; underline tabs hover distinct from selected | `button.tsx`, `tabs.tsx` |
| 9 | Date format (TYPE-12) | one formatter, "Sep", tabular | ~6 call sites |

## 8. §0.8 promotion candidates (mechanical checks owed)

1. Bare "no match" line outside `ListEmptyState` (TYPE-2): second recurrence of the 4.2e bullet.
2. Add `border-brand-solid`, `text-success-primary`, `ring-bg-primary` to the dead-class regex, and a compiled-CSS cross-check (COL-3).
3. `!` modifiers on type utilities (`text-*!`, `font-*!`, `m-0!`) in `app/pages` (TYPE-6, 9 hits).
4. `function MetaField|DetailRow|Field` outside `record-hero.tsx` (TYPE-4).
5. Links with `hover:` but no `focus-visible:` (COL-2).
6. `toLocaleDateString` in `app/pages` (TYPE-12), JSX text exactly `-` (TYPE-15).
7. Uppercase without tracking, uppercase with `font-medium` (TYPE-10).
8. Extend 2.1c to every `--color-*` / hex custom property in `globals.css`, not only the primitives (COL-4).

## 9. Closing: next move

Order I would take: (1) COL-2 focus ring (one token, every screen), (2) COL-3 dead utilities (6 sites, one visible bug in the upload dropzone), (3) TYPE-2 empty states (a mechanical sweep plus the AUTO check), (4) COL-1 status table (needs the designer), (5) TYPE-1 `text-md` after the Figma check, (6) TYPE-3/4/5 as one "record and table consistency" pass. Raise with the designer before building anything: decisions 1, 2, 5 and 7 in Section 7 (all change shared meaning).

Screenshots: `/Users/smaniganahalli/conductor/workspaces/biodata/biarritz/.context/audit/shots/typecolour-*.png` (167 files: one per admin route, one per interaction state).

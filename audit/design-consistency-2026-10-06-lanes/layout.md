# Audit report: `layout` (visual layout consistency, measured live)

Repo: biarritz worktree, dev server http://localhost:3000, 6 Oct 2026. The working tree was being edited by the designer while I ran (ref-shell.md changed on disk mid-run), so a few early screenshots may predate a change (see LAY-27).

## 1. Scope and method

What I ran (playwright-core, Chromium headless, one browser, sequential loads, a new context per load):
- **Full sweep of the screen index** (`screen-index.ts`, 72 entries, minus the 2 stale `projects`/`projectsv2` drafts = 70) for biodata-admin, registered-user, public-user, plus biodata-super-admin on the 4 super-admin screens: **224 loads per viewport, 672 loads in total** at 1708x1024, 1440x900 and 1280x800. Each load was screenshotted (`.context/audit/shots/layout-<route>-<role>[-<WxH>].png`) and measured with getBoundingClientRect/getComputedStyle (shell, section header, toolbar, table card, pagination, hero, tablists, cards, buttons, overflow).
- **I looked at about 45 screenshots** (every list family, every record family, forms, Explore, Home x3 personas, restricted states, auth) and judged them with `/emil-design-foundations` and `/emil-surfaces` (nested radii, border vs shadow depth, one primary action, restraint, empty states).
- **Targeted probes:** All/My on DLA, DSA, nominations, projects, user management, Home (before/after rects); every tab of 19 record pages (tablist y, panel, scroller state); search typed to no match, filter add/remove, rows-per-page, page buttons on 15 list screens; Reports Cards/Table; Explore card width through default, typed, results, tabs; 12 FormPage screens; 9 modals; 7 popovers and menus; toast position; 8 map contexts incl. expanded; hero geometry on 14 record pages; badges and chips on 25 screens; load-time trace of header/aside/main.
- **Console:** 672 loads, **0 pageerror and 0 console errors**, no failed page loads. One aborted Next `_rsc` prefetch (`USR-1001`, 1280x800) is a dev artefact from navigating away. So there is no console finding.

What I did NOT cover or could not do (honest limits):
- **Classic scrollbars cannot be rendered here** (headless Chromium on macOS stays on overlay scrollbars even with `--disable-features=OverlayScrollbar`, `::-webkit-scrollbar` only takes space with `scrollbar-gutter: stable`). Every scrollbar-gutter claim below is therefore **inferred from computed `scrollbar-gutter` plus measured overflow state flips**, not from a rendered 15px shift. The one partly measured exception is the project list, where stable gutters really take 15px in my emulation (card 1295 vs 1310).
- Mobile widths, dark mode, hover/pressed states, keyboard flows: not covered. Leaflet's own internals out of scope. `/proto/**`, `projects`, `projectsv2` skipped as briefed.
- Species-card row misalignment (LAY-24) and the auth-page jump are measured/seen at 1708 only.
- I measured states I could reach with seeded data; real-size data (thousands of projects) not tested.

## 2. What holds (confirmed live)

- Shell geometry is identical on every shell screen at 1708: rail 64, column 2 286 (padding 16), header width 1708, main x 350 (or 64 with no column 2). Every list table card: radius 12, pagination bar 65 high pinned flush to the card bottom, 24px under the card (41 screens). Tables fit the viewport on every list screen at all three sizes (no list wrapper overflows).
- All/My switches (DLA, DSA, nominations, projects) move nothing: toolbar, table width and column widths are identical, only table height changes (fixed layouts work, §4.2f). No flip between All/My on column 2 either.
- Explore search card is 440px wide in default, typed, results and every results tab (height does change, LAY-26).
- Record hero geometry is identical across 14 record pages: eyebrow y24, title y44, facts label/value y92/112 (116/136 with a description line), actions at top right, "..." 28x28 at right 24, width 1596. Back link y89 on all.
- Forms are tight: header 117, close X 40x40 at top right, footer 69, FormRow label 220, field 720, Save draft + Continue right-aligned on all 11 FormPage screens that have both.
- Modals are one family: 400/480/672 wide, radius 16, title 16/600, X 36x36 at 24px, Cancel left and primary right (170px each), icons 20.
- Menus and popovers: radius 8, items 38 high with 16px icons, 12px from the trigger (Add, record "...", Filter, Columns, breadcrumb switcher, Update taxonomy). Toast: right 24, bottom 88 on the one Toaster.
- Page buttons do not move across pages 1..N (rows-per-page changes only the count of numbers). Popovers never shift the page. Persona and role load without a layout flash (single step after CSS).

## 3. Geometry table (1708x1024; outliers marked **bold**)

| Structural role | Values measured (count of screens) | Outliers |
| --- | --- | --- |
| App header height | 65 signed in (all); 64 public-user (61 loads); **103.5 / 155.8 at 1280, 103.5 at 1440 when the breadcrumb wraps** (LAY-1) | public 64 vs 65; marketing home 73 (exempt) |
| Rail / column 2 / main x | 64 / 286 / 350 (133); no column 2 -> main x 64 (55) | project-registration option 1 main x 342, pad 40/24 (exempt) |
| Column-2 present on record pages | none on 19 record routes | `observation-detail` and `project-detail/option-2` keep column 2 (LAY-12), reports landing |
| SectionHeader block | h 101 (18 lists, pad 24, divider gap 24); **117 (14 forms, pad bottom 20, gap 20); 93 (Reports landing, tabs inside, gap 16); 97 (roles/new, permissions/new); 77 (public Home)** | LAY-11 |
| Divider to search gap | 24 on 13 lists (p-6) | taxonomy 26 (toolbar row 40) |
| Toolbar search w x h | 384x36 (41) | **320 (embedded: PERM-301, ctrl-vocab detail x2); 406x37 (Explore); 668x21 (nominations/new species)**; Explore known/open |
| Toolbar row height | 36 (40 screens) | **40 where a Cards/Table or List/Hierarchy toggle (h 40) shares the row**: taxonomy, Species, Artefacts, Project records (LAY-8) |
| View toggle | Cards/Table, Tree/Table: 40 high, radius 10, right edge 24 from main | **Reports landing: in the SectionHeader top right (y89), not in a toolbar** |
| Table card | radius 12, ring/shadow, no border (47) | **project page cards radius 12 + 1px border + no shadow; record cards radius 8 + border (LAY-7)** |
| Table header / first row | **44 / 72 (lists, 18); 34 / 44 (reports, 23, `TableCard size="xs"`); 36 / 56 (embedded `size="sm"`, 6); 36.5 / 45 (project Project-records)** | LAY-9 |
| Rows-per-page default | 50 (16 lists) | **taxonomy 10, PERM-301 embedded 10** |
| Sortable headers | all lists | **taxonomy list: 0 sortable columns; ctrl-vocab entries 0** |
| Pagination bar | 65 high, pad 12/24, 0 from card bottom (47) | none |
| Empty search result | ListEmptyState: FeaturedIcon 48, icon 24, heading 18/600, centred (6 screens) | **bare 14/400 line left-aligned (UM x3, ctrl-vocab, taxonomy, notifications x2, vouchers, project Species)** (LAY-3) |
| Record back link / hero | y89 / y125, width 1596, radius 16, pad 24 | project option 2: y95 / y137 (column 2 present) |
| Hero height | 156 (project), 160, 180, 184, 200, 226 (content: optional italic line or description) | project hero 4px shorter than DLA/DSA/user (16px status badge) |
| Tablist y on record pages | 301 (DLA, DSA, user, ctrl-vocab); 325 (nominations, role, notification); 297 (project) | the 4px project offset (LAY-17); taxonomy 385 (two tab rows) |
| Tablist height | 33 (23, record pages), **32 (reports, taxonomy, dashboard, notification opt 2), 44 (Explore opt 2), 49 (public Home)** | LOW, in LAY-23 |
| Label column of label/value rows | 176 + 40 gap (RecordRow, 4 pages) | **176 + 24 (occurrence); 144 + 28 and 176 + 16 (project page); 224 + 16 (project option 2, observation-detail); label-on-top grid (taxonomy, DLA/DSA parties); value right-aligned (DLA, DSA)** (LAY-5) |
| Card radius on tab panels | 8 (DLA, DSA, nominations, user, role, occurrence, Home, option 2) | **12 (project page, taxonomy, tables)** |
| Card padding | 0 + rows px16/py12 (RecordRow), 20 (project, occurrence), 24 (side cards, dashboard, report cards) | LAY-7 |
| MetricTile | radius 6, border 1, pad 8x16 (reports, species); 8x12 (project Events) | public Home KPI tile 118 high, radius 8, pad 24, 36/400 numbers; project-records "28" 24/500 borderless |
| Status badge | 24 high, 12/600 uppercase pill (322 table, 20 main) | **project hero status 16 high, dot badge**; taxonomy hero status is plain text |
| Count badge | 20 high pill (col 2, tabs, uppercase, px 8) | **SectionHeader heading count: 20, px 0, blue circle** (LAY-21) |
| Filter chip | 20 high, 14px/600 uppercase, radius 6 | against 12px pill badges |
| Buttons | 36 (sm), 40 (md: pagination, form X), icon 20; ButtonUtility 28 (record "...", card "...") and 32; edit pencils 28 (icon 14) / 32 (icon 16) | edit pencil two sizes on the project page |
| Close buttons | form 40 (icon 20), modal 36 (20), PageBanner 36 (20, top10/right24), ExplainerCard 28 (16, top11/right11), map dialog X top 10/right 12 | LAY-15 |
| Popover offset | 12 (7 of 8) | **profile menu 4** (LAY-16) |
| Map controls | Expand 98x36 at top 12 / left 12; zoom 36x36 pair at top 16 / right 16 (17 measured); scale and attribution Leaflet default 5 / 0 | occurrence map: no Expand (LAY-14) |
| Form header / close | 117, X at (1294,24) 40x40 | **97 on roles/new, permissions/new** (LAY-10) |
| Form scroller gutter | `auto` on all 12 | LAY-4 |

## 4. Findings

### LAY-1 [HIGH] The header wraps to two or three rows at laptop widths: 65 -> 103.5 -> 155.8px (T1)
- **What:** `AppHeader` is `flex-wrap` on both groups. With a short breadcrumb it is one row (65). As soon as the breadcrumb has three crumbs or a long record name, the breadcrumb drops under the logo and "BioData SA" splits off the logo: the whole header becomes 103.5px (and 155.8px on the occurrence page, 4 lines). Rail, column 2 and main all move down by the same amount.
- **Evidence:** 1280x800: biodata-admin 103.5px on 35 loads, 155.8 on 1; registered-user 103.5 on 16 (127.5 on 1); public-user 103.5 on 20. That is every deep page: all record pages, all forms, all report pages. 27 shallow admin screens stay at 65. 1440x900: 103.5 on 6 screens (occurrence, upload, observation-detail, both notification records, voucher record). At 1708 every shell screen is 65. `app/pages/_shared/app-header.tsx:50` (`flex min-h-16 ... flex-wrap`), `:53` (left group `flex-wrap`), `:65` (right group `shrink-0`, search 395 + Add + avatar about 590px). Screenshots: `layout-project-list_kangaroo-island_project-details_occurrences_occ-7-biodata-admin-1280x800.png`, `layout-dla_DLA-2026-00502-biodata-admin-1280x800.png`, `layout-reports_data-validation-error-biodata-admin-1280x800.png`.
- **Where it shows:** 1280 and 1440 laptops, every role, every record, form and report page. The designer demos on laptops.
- **Winner:** one-row header at every width: let the breadcrumb truncate (ellipsis, `min-w-0`, middle crumbs collapse to "...", already used on observation-detail) and let the search shrink (`sm:w-64 lg:w-[395px]` to a flexible width), instead of wrapping. Reason: §3.6 "one header, top-level", §4.3, and a header that changes height between screens is the shell's worst "dancing layout".
- **Clause / theme:** §3.1/§3.6 (one header, same on every screen), §3.4 persona consistency; T1.
- **Fix size:** 1 shared file (`app-header.tsx`), maybe `breadcrumb-switcher.tsx`.
- **Mechanical?** Partly: an AUTO check cannot see wrapping, but a `npm run` Playwright smoke that asserts `header.getBoundingClientRect().height === 65` at 1280 on 5 representative routes would catch it. No static check.

### LAY-2 [HIGH] Voucher batch and record pages are blank when opened by URL (deadlock in the hydration gate)
- **What:** `/pages/vouchers/1012`, `/pages/vouchers/option-2/1012` and `/pages/vouchers/1012?record=ADH-2024-118` render the shell and an empty `<main>` forever when loaded directly (fresh browser, 6s wait, no errors). Clicking the row from the list works.
- **Evidence:** `vm-routes.tsx:35-41` renders `null` until `useVouchersHydrated()` is true; `vm-store.ts:61` (`useHydrated`) only flips after a rehydrate, and the only callers of `useRehydrate(useVmStore)` are `useDecisions` / `useEdits` (`vm-store.ts:52,57`), which live in components that are not mounted while the gate is closed. `useAllRecords` (`vm-store.ts:164`) does not rehydrate. Probe: `main.innerText` length 0 at 0.5s, 2.5s and 6s; `layout-vouchers-recheck-*.png`, `layout-vouchers_1012-biodata-super-admin.png` (blank).
- **Where it shows:** super-admin, every direct visit to a batch or record, the Pages tool, any shared link, a refresh. Also the sweep's 3 voucher detail screens.
- **Winner:** call `useRehydrate(useVmStore)` in `BatchScreen` (or inside `useVouchersHydrated`) so the gate can open; the cause is one missing call. A screen must never be blank with no state (§0.7, T11 states).
- **Clause / theme:** §1.9 item 4 (every state real: loading), T11; no layout clause.
- **Fix size:** 1 file. **Mechanical?** Partly: a smoke test that every screen-index route has non-empty `main` text after load (the sweep already does this; add `mainTextLen > 0` to a check).

### LAY-3 [HIGH] Two empty-result treatments: ListEmptyState on 6 screens, a bare grey line on 9 (T11)
- **What:** A search with no match shows the FeaturedIcon + 18/600 heading + action centred in the table area on 6 screens, but a lone 14/400 left-aligned sentence on 9 others, which §4.2e forbids ("MUST NOT leave a bare line of grey text"). The sentences also differ in quote style and form.
- **Evidence (search "zzzzqq", measured):**
  - `ListEmptyState` (icon 48/24, heading 18/600, centred): projects, DLA, DSA, nominations, Template Finder, reports tables. Heading y 595 to 665 (centre of the remaining area).
  - bare line: user management Users, Roles, Permissions ("Nothing matches your search and filters.", `um-lists.tsx:116`), Controlled Vocabulary (curly quotes, `cv-list.tsx:145`), Taxonomy (**straight** quotes `No species match "zzzzqq".`, `tx-records.tsx:187`), Notifications and Notifications option 2 (`nt-list.tsx:122`, `nt-list-2.tsx:148`), Vouchers (`vm-list.tsx:117`), project Species tab (`species-view.tsx:316`, 14/500). All sit at y 242 to 282, directly under the search.
  - Screenshots `layout-empty-project-list.png` vs `layout-empty-user-management.png`, `layout-empty-taxonomy.png`.
- **Where it shows:** all admin lists above, plus the project page.
- **Winner:** `ListEmptyState` (§4.2e, the 6 screens already follow it).
- **Clause / theme:** §4.2e, T11 (also T12 for the straight quotes).
- **Fix size:** 9 sites, 0 shared components (reuse `list-empty-state.tsx`).
- **Mechanical?** Yes (§0.8 is due: this was logged once already as "first occurrence, no AUTO check yet" and has recurred): flag a file under `app/pages` that has `TableCard` / `<Table` and a string matching `/(No|Nothing) .* match/` but does not import `ListEmptyState`.

### LAY-4 [HIGH] ~24 scrolling content wrappers have no `scrollbar-gutter`: tab/state changes shift content by ~15px on Windows, and the one that has it is 15px narrower (T1)
- **What:** §4.2f requires a page's scrolling element to be `overflow-y-auto [scrollbar-gutter:stable]`. The AUTO check only inspects the `<main>` element, but the newer shells put the scroll on a **child div**, so they all slip through. Result: on a platform with classic scrollbars, any state that makes the content cross the viewport (a tab with more content, an accordion opened, a form section with more fields, a page with more rows) takes 15px from the content width and moves everything. Inversely, the project list has the gutter on both `<main>` and the table, so it loses 15px twice.
- **Evidence:** computed `scrollbar-gutter`: `auto` on the wrapper of DLA, DSA, nominations, user management x3, template finder, reports landing, ctrl-vocab, notifications, vouchers, taxonomy records and every record page (`dla/page.tsx:35`, `dsa/page.tsx:33`, `nominations/page.tsx:33`, `user-management/{page,roles/page,permissions/page}.tsx:12`, `template-finder/page.tsx:37`, `reports/page.tsx:14`, `report-page.tsx:29`, `cv-routes.tsx:24`, `cv-detail.tsx:237`, `nt-routes.tsx:27`, `nt-detail.tsx:134`, `vm-routes.tsx:20`, `vm-record.tsx:93`, `um-detail.tsx:280,446,580`, `dla-detail.tsx:318,411`, `dsa-detail.tsx:195`, `nomination-detail.tsx:77`, `tx-records.tsx:498`) and the two form scrollers (`form-page.tsx:86`, `project-registration/option-2/page.tsx:157`). `stable`: `project-list/page.tsx:245-314`, `dashboard/page.tsx:291-366`, project page `<main>`s, `table.tsx:198` (table body).
  - Overflow state flips with the gutter on `auto` (measured, 1708x1024): nominations record Overview no overflow / What to protect overflow (scrollHeight 1005 vs 959); user record Permissions overflow, Overview and Roles not; role record Permissions overflow (first accordion open), Users not; ctrl-vocab BIODATA-115 Details overflow vs Entries not; taxonomy Main and Status overflow vs 5 other tabs not; notifications Preview and Settings overflow vs History not; Home registered "For you" overflow. Each of these is a tab switch that would move content by the scrollbar width.
  - Project list: with classic scrollbars emulated by stable gutters, its card is **1295** wide (1280 table) vs **1310** (1295 table) on DLA, DSA, nominations, users, roles, permissions, ctrl-vocab, taxonomy, notifications, vouchers, template finder.
- **Where it shows:** Windows or mouse-with-always-visible-scrollbars; invisible on the designer's Mac overlay scrollbars (and in headless), which is why it keeps coming back. Not rendered here, see section 1.
- **Winner:** `[scrollbar-gutter:stable]` on every page-level `overflow-y-auto` (the one convention §4.2f already states), and drop the doubled gutter on the project list's `<main>` (the table already reserves its own).
- **Clause / theme:** §4.2f, T1.
- **Fix size:** about 24 sites, 0 shared components (consider a shared `PageScroll` wrapper so it cannot be forgotten).
- **Mechanical?** Yes: extend AUTO §4.2f from "a `<main>` with overflow-y-auto" to "any element with `overflow-y-auto` and `min-h-0 flex-1` in `app/pages` that lacks `scrollbar-gutter`" (allowlist asides, popovers, `max-h-*` lists). This is the §0.8 promotion: the designer has raised it more than once.

### LAY-5 [HIGH] Label/value rows have six layouts across record pages (T3, T6, §0.9)
- **What:** the "RecordRow" (label 176 left, value after a 40px gap) is used on 4 record pages, but the other record pages draw their own: a different label column, label above value, or value right-aligned. One card (DLA Overview) holds three of them.
- **Evidence (live, measured value offset from row start):**
  - RecordRow 176 label, value at +216: nominations, user, notifications, ctrl-vocab (`record-hero.tsx:73-77`, `sm:w-44`).
  - Occurrence record: 176 label, value at +200, 24px card padding, stray "-" for empty values (`record-detail.tsx:93`).
  - Project page (option 1): rows at 144 label / +172 (18 rows) and 176 / +192 (embargo, 7 rows).
  - Project option 2 and observation-detail: 224 label / +240 (`project-detail-view.tsx:629` `w-56`; `observation-detail/page.tsx:481`).
  - DLA Overview: one card with an eyebrow-label block ("PURPOSE OF DATA USE"), a label-left / **value-right-aligned** row (`dla-detail.tsx:419`, value at +1415) and a label-above-value 2x2 grid (`dla-detail.tsx:56` `Field`). DSA Overview: right-aligned "Signed agreement" row (`dsa-detail.tsx:275`).
  - Taxonomy record: label-above-value 3-column grid.
  - Screenshots: `layout-dla_DLA-2026-00502-biodata-admin.png`, `layout-nominations_NSS-2026-00001-biodata-admin.png`, `layout-taxonomy_P01937-biodata-admin.png`, `layout-project-list_kangaroo-island_..._occ-7-biodata-admin.png`.
- **Where it shows:** DLA, DSA, taxonomy, occurrence, project, observation-detail, project option 2; admin, registered, public alike.
- **Winner:** `RecordRow` (176/216): §4.6 item 4 names it, it is the dominant treatment and the most readable. Add an opt-in for the two-column long-text case instead of a lookalike (§1.6).
- **Clause / theme:** §4.6, §0.9, §1.6; T6, T3.
- **Fix size:** about 7 files; touches `RecordRow` for the long-text and parties cases.
- **Mechanical?** Partly: AUTO could flag `sm:w-44`/`w-56`/`w-\[1[0-9][0-9]px\]` label widths in `app/pages` that are not `RecordRow`/`FormRow`. Layout judgement stays REVIEW.

### LAY-6 [MED] The first card moves 32px when switching tabs on the user and DSA records; the same tab row sits at 3 different y per page family (T1)
- **What:** User and DSA Overview start with a "Last updated 20 Aug 2026" caption above the card (16px + 16px gap), the other tabs of the same record do not. Switching Overview to Roles moves the card from y 390 to y 358. DLA and nominations have no caption (nominations shows Last updated as a RecordRow instead, `nomination-detail.tsx:185`), so the same fact is shown three ways and the content start differs between records.
- **Evidence:** `um-detail.tsx:326`, `dsa-detail.tsx:266`; tab probe: user Overview panel child `[88,358,1596,16]` (caption) then card at y 390; Roles child `[88,358,1596,106]`. Tablist y: 301 (DLA, DSA, user, ctrl-vocab), 325 (nominations, role, notification), 297 (project), 321 (occurrence), 385 (taxonomy).
- **Where it shows:** user record, DSA record (admin).
- **Winner:** no caption; put "Last updated" in the hero facts or as the RecordRow (§4.6 item 7: Overview holds the record's own facts), so every tab's card starts at the same y.
- **Clause / theme:** §4.6, §4.3 (a fact in two treatments); T1, T6.
- **Fix size:** 2 files. **Mechanical?** no.

### LAY-7 [MED] Surface family: card radius 8 vs 12, padding 0/20/24, three tile treatments (emil-surfaces: nested radii and depth)
- **What:** The tab-panel "card" of a record page is radius 8 + 1px border on DLA, DSA, nominations, user, role, occurrence, Home (`rounded-lg border`), but radius 12 + border on the project page and taxonomy, and radius 12 + shadow-ring on every table (`TableCard`). Tiles inside are radius 6. Padding is 0 with px16/py12 rows (RecordRow), 20 (project, occurrence), 24 (side cards, report cards, dashboard cards).
- **Evidence:** measured cards table above (e.g. `/pages/project-detail` 12/pad 20 vs `/pages/dsa/DSA-2025-01348` 8/pad 0 and its side cards 8/pad 24; `/pages/taxonomy/P01937` 12/0). MetricTile: reports/species 8x16 pad, project Events 8x12, public KPI 118 high radius 8 pad 24.
- **Where it shows:** every record page, project page, Home.
- **Winner:** contracts silent - needs designer decision. Recommendation: 12px bordered card for record panels (it matches the table card the same screen shows next to it, and `/emil-surfaces`: a 16px hero over a 12px card over a 6px tile are the derived steps; the 8px cards break the set).
- **Clause / theme:** no clause - candidate new clause ("card radius and padding") ; T3.
- **Fix size:** about 12 files if 8 -> 12, touches `RecordRow` card wrappers. **Mechanical?** AUDIT: count `rounded-lg border border-secondary` vs `rounded-xl` per route under `app/pages`.

### LAY-8 [MED] Toolbar controls are not one height: the view toggle is 40, search/Filter/Columns are 36 (T7)
- **What:** The Cards|Table, Tree|Table and List|Hierarchy toggle is one component, 40 high; search, Filter and Columns are 36. Where they share a row (taxonomy, project Species/Artefacts/Records tabs) the row becomes 40 and the search sits 2px lower than on every other list (192 vs 190). The Reports landing puts the same toggle in the section header's top-right (y 89) instead of the toolbar's right edge (y 190, 416, 476), so the same control lives in two places.
- **Evidence:** toggle group rects: reports `[1519,89,165,40]`, taxonomy `[1505,190,179,40]` (search `[374,192,..,36]`), Species `[1519,476,165,40]` (search y 478), Records `[1527,416,157,40]`, Artefacts `[1519,390,165,40]`; radius 10, pad 4, inner buttons 32. Table starts 4px lower on those toolbars.
- **Where it shows:** taxonomy list, project Species/Artefacts/Project records, Reports landing.
- **Winner:** toggle height 36 (inner buttons 28) so it lines up with search, Filter and Columns (one control scale, T7 "controls on the wrong side": right edge of the toolbar, not the section header, since the section header's right is for the primary action, as DLA's "New request").
- **Clause / theme:** no clause - candidate; T7.
- **Fix size:** 1 shared component (the toggle) + `reports-landing.tsx`. **Mechanical?** no.

### LAY-9 [MED] Table density and defaults differ by family (T3)
- **What:** header/row heights 44/72 on lists, 34/44 on all 12 report tables (`TableCard size="xs"`, `report-table.tsx:310`), 36/56 on embedded tables (`size="sm"`: `cv-detail.tsx:104`, `tx-records.tsx:255`), 36.5/45 on the project Project-records table. Taxonomy's list defaults to 10 rows per page (others 50) and has no sortable columns (all other lists have sort carets); ctrl-vocab entries also none.
- **Evidence:** probe `th h`: 34 (23 loads), 44 (18), 36 (6), 36.5 (3); `t31` rows-per-page and `svg` in `th`: taxonomy `{"rpp":"10","sortable":0}`.
- **Where it shows:** reports vs lists; taxonomy.
- **Winner:** contracts silent - needs designer decision (reports are wide, dense tables, so `xs` can stay a deliberate "report" density; it should then be named in §4.2). Taxonomy: 50 and sortable like the others.
- **Clause / theme:** §4.2 (silent on density); T3.
- **Fix size:** 1-2 files for taxonomy (`tx-records.tsx`), 0 for the density decision. **Mechanical?** AUTO could check `rowsPerPage` default equality across `TableCard.PaginationNumbered` callers.

### LAY-10 [MED] Single-section create forms (Add role, Add permissions) have a different header, no eyebrow and no section list (§4.1)
- **What:** 10 FormPage screens have header 117 (eyebrow "ADD USER - STEP 1 OF 3", title at y44) and the vertical Progress steps in column 2; roles/new and permissions/new have header 97 (title at y24, no eyebrow), content 20px higher, and column 2 shows the User Management nav list instead of a section list.
- **Evidence:** `t26`: `header [0,0,1358,97], titleY 24` vs 117/44; `asideText "USER MANAGEMENT / All users 16 / All roles ..."`. Footer shows a single "Add role" / "Add permission" at right.
- **Where it shows:** admin, user management create flows.
- **Winner:** the 117 header with eyebrow (§4.1 item 1: optional eyebrow, then title, subtitle; the other 10 forms are the dominant pattern). Column 2 for a one-section form: contracts silent.
- **Clause / theme:** §4.1; T6.
- **Fix size:** 2 files. **Mechanical?** no.

### LAY-11 [MED] The heading block under the page title has five heights and three divider gaps
- **What:** list screens `SectionHeader` p-6 (101 high, 24 to the divider); forms pass `px-6 pt-6` and keep the default `pb-5` (117 high, 20 to the divider); Reports landing has its tabs inside the header (93, 16 to the divider); roles/new 97; public Home 77. The text jumps 4px when moving between a list and its form, and the header-to-first-control rhythm differs.
- **Evidence:** `SH divGap`: 24 (19 loads), 20 (16), 16 (2); `section-headers.tsx:7` (`pb-5` default), `form-page.tsx:68` (`px-6 pt-6`), list shells `p-6`.
- **Where it shows:** all.
- **Winner:** `p-6` (24) on every `SectionHeader.Root` (§4.2g already states 24px).
- **Clause / theme:** §4.2g; T1.
- **Fix size:** `form-page.tsx` + reports landing. **Mechanical?** yes: AUTO §4.2g could also flag a `SectionHeader.Root` without `p-6`/`pb-6`.

### LAY-12 [MED] `observation-detail` is a record page that follows none of the record pattern, and still has column 2 (T6)
- **What:** no hero card, no tabs; a back link inside main, an inline title and facts, a column-2 records tree, and six collapsed accordions with "+" icons. Every other record page now hides column 2 and uses hero + tabs.
- **Evidence:** screen-index "Observation" (`/pages/observation-detail`); measured `aside 286`, `main x 350`, no `bg-gradient` hero; screenshot `layout-observation-detail-biodata-admin.png`. Latest rule (6 Oct): "*-details pages: column 2 is hidden".
- **Where it shows:** all roles. Label column 224/240 too (LAY-5).
- **Winner:** the project-page record template (§4.6, `RecordHero` + tabs).
- **Clause / theme:** §4.6, §3.7; T6. **Fix size:** 1 screen. **Mechanical?** no.

### LAY-13 [MED] Taxonomy record stacks two tab rows and shows status as plain text
- **What:** a segmented control (Species details | Synonyms) at y 329 (40 high) above an underline tab list at y 385 with 8 tabs: 56px more chrome than any record page (tab row y 297-325) and a second kind of tab control on one record. Its hero status is the word "Current", not the status Badge the other 10 records use.
- **Evidence:** `t3`: taxonomy tablist `[88,385,1596,32]`; screenshot `layout-taxonomy_P01937-biodata-admin.png`; badge probe: `badge` undefined on the taxonomy hero.
- **Where it shows:** admin taxonomy record. **Winner:** one tab row (§4.6 item 7: tabs run from the record to what it relates to); status Badge. **Clause / theme:** §4.6, §0.9; T6, T2. **Fix size:** 1-2 files. **Mechanical?** no.

### LAY-14 [MED] Map controls sit at three different insets and one map lacks Expand (T7)
- **What:** on every small map the Expand button is `top-3 left-3` (12px), the zoom pair `top-4 right-4` (16px), and Leaflet's scale/attribution sit at 5/0px. The occurrence "Location Information" map (190 high) has no Expand at all. In the expanded dialog the close X is `top-2.5 right-3` (10/12), zoom top 16 / right 16.
- **Evidence:** `expandable-map.tsx:66` (`top-2.5 right-3`), `:72` (`top-3 left-3`), `sa-map.tsx:169` (`top-4 ... right-4`); probe: Expand `{t:12,l:12,w:98,h:36}`, zoom `{t:17,r:17,36x36}`, scale `{l:5,b:5}`, attribution `{r:0,b:0}` on nomination, DLA add-location, project page maps; occurrence map buttons: zoom only. Screenshots `layout-map-nomination-what-to-protect-expanded.png`, `layout-map-project-page-locations.png`.
- **Where it shows:** nominations, DLA add-location modal, project page, occurrence.
- **Winner:** one inset (12px) for Expand, zoom and the dialog X, so the corners balance; add Expand to the occurrence map or document why not. (Designer asked for these to be reviewed: "full screen button on the left on the small map, expand one top right".)
- **Clause / theme:** no clause - candidate; T7. **Fix size:** 2 shared files. **Mechanical?** no.

### LAY-15 [LOW] Close buttons come in five sizes
- Form X 40 (icon 20), modal X 36 (20), PageBanner X 36 (20, top 10/right 24), ExplainerCard dismiss 28 (16, top 11/right 11), map dialog X 36 at 10/12. Evidence: `t18`, `t27`. Winner: 36/20 as the dominant (modal, banner, map dialog); form X 40 and the 28 dismiss are the outliers. T4. 3 files. Mechanical: no.

### LAY-16 [LOW] Profile menu opens 4px from its trigger, every other menu 12px (T7)
- `profile-menu.tsx:7,27` uses `components/base/select/popover` (default offset 4) not `Dropdown.Popover` (`dropdown.tsx:171`, `offset={12}`). Measured gap 4 (profile) vs 12 (Add, record "...", Filter, Columns, switcher, taxonomy). The designer asked for 12px. 1 file. Mechanical: AUTO could flag `Popover` imports from `select/popover` in `app/pages/_shared` without an `offset`.

### LAY-17 [LOW] The project page's status badge is 16px, every other record's is 24px, so its hero is 4px shorter and the tab row 4px higher
- Project hero 156, status badge 16 high (dot variant); DLA, DSA, user, role, notification, ctrl-vocab 24 high, hero 160. Tablist y 297 vs 301. Winner: the 24px Badge (11 records). 1 file (project hero facts). Moving from a project to a DLA record shifts the tab row by 4px. T1/T2.

### LAY-18 [MED] The auth flow's wordmark and title jump on every step; "Biodata SA" vs "BioData SA" (T1, T9)
- Each auth screen is vertically centred, so the wordmark moves with the content height: login y283, signup 344, verify-email 293, set-password 265, forgot-password 316, check-email 347, setup-profile 123, account-created 376, reset-success 388. Form width 356 on all, setup-profile 608. The wordmark reads "Biodata SA" (lower-case d) on all 10, while the app header says "BioData SA". Screenshots `layout-auth_login-public-user.png`, `layout-auth_setup-profile-public-user.png`.
- Winner: top-anchor the card at a fixed y (a flow should not dance) and one product name. Auth is exempt from the shell (§3.7) but not from §4.3/T1. 1-2 files (auth layout). Mechanical: no. (The naming is T9, for the text agent.)

### LAY-19 [LOW] Filter chips and the active Filter button shift the toolbar (known/open)
- Turning a filter on adds the 36px chip row and pushes the table card down 36px (y 242 to 278); the Filter button grows from 85 to 111px (count). Already listed as open in `ref-shell.md`; I confirm the numbers on 12 lists. Taxonomy opens with a filter on ("Status: Current") so its table starts 40px lower than other lists from the first frame. Recommend reserving the chip row or moving chips into the toolbar row (as the backlog suggests).
- Explore card: width 440 stable, height 344 (Species), 348 (Projects), 360 (Events) per tab.

### LAY-20 [LOW] Project option 2's tab row is clipped by the Tree|Table toggle ("Comme..." at 1708px)
- Kept by the designer, but the last tab (Comments) is cut off by the toggle in the same row at the designer's own width. Screenshot `layout-project-detail_option-2-biodata-admin.png`. §2.8-style overlap. 1 file.

### LAY-21 [LOW] Count badges, chips and tags are three shapes for similar jobs (T2/T4)
- Count: column 2 and tabs are grey 20px uppercase pills (px 8), the SectionHeader count is a blue circle (px 0), and the roles accordion shows a bare "4". Filter chips are 20 high, **14px** uppercase, radius 6, against 12px pill badges; project tags are 26 high pills. No clause. Needs designer decision. Evidence: `t24`, screenshots `layout-user-management_roles_ROLE-101-biodata-admin.png`.

### LAY-22 [LOW] Stray "-" for empty values on the occurrence record, "Not provided" elsewhere (T11, §2.3)
- 5 rows show "-" on `occ-7` (Legacy Sighting #, Species Seq No, Description, Taxonomic Type, Occurrence Comment); the user and taxonomy records say "Not provided". Evidence: occurrence screenshot. Mechanical: AUTO §2.3 could flag `>-<` strings. 1 file.

### LAY-23 [LOW] Smaller 1px mismatches that add up
- Header search 37 high vs "Add" 36 in the same row (`[1103,14,395,37]` vs `[1510,14,101,36]`); toolbar Input 36 (small) vs form Input/Select 37; tablist 33 on records vs 32 on reports, taxonomy, dashboard (public Home tabs 49); public-user header 64 vs 65, so a persona switch moves everything under the header by 1px.

### LAY-24 [LOW] Species cards: the "Restricted" card is a few px lower than its neighbours, and its footer link has a chevron-down (seen in screenshot, not DOM-measured)
- Row 2 of the project Species tab (`layout-project-tab-Species.png`): title and "Records" lines of the card with the RESTRICTED badge sit about 2-4px lower than the other cards in the row; its "Go to record" ends in a down chevron where the others have a right arrow. Fix by giving every card the same header height. 1 file (`species-view.tsx`).

### LAY-25 [LOW] Awkward empty regions that look accidental (§2.12)
- Restricted states (DSA/Taxonomy for registered-user, DLA for public): column 2 is an empty grey panel with only a label while the message sits in the middle of an empty main (`layout-dsa-registered-user.png`). It is by contract (§3.7), but it is the emptiest screen in the product.
- DLA new step 1 is one button on a blank page; forms leave 330px empty to the right of the 720px fields (consistent across forms, so deliberate).
- Data Validation Error Report at 1280x800: Select project/dataset + 3 tiles + toolbar leave the table card at its 192px floor (one and a half rows visible), page scrolls (`layout-reports_data-validation-error-biodata-admin-1280x800.png`).

### LAY-26 [LOW] Page buttons recentre when the page count changes
- The centred page-number group moves when rows-per-page changes the page count (1 page: "1" at x1009; 4 pages: x946). Previous/Next/"1 - 10 of 40" do not move. Inherent to a centred group; mention only because "pagination numbers" is on the T1 list.

### LAY-27 [LOW, unverified] Reports column 2 rendered empty once
- In the first sweep the Reports landing column 2 showed only its label; in three later loads (and the 1440 sweep) it shows "All reports / My reports / Actions". I could not reproduce the empty state: treat as first-compile timing, not a finding, unless the designer has seen it.

## 5. Decisions needed

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | Header at 1280/1440: truncate breadcrumb and shrink search (one row at every width) vs allow wrapping (LAY-1) | One row at every width |
| D2 | Card radius for record panels: 8 (record pages) or 12 (project page, tables) (LAY-7) | 12, bordered |
| D3 | Report tables stay at dense `xs` density or follow lists (LAY-9) | Keep `xs` for reports, write it into §4.2 |
| D4 | Toggle height 36 and where it sits (toolbar right edge, never the section header) (LAY-8) | 36, toolbar right |
| D5 | Single-section create forms: eyebrow + section list or the current plain header (LAY-10) | Eyebrow, keep column 2 as nav |
| D6 | Map control inset (12) and Expand on the occurrence map (LAY-14) | 12 everywhere, add Expand |
| D7 | Auth flow: top-anchored card vs centred (LAY-18) | Top-anchored |
| D8 | Promote to AUTO (§0.8): empty-state check (LAY-3), page-scroll gutter on any `overflow-y-auto min-h-0 flex-1` (LAY-4), SectionHeader `p-6` (LAY-11) | Yes, all three; also add a 1280x800 header-height smoke test (LAY-1) |

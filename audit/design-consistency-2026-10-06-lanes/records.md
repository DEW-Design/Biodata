# Audit report: `records` (record pages, IA / shell, maps)

Lane: record (detail / deep-dive) pages vs section 4.6 and the project page, shell and IA consistency, home, maps, cross-links, role preview.
Date: 6 Oct 2026. Server: http://localhost:3000. Viewport 1708x1024. Nothing in the repo was edited.

## 1. Scope and method

Ran (Playwright-core, one browser, a fresh context per page, `pageerror` and console errors recorded):

- Record pages, probed for structure (column 2, back link, hero, tabs and their icons, crumbs, switcher, H1, label widths): project page (`/pages/project-detail`, `/pages/project-list/kangaroo-island/project-details`), project record (`.../occurrences/occ-7`), project dataset record (`?view=datasets&dataset=DS-2026-00003`), project flagged review (`?view=review`), project Option 2, DLA, DSA, nomination, user, role, permission, voucher batch (via list) and voucher record, taxonomy record, controlled vocabulary x2, notification x2, flagged concepts (standalone), observation-detail, all 11 reports (9 + 2 agreement), several tabs of each (screenshots under `.context/audit/shots/records-*.png`).
- Column 2 of 17 list screens x 4 roles plus 8 screens x 2 more roles (84 loads); rail, header, Add menu, profile menu, Home for all 7 roles.
- A gating sweep: all 62 non-auth screens in `screen-index.ts` x 4 roles (registered, public, biodata-admin, privileged-user), 244 loads, compared with `config/role-access.config.ts` and the index's `access` column.
- Maps: Explore options 1 and 2, project extent small and expanded, DLA "Add a location" modal, registration option 2; code read for `sa-map.tsx`, `expandable-map.tsx`, `geo-extent-picker.tsx`, `map-view.tsx`, `globals.css` Leaflet block.
- Cross-links: anchor counts and click-through on record tables and all reports; grep for bare `/pages` hrefs (none found without the role).
- Contracts read: core, shell, build, ref-shell, ref-roles, ref-domain, decisions 2026-10-05-12 and 2026-10-06-03 to -16.

Not covered (honest list): mobile menu and narrow windows; keyboard passes; Explore results table, record sidebar and Species tab; Add Project steps beyond step 1; the DLA takeover map and the nomination areas map (opened only as far as the form's first step); the Data Validation Error "Map visualise" dialog (my click did not find the control); Template Finder (list only, no record page); destructive items below the divider in each "..." menu (menus not opened); privileged-admin and biodata-user on record pages (list pages and gating were covered); typography was measured only for label/value rows.

Caveat: the worktree changed under the audit. Another session rebuilt Reports column 2 (decisions 2026-10-06-13 to -16, new `reports-nav.tsx`, `create-report-modal.tsx`). Two loads of `/pages/reports` for `privileged-user` and `biodata-user` threw `pageerror: Tabs is not defined` and showed "This page couldn't load"; re-run a minute later it was gone for all four roles (a half-saved edit, not reproduced). Reports findings below were re-checked after that rebuild.

## 2. What holds

- No console errors or page errors on any record page, list page or role (apart from the one transient above).
- Every record page except the legacy observation-detail and the two flagged-concepts screens has no column 2 and uses the full width (mainW 1644); lists and forms keep column 2 (286px). Applied to ALL deep dives, not some.
- Every column-2 nav item carries an icon (`[i]` on every item in 84 probes), All comes before My on Projects, DLA, DSA and Nominations, and the Actions group sits directly under the navigation on every screen (top 121 to 201px of a 959px column, never at the foot). The voucher bug is gone.
- Every underline tab list on record pages has 16px icons (project record's dynamic tabs are the known exemption).
- Every record that has a history uses `AuditLog` + `AuditFeed` (DLA, DSA, nomination, CV, notification, voucher record, dataset): no hand-built second log.
- Map chrome is one implementation: zoom stack top-right (36px buttons, 17px inset), Expand top-left, scale bottom-left, attribution bottom-right at 12px, Barlow inherited in every Leaflet map measured (Explore 1 and 2, project small and expanded, DLA modal). Restricted records are a flat block (`Rectangle`, `sa-map.tsx:135`) in the one shared `SAMap`.
- Gating matches the matrix: in the 244-load sweep no screen was open that the matrix/index says is closed, or closed that it says is open (the Pages tool hides closed pages; checked in code, `pages-map-data.ts:42`). All internal links found keep `?userRole=`.
- Taxonomy column 2 label ("Kingdom") and Notification/CV/Voucher labels follow decision 2026-10-06-10.

## 3. Checklist: record page x criterion

P = pass, F = fail, NA = not applicable, ~ = partial. Evidence for each F is in section 4.

Columns: A back link (own line above card) | B RecordHero | C one next-step + "..." | D notice | E tabs 16px icons | F first tab Overview (4.6.7) | G BreadcrumbSwitcher | H last crumb = record name | I Audit tab = AuditLog, named Audit Log | J label/value = RecordRow | K no facts restated (4.3) | L no column 2 | M edit model

| Record page | A | B | C | D | E | F | G | H | I | J | K | L | M |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Project page (reference) | P | P | P | NA | P | ~ first tab is "Project", not "Overview" | P | P | NA | ~ own rows (see REC-6) | ~ "-" x3 in extent card | P | in place |
| Project record (occurrence) | P "Back to <project>" | P | NA no actions | NA | F dynamic tabs, no icons (known) | NA | P | P | NA | F own `Field` | F ID and name repeated; 51 `DASH` | P | in place |
| Project dataset record | P | P | ~ buttons inside the card, not in the hero | NA | P | ~ Validation first | F | F last crumb "Datasets" | P tab named "History" (REC-5) | F | P | P | NA |
| DLA | P | P | P | NA | P | P | P | P | P "Audit Log" | F local `Field`/`MetaField` | F period and org repeated | P | route |
| DSA | P | P | P | NA | P | P | P | P | P "Audit Log" | F local `Field`/`MetaField` | ~ org repeated | P | route |
| Nomination | P | P | P (admin); none for registered | P | P | P | P | ~ crumb is the ID, H1 is the species | ~ "Audit history" | P | F species, nominated by, dates, status restated; banner restates status | P | route |
| User | P | P | P | NA | P | P | P | P | NA | P | P | P | route |
| Role | P | P | P | NA | P | NA (card shows all) | P | P | NA | P | P | P | NA |
| Permission | P | P | P | NA | F no tabs at all | F | P | P | NA | NA (table) | P | P | NA |
| Voucher batch | F "Herbarium batches" | P | P | NA | NA no tabs | NA | F | P | NA | NA | P | P | NA |
| Voucher record | F "Batch 1012" | P | P | NA | P | NA | F | P | ~ "History" | NA | P | P | NA |
| Taxonomy record | F "All species" | P | P | NA | P | F "Main" first, plus a pill row above | F | P | NA | F stacked grid, 14px medium | ~ "Main" card repeats the tab; 2 hero facts "Not provided" | P | in place + sticky footer |
| Controlled vocabulary | P | P | P | NA | P | F Entries, Details, History | F | P | ~ "History" | P | F 4 of 7 Details rows repeat the hero | P | route |
| Notification (and option 2) | P | P | P | NA | P | F Preview first (option 2 has Overview) | F | P | ~ "History" | P | ~ Category and Event repeat the hero | P | route |
| Reports (9 + DLA, DSA) | P | P | P ("..." only) | NA | P (EOO only has tabs) | NA | P | P | NA | NA | ~ hero date "Sept" (REC-12) | P | NA |
| Flagged concepts (standalone + project review) | F back link lives in column 2 | F no hero | NA | NA | NA | NA | F | F "Flagged concepts" | NA | F | NA | F has column 2 | NA |
| Observation-detail (legacy) | ~ in main, no card | F no card | F | NA | F accordions | NA | ~ switcher on "Projects" only | F "..." crumb | NA | F own `DetailRow` | NA | F has column 2 | NA |

## 4. Findings

### REC (record pages)

### REC-1 [HIGH] A voucher batch or record opened by its address renders a blank main, forever
- **What:** `/pages/vouchers/1012`, `?record=ADH-2024-118` and `/pages/vouchers/option-2/1012` show header and rail but an empty main (0 characters of text after 4s), on a cold load and on reload. The same page opened by clicking "Batch 1012" in the list works.
- **Evidence:** Playwright, BioData Super Admin, 1708x1024, three URLs, `innerText` length 0, no console error; `localStorage["biodata-vouchers"]` undefined. `vm-routes.tsx:33` reads `useVouchersHydrated()` and `vm-routes.tsx:50` renders `null` while `!hydrated`; the store is `skipHydration: true` (`vm-store.ts`) and only rehydrates from a component's effect. Screenshot `shots/records-voucher-biodata-super-admin.png` (blank) vs `shots/records-voucher-batch-via-list.png`. Root cause not isolated beyond the `null` gate.
- **Where it shows:** every deep link, including the three entries the Pages tool and `screen-index.ts` (lines for "Batch to review", "Record comparison") open. Super Admin only.
- **Winner:** the DLA, DSA and nomination stores handle a cold deep link (verified: DLA record loads cold). The voucher route must too; a gate that renders nothing is never acceptable (`useHydrated` is documented as "a deep dive must wait ... or it flashes not found", so the fallback must resolve).
- **Clause / theme:** no clause names it; section 0.6 item 4 (live pass). Pages tool trust.
- **Fix size:** 1 route file (`vm-routes.tsx`) and possibly `zustand-persist.ts`.
- **Mechanical?** No (needs a cold-load Playwright check per route; candidate for the audit script).

### REC-2 [HIGH] Overview and Details tabs restate the identity card (T6, 4.3, 4.6.7)
- **What:** 4.6.7 says the Overview holds only facts "the identity card above does not already show", and 4.3 says never restate a fact. Five record types repeat the card.
- **Evidence (measured, 1708x1024):**
  - Nomination Overview (`NSS-2026-00001`): rows Species (name, scientific name), Nominated by (name plus email), Created and Last updated; the card already shows species, nominated by, submitted, status; the "Under review" notice repeats the status. `shots/records-nom-registered-user.png`.
  - DLA Overview: "Requested Agreement Period" row repeats the card's Agreement period; Data requestor "Organisation" repeats the card's Requestor (Birds SA). `shots/records-dla-biodata-admin.png`.
  - Controlled vocabulary Details (`cv-detail.tsx:306-311`): Vocabulary name, Category, Start date, End date = 4 of 7 rows, all in the card (`shots/records-tab-cv-details.png`).
  - Notification Settings: "Category" (card eyebrow) and "Event" (card Trigger).
  - Project record (occurrence): "Occurrence ID" and "Occurrence Name" rows repeat the card title and ID (`shots/records-proj-record-registered-user.png`).
  - Clean: user, role, reports, DSA mostly.
- **Where it shows:** nominations (all roles), DLA (admin and registered), CV (Super Admin), notifications (admin), project records.
- **Winner:** 4.6.7 and 4.3 (the project page, the reference, does not repeat Project ID, dates, status in its Overview). Drop the repeated rows; where a tab is left with nothing, no Overview tab (as Role and Permission).
- **Clause / theme:** CONTRACTS 4.3, 4.6.7; T6.
- **Fix size:** about 5 files (`nomination-detail.tsx`, `dla-detail.tsx`, `cv-detail.tsx`, `nt-detail.tsx`, project record sections), none shared.
- **Mechanical?** Partly: a check that compares `HeroMeta` labels with `RecordRow` labels in one file would catch exact label repeats.

### REC-3 [MED] BreadcrumbSwitcher missing on 5 collections and the dataset record (4.6.5), and the last crumb is not always the record
- **What:** 4.6.5 requires the section crumb to be a switcher on every record page. Present on Projects, DLA, DSA, Nominations, User Management (users, roles, permissions) and Reports. Absent (plain section label) on Taxonomy, Controlled Vocabulary, Notifications (both options), Voucher batch and record, the dataset record, and flagged concepts.
- **Evidence:** crumbs as measured: Taxonomy `Taxonomy Management / South Australian Blue Gum`; CV `Controlled Vocabulary / Measurement`; Notification `Notification Management / Observation submitted successfully`; Voucher `Voucher Management / Herbarium / Batch 1012`; dataset record `Projects / Adelaide Hills Bushland Survey / Datasets` (the dataset's own name is not a crumb, and it ends on the list's name, so the list and the record read the same); nomination crumb `NSS-2026-00001` while the page title is "Southern Bell Frog". Switcher wrappers that exist: `project-switcher.tsx`, `dla-switcher.tsx`, `dsa-switcher.tsx`, `nomination-switcher.tsx`, `um-switcher.tsx`, `report-switcher.tsx`; none for the other collections.
- **Winner:** 4.6.5 (a wrapper per collection over `BreadcrumbSwitcher`); the crumb after it is the record's name.
- **Clause / theme:** 4.6.5; T6, T9.
- **Fix size:** 4 new thin wrappers (taxonomy, ctrl-vocab, notifications, vouchers), 1 crumb fix on the dataset record.
- **Mechanical?** Yes: a record route under `app/pages/**/[id]` whose shell passes a `breadcrumbCurrent` without a switcher import (the 4.6 enforcement note says one is due "if a record page ships with a plain section crumb again": it has).

### REC-4 [MED] Back link wording drifts (T9)
- **What:** 11 of 15 back links read "Back to <things>" (projects, requests, agreements, nominations, users, roles, permissions, vocabularies, notifications, reports, datasets). The others: Taxonomy "All species" (`tx-records.tsx:499`), voucher batch "Herbarium batches" (`vm-batch.tsx:168`), voucher record "Batch 1012" (`vm-record.tsx:94`, `:210`), project record "Back to Kangaroo Island Recovery Monitoring" (a project name, reasonable but a third pattern), flagged review "Back to project records" and standalone "Back to Home" drawn inside column 2 (not `RecordBackLink`).
- **Winner:** "Back to <plural of the list>" through `RecordBackLink` (the dominant pattern).
- **Clause / theme:** 4.6 item 1; T9. **Fix size:** 4 strings, 2 screens. **Mechanical?** Yes (regex on `RecordBackLink` children not starting "Back to").

### REC-5 [MED] One concept, three tab names: Audit Log / Audit history / History (T9)
- **Evidence:** "Audit Log" `dla-detail.tsx:407`, `dsa-detail.tsx:261`; "Audit history" `nomination-detail.tsx:154`; "History" `cv-detail.tsx:282`, `vm-record.tsx:115`, `nt-detail.tsx:175`, `datasets-view.tsx:364`. All seven render `AuditLog` (pass) and the same `ClockRewind` icon, but 4.6.6 names it "The Audit Log tab" and 3.13's icon row says "Audit log and history".
- **Winner:** "Audit Log" (4.6.6 text; 2 of 7 today). **Fix size:** 5 strings. **Mechanical?** Yes (`id="history"`/`id="audit"` Tab label must equal "Audit Log"). Needs designer confirmation that History is not intended for non-status logs (CV and notification logs are field edits, which 4.6.6 says AuditLog does not list).

### REC-6 [MED] Four label/value treatments on record pages and eight local copies of the same helper (T3, 1.7, 0.9)
- **What:** measured label/value rows: project page (reference) label 14/400 `text-tertiary`, 176px, value starts 192px after the label; `RecordRow` (`record-hero.tsx`, used by user, role, nomination, CV, notification, dataset) 14/400 `text-secondary`, 176px, value starts 200px after the label; DLA and DSA `Field` (`dla-detail.tsx:56`, `dsa-detail.tsx:60`) stacked, 14/500 tertiary; taxonomy stacked grid 14/500 secondary (`shots/records-tab-*`).
- **Evidence:** the project page does not use `RecordRow` at all (grep: `RecordRow` is imported by 8 files, none of the project page files). Local copies of the hero fact helper that `HeroMeta` already provides: `dla-detail.tsx:65`, `dsa-detail.tsx:71`, `um-detail.tsx:50`, `record-detail.tsx:727`, `observation-detail/page.tsx:453`, `artefact-lightbox.tsx:73`, `project-detail/option-2/project-detail-view.tsx:600`.
- **Winner:** one row component, matching the project page's metrics (14/400 tertiary, 176 + 16), used by the project page too (4.6 item 4; 2.9 "one role has one treatment").
- **Clause / theme:** 1.7, 2.9, 0.9; T3. **Fix size:** `RecordRow` plus 7 deletions plus DLA/DSA/taxonomy rows (about 10 files). **Mechanical?** Yes: `function (MetaField|Field|HeroMeta)` declared outside `record-hero.tsx` under `app/pages`.

### REC-7 [MED] Permission record has no tabs and a different section label
- **What:** the page is hero then a small-caps "ROLES WITH ACCESS 14" label, a search box and a table, with no underline tabs; 4.6 says "MUST NOT ... stack its content without tabs". Its eyebrow is the category ("CONTENT") while every other record's eyebrow is the record kind (USER, SYSTEM ROLE, PROJECT, REPORT).
- **Evidence:** `shots/records-perm-biodata-admin.png`; decision 2026-10-06-11 chose "no Overview" for Role and Permission, which 4.6.7 allows, but not "no tabs".
- **Winner:** one tab "Roles" with its count (mirrors Role's "Users" tab), eyebrow "Permission", category moved into a fact (it already is).
- **Clause / theme:** 4.6 (MUST NOT list); T6. **Fix size:** 1 file (`um-detail.tsx`). **Mechanical?** No.

### REC-8 [MED] Taxonomy record departs from the pattern in four ways
- **What:** (1) a pill toggle "Species details | Synonyms 0" sits above the underline tabs (two tab rows, a second kind of tab control; `tx-records.tsx` Synonyms view); (2) hero fact label "SCIENTIFICNAMEID" (run together, not sentence case) and two hero facts reading "Not provided" (NSX desc, ScientificNameID), which is noise inside the card (2.12); (3) the first tab "Main" repeats as its card title "Main"; (4) the first tab is not Overview and there are eight tabs.
- **Evidence:** `shots/records-tax-biodata-admin.png`.
- **Winner:** underline tabs only (Synonyms as a tab with its count), facts omitted when not provided (4.6.7, 2.3), tab not repeated as a card title.
- **Clause / theme:** 4.6, 2.12, 2.3; T2, T6. **Fix size:** 1 file, `tx-records.tsx`. **Mechanical?** No.

### REC-9 [MED] Two edit models on record pages
- **What:** Taxonomy and the project page edit in place (card edit mode, sticky "Cancel / Save changes" footer, 4.8) while User, Controlled Vocabulary, Notification, DLA, DSA and Nomination "Edit" open a separate form route with a column-2 section list (4.1). Measured: Edit species stays on `/pages/taxonomy/P01937` with a footer at y=972; Edit user, Edit vocabulary, Edit notification go to `.../edit` with a 286px column 2.
- **Winner:** contracts silent (4.8 governs in-place edits only; ref-shell says edit is a route). Needs designer decision.
- **Clause / theme:** no clause chooses between them; T6. **Fix size:** large if taxonomy moves to a route, none if documented. **Mechanical?** No.

### REC-10 [MED] Screens that deep-dive but keep column 2 or skip the hero
- **What:** observation-detail (`/pages/observation-detail`) is the pre-pattern screen: no `RecordHero` card, a column 2 holding the project records tree, accordions instead of tabs, a "..." crumb, own `MetaField`/`DetailRow`, and the location map is the Highcharts silhouette (MAP-4). Flagged concepts (standalone and `?view=review`): column 2 carries a progress summary ("16 open across 15 records in 6 projects · 4 resolved"), a project select and Open/Resolved tabs (information in column 2, 3.10) with a back link inside it, no hero, no switcher, one crumb "Flagged concepts".
- **Evidence:** `shots/records-obsdet-registered-user.png`, `shots/records-flagged-biodata-admin.png`, `shots/records-review.png`. Both are listed as screens (observation-detail in `screen-index.ts`; flagged concepts is not, see IA-7).
- **Winner:** the designer's 6 Oct rule (detail pages hide column 2, use the full width, borrow *-detail patterns); the flagged review is an inbox (a master list with a detail), a shape no other page has, so under 0.9 item 3 it needs a named reason or the designer's yes.
- **Clause / theme:** 3.7, 3.10, 4.6, 0.9; T5, T6. **Fix size:** 2 screens. **Mechanical?** No.

### REC-11 [MED] Stray "-" for an empty value on record pages (T11, 2.3)
- **What:** 2.3: "An empty value is omitted or written Not provided, never a stray `-`". `record-detail.tsx:69` defines `const DASH = "-"` and uses it 51 times: project record pages and Explore's record sidebar show "-" for Legacy Sighting #, Species Seq No, Description, Taxonomic Type, Occurrence Comment, Site, Visit rows and so on (5 on the occurrence's first tab alone). `location-details-table.tsx:19` (`DASH`, rows 58-62) gives the project page's own Geographic extent card three "-" in "Entered Value". The siblings write "Not provided" (user, CV, DLA) or "No end date"/"Ongoing" (see below).
- **Evidence:** `shots/records-proj-record-registered-user.png`, `shots/records-proj-extent.png`.
- **Related wording drift for an open end date:** "Ongoing" (project hero, `project-details-view.tsx:42`), "No end date" (user "Access until", CV, hero), "-" (record rows).
- **Winner:** "Not provided" in `text-quaternary` (the `NotProvided` helper in DLA/CV), omit where no meaning; one word for an open end ("Ongoing" for projects, "No end date" elsewhere needs the designer).
- **Clause / theme:** 2.3; T11. **Fix size:** 2 constants and their call sites (about 55 sites). **Mechanical?** Yes: the existing `AUTO 2.3` check does not catch `const DASH = "-"`; extend it to a string literal `"-"` as a rendered value.

### REC-12 [LOW] Dates: reports write "27 Sept 2026", everything else "27 Sep 2026" (T12)
- **Evidence:** all 8 dated report heroes read "LATEST RECORD | 27 Sept 2026" (also 24, 25 Sept); the same report's table and every record page read "21 Sep 2026". Cause: `Intl.DateTimeFormat("en-AU", { month: "short" })` yields "Sept" in current ICU; custom formatters write "Sep". `month: "short"` with `en-AU` appears in at least `field-schema.ts:265`, `project-tab.tsx:45`, `survey-data.ts:1048`, `attribute-filter.tsx:64`, `tx-store.ts:53`, `um-data.ts:98`, `report-table.tsx:36-37`, `post-ingestion-report-data.ts:119`.
- **Winner:** one shared short-date formatter (the custom "Sep" one the lists and records use). **Fix size:** about 8 sites. **Mechanical?** Yes (grep `month: "short"` outside a shared date util). **Clause:** none, candidate new clause (dates).

### REC-13 [MED] Reports and records do not link to what their rows are about (cross-links)
- **What:** lists make every row a link (ref-shell item 4). Reports do not: of 9 reports (11 with the two agreement reports) only the ingestion report has links (40 anchors, each cell of a row goes to the validation-error report, including the "Successful" status cell). Post-ingestion, project detail, species detail, sensitive and restriction, voucher ID, validation error, specimenDB, events/occurrences/observations, DLA and DSA agreement reports: 1 anchor each (the back link), rows `cursor: auto`, click does nothing. A DLA agreement report row does not open the DLA; a project detail row does not open the project. DLA "Locations & Access" shows project names as plain text (1 anchor on the page), the nomination page has none.
- **Good:** role and permission tables, user Roles cards and the lists open their records and keep `?userRole=` (clicked: permission row opens the role, role Users row opens the user).
- **Winner:** the row or its ID cell links to the record page with the role kept (`useRoleHref`), same styling as lists (`text-primary` with `group-hover:text-brand-700 group-hover:underline`, about 20 sites; about 5 sites use `text-brand-secondary hover:underline` instead, for example `vm-compare.tsx:290` and `vm-parts.tsx:285`).
- **Clause / theme:** ref-shell list item 4, 0.9; T11. **Fix size:** shared `report-table.tsx` plus per-report column defs. **Mechanical?** No.

### IA (shell, navigation, naming, roles)

### IA-1 [HIGH] BioData Super Admin sees Registered-User data in reports
- **What:** the Super Admin "has everything a BioData Admin has" (ref-roles), but 5 reports filter with `role === "biodata-admin"` so the Super Admin gets the own-rows branch, and the landing says "Reports on your uploads and the projects you contribute to." while BioData Admin reads "Reports across BioData SA."
- **Evidence (live, row counts, admin / super admin / registered):** data ingestion 60 / 25 / 25; post-ingestion 60 / 25 / 25; sensitive and restriction 11 / 7 / 7; SpecimenDB refresh 27 / 17 / 17; voucher ID update 27 / 17 / 17. Code: `ingestion-report-data.ts:373`, `sensitive-restriction-report-data.ts:336`, `specimendb-refresh-report-data.ts:187`, `voucher-id-update-report-data.ts:136`, `report-projects.ts:12`, `use-ingestion-runs.ts:24`, `reports-landing.tsx:35`. (`navForRole` at `registered-user-nav.ts:170` is a correct role switch.)
- **Where it shows:** every Reports screen, Super Admin only.
- **Winner:** `isBiodataAdmin(role)` (`lib/user-role.ts:55`), which ref-roles says every admin question must call; 3.4 forbids inline role checks.
- **Clause / theme:** 3.4, ref-roles. **Fix size:** 7 sites in 7 files. **Mechanical?** Yes: grep `=== "biodata-admin"` under `app/pages` (7 hits, all wrong; `lib/user-role.ts` and the nav tree are legitimate).

### IA-2 [HIGH] DLA "All requests" shows every request to Registered and Privileged users
- **What:** Nominations (decision 2026-10-06-05) limits a Registered User to what they submitted. DLA does not: for `registered-user` and `privileged-user`, `/pages/dla?scope=all` shows 9 requests (Maya Dewitt, Lana Steiner, Phoenix Baker, others) against 2 under My requests; the record `DLA-2026-00502` (Maya Dewitt's) opens for a Registered User with an "Edit request" button. The DLA report, by contrast, gives a Registered User only their own 2 (decision 2026-10-06-03). DSA/Project All is fine (admin-only, public projects).
- **Evidence:** `dla-list.tsx:259` (`scope === "mine" ? filter : all`), `dla-shell.tsx:64` (All shown to every role, default `mine` for non-reviewers), `dla-switcher.tsx:22`. Live counts 9 / 2 for registered, privileged-user and admin.
- **Winner:** contracts silent on DLA; ref-shell says a role that sees only its own records gets no All; the nominations rule and the DLA report are the dominant pattern. Needs designer decision (T8 plus a permission).
- **Clause / theme:** 3.4 / ref-shell collection pattern item 2; T8. **Fix size:** `dla-list.tsx`, `dla-shell.tsx`, `dla-switcher.tsx`, DLA record guard (4 files). **Mechanical?** No.

### IA-3 [MED] Naming drift for one concept (T9, T12)
Concept to name in each place (rail | column 2 label | page heading | crumb | Add menu | hero eyebrow or form title | Pages tool area):

| Concept | Rail | Column 2 | List heading | Add menu | Record eyebrow / form column 2 | Pages tool area |
| --- | --- | --- | --- | --- | --- | --- |
| DLA | Data Licencing Agreement (DLA) | REQUESTS | Data Licencing Agreements | Data licence request (DLA) | DATA LICENCING AGREEMENT / form "DATA LICENCE REQUEST" / report "Data Licence Agreement Report" / form section "Location & License" | Data licence (DLA); screen "Licence requests" |
| DSA | Data Sharing Agreement (DSA) | AGREEMENTS | Data Sharing Agreements | Data sharing agreement (DSA) | DATA SHARING AGREEMENT | Data sharing (DSA); "Sharing agreements" |
| Nominations | Nominate Sensitive Species | NOMINATIONS | Sensitive species nominations | Sensitive species nomination | SENSITIVE SPECIES NOMINATION / "NEW NOMINATION" | Nominations |
| Users | User Management | USER MANAGEMENT | Users / Roles / Permissions | User | USER | User management |
| Taxonomy | Taxonomy Management | KINGDOM | Species | none | FLORA SPECIES | Taxonomy Management |
| Notifications | Notification Management | CATEGORIES | Notifications | Notification | NOTIFICATION | Notification Management |
| Vocabularies | Controlled Vocabulary | CATEGORIES | Controlled vocabularies | Controlled vocabulary | REFERENCE VOCABULARY | Controlled Vocabulary |
| Vouchers | Voucher Management | SOURCES | Scan batches | none | HERBARIUM SCAN | Voucher Management |
| Reports | Reports | REPORTS | Reports | none | REPORT | Reports |

- **Spelling:** "Licencing" appears 39 times (`DLA_SECTION_LABEL`, `registered-user-nav.ts:13`, so the rail, crumb, headings, Explore notice), "Licence" 189 times, US "License" 40 times (`dla-form.tsx:100`, `:249`, `:362`, `:375`, `dla-detail.tsx:88`, `:434`). Decision 2026-10-06-03 says the rail says "Licence"; it says "Licencing". Australian English: "licence" (noun), "licensing" (gerund), so "Licencing" is wrong in either reading.
- **Case:** rail, crumb, Pages tool in Title Case; Add menu, headings, report titles in sentence case ("Data sharing agreement (DSA)" vs "Data Sharing Agreement (DSA)").
- **Verb drift on create:** "New request", "New nomination", "New vocabulary", "New notification" vs "Add user", "Add project", "Add role", "Add permissions"; the Add menu says "Project", "User".
- **Winner:** 3.x says the section's name is the same in rail, crumb and column 2 (4.6.5); pick "Data Licence Agreement (DLA)" to match the report title, one case per surface. Designer decision on Title vs sentence case for the rail.
- **Clause / theme:** 4.6.5, 2.3; T9, T12. **Fix size:** about 70 string sites, 1 constant. **Mechanical?** Partly: grep `Licencing` and `License` (AUTO spelling check).

### IA-4 [MED] Restriction states are hand-written per shell, not one component, and the copy drifts
- **What:** 3.7 keeps three columns and states the restriction in main. About a dozen copies exist, none shared: "managed by BioData Admins" (DSA, User Management, Taxonomy, Notifications), "managed by the BioData Super Admin" (Controlled Vocabulary), "managed by BioData Super Admins" (Vouchers: plural, different from CV), "needs a free BioData SA account" (Nominations, Template Finder, Reports, upload), and the DSA report's own layout ("Back to reports", heading, paragraph, no "Go to Home"). The signed-out visitor reads "Your account doesn't have access to this section" on admin pages (they have no account), and flagged concepts says "this page".
- **Evidence:** The "doesn't have access" paragraph is written out in `dsa-shell.tsx:123`, `cv-shell.tsx:179`, `vm-shell.tsx:126`, `tx-shell.tsx:121`, `um-shell.tsx:150`, `nt-shell.tsx:166` and `flagged-concepts/page.tsx:112`; the "needs a free account" and report variants are in the nomination, template-finder and reports shells; gate-sweep text per role in the live run.
- **Winner:** one `RestrictedState` component with a role phrase and a signed-out variant ("Log in or sign up" instead of "your account").
- **Clause / theme:** 3.7, 1.7; T11. **Fix size:** about 12 sites into 1 component. **Mechanical?** Yes: grep `doesn't have access` outside the shared component.

### IA-5 [MED] Home badge only for Registered User, though 4 roles share the same Home tasks
- **What:** `primary-rail.tsx:38` shows the red count on Home only for `registered-user`. `privileged-user`, `privileged-admin` and `biodata-user` render the identical Home ("Hi, Olivia", "Needs your attention", the same DLA request and nomination cards, 1428 characters of text equal to the registered user's) but their Home icon has no badge. 3.4 lists "Home's task badge" among things that are decided once from the role.
- **Winner:** badge wherever "Needs your attention" shows (the comment's reasoning, that admin Home is operational, holds for admins only). **Fix size:** 1 line. **Mechanical?** No.

### IA-6 [MED] Flagged concepts is outside the role matrix and the index
- **What:** `/pages/flagged-concepts` ("reviewed by BioData Admins and Privileged Admins") gates with an inline role test (`project-detail/field-notes.tsx:68`, `isBiodataAdmin(role) || role === "privileged-admin"`) instead of a `FeatureKey`, so `wholePageGates` and the Pages tool cannot know it; it is not in `screen-index.ts`. The same file lacks 9 other real routes: `ctrl-vocab/[id]/edit`, `dla/[id]/edit`, `dsa/[id]/edit`, `nominations/[id]/edit`, `notifications/[id]/edit`, `notifications/option-2/[id]/edit`, `users/[id]/edit`, `vouchers/option-2`, `project-detail/created`. Its breadcrumb is `Home / Flagged concepts` with no section crumb and the rail highlights Home. Registered, public and BioData User see "Your account doesn't have access to this page".
- **Winner:** a `flaggedConcepts` feature key plus an index line (open item 3 in decision 2026-10-05-12 already proposes the AUTO check).
- **Clause / theme:** 3.4; T9. **Fix size:** 1 config key, 1 gate, 10 index lines. **Mechanical?** Yes (route not in `screen-index.ts`; `role ===` outside `lib/`).

### IA-7 [MED] Add Project option 1 has no rail and no column 2
- **What:** `/pages/project-registration` renders the header and a centred wizard only (`rail: false`, no aside); its header comment says "No icon rail / contextual sidebar" (`page.tsx:17-21`). 3.7 exempts only `biodata-home`, `auth/**` and `/pages`. Option 2 has rail plus a 286px section list. The same flow also counts three ways: "STEP 1 OF 3" in the title, "0 of 5 sections complete" in column 2 listing six items.
- **Clause / theme:** 3.7, 4.4 (an explored option); T11. **Fix size:** 1 screen, or an override entry. **Mechanical?** Yes (AUTO 3.7: a `/pages` screen rendering `AppHeader` without `PrimaryRail`; the guest gate in the same file also has no `<main>`).

### IA-8 [LOW] Header is 1px shorter for the public user; guest Add comment is stale
- **Evidence:** header 64px (public) vs 65px (every signed-in role) on Home, Projects and Explore; the rail and content start 1px higher, so a guest logging in shifts the page (T1). `lib/create-menu.ts:4-9` says a guest sees the Add button with a sign-up invite; `create-menu.tsx:12-17` and the probe show the button is hidden for `public-user`.
- **Winner:** one header height (min-h 64 plus border on both); fix the stale comment. **Fix size:** `app-header.tsx` plus 1 comment.

### IA-9 [LOW] Column-2 odds and ends
- Notifications column 2 lists four categories with a count of 0 (Subscription, Alerts, External Tools, Dashboards): entries that lead nowhere (2.12).
- "Create report" (Projects, DLA, DSA, Nominations) is the unwired toast, while Reports now has "Create a report" (dialog). Different label, different behaviour for the same action (decision 2026-10-06-15 open item 2).
- Column-2 label vocabulary: PROJECTS, REQUESTS, AGREEMENTS, NOMINATIONS restate the collection above "All <things>", which is what decision 2026-10-06-10 removed from Taxonomy ("a label that restates the heading"). The scope-switch screens kept it. Needs designer decision whether a scope switch is a facet.
- CONTRACTS 3.7 says Explore's second layout (`/pages/observations/option-2`) "is unchanged" (keeps column 2); live it has none (aside 0, map across the full width). Contract and build disagree; one of them is stale.
- Collection list pages and the Reports landing render no `<h1>` (records, restrictions and Home do): the page title is a `SectionHeader.Heading` that is not a heading level 1.

### IA-10 [LOW] Home and header identity
- The header avatar reads "OW" for every signed-in role while the BioData Admin and Super Admin Home says "Hi, Jane" (a sanctioned placeholder per `home-dashboard.tsx:487`); the admin sees an Olivia avatar and a Jane greeting. Admin quick actions are nouns ("User Management", "Reports"), Registered User's are verb phrases ("Request new DLA"), and "Nominate Sensitive Species" is Title Case beside sentence-case siblings.
- Add menu gaps for admins: `users/new` is there, but Role and Permission creation (`/roles/new`, `/permissions/new`, existing routes) and taxonomy changes are not in `createMenuItems`, although 3.5 makes it the one place to create things. Needs designer decision.

### MAP (maps)

### MAP-1 [MED] The four ways to give a location have three label sets, three orders and three icon sets (T4, T9)
- **Evidence:** Explore (`observations-search.tsx:116-121`): Draw (`PenTool02`), Coordinates (`MarkerPin02`), Location (`Map02`), Shapefile (`UploadCloud02`). Registration picker (`geo-extent-picker.tsx:46-51`, short names `:53`): Upload Shapefile (`UploadCloud02`), Draw on the Map (`Map01`), Choose from a List (`ListIcon`), Coordinates (`Target04`). DLA "Add a location" (`add-location-modal.tsx:31-36`): same labels, Draw `Pentagon`, List `MarkerPin02`, Coordinates `Circle`, and `Circle` is also the "Draw circle" button's icon (`add-location-modal.tsx:59`), so one icon names two concepts in one modal. The DLA modal re-implements the registration picker's tabs and draw buttons (also copied in `observations-search.tsx:1573`), where the registration picker documents its draw buttons as shared.
- **Winner:** one `locationMethods` table (id, label, icon) used by all three; the project/registration labels and order (Shapefile, Draw, List, Coordinates) are used by 2 of 3. Icon choice is the designer's (2.4: "exact glyph Figma draws").
- **Clause / theme:** 2.4, 1.7, 0.9; T4, T9. **Fix size:** 3 files plus 1 new shared module. **Mechanical?** Partly (duplicate `{ id: "coordinates", label: "Coordinates"` tables).

### MAP-2 [MED] Expand a map: two patterns, one icon for four meanings (T7, T4)
- **What:** `ExpandableMap` (project extent, record location, nomination areas, DLA): "Expand" with `Maximize02`, opens a dialog with a title bar and a corner X (`expandable-map.tsx:72`, `:41-44`). `GeoExtentPicker` (project registration option 1 and 2): "Full screen" with `Maximize02`, opens a takeover with "Exit full screen" (`Minimize02`) in the toolbar (`geo-extent-picker.tsx:143`, `:242-247`), with a hard-coded `z-[9999]` where `ExpandableMap` uses `MODAL_Z_INDEX` (`lib/layers.ts`) for the over-modal case. The record panel's `FullscreenToggle` says "Full screen / Open full screen" with the same icons (`record-panel.tsx:573-590`) and the edit drawer uses `Maximize02` to widen (`edit-drawer.tsx:71`): one glyph, four meanings, three labels (Expand, Full screen, Open full screen). Decisions 2026-10-02-20 and -22 moved exit to the left and made Expand a modal, but only for `ExpandableMap`.
- **Winner:** `ExpandableMap` (the decided pattern, extended with `toolbar` for draw tools); the picker should use it with `presentation`. Icon for "widen a panel" needs its own glyph.
- **Clause / theme:** 1.6, 2.4; T7, T4. **Fix size:** `geo-extent-picker.tsx` (and registration option 2 caller). **Mechanical?** No.

### MAP-3 [LOW] Home dashboards and two legacy screens draw an Australia silhouette, titled as a per-mapsheet map
- **What:** `map-view.tsx` is a second map engine (Highcharts, grey states with SA in brand colour, no controls, no scale, no attribution) used 5 times; its own header (`map-view.tsx:21-27`) says no mapsheet geometry exists, yet the cards are titled "Number of flora and fauna records per mapsheet" (`data-overview.tsx:254`, `flora-content.tsx:104`, `fauna-content.tsx:104`). It is also the "Location Information" map of an observation (`observation-detail/page.tsx:738`) and the "Geographic scope" of project Option 2 (`project-detail-view.tsx:1459`), so those show no location at all while every other record shows a Leaflet map.
- **Winner:** title what is shown ("Records by state"?) or build the mapsheet layer; use `SAMap` where a location is meant. Contracts: 0.3 (do not present the unreal as real). **Fix size:** 3 titles plus the 2 legacy screens. **Mechanical?** No.

### MAP-4 [LOW] Not verified, listed so it is not lost
- The DLA takeover and a nomination's areas map were not opened past the first step; the project extent circle shows a pin at the centre for an ordinary project while restricted records use blocks (`ref-roles`): consistent by design, but a restricted project's extent was not checked. The "Map visualise" dialog on the Data Validation Error report was not opened.

## 5. Decisions needed

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | IA-2: should a Registered or Privileged user see other people's DLA requests under "All requests"? | No: show "My requests" alone, as Nominations (decision 2026-10-06-05); guard the record URL too. |
| 2 | REC-9: edit in place (taxonomy, project) or a form route (everything else)? | Keep both only if documented in 4.8 and 4.1; otherwise move taxonomy to a route. Designer's call. |
| 3 | REC-5: name for the history tab ("Audit Log", "Audit history", "History") | "Audit Log" everywhere, per 4.6.6. |
| 4 | IA-3: Title Case or sentence case for section names; "Licence" spelling | Sentence case everywhere or Title Case everywhere, one choice; "Data Licence Agreement (DLA)". |
| 5 | REC-7: tabs for the Permission record | One "Roles" tab, eyebrow "Permission". |
| 6 | REC-10: is the flagged-concepts review an allowed inbox exception? | Name it as an exception in 3.7 (list plus detail, column 2 is the list) or rebuild as a record with a queue switcher. |
| 7 | IA-7: Add Project option 1 without rail | Add it to the 3.7 override list or give it the rail; decide when an option is chosen (4.4). |
| 8 | IA-9: is a scope switch a "facet" for the column-2 label rule? | Keep REQUESTS / AGREEMENTS / NOMINATIONS / PROJECTS; say so in decision 2026-10-06-10. |
| 9 | IA-10: should Role and Permission creation be in the Add menu? | Yes for BioData Admin, after User. |

Open order of work suggested: IA-1 and REC-1 (broken or wrong data), IA-2 (permission), then REC-2/REC-3/REC-6 (record-page consistency, mostly shared components), then naming (IA-3), then maps (MAP-1, MAP-2).

## 6. Promotion candidates (0.8, mechanical checks)

`=== "biodata-admin"` outside `lib/` (IA-1); a record route whose crumb has no switcher (REC-3); `RecordBackLink` text not starting "Back to" (REC-4); local `MetaField`/`Field` declarations (REC-6); a rendered `"-"` literal (REC-11); `month: "short"` outside a date util (REC-12); `Licencing` / `License` strings (IA-3); `doesn't have access` outside a shared component (IA-4); a `page.tsx` route missing from `screen-index.ts` (IA-6).

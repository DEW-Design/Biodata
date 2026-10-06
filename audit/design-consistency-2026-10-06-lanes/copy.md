# Copy audit (agent `copy`): casing, punctuation, spelling, terminology, formats

Audit date 6 Oct 2026. Read-only: nothing in the repo was changed. Evidence screenshots are in `.context/audit/shots/copy-*.png`. The prototype of the Title Case check is `.context/audit/copy-props-check.mjs`.

**Snapshot caveat.** The working tree was moving while this ran (other sessions were landing decisions 2026-10-06-10 to -15: the Taxonomy column-2 label, record pages losing column 2, Reports column 2). The live sweep ran first; a re-check at the end of the run showed Reports column 2 changed from "REPORTS" alone to "REPORTS / All reports / My reports / Actions" (decision 2026-10-06-15). Everything below is what was on screen at the time of the sweep, with that one re-check noted in COPY-5.

## 1. Scope and method

**Read first:** `CONTRACTS.md` (esp. 0.3, 0.9, 2.3, 2.9, 3.11-3.13, 4.2e, 4.6), `audit/type-audit-2026-09-29.md`, `lib/registered-user-nav.ts`, `lib/create-menu.ts`, `config/role-access.config.ts`, `app/pages/_shared/screen-index.ts`, the 2026-09-28-26 consistency decision (item 12, "Title case vs sentence case for field labels site-wide", was left open and never answered), and the decision files that mention sentence case.

**Static sweep.** Node scripts in `/tmp/dc-copy` (deleted at the end) over `app/pages/**` (excl. `projects`, `projectsv2`), `lib/**`, `components/base|application|custom/**`, `config/**`:
- 10,380 UI strings extracted (quoted strings, JSX text, template literals, multi-line JSX lines).
- 2,967 `label|title|heading|placeholder|header|eyebrow|subtitle|hint|description|aria-label` props classified as sentence / Title / mixed. A string is flagged when 2 or more non-initial words are capitalised and are not acronyms or proper nouns. Every cluster below was hand-checked against the file; data files (`*-data.ts`, species and project names) were removed from the counts.

**Live sweep (Playwright, 1708x1024, a fresh context per page, roles in the URL).** 74 routes: biodata-admin 45, biodata-super-admin 6, registered-user 15, public-user 8 (Home, Projects list, project page, an occurrence record page, Explore both layouts, DLA / DSA / nominations lists + records + new forms, User Management users / roles / permissions + 3 records + new user, Reports landing + all 11 reports (Data Ingestion 21 columns, SpecimenDB 93 columns), Template Finder, Taxonomy list + record + rename flow, Controlled Vocabulary list + record + new, Vouchers list + batch, Notifications list + record + new, Flagged concepts, auth login and signup, landing page). Extracted h1-h4, tabs, buttons, `th`, menu items, labels, breadcrumb, placeholders, aria-labels, column-2 text, body text. Rail tooltips hovered on three roles (super-admin 13 sections + 3 legal icons, registered 5 + 3, public 3 + 3). Add menu opened. **Zero console errors and zero page errors on all 74 routes.**

**Not covered (honest list):**
- Explore result states (needs a search) were read from source only, not live.
- Modals and toasts are static reads (about 45 toast calls and 34 modal sites), not opened live.
- Hover tooltips other than the rail and the "Help and Documentation" rail icon (the Next dev overlay blocks that hover).
- Mobile widths; the doc site; `/proto`; the Prototype tools bar (Scaffold, "Pages", "Viewing as"); the dev feedback toolbar (agentation) that appears in the page text.
- Email body copy in `nt-data.ts` templates was only skimmed.
- The brief's accepted items were not re-raised.

**What the house rule is (determined from evidence).** CONTRACTS is silent on UI casing. The only written sources are: 2.9 item 3 (Emil's skills judge "sentence case"), the banners pattern page ("The title says what is true, in a few words and sentence case"), and decision files 2026-09-28-26 ("Actions and copy are in sentence case"), 2026-09-29-59/60 ("Labels are sentence case"), 2026-09-30-17 and 2026-10-01-06 (report columns "sentence case and spelled out"), 2026-10-05-08 ("Title Case against sentence case everywhere else" listed as a defect). The dominant treatment in the product is sentence case. Title Case survives in clusters (below).

### Case by role (live routes, distinct multi-word strings; product pages only, auth and landing excluded)

Source casing that CSS uppercases (badges, eyebrows, column-2 group labels, `HeroMeta` labels) cannot be seen by a user and is listed separately.

| Role | Sentence | Title | What the Title ones are |
|---|---|---|---|
| Rail tooltip (13 module labels + 3 legal) | **0** | **12 of 12 multi-word** (Home, Projects, Explore, Reports are one word) | `lib/registered-user-nav.ts:12-20,223` |
| Breadcrumb section crumb | 0 | **9 of 9** | same constants |
| Page H1 of a report | 0 | **11 of 11** (11 reports) | `reports-data.ts:42-123` |
| Page H1 / record hero title | 1 ("Flagged concepts") | rest are record names (data) | n/a |
| Section header / list H2 (multi-word) | 4 (All projects, Sensitive species nominations, Controlled vocabularies, Scan batches) | 3 (Data Licencing Agreements, Data Sharing Agreements, Template Finder) | `dla-list.tsx:123,290`, `dsa-list.tsx:131,307`, `template-list.tsx:71` |
| Card / section H2 and H3 (all product pages) | 22 | 7 (Featured Projects, Knowledge Base, Location & License, ...) | `home-dashboard.tsx:371,388`, `dla-form.tsx:100` |
| Tab label (multi-word) | 29 | 18 | DLA / DSA / occurrence / taxonomy record tabs, Notifications categories |
| Column-2 item | 42 (All requests, My agreements, Conservation status) | 4 (Notifications categories: "Account & Access", "Data Submission & Ingestion", "Data Review & Quality", "Projects & Collections") | `nt-data.ts:33-36` |
| Column-2 group label | UPPER by CSS | UPPER by CSS | text: PROJECTS, REQUESTS, AGREEMENTS, NOMINATIONS, KINGDOM, CATEGORIES (x2), SOURCES, USER MANAGEMENT, REPORTS, TEMPLATE FINDER |
| Button (all `button` elements) | 40 | 13 distinct, mostly not actions: 8 permission-group accordions on the Role record ("Analytics Dashboard", "Application Access", "Help Center", ...), 3 breadcrumb switchers (DLA, DSA, Nominations), 1 project name, 1 other | `um-data.ts`, `registered-user-nav.ts:13,12,15`. Action buttons that are Title: "Create Project" (option 1), "Upload Shapefile", Quick action "Nominate Sensitive Species" (`home-dashboard.tsx:673`) |
| Menu item (Add menu, record "..." menus) | 7 of 7 | 0 | `create-menu.ts:26-33` |
| Modal title / alert title / toast title | all (static read of ~34 modals, ~45 toasts) | 0 | holds |
| Table column header | **138** (93%) | 7 (+4 mixed) | "Entered Value", "GDA2020 Equivalent" (`location-details-table.tsx:74`), "NSX Code", Voucher report "BioData - Rego ID" |
| Report column names (11 reports, 21 to 93 columns) | 10 reports fully sentence | SpecimenDB: 89 of 93 are raw camelCase Darwin Core terms (documented departure, see COPY-17) | |
| Form label (`label=` prop, source, all of `app/pages`) | 574 | 243 (30%) | clusters in COPY-3 |
| `title=` prop | 257 | 73 | |
| Placeholder | 155 | 11 (7%) | `Field Officer`, `Read Datasets` (um-forms), `E.g., ...` |
| Description / hint / subtitle | 290 | 5 | holds |
| Filter attribute names (`FilterMenu`) | all | 0 | holds |
| Badge text, eyebrow (visible) | UPPER by CSS, sentence in source | | prior audit holds |
| Empty-state heading | all ("No projects match") | 0 | holds |
| Chips | sentence | | holds |
| Report names | 0 | 11 of 11 | proper-noun treatment? see decision A |

Hidden-by-CSS source drift (no visible effect, a copy/paste and consistency risk): `HeroMeta label="Start Date"` / `"End Date"` at `project-detail-template.tsx:94-95` against `"Start date"` / `"End date"` at `project-details-view.tsx:133-134` and `cv-detail.tsx:245-246`; DSA hero "Valid From" / "Valid To" / "Data Partnership" (`dsa-detail.tsx:201-207`).

## 2. What holds

- Toast and alert titles and descriptions are sentence case, titles carry no full stop, and the status verbs line up ("Draft saved", "Request submitted", "Review started"). Static read of ~45 `toast.*` calls.
- Table column headers are 93% sentence case, including all 21 Data Ingestion columns and 10 of 11 reports.
- Filter attribute names, the Add menu items, empty-state headings ("No x match") and `ListEmptyState` actions ("Show all projects / requests / agreements / templates / nominations / artefacts") are consistent.
- Descriptions, subtitles and hints end with a full stop (217 of 275 single-sentence descriptions; the rest are option-card fragments); titles, labels, buttons and placeholders do not (183 of 214 titles, 106 of 120 placeholders).
- Em dashes: one in the product (`observation-detail/page.tsx:282`); arrows: none. 2.3 holds except that site.
- Table summary "1 - 50 of 60" and "Page 1 of N" come from one component (`components/application/table/table.tsx:525,413`), so every list reads the same.
- Thousands separators use `toLocaleString("en-AU")` on every report count; percentages and tabular figures are consistent.
- `organisation`, `favourites`, `cancelled`, `artefact`, `recognised`, `authorised` are British/Australian throughout; "Organization", "Cancelled" vs "Canceled", "color" in copy: 0 hits.
- Placeholder people are only the four allowed names in the sampled data.
- Rail tooltips equal the section label and the same label is the breadcrumb crumb (one constant), so rail and crumb never differ.

## 3. Findings

Ranked by visibility (rail, header, H1, column 2, buttons, tabs, table headers first). 24 findings: 8 HIGH, 10 MED, 6 LOW.

### COPY-1 [HIGH] No declared casing rule; the biggest surfaces (rail, breadcrumb, report names) are Title Case while everything else is sentence case (T12)
- **What:** Rail tooltips (12 of 12 multi-word), breadcrumb section crumbs (9 of 9), all 11 report names and the three list H2s "Data Licencing Agreements", "Data Sharing Agreements", "Template Finder" are Title Case. Column-2 items, tabs, buttons, menu items, table headers, placeholders, toasts and alerts are sentence case. The same Add menu that lists "Data licence request (DLA)" sits beside a rail that says "Data Licencing Agreement (DLA)".
- **Evidence:** `lib/registered-user-nav.ts:12-20` ("Data Sharing Agreement (DSA)", "Data Licencing Agreement (DLA)", "User Management", "Nominate Sensitive Species", "Template Finder", "Controlled Vocabulary", "Taxonomy Management", "Notification Management", "Voucher Management"), `:223` ("Terms and Conditions", "Privacy Policy", "Help and Documentation"), `app/pages/_shared/nav-icons.ts:14,16` (the same labels re-typed as keys), `create-menu.ts:26-33` (sentence), `reports-data.ts:42,50,58,66,74,82,90,98,106,114,123` (Title), `screen-index.ts:15-22` (the `Area` union mixes "User management" with "Controlled Vocabulary" and "Taxonomy Management"). Live counts in the table above. Hovered rail tooltips: super-admin 13 sections, all Title where multi-word. Screenshot `shots/copy-rail-superadmin.png`, `shots/copy-add-menu.png`.
- **Where it shows:** every route, every role (rail and crumb); Reports landing and 11 report headers; DLA / DSA / Template Finder list headers.
- **Winner:** sentence case, proper nouns excepted. Source order: design system (2.9 item 3 names sentence case; banners page; `Badge`/`Table.Head`/`Tab` copy all sentence), then dominant sibling pattern (about 70% of labels, 93% of column headers, 100% of toasts, menus, filters), then Emil skills. Module and report names are the open question: contracts silent - needs designer decision (decision A).
- **Clause / theme:** no clause (candidate new clause, "Proposed house style" below); T12.
- **Fix size:** about 12 labels in 1 file (`registered-user-nav.ts`) plus `nav-icons.ts` keys and `screen-index.ts`; 11 report names in `reports-data.ts` and each report file's title; touches the shared nav constants, so flows to rail, breadcrumb, mobile menu, Pages tool.
- **Mechanical?** Yes, partial: an AUTO check on `label|title|placeholder|heading|aria-label|description` string props and JSX text that flags 2 or more capitalised non-initial words, with a proper-noun allow-list and a ratchet in `contracts/baseline.json` (the same shape as 2.1b). My `/tmp/dc-copy/props.mjs` is the prototype (about 25 lines).

### COPY-2 [HIGH] One concept, many names, three spellings: the Data Licence Agreement (T9, T12)
- **What:** DLA is "Data Licencing Agreement (DLA)" (rail, crumb), "Data Licencing Agreements" (list H2), "REQUESTS" (column-2 header), "DATA LICENCING AGREEMENT" (record eyebrow), "DATA LICENCE REQUEST" (form eyebrow and column-2 header), "Data licence request (DLA)" (Add menu), "Data Licence Agreement Report" (report), "Licence requests / Request a licence" (screen index), "Data Licensing Agreement" (empty state), "License Category" (US spelling), "Data licence" (upload-form field and the Controlled Vocabulary entry). Verb and noun: "licence" (noun), "licensing" (gerund) are the Australian forms; "Licencing" is neither.
- **Evidence (terminology table):**

| Surface | Wording | Source |
|---|---|---|
| Rail tooltip, breadcrumb, Explore note | Data Licencing Agreement (DLA) | `registered-user-nav.ts:13` |
| Column-2 header | REQUESTS (tabs All requests / My requests) | `agreement-scope.tsx` via `dla-list.tsx` |
| List H2 | Data Licencing Agreements | `dla-list.tsx:123,290` |
| Record hero eyebrow | DATA LICENCING AGREEMENT | `dla-detail.tsx:323` |
| New form eyebrow, column-2 header | DATA LICENCE REQUEST | live `/pages/dla/new` |
| Add menu | Data licence request (DLA) | `create-menu.ts:29` |
| List create button, new crumb | New request | live |
| Home quick action, admin queue | Request new DLA; "DLA requests"; "Data licencing agreements waiting for a decision." | `home-dashboard.tsx` |
| Report card, report H1 | Data Licence Agreement Report | `reports-data.ts:114` |
| Screen index | Area "Data licence (DLA)"; names "Licence requests", "Request a licence", "Licence request" | `screen-index.ts:12,58-60` |
| Empty state | There are currently no Data Licensing Agreement associated with your account | `dla-detail.tsx:510,516` |
| Field | License Category (x5), "License category for ..." aria-label | `dla-detail.tsx:88`, `dla-form.tsx:66,100,249,362,375`, `dla-detail.tsx:434` |
| Locked-record copy | Data Licencing Agreement (x14 sites incl. `dla-shell.tsx:123`, `record-peek-card.tsx:92`, `observations-search.tsx:1269,1346,1674,1675`) | |
| Counts (UI strings only, comments excluded) | "Licencing" in 15 strings, "Licensing" in 4 (2 are the correct CV category "Licensing and media"), "License" as a noun in 7 strings, against "Licence" in 34 strings | `strings.json` scan over `app/pages`, `lib`, `components`, `config` |

- **Where it shows:** DLA list, record, new form, Explore notes, Home, Reports, Add menu, rail, for registered, admin, super-admin (public sees the locked copy).
- **Winner:** one name from one constant. Contracts silent - needs designer decision (decision B). Recommendation: "Data licence agreement (DLA)" for module and record, "licence" for the noun throughout (the Add menu and screen index already use it), "request" only as the word for a record before approval.
- **Clause / theme:** no clause; T9, T12. The IA brief spelled it "Licencing", so this may be a copied typo, not a naming decision.
- **Fix size:** about 12 files, 60 lines; the shared constant `DLA_SECTION_LABEL` flows to rail, crumb, Pages tool.
- **Mechanical?** Yes: AUTO check banning `Licencing` and `\bLicense\b` (noun, outside URLs and `licenseUrl`) in `app/pages` strings.

### COPY-3 [HIGH] Title Case clusters inside sentence-case screens, same role on the same screen (T3, T12)
- **What:** On a single screen the same role carries both treatments.
  - **Home (registered):** KPI labels "Species Observed", "Completed Checklists" beside "Datasets contributed"; Quick actions "Manage projects & datasets", "Request new DLA" beside "Nominate Sensitive Species"; section headings "Featured Projects", "Knowledge Base" beside "Quick actions", "Needs your attention". Admin Quick actions: "User Management", "Controlled Vocabulary", "Reports".
  - **DLA form vs DSA form (siblings, both `FormPage`):** DLA "First Name", "Last Name", "Start Date", "End Date", "Agreement Period", "Purpose of Data Use", "Your Information", "Contact No."; DSA "First name", "Last name", "Agreement period", "Purpose of data sharing". Column 2 steps: DLA "Location & License / Details & Purpose / Review & Submit"; DSA "Agreement / Contacts / Data sharing" (screenshots `shots/copy-dla-new.png`, `shots/copy-dsa-new.png`).
  - **Auth setup-profile:** label "First Name" with placeholder "First name" on the same `Input`.
  - **Option 1 Add Project, taxonomy flows, Explore record page, observation-detail, project-detail Option 2:** Title Case throughout (copied from Figma, see below).
- **Evidence:**
  - Home: `home-dashboard.tsx:371,388,504,505,658,660,673` (Title) against `:502,669,659,671,672,683` (sentence: "Quick actions", "Datasets contributed", "Manage projects & datasets", "Request new DLA", "Needs your attention").
  - DLA: `dla-form.tsx:100-102,249,272,284,287,296,316,319,327,352,362,375,391,398,404`, `dla-detail.tsx:88,112,201,202,205,327,405,407,415,419,425,434,459,509`, `add-location-modal.tsx:32,165,183,208,219`. DSA: `dsa-form.tsx:72-74,407`.
  - Taxonomy: `tx-flows.tsx:214,218,224,229,239,244,250,255`, `tx-actions.tsx:68,71,96,112,197,199,210,214,221`, `tx-fields.tsx:279`, `tx-records.tsx:526,527`.
  - Option 1 registration: `step-1-project-details.tsx:58,71,110,111,211,212,230,231,234,337,343,344,346`, `step-2-data-collection.tsx:212,230,239,251`, `step-3-privacy-restrictions.tsx:36-39,141,172,203,219`, `data.ts:7,35,40-43,50,51,134,140-144`, `stepper.tsx:16-18`, `success-screen.tsx:8-11,20`.
  - Auth: `setup-profile/page.tsx:129,130,133,141,148`, `forgot-password/page.tsx:22` ("Forgot Password?"), `reset-password/page.tsx:32,37`, `set-password/page.tsx:31`, `account-created/page.tsx:16` ("Account Created!"), `reset-success/page.tsx:22`.
  - Legacy Figma copies (teammate-built pages, decision 2026-09-28-26 scope note): `map-search/record-detail.tsx` (70 of 72 label/title props are Title), `observations-search.tsx` (36 of 63), `observation-detail/page.tsx` (28 of 41), `project-detail/option-2/project-detail-view.tsx` (28 of 43), `species-results.tsx` (9 of 11). Live: the occurrence record page (`/pages/project-list/kangaroo-island/project-details/occurrences/occ-7`) tabs read "Occurrence Details", "Temporal Details", "Location Information", "Custom Property"; fields "Legacy Sighting #", "Species Seq No", "Occurrence Name", "Taxonomic Type" (screenshot `shots/copy-occ-record.png`).
  - Taxonomy record tabs (live): "SA Regions", "Australian & Overseas Distribution", "Reference Herb Data", "Common Name", "Linked Species".
  - Home dashboard per the 2026-10-05-08 decision was audited and "Featured Projects", "Knowledge Base", "Species Observed", "Completed Checklists" were named as defects; they are still Title in `home-dashboard.tsx`.
  - Screenshot `shots/copy-home-registered.png`.
- **Where it shows:** Home (registered, admin), DLA new/edit/record, taxonomy rename/combine/split flows, Add Project option 1, auth screens, Explore record page, project-detail Option 2, occurrence record page.
- **Winner:** sentence case (see COPY-1). Records and Figma-derived labels need the designer's say (decision A).
- **Clause / theme:** no clause; T3 (same role), T12.
- **Fix size:** about 25 files, about 330 strings (record-detail.tsx alone is 70; the registration option 1 files about 60; DLA about 40; auth about 12; taxonomy about 25; Home 7).
- **Mechanical?** Yes, same check as COPY-1.

### COPY-4 [HIGH] Nominations: six names for one module (T9)
- **What:** Rail and crumb "Nominate Sensitive Species" (a verb phrase, Title Case), column-2 header "NOMINATIONS", list H2 "Sensitive species nominations", Add menu "Sensitive species nomination", record eyebrow "SENSITIVE SPECIES NOMINATION", list button "Nominate a new species", new-form crumb "New nomination", screen index Area "Nominations" and "Nominate a species", Home quick action "Nominate Sensitive Species", project registration "Nominate Sensitive Location".
- **Evidence:** `registered-user-nav.ts:15`; `create-menu.ts:30`; `nomination-list.tsx:187-192` (action); live `/pages/nominations` (admin: "NOMINATIONS", "Sensitive species nominations", "Nominate a new species"); live record hero "SENSITIVE SPECIES NOMINATION"; `screen-index.ts:14,64-66`; `home-dashboard.tsx:673`.
- **Where it shows:** rail, crumb, list, record, Add menu, Home, for registered, admin.
- **Winner:** one name; contracts silent - decision B. Recommendation: module "Sensitive species nominations", record "Sensitive species nomination", action "Nominate a species" (the verb stays on the button, not the rail).
- **Clause / theme:** no clause; T9.
- **Fix size:** 1 constant (`NOMINATION_SECTION_LABEL`) plus about 6 files.
- **Mechanical?** No (needs a terms list). A terms file (`lib/terms.ts`) read by the nav, Add menu, H2 and eyebrows would make drift a type error, which is the structural fix.

### COPY-5 [HIGH] Column-2 header: the facet rule logged on 6 Oct is applied to four sections, not the other seven (T9)
- **What:** The designer asked on 6 Oct why Taxonomy's section header and column-2 header differed. Decision `2026-10-06-10-taxonomy-column-2-label-names-the-facet-not.md` set the rule: column 2's label names what its items group by ("Categories", "Sources", "Kingdom"), "never the thing listed", the rail and crumb name the section, the list H2 names the collection. That rule is in force on four sections. The other seven still carry the section name (PROJECTS, USER MANAGEMENT, TEMPLATE FINDER) or the thing listed (REQUESTS, AGREEMENTS, NOMINATIONS, and REPORTS at the time of the sweep). Measured live (column 2 text, Reports re-checked at the end of the run):

| Module | Rail / crumb | Column-2 label | List H2 | Follows the facet rule? |
|---|---|---|---|---|
| Projects | Projects | PROJECTS | All projects | no (section name) |
| DLA | Data Licencing Agreement (DLA) | REQUESTS | Data Licencing Agreements | no (the thing listed) |
| DSA | Data Sharing Agreement (DSA) | AGREEMENTS | Data Sharing Agreements | no (the thing listed) |
| Nominations | Nominate Sensitive Species | NOMINATIONS | Sensitive species nominations | no (the thing listed) |
| User Management | User Management | USER MANAGEMENT | Users / Roles / Permissions | no (section name) |
| Taxonomy | Taxonomy Management | KINGDOM | Species | yes |
| Controlled Vocabulary | Controlled Vocabulary | CATEGORIES | Controlled vocabularies | yes |
| Notifications | Notification Management | CATEGORIES | Notifications | yes |
| Vouchers | Voucher Management | SOURCES | Scan batches | yes |
| Template Finder | Template Finder | TEMPLATE FINDER, then SPECIES TYPE and COLLECTION METHOD | Template Finder | partly (section name, then facet sub-labels) |
| Reports | Reports | REPORTS (sweep); "Categories" per decision `2026-10-06-13`, then `-15` reworked it to REPORTS / All reports / My reports | Reports | in flux |

  The header also differs in case from the rail only in the browser (CSS uppercases it), so it reads as a different name, not a different case.
- **Evidence:** live column-2 text on each route above; source `dla-shell.tsx:64` (`heading="Requests"`), `tx-shell.tsx:68,77` (the rule written in a comment; `heading="Kingdom"`), `nt-shell.tsx:75`, `vm-shell.tsx:62`, `cv-shell.tsx:91`. Re-check at the end of the run: `/pages/reports` column 2 = "REPORTS All reports My reports ACTIONS Create a report".
- **Where it shows:** every list screen, admin and super-admin; DLA, DSA, Nominations, Projects for registered.
- **Winner:** the 6 Oct facet rule, applied to every list. For an All / My list (Projects, DLA, DSA, Nominations) the facet is the scope, so the label would be "Show" or "Scope" or no label; that wording is not decided. Source order: a logged designer-asked decision, then the sibling pattern; contracts 4.6 item 5 covers records only and is silent for lists.
- **Clause / theme:** no clause (the rule lives only in decision `2026-10-06-10` and a code comment, so it is not enforceable); T9.
- **Fix size:** 7 shells, one string each; no shared component change.
- **Mechanical?** No. Writing the rule into CONTRACTS (4.2 list header) would make it `REVIEW`; an AUTO check could require a `heading` that is not the rail label or the list's own plural noun.

### COPY-6 [HIGH] Brand name: "BioData SA" vs "Biodata SA", and every product tab reads "DEW Design System" (T9)
- **What:** The header wordmark and about 80% of copy say "BioData SA". The auth screens' wordmark, the landing page (wordmark, body and headings) and the guest Home guides say "Biodata SA" / "Biodata" / "Biodata and NatureMaps". The browser tab title is "DEW Design System" on all 74 product routes.
- **Evidence:** `app-header.tsx:61` ("BioData SA") against `auth/_shared/auth-shell.tsx:22`, `auth/account-created/page.tsx:20`, `biodata-home/page.tsx:520,601,651,729,732,747,772,924`, `guest-home.tsx:102`, `biodata-home/page.tsx:263,350`; "BioData SA" is also on the same landing page at `:333,596,677,796`, so one page uses both. `app/layout.tsx:37` is the only `title`; no page exports metadata (74 of 74 routes, `document.title` = "DEW Design System").
- **Where it shows:** every auth screen header, the landing page, the browser tab on every screen, all roles.
- **Winner:** "BioData SA" (header, domain text, the dominant spelling: 68 UI strings against 14 for "Biodata"). The tab title: contracts silent - needs designer decision (decision C).
- **Clause / theme:** no clause; T9, T12.
- **Fix size:** 4 files for the spelling; the tab title is one `metadata` export plus per-route `title`.
- **Mechanical?** Yes: AUTO ban on `Biodata` (capital B, lower d) followed by ` SA` or end of word in strings, except URLs.

### COPY-7 [HIGH] Dates: three month spellings, ISO on one record, three date-time shapes, no single formatter (T12)
- **What:** `Intl.DateTimeFormat("en-AU", {month: "short"})` in this Chromium returns "Sept", "June" and "July"; the hand-typed month arrays and seed data say "Sep", "Jun", "Jul". The two meet on one page: the DLA agreement report shows "21 Sept 2026" and "21 Sep 2026" in the same table, DSA report "20 Sept 2026" beside "20 Sep 2026" (counts across the 74 routes: "Sep" 66, "Sept" 182, "Jul" 12, "July" 73, "Jun" 2, "June" 97). An occurrence record's hero shows "2026-05-14". Date and time reads three ways.
- **Evidence:**
  - Hand-copied month arrays (4): `audit-feed.tsx:28`, `list-filter.tsx:116`, `dla/dla-data.ts:139`, `dsa/dsa-data.ts:73`.
  - `Intl` / `toLocaleDateString` formatters (at least 11): `attribute-filter.tsx:64`, `report-table.tsx:36,37`, `post-ingestion-report-data.ts:119`, `ingestion-report-data.ts:396,398`, `um-data.ts:98`, `tx-store.ts:53`, `project-detail/project-tab.tsx:45`, `survey-data.ts:1048`, `field-schema.ts:265`, `field-notes-store.ts:435`, `date-range-control.tsx:36`.
  - Plain `toLocaleDateString("en-AU")` (renders 23/09/2026): `project-registration/option-2/review-section.tsx:17`, `concept-rows.tsx:66`, `step-3-privacy-restrictions.tsx:87`. `export-utils.ts:77` uses `month: "long"`.
  - Date-time: "19 Aug 2026, 10:12" (`cv-data.ts:337`, `nt-data.ts:578`, 24-hour, comma), "9 Aug 2026, 10:12 AM" (`vm-data.ts:368`, 12-hour), "27 Sept 2026 08:47" (`ingestion-report-data.ts:396-397`, 24-hour, no comma, zero-padded hour).
  - ISO on a hero: live `/pages/project-list/kangaroo-island/project-details/occurrences/occ-7`, "DATE 2026-05-14" (`project-details-view.tsx:137`).
  - Ranges: "to" in 8 places (`dla-detail.tsx:312,314,421`, `nomination-data.ts:161`), "-" once (`dla-detail.tsx:461`), "From ..., until ..." in Home.
  - Screenshot `shots/copy-report-dla-dates.png`.
- **Where it shows:** every list with an Updated column, every report, DLA / DSA records, Home tasks, filter chips; the "Sept" form appears for admin and registered on every Intl-formatted date.
- **Winner:** one formatter. Dominant is "23 Sep 2026" (3-letter, hand format: the Updated columns, 187 distinct dates). Contracts silent - decision D.
- **Clause / theme:** no clause; T12. Related decision 2026-09-28-26 item 7 ("Dates appear in four formats") is still open.
- **Fix size:** one new `lib/format-date.ts`, then about 20 call sites.
- **Mechanical?** Yes: AUTO check forbidding `toLocaleDateString(`, `Intl.DateTimeFormat(` and a literal `["Jan", "Feb"` array outside the one module.

### COPY-8 [HIGH] Empty values: seven wordings, and a stray "-" in more than 60 places (T11, 2.3)
- **What:** "Not provided" (about 62 on live pages, 33 files), "-" (record page rows, Explore result cells), "Not set", "Not recorded", "No end date", "Ongoing", "None", "Not applicable", "No locations". CONTRACTS 2.3 says an empty value is omitted or "Not provided", "never a stray `-`". The 28 Sep audit listed the "-" fields as an open decision; they are still there.
- **Evidence:**
  - "-" : `map-search/record-detail.tsx:69` (`const DASH = "-"`, used 51 times), `species-results.tsx:180-183,351,356,358`, `observations-search.tsx:267` plus 5 more `?? "-"` sites, `search-data.ts:374,375` (species "-"); rendered 8 times on `/pages/project-detail` and the occurrence record page.
  - "Not set": `dla-detail.tsx:315`, `dla-form.tsx:400`, `dla-list.tsx:203`, `dsa-list.tsx:200,221`, `vm-compare.tsx:273`.
  - "Not recorded": `audit-log.tsx:47`, `vm-parts.tsx:38`, `vm-data.ts:105`.
  - "No end date": `cv-detail.tsx:246,311`, `um-detail.tsx:335`, `nt-detail.tsx:240`; against "Ongoing" for a project (`project-detail-template.tsx:95`, 16 live hits), and "Not provided" for a missing start date.
  - "Not applicable": `um-detail.tsx:642`, `um-lists.tsx:41`; "None": `data-ingestion-report.tsx:126` (60 live hits, documented in decision 2026-09-30-17 as "a download does not apply").
- **Where it shows:** record pages (project, occurrence, user, role, permission, DLA, DSA, voucher), Explore tables, reports; admin and registered.
- **Winner:** "Not provided" (2.3, the dominant wording). Others need a decision (decision E): what "no end date" and "does not apply" read as.
- **Clause / theme:** 2.3 (violated by the "-"), T11.
- **Fix size:** 51 + about 12 sites in 2 shared files (`record-detail.tsx`, `species-results.tsx`) plus about 10 one-offs.
- **Mechanical?** Yes: extend AUTO 2.3 to flag `?? "-"`, `: "-"`, `const DASH = "-"` in `app/pages` (ratchet).

### COPY-9 [MED] Empty lists: six lists still show a bare grey line, and the action reads "Clear search and filters" (T11, 4.2e)
- **What:** 4.2e says a collection with no rows renders `ListEmptyState` and the action is "named by its outcome", never "Clear search". The DLA, DSA, Nominations, Projects, Template Finder, artefacts and report lists do. Controlled Vocabulary, Notifications (two layouts), Vouchers, the User Management lists (one shared wrapper) and the Taxonomy species list still draw a bare line, three of them with a link-style "Clear search and filters" button.
- **Evidence:** `ctrl-vocab/cv-list.tsx:143-158` ("No vocabularies match your filters." / "Clear search and filters"), `notifications/nt-list.tsx:122,134`, `nt-list-2.tsx:148,164`, `vouchers/vm-list.tsx:117-129`, `user-management/um-lists.tsx:116` ("Nothing matches your search and filters."), `taxonomy/tx-records.tsx:187` (straight quotes). The same four sentences use curly “ ” in three files and straight " " in `tx-records.tsx:187`.
- **Where it shows:** the lists above, any role that can open them (admin, super-admin).
- **Winner:** `ListEmptyState` with "Show all <things>" (4.2e).
- **Clause / theme:** 4.2e (REVIEW only, "first occurrence, so no AUTO check yet"; this is the second site cluster, §0.8 promotion due), T11.
- **Fix size:** 6 files; `ListEmptyState` is shared.
- **Mechanical?** Yes: AUTO check on `Clear search and filters` and on a `rows.length === 0` branch in a file that imports `TableCard`/`FilterMenu` but not `ListEmptyState`.

### COPY-10 [MED] "&" against "and" (T12)
- **What:** 45 distinct strings use " & " (headings, tabs, filter groups, column labels) where the dominant UI voice says "and" ("Privacy and restrictions", "Data collection and methodology", "Flora and Fauna Dashboard", "Events, Occurrences and Observations Report", "Artefacts and attachments").
- **Evidence:** `dla-form.tsx:100-102,249,362,391` ("Location & License", "Details & Purpose", "Review & Submit"), `dla-detail.tsx:405,434` and tab "Locations & Access" (live), `nt-data.ts:33-36` ("Account & Access", "Data Submission & Ingestion", ... 29 uses), `home-dashboard.tsx:305,671`, `artefact-table.tsx:66`, `project-detail-view.tsx:1387`, `record-detail.tsx` (16), `add-location-modal.tsx:221,222`, auth/setup-profile (2). The same field twice: "Life form & desc" (`survey-data.ts`, `field-options.ts`) against live "Life form and description" (`species-detail-report` column).
- **Where it shows:** DLA tabs and form, Notifications column 2 and tabs, Home, artefacts, Explore record page.
- **Winner:** "and". Contracts silent; recommend adding (see house style).
- **Clause / theme:** no clause; T12.
- **Fix size:** about 12 files, 45 strings (the `nt-data.ts` category names are keys: change in one place, 29 rows).
- **Mechanical?** Yes: AUTO check on `\w & \w` and `&amp;` in JSX text and string props, allow-list for proper names.

### COPY-11 [MED] US spellings in an Australian English product (T12)
- **What:** "License" (noun) 22 times in DLA, "Data Licensing" 5 times, "Center" in the shared text editor, "standardized", "Analyze", "behavior", "Help Center".
- **Evidence:** `dla-form.tsx:66,100,249,362,375`, `dla-detail.tsx:88,434,510,516`, `artefact-lightbox.tsx:223` ("License" row), `text-editor/text-editor-toolbar.tsx:55,98` and `text-editor-extensions.tsx:226` ("Center align"), `template-data.ts:32,68` ("standardized"), `um-data.ts:197` ("Analyze user engagement"), `:200` ("user behavior"), `:204,304,321,336,349` ("Help Center"), `ctrl-vocab/cv-data.ts:712` is fine ("Licensing and media" is the gerund, correct). Hits for organization, color, canceled, favorite, gray in copy: 0.
- **Where it shows:** DLA new/edit/record, the Role record (permission groups), Template Finder rows, the artefact lightbox, any text editor.
- **Winner:** Australian: licence, centre, standardised, analyse, behaviour. Source order: the brief states Australian English (T12).
- **Clause / theme:** no clause (candidate); T12.
- **Fix size:** about 9 files, about 17 strings; the editor strings are in `components/base` (one shared fix).
- **Mechanical?** Yes: AUTO banned-words list over string literals and JSX text.

### COPY-12 [MED] Apostrophes, quotes and ellipses (T12)
- **What:** The auth flow uses curly apostrophes (`&rsquo;`, 5 sites) and the product uses straight ones (about 256: 233 in strings and 23 `&apos;`). Four empty-state lines use curly double quotes, one file straight. The ellipsis is "…" in 18 places and "..." in 3.
- **Evidence:**
  - Curly: `auth/login/page.tsx:48` ("Don't have an account?" is the only curly contraction in the 74 live routes), `check-email/page.tsx:33`, `verify-email/page.tsx:29,42`, `success-screen.tsx:22` (`&lsquo;`), `cv-list.tsx:145`, `nt-list.tsx:122`, `nt-list-2.tsx:148`, `vm-list.tsx:117` (“ ”).
  - Straight: `tx-records.tsx:187`, all `&apos;` and `'` sites in `*-shell.tsx` (23).
  - Ellipsis: `...` at `location-restriction.tsx:53`, `species-restriction.tsx:104`, `step-3-privacy-restrictions.tsx:204`; `…` at `nomination-form.tsx:299` (same placeholder, "Enter a justification…"), `agreement-modals.tsx:21`, `observations-search.tsx:100,1538,1573`, `text-editor.tsx:61`.
  - Live count (74 routes, rendered text): 94 straight apostrophes in contractions and possessives against 1 curly ("Don't have an account?").
- **Where it shows:** the auth screens against every product screen.
- **Winner:** contracts silent; the prior audit's D12 (curly) is still Open - decision F. Whatever is chosen, one. "…" single character is the dominant ellipsis and the typography convention (`/emil-typography`).
- **Clause / theme:** no clause; T12.
- **Fix size:** ellipsis 3 sites; apostrophes: 5 sites if straight wins, about 280 if curly wins (the prior audit recommended "new copy only").
- **Mechanical?** Yes for the ellipsis and the `Eg;` family: AUTO regex. Apostrophes: AUTO for the chosen form, ratcheted.

### COPY-13 [MED] Create and leave verbs drift (T12)
- **What:**
  - List create button: "New request" (DLA), "New agreement" (DSA), "New notification", "New vocabulary" against "Add user", "Add role", "Add permission", and "Nominate a new species" (Nominations). The final submit: "Submit nomination", "Create project" (option 2) / "Create Project" (option 1), taxonomy "Review and commit". The guest Home says "Register a project", everything else "Add project". "New Taxon" and "New taxon" both exist.
  - Leaving a form: confirm label "Discard changes" (9), "Discard" (`um-forms.tsx:44`), "Leave" (`tx-flows.tsx:280`), "Discard project" (`option-2/page.tsx:195`), "Discard upload" (`upload-form.tsx:248`); titles "Discard your changes?" (7) against "Discard this ${what}?" and "Leave this taxon change?".
  - Acknowledge: "Noted" (13) against "OK" (4: `form-page.tsx:95`, `cv-form.tsx:454`, `record-full-view.tsx:519`, plus the "Details missing" alerts).
  - Export: "Export CSV" (14 live, `project-card-actions.tsx:62`, `report-columns.tsx:87`) against Explore's "Export as CSV / Excel / PDF" (`observations-search.tsx:1392-1398`) and "Export results".
- **Evidence:** as listed; live buttons and list headers on each route.
- **Where it shows:** every list header, every form's discard prompt, Explore export menu.
- **Winner:** the shared set in 3.12 gives the icons, not the verbs; contracts silent - decision G (see below). "Export CSV" is the dominant (14 of 17).
- **Clause / theme:** 3.12 (icon set only); T12.
- **Fix size:** about 10 files; 3 shared (`ConfirmationModal` default labels would give one discard wording).
- **Mechanical?** Partial (a verb table, no).

### COPY-14 [MED] Same tab, different names across records (3.13, T9)
- **What:** DLA and DSA records: "Audit Log". Nominations: "Audit history". Controlled Vocabulary and Notifications: "History". Artefacts: "Artefacts and attachments" (project tab, 5 sites), "Artefacts & Attachments" (`artefact-table.tsx:66` card heading, `project-detail-view.tsx:1387`), "Artefacts and Attachments" (`observations-search.tsx:137,1482`), "Attached Resources" (`observation-detail/page.tsx:621`). DLA hero: "Agreement Period", "Requested Agreement Period", "Agreement Grant Period" (`dla-detail.tsx:327,419,459`). The DSA counterparty is "Data partner" (list), "Data partnership with" (form), "DATA PARTNERSHIP" (hero), "Partnership organisation" (report).
- **Evidence:** `dla-detail.tsx:407`, `dsa-detail.tsx:261`, `nomination-detail.tsx:154`, CV and notification tabs (live), the artefact lines above. CONTRACTS 3.13 names the concept "Audit log and history".
- **Where it shows:** record pages for admin and registered.
- **Winner:** "Audit log" (3.13's own wording; DLA, DSA) and sentence case; "Artefacts and attachments" (3.13, the project tab).
- **Clause / theme:** 3.13 (partial), T9.
- **Fix size:** about 8 sites.
- **Mechanical?** No.

### COPY-15 [MED] One field, several labels: organisation, phone, requestor (T9, T12)
- **What:**
  - Organisation: "Organisation / Institution" (5), "Organisation / institution" (2), "Institution / organisation" (1), "Organisation/institution" (the Project Detail Report column), "Institution Name" / "Institution name", "Institution Rego #" / "Institution rego #".
  - Phone: "Phone number" (3), "Phone Number" (3, one with "(optional)"), "Contact no." (2), "Contact No." (2), "Contact number" (1, plus "Enter contact no" placeholder) against a bare "Phone" on the DLA record.
  - Requestor/requester: "Requestor" (DLA list, report columns "Requestor full name", "Data Requestor") against "requester" (DSA search placeholders `dsa-list.tsx:153,324`, 12 description strings, `nt-data.ts`); the same two spellings meet in one filter set.
  - Slash spacing: "Organisation / Institution" and "Museum / Herbarium - Rego ID" (spaced) against "Organisation/institution", "Created by/source", "Cover/abundance" (tight).
  - Abbreviations: "Seq #" (`project-detail-report.tsx:34`), "Seq#" (`dla-agreement-report.tsx:28`, `dsa-agreement-report.tsx:25`), "Contact No.", "Permit No.", "Permit Number", "Desc", "NSX Desc".
- **Evidence:** `step-1-project-details.tsx:58,71,211,234,346`, `option-2/form-sections.tsx` ("Phone number", "Permit no."), `um-forms.tsx` ("Contact no."), `dla-form.tsx:352`, `setup-profile/page.tsx:141,148`, `agreement-report-columns.tsx:35`, `dla-list.tsx:171,268,269,307,344`, `dsa-list.tsx:153,324`.
- **Where it shows:** every form that asks for a person or organisation, DLA and DSA lists and reports.
- **Winner:** "Organisation or institution" is the form label pattern in registration option 2; recommend "Phone number", "Requester" (the Macquarie preferred spelling and the dominant in descriptions), "Seq #". Contracts silent - decision H.
- **Clause / theme:** no clause; T9, T12.
- **Fix size:** about 15 files, 35 strings.
- **Mechanical?** Partial: a terms list for these labels.

### COPY-16 [MED] Log in vs Sign in, and "Setup" for the verb (T9, T12)
- **What:** The header and landing say "Log in" (decision 2026-09-28-26 fixed "Login" to "Log in"); the auth screens say "Sign in to your account", button "Sign in", "Back to Sign in" (Title Case S), "Forgot Password". The verb "set up" is "Setup your Profile" (`setup-profile/page.tsx:103,106`, `account-created/page.tsx:20,24`: "Setup your profile details to access Biodata SA").
- **Evidence:** `auth/login/page.tsx:31,44`, `check-email/page.tsx:38`, `verify-email/page.tsx:50` ("Back to Sign in" x3), `guest-auth-actions.tsx` ("Log in"). Screenshot `shots/copy-auth-login.png`.
- **Where it shows:** public-user header and auth flow.
- **Winner:** "Log in" (dominant in the product shell, 2.3 prior decision), "set up". Contracts silent.
- **Clause / theme:** no clause; T9, T12.
- **Fix size:** about 6 strings in 5 files.
- **Mechanical?** Yes: ban `Sign in` / `Setup your` strings.

### COPY-17 [MED] Report names and report columns (T9, T12)
- **What:** Report names have no pattern: eight end in "Report", two do not ("Project Dataset Post Ingestion"), one is "Data Ingestion Report Pre-Flight Validation" (word order broken: "Report" in the middle), and the DLA report is "Data Licence Agreement Report" while its module is "Data Licencing Agreement". All 11 are Title Case, the only Title Case H1s in the product. The SpecimenDB Refresh Report shows 89 of its 93 columns as raw camelCase Darwin Core terms ("rightsHolder", "occurrenceID") beside "Batch ID / Batch date" in sentence case; the Species Detail Report spells the same data out ("Life form and description"). The voucher report columns read "Museum / Herbarium - Scientific name" (Title/sentence mix, spaced hyphen as the separator).
- **Evidence:** `reports-data.ts:42-123`, `screen-index.ts:94-106`, `specimendb-refresh-report.tsx:13-22` (documents the departure: "labelled with the Darwin Core term"), `voucher-id-update-report.tsx:22,99`, live th lists.
- **Where it shows:** Reports landing (cards), each report H1, Report switcher, Pages tool; admin and registered.
- **Winner:** "<Subject> report" in sentence case; DwC raw names: contracts silent - decision I (the departure is documented and deliberate, so this is a call, not a defect).
- **Clause / theme:** no clause; T9, T12.
- **Fix size:** 11 names in `reports-data.ts` and each report file; the DwC question is one file.
- **Mechanical?** No.

### COPY-18 [MED] Separators in eyebrows and sub-labels (T12)
- **What:** The same slot, "label, then detail", uses a spaced hyphen in form eyebrows ("NEW REQUEST - STEP 1 OF 3", "STEP 1 OF 3 - PROJECT IDENTIFICATION", "NEW NOMINATION - STEP 1 OF 4", "Flagged concept - 1 of N"), and a middle dot elsewhere ("NOTIFICATION · DATA SUBMISSION & INGESTION", "RENAME · 1 TO 1", "Pelodryadidae · Amphibian", "Last upload · 9 Feb 2026"). The spaced hyphen as a pause is the 2.3 convention (94 strings); the middle dot is 74. Home mixes both in one list ("DLA request - Naracoorte Caves National Park" next to "BD-5039 · Adelaide Hills Bushland Survey").
- **Evidence:** `cv-form.tsx:280`, `upload-form.tsx:141`, `dla-form.tsx:236`, `um-forms.tsx:265`, `review-view.tsx:542` against `nt-detail.tsx:137`, `datasets-view.tsx:434`, `project-record-tree.ts:41-102`, `record-peek-card.tsx:128,142`, `global-search.tsx:102`.
- **Where it shows:** form headers, record eyebrows, search results, Home.
- **Winner:** hyphen for a pause in a sentence (2.3), middle dot for a metadata list. State the split as a rule.
- **Clause / theme:** 2.3 (hyphen); T12.
- **Fix size:** about 10 strings.
- **Mechanical?** No.

### COPY-19 [LOW] "e.g." in five forms, one a typo (T12)
- **What:** "Eg; Order" and "Eg; Order Name" (typo, semicolon) in the taxonomy form; "E.g., ..." (US comma) 7 sites; "E.g. monitoring ..." (no comma); "e.g. media/images"; and "For example" (6 sites: `cv-form.tsx:92,94,385`, `nt-form.tsx:382,388`, `nomination-detail.tsx:280`). Australian practice: "e.g." with no comma.
- **Evidence:** `tx-actions.tsx:197,200`, `project-edit.tsx:214,339`, `record-form.tsx:316`, `location-restriction.tsx:49`, `option-2/form-sections.tsx:62,86,346`, `step-1-project-details.tsx:185,193`, `step-2-data-collection.tsx:252`, `dla-form.tsx:279`, `project-registration/data.ts:58`.
- **Where it shows:** form placeholders for admin, registered.
- **Winner:** "For example" in prose and in placeholders ("Example: Order") or "e.g." with no comma; fix the typo regardless.
- **Clause / theme:** no clause; T12.
- **Fix size:** 14 strings, 9 files.
- **Mechanical?** Yes: regex `Eg;|E\.g\.,`.

### COPY-20 [LOW] Source casing hidden by CSS (T3)
- **What:** `HeroMeta`, eyebrows and column-2 group labels are uppercased by CSS, so source casing is invisible, but it is copied by users, read by screen readers and used by `aria-label`. Title in some (`project-detail-template.tsx:94-95`, `dsa-detail.tsx:201,204,207`, `dla-detail.tsx:327`, `taxonomy/tx-records.tsx:528` "ScientificNameID" renders as "SCIENTIFICNAMEID"), sentence in the rest.
- **Winner:** write source in sentence case (prior audit: "badges, tags and eyebrows are sentence case in the source").
- **Clause / theme:** prior audit hold; T12.
- **Fix size:** about 8 strings.
- **Mechanical?** Yes: same COPY-1 check, run over the `HeroMeta`/`eyebrow` props.

### COPY-21 [LOW] Oxford comma, "Please", exclamation marks (T12)
- **What:** Heuristic over UI prose: 32 lists with the Oxford comma ("when, to whom, and what they say") against 90 without ("Search ID, organisation or requestor"; most are search placeholders). "Please" in 25 places (mostly seeded rejection text; also `upload-form.tsx:156`, `geo-extent-picker.tsx:216`, "Please select" `field-controls.tsx:172,457,487`) in a product that otherwise gives plain instructions. "!" in "Account Created!", "Project Created!" (`success-screen.tsx:20`), email template line.
- **Winner:** contracts silent; recommend no Oxford comma (Australian), no "Please" in instructions, no exclamation marks in UI.
- **Fix size:** about 10 strings. **Mechanical?** Partial.

### COPY-22 [LOW] Toast and banner titles that name nothing (T3)
- **What:** DLA "Cancelled" (toast title) against DSA "Agreement cancelled"; DLA "Location added", "Review on hold" without the noun against "Request approved". The description carries the ID.
- **Evidence:** `dla/[id]/dla-detail-page.tsx:62` ("Cancelled") against `dsa/[id]/dsa-detail-page.tsx:62` ("Agreement cancelled").
- **Winner:** "<Noun> <past participle>" as DSA and nominations do.
- **Fix size:** 2 strings. **Mechanical?** No.

### COPY-23 [LOW] IDs and phone numbers (T12)
- **What:** ID shapes: BD-5039, DLA-2026-00510, DSA-2025-01348, NSS-2026-00001, USR-1001, ROLE-101, PERM-301, NTF-001, BIODATA-114, DS-2026-01001 and an unprefixed batch "1012" ("Batch 1012"). Phones: "0400 555 210", "08 8207 7500", "(08) 8388 4188". Sample data, but visible on the same record pages.
- **Where it shows:** record pages and tables.
- **Winner:** contracts silent; low priority: the number width and the prefix are a data decision.
- **Mechanical?** No.

### COPY-24 [LOW] Possible "1 records" (not reproduced)
- **What:** `project-detail/records-explorer.tsx:448` writes `${records.length} records` with no singular guard, and `cv-shell.tsx:82` / `nt-shell.tsx:78` write "Find among N categories". The plural is guarded elsewhere (`plural()` helpers in `field-schema.ts`, `nomination-list.tsx:91`). I did not reproduce a count of 1 on screen.
- **Fix size:** 3 strings. **Mechanical?** No.

## 4. Decisions needed

| # | Decision | Recommendation | Blast radius |
|---|---|---|---|
| A | The casing rule, and whether module names and report names are proper nouns (rail, crumb, report H1s) | Sentence case everywhere except proper nouns and acronyms. Module and report names are not proper nouns, so they follow it. | `registered-user-nav.ts` (12), `reports-data.ts` (11), about 25 files of Title Case labels (about 330 strings), nav-icons keys, screen-index |
| B | The canonical name of each module and its record (DLA, nominations, DSA, taxonomy, vouchers), and the DLA spelling | One name per concept from one terms file; "Data licence agreement (DLA)", "Sensitive species nominations", "Data sharing agreement (DSA)"; "licence" noun, "licensing" gerund | rail, crumb, H2, Add menu, eyebrows, screen index, Home |
| C | The browser tab title | `<Page> | BioData SA` via route metadata | 74 routes |
| D | One date formatter: "23 Sep 2026", date-time "23 Sep 2026, 10:12" (24-hour), ranges "x to y", ISO only in Darwin Core columns | Adopt, add `lib/format-date.ts`, AUTO check | about 20 call sites |
| E | Empty-value words: "Not provided" for missing, "Ongoing" for an open end date, "None" only for a real zero, drop "Not set" / "Not recorded" / "Not applicable" / "-" | Adopt; extend AUTO 2.3 | about 60 sites |
| F | Curly or straight apostrophes and quotes (the prior D12 is still open) | One form. If curly: new copy only, with the auth screens as the model. Single "…" always | 3 sites (ellipsis); 5 to 280 sites (apostrophes) |
| G | Create verb on a list header ("New x" or "Add x"), the leave-a-form confirm, the acknowledge button | "New x" for a collection's primary create (DLA, DSA, notifications, vocabularies); one discard wording in `ConfirmationModal` | 10 files |
| H | Field label terms: requester, phone number, organisation or institution | As in COPY-15 | about 35 strings |
| I | Report naming pattern, and raw Darwin Core names in the SpecimenDB report | "<Subject> report"; keep Darwin Core terms only if the report is for export-to-DwC users | 11 names, 1 report |
| J | Column-2 header for All / My lists (Projects, DLA, DSA, Nominations, User Management, Template Finder): the 6 Oct facet rule leaves open what names an All / My switch | Write the facet rule into 4.2 and give the All / My lists a label that names the switch (for example "Show") or none | 7 shells |

## 5. Proposed house style (candidate contract clause, "Copy")

1. **Sentence case for every visible string:** headings, tabs, buttons, menu items, column headers, form labels, placeholders, alerts, toasts, modal titles, rail and breadcrumb labels, report and module names. Capitalise the first word and proper nouns only.
2. **Kept as written:** BioData SA, DEW, DLA, DSA, NSX, CSV, PDF, South Australia and place names, organisation and species names, product names (NatureMaps, SpecimenDB, Darwin Core), role names (BioData Admin).
3. **Badges, eyebrows, column-2 group labels:** sentence case in the source; the component uppercases them.
4. **One name per concept**, from one terms file (`lib/terms.ts`): the rail label is the canonical name and the breadcrumb, column-2 header, list H2, Add menu item, report title and record eyebrow reuse it (list plural, record singular). A new label is a question, not a decision (§0.4).
5. **Australian English:** licence (noun), license (verb), licensing, organisation, behaviour, centre, colour, standardise, analyse, catalogue.
6. **"and", not "&"**, except inside a proper name.
7. **Dates** "23 Sep 2026" from one formatter; date and time "23 Sep 2026, 10:12" (24-hour); ranges "1 Oct 2026 to 30 Sep 2027"; numbers with thousands separators; "1 - 50 of 60" from the table component.
8. **An empty value** is omitted or "Not provided" (§2.3); "Ongoing" only for an open end date.
9. **Full stops:** titles, labels, buttons, placeholders and headings end without one; descriptions, hints, alerts and toast descriptions end with one.
10. **Punctuation:** "…" (one character) never "..."; a spaced hyphen for a pause, never an em dash (§2.3); "e.g." lower-case with no comma, or "for example"; no Oxford comma; no exclamation marks; no "Please".
11. **Apostrophes and quotes:** one form, curly (decision F).
12. **Verbs:** "Log in", "Sign up", "set up"; "New x" or "Add x" per decision G; "Export CSV".
13. **Report columns** are spelled out in sentence case ("Business rule failures").

**Existing sites that would change:** `lib/registered-user-nav.ts` and `nav-icons.ts` (12 labels); `reports-data.ts` + 11 report files (11 names); `home-dashboard.tsx` (7); `dla-form.tsx`, `dla-detail.tsx`, `add-location-modal.tsx`, `dla-data.ts` (about 45); `dsa-detail.tsx` (5); taxonomy files (about 25); project-registration option 1 (about 60); auth pages (about 12); `record-detail.tsx`, `observations-search.tsx`, `species-results.tsx`, `observation-detail/page.tsx`, `project-detail-view.tsx` option 2 (about 170, teammate-built, Figma-copied); notification categories `nt-data.ts` (29 rows, one list); `um-data.ts` permission-group names; `screen-index.ts` Area union; `create-menu.ts` already conforms.

Automatable (§0.8, five of the clause lines): US spellings and "Licencing" (AUTO banned-words), "Biodata SA", "&" in strings, `Eg;` and `...` in strings, `?? "-"` fallbacks, one date formatter (`toLocaleDateString` / `Intl.DateTimeFormat` / month arrays outside `lib/format-date.ts`), Title Case in label/title/placeholder/heading props (heuristic, ratcheted in `contracts/baseline.json`). Not automatable (REVIEW): the terms list, column-2 header naming, report naming, create verbs.

## 6. Next move

The five decisions that unlock the rest are A (the casing rule), B (the names), D (dates), E (empty values) and J (column-2 header). After A and B, COPY-1, 3, 4, 5, 10, 15 can be done as one pass behind a terms file. D and E need no further input beyond a yes. The COPY-9 empty-state fix is the second recurrence of the same defect (4.2e had no AUTO check; §0.8 says one is due), so it should ship with its check.

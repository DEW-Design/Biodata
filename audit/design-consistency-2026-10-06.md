# Design consistency audit, 6 Oct 2026

Question asked: does the whole webapp feel like one product, in behaviour patterns, components, visual layout and
copy, down to Sentence case against Title Case?

**Answer: not yet, and the gaps are specific.** The structure is strong: shell geometry, record hero, table card,
form footer, modals and menus measure identical on nearly every screen. The inconsistency lives in four places:
(1) words (case, names, dates, empty values), (2) the same role drawn two or three ways (label/value rows, table
cells, status colours, card radius), (3) states that were never made into one component (empty, not found,
restricted, discard), and (4) record pages that were built before the pattern and not brought in line.

Nothing in the app was changed by this audit. Nothing is committed.

## How to read this file

- This file is the ranked, de-duplicated view: **44 root issues (DC-1 to DC-44)** built from 146 findings by six
  audit lanes. Each issue names the lane findings it merges, so the evidence is one click away.
- The full lane reports (exact `file:line`, measured values, per-screen tables) are kept beside this file in
  `audit/design-consistency-2026-10-06-lanes/` (`copy`, `typecolour`, `layout`, `components`, `behaviour`,
  `records`, plus the shared `BRIEF.md`). Screenshot paths in them point into `.context/audit/shots/`, which is
  gitignored.
- Severity: **HIGH** = the designer sees it on the first pass, or it is wrong data, or it is a recurring theme the
  designer has already corrected. **MED** = visible on a second look, or one shared fix removes many sites.
  **LOW** = polish.
- "Winner" follows CONTRACTS section 2.9 order: the design system, then the dominant sibling pattern, then the Emil
  skills. Where the contracts are silent the issue says "needs a decision" and points to a decision in section 5.
  An agent never decides those (section 0.4).

## 1. What ran

| Step | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npm run check:contracts` | **OK**. So every issue below is REVIEW-only or a gap in an AUTO check. |
| `npx eslint app components lib config --max-warnings=0` | **fails: 29 errors, 10 warnings.** 28 of the 29 errors are Untitled UI ingest files (`input-tags*.tsx` x25, three empty interfaces); the 29th is `lib/config-context.tsx` (ours, doc-site only). None is reachable from a product screen. See DC-35. |
| Colour primitives against `contracts/figma-colours.json` (section 2.1c) | passes (part of `check:contracts`). **No primitive has drifted, so nothing was fixed on sight.** Figma was not re-pulled in this pass; the recorded reference is unchanged. |
| Live sweep, six lanes, Playwright, 1708x1024 (laptop widths 1440 and 1280 for layout) | well over 1,200 page loads across 82 routes and 4 roles (187 for type and colour, 672 for layout, 244 for gating, the rest copy, behaviour and records), 78 interaction states, 23,519 text nodes read, 45,205 colour observations, 672 loads for layout stability. **Zero console errors and zero page errors** on every load, apart from one transient `Tabs is not defined` caused by another session saving a file mid-run (not reproducible). |
| Independent spot-check by me | 7 inline `role === "biodata-admin"` sites (exact count); `"Data Licencing Agreement (DLA)"` at `lib/registered-user-nav.ts:13`; the `!hydrated ? null` gate at `vouchers/vm-routes.tsx:50`; dead `border-error` / `border-brand` / `text-success-primary` in `dataset-upload/upload-dropzone.tsx:75-114`; `--ui-outline-brand` is brand-300 while `--ui-outline-focus-ring` is brand-500 (`globals.css:420,429`); live: header 65px at 1708 but 104px at 1280 on a DLA record and on the Data Validation Error report; `/pages/vouchers/1012` renders 0 characters in `main`. |

**Not covered, said plainly.**
- Classic scrollbars cannot be rendered in headless Chromium on macOS. DC-43 (scroll gutter) is inferred from
  computed styles and overflow flips, not from a rendered 15px shift.
- `privileged-user`, `privileged-admin` and `biodata-user` were covered on list pages and gating only, not on
  record pages. Mobile widths and dark surfaces were not covered.
- Keyboard testing covered the filter menu, selects, columns chooser, switcher, tabs, tree, modals and a lightbox.
  It did not cover Home dashboards, Explore overlays or side panels.
- Modals and toasts were mostly read from source, not opened live. Explore result states were read from source.
- Several sessions edited the tree while the lanes ran (Reports column 2, taxonomy label, column-2 rules). Lane
  authors re-checked the load-bearing items afterwards. Treat counts as correct to within a handful of sites.
- `/proto`, `app/pages/projects`, `app/pages/projectsv2`, the Prototype tools bar and Leaflet internals are out of
  scope. Items the designer already settled (quaternary grey contrast, the 10px org pill, Project Option 2 kept,
  the "Not available in this preview yet" controls) were not re-raised.

## 2. What already holds (one line each)

- **Shell:** rail 64, column 2 286, header full width, main x 350 or 64 on every shell screen; every deep dive hides
  column 2 and uses the full width (19 record routes, applied to all, not some).
- **Lists:** every collection is SectionHeader, ToolbarSearch (384), Filter at the same x, fixed-layout TableCard,
  numbered pagination 65px high; All and My move nothing (toolbar, table width, column x identical).
- **Record hero:** one geometry on 14 record pages (eyebrow y24, title y44, facts y92/112, actions top right) and one
  type treatment (24/600 white) on 69 of 69 screens; one gradient on 106 elements.
- **Forms:** header 117, close X 40, footer 69, label column 220, field 720; validation matches section 4.1.4 on all 8
  multi-section forms; dates use `InputDatePicker` everywhere checked.
- **Menus and modals:** menus 12px from trigger and Escape returns focus; modals one family (radius 16, title 16/600,
  Cancel left, primary right); toasts one component in one corner.
- **Type:** one family (Barlow, 24,613 of 24,631 nodes); real italics; table header one treatment (1,285 nodes);
  caption has converged on 12/400 tertiary; counts use tabular figures.
- **Reuse:** `RecordHero` (14 files), `RecordBackLink` (13), `FormRow` (101 uses), `ToolbarSearch` (19), `AuditLog` (7 pages),
  `BreadcrumbSwitcher` (6 wrappers) are each defined once. No raw `<select>`, `<textarea>`, text `<input>`,
  `<dialog>`, `window.confirm`, emoji icon or inline SVG in product code.
- **Gating:** across 244 loads, no screen was open that the role matrix says is closed, or closed that it says is open.

## 3. Root issues, ranked inside each group

Merged lane findings are in brackets (`COPY`, `TYPE`, `COL`, `LAY`, `COMP`, `BEH`, `REC`, `IA`, `MAP`).

### A. Wrong or broken now (fix first, little or no design question)

**DC-1 [HIGH] Voucher batch and record pages are blank when opened by address.** (BEH-1, REC-1, LAY-2)
`/pages/vouchers/<id>`, `?record=` and the option-2 route render the shell and an empty `main` forever on a cold load
or reload (verified: 0 characters). Cause: `BatchScreen` renders `null` until `useVouchersHydrated()`, but the only
`useRehydrate` calls live in components inside that gate (`vm-store.ts:52,57`). Winner: the other stores; make
`useHydrated` trigger the rehydrate (`zustand-persist.ts`, flows to 11 stores). Super Admin only; the Pages tool and
the screen index link to these addresses. Mechanical: yes (a smoke test that every screen-index route has non-empty `main`).

**DC-2 [HIGH] BioData Super Admin gets the Registered User's reports.** (BEH-2, IA-1)
Seven inline `role === "biodata-admin"` checks (`reports-landing.tsx:34`, `use-ingestion-runs.ts:24`,
`ingestion-report-data.ts:373`, `sensitive-restriction-report-data.ts:336`, `specimendb-refresh-report-data.ts:187`,
`voucher-id-update-report-data.ts:136`, `report-projects.ts:12`). Admin sees 60 ingestion rows, Super Admin 25; the
landing tells Super Admin "Reports on your uploads". `ref-roles.md` says every admin question calls `isBiodataAdmin`.
Fix: 7 one-line swaps. Also read, not verified live: `config/role-access.config.ts:115`. Mechanical: yes.

**DC-3 [HIGH] A Registered or Privileged User sees other people's DLA requests.** (BEH-3, IA-2) **Needs decision D1.**
`/pages/dla?scope=all` shows 9 requests including Phoenix Baker's draft and Lana Steiner's on-hold; opening
`DLA-2026-00502` (Maya Dewitt's) shows "Edit request". Nominations got the opposite rule on 6 Oct and the DLA report
shows a Registered User only their own 2. Recommendation: the nominations rule (My requests alone, drafts private to
their author), and guard the record URL.

**DC-4 [HIGH] The header wraps at laptop widths: 65px becomes 104px (155.8 on the occurrence page).** (LAY-1) **Decision D2.**
Verified at 1280x800 on a DLA record and the Data Validation Error report. 41 of 70 shell screens at 1280, 6 at 1440,
every role, every record, form and report page. At 1708 all are 65. `app-header.tsx:50` is `flex-wrap`; the breadcrumb
and the 395px search drop under the logo, and rail, column 2 and main all shift down 39px. This is the worst
dancing layout in the shell and the designer demos on laptops. Winner: one row at every width (breadcrumb truncates
with an ellipsis, search shrinks). One shared file.

**DC-5 [HIGH] Seven files use react-aria's raw `Tabs`, so keyboard behaviour differs between record pages.** (COMP-2)
Confirmed live: on a Nomination record the Arrow key switches tabs at once; DLA, DSA and project do not (DEW `Tabs`
sets `keyboardActivation="manual"`). Files: `nomination-detail.tsx:4`, `project-details-view.tsx`, `project-list/page.tsx`,
`dashboard/page.tsx`, `observation-detail/page.tsx`, `option-2/project-detail-view.tsx`, `observations-search.tsx`
(and `home-dashboard.tsx`, `geo-extent-picker.tsx` import react-aria directly too). Winner: DEW `Tabs` (24 files
against 7; contract 1.9 item 3). Mechanical import swap, then an AUTO import check.

**DC-6 [HIGH] Utilities that compile to nothing are still in product code.** (COMP-4, COL-3)
The dead-class list in 2.1a is incomplete. Verified in the browser: `border-error` and `border-brand` fall back to a
near-black `currentColor` border (upload dropzone invalid and drag-over states, `upload-dropzone.tsx:75-76`);
`text-success-primary` renders the success line dark grey (`:114`); `border-brand-solid` (Add Project option 1
stepper, `stepper.tsx:42`); `ring-bg-primary` (the white avatar ring is missing, `project-tab.tsx:391`);
`bg-secondary_hover` (tree-view drop and hover fills, `tree-view.tsx:321`); `bg-overlay/70` (the expanded-map backdrop
is transparent, `expandable-map.tsx:90`); `var(--color-bg-brand-solid, #7f56d9)` makes the multi-row drag badge
Untitled purple (`tree-view-utils.ts:135`). Fix: map each to an existing token. Mechanical and worth doing now:
replace the hard-coded dead-class regex with a "every class resolves in the compiled CSS" check (a 60-line scan ran in
under 2 seconds).

**DC-7 [HIGH] Focus rings are three colours; breadcrumb links and pagination numbers use the browser default.** (COL-2, BEH-10) **Decision D3.**
`Button`, header and rail rings are brand-300 (about 2.4:1 on white, under the 3:1 non-text floor); tabs, rows and
the segmented toggle are brand-500; the header breadcrumb links on every screen and the pagination numbers draw the
UA 1px `#005fcc` ring. `globals.css:385-406` already records that Figma wants brand-500 but `--ui-outline-brand`
(Button) is still brand-300 (`:420` against `:429`); `button-utility.tsx` already uses brand-500. Winner: one 2px
brand-500 ring (Figma, and the file's own comment). One token plus `breadcrumb.tsx` plus `table.tsx:509`.

**DC-8 [MED] Flagged concepts sits outside the role matrix and the screen index; 10 real routes are missing from `screen-index.ts`.** (IA-6)
Gated by an inline test (`field-notes.tsx:68`), so the Pages tool cannot know it. Missing routes: the six `*/edit`
routes, `flagged-concepts`, `vouchers/option-2`, `project-detail/created`. Fix: a `flaggedConcepts` feature key and
ten index lines. Mechanical: yes (route not in `screen-index.ts`).

**DC-9 [MED] `text-md` still resolves to 14px with a 21px line height (55 uses, 26 files).** (TYPE-1) **Decision D4.**
Input `md`, Select, Tab `md`, Checkbox/Radio labels and the header avatar are 1px taller than their `sm` versions
(Input `md` 37px beside the date picker at 36px in the same form; tab 33px against 32px). Down from 63 uses. Waiting
on the Figma check recorded as D1 of the 29 Sept audit; the product draws 14px, so the likely answer is
`text-sm` everywhere and the ratchet entries removed.

**DC-10 [LOW] Small persona and shell inconsistencies.** (IA-5, IA-8, LAY-23, BEH-28)
Home's task badge shows for Registered User only, though Privileged User, Privileged Admin and BioData User see the
same Home tasks; the public header is 64px against 65px (a persona switch moves everything 1px); the org pill draws a
selector chevron but is not interactive (section 2.10); the header search is 37px beside a 36px Add button.

### B. Words: case, names, dates, empty values

**DC-11 [HIGH] There is no casing rule. The biggest surfaces are Title Case; everything else is sentence case.** (COPY-1, COPY-3, COPY-17, COPY-20) **Decision D5.**
Rail tooltips 12 of 12 multi-word labels, breadcrumb crumbs 9 of 9, all 11 report names, and the list headings
"Data Licencing Agreements", "Data Sharing Agreements", "Template Finder" are Title Case. Column-2 items (42 of 46),
tabs (29 of 47), buttons, the Add menu (7 of 7), toasts, alerts, modals and placeholders are sentence case; 93% of
table headers and 70% of form labels. Title Case also survives as whole clusters: Home KPIs and section headings,
the DLA form (the sibling DSA form is sentence case), Add Project option 1, taxonomy flows, auth screens, and the
Figma-copied occurrence and Explore record pages (about 330 strings). The 28 Sept decision "Title case vs sentence
case for field labels site-wide" (item 12) was never answered. Dominant treatment, by count: sentence case.
Mechanical: partly, a ratcheted heuristic on `label|title|placeholder|heading` props (a 25-line prototype exists at
`.context/audit/copy-props-check.mjs`).

**DC-12 [HIGH] One concept has several names, and the DLA has a spelling error in its name.** (COPY-2, COPY-4, COPY-5, COPY-14, COPY-15, IA-3, BEH-16, REC-4, REC-5) **Decision D6.**
- **DLA:** about 12 names across rail, column 2, list, eyebrow, Add menu, report and screen index. "Licencing" (neither
  Australian spelling) is in 15 UI strings (39 including comments) and US "License" as a noun in 7; the rail constant
  `DLA_SECTION_LABEL` is the source. `registered-user-nav.ts:13`.
- **Nominations:** six names ("Nominate Sensitive Species" on the rail is a verb phrase).
- **Column-2 header rule:** decision `2026-10-06-10` ("name the facet, not the thing listed") is applied to 4 of 11
  sections (Taxonomy, Controlled Vocabulary, Notifications, Vouchers); PROJECTS, REQUESTS, AGREEMENTS, NOMINATIONS, USER
  MANAGEMENT, TEMPLATE FINDER still restate the section. The rule lives only in a decision file and a code comment.
- **Tabs and links:** the history tab is "Audit Log" (2), "Audit history" (1), "History" (4); the back link is "Back to
  <things>" on 11 of 15 pages, with 4 outliers; the artefacts tab has 4 spellings.
- **Fields:** "Organisation / institution" has 7 spellings, phone number 5, requestor/requester 2, and one attribute is
  "Requestor organisation", "Data partner", "Partnership organisation" and "Organisation" across four filters.
Winner: one terms file (`lib/terms.ts`) read by the rail, crumb, column 2, list heading, Add menu, report title and
eyebrow, so drift becomes a type error. Designer picks the names (D6).

**DC-13 [HIGH] "BioData SA" against "Biodata SA", and every browser tab reads "DEW Design System".** (COPY-6, LAY-18, TYPE-11) **Decision D7.**
68 UI strings say "BioData SA", 14 say "Biodata SA" (all ten auth screens, the landing page, which uses both). The
tab title is the layout default on all 74 product routes; no page exports metadata. Mechanical: yes for the spelling.

**DC-14 [HIGH] Dates: "Sep" and "Sept", ISO, long months, three date-time shapes, no shared formatter.** (COPY-7, TYPE-12, REC-12, BEH-22) **Decision D8.**
`Intl` with `en-AU` returns "Sept", "June", "July" in this ICU, while hand-written formatters say "Sep". The DLA and DSA
agreement reports show both in one table; every report hero reads "27 Sept 2026" while its table reads "21 Sep 2026";
an occurrence hero shows `2026-05-14`. At least 11 formatters and 4 copied month arrays. Date-time is "19 Aug 2026,
10:12", "9 Aug 2026, 10:12 AM" and "27 Sept 2026 08:47". The date field's segment order follows the browser locale
(US order in an en-US browser; no `I18nProvider`). Winner: one `lib/format-date.ts`, "23 Sep 2026" (the dominant
form), tabular figures, `en-AU` pinned. Mechanical: yes.

**DC-15 [HIGH] Empty values use seven wordings, and a bare "-" in about 60 places that section 2.3 forbids.** (COPY-8, TYPE-15, REC-11, BEH-21, LAY-22, COMP-13) **Decision D9.**
"Not provided" is the contract word (about 62 hits). Against it: "-" (`map-search/record-detail.tsx:69` `DASH`, used 51 times;
the project page's own Geographic extent card shows three), "Not set", "Not recorded", "No end date", "Ongoing", "None"
(60 in the ingestion report), "Not applicable", "No locations". Mechanical: yes (extend 2.3 to a rendered `"-"`).

**DC-16 [MED] Small copy rules that drift (one house-style decision settles all).** (COPY-10, 11, 12, 13, 16, 18, 19, 21, 22; TYPE-16) **Decision D10.**
"&" against "and" (45 strings); US spellings (License, Center, standardized, Analyze, behavior); curly apostrophes only
in the auth flow (94 straight against 1 curly in rendered text; still open from the 29 Sept audit); "..." against
"…" (3 sites); "Eg;" typo and five "e.g." styles; "Log in" in the header but "Sign in" in auth, and "Setup your
profile" for the verb; "Please" in 25 places and "!" in titles; create verbs "New x" against "Add x" against
"Nominate a new species"; separators " - " against " · " for the same slot; toast titles with the noun dropped
("Cancelled" against "Agreement cancelled").

**DC-17 [MED] Toast wording and disabled-control tooltips drift.** (BEH-11, BEH-12)
Saving a record: "Changes saved", "User updated", "{title} saved", "Species saved". "Not available in this preview
yet" is the decided wording, but three other wordings ship ("Coming soon", "isn't wired up yet"). The Home and
observation-detail versions wrap a non-focusable span, so the tooltip is unreachable by keyboard and react-aria
warns (a real section 1.9.3 gap). `/patterns/feedback`, `/patterns/empty-states` and `/patterns/loading-states` are
placeholder stubs, so these rules have no home.

### C. The same role drawn more than one way

**DC-18 [HIGH] The same status word has different colours on different screens.** (COL-1, COMP-12) **Decision D11.**
Approved and Submitted are brand teal on DLA, DSA and nominations but green in the ingestion reports (82 and 186
nodes); Completed is blue on the Projects list (an Untitled colour not in Figma) but grey on the project hero and in
Explore; Current is green on Taxonomy and a white chip on the Audit Log. Eleven separate status maps exist. The hero
status badge is 16px with a dot on the project page and 24px everywhere else. Status is the highest-signal colour
in the product; at the minimum "Approved" must be one colour.

**DC-19 [HIGH] Label/value rows have six layouts, with eight hand-copied helpers.** (LAY-5, TYPE-4, REC-6, COMP-3, COMP-5)
`RecordRow` (label 176, value 14/400, 4 pages) against: the project page (label 144 or 176, own rows), occurrence
(176 + 24, stray "-"), project option 2 and observation-detail (224), DLA and DSA (label above value, value 14/500,
and a right-aligned value row; one card holds three layouts), taxonomy (label above, 3 columns). `MetaField` is
declared 7 times (`HeroMeta` already exists and 3 of them are byte-equal copies), `DetailRow` twice, `SummaryRow`
three times, and `ContactCard` is copied. Winner: `RecordRow` and `HeroMeta` (named by section 4.6; 50 and 42 uses),
with an opt-in for the long-text case (section 1.6), and the project page brought in line. Mechanical: yes (a
local `function MetaField|Field|DetailRow` outside `record-hero.tsx`).

**DC-20 [HIGH] Table cells and density: lists and reports disagree, and lists disagree with themselves.** (TYPE-3, LAY-9, BEH-20) **Decision D12.**
Plain cells are 14/400 in two colours: every report table is secondary, list pages mix secondary and tertiary
inside one table (DLA 18 tertiary and 9 secondary, Permissions 40 and 120). Sub-lines are 12/400 tertiary, 12/400
quaternary, 12 italic quaternary, or 14px. List dates are not tabular; report dates are. Density: header/row 44/72
on lists, 34/44 on reports, 36/56 embedded. Taxonomy defaults to 10 rows (others 50) with no sortable column; the
identity column is unsortable on five lists and sortable on four. The 29 Sept recommendation (identity 14/500
primary, others 14/400 tertiary, sub-line 12/400 tertiary) is still the dominant list pattern.

**DC-21 [MED] Type roles still unsettled: KPI value, card heading, dialog title, select value, eyebrow, scientific names.** (TYPE-5, 6, 7, 8, 9, 10, 13, 14) **Decision D13.**
KPI value is 36/400, 36/500, 24/500 or 18/500 across six components, with four label shapes (worse than 29 Sept).
Card headings are 14, 16 or 18 semibold, plus three 18/500 stragglers and nine `!`-overridden headings. Dialog title is
16/600 primary against alert and toast titles 14/600 secondary. Selected values are 14/500 in Select, ComboBox,
MultiSelect and NativeSelect against 14/400 in Input. Eyebrows vary in colour (white/70, quaternary, tertiary, brand)
and two sites lack tracking. Scientific names are italic everywhere but at 6 sizes and colours, and not italic on 3
screens. Eight wrapping descriptions lack `text-balance`.

**DC-22 [MED] Surface and control geometry: radius, padding, heights, offsets.** (LAY-7, 8, 11, 15, 16, 17, 23; BEH-13; COMP-8)
Record panel cards are radius 8 (DLA, DSA, nominations, user, role, occurrence, Home) but 12 on the project page,
taxonomy and every table; padding 0, 20 or 24. The Cards/Table toggle is 40px beside 36px search and Filter, so those
toolbar rows grow and the table starts 4px lower (taxonomy, Species, Artefacts, Records); on Reports it sits in the
section header instead of the toolbar. SectionHeader block is 101, 117, 93, 97 or 77 high (24px against 20px or 16px to
the divider). Close buttons come in five sizes. Popovers sit 12px from the trigger except Profile, Select, ComboBox
and date picker (4 and 6). `SectionHeader.Root` is given the same `p-6` at 19 of 19 call sites; `Badge` defaults to
`md` while 75 of 77 calls pass `sm`; 18 `TableCard.Root` calls repeat the same fill class string.

**DC-23 [MED] The colour reference has holes, and state colours disagree.** (COL-4, 5, 6, 7, 8) **Decision D19.**
43 of 165 hex custom properties in `globals.css` (the Untitled `utility-*` palettes) are not in `figma-colours.json`
yet are live (Completed badge, species dots, pie charts); every `--shadow-*` uses `#101828`, not the DEW grey-900;
Highcharts keeps its own greys. A hovered underline tab looks identical to the selected one. Button disables by
50% opacity while other controls use the grey token. Auth and Add Project option 1 sit on `#f8f8f7` while the app
canvas is `#fcfcfc`. The hero gradient class string is pasted in 5 files. 15 `bg-[var(--ui-border-*)]` utilities where
the utility could exist.

**DC-24 [LOW] Auth screens are a second type scale with no headings, and lists have no `h1`.** (TYPE-11, TYPE-18)
Auth titles are a 20/600 `p`, body 16px where the product is 14, wordmark 30/700 against the header's 17/600. List
pages render their title as `h2`; auth has no heading at all.

### D. States and shared patterns that exist as copies

**DC-25 [HIGH] Empty collections show four or five different things, on 15+ screens.** (BEH-4, COMP-9, TYPE-2, LAY-3, COPY-9)
`ListEmptyState` (icon, 18/600 heading, balanced line, "Show all X") on 7 of 12 lists. The others: a bare grey line
(Users, Roles, Permissions, Taxonomy, project Datasets, DSA systems, CV entries), a bare line with a link reading
"Clear search and filters" (Controlled Vocabulary, Notifications x2, Vouchers; the label section 4.2e rules out), and
a bordered title and line with no icon (the project page's Species, Artefacts and Records). The same Artefacts list
has two empty states depending on which project layout shows it; nominations' "nothing yet" is a hand-copied
`ListEmptyState` with a primary action the contract does not allow. Quote glyphs differ (curly against straight).
**This is the second recurrence of the section 4.2e bullet, which says an AUTO check is due.** Winner:
`ListEmptyState`, with an embedded size for tabs.

**DC-26 [MED] Not-found (10 copies) and restricted (10 to 12 copies) screens are hand-written, and the copy drifts.** (BEH-9, IA-4, COMP-9) **Decision D15.**
Not found: seven have "Back to X" with an arrow, taxonomy has "All species" with no icon, vouchers has no action, and
three more use a secondary button, a left-aligned layout or an alert. Restricted: the same paragraph in 10 shells with
"the BioData Super Admin", "BioData Super Admins" and "BioData Admins" drifting, and a signed-out visitor is told
"Your account doesn't have access" or "Create one" with only a "Go to Home" button (no Sign up, although the sign-up
modal exists). Winner: one `NotFoundState` and one `RestrictedState` (new components, section 1.4 override).

**DC-27 [HIGH] "Discard unsaved changes" is two modals, with five titles and five confirm labels, on 13 sites.** (BEH-5, COPY-13) **Decision D16.**
`ConfirmationModal` (brand icon, brand button with a Trash icon) on 6 sites; `DestructiveModal` (red) on 7. Titles:
"Discard your changes?" (7), "Discard this {what}?", "Leave this taxon change?", and others. Cancel is "Keep editing"
everywhere (good). The "a draft implies destructive" rule does not separate them (Users has no draft and is
destructive; Taxonomy has none and is not). Winner: `DestructiveModal`, title "Discard your changes?", confirm
"Discard changes", cancel "Keep editing".

**DC-28 [LOW] Loading has no pattern.** (BEH-25)
About 50 `Suspense fallback={null}` leave a blank screen; hydration gates render `null` (DC-1 is the worst case); maps
load as three different placeholders. The pattern pages are stubs.

**DC-29 [MED] Notices come in several constructs; button-style alerts all show a check mark.** (BEH-19, BEH-8, COMP-9)
List notices are a `TaskItem` card (shifts the toolbar down 98px for admins), an `ExplainerCard`, or a `PageBanner`
(Explore only). "Agreement period locked" and "Access level locked" use the edge-to-edge alert inside a field.
"Details missing" is rebuilt by hand in `project-edit.tsx:544` and `record-full-view.tsx:516` with stacked classes
`contained` already produces (3 builds of one alert), and says "to save" where the shared one says "to continue". Ten
alert actions inherit the default `Check` icon whatever the action ("New agreement", "Sign up to request access",
"Activate permission"). Five plain-div warning notices in the project record views imitate `AlertFullWidth`.

**DC-30 [MED] The form footer breaks the icon table, and the AUTO check cannot see it.** (BEH-7, COMP-10, LAY-10, BEH-24)
The final primary action ("Save changes", "Submit", "Add role", "Create project") has no icon because the prop is
`... ? ArrowNarrowRight : undefined`, which passes `check:contracts`. Back and Continue use `ArrowNarrowLeft/Right`
where the section 3.12 table says `ArrowLeft/ArrowRight` (11 forms inherit it from `form-page.tsx`). Add role and Add
permission have a 97px header with no eyebrow and no section list while the other 10 forms have 117. "n of m
sections complete" counts the Review step on two forms and not on two.

### E. Components built more than once

**DC-31 [HIGH] The view switch (Cards/Table, Tree/Table, Open/Resolved) is not a component: 11 hand-built copies.** (COMP-1, BEH-17) **Decision D15.**
Six share a class pair living in `project-detail/segmented.ts`, one is an inline copy with a different unselected
colour, three are raw-button rows with different tray shape and selected colour (Explore), and the design system's own
`TabList type="button-border"` is used 3 times. Position differs (toolbar right end on 4, section header on Reports),
height is 40 against the toolbar's 36, defaults differ, and none remembers the choice. Winner: one shared control with
the `segmented.ts` look (equals the DS tray).

**DC-32 [HIGH] Hand-rolled lookalikes of components that exist.** (COMP-9)
Chips against `Badge` (5 local sentence-case chips at 12/500, 26px high, on the project Project tab);
64 real raw `<button>`s in 30 files including about 10 icon buttons and a hand-made back link; raw `aria-expanded`
accordions (7 sites); hand-built embedded `<table>`s (4); hand-built breadcrumb trails (6); 40 native `title=` tooltips
against 25 `Tooltip` uses (9 are information icons); the same "Organisation / institution" field built as an `Input`
with a glyph, a `Select` with a glyph and a plain `Select`; four file-upload zones; a hand-drawn progress bar.
Five react-aria modals and drawers are composed directly because no DS slide-over exists (a section 1.2 gap).
The project-detail folder alone holds 25 of these sites.

**DC-33 [HIGH] One action has several icons and button treatments.** (COMP-10, BEH-26, MAP-1, MAP-2)
Edit uses four glyphs (`Edit05` in 17 files, `Edit02` in 6, `PencilLine`, `Edit03`); Back is `ArrowLeft` in 7 places
and `ArrowNarrowLeft` in 18; Download and Upload each have an off-contract site; attach has three icons; the "..."
trigger is three styles in two orientations. Remove-row is four treatments (`tertiary sm`, `secondary sm`, `secondary md`,
`tertiary md`; 15, 7, 5, 1). "Add X" is `primary sm` (23), `secondary sm` (21), `link-color sm` (24) and several `md`
strays; "Add area" is primary in Explore and secondary in nominations. Icon sizes mix `size-3`, `3.5`, `4`, `5`; `Lock01`
alone is drawn at three. Voucher "Ignore difference" reuses `XClose`, Cancel's icon.

**DC-34 [MED] Structural copies and defaults.** (COMP-5, 6, 7, 8, 11)
`NavTree`, `SectionPlaceholder` and a hand-built 286px column-2 `<aside>` are each copied in four live routes; the
product `Breadcrumb` lives in `components/scaffold/` and is imported by every screen (sections 1.1 and 1.5);
`custom/Textarea` has 0 callers beside `base/TextArea`; `OtpInput` duplicates `PinInput`; three components do
"searchable single choice" (`MultiSelect single`, `ComboBox`, `Select.ComboBox`); embedded-tab search boxes are
320px where `ToolbarSearch` is 384px. Never delete a component without the designer's say (section 0.4).

**DC-35 [LOW] Lint is red, but not for product reasons.** (COMP lint section)
29 errors: 25 `react-hooks/refs` in `input-tags*.tsx` and 3 empty interfaces (all Untitled UI ingest, `InputTags` has no
caller outside its doc page), and `lib/config-context.tsx:57` (ours, drives only the doc site's config). No
user-visible risk found. It does mean `npx eslint` cannot be a clean gate until the ingest files are fixed or
excluded, so section 0.6 item 2 can only be checked on touched files.

### F. Record pages and the shell

**DC-36 [HIGH] Overview and Details tabs restate the identity card.** (REC-2, LAY-6)
Sections 4.3 and 4.6.7 forbid it. Nomination Overview repeats species, nominated by, status (and a notice repeats
status); DLA repeats the agreement period and requestor organisation; Controlled Vocabulary Details repeats 4 of 7
rows; Notification repeats Category and Event; project occurrence records repeat ID and name. User and DSA records
show a "Last updated" caption on Overview only, so the first card jumps 32px when switching tabs; the same fact is shown
three ways (caption, RecordRow, nothing).

**DC-37 [HIGH] Breadcrumb switcher is missing on five collections and the dataset record.** (REC-3, BEH-6)
Present on Projects, DLA, DSA, Nominations, User Management and Reports. Absent on Controlled Vocabulary,
Notifications, Taxonomy, Vouchers (batch and record), the dataset record and flagged concepts. The dataset record's
last crumb is "Datasets", not its name; a nomination's crumb is the ID while its title is the species. **Section 4.6
says an AUTO check is due if a plain crumb ships again; it has, four more times.** Fix: four thin wrappers over
`BreadcrumbSwitcher`.

**DC-38 [MED] Record pages that depart from the pattern in a few places each.** (REC-7, REC-8, REC-9, LAY-10, LAY-13, LAY-17)
Permission record has no tabs (section 4.6 forbids stacking content without them) and its eyebrow is the category.
Taxonomy record stacks a pill toggle above eight underline tabs (a second tab control, 56px more chrome), shows
status as plain text, has a hero fact "SCIENTIFICNAMEID" (CSS uppercases `ScientificNameID`) and two "Not provided"
hero facts, and its first tab "Main" repeats as its card title. Two edit models coexist: Taxonomy and the project page
edit in place with a sticky footer (section 4.8), everything else opens a form route (**Decision D17**). The project
hero is 4px shorter (a 16px status badge against 24px), so its tab row sits 4px higher than every other record's.

**DC-39 [MED] Three screens deep-dive without the record pattern.** (REC-10, LAY-12, LAY-20, BEH-18) **Decision D18.**
`observation-detail` has no hero card, no tabs, column 2 with a records tree, accordions with "+" icons, a "..." crumb and
its own `MetaField` and `DetailRow` (label 224). Flagged concepts (standalone and the project review) has information
in column 2 (a progress line, a project Select, an Open/Resolved control) which section 3.10 forbids, hand-builds
`AppHeader` and `PrimaryRail`, uses "+" icons for "Value confirmed", and has no hero or switcher; the check misses it
because the aside is rendered inside `ReviewScreen`. Project Option 2's last tab ("Comments") is clipped by the
Tree/Table toggle at 1708px (kept by the designer).

**DC-40 [MED] Report and record rows do not link to what they describe.** (REC-13)
Lists make every row a link. Of 11 reports only Data Ingestion has links; a DLA agreement report row does not open the
DLA, a project detail row does not open the project. DLA "Locations and access" shows project names as plain text.

**DC-41 [MED] IA and contract loose ends.** (IA-7, IA-9, IA-10)
Add Project option 1 has no rail and no column 2 (section 3.7 exempts only `biodata-home`, `auth/**` and `/pages`).
Contract section 3.7 says Explore option 2 keeps column 2; live it has none (one of them is stale). "Create report"
is the unwired toast on four lists while Reports has a working "Create a report" dialog. Notifications column 2 lists
four categories with a count of 0. The Add menu lacks Role, Permission and taxonomy changes though each list has its
own Add button. The header avatar is "OW" while the admin Home greets "Jane". Projects has no create button at all
(BEH-14); list create verbs differ.

**DC-42 [MED] Maps: three label sets for locations, two ways to expand, one silhouette titled as a mapsheet map.** (MAP-1, MAP-2, MAP-3, LAY-14)
The four ways to give a location (Draw, Coordinates, List, Shapefile) have three labels, three orders and three icon
sets across Explore, registration and the DLA modal, and `Circle` names two concepts in one modal. `ExpandableMap` is
"Expand" in a dialog; `GeoExtentPicker` is "Full screen" in a takeover with `z-[9999]`; `Maximize02` means four
things. Controls sit at 12, 16 and 5px insets, and the occurrence map has no Expand. The Home and legacy
Highcharts map shows an Australia silhouette under the title "records per mapsheet" (section 0.3).

### G. Layout stability

**DC-43 [HIGH] About 24 scrolling wrappers have no `scrollbar-gutter: stable`.** (LAY-4) *Inferred, not rendered.*
Section 4.2f requires it on the page's scrolling element. The AUTO check only inspects `<main>`, and the newer shells
scroll a child div, so DLA, DSA, nominations, user management, template finder, reports, ctrl-vocab, notifications,
vouchers, taxonomy and every record page slip through. On Windows or a Mac with always-visible scrollbars, any tab or
state that crosses the viewport (a record tab with more rows, an opened accordion) moves content about 15px. The
project list has the gutter on both `main` and its table, so its card is 15px narrower than every other list. The
designer's Mac hides this, which is why it keeps coming back. Mechanical: yes.

**DC-44 [LOW] Smaller stability and polish items.** (LAY-19, 18, 24, 25, 26, 27)
Turning a filter on adds a 36px chip row and pushes the table down (known, open in `ref-shell.md`), and Taxonomy
opens with one filter pre-applied so its table starts 40px lower from the first frame. The auth wordmark moves between
y123 and y388 across steps (vertically centred cards). Species cards: the Restricted card sits 2 to 4px lower and
ends in a down chevron. Restricted states leave column 2 as an empty grey panel. The Data Validation Error report at
1280x800 leaves the table at its 192px floor. The centred page-number group recentres when the page count changes.

## 4. What the contracts are missing (candidate clauses)

The lanes found these gaps where "the contracts are silent". Each becomes a clause only if the designer decides it.

| Candidate clause | Settles | Issues |
| --- | --- | --- |
| Copy: casing, terms file, spelling, "and", punctuation, create verbs | the whole words group | DC-11, 12, 13, 16 |
| Dates and empty values: one formatter, "Not provided" | | DC-14, 15 |
| Status colour vocabulary | | DC-18 |
| Table cells and density, sortable columns, default page size | | DC-20 |
| Card radius, padding, toolbar control height, popover offset, close button size | | DC-22 |
| Empty, not-found, restricted, discard and loading states | | DC-25, 26, 27, 28 |
| Toast copy; disabled-control tooltip wording | | DC-17 |
| Location methods and expand pattern for maps | | DC-42 |

Contract text that disagrees with the build: section 3.7 (Explore option 2 keeps column 2; live it has none) and
section 3.8 ("never DEW components"; the Pages tool uses `TreeView`, logged as a one-off in decision `2026-10-05-09`).
The docs have drifted too: the typography page still lists `text-md` 16/24 and xs 12/18 (D3 of 29 Sept), the Tabs
doc shows icons behind an optional `withIcons` toggle although section 3.13 makes them mandatory, and the Alert doc
omits `confirmIcon`, which section 3.12 requires.

## 5. Decisions needed

I recommend an answer for each. Every one changes shared meaning, so none is applied without a yes (section 0.4).
**D1, D2, D5, D6, D9 and D11 unlock the most work; answer those first.**

| # | Decision | Recommendation | Issues |
| --- | --- | --- | --- |
| D1 | Should a Registered or Privileged User see other people's DLA requests? | No: "My requests" alone and drafts private, as nominations; guard the record URL | DC-3 |
| D2 | Header at 1280 and 1440 | One row at every width: breadcrumb truncates, search shrinks | DC-4 |
| D3 | Button focus ring colour | brand-500, 2px, as Figma and `globals.css` already say; add a focus style to breadcrumb links and pagination | DC-7 |
| D4 | Make `text-md` real (16/24) or retire it | Check the Input, Button and Tab frames in Figma; the product draws 14px, so replace with `text-sm` and drop the ratchet entries | DC-9 |
| D5 | The casing rule, and whether module and report names are proper nouns | Sentence case everywhere except proper nouns and acronyms; modules and reports follow it | DC-11 |
| D6 | Canonical names and one terms file | "Data licence agreement (DLA)", "Sensitive species nominations" (the verb stays on the button), "licence" noun / "licensing" gerund; apply the facet rule to every column-2 header, and decide what names an All/My switch | DC-12 |
| D7 | Browser tab title | `<Page> | BioData SA` via route metadata; "BioData SA" everywhere | DC-13 |
| D8 | Date format | One formatter: "23 Sep 2026", date-time "23 Sep 2026, 10:12", ranges "x to y", `en-AU` pinned in date pickers | DC-14 |
| D9 | Empty-value words | "Not provided" for missing; "Ongoing" for an open project end; drop "Not set", "Not recorded", "Not applicable" and "-" | DC-15 |
| D10 | Small copy rules | "and" not "&"; Australian spelling; "…"; curly quotes for new copy (the 29 Sept D12); no "Please" or "!"; lists use "New x", the final form action "Add x" or "Create x"; "Log in" everywhere | DC-16 |
| D11 | Status colour vocabulary | One table: done and live green, needs action amber, failed red, in-flight brand, ended grey; Completed grey; "Approved" one colour | DC-18 |
| D12 | Table rule | Identity 14/500 primary, others 14/400 tertiary, sub-line 12/400 tertiary, secondary not used in tables; reports keep dense `xs` (written into section 4.2); taxonomy 50 rows and sortable; sortable except the ID column | DC-20 |
| D13 | Remaining type roles | KPI 36/500 with eyebrow label (24/500 small); section heading 18, card heading 14 (16 only where there is no 14); selected select value 14/400; dialog and alert titles one treatment | DC-21 |
| D14 | Surfaces and controls | Record cards radius 12 bordered; toolbar toggle 36; popover offset 12 by default; close buttons 36/20; map control inset 12 | DC-22, 42 |
| D15 | New shared components (each is a section 1.4 override, none is a deletion) | `NotFoundState`, `RestrictedState`, a segmented view switch, `DiscardChangesModal`, `UnwiredTooltip`; move `Breadcrumb` out of `components/scaffold/`; keep `base/TextArea` and `PinInput`, retire `custom/Textarea` (0 callers) | DC-26, 31, 34 |
| D16 | Discard prompt | `DestructiveModal`: "Discard your changes?", "Discard changes", "Keep editing" | DC-27 |
| D17 | Edit in place or a form route | Keep both only if both are written into 4.8 and 4.1; otherwise move Taxonomy to a route | DC-38 |
| D18 | Flagged concepts and observation-detail | Name flagged concepts as an inbox exception in 3.7 (queue as the only column-2 content) or rebuild it as a record with a queue switcher; rebuild observation-detail on the record template | DC-39 |
| D19 | Colour reference | Decide whether the Untitled `utility-*` palettes and the `#101828` shadow base are ingested or retired; extend 2.1c to every hex custom property | DC-23 |
| D20 | Promote the AUTO checks in section 6 | Yes, as one batch; it edits `scripts/check-contracts.mjs`, which section 9.4 makes a designer decision | section 6 |

## 6. AUTO checks owed (section 0.8)

The contracts say a check is due when a bug recurs. These have all recurred or are the second pass of the same
cause. Every one edits `scripts/check-contracts.mjs`, so each needs the designer's yes (section 9.4) and a baseline
entry only where existing debt is ratcheted.

| # | Check | Catches |
| --- | --- | --- |
| 1 | A bare "no match" paragraph outside `ListEmptyState`, and the literal "Clear search and filters" | DC-25 (section 4.2e promised this) |
| 2 | A record shell that renders `RecordHero` without a `*Switcher` | DC-37 (section 4.6 promised this) |
| 3 | `role === "biodata-admin"` outside `lib/user-role.ts`, the nav and the role config | DC-2 |
| 4 | A `use*Hydrated` consumer file with no `useRehydrate`; a smoke test that every screen-index route has non-empty `main` and every `page.tsx` is in the index | DC-1, DC-8 |
| 5 | Every class token in code resolves in the compiled CSS (replaces the hard-coded dead regex) | DC-6 |
| 6 | `Tabs`, `Tab`, `TabList`, `TabPanel`, `ToggleButtonGroup`, `Modal`, `Dialog` imported from `react-aria-components` under `app/pages` | DC-5, DC-31 |
| 7 | Local `function MetaField|Field|DetailRow|SummaryRow|NotFound*` under `app/pages`; duplicate top-level names across files | DC-19, DC-26, DC-34 |
| 8 | Any `overflow-y-auto` with `min-h-0 flex-1` and no `scrollbar-gutter` in `app/pages` (not only `<main>`) | DC-43 |
| 9 | Banned strings: `Licencing`, noun `License`, `Biodata SA`, `&` in JSX text, `Eg;`, `...`, `Sign in` | DC-12, 13, 16 |
| 10 | `toLocaleDateString(`, `Intl.DateTimeFormat(` and month arrays outside `lib/format-date.ts` | DC-14 |
| 11 | A rendered `"-"` value (`?? "-"`, `const DASH = "-"`) | DC-15 |
| 12 | `<ConfirmationModal` titled "Discard" or "Leave" | DC-27 |
| 13 | A conditional icon prop ending `: undefined` on an action `Button`; `<AlertFullWidth onConfirm` with no `confirmIcon`; `Edit02/03/01`, `PencilLine`, `DownloadCloud`, `UploadCloud` on a `Button` | DC-30, DC-29, DC-33 |
| 14 | A `Link` with `hover:` and no `focus-visible:`; `outline-brand` on an interactive element; `outline-focus-ring` without `focus-visible:outline-2` | DC-7 |
| 15 | `<Popover` under `app/pages` with no `offset`; `<CountBadge className=` with width overrides | DC-22 |
| 16 | `!` modifiers on type utilities; uppercase without tracking; `font-medium` on `h1` to `h3` | DC-21 |
| 17 | Title Case heuristic on `label`, `title`, `placeholder`, `heading` props, ratcheted | DC-11 |
| 18 | Playwright smoke: header height 65 at 1280x800 on five deep routes | DC-4 |

## 7. Recommended next move

**Wave 0, no design question. I would do these first, on your go:**
DC-1 (voucher deep links), DC-2 (seven `isBiodataAdmin` swaps), DC-5 (seven `Tabs` imports), DC-6 (dead classes and the
compiled-CSS check). They are small, functional, or silent no-ops, and the first two are wrong data.

**Wave 1, one conversation:** answer D1, D2, D5, D6, D9 and D11 (D3, D4, D7, D8 are quick yeses). Then one pass each
behind a terms file, `lib/format-date.ts`, a status-colour table, `NotFoundState` and `RestrictedState`.

**Wave 2:** the record-page group (DC-19, 36, 37, 38) and the empty, discard and icon groups (DC-25, 27, 30, 33).

**Wave 3:** promote the section 6 checks, so this state cannot drift again. Doing this last is deliberate: the
checks should encode the rules you chose in Wave 1, not the ones I guessed.

Out of scope here and worth knowing: the Pages tool tree and the "pages open as <role>" counts depend on the
screen index (DC-8), and the two newest areas (Reports landing with categories and favourites, the DLA and DSA
agreement reports) were still being edited by other sessions while this ran.

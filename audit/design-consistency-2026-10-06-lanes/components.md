# Audit: components (component consistency, static + spot live)

Question: is every pattern built once from the design system, and does every screen use that one component the same way?

## 1. Scope and method

What I ran and read:
- Read BRIEF, `ref-ingest.md`, `ref-scaffold.md`, `contracts/component-inventory.json`, `contracts/overrides.json`, and the contract clauses that load for components, shell, build, docs, prototyping.
- Inventory: 86 non-payment-icon files under `components/**` (about 12.7k lines, 5 tiers + `scaffold`) and 373 product files under `app/pages/**` (excluding `projects/`, `projectsv2/`, and `/proto`). Files list is the working tree at 6 Oct 2026 (tree is dirty, 40+ modified/untracked files; line numbers below were read from it).
- A small JSX-aware script (tag + prop parser, not regex-on-lines) over all 373 files for: `Button`, `Badge`, `CountBadge`, `Tabs/TabList`, `AlertFullWidth`, `Table`, `TableCard`, `Select/MultiSelect/ComboBox`, `Input`, `Tooltip`, `Avatar`, `FeaturedIcon`, modals, `Popover`, plus an import census per component. Counts below are from that script unless marked "grep".
- Raw-element sweep (grep, then hand-verified each hit): `<button`, `<input`, `<select`, `<textarea`, `<table`, `<dialog`, `role=`, `<svg`, `<img`, `<a`, `window.confirm/alert/prompt`, `dangerouslySetInnerHTML`, `title=` on DOM elements, inline `style=`, unicode glyph icons and emoji.
- `npx eslint app components lib config` re-run, grouped by rule and file.
- Dead-class scan: fetched the served CSS from `localhost:3000` (227 KB), extracted every class selector, then every Tailwind-looking token in string literals in `components/**` and `app/pages/**` (1,418 distinct candidates) and listed what has no rule. Spot-confirmed live with `getComputedStyle` on probe elements.
- `npm run check:contracts`: passes ("OK").
- Live (Playwright, 1708x1024, fresh context each, zero console/page errors on every page I loaded): keyboard activation on record-page tabs (5 pages), computed style of dead classes, empty-state behaviour on 9 list screens (screenshots in `.context/audit/shots/components-*.png`).

What I did NOT cover: pixel-level visual comparison of every variant (static only except the spot checks above); `app/proto/**`; doc-page Playground behaviour; the persona matrix (all live checks used `biodata-admin`, `biodata-super-admin` or `registered-user`); whether the 7 ingest-only components with no product caller (PinInput, InputTags, TagSelect, BadgeGroup, InputPayment, ProgressCircle, TableCard.Pagination) behave correctly. Typography/colour fidelity are other lanes; I only flag them where a component-level mismatch causes them. Status colour mapping (COMP-12) is included because it is a Badge-colour consistency issue.

## 2. What holds

- No hand-rolled lookalikes of the basic form controls: zero raw `<select>`, `<textarea>`, text `<input>`, `<dialog>`; the only raw `<input>` elements are 6 hidden `type="file"` triggers and the OTP boxes.
- Zero `window.confirm/alert/prompt`, zero `dangerouslySetInnerHTML`, zero inline `<svg>`, zero emoji, zero unicode glyph icons except one legitimate `×` between two dimension inputs (`project-detail/field-controls.tsx:141`) and a `•••` expander (see COMP-9).
- Lists are tables: every collection uses `Table`/`TableCard.Root`/`TableCard.PaginationNumbered` (27 pagination uses; `TableCard.Pagination` has 0). `Table layout="fixed"` + `bodyScrollable` on 24 of 32 tables (the rest are embedded).
- `Badge` colour/size discipline is strong in code: 75 of 77 `Badge` calls are `size="sm"`, only 2 stacked className overrides. `CountBadge` 33 calls, 1 override.
- `RecordHero` (14 files), `RecordBackLink` (13), `FormRow` (101 uses, 12 files), `ToolbarSearch` (19 files), `BreadcrumbSwitcher` (6 wrappers), `AuditLog` (7 pages) are each defined once and used by every sibling record/list/form screen that should use them.
- Toasts are uniform (`toast.success` 75, `.error` 7, `.brand` 7, `.warning` 1; no second toast system). Native `confirm` is never used; destructive actions go through `DestructiveModal` (17 files) / `ConfirmationModal` (10) / `FormModal` (5).
- Date entry: no `<InputDate` in product (§2.11), `InputDatePicker` in 16 files.
- Icon library: `@untitledui/icons` in 203 files. `lucide-react` is in 3 files (`_shared/record-icons.ts`, `map-search/species-group-icons.ts`, comment in `species-results.tsx`), each with a written designer authorisation (known/accepted).
- Contracts check passes; the `tree-view.tsx` working-tree change is additive and opt-in (see section 5).

## 3. Eslint (base component health)

Re-run result: **29 errors, 10 warnings, 0 in `app/pages/**` or `app/proto/**`.** The brief's description (static-components, set-state-in-effect in several files) is slightly different from what runs today: there is no `react-hooks/static-components` finding now.

| Rule | Count | Files | Origin |
| --- | --- | --- | --- |
| `react-hooks/refs` (error) | 25 | `components/base/input/input-tags.tsx` (13), `input-tags-outer.tsx` (12) | Untitled UI ingest |
| `@typescript-eslint/no-empty-object-type` (error) | 3 | `input.tsx:229`, `input-payment.tsx:82`, `tooltip.tsx:101` | Untitled UI ingest |
| `react-hooks/set-state-in-effect` (error) | 1 | `lib/config-context.tsx:57` | **Ours** (doc-site config provider) |
| `@next/next/no-img-element` (warn) | 6 | avatar, avatar-profile-photo, avatar-company-icon, badges (x2), tags | ingest |
| `@typescript-eslint/no-unused-vars` (warn) | 4 | `input-number.tsx:63`, `tag-select.tsx:77,233,351` | ingest |

User-visible bug risk: **none found.** `InputTags`/`InputTagsOuter` have no caller outside their doc page (`app/(docs)/components/input/page.tsx`); `config-context` only runs the doc site's live config; the empty interfaces are compile-time only; the `<img>` warnings are on avatar/badge image slots that no product screen uses with a photo (`Avatar` is never given `status`/`verified`/`companyIcon` in product). The ref-in-render pattern in `InputTags` is a real rule violation (stable-id reconciliation mutates refs during render) so it will misbehave under React compiler/strict re-render, but it is not reachable from a product screen.

## 4. Findings

Format: design-system level (shared component) first, then call-site level.

---
### DESIGN-SYSTEM LEVEL (the shared component is missing, wrong, or duplicated)

### COMP-1 [HIGH] The segmented (view-switch) control is not a component: 11 implementations
- **What:** Tree/Table, Cards/Table, Open/Resolved, Species/Records switches are each assembled from raw `ToggleButtonGroup`/`<button>` with a hand-copied tray. There is a DS equivalent (`TabList type="button-border"`, same tray `rounded-[10px] bg-secondary p-1 ring-1 ring-secondary ring-inset`) used only 3 times (the draw-tool pickers).
- **Evidence (11 + 3):**
  - 6 use the shared class pair in `app/pages/project-detail/segmented.ts` (a de facto component living in a project-detail folder, imported across modules): `project-detail/review-view.tsx:451`, `records-explorer.tsx:407`, `species-view.tsx:291`, `artefacts-view.tsx:114`, `_shared/taxonomy/tx-records.tsx:71` (imports from `@/app/pages/project-detail/segmented`), `_shared/reports/reports-landing.tsx:95`.
  - 1 inline copy with different unselected colour (`text-quaternary` vs `text-tertiary`) and icon gap: `project-detail/option-2/project-detail-view.tsx:1394-1425`.
  - 3 raw `<button>` rows with different geometry and selected colour (`text-brand-secondary`, `border`, `h-9`, no ring): `observations/observations-search.tsx:1358` (tray is `rounded-lg border bg-secondary`, not `rounded-[10px]`), `_shared/map-search/results-table.tsx:345` and `:359` (the type tabs).
  - DS: `dla/add-location-modal.tsx:158`, `observations-search.tsx:1557`, `project-registration/geo-extent-picker.tsx:187` (`TabList type="button-border" size="sm"`).
  - Selected-text colour differs: `text-secondary` (segmented.ts) vs `text-brand-secondary` (observations, results-table).
- **Where it shows:** every Tree/Table or Cards/Table toggle: project page tabs, Reports landing, Taxonomy, Explore results.
- **Winner:** one `SegmentedControl`/`ToggleGroup` in `components/application` (or fold into `Tabs type="button-border"` with a non-tab-panel mode). The `segmented.ts` look is the dominant sibling (6 of 11) and equals the DS `button-border` tray, so it wins; the 4 outliers are brought in line (§0.9.4). Needs a designer go-ahead because it is a new component (§1.4), not a rename.
- **Clause / theme:** §1.1 (one source), §1.4 if it becomes a component, §0.9; **T2, T7**.
- **Fix size:** 11 call sites + 1 new/extended component (shared).
- **Mechanical?** Partly: AUTO check that `ToggleButtonGroup` is not imported from `react-aria-components` under `app/pages` except through the one component (same shape as §5.4).

### COMP-2 [HIGH] Seven places use react-aria's raw `Tabs` instead of the DEW `Tabs`; keyboard behaviour differs between record pages (live-confirmed)
- **What:** DEW `Tabs` (`components/application/tabs/tabs.tsx:239`) adds `keyboardActivation="manual"` (and Barlow). Seven product files import `Tabs` straight from `react-aria-components`, so arrow keys activate tabs immediately there but not on the other record pages (§1.9 item 3).
- **Evidence:** raw `Tabs`: `_shared/nominations/nomination-detail.tsx:149` (`ContentTabs`, import at `:4`), `project-list/[id]/project-details/project-details-view.tsx:151` (import `:8`), `project-list/page.tsx:263`, `dashboard/page.tsx:309`, `observation-detail/page.tsx:893`, `project-detail/option-2/project-detail-view.tsx:1161` (import `:8`), `observations/observations-search.tsx:1554,1926`. DEW `Tabs` is used in 24 files.
- **Live (Playwright, `biodata-admin`, focus first tab, press ArrowRight):** Nomination record (`/pages/nominations/NSS-2026-00001`): selection moved Overview to "What to protect" (activated on arrow). DLA record, DSA record, project page: stayed on Overview (manual). Zero console errors.
- **Where it shows:** Nominations record page for every role that can open it; Explore panels; the old shell pages.
- **Winner:** DEW `Tabs` (design system + §1.9; 24 vs 7).
- **Clause / theme:** §1.9 item 3, §1.1, §0.9.4; **T6** (record pages not following one pattern).
- **Fix size:** 7 files, swap import; no shared-component change.
- **Mechanical?** Yes: AUTO that `Tabs` (or `Tabs as X`) is not imported from `react-aria-components` under `app/pages` (also catches `Tab`, `TabList`, `TabPanel`).

### COMP-3 [HIGH] Record-page building blocks are hand-cloned in the newest record pages: `HeroMeta` vs `MetaField` (x7), `RecordRow` vs `Field`, `ContactCard` copy
- **What:** the shared pieces exist (`HeroMeta`, `RecordRow` in `_shared/record-hero.tsx:26,73`; `ContactCard` in `_shared/contact-card.tsx`). DLA, DSA and User record pages re-declare their own and render different type treatments.
- **Evidence:**
  - `MetaField` is declared 7 times (47 uses): `dla/dla-detail.tsx:65`, `dsa/dsa-detail.tsx:71`, `user-management/um-detail.tsx:50` (hard-coded white, byte-equal to `HeroMeta`), `map-search/record-detail.tsx:727` (gap-1.5, different), `artefact-lightbox.tsx:73`, `observation-detail/page.tsx:453`, `project-detail/option-2/project-detail-view.tsx:600`. `HeroMeta` has 42 uses in 10 files (nomination, notification, cv, taxonomy, vouchers, project template, datasets, reports); DLA, DSA, UM do not use it.
  - Panel rows: DLA and DSA record cards use a local `Field` (stacked, label `text-sm font-medium text-tertiary` above the value: `dla-detail.tsx:56`, `dsa-detail.tsx:60`) while `RecordRow` (50 uses, 5 files) is label-left `text-sm text-secondary` with `sm:w-44`. A third variant `Field` in `map-search/record-detail.tsx:90` (label left, value `font-medium`).
  - `ContactCard` defined locally at `project-detail/option-2/project-detail-view.tsx:663` beside the shared one (5 uses in 3 files).
  - `DetailRow` x2 (`project-detail-view.tsx:626`, `observation-detail/page.tsx:481`), `SummaryRow` x3 (`record-full-view.tsx:93`, `nomination-form.tsx:109`, `review-section.tsx:19`).
- **Where it shows:** DLA record, DSA record, User record (BioData Admin), project page option 2, Explore record panel.
- **Winner:** `HeroMeta` / `RecordRow` (shared, 42 and 50 uses; §4.6 names `RecordRow`/`RecordHero`).
- **Clause / theme:** §4.6 items 2 and 4, §0.9, §1.7; **T3, T6**.
- **Fix size:** about 10 files; no shared change except possibly letting `HeroMeta` accept the second spacing.
- **Mechanical?** Yes: AUTO that a file under `app/pages` does not declare `function MetaField|Field|DetailRow|SummaryRow`, or that no two files declare the same local component name (duplicate-name audit, §1.7 is `AUDIT` today and only compares `components/**`).

### COMP-4 [HIGH] Dead utilities that compile to nothing, beyond the known `text-md` list (new, live-confirmed)
- **What:** classes the compiled CSS has no rule for. An element carrying them falls back to the browser default (borders become `currentColor`, i.e. near-black `rgb(46,41,37)` here).
- **Evidence (class, file:line, effect):**
  - `border-brand`: `components/application/progress-steps/progress-step-base.tsx:25` (connector of a completed step), `_shared/dataset-upload/upload-dropzone.tsx:76` (drag-over highlight). Probe element with `border-2 border-brand` renders `rgb(46,41,37)` against `border-secondary` `rgb(229,228,226)`.
  - `border-error`: `upload-dropzone.tsx:75` (invalid dropzone has a near-black border, not red).
  - `text-success-primary`: `upload-dropzone.tsx:114` (success line has body-text colour).
  - `bg-secondary_hover`, `hover:bg-secondary_hover`: `components/application/tree-view/tree-view.tsx:321-322` (drop-target and selected-hover fills do nothing).
  - `border-brand-solid`: `project-registration/stepper.tsx:42-43`.
  - `bg-overlay/70`: `_shared/map-search/expandable-map.tsx:90` (backdrop is transparent; the `bg-overlay` token exists, the `/70` form does not).
  - Ingested files: `ring-bg-primary` (avatar company icon + online indicator), `text-placeholder/50` and `/40` (`pin-input.tsx:54-56,99`), `to-bg-primary` (`input-date.tsx:174`), `caret-alpha-black/90` (`input-tags.tsx:288`).
  - Known and ratcheted (not re-raised as new): `text-md`, 55 occurrences in `contracts/baseline.json` (49 in `components/**`, 6 in `app`); it makes Button `lg`/`xl`, Input `md`/`lg`, Select/MultiSelect/Checkbox/Radio labels, and TabList `md` render at 14px, so those sizes are not distinct. Still in product: `_shared/home-dashboard.tsx:94,491,655`.
  - Scan limits: the script only checks tokens whose first segment is a known Tailwind utility prefix; digit-first breakpoints (`2xl:`) are escaped differently and were verified by hand (not dead).
- **Where it shows:** dataset upload (invalid and drag-over states), any `Progress` step with a completed connector (setup-profile, ingestion popover, explainer card), Explore expand-map, registration option 1 stepper.
- **Winner:** use the existing token utilities (`border-brand-300/500` as the metric tile does, `border-error-300`, `text-success-600`... these exist; confirm per §0.2) or add the utility to `globals.css` first.
- **Clause / theme:** §0.2, §2.1a; **T2** (silent no-ops).
- **Fix size:** 6 product sites + 3 ingested files; token decision is the designer's.
- **Mechanical?** Yes, and better than today: replace the hard-coded `DEAD` regex in `scripts/check-contracts.mjs:200` with "every class token in code resolves in the compiled CSS" (needs a build step; the scan I used is 60 lines and ran in under 2 s).

### COMP-5 [HIGH] Layout/shell building blocks copied four times in live routes: `NavTree`, `SectionPlaceholder`, a hand-built column-2 `<aside>`
- **What:** the Home, Projects, Explore-detail and project option-2 screens each carry their own copy of the same collapsible nav tree and fallback placeholder.
- **Evidence:** `function NavTree` at `project-list/page.tsx:47`, `dashboard/page.tsx:80`, `observation-detail/page.tsx:80`, `project-detail/option-2/project-detail-view.tsx:110`; `function SectionPlaceholder` at `project-list/page.tsx:113`, `dashboard/page.tsx:151`, `observation-detail/page.tsx:432`, `project-detail-view.tsx:576`; the same `<aside aria-label="Section" className="hidden w-[286px] ...">` literal at `dashboard/page.tsx:313,357`, `project-list/page.tsx:267,305`, `observation-detail/page.tsx:895,918`, `project-detail-view.tsx:1165`. Each hand-rolled expand toggle is a raw `<button>` with the same classes (`project-list/page.tsx:84`, `dashboard/page.tsx:122`, `observation-detail/page.tsx:104`, `project-detail-view.tsx:141`).
- **Where it shows:** `/pages/dashboard`, `/pages/project-list`, `/pages/observation-detail`, `/pages/project-detail/option-2`. Only the "other section" fallback of each uses NavTree, so it is dormant UI until a persona hits a section with no page, but it is live code that the sibling grep keeps finding.
- **Winner:** the shared shell components (`primary-rail`, `projects-sidebar`, per-collection shells); the NavTree/placeholder copies should be deleted or promoted to one shared file (designer decision: do not delete without ask, §0.4).
- **Clause / theme:** §0.9, §1.7 (app-level duplicates), §3.7; **T2**.
- **Fix size:** 4 files.
- **Mechanical?** Yes (duplicate top-level function names across `app/pages` files).

### COMP-6 [MED] `Breadcrumb` is a Scaffold file used as product UI
- **What:** `components/scaffold/breadcrumb.tsx` is imported by product code, contrary to §1.1/§1.5 ("`components/scaffold/**` may only operate or wrap a demonstration, never appear as product UI").
- **Evidence:** `_shared/app-header.tsx:4` (every screen's header), `dataset-upload/upload-shell.tsx:8`, `project-detail/project-detail-template.tsx:44`, `project-detail/option-2/project-detail-view.tsx:53`, `project-list/[id]/project-details/project-details-view.tsx:18`, `observation-detail/page.tsx:37`. It is on the approved inventory (`contracts/component-inventory.json:138`), so the check passes.
- **Winner:** contracts silent on where a promoted product component from Scaffold lives: needs designer decision (move to `components/application/breadcrumbs`, with an override entry, or rule it a documented exception).
- **Clause / theme:** §1.1, §1.5; none of T1-T12.
- **Fix size:** 1 move + 6 import edits.
- **Mechanical?** Yes: AUTO that `app/pages/**` does not import `components/scaffold/**` (allow-list `Gap`).

### COMP-7 [MED] Twins and orphans in the component tier (§1.7 / §1.1)
- `components/custom/textarea/textarea.tsx` (`Textarea`) beside `components/base/textarea/textarea.tsx` (`TextArea`): **0 product callers for the custom one**, 22 for the base one. `ref-ingest.md` names this exact pair as a defect to resolve by migrating callers (here none to migrate), still has a doc page at `/custom-components/textarea`.
- `app/pages/auth/_shared/otp-input.tsx` (`OtpInput`, 6 hand-made boxes) beside `components/base/input/pin-input.tsx` (`PinInput`, on `input-otp`). The file's header says "No DEW OTP/code-input component exists yet"; `pin-input.tsx` has been in the repo since the 31 Aug ingest, before `otp-input.tsx` (23 Sep). `PinInput` has no doc page and is not in `lib/nav.ts`, which is probably why it was missed.
- `components/custom/date-range/date-range-control.tsx`: 0 product callers (documented as pending promotion).
- Ingested with no product caller (no action, listed for the §1.7 audit): `PinInput`, `InputTags`/`InputTagsOuter`, `TagSelect`, `BadgeGroup`, `InputPayment`, `ProgressCircle`, `TableCard.Pagination` (the simple one), `ButtonUtility` (only the text editor uses it; the designer's "~35 icon-only Button accepted" is now 44 icon-only `Button` plus about 10 raw icon buttons, see COMP-9).
- Select family overlap: a searchable single choice is built three ways: `MultiSelect selectionMode="single"` (8 calls), `ComboBox` (6), `Select.ComboBox` (3); plain `Select` (43) is used for long lists (see COMP-9, search-and-pick fields).
- **Clause / theme:** §1.7, §1.1; **T2**. **Winner:** contracts say migrate callers and keep one; designer decides which of each pair (never delete without ask, §0.4).

### COMP-8 [MED] A component default does not match how the product uses it; wrappers repeat their own defaults at every call site
- **Evidence:**
  - `Badge` default is `size="md"` (`badges.tsx:145`) and the doc Playground defaults to `md` (`app/(docs)/components/badge/page.tsx:60`), but 75 of 77 product calls pass `size="sm"`; only `cv-form.tsx:284` and `notifications/nt-form.tsx:356` use `md`.
  - `SectionHeader.Root` has no horizontal padding of its own, so **all 19** call sites pass a className: 17 `"shrink-0 p-6"`, `form-page.tsx:68` `"shrink-0 px-6 pt-6"`, `reports-landing.tsx:85` `"shrink-0 px-6 pt-6 pb-4"` (the default `pb-5` is overridden to `pb-4` on one screen; the 24px vs 20px vs 16px below-title spacing is a T1 candidate).
  - `Table` is `size="md"` by default; 23 of 32 pass a `min-w-[...]` in 8 different widths (700 to 1100px), `TableCard.Root` repeats `"flex min-h-48 flex-1 flex-col"` 18 times (§4.2 asks for it on every collection table). These belong in the component (an opt-in `fill` prop, §1.6).
  - Form header status badge: `FormPage` takes a `badge` node, so each form chooses the size: `Badge size="md"` in `ctrl-vocab/cv-form.tsx:284` and `notifications/nt-form.tsx:356`, `size="sm"` in `dsa/dsa-form.tsx:369`.
- **Winner:** the usage (sm badge, `p-6` header, filled table) is dominant; push it into the component default or opt-in props (§1.6) so call sites stop repeating it. Changing a default is a designer call.
- **Clause / theme:** §1.6, §1.9 ("fix once in the component"), §0.9; **T1, T3**.
- **Fix size:** 3 shared components + about 60 call sites to delete overrides.
- **Mechanical?** Partly: AUDIT list of className strings repeated at 10+ call sites of one component.

---
### CALL-SITE LEVEL (the component exists and is bypassed or used inconsistently)

### COMP-9 [HIGH] Hand-rolled lookalikes of existing components, by family
Counts are real bypasses after hand-checking each hit (64 real raw `<button>` in 30 files; 1 `role="button"` span = the disabled legal icons in the rail, accepted; 4 `role="alert"` wrappers).
- **Alert / notice (T2 theme named by the designer):**
  - `AlertFullWidth contained` is wrapped with stacked classes `max-w-none rounded-lg border border-error-300 bg-error-50` that `contained` + `color="error"` already produces: `project-detail/project-edit.tsx:544`, `project-detail/record-full-view.tsx:516`. This is the same "Details missing" alert `FormPage` renders (`form-page.tsx:88`) so there are 3 builds of one alert. (The only other className on an alert, `page-banner.tsx:43`, is inside the shared `PageBanner`.)
  - Plain-div notice lookalikes with warning tints instead of `AlertFullWidth color="warning"`: `project-detail/field-controls.tsx:413-414` (`role="alert"` paragraph), `project-detail/record-inspector.tsx:288`, `record-panel.tsx:825`, `record-full-view.tsx:390`, `project-detail/option-2/project-detail-view.tsx:922` (5 sites, all in the project record views).
  - `AlertFullWidth color="default"` and `"gray"` map to the same tint (`alerts.tsx` `tintMap`): both are used (`project-details-route.tsx:54` vs 13 `gray`).
  - 3 alerts are not `contained` (`dla-form.tsx:306`, `dla-detail.tsx:98`, `dsa-form.tsx:429`) while §4.6 says "the contained AlertFullWidth inside the content"; `PageBanner` has only 1 call site (`observations-search.tsx`).
- **Badge / chip (T2 "huge tags vs the standard small Badge"):** `project-detail/project-tab.tsx:109-116` `Chips` (`rounded-full border px-2.5 py-1 text-xs`) for focus areas and species on the Project tab (used at `:706`, `:710`); `project-detail/landscape-editor.tsx:72` "Calculated" pill; `landscape-view.tsx:47` `PointsPill`; `visibility-panel.tsx:74` count pill; `map-search/results-table.tsx:370` count chip using `utility-neutral-*` classes (a `CountBadge color="gray"` clone); org pill copies at `project-detail-view.tsx:508` and `observation-detail/page.tsx:373` (the header's accepted 10px pill, but cloned). Filter chips: `Tag size="md"` in `_shared/attribute-filter.tsx:217` vs `Tag size="sm"` in `project-detail-view.tsx:1268` (two sizes of the same removable filter chip).
- **Buttons:** icon buttons hand-made as `<button>` instead of `Button`/`ButtonUtility`/`CloseButton`: `project-detail/field-notes.tsx:159` (remove file), `_shared/threat-summary-card.tsx:31` (pin), `map-search/record-peek-card.tsx:42` (close, a `CloseButton` clone: `size-8 rounded-full`), `map-search/map-zoom-buttons.tsx:16,19`, `species-photo-carousel.tsx:76,79`, `artefact-lightbox.tsx:161,169`, `area-layers.tsx:105` (eye toggle), `results-table.tsx:136`. Hand-made text button: `project-detail/review-view.tsx:404` ("back", `ArrowNarrowLeft`, not `RecordBackLink`/`Button link-color`), `results-table.tsx:100` (`•••` glyph as the control). "Favourite/pin" star is built twice with different on-colours: `_shared/reports/report-actions.tsx:17` (brand) and `threat-summary-card.tsx:31` (warning-500 yellow).
- **Collapsible rows** (a DS `Accordion` exists, 9 files): raw `aria-expanded` buttons at `project-detail/record-full-view.tsx:457,488`, `visibility-panel.tsx:142`, `field-notes.tsx:915`, `map-search/area-layers.tsx:66`, `observations-search.tsx:2265,2351`, plus the 4 NavTree copies (COMP-5).
- **Modals / drawers composed from react-aria directly** (DEW `Modal` family is used by 12 files that compose `ModalOverlay`+`Modal`+`Dialog` themselves; 5 of them go straight to react-aria): `project-detail/edit-drawer.tsx:16`, `record-fullscreen.tsx:8`, `_shared/map-search/side-panel.tsx:4`, `map-search/expandable-map.tsx:22`, `project-registration/geo-extent-picker.tsx:12`. No DS slide-over or fullscreen modal exists, so this is a gap (§1.2: needs `<Gap>` or a designer-approved component), not a lookalike per se.
- **Embedded tables** (§4.2 "applies at every scale"): hand-built `<table>` with their own header classes at `project-detail/record-inspector.tsx:95`, `project-detail/landscape-view.tsx:278`, `_shared/location-details-table.tsx:67`, `map-search/record-detail.tsx:125` (each `th px-3 py-2 text-xs font-semibold text-quaternary`, none `Table size="xs"`); editable grids that are arguably not `Table` (`ctrl-vocab/cv-grids.tsx:352,493,614`, `vouchers/vm-compare.tsx:324`).
- **Breadcrumbs / trails:** page-level `Breadcrumb` is fine; in-page trails are hand-built from raw `<button>` + `ChevronRight`: `project-detail-view.tsx:520-561`, `observation-detail/page.tsx:400-422`, `record-inspector.tsx:234`, `record-panel.tsx:396`, `project-detail-template.tsx:330,348`.
- **Search-and-pick fields faked with the wrong component:** the same field "Organisation / Institution" is a plain `Input` with a search glyph (`project-registration/step-1-project-details.tsx:58`, placeholder "Search or type to select"), a plain `Select` given `icon={SearchLg}` (`auth/setup-profile/page.tsx:243-246`), and a plain `Select` (`user-management/um-forms.tsx:308,403`). The project picker is a plain `Select` on `reports/data-validation-error-report.tsx:146` but a `ComboBox` in `dataset-upload/choose-project-modal.tsx:53` and `breadcrumb-switcher.tsx:82`.
- **File upload zones, 4 builds:** `InputFile` (5 files), `UploadDropzone` (`dataset-upload/upload-dropzone.tsx`), `LogoUpload` (`project-registration/logo-upload.tsx`, 3 callers), and the label-wrapped dropzone at `auth/setup-profile/page.tsx:152`.
- **Progress:** `project-registration/typeform-card.tsx:54` hand-draws a progress bar (`ProgressBarBase` exists, 6 uses); `project-registration/stepper.tsx` is a local stepper beside `Progress.IconsWithText` (4 files).
- **Native tooltips:** 40 DOM elements carry `title=` (26 `span`, 5 `button`, 3 `p`, 3 `div`, ...), against 25 `Tooltip`/`TooltipTrigger` uses in 14 files. Many are legitimate truncation fallbacks (§4.2f), but 9 are information icons or counters that read as tooltips and should be `Tooltip`: `project-detail/record-panel.tsx:352,361,370`, `field-notes.tsx:101,109,117`, `records-explorer.tsx:122`, `landscape-view.tsx:45`, `visibility-panel.tsx:216`.
- **Empty states, 5 variants** (live-confirmed, search for "zzzqqq no such thing" on each list): (a) `ListEmptyState` (dla, dsa, nominations, projects, template finder, reports; screenshot `components-empty-dla.png`), (b) plain sentence plus a `link-color` "Clear search and filters" button (`ctrl-vocab/cv-list.tsx:148`, `vouchers/vm-list.tsx:120`, `notifications/nt-list.tsx:125`, `nt-list-2.tsx:155`; screenshot `components-empty-notifications.png`; also the label §4.2e rules out), (c) a bare grey sentence "Nothing matches your search and filters." on Users, Roles, Permissions (`user-management/um-lists.tsx:116`; `components-empty-users.png`), `project-detail/datasets-view.tsx:273`, `dsa-detail.tsx:321`, `page.tsx:115`, (d) a bold title + line, no icon: `species-view.tsx:316`, `artefacts-view.tsx:139`, `records-explorer.tsx:436`, (e) 40-odd per-section bare lines ("No measurements yet.", "No comments yet.", "None recorded"...) in record views. `ListEmptyState` is only 11 files / 15 uses although 19 files render `ToolbarSearch`. The not-found state (a heading plus line plus back button) is copied 10 times: `dla-detail.tsx:546`, `nomination-detail.tsx:290`, `dsa-detail.tsx:457`, `cv-detail.tsx:407`, `tx-records.tsx:461`, `vm-record.tsx:205`, `vm-routes.tsx:40`, `um-detail.tsx:674`, `nt-detail.tsx:320`, `datasets-view.tsx:340`, with the back button as `link-color` in most but `secondary` in `project-details-view.tsx:195` and `upload-shell.tsx:50`.
- **Clause / theme:** §1.1, §1.7, §0.9, §4.2e; **T2, T11**. **Winner:** the existing DS component in each row (Alert, Badge/CountBadge, Button/CloseButton/ButtonUtility, Accordion, ComboBox, Tooltip, ListEmptyState). Several rows (modal/drawer, embedded `Table size="xs"` check, NotFound, trail) need a designer decision because no component exists.
- **Fix size:** about 60 sites in about 30 files. The project-detail folder alone holds 25 of them.
- **Mechanical?** Partly. Yes for: `<button` with `aria-expanded` outside `components/**`; className containing `border-error-300` on `AlertFullWidth`; `title=` on `span/button/div`; `function \w+NotFound` duplicates; `react-aria-components` value imports (`Tabs`, `ToggleButtonGroup`, `Modal`, `Dialog`) outside `components/**` (allow-list the Dialog uses in `breadcrumb-switcher` and `filter-menu`).

### COMP-10 [HIGH] One action, several icons or treatments (T4 table and size discipline)
Action to icons actually used (JSX-parsed `Button` calls; non-button icons counted from import census):

| Action (contract §3.12) | Contract icon | Icons actually used (numbers are files that import the icon, unless noted) | Disagreement |
| --- | --- | --- | --- |
| Edit | `Edit05` | `Edit05` (17 files), `Edit02` (6 files: Button at `record-inspector.tsx:326`, `project-tab.tsx:234`, `tx-records.tsx:420`; also `field-notes.tsx`, `record-panel.tsx`, `record-full-view.tsx`), `PencilLine` (2), `Edit03` (`area-layers.tsx`) | 4 glyphs for one action; the doc page itself uses `Edit01` (`components/button/page.tsx:246`) |
| Download, export | `Download01` | `Download01` (15), `DownloadCloud02` (`artefact-lightbox.tsx:231`, `home-dashboard.tsx`), `Download02` (marketing) | 1 button site off-contract |
| Upload | `Upload01` | `Upload01` (11), `UploadCloud02` as a button icon at `dataset-upload/ingestion-views.tsx:93` | 1 |
| Back, keep editing | `ArrowLeft` | `ArrowLeft` (7 icon props), `ArrowNarrowLeft` (18 icon props: every record "Back to X" link, `form-page.tsx:104` "Back a step") | 2 glyphs |
| Continue, next (trailing) | `ArrowRight` | `ArrowRight` (12 icon props: auth, typeform), `ArrowNarrowRight` (47 icon props, mostly "Go to X") and also Continue in `form-page.tsx:117` | `FormPage`, the canonical form footer, contradicts the §3.12 table; 11 forms inherit it |
| Search | `SearchLg` | button `SearchLg`, field glyph `SearchMd` (§4.2c), empty-state glyph `SearchLg` except `species-restriction.tsx:158` `SearchMd`, `Select icon={SearchLg}` (setup-profile) | field vs button glyph is by design; 1 empty-state mismatch |
| Attach a file | none | `Attachment01` (`nt-form.tsx`), `Upload01` ("Add attachment", `record-form.tsx:468`), `Paperclip` (tabs) | 3 glyphs, not in the table |
| Remove / delete | `Trash01` | `Trash01` (41), plus `XClose` for "Remove" at `field-controls.tsx:669` | 1 |
| Cancel | `XClose` | `XClose` 12; a Cancel with no icon at `project-registration/page.tsx:150` (`link-gray`, exempt) | none material |
| "..." more actions | none | `Dropdown.DotsButton` (7 sites, vertical, bare), `Button secondary DotsHorizontal` (`record-action-bar.tsx:64`), `Button tertiary DotsVertical` (`field-notes.tsx:249,759`), raw `DotsVertical` (`vm-compare.tsx:205`) | 3 trigger styles, 2 glyph orientations |

Variant discipline (JSX-parsed, `Button` default is `size="sm"`, not `md`):
- Remove-row icon-only button: 4 treatments for one job. `Trash01 tertiary sm` 15 (e.g. `landscape-editor.tsx:441`, `nomination-areas.tsx:47`), `Trash01 secondary sm` 7 (`project-edit.tsx:192`, `setup-profile/page.tsx:209`, `location-restriction.tsx:104`), `Trash01 secondary md` 5 (`record-form.tsx:339,390`, `project-edit.tsx:331`, `form-sections.tsx:333`, `step-2-data-collection.tsx:240`), `Trash01 tertiary md` 1 (`cv-form.tsx:417`). Inside `record-form.tsx` alone: `:339` md, `:361` sm, `:390` md, `:453` tertiary. Total icon-only `Button`: 44.
- "Add X": `primary sm` 23 (list headers and some in-card adds), `secondary sm` 21, `link-color sm` 24, `link-color md` 4 (`dsa-form.tsx:483`, `cv-grids.tsx:438,569`, `cv-form.tsx:422`), `secondary md` 1 (`dla-form.tsx:262`), `primary md` 2. The same action "Add area": `primary sm` at `observations-search.tsx:2012` but `secondary sm` at `nominations/nomination-areas.tsx:93`; "Add location": `secondary sm` `dla-detail.tsx:436`, `secondary md` `dla-form.tsx:262`, `primary md` `add-location-modal.tsx:243`, `primary sm` ("Add another Location") `location-restriction.tsx:109`.
- "Back to <list>": `link-color sm` + `ArrowNarrowLeft` x7 record pages; `link-gray sm` + `ArrowLeft` x4 auth; `secondary sm` + `ArrowNarrowLeft` x2 (`project-details-view.tsx:195`, `upload-shell.tsx:50`).
- "Edit": `secondary sm` (4), `link-gray sm` (5, registration review rows).
- Cancel: `secondary sm` 8, `tertiary sm` 3 (`field-notes.tsx:309,341,588`), `link-gray sm` 1, `secondary md` 1 (`add-location-modal.tsx:240`).
- `md` is otherwise reserved for the auth flow (16 `primary md`) and `biodata-home` (`lg`); the 8 non-auth `md` buttons above are the strays.
- `onClick` is used on 125 `Button` calls and `onPress` on 85; react-aria's `onPress` is the component's own event. Mixed API, no visible effect found.
- Underline `TabList`: `size="md"` x12 (gap-4, icon gap 1.5) vs default or `sm` x6 (gap-3): `tx-records.tsx:561`, `records-report.tsx:267`, `reports-landing.tsx:128` (default), `vm-record.tsx:113`, `nt-list-2.tsx:121`, `observations-search.tsx:1927` (sm). The label is the same 14px because `text-md` is dead (COMP-4), so the two sizes differ by a 4px gap only; 2 of them are record pages.
- Icon sizes (181 icon elements parsed): `size-4` 63, `size-3.5` 37, `size-3` 23, `size-5` 14, `size-6` 3. `Lock01` for "restricted/generalised/calculated" is drawn at 3, 3.5 and 4 (`species-view.tsx:251` vs `record-form.tsx:408` vs `record-peek-card.tsx:91`). Most 3/3.5 are in `project-detail/**` (about 30 of 60).
- **Winner:** the §3.12 table where it speaks (Edit05, Download01, Upload01, ArrowLeft/ArrowRight/ArrowNarrow*, Trash01); where it is silent (remove-row button size, inline add, `Back to <list>` glyph, attach, kebab) contracts silent, needs a designer decision. Dominant siblings: remove-row `tertiary sm`; inline add `link-color sm`; back link `link-color sm`.
- **Clause / theme:** §3.12, §2.4, §0.9; **T4**, **T3**.
- **Fix size:** about 45 sites, FormPage (1 shared component) for the footer arrows.
- **Mechanical?** Yes for the icon table (AUTO: map action label to icon, `Edit02|Edit03|Edit01|PencilLine|DownloadCloud|UploadCloud` forbidden on a `Button`; extend the existing §3.12 check). No for the size choices (needs a role rule first).

### COMP-11 [MED] Search field width and treatment differ inside detail tabs
- **What:** §4.2c fixes the toolbar search at 384px (`ToolbarSearch`, `max-w-sm`). The same job inside a detail tab uses a raw `Input` at 320px.
- **Evidence:** `ctrl-vocab/cv-detail.tsx:87` (`max-w-xs`), `user-management/um-detail.tsx:129` (`max-w-xs`), `dsa/dsa-detail.tsx:307` (`max-w-xs`), all with `size="sm" icon={SearchMd}`; `observation-detail/page.tsx:928` (full column width); `project-detail/visibility-panel.tsx:81`, `map-search/results-table.tsx:381`, `species-results.tsx:405`, `observations-search.tsx:2440` use raw `Input icon={SearchLg}` (the last three are the documented §4.2c open item; the glyph is `SearchLg` there against `SearchMd` in `ToolbarSearch`).
- **Where it shows:** CV entries tab, User/Role tabs, DSA systems tab, Explore results.
- **Winner:** `ToolbarSearch` (19 files, §4.2c); the three `max-w-xs` use the same component and drop the width.
- **Clause / theme:** §4.2 ("at every scale"), §4.2c; **T1, T3**.
- **Fix size:** 3 sites (+ the 4 documented ones pending a decision).
- **Mechanical?** Yes: extend `AUTO §4.2c` from "files with FilterMenu" to "any `Input` with a `Search*` icon outside `toolbar-search.tsx`".

### COMP-12 [MED] Status badge colour for the same word is not consistent across modules
- **What:** each module keeps its own `*StatusMeta`/`statusMeta` map. Same word, different colour: **Approved** is `brand` for agreements (`agreement-status.ts:49`) but `success` for dataset review (`dataset-upload/dataset-data.ts:55`); **Accepted** (nominations) is `success`. **Inactive/Disabled** are `warning` (`user-management/um-data.ts:25,32`, `notifications/nt-data.ts:185`) while **Closed/Cancelled/Archived** are `gray`; **Hidden** is `gray`.
- **Evidence:** the files above; 11 maps in total (`agreement-status`, `dataset-data`, `nomination-data`, `cv-data` x2, `vm-data` x2, `um-data` x2, `nt-data`).
- **Winner:** contracts silent - needs designer decision (a single status-to-colour vocabulary: draft gray, in progress brand, needs action warning, done success, failed error, ended gray).
- **Clause / theme:** no clause, candidate new clause; **T3, T11**.
- **Fix size:** 8 data files.
- **Mechanical?** Partly (AUDIT: same label string mapped to two colours across files).

### COMP-13 [LOW] Smaller twins worth knowing (each verified)
- Two resize-handle implementations: `_shared/resizable-columns.tsx:104-125` (column header) and `project-detail/records-explorer.tsx:626-640` (panel); same title string, aria pattern and key handling, written twice.
- Overlay round icon buttons differ in size: `map-search/species-photo-carousel.tsx:53` `size-8`, `artefact-lightbox.tsx:165,173` `size-9`, `record-peek-card.tsx:47` `size-8`, `CloseButton` sizes `xs/sm/md` elsewhere (`expandable-map.tsx:66`, `walkthrough-modal.tsx:76`).
- Stray `-` as the "empty" value in rendered UI (§2.3 says "Not provided"): `location-details-table.tsx:19` (`DASH`), `map-search/record-detail.tsx:69`, `map-search/results-table.tsx:86`, `species-results.tsx:181-183,351,356`, `observations-search.tsx` (7), `project-registration/step-1/2/3` review rows (3), `concept-rows.tsx` (1). (T11)
- Doc drift (sampled button, badge, tabs, alert, table, select, modal, tree-view): `app/(docs)/components/alert/page.tsx` does not mention `confirmIcon` (required by §3.12); the Tabs doc shows icons behind an optional `withIcons` toggle (line 149) though §3.13 makes them mandatory; the Button doc's example icons are `Edit01`/`Download01` (`button/page.tsx:246,273`); the Badge doc defaults to `md` (see COMP-8). The alert, table and tree-view docs do document the product's opt-in props (`contained`, `wrap`, `inline`, `bodyScrollable`, `layout`, `alignLeaves`, `weight`). There is no doc page for `Tag`, `FeaturedIcon`, `CloseButton` or `PinInput`, and the doc page for `TreeView` lives under `/patterns` rather than Components.

## 5. Migration status of the known intentional moves

- **ButtonUtility in the text editor:** done; the file is used only by `text-editor-extensions.tsx`. OVR-011 anticipated hand-rolled icon buttons under `app/pages` as later callers: there are now about 10 raw ones (COMP-9) and 44 icon-only `Button` (the accepted "about 35" has grown by about 9).
- **`tree-view.tsx` working-tree diff (+16/-4):** adds `alignLeaves` (context + a 16px spacer for leaf items) and `weight` (`semibold` default, `normal`) to the item content; both are opt-in with defaults that leave every existing caller unchanged (§1.6). The doc page diff documents both props and adds a demo. Callers: the Pages tool (`app/_prototype-tools/pages-tool.tsx:242,261` pass `alignLeaves`, `:210,245` pass `weight`). Nothing else passes either prop, and none of the other 5 `TreeView` files (`project-detail-view`, `records-explorer`, `observation-detail`, `tx-finder`, `um-forms`) is affected. One pre-existing dead class sits two lines from the change: `tree-view.tsx:321-322` `bg-secondary_hover` (COMP-4). The Pages tool puts a DEW component on the Scaffold bar: that is the logged §1.5 override in `context/decisions/2026-10-05-09-*`; §3.8's text ("never DEW components") has not been updated yet, as that decision file itself notes.
- **`lib/create-menu.ts`:** consistent with the §3.5 pattern (one list, role-filtered); the menu's own icons (`UserPlus01`, `Plus`, `Upload01`, `Bell01`) are in `app/pages/_shared/create-menu.tsx`, not in the lib file, and were not audited against the rail icon map.

## 6. Top duplicates the designer should resolve (needs decision, §0.4; none is a proposal to delete)

1. Segmented control: promote one `SegmentedControl` (or `Tabs type="button-border"` without panels) and migrate the 11 builds (COMP-1).
2. `HeroMeta`/`RecordRow` vs the local `MetaField`/`Field` on DLA, DSA and User records (COMP-3), and the 4 copies of `NavTree`/`SectionPlaceholder` (COMP-5).
3. `custom/Textarea` vs `base/TextArea` (0 callers) and `OtpInput` vs `PinInput` (COMP-7).
4. Where `Breadcrumb` lives (COMP-6) and whether a Drawer/Lightbox/fullscreen modal becomes a DS component (the 5 raw react-aria modals, COMP-9).
5. One empty-state pattern and one not-found pattern across list and record screens (COMP-9, T11).
6. One role rule for button size and style: remove-row, inline add, back link, kebab trigger (COMP-10), plus FormPage's Back/Continue arrows vs the §3.12 table.
7. Which `Badge` size is the default (`sm`, as 75 of 77 calls use) and one status-to-colour vocabulary (COMP-8, COMP-12).
8. Which of the 3 searchable-single-select components is canonical (`ComboBox`, `Select.ComboBox`, `MultiSelect single`) (COMP-7, COMP-9).

## 7. Decisions needed

| # | Decision | Recommendation | Clause |
| --- | --- | --- | --- |
| 1 | New shared `SegmentedControl` | Yes: take `segmented.ts` look (equals DS `button-border`), selected `text-secondary`; migrate 11 sites; needs an override entry (§1.4) | §1.4, §0.9 |
| 2 | Raw react-aria `Tabs` in 7 files | Swap to DEW `Tabs` now (no design question), then add the AUTO import check | §1.9 |
| 3 | Dead classes (COMP-4) | Map each to an existing token (`border-brand-500`, `border-error-300`, `text-success-600`, `bg-secondary`) or add the utility to `globals.css`; promote the compiled-CSS scan to `check:contracts` | §2.1, §0.8 |
| 4 | `Breadcrumb` in `components/scaffold/` | Move to `components/application` with an override entry, or log an explicit exception | §1.1, §1.5 |
| 5 | Twin pairs | Keep `base/TextArea` and `PinInput`; migrate `OtpInput` to `PinInput` and retire `custom/Textarea` (0 callers). Designer to confirm each | §1.7 |
| 6 | Badge default | Change default to `sm`, add `size="md"` only where Figma draws it; fixes FormPage header badges | §1.6 |
| 7 | Remove-row / inline-add / back-link / kebab rules | Add to §3.12: remove-row `tertiary sm` `Trash01`; inline add `link-color sm` `Plus`; back-to-list `link-color sm`; kebab `Dropdown.DotsButton` | §3.12 |
| 8 | FormPage Back/Continue glyphs | Align with the §3.12 table (`ArrowLeft`/`ArrowRight`) or rewrite the table to the `ArrowNarrow*` pair the product ships (about 47 more sites) | §3.12 |
| 9 | Empty and not-found states | One `ListEmptyState` for every list (including the 5 variants above) and one shared `NotFound` | §4.2e |
| 10 | Status colour vocabulary | Add a short table to the contracts | none (new clause) |
| 11 | Drawer / lightbox / fullscreen modal | Decide whether DS gets a slide-over; until then each is a `<Gap>` candidate | §1.2 |

Open next step recommended: start with decision 2 (mechanical, zero design risk, live-verified keyboard drift) and 3 (silent no-ops), then bring 1, 6 and 7 to the designer together because they share the same component set.

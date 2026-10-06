# Audit report: `behaviour` (behaviour patterns on collections, forms, overlays, toolbars, state handling)

Auditor lane: BEHAVIOUR. Repo: `/Users/smaniganahalli/conductor/workspaces/biodata/biarritz`. Date of run: 6 Oct 2026, about 10:00 to 10:35 ACDT.
Nothing in the repo was edited. Screenshots are in `.context/audit/shots/behaviour-*.png`.

## 1. Scope and method

What I actually ran.

- **Read:** `BRIEF.md`, `ref-shell.md`, `ref-roles.md`, `ref-domain.md` (head), `ref-ingest.md`, `ref-scaffold.md`, all `contracts-*.md` scoped files, the `/patterns/*` doc pages (`banners`, `forms`, `filters`, `navigation`, `audit-log`, `tree-view` are real; `empty-states`, `feedback` and `loading-states` are `PlaceholderPage` stubs), and about 90 source files under `app/pages/_shared/**`, `app/pages/project-detail/**`, `components/application/{alerts,modals,toast,table}`, `components/base/{dropdown,select,buttons}`.
- **Code enumeration:** grep sweeps over `app/pages` (stale `projects/` and `projectsv2/` excluded) for `SectionHeader`, `TableCard`, `bodyScrollable`, `layout="fixed"`, `ToolbarSearch`, `FilterMenu`, `ListEmptyState`, `FormPage`, `ToggleButtonGroup`, `ConfirmationModal`/`DestructiveModal`/`FormModal`, `toast.*`, `AlertFullWidth`, `Popover`, `Tooltip`, `RecordBackLink`, not-found and restricted markup, `role ===` checks.
- **Live (Playwright-core, Chromium, 1708x1024, one fresh context per page):** 23 list/report screens as `biodata-super-admin`/`biodata-admin`/`registered-user`/`public-user`; 10 create forms and 6 edit forms (footers, validation, column-2 jump refusal); 11 report screens (toolbar geometry, filter menus); 15 not-found routes; popover offset and Escape-focus-return on 14 triggers; keyboard runs (FilterMenu levels, Select and ComboBox Escape, Tabs arrows, tree arrows, row Tab/Arrow/Enter, modal focus trap and Escape return, Columns chooser, BreadcrumbSwitcher type-ahead, artefact lightbox); a focus-ring computed-style sweep over 4 screens; console `error`/`warning` sweep over 30 routes. Zero `pageerror`/console errors on every route (warnings are in BEH-27).
- **Caveat on a moving tree:** the working tree was edited while I audited (Reports landing gained a column 2 with All/My reports and a Create-a-report action at 10:20; `*-shell.tsx`, `um-*`, `nomination-*` also changed). I re-ran the load-bearing checks (BEH-1, 2, 3, 5 and 9) after the edits and they still hold. Anything about the Reports landing column 2 that I saw before 10:20 is dropped.
- **Not covered (be honest):** auth flow and registration option 1 (exempt or out of lane); Explore map overlays and results panel (open items already in the contracts); Home dashboards; `privileged-*` and `biodata-user` roles (no screens of their own); mobile widths; real-browser scrollbars (§4.2f, headless hides them); mouse hover and pressed styling beyond the focus sweep; side panels (`map-search/side-panel`, `edit-drawer`) were read, not driven; ComboBox/TagSelect Escape was tested on the species picker and the breadcrumb switcher only.
- `npm run check:contracts` prints "Contracts: OK" on this tree. So every finding below is either REVIEW-only or an AUTO gap.

## 2. What holds (confirmed live)

- Every collection list uses `SectionHeader` then `ToolbarSearch` (384px) then `FilterMenu` at the same x (Filter at x=770 on all lists) then a fixed-layout `TableCard` with `PaginationNumbered`; columns and toolbar do not move between All and My (DLA, DSA, nominations, projects, users: identical search y, table y, column x).
- FilterMenu is keyboard complete: Enter opens, ArrowDown/ArrowRight enter the submenu and its search box, Enter ticks, Escape closes one level at a time, focus returns to Filter, ticked values and chips survive Escape (DLA list).
- Select (3 screens), ComboBox (species picker) and Columns chooser: Escape closes without changing the committed value, focus returns to the trigger.
- Modal behaviour: focus is trapped over 6 Tabs, Escape closes and returns focus to the "Close form" button (CV discard); artefact lightbox: Enter on a row opens it, Escape returns focus to the row.
- Row = link: Tab lands on the row, ArrowDown moves between rows, Enter navigates (DLA list).
- BreadcrumbSwitcher is keyboard complete (Enter opens, type to filter, ArrowDown+Enter picks).
- Form validation matches §4.1.4 on all 8 multi-section forms tried: Continue and a forward jump through column 2 are refused, one "Details missing" alert names the section's missing fields, column 2 stays on step 1.
- Not-found pages never lose the header and rail; guest-restricted screens keep all three columns and use one wording template ("Go to Home").
- Toasts are one component, one corner (bottom right, 88px lift), one card anatomy.
- Report screens (11) share one toolbar geometry: search 384, [Project select], Filter, Columns pinned right.

## 3. Findings

Severity counts: HIGH 6, MED 14, LOW 9 (29 findings). Findings are ordered by severity, then by blast radius.

### BEH-1 [HIGH] Voucher batch and record deep links render an empty page forever
- **What:** Loading or reloading `/pages/vouchers/<id>` (or `?record=`) shows the header, rail and an empty `<main>`; clicking in from the list works. Competing behaviours: in-app click (works) vs deep link / reload (dead). Sibling stores (DLA, DSA, CV, users, taxonomy) deep-link fine.
- **Evidence:** `app/pages/_shared/vouchers/vm-routes.tsx:34-57`: `BatchScreen` renders `null` until `useVouchersHydrated()`. `vm-store.ts:50-61`: the only callers of `useRehydrate(useVmStore)` are `useDecisions()`/`useEdits()`, which are first called inside `VmBatchPage`/`VmRecordPage` (`vm-batch.tsx:41-42`, `vm-record.tsx:42-43`), i.e. inside the gate. `zustand-persist.ts:48` `useHydrated` never triggers rehydration itself. Live: `/pages/vouchers/1012?userRole=biodata-super-admin` fresh context, `main` text length 0 for 4.5 s and after reload; via the list row it renders 1,225 characters. Screenshots `behaviour-voucher-batch.png` (blank) and `behaviour-voucher-batch3.png`.
- **Where it shows:** `biodata-super-admin`, every batch and record URL, option-2 routes too (same `VmBatchRoute`).
- **Winner:** the other stores. Fix at the source: `useHydrated` should call `useRehydrate` itself (one place, every store). Clause §1.9 ("fix goes into the component, once"), §ref-shell flow rule ("a flow can pass every check alone and still fail ... a dead end").
- **Clause / theme:** §1.3, §1.9; T11 (loading state).
- **Fix size:** 1 file (`zustand-persist.ts`), flows to 11 stores.
- **Mechanical?** Yes: AUTO check that every `use*Hydrated`/`useHydrated(` consumer file also contains `useRehydrate(`, or that `useHydrated` calls it. Recurrence candidate under §0.8 (the same hydration-gate family was fixed for DSA/DLA before, per `zustand-persist.ts` comments).

### BEH-2 [HIGH] BioData Super Admin gets the non-admin view of Reports (inline `role === "biodata-admin"`)
- **What:** `ref-roles.md` says "anywhere a screen asks 'is this an admin', it calls `isBiodataAdmin(role)`, so the super admin never loses something an admin has". Seven report sites use `role === "biodata-admin"`, so the Super Admin sees only their own subset and the "my uploads" copy.
- **Evidence:** `reports/reports-landing.tsx:34`, `reports/use-ingestion-runs.ts:24`, `reports/ingestion-report-data.ts:373`, `reports/sensitive-restriction-report-data.ts:336`, `reports/specimendb-refresh-report-data.ts:187`, `reports/voucher-id-update-report-data.ts:136`, `reports/report-projects.ts:12` (all under `app/pages/_shared/`). Correct helper: `lib/user-role.ts:54`. Live rows, admin vs super admin: Data Ingestion 60 vs 25; Sensitive and Restriction 11 vs 7; SpecimenDB 27 vs 17; Voucher ID 27 vs 17; Project Detail 8 vs 2. Landing subheading: admin "Reports across BioData SA.", super admin "Reports on your uploads and the projects you contribute to."
- **Where it shows:** `/pages/reports` and 5 report screens, `biodata-super-admin`.
- **Winner:** `isBiodataAdmin(role)` (contract text in `ref-roles.md`; §3.4 "never at a call site").
- **Clause / theme:** §3.4, ref-roles; T3 (same role different treatment).
- **Fix size:** 7 sites, no shared component. Also grep found `role !== "biodata-admin"` at `config/role-access.config.ts:115` (read, not verified live).
- **Mechanical?** Yes: AUTO `role === "biodata-admin"` / `"biodata-super-admin"` outside `lib/user-role.ts`, `lib/registered-user-nav.ts`, `config/role-access.config.ts`.

### BEH-3 [HIGH, decision] A Registered User's DLA "All requests" shows other people's requests, drafts included
- **What:** Nominations got an explicit exception on 6 Oct ("Registered User sees My nominations alone", `ref-shell.md:100-103`, `nomination-scope.ts`). DLA has no such guard: column 2 offers "All requests" to every role and the list applies no role filter.
- **Evidence:** `dla/dla-list.tsx:259` `scoped = scope === "mine" ? ... : all`; `agreement-scope.tsx:34-37` reads `?scope=all` from the URL for any role; `dla/dla-shell.tsx:64` shows both tabs to all. Live as `registered-user`: default "My requests" 2 rows; `?scope=all` 9 rows including `DLA-2026-00520 Phoenix Baker ... DRAFT` and `Lana Steiner ... ON HOLD`. The Requestor filter also lists everyone's names.
- **Where it shows:** `/pages/dla`, `registered-user` (and likely `privileged-*`, not tested).
- **Winner:** contracts silent for DLA - needs designer decision (§0.4). By dominant sibling (nominations exception, §4.7 "show only what is approved") the Registered User should get "My requests" alone, and a draft is private to its author in every role.
- **Clause / theme:** §4.7 spirit, ref-shell "List -> deep dive" item 2; T8.
- **Fix size:** `DlaAllList` + `DlaShell` + a `dlaAllView` matrix key (3 files), same as nominations.
- **Mechanical?** No (a policy). A test that `?scope=all` for a role without the All view returns only its own rows could be an AUTO-style script, not a contract grep.

### BEH-4 [HIGH] Empty collections show four different things (§4.2e), 15+ screens
- **What:** The contract is `ListEmptyState` (gray FeaturedIcon, heading, balanced line, action named by outcome). Live, with search "zzzzqq", the treatments are:
  1. `ListEmptyState` + "Show all X": projects, DLA, DSA, nominations (no-match only), templates, every report table (shared `report-table.tsx`; 4 tested live), reports favourites, the project Option 2 `ArtefactTable`.
  2. Bare grey line + `link-color` "Clear search and filters": CV, vouchers, notifications.
  3. Bare grey line, no action: users, roles, permissions ("Nothing matches your search and filters."), taxonomy ("No species match "zzzzqq"." with a leftover "Clear all" chip link), project datasets, dsa-detail systems, cv-detail entries, role/permission embedded tables.
  4. A bordered two-line box with no icon (`<p font-medium>` + `<p>`): the live project page's Species and Artefacts tabs (cards and table) and Records explorer. The same Artefacts list therefore has two empty states depending on which project layout shows it.
  Plus a fifth lookalike: nominations' "nothing yet" is a hand-copied `ListEmptyState` (`nominations/nomination-list.tsx:154-170`) with a primary Plus action, where the contract says "no action unless the designer names one".
  The label "Clear search and filters" also breaks the rule "MUST NOT name the action Clear search".
- **Evidence:** `ctrl-vocab/cv-list.tsx:143-160`, `notifications/nt-list.tsx:122`, `notifications/nt-list-2.tsx:148`, `vouchers/vm-list.tsx:117`, `user-management/um-lists.tsx:116`, `taxonomy/tx-records.tsx:187`, `project-detail/datasets-view.tsx:273`, `project-detail/species-view.tsx:314-319`, `project-detail/artefacts-view.tsx:137-141`, `project-detail/records-explorer.tsx:433-441`, `dsa/dsa-detail.tsx:321`, `ctrl-vocab/cv-detail.tsx:101`, `user-management/um-detail.tsx:495,619`. Correct ones: `list-empty-state.tsx`, `project-list-content.tsx:163-176`, `dla/dla-list.tsx:316`, `reports/report-table.tsx`. Screenshots `behaviour-empty-_pages_user-management.png`, `...taxonomy.png`. Doc page `/patterns/empty-states` is a stub, so the pattern has no home.
- **Winner:** `ListEmptyState` (§4.2e, "applies at every scale"). Nothing-yet vs nothing-matches stay two cases; the action label is "Show all X".
- **Clause / theme:** §4.2e, §0.8 (the contract says "one is due if it recurs"; it has recurred); T11.
- **Fix size:** ~16 sites; extend `ListEmptyState` with a `compact`/embedded size (§1.6) for tabs.
- **Mechanical?** Yes, promote now: AUTO flag a `<p className="... text-tertiary">` whose text matches `/No .* match|Nothing matches/` inside a file that renders a `Table`, or any literal "Clear search and filters".

### BEH-5 [HIGH] "Discard unsaved changes" is two different modals (13 sites) with five titles and five confirm labels
- **What:** Same event, same clause (§4.1.6), two components: `ConfirmationModal` (brand "?" icon, brand primary button carrying a Trash icon) vs `DestructiveModal` (red icon, red button). No rule decides which.
  - ConfirmationModal (6): `project-detail/edit-drawer.tsx:80`, `project-edit.tsx:549`, `record-full-view.tsx:698`, `dataset-upload/upload-form.tsx:243`, `taxonomy/tx-records.tsx:620`, `taxonomy/tx-flows.tsx:273` ("Leave this taxon change?" / "Leave").
  - DestructiveModal (7): `dla/dla-form.tsx:435`, `nominations/nomination-form.tsx:349`, `dsa/dsa-form.tsx:493`, `ctrl-vocab/cv-form.tsx:482`, `user-management/um-forms.tsx:39`, `notifications/nt-form.tsx:738`, `project-registration/option-2/page.tsx:190`.
  Titles: "Discard your changes?" (7), "Discard your request?", "Discard your nomination?", "Discard this upload?", "Discard this project?", "Discard this {what}?", "Leave this taxon change?". Confirm label: "Discard changes" (9), "Discard", "Discard upload", "Discard project", "Leave". Cancel is "Keep editing" everywhere (good). Where a draft exists the modal is three-way (Keep editing, Save draft, Discard) and widens to 544px; users form has no draft yet uses the destructive style, taxonomy has no draft and uses the confirmation style, so the "draft implies destructive" rule is not what separates them. Descriptions differ ("Leaving now will lose them." / "You have changes that haven't been saved." / "The files you added ... will be lost.").
- **Evidence:** lines above; component defaults `components/application/modals/modal.tsx:150-170` (HelpCircle, brand) and `:210-245` (AlertTriangle, error).
- **Winner:** `DestructiveModal`: losing work is irreversible and the 7 form-pattern forms (§4.1) already use it; title "Discard your changes?", confirm "Discard changes", cancel "Keep editing". Contracts silent on which modal, so ask (§0.4) but the sibling count and meaning favour destructive.
- **Clause / theme:** §0.9, §4.1.6, §3.12 modals paragraph; T2/T3.
- **Fix size:** 6 sites switch component; best at source: a `DiscardChangesModal` wrapper (new component = §1.4 override, ask).
- **Mechanical?** Yes: AUTO flag `<ConfirmationModal` whose title matches /^Discard|Leave/.

### BEH-6 [HIGH] Four record families and one lookalike screen have no BreadcrumbSwitcher (the contract says an AUTO check is due)
- **What:** §4.6.5: every record page's section crumb is a `BreadcrumbSwitcher`. Live (`header nav button[aria-label^=Switch]`): present on DLA, DSA, nominations, users, roles, reports, projects. Absent on Controlled Vocabulary record, Notification record, Taxonomy species record, Voucher batch and record (plain text crumb), and the flagged-concepts screen. The contract's own Enforcement line: "First occurrence of the switcher gap ... one is due if a record page ships with a plain section crumb again." It has shipped four more times.
- **Evidence:** only `dla-switcher.tsx`, `dsa-switcher.tsx`, `nomination-switcher.tsx`, `um-switcher.tsx`, `report-switcher.tsx`, `project-switcher.tsx` exist (`ls _shared/*/*switcher*`); crumbs read `Home / Voucher Management / Herbarium / Batch 1012`, `Home / Taxonomy Management / Common Brushtail Possum`.
- **Where it shows:** `/pages/ctrl-vocab/<id>`, `/pages/notifications/<id>`, `/pages/taxonomy/<id>`, `/pages/vouchers/<id>[?record]`, super admin and admin.
- **Winner:** §4.6.5 and the brief ("BreadcrumbSwitcher on every deep-dive").
- **Clause / theme:** §4.6.5, §0.8; T6.
- **Fix size:** 4 thin wrappers over `BreadcrumbSwitcher` + shell breadcrumb props.
- **Mechanical?** Yes: AUTO: a file under `app/pages/_shared/**` that renders `RecordHero` and passes no `*Switcher`/`BreadcrumbSwitcher` to its shell's breadcrumb.

### BEH-7 [MED] FormPage's footer breaks the §3.12 icon table, and the check cannot see it
- **What:** (a) The final primary action ("Save changes", "Submit", "Submit nomination", "Add role", "Add permission", "Create project", "Add vocabulary") renders with no icon: `iconTrailing={primaryIsContinue ? ArrowNarrowRight : undefined}`. Live: footer button svg count 0 on DSA/user/CV/notification edit last step, nominations last step, Add role, Add permission. The table says Save `Save01`, create `Plus`. (b) Back is `ArrowNarrowLeft` and Continue `ArrowNarrowRight`; the table says Back `ArrowLeft`, Continue `ArrowRight` (`ArrowNarrowRight` is "go to another screen"). (c) The "Details missing" alert always says "Complete these to continue:", including on Add role/Add permission where the action is save. (d) The eyebrow separator is " - " on 11 forms and " · " on project-edit, record-form, tx-flows.
- **Evidence:** `_shared/form-page.tsx:94,104,117`; `scripts/check-contracts.mjs:366-382` + `actionButtonsWithoutIcon` (line 312-345) accept any `iconLeading=`/`iconTrailing=` text in the tag, so a conditional `... : undefined` passes.
- **Winner:** the §3.12 table. The final action takes its own icon (`primaryIcon` prop, required, like `RecordAction.icon`).
- **Clause / theme:** §3.12, §4.1.5; T4.
- **Fix size:** `form-page.tsx` + 12 callers.
- **Mechanical?** Yes: extend AUTO §3.12 to fail `icon(Leading|Trailing)=\{[^}]*\? [^}]*: undefined\}` on an action button.

### BEH-8 [MED] Every alert action shows a check mark (default `confirmIcon = Check`) on 10 sites
- **What:** §3.12: "A button-style alert takes `confirmIcon`". Only `PageBanner` passes one. Ten other `AlertFullWidth` actions inherit `Check`: "New agreement", "Submit a new request", "Renew licence", "Review", "View all projects", "Sign up to request access", "Open NSS-...", "Open {species}", "Activate permission". Live: the DSA edit "Agreement period locked" alert shows a ✓ on "New agreement" (`behaviour-dsa-locked-alert.png`).
- **Evidence:** `components/application/alerts/alerts.tsx:193` default; call sites: `dla/dla-detail.tsx:104,389`, `dla/dla-form.tsx:312`, `dsa/dsa-form.tsx:435`, `nominations/nomination-form.tsx:97`, `taxonomy/tx-records.tsx:541`, `user-management/um-detail.tsx:603`, `project-detail/project-detail-template.tsx:472`, `project-list/[id]/project-details/project-details-route.tsx:61,73`.
- **Winner:** §3.12 table (Plus for new, UserPlus01 for sign up, Power01 for activate, ArrowNarrowRight for "go to"). Make `confirmIcon` required when `onConfirm` is set (the `PageBanner` approach).
- **Clause / theme:** §3.12, T4.
- **Fix size:** 1 component + 10 sites.
- **Mechanical?** Yes: AUTO `<AlertFullWidth` with `onConfirm=` and no `confirmIcon`.

### BEH-9 [MED] Not-found and restricted states are copy-pasted markup with drifting copy (20 copies)
- **What:** 10 not-found screens and 10 restricted screens are hand-built `<div ... p-12 text-center><h1 text-lg ...>`. Not-found: 7 use "Back to X" with `ArrowNarrowLeft` (link-color), taxonomy uses "All species" with no icon, vouchers (`Batch not found`) has no action at all, project "isn't available" uses a FileSearch icon and a secondary button, datasets is left-aligned with a back link, project record shows an `AlertFullWidth` instead. Copy: "There is no X {id}. It may have been deleted, or created in another browser." (4), "... a draft that was deleted" (nominations), "Records you add are kept in this browser only" (users/roles), `with the id “NOPE”` (taxonomy). CV and taxonomy not-found keep column 2 while DLA/DSA/users do not. Restricted: identical markup in 10 shells; copy drifts "managed by the BioData Super Admin" (CV, singular with "the") vs "BioData Super Admins" (vouchers) vs "BioData Admins"; and a signed-out visitor is told "Create one" but the only button is "Go to Home" (no Sign up, while `SignUpPromptModal` and `PageBanner` both offer Log in / Sign up).
- **Evidence:** `dla/dla-detail.tsx:544-559`, `dsa/dsa-detail.tsx:455-470`, `nominations/nomination-detail.tsx:288-301`, `ctrl-vocab/cv-detail.tsx:405-418`, `taxonomy/tx-records.tsx:455-468`, `vouchers/vm-routes.tsx:34-46`, `vouchers/vm-record.tsx:205-219`, `user-management/um-detail.tsx:672-685`, `notifications/nt-detail.tsx:318-332`, `project-detail/datasets-view.tsx:335-346`, `project-list/[id]/project-details/project-details-view.tsx:180-202`; restricted: `dla-shell.tsx:122-126`, `dsa-shell.tsx:122-126`, `nomination-shell.tsx:125-129`, `cv-shell.tsx:178-182`, `nt-shell.tsx:165-169`, `tx-shell.tsx:120-124`, `um-shell.tsx:149-153`, `vm-shell.tsx:125-129`, `reports-shell.tsx:69-73`, `template-finder-shell.tsx:64-68`. Live copy captured for all roles in my probe (public-user on 10 sections).
- **Winner:** the dominant not-found shape (7 of 10) as one shared `NotFoundState` and one `RestrictedState` (§1.6, §0.9). Guest variant gets Log in / Sign up.
- **Clause / theme:** §0.9, §3.7; T11, T3.
- **Fix size:** 20 sites to 2 shared components (new components = §1.4 override, ask).
- **Mechanical?** Yes: AUTO `<h1 ...>... not found</h1>` and the `needs a free BioData SA account` literal outside the shared component.

### BEH-10 [MED] Focus rings: Buttons use a pale ring (about 2.4:1); pagination numbers and breadcrumb links use the browser default
- **What:** Computed `:focus-visible` outline on Tab: every `Button` (Add, OW, New request, Review requests, Continue) = 2px solid `rgb(156,169,179)` (brand-300) offset 2; all other controls (tabs, rows, DotsButton, Export CSV, segmented toggle, form section steps) = `rgb(42,102,124)` (brand-500) with offsets 0, 2, 4 or -2. `globals.css:385-392` says the Button ring was moved to brand-500 per Figma, but `button.tsx:13` still uses `outline-brand` (brand-300). Brand-300 on white is about 2.4:1, under the 3:1 non-text minimum. Pagination page-number buttons (`1`) and the header breadcrumb "Home" link show the UA `1px auto` ring: `table.tsx:509` sets only `outline-focus-ring` with no `focus-visible:outline-2`; `scaffold/breadcrumb.tsx:55` has no focus class at all. Offsets are 0 (segmented, legal icons, Export CSV), 2 (buttons), 4 (form steps), -2 (tabs, rows).
- **Evidence:** live sweep on `/pages/dla`, `/pages/reports`, `/pages/dla/<id>`, `/pages/user-management/users/new`; `globals.css:420,429`.
- **Winner:** §1.9.4 "every state is real" + the globals.css comment: one 2px brand-500 ring everywhere (`outline-focus-ring`), fixed at the tokens/components, not per site.
- **Clause / theme:** §1.9.4, §2.1; T3.
- **Fix size:** `button.tsx`, `table.tsx` (pagination), `breadcrumb.tsx`, plus offset normalisation.
- **Mechanical?** Partly: AUTO `outline-brand\b` on an interactive element in `components/**`; `outline-focus-ring` without a `focus-visible:outline-2` in the same class string.

### BEH-11 [MED] Toast wording and shape drift across the same events
- **What:** Saving a live record: "Changes saved" (CV, notifications), "User updated" (users), "Request updated" / "Agreement updated" (DLA, DSA), "{title} saved" (project cards), "Species saved" (taxonomy). Creating: "Vocabulary added", "Notification added", "Role added", "Permission added", "User added as Invited", "Request submitted", "Agreement submitted", "Nomination submitted", "{kind} added". Cancel: DLA "Cancelled" vs DSA "Agreement cancelled" (DLA approve is "Request approved" so the noun is dropped only on cancel). Status moves: users/roles/permissions use a one-line "{name} is now active" with no description while DLA/DSA/nominations use "Review started" + id description. Preview caveat: project toasts carry "Changes are kept for this session only. This preview has no backend." (6 sites), `record-full-view.tsx:267` says "kept in this browser", every other screen says nothing. `toast.error("Name the synonym first")` (`tx-records.tsx:486`) reports a validation miss that the form pattern says belongs in the inline error. Two toast kinds for "not wired": `toast.brand("Reports aren't wired up yet")` x2 and a "Download isn't wired up yet" toast.
- **Evidence:** `toast.*` grep (80 call sites); `cv-routes.tsx:121`, `nt-routes.tsx:138`, `um forms: edit-user-page.tsx:38`, `dla/[id]/edit/edit-dla-page.tsx:57`, `dsa/[id]/dsa-detail-page.tsx:58-62`, `dla/[id]/dla-detail-page.tsx:62`.
- **Winner:** contracts silent on toast copy; `/patterns/feedback` is a stub. Proposed by dominant sibling: title = "{Noun} {past participle}" ("Request approved", "Changes saved", "Draft saved"), description = the record id/name; one preview caveat or none.
- **Clause / theme:** no clause - candidate new clause "toast copy"; T3/T12.
- **Fix size:** about 30 titles; docs page to write.
- **Mechanical?** No (copy), but a lint list of allowed save/create titles is possible.

### BEH-12 [MED] Disabled "not built yet" controls: three wordings, two constructions, one unreachable by keyboard
- **What:** The decided wording is "Not available in this preview yet." (rail legal icons). Others: "Coming soon - the approvals queue isn't built yet" (2 Home sites), "Coming soon - the resource viewer for observations isn't wired up yet" and "... shapefile downloads aren't wired up yet" (observation-detail), "This project has no record pages in this preview yet", Template Finder items "Coming soon" addon, toast "Reports aren't wired up yet / Reports can't be generated in this preview yet", "Download isn't wired up yet". The rail version is `<Focusable><span role="button" aria-disabled>` (reachable by Tab); the Home and observation-detail versions wrap a `<span>` that is not focusable, so react-aria warns and the tooltip is unreachable by keyboard (§1.9.3).
- **Evidence:** `home-dashboard.tsx:439,518`, `observation-detail/page.tsx:624,748`, `primary-rail.tsx:61`, `review-view.tsx:608`, `template-downloads.tsx:20-21`, `agreement-actions.tsx:41`, `project-card-actions.tsx:49`, `dsa-detail.tsx:177`; console warnings on `/pages/dashboard` ("<Focusable> child must be focusable", "must have an interactive ARIA role").
- **Winner:** the designer's "Not available in this preview yet." (accepted, BRIEF) plus the rail's focusable construction.
- **Clause / theme:** §1.9.3; T11/T12. Designer decided the wording; the drift is the finding.
- **Fix size:** 8 sites; a shared `UnwiredTooltip` would end it.
- **Mechanical?** Yes: AUTO `<Focusable>` whose first child is not an element with `tabIndex`/`role`, or any tooltip title containing "Coming soon".

### BEH-13 [MED] Popover distance from the trigger is 4, 6 or 12px depending on the component (T7)
- **What:** `Dropdown` menus sit 12px from the trigger (decided), the BreadcrumbSwitcher and Columns chooser pass `offset={12}` themselves, but the base `Popover` and every Select, MultiSelect and ComboBox list default to 4px (calendar 6px). Measured gap: Add menu 12, Filter 12, report row menu 12, hero "..." 12, switcher 12, Columns 12; Profile menu 4, Project scope Select 4, date picker 6. Project-page popovers and observation-detail popovers (6 sites) are also default 4.
- **Evidence:** `components/base/select/popover.tsx:24` `offset={4}`, `multi-select.tsx:269` `offset={4}`, `dropdown.tsx:171` `offset={12}`, `profile-menu.tsx:27`, `project-detail/option-2/project-detail-view.tsx:440,534,934,1244`, `observation-detail/page.tsx:314,395`, `breadcrumb-switcher.tsx:79`, `reports/column-chooser.tsx:124`. Live: `ov1.mjs`/`ov2.mjs` measurements.
- **Winner:** the dropdown comment (`dropdown.tsx:167-171`, "12px so the pressed ring does not read as touching") applies to every trigger; set the default in `popover.tsx` (and leave field-attached lists at 4 only if the designer says so).
- **Clause / theme:** no clause - candidate; T7.
- **Fix size:** `popover.tsx` default + 3 explicit overrides become redundant.
- **Mechanical?** Yes: AUTO `<Popover` in `app/pages/**` without `offset`.

### BEH-14 [MED] Create action: Projects has none; the verb is New / Add / Nominate / Update; the Add menu omits items the lists offer
- **What:** Section-header primary: DLA "New request", DSA "New agreement", nominations "Nominate a new species", users/roles/permissions "Add user/role/permission", CV "New vocabulary", notifications "New notification", taxonomy "Update taxonomy" (Plus + chevron, a menu), Projects nothing (create is only in the header Add menu and Home). Forms close with a third verb set: "Submit", "Submit nomination", "Add vocabulary", "Add notification", "Add user", "Create project", "Commit". The header Add menu names the same things differently ("Data licence request (DLA)", "Sensitive species nomination") and offers User but not Role, Permission or a taxonomy change, though each list has its own Add button.
- **Evidence:** `project-list-content.tsx:130-148` (no Actions), `dla-list.tsx:129`, `dsa-list.tsx:137`, `nomination-list.tsx:147`, `um-lists.tsx:173,283,390`, `cv-list.tsx:120`, `nt-list.tsx:97`, `tx-records.tsx:100`, `lib/create-menu.ts:25-34`. Forms: grep of `primaryLabel` in section 3 above.
- **Winner:** ref-shell says the list's header carries "the primary create action" and "a create action keeps the same emphasis"; dominant verb "New {noun}" (4 of 8) for the list button and "Add {noun}"/"Create" for the final form action; Projects gets "New project" (`/pages/project-registration`). Verb choice is contracts-silent: designer decision.
- **Clause / theme:** ref-shell build principle ("a control keeps its treatment across states"); T9.
- **Fix size:** 1 list + about 8 labels + `create-menu.ts`.
- **Mechanical?** No (copy). The Projects gap could be an AUTO "every list shell with `SectionHeader` and a create route has a Plus button" but it is brittle.

### BEH-15 [MED] Collection chrome deviations (one table of small ones, all REVIEW)
- **What:** (a) Reports landing has no `ToolbarSearch` or `FilterMenu` (cards or table), its CountBadge carries `className="min-w-5 w-auto px-1.5"` (24.9px pill vs the 20px circle everywhere else, same number of digits as DSA's 14), its table is `size="xs"`, its Cards/Table toggle is in `SectionHeader.Actions` while Species/Artefacts/Taxonomy put theirs at the toolbar's right end. (b) Vouchers' CountBadge ignores search (12 before and after); the other 11 lists count the matches (project list 4 to 0). (c) Embedded tables (role users, permission roles, CV entries, DSA systems) use a hand-rolled `Input` at `max-w-xs` (320px) beneath an uppercase label and a gray CountBadge, not `ToolbarSearch` (384px) and `SectionHeader`; §4.2 says "applies at every scale". AUTO §4.2c only fires where a file has a `FilterMenu`. (d) Taxonomy's page size is 10 (`tx-records.tsx:114`), all other lists 50. (e) Taxonomy ships with "Status: Current" pre-applied (Filter 1) and the vouchers batch with a pre-applied filter; no other list does. (f) Project Datasets: search with no Filter menu, `min-h-[24rem]`, a local `StatusBadge`. (g) Heading text: Projects changes with scope ("All projects"/"My projects"), DLA/DSA/nominations keep the section name and change only the subheading.
- **Evidence:** `reports/reports-landing.tsx` (whole), `vouchers/vm-list.tsx:87`, `user-management/um-detail.tsx:121-131`, `ctrl-vocab/cv-detail.tsx:87-100`, `dsa/dsa-detail.tsx:307-320`, `project-detail/datasets-view.tsx:261-300`, `project-list-content.tsx:133` vs `dla-list.tsx:290`, live badge probe (`cb.mjs`, `probe5.mjs`).
- **Winner:** §4.2 / §4.2c (`ToolbarSearch`, brand CountBadge, `SectionHeader`); CountBadge must grow with digits at the component (§1.6) so no override is needed.
- **Clause / theme:** §4.2, §4.2c; T1, T3.
- **Fix size:** 6 files + `CountBadge`.
- **Mechanical?** Partly: AUTO `<CountBadge ... className=` with `min-w`/`w-auto`; AUTO an `Input` with `icon={SearchMd}` in a `max-w-xs` wrapper under `app/pages`.

### BEH-16 [MED] One attribute, different names and different controls across filters and columns (F)
- **What:** The organisation on an agreement is "Requestor organisation" (DLA list filter), "Data partner" (DSA list filter and column), "Partnership organisation" (DSA report) and "Organisation" (DLA report, projects). The person who asked is "Requestor" (DLA list, both reports), "Requested by" (DSA list), "requester" in the DSA search placeholder and "Requestor" in the DLA one. Status is "Status" in lists but "DLA status"/"DSA status" as the report column and "Validation status", "Submission status", "Dataset processing status" in the ingestion reports. "Project" is a Select after the search in 2 reports (species detail, events) and a FilterMenu attribute in 4 others (data ingestion, post ingestion, sensitive restriction, voucher update) and "Project owner organisation" in a fifth. The vouchers filter says "Ran in" for the column "Ran on", and the specimen reports "Batch date". Status vocabulary and colours are otherwise consistent (Active success, Draft/Closed/Cancelled/Archived gray, Under review/On hold/Disabled/Inactive warning, Rejected error); Project's `Completed` is the only blue.
- **Evidence:** live filter menus and column headers (`filt.mjs` output for 23 routes); `dla-list.tsx:268`, `dsa-list.tsx` filter sections; `species-detail-report.tsx`, `records-report.tsx` (Select) vs `ingestion-report-data.ts` (attribute).
- **Winner:** `ref-shell`/§4.6.4: a project scope is a Select right after the search; attribute names should equal the column header. Names: contracts silent, needs designer decision (suggest "Organisation", "Requested by", "Status").
- **Clause / theme:** §4.6.4, §4.2d (attribute named for the column); T9.
- **Fix size:** about 10 labels + 4 reports move Project to the Select.
- **Mechanical?** Partly: an AUTO that each `FilterSection.label` equals a column `label` in the same file.

### BEH-17 [MED] The Cards/Table (and Tree, List) view switch is hand-copied 8 times and has no persistence
- **What:** `ToggleButtonGroup` + `segmentTrayClass`/`segmentClass` is repeated verbatim in reports landing, project Species, Artefacts, Records (Tree/Table), review view, option-2 project view, and `ViewSwitch` in taxonomy (the only extracted copy). Shared classes keep it looking the same, but there is no DEW component (T2 lookalike risk), the position differs (Reports header vs toolbar right end), the default is "cards" in 3 places and "list"/"tree" elsewhere, and none remembers the choice across reload or tab (all `useState`).
- **Evidence:** `reports/reports-landing.tsx:95-114`, `project-detail/species-view.tsx:291-310`, `project-detail/artefacts-view.tsx:114-133`, `project-detail/records-explorer.tsx:407-426`, `project-detail/review-view.tsx:451-474`, `project-detail/option-2/project-detail-view.tsx:1394-1425`, `taxonomy/tx-records.tsx:68-90`, `project-detail/segmented.ts`.
- **Winner:** the toolbar right end (Species, Artefacts, Taxonomy, Records = 4 vs 1) via one shared `ViewSwitch` (extend `segmented.ts` into a component).
- **Clause / theme:** §0.9, §1.6; T7, T2.
- **Fix size:** 7 sites to one component.
- **Mechanical?** Yes: AUTO `<ToggleButtonGroup` with `segmentTrayClass` outside the shared component.

### BEH-18 [MED] Flagged concepts uses a layout no other page uses: column 2 holds filters, a progress bar and a stat line (§3.10, §0.9.3)
- **What:** `/pages/flagged-concepts`: column 2 has a back link, a progress bar, "16 open across 15 records in 6 projects . 4 resolved", a project Select, an Open/Resolved segmented control and the full queue; main is a `FormPage` for the item in focus with three "+" buttons ("Value confirmed", "Value corrected", "Not an issue") where Plus means "add", no close X, no breadcrumb switcher, and it hand-builds `AppHeader` + `PrimaryRail` + `PrototypeTools` instead of a shell component. AUTO §3.10 misses it because the aside is rendered by `ReviewScreen`.
- **Evidence:** `app/pages/flagged-concepts/page.tsx:1-40`, `project-detail/review-view.tsx:451-474,540-560,608`; screenshot `behaviour-flagged.png`; decisions `2026-09-29-61-*`, `2026-09-30-08-*` predate §3.10.
- **Winner:** contracts: §3.10 (column 2 = navigation and actions) and §4.2 (collection = header, search, filter, table). The queue as a list in column 2 may be allowed, but the stat line, Select, segmented control and progress bar are information/filters.
- **Clause / theme:** §3.10, §0.9.3, §3.12 (icon per action); T5, T6. Needs designer decision (§0.4) because it was built on instruction.
- **Fix size:** 1 screen + `ReviewScreen`.
- **Mechanical?** Partly: extend AUTO §3.10 to follow `ReviewScreen`-style imports (the same blind spot as the 1 Oct Projects aside).

### BEH-19 [MED] Notices: three constructs on list screens, a banner-shaped alert inside form fields, hand-styled duplicates of "Details missing"
- **What:** On list screens the "what needs doing" notice is a `TaskItem` card (DLA, DSA, nominations; shifts the toolbar down 98px for admins, y=288 vs 190), an `ExplainerCard` (nominations, non-reviewers, stacked with the TaskItem), or a `PageBanner` (Explore only); `/patterns/banners` says one screen has one banner and a notice about a record is the contained alert. Three field-level notices ("Agreement period locked" in DLA and DSA forms, "Access level locked" in DLA detail) use the non-contained edge-to-edge variant inside a `FormRow`/`Field`. "Details missing" is the shared `FormPage` alert, but `project-edit.tsx:544` and `record-full-view.tsx:511` rebuild it with `contained tintedBackground ... className="max-w-none rounded-lg border border-error-300 bg-error-50"` (`tintedBackground` does nothing when `contained`) and say "Complete these to save:" where `form-page.tsx:94` says "to continue". Record status notices pass `confirmLabel="Noted"` / `""` / `"OK"` with no `onConfirm`, an inert prop that never renders (invisible, but 3 spellings of nothing).
- **Evidence:** `dla/dla-list.tsx:54-84`, `dsa/dsa-list.tsx:66-90`, `nominations/nomination-list.tsx:65-96`, `dla/dla-form.tsx:306`, `dsa/dsa-form.tsx:429`, `dla/dla-detail.tsx:98`, `form-page.tsx:89-96`.
- **Winner:** `/patterns/banners` (PageBanner for the screen, contained alert for a record or field, ExplainerCard for how-it-works). TaskItem on a list is a fourth thing the pattern page does not mention: designer decision.
- **Clause / theme:** §0.9, banners pattern; T2, T10.
- **Fix size:** about 10 sites.
- **Mechanical?** Partly: AUTO `<AlertFullWidth` without `contained` outside `page-banner.tsx`.

### BEH-20 [MED] Sorting follows three conventions
- **What:** (a) Identity column (ID) unsortable, everything else sortable: projects (Project ID), DLA (Request), DSA (Agreement), nominations (Nomination), CV (ID), vouchers (Source). (b) Every column sortable including the name: users, roles, permissions, vouchers' Batch. (c) No sorting at all: taxonomy (6 columns), project datasets, embedded tables (DSA systems, CV entries), species table's "Sites". Default sort: Updated descending (4 lists), name ascending (users, CV, notifications), kind/category ascending (roles, permissions), template ascending, Ran on descending. The sort indicator is the same `Table.Head allowsSorting` everywhere.
- **Evidence:** `project-list-content.tsx:192-197`, `dla-list.tsx:343-347`, `um-lists.tsx:189-194,299-305,406-411`, `tx-records.tsx:196-201`, `datasets-view.tsx` (0 `allowsSorting`).
- **Winner:** contracts silent on which headers sort - needs designer decision. Dominant: sortable except the ID column (4 of the 5 main lists).
- **Clause / theme:** no clause - candidate new clause; T3.
- **Fix size:** about 6 tables.
- **Mechanical?** No.

### BEH-21 [LOW] Empty values: "-", "None", blank and "Not provided" all appear (§2.3)
- **What:** Observation (`/pages/observation-detail`, in the screen index) shows `-` in 10 table cells and 19 `DetailRow value="-"`; `location-details-table.tsx:19` `DASH = "-"`. Report tables leave empty cells blank (allowed: "omitted"), but data ingestion shows "None" in 41 cells and DLA list shows "No locations". Record pages write "Not provided".
- **Evidence:** `observation-detail/page.tsx:667-765`, `_shared/location-details-table.tsx:19,58-60`; live cell census (`empt.mjs`).
- **Winner:** §2.3 (omit or "Not provided", never "-").
- **Clause / theme:** §2.3; T11. **Fix size:** 2 files. **Mechanical?** Yes: AUTO `value="-"` and `= "-"` constants under `app/pages` (existing §2.3 only covers em-dashes and arrows).

### BEH-22 [LOW] Date field order follows the browser locale (no `I18nProvider`)
- **What:** `InputDatePicker` shows `MM / DD / YYYY` in an en-US browser and `DD / MM / YYYY` in en-AU (verified both); beside text such as "2 Nov 2025" the US order reads as a wrong date ("11 / 2 / 2025"). No `I18nProvider` pins en-AU.
- **Evidence:** live `date1.mjs`, `date2.mjs`; no `I18nProvider` in `app/` or `components/`.
- **Winner:** Australian English product (T12): pin `locale="en-AU"` at the root. **Clause / theme:** §2.11, T12. **Fix size:** `app/layout.tsx`. **Mechanical?** No (a one-line root provider).

### BEH-23 [LOW] Back-link wording and eyebrow separators
- **What:** 15 record links say "Back to {plural collection}"; outliers: taxonomy "All species", vouchers "{Source} batches" and "Batch 1012", project record "Back to {project name}", datasets "Back to project". Eyebrows mix "-" and "." as separators (BEH-7d).
- **Evidence:** `taxonomy/tx-records.tsx:499,463`, `vouchers/vm-batch.tsx:168`, `vm-record.tsx:94,210`, `project-details-view.tsx:127`. **Winner:** "Back to {plural collection}" (dominant). **Clause / theme:** §4.6.1; T9. **Fix size:** 5 labels. **Mechanical?** Yes: AUTO `<RecordBackLink>` children must start with "Back to".

### BEH-24 [LOW] "n of m sections complete" counts the Review step on some forms and not on others
- **What:** DLA "0 of 3" (3 listed, Review counted), nominations "0 of 4" (Review counted), but registration "0 of 5" with 6 listed and taxonomy change "0 of 3" with 4 listed (Review not counted). Edit forms show "0 of 3 sections complete" with every field filled (nothing visited yet).
- **Evidence:** live `probe6.mjs`/`probe7.mjs` aside text. **Winner:** contracts silent. **Clause / theme:** §4.1.2; T3. **Fix size:** `form-section-list.tsx` / `deriveSectionStatus` callers. **Mechanical?** No.

### BEH-25 [LOW] Loading has no pattern: blank `fallback={null}`, three map placeholders, a stub doc page
- **What:** 50-odd `Suspense fallback={null}` leave a blank screen while `useSearchParams` resolves; hydration gates also render `null` (BEH-1 is the worst case). Map loading is "Loading map..." in a grey box (`record-detail.tsx:64`), a bare `<p>` (`observations-search.tsx:98`, `geo-extent-picker.tsx:39`) or an `animate-pulse` block (`expandable-map.tsx:33`). `/patterns/loading-states`, `/patterns/empty-states` and `/patterns/feedback` are placeholders, so §4.2e and toast copy have no reference page.
- **Evidence:** grep above. **Winner:** contracts silent - needs designer decision. **Clause / theme:** T11. **Fix size:** pattern + 4 sites. **Mechanical?** No.

### BEH-26 [LOW] Modal buttons: duplicate and mismatched icons
- **What:** Voucher "Ignore difference" confirm uses `XClose`, the same icon as its Cancel (§2.4 one icon per action; table: Cancel `XClose`). `ConfirmationModal` defaults to the brand `HelpCircle` icon and its discard use gives the confirm a `Trash01`. Voucher modals are hand-assembled with `ModalHeader layout="horizontal"` (544px) beside the stacked 400px shared modals.
- **Evidence:** `vouchers/vm-parts.tsx:278-300,296`, `modal.tsx:150-170`. **Winner:** §3.12 table (Ignore -> a distinct glyph e.g. `SlashCircle01`/`EyeOff`, to be decided). **Clause / theme:** §2.4, §3.12; T4. **Fix size:** 4 modals. **Mechanical?** Yes: AUTO the same icon identifier for `cancelIcon` and `confirmIcon` / two adjacent `XClose` buttons.

### BEH-27 [LOW] Console warnings (a11y) on product routes
- **What:** `<Focusable> child must be focusable / must have an interactive ARIA role` (Home dashboard, observation-detail; BEH-12) and `A textValue prop is required for <Tag> elements` (taxonomy filter chip; `AttributeFilterChips`). Not errors; they are real keyboard/screen-reader gaps.
- **Evidence:** `warn.mjs` run over 30 routes. **Clause / theme:** §1.9.3. **Fix size:** 3 sites. **Mechanical?** Yes: a Playwright smoke that fails on react-aria warnings.

### BEH-28 [LOW] Header org pill implies a switcher it does not have
- **What:** The "DEW / ORG" pill draws a vertical-chevron selector but is a non-interactive `span` (no menu). Accepted for size (BRIEF), but the affordance is a shortcut that is not real (§2.10). Also the product header's breadcrumb is `components/scaffold/breadcrumb.tsx` (Scaffold in product UI, §1.1, §1.5).
- **Evidence:** `components/scaffold/breadcrumb.tsx:58-62`. **Winner:** §2.10 (drop the chevron or make it work). **Clause / theme:** §2.10, §1.5. **Fix size:** 1 file. **Mechanical?** Yes: AUTO an import from `components/scaffold/**` in the product shell.

### BEH-29 [LOW] Tree arrows and tab activation follow react-aria defaults
- **What:** In the Project records tree, ArrowRight on an already expanded node does not move to its first child (stays); tabs use manual activation (ArrowRight moves focus, Enter/Space selects). Both are valid ARIA variants, but tabs differ from the Select/ListBox pattern (live-select). Noted so §1.9.5 testing has a baseline; not a defect unless the designer wants automatic activation.
- **Evidence:** `kb2.mjs`, `kb7.mjs`. **Winner:** contracts silent. **Clause / theme:** §1.9.3. **Mechanical?** No.

## 4. Per-family enumeration

### A. Collection screens (role used) - follows pattern?

| Screen | Role | Follows? | Deviation |
| --- | --- | --- | --- |
| Projects `/pages/project-list` | all | mostly | no header create action (BEH-14); heading changes with scope (BEH-15g); ID unsortable (BEH-20) |
| DLA list | admin, registered | yes | TaskItem notice shifts toolbar 98px; registered sees everyone's (BEH-3) |
| DSA list | admin | yes | same TaskItem notice |
| Nominations list | admin, registered | yes | hand-built nothing-yet state (BEH-4); TaskItem + ExplainerCard stacked (BEH-19) |
| Users, Roles, Permissions | admin | partly | bare empty line, no action (BEH-4); all columns sortable (BEH-20) |
| Reports landing | signed in | no | no search/filter, CountBadge override, header toggle, `isAdmin` (BEH-2, 15, 17) |
| 11 report screens | admin | yes | Project as Select (2) vs attribute (4) (BEH-16); `isBiodataAdmin` (BEH-2) |
| Template Finder | registered+ | yes | column-2 filter is a decided exception; no create (read-only) |
| Taxonomy | admin | partly | no sorting, page size 10, pre-applied filter, bare empty line (BEH-4, 15, 20) |
| Controlled Vocabulary | super admin | partly | bare empty + "Clear search and filters" link (BEH-4) |
| Voucher Management | super admin | partly | count ignores search; bare empty; deep link dead (BEH-1, 15) |
| Notification Management | admin | partly | same bare empty + link (option-2 list has status tabs: an option, §4.4) |
| Flagged concepts | admin | no | BEH-18 |
| Explore results | all | known open | full-width search, content-sized columns (already in contracts) |
| Project Records / Species / Artefacts | all | yes | custom boxed empty state (BEH-4); toggle copies (BEH-17) |
| Project Datasets | all | partly | no Filter, `min-h-[24rem]`, bare empty (BEH-15f) |
| Embedded tables (role users, permission roles, CV entries, DSA systems) | admin | partly | 320px search, gray badge, bare empty (BEH-15c) |

### B. Forms

| Form | Role | Follows? | Deviation |
| --- | --- | --- | --- |
| Add Project (option 2) | registered | yes | final label "Create project", no icon, "to continue" on a save (BEH-7); Review not counted (BEH-24) |
| DLA new/edit | registered/admin | yes | locked-period alert in field, full-width variant, check icon (BEH-8, 19) |
| DSA new/edit | admin | yes | same |
| Nominations new/edit | registered | yes | "Submit nomination" no icon |
| User new/edit | admin | yes | no Save draft (fine); destructive discard without a draft (BEH-5) |
| Role/Permission new | admin | single-section | no footer icon; alert says "continue" |
| CV, Notification | super admin/admin | yes | 3-way discard, no final icon |
| Taxonomy change | admin | yes | confirmation-style "Leave" (BEH-5); Review not counted |
| Dataset upload | registered | yes | confirmation-style discard |
| Project cards/record forms (in place) | admin | yes (§4.8) | hand-styled "Details missing" (BEH-19); toasts carry preview caveat |

Dates use `InputDatePicker` everywhere checked (§2.11 AUTO holds); required `*` and column-2 jump refusal hold (section 2).

### C. Overlays

| Overlay | Result |
| --- | --- |
| Menus (Add, Filter, row, hero, switcher, Columns) | 12px, Escape returns focus: holds |
| Select, date picker, profile menu, project popovers | 4/6px (BEH-13) |
| Discard prompts | 2 modal styles (BEH-5) |
| Hand-built modals (voucher x4, add-location, lightbox) | shared `ModalHeader`/`ModalFooter`; icon duplicates (BEH-26) |
| Toasts | one component; copy drifts (BEH-11) |
| Banners | PageBanner only on Explore; list notices differ (BEH-19) |
| Unwired tooltips | 3 wordings, 2 constructions (BEH-12) |
| Lightbox | Escape returns focus to row: holds |

### D. State handling

| State | Result |
| --- | --- |
| Loading | none / blank (BEH-25, BEH-1) |
| Empty | 4 treatments (BEH-4) |
| Error | field errors consistent (FormPage); toast.error for validation once (BEH-11) |
| "Not provided" | mixed with "-", "None", blank (BEH-21) |
| Restricted / denied | one template x10 but copy drift, no Sign up (BEH-9) |
| Not found | 10 copies (BEH-9) |
| Guest gate | `SignUpPromptModal` consistent (Log in secondary, Sign up primary); restricted pages do not use it |
| Focus rings | brand-300 vs brand-500, UA default on 2 controls (BEH-10) |

### E. Keyboard (steps and result)

| Test | Result |
| --- | --- |
| `/pages/dla` Tab to Filter, Enter, ArrowDown, ArrowRight, Enter, Escape x2 | pass (one level per Escape, chips kept, focus to Filter) |
| Report scope Select, CV Type Select, notification Select: pick, reopen, Escape, Enter+ArrowDown+Escape | pass, value kept |
| Nominations species ComboBox: pick, Escape closed and open | pass |
| `/pages/reports/data-validation-error` Columns: Enter, toggle, Escape | pass; label "Columns . 1 hidden" |
| DLA record tabs: ArrowRight/End | focus moves, selection manual (BEH-29) |
| Project records tree: Arrow keys, Home/End | pass; ArrowRight on expanded stays (BEH-29) |
| `/pages/ctrl-vocab/new` close X, 6 Tabs, Escape | pass |
| `/pages/dla` row Tab, ArrowDown, Enter | pass |
| Disabled "not built" tooltips on Home | fail: not focusable (BEH-12) |
| Pagination number, breadcrumb Home | focus ring is the UA default (BEH-10) |

### F. One source of truth

Status labels and colours: consistent. Names for the same attribute: BEH-16. Role names: the Prototype bar and `ref-roles.md` agree; Super Admin handling: BEH-2. Section names versus list headings (T9, other lane): "Nominate Sensitive Species" (rail, restricted h1) vs "Sensitive species nominations" (list); "User Management" vs "Users"; "Taxonomy Management" vs "Species"; "Notification Management" vs "Notifications"; "Voucher Management" vs "Scan batches"; "Controlled Vocabulary" vs "Controlled vocabularies"; "Data Licencing Agreement (DLA)" restricted h1 vs "Data Licencing Agreements" list vs "Data Licence Agreement Report".

## 5. New AUTO candidates (§0.8), in priority order

1. Hydration gate without rehydrate (BEH-1).
2. Inline `role === "biodata-admin"` (BEH-2).
3. Bare grey "No X match" paragraphs and "Clear search and filters" (BEH-4).
4. `<ConfirmationModal` titled Discard/Leave (BEH-5).
5. Record shell without a `*Switcher` (BEH-6; the contract already promised this).
6. Conditional icon prop ending in `: undefined` on an action `Button` (BEH-7), `<AlertFullWidth onConfirm` without `confirmIcon` (BEH-8).
7. Literal `not found</h1>` / `needs a free BioData SA account` outside shared components (BEH-9).
8. `<Popover` without `offset`; `outline-brand\b`; `outline-focus-ring` without `focus-visible:outline-2` (BEH-10, 13).
9. `<ToggleButtonGroup` with `segmentTrayClass` outside the shared switch; `<CountBadge className=`; `<AlertFullWidth` without `contained` outside `page-banner.tsx` (BEH-15, 17, 19).
10. `value="-"`, `<Focusable>` over a non-focusable child, `<RecordBackLink>` not starting with "Back to" (BEH-21, 12, 23).

## 6. Decisions needed

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | Registered User's DLA "All requests" (BEH-3) | Give DLA the nominations exception: "My requests" alone, drafts private |
| D2 | Which modal for discard (BEH-5) | `DestructiveModal`, title "Discard your changes?", confirm "Discard changes", cancel "Keep editing" |
| D3 | New shared components: `NotFoundState`, `RestrictedState`, `ViewSwitch`, `DiscardChangesModal`, `UnwiredTooltip` (BEH-5, 9, 12, 17) | Approve all five (each is a §1.4 override); they remove about 45 copies |
| D4 | Create-action verbs and Projects "New project" (BEH-14) | Lists "New {noun}", final form action "Add {noun}" or "Create {noun}", Add menu gains Role and Permission |
| D5 | Sortable columns convention (BEH-20) | Sortable except ID; taxonomy and datasets get sorting |
| D6 | Flagged concepts layout (BEH-18) | Move filters and stats to main; keep the queue as the only column-2 content, or make it a normal list then record |
| D7 | Notice constructs on lists: TaskItem vs PageBanner vs ExplainerCard (BEH-19) | PageBanner for the one fact and next step; keep TaskItem on Home only |
| D8 | Popover default offset 12 for every trigger (BEH-13) | Yes, in `popover.tsx` |
| D9 | Attribute naming (BEH-16) | "Organisation", "Requested by", "Status" |
| D10 | Toast copy and an `/patterns/feedback` page (BEH-11) | Write the page; "{Noun} {past participle}" titles |
| D11 | Pin `en-AU` for date fields (BEH-22) | Yes |

Recommended next move: fix BEH-1 and BEH-2 first (functional, one-file and seven-line fixes), then settle D1 to D3, then promote the AUTO checks in section 5 so the 6 Oct state does not drift again.

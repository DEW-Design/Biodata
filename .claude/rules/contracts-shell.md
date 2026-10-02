---
paths:
  - "app/pages/**"
  - "lib/create-menu.ts"
  - "lib/registered-user-nav.ts"
  - "config/role-access.config.ts"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: shell

The persona shell and page patterns: header, rail, columns, forms, lists, record pages, floating panels. Full text and numbering: CONTRACTS.md.

### §2.8 Floating panels never overlap

Two floating elements on the same surface (map controls, a summary card, a map key, a search card,
the map's scale bar and attribution) MUST NOT cover each other, at any window size.

- MUST lay out floating panels that share a surface in one layout (a flex column or row), not
  position each one on its own with offsets that only work at one size.
- A panel that can grow (a card with a photo, a results list) MUST be height-bounded by that layout
  and scroll inside itself; its primary action stays reachable.
- Where there is not room for panels side by side, they stack; they never overlap.
- **Exception:** the floating dev tools (§3.8) are draggable and are not product layout.
- **Origin:** Explore option 2's record summary card grew down over the "Species group" map key.
- **Enforcement:** `REVIEW` (a live pass measuring panel boxes at several window sizes, §0.6 item 4).

### §3.1 One header

Every real `/pages/**` screen renders `<AppHeader />` and nothing else at the top. It MUST NOT be
hand-rolled, copied, or wrapped to change what it shows.

- **Enforcement:** `AUTO §3.1`.

### §3.2 One rail, one icon map, legal links in the rail

Column 1 is `<PrimaryRail />`, icons come from `nav-icons.ts`, and the Terms, Privacy and Help links are
icons at the foot of the rail (`PrimaryRail`), on every screen and every persona. Column 2 carries no
footer block.

- **Origin:** the designer moved the legal links from a text block at the foot of column 2 into the rail
  (30 Sept 2026), so they survive on screens that have no column 2.
- **Enforcement:** `AUTO §3.2`, `AUTO §3.3`, `AUTO §3.5`.

### §3.3 Account controls live in the header

`ProfileMenu` and `GuestAuthActions` are used only by `AppHeader`. MUST NOT be copied.

- **Enforcement:** `AUTO §3.4`.

### §3.4 Persona consistency

A persona sees the same header and rail on every screen. Role-specific behaviour (org pill, the Add menu,
account control, Home's task badge, which sections the rail lists) is decided inside the shared component
from the role and `config/role-access.config.ts`, never at a call site. `public-user` is the only
deliberate exception, and only in account controls and gated actions.

### §3.5 The Add menu

The header has one "Add" button (Jira-style). What it offers comes from `lib/create-menu.ts`, filtered by
the role-access matrix. MUST NOT add a separate creation button to a header.

### §3.6 Position

The header is a top-level sibling before the rail + sidebar + main row, full width, never inside `main`.

### §3.7 Three columns

Primary rail, contextual sidebar, main - under the full-width header - on every screen and every persona.
A role that cannot use a section still gets all three, with the restriction stated in main. Column 2
always exists and always says something about where you are.

- Exempt by name: `app/pages/biodata-home` (marketing), `app/pages/auth/**` (auth flow) and `app/pages/page.tsx`
  (the `/pages` screen index, a directory of screens rather than one).
- **Override (designer, 30 Sept 2026):** the project page (`/pages/project-list/<id>/project-details`,
  `/pages/project-detail`) and that project's record pages have no column 2, for every persona. The
  project's own actions are in the hero's "..." menu, the records tree is on the Survey records tab, and a
  breadcrumb project switcher replaces going back to the list. Logged in
  `context/decisions/2026-09-30-07-*`; it is scoped to those screens and is not a precedent (§0.1).
- **Override (designer, 1 Oct 2026):** Explore's first layout (`/pages/observations`) has no column 2, for every
  persona, so the map takes the full width. Its search areas are a section of the floating search card and
  the data-access notice some roles see is the warning banner across the top of the map. Explore's second
  layout (`/pages/observations/option-2`) is unchanged. Logged in `context/decisions/2026-10-01-*`; it is
  scoped to that screen and is not a precedent (§0.1).

### §3.10 Column 2 is navigation and actions only

The contextual sidebar (column 2) holds where you are and what you can do from here: a section label, a
list or tree or scope switch that moves you around, and the Actions group (export, report). It MUST NOT hold information: no explanatory copy, no steps or explainers, no alerts, task cards
or accordions. Information sits in main, above the content it explains.

- **Exception:** the public-user (signed-out visitor) column 2, which explains what BioData SA is and
  points to guides (`GuestAboutAside`). No other persona and no other screen.
- **Where the information goes.** "What is this" content is never in column 2. A short one (how a nomination is
  reviewed) is an `ExplainerCard` (`app/pages/_shared/explainer-card.tsx`) above the list it belongs to, closable;
  a notice about the whole screen is a `PageBanner`. Both are documented at `/patterns/banners`. Where a longer
  explanation should live is not decided (the project explainer is parked, see the backlog in `ref-shell.md`).
- **Origin:** the nominations list put a "How a nomination is reviewed" steps explainer in column 2; the same
  mistake came back as the "What is a project?" and project guides block in the Projects column 2, which the check
  missed because its headings were inside a component the aside rendered (designer, 1 Oct 2026, section 0.8).
- **Enforcement:** `AUTO §3.10` (a left-hand `<aside>` in `app/pages` containing a heading, Progress steps, alert,
  accordion or task card, or rendering a component whose own markup does, except the public-user file). It
  catches structural information only; prose in a plain paragraph is `REVIEW`.

### §3.11 Every item in column 2 has an icon

Every navigation item in column 2 (a scope tab, an area tab, a view tab, an action row) MUST carry an icon to the
left of its label, so the column scans by shape as well as by word and reads the same on every screen. The same
items in the mobile menu carry the same icons.

- **Which icon.** "All X" takes the section's own icon from `sectionIcons` (`nav-icons.ts`), as "All projects"
  takes the Projects icon; "My X" takes `User01`. An area or view tab takes the icon of what it holds (All users
  `Users01`, All roles `UserCheck01`, All permissions `Key01`; Home's My BioData `User01`, Flora and Fauna Dashboard
  `PieChart03`). An action row carries its action (Export CSV `Download01`, Create report `BarChart01`).
- **One icon per concept (§2.4).** An item has the same icon in column 2 and in the mobile menu, and on every
  screen it appears. A new item takes an icon that is not already another concept's.
- **Built with.** `Tab icon={...}` in column 2, `ActionRow icon={...}` for actions, and `MobileNavItem`
  (`app/pages/_shared/mobile-nav.tsx`) for the extra items in the mobile menu, never a hand-built button.
- **Not covered.** The section label above the items (a heading, not an item), the numbered steps of a form's
  section list (the step marker is its icon, §4.1), and data rows such as the project's records tree (each row
  carries its own record-type icon).
- **Origin:** the All / My switch on DLA, DSA and nominations and User Management's Users / Roles / Permissions
  tabs were text only, beside Projects and Home, which had icons (designer, 1 Oct 2026).
- **Enforcement:** `AUTO §3.11` (a vertical `TabList` whose `<Tab>` has no `icon`), `REVIEW` for action rows and the
  mobile menu.

### §3.13 Underline tabs carry icons

Every tab in an underline tab list (a record page's sections, the project page, the dashboards, a report's tabs) MUST
carry an icon to the left of its label, as column 2's items do (§3.11): the icon of what the tab holds, so a tab row
scans by shape as well as by word and the same section has the same icon on every screen.

- **Which icon.** The one the app already uses for the same thing (§2.4): Overview `Grid01`, Locations `MarkerPin04`,
  Species `Feather`, Survey records and Data Collection Scope `Database01`, Artefacts and attachments `Paperclip`,
  Project and Projects `Folder`, Permit and Agreement `FileCheck02`, Audit log and history `ClockRewind`, Privacy and
  Restrictions `Lock01`, What to protect `Shield01`, Data Sharing `Share07`, Comments `MessageSquare01`, URI/DOI `Link01`,
  Roles and permissions and Permissions `Key01`, Users `Users01`, Details `File06`, Favourites `Star01`, Uploads
  `UploadCloud02`; Flora and Fauna take the species group icons, and the record kinds the records tree's icons
  (`record-icons.ts`). A new tab takes an icon not already another concept's, and is added here.
- **Counts** (`badge`) stay after the label; the icon does not replace them.
- **Exempt (open, see the backlog in `ref-shell.md`):** Explore's results tabs (the 440px card; with icons they need
  about 780px and scroll further), a record's dynamic section tabs (`project-details-view.tsx`, whose titles come from
  the data), and Home's task status filters (`Tabs.List`, filters, not sections).
- **Origin:** column 2 and the method tabs had icons while the underline tabs did not (designer, 1 Oct 2026: "these to
  also have icons"); the lab at `/proto/tab-icons` measured the options (A text, B every tab, C selected only) and B
  was chosen.
- **Enforcement:** `AUTO §3.13` (an underline `TabList` in `app/pages` with no `icon` in it, except the two listed files).

### §4.1 The form pattern

Every create or edit form (Add Project option 2, DSA, DLA, and any new one) MUST render `<FormPage>`
(`app/pages/_shared/form-page.tsx`) with fields laid out in `<FormRow>`. Documented at `/patterns/forms`.

1. **Header:** an optional eyebrow, the title (with a status badge for an existing record), a one-line
   subtitle, and one **close button (X)** at the top right (`CloseButton`, labelled "Close form"): the way out
   of the form. The header describes the step; it MUST NOT hold any other action.
2. **Sections live in column 2.** A form with more than about two or three field groups is split into
   sections, and the sections are listed in the contextual sidebar as a `FormSectionList` (rendered into the
   shell through `FormSidebar`), which is the real **vertical Progress steps** component
   (`Progress.IconsWithText`, `orientation="vertical"`): a progress bar, the sections grouped by step, and a
   state per section (current, complete, needs attention, not started). Any section can be opened at any time. Sections MUST
   NOT be tabs, a horizontal stepper, or a forward-only wizard. Related fields share a screen.
3. **Rows:** label and help on the left, fields on the right (`FormRow`). Required fields are marked `*`.
4. **Mandatory details block progress.** Continue does not move on, and jumping forward through column 2
   is refused, while the current section has mandatory fields missing. Going back is always free. When it
   refuses, the form shows a **"Details missing" error alert** above the fields (`FormPage` `problems`,
   an `AlertFullWidth` with `wrap`) that names exactly what is missing, and switches on the inline error
   on each empty field. Nothing turns red or alerts while a person is still on their first answer; it only
   happens after they try to move on, and **only for the section they tried to leave**. A section they have
   not reached is never validated, marked, or counted ahead of them (it stays "not started"), and
   arriving at it never shows it in red. The one exception is Submit, which checks the whole form. Column 2 marks the sections that still need attention, with a
   count. The alert and the inline errors are the only feedback; MUST NOT add a second message for the
   same fact.
5. **Footer:** every action, where the task ends. **Back a step** (secondary, left arrow icon) on the left,
   hidden on the first section. On the right, **Save draft** (secondary), then the primary action:
   **Continue** (right arrow icon) to move on, or the final action (**Submit**, **Create project**, **Save
   changes**) on the last section. Save draft is omitted when a draft makes no sense (editing a live record).
   Toasts are lifted clear of this footer everywhere (`TOAST_OFFSET`), so they never cover its buttons.
6. **Leaving:** the close button asks before discarding unsaved changes (`ConfirmationModal`), and says
   what will be lost.
7. **Controls:** real DEW components only (`Input`, `TextArea`, `Select`, `MultiSelect`, `RadioGroup`,
   `Checkbox`, `Accordion`). No bespoke choice tiles.
8. **Draft:** a draft needs only what identifies the record; submit validates the rest.

- **Exempt:** Add Project option 1 (a stakeholder option, one question per card), and editing in place on a
  detail page's own cards, which follows §4.7 instead.
- **Enforcement:** `AUTO §4.1` (a file that uses `FormRow` must import `FormPage`), `AUTO §4.1b` (a `FormPage` screen must not use tabs).

### §4.2 Lists and tables

Every collection screen is Section header, then search, then table: `SectionHeader` (title, a real
`CountBadge`, subheading, primary action), a real `Input` search, `TableCard.Root` around `Table` with
`TableCard.PaginationNumbered`. Applies at every scale, including a small table inside a detail tab. A
list is a table page whose rows are links (`href`), and the deep dive is its own route
(`/pages/<name>/<id>`); create and edit are routes too. Never a hand-rolled header or a bare unpaginated
table.

**The table fits the viewport.** A collection screen never scrolls as a page because of its table. The
section header, banner and search keep their height, the table takes the rest, the rows scroll inside it
under a sticky header, and the numbered pagination stays pinned at the bottom.

- MUST give the table `Table bodyScrollable` and `Table.Header sticky`, put it in a `TableCard.Root` that is
  `flex min-h-48 flex-1 flex-col`, and give every ancestor up to the shell's `main` `flex min-h-0 flex-1 flex-col`
  (the section header and search are `shrink-0`). The `min-h-48` floor lets a very short window scroll the
  content area instead of collapsing the table to nothing.
- MUST NOT let a collection table grow to its full height and push the page into scrolling.
- **Exception (embedded table):** a small table inside a detail tab (a record's systems, a measurements
  table). The page is the scroll container there and the rows are few, so it keeps its natural height.
- **Exception:** doc pages and `/proto` labs.
- **Origin:** the Explore results page grew taller than the window and carried the toolbar and pagination
  off screen with it; the Projects, DSA and DLA lists did the same once they held more than a few rows.
- **Enforcement:** `AUTO §4.2b` (a screen using `TableCard.Root` without `bodyScrollable` fails, except the
  embedded tables listed in the script), `REVIEW` for the layout chain.

**One search width (§4.2c).** The search box in a collection toolbar (the row of search, then Filter,
then any view or tree controls, above a list, table or tree) is the same everywhere.

- MUST render `<ToolbarSearch>` (`app/pages/_shared/toolbar-search.tsx`): 384px wide (`max-w-sm`), shrinking
  only on a narrow screen, small size, the `SearchMd` icon. Filter sits directly after it.
- MUST NOT let the toolbar search grow to fill the row (`flex-1`), or give it its own width.
- **Open, not decided:** Explore's results search (`/pages/observations`) was made full width on the
  designer's instruction before this rule existed, and project-detail option 2's records search is
  `max-w-md`. Both now have the Filter menu beside them, so the check names them as exceptions (`species-results.tsx`,
  `observations-search.tsx`); bringing them in line is for the designer to decide.
- **Origin:** the Survey records toolbar on project detail Option 3 grew its search to the full row while the
  Projects, DSA, DLA and User Management lists all used 384px.
- **Enforcement:** `AUTO §4.2c` (a file with a `FilterMenu` whose search is a hand-rolled `Input` with a
  search icon fails), `REVIEW` for toolbars without a Filter button.

**The filter (§4.2d).** Every table that can be filtered has the one filter (designer, 1 Oct 2026, chosen from the filter
options lab, option A): a **Filter** button, directly after the search, that opens a contextual menu of the attributes
(`FilterMenu`, `app/pages/_shared/filter-menu.tsx`). Each attribute is a row with an icon and a name, a line between
related groups, and the number ticked where it is on; pointing at it opens its values in a submenu beside it, a tick after
each value that is on (a date attribute offers its presets and a Custom range). The filters that are on are removable chips
under the toolbar, with Clear all (`AttributeFilterChips`, `app/pages/_shared/attribute-filter.tsx`). Documented at
`/patterns/filters`.

- MUST be the only filter on a table: no second Filter button, popover, side panel, accordion of values or hand-built chips.
  A list is described to it as attributes (`useAttributeFilter`), as sections and getters (`useListFilter`,
  `list-filter.tsx`), or as a selection kept outside the list (`useSelectionFilter`).
- MUST apply as values are chosen and MUST NOT have an Apply button (§1.9 item 2). Escape closes the menu a level at a time
  and never changes what is ticked.
- MUST go back to page 1 whenever a filter changes.
- MUST give every attribute an icon that names what it holds (`icon`; one left out gets the icon for what its name says).
- **A list of values that grows with the data (a project, a person, an organisation, a site) is searchable and bounded.**
  Mark it `searchable`: from 4 values up its submenu has a search box at the top (the keyboard goes from the box into the
  list), what is ticked stays on top however it is searched, and at most 50 others are drawn at a time with a line saying
  how many are waiting ("50 of 1,284 shown. Search to find the rest."). The data can run to thousands of projects, so
  scrolling a full list is not a way to find one. A fixed set (a status, a kind, an access level) is not `searchable`
  and shows all of its few values. The rule is `boundedOptions` (`app/pages/_shared/option-checklist.tsx`). MUST NOT
  hand-roll a list of values for a filter.
- MUST NOT add an attribute the data cannot filter on (a "Project timeline" range needs project start and
  end dates the project list does not carry yet). What is filtered is a column you would scan, never an identifier
  (the search covers IDs and names).
- **Origin:** the Data Ingestion Report has nine filter attributes; twelve always-open filters and a section per facet in
  one popover were rejected (30 Sept 2026), then a lab compared a contextual menu, quick filters on the toolbar and a
  side panel, and the designer chose the menu and asked for it on every table with filtering (1 Oct 2026). Until then the
  lists had a popover of every section open (`ListFilterButton`), the reports an "Add filter" popover, and Explore a side
  panel of accordions, three filters for one job.
- **Enforcement:** `AUTO §4.2d` (the old filters' labels, a button or panel titled "All Filters" or "Add filter", under
  `app/pages`), `tsc` (`ListFilterButton` and `AttributeFilterButton` no longer exist), `REVIEW` for the rest.

**Empty tables (§4.2e).** A collection with no rows to show renders `<ListEmptyState>`
(`app/pages/_shared/list-empty-state.tsx`) in place of the table: a gray FeaturedIcon, a heading, one balanced
line that says why and what to do, then the action. Two cases, told apart: nothing exists yet (no action unless
the designer names one), and nothing matches (an action that undoes the narrowing, named by its outcome, e.g.
"Show all uploads").

- MUST NOT leave a bare line of grey text where the table would be.
- MUST NOT name the action "Clear search" (it collides with the search box's own clear button); name what the
  person gets back.
- **Origin:** the Data Ingestion Report showed "No uploads match your search and filters." as a lone sentence
  under the chips (designer screenshot, 30 Sept 2026); the Projects, DLA, DSA, Nominations and artefacts lists
  had the same line.
- **Enforcement:** `REVIEW`. First occurrence of this fix, so no `AUTO` check yet (§0.8); one is due if it recurs.

**Stable tables (§4.2f).** A collection table's columns keep their width whatever rows are showing. Every table
that is filtered, searched, sorted or paged is `<Table layout="fixed">` and gives every column a width on its
`Table.Head` (a percentage for a list that fills the screen, a pixel width for a wide report), with a `min-w-*` on the
table so a narrow window scrolls it sideways instead of crushing a column. A value longer than its column wraps or is
cut with an ellipsis and its full text as the tooltip; it never widens the column.

The same holds for a scrollbar. Where a person sees a classic scrollbar (Windows, or a Mac with a mouse), a scroll area
that overflows in one state and not in another (All beside My, one tab beside another) takes about 15px from the
content when its scrollbar appears. A scrolling `main` reserves that space (`overflow-y-auto [scrollbar-gutter:stable]`)
and a scrolling table does it itself (`bodyScrollable`), so nothing moves when rows or content come and go.

- MUST NOT leave a collection table on the automatic layout: it sizes each column to its widest cell, so switching
  All to My, a search, a sort or the next page moves every column.
- MUST NOT leave a column without a width in a fixed table (the browser leaves the space unused).
- MUST NOT make a page's scrolling `<main>` `overflow-y-auto` without `[scrollbar-gutter:stable]`.
- **Exception:** Explore's results table (`map-search/results-table.tsx`), whose columns are chosen by the person, and
  the lab-only `ingestion-report.tsx`; both are listed in the check and are open, see the backlog in `ref-shell.md`.
- **Origin:** the nominations list moved every column when the designer switched from All to My, because one row
  had a second line (an organisation) and another a long status; every other list had the same flaw (designer,
  1 Oct 2026: "no dance-y layouts").
- **Enforcement:** `AUTO §4.2f` (a `Table` with `bodyScrollable` and no `layout="fixed"`, or a `<main>` with `overflow-y-auto`
  and no `scrollbar-gutter`, under `app/pages`). The scrollbar half cannot be seen in the headless browser used for
  checks, which hides scrollbars: it is `REVIEW` to look at in a real browser with scrollbars always shown.

**One gap under the header (§4.2g).** Under a `SectionHeader`, the collection body (any notice, the toolbar,
the table) sits in one wrapper with `p-6`: the same 24px between the header's divider and the search on every
list, and 24px to the sides and bottom.

- MUST wrap the body that follows `</SectionHeader.Root>` in a `div` with `p-6` (`flex min-h-0 flex-1 flex-col
  gap-4 p-6`, as every list does).
- MUST NOT give that wrapper side and bottom padding only (`px-6 pb-6`) or none at all: the search then sits
  flush against the header's divider.
- **Origin:** the Notification Management list and the project's Datasets view both shipped with `px-6 pb-6`,
  the search box touching the divider, while every other list used `p-6`; the designer: "This error is recurring
  fix it and add to contracts" (1 Oct 2026).
- **Enforcement:** `AUTO §4.2g` (in a file with `<ToolbarSearch>`, no `div` between `</SectionHeader.Root>` and the
  first `<ToolbarSearch>` carries `p-6`, `pt-6` or `py-6`).

### §4.3 Cognitive load

More than five or six field groups needs tiering. A conditional field is conditional in the UI. One focal
point per view. Never restate a fact in two treatments on one screen. When load and one extra click are in
tension, take the click.

### §4.6 Record pages follow the project page

Every record page (a project, a DLA, a DSA, a nomination, a user, role or permission, a report, and any new
record) is laid out like the project page (`/pages/project-detail`):

1. A Back link on its own above the card (`RecordBackLink`).
2. The gradient identity card (`RecordHero`): eyebrow, title, a row of label/value facts, and the
   record's actions at its top right (`RecordActionBar onDark`): one button for the next step, every
   other action in the "..." menu, destructive ones below a divider.
3. Optionally, one notice saying where the record stands and who acts next.
4. Underline `Tabs`, each panel a bordered card of label/value rows (`RecordRow`). A report is a record whose
   content is a table: under its card come the report's counts (`MetricTile`s), then search, the attribute filter
   and the table (`DataReport`, `app/pages/_shared/reports/report-table.tsx`); a report with parts has underline
   `Tabs` for them. Its eyebrow is "Report"; its facts are who it is for (Scope, stated once, so the description is
   the same for every role), the date of its newest record where its rows carry a date, the report's own totals
   (Events, Occurrences, Observations; Total records), and its columns (and its rows, unless a total already says it).
   A breakdown of those totals (species groups, errors by kind) is a row of `MetricTile`s under the card, an overview.
   A report has no next step, so all its actions (Export CSV) are in the card's "..." menu, like the other record
   pages, with no white button. A project scope is a Select right after the search, before the Filter button, not a row of its own.
   A "Columns" button at the right of the toolbar (`column-chooser.tsx`) opens one popover where columns are shown,
   hidden and reordered (by their handle or the keyboard), the first column pinned and always shown, applying as
   each is chosen with no Apply button (1.9 item 2), and a Reset; its label says how many are hidden.
5. **The breadcrumb.** On a record page the section crumb is a switcher, not a plain label or a link back: the
   section's name with an up-down caret (`BreadcrumbSwitcher`, `app/pages/_shared/breadcrumb-switcher.tsx`, through
   a thin wrapper per collection such as `ProjectSwitcher` and `ReportSwitcher`). It opens one popup: a searchable
   list of the other records of the same collection (the design system `ComboBox`, A-Z, about six rows then
   scrolling inside, the records the role may see and no others, the current one ticked) and a bar fixed at the
   foot, "View all <things>", which goes to the list. Picking a record opens it with the role kept. The crumb
   after it is the record's name. On the list page itself the crumb is plain. The section's name is the same in
   the breadcrumb, the rail and column 2 ("Reports", not "Reports (All Users)": who sees what is the content's
   rule, not part of the name).

- MUST NOT put a record's actions in a bar above the card, or stack its content without tabs.
- MUST NOT build a second switcher: a collection's record pages reuse `BreadcrumbSwitcher`.
- **Origin:** the nomination record page shipped with its actions above the card and no tabs, after
  the designer had already asked for every record page to follow the project page. The reports were first built
  with a plain section header and no breadcrumb switcher; the designer asked why they did not follow the project
  page, and for the project page's switcher to apply "across all instances where we do a deep dive into a deep
  page" (1 Oct 2026).
- **Enforcement:** `REVIEW`. First occurrence of the switcher gap, so no `AUTO` check yet (§0.8); one is due if a record
  page ships with a plain section crumb again.

### §4.7 Roles belong to the data owner's contacts; show only what is approved

A project's data owner (shown as **Published by**) has one or more contacts, and every one of those
contacts carries its own **role** (role or type of work). The role is part of that contact.

1. The role MUST be shown with its contact (name, then "· role"), and edited with that contact.
2. MUST NOT show a separate "your role", "registered by", "Registered by (role)" or similar field or
   row, and MUST NOT add a "Project team" card, on project detail or in its edit flows. Project managers
   have their own card and their own roles.
3. MUST NOT add a field, row, card, section or label to a screen that the designer did not approve or
   the source does not define, even when it seems helpful. A new label is a question (§0.4), not a
   decision.

- **Origin:** a "Project team" card with a "Registered by (role)" row appeared on project detail
  Option 3 after the role had already been placed with the data owner's contact, a correction the
  designer had made more than once.
- **Open, not decided:** the Add Project registration still asks "Your role" in its Project team
  section; whether that question moves to the data owner's contact in registration is for the designer.
- **Enforcement:** `AUTO §4.7` (a "Registered by" label under `app/pages` fails), `REVIEW` for the rest.

### §4.8 Editing in place on a detail page

Where a detail page (a record, a project) is edited on its own cards rather than in a form, every edit
behaves the same way, on every card and every page.

1. **Entry:** a card's edit icon edits that card; a field's edit icon (on hover or focus) edits its card,
   scrolled to and focused on that field; "Edit record" (or the page's equivalent) edits every card. A new
   record opens the same way, every card in edit mode.
2. **One treatment:** a card in edit mode has the brand border and brand-50 halo and says "Editing". The field
   rows use the same label-left layout as when viewed.
3. **More than one card at a time:** while a card is in edit mode, the other cards stay at full strength and keep
   their edit icons; opening another adds it to the same edit. MUST NOT dim or lock the other cards.
4. **Actions in one place:** Cancel and Save changes (or "Add <type>" for a new record) sit in one sticky footer
   across the bottom of the page, reading "Editing <cards> · Unsaved changes", and cover every card in edit mode.
   MUST NOT put them inside a card or repeat them per card.
5. **Leaving:** Cancel or Exit with unsaved changes asks first. Save and Cancel return to the view the edit was
   started from (a side panel stays a side panel, a full view stays a full view).
6. **Visibility:** where a record's fields can be hidden, the right-hand column becomes the "Fields shown"
   checklist while a card is in edit mode, and for a new record.

- **Origin:** Project details kept Cancel and Save inside the card while record editing had them in a page
  footer; the designer caught the difference ("Consistency is the key"). Item 3 replaced "the other cards dim and
  hide their edit icons" on 29 Sept 2026, by designer decision, after locking the other cards got in the way.
- **Enforcement:** `REVIEW`.

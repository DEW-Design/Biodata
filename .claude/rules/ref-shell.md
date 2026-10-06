---
paths:
  - "app/pages/**"
  - "lib/create-menu.ts"
  - "lib/registered-user-nav.ts"
  - "config/role-access.config.ts"
---

<!-- Hand-maintained: edit in place, current practice only. Trimmed 2026-09-29; the full earlier text, with its history and worked examples, is in context/archive/ref-shell-history.md. -->

# Reference: building screens in the shell

How a `/pages/**` screen is built today: the cognitive-load principles, what a screen is, the build order,
the collection pattern, the backlog. Rules live in CONTRACTS.md (the shell §3, the patterns §4); this is the
reasoning and the how-to behind them. Where this file and a clause disagree, the clause wins.

## Design principles (cognitive load)

BDBSA's domain is dense (a project carries ~15 metadata sections). These keep density from becoming overload,
on every screen and persona (the rule is §4.3):

- **Tier, don't dump.** More than ~5-6 field groups needs Tabs (parallel concerns) or an Accordion (rarely
  touched ones), not one scroll.
- **A conditional field is conditional in the UI.** Don't render a section's scaffold until the field it
  depends on makes it apply ("No restrictions", not five empty tables).
- **Group by use, not by schema.** Often-checked facts (status, dates, who) first and untiered; the rest behind
  a tab or accordion, even out of schema order.
- **Repeated table shapes get distinct containers,** not just a label between them.
- **Same word, different meaning, needs distance:** rename one of two "Location" sections.
- **An empty value is omitted or "Not provided",** never a stray `-` (§2.3).
- **Anything findable within 3 clicks** from the primary nav; if not, add a shortcut (search, a direct link).
- **Never show everything on one page;** when load and one extra click are in tension, take the click.
- **One focal point per view,** and **never restate a fact in two treatments** on one screen.
- **Check your own output against these before presenting it:** count the primary-looking elements, ask where
  the eye goes first.
- **Every action button carries an icon** (§3.12): the action's own glyph on the left, a forward arrow on the right for
  a button that moves on, from the one set in the contract. A `RecordAction` and the modals' confirm and submit
  buttons cannot be built without one.
- **A control keeps its treatment across states.** Before building a screen, list its states (empty, one item,
  many, all hidden, loading, error, each role) and for every control ask whether its emphasis, place or wording
  changes between them and, if it does, what the user gets from that. A create action keeps the same emphasis
  whether or not rows exist (the DLA, DSA and nominations lists keep "New ..." primary); a change between states
  needs a reason that holds (something else takes over as the primary), and a sibling check: how do the other
  screens treat the same kind of control? "Add area" went from primary to secondary once an area existed, with
  nothing taking over, and was caught in review (1 Oct 2026).
- **A container keeps its size across states.** Content may grow inside a panel; the panel's width does not change
  between empty, loading, results and error, and one element's width is never taken from a measurement of
  another. Explore's search card went from 400px to about 422px when results brought the map key with them, and
  was caught in review (1 Oct 2026); it is now 440px in every state. Measure the box in each state before calling a
  screen done. The same holds for a table's columns: a collection table is a fixed layout with a width on every column
  (§4.2f), so All to My, a search, a sort or the next page never moves a column.

## Exploratory page layouts (what a `/pages/**` screen is)

A preview of a real product screen, not a doc page and not a `/test-*` proof.

- **Every contained widget is real DEW or a visible `<Gap>`** (`components/scaffold/gap.tsx`, §1.2), never a
  lookalike.
- **None of `/test-*`'s review apparatus:** no inspector, no mapping or gap tables (§4.5).
- **Full screen, no doc chrome.** `app/pages/**` sits outside the `app/(docs)/` route group, so only the root
  layout wraps it; a screen owns its own full-height root (`h-screen`).
- **Not in `lib/nav.ts`.** Screens are reached by URL and listed by hand in the `/pages` index
  (`app/pages/page.tsx`): a new screen needs one line there.
- **A Figma annotation layer (a sticky note, a comment card) is not product UI** and isn't reproduced.
- **A wireframe fixes content and flow only** (§2.5): it is re-fitted into the shell and the patterns below,
  and each departure is named in the page's header comment.
- **Rail sections with a real page navigate to it** (`router.push(roleHref(keyHref(key)))`); a section with
  no page yet shows a `SectionPlaceholder` in place. Every internal link goes through `useRoleHref`
  (`lib/use-role-href.ts`), which appends `?userRole=` or `&userRole=`, or the destination silently falls back
  to the default role.
- **Role-gated whole pages** read `useFeatureAccess` (keys in `config/role-access.config.ts`), keep all three
  columns with the restriction in main (§3.7), and are listed in `wholePageGates`
  (`app/_prototype-tools/page-gates.ts`) so previewing a blocked role goes Home.
- **A notice about the whole screen is a `PageBanner`** (`app/pages/_shared/page-banner.tsx`, documented at
  `/patterns/banners`): full width under the header, outside the scrolling area, one fact and one next step, one
  close control. A notice about one record or section is the contained `AlertFullWidth` inside the content. "What
  is this" content is never in column 2: a short one is an `ExplainerCard` (`_shared/explainer-card.tsx`) above the
  list (Nominations: how one is reviewed). A longer one has no home yet: see the backlog.
- **Option routes** (`/pages/<name>/option-n`) exist only while a screen is being explored (§4.4).

## Build hierarchy: components, shell, screen, flow

1. **Components** (`components/base/**`, `components/application/**`), the DEW layer, never patched for one
   screen.
2. **Shell:** `AppHeader`, `PrimaryRail`, the legal links as icons at the foot of `PrimaryRail`, column 2 (absent on every record page, §3.7, and on Explore's first layout), `MobileNavTrigger`, and
   `<PrototypeTools />` (§3.1-§3.8; anatomy at `/patterns/navigation`). Borrow it; never draw a new one.
3. **Screen:** the shell plus the page's own content, built from components and the patterns below.
4. **Flow:** the unit that gets user-tested (dashboard, project list, project, record). A screen can pass
   every check alone and still fail in a flow: a lost filter on return, a dead end, a broken back link.

## List -> deep dive (the collection pattern)

How any collection (projects, agreements, nominations, users, templates) is built. Current templates:
`app/pages/_shared/nominations/` (shell, list, record, form, store) and `app/pages/template-finder/` (a
single list with no record page).

1. **One shell component per collection** (`NominationShell`, `DsaShell`, `DlaShell`,
   `TemplateFinderShell`): header, rail, column 2 and the restricted state. Each route supplies only main.
2. **Column 2 is navigation and actions only** (§3.10). A role that sees more than its own records gets a
   All / My scope switch (`AgreementScopeNav`, `?scope=`; All first: My is that list narrowed to you); a role with one view gets just the section label (a
   one-option switcher is dishonest UI). **Exception (designer, 6 Oct 2026):** Nominations lists "My nominations" alone for a
   Registered User, who only ever sees what they nominated (`AgreementScopeNav showAll={false}`); a BioData User and the
   Privileged roles get All (their organisation's) and My, the BioData Admin All (everyone's) and My (`nominationAllView`). An `ActionsGroup` (Export CSV) sits below when there is something to
   export. Status is a filter in main, not a place in column 2. **Exception (designer, 5 Oct 2026):** the Template Finder's
   column 2 lists its species types and collection methods under group headings with counts, because they are the list's own
   filter drawn as places (`TemplateNav`, one filter state, §4.2d); no other screen does this without the designer's say-so.
3. **The list is a table page** (§4.2): `SectionHeader` (title, `CountBadge`, subheading, the primary create
   action), a `ToolbarSearch` and the `FilterMenu` (filters apply as they are chosen, and can be seeded
   from the URL, e.g. `?status=`), then `TableCard` with `Table bodyScrollable`, a sticky header and
   `TableCard.PaginationNumbered`. Information about the list (review steps, a task that needs attention)
   sits above the search, never in column 2. Don't add a column that repeats a filter the view already
   applies.
4. **A row is a link** (`href` through `useRoleHref`) when the record has its own page; no per-row View
   button. A row with nowhere to go (a template) is not a link.
5. **The record page is its own route** (`/pages/<name>/<id>`) and follows the project page (§4.6):
   `RecordBackLink`, `RecordHero` with `RecordActionBar onDark`, at most one notice, then underline `Tabs`
   of `RecordRow` cards. A record that no longer exists shows an honest "not found" state. A report is a record
   whose content is a table (`DataReport`: counts as `MetricTile`s, search, the filter menu and its chips, the table). On every
   record page the breadcrumb's section crumb is a `BreadcrumbSwitcher` over the collection's other records (§4.6
   item 5; documented at `/patterns/navigation`); the collection's wrapper is `ProjectSwitcher`, `ReportSwitcher`
   and so on.
6. **Create and edit are routes** (`/pages/<name>/new`, `/pages/<name>/<id>/edit`) using the form pattern
   (§4.1). Saving lands on the record; destructive actions are confirmed in a `DestructiveModal` and stay on
   the page so the new state is visible.
7. **Shared state is a zustand `persist` store** per collection (`*-store.ts`, plumbing in
   `app/pages/_shared/zustand-persist.ts`): list, record and form read the same records, and edits survive a
   reload on that browser. There is no backend.

## Adopting UX patterns from external references

Mobbin, another product or a screenshot supplies interaction and IA ideas, never styles or component
replacements (§2.6): ingest, name the pattern, propose and stop, map to our components, build, QA. The
Supabase pattern catalog gathered earlier is in the archive.

## Backlog: explorations held off for now

- **An expand-on-hover column 1** (Supabase's sidebar control). Column 2 holds stateful controls that
  shouldn't vanish when the pointer drifts, hover has no keyboard or touch equivalent, and `MobileNavTrigger`
  already reclaims space below `lg`. **Revisit if** main needs more width often; then make column 2
  collapsible by click, not hover.
- **Bulk sensitive species nomination.** The MVP is one species per nomination, the unit the panel decides.
  **Revisit if** nominators ask to submit a related group together.
- **"What is a project?" for a first-time visitor (parked 1 Oct 2026).** Three treatments were tried on the Projects
  list and none is kept, so the list has no explainer: (1) a block in column 2, which broke 3.10 and was moved; (2)
  an `ExplainerCard` above the table with the five levels, which took about 240px of the list ("takes too much space,
  brevity is key"); (3) a `WalkthroughModal` that opened on load, with a help button in the section header
  ("unhelpful", "the walkthroughs look so ugly"). What is left, dormant: `_shared/walkthrough-modal.tsx` (not used by
  any screen), `showsProjectExplainer` in `config/role-access.config.ts`, and the shared `_shared/record-icons.ts`;
  the `ExplainerCard` stays in use for Nominations. The copy, drafted from the BDBSA fact sheets and never content
  reviewed: lead "Every record in BioData SA belongs to a project. A project describes one survey program: who runs
  it, where and how data is collected, and what is held back from public release."; then Project (the survey program,
  and who runs it), Site (where the project's data is collected), Visit (each time a site is visited, sampling events
  are run), Occurrence (a species found at a visit), Observation (the measurements kept for what was found); one link,
  "Open resources and user guides". Open: where a first-time "what is a project?" belongs at all (a link to the
  guides, the empty state, the Add project flow, Home) and, if a walkthrough returns, what it should look like; the
  Nominations card takes about 140px of its list and raises the same question. **Revisit when** the designer decides
  how first-time help should work across the app, or the copy has been through a content review.
- **Explore's results table still sizes its columns to their content** (`map-search/results-table.tsx`, allowed in the
  §4.2f check): the person chooses its columns ("customise columns"), so there is no fixed set to give widths to, and each
  tab (Species, Projects, Events) is its own table inside a 440px card. Decide whether it should get a width per
  column from its column definitions, like the reports. The lab-only `ingestion-report.tsx` is also exempt.
- **Icons on the underline tabs: done, with three exceptions (3.13).** Treatment B (an icon on every tab) was chosen by the
  designer ("these to also have icons", 1 Oct 2026) and applied to the project page and its option 2, the record pages
  (DLA, DSA, nominations, user, role), the Flora and Fauna dashboard, Reports and the records report. Open: Explore's
  results tabs (the 440px card needs about 780px with icons and scrolls sideways; the lab `/proto/tab-icons`), a record's
  dynamic section tabs (`project-details-view.tsx`, titles from the data, so no icon to choose), and Home's task status
  filters (filters, not sections).
- **Open, filters:** the filter chips appear under the toolbar when a filter is turned on, so the table (which takes the rest of
  the height) starts about 32px lower; the toolbar does not move. If that reads as a jump, the chips could live in the toolbar
  row, scrolling sideways, or a strip could be reserved. The Explore results toolbars keep their full-width search (4.2c,
  not decided).

## Registered User dashboard scope

Per the designer, Home for a `registered-user` is a personal tracker, not a BI surface: their DLA requests,
their sensitive species nominations, the datasets they uploaded, and the projects they created, with adding
data to an existing project as the core recurring action. DLA requests and nominations already surface in
"Needs your attention" (`app/pages/_shared/home-dashboard.tsx`); check that file for what else is built
before extending it.

# Archive: the "Final check" list, as it stood on 2026-09-29

Not loaded into sessions. Every bullet below is now a numbered clause in CONTRACTS.md (checked one by one on 2026-09-29, each clause contains the rule); this file keeps the original wording and the incident stories.

| Final-check bullet | Now in |
| --- | --- |
| QA check runs at the end of every ingest | §0.6 |
| Alphabetical slotting | §3.9 |
| DEW/Scaffold line | §1.5 |
| Section header, search, table | §4.2 |
| Figma is the source of truth | §2.5 |
| Lo-fi is a starting point | §2.5 |
| Component changes flow through | §1.3, §4.5 |
| No em-dashes | §2.3 |
| No arrow characters | §2.3 |
| No two icons side by side | §2.4 |
| One header, rail, icon map, footer links | §3.1-§3.5 |
| Header spans the full width | §3.6 |
| Three columns | §3.7 |
| Geist stays Geist, Barlow stays Barlow | §2.2, §1.5 |
| No fabricated Figma links or assets | §0.3 |
| Placeholder person is Olivia Wyatt | §0.3 |
| External reference is UX only | §2.6 |
| If a check fails, fix it before reporting done | how to read a clause, §0.6 |

## Final check - non-negotiable contracts

Before calling any task finished (not just a new component ingest - any change to
`components/base/**`, a doc page, a token, or a `/test-*` screen), re-read the diff against this
list. These are contracts, not preferences - a task that violates one of these is not done, no
matter how complete it otherwise looks.

- **The QA check runs at the end of every component ingest, clean, no exceptions.** See "QA
  check (non-negotiable, post-ingestion)" below for the full checklist (`tsc`, `lint`, utility
  classes actually resolve, portaled content carries its own `font-barlow`, no doc-site global
  leaking into a component's own markup, a live browser pass, a Figma audit if a frame exists,
  a sibling-file grep for the same bug pattern). A component ingest is done when this check
  passes, not before - "it type-checks" is not the bar.
- **Sidebar/config slotting is alphabetical, always.** A new entry in `lib/nav.ts`'s `Components`
  array and a new top-level key in `config/design-system.config.ts` both get inserted in strict
  A-Z order by title/key - never appended at the end because that was faster. If either file is
  ever found out of order (including entries that predate this rule), fix the whole list while
  you're there, not just the new entry - a partially-sorted list is worse than an honestly
  unsorted one, because it looks intentional. (`Primitives` and `Patterns` in `lib/nav.ts` are
  deliberately *not* alphabetical - they follow a foundations-first narrative order - this rule is
  scoped to `Components` only.)
- **The DEW/Scaffold line holds.** No real component under `components/base/**` was patched to
  serve a doc-only or Scaffold-only need. See "DEW vs. Scaffold" below.
- **Every collection/list screen is Section header, then search, then table - non-negotiable.**
  `SectionHeader.Root/Group/Heading/Subheading/Actions` (title, a real `CountBadge`, a subheading,
  the primary create action) first, then a real `Input` search field, then `TableCard.Root` wrapping
  `Table` with real `TableCard.PaginationNumbered` - never a hand-rolled header, never a bare
  unpaginated table. `app/pages/_shared/dsa/dsa-list.tsx` and `app/pages/_shared/dla/dla-list.tsx`
  are the canonical reference - both already match this exactly. Caught twice in one pass, both
  directly by the user: `/proto/collection-sidebar`'s own column 3 had hand-rolled its own `<h1>` +
  `CountBadge` header and a bare, unpaginated `Table` instead of pulling in the real components -
  fixed by deleting the reimplementation and rendering the real `DsaListContent`/`DlaListContent`
  directly, not a lookalike. The same sweep found `app/pages/_shared/project-list-content.tsx` -
  a real, live, shared production screen - missing the search step entirely; fixed the same
  session. Check this on sight any time a collection/list screen is touched, the same way a
  `font-barlow` gap or a dead utility class gets checked on every new component.
  - **Applies at whatever scale the table actually is, confirmed directly by the user rather than
    left as an exemption.** A first pass read a small table embedded inside a record's own detail/
    tabbed content - `dsa-detail.tsx`'s "Systems that receive data through the API" table and
    `observation-detail/page.tsx`'s `MeasurementsTable` - as a different, smaller pattern exempt
    from this contract. Asked directly; the answer was no, they follow it too. Both fixed: `dsa-
    detail.tsx`'s Systems table gained a `CountBadge` next to its own label, a real search `Input`,
    and real `TableCard.PaginationNumbered` (still no page-level `SectionHeader` - that component
    is sized for a whole screen, not a sub-card inside a tab, so the count+label pairing stands in
    for it at this scale). `observation-detail/page.tsx`'s `MeasurementsTable` was rebuilt on the
    real `TableCard`/`Table` (it had been on the bare `components/base/table/table.tsx` primitive -
    the exact "wrong table component" bug this whole contract exists to catch) with real numbered
    pagination; its own wrapping `<div>` had a redundant `border`/`rounded-lg` that doubled up
    against `TableCard.Root`'s own `ring-1`/`rounded-xl` chrome once the real component was in
    place - removed. One search box was deliberately left out: `MeasurementsTable` renders as the
    *value* of a single "Measurements" field in a label/value row, not its own labeled section, and
    a search field doesn't fit that slot honestly - flagged here rather than forced in silently.
    The takeaway for the next screen this comes up on: don't assume a table's context makes it
    exempt - ask, the way this one did, rather than deciding unilaterally either way.
  - **Two known items deliberately left alone, both confirmed directly:** `app/pages/dashboard/
    option-2/data-overview.tsx`'s `ProjectsTable` and `app/pages/project-list/option-2/page.tsx`
    stay untouched - both sit inside the `option-2` top-nav shell this file already documents
    elsewhere as "an inert reference, not a maintained parallel surface," and that precedent holds
    here too. `app/pages/projects/page.tsx` and `app/pages/projectsv2/page.tsx` - both render a
    table with neither a `SectionHeader` nor search, aren't linked from anywhere in the app, and
    aren't otherwise documented in this file - are confirmed stale/superseded drafts, safe to leave
    as-is; not brought in line with this contract and not deleted either, since deletion wasn't
    asked for.
- **Figma is the source of truth wherever a frame exists.** No colour, spacing, or state was
  invented or left un-checked against Figma when a reference frame was available. See below.
- **A lo-fi/wireframe is a starting point, never the literal layout to ship.** Whether it's a
  Figma wireframe or a plain screenshot, its job is to establish the content and the flow - what
  fields exist, what a screen needs to say, what actions are possible - not to dictate the exact
  chrome, stepper widget, or panel arrangement pixel-for-pixel. That content always gets re-fitted
  into this system's real three-column shell and real components, following whatever pattern
  already exists for the closest analogous screen (see "List -> deep dive" below), even where that
  means restructuring the wireframe's own layout outright - a numbered-circle stepper becomes the
  same `Tabs`-with-error-count pattern every other multi-step form here already uses, a flat two-
  pane screen becomes a real list + deep dive, an inline flat scroll becomes tiered per the
  cognitive-load principles below. This is the same "Figma wins on styling, never on scope or
  structure" instinct the Generated-screens/Exploratory-page-layouts sections already apply to
  hi-fi frames, made explicit for lo-fi ones too, because a lo-fi wireframe is even less likely to
  already reflect this system's real information architecture than a hi-fi one is. Two worked
  examples: the Data Sharing Agreement (DSA) build (its lo-fi's flat form became three real tabs,
  its own two-pane screen became a real list -> deep dive) and the Data Licencing Agreement (DLA)
  build below (its numbered stepper became the same Tabs pattern, its "Add a Location" methods were
  re-derived from Explore's own real map-search components instead of rebuilt from the wireframe's
  own drag-and-drop chrome). Ask when a wireframe's intent is ambiguous; never ship its layout
  verbatim on the assumption that "the wireframe already decided this."
- **Component-level changes flow through to every `/test-*` page that uses that component, same
  session.** A resolved `?` gap gets its placeholder swapped, its gap table updated, and its
  mapping table updated together. See "Generated screens" below.
- **No em-dashes** in this file or in any doc-page/component copy - hyphens only.
- **No arrow characters standing in for an icon - not `->`, not `→`.** `Button` (`components/base/
  buttons/button.tsx`) takes an `iconTrailing` prop on every color variant, including `link-color` -
  a "go to X" affordance uses `<Button color="link-color" iconTrailing={ArrowNarrowRight}>Go to
  X</Button>`, a real icon, never a character appended to the label text. Caught after the fact:
  every such button across `/pages/*` originally read `{label} →` as plain text - fixed to use
  the icon prop instead, per the user directly.
- **No two icons side by side representing one label or concept.** Pick the one icon that names
  the actual thing - a second icon glued next to it reads as clutter, not information, especially
  when nothing (spacing, a divider, a different weight) tells the eye they mean different things.
  Caught on `/proto/public-user-explorations`'s "Log an observation" hook: a `Lock01` (signalling
  "this is gated") sat directly next to a `Camera01` (signalling the action) with no separation -
  the CTA button next to it already says "Create a free account," so the lock was redundant. Fixed
  to the one icon that names the action itself. Applies everywhere, not just that proto.
- **One header, one rail, one icon map, one footer-links block - shared components, never hand-rolled, and never
  different between personas (public-user is the only deliberate exception).** Every real `/pages/**` screen renders
  `<AppHeader />` (`app/pages/_shared/app-header.tsx`) as its top bar and `<PrimaryRail />`
  (`app/pages/_shared/primary-rail.tsx`) as column 1, with `sectionIcons` from `app/pages/_shared/nav-icons.ts` and
  `<SidebarFooterLinks />` at the foot of column 2. A screen supplies only what is genuinely its own: its mobile-nav
  trigger, its breadcrumb, and what a rail click does. Everything else - the logo lockup, wordmark, org pill, search,
  the "Add" menu, the profile menu - is decided once, inside the component, from the role and the role-access matrix:
  - **Role-specific behaviour lives in the component, not at the call site.** The org pill shows only where the
    `orgSwitcher` feature allows it (DEW for `biodata-*`, ORG for `privileged-*`); the account control is `ProfileMenu`,
    or Log in / Sign up for `public-user`; the rail lists the persona's own nav tree (`navForRole`); Home's task badge
    shows for `registered-user` only, on every screen. A persona sees the same header and rail on every screen.
  - **The header's "Add" menu** (Jira-style: one "Add" button, not one button per thing) opens what that persona can
    create, from `lib/create-menu.ts` filtered by the role-access matrix: Project for every signed-in persona, Data
    licence request (DLA) where `dlaAccess` allows, Data sharing agreement (DSA) where `dsaManagement` allows. A guest
    gets the same button and the sign-up invite. To let a persona create something new, add one entry to that file.
  - **Enforced, not just written down.** `npm run check:contracts` (`scripts/check-contracts.mjs`) fails on any screen
    under `app/pages` that contains its own `<header>`, `aria-label="Primary"` rail, `sectionIcons` map, local
    `ProfileMenu`/`GuestAuthActions`, or inline footer links. Run it with `tsc` and `lint` before calling any screen
    task done. Exempt: `app/proto` labs, the marketing landing page, the auth flow, and the two stale drafts
    (`projects`, `projectsv2`). Changing the header means changing `AppHeader`, which changes it everywhere at once.
  - Caught by hand before this existed: "Add project" was a dead button in the DSA and DLA shells, Add Project had two
    different headers, two screens had no rail icon for DSA, and Home's badge showed on some screens and not others.
- **The shell's header spans the full width, above the icon rail + sidebar + main row - never
  nested inside `main`, and never a sibling only of `main` instead of the whole row.** Every real
  shell (`dashboard/page.tsx` and its siblings - see "Build hierarchy" below) renders `<header>`
  as its own top-level sibling, directly inside the page's root column, *before* the
  `<div className="flex flex-1 overflow-hidden">` that holds the icon rail/contextual sidebar/main
  content:
  ```
  <div className="flex h-screen flex-col ...">
    <header>...</header>                          <- full width, spans everything below it
    <div className="flex flex-1 overflow-hidden">
      {iconRail}
      <aside>...</aside>
      <main>...</main>
    </div>
  </div>
  ```
  Putting `<header>` inside `main` (or anywhere inside that inner row) makes it only span
  whatever's to its right instead of the full screen - easy to miss when a page has no sidebar yet
  (nothing sits to the header's left to expose the bug), and it breaks the moment one gets added.
  Caught twice on `/proto/public-user-explorations`: flagged directly by the user once a column-2
  sidebar was introduced and the header suddenly started rendering after it instead of above it -
  "the shell is a non-negotiable contract you've violated." Check this on sight on any new or
  edited page shell, not just when a sidebar is visibly broken by it.
- **Three columns on every screen, for every persona: primary icon rail, contextual sidebar, main - under a
  full-width header.** A role that can't use a section still gets all three, with the restriction stated in main
  (`DsaShell` does this); a screen is never rebuilt as two columns because its content is thin or its persona is
  limited. Column 2 always exists and always says something about where you are. `dashboard/page.tsx` and
  `project-list/page.tsx` render `public-user`'s Home and Projects with `GuestAboutAside` as column 2 (Sept 22 2026
  fold-in of `/proto/public-user`'s "Reference" variant - see that entry below) - this contract is now met for every
  built role. See "List -> deep dive" below.
- **Geist stays Geist, Barlow stays Barlow** - Scaffold text never borrows `font-barlow` to match
  a DEW neighbour, and vice versa, except inside a generated screen where everything is Barlow.
- **No fabricated Figma links, no fabricated icons/assets, no invented props.** An honest "not
  linked yet" / `?` placeholder beats a plausible-looking fake every time.
- **The placeholder person is Olivia Wyatt** (plus Phoenix Baker / Lana Steiner for multi-person
  demos) - never the current user's real name or email.
- **An external reference (Mobbin, a Figma link, a screenshot from another product) is a source of
  UX patterns, never of style.** Our colours, spacing, radius, shadows, and type scale do not
  change to match a reference, and no existing `components/base/**`/`components/application/**`
  component gets replaced or forked to look more like one - the reference's *interaction or IA
  idea* gets rebuilt from our own tokens and components, never its pixels. See "Adopting UX
  patterns from external references" below for the full workflow this runs through.

If a check on this list fails, fix it before reporting the task done - don't note it as a loose
end and move on, unless it's a genuinely separate, larger piece of work (in which case say so
explicitly and log it under "Known gaps" below, the same way the gray-scale primitive audit and
the File Type Icon set were).

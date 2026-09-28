# Archive: superseded bullets from "Exploratory page layouts", as they stood on 2026-09-29

Not loaded into sessions. These four bullets described shells and decisions that later work replaced (the `option-1` routes were normalised away on 2026-09-21). They are kept verbatim; the table says where each topic lives now. The other bullets of that section (including how the rail navigates, which the code still does) stayed in `.claude/rules/ref-shell.md`.

| Archived bullet | Where it lives now |
| --- | --- |
| Nav chrome is exempt from fidelity because the IA is not decided | Decided: the sidebar shell (context/decisions/2026-09-16-01-layout-decision-the-sidebar-icon-rail-contextual-sidebar.md); now contracts §3.1-§3.7 and /patterns/navigation |
| Projects is a leaf with its own key (history of the Projects/Datasets tabs) | Live in `lib/registered-user-nav.ts` (key `project-list`) and the Projects/Datasets tabs in `app/pages/dashboard/page.tsx` and `app/pages/project-list/page.tsx` |
| public-user built across the three option-1 shells | context/decisions/2026-09-21-04-the-public-user-experience-is-the-registered-experience.md (features reduce, never redesign), context/decisions/2026-09-22-07-proto-public-user-s-explorations-folded-into-the.md (guest column 2 folded in), context/decisions/2026-09-29-16-the-public-user-s-projects-column-2-explains.md to context/decisions/2026-09-29-19-correction-the-stats-card-in-the-public-users.md (column 2 copy), contracts §3.4 and §3.10 |
| project-detail option-1 header, sidebar and rejected options | context/decisions/2026-09-22-02-pages-project-detail-rebuilt-to-a-supplied-screenshot.md (page rebuilt to a screenshot), context/decisions/2026-09-22-04-project-detail-s-records-tree-controls-redone-from.md (records-tree controls); the variants themselves stay in the labs /proto/project-header and /proto/project-sidebar |

- **Navigation/IA chrome is explicitly exempt from that fidelity, because it isn't decided yet.**
  A primary icon rail, a contextual sidebar's nav list, a breadcrumb - anything whose job is "get
  the user somewhere else in the product" - gets built as a simplified structural placeholder from
  real tokens (borders, backgrounds, spacing - same "Scaffold may inherit from DEW's token
  vocabulary" rule as everywhere else), not pixel-matched to the Figma frame's specific icons/
  spacing and not `?`-blocked either. The point of a `/pages/*` screen is to see the content it's
  shaped around, not to lock in a nav pattern nobody has agreed on. Once `/patterns/navigation`
  (or a sibling) has a real, decided pattern, `/pages/*` screens should adopt it - until then, a
  placeholder is honest, a pixel-perfect guess isn't.
- **Projects is a leaf with its own key, same shape as Home - not a group with one combined
  "Manage Project and Datasets" child.** `lib/registered-user-nav.ts`'s `Projects` entry used to be
  `{ label: "Projects", items: [{ label: "Manage Project and Datasets", key: "project-list" }] }` -
  one destination blending two distinct resources into a single label. Flagged directly by the user
  off `project-list/option-1`'s own contextual sidebar: they wanted Projects and Datasets as two
  peer tabs there, "like the one we have on the homepage" (Home's My BioData/Flora and Fauna
  Dashboard `button-brand` `TabList`). Changed to `{ label: "Projects", key: "project-list" }` and
  gave `dashboard/option-1` and `project-list/option-1` their own "Projects" `Tabs` boundary
  (mounted only while that section is active, mirroring Home's own block exactly) with two tabs -
  Projects (`Folder` icon, renders the real `ProjectListContent`) and Datasets (`Database01` icon,
  still the honest "hasn't been scoped yet" placeholder - no reference content for it yet). Once
  Projects became a keyless-child-free leaf, `dashboard/option-1`'s `NavTree` lost the
  `isCurrent` special-case it grew for Bug A (highlighting "Manage Project and Datasets" from
  outside `project-list/option-1`) - that case is unreachable now since Projects never reaches
  `NavTree` at all, it gets its own `Tabs` branch same as Home. `project-detail/option-1` was
  deliberately left out of this change - its "Projects" section already shows one specific
  project's own detail (metadata, abstract, nested-records `TreeView`), not a Projects/Datasets
  resource picker, so forcing the same two-tab split there would misrepresent what's actually on
  screen. A first attempt put this split one level down instead - as a 5th "Datasets" sub-tab
  inside the Flora and Fauna Dashboard's own Overview/Flora/Fauna/Projects tabs - reverted once the
  user clarified the split belonged in the icon rail's contextual sidebar, not inside that
  dashboard's own content.
- **`public-user` ("Guest User") is built across all three option-1 shells - see "User roles"
  above for the real nav tree this reads. (Superseded in part: the no-`<aside>` and hidden-header-actions
  points below were reversed or revised by the Sept 21 2026 entries at the end of this file.)** Each shell (`dashboard/option-1`, `project-list/
  option-1`, `project-detail/option-1`) reads `useUserRole()` and picks `publicUserNav` over
  `registeredUserNav` for every nav-driven part (icon rail, `MobileNavTrigger`, `activeSectionNode`
  lookups) - a separate tree, not a filtered view, since whole sections disappear for this role,
  not just leaves inside them (see `lib/registered-user-nav.ts`'s `publicUserNav`).
  - **Home and Projects skip the two-peer-tab `Tabs` boundary entirely for this role** (checked
    before the `registered-user` two-tab branches, so those never run) - guest's Home/Projects are
    each a single view, and a two-tab switcher with only one real tab would be dishonest UI, not
    just a visual downgrade. Renders `DataOverviewContent`/`ProjectListContent` directly instead.
  - **No contextual-sidebar `<aside>` at all for those two single-view sections** - not the usual
    aside with just a section-label heading and nothing else in it. That shape depends on the aside
    holding real selectable content (a `NavTree`, a `Tabs` switcher); with neither, it's a 286px
    empty box with the footer links stranded at the bottom - flagged directly by the user as
    looking empty/unfinished after the first pass kept the (now-pointless) aside. Icon rail + full-
    width main content instead - a deliberately leaner layout matching "guest is a bare bones
    version of the platform," not a broken one. The footer links this aside would have carried are
    still reachable from Observations' own aside (the one section left that still uses it) - not
    worth inventing a new place to repeat them everywhere.
  - **Header**: `ProfileMenu` (avatar + Profile Settings/Logout) is replaced by `GuestAuthActions`
    (disabled "Log in"/"Sign up" buttons + a "coming soon" tooltip - there's no real auth flow
    anywhere in this build, same honesty convention as `DisabledQuickAction`). "Add project"/
    "Upload dataset" are hidden outright (not disabled) for this role - the gap isn't that they're
    unbuilt, it's that a signed-out guest was never meant to see them.
  - **`dashboardTasks.length`'s badge on the Home icon never shows for this role** - that list is a
    signed-in user's own pending tasks, and guest's Home has no personal content to badge.
  - **`project-detail/option-1` needed the least change** - its "Projects" section already shows
    one specific project's own detail (metadata, `TreeView`), a single view for every role already,
    not the two-peer-tab pattern the other two shells have to branch around. Only the icon rail
    data source, header, and badge needed the same treatment as the other two shells.
  - **Not filtered**: `ProjectListContent` renders the identical table for both roles - "View Level
    1 Public Project Data" implies a real public/private data split we don't have, and fabricating
    a filtered subset with no real leveled data behind it would be inventing content. See the
    "Backlog" section's record-level filtering entry.
- **`project-detail/option-1`'s header/Overview layout and contextual sidebar were redesigned via
  two `prototype`-skill labs, `/proto/project-header` and `/proto/project-sidebar` (kept in place
  after integration, not deleted - per the user, exploration routes stay as evidence of the
  directions considered, not just the one that shipped)** - decided after several rounds of user
  feedback that the original layout (a
  plain meta row + a flat, fully-expanded `TreeView`) risked cognitive overload at scale: project
  metadata that required a scroll to see, and a records tree that would not survive a project with
  thousands of observations. Two separate decisions:
  - **Header/Overview: "Meta Under Title, Full Rail."** The meta row (Project ID/Start Date/End
    Date/Status/Published by) stays exactly where it always was, directly under the title, and is
    deliberately *repeated* in a persistent right rail (`ProjectDetailsCard`) alongside Data Owner/
    Project Manager (`ContactCard` x2) - accepted duplication, on the theory that a fact worth
    showing once is worth being scannable without scrolling back to the header while reading
    Overview/the map. `project` (id/startDate/endDate/status/publishedBy) is one shared object so
    the meta row and the rail's copy of it can't drift apart. Rejected: "Full-Width Stats" (meta
    row moved into the rail only, no under-title copy - lost the always-visible metadata the user
    had asked to bring up in the first place); "Meta Under Title, Clean Rail" (no duplication - rail
    holds only Team Roles, not Project Details); "Status Up" (only the Status badge promoted next
    to the title - too little promoted given the original complaint was "metadata needs a scroll");
    "No Rail, Card Grid" (meta under title, but no persistent rail - Overview/Team Roles/Project
    Details flow as an equal-weight card grid instead); "Collapsible Properties" (a Linear-style
    one-line summary under the title with full fields collapsed behind a disclosure - rejected
    because it *hides* the metadata rather than surfacing it).
  - **Contextual sidebar: "Grouped by Type + Search."** The nested-records `TreeView` used to dump
    every child (Observations/Occurrences/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom Event) as
    flat siblings under the one Site node - fine for one demo site, would not scale. Fixed by
    grouping a node's own children by type only where they're a genuine mix (checked against the
    Figma wireframe's per-record-type Details Containers,
    `YMproGZfrFB5jUqPHPxMhk` node `1970-162922` - a Site really does hold Visits/Transects/Quadrats
    side by side, so grouping had to happen *inside* that real hierarchy, not by flattening it into
    type-only buckets and losing which site/visit a record came from), each bucket capped at 8
    visible rows with an honest "+N more - search to narrow" instead of rendering all of them, plus
    a search box (its placeholder lists every real record type, generated from the same type list
    the grouping logic uses so the two can't drift) that filters the whole tree and auto-expands
    only the branches/buckets that actually contain a match. See `groupByType`/`filterRecordTree`/
    `collectGroupedContainerIds`/`renderGroupedNode` in `app/pages/project-detail/option-1/page.tsx`
    for the implementation. Rejected: the original flat dump (Baseline); a first "Grouped by Type"
    pass that flattened by type globally and lost containment entirely (the specific gap the user
    flagged after the Figma reference); "Search-First" alone (full hierarchy, collapsed until
    searched - superseded once search was merged into the grouped version rather than standing on
    its own); "Breadcrumb Drill-Down" (one level visible at a time, no persistent tree shape); "Flat
    Virtualized" (drops the folder/site metaphor for one flat record list with type filter chips -
    the strongest pure-scale answer, but loses the containment story entirely).

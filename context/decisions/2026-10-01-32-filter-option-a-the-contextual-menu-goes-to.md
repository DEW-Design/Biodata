# 2026-10-01 - Filter option A, the contextual menu, goes to production on every filtered table

- **Oct 1 2026: Filter option A, the contextual menu, goes to production on every filtered table.** The designer chose option A of
  the filter options lab ("ready to be rolled into production ... All instances of a table with filtering will have this
  pattern"). Contract clause: 4.2d, rewritten (it chose between two filters; there is now one).
  - **Built (production).** `FilterMenu` (`app/pages/_shared/filter-menu.tsx`, from the lab): a Filter button with the count, a
    contextual menu of the attributes (an icon and a name, a line between `group`s, the number ticked), each opening its
    values in a submenu beside it with a tick after what is on (`Dropdown.SubmenuPopover`, `checkmark-end`); date
    attributes offer presets and a Custom range; a `searchable` list is a submenu with a search box at the top (4+ values,
    ticked first, 50 at a time). Grouped values (`children`) are one section per group. The filters that are on are
    `AttributeFilterChips` under the toolbar. State: `useAttributeFilter`, `useListFilter` (sections and getters, seeded from
    `?status=`), `useSelectionFilter` (a selection kept outside the list). An attribute's `icon` is optional and falls back to
    the icon its name says (`attributeIcon`); `group` is optional.
  - **Moved onto it (the old filters are gone):** Projects, Nominations, DLA (both lists), DSA (both), User Management (users,
    roles, permissions), Template finder, the project page (Survey records, Species, Artefacts) and its option 2 artefact table,
    every report (`report-table.tsx`, Data Ingestion, Post ingestion, and the rest, which already had the attribute filter's
    "Add filter" popover), Explore's Records tabs (replacing the All Filters side panel, its accordion of values and its pill row) and
    Explore's Species mode (the same, with its timeline as a date attribute). `ListFilterButton`, `AttributeFilterButton`,
    `OptionsPicker`, `matchesFilters` and Explore's `buildColumnFilterSections` no longer exist; the three filter
    paradigms for one job are now one.
  - **Removed (labs are deleted when a direction is chosen, section 4.4):** `app/proto/filter-options` (the menu, quick filters,
    panel and the page) and `reports/ingestion-report.tsx` (the lab-only report view), and the lab's entry on `/proto`.
  - **Component fixes found on the way.** `Dropdown.Menu` now sets `escapeKeyBehavior="none"`: react-aria's default wiped every
    tick in a multiple-selection menu on the first Escape (and the key was spent doing it, so closing took two): found when
    a filter was ticked in a real list and Escape cleared it. This is the same bug as `MultiSelect`'s, logged before, so
    `AUTO §1.9a` is extended to a react-aria `Menu` in a component (section 0.8). `UM` lists' paging resets when the filters change.
  - **Contract and docs.** CONTRACTS.md 4.2d rewritten (one filter; searchable and bounded lists; page 1 on change; icons), 4.2c now
    names `FilterMenu`, and two Explore toolbars (full-width search, the designer's call, still open) are named exceptions;
    `AUTO §4.2d` fails the old labels ("All Filters", "Add filter"). New pattern page `/patterns/filters` with a live
    example, in `lib/nav.ts` and the README.
  - **Verified:** in a live browser, as BioData Admin and Registered User: the Filter menu opens on Projects, Nominations, DLA, DSA,
    Users, Roles, Permissions, Templates, the Data Ingestion and Voucher reports, the project page's three tabs, Explore's
    records and species mode (each lists that screen's own attributes); ticking a value narrows the rows, shows the
    count on the button and a chip, Escape closes a level at a time and keeps the tick, `?status=` seeds the chip on DLA,
    nominations and DSA; no console errors. `tsc`, `eslint` on the touched files, `check:contracts` and `npm run build` pass.
  - **Not verified / open.**
    - Several of the lists have 3 to 9 real values per attribute, so the 50-row cap was only seen on a throwaway page earlier.
    - The reports have no `group` lines in their menus yet (their attributes get the heuristic icons).
    - I did not open each report's submenus one by one, nor the records tab's grouped submenu (Record type) by eye.
    - A filter's chips appear under the toolbar and push the table about 32px down; the toolbar does not move. Listed in the
      `ref-shell.md` backlog.
    - Explore's species-mode "Timeline" keeps its fixed 6-week picker limit as before; its chips show the range as two dates, not
      "Last 7 days", whichever way it was chosen.
    Not committed.

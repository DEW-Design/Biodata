# 2026-10-01 - Filter values are searchable and bounded

- **Oct 1 2026: Filter values are searchable and bounded.** Designer page feedback tagged SCALABILITY on the filter
  options lab (`/proto/filter-options`, option A): the Project values need a search box once there are four or more
  projects, because there can be more than 1,000 projects and scrolling a list to find one does not work.
  - **Cause.** Option A's Project submenu was a plain menu of every project with no search at all; the other two options and
    the real lists had a search box but only from 7 options up, hand-built three different ways (the Filter button's
    sections, the attribute filter's picker, Explore's filter panel), and none of them limited how many values were drawn.
  - **Changed.** One shared list for filter values, `OptionChecklist` (`app/pages/_shared/option-checklist.tsx`): a search box
    from 4 options up (`SEARCH_FROM`), the ticked values pinned on top however the list is searched, at most 50 unticked
    values drawn at a time with a line saying how many are waiting, "No other matches" when a search leaves only what is
    ticked. `ListFilterButton`, the attribute filter's `OptionsPicker` (so option B and C of the lab, and the Data
    Ingestion Report) and Explore's All Filters panel now draw their values through it (flat lists only; a grouped list
    keeps its parent and child boxes). Option A stays a contextual menu (designer: "can it still be contextual menu"): an
    attribute that needs a search (Project, Ingested by) is still a submenu from the Filter menu, now with a search box
    at the top of it (react-aria `Autocomplete` over the menu; typing narrows the ticks, the arrow keys move from the box
    into them, Enter ticks, the menu stays open, Escape closes), 320px wide so a project name and its code fit, and the
    same bounded list (ticked first, 50 at a time, a line for how many wait) through the shared `boundedOptions`. The other
    attributes keep their 240px submenus. A letter typed in the box is stopped from reaching the parent menu's
    type-to-select, which had closed the submenu. (My first version opened a popover instead, as "Custom range" does; that
    is replaced.) Only sections marked `searchable` get the box, so statuses and kinds never do.
  - **Contract.** Added to CONTRACTS.md 4.2d: filter values are searchable and bounded, through `OptionChecklist`, never a
    hand-rolled checkbox list. `REVIEW`, no `AUTO` check (first occurrence, section 0.8).
  - **Verified:** a throwaway page with 1,500 projects drew 53 elements, narrowed to 4 for "0042" in about 230ms, kept a
    ticked project pinned while searching "11" (50 of 123 matches shown) and said "No other matches" for "zzz". In a live
    browser: lab option A (the Project item opens the submenu, search focused, "flinders" narrows 4 to 1, the ticked one
    stays when the search clears, Filter shows 1), options B and C show the search box, the Projects list (Organisation
    has 4 values, so it has a search box), DLA, and Explore's All Filters panel (3 values per section, so no box) load with
    no console errors. `tsc`, `eslint` on the touched files and `check:contracts` pass. The throwaway page was deleted.
  - **Not done / open.** Real data has 4 to 9 projects, so the 50-row cap and the "waiting" line were only seen on the
    throwaway page. A list of thousands also needs the values to arrive from the server a page at a time rather than all
    being held in the browser; this keeps the screen light, not the data. Explore's Project section was not opened with 4
    or more projects. Not committed.

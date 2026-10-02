# 2026-10-01 - Reports list fits a laptop window, favourites move into the row menu, pagination select fixed in the component

- **Oct 1 2026: Reports list fits a laptop window, favourites move into the row menu, pagination select fixed in the
  component.** Designer annotated a screenshot of the Reports table in a ~1100px window: "why is this still happening?
  the squished layouts are back", "layout issue again?", the favourite stars "look so weird sitting like this - it could
  just be folded behind a 3 dot menu", and the Rows per page select "needs to be fixed on a master component level".
  - **Cause of the layout.** The previous task made the table a fixed layout with a 1000px minimum, so in a window where
    main is about 750px wide (the rail, then column 2, then main) the table scrolled sideways and the Category and Last
    opened columns were cut off. Fixed widths must fit the window people actually use, not only the 1708px one.
  - **Changed (reports list).** The star column is gone: Add to favourites / Remove from favourites was already in the
    row's three-dot menu. Widths are Report 50%, Category 23%, Last opened 18%, menu 9% with a 700px minimum, so it
    fits at 1100px with no sideways scroll; a long category label (Specimens and restrictions) is cut with an ellipsis
    and its full text as the tooltip. The Favourites tab lost its star icon (it was the only one of five underline tabs
    with an icon; the icon decision for all tabs is still open, see the backlog) and the tab row got 16px above it so it
    no longer sits on the header's border.
  - **Changed (components).** `NativeSelect` had no right padding, so a value ran under the chevron: `pr-8`, `pr-9` and
    `pr-10` for sm, md and lg; and it labelled itself by its own id when it had no `label` (an accessible name taken
    from the selected value), now only when there is one, and `aria-describedby` only when there is a hint.
    `TableCard.PaginationNumbered`'s "Rows per page" is now that `NativeSelect` at its small size instead of a raw
    `<select>` with its own tiny styling, so every table footer gets it.
  - **Decided by me, to confirm:** in the table a favourite is no longer marked on its row (only the Favourites tab and
    the menu wording tell); if a marker is wanted it should be a small filled star beside the title. The two tab-row
    arrows on the screenshot were ambiguous: I read them as the narrow-window clipping and the tab row's spacing.
  - **Verified:** live at 1100px and 1708px: no sideways scroll, every column visible, the footer select readable with
    its chevron clear; nominations, DLA, user management, projects and the report list render with their columns still
    filling the table and no console errors; `tsc`, `eslint` on the touched files and `check:contracts` pass. Not
    committed.
  - **Same fix for the other lists (sibling).** The previous task's minimums (900 to 1,240px) would have made Nominations,
    DLA, DSA, User Management, Projects and Template finder scroll sideways in a 1280px window (main is about 880px
    there, beside the rail and column 2). Their minimums are now 840 to 960px, set from each column's measured
    minimum content width (a headless measurement with the table collapsed to its narrowest), and the percentages were
    re-cut so the ID, status and date columns are never narrower than their content. Measured at a window where main is
    842px: no cell spills in any of them, and DLA, DSA, roles, permissions and Template finder fit with no sideways
    scroll; Nominations (960px, because one status label is 264px wide), Users (880px) and Projects (880px) scroll by
    a few dozen pixels at that size and fit from about 1300px up.
  - **Open.** Below about 1100px every list scrolls sideways. Nominations' status column is the widest single cost: its
    longest label, "Returned for more information", is 264px as a badge; if that should be shorter or wrap, it frees
    about 100px. A scrolling table also reserves its scrollbar's width (previous task), which on a system with classic
    scrollbars leaves a 15px strip at the right of the table's header band.

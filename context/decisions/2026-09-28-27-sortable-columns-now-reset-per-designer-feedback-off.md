# 2026-09-28 - sortable columns now reset, per designer feedback off two screenshots of a "Project" header (descending, then ascending: "missing sorting reset").

- **Sept 28 2026: sortable columns now reset, per designer feedback off two screenshots of a "Project" header (descending, then ascending: "missing sorting reset").** react-aria's table only flips a sorted column between its two directions, so once a column was clicked there was no way back to the table's default order. Fixed once in the shared `Table` (`components/application/table/table.tsx`, `useSortWithReset` in `TableRoot`), so every sortable table gets it with no call-site change (CONTRACTS 1.3, 1.9):
  - the first click sorts one way, the second the other, and the third resets to the sort the table opened with;
  - the default is the first `sortDescriptor` the table receives, and every caller already sets one (Updated newest first on Projects, DSA, DLA and nominations; Created newest first on artefacts; the name or category column on User Management and the `/proto` index);
  - the default column itself just flips, since resetting it would change nothing.
  The Table docs API table gained a `sortDescriptor / onSortChange` row describing the cycle.
  - **Verified live, clicking each header three times:**
    - Projects, Project column: ascending, descending, back to Updated descending, with the rows reordering each time.
    - DLA Status, nominations Species and User Management Organisation: the same cycle, each back to its own default.
    - Projects Updated and the Table docs demo's Name (both default columns): they flip.
    - Zero console errors.
  - **Checks:** `eslint --max-warnings=0` is clean on the touched files. `tsc` is clean. `npm run check:contracts` passes (the other session's em-dashes in `search-data.ts`, logged above, have since been fixed).
  - **Not covered:** the Explore results tables (`ResultsTable`) and the species table do not sort by column. Not committed.
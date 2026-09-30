# 2026-09-28 - Trap effort editor alignment cleaned up, per direct feedback off a screenshot (branch `mohan-wips`)

- **Sept 28 2026: trap effort editor alignment cleaned up, per direct feedback off a screenshot (branch `mohan-wips`).** Each trap type is now one label-and-field grid (`grid-cols-[8rem_minmax(0,1fr)]` in `v3/trap-effort.tsx`).
  - Every label (Number of traps, Duration, Length and so on) sits in a fixed left column.
  - Every input, "Add duration" and "Add spec" start on the same edge; measured at 641px for every trap type.
  - "Effort" and "Specs" headings span the grid.
  - The duration number and unit are fixed-width boxes (96px and 128px), so a row with a remove button no longer shrinks them.
  - Screenshot checked. Zero console errors; `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.

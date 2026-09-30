# 2026-09-29 - Trap effort grouped under three headings, per direct feedback ("Effort: No. of traps / Duration: days or nights... / Specs: length or width..."; branch `mohan-wips`)

- **Sept 29 2026: trap effort grouped under three headings, per direct feedback ("Effort: No. of traps / Duration: days or nights... / Specs: length or width..."; branch `mohan-wips`).**
  - **Each trap type is laid out in groups:**
    - **Effort:** number of traps, or hauls.
    - **Duration:** one row per unit, labelled with the unit ("Nights", "Days"), then "Add duration".
    - **Specs:** one row per spec, then "Add spec".
  - Each heading shows only when the type has that group, so eFishing has only Specs.
  - An empty Duration or Specs group reads "None added" beside its Add button. This also fixes the misaligned lone "Duration" label.
  - Delete labels now name the trap type ("Remove Elliott nights"), so two trap types never share one.
  - **Verified headlessly:**
    - Elliott reads Effort / Duration (Nights 4, Days 2) / Specs (Length 30 cm); Pitfall reads Effort / Duration; a new eFishing reads Specs, None added.
    - A duration's delete shows only on hover of its row.
    - Screenshots checked. Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed.

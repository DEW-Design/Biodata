# 2026-09-28 - Trap effort takes several durations, and specs are added one at a time, per direct feedback on the round above (branch `mohan-wips`)

- **Sept 28 2026: trap effort takes several durations, and specs are added one at a time, per direct feedback on the round above (branch `mohan-wips`).**
  - **Model:** `TrapEntry` is now `{ trapType, values (number of traps, hauls), durations[], specs[] }`, in `field-schema.ts`. New helpers: `newTrapEntry`, `trapMissing`, `trapSpecsFor` and `readTrapSpec`.
  - **Adding a trap type:**
    - Number of traps and Hauls stay single values; they show as soon as the trap type is added, when the type has them.
    - A new trap type starts with one duration. "Add duration" adds more (value and unit). Once there are two, each can be removed.
    - Specs (Elliott and eFishing only) start empty. "Add spec" lists only the type's specs not yet added (Elliott: length, width, height in cm; eFishing: voltage, frequency, duty cycle, wave form). Each spec is its own row with a remove button.
  - **Viewed:** "20 traps · 4 nights · 2 hours", then "Length 30 cm · Width 8 cm". The combined Elliott size control from the previous round is gone.
  - **Seed:** Elliott has 20 traps, 4 nights and a 30 cm length; Pitfall has 6 traps and 4 nights.
  - **Save:** every field shown and every added row needs a value.
  - **Verified headlessly:**
    - Added a 2-hour duration and a width to Elliott; the Add spec menu offered only Width and Height.
    - Saved; the view reads "20 traps · 4 nights · 2 hours | Length 30 cm · Width 8 cm".
    - eFishing starts with "No specs added yet."
    - Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed.

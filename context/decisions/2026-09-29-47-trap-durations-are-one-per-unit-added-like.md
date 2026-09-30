# 2026-09-29 - Trap durations are one per unit, added like specs, and the read view is a small aligned list, per direct feedback (branch `mohan-wips`)

- **Sept 29 2026: trap durations are one per unit, added like specs, and the read view is a small aligned list, per direct feedback (branch `mohan-wips`).**
  - **"Add duration" is a menu of the units not yet used:** minutes, hours, days, nights, months. "Days" was added per the designer.
    - Each duration row is a number (at least 1), its unit as fixed text, and a delete icon that shows on hover.
    - The same unit can't be added twice.
    - A new trap type starts with no durations. A type that has durations needs at least one before it saves.
  - **Older data with a repeated unit** is folded to the first one when edited (`toDraft`) and when read.
  - **Read view:** a small aligned list (Number of traps / Duration / Hauls / each spec, label then value). Several durations read one per line ("4 nights", then "2 hours"), and values never break across lines in the narrow panel. This replaces the "·"-separated sentence, which wrapped mid-list and showed "nights" twice.
  - **Verified headlessly:**
    - The menu offered Minutes, Hours, Days, Months for a trap that already had nights; after Hours was added, Minutes, Days, Months.
    - Saved; the panel reads "Number of traps 20 | Duration 4 nights, 2 hours | Length 30 cm". Screenshot checked.
    - Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed.

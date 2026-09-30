# 2026-09-28 - Delete icons show on hover only; adding durations checked, per direct feedback (branch `mohan-wips`)

- **Sept 28 2026: delete icons show on hover only; adding durations checked, per direct feedback (branch `mohan-wips`).**
  - **Delete icons appear only on hover or keyboard focus:**
    - In trap effort, a duration or spec row's delete shows with its row (`group/traprow`), and a trap type's own delete shows with the whole trap type (`group/editrow`).
    - The same treatment now applies to the measurement and custom property rows in `v3/card-editor.tsx`, so every delete icon in edit mode behaves the same way.
  - **"You cannot add multiple durations": not reproduced on a fresh load.**
    - "Add duration" added rows on a new trap type (Harp went to 3 durations) and on the seeded Pitfall, and removing one worked.
    - The likeliest cause is trap data held in the page from before the trap model changed. `toDraft` now copes with an entry that has no durations or specs list. A page reload clears the old data.
  - **Verified headlessly:**
    - Idle: every delete icon has opacity 0.
    - Hovering Pitfall shows only Pitfall's delete; hovering the Length row shows only its delete.
    - Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed.

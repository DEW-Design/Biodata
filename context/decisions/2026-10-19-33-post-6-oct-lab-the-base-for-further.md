# 2026-10-19 - Post-6-oct lab: the base for further explorations, and its code moved out of production files

- **Oct 19 2026: Post-6-oct lab: the base for further explorations, and its code moved out of production files.** The designer: "Let's make this the base for further explorations - only
  applicable to /proto/post-6-oct. Currently post-6-oct stuff should sit only on the /proto route without being rolled into production."
  - **The base:** `/proto/post-6-oct` opens as option 2 (no tabs, the account and the bell at the top left, the trail at the top of the page panel), the nested rail, and the production top
    right (`2026-10-19-32-*`). That is set in the lab's own files only (`page.tsx`, `params.ts`, `shell.tsx`); no other lab and no production screen reads those parameters, so the base
    applies to this lab alone. **The other layouts and top-right versions were not removed**: the designer's words made this the starting point, not the retirement, and every one of them
    is uncommitted work that deleting would lose; they stay on the Prototype tools bar for further explorations, and go when the designer says.
  - **Nothing of the lab reaches production (5.4):** no file outside `app/proto` imports from it (checked), and the deployed site is built without `app/proto`. What was still in
    production files, and is now out of them:
    - `app/pages/project-detail/record-panel.tsx` (`ActionsMenu`: `extra`, `trailing`, `kindLabels`, a heading that can be left out) is back to how it was; the project bar's "+" menu is the lab's own
      `project-add-menu.tsx` (the same types, from the product's `childOptions` and record icons).
    - `app/pages/project-detail/records-explorer.tsx` (`addRequest`) is back to how it was; the new-record form the "+" menu opens is the lab's own `add-record-flow.tsx`, using the product's exported
      `RecordFullscreenV3`, `RecordFullView` and `createRecord`. When the record is created the lab opens Project records with it selected.
    - `app/pages/_shared/dataset-upload/ingestion-views.tsx` and `project-ingestion.tsx` (`trigger`, `Trigger`, `transient`, and the in-progress pill from before) are back to how they were; the project bar's
      upload status is the lab's own `lab-ingestion.tsx` (the same datasets, the same simulated runs, the product's `IngestionDetail` in the same popover).
  - **Override, named (0.1 item 2):** the lab's copies are a few dozen lines each of product code, which CONTRACTS 1.6 (extend, do not fork; "MUST NOT copy a component to change it") and 0.9
    (reuse, do not copy) prohibit. They are copied by the designer's explicit instruction, for `/proto/post-6-oct` only, and are not a precedent. They will not follow later changes to the product's
    menu, form or chip: a change there needs the lab's copy to be checked.
  - **One production file still carries lab code, and was left for the designer:** `app/pages/project-detail/project-tab.tsx` has four opt-in switches the lab uses (`showGlance`, `repeatHeaderFacts`,
    `overviewHeading`, `sheetTop`, with a `bare` Section), each defaulting to the product's own behaviour, so the product page is unchanged. Moving them out means copying `ProjectTab` into the lab (880
    lines), whose sections and cards the designer wants identical to production's (13 Oct 2026: "the sections on the production screens are correct ... we're exploring a new layout, not changing
    all the good work that has gone into the production screens"); a copy drifts from them with every product change. Recommendation: leave the switches, as the one exception. Not decided.
  - **Backup:** the lab as it stood before this change, and the five production files as they stood, are in `.context/post-6-oct-explorations-2026-10-19/` (the workspace's ignored folder, not in git).
  - **Open:** (1) the `project-tab.tsx` switches above; (2) retiring the alternatives; (3) the contracts clause and rules files changed earlier today (2.13) are uncommitted too.
  - **Verified:** `npx tsc --noEmit`, `npx eslint app/proto/post-6-oct` and `npm run check:contracts` clean. `git diff` outside `app/proto` now shows only `project-tab.tsx` (and the 2.13 clause and its generated
    rule files). **Not verified:** that the lab's "+" menu, the new-record form, and the upload icon and popover behave as before (no browser tool was available), and that the product pages are
    unchanged in a browser (they use the files as they were, byte for byte, from the last commit). Typography QA (0.6 item 8) not run: no text changed. Not committed.

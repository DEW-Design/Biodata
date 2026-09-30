# 2026-09-28 - Project detail Option 3, version 3, round F, per direct feedback (branch `mohan-wips`)

- **Sept 28 2026: project detail Option 3, version 3, round F, per direct feedback (branch `mohan-wips`).**
  - **Field notes show only what has data (view mode).** The Comment, Questionable and Attachments tabs appear only when that kind of note exists on the field. With one kind, there are no tabs: a small heading (icon and name) sits over the content. With two or three kinds, there are that many tabs. Edit mode still offers every tab the person can add to (Questionable only for BioData Admin and Privileged Admin, or when the field already has one).
  - **Narrow panels:** below a 320px notes panel (container query `@xs`), the tabs are icon-only, share the width and keep their name as the accessible label. From 320px they show icon and name.
  - **A gap above the notes panel.** It no longer butts against the field row.
  - **"Open record" is now "Go to record"** in the Artefacts cards and table (v3), and in the intro copy.
  - **The details panel's scrollbar starts under its header,** like the tree beside it. The panel is a flex column: the header (path, actions, full screen) stays fixed and only the body scrolls. The header was sticky inside a scrolling panel before.
  - **Anything can be added directly under the project:** Add inside at project level now offers every event type (Site, Visit, Transect, Quadrat, Block, Ramble, Trap, Custom event), both occurrence types and all four observation types. `childOptions(null)` in `record-rules.ts` is shared, so the drawer version's project-level add changes too. Rules under a record are unchanged.
  - **Verified headlessly (biodata-admin):**
    - Reliability shows 2 tabs (Comment, Questionable); Description shows only an "Attachments" heading with no tabs.
    - With the panel at 340px, the tabs are icon-only.
    - The panel's scroller starts 50px below the panel top (under the header).
    - The project menu lists Events (8), Occurrences (2) and Observations (4).
    - 8 "Go to record" links and no "Open record".
    - Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean.
  - Not committed.

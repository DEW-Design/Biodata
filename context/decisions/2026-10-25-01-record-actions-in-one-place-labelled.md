# 2026-10-25 - Record actions in one place, labelled

- **Oct 25 2026: Record actions in one place, labelled.** The designer, on the project records panel (Cleland Stringybark
  Woodland): the icons were not in the right places, not intuitive, and two controls must not do the same action. The record had
  Edit and Add twice: in the header's "..." menu (Edit record with `Edit02`, Add inside, Delete) and in the row under the title
  (an icon-only "+" and an `Edit05` pencil).
  - **Changed.** The header bar (side panel and full view) keeps only navigation: the record path and full screen. The row under the
    title holds every record action, once: **Add** (secondary button, `Plus` and a down caret, the existing searchable menu: add
    inside, attachment, web link, section), **Edit** (secondary button, `Edit05`, per 3.12), and a "..." holding **Delete record**
    alone, so the destructive action is not one stray click away. The project-level panel (no record selected) lost its "..." too:
    it held only Add inside, which the Add button below already offers. `ActionsMenu` (record-panel.tsx) was removed, now unused.
  - **Verified.** `eslint` clean on the three files; `check:contracts` OK; `tsc` shows only the two stale `.next/types` errors for the
    removed option-2 routes, from before this change. Live, as BioData Super Admin: Add, Edit and "..." are each 36px tall with an 8px
    radius; Add opens its menu, "..." shows Delete record alone; the full view has the same row; no console errors.
  - **Open.** The section and field edit icons on the cards still use `Edit02` while Edit record uses `Edit05` (3.12 lists `Edit05`
    for edit). Whether to bring them in line is for the designer. Typography skills (0.6 item 8) not run: no new text treatment,
    the labels are the design system `Button`'s own.
  - Not committed.
- **Oct 25 2026 (continued): one icon per action, everywhere, now a contract.** The designer answered the open item: "keep it
  same everywhere ... Icons must be same for the corresponding actions across everywhere."
  - **Changed.** Every edit icon is `Edit05`: the section and field hover icons, the project cards, the record inspector, field notes,
    Taxonomy's Edit species, the Button and Dropdown doc pages and the shared Table's row menu (were `Edit01`/`Edit02`). Rename is
    `PencilLine` everywhere (the map areas' Rename was `Edit03`), kept apart from Edit since Taxonomy offers both in one menu. Upload is
    `Upload01` (Upload a corrected file, Upload Shapefile in DLA and project registration, Explore's shapefile options were
    `UploadCloud02`); Download is `Download01` (the attachment viewer's was `DownloadCloud02`). `UploadCloud02` stays as the Uploads tab
    icon, a concept, not the action.
  - **Contract.** CONTRACTS.md 3.12: "One icon per action, everywhere" (any control, any screen, doc pages and shared components; a
    near-twin glyph is a different icon; two actions never share one on a screen), "One control per action", Rename and Duplicate
    added to the table, and a new check `AUTO §3.12b` in `scripts/check-contracts.mjs`. It found 22 drifts before the fixes and none after.
  - **Left as is, on purpose.** "Change radius" on the map keeps `Sliders01` (it opens a slider; "Change" is not keyed by the check);
    the marketing home's "Export for research" tile keeps `FileDownload02` (a feature, not an action; exempt).
  - **Verified.** `check:contracts` OK, `contracts:rules` regenerated, `eslint` clean on every touched file, `tsc` clean except the
    two stale `.next/types` option-2 stubs. Live: the project page and records panel render, the card edit icon is `Edit05`; the only
    console message is a browser extension's message-channel error, not the app.
  - **Open.** Icon-only controls are `REVIEW` only (the check reads labels); Add and Cancel are not checked because the table gives
    them more than one icon.

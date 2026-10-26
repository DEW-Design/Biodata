# 2026-10-23 - Map visualise: the group heading is the same in every view

- **Oct 23 2026: Map visualise: the group heading is the same in every view.** The designer, with a screen recording switching between All errors and Business rule: "you see - consistency is required. if there's a
  left label on all, why is not on other tabs? we need to please fix this." The recording was read frame by frame (the video was split into frames with a small AVFoundation script outside the repo).
  - **What the recording showed:** in All errors every group of rows has a heading, "BUSINESS RULE 54" at the left and "SEVERITY" at the right; in a category tab only "SEVERITY" showed, the left blank. The cause was
    mine, from `2026-10-23-27-*`: the left label was gated on a `grouped` mode (All errors with more than one category), so that a category tab would not repeat the tab's own name (4.3); the right label then got its own
    label-only row. Two structures for one list, and a state (which tab) that changed what a control looked like for no reason that holds (the rule in `ref-shell.md`: a control keeps its treatment across states).
  - **Changed:** no mode. A heading starts every run of one category's rows (`i === 0` or the category changes from the row before), derived from the rows, in every view: in All errors one per category, in a category tab
    the one at the top. `grouped` and the label-only form of `ChunkHeading` are gone (its label, count and trailing text are now required). A category tab therefore repeats its own name and count in the heading, as
    the designer asked, for one structure; the repeat of what the tab already says (4.3) is accepted for that.
  - **Measured, all four views (BioData Super Admin, 1686px):** the heading at the same place (top 0 of the list, the first row 24px below), its left label 20px from the list's left edge, its "Severity" 20px from the
    right edge, 12/600 uppercase in each: All errors "Business rule 54", Business rule "Business rule 54", Coordinate mismatch "Coordinate mismatch 29", Metadata "Metadata 15". After Show more in a category tab: still one
    heading, 49 rows. Zero console errors; `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean.
  - **Not verified:** a category with no rows (the list shows its "No ... errors" line and no heading, as before; read, not seen), another role.
  - **Open:** whether the heading in a category tab should say more than the tab does (for instance the count of what is shown, which differs from the tab's count only if a later filter narrows the list); the headings'
    "Severity" label is the same row in every view, so any change to it is made once. Not committed.

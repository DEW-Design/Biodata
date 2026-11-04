# 2026-11-02 - Site scores folded into the site record on the project page

- **Nov 2 2026: Site scores folded into the site record on the project page.** The designer: "okay lets make this changes to sites in the projects."
  Only the inline option comes across, as the lab now stands (total rows, no Score row, no notes under the breakdowns).
  - **Built:** every Site record has two more sections, Vegetation condition score and Conservation significance score (`siteSections`, stored on
    the section as `vegetationCondition` and `conservationSignificance`, as Landscape context scores are), and the site's scores at the top of the record,
    in the details panel and the full view (`SiteScores`). Borrowed from the record's own patterns: the card editor's `EditRow`, one Cancel / Save bar, Add
    section, Remove section. A row opens its card at its field in the panel and the full view; a viewer who cannot edit gets no pencil and no press.
  - **Moved:** the scoring, the lookups, the breakdowns and the editors went from `app/proto/site-scores` to `app/pages/project-detail`
    (`vegetation-condition.ts`, `conservation-significance.ts`, `bam-lookups.json`, `site-scores-view.tsx`, `site-scores-editor.tsx`), because a product
    file MUST NOT import from `app/proto` (5.4). The lab imports them back and keeps only its options (`explained.tsx`).
  - **A site with no scores stays as it was:** the two sections are off the record, in view and in Edit, until Add section puts one there. Nothing is
    filled in for it. A site is not assumed to be a Bushland Assessment site.
  - **Honest gaps:** with no BCM community the vegetation score and the unit and total scores read "Not provided", not 0.00; with no block landscape
    score the same; with no BCM region a weed's threat reads "Not rated" and a new line says the region is not provided. Those lines are new copy.
  - **Sample data:** Cleland (SU00501) carries the scoresheet's Site 4, so it reads 25.01, 1.00, 1.17, 29.26, 585.20 and can be checked against the PDF.
    It does not describe Cleland: the association description says degraded native grassland beside a site described as messmate stringybark woodland.
  - **Open, for the designer:** (1) where the species counts, the BCM region and the block's landscape context score come from. They are held on the
    section and cannot be edited, so a site that adds the sections counts 0 species, has no region and no landscape score, and so can never reach a unit
    or total score; (2) whether the top block should show while Conservation significance is off the record: it reads 1.00, every site's floor;
    (3) retiring the lab's popover and modal options, and the lab; (4) the tree note's removal leaves "x 1.29" unexplained; (5) the "Location method:
    show notes" button from the earlier feedback; (6) `bam-lookups.json` (200 KB before compression) now ships with the project page: it could load on demand.
  - Verified: tsc and eslint clean on the touched files, `check:contracts` OK, no product import from `app/proto`. Live in Chrome on `/pages/project-detail`:
    as BioData Admin, Cleland shows the top scores and both total rows; Weeds opens the card with Weed 1's cover focused; cover 5 to 3 moved the top
    live to 25.77, 30.15, 603.00 and held after Save; Threatened flora opens the conservation card and Cancel closes it. Mylor shows neither section, and Edit
    shows neither card; Add section offers both; adding Vegetation, entering biomass and saving keeps it on the record. As Public user the table shows with no pencil and
    a press does nothing. Zero console errors. No sideways overflow at the panel's 958px.
  - **Not verified:** the "Not provided" wording before a community is chosen was changed after that pass and was not re-run (tsc only); Add a new site;
    a site in another project; the panel at a narrow window; the popover and modal options, beyond the route responding; a production build.
    `/emil-typography` and `/emil-design-foundations` were not re-run, because the type layers moved unchanged. Not committed.
- **Nov 2 2026 (continued): the total rows lose their fill; the expand icon stays in a panel edit.** The designer, with screenshots: "just remove the BG for both
  vegetation and conservation", and "the expand icon disappears on edit mode. retain that."
  - The total row keeps its medium weight and has no fill, on both tables. It takes no hover fill either, because it opens nothing.
  - The panel's edit view (`RecordFullView variant="panel"`) now has the expand icon. Pressing it carries the edit into full screen as it stands (`EditSession`, `initialSession`,
    `onExpand`, `expandPanelEdit`), so nothing typed is lost. Save and Cancel there return to the panel, where the edit started (4.8 item 5).
  - **Open:** in full screen the same icon (Exit full screen) still asks to discard unsaved changes rather than carrying the edit back to the panel; it was left as it was.
  - Verified: tsc and eslint clean, `check:contracts` OK. Live in Chrome as BioData Admin on Cleland: the row's background is transparent at weight 500; Edit shows the icon; a typed
    change survived Expand, every card stayed in edit, Save returned to the panel with the change, and Cancel returned to the panel. Zero console errors. Not tested: the conservation table's fill
    on screen (same row), expanding a new record being added. Not committed.

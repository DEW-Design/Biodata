# 2026-10-23 - Map visualise: three ways to show the record summary's facts, on the tools bar

- **Oct 23 2026: Map visualise: three ways to show the record summary's facts, on the tools bar.** The designer, with a screenshot of the record summary card that opens at the right of the map and a second screenshot
  of a reference ("Separator: a visual divider between items or sections. Often overused when better spacing would do the same job", a list of labels and values shown with Lines and with Spacing): "can we explore
  making the info in these right floating cards clearer?" Through `/refine-prompt`. An exploration, so options (CONTRACTS 4.4), not a decision.
  - **Built (`dataset-error-map.tsx`):** a **Summary** tool on the Prototype tools bar (`useRegisterTool`, id `summary`, icon `Rows01`), on the bar only while a record's summary is open (measured: 0 buttons before a
    record is chosen, 1 after). Three options for how the facts (Record, Rule, Field, Severity, Distance) are presented; nothing else on the card changes (the heading, the sentence, the order, Close, Escape):
    - **As it is** (the default): the grid the card had, each label with its value beside it, 16px apart, the values left-aligned. Card 262px tall for a business rule.
    - **Rows with lines:** each fact a row, the label at the left, the value right-aligned, a hairline between rows (and one above the first), in the card's own alpha rule (`MAP_SURFACE_RULE`, `gray-950` at 12 per
      cent: the same stroke as the dividers). The severity badge lands at the right edge, where the list's severity column is. 312px (+50).
    - **Rows with spacing only:** the same rows, no lines, 12px between rows (it was 6). 280px (+18).
    Type is unchanged in all three (14px, labels tertiary, values primary, `tabular-nums` on the distance); the options differ in structure, alignment and lines only. The record summary's row structure is the
    design's `RecordRow` idea (label, then value), not the component: `RecordRow` is a full-width bordered row with a 176px label column, too wide for a 320px card.
  - **Seen (a business rule and a coordinate mismatch, all three):** the values line up on the right edge in Lines and Spacing; the long ones fit ("CM-SPECIES-OUTLIER", "388 km from its cluster"); the badge sits
    flush right. Lines reads as a table inside a card and costs the most height on a card that floats over the map; Spacing keeps the rhythm with the least. Recommendation: **Spacing**, which is also what the
    reference's own caption says (lines are overused where spacing does the job). Not chosen yet; the other two are deleted when one is (4.4).
  - **Clarity problems the options do not touch (proposed, not built):** (1) the card is titled with the species ("Grass Tree"), not with what is wrong, which is the sentence below it in secondary grey; the list row's title
    ("Cover abundance", "388 km from its cluster") is what was clicked. (2) For a coordinate mismatch the sentence and the Distance row say the same thing ("Location is 388 km from the typical cluster..." and
    "388 km from its cluster"), the restating 4.3 rules out. (3) "Rule" shows a code (BR-FLORA-COVER, CM-SPECIES-OUTLIER) that means nothing to a person; it is the prototype's (see `2026-10-23-28-*`). (4) Distance, the
    fact that matters most for a coordinate mismatch, is the last row.
  - **Checked (Playwright, a script outside the repo):** each option's insets (labels at 17px, values' right edge at 17px), row gaps (6, 0 with 1px rules, 12), rules (1px alpha between rows and none after the last),
    card heights; zero console errors; `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean. Typography QA (0.6 item 8): no new layer. **Not verified:** a restricted record's summary, other roles, the
    tool at 280px, touch.
  - **Not changed:** Explore's record peek card (the sibling, `record-peek-card.tsx`), which would take the choice once one is made.
  - **Open:** which option stays; whether the heading should lead with the problem; whether to drop the repeated distance; Explore's card. Not committed.

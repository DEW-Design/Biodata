# 2026-10-23 - Map visualise: an Other errors tab, and one alpha edge for what floats over the map

- **Oct 23 2026: Map visualise: an Other errors tab, and one alpha edge for what floats over the map.** The designer, on the card with 98 errors, 29 of them coordinate outliers: "there's 29 coordinate outliers and
  the rest are others. Why are these two not filters? We need affordances in place" (with a screenshot of the Affordance card: "when affordance is missing, users guess"). Asked which two were meant, the designer
  answered with the problem: "How do I know there's other outliers? It's so hard to decipher that just by looking at this", and, with a screenshot of the Alpha card ("an alpha border recedes into the surface
  beneath it. A solid hex sits on top"): "can we also use alphas to improve the consistency felt of the strokes?". Assumed: the first answer is the recommended reading of the question (a tab for each group), and
  "the strokes" are the strokes of the surfaces on the map, not every stroke in the product.
  - **Why the groups were not filters (before):** the card had one filter, the Outliers tab. "Coordinate outliers 29" and "Other errors 69" were headings in the All list, not controls, and the other 69 had no
    tab, so on opening All errors the first 29 rows were all outliers and nothing on screen said a second group existed (it starts at row 30, behind a "Show 25 more").
  - **Built: a third tab, Other errors (69).** The tabs are now a partition: All errors 98, Outliers 29, Other errors 69. It is the existing `Tab` (icon `FileX02`, which no other concept uses, a count, the
    same 14px 600 Barlow, hover, selected and focus states: measured, the third label has the size, weight and family of the others). The map follows the tab, as it did for Outliers: Other errors draws the 69 records
    and the key lists only "Other error". The headings stay in All errors as the marker of where one group ends and the other begins; they are labels, and the tabs are the controls (4.3: no second control for the
    same fact). When a dataset has no non-outlier errors the tab shows 0 and the list says "Every error in this dataset is a coordinate outlier."; the tab is always there, so a control keeps its treatment across states.
    Checked: Other errors shows "Show 25 more" (69 rows), Outliers "Show 4 more" (29), All keeps its heading; arrow keys move and wrap across the three, Enter keeps the choice; at 440px the three tabs fit; at 300px
    the strip scrolls under the existing fade (the third tab's icon shows at the edge).
  - **Built: one alpha edge for what floats over the map** (`app/pages/_shared/map-search/map-surface.ts`: `MAP_SURFACE_EDGE`, `MAP_SURFACE_RULE`). The edge was a solid `gray-200` (`border-secondary`); it is now
    `gray-950` at 12 per cent with `bg-clip-padding`, so the border is see-through and the map shows under it. Used by the Map visualise card and its record summary, Explore's search card and results card, the
    record summary card, the key and the zoom buttons (and the rule between the two zoom buttons, and the card's header divider). The border is still 1px, so nothing inside any card moved.
  - **Measured (rendered pixels, 2x):** the header divider on the card's white was rgb(229,228,226) and is rgb(227,227,227), within 2 on each channel, so what sits on white does not change. The change is the outer
    edge, where the map is under it: over the pale land (238,235,229) the edge was 229,228,226, a line lighter than the land, and is 210,207,202; over the sea (167,208,220) it was the same 229,228,226, a white
    line on blue, and is 148,183,194. The edge is now "a little darker than what is behind it" on both, where it was one grey that was pale on the sea and about the land's own value on the land.
  - **Not changed, and why (the strokes that are not the card's to set):**
    - The tab rule under the tabs (DEW `Tab`, solid `--ui-border-secondary`, 229,228,226), the badges' rings (DEW `Badge`, tinted per colour: neutral 195,217,223 for the count, 254,205,202 High, 254,223,137
      Medium) and the Show more button's ring (DEW `Button`, `rgba(16,24,40,.18)`, 212,213,216, a cool navy where the rest is warm). Changing them is a change to the design system, not to a call site (1.5, 1.9).
      The route to make every stroke consistent at once is the tokens: make `--ui-border-secondary` and the ring tokens alpha-based. That reaches every table, card and divider in the product and is the designer's to
      authorise; it is not done here.
    - **The scale bar** (Leaflet's `.leaflet-control-scale-line`: 2px solid rgb(119,119,119), 4.5 to 1 on white) is the heaviest stroke on the screen, on every map. It is a measuring line, not an edge, so 12 per
      cent would make it unreadable; a thinner line at a higher alpha is the candidate, in `globals.css`, for every map. Proposed, not changed.
    - Strokes that frame a map on a white page (`expandable-map.tsx`, the maps in `record-detail.tsx`) are not over a map and keep `border-secondary`.
  - **Open:** (1) whether the tab and the heading are enough, or the key's entries should also filter (not done: a second control for the same fact); (2) the token-level alpha strokes and the scale bar above;
    (3) a `Tab` icon list in 3.13 does not name the Explore error tabs (All errors, Outliers, now Other errors); say if it should. Typography QA (0.6 item 8): the new label is the Tab component's own text, no
    layer added. Checked: `npx tsc --noEmit`, `npx eslint` on the six touched files (both exit 0) and `npm run check:contracts` clean; zero console errors on Map visualise and Explore. Not verified: touch, Explore with
    results open (its record summary uses the same edge by the same constant and was not opened), a dark map style. Not committed.

# 2026-10-23 - Map visualise: rows lead with what differs, one grey for supporting lines

- **Oct 23 2026: Map visualise: rows lead with what differs, one grey for supporting lines.** The designer: "the typography hierarchy. It's a bloody mess. You see how the title is 14px and 12 px, they all look so
  optically imbalanced", then sent back the refined prompt (Goal: read cleanly with only existing type layers; Where: `dataset-error-map.tsx` and the shared `result-card.tsx`, "also Explore's own list"; "Open: which text, and
  which scope"). The two questions were not answered; the recommendation was taken as the default (rows, with the shared component changed), and is to be confirmed on sight.
  - **Measured before (Barlow, in the browser):** header: Back to report 14/600 gray-600, title 16/600 gray-900, dataset line 14/400 gray-600; tabs 14/600; counts and severity badges 12/600 uppercase; rows: title 14/500
    gray-900, subtitle 12/400 italic gray-600, meta 12/400 **gray-700**. Every size is on the design system's scale (16, 14, 12) and every weight in its 400 to 600; no off-scale text. Explore's own card has the same
    16/600 title, 14/600 button and 14/400 gray-600 help line, and its rows come from the same `ResultCard` with the same inverted greys (Golden Wattle 14/500 gray-900, Acacia pycnantha 12 italic gray-600, the
    publisher line 12 gray-700).
  - **What read as a mess:** (1) the row's headline was the species, the same words down all 98 rows, and what tells the rows apart (how far out, which field) was the smallest line; (2) the greys got darker going
    down (gray-900, gray-600, gray-700); (3) three weights at 14px (400, 500, 600), with the controls (tabs, back link, 600) heavier than the content (row titles, 500); (4) the severity badge (12/600, uppercase,
    coloured) is the loudest mark in a row. (1) and (2) are fixed; (3) and (4) are not (below).
  - **The sibling check that set the target (2.9 item 2):** the Projects list's row is 14/500 gray-900 over a 12/400 gray-600 description; Home's task rows are 16/500 over 14/400 gray-600 and 12/400 gray-600. So
    the app's list row is a medium primary line over supporting lines in 400, gray-600: 500 stays (not 600), and gray-700 on `ResultCard`'s meta was the exception.
  - **Changed:**
    - `result-card.tsx` (shared, 1.3): the meta line is `text-tertiary` (gray-600) like the subtitle, not `text-secondary`; a comment says why. Flows to Explore's list, re-measured: meta is now `rgb(112, 107, 104)`, the
      subtitle's grey. No other `text-xs text-secondary` line in `map-search` or `observations` (searched).
    - `dataset-error-map.tsx`: a row's slots are re-assigned, no component or layer restyled. Title (14/500): how far out a coordinate is ("388 km from its cluster", "382 km outside the project extent") or, for any
      other error, the field that failed ("Cover abundance", "Visit date"). Subtitle (12 italic): the scientific name, as before (italic for citation). Meta (12): the record and the common name ("REC0036 · Grass Tree").
      The rule code (BR-FLORA-COVER) is no longer in the row; it is in the record's summary card and the report.
  - **Not changed, and why:** the tabs and the back link are the design system's own `Tabs` and `Button` (1.9, 1.5), so the 600 weight and the uppercase count badges stay; the severity `Badge` is the design system's
    (out of scope as asked); the header matches Explore's own; no new size, weight or colour was introduced (2.9). So the chrome is still a step heavier than the row titles, and the badge is still the loudest thing
    in a row: lowering either needs a change to those components or to the 500 the app's lists use, which is the designer's.
  - **Typography QA (0.6 item 8), `/emil-typography` and `/emil-design-foundations`:** sizes trace to the scale; supporting lines 12px is the floor; gray-600 on white is 5.4:1 (WCAG formula), so the supporting lines pass
    4.5:1; the italic is a citation (a scientific name), not hierarchy; the uppercase badges carry 0.3px tracking; truncated titles open the full summary on click; no `text-md` or other dead class. **One finding left alone:**
    the design system's typography page lists Text xs as 12/18, while the rendered `text-xs` is 12/16 (measured, Tailwind's default; `globals.css` sets no override), a pre-existing docs-and-code drift.
  - **Open:** (1) whether the chrome weight and the badge should come down (above); (2) the rule code is out of the row: say if it should come back as the meta line; (3) a title is a field name for a non-outlier ("Cover abundance"),
    not a sentence, because the descriptions run to 160 characters; (4) whether this was the text and the scope meant. Not committed.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean; before and after measured in the browser for the Map visualise card (Barlow throughout, zero console errors) and for
    Explore's own row (search "Acacia"). **Not verified:** Explore's list with a species photo thumb (`thumb`, not on screen), a row with no subtitle, and the narrowest card width (280px). Not committed.

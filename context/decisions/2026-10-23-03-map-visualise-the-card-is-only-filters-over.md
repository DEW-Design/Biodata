# 2026-10-23 - Map visualise: the card is only filters over Explore's own card

- **Oct 23 2026: Map visualise: the card is only filters over Explore's own card.** The designer, with a screenshot of the Map visualise card: "this is what I'm expecting with the map bit. Remember, it's only filters
  not an entirely different surface." Built on `2026-10-23-02-*` (Map visualise opens Explore on the dataset), which the screenshot is almost exactly. Run through `/refine-prompt` (the design pass: Tabs are for
  "filtering the same content", a Badge is a count attached to another element, the Hover state explains the underlined link; the engineering pass: the list and the markers are derived state from one record set and the
  active tab).
  - **What differed, and what was done (`dataset-error-map.tsx`):**
    - "Search Explore" is gone from the card's header: the header is "Back to report" only. A second control that leaves for another mode is what made the card read as a separate surface. It stays in the card for
      a dataset with no errors (the only other exit there).
    - The "98 records with errors on the map" line is gone: the tabs' badges already say 98 and 29 (CONTRACTS 4.3), and the tabs now follow the divider directly.
    - "Show N more" is pinned to the foot of the list while there is more to show (sticky, centred, over the rows, with a wrapper that lets clicks through beside it) as a design system secondary `Button` with the
      `ChevronDown` icon. It was a text link at the end of the 25 rows, so it was found only by scrolling them. The count is the next batch, as Explore's own "Show N more" is. `ChevronDown` for "Show more" is
      added to the action icon table in CONTRACTS 3.12 (the clause says an action outside the set is added there), and the scoped rules regenerated (`npm run contracts:rules`).
  - **Unchanged on purpose:** the underline under "Back to report" in the screenshot is the `link-gray` button's hover state, so the link is as it was; the tab list, the rows (`ResultCard`), the legend, the record
    summary and Escape; the map, which already shows what the tab shows (measured: 98 markers on All errors, 29 on Outliers).
  - **Assumed, and where the screenshot and the contracts differ:**
    - The screenshot is read as the target look of this card, not as a request to rebuild Explore's search card with the dataset as a filter. If it was the second, this is the wrong build and the card would be
      Explore's own search with a dataset filter chip; say so.
    - The screenshot's tabs have no icons. They keep them: 3.13 requires an icon on every underline tab, the check exempts only Explore's own results tabs by file, and `dataset-error-map.tsx` is not on that list.
      Taking them off means either that exemption (a change to the check, a designer decision, 9.4) or an override.
    - The screenshot's "Show 29 More" is a pill with a capital M and no icon. The real `Button` is 8px rounded (it has no pill form, 1.5 and 1.9), with an icon (3.12), and "more" is lower case as Explore's is.
    - The screenshot's "29" is read as a mock number (the list shows the next 25, then the rest).
  - **Open:** (1) with "Search Explore" gone from the card, the ways out of this view are Back to report and the rail's Explore; a dataset filter that can be cleared in place (a chip) would be the filter-shaped exit
    and is not built; (2) the icons and the pill, above; (3) these files were being edited by another session minutes before (`dataset-error-map.tsx` 11:14, `observations-search.tsx` 11:07), so they were
    re-read before each edit and only three places were changed. Not committed.
  - **Verified, in a browser (Playwright, a script outside the repo):** the card at 1440 x 900 as BioData Admin and Registered User and at 1024 x 700 as BioData Admin: the header holds only "Back to report", the count
    line is gone, "Show 25 more" is inside the card and in view without scrolling, centred, 36px high, and a click reveals the next 25 (26 to 51 buttons); the Outliers tab shows 29 and the map's markers go from
    98 to 29; zero console errors; `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean (the first version of the button had no icon and would have failed 3.12). **Not verified:** a
    dataset with no errors (the card with "Search Explore" kept), the keyboard path to the pinned button (Tab from the last row), and a window shorter than 700px. Typography QA (0.6 item 8): no text was
    added; the button's text is the design system's own `sm` secondary, "Show N more" is Explore's existing copy. Not committed.

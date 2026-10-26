# 2026-10-23 - Data Validation Error Report: the errors by kind move into the card

- **Oct 23 2026: Data Validation Error Report: the errors by kind move into the card.** The designer, with a screenshot of the report (the gradient card, and under it three tiles: Business rule failures 54,
  Coordinate mismatch 29, Metadata mismatch 15): "Let's move business rule failure, coordinate mismatch and metadata mismatch into the gradient card, please and thank you."
  - **Clause overridden (0.1 item 2): CONTRACTS 4.6 item 4** ("a breakdown of those totals (species groups, errors by kind) is a row of `MetricTile`s under the card, an overview"), for the Data Validation Error
    Report only. It is not 1.4 or 9, so there is no entry in `contracts/overrides.json`, and one override is not a precedent: the clause's text is unchanged, and the Species Detail Report keeps its row of group
    tiles under its card.
  - **Built:** the three counts are facts of the card, after the totals they add up to: Ingested, Total records, Clean records, Records with errors, **Business rule failures, Coordinate mismatch, Metadata mismatch**.
    The row of tiles under the card is gone, so the toolbar follows the card directly. Same labels as the tiles had (`errorTilesFor`), the card's own label and value type; the tiles' icons are not carried (the card's
    facts have none, 2.12), and so is the `compact` variant of the tiles that the layout lab passed for its slim header (the slim header shows facts on a line already). `TILE_ICONS` and five imports went with them.
  - **Measured (BioData Super Admin, 1686px):** the seven facts on one row in the card with the right values for DS-2026-01003 (654 / 556 / 98, then 54 / 29 / 15; 54 + 29 + 15 = 98); no tiles in the page; no
    horizontal overflow at 1686, 1440, 1024 and 800px, and for Registered User; zero console errors; `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean.
  - **Known and not fixed:** the card's facts wrap as one flat list, so below about 1150px of card width they run to a second row wherever the room ends. At 800px that is four and three, which is the totals and the
    errors by kind (good); at 1024px it is five and two, so "Business rule failures" stays with the totals and the other two drop (not good). A fix is a change to the shared hero or `DataReport` facts (group the
    facts so a group wraps as a block), which reaches every report, so it is proposed and not done.
  - **Open:** (1) whether CONTRACTS 4.6 item 4 should be amended (this report as a named exception, or errors by kind in the card for every report) or the override left as a one-off, as 0.1 says by default;
    (2) the grouping fix above; (3) the same count of errors by kind is now in the card, while the category is also a filter attribute in the table's Filter and a column: the card says how many, the Filter narrows to
    them (it is not clickable). Typography QA (0.6 item 8): the labels and values are the card's own facts, no layer added. Not committed.

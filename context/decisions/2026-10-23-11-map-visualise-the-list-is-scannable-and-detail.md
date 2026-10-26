# 2026-10-23 - Map visualise: the list is scannable, and detail waits for the click

- **Oct 23 2026: Map visualise: the list is scannable, and detail waits for the click.** The designer: "On the Map visualise panel, can we please make sure we apply the scannability principle? Currently it's such
  a mess. Also, progressive disclosure." Applied as a standing test to the panel's list, since that is most of what is on it (`dataset-error-map.tsx`; one loosened prop on the shared `ResultCard`).
  - **Measured before (1440 x 900, BioData Admin, Flinders dataset):** a row was 76px, so 6 of the 98 errors were in view at once; 184px of the 703px card (26%) was above the list; the scientific name was on
    all 25 loaded rows (and "Grass Tree" in each row's last line), so the one thing true of every row was said on every row, in the line a person reads to tell rows apart; the row's marker was a grey category icon
    (a pin on each of the first 29 rows) while the map's dots, and its key, are red, orange and grey, so the list and the map did not match; All errors was one run of rows with nothing to show where the outliers
    stopped and the other errors began; and switching tab left the list scrolled to where the last one was left.
  - **Scannability, what changed:**
    - **A row says only what differs.** Title: how far a coordinate is out, or the field that failed (as before). Under it, the record, 12px (`REC0036`). The species is not on the row when every error in the dataset
      is on one species (it is the same everywhere: it is on the record's summary, on the map's label and in the summary card); when a dataset has more than one species the common name follows the record
      (`REC0017 · South Australian Blue Gum`; checked on DS-2026-01017). Rows are 60px (was 76): 8 in view (was 6). Nothing but the severity badge repeats down the list now, and that varies.
    - **The marker is the map's colour.** A 10px dot in the colour the record has on the map and in the key (red away from its cluster, orange outside the project extent, grey otherwise), in place of a grey
      icon. Measured: the row dots resolve to the key's two colours. The kind is also in the title's words, so colour is not the only signal. `ResultCard`'s `icon` is now optional (a `thumb` stands in for it); no
      caller is affected (types loosened, behaviour the same), and the category icons and their imports are gone from this file.
    - **Chunks.** In All errors a heading starts each of the two chunks: "Coordinate outliers 29" then "Other errors 69" (the record summary's eyebrow layer, 12/600 uppercase, wide tracking, quaternary; the count
      tabular). The Outliers tab, being one chunk, has none. Show more still goes to the first new row, or to the heading when the new set starts a chunk (checked: row 26 flush at the top after the first click,
      the second heading in its place later).
    - **A list starts at its top.** Switching tab now scrolls the list to its top (before, Outliers opened at the end of the list that had been scrolled).
  - **Progressive disclosure, what it is now:** the panel shows what is needed to choose a record (how bad, which record, what kind), and what is needed to understand it waits for the click: the summary card has the
    species in both names, the rule, the field, the description and the distance (checked, `COORDINATE MISMATCH, Grass Tree, Xanthorrhoea semiplana, ... Rule CM-OUT-OF-EXTENT`). The list itself is 25 rows and
    "Show more", the tabs narrow it to the outliers, and the key lists only the kinds that are on the map. The header, which it was not changed to hide, is the open item below.
  - **Open, not done:** (1) the 184px above the list: the header's two names with their ids and switchers are the part that could wait (the ids on a tooltip or in the switchers' lists, the project in the switcher), at
    the cost of the file and project no longer being readable at a glance: a decision about what a person needs to see without opening anything; (2) the severity badge sits just after each title, so its
    left edge moves with the title's length (the shared `ResultCard`'s own choice, so that the badge stays with the thing it qualifies): a fixed column would scan better by severity and would change Explore's list
    too; (3) a list that groups its chunks as collapsible sections (outliers open, the rest folded) would replace Show more and is a bigger change to the tabs the designer chose on 23 Oct; (4) the list has no selected
    row after a choice (raised in `2026-10-23-09-*`); (5) the new heading's quaternary colour is about 3.4:1 on white, the same as the summary card's eyebrow it is copied from (CONTRACTS 2.9 item 2), below the 4.5:1 the
    typography check wants: a pre-existing gap, now in one more place. Not committed.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean; zero console errors; in a browser as BioData Admin at 1440 x 900 on four datasets (DS-2026-01003, 01011, 01001,
    01017: single-species and multi-species, with and without more than 25 rows): row height, rows in view, headings, dot colours against the key, the scroll after Show more and after a tab change, and the summary's
    contents. **Not verified:** the Registered User's list (the same component), 1024px and 280px wide, and a restricted record's block (none in these datasets). Typography QA (0.6 item 8): the heading is an
    existing layer; no size, weight or family was added; the contrast item above is the one finding.

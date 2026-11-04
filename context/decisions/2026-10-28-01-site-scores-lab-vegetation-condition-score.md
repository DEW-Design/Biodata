# 2026-10-28 - Site scores lab: vegetation condition score

- **Oct 28 2026: Site scores lab: vegetation condition score.** The designer asked for a site's scores from DEW's Bushland Assessment
  (BAM) scoresheet on the site details page, as an exploration: Vegetation condition score and Conservation significance score as two
  sections (accordions), the vegetation condition score first. View shows the calculated score only; edit takes the scoresheet's purple
  (entered) cells. Sources: "BAM Site 42 - Copy.xlsx" (sheet "Site - Scores", Version - 1 September 2024) and its PDF. The DEW
  vegetation assessments page the designer linked was not read in this task; the workbook's formulas were the source.
  - **Built:** `/proto/site-scores` (lab, not product). The project page's real site record (Cleland Stringybark Woodland, its real
    sections through `SectionFields`), then "Vegetation condition score" (one row, Score) and "Conservation significance score" (a `Gap`:
    next). Edit opens the card with the edit treatment and the one Cancel / Save changes bar (4.8), laid out as Landscape context scores
    (`landscape-editor.tsx`): the score live on top with positive and negative attributes, a points pill per attribute, entered values as
    fields, worked-out values locked and tagged Calculated. The four tree attributes show only when the site is not treeless (4.3).
  - **The calculation** (`vegetation-condition.ts`) reproduces cells E13, E17, E27, H30, H42, H43 and H44. The benchmark thresholds of all
    175 BCM communities and the weed threat ratings of 405 weeds by BCM region are read out of the workbook into `bam-lookups.json`
    unchanged. Checked against the workbook's Site 4: 8.0, 1.5, 21 then 9, 17 then 14.0, positive 30.32, negative 14.00, score 25.01.
  - **Not entered on the scores sheet, so shown as Calculated:** the native species count (E11) and regenerating species count (E15),
    counted from the site's plant species list; each weed's threat rating, looked up by the block's BCM region.
  - **Sample data:** the scores are the workbook's Site 4 (EP 2 community, Northern Agricultural & Yorke Peninsula) attached to the
    Cleland site so the result can be checked against the PDF. They do not describe Cleland.
  - **Open, for the designer:** (1) where the species counts come from in the portal (the site's own occurrences, or entered), and whether
    a person may override them; (2) where BCM region lives (the scoresheet holds it on the Block; the lab fixes it); (3) whether Size of
    site and Vegetation association description belong in this section, since view shows only the score; (4) whether the score also shows
    on the section header so it reads without opening; (5) the maximum of each life form cover rating (the workbook sets none);
    (6) Conservation significance score, next. No options were built: the brief fixed the view, and the edit follows the sibling pattern.
  - Verified: tsc clean (stale `.next/types` entries for removed routes aside), eslint clean on the touched files, `check:contracts` OK,
    a live Playwright pass (view, edit, live recalculation, treeless switch, save; zero console errors; the score is Barlow 14px,
    tabular). Typography skills (0.6 item 8) not run. Not committed.
- **Oct 28 2026 (continued): how a score is worked out, conservation significance, the site's scores at the top.** The designer: "the
  view mode must show how the scores are calculated. think of a best way to trigger the scores view ... Continue with conservation
  significance score and finally we will show the scores for the site in the top."
  - **How a score is worked out** is one breakdown per score (`breakdowns.tsx`): the attributes as a basic table (4.2h) with what each was
    worked out from and its score, then the scoresheet's sums with the site's numbers in them. How it is reached is the lab's three options
    (`LayoutOptionSwitcher`): A inline under the score, B a popover from a "How it's worked out" link beside the score (the report
    Parameters `Popover`), C the same link opening a `Modal`. Measured at 1440 x 1000: the modal shows the whole breakdown without wrapping;
    the popover (560px) wraps the table's middle column and runs to the window's edge, scrolling inside; inline makes each open section about
    500px taller. Recommended: C, modal. Not decided.
  - **Conservation significance score** (`conservation-significance.ts`) reproduces N8, N17, N18, N27, N28 and N30: 1, plus the highest
    threatened community status ticked (the purple N3 to N7, checkboxes as in the workbook), plus the threatened flora and fauna points
    (counts by status from the species lists, weighted 1, 2.5, 5, 10, 20, then banded; fauna half of flora). Site 4: 1.00.
  - **The site's scores at the top**, as the scoresheet's "Total Scores for the Site" lists them: landscape context (the block's, 1.17),
    vegetation condition, conservation significance, unit biodiversity (the product, 29.26) and total biodiversity (x hectares, 585.20),
    with the products explained the same way as the sections.
  - **Rounding:** the workbook keeps each total as displayed (cached H42 is 30.32, not 30.315), so the next cell works from the rounded
    value; without this the total read 585.23 against the PDF's 585.20. Totals are now rounded to two decimals at H42, H43, H44 and N34.
  - **Open, for the designer:** (1) which option (recommended C); (2) with the scores at the top, each section's Score row repeats a figure
    the top already shows (4.3); the section could keep only its working; (3) the five community statuses are shortened from the
    scoresheet's wording ("State rare community" for "State (Provisional List of Threatened Ecosystems of SA) Rare community"), with the
    lists named once above them; (4) the landscape context score's home (the block in the workbook; the project page has it on Community
    and Non-biotic observations).
  - Verified: tsc and eslint clean, `check:contracts` OK, a live pass of all three options (each opens, Escape closes it, the popover
    and modal are Barlow, zero console errors), and the conservation edit (two statuses ticked scores the higher, 0.35, and the top updates
    to 1.35 and 39.50). Typography skills not run. Not committed.
- **Oct 29 2026 (continued): inline chosen; only what was provided; every row opens its field.** The designer: "lets work on inline ...
  only show the scores where the value was provided and the rest shall be hidden. each of those rows shall be editable which will take
  the user to the edit view."
  - Inline (option A) is now the lab's default. Popover and modal are still on the Layout tool: retiring them (4.4) is for the designer
    to confirm (0.4).
  - A breakdown lists only the attributes that were provided: a tree attribute, the biomass or canopy score with nothing entered, life
    forms with no rating, weeds with no species, a community with no status ticked have no row; species diversity and regeneration show
    once a BCM community is chosen (their counts come from the species list). The sums drop the same terms where that does not change
    the arithmetic (a missing attribute is 0): "(8.0 + 1.5 + 14.0) = 23.50" and "(10 - 3)²", not "+ 0.0" and "- 0".
  - Each row opens the edit view at its own field (4.8 item 1): the whole row is the target (`Row onAction`, so Enter works), a pencil
    shows on hover and focus, and the edit view scrolls to the field, flashes it (`flashElement`) and focuses its first control, or the
    row itself where it has none (threatened flora and fauna are worked out).
  - Open: (1) a missing attribute still counts as 0, so hiding it hides why a score is low: with trees and no canopy cover entered the
    negative attributes are (10 - 3)² / 2 = 24.5 of the 30.50, and nothing on the view says canopy cover is missing; (2) retiring the
    popover and modal options.
  - Verified: tsc and eslint clean, a live pass (the designer's state reproduced: 14.54 with no tree rows and no zero terms; a click on
    Weeds and Enter on Threatened flora each open the edit view focused on that row; zero console errors). Not committed.

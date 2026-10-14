# 2026-10-14 - Newsletter option 10: opportunity areas three across, two rows

- **Oct 14 2026: Newsletter option 10: opportunity areas three across, two rows.** Follows `2026-10-14-07`. The designer: "I think the three column bit was nicer." Read as way out (c) of that entry: the opportunity areas in three columns, two rows, instead of five across with the sixth alone on a row.
  - **Changed:** `TopInfographic` takes `opportunityColumns` (3, 5 or 6; 6 stays the default, so options 7 to 9 are unchanged); option 10 passes 3. The five-column gap and the flush bands are kept.
  - **Result:** two rows of three, every cell filled, each tile about 280px wide so its text runs three or four lines instead of seven. The infographic's opportunity band is shorter by about 120px; option 10 is **1,622px** tall at 960px (it was 1,742px; option 9 is 1,678px).
  - **What no longer lines up, said plainly:** the opportunity areas are the one band that does not stand on the five column lines. The tracker, the problems, the tracking callouts, the team and the links still do (stage columns at 380, 559, 737 and 916px, the same as the problems).
  - **Verified (Playwright, port 3001):** 960px wide, no overflow at 390, zero console errors; the 1040px infographic route unchanged (762px tall); `tsc`, `eslint`, `check:contracts`.
  - **Open:** (1) if "the three column bit" meant something else (the three-across problems at email width, or the three-across team), say which. (2) Which of 7 to 10 is carried forward. Not committed, not pushed.

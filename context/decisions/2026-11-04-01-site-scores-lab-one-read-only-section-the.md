# 2026-11-04 - Site scores lab: one read-only section, the vegetation score opens the scoresheet

- **Nov 4 2026: Site scores lab: one read-only section, the vegetation score opens the scoresheet.** The designer, for the business team, with a
  screenshot of the workbook's "Vegetation Condition Scores" block: the page "has become very distracting with the scores taking the first place";
  show the scores under a single accordion, the summary first and then the scores; they are generated from the other records, not entered; "on
  click of the score we show the exact same things on excel." Lab first.
  - **Built:** option D, "One section", on `/proto/site-scores` (`?option=section`). No site scores block above the sections and no Edit button. One
    accordion section, "Site scores", after the site's own sections: the summary (the five figures and how the two products are worked out, the
    same components as the product's top block), then two rows, Vegetation condition score and Conservation significance score. The vegetation
    score is a link-style button; it opens a modal, "Vegetation condition scores", with the scoresheet block (`app/proto/site-scores/scoresheet.tsx`).
  - **The scoresheet** follows the workbook's block in order and wording: the site's facts; Benchmarked attributes (species and regeneration
    counts and scores, the top five weeds with cover, threat and C x I and the Cover x threat total, the native plant life forms with their Total,
    each score with its maximum and its hint); Non-benchmarked attributes; the calculation with its formulas; then each attribute against its
    maximum on Low, Medium and High. Built from the design system (2.5): label and value rows, two basic tables (4.2h), no purple cells. The two
    tables sit side by side from a 64rem container and stack below it, because at 48rem the weeds table overflowed its box by 14px.
  - **Open, for the designer:** (1) the summary repeats the vegetation and conservation figures that the two rows under it show (4.3); (2) whether
    the conservation score opens its own scoresheet block too; (3) a modal, or a full-width panel; (4) the chart's attributes past Weed score are
    inferred, as the screenshot cuts it off; (5) the workbook's capitals are in sentence case; (6) folding into the project page waits for the lab
    to be approved; (7) still open from before: where the species counts, BCM region and landscape context score come from, retiring options B and
    C, and the unexplained "x 1.29".
  - Verified: tsc and eslint clean, `check:contracts` OK. Live in Chrome as the Public user: the section opens by default, the modal opens on the
    score and shows 10, 8.0, 1.5, 21, 9.0, 17, 14.0, 30.32, 14.00 and 25.01 as the workbook's Site 4; no sideways overflow in either table or the
    modal; Escape closes it and focus returns to the score; zero console errors. Other roles and a narrow window not checked. Not committed.
- **Nov 4 2026 (continued): the conservation significance score opens its scoresheet, to edit.** The designer, with a screenshot of the workbook's
  "Conservation Significance Score" block: "lets work on the conservation score but this will be editable fields."
  - **Built:** on option D the conservation score is a link like the vegetation score. It opens the design system's `FormModal` (large),
    "Conservation significance score", with the block in the workbook's order and words (`ConservationScoresheet`, `app/proto/site-scores/scoresheet.tsx`):
    the threatened community question as five ticks with their points and the Threatened community score; threatened flora and potential habitat for
    threatened fauna, five counts each as number fields with their weights, the weighted total with the bands, and the flora and fauna scores; then the
    Conservation significance score. Everything updates as it is entered; Save changes updates the record and the summary, Cancel leaves it as it was.
  - **Changed by the instruction:** the ten species counts were worked out from the site's species lists (2026-10-28); they are now entered here, starting
    from what the lists give. The workbook's "all sites will score a minimum ... of 1" note is left out, as the same note was removed on 2 Nov.
  - **Open, for the designer:** (1) whether the counts stay worked out from the species lists and only the ticks are entered (the workbook's purple cells
    are the ticks only); (2) the modal does not ask before discarding changes (`FormModal` has no prompt; 4.1 item 6 asks for one); (3) who may edit: the lab
    lets every role, the Public user included; (4) options A to C still edit through the old section editor.
  - Verified: tsc and eslint clean, `check:contracts` OK. Live in Chrome: State endangered and Nationally vulnerable ticked gives 1.35 (only the highest
    counts), one nationally vulnerable flora species gives a weighted 10 and 0.16, the score 1.51; saved, the summary reads 44.19 and 883.80 (25.01 x 1.17 x
    1.51, x 20 ha); no sideways overflow; zero console errors. Keyboard through the fields and other roles not checked. Not committed.
- **Nov 4 2026 (continued): the project page reverted; the lab keeps option D only.** The designer: "revert changes we made on the projects page. We
  will confirm the version on the proto and then push to the main project pages. On the proto just leave the option 4 and remove the rest."
  - **Reverted:** the fold of 2 Nov (`2026-11-02-02-*`) is undone. `card-editor.tsx`, `field-visibility-store.ts`, `record-full-view.tsx`,
    `record-panel.tsx`, `records-explorer.tsx` and `survey-data.ts` are back to the last commit, and so is `production-routes.ts` (the lab is no longer
    "In production"). That includes the panel edit's Expand button carrying the edit into full screen (2 Nov), which was part of the same change. The diff
    is kept outside the repo, in the session's scratchpad, as `project-page-scores-fold.diff`.
  - **Moved back into the lab:** the scoring (`vegetation-condition.ts`, `conservation-significance.ts`, `bam-lookups.json`) and the summary
    (`summary.tsx`, cut from `site-scores-view.tsx` to the figures and the two products) are in `app/proto/site-scores`, so nothing in product reads them.
    Site 4's values are in the lab's page.
  - **Removed:** options A to C, the Layout switcher, the section editors (`site-scores-editor.tsx`), the breakdowns and `explained.tsx`. The lab is D
    alone: one Site scores section, the vegetation score opening its scoresheet read only, the conservation score opening its scoresheet to edit.
  - Verified: tsc and eslint clean, `check:contracts` OK, nothing under `app/pages`, `lib`, `components` or `config` refers to the lab's files. Live: the
    lab renders, the vegetation sheet shows 30.32, the conservation sheet has its 15 fields, the project page has no site scores, zero console errors on
    both. Not committed.

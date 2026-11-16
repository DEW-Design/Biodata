# 2026-11-11 - Scoresheets group each scored item

- **Nov 11 2026: Scoresheets group each scored item.**
  - Designer, with screenshots of the Conservation significance and Landscape context scoresheets: "there is no clear distinction between each scored items, everything is together. Use proper law of proximity and visual hierarchies."
  - New `ScoreGroup` (`site-scores/scoresheet.tsx`): one bordered group per scored item (`rounded-lg border border-secondary`, the same box as the sheet's tables), its heading at the top, what goes into it in the middle, and its score closing it under a divider. Groups sit 16px apart; rows inside a group have no gap, so proximity says what belongs together.
  - Used by every factor of `LandscapeScoresheet` (remaining, cover, protected, block shape, wetland) and every part of `ConservationScoresheet` (community, flora, fauna). The total stays the only filled box (`bg-secondary`), set 8px further below the last group so it reads as the result of all of them.
  - No wording, order, bands or scoring changed. The vegetation condition sheet is not touched (not asked). Lab option A at `/proto/score-sheets` shows the change, as it renders these components.
  - Verified: tsc, eslint, check:contracts clean; live in Chrome, both sheets as BioData User, 3 conservation groups and 5 landscape groups, radius 8px, no console errors. Not run: the emil typography and design-foundations QA, keyboard pass, read-only (public user) view.
  - Open: the "Threatened community score" still adds the minimum of 1 (reads 1.00 with nothing ticked), as raised in 2026-11-11-01.

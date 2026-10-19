# 2026-10-19 - Post-6-oct lab: flagged concepts a chip beside the title, system notices a summary row that opens into a list

- **Oct 19 2026: Post-6-oct lab: flagged concepts a chip beside the title, system notices a summary row that opens into a list.**
  The designer, on the notices strip (flagged concepts row above the upload row, both Flinders Violet): "Flagged concept would sit
  separate. Also, we'll need to handle stacking more than 1 banner / system notifs. Give me some options." Options were laid out
  (flagged: A its own strip, B a chip beside the title, C a tab badge; notices: 1 a capped stack, 2 a summary row that opens in place,
  3 a pager) and the designer chose **B** and **2**. Lab only (CONTRACTS 5.4); `/pages` is unchanged.
  - **Flagged concepts (B):** a `Button` (secondary, small, `Flag01`, "7 flagged") beside the project's title in the lab's header
    (`FlaggedConceptsChip`, `project-notices.tsx`, placed by `ProjectHeader` in `project-workspace.tsx`). Shown only to the roles that
    review them (`useCanReview`) and only while one is open; it opens the flagged concepts, as the strip's row did. It is on every tab,
    since the header is.
  - **System notices (2):** none draws nothing; one is drawn as itself (the frame's single banner row); two or more are one summary
    row, "N notices need attention", carrying the icon and colour of the worst of them, which opens in place to the list, one row per
    notice, each opening its dataset. The summary ends in a down chevron that turns over while open (`aria-expanded`); the rows end in
    the right chevron as before. Open or shut is kept by the page (`noticesOpen` in `Views`), so moving between tabs, where the rows are
    drawn in a different place, does not shut it. It starts shut.
  - **Where the notices come from changed:** a notice is now one dataset of the project whose run has ended in a failure or with rows
    that could not be placed, read from `useProjectDatasets` (the Datasets view's own list), not only the latest upload. So Adelaide
    Hills shows its two sample uploads (one failed, one partly added) as two notices without an upload being made, and an upload made
    here joins them. Worst first (failed, then partly added), newest first within each. Wording and icons are unchanged.
  - **Not decided, for the designer:** (1) whether an old sample or past upload that is still failed or partly added should keep a notice,
    or only uploads made in the current session; today they all do, which is what makes the stack visible. (2) Whether the summary should
    say what is in it ("1 failed, 1 partly added") rather than a count. (3) Whether the list should start open when a notice is a failure.
    (4) The frame draws one banner only, so the summary row and the list rows are this lab's, not Figma's.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean. The notice logic was run against the
    real sample datasets (`viewAt` at the end of each run): the failed upload and the partly added one come out as notices, the
    successful one does not. **Not verified:** a live browser pass of the chip, the summary row, its open state and the three tab
    layouts, because no browser tool was available in this session. Typography QA (0.6 item 8) not run: no new text layer (the chip
    is the `Button` as it stands, the rows are the existing `NoticeRow`). Sibling grep: `ProjectNotices` and `onGoToFlagged` are used
    only in `project-workspace.tsx`. Not committed.

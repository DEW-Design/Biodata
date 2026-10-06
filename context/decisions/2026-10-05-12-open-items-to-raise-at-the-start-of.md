# 2026-10-05 - Open items to raise at the start of the next session

- **Oct 5 2026: everything left undecided from the Reports build and the Pages tool, in one place. From the designer: "Log open items into a decision and surface them the next time we work on stuff."** The first move of the next session is to read this list back and ask which to settle (0.7 item 4). Nothing here was built; each item names what it needs.
  - **Where the work stands:** pushed to `sai-wips` at `07e9274` (5 Oct 2026). The branch shows "1 commit behind main"; that commit is Mohan's PR merge (`29f2230`) and adds no files, so the designer chose to leave it (merging would be one empty commit, 5.6).
  - **Pages tool (decisions `2026-10-05-03`, `-09`, `-10`, `-11`):**
    1. Delete the lab `/proto/site-map` (the bar now has the panel; 4.4 says the losing options go once a direction is chosen). Recommended: delete. Its data now lives in `app/_prototype-tools/pages-map-data.ts`, so nothing else depends on the lab.
    2. Add a line to CONTRACTS 3.8: the role and the Pages tool are always on the bar, other tools are added by the code that owns them. A contract change (9.4), so it needs approval; then `npm run contracts:rules`.
    3. Add an `AUTO` check that every `app/pages/**/page.tsx` route is in `app/pages/_shared/screen-index.ts`, so the map cannot go stale. Edits `scripts/check-contracts.mjs`, a governance change (9.4), so it needs approval.
    4. The Sign in screens (10) are open to Everyone, so they show for signed-in personas. Hide them for signed-in personas? Recommended: yes.
    5. Registered User, BioData User, Privileged Admin and Privileged User all show 43 pages, because the index and the role-access matrix do not tell them apart, so switching between them looks like nothing happens. What should each get?
    6. Is the persona line at the foot of the panel ("43 pages" and the persona's name, opening a menu with each persona's count) inviting enough, or should switching be more visible?
    7. Should `/proto` labs appear in the tree (development only, through `labHref`, 5.4)?
    8. Not yet done on the panel: the Emil typography pass, a keyboard-only pass of the tree and the persona menu, narrow windows, and the Privileged and BioData User personas by eye.
  - **Reports (decisions `2026-10-01-06` to `-26`):**
    9. The three category names on the Reports landing (Uploads, Specimens and restrictions, Project data) are placeholders for the designer's wording.
    10. Remember a person's column choice per report (it resets on reload today).
    11. Export CSV exists on four reports; five have no export in the wireframes. Add one to each, or leave them without?
    12. Not verified: drag-to-reorder in the column chooser with a real mouse (only keyboard drag was checked), narrow widths, and the privileged roles on the reports.
  - **Older open threads still on the log:** the Add Project questions for the business team (`2026-10-02-26`), and the other "Open" lines inside the decision files named above.
  - Not committed.

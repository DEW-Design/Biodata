# 2026-10-19 - Post-6-oct lab: the other layouts, the flat rail and the other top rights are retired

- **Oct 19 2026: Post-6-oct lab: the other layouts, the flat rail and the other top rights are retired.** The designer, on a screenshot of the Prototype tools bar (Pages, Layout "Option 2", Upload
  result, Rail "Nested", Top right "Production", Viewing as): "let's retire the other options, rail and top right bits. We've chosen a direction. No need to roll into production just yet." This is
  CONTRACTS 4.4 ("when a direction is chosen the others are deleted"), after `2026-10-19-33-*` made the chosen combination the base and left the alternatives standing until the designer said.
  - **The direction kept:** no tabs; the account at the top left with the notifications at the right of the name; in the page's column the left panel's switch, a divider and the trail; at the far
    right the production header's own search field and Add button; the nested rail with the logo and Help at its foot; the panel's bar holding only a page's own things (the user alert at its
    left; a project's buttons or a section's actions at its right, the bar not drawn when there is nothing for it); the project's records tree, properties and copy link as a pill.
  - **Retired, and gone from the code:** the **Layout** tool and option 1 (the tab strip, the account row with Add beside it, Search at the top of the rail, the chip beside the title) and option 2,
    alt; the **Rail** tool and the flat rail; the **Top right** tool and its versions (current, icons, centred search, capsule, add last) with their pieces (`TabStrip`, `AddMenu`,
    `SearchPill`, `SearchIconButton`, `Capsule`, `CapsuleDivider`, `BarDivider`, the avatar-only and name-at-the-right account button, the centred slot of the top row, `FlaggedConceptsChip`,
    the rail's "..." Open in new tab menu, the bell's `compact` and `alignEnd`), the `?layout`, `?rail` and `?cluster` parameters (`params.ts` is deleted), and the tab state: the shell now keeps one
    page, with the records tree and properties as two flags. `shell.tsx` went from 1,461 lines to 823. The Prototype tools bar now has Pages, Upload result (where there is an upload to preview) and
    Viewing as.
  - **Kept, though nothing reaches it:** the lab's own Search page (`search-page.tsx`, and `searchPage` in `pages.ts`): the top right is production's search, which goes to the production Explore
    page, and the rail no longer has a search pill, so the lab's page has no way in. It is not deleted because it is explored work and no one asked; say so and it goes.
  - **Behaviour that changed with it, for the designer to know:** a Cmd or Ctrl click on a link is the browser's own and opens the production page in a new browser tab (there are no tabs to open it
    in); the rail has no "..." menu.
  - **Not rolled into production:** nothing in this change touches a production file. `git diff` outside `app/proto` is `project-tab.tsx` (the four opt-in switches, left as the one exception, see `-33-`)
    and the 2.13 clause with its generated rule files.
  - **Backup:** the lab as it stood immediately before this change is in `.context/post-6-oct-explorations-2026-10-19/before-retiring-options/`; the earlier copy, from before the production files were
    moved out, is beside it. Both are in the workspace's ignored folder, not in git, and the work is still uncommitted, so they and the working tree are the only copies.
  - **Open:** (1) the lab's Search page, above; (2) `project-tab.tsx`'s switches; (3) the bell sits at the right of the name in a 270px cell, so with a long name it is the name that truncates; (4) the
    contracts and rules changes of today (2.13) and all of this are uncommitted.
  - **Verified:** `npx tsc --noEmit`, `npx eslint app/proto/post-6-oct` and `npm run check:contracts` clean; the lab serves (200) for the Super Admin, the Registered User and the signed out visitor, and a
    production project page serves (200). **Not verified:** that anything behaves as before in a browser (no browser tool was available): the top row and the panel's bar for a project, a section with
    and without actions, and each role; the collapsed column with the bell; the rail without its menu; links opening in the lab and Cmd-click out of it. This was a large removal made without a live
    look, so it should be looked at before the next exploration is built on it. Typography QA (0.6 item 8) not run: no text added. Not committed.

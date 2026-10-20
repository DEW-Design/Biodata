# 2026-10-20 - Post-6-oct lab: list sheets are concentric with the panel

- **Oct 20 2026: Post-6-oct lab: list sheets are concentric with the panel.** Designer, on a screenshot of the Projects list's bottom-left corner
  ("have we resolved the inner / outer radii bits? Doesn't look resolved to me"). It was not: `2026-10-19-16-*` wrote the rule (CONTRACTS 2.13) and
  left the screens alone, with three options open. Measured on Projects before the change: panel 16px, sheet 12px, 25px between their corners,
  so by the rule the sheet's corner should have been 0.
  - **Decision (designer, asked options a, b and c of `2026-10-19-16-*`):** "Inset the sheet 4px", option (b): the sheet sits 4px from the
    panel's edge, so its corner is the panel's 16px less 4px = 12px, which is the sheet's own radius (a shared `Table` card, so the frame changes, not
    the component).
  - **What changed:** `shell.tsx`, the section `main` only. Every list's sheet is a direct child of the lists' shared body (`flex-col p-6`), and
    that child gets `-mx-[21px] -mb-[21px]` (24px of padding plus the panel's 1px border, less 4px). The list's header, tabs and toolbar keep their 24px
    inset; only the sheet widens to 4px from the left, right and bottom. No shared component changed, so production is untouched. The selector is
    a lab-side override of the lists' shared body, noted in the code; a list that is not built from that body is not covered.
  - **Verified (live, 1708 x 1024, Super Admin, zero console errors):** Projects, DLA, DSA, Sensitive Nominations, Template Finder, User Management,
    Taxonomy, Notification Management and Controlled Vocabulary all measure panel 16px, sheet 12px, 4px at the left, right and bottom, and `main`
    does not gain a scroll. `tsc`, `eslint` on `shell.tsx` and `check:contracts` clean. Home, Explore, Reports and Voucher Management have no rounded box
    at a bottom corner, so there is nothing to match.
  - **Still not resolved (found by the same sweep):** the project page. Its cards sit 25px from the panel's bottom corners at 12px radius (Overview,
    Project records, Species), the same break. It is the lab's own `main` (`px-6 pb-6`) holding the shared project page, and a 4px inset there would
    pull the whole page's alignment out, so it was not changed without asking. Options: (1) inset the cards 4px at the bottom corners only, (2) square
    the bottom cards' outer corners, (3) a 4px page inset throughout. The restrictions card and cards inside sheets (12px inside a 12px sheet at 24px)
    are also unswept. The wider sweep of the rest of the app is still open.

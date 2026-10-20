# 2026-10-19 - Post-6-oct lab: option 2 has no tabs, the top row carries the page's trail, and a page's controls stay in the panel's bar

- **Oct 19 2026: Post-6-oct lab: option 2 has no tabs, the top row carries the page's trail, and a page's controls stay in the panel's bar.** The
  designer, after the answer to "does having tabs make sense" (`2026-10-19-23-*`, where the larger option was no open-page tabs) and the question of
  folding a project's buttons into the top strip: "Let the tabs go on option 2. Let's keep the global tools separate to the strip on the project pages."
  Read as: option 2 drops the open-page tabs; and the project's buttons are not folded into the top row, the global tools being the only thing at its
  right. Option 1 is unchanged, with its tabs.
  - **Option 2's top row (`TopBar`, `shell.tsx`, `?layout=2`):** the left panel's switch, a divider, the trail that says where you are (the job the active
    tab did), and at the far right the global tools (Search, Add, the notifications). The trail is the page's own, kept in one place for both layouts
    (`projectCrumbs`, `searchCrumbs`, `sectionCrumbs`): Home for Home; Home > <section> for a section; Home > Search; Home > Projects (the project
    switcher) > <name> and the favourite star for a project. In option 1 the same trail is in the panel's bar, as it was.
  - **The panel's bar in option 2 holds a page's controls only, and the trail is not in it:** a project's buttons (the "+", the upload, the records tree,
    Copy link, Properties, "...") at its right on a project page; a section's actions at its right, drawn only for a section that has some
    (`hasSectionActions`); no bar on Home, on a section with none, or on Search. This reverses the part of `2026-10-19-23-*` that dropped the section
    trail because the tab named the page: with no tab, the trail is back, in the top row.
  - **No tabs means no new tabs (option 2 only):** a page asked for goes in the one place (`openTab` and the Search button go to it); the rail's "..."
    menu, whose one action was Open in new tab, is not drawn (`RailContext.openTab` and `RailRow` `onNewTab` are optional); a Cmd or Ctrl click on a
    link is left to the browser, so it opens in a new browser tab, which in the lab is the production page and not the lab. The behaviours added in
    `2026-10-19-23-*` (an open page brought forward, a middle click closing) belong to the tabs and so are option 1's.
  - **Built with:** the existing parts: `PanelToggle` (cut out of `TabStrip`, so the two share it), `TopBar`, the existing crumbs, `SearchPill`, `AddMenu`,
    `NotificationsBell`. No new component and nothing restyled.
  - **Open:** (1) on a project page the panel's bar now has its buttons at the right and nothing at the left, a 40px row that is mostly empty; the page's
    own views or the star could sit there, or the buttons could join the trail row, which the designer ruled out; (2) the open-pages feature is gone in
    option 2 (people can still open pages in browser tabs, which lose the lab's frame); a "Recent" list in the account menu or the Search page is the
    usual replacement and was not built; (3) the trail on a narrow window shortens the project name first (it truncates), the tools never; (4) the
    Cmd-click opening the production page, not the lab, is a rough edge of lab mode, not of the design.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `nested-rail.tsx` and `npm run check:contracts` clean. **Not verified:** how option 2
    looks now (the top row with the trail and the tools on Home, a section and a project; the bar under it on a project, a section with actions and one
    without; the rail without its "..." menu; clicking Search from the top right), because no browser tool was available. Typography QA (0.6 item 8) not
    run: no text added; the trail is the one that was in the bar. Not committed.

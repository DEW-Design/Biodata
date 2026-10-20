# 2026-10-19 - Post-6-oct lab: the lab opens as option 2 with the production top right, the bell at the top left, and the project buttons in a pill

- **Oct 19 2026: Post-6-oct lab: the lab opens as option 2 with the production top right, the bell at the top left, and the project buttons in a pill.** Page feedback from the
  designer on `/proto/post-6-oct?...&layout=2&rail=nested&cluster=production`, on the "Project" group of the panel bar's buttons: "What if this was a pill? I liked the pill
  exploration we did on the top right section. Also, let's keep the top right same as production. Let's move the notifications to the right of the name on top left. So let's go
  option 2 layout, rail = nested, top right = production."
  - **The project's buttons are a pill (`ProjectBarControls`, `barSegment`):** the records tree, Copy link and Properties are one bordered round box, 24px tall like the round
    buttons beside it, with a hairline between three 32px segments. The segments have no fill or border of their own; the pill clips their hover fill to its round ends, and the
    focus outline is drawn inside. The tree and Properties keep their "on" fill (`aria-pressed`). The hairlines that stood between the bar's groups
    (`2026-10-19-11-*`) are gone: the pill sets its group apart on its own and a line beside a bordered pill doubled it. The "+" with the upload, and the "...", stay round
    buttons. The pill's radius and its segments' clipped ends are all round (2.13).
  - **The top right is production's:** the `production` version of `2026-10-19-30-*`: the real `GlobalSearch`, `CreateMenu` and, in the alt, `ProfileMenu`. Production's
    header has no notifications, so the bell moves: in option 2 it is at the right of the name at the top left, at the right of the 270px cell, where it sat in option 1
    (`AccountRow` `bellAfterName`); with the panel collapsed it is the first button of the icon column (`CompactColumn` `bellOnly`); in the alt, where the name is at the
    right, it is just before the profile. Its popover opens under it, left edge on its own, as it did at the top left.
  - **The opening view:** the lab now opens as option 2, the nested rail, and the production top right when the address names none (`page.tsx`, `PostSixOctShell`
    defaults). **Nothing was removed:** option 1, option 2, alt, and the other five versions of the top right are still on the Prototype tools bar, because deleting an explored
    option is the designer's decision to make (0.4, 4.4), and "let's go" was read as the starting point, not the retirement. Say the word and they go.
  - **Open:** (1) whether to retire the other layouts and top rights now; (2) `production` is the real header's search at 395px and its Add, so the bell's new place is the
    only one of the row's controls not production's; (3) the pill's 32px segments are wider than the circles they replace (96px against 3 x 24px and their gaps), a few pixels
    more than the group took; (4) the hairline dividers are removed everywhere in the bar, including the one the designer asked for, because the pill replaces what they were doing;
    if the designer still wants a line between "+" and the pill, it is one element.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the four files and `npm run check:contracts` clean; the lab serves (200) at its bare address, now option 2. **Not verified:** how
    it looks (the pill's height against its neighbours and its segments' hover and on states, the bell beside the name and its popover from there, the bell in the collapsed column,
    the real search and Add in the 56px row), because no browser tool was available. Typography QA (0.6 item 8) not run: no text added. Not committed.

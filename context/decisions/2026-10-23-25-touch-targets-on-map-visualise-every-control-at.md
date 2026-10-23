# 2026-10-23 - Touch targets on Map visualise: every control at 40px or more, most at 44

- **Oct 23 2026: Touch targets on Map visualise: every control at 40px or more, most at 44.** The designer: "Improve touch targets, please. /emil-ui-polish". The skill's rule (`/emil-ui-polish`, hit areas): 44 by 44px for touch, at least
  40 by 40 on desktop; extend a small control with a pseudo-element; two targets must never overlap, so where an extension would collide it is shrunk to the largest size that does not. Assumed: the screen is the Map visualise
  card and the map controls around it (the work of this session), not the shared header and rail.
  - **Audit (measured, 1686px; a target is the box plus its `::before` where one bleeds past it):** back link 245 by 20; Hide list 74 by 20; the tabs 32 tall; Show more 36 tall; zoom in and out 36 by 36; the summary's close
    button 44 by 44 (already extended); list rows 60 tall; a map dot 12 by 12.
  - **Changed, with no change to how anything looks except the zoom buttons:**
    - **Tabs: 32 to 44** (`before:-top-1.5 before:-bottom-2`: 6px above and below; `-bottom-2` because a `::before` is placed from the padding box, 2px inside the tab's bottom border, which first gave 42). The strip
      scrolls (`ScrollFade`), and a target that bled past its box would add vertical scroll, so the extension sits inside the strip's own padding (`pb-1.5` added, the list's `mt-2` made `mt-0.5`: the gap to the list is
      the same 8px).
    - **Show more: 36 to 44** (4px above and below; it floats over the list's rows by design, so it already sits over them).
    - **Back link and Hide list: 20 to 40.** They are two rows apart (12px, before), so each could take only part of the gap. The gap is now 16 (the header's top padding 16, the same as the space above the back link and below
      the project line: one rhythm), the back link takes 12 above (card padding) and 8 below, Hide list 8 above and 12 below (a title line with nothing to tap). 44 would need a 24px gap; 40 meets the desktop minimum.
    - **Zoom buttons: 36 to 44** (`size-11`, icons `size-5`). They are stacked edge to edge, so a smaller button cannot be extended without the two targets touching, and the group's `overflow-hidden` (for its corners)
      would clip an extension, so the buttons are the target. This is the one visible change; `MapZoomButtons` is shared, so Explore's two layouts take it too: measured the group is 46 by 90 (with its border), clear of
      every card on both, 16px and 31px from the right edge.
  - **Verified by tapping, not just by measuring (Playwright, a script outside the repo):** a tap 5px above a tab selects it, 4px below another selects that one; 6px above Hide list folds the list, 9px below Show list opens it;
    9px above the card's back link opens the report on this dataset (hit-tested from 11px above to 7px below its text); 3px below Show more shows the next 25. No two extended targets overlap. (An earlier run of the back-link
    test picked up the header's breadcrumb link, not the card's; found and redone scoped to the card.) Zero console errors; `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean.
  - **Not changed, and why:**
    - **The map's dots (12 by 12).** They sit close together (the Adelaide cluster), so a bigger hit area would make neighbouring dots collide; the list is the touch path: its rows are 60px tall, and choosing one pans the
      map to its dot and opens its summary.
    - **The shared header and rail** (outside this screen, the same on every one, 3.4): measured in the header, the breadcrumb links are 20px tall, Add 36 and the profile button 40. The rail's icons were not measured. Proposed,
      not done.
    - **The Prototype tools bar** (Scaffold, dev only).
  - **Open:** (1) the 44px minimum for the back link and Hide list needs a 24px gap between them (or Hide list on the title line); 40 was taken; (2) the shell's targets, above; (3) whether the map dots need a bigger target
    where they are alone (not where they cluster). **Not verified:** on a real touch device (a mouse pointer was used for the taps), and the tabs' extension against the strip at 280px. Not committed.

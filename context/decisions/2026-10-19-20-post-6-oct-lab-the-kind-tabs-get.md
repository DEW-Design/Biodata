# 2026-10-19 - Post-6-oct lab: the kind tabs get a white wash that actually shows

- **Oct 19 2026: Post-6-oct lab: the kind tabs get a white wash that actually shows.** The designer, on a screenshot of the kind tabs with the last
  one ("Flagge") cut hard at the popover's edge and no fade: "white gradient wash on the right of the filters to make this look more premium."
  This corrects `2026-10-19-19-*`, whose fade did not appear.
  - **Why it did not show:** the fade was drawn only when `more` was true, and `more` was read once, in a ref callback on render. The popover's content is
    first rendered while it is still being laid out, when the row measures zero wide, so the reading was "nothing more to reach" and was never taken
    again (nothing re-rendered it). The compiled CSS for the gradient was present; the state was wrong.
  - **The fix (`KindTabs`, `notifications-popover.tsx`):** whether there is more is read again whenever the row or its tabs change size
    (`ResizeObserver` on both) and whenever it scrolls, in a ref callback that cleans up after itself.
  - **The wash:** the popover's own white (`--ui-bg-primary`, no new colour) falling away to clear in six steps (100, 92, 65, 30, 8, 0 percent, with
    `color-mix`) instead of one straight ramp, so it has no visible edge and does not band; 64px wide, up from 48. It fades in and out (150ms,
    none under reduced motion) instead of appearing, goes when the last tab is in view, and does not take the pointer.
  - **Open:** (1) no wash on the left once the row has been scrolled (asked for the right only); (2) the stops are a judgement of "premium", not from a
    frame, and the width and the falloff are easy to tune once seen.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** the wash itself in a
    browser (it is the thing that failed before), because none was available: it needs checking that it is there on opening the popover, that it
    fades off at the end of the scroll and returns on scrolling back, and that the last tab is readable through it. Typography QA (0.6 item 8)
    not run: no text added. Not committed.

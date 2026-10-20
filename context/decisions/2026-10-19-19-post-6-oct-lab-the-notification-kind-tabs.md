# 2026-10-19 - Post-6-oct lab: the notification kind tabs stay on one line and scroll with a fade

- **Oct 19 2026: Post-6-oct lab: the notification kind tabs stay on one line and scroll with a fade.** The designer, on a screenshot of the bell's
  popover with the kind tabs wrapped onto a second line (the fix made in `2026-10-19-18-*` for a clipped "Flagge"): "filters horizontal scroll
  without the scroll bar. to show theres more to the scroll add a gradient on the right. All filters should be on one line." This replaces the
  wrapping chosen in `2026-10-19-18-*`.
  - **The kind tabs (`KindTabs`, `notifications-popover.tsx`):** one line however many there are. Past the popover's width they scroll sideways with
    the scrollbar hidden (`scrollbar-width: none` and the WebKit equivalent). A 48px fade on the right edge, from the popover's own fill
    (`--ui-bg-primary`) to clear, says there is more; it does not take the pointer and is drawn only while there is more to reach, so it is gone
    when the last tab is in view. It is measured on render and on scroll (`scrollLeft + clientWidth < scrollWidth`); the popover's width is fixed, so no
    resize is watched. The tabs themselves are unchanged: the DEW `TabList` in its grey button type, small, single choice, applied as chosen.
  - **Also fixed, from the same screenshot:** an upload's second line ("AHL_summer_vegetation_2026.xlsx · ...") was cut at the end with an ellipsis,
    which removed the project code, the part that tells two uploads of one file apart. The file name now gives way (it is the part cut) and the
    project after it is never cut. The same for a folded group's line ("<file> and 2 more · BD-5039").
  - **Open:** (1) no fade on the left once the row has been scrolled; the designer asked for the right only; (2) keyboard: arrowing to a tab that
    is out of view relies on the browser scrolling the focused tab into view, which has not been checked.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** a live browser pass (one line
    at five and six kinds, the fade appearing and going at the end, no scrollbar in each browser, arrow keys across the tabs, the project code
    visible on a long file name), because no browser tool was available. Typography QA (0.6 item 8) not run: no text added. Not committed.

# 2026-10-23 - Map visualise: Show more scrolls to the next set

- **Oct 23 2026: Map visualise: Show more scrolls to the next set.** The designer, with a screenshot of the card's "Show 25 more" button: "when I click this, the button should scroll down until the next set."
  Run through `/refine-prompt` (the terms: Reduced motion, "any significant movement should check for it"; Focus management, "deliberately moving keyboard focus").
  - **What was wrong (`dataset-error-map.tsx`):** the button was pinned to the foot of the list (`2026-10-23-03-*`), so it stayed where it was after a click and the 25 new rows were drawn below the
    visible part of the list: a click showed nothing happening. (Explore's own "Show N more" link sits inline at the end of the rows, so its new rows appear under it; it is unchanged.)
  - **The fix:** "Show more" notes where the new rows start (`from` = the old limit) in a ref; once they are drawn, an effect scrolls the list's own scroll container so the first new row is at its top. The scroll
    animates, and is instant when the person prefers reduced motion (`prefers-reduced-motion`). When the press came from the keyboard or a screen reader (the press event's `pointerType`), focus also moves to
    that first row (without a second scroll): the new rows are inserted before the pinned button in the page order, so Shift+Tab from the button would have reached the last new row, not the first. A mouse
    or touch press moves no focus (a focused row would highlight its marker on the map without being pointed at). No change to `ResultCard`, Explore, or the Outliers tab's batching.
  - **Behaviour to know:** it always goes to the next set, as asked, so pressing the button before scrolling skips the rows between; the first new row is flush with the top of the list, so on the last short batch
    (4 rows on Outliers) the list stops at its end instead and the new rows are in view lower down. Switching tab still does not reset the list's scroll position (it did not before).
  - **Verified, in a browser (Playwright, a script outside the repo):** at 1440 x 900 as BioData Admin. A mouse click from the top of the list: 25 to 50 rows, scrollTop 1900, row 26 top at 0 px from the list's top;
    a second click: 75 rows, row 51 at 0, the button reads "Show 23 more" (98 less 75). Keyboard (Tab to the button, Enter): focus lands on row 26. Reduced motion emulated: the scroll has landed 120 ms after the
    click. Outliers (29): "Show 4 more" reveals rows 26 to 29, the list scrolls to its end, the button goes, the new rows are in view. Zero console errors; `npx tsc --noEmit`, `npx eslint` on the file and
    `npm run check:contracts` clean. **Not verified:** touch, a screen reader announcing the new rows (nothing says "25 more shown"; not added: not asked), and a window shorter than 700px. Typography QA (0.6
    item 8): no text changed. Not committed.

# 2026-10-23 - Map visualise: hide and show the left panel

- **Oct 23 2026: Map visualise: hide and show the left panel.** The designer, while the category-filter question (`2026-10-23-18-*` and the three options put to them) was still open: "Also need affordance to hide / show
  the left panel." Assumed: the left panel is the floating card (440px, over the map); the rail is not meant. Taken as a separate, small change that does not depend on how the categories are filtered.
  - **Why there was none:** the card covers the left 448px of the map and the list is up to 98 rows; the only way to see the map whole was to leave the screen. Explore's second layout already folds its search card
    (`searchPanelOpen`, a chevron on the card's top row, the card shrinks to its header); this card had no equivalent (0.9).
  - **Built: "Hide list" / "Show list", on the card's top row opposite "Back to report".** A labelled link button (`link-gray`, small) with a chevron (up while the list shows, down while it is folded), `aria-expanded`
    and `aria-controls`. It is a labelled link, not the icon-only chevron Explore uses, because the designer's ask is the affordance and a label says what it does. The card folds to its header (the way back, the file,
    the project and their switchers) so orientation stays; it does not disappear behind a separate button. The list, the tabs and the Show more button go with it, and come back as they were: the scroll position is kept
    (measured: scrolled to 420, folded, unfolded, 420), the filter, the 25 rows shown and the chosen record are state of the card, so none is lost. A record chosen on the map keeps its summary on the right while the list is
    folded, and a marker can still be picked.
  - **The map refits:** as in Explore's second layout, the map's padding follows the card, `[448, 48]` while the list shows and `[48, 176]` while it is folded (the folded card is 440 by 128), so the 98 records spread
    across the freed map instead of staying in the strip right of the card. The fold itself is instant (the list fades in over 150ms, opacity only, none under reduced motion; no height or width is animated, per
    `2026-10-23-17-*`).
  - **A fault found by measuring and fixed before this was called done:** the card's dim (the Popup tool's default, lit by `group-has-[button[aria-expanded=true]]/card`) took the new button's `aria-expanded=true` as
    a popup being open, so the whole card was dimmed at rest (opacity 1 on load). This is the coupling named in `2026-10-23-16-*`. The dim now looks only at the header's switchers (`data-switchers` on the header
    block): measured 0 at rest open and folded, 1 while the file or the project switcher is open (open and folded), 0 after Escape, focus back on the switcher; the popup is 12px under the header in both states.
  - **Checked (Playwright, a script outside the repo):** mouse, Space and Enter toggle it and focus stays on the button; the label, `aria-expanded` and the mounted list follow the state; 1440px (BioData Admin and
    Registered User, 440x703 and 440x646 open, 440x128 folded) and 760px (392x484 open, 392x128 folded); zero console errors; `npx tsc --noEmit`, `npx eslint` and `npm run check:contracts` clean. Typography QA (0.6 item
    8): the label is the Button's own text, no layer added. **Not verified:** touch, a screen reader, the "No errors to map" card (it has no list and no button), and the other `Show list` state when the dataset is
    swapped (the choice is kept across datasets, on purpose: it is the person's choice of view, not part of a dataset's list; say if a new dataset should open it).
  - **Open:** (1) the left panel read as the card, not the rail, and "hide" as folding to the header rather than removing it (the alternative is to hide the whole card behind a small button on the map, which loses the
    way back and the switchers while hidden); (2) the category filter (the three options in the session: the product's one Filter, scrolling category tabs, a tile grid) is still undecided and the tabs are still All
    errors, Outliers and Other errors. Not committed.

# 2026-10-23 - Map visualise: the switcher popups are anchored and the open one is marked

- **Oct 23 2026: Map visualise: the switcher popups are anchored and the open one is marked.** The designer, with a screenshot of the open dataset switcher (the "file is the title" header): "one of the feedback we
  received was that popups like this are really easy to miss, can we look into this as well?" The feedback is not specific, so the popup in the screenshot was measured for what makes it easy to miss, and the
  causes that can be fixed without restyling a design system component were fixed; the rest is proposed.
  - **Measured before (1440 x 900, BioData Admin; `dataset-error-map.tsx`, `breadcrumb-switcher.tsx`):**
    - **It cut a line in half.** The popup opened 12px under the name that opened it, so under the project name (default header) its top edge sat at 109px, across the file line below it (99 to 119px), and under the
      file title (file-as-title header) across the project line: half a line of text showed above the popup. Measured on both switchers in two headers.
    - **Nothing said which control it belonged to.** While open the name looked as it did at rest: no tint, the same grey (the caret does not turn, being an up-down icon).
    - **It is white on a white card.** The design system's popover is a white sheet with a 1px ring (`#F2F2F1`, about 1.1 to 1) and `shadow-lg` (3 and 8 per cent black): over a white card its edge is faint. The
      entering fade and slide (150ms) and the search box's focus ring are the only emphasis. This is the system's own treatment of every popover (menus, selects, this).
  - **Changed:**
    - The popup opens **under the whole header block**, not under the name: both switchers now open in the same place, 12px under the header's divider (143px in the default header, 139px in the other; was 109 and
      131), left edge on the text's (17px), over the tabs, never across a line. `BreadcrumbSwitcher` gained two optional props for it, `anchorRef` and `crossOffset` (react-aria's `triggerRef` and `crossOffset`),
      which no other caller sets: the project page's crumb was re-checked, its popup still 12px under its button.
    - A name that switches has a **hover tint** (`bg-secondary`) and, while its popup is open, a **darker tint and the primary text** (`aria-expanded:bg-tertiary`), so the pointed-at and the open control are marked
      and the popup is tied to its owner (measured: transparent at rest, `rgb(248, 248, 247)` hovered, `rgb(242, 242, 241)` open with `aria-expanded` true). The padding is taken back with a negative margin: the
      text's left edge did not move (91px before and after).
  - **Kept working (checked):** Enter on the button opens it with focus in the search box, Escape closes it with focus back on the button, a click outside closes it, choosing a dataset swaps it; zero console errors.
  - **Not changed, proposed (the designer's call, since they restyle or add to the design system or add a pattern):**
    1. **Separation.** Dim the card behind an open popup (a light wash over the list and header, under the popup), which makes the white sheet stand out against faded content: it would be a new pattern, nothing in
       the product does it for a non-modal popup. Or strengthen the popover's own elevation for every popover (`shadow-xl`, a stronger ring): a design-system change that reaches every menu and select.
       Recommendation: the wash for this card's switchers first, and the system-wide elevation as its own decision.
    2. **Finding it in the first place.** The names' only sign that they switch is a 16px grey caret; a persistent light fill on them (not only on hover) would show it, at the cost of two tinted bars in a header that has
       been settled several times today.
    3. **A different popup.** If the feedback was about the record summary that opens at the far right of the map when a row is chosen (about 400px from the click), that is a separate fix (open it beside the
       click, or mark the row and the dot): the screenshot shows the switcher, so it was not changed.
  - **Verified (Playwright, a script outside the repo):** the popup's position for both switchers in two header options; hover, open, closed states; keyboard, Escape and focus return, light dismiss, a swap; the project
    page's crumb; `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean. **Not verified:** touch, the other two header options (they share the same code), and a card narrower than the popup's
    384px (the popup is wider than the card at 280px, as it was). Typography QA (0.6 item 8): no text or type layer changed. Not committed.

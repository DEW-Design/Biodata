# 2026-10-23 - Map visualise: four ways to set an open popup apart from the white card

- **Oct 23 2026: Map visualise: four ways to set an open popup apart from the white card.** The designer, on a screenshot of the open dataset switcher, after the popups were moved: "Position is fine, but the
  question is more around the visual distinction between two white surfaces." Follows `2026-10-23-13-*`, which fixed where the popup lands and left this as the open question. Guidance taken from the surfaces
  skill (`/emil-surfaces`: depth from a translucent hairline ring plus layered shadow, not a solid pale border; a menu or popover is a surface that "reads as raised").
  - **Why they are hard to tell apart (measured, 1440 x 900):** the card and the popup both draw `shadow-lg` (the card's from Explore's own float card), so neither is higher than the other. The popup's edge is a
    1px solid `rgb(242, 242, 241)` ring (about 1.1 to 1 on white; a solid colour tuned to one background) and its shadows are 3 and 8 per cent black. On a white card the popup's edge is nearly invisible, as the
    designer's screenshot shows.
  - **Four treatments, behind a "Popup" tool on the Prototype tools bar (CONTRACTS 3.8, 4.4: the others are deleted when one is chosen), which is on the bar only where the card has a switcher:**
    - **As the design system draws it:** unchanged.
    - **A stronger edge:** a translucent hairline ring (`ring-gray-950/10`, black at 10%, a token with an alpha modifier, not a hex) and the larger shadow token (`shadow-xl`) on the popup. Measured: the ring
      became `lab(8 ...) / 0.1` in place of the solid `#F2F2F1`, the shadows 0 8 8 -4 / 0 20 24 -4 (was 0 4 6 -2 / 0 12 16 -4). It restyles the design system's popover at its call site (a class on `Popover`
      through a new optional `popoverClassName` on `BreadcrumbSwitcher`), so choosing it is an override of 1.5 and 1.9 and would need recording (9.1); the clean route is a change to the popover's own tokens.
    - **Dim the card behind:** while a name's popup is open the card goes a light grey (`bg-gray-950/10` over it, fading in 150ms; none under reduced motion), and the popup, which stays white, is the brightest surface
      on screen. The open name is lifted above the dim so it stays clear. It is done with CSS alone: the layer shows while the card has a button with `aria-expanded` true (the popup is in a portal, so it is not
      under the layer), so there is no state to fall out of step. The layer lets clicks through. The Show more button is under it, as is everything else on the card.
    - **Both.**
  - **What was seen:** "Dim" gives the clearest separation by far: the card reads as the surface below and the popup as the one above. "A stronger edge" on its own is a modest gain, the popup still white on white with
    a crisper outline; "Both" adds little to "Dim". **Recommendation: Dim**, which also leaves the design system's popover untouched, so it needs no override. It is the default on the tool.
  - **Checked (Playwright, a script outside the repo):** each treatment's popup shadow, ring and the card layer measured in the browser; the dim is 0 closed, 1 while a switcher is open (dataset or project), 0 after
    Escape, after a click outside and after a swap; a row click still opens the summary; hover, open and closed states, keyboard open, Escape with focus back on the name, the project page's crumb unchanged;
    zero console errors; `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean. **Not verified:** that the open name is on top of the dim by a hit test (react-aria makes the page
    inert while the popup is open, so `elementFromPoint` cannot answer; it was judged on the screenshots, where the open name's tint shows clearly above the grey), touch, and the other three header options.
  - **Open:** (1) which treatment to keep, and, if "a stronger edge" is wanted, whether it is a change to the popover's tokens for every popover (the system-wide route, a designer decision); (2) the dim is darker
    than a wash would need to be where the card sits over a dark map area (it is a 10 per cent black layer over white, whatever is behind the card); (3) the same two-white-surfaces problem is in every
    popover over a white surface in the product (the project and report crumbs' popups over the page), which this card's choice does not decide. Typography QA (0.6 item 8): no text or type layer changed. Not committed.

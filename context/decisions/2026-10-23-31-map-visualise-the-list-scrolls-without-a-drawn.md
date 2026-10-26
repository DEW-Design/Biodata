# 2026-10-23 - Map visualise: the list scrolls without a drawn scrollbar

- **Oct 23 2026: Map visualise: the list scrolls without a drawn scrollbar.** The designer, with a screenshot of the list's classic scrollbar down the right of the card: "is there a nicer way to add scroll without having
  that bar on the right? Can you check /emil-ui-review and /emil-engineering-vocabulary?" Reviewed as `/emil-ui-review` does (interaction, accessibility floor, layout stability, then the rest), with
  `/emil-engineering-vocabulary` for the terms.
  - **Review of the scroll area (measured with classic scrollbars on: headless Chromium hides them unless `--hide-scrollbars` is dropped):**
    - **Layout stability, a finding:** a classic scrollbar (Windows, a Mac with a mouse, "always show scroll bars") took 15px from the right of the list's content: the rows' right inset was 23px against 8px on the
      left, so the severity badges and their label sat 15px further in than the text did on the left (the badge column's right edge at x 484, the card's at 520), on those systems and not on a trackpad. The same layout
      moved with a setting the designer does not control (the same fault CONTRACTS 4.2f names for a page's `main`, which reserves the gutter instead).
    - **Interaction and accessibility:** scrolling by wheel, trackpad, touch and keyboard all work without the bar (a wheel of 300px moved the list 300px; Tab through nine rows moved it 271px and the focused row
      stayed in view). Rows are real buttons, so a keyboard user reaches every one.
    - **Scroll chaining, a finding:** nothing stopped a scroll that reached the end of the list from chaining outward.
  - **Terms (`/emil-engineering-vocabulary`, quoted):** **Overscroll behavior**, "What happens when scrolling hits a boundary - chaining to the parent, rubber-banding, or nothing" (now `contain`); **Sticky
    positioning**, "An element scrolls normally, then pins in place when it reaches an edge of its container" (the Show more button already is); **Virtualization**, "Rendering only the visible rows of a long list and
    recycling them as the user scrolls" (not needed: the list draws 25 rows at a time and adds 25 per Show more, so the DOM is bounded; a dataset of thousands of errors would need it).
  - **Changed:** a shared `MAP_SURFACE_SCROLL` (`map-search/map-surface.ts`): `overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`, on the list and on the record summary's body. The tab strip
    in the same card already hides its bar the same way (`ScrollFade`). Measured with classic scrollbars on, before and after: scrollbar width 15px to 0; the rows' insets 23 and 8 to 8 and 8; the severity label's right
    edge 484 to 499 (12px from the card's inner right edge, the same as the text's on the left); `overscroll-behavior-y` auto to contain. Zero console errors; `npx tsc --noEmit`, `npx eslint` on both files and
    `npm run check:contracts` clean.
  - **What the bar did and no longer does:** it showed where in a long list a person is, and it could be dragged. What says there is more now: the row cut off at the bottom (measured at five window heights, 640 to 968px:
    70, 3, 37, 70 and 17 per cent of the last row showing, so there is always some, though 3 per cent is a sliver) and the pinned "Show N more" button while there are rows still to reveal. A category with all its rows
    revealed, such as Metadata, has only the cut-off row to say so. There is no fade (`/emil-surfaces`: "No fades on scrollable content"), which is why the cut-off row is the cue.
  - **The other way, not taken:** `scrollbar-width: thin` with a transparent thumb that shows on hover keeps a position cue and a drag handle for the pointer, but it still reserves a gutter on classic systems (about
    8px), so the lopsidedness would shrink, not go. Say if it is wanted.
  - **Not changed, and why:** the same family of floating cards in Explore, whose scrollers are the results card's list (`observations-search.tsx`, the same `ResultCard` rows), the record peek card and the side
    panel, still draw a classic scrollbar: they are production screens the designer did not name; one constant (`MAP_SURFACE_SCROLL`) would bring them in line. Proposed.
  - **Not verified:** a real Windows machine (a classic scrollbar was switched on in the test browser, a mouse-and-wheel drag was not tested), Safari's own scrollbar rendering, touch. Not committed.
  - **Open:** whether to bring Explore's three scrollers in line; whether a pointer-only user needs a scroll position cue (the hover-thumb option above).

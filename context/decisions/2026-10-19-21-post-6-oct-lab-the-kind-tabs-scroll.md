# 2026-10-19 - Post-6-oct lab: the kind tabs scroll sideways only

- **Oct 19 2026: Post-6-oct lab: the kind tabs scroll sideways only.** The designer: "Lock the horizontal scrolling of the filters. Currently able
  to vertically scroll? /emil-ui-polish". Read as: the row of kind tabs in the notifications popover should scroll on the horizontal axis and
  never the vertical one. The `emil-ui-polish` pass was applied to the row and the popover.
  - **Cause (`KindTabs`, `notifications-popover.tsx`):** the row was `overflow-x: auto` with the vertical axis left alone. When one axis is `auto`,
    the other computes to `auto` as well, so a sub-pixel of vertical overflow made it scrollable up and down.
  - **Fix:** `overflow-y-hidden` locks the vertical axis; `touch-pan-x` makes a touch drag on the row pan sideways only, leaving a vertical drag to
    the popover; `overscroll-x-contain` stops what is left of a sideways scroll from carrying on to the popover or the page. All four utilities were
    checked in the compiled CSS. The row has 8px of padding above and below, so hiding its vertical overflow clips nothing: the tabs' focus outline
    is drawn inside them.
  - **Also, from the polish pass:** the rows' own scroll area has `overscroll-contain`, so reaching the end of the list no longer scrolls the page
    behind it (checklist: scroll chaining). The wash over the tabs is inert (`pointer-events: none`) and transitions only its opacity, as the
    checklist asks.
  - **Looked at, not changed:** (1) the kind tabs are the design system's, 36px tall against the checklist's 40px desktop hit area, and the hover-only
    Done button on a row is 28px (the whole row is also the target); both are components' own sizes; (2) the empty states are one line of text, where
    the checklist's empty state teaches (a headline, a line, an action): "No activity yet." and "You're all caught up." are honest but do not say what
    would appear there; (3) press feedback (`scale(0.96)`) is the design system's on its buttons and not on the popover's rows.
  - **Open:** whether the empty states should teach, and whether the 28px Done button should grow its hit area with a pseudo-element.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean; the four utilities are in the compiled CSS. **Not
    verified:** that the row no longer scrolls vertically (wheel, trackpad and touch) in a browser, because none was available. Typography QA
    (0.6 item 8) not run: no text changed. Not committed.

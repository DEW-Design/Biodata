# 2026-10-19 - Post-6-oct lab: the Add button is primary, and the notifications popover opens under the bell with an open state

- **Oct 19 2026: Post-6-oct lab: the Add button is primary, and the notifications popover opens under the bell with an open state.** The
  designer, on a screenshot of the account row with the popover open: "position of the notifications popup - incorrect, also, when the
  notifications are clicked, the hoverstate is incorrect. can we look into the + button as well? Potentially being a primary button?"
  - **Position (`notifications-popover.tsx`):** the popover used `bottom right`, which lines its right edge up with the bell. At 380px wide that is
    left of the window, so it was clamped to the window's edge, covered the account row's own controls and had nothing to do with the bell. It is
    now `bottom start`: under the bell, its left edge on the bell's. The icon-only column still opens it beside the column (`right top`).
  - **The bell's state:** it had only a pointer hover, so once clicked, with the pointer on the popover, it showed nothing and looked unrelated to
    what had opened. While its popover is open it takes the same fill as pointing at it (`aria-expanded:bg-tertiary`, with the darker icon).
  - **The Add button (`AddMenu`, `shell.tsx`):** it was a grey-filled circle (`bg-tertiary` on the ghost button), which read as a hover that never
    ended beside a bell with no state. It is now the design system's primary `Button`, icon only (`color="primary"`, `size="xs"`, the plus), the one
    filled control in the row, in the icon-only column too. At `xs` an icon-only button is 32px square, the footprint of the round buttons beside
    it, and it keeps the component's own radius (8px, square-cornered where its neighbours are round), because a component is not restyled at its
    call site (1.5). Its menu is unchanged. It follows the ref-shell rule that a create action keeps one emphasis, and Jira's "+ Create" (the header's
    Add, 3.5).
  - **Also in the screenshot, fixed:** the kind tabs (All, Uploads, Requests, Nominations, Flagged) were wider than the popover and clipped the last
    label ("Flagge"). They now wrap onto a second line instead of scrolling, so every label is whole.
  - **Open:** (1) the primary Add is square-cornered beside round buttons; if the designer wants it round, that is a decision to restyle a component
    at its call site (a radius override), not made here; (2) the wrapped kind tabs take a second row when there are five or six kinds; a Filter menu
    would take one row and hide the kinds, the trade the designer chose against earlier.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean. **Not verified:** a live browser pass (the
    popover under the bell at 1708px and at a narrow window, the bell's open fill, the primary Add's size against its neighbours, the Add menu
    from the primary button, the kind tabs wrapping), because no browser tool was available. Typography QA (0.6 item 8) not run: no text added.
    Sibling grep: `ghostBtn` with `bg-tertiary` was only the Add button. Not committed.

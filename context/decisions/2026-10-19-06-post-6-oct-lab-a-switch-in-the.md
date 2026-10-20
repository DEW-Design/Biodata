# 2026-10-19 - Post-6-oct lab: a switch in the tab strip collapses the left panel

- **Oct 19 2026: Post-6-oct lab: a switch in the tab strip collapses the left panel.** Page feedback from the designer on
  `/proto/post-6-oct` (the tab strip): "To the left of the tab, can we have a collapse left panel icon, a divider, then the tab?"
  - **What it is:** at the left of the tab strip, a small round button (the `LayoutLeft` sidebar glyph, the same size and treatment as
    the strip's "New tab" button), then a 1px divider, then the tabs. It is Scaffold-side lab chrome in `shell.tsx`, built from the
    shell's own `AriaButton` and `Tooltip`, no new component.
  - **What it does:** it collapses the whole left column, not only the rail: the account row (account, search, Add) and the rail close
    to nothing and the page panel takes the width, with a 16px margin to its left so it does not meet the window edge. Pressing it
    again opens them. The column animates (200ms, ease-out, none under reduced motion). The switch lives in the strip, not in the
    panel, so it is still there when the panel is hidden. Its label and tooltip read "Collapse left panel" or "Expand left panel", with
    `aria-expanded`; no keyboard shortcut is shown, because none is wired (CONTRACTS 2.10). The hidden column is `inert`, so Tab never
    reaches a control that cannot be seen. It starts open and is not remembered across a reload.
  - **Open:** (1) whether it should be remembered (a reload opens it again); (2) whether the account row's controls should come
    somewhere else while the panel is hidden: search and Add are in that row, so with the panel collapsed a person has no search
    or Add (the "+" in the project bar and the tab strip's "New tab" remain); (3) a keyboard shortcut, which would be added with its hint
    only when it is wired.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `npm run check:contracts` clean. **Not verified:** a live browser
    pass (open and collapsed, the animation, Tab order with the panel hidden, the project and list pages beside the collapsed panel, the
    notifications bell, a narrow window); no browser tool was available in this session. Typography QA (0.6 item 8) not run: no new
    text, the tooltip uses the existing treatment. Not committed.

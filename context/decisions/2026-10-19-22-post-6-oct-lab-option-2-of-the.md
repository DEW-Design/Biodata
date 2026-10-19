# 2026-10-19 - Post-6-oct lab: option 2 of the frame puts Search, Add and the notifications at the top right

- **Oct 19 2026: Post-6-oct lab: option 2 of the frame puts Search, Add and the notifications at the top right.** The designer, on a screenshot of the
  Home screen: "quick sense check on the layout - i feel like the top right is underused. Can we come up with an option 2 of this layout? Rejig in a way
  that makes the layout feel more cohesive." Lab only (CONTRACTS 5.4); `/pages` is unchanged and option 1 is unchanged and still the default.
  - **What was uneven in option 1:** the first row had the account, Add and the bell packed into the 270px of the left column, then the panel switch and
    the tabs, then nothing at all to their right; Search sat at the top of the rail, a third place for a global tool.
  - **Option 2 (`?layout=2`):** the global tools are together at the far right of the tab strip, in the space that was empty, right-aligned with the
    panel's right edge: Search (the same pill, fixed at 224px instead of the rail's full width), the primary Add button and the bell. The left column's
    first row is the account alone, so the column is identity and navigation; the rail starts at its first section (Search is no longer at its top);
    the icon-only column (panel collapsed) starts at its sections too. Add's menu and the notifications open leftwards from their buttons
    (`bottom right`, `bottom end`), so they stay on screen. A signed out visitor keeps their Log in and Sign up in the left cell. The panel's own bar
    (the breadcrumb, and the project's buttons at its right) is unchanged.
  - **How it is shown:** a "Layout" tool on the Prototype tools bar (Option 1, Option 2), kept in the address as `?layout=` like the lab's Rail tool.
    `LayoutOptionSwitcher` is route-based (`option-n` routes) and this lab is one route, so the tool is registered here with the same id and bar label.
    Nothing was deleted: the designer chooses, and the other is retired then (4.4).
  - **Built with:** the existing parts only: `AccountRow` (a `utilities` flag), `AddMenu` and `NotificationsBell` (an `alignEnd` flag), `SearchPill` (a `bar`
    width), `TabStrip` (a `trailing` slot at its right end) and `CompactColumn` (a `utilities` flag). No new component and nothing restyled.
  - **Open (for the designer):** (1) the panel's bar below still repeats a little of the strip above (the Home breadcrumb under a Home tab); folding
    it into the strip, or giving the Home bar the page's own controls, is not done; (2) the project's buttons (Add, the upload, the tree, the link,
    properties) stay in the panel's bar at its right; whether they belong in the strip too, next to the global tools, is a larger rejig; (3) at narrow
    widths the tabs shrink to make room for the tools, as they do with more than six tabs; (4) option 2 has not been looked at: it is a first
    reading of "more cohesive", and the width of Search and the order of the three tools are easy to change.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the four files and `npm run check:contracts` clean; the page serves (200) with `?layout=2`.
    **Not verified:** how either option looks in a browser (the cluster's alignment with the panel edge and the strip's height, the two popovers
    opening leftwards on screen, the collapsed column in option 2, the guest's left cell, the tool on the Prototype bar), because no browser tool was
    available. Typography QA (0.6 item 8) not run: no text added. Not committed.

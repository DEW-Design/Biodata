# 2026-10-19 - Post-6-oct lab: option 2's top right is Add with a menu, a divider, Search and notifications, and an alt with the account

- **Oct 19 2026: Post-6-oct lab: option 2's top right is Add with a menu, a divider, Search and notifications, and an alt with the account.** The
  designer: "Top right nav: + add chevron down, divider, search. notifications. Alt: + add chevron down, divider, search, notifications, divider, user
  name chevron down." Lab only (CONTRACTS 5.4); option 1 is unchanged and still the default.
  - **Option 2 (`?layout=2`):** the top row's right end reads, left to right, a primary **Add** button (the plus, "Add" and a chevron that turns over
    while its menu is open), a hairline divider, **Search**, the **notifications**. The account stays at the top left. The Add menu is the one it was
    (`createMenuItemsForRole`); it opens leftwards from the button's right edge.
  - **Option 2, alt (`?layout=2b`):** the same, then a second divider and the **account** (the avatar, "Olivia Wyatt" and a chevron) at the far right,
    its menu opening leftwards. The top left then holds nothing, so the top row runs across both columns above the rail, with the panel switch at its
    left edge over the rail's own left inset. Its signed out version puts Log in and Sign up there instead of the account.
  - **A signed out visitor** has no Add (as before), so no divider after it either; Search and the notifications follow directly.
  - **How it is shown:** the Layout tool on the Prototype tools bar now lists Option 1, Option 2 and Option 2, alt, kept in the address as `?layout=`.
    Nothing was deleted: the designer chooses, and the others are retired then (4.4).
  - **Built with:** the existing parts: the design system's primary `Button` for Add (the plus is its leading icon and the chevron its trailing
    icon, with the same turn-over treatment as the ingestion chip's, so every action button carries an icon, 3.12), `BarDivider` (the 16px hairline the
    project bar uses), the existing `SearchPill`, `NotificationsBell` and `AccountMenu` (an `end` flag: sized to its content, opening leftwards), and
    `TopBar` (a `fullWidth` flag for the alt). No new component and nothing restyled.
  - **Open:** (1) the icon-only Add (a 32px primary square, option 1 and the collapsed column) is now a labelled button here; the two are the same
    control at two widths and the designer may want one; (2) in the alt the top row's left edge is the panel switch above the rail, with nothing
    of the rail's width marked in the row, so the row and the rail read as separate; a wordmark or the workspace name there is the usual filler and was not
    invented (0.3); (3) Search is still the pill, 224px, and not an icon; at narrow widths the trail shortens before the tools do, but the tools'
    total width (about 440px, 570 with the account) has not been checked against a narrow window.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts` clean; both addresses serve (200). **Not verified:**
    how either looks (the order and spacing of the group, the dividers, the Add button's chevron turning, the menus opening leftwards on screen, the
    alt's full-width row over the rail, the collapsed panel in the alt, the guest), because no browser tool was available. Typography QA (0.6 item 8)
    not run: the only new text is "Add", the same as the header's Add menu (3.5). Not committed.

# 2026-10-19 - Post-6-oct lab: the collapsed left panel is an icon-only column

- **Oct 19 2026: Post-6-oct lab: the collapsed left panel is an icon-only column.** Designer: "Collapse left panel to show icons only?
  Including account name with chevron, the plus and the notifications?" This answers open item (2) of `2026-10-19-06-*`: collapsing
  no longer removes search and Add, it keeps every control as an icon.
  - **What it is:** the switch in the tab strip now narrows the left column from 270px to a 64px icon-only column instead of closing
    it. Top to bottom: the account (the avatar with its chevron, no name, in the top row beside the tab strip), Add (the "+"), the
    notifications bell with its unread dot, search, one icon per rail section (the same groups and order, a gap between groups and no
    divider lines, all groups shown because the group headings that fold them are gone), and Help at the foot. The Government of South
    Australia lockup is dropped (too wide). The page panel sits against the column, so the 16px left margin added by `2026-10-19-06-*`
    is removed.
  - **Behaviour:** every icon has a Tooltip (right) and an aria-label; the account, Add and the bell open the same menus as when
    expanded, beside the column ("right top", the account below it). A section icon opens that section in the current tab, as the
    expanded row's label does. A section's views (All projects, My projects, ...) are in the expanded rail only; the icon goes to the
    section. A signed-out visitor gets a Log in icon (`/pages/auth/login`) in place of the Log in and Sign up buttons.
  - **How:** `shell.tsx` (`AccountMenu` split out of `AccountRow`, `CompactColumn`, `AddMenu rail`), `notifications-popover.tsx`
    (`NotificationsBell rail`). Lab only, no DEW component changed. The expanded rail is hidden, not unmounted, so what was open in it is
    kept; the expanded account row is unmounted while collapsed so there is one Add and one bell on screen.
  - **Spacing and dividers (designer page feedback, same day: "Properly space this and add dividers"):** the icon column now has even
    rhythm, 8px between the controls (Add, bell, search), 4px between section icons, and a short 32px rule (`border-t border-secondary`,
    12px above and below) between the controls, each group of sections (Workspace, Work, Admin) and Help. This is a deliberate exception to
    the expanded rail's "no divider lines" (`2026-10-13-*`): the icon column has no group headings, so the rules are what mark the groups.
    Re-checked live at 1708 x 1024, zero console errors; `tsc`, `eslint`, `check:contracts` clean.
  - **The page in use is lit as the production rail lights it (designer page feedback, same day: "Sidebar navigation icon selection -
    inconsistent. They need to be primary colour - like, the production screens"):** the icon of the page in use is a `bg-brand-solid`
    tile with a white glyph (`PrimaryRail`'s active treatment, `primary-rail.tsx`), in all three places that lit it differently before:
    the icon column (32px tile), the expanded flat row and the nested row (24px tile, including a view row). The grey row fill that
    marked the active row is gone, so there is one mark, not two; the label stays `text-primary`. The flat row's padding is now the nested
    row's (4px, a 4px gap) so both put the label at the same x. Measured live: the lit link computes `rgb(24, 94, 116)` with white text.
  - **The lit icon holds still across the panel switch (designer page feedback, same day, with a screenshot: "the switch between sidebar
    hide / show makes the nav item selection look extremely weird"):** two causes. (1) The icon column and the expanded rail put the icon
    at the same x, so after the switch the pointer sat on the lit icon and the row's hover swapped it for a chevron inside the filled tile.
    A lit row that has views now keeps its icon on hover; its chevron is a separate button at the row's right end, shown on hover or focus.
    An unlit row keeps Notion's icon-to-chevron swap. (2) The lit tile was 32px in the icon column and 24px in the rail. Both are now the
    same 24px tile, in a 32px hit area in the icon column, and the section icons use the rail's 2px gap. The tile's corner is 4px, the
    row's 8px corner less the 4px gap it sits in (CONTRACTS 2.13, new today). Measured live: tile 24 x 24, radius 4px, centre x = 32 in
    both states; with the pointer parked on the lit icon through collapse and expand it stays the icon. Its y differs between the two
    states (the icon column carries the bell and search above the sections), which is not changed.
  - **Correction (designer, same day: "i never said change the behaviour of the component"):** the first half of the item above was
    wrong and is reverted. A lit row with views keeps Notion's behaviour exactly as before: pointing at its icon shows the chevron in
    the icon slot, and there is no second chevron at the row's end. Only looks were asked for. What stays from that item is visual:
    the same 24px tile in both states, the 2px gap in the icon column, and the 4px tile corner (CONTRACTS 2.13). Lesson: a "looks wrong"
    note on a component is a request to restyle it, never to change what it does; a behaviour change is asked first (0.4).
  - **The whole strip is lit, not the icon (designer, same day: "the whole strip needs to have the selection not just the icon", with
    /emil-ui-polish):** the page in use fills its entire row (`bg-brand-solid`, white icon and label, `brand-solid_hover` on hover), in the
    expanded rail (a top-level row, a view row, a plain link) and as the whole 32px link in the icon column. This replaces the 24px
    tile of the two items above; the grey fill the production-matching change removed stays removed. Behaviour untouched: the hover swap
    to the chevron, the click targets and the label link are as before. Polish pass: only `background-color` and `color` change on
    hover (the row's `transition-colors`), weight is constant, focus rings are intact, the row stays 32px tall, no layout shift on
    state change. Measured live: the lit row is 238 x 32, radius 8px, white label. The icon hover tile keeps its 4px corner (8 less 4).
    Not changed, and noted: only the icon and the label are clickable, not the row's padding.
  - **Colours taken from production (designer, same day: "make sure the colours are consistent with production"):** `PrimaryRail`
    (`primary-rail.tsx`) is the source. Lit: `bg-brand-solid text-white` with no hover change, so the `brand-solid_hover` I had added is
    removed. Not lit: icon `text-quaternary`, and on hover `bg-tertiary` with `text-primary` on the icon and the label; the second tint
    the nested row's icon button drew on hover (`primary_hover`) is removed so a hover is one tint, as in production. Measured live, same
    session, production `/pages/project-list` against the lab (expanded and collapsed): lit rgb(24, 94, 116) on white; at rest icon
    rgb(143, 139, 135); hover fill rgb(242, 242, 241) with rgb(46, 41, 37). All three match. The row's label at rest is
    `text-secondary` (rgb(88, 84, 81)): production's rail has no labels, so it has no value to match, and it is the nested rail's own.
  - **Hover softened (designer, same day, pointing at the hover of Conductor's own follow-up box and its model picker; asked which
    control and what, they chose "sidebar rows, the soft fill"):** the colours stay production's (the entry above is binding: one
    `bg-tertiary` step, icon and label to `text-primary`), so what changed is how it arrives. The row's fill, the icon and the label now
    fade together over 150ms ease-out on `background-color` and `color` only (they were 100ms linear, and the label did not transition at
    all, so it snapped while the fill faded). Applies to the expanded rows, the plain-link row and the icon column. If the reference's
    fill is wanted lighter than production's gray-100, that is a token decision (it would be `bg-secondary`, gray-50) and is not made here.
  - **A view row's hover is its own strip (designer, same day, with a screenshot: "an indent needs to have a better hover treatment"):**
    a view row (All projects, My projects) was indented by padding, so its hover and selected fill ran the full width from the rail's
    edge, and with no gap between a section and its views it touched the section's strip. It is now indented by margin, so the fill starts
    at the indent (16px in, 222px wide against the section's 238px), and the section and its views are 2px apart like every other row.
    Looks only: the click targets, the chevron and the open and fold behaviour are as before. Measured live: section strip y 128 to 160,
    view strip y 162 to 194, x 32.
  - **An open section keeps its chevron (designer, same day, with a screenshot: "the left chevron down should still exist"):** with a
    section open and the pointer away, its icon slot showed the section's icon, so nothing said it was open. An open section now keeps
    the down chevron in its icon slot at all times; closed, the chevron still appears only on hover or focus, as before. The fold and open
    behaviour is as before. Measured live: the open section's icon is not displayed and the chevron is.
  - **The switch's hover starts at column 2 (designer, same day, with a screenshot and the earlier Conductor references):** the top row
    had 8px of left padding, so the switch's hover circle sat 8px inside the panel's left edge. The padding is removed: the switch's left
    edge is the panel's left edge, in both states. Measured live: expanded 270 and 270, collapsed 64 and 64 (switch left, panel left).
    The breadcrumb moves left by the same 8px. The hover stays the round 28px button it was; only its position changed.
  - **Open:** (1) whether the Admin group should stay folded in the icon column (it shows in full now); (2) whether a section icon
    should offer its views (a flyout) instead of going straight to the section; (3) remembering the collapsed state across a reload.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the two files and `npm run check:contracts` clean. A live pass at 1440 x 900 as the
    BioData Super Admin (headless Chromium): the column measures 64px, the icons, Add menu, bell popover and tooltips render, a section
    icon opens its page, zero console errors. **Not verified:** other roles (public user, registered user), keyboard order, narrow
    windows, reduced motion. Typography QA (0.6 item 8): no new text beyond the tooltip labels, which use the existing Tooltip. Not
    committed. `prettier --print-width 160` was run on `shell.tsx`, which re-wrapped a few lines beyond the change.
  - **Selected and hovered rows are no longer close (designer, 20 Oct 2026, with a screenshot: "See how close selected and hover bits look"):**
    with the whole row filled for the page in use, a hovered row directly under it sat 2px away and the two fills read as one block. The gap between
    rows is now 4px (`gap-1`) in the expanded rail, between a section and its views, and in the icon column (it was 2px, `gap-0.5`). Colours unchanged:
    the production values. Measured live: 4px between the lit row and the hovered row. The rail is 2px per row taller as a result (36px pitch).

# 2026-10-19 - Post-6-oct lab: the account button's hover is a pill that wraps its content

- **Oct 19 2026: Post-6-oct lab: the account button's hover is a pill that wraps its content.** The designer, on a screenshot of the account button at the top left of the rail while pointed at:
  "looks really weird on hover. Can we fix this and make it much nicer?"
  - **What was wrong (`AccountMenu`, `shell.tsx`):** reproduced and measured in the browser. The button was `flex-1`, so its fill was 202px wide for about 120px of content, 80px of grey past the chevron,
    with an 8px corner round a circular avatar. The fill (`bg-tertiary`, `rgb(242, 242, 241)`) is also the avatar's own fill, so the avatar's disc vanished into it and only its hairline outline
    was left. The avatar sat at x=22, not on the x=20 line of the rail's icons.
  - **The fix:** the fill wraps what the button holds (131px at rest and on hover; the bell keeps the right-hand end of the row through `ml-auto` on its wrapper, so it did not move: its right edge is 254px
    before and after). The button is a pill (`rounded-full`, 32px high) with 4px of padding round the 24px avatar, so by CONTRACTS 2.13 the corner is the avatar's 12px plus 4px, 16px, half the height:
    measured, the avatar is 4px from the top, bottom and left of the pill. That 4px also puts the avatar on x=20, the line of the rail's icon tiles (measured, both 20). The fill is the rail's own hover
    (`bg-tertiary`, as the rows under it), 12px after the chevron; it stays while the menu is open (`aria-expanded:bg-tertiary`, as the bell does), and the chevron turns over while open as production's
    `ProfileMenu` does (`group-aria-expanded:rotate-180`, 100ms). The collapsed column's account button is the same pill (avatar and chevron, 54px by 32px, avatar 4px in), where it was an 8px corner.
    Shared classes are `ACCOUNT_BTN` and `ACCOUNT_CHEVRON`, so the two cannot drift.
  - **A regression caught on the way, and fixed:** the menu was centred under the button (`placement="bottom"`), and under a 131px button its 192px width ran off the left of the window (its left edge
    was clamped to 0). It now opens `bottom start`, its left edge on the pill's (as the collapsed column's already did): measured, 4px inside the pill's edge, fully on screen, for the Super Admin and the
    Registered User.
  - **Sibling check (0.6 item 5):** the one other fill sized by a row and not by its content is the rail's rows, whose hover is the whole row by design (a row is a target as wide as the rail). No other
    `flex-1` button in the lab has a hover fill (searched). The Signed out visitor's Log in and Sign up buttons (`GuestAuthActions`, production's) are unchanged; looked at, still in place.
  - **Open:** the name is 12px (`text-xs`) beside the rail's 14px rows; it was not changed, as the hover was the request. The avatar still reads as a faint ring on the grey fill, since it is the design
    system's own avatar (fill `bg-tertiary`) and is not restyled; if it should stand out more on hover, the choices are a lighter fill (`bg-secondary`, 248, against the rows' 242) or leaving it.
  - **Verified, in a browser (Playwright, a script kept outside the repo):** the button at rest, hovered, with its menu open, and in the collapsed column, measured and looked at; the menu's position for
    the Super Admin and the Registered User; zero console errors. `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** the keyboard path (Tab to the button, Enter
    to open, Escape to close with focus back on it): no behaviour was changed, but it was not exercised; a long name (the name is a placeholder). Typography QA (0.6 item 8): no text changed. Not committed.

# 2026-10-19 - Post-6-oct lab: the user alert's hover has even padding and a visible fill

- **Oct 19 2026: Post-6-oct lab: the user alert's hover has even padding and a visible fill.** The designer, on a screenshot of the user alert in the panel's bar ("7 flagged concepts need
  review in this project") while pointed at: "hover padding is weird as heck."
  - **What was wrong (`FlaggedAlert`, `project-notices.tsx`):** the hover fill hugged its content unevenly: 4px of padding before the flag and 6px after the chevron, 28px tall by the line's
    height plus 4px each side, and drawn in `bg-secondary`, which is one step *lighter* than the bar's `bg-tertiary`, so it read as a faint lopsided smudge, not as a hover.
  - **The fix:** a fixed 28px height, 10px either side of the flag and of the chevron (`px-2.5`), an 8px radius, and a white fill (`hover:bg-primary`, a step lighter than the bar's grey, the
    way the bar's own buttons lift), with the colour change eased over 100ms. The 10px also puts the flag 24px in from the bar's edge (the bar's 14px plus 10), on the line of the page's content
    below, which the old 4px did not.
  - **Sibling check (0.6 item 5):** the same uneven padding (4px before, 6px after) was on the account button at the top left (`AccountMenu`, `shell.tsx`, hover `bg-tertiary`); it is now 6px each
    side. No other hover-filled control in the lab has unequal horizontal padding (searched). The round and pill buttons of the bar have none to be uneven.
  - **Open:** the account button's avatar is 2px further in than before, which has not been compared with the rail's rows under it.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the two files and `npm run check:contracts` clean; the classes used (`hover:bg-primary`, `px-2.5`, `h-7`) are in the compiled CSS. **Not
    verified:** the hover in a browser (none was available): the fill's size against the text, its contrast on the bar, the flag's alignment with the content below. Typography QA (0.6 item
    8) not run: no text changed. Not committed.

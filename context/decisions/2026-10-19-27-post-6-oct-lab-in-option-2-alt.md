# 2026-10-19 - Post-6-oct lab: in option 2 alt the logo is at the top left and the top row starts with the page panel

- **Oct 19 2026: Post-6-oct lab: in option 2 alt the logo is at the top left and the top row starts with the page panel.** The designer, on a screenshot of
  option 2, alt (`2026-10-19-26-*`): "move logo to top left, ? to bottom right. Move the hide/show left panel, and home to the start of the column 2
  section. (like in opt 2)". This corrects the alt's full-width top row and its empty top left, which `2026-10-19-26-*` listed as open. Option 1 and
  option 2 are unchanged.
  - **The logo moves up:** the Government of South Australia and Department for Environment and Water lockup (the same image that was at the foot of the
    rail) is now in the top-left cell of the alt, 37px tall, inset 16px like the rail's rows and centred in the 56px row. With the panel collapsed it
    shows the crest alone (the lockup's left 37px), since the icon column is 64px wide.
  - **Help stays at the bottom right:** the foot of the rail is now Help alone, right-aligned; the logo is no longer there in the alt (`RailFoot` takes
    `logo`, true everywhere else). Option 1 and option 2 keep the logo at the foot.
  - **The top row starts where the page panel does:** the panel switch, its divider and the page's trail ("Home") are back in column 2, starting at the
    panel's left edge as in option 2, and no longer run the full width above the rail (the `fullWidth` flag on `TopBar` was removed with its only
    use). The row's right end is unchanged: Add with its menu, a divider, Search, the notifications, a divider and the account.
  - **Open:** (1) the lockup is a bitmap sized by height, so it is not tuned for the 56px row at other scales; (2) the crest crop for the collapsed
    column assumes the mark is the image's left 37px, which looks right from the file's proportions and has not been looked at; (3) Help is the
    lab's inert placeholder, as before.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `npm run check:contracts` clean. **Not verified:** how it looks (the logo's size and
    vertical centring in the row, the collapsed crest, Help alone at the foot, the switch and trail starting at the panel's edge), because no browser tool
    was available. Typography QA (0.6 item 8) not run: no text added. Not committed.

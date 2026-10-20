# 2026-10-19 - Post-6-oct lab: the upload button's ring sits centred on its circle

- **Oct 19 2026: Post-6-oct lab: the upload button's ring sits centred on its circle.** The designer, from a screenshot of the upload status
  button: "utility button looks skewed. please fix." The progress ring was drawn about 1px right and down of the white circle, so it overhung
  the circle on two sides.
  - **Cause:** `2026-10-19-10-*` made the button `border-transparent`, keeping `barBtn`'s 1px border. The ring is an absolutely placed SVG
    (`inset-0`, 24px), and an absolutely placed child starts inside the border, so the 24px ring was offset by that 1px against the 24px circle.
  - **Fix (`upload-status-button.tsx`):** the button has no border (`border-0`); the frame's upload button has none either (Figma 484:4068: a
    white circle and a ring in its place), so the ring's outer edge is now the circle's edge. The note on the ring's radius records why a
    transparent border is not the same as none.
  - **Sibling check:** no other bar button draws anything over itself; the others keep their 1px border, and their icons are centred by the
    grid, which a border does not move.
  - **Open:** none raised.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** a live look at the ring
    centred in each state (running, failed, partly added, added), because no browser tool was available. Typography QA (0.6 item 8) not run:
    no text. Not committed.

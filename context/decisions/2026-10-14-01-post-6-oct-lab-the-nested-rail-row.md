# 2026-10-14 - Post 6 Oct lab: the nested rail row's left inset matches its top and bottom

- **Oct 14 2026: Post 6 Oct lab: the nested rail row's left inset matches its top and bottom.** The designer, off a screenshot of a hovered Projects row: "these hover state bit - padding left looks a bit weird visually." In `/proto/post-6-oct` only.

  **What was wrong.** A rail row is 32px high and holds a 24px icon square (which becomes the chevron button on hover), so the square sat 4px from the hover background above and below, but 8px from it on the left. The uneven inset read as accidental padding. The "..." button on the right already sat 4px from the edge.

  **Now.** The row's left padding is 4px plus 16px per level (`RailRow` in `nested-rail.tsx`, was 8px), so the square is 4px from the hover background on the left, top and bottom, and the "..." mirrors it on the right. Nothing else about the row changes. Measured in headless Chrome at 3x: row at x 16, square at x 20, 24 by 24, 4px from the row's top edge.

  **Seen, not changed:** the rail's icons now sit 6px in, where the Flat rail (`?rail=flat`) rows and the group headings sit 8px in. The Flat rail is the earlier variant and is unchanged.

  Verified: `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean; a screenshot of the hovered row checked. Not committed.

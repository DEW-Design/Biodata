# 2026-10-19 - Post-6-oct lab: the project header's facts lose their white card

- **Oct 19 2026: Post-6-oct lab: the project header's facts lose their white card.** Page feedback from the designer on
  `/proto/post-6-oct` (the row of facts under the project title: Project ID, Start Date, End Date, Status, Published by): "Let's remove this bg
  and padding."
  - **What changed (`ProjectHeader`, `project-workspace.tsx`):** the row no longer has the white fill (`bg-primary_alt`), the 8px padding or the 8px
    corners. The facts sit straight on the page, still 32px apart and 16px apart when they wrap, so they now start flush with the title's left
    edge instead of 8px inside it. The labels, values and status badge are unchanged. This departs from the designer's own earlier frame
    (Figma 484:4104, a white card with 8px of padding and corners) on the designer's say-so, so it is the lab's now, not the frame's.
  - **Open:** none raised.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** a live browser pass (the
    row's left edge against the title, the wrapped row at a narrow width), because no browser tool was available. Typography QA (0.6 item 8)
    not run: no text changed. Sibling grep: the production page's hero (`ProjectHero`) is a different component and is unchanged. Not committed.

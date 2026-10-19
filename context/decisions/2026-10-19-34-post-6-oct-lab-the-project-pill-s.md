# 2026-10-19 - Post-6-oct lab: the project pill's order is tree, properties, copy link

- **Oct 19 2026: Post-6-oct lab: the project pill's order is tree, properties, copy link.** The designer: "Swap properties and copy link. Let copy link be at the end. So the order would be:
  tree, properties and copy link."
  - **What changed (`ProjectBarControls`, `shell.tsx`):** the pill's three segments (`2026-10-19-32-*`) now read records tree, Properties, Copy link, left to right; it was tree, Copy link,
    Properties. Nothing else about them changed: the same icons, tooltips, accessible names, "on" fill for the tree and Properties, and hairlines between them. The two that open something
    (the tree beside the page, Properties from the right) are first and the one that acts at once is last, so the pill ends on the action with no panel to close. The comments that named
    the old order were updated.
  - **Open:** none raised.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `npm run check:contracts` clean. **Not verified:** the order in a browser (none was available). Typography QA
    (0.6 item 8) not run: no text added. Not committed.

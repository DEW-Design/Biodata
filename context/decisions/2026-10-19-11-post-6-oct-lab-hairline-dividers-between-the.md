# 2026-10-19 - Post-6-oct lab: hairline dividers between the project bar's button groups

- **Oct 19 2026: Post-6-oct lab: hairline dividers between the project bar's button groups.** The designer: "is there a way we can visually
  separate these icon utility buttons?" Three options were put (A hairline dividers, B joined segments, C wider gaps) and the designer chose
  **A**. The frame (Figma 484:4051) draws no separator, so the grouping and the line are this lab's.
  - **The groups (`ProjectBarControls`, `shell.tsx`):** (1) create: the "+" and, while an upload runs, the upload status button; (2) look at
    the project: the records tree, Copy link and Properties; (3) more: the "..." menu. The upload button comes and goes, so it is in the first
    group and the other groups and their dividers do not move when it does. A signed out visitor sees the "+" and the other two groups; the
    dividers stay.
  - **The line:** one 16px tall hairline, 1px, between the groups, 8px from the buttons on either side (the bar's own gap). It is Gray 300
    (`border-primary`) and not Gray 200 (`border-secondary`) because the bar is Gray 100 and the lighter line would all but disappear against
    it; it is the same divider as the tab strip's, one step stronger for the background. Drawn `aria-hidden`; each group is a `role="group"`
    named "Add", "Project" and "More", so a screen reader hears the same grouping.
  - **Open:** whether the "..." should be a group of its own (as it is now, with a divider before it) or sit with the project group without
    one; the groups could be tried at the two window widths the designer uses once seen live.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on `shell.tsx` and `npm run check:contracts` clean. **Not verified:** a live browser pass
    (the divider's contrast on the bar, spacing at rest and with the upload button present, the guest's bar, keyboard order across the groups),
    because no browser tool was available. Typography QA (0.6 item 8) not run: no text. Not committed.

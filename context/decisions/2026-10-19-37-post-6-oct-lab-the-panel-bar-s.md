# 2026-10-19 - Post-6-oct lab: the panel bar's insets are equal all round

- **Oct 19 2026: Post-6-oct lab: the panel bar's insets are equal all round.** The designer, on a screenshot of the user alert's hover in the panel's bar after the first fix
  (`2026-10-19-35-*`): "still weird padding."
  - **What was still wrong:** the white hover chip was 28px tall in a 40px bar, so about 6px from the top and bottom of the bar, but the bar's left padding was 14px, so it sat 14px from the panel's left
    edge. Its insets disagreed (6 above, 14 to the left), and it sits in the panel's rounded corner, so by CONTRACTS 2.13 its corner should be concentric with the panel's: the outer corner is 16px, so a
    chip 8px from both edges should have an 8px corner, and with 6 and 14 no radius could be.
  - **The fix (`PanelBar`, `shell.tsx`; `FlaggedAlert`, `project-notices.tsx`):** the chip is 24px tall, the height of the bar's own buttons, so a control has 7.5px above and below it in the bar and 8px
    from the edge at the side: the bar is `px-2` (it was 14px at the left and 12px at the right). With the panel's 1px border that is 8 to 8.5px from the top, the bottom and the side of the panel for
    everything in the bar, and the chip's `rounded-lg` (8px) is the panel's 16px minus that gap (2.13). It has 8px either side of the flag and of the chevron.
  - **What it trades:** the flag now sits 16px in from the panel's edge, not 24px on the line of the page's content below, which the previous fix had chosen; and the project's buttons at the right are 8px
    from the panel's edge, not 12px, so the bar's pill and circles are 4px nearer it. Equal insets round the controls were chosen over both lines.
  - **Sibling check:** the only other things in the bar are the buttons, which are 24px and so took the same vertical inset; the section bars have only the buttons. The top row (the switch and the trail)
    is a different row and was not changed.
  - **Open:** none raised; if the 16px flag against the content's 24px reads as a misalignment, the way back is a wider bar inset at the left only, which brings the unequal gaps back.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the two files and `npm run check:contracts` clean. **Not verified:** the hover chip's gaps and corner against the panel's, and the bar's buttons, in a
    browser (none was available), and the 2.13 measurement (`getComputedStyle` radius and the gap with `getBoundingClientRect`) not run. Typography QA (0.6 item 8) not run: no text changed. Not committed.

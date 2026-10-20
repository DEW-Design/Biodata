# 2026-10-19 - Post-6-oct lab: the notifications popover's spacing is even and its corners concentric

- **Oct 19 2026: Post-6-oct lab: the notifications popover's spacing is even and its corners concentric.** The designer: "Fix the visual padding of
  the notifications popup. It looks very skewed right now." No screenshot came with it, so the popover was audited in code for uneven spacing and
  four were found and fixed (`notifications-popover.tsx`):
  - **The tabs' top:** the Inbox, Activity and Archive tabs had 4px above them and 10px of padding under them (the underline tab's own), so they sat
    against the top edge. Now 12px above.
  - **The kind tabs row:** inset 12px while the tabs, day headings and rows are inset 16px, so its left edge did not line up with anything. Now
    16px, so the selected tab's box starts where the rows' icons do.
  - **Two-line rows:** the first line sat about 6px above the icon's centre, because the text block lacked the 4px a sentence row has. Both the
    upload rows and the folded group rows now have it.
  - **Corners (CONTRACTS 2.13):** the "Mark all done" button is a design system button (8px radius) with 4px of padding around it in a popover
    that was the shared Popover's 8px, so the corners were not concentric. The component keeps its radius, so the popover is `rounded-xl` (12px):
    12 - 4 = 8. The rows' hover fills run to the edge and are clipped by the popover, so they have no inner radius to match.
  - **Not changed:** the 4px around the footer button, the rows' own padding (16px sides, 12px top and bottom), the day headings and the empty
    states' spacing.
  - **Open:** if the "skew" is something else (the list's scrollbar taking width on one side, or the text and time columns), a screenshot would show
    which; a stable scrollbar gutter was left out because it adds a blank strip on the right where scrollbars are always shown.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the file and `npm run check:contracts` clean. **Not verified:** a live look and the 2.13
    measurement (`getComputedStyle` and the gap) in a browser, because none was available. Typography QA (0.6 item 8) not run: no text changed.
    Not committed.

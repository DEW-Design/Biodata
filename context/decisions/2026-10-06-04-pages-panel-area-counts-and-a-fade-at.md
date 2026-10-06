# 2026-10-06 - Pages panel: area counts and a fade at the foot of the list

- **Oct 6 2026: the Pages panel's information made a little richer and easier to scan ("make the information presented a bit nicer"), keeping its less-is-more shape (`2026-10-05-11-*`, `2026-10-06-01-*`, `-02-*`).** From the Mobbin references the designer reviewed (Cofounder's library tree shows a muted count at the right of each group).
  - **Added:** each area row ends with a muted page count at the right (`text-xs`, `text-quaternary`, tabular figures), so a group says how much is inside before it is opened; the scrolling list fades out over its last 20px (a mask, with room at the foot so the last row is clear when scrolled to the end), so a row cut by the edge reads as "more below" and not as a clipped row. While searching the count is the number of matches in that area.
  - **Verified live (Playwright, 1708x1024, Registered User, zero console errors):** counts at the right of Sign in (10), Projects (8), Explore (3), Data licence (3), Nominations (3); the cut row at the foot fades; the footer reads "44 pages" (the Data Licence Agreement Report, `2026-10-06-03-*`, is now one more for this persona). `tsc`, eslint and `check:contracts` pass.
  - **Not done:** the Emil typography pass on the counts, narrow windows.
  - **Open:** as in `2026-10-06-02-*`. Not committed.

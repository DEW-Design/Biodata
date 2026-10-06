# 2026-10-02 - Column 2 Actions sit under the navigation on Vouchers, Controlled Vocabulary and Notifications

- **Oct 2 2026: Column 2 Actions sit under the navigation on Vouchers, Controlled Vocabulary and Notifications.** Page feedback on `/pages/vouchers` (BioData Super Admin): the Actions group (Export CSV) sat at the very bottom of column 2 instead of directly under the navigation "like projects".
  - **Cause:** the source list in Voucher Management's column 2 (`SourceNav`) was a `flex-1` block inside a `flex-1` column, so it took all the free height and pushed Actions to the foot of the column. Controlled Vocabulary and Notification Management (`cv-shell`, `nt-shell`) had the same stretch, deliberately so their category list could scroll with Actions kept in reach.
  - **Fix:** the nav block no longer stretches in any of the three; Actions follows the list directly, as on Projects, DLA and DSA. In Controlled Vocabulary and Notification Management, where categories can number in the hundreds, the list is capped at 45% of the window height and scrolls inside itself, so Actions still stays near and reachable; Voucher Management has a handful of sources and needs no cap.
  - **Measured at 1708 x 1024:** Actions starts 37px under the last nav item on Vouchers, Controlled Vocabulary and Notifications, identical to Projects and DSA.
  - **Verified:** `tsc`, `eslint` on the three shells, `check:contracts`; zero page errors.
  - **Open:** Taxonomy Management has no Actions group, so it was not touched. Not committed, not pushed.

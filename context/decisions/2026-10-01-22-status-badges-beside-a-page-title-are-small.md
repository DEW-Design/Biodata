# 2026-10-01 - Status badges beside a page title are small

- **Oct 1 2026: Status badges beside a page title are small.** Designer page feedback on the Flagged concepts review
  screen: the "Questionable" tag beside the title was huge, "just use the smaller ones we're using everywhere else".
  - **Cause.** The badge passed `size="md"` (14px, 8px padding); every other badge under `app/pages` (67 of them)
    is `size="sm"`. The only other `md` was the status badge in the DSA form header.
  - **Changed.** Both are `size="sm"` (`project-detail/review-view.tsx`, `_shared/dsa/dsa-form.tsx`). Sibling grep:
    no `md` or `lg` badge remains under `app/pages`, and none is without a size.
  - **Verified:** live on `/pages/flagged-concepts?userRole=biodata-admin`: the badge measures 12px, weight 600,
    24px high, no console errors; `tsc`, `eslint`, `check:contracts` pass. The DSA form header was changed the same
    way but not opened in a browser. Not committed.
  - **Open.** `FormPage`'s `badge` slot does not fix the size itself, so a new caller could pass a large one again;
    no `AUTO` check (first occurrence, section 0.8).

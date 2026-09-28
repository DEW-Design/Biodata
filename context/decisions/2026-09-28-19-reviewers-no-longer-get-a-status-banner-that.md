# 2026-09-28 - reviewers no longer get a status banner that repeats the card, per page feedback on `/pages/nominations/NSS-2026-00003` as BioData Admin ("Why would admin see this?").

- **Sept 28 2026: reviewers no longer get a status banner that repeats the card, per page feedback on `/pages/nominations/NSS-2026-00003` as BioData Admin ("Why would admin see this?").** The page showed the panel "Waiting for review. Start a review to accept, reject or return it." That only repeated the status badge and the Start review button already on the card: the same fact in two treatments. The status banner now speaks to whoever is waiting, not to whoever acts.
  - **Nominations (`nomination-detail.tsx`):** the Submitted and Under review banners show only to the nominator. The Returned, Accepted and Rejected banners still show to everyone, because they carry the panel's note.
  - **Same pattern fixed on the sibling record pages:**
    - DLA (`dla-detail.tsx`): the Under Review banner shows only to the requester, not to an approver.
    - DSA (`dsa-detail.tsx`): the Under Review banner is gone, because DSA is admin-only, so it only ever spoke to the reviewer.
    - Both banner wrappers are `empty:hidden`, so no gap is left when there is no banner.
  - **Left as is:** the reviewer's On Hold banner on DLA and DSA. It says why the review is paused, not just what to press.
  - **Verified live at 1708x1024:** the admin sees no banner on NSS-2026-00003 (submitted), NSS-2026-00001 (under review), DLA-2026-00502 or DSA-2026-01405, and no empty gap is left. A registered user still sees the nominator or requester copy on the nominations and DLA-2026-00502. Zero console errors. `tsc`, `eslint --max-warnings=0` and `npm run check:contracts` are clean. Not committed.
# 2026-09-28 - a contained alert now draws its own card; no call site styles it any more, per designer feedback off a screenshot of the nomination form's "open nomination" note ("absolute violation of design system contract").

- **Sept 28 2026: a contained alert now draws its own card; no call site styles it any more, per designer feedback off a screenshot of the nomination form's "open nomination" note ("absolute violation of design system contract").**
  - **The violation:** `AlertFullWidth contained` only removed the full-bleed chrome and left the box to each caller's `className`. So the same component looked different on every screen:
    - the form's "Details missing": 300 border and a tinted background;
    - the DLA, DSA and User Management banners: a 200 border and no background;
    - the nomination form notes: at first nothing, then a 200 border;
    - the project record route's notices: no box at all.
    That is a component styled at the call site, which CONTRACTS 1.9 forbids (the fix goes into the component, once).
  - **The fix (`components/application/alerts/alerts.tsx`):** `contained` now renders a rounded-lg card with a 1px border and a background, both from the alert's `color` (the same tint map `tintedBackground` uses), and 16px padding. Its doc comment says callers pass no border, background, radius or padding classes.
  - **Call sites cleaned** (21 alerts): `form-page.tsx`, `dla-detail.tsx`, `dsa-detail.tsx`, `nomination-detail.tsx` (its `banner` class constant is gone), `nomination-form.tsx`, `um-detail.tsx` and `species-restriction.tsx` lost their `className` shape overrides and the now-redundant `tintedBackground`. The project record route's two notices get the card with no change there.
  - **Left as is:** Explore option 1's full-width banner (a teammate's page, and not a contained card).
  - **Docs:** the Alert page gains a "Contained" example (a brand notice and an error "Details missing") and says the card's look comes from the component.
  - **Copy:** the open-nomination note read "NSS-2026-00004 is returned for more information". It now reads "NSS-2026-00004. Status: Returned for more information."
  - **Verified live:** computed styles on the form's "Details missing", the nomination form's open-nomination note, the DLA "Rejected" banner, a nomination's "Waiting for review" banner and the docs example all show a 1px border in the colour's tint, a tinted background, an 8px radius and 16px padding. Zero console errors. `tsc`, `eslint --max-warnings=0` on touched files and `npm run check:contracts` are clean. Not committed.
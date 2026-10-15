# 2026-10-15 - Newsletter template: Suspense around the content so the Pages static export builds

- **Oct 15 2026: Newsletter template: Suspense around the content so the Pages static export builds.** Found when PR #15 (sai-wips into main) ran the Pages build: `useSearchParams() should be wrapped in a suspense boundary at page "/nltemplate"`, exit code 1. The audit check passed.

  **Cause.** The newsletter's blocks (`app/nltemplate/blocks.tsx`) link through `useRoleHref`, which reads the search params through `useUserRole`. `NewsletterFrame` wrapped only the Prototype tools bar in Suspense, not the content, so the static export of `/nltemplate` bailed out. This came in with the newsletter commits already on `sai-wips` (7ab8ed9), not with the post-6-oct lab or the mohan-wips merge. The same class of failure was fixed once before for Explore (PR #7, "Explore switcher Suspense").

  **Fix.** `NewsletterFrame` wraps its children in `<Suspense fallback={null}>`. One line, `app/nltemplate/newsletter-frame.tsx`; the page, its blocks and its look are unchanged. `/nltemplate/infographic` does not use the role hooks and was not failing.

  **Sibling grep (0.6 item 5, 0.8):** this is the second time a page used a role hook without a boundary in a Pages build (the first was Explore, #7). Open for the designer: add an `AUTO` check for a page whose component tree reaches `useRoleHref` or `useUserRole` with no Suspense above it, or keep relying on the Pages build to catch it (0.8 says to promote the second fix to a check).

  Verified: `npx tsc --noEmit` and `npx eslint app/nltemplate` clean; the Pages build on the PR is the check for the export. Not pushed when written.

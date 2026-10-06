# 2026-10-06 - Contribute Now goes to login; Tailwind stops scanning audit and decision prose

- **Oct 6 2026: Contribute Now goes to login; Tailwind stops scanning audit and decision prose.** Designer page feedback on the
  signed-out front door (`/pages/biodata-home`, marketing, exempt from the shell contracts): the "Contribute Now" link, "Go to
  login from here", and the Contribute Data card in the "Where to next" grid, "Go to Login page."
  - **Changed (`biodata-home/page.tsx`).** Both "Contribute Now" buttons, the one in the Contribute section and the one on the
    "Contribute Data" card of "Where to next", now go to `/pages/auth/login` (one constant, `LOGIN_ROUTE`). Contributing needs an
    account, so the first step is to sign in; the login page already links on to sign up. "Learn how to Contribute" and the
    header's "Contribute Data" still scroll to the Contribute section, which explains it.
  - **Found on the way (not mine, fixed because it broke every page).** A new audit report written by another session
    (`audit/design-consistency-2026-10-06-lanes/typecolour.md`) quotes class patterns such as
    `ring-[var(--color-brand-50|100)]`. Tailwind reads every file in the repo for class names, turned that text into a class, and the
    CSS then failed to parse: the dev server answered 500 on every page. `app/globals.css` now says `@source not "../audit"` and
    `@source not "../context"`: reports and the decision log are prose, never source. (`.context/` is already ignored by git, so
    not scanned.) Anything else that quotes class patterns in a new top-level folder would need the same.
  - **Not decided.** Whether a signed-in person who reaches this page should skip the login (the page is the signed-out front door;
    the button does not look at who is viewing).
  - **Verified:** live as a public user: both "Contribute Now" links have `href="/pages/auth/login"` and clicking each opens the
    login; no console errors; the pages answer 200 again; `tsc`, `eslint` and `check:contracts` pass.

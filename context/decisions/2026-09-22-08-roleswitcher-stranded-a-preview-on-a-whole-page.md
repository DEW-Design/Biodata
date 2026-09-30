# 2026-09-22 - `RoleSwitcher` stranded a preview on a whole-page access restriction instead of taking the user

- **Sept 22 2026: `RoleSwitcher` stranded a preview on a whole-page access restriction instead of taking the user
  somewhere they could actually explore - fixed. Flagged directly by the user off a screenshot: switching to
  `public-user` while previewing a DSA record left them staring at "Data Sharing Agreements are managed by BioData
  Admins," not a bug in the access gate itself** ("It's good you have checks and balances but this is not the
  expected behaviour") - the gate was correct, the switcher's own navigation wasn't.
  - **Root cause**: `setRole` (`app/pages/_shared/role-switcher.tsx`) reapplied the newly picked role to whatever
    `pathname` the FAB happened to be opened on, unconditionally. For an ordinary page that's right - most controls
    are gated individually, the page itself stays visible (see `role-access.config.ts`'s own convention) - but
    `/pages/dsa/**` is the one route so far that's gated as a whole page (`DsaShell` swaps all of `main` for a
    restriction message when `hasFeatureAccess("dsaManagement", role)` fails), so previewing a blocked role there
    just re-rendered the same restriction under the new role instead of leaving the preview somewhere useful.
  - **Fix**: a small `wholePageGates` allowlist (`{ prefix: "/pages/dsa", feature: "dsaManagement" }`, one entry
    today) checked before navigating - if the target role fails that feature's check for the current path, `setRole`
    redirects to `/pages/dashboard` (Home, reachable and honest for every role) with a clean query string instead of
    carrying over params that mean nothing there (DSA's own `?status=`); otherwise it stays on the current path
    exactly as before. A direct visit to `/pages/dsa` by a blocked role is untouched - `DsaShell`'s own restriction
    message is still correct for someone landing on the URL itself (an old link, a bookmark); only the *switcher's*
    live-preview behaviour changed. Kept as an explicit short list rather than inferred from nav-tree membership -
    `project-detail`/`observation-detail` are real, unrestricted pages with no nav key of their own, so "not a nav
    key" isn't the same signal as "this role can't view it."
  - Verified `tsc --noEmit`/`eslint` clean, then a live Playwright pass across 4 scenarios: `biodata-admin` on a DSA
    record switching to `public-user` now redirects to `/pages/dashboard?userRole=public-user` (0 restriction
    messages, the guest gradient card renders); `biodata-admin` on `/pages/project-list` switching to
    `registered-user` stays on `/pages/project-list?userRole=registered-user` (both roles can view it, no unwanted
    redirect); a direct visit to `/pages/dsa?userRole=registered-user` still shows the restriction message unchanged
    (confirming only the switcher's own behaviour changed, not the gate); and `registered-user` on `/pages/dsa`
    switching to `biodata-admin` (who can manage DSAs) stays on `/pages/dsa?userRole=biodata-admin` with the real
    list content rendering - zero console errors across all four.
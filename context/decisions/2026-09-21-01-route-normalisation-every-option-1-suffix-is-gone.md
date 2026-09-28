# 2026-09-21 - route normalisation: every `/option-1` suffix is gone; each sidebar-shell page lives at

- **Sept 21 2026 route normalisation: every `/option-1` suffix is gone; each sidebar-shell page lives at
  its plain route.** `project-list`, `project-detail`, `observation-detail`, and `observations` moved
  (`git mv`, history kept) from `app/pages/<name>/option-1/page.tsx` to `app/pages/<name>/page.tsx`,
  finishing what the Sept 16 decision did for `dashboard` alone. The convention going forward: **a
  page under `/pages` has no `/option-*` suffix once it is the chosen direction; `option-N` folders
  exist only while a screen is still a competing exploration.** `dashboard/option-2` and
  `project-list/option-2` stay in place, untouched, as records of the explored top-nav direction, per
  the "never delete an explored direction" convention. `lib/registered-user-nav.ts`'s `keyHref(key)` is
  now simply `/pages/${key}` with no special case, so a new keyed section needs no route bookkeeping.
  - Every internal link, `router.push` target, breadcrumb crumb, and doc-page link was repointed, and
    file-path references in code comments were updated to the new paths. Old URLs (`/pages/<name>/
    option-1`) now 404, same as `/pages/dashboard/option-1` did after its own fold - no redirects were
    added, since these are working screens reached by direct URL, not published surfaces.
  - **Older entries in this file still say `<name>/option-1`.** They are a historical record of the
    work as it happened and were left as written; read them with the paths above in mind rather than
    treating them as current routes.
  - Found and fixed while crawling every internal link for both roles: `FeaturedProjectCard` on Home
    linked with a bare `project.href`, so clicking a featured project dropped the active `userRole`
    (the same dead end `useRoleHref` exists to prevent) - now wrapped in `roleHref`.
  - **Applied across every persona, not just the two in build focus:** the crawl and rail click-through
    was run for all six roles (`biodata-admin`, `biodata-user`, `privileged-admin`, `privileged-user`,
    `registered-user`, `public-user`) across the 5 canonical pages plus both `option-2` records - 42 page
    loads, all 200, zero console errors, every rendered `/pages/**` link carrying the loaded role, and
    Home/Projects/Explore in the rail landing on `/pages/dashboard`/`/pages/project-list`/`/pages/observations`
    with the role preserved for each.
  - **The option-2 top-nav shells linked to a page that never existed.** Both build `/pages/${node.key}/
    option-2` for every keyed nav node, and the `observations` key (added with the Explore page) has no
    option-2 page, so their "Explore" entry 404'd. Found by the all-roles crawl, not by reading code. They
    now link only the keys in `OPTION_2_KEYS` (`dashboard`, `project-list`) and render any other keyed node
    as a plain label, the same non-link fallback those files already used for un-keyed sections.
  - Verified live (public-user/registered-user first pass): all 6 pages return 200, every `/pages/**`
    link rendered on them resolves 200 and carries `userRole`, the old `/option-1` URLs 404, and the
    landing -> Explore -> public dashboard -> rail (Projects/Explore/Home) and project-list row ->
    project-detail flows land on the plain routes with zero console errors. `tsc`/`eslint` clean.
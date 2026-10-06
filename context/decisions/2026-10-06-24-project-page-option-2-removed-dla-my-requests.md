# 2026-10-06 - Project page option 2 removed; DLA My requests only for every role but BioData Admin

- **Oct 6 2026: Project page option 2 removed; DLA My requests only for every role but BioData Admin.** Two instructions from the
  designer: "Remove project option 2 from the prototype route" and "Privileged / Biodata User will be limited to their own DLA requests".
  - **Which option 2 (asked).** The project page's second layout, not Add Project's. Add Project option 2 (the three-column form) stays.
  - **Removed.** `/pages/project-detail/option-2` (`page.tsx` and the 1,527-line `project-detail-view.tsx`, the older Adelaide Hills
    layout with tabs and the records tree), the project page's Layout tool (`project-detail-layout-switcher.tsx` and the
    `layoutSwitcher` prop of `ProjectDetailTemplate`), and its entry in the Pages map (`screen-index.ts`). Nothing else imported the
    deleted files. The project page at `/pages/project-detail` and every project's page are unchanged and now have no Layout tool.
    Opening the old address is a 404. Git keeps the history (CONTRACTS 4.4: when a direction is chosen the others are deleted).
  - **DLA scope.** `dlaAllView` is now an empty list (`config/role-access.config.ts`): only BioData Admin has "All requests"; the
    Privileged roles and BioData User now have "My requests" alone, as the Registered User already did. It supersedes the earlier
    entry of the same day (decision 2026-10-06-23), which let them keep both. `ref-roles.md` and the `dla-scope.ts` comment follow.
  - **Verified:** `tsc` (after clearing the stale `.next/types`), `eslint` on `app/pages` and `config`, `check:contracts`. In a live
    browser: Privileged User, BioData User and Registered User have "My requests" alone (also with `?scope=all`) and two rows;
    BioData Admin has both views and nine rows; `/pages/project-detail/option-2` is a 404; `/pages/project-detail` loads with no
    Layout tool. Not committed at the time of writing.
  - **Open.** The `records-explorer.tsx` header still calls itself "version 3", a history of comparisons that no longer has a route.

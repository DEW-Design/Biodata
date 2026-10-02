# 2026-09-30 - Rail order: Template Finder now sits before Reports

- **Sept 30 2026: Rail order: Template Finder now sits before Reports.** By direct request from the designer, the two last items in column 1 swap places.
  - **Changed:**
    - `lib/registered-user-nav.ts`: `Template Finder` now comes before `Reports (Own Submissions)` in `registeredUserNav`. `biodataAdminNav` is derived from it, so it follows. `publicUserNav` has neither section.
    - `app/proto/project-detail/page.tsx`: the lab's `railSections` mirror of the rail was swapped to match. It is a lab (5.4), so this is only to keep the copy honest.
  - **Rail order now:** Home, Projects, Explore, (User Management, admin only), DLA, (DSA, admin only), Nominate Sensitive Species, Template Finder, Reports.
  - **Verified:**
    - `tsc --noEmit`, `eslint --max-warnings=0` on both touched files, and `npm run check:contracts` are clean.
    - The rendered rail order was read from the running dev server for registered-user, biodata-admin and public-user, and matches the list above.
    - **Not done:** a live browser pass with screenshots and a console-error check. No Playwright-compatible browser could be launched in this environment (Chrome is not installed, the Chromium download was refused, and Arc would not start under Playwright).
  - **Sibling grep:** `sectionIcons` in `nav-icons.ts` is keyed by label, not order, so it needed no change. No other file hard-codes the order.
  - **Still open:** the Template Finder access conflict (the Figma frame says "All Users", the decided IA gives a public user no Template Finder) and the "Project ID / Title" filter, both from 2026-09-29-30.
  - Not committed.

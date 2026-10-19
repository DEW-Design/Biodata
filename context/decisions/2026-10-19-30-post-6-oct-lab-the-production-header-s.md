# 2026-10-19 - Post-6-oct lab: the production header's right end as a sixth version of option 2's top right

- **Oct 19 2026: Post-6-oct lab: the production header's right end as a sixth version of option 2's top right.** The designer, after the five versions in
  `2026-10-19-29-*`: "What if we also saw what the current state (as in the production prototype) looks like in this layout?" Read as: the top right as production's
  `AppHeader` has it today, drawn in option 2's frame, beside the other versions. Lab only (CONTRACTS 5.4).
  - **What production has (`app-header.tsx`):** on the right, the global search field (a full-width combobox, 256px, 395px from the lg breakpoint, with its typeahead of
    projects and species), the Add button (the `CreateMenu`: a primary button with a plus, "Add" and a chevron), then, 24px on, the profile (`ProfileMenu`: a 40px avatar and a
    chevron) or, for a signed out visitor, Log in and Sign up (`GuestAuthActions`). Its left (the logo lockup, a divider, the BioData SA wordmark, the breadcrumb with the org
    pill) is not part of this version.
  - **The sixth version, `production` (`?cluster=production`, the Top right tool):** those real components (`GlobalSearch`, `CreateMenu`, `ProfileMenu`, `GuestAuthActions`) at their
    own sizes in option 2's top row, nothing re-drawn or restyled, so it is production as it is. In option 2 the account is already at the top left, so the profile is drawn only
    in the alt, at the right, as it is in production. The default is still `icons`; `current` and the other four are as they were.
  - **What differs from production, because of the frame:** the row is 56px, so the 40px avatar fits with 8px to spare; the search and the Add menu act as they do on `/pages`
    (the search goes to the production Explore page, the Add menu to the production forms), not into the lab's tabs; the real `CreateMenu` opens the project picker without
    a current project, because the lab's address is not a production project page.
  - **Open:** (1) the other reading of the question: the whole production frame (its header, rail and column 2) as a layout to switch to, around the same page. That would
    open the live `/pages` screen for the page being looked at, with the role kept, as the Prototype bar's "In production" link already does for a folded lab
    (`production-routes.ts`); it was not built, and the way back from a production screen to the lab would need a tool on the production screens, which `app/pages`
    cannot import from a lab (5.4); (2) `production` is wider than `icons` by about 360px.
  - **Verified:** `npx tsc --noEmit`, `npx eslint` on the three files and `npm run check:contracts` clean; `?cluster=production` serves (200) in options 2 and 2, alt. **Not
    verified:** how it looks (the 395px field and the 40px avatar in the 56px row, the search's typeahead opening under the top row, the Add menu from the real component, the
    guest's Log in and Sign up), because no browser tool was available. Typography QA (0.6 item 8) not run: no text added, the components carry their own. Not committed.

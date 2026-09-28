# 2026-09-22 - `/proto/public-user`'s explorations folded into the real `/pages/*` shells, per direct

- **Sept 22 2026: `/proto/public-user`'s explorations folded into the real `/pages/*` shells, per direct
  instruction** ("fold all the explorations we did for public-user into our /pages/* production route. I liked the
  'Reference' variant"). Everything the lab worked out - the gradient card with per-tab copy, and a real column 2 -
  had stayed lab-only; production's `dashboard`/`project-list` still ran the pre-Sept-21 "no aside, no gradient card"
  branch for `public-user`'s Home/Projects. Folded in, not re-derived:
  - **New shared file `app/pages/_shared/guest-home.tsx`** - `GuestGradientCard` (the gradient surface, one ask per
    Flora and Fauna Dashboard tab from the lab's `tabAsks`, always ending in "Create a free account") and
    `GuestAboutAside` (the picked "Reference" variant - "What is BioData SA?" plus a Guides list, both always
    visible, no accordion/interaction - Disclosure and How it works, the two variants not picked, are unchanged and
    still live in the lab as the record of what was considered, per the "never delete an explored direction"
    convention). Guide rows and their copy are ported verbatim from the lab (the real Knowledge Centre categories
    from `/pages/biodata-home`, one real link to that page's own section - no fabricated per-guide pages).
  - **Wired into both `dashboard/page.tsx` and `project-list/page.tsx`'s `isPublicUser && (activeSection === "Home"
    || activeSection === "Projects")` branch** - the same aside renders for both sections (only the eyebrow label
    differs, matching the lab exactly), and only Home also gets the gradient card above the real
    `DataOverviewContent` - Projects renders the real `ProjectListContent` directly under the aside, same as the lab
    and the "features reduce, they don't change fundamentally" decision this persona already follows.
  - **A new `guestDashboardTab` state** in both files drives `DataOverviewContent`'s controlled `activeTab`/
    `onActiveTabChange` props, separate from the existing `homeTab` state (registered-user's My BioData/Flora-
    Dashboard switcher, which doesn't apply to a guest) - so the gradient card's copy changes with whichever Flora
    and Fauna Dashboard tab (Overview/Flora/Fauna/Projects) the guest is actually on.
  - **Not changed**: the header's "Add project"/"Upload dataset" stay visible with the real `GuestActionButton`
    sign-up-invite behaviour for `public-user`, same as registered-user's copy of the header - the lab's own
    `GuestHeader` predates the later decision to stop hiding these for guests entirely (see the "Stale note" under
    the `BiodataLandingPage` merge above) and was correctly *not* folded back in, since that would have been a
    regression, not a fold-in.
  - Verified live: `public-user` on `/pages/dashboard` shows the aside, the gradient card ("Every species record
    starts with a sighting"), and switching to the Flora tab both changes the Flora and Fauna Dashboard's own content
    and the gradient card's headline ("Found a plant that isn't on the map?") together; "Create a free account" opens
    the real sign-up modal with that tab's own copy. `public-user` on `/pages/project-list` shows the same aside
    (eyebrow "PROJECTS") beside the real, unmodified Projects table, no gradient card. `registered-user` and
    `biodata-admin` on `/pages/dashboard` are unaffected (no aside change - they already had one via `HomeTabPanels`).
    `tsc`/`eslint` clean, zero console errors.

# 2026-09-24 - `/proto/collection-sidebar` grew the two queued directions above into real,

- **Sept 24 2026: `/proto/collection-sidebar` grew the two queued directions above into real,
  side-by-side variants, per direct instruction ("make actions the baseline and come up with some
  variants from the above patterns") - `ProtoPicker` is back, comparing Baseline / Status Tabs / My
  Items.** Both real, shipped list components (`app/pages/_shared/dsa/dsa-list.tsx`,
  `app/pages/_shared/dla/dla-list.tsx`) gained two more additive, opt-in props alongside their
  existing `banner` - `statusTabs?: ReactNode` (rendered directly under `SectionHeader.Root`,
  before the empty-state/table branch) and `extraFilter?: (record) => boolean` (applied to the
  status bucket before search/pagination ever see it, so the header's count badge, the empty
  state, and pagination all stay honest about what's actually showing). Both default to
  `undefined` - every real `/pages/dsa` and `/pages/dla` route is unaffected.
  - **The corrected finding from the round above, verified directly rather than left as an
    assumption:** DSA does have a real submitter field after all - `dsa-data.ts`'s own seed data
    gives every agreement a real `requestedBy: DsaContact`, including Olivia Wyatt, the same
    placeholder-person convention DLA's `requestor` already uses. So "My Agreements"/"All
    Agreements" is exactly as real for DSA as "My Requests"/"All Requests" is for DLA - the earlier
    "still an open question" note was answered by actually reading the data, not by guessing.
  - **Status Tabs**: a real horizontal `Tabs`/`TabList type="underline" size="md"` row (matching
    project-detail's own `ContentTabs` usage exactly, not a bespoke build) replaces the
    `StatusNavColumn` list - column 2 becomes Actions alone, with no `mt-4 border-t` floating rule
    now that it's the only thing there (`DsaActions`/`DlaActions` gained a `withTopRule?: boolean`
    prop, default `true`, so Baseline's own layout is untouched).
  - **My Items**: a real vertical `Tabs`/`TabList orientation="vertical" type="button-brand"
    fullWidth` switcher in column 2 (`ScopeSwitcher`) - the exact same component/type/orientation
    as Home's own My BioData / Flora and Fauna Dashboard split (`app/pages/dashboard/page.tsx`),
    not a lookalike built from scratch. "Mine" filters to whichever contact's name matches "Olivia
    Wyatt" (`contactName(d.requestedBy)` for DSA, `requestorName(d.requestor)` for DLA) - the same
    "current signed-in user" placeholder this build already uses everywhere else. This variant
    carries Status Tabs' own change forward (status still needs a home once the switcher takes
    column 2), rather than stacking two nav lists.
  - **A real, previously-unnoticed bug in the shipped `Tab` component was caught during this
    build's own live verification, not invented for the lab: `{badge && (<Badge>...)}` in
    `components/application/tabs/tabs.tsx` is the classic React `0 &&` gotcha** - a real, valid
    `badge={0}` (an empty status bucket shown as a tab, e.g. "Revoked 0" on this exact screen) is
    falsy, so `&&` rendered the bare text "0" glued to the label instead of a zero-count pill,
    visible as "Revoked0" with no space. Fixed to `{badge != null && badge !== "" && (...)}`,
    correcting every consumer of `Tab`'s `badge` prop at once (this lab's Status Tabs, and any
    future real page that shows a zero-count status as a tab), not just this lab's own usage.
    Grepped for the same `count &&`/`.length &&` shape elsewhere in the codebase - no other
    instance found.
  - Verified `tsc --noEmit`/`eslint` clean on every touched file
    (`app/proto/collection-sidebar/page.tsx`, `dsa-list.tsx`, `dla-list.tsx`,
    `components/application/tabs/tabs.tsx`), then a live Playwright pass (installed for the
    session, removed after, `package.json`/`package-lock.json` confirmed unchanged): all three
    variants render for both DSA and DLA with zero console errors; Status Tabs' own tab click
    correctly filters the table (Drafts -> 1 row) with the corrected zero-count "Revoked 0" pill
    rendering properly; My Items' scope switch correctly narrows DSA to Olivia Wyatt's one active
    agreement (count badge 5 -> 1) and correctly shows DLA's own real, honest empty state ("No
    active agreements") for "My Requests" x Active, since Olivia Wyatt has no active DLA record in
    the seed data - the `extraFilter` -> empty-state path works end to end, not just the row-count
    path. `ProtoPicker` itself moved into the header (not a fixed bottom-right overlay) since that
    corner is already claimed by the dev-only Agentation feedback toolbar and `RoleSwitcher`'s FAB.
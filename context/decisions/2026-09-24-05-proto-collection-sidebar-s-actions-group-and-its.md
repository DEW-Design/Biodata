# 2026-09-24 - `/proto/collection-sidebar`'s "Actions" group and its two column-3 banners

- **Sept 24 2026: `/proto/collection-sidebar`'s "Actions" group and its two column-3 banners
  folded into the real `/pages/dsa`/`/pages/dla` shells, per direct instruction ("we should fold
  actions into production, please").** Only the unified status model had been rolled into
  production so far - the Baseline variant's own "Actions" (Export CSV / Create report, plus the
  "Drafts to finish"/"Requests awaiting review" and "nearest to expiry" `TaskItem` banners) was
  still lab-only until this pass, confirmed by grepping `dsa-shell.tsx`/`dla-shell.tsx` for
  "Export CSV" before starting (zero hits).
  - **New shared file `app/pages/_shared/agreement-actions.tsx`** - `downloadCsv` and
    `ActionsGroup` (the "Actions" label + Export CSV + Create report block), ported verbatim from
    the proto's own styling (`shortcutRowClassName`, the `border-t` divider). Each shell still
    supplies its own CSV export via `onExportCsv`, since the columns genuinely differ between an
    agreement and a request - only the wrapper/label/button styling and the "Create report" toast
    are shared.
  - **`nearestToExpiry`** (the 60-day-window helper behind the expiry banner) moved from the proto
    into `agreement-status.ts`, alongside `effectiveStatus` - the natural shared home now that a
    real production consumer exists too, not just the lab.
  - **`StatusNav` in both shells renders `<ActionsGroup>` directly after the status list**, inside
    the same `<div className="flex flex-col gap-1">` root (not a sibling under the aside's own
    `justify-between`, which would have pushed it to the bottom next to `FooterLinks` instead of
    right under the status list) - real navigation/real data throughout, no lab-only local state:
    `onExportCsv` calls the real `downloadCsv` against `useDsas()`/`useDlas()`'s own live array.
  - **`DsaBanner`/`DlaBanner` exported from `dsa-list.tsx`/`dla-list.tsx`** (co-located with the
    `banner` prop they fill, per that file's own convention) instead of staying page-local like the
    proto's version - both are now fully self-contained (`useDsas()`/`useDlas()`, `useRoleHref()`
    internally), so `app/pages/dsa/page.tsx`/`app/pages/dla/page.tsx` only need
    `banner={<DsaBanner />}`/`banner={<DlaBanner />}`, no props to thread through. The proto's own
    `onViewStatus` local-state callback is gone entirely - production has a real `?status=` URL, so
    "Review drafts"/"Review requests" are real `actionHref` links (`roleHref("/pages/dsa?status=
    draft")`) instead of a simulated in-page switch, simpler than the lab's own version needed to
    be.
  - **Ported as-designed, not redesigned for the new status model** - `DsaBanner` still keys off
    `draftCount` (DSA's own requester-facing action) and `DlaBanner` still keys off `under_review`
    count (the reviewer's own queue), the same two conditions already tested in the lab. Both are
    still real, valid triggers under the new unified workflow (Draft and Under Review are both
    still real statuses) - extending this to also flag `submitted` records (now a distinct,
    genuinely actionable "needs someone to Start Review" state that didn't exist when this banner
    was designed) is a reasonable next step but wasn't done here, since it wasn't part of what was
    being folded in - logged here rather than silently added.
  - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, then a live Playwright pass
    on both real production pages (not the lab): confirmed "Actions" renders below the full 9-status
    list on both `/pages/dsa` and `/pages/dla`, clicking "Export CSV" fires a real file download
    (`data-sharing-agreements.csv`/`data-licencing-agreements.csv`, not a dead button), "Create
    report" fires the real "not wired up yet" toast, and the "Drafts to finish"/"Requests awaiting
    review" banners render correctly above the search bar on each page's default (Active) view with
    the correct real counts - zero console errors either page. Chromium/Playwright installed for
    the session only, removed after; `package.json`/`package-lock.json` confirmed unchanged.
  - **Follow-up, same day: the "Actions" label's own spacing to its first row didn't match the
    status list's, flagged directly by the user off a screenshot.** Two separate bugs, not one:
    (1) `ActionsGroup`'s label used `mb-1 px-2` (copied from the proto's own `GroupLabel`) while
    `StatusNav`'s "Agreements"/"Requests" label uses `mb-3` with no horizontal padding - fixed to
    match exactly, in both the real `agreement-actions.tsx` and the proto's own `GroupLabel`
    (same bug, same fix, both files). (2) Matching the label's margin alone wasn't enough - the
    status list's real label-to-first-row gap is `gap-1` (4px, from `StatusNav`'s own `flex
    flex-col gap-1` wrapper) *plus* the label's `mb-3` (12px) = 16px, not 12px, so `ActionsGroup`'s
    wrapper needed the same `gap-1` too (measured live via `boundingBox()`, not eyeballed: 12px
    before this second fix, 16px after, matching the status list exactly on both `/pages/dsa` and
    `/pages/dla` and in the proto). Caught and fixed while there: the proto's own `DsaActions`/
    `DlaActions` had a redundant inner `flex flex-col` div with no gap of its own, restructured
    into one `flex flex-col gap-1` wrapper matching `StatusNavColumn`'s shape exactly (also fixed a
    stray leftover closing `</div>` in `DlaActions` from that restructure). Verified `tsc --noEmit`/
    `eslint` clean and a live Playwright pass measuring real `boundingBox()` gaps (not assumed from
    the className) on `/pages/dsa`, `/pages/dla`, and `/proto/collection-sidebar` - all three now
    read exactly 16px for both the status-list and Actions label gaps, zero console errors.
  - **Follow-up, same day: "My Items"' single-status Tabs row replaced with a real status filter +
    a Status column, per direct instruction** ("All Agreements and My Agreements with the filters
    having all statuses. And the table having a status column"). "My Items"' whole point is that
    My/All is a *scope*, not a status bucket - it had still been showing exactly one status bucket
    at a time via the same `StatusTabsRow` "Status Tabs" itself uses, which didn't actually answer
    what a scope-only view needs: every status visible at once, filterable, with each row's own
    status legible in the table.
    - **`DsaAllStatusesTable`/`DlaAllStatusesTable`** (new, proto-local - not a change to the real
      `DsaListContent`/`DlaListContent`, same "build a local mirror for an unvalidated direction"
      precedent as `StatusNavColumn`/`StatusTabsRow`/`ScopeSwitcher` above) - `SectionHeader` +
      search + a real `StatusFilterSelect` (a `MultiSelect` offering all 9 statuses, empty
      selection = no filter = every status shown) + `TableCard`/`Table` with a real Status `Badge`
      column + numbered pagination - the full "Section header, then search, then table" contract,
      plus the filter. Column shapes mirror the real `DsaListContent`/`DlaListContent` closely
      (Agreement/Data partner/Status/Requested by/Updated; Request/Requestor/Status/Locations/
      Updated) with a live Status column standing in for what column 2 used to say.
    - **`statusInColumn3` narrowed to `variant === "Status Tabs"` only** - "My Items" no longer
      renders `StatusTabsRow` at all, and `dsaExtraFilter`/`dlaExtraFilter` (passed into
      `DsaListContent`/`DlaListContent`) were replaced with `scopedDsas`/`scopedDlas` (the My/All
      filter applied directly to the array before it ever reaches the new table), since "My Items"
      no longer renders those shared components in `main` at all.
    - Verified `tsc --noEmit`/`eslint` clean, then a live Playwright pass: DSA's table shows all 14
      seeded agreements across every status with a real Status column (confirmed each row's own
      badge text); "My Agreements" correctly scopes to Olivia Wyatt's 3 records; the status
      `MultiSelect` filter live-updates the table the instant a box is checked, confirmed with the
      popover still open (2 rows, both Closed) before ever closing it; DLA's own table (Request/
      Requestor/Status/Locations/Updated, 9 total rows, 2 for "My Requests") works identically -
      zero console errors throughout. One testing-tool nuance re-confirmed, not a product bug: this
      codebase's `MultiSelect` already documents that pressing Escape while its popover is open
      clears the selection instead of just closing it (a pre-existing, known gap logged elsewhere
      in this file) - hit again here by an early draft of the verification script, worked around by
      checking the live-filtered table state directly instead of relying on Escape to commit.
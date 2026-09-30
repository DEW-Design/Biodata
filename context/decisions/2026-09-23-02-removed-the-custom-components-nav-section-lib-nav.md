# 2026-09-23 - removed the "Custom Components" nav section (`lib/nav.ts`) and its one "Date range" entry, per

- **Sept 23 2026: removed the "Custom Components" nav section (`lib/nav.ts`) and its one "Date range" entry, per
  direct user feedback that the section is deprecated.** Same precedent as the earlier "Marketing" nav-section
  removal above: the underlying page (`app/(docs)/custom-components/date-range/page.tsx`) and component
  (`components/custom/date-range/date-range-control.tsx`) are untouched and still real - `DateRangeControl` is
  still the live control filling the `GapDateRange` placeholder on both `/pages/dashboard` and
  `/pages/project-list`, so deleting it would break two real production screens, which isn't what was asked.
  Only the nav entry (sidebar + the generated `/llms.txt`, both driven by `lib/nav.ts`) is gone; the doc page is
  reachable by direct URL only now, same convention already used for `/pages/*`, `/test-*`, and the earlier
  FAQ-accordion page.
  - **`/llms.txt` is a generated route** (`app/(docs)/llms.txt/route.ts`), not a checked-in static file - it reads
    `staticNav()` off `lib/nav.ts` at request time, so it can never drift from the sidebar by construction. Verified
    live after this change: it lists `Textarea` under Components and no longer has a `## Custom Components`
    section at all - a 1:1 match with `lib/nav.ts` with no manual edit needed to the route itself.
  - **`README.md`'s own Components/Custom Components tables are hand-maintained** (see the Sept-earlier
    "documentation debt" entry above - this is the same file, same drift risk) and had already gone stale again:
    missing `Textarea` entirely and still carrying the now-removed Custom Components section. Regenerated both to
    match `lib/nav.ts` exactly in the same pass, rather than leaving `/llms.txt` correct while README quietly drifted.
  - Verified `tsc --noEmit`/`eslint` clean, and live: the sidebar/`/llms.txt` show 0 "Custom Components" hits,
    `/custom-components/date-range` still returns 200 by direct URL, and both `/pages/dashboard` and
    `/pages/project-list` (the real `DateRangeControl` consumers) still return 200 with the control unaffected.
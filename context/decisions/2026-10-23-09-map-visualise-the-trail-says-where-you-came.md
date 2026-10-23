# 2026-10-23 - Map visualise: the trail says where you came from, and the way back is checked

- **Oct 23 2026: Map visualise: the trail says where you came from, and the way back is checked.** The designer: "Remember, we need to make sure that the wayfinding and page transitions are intuitive. I know
  where I've come from, I know what to do here, and I know how to get back." Taken as a standing test for the report to map to report flow, and run on it. Through `/refine-prompt` (the design vocabulary has no term
  for a trail that names the page you came from, so it is described plainly; no engineering term applies). Assumed: the flow is the Data Validation Error Report to Map visualise and back, the last thing built.
  - **Measured, in a browser (Playwright, a script outside the repo), as BioData Admin at 1440 x 900:** report to Map visualise: the card is on screen at 60ms (no frame of Explore's own search card first) and
    the map area says "Loading map..." until its tiles arrive at about 500ms; the header trail went from "Home / Reports / Data Validation Error Report" to "Home / Explore" and the rail from Reports to Explore. Back
    to report returns to the same dataset (`?dataset=DS-2026-01003`); the browser's Back and Forward trace the same two pages (history is report, map, report; no entry is skipped).
  - **What failed the test:** "where I've come from". After the click the trail and the rail both said Explore, so the only sign of the report was the card's "Back to report" link; the trail named a place the
    person had not been to.
  - **Changed:** the header's trail on this view is Home / Reports / Data Validation Error Report / Map visualise (`DatasetBreadcrumb`, `dataset-error-map.tsx`, composed from the shared `Breadcrumb` the way the
    upload page's trail names its project, `upload-shell.tsx`; the report's name and path read from `REPORTS`, not typed again). "Reports" goes to the list and the report's crumb to the report on this same dataset
    (checked: `/pages/reports` and `/pages/reports/data-validation-error?dataset=DS-2026-01003`), so every earlier crumb is a way back as well as the card's link. Explore's own page (`observations-search.tsx`) passes
    it only when it is showing a dataset in its first layout; its ordinary trail, "Home / Explore", is unchanged (checked), and "Search Explore" returns to it (checked). An unknown dataset keeps the trail and says
    "No errors to map".
  - **Left as it is, on purpose:** the rail still lights Explore, since this is Explore's page and it keeps the rail's meaning (where the page lives) apart from the trail's (how you got here); lighting Reports instead
    would make a click on Explore do nothing, because Explore's own rail item only switches a local section. The trail's "Reports" is a plain link, not the report switcher the report page has, because a switcher here
    would take a person off the map.
  - **What to do here:** the card names what it is (the title, the project, the file), the two tabs filter the list and the map together (98 and 29 markers measured), a row or a dot opens a summary on the right,
    Escape closes it and focus stays on the row, and the key explains the colours. One gap seen and not built: after a row is chosen (pointer moved away) the list shows no selected state (background transparent, no
    `aria-current`), so the list does not say which record the summary and the highlighted dot are for; it needs an opt-in `selected` prop on the shared `ResultCard` (1.6) and a treatment, which is the designer's to
    choose. Raised, not built.
  - **Known limit:** the header already wraps below about 1100px on every screen (plain Explore 104px, the report 128px at 1024px); the four-crumb trail wraps once more there, 156px on the map view at 1024 and 1100px
    (the report's own 128px). At 1280px it matches the report's 104px and at 1440px all are 65px. The shared header was not changed.
  - **Verified:** the flow above; `npx tsc --noEmit`, `npx eslint` on both files and `npm run check:contracts` clean; zero console errors. **Not verified:** the Registered User's trail on a wide screen (checked at 1024 only:
    the same four crumbs), a screen reader's reading of the trail, and focus after arriving on the map view (the router leaves it on the page, as everywhere in the app). Typography QA (0.6 item 8): no text added
    beyond crumbs that already exist elsewhere ("Reports", the report's title, "Map visualise"). Not committed.

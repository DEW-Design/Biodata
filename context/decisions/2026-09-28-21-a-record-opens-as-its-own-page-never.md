# 2026-09-28 - a record opens as its own page, never a slide-in panel, per designer feedback off a screenshot ("when I click on a record from a species card on the explore tab, why am I seeing this right panel slide in? It should just go to its respective record").

- **Sept 28 2026: a record opens as its own page, never a slide-in panel, per designer feedback off a screenshot ("when I click on a record from a species card on the explore tab, why am I seeing this right panel slide in? It should just go to its respective record").** "Show in project" on Explore's summary card went to `.../project-details/occurrences/<id>`, which rendered the whole project page with the record in the `RecordDetailSidebar` slide-over on top.
  - **The record route now renders the record itself** (`ProjectRecordView` in `app/pages/project-list/[id]/project-details/project-details-view.tsx`), for every project including Adelaide Hills. It is laid out like every record page (CONTRACTS 4.6):
    - the project's shell, with the project's records tree in column 2 and the record highlighted;
    - a "Back to <project>" link, and the breadcrumb Home / Projects / <project> / <record>;
    - the gradient identity card: the kind as eyebrow, the name, the scientific name, and the facts (ID, date or start and end date, observer, "Recorded under", and an Access badge for a restricted record: "Restricted", or the level for BioData Admin);
    - one underline tab per section of the record (the same `buildSections` Explore uses), with the species photo beside the first tab when it has a licensed photo.
    The restricted-location rule is unchanged: a public user following a Level 2 record gets the project page with the DLA notice, and generalised roles see the blurred location.
  - **Events have record pages too:** `.../project-details/events/<id>` (a new `events` kind in `project-routes.ts`, every non-project event listed for the static export), so a site, visit or trap in the tree opens its own page as well. `projectDetailPath` now points an event at that page.
  - **No slide-in panels on project pages any more:**
    - the generated project page: its tree rows and its Species table rows link to the record page, and its `RecordDetailSidebar` and `initialRecord` are gone;
    - Adelaide Hills' hand-written page: its Species table rows link to the record page, and its sidebar and `initialRecord` are gone.
    The shell (header, rail, column 2 tree) is one `ProjectShell` shared by the project page and the record page.
  - **Verified live at 1708x1024:**
    - Explore option 2's Emu card and "Show in project" land on the Emu record page with no dialog.
    - A tree row (Trap) opens the event's page.
    - Species rows on Kangaroo Island and on Adelaide Hills open record pages.
    - The Wombat record shows six tabs and its photo; its Location Information tab shows the map and coordinate table; "Back to Kangaroo Island Recovery Monitoring" returns to the project.
    - Malleefowl: registered user sees "Restricted" and no precise coordinates; admin sees "Level 2"; public user gets the project page with the DLA notice.
    - Zero console errors. `tsc`, `eslint --max-warnings=0`, `npm run check:contracts` and the Pages build (`PAGES_BASE_PATH=/Biodata next build`, event pages exported) all pass.
  - **Open:**
    1. Explore option 1 still opens records in the slide-in panel. It was kept as-is for stakeholder comparison; say if it should link to record pages too.
    2. Records attached directly to a project (no site or visit, such as Adelaide Hills' Western Grey Kangaroo) are not in the column 2 tree, so nothing is highlighted for them.
    3. Adelaide Hills' own records tree on its hand-written page uses separate mock data, so it does not link to these record pages.
    4. The summary card's button still reads "Show in project"; "View record" would now describe it better.
    5. `project-detail/option-2` and `option-3` still use their own edit panels.
    Not committed.
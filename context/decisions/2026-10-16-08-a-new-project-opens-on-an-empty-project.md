# 2026-10-16 - A new project opens on an empty Project records tab

- **Oct 16 2026: A new project opens on an empty Project records tab.** The designer: after a project is created, Project
  records is shown as an empty state that lets the person upload a dataset or start by adding an event, occurrence or
  observation. Asked whether the other tabs go: the designer chose to keep all four tabs and open on Project records.
  - **Opening tab.** `project-detail-template.tsx` opens on Project records when the project has no records (a project just
    created through Add Project); every other project still opens on Project.
  - **Empty state.** `records-explorer.tsx` shows `ListEmptyState` ("No records yet") in place of the toolbar, tree and details
    panel when there are no records: `UploadDatasetButton` and an "Add record" button that opens the project's own add menu
    (`ActionsMenu`, grouped Events, Occurrences, Observations, heading "Add to this project"). Picking a type opens the new
    record full screen, as adding does elsewhere; once saved, the normal explorer shows with it selected. A role that cannot
    edit sees only Upload dataset, as the primary, with copy that says records arrive with a dataset.
  - **Components extended, defaults unchanged (CONTRACTS 1.6):** `ListEmptyState` takes `children` for more than one action;
    `ActionsMenu` takes `trigger` (a button in place of the "..." icon) and `addHeading`.
  - Verified: `tsc` (only the stale `.next` validator entry), eslint, `check:contracts` OK. Playwright as Registered User:
    sample project created, Go to Project lands on Project records with the empty state; heading Barlow 18px 600 (the
    shared empty state's own treatment); Add record opens the grouped menu, Events then Site opens a new site full screen,
    Cancel returns to the empty state; keyboard: Enter opens the menu, Escape closes it and focus returns to Add record;
    a built-in project (Kangaroo Island) still opens on Project; zero console errors. Not committed.
  - **Open.** Upload dataset for a created project goes to `/pages/project-list/<id>/upload`, which shows "This project isn't
    available": the upload route and the dataset store only know the built-in projects, and a static export cannot make that
    page for an id created in the browser. The hero's Upload dataset has the same gap. Needs a created-project upload route
    (like `/pages/project-detail/created`) and dataset-store support; for the designer to approve.

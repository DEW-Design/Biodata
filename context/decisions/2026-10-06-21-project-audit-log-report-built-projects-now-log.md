# 2026-10-06 - Project Audit Log Report built; projects now log their changes

- **Oct 6 2026: Project Audit Log Report built; projects now log their changes.** The designer, after the PR was opened: "Wait, audit
  log reports got missed? Look at the table + the wireframe" (Figma YMproGZfrFB5jUqPHPxMhk frame 2658:176999). The report had never
  been built: `reports-data.ts` listed "Audit Log Reports" as not built until supplied, and the PR did not include one.
  - **Decided (asked, two questions).** Rows come from a log that records real changes from now on (not seeded history, not only the
    created projects). The report is BioData Admin only.
  - **Why a log had to be built.** The app holds no change history for a project (the Project Detail Report already says there is no
    created-on or last-updated-by). Inventing rows for projects nobody edited would be fabrication (CONTRACTS 0.3).
  - **Built.** `project-audit-log-store.ts` (localStorage, key `biodata-project-audit-log`): `logProjectCreated` when Add Project submits
    (both layouts, through `saveCreatedProject(form, role)`), and `logProjectChanges` when a project edit is saved
    (`EditStoreProvider.saveProject`, which now takes the viewing `role`). `project-audit-diff.ts` compares two saves field by field, 29
    fields named as the Project Detail Report names them (Project description, Project owner, Permit number, End date and so on) and
    writes one UPDATE per field whose value changed. Entry: time, project ID and title, Record or Field, the field, previous and current
    text, CREATE or UPDATE, Web Portal, the role it was made as, and the person.
  - **The report** (`/pages/reports/project-audit-log`, `project-audit-log-report.tsx`): all 13 of the wireframe's columns in its order
    (Seq#, Timestamp, Project ID, Project title, Entity type, Modified entity, Previous details, Current details, Action, Source type,
    Source, User, Comments), in the shared `DataReport`: hero, search, the one Filter menu, Columns, Export CSV, sticky Seq#. New
    category "Audit log" (icon `ClockRewind`) on the Reports landing and in column 2, new role-access feature `projectAuditLog` (empty
    list, so BioData Admin and Super Admin only), a restriction empty state for other roles, an entry in the screen index.
  - **Departures from the wireframe, on purpose.** Its Filters card is the one filter menu (4.2d): Project ID / Title is the search box,
    "Audit log duration" and "Modified date" are one date attribute, "Modified by" is "User", "Additional filter" is the menu (Action,
    Entity type, Source type, Source). An options filter with a single value is not offered (Source type has one for now). Comments is
    an empty column: nothing asks for a comment. The wireframe's API and system rows (a URL source, "System/IPAddress") have no
    counterpart: every change in this build is made in the web portal.
  - **Verified:** `tsc`, `eslint` on the touched files, `check:contracts`. In a live browser: BioData Admin is offered the report and the
    Audit log tab, Registered User is not and gets the restriction on a direct visit; an empty log shows "No changes yet"; saving two
    cards on the Adelaide Hills project wrote two UPDATE rows (Project description, URI/DOI number) with the real time, "BioData Admin"
    and the current user; registering a project through Add Project option 2 wrote one CREATE row (BD-5138); the Filter menu offers
    Modified date only while the other attributes have one value. Zero console errors. Not run: Add Project option 1 to the end, an edit
    saved as another role, a project's records or artefacts (not logged: only a project's own fields are), the table at a narrow
    window, `npm run build`. Not committed.
  - **Open.** (1) Only a project's own fields are logged; edits to its survey records and artefacts are not. (2) The person is always
    the build's current user (Olivia Wyatt), as in the other reports, because there is no sign-in. (3) A project edited before this
    change has no history, by design. (4) The log is per browser (localStorage), so it is not shared between people.

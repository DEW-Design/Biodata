# 2026-10-16 - Add Project form becomes option 1, version 1 retired, Pre-fill sample content tool

- **Oct 16 2026: Add Project form becomes option 1, version 1 retired, Pre-fill sample content tool.** The designer asked for
  every "Add project" to open the sections form (option 2 version 2) and for it to be option 1, for version 1 to go with no
  Version tool, for a Pre-fill sample content switch on the Prototype tools bar, for Project Manager to be a role in project
  (no tick) with Management and Student dropped, for the Primary contact tick to work only with two or more contacts, and for
  a created project to match its project page.
  - **Routes swapped.** `/pages/project-registration` is now the sections form (option 1); the one-question-per-card wizard
    moved to `/pages/project-registration/option-2` (option 2). `/pages/project-registration/option-2/version-2` and version
    1's route are deleted. The header's Add menu (`lib/create-menu.ts`) already pointed at `/pages/project-registration`, so
    every Add project lands on the form. The flow's modules stay in `option-2/` because the project page's edit form imports
    them. Layout switcher, screen index, `/patterns/forms` and CONTRACTS 4.1 (form pattern subject, and its exemption is now
    option 2) updated.
  - **Version 1 retired from the form.** No Version tool; the flow always runs version 2. Version 1's rules in `sections.ts`
    stay, as the project page's edit form reads them.
  - **Pre-fill sample content.** A new tool kind, `toggle`, on the Prototype tools bar (a switch, not a menu) and a hook any
    form can call, `useSampleContent` (`app/_prototype-tools/sample-content.ts`). On, it keeps the form and loads the sample;
    off, it puts the form back. Add Project's sample is `project-registration/sample-content.ts`: placeholder people (Olivia
    Wyatt, Phoenix Baker, example.com), Birds SA, Coorong National Park, two Survey methodology entries, two bird species from
    the build's data, no restrictions, and no permit number or DOI (they would be invented). Not shown to a signed-out
    visitor or after Create.
  - **Role in project.** Project Manager added to `ROLE_OF_WORK_OPTIONS` (so every label lookup and the project page's edit
    select know it); the form offers `ROLE_IN_PROJECT_OPTIONS`: Project Manager, Field Survey, Research, Support, Other. The
    Project manager tick is gone; a manager is a contact whose role is Project Manager, and that is who the project page lists
    as Project managers. An organisation still needs at least one Project Manager, as it needed a ticked manager before.
  - **Primary contact.** Disabled (and on) with one contact; with one contact left after a removal, that person becomes the
    primary contact.
  - **Project page.** Survey type is no longer required on the project page (`cardMissing`, the edit form's marker): the form
    stopped asking it, so a newly created project opened with "Details needed" on Focus, species and method.
  - Verified: `tsc` (only a stale `.next` validator entry for a page removed earlier), eslint on touched files,
    `check:contracts` OK. Live pass with Playwright as BioData Super Admin and Registered User: the bar reads Layout Option 1
    of 2, Pre-fill sample content, Viewing as; no Version tool; the role list; the Primary contact tick disabled with one,
    enabled with two; sample on then through every section to Review, Create, Go to Project: name, full title, abstract,
    dates, Birds SA, both contacts with roles and primary, Project managers, Coorong extent, focus areas, species,
    methodologies and note all on the project page, no Details needed; switch off restores the blank form; option 2 loads;
    signed-out shows no switch; zero console errors. Not committed.
  - **Open.** (1) Should an organisation still have to name a Project Manager now that it is a role? (2) The project page's
    Survey type row shows "Not provided" for projects made with this form: keep it, or hide it? (3) The project page's contact
    edit still offers the full role list (with Management and Student) because existing projects hold those roles. (4) Typography
    QA skills (`/emil-typography`, `/emil-design-foundations`) were not run; the new visible text is the Scaffold bar label and
    form copy in existing treatments.

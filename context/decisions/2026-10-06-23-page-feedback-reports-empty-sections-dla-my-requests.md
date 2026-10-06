# 2026-10-06 - Page feedback: Reports empty sections, DLA My requests only, Taxonomy label, individual owner role

- **Oct 6 2026: Page feedback: Reports empty sections, DLA My requests only, Taxonomy label, individual owner role.** Five items from the
  designer's page feedback ("Branch continued").
  - **Reports, "Remove this section for registered users" (Specimens and restrictions, Audit log).** The cards were already hidden
    from a Registered User, but the Reports landing still drew each category's heading above nothing. The card view now draws a
    category only when the role has a report in it, as the category tabs already did. A Registered User sees Uploads, Project data
    and Agreements.
  - **DLA, "Only my requests for DLA for registered users".** New feature `dlaAllView` (`config/role-access.config.ts`): every role with
    DLA except the Registered User, plus BioData Admin by the bypass. A Registered User's column 2 has "My requests" alone and
    `?scope=all` in the address changes nothing, as on Nominations. One hook, `useDlaScope` (`dla-scope.ts`), serves the list and the
    breadcrumb switcher; `ScopeNav` passes `showAll`. Privileged and BioData User keep both views.
  - **Taxonomy.** Column 2's heading "Kingdom" is now "Species" (displayed in capitals).
  - **Add Project option 2, Data owner = Individual / Person.** Asked first; the designer chose: the role is the same "Your role" field,
    and "Other" only asks "Please specify" (an individual has no organisation name field to hide). For an individual owner, Your role
    is asked in the Data owner section and Project managers is not shown; an organisation owner is unchanged (managers in Data owner,
    Your role in Step 2). Validity, the "Details missing" alert and the review follow the owner type (`sections.ts`,
    `review-section.tsx`, `RoleRow` in `form-sections.tsx`).
  - **Verified:** `tsc`, `eslint` on `app/pages` and `config`, `check:contracts`. In a live browser: Registered User's Reports headings
    exclude both sections, BioData Admin's include them; DLA column 2 for Registered User (with and without `?scope=all`) is My
    requests alone, Privileged User and BioData Admin have both; Taxonomy shows SPECIES; option 2 with Individual / Person shows
    Primary contact then Your role and no Project managers, Other shows "Please specify", Continue without a role names "Your role",
    and an individual project was created end to end and its page opens. Zero console errors. Not run: `npm run build`. Not committed.
  - **Open.** (1) Add Project option 1 (one question per card) was not changed and still asks managers for every owner type and Your
    role in Step 2; the feedback named option 2. (2) The created project's page still shows an empty "Project managers" card for an
    individual owner. (3) Whether Privileged and BioData User should also be limited to their own DLA requests.

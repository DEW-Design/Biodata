# 2026-10-06 - Record pages use the full width; the user record borrows the DSA record's patterns

- **Oct 6 2026: Record pages use the full width; the user record borrows the DSA record's patterns.** Designer, still finding the
  user screens unintuitive: "the rule for *-details page should be column 2 is hidden and the entire real estate is used for the
  details page. Additionally, let's bring over behaviours and patterns that are already documented in *-detail pages. Why
  reinvent new things again and again?" (This applies the new CONTRACTS 0.9, logged in 2026-10-06-11.)
  - **Rule (CONTRACTS.md 3.7, rewritten as a general rule; the project page's override of 30 Sept becomes its first case).** A
    record page, the deep dive of any collection, has no column 2, for every persona: the breadcrumb and its switcher say where
    you are, the record's actions are in its card. Lists and create or edit forms keep column 2 (forms hold their sections
    there, 4.1). A role that cannot open the record still gets the restriction with all three columns.
  - **Built.** Every collection shell hides the sidebar for a record (`recordPage`, from the record props): DLA, DSA, Nominations,
    User Management (users, roles, permissions), Controlled Vocabulary, Taxonomy, Voucher Management, Notifications and the
    reports (`reports-shell`, a report is a record). `AUTO §3.7b` fails a shell that draws the Section sidebar and takes a record
    prop without `recordPage`. Main is 1,644px wide on a record page where it was 1,358px; a list, an edit form and the new
    forms still show column 2. `/patterns/navigation` says so.
  - **The user record, borrowed from the DSA record (`um-detail.tsx`):**
    - Overview is the DSA's: "Last updated", one bordered card of `RecordRow`s on the left (User ID, Username, Display name,
      Access from, Access until; position, organisation, type and status are in the card above, not repeated) and a rail on the
      right with a `ContactCard` (name, mail and phone), in place of label and value 700px apart.
    - `ContactCard` is now one shared component (`_shared/contact-card.tsx`); the DSA's copy of the project page's card is
      replaced by it (the DSA's overview is unchanged). Two other copies remain on the project page's option 2 and a lab.
    - **Edit user** is the card's action, as DLA and DSA have Edit: it opens `/pages/user-management/users/<id>/edit`, the Add user
      form filled in (`AddUserForm initial`), Continue through the three sections, "Save changes" on the last, back to the user.
      `updateUser` saves in place. It leads the card unless the lifecycle has a next step (Reactivate, Restore), in which case it
      is beside it; Deactivate and Archive stay below (Archive after a divider). Roles can now be changed on an existing user.
    - Tabs stay Overview, Roles, Permissions (4.6 item 7).
  - **Not done, on purpose.**
    - **Audit Log:** the DSA, DLA and nomination records have one; users, roles and permissions keep none. The wireframe's "View
      Logs" was left out by an earlier decision (audit logging is not in scope) and a log needs a history the user store does not
      keep, so none is invented (4.6 item 6).
    - **Role and Permission records:** no Edit yet, no edit route.
    - **Observation detail** (an older exploratory screen with its own shell) still shows column 2; Explore is exempt in 3.7b.
    - The duplicate `ContactCard`s on the project page's option 2 and the lab are not merged.
  - **Verified:** live as BioData Super Admin: DLA, DSA, nomination, user, role, permission, vocabulary, taxon, notification and report
    records show no column 2 (main 1,644px) and their lists, the Add forms and the user edit form show it; the user record
    screenshot looked at; Edit user opens the form with Jarrah Mitchell's details filled in, changing the position and saving
    returns to the record showing it; no console errors. `tsc`, `eslint` on the touched files and `check:contracts` pass.
    `npm run build` not run.

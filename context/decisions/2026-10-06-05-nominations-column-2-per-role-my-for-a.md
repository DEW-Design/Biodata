# 2026-10-06 - Nominations column 2 per role: My for a registered user, All and My for the rest

- **Oct 6 2026: Nominations column 2 per role: My for a registered user, All and My for the rest.** Designer page feedback on
  `/pages/nominations?userRole=registered-user`: column 2 showed only the section label; "'My nominations' under Nominations.
  For registered users, I'd only be able to see what I nominated. For BioData users / Privileged users, they see 'All
  nominations' and 'My nominations' based on the organisation. Same for BioData admin, All and my nominations."
  - **Changed.**
    - **Registered User:** column 2 lists "My nominations" alone (with its icon, §3.11), selected. A one-item list overrides
      the collection pattern's "a one-option switcher is dishonest UI" for this screen, by the designer's instruction; the
      pattern note in `ref-shell.md` names it. An address that asks for `?scope=all` still shows the one item on.
    - **BioData User, Privileged Admin, Privileged User:** "All nominations" and "My nominations". All is the nominations of
      their organisation (their own, and submitted ones from the same organisation; never someone else's draft); the list's
      subheading says whose ("Nominations from Birds SA, across every status.").
    - **BioData Admin (and Super Admin):** unchanged, All is everyone's submitted nominations plus their own drafts.
  - **How.** New feature gate `nominationAllView` (`config/role-access.config.ts`: biodata-user, privileged-admin,
    privileged-user; the admin bypass passes it). `nomination-scope.ts` holds the rule once (`inNominationScope`,
    `useNominationScope`), used by the list, the shell (and its Export CSV), the page and the breadcrumb switcher, which
    each had their own copy. `AgreementScopeNav` gets `showAll`. `nominationReview` (Start review, Accept, Reject, Return)
    stays admin-only and is not changed.
  - **Placeholder to confirm.** The preview has no real organisation for a signed-in person (the pill says "DEW" or "ORG"), so
    `nominationOrganisationFor` stands a BioData User for the Department for Environment and Water and the Privileged
    roles for Birds SA (a partner named in the BDBSA research). The seeds have no nomination from a DEW nominator, so a
    BioData User's All shows only their own three for now, the same as My; the Privileged roles' All adds Lana Steiner's
    (Birds SA). Whether more seed nominations are wanted, and which organisation a Privileged role belongs to, is the
    designer's.
  - **Not changed / open.** Opening another organisation's nomination by its address is not blocked (the record page has no
    organisation check); DLA and DSA have the same shape (a Registered User's single view) and were not touched; the mobile
    menu's Nominations item was not checked.
  - **Verified:** live as each role at `?scope=all` and `?scope=mine`: Registered User sees "My nominations" alone, 3 rows;
    BioData User "All nominations" (Department for Environment and Water, 3 rows) and "My nominations" (3); Privileged
    User and Admin All 4 rows (Olivia Wyatt, Lana Steiner), My 3; BioData Admin All 7 rows, My 3; no console errors;
    `tsc` and `eslint` on the touched files pass.

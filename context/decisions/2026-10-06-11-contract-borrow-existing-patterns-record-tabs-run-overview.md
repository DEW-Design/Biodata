# 2026-10-06 - Contract: borrow existing patterns; record tabs run Overview then what it relates to

- **Oct 6 2026: Contract: borrow existing patterns; record tabs run Overview then what it relates to.** Designer, after the user
  record rework (decision 2026-10-06-09): "This also should be a contract if it's not: Borrow and reuse patterns from existing
  pages. Also, shouldn't it be overview, role, permission? Please make sure the above is documented as a contract."
  - **Was it already a contract?** Only in parts: 2.9 item 2 (copy a sibling's type classes), 1.6 (extend, do not fork), 4.6 (record
    pages follow the project page). Nothing said, for a whole screen or section, "find the closest existing page and reuse its
    pattern first".
  - **New: CONTRACTS.md 0.9 "Borrow and reuse patterns from existing pages"** (core, loaded every session, next free number in
    the conduct series). Look in order (component, pattern page and clauses, a sibling screen of the same shape), name what was
    borrowed; reuse, then extend with an opt-in prop (1.6); a new arrangement needs a reason and the designer's yes (0.4); where
    two pages doing the same job differ, the page being touched is brought in line. `REVIEW`. Scope added to
    `contracts/rule-scopes.json`.
  - **New: 4.6 item 7, the tabs of a record page.** The first tab is Overview: the record's own facts that its identity card does
    not already show; a record whose card shows everything has none. Then what the record holds or is held by, each its own tab in
    the order the data rolls up: a user's Roles, then the Permissions they add up to; a role's Permissions, then Users. No tab
    holds a master and detail of its own sections; nothing shown in the card or on the tab is repeated inside it. 3.13's icon list:
    Roles `UserCheck01` (column 2's "All roles" icon), the old "Roles and permissions" and the user's "Details" out.
  - **Changed (the user record, `um-detail.tsx`):** tabs are Overview (what Details held: ID, username, display name, email,
    contact, access dates, last updated), Roles (a card per role, a link to the role) and Permissions (what the roles add up to,
    each once; with several roles each names the role that grants it). The tab badges carry the counts (Roles, Permissions), so
    the panels have no labels of their own. A role card shows its permission count only when the user holds more than one role.
    The page opens on Overview.
  - **Not changed, and why.** The Role record (hero shows every fact; tabs Permissions, Users) and the Permission record (hero, then
    its roles) have no Overview because their identity card already shows all their facts, which is what the new item says. The
    Controlled Vocabulary record (Entries, Details, History) and the dataset record (Validation, Details, History) put Details
    after a main tab; named in 4.6 as open for the designer, not renamed.
  - **Verified:** live as BioData Super Admin on Olivia Wyatt (Overview, Roles 1, Permissions 13) and Jarrah Mitchell (Roles 2,
    Permissions 27, with BioData User and Data Manager beside permissions both grant); screenshots looked at; no console errors;
    `tsc`, `eslint` and `check:contracts` pass. The `/proto/tab-icons` lab still shows the old tab names (a lab, not changed).

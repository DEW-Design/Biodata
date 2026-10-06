# 2026-10-06 - User record: roles and permissions roll up instead of repeating

- **Oct 6 2026: User record: roles and permissions roll up instead of repeating.** Designer: "Permissions and roles roll up to a
  user. So, we need to make the user view more nicer. Currently, there's so much redundancies." After the hierarchy pass earlier the
  same day (decision 2026-10-06-08) the panel still said the same thing three times: a list of the user's roles on the left, the
  chosen role's name again as the heading on the right with a "View role" link, and that one role's permissions under it; a
  user with one role got a list of one, and a count of roles on the tab, in the list and again in the panel.
  - **Changed (`user-management/um-detail.tsx`, the Roles and permissions tab).** The master and detail is gone, with its
    "selected role" state. The tab is two sections, in the order the data rolls up:
    - **Roles:** one card per role the user holds (name, System or Custom, its department and role type for a custom role, its
      status when it is not active, a two-line description). The whole card is the link to the role page (no separate
      "View role"), as a row is the link in the lists. A role's permission count is on its card only when there is more than
      one role, because with one role it would repeat the Permissions count below. The role count is on the tab already, so
      "Roles" has no count of its own.
    - **Permissions:** what the roles add up to for this person, each permission once (a user whose two roles both grant
      "View Content" sees it once), grouped as before, with the total. For a user with more than one role, each permission names
      the role or roles that grant it, so the roll-up can be traced back.
  - **Flows through.** `PermissionGroups` (also the Role record's Permissions tab and the role form's preview) gets an optional
    `grantedBy`; without it, nothing changes there.
  - **Verified:** live as BioData Super Admin on Olivia Wyatt (one role: one card, 13 permissions, no counts repeated) and Jarrah
    Mitchell (BioData User and Data Manager: two cards with 23 and 12 permissions, 27 once rolled up, "BioData User" and "Data
    Manager" beside each permission they grant); a card opens its role; no console errors; `tsc` and `eslint` on the file pass.
  - **Open / to look at.**
    - The Details tab was not changed: its rows (ID, username, email, contact, access dates, last updated) do not repeat the hero,
      but a "Last updated" and the hero's status could be merged if the designer wants fewer rows.
    - A permission granted by every one of several roles shows every role's name beside it, which is noisy for a user with
      three or four roles; "Granted by every role" could replace the names.
    - The page is short for a user with one role (the page ends where the permissions do).
    Not committed.

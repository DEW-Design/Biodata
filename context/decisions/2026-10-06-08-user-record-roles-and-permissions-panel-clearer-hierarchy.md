# 2026-10-06 - User record Roles and permissions panel: clearer hierarchy

- **Oct 6 2026: User record Roles and permissions panel: clearer hierarchy.** The designer sent the user record's Roles and
  permissions tab (Olivia Wyatt) and asked for a better layout hierarchy, with `/emil-design-foundations`. What was flat: the
  role's name, each permission group's name and each permission's name were all one 14px weight; the role panel's title read
  as body text; counts were "(2)" in the text; the role chosen in the list was barely tinted.
  - **Changed (`user-management/um-detail.tsx`).**
    - The chosen role is the panel's heading: `SectionHeader.Heading` (18px, semibold) with its description as
      `SectionHeader.Subheading`, a rule under it, and "View role" with a forward arrow (`iconTrailing`).
    - A "Permissions" label with its total count (the small uppercase label and gray count badge the embedded tables use) sits
      above the groups, so the panel reads role, then what it grants.
    - Each group's count is a gray count badge beside its name instead of "(2)" in the text. Permissions sit indented under their
      group, the name `text-secondary` medium and the description tertiary, with more space between them.
    - The chosen role in the left list is tinted with the brand selection colour (`bg-brand-secondary`, the one the tabs use), its
      name in the brand text colour; before, it was a barely visible gray.
  - **Flows through.** `PermissionGroups` is shared, so the Role record's Permissions tab gets the badge counts and the indent too.
  - **Type sources (section 2.9).** Heading and subheading: the design system's `SectionHeader`. Label and count badge: the
    `EmbeddedTableFrame` label in the same file. Group title: the accordion's own. Permission name and description: the existing
    row text, name moved from primary to secondary so the group title leads.
  - **Verified:** live as BioData Super Admin on Olivia Wyatt (heading measured 18px, weight 600, Barlow) and on a Role record's
    Permissions tab; screenshots looked at; no console errors; `tsc`, `eslint` and `check:contracts` pass.
  - **Not changed / open.** The empty space below the panel (the page is short) is unchanged. Only the first group opens by
    default. A user with several roles and the Custom roles group were not looked at.

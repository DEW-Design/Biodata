/**
 * The BioData SA portal's user roles - see CONTEXT.md's "User roles" section for what each one
 * means and what it can see/do. Kept as a flat list of slugs (not an enum) so it can be read
 * straight out of a URL search param - see `useUserRole` in `lib/use-user-role.ts`.
 *
 * Ordered highest to lowest privilege - this is the real hierarchy, not just a list:
 * biodata-admin (DEW, super user) > biodata-user (DEW) > privileged-admin (partner org admin) >
 * privileged-user (partner org member) > registered-user (no org) > public-user (not signed in).
 * biodata-admin/biodata-user are themselves an organisation - DEW - which is why org-affiliated
 * chrome (e.g. the breadcrumb's org switcher) applies to them too, not just privileged-*.
 *
 * The full list stays here - the type isn't scoped down. Active build focus is narrower: only
 * `registered-user` and `public-user` are being built for right now (see CONTEXT.md's "User
 * roles" section) - don't build features for the other four ahead of being told to, but don't
 * remove them from this list either.
 */
export const USER_ROLES = [
  "biodata-admin",
  "biodata-user",
  "privileged-admin",
  "privileged-user",
  "registered-user",
  "public-user",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = "registered-user";

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * The breadcrumb org pill's label for a role that has one (see `orgSwitcher` in
 * `config/role-access.config.ts`, and `Breadcrumb`'s `orgLabel` prop). `biodata-admin`/
 * `biodata-user` are themselves DEW - a real, fixed, known org - so the pill can say so instead of
 * the generic "ORG". `privileged-admin`/`privileged-user` are affiliated with one of several
 * partner orgs (Birds SA, Adelaide Hills Landcare, ...) with no single logged-in org context to
 * show a real name for in this exploratory build, so "ORG" stays the honest placeholder there.
 * Flagged directly by the user: DEW for the `biodata-*` roles, ORG stays for `privileged-*`.
 */
export function orgLabelForRole(role: UserRole): string {
  return role === "biodata-admin" || role === "biodata-user" ? "DEW" : "ORG";
}

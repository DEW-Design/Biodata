/**
 * Role access matrix - which UserRole(s) can see a given feature.
 *
 * This is the single source of truth for per-feature visibility across
 * /pages/dashboard/**. It's deliberately separate from
 * design-system.config.ts (that one's about which component/variant a doc
 * page shows; this one's about which *product feature* a given user role
 * sees) and deliberately just data - add/remove a role from a feature's
 * array, no JSX changes needed at the call site.
 *
 * Build convention: build every feature as if for "biodata-admin" (full
 * access - see the bypass in hasFeatureAccess below), then add the feature
 * key here and list which other roles should also see it. A feature with no
 * entry here is visible to everyone - only add an entry once a feature is
 * actually meant to be gated.
 *
 * Current build focus is just registered-user/public-user (see lib/user-role.ts) - features
 * gated to the privileged-user/privileged-admin/biodata-user/biodata-admin roles, like
 * orgSwitcher below, are correct and stay defined, they just won't show for either in-focus role
 * right now.
 */

import type { UserRole } from "@/lib/user-role";

/** One entry per gated product feature. Add a key as a feature is actually gated - don't pre-populate speculatively. */
export type FeatureKey = "orgSwitcher" | "metricCardCustomization" | "dsaManagement" | "dlaAccess" | "dlaApproval";

/** Feature -> the roles (besides biodata-admin, which always passes) allowed to see it. */
export const roleAccessMatrix: Record<FeatureKey, UserRole[]> = {
  // Breadcrumb's [ORG ▾] pill - any role affiliated with an organisation has one to switch.
  // biodata-admin/biodata-user are themselves DEW staff (DEW is an org), so they're included
  // alongside the partner-org roles (privileged-admin/privileged-user) - only registered-user and
  // public-user have no organisation at all.
  orgSwitcher: ["privileged-user", "privileged-admin", "biodata-user"],
  // The Flora and Fauna Dashboard's per-card three-dot menu (swap which metric sits in which
  // slot) - flagged directly by the user: only the admin can reconfigure these cards, and that
  // choice flows through to every other role's view, not something each signed-in user picks for
  // themselves. Empty array (no role besides the biodata-admin bypass) rather than an omitted
  // entry, since an omitted `FeatureKey` defaults to visible-to-everyone - the opposite of what's
  // needed here.
  metricCardCustomization: [],
  // The Data Sharing Agreement (DSA) workflow (/pages/dsa) - create, edit, revoke and review every
  // agreement across partners. Admin-only for now; the requester-facing view (a partner asking for
  // an agreement) is a separate persona's flow and isn't built. Empty array for the same reason as
  // metricCardCustomization: an omitted key would default to visible-to-everyone.
  dsaManagement: [],
  // The Data Licencing Agreement (DLA) workflow (/pages/dla) - every signed-in role can request and
  // manage their own DLAs, per direct decision; only public-user (no account, nothing to request
  // under) is excluded. Listed explicitly rather than "everyone" via an omitted key, since an
  // omitted key would also include public-user.
  dlaAccess: ["registered-user", "privileged-user", "privileged-admin", "biodata-user"],
  // Approving/rejecting a DLA request, and withdrawing someone else's active one - admin-only, same
  // "empty array, not an omitted key" reasoning as dsaManagement/metricCardCustomization above. A
  // requester can still withdraw their own request/agreement regardless of this feature - that's
  // ownership, not an admin privilege, and isn't gated here.
  dlaApproval: [],
};

/**
 * Whether `role` can see `feature`. `biodata-admin` always returns true (the top of the access
 * matrix, per the "build for admin, hide for everyone else" convention) - every other role is
 * checked against `roleAccessMatrix`.
 */
export function hasFeatureAccess(feature: FeatureKey, role: UserRole): boolean {
  if (role === "biodata-admin") return true;
  return roleAccessMatrix[feature].includes(role);
}

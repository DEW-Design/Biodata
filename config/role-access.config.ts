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

import { isBiodataAdmin, type UserRole } from "@/lib/user-role";

/** One entry per gated product feature. Add a key as a feature is actually gated - don't pre-populate speculatively. */
export type FeatureKey = "orgSwitcher" | "metricCardCustomization" | "dsaManagement" | "dlaAccess" | "dlaApproval" | "userManagement" | "restrictedData" | "nominationAccess" | "nominationReview" | "datasetUpload" | "templateFinder" | "ctrlVocabManagement" | "taxonomyManagement" | "notificationManagement" | "voucherManagement";

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
  // User Management (/pages/user-management) - users, roles and permissions. BioData Admin only for
  // now, per direct decision: BioData Admin manages DEW. A Privileged Admin manages their own
  // organisation's users too, but that organisation-scoped view isn't built yet (logged in
  // CONTEXT.md) - add "privileged-admin" here only when it is. Empty array, not an omitted key, for
  // the same reason as dsaManagement.
  userManagement: [],
  // Level 2 and above data (sensitive species) as recorded, with precise locations. Per the
  // designer (Sept 28 2026): BioData Admin sees Level 1 to 4 in full; every other signed-in role
  // sees these records with their location generalised and blurred, and requests a DLA for more;
  // a public user sees Level 1 only (the rule lives in map-search/record-access.ts).
  restrictedData: [],
  // Nominating a sensitive species (/pages/nominations): every signed-in role, per the designer
  // (Sept 28 2026). A guest sees the section's restriction and the sign-up invite, as with DLA.
  nominationAccess: ["registered-user", "privileged-user", "privileged-admin", "biodata-user"],
  // Reviewing nominations (the sensitive species panel): Start review, Accept, Reject, Return for
  // more information, and the All nominations view. BioData Admin only, via the bypass.
  nominationReview: [],
  // Uploading a dataset to a project (/pages/project-list/<id>/upload): every signed-in role (the
  // project-level access check is not modelled in the preview). A guest sees the sign-up invite on
  // the project's "Upload dataset" button, and the restriction on a direct visit.
  datasetUpload: ["registered-user", "privileged-user", "privileged-admin", "biodata-user"],
  // Every signed-in role; a public user has no Template Finder section (context/decisions/2026-09-21-04).
  templateFinder: ["registered-user", "privileged-user", "privileged-admin", "biodata-user"],
  // Controlled Vocabulary (/pages/ctrl-vocab): create, edit, archive and reactivate vocabularies.
  // BioData Super Admin only (BRD REQ-18.1: "BioData Admin users shall not have access"), per the
  // designer, Sept 30 2026. See SUPER_ADMIN_ONLY below: the one feature a BioData Admin does not get.
  ctrlVocabManagement: [],
  // Taxonomy Management (/pages/taxonomy): view and edit a species' taxonomy, and Rename, Combine,
  // Split and Append taxa. BioData Admin and above, per the designer (Sept 30 2026): the admin bypass
  // passes BioData Admin and Super Admin, and no other role is listed.
  taxonomyManagement: [],
  // Notification Management (/pages/notifications): the automated emails BioData SA sends, created,
  // edited, enabled and disabled. BioData Admin and above, per the designer (1 Oct 2026): the admin
  // bypass passes BioData Admin and Super Admin, and no other role is listed.
  notificationManagement: [],
  // Voucher Management (/pages/vouchers): review the differences a scheduled scan finds between
  // BioData's vouchered records and the Herbarium's or the SA Museum's, and push or ignore each one.
  // BioData Super Admin only, per the designer (1 Oct 2026): listed in SUPER_ADMIN_ONLY below.
  voucherManagement: [],
};

/**
 * Whether `role` can see `feature`. `biodata-admin` always returns true (the top of the access
 * matrix, per the "build for admin, hide for everyone else" convention) - every other role is
 * checked against `roleAccessMatrix`.
 */
/** Features for the BioData Super Admin alone: a BioData Admin, who otherwise passes every check, does not get these. */
const SUPER_ADMIN_ONLY: FeatureKey[] = ["ctrlVocabManagement", "voucherManagement"];

export function hasFeatureAccess(feature: FeatureKey, role: UserRole): boolean {
  if (role === "biodata-super-admin") return true;
  if (isBiodataAdmin(role)) return !SUPER_ADMIN_ONLY.includes(feature);
  return roleAccessMatrix[feature].includes(role);
}

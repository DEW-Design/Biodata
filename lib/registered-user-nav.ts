// Registered User's real, decided IA - captured by the team ahead of the Sept 15 layout
// decision (see the "Registered User" nav tree brief). This is the one place the tree lives;
// the sidebar-shell screens (app/pages/dashboard, project-list, project-detail, ...) each render it
// in their own shell, but read from here so the screens can't drift out of sync as the IA changes.
//
// `key` is set only on the two items with a real page today - every other item has no page yet, so
// it renders as inert text, same "honest, not a placeholder link" convention used elsewhere for
// undecided content. See `keyHref` below for how a `key` becomes a real path.

import type { UserRole } from "@/lib/user-role";

export const DSA_SECTION_LABEL = "Data Sharing Agreement (DSA)";
export const DLA_SECTION_LABEL = "Data Licencing Agreement (DLA)";

export interface NavNode {
  label: string;
  key?: "dashboard" | "project-list" | "observations" | "dsa" | "dla";
  items?: NavNode[];
}

/**
 * A nav `key`'s real path on the sidebar shells: always `/pages/<key>`, no `/option-*` suffix.
 * Every keyed section's page was folded into its plain route once the sidebar shell was picked as
 * the direction (see CONTEXT.md's Sept 16 2026 layout decision and the route normalisation that
 * followed). Centralised here rather than inlined at each shell's call sites (NavTree's own href,
 * SectionPlaceholder's "Go to X" button, goToSection's router.push) so they can't drift apart.
 */
export function keyHref(key: NonNullable<NavNode["key"]>): string {
  return `/pages/${key}`;
}

export const registeredUserNav: NavNode[] = [
  // Home *is* the BioData Dashboard, not a group containing it - flagged directly by the user:
  // rendering it as "Home > BioData Dashboard" implied two things where there's only one. A leaf
  // with its own `key`, same as any other single-destination item.
  { label: "Home", key: "dashboard" },
  // Projects *is* the projects/datasets screen, same "leaf with its own key" shape as Home, not a
  // group containing one combined "Manage Project and Datasets" destination - that single label
  // blended two distinct resources into one, flagged directly by the user. The screen behind this
  // key now presents Projects and Datasets as two peer tabs in its own contextual sidebar (see
  // dashboard's "Projects" Tabs block), the same "two peer views, not one blended one"
  // treatment Home already has for My BioData/Flora and Fauna Dashboard - so, like Home, that split
  // lives as hardcoded tabs in each page's own JSX, not as `items` here.
  //
  // The brief's other five "Projects" items (View Level 1/2, Create Project + its sub-steps,
  // Download Project Templates, Create/Upload Dataset) aren't nav destinations either - flagged
  // directly by the user off this section's screenshot: they're actions/operations on the Project
  // resource (Create, Read at two access tiers, an upload), not sibling places to navigate to. Kept
  // as data in `projectActions` below so they're not lost, ready to become real buttons/filters/a
  // wizard inside that screen once that's scoped, rather than sit here as more sidebar links.
  { label: "Projects", key: "project-list" },
  // This is the map search screen now, same "leaf with its own key" shape as Home and Projects -
  // it used to be "Observations", holding its Level 1/Level 2 split as inert `items` text with no
  // real page behind either. Per direct request for a real map-search interface (draw a boundary,
  // enter coordinates, or pick a national park; search across Projects/Events/Occurrence/
  // Observations), built at app/pages/observations - and, per direct feedback on that
  // build, renamed "Observations" -> "Explore" here (the nav label only; "Observations" stays the
  // name of the record type it searches for, one of the 4 result tabs on that page - the `key`,
  // `keyHref`, and the route itself are also untouched, still `observations`/`/pages/observations`, since only the visible label and its icon were flagged, not the URL). The Level 1
  // (public) vs. Level 2 (DLA-licensed) distinction from the old `items` isn't dropped - it's a
  // real, already-documented access tier (see the "BDBSA domain research" section below) - but
  // building actual DLA-gated result filtering is a separate, larger piece of work than this
  // search UI itself, so today every role sees the same Level 1 results with a note pointing at
  // "Data Licencing Agreement (DLA)" for Level 2 access, rather than fabricating a working
  // access-tier toggle.
  { label: "Explore", key: "observations" },
  // A keyed leaf, same "list -> deep dive" shape as Explore/DSA - "Request New DLA"/"Manage DLA"
  // used to be inert `items` text with no page behind either, but they're really the same two
  // real operations Projects/DSA already collapse into one screen: /pages/dla is a table of the
  // signed-in user's own requests (a "New agreement" button is the request action, a row is the
  // manage/view action), not two separate destinations. See CONTEXT.md, "Data Licencing Agreement
  // (DLA)". Not in `publicUserNav` below - a signed-out guest has no DLA of their own to request or
  // manage, same reasoning as DSA being admin-only.
  { label: DLA_SECTION_LABEL, key: "dla" },
  {
    label: "Nominate Sensitive Species",
    items: [{ label: "Nominate Sensitive Species" }],
  },
  {
    label: "Reports (Own Submissions)",
    items: [{ label: "Application and System Reports" }],
  },
  {
    label: "Template Finder",
    items: [{ label: "Browse and Download Standard Dataset Templates" }],
  },
];

// public-user's ("Guest User") real, decided IA - a separate tree, not a filtered view of
// registeredUserNav above, because it isn't a subset of the same shape: Home and Projects are each
// a single destination here (no My BioData/Datasets peer tab - a signed-out guest has no personal
// contributions or private datasets to show a second tab for), Explore drops its Level 2/DLA
// item entirely, and Data Licencing Agreement/Nominate Sensitive Species/Reports/Template Finder
// don't exist as sections at all (not just hidden leaves inside them). Reuses the `dashboard`/
// `project-list` keys since the underlying pages are the same ones registered-user's tree points
// at - each page reads the active role to decide whether to show its two-peer-tab treatment or
// this single-view one, not two different destinations.
export const publicUserNav: NavNode[] = [
  { label: "Home", key: "dashboard" },
  { label: "Projects", key: "project-list" },
  // Same real map search screen as registered-user's Explore above - guest already only ever
  // saw Level 1 public data, which is exactly what this screen shows for every role today.
  { label: "Explore", key: "observations" },
];

// biodata-admin's tree, the part of the real admin IA that exists so far: the registered-user tree
// (DLA included, same keyed leaf) with the Data Sharing Agreement (DSA) workflow added as its own
// section straight after it. DLA and DSA are two modules, not one renamed: the admin IA lists
// "Data Licencing Agreement (DLA)" with "Approve Reject DLA Requests" and "Withdraw DLA" as admin's
// own actions on it, and DSA arrives as a separate module in the review comments. Per the "List ->
// deep dive" pattern, "Approve Reject DLA Requests"/"Withdraw DLA" aren't separate nav destinations
// either, the same call already made for DLA's own "Request New DLA"/"Manage DLA" above - they're
// real actions inside /pages/dla itself (an Approve/Reject pair on a request Under Review, a
// Withdraw on an Active one), gated to admin via the `dlaApproval` feature, not a second DLA nav
// entry. DSA is a keyed leaf like Home/Projects/Explore/DLA (the agreement list lives in the page's
// own contextual sidebar, not as nav `items`).
//
// NOT yet the full admin IA - see CONTEXT.md, "BioData Admin IA cross-check": User Management, Ctrl
// Vocab, Reports (All Users), Voucher/Notification/Taxonomy management, Home's admin labels and
// Nominate Sensitive Species nesting under Observations are all still to reconcile.
export const biodataAdminNav: NavNode[] = registeredUserNav.flatMap((section) =>
  section.label === DLA_SECTION_LABEL ? [section, { label: DSA_SECTION_LABEL, key: "dsa" as const }] : [section],
);

/** The one nav tree a role's shell reads - see each tree's own comment for how they differ. */
export function navForRole(role: UserRole): NavNode[] {
  if (role === "public-user") return publicUserNav;
  if (role === "biodata-admin") return biodataAdminNav;
  return registeredUserNav;
}

// The rest of the brief's "Projects" items - not nav destinations (see the comment on the
// `Projects` section above), but not dropped either. Real actions/operations on the Project
// resource, ready to become buttons/filters/a wizard inside project-list once that's scoped.
export interface ProjectAction {
  label: string;
  /** Wizard steps, for an action that's actually a multi-step flow (only Create Project today). */
  steps?: string[];
}

export const projectActions: ProjectAction[] = [
  { label: "View Level 1 Public Project Data" },
  { label: "View Level 2 Project Data (DLA Access)" },
  // Built at app/pages/project-registration (reached via the "Add project" header button on every
  // real page - see app/pages/_shared/guest-action-gate.tsx). The brief's original 5-step list
  // (one step per restriction type) didn't match the real Figma wireframe this was built from
  // (node 2298:179004 in the "Biodata Wireframe Presentation" file) - that source has 3 real steps,
  // with all 5 restriction types living as sub-sections inside step 3, not 5 steps of their own.
  // Updated to match what was actually built, per this file's own "keep documentation honest"
  // convention.
  {
    label: "Create Project",
    steps: ["Project Identification", "Data Collection and Storage", "Privacy and Restrictions"],
  },
  { label: "Download Project Templates" },
  // Not a standalone flow - per CONTEXT.md's "BDBSA domain research", every dataset must be
  // assigned to a project number, so this can never be "upload, pick a project later." Whatever UI
  // eventually implements this must fold project selection/creation into the same step, not treat
  // an unassigned dataset as a valid, if incomplete, state. Flagged directly by the user after an
  // earlier dashboard draft showed a task implying the opposite.
  { label: "Create / Upload Dataset" },
];

/**
 * The top-level section a given nav `key` lives under - e.g. `findSection("project-list")` and
 * `findSection("dashboard")` both return the section node itself, since both Projects and Home
 * *are* their own destination rather than a group with a keyed child. Same "one place,
 * four-going-on-five screens read from it" reasoning as the tree itself.
 */
export function findSection(key: NonNullable<NavNode["key"]>): NavNode | undefined {
  return registeredUserNav.find((section) => section.key === key || section.items?.some((item) => item.key === key));
}

// The screenshot's "Header" branch (Profile > Profile Settings, Logout) isn't a nav-tree entry -
// it's the account menu hung off the avatar. Kept separate so the tree above is just the
// sidebar/top-nav content.
export const registeredUserAccountMenu = ["Profile Settings", "Logout"];

// Same for "Footer" - Terms and Conditions, Privacy Policy, Help and Documentation, in the
// screenshot's order.
export const registeredUserFooterLinks = ["Terms and Conditions", "Privacy Policy", "Help and Documentation"];

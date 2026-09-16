// Registered User's real, decided IA - captured by the team ahead of the Sept 15 layout
// decision (see the "Registered User" nav tree brief). This is the one place the tree lives;
// app/pages/dashboard, app/pages/dashboard/option-2, and app/pages/project-list/option-{1,2} each
// render it in their own shell's idiom (sidebar accordion vs. top-nav dropdown), but read from here
// so the screens can't drift out of sync as the IA changes.
//
// `key` is set only on the two items with a real page today - every other item has no page yet, so
// it renders as inert text, same "honest, not a placeholder link" convention used elsewhere for
// undecided content. See `keyHref` below for how a `key` becomes a real path.

export interface NavNode {
  label: string;
  key?: "dashboard" | "project-list";
  items?: NavNode[];
}

/**
 * A nav `key`'s real, decided path on the sidebar (option-1-style) shells. Dashboard is a special
 * case: per the Sept 16 layout decision (option-1 shell picked as the direction, its dashboard
 * folded into the canonical `/pages/dashboard` with no `/option-*` suffix), while every other keyed
 * section (just `project-list` today) is still mid-exploration and stays on its `/option-1` variant
 * route. Centralised here rather than inlined at each of the sidebar shells' 3 call sites (NavTree's
 * own href, SectionPlaceholder's "Go to X" button, goToSection's router.push) so the one exception
 * can't drift out of sync between them.
 */
export function keyHref(key: NonNullable<NavNode["key"]>): string {
  return key === "dashboard" ? "/pages/dashboard" : `/pages/${key}/option-1`;
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
  // dashboard/option-1's "Projects" Tabs block), the same "two peer views, not one blended one"
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
  {
    label: "Observations",
    items: [{ label: "View Level 1 Public Observation Data" }, { label: "View Level 2 Observation Data (DLA Access)" }],
  },
  {
    label: "Data Licencing Agreement (DLA)",
    items: [{ label: "Request New DLA" }, { label: "Manage DLA" }],
  },
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
// contributions or private datasets to show a second tab for), Observations drops its Level 2/DLA
// item entirely, and Data Licencing Agreement/Nominate Sensitive Species/Reports/Template Finder
// don't exist as sections at all (not just hidden leaves inside them). Reuses the `dashboard`/
// `project-list` keys since the underlying pages are the same ones registered-user's tree points
// at - each page reads the active role to decide whether to show its two-peer-tab treatment or
// this single-view one, not two different destinations.
export const publicUserNav: NavNode[] = [
  { label: "Home", key: "dashboard" },
  { label: "Projects", key: "project-list" },
  {
    label: "Observations",
    items: [{ label: "View Level 1 Public Observation Data" }],
  },
];

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
  {
    label: "Create Project",
    steps: [
      "Add Project Details",
      "Privacy and Restrictions: Embargo",
      "Privacy and Restrictions: Sensitive Species and Location",
      "Privacy and Restrictions: Restrict Project Metadata",
      "Privacy and Restrictions: Request Other Restrictions",
    ],
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

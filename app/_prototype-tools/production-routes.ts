// Where each lab's page lives in production. A lab (a folder under app/proto) is where a screen is explored; once a direction is
// chosen and folded into the product, the Prototype tools bar shows an "In production" link on that lab that opens the
// live page, so the result can be seen without hunting for the route (CONTRACTS 4.4). The same link is useful before a
// decision, to put the lab next to the page it is about.
//
// Add a line here whenever a lab is folded into a page, or a new lab is built for one. A lab with no page of its own
// (the Prototype tools bar, the data model stress test, a superseded exploration) has no line and shows no link.
// `href` is the path only: the bar adds the role (`productionTarget`).
// Only a lab that mounts the bar (`<PrototypeTools />`) shows the link; the older labs draw their own picker and have no bar yet.
import { USER_ROLES, type UserRole } from "@/lib/user-role";

export interface ProductionRoute {
  /** The lab's folder name under app/proto, e.g. `column-2` (its route is that name after the labs' prefix). */
  lab: string;
  /** The production page, named as a person would: "Template Finder". */
  label: string;
  /** Its path, e.g. `/pages/template-finder`. */
  href: string;
  /** The personas the lab is about, when the page looks different to each role (Home does): the link opens as the viewed
   *  role if it is one of these, and otherwise as the first of them that can open the page. Leave out when the page is
   *  the same for everyone who can open it. */
  persona?: UserRole[];
}

export const PRODUCTION_ROUTES: ProductionRoute[] = [
  { lab: "admin-dashboard-options", label: "Home", href: "/pages/dashboard", persona: ["biodata-admin"] },
  { lab: "collection-sidebar", label: "Data Sharing Agreements", href: "/pages/dsa" },
  { lab: "column-2", label: "Template Finder", href: "/pages/template-finder" },
  { lab: "dashboard-options", label: "Home", href: "/pages/dashboard", persona: ["registered-user"] },
  { lab: "dataset-ingestion", label: "Project datasets", href: "/pages/project-list/adelaide-hills/project-details?view=datasets" },
  { lab: "home-cleanup", label: "Home", href: "/pages/dashboard", persona: ["registered-user"] },
  { lab: "layouts", label: "Data Validation Error report", href: "/pages/reports/data-validation-error" },
  { lab: "project-detail", label: "Project page", href: "/pages/project-detail" },
  { lab: "project-header", label: "Project page", href: "/pages/project-detail" },
  { lab: "project-sidebar", label: "Project page", href: "/pages/project-detail" },
  { lab: "public-user", label: "Home", href: "/pages/dashboard", persona: ["public-user"] },
  { lab: "public-user-explorations", label: "Home", href: "/pages/dashboard", persona: ["public-user"] },
  { lab: "tab-icons", label: "Project page", href: "/pages/project-detail" },
];

/** The production page for the lab at `pathname`, if it has one. */
export function productionFor(pathname: string): ProductionRoute | undefined {
  const lab = /^\/proto\/([^/]+)\/?$/.exec(pathname)?.[1];
  return lab ? PRODUCTION_ROUTES.find((r) => r.lab === lab) : undefined;
}

/**
 * The role a lab's link opens the page as, and the full link. The viewed role is kept when it can open the page and the page
 * is the same for it as for the lab's persona. Otherwise the link goes to where the feature exists, on the persona it is for:
 * the lab's own persona when it names one, else the lowest role that can open the page (a public user and the Template
 * Finder go to a registered user). `note` says so on the bar when the role changed.
 */
export function productionTarget(route: ProductionRoute, viewed: UserRole, canOpen: (path: string, role: UserRole) => boolean) {
  const path = route.href.split("?")[0];
  const open = (r: UserRole) => canOpen(path, r);
  const wanted = route.persona?.length && !route.persona.includes(viewed) ? route.persona.find(open) : undefined;
  const role = wanted ?? (open(viewed) ? viewed : ([...USER_ROLES].reverse().find(open) ?? viewed));
  return { role, href: `${route.href}${route.href.includes("?") ? "&" : "?"}userRole=${role}`, changed: role !== viewed };
}

import type { BadgeColors } from "@/components/base/badges/badge-types";

// User Management - users, roles and permissions for the BioData Admin (Figma
// YMproGZfrFB5jUqPHPxMhk, node 1558:10575, a lo-fi wireframe fitted into the shell - see
// context/decisions/2026-09-27-05-user-management-phase-1-for-biodata-admin-only.md). Display-only data, per the designer's decision: editing a role here does not change
// what a persona sees elsewhere in the prototype (that is `config/role-access.config.ts`).
//
// People and organisations are made up, in the South Australian realm, per a designer override of
// CONTRACTS.md 0.3 for this feature ("just to show the capability of user management"). The
// Department for Environment and Water is the one real organisation, because BioData SA is DEW's.
// Email domains other than DEW's use `.example` so no address can belong to a real person.

// ---------------------------------------------------------------- lifecycles

export type UserStatus = "invited" | "active" | "inactive" | "archived";
/** Roles and permissions share one lifecycle: Scheduled (start date ahead) > Active <> Disabled > Archived. */
export type AccessStatus = "scheduled" | "active" | "disabled" | "archived";

export const userStatusOrder: UserStatus[] = ["invited", "active", "inactive", "archived"];
export const accessStatusOrder: AccessStatus[] = ["scheduled", "active", "disabled", "archived"];

export const userStatusMeta: Record<UserStatus, { label: string; badgeColor: BadgeColors }> = {
  invited: { label: "Invited", badgeColor: "brand" },
  active: { label: "Active", badgeColor: "success" },
  inactive: { label: "Inactive", badgeColor: "warning" },
  archived: { label: "Archived", badgeColor: "gray" },
};

export const accessStatusMeta: Record<AccessStatus, { label: string; badgeColor: BadgeColors }> = {
  scheduled: { label: "Scheduled", badgeColor: "brand" },
  active: { label: "Active", badgeColor: "success" },
  disabled: { label: "Disabled", badgeColor: "warning" },
  archived: { label: "Archived", badgeColor: "gray" },
};

// ---------------------------------------------------------------- records

export interface UmPermission {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  status: AccessStatus;
  startDate: string;
  endDate?: string;
  updatedAt: string;
}

export type RoleKind = "system" | "custom";

export interface UmRole {
  id: string;
  code: string;
  name: string;
  description: string;
  kind: RoleKind;
  /** Custom roles only: the organisation the role belongs to. */
  department?: string;
  /** The wireframe's "Role Type": the group a role sits in (Data Submission, Administration). */
  roleType: string;
  status: AccessStatus;
  startDate: string;
  endDate?: string;
  permissionIds: string[];
  updatedAt: string;
}

export interface UmUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  /** Job title. The wireframe labels this "Role", renamed so it can't be confused with an access role. */
  position: string;
  /** Empty for an individual with no organisation (a registered user). */
  organisation: string;
  email: string;
  phone?: string;
  status: UserStatus;
  startDate: string;
  endDate?: string;
  roleIds: string[];
  updatedAt: string;
}

// ---------------------------------------------------------------- dates

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatShortDate(iso: string | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/** A role or permission whose start date has arrived is Active, not Scheduled - applied when read. */
export function resolveAccessStatus(status: AccessStatus, startDate: string, today = todayIso()): AccessStatus {
  return status === "scheduled" && startDate <= today ? "active" : status;
}

// ---------------------------------------------------------------- organisations

export const DEW = "Department for Environment and Water";

/** DEW plus made-up South Australian community and research organisations. */
export const UM_ORGANISATIONS = [
  DEW,
  "Eyre Peninsula Wildlife Survey",
  "Fleurieu Coast Landcare",
  "Flinders Ranges Ecology Group",
  "Murray Mallee Field Naturalists",
];

export const INDIVIDUAL = "Individual (no organisation)";

export function organisationLabel(user: Pick<UmUser, "organisation">): string {
  return user.organisation || "Individual";
}

// ---------------------------------------------------------------- permissions

// The permission catalogue, taken from the wireframe's own names and descriptions (the designer
// confirmed them as accurate): each category and its four permissions as drawn across the Users,
// Roles and Permissions frames.
const CATALOGUE: { category: string; items: [string, string][] }[] = [
  {
    category: "Content",
    items: [
      ["View Content", "View published and draft content"],
      ["Edit Content", "Edit published and draft content"],
      ["Create Content", "Create new content"],
      ["Delete Content", "Delete published and draft content"],
    ],
  },
  {
    category: "Workflow",
    items: [
      ["Update BioData", "Change published and draft BioData"],
      ["Discard BioData", "Erase published and draft BioData"],
      ["Broadcast BioData", "Send published and draft BioData"],
      ["File BioData", "Save published and draft BioData"],
    ],
  },
  {
    category: "Project Access",
    items: [
      ["Access Datasets", "Browse curated project datasets"],
      ["Access Models", "Explore validated machine learning models"],
      ["Access Pipelines", "Run automated data processing workflows"],
      ["Access Visualizations", "Interact with dynamic data visualizations"],
    ],
  },
  {
    category: "User Controls",
    items: [
      ["Create Datasets", "Upload and structure new datasets"],
      ["Curate Models", "Validate and publish machine learning models"],
      ["Design Pipelines", "Orchestrate data processing workflows"],
      ["Develop Visualizations", "Build interactive data dashboards"],
    ],
  },
  {
    category: "Researcher Data",
    items: [
      ["Read Datasets", "Access public biodiversity datasets"],
      ["Edit Datasets", "Modify existing datasets or create new ones"],
      ["Delete Datasets", "Remove datasets and associated metadata"],
      ["Manage Roles", "Assign roles to control data access"],
    ],
  },
  {
    category: "Application Access",
    items: [
      ["Read Observations", "Access public observation records"],
      ["Edit Observations", "Modify existing records or create new ones"],
      ["Delete Observations", "Remove observation records permanently"],
      ["Manage Workflows", "Automate data processing and analysis"],
    ],
  },
  {
    category: "User Settings",
    items: [
      ["Manage Profile", "Update personal information and preferences"],
      ["Privacy Settings", "Control data sharing and visibility"],
      ["Notification Preferences", "Set alerts for updates and communications"],
      ["Account Security", "Manage passwords and two-factor authentication"],
    ],
  },
  {
    category: "Analytics Dashboard",
    items: [
      ["View Metrics", "Analyze user engagement and content performance"],
      ["Export Reports", "Download data for external analysis"],
      ["Set Goals", "Define targets for content success"],
      ["Track Trends", "Monitor changes in user behavior"],
    ],
  },
  {
    category: "Help Center",
    items: [
      ["Access FAQs", "Find answers to common questions"],
      ["Contact Support", "Reach out for technical assistance"],
      ["Submit Feedback", "Share your thoughts on improving the platform"],
      ["Tutorials", "Learn through guided walkthroughs"],
    ],
  },
  {
    category: "System Tools",
    items: [
      ["Run Diagnostics", "Check system health and performance"],
      ["Manage Backups", "Schedule and restore data backups"],
      ["Monitor Logs", "Track system events and errors"],
      ["Configure Alerts", "Set up notifications for critical events"],
    ],
  },
];

/** A short code from a name's initials ("Read Datasets" -> "RD"), numbered when two would clash. */
export function codeFor(name: string, taken: Set<string>): string {
  const base =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "X";
  let code = base;
  for (let n = 2; taken.has(code); n++) code = `${base}${n}`;
  taken.add(code);
  return code;
}

// A few permissions away from Active, so every lifecycle state has a real example.
const PERMISSION_STATUS: Record<string, { status: AccessStatus; startDate?: string }> = {
  "Configure Alerts": { status: "scheduled", startDate: "2026-11-02" },
  "Curate Models": { status: "scheduled", startDate: "2026-12-01" },
  "Manage Backups": { status: "disabled" },
  "Broadcast BioData": { status: "archived" },
};

export const seedPermissions: UmPermission[] = (() => {
  const taken = new Set<string>();
  let n = 301;
  return CATALOGUE.flatMap(({ category, items }) =>
    items.map(([name, description]) => {
      const override = PERMISSION_STATUS[name];
      return {
        id: `PERM-${n++}`,
        code: codeFor(name, taken),
        category,
        name,
        description,
        status: override?.status ?? "active",
        startDate: override?.startDate ?? "2025-07-01",
        updatedAt: override ? "2026-09-12" : "2026-06-18",
      };
    }),
  );
})();

export const permissionCategories = (permissions: UmPermission[]) => [...new Set(permissions.map((p) => p.category))];

const permissionId = (name: string) => {
  const found = seedPermissions.find((p) => p.name === name);
  if (!found) throw new Error(`Unknown permission ${name}`);
  return found.id;
};
const categoryIds = (...categories: string[]) => seedPermissions.filter((p) => categories.includes(p.category)).map((p) => p.id);
const ids = (...names: string[]) => names.map(permissionId);

// ---------------------------------------------------------------- roles

// System roles are this build's own signed-in personas (lib/user-role.ts). The wireframe's
// "TPA API Admin" and "TPA API User" are Privileged Admin and Privileged User (designer decision,
// logged in context/decisions/2026-09-27-05-user-management-phase-1-for-biodata-admin-only.md for later); its "BioData Super Admin" has no equivalent in the role model.
export const seedRoles: UmRole[] = [
  {
    id: "ROLE-101",
    code: "BA",
    name: "BioData Admin",
    description: "Administers BioData SA for DEW: users, roles, permissions and every record across projects.",
    kind: "system",
    roleType: "Administration",
    status: "active",
    startDate: "2025-07-01",
    permissionIds: seedPermissions.map((p) => p.id),
    updatedAt: "2026-08-04",
  },
  {
    id: "ROLE-102",
    code: "BU",
    name: "BioData User",
    description: "DEW staff working with BioData records across every project.",
    kind: "system",
    roleType: "Staff",
    status: "active",
    startDate: "2025-07-01",
    permissionIds: [
      ...ids("View Content", "Edit Content", "Create Content", "Update BioData", "File BioData"),
      ...categoryIds("Project Access", "User Settings", "Help Center"),
      ...ids("Read Datasets", "Edit Datasets", "Read Observations", "Edit Observations", "View Metrics", "Export Reports"),
    ],
    updatedAt: "2026-08-04",
  },
  {
    id: "ROLE-103",
    code: "PA",
    name: "Privileged Admin",
    description: "Administers a partner organisation: its own users, and the data access it holds.",
    kind: "system",
    roleType: "Partner administration",
    status: "active",
    startDate: "2025-07-01",
    permissionIds: [
      ...ids("View Content", "Edit Content", "Create Content", "Read Datasets", "Edit Datasets", "Manage Roles", "Read Observations", "Edit Observations"),
      ...ids("Access Datasets", "Access Visualizations", "View Metrics", "Export Reports"),
      ...categoryIds("User Settings", "Help Center"),
    ],
    updatedAt: "2026-07-22",
  },
  {
    id: "ROLE-104",
    code: "PU",
    name: "Privileged User",
    description: "A member of a partner organisation, with that organisation's data access.",
    kind: "system",
    roleType: "Partner access",
    status: "active",
    startDate: "2025-07-01",
    permissionIds: [
      ...ids("View Content", "Create Content", "Read Datasets", "Read Observations", "Edit Observations", "Access Datasets", "Access Visualizations"),
      ...categoryIds("User Settings", "Help Center"),
    ],
    updatedAt: "2026-07-22",
  },
  {
    id: "ROLE-105",
    code: "RU",
    name: "Registered User",
    description: "An individual account: contributes data, nominates sensitive species and tracks their own submissions.",
    kind: "system",
    roleType: "Individual access",
    status: "active",
    startDate: "2025-07-01",
    permissionIds: [...ids("View Content", "Create Content", "Read Datasets", "Read Observations", "Edit Observations"), ...categoryIds("User Settings", "Help Center")],
    updatedAt: "2026-05-30",
  },
];

const dataManager = [...ids("View Content", "Edit Content", "Update BioData", "File BioData"), ...categoryIds("Researcher Data", "Application Access")];
const contributor = ids("View Content", "Create Content", "File BioData", "Read Datasets", "Read Observations", "Edit Observations");
const reviewer = ids("View Content", "Edit Content", "Update BioData", "Discard BioData", "Read Datasets", "Read Observations");
const groupAdmin = [...ids("Manage Roles", "View Metrics", "Export Reports"), ...categoryIds("User Settings")];

function customRole(id: string, department: string, roleType: string, name: string, permissionIds: string[], extra: Partial<UmRole> = {}): UmRole {
  const initials = department
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("");
  return {
    id,
    code: `${initials}-${name
      .split(/\s+/)
      .map((w) => w[0]!.toUpperCase())
      .join("")}`,
    name,
    description: `${name} for ${department}'s ${roleType.toLowerCase()} work.`,
    kind: "custom",
    department,
    roleType,
    status: "active",
    startDate: "2025-09-01",
    permissionIds,
    updatedAt: "2026-06-10",
    ...extra,
  };
}

export const seedCustomRoles: UmRole[] = [
  customRole("ROLE-201", DEW, "Data Submission", "Data Manager", dataManager),
  customRole("ROLE-202", DEW, "Data Submission", "Contributor", contributor),
  customRole("ROLE-203", DEW, "Data Submission", "Reviewer", reviewer),
  customRole("ROLE-204", DEW, "Administration", "Group Admin", groupAdmin),
  customRole("ROLE-205", "Fleurieu Coast Landcare", "Data Submission", "Contributor", contributor),
  customRole("ROLE-206", "Fleurieu Coast Landcare", "Administration", "Group Admin", groupAdmin, { status: "disabled", updatedAt: "2026-09-03" }),
  customRole("ROLE-207", "Flinders Ranges Ecology Group", "Data Submission", "Data Manager", dataManager),
  customRole("ROLE-208", "Flinders Ranges Ecology Group", "Data Submission", "Contributor", contributor),
  customRole("ROLE-209", "Flinders Ranges Ecology Group", "Data Submission", "Reviewer", reviewer),
  customRole("ROLE-210", "Murray Mallee Field Naturalists", "Data Submission", "Contributor", contributor, { status: "scheduled", startDate: "2026-11-15", updatedAt: "2026-09-20" }),
  customRole("ROLE-211", "Eyre Peninsula Wildlife Survey", "Field Survey", "Field Assistant", ids("View Content", "Create Content", "Read Observations"), {
    status: "archived",
    updatedAt: "2026-04-11",
  }),
];

export const allSeedRoles: UmRole[] = [...seedRoles, ...seedCustomRoles];

// ---------------------------------------------------------------- users

const email = (first: string, last: string, organisation: string) => {
  const local = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
  if (organisation === DEW) return `${local}@sa.gov.au`;
  // The organisation's initials ("Fleurieu Coast Landcare" -> fcl), so the address stays readable.
  const domain = organisation
    ? organisation
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toLowerCase()
    : "mail";
  return `${local}@${domain}.example`;
};

function user(
  id: string,
  firstName: string,
  lastName: string,
  position: string,
  organisation: string,
  roleIds: string[],
  status: UserStatus = "active",
  extra: Partial<UmUser> = {},
): UmUser {
  return {
    id,
    username: `${firstName[0]}${lastName}`.toLowerCase().replace(/[^a-z]/g, ""),
    firstName,
    lastName,
    position,
    organisation,
    email: email(firstName, lastName, organisation),
    phone: "+61 8 8204 0000",
    status,
    startDate: "2025-08-01",
    roleIds,
    updatedAt: "2026-08-20",
    ...extra,
  };
}

export const seedUsers: UmUser[] = [
  // Jane is the BioData Admin placeholder (Home greets her); Olivia Wyatt is the Registered User
  // placeholder everywhere else, so she is an individual here, not the wireframe's DEW Data Admin.
  user("USR-1001", "Jane", "Harlow", "Data Admin", DEW, ["ROLE-101"]),
  user("USR-1002", "Jarrah", "Mitchell", "Senior Ecologist", DEW, ["ROLE-102", "ROLE-201"]),
  user("USR-1003", "Priya", "Raman", "Data Analyst", DEW, ["ROLE-102", "ROLE-203"]),
  user("USR-1004", "Tom", "Nguyen", "Field Officer", DEW, ["ROLE-102", "ROLE-202"], "inactive", { updatedAt: "2026-07-01" }),
  user("USR-1005", "Hannah", "Kowalski", "Group Coordinator", "Fleurieu Coast Landcare", ["ROLE-103", "ROLE-206"]),
  user("USR-1006", "Liam", "O'Connor", "Volunteer Coordinator", "Fleurieu Coast Landcare", ["ROLE-104", "ROLE-205"]),
  user("USR-1007", "Mei", "Chen", "Research Ecologist", "Flinders Ranges Ecology Group", ["ROLE-103", "ROLE-207"]),
  user("USR-1008", "Sophie", "Brennan", "Survey Coordinator", "Flinders Ranges Ecology Group", ["ROLE-104", "ROLE-209"]),
  user("USR-1009", "Daniel", "Rossi", "Field Technician", "Flinders Ranges Ecology Group", ["ROLE-104", "ROLE-208"], "invited", { startDate: "2026-10-06", updatedAt: "2026-09-24" }),
  user("USR-1010", "Grace", "Thompson", "Club Secretary", "Murray Mallee Field Naturalists", ["ROLE-103"]),
  user("USR-1011", "Kieran", "Walsh", "Bird Surveyor", "Murray Mallee Field Naturalists", ["ROLE-104"], "inactive", { updatedAt: "2026-06-14" }),
  user("USR-1012", "Aisha", "Rahman", "Project Lead", "Eyre Peninsula Wildlife Survey", ["ROLE-103"], "invited", { startDate: "2026-10-01", updatedAt: "2026-09-25" }),
  user("USR-1013", "Ben", "Carter", "Field Assistant", "Eyre Peninsula Wildlife Survey", ["ROLE-104", "ROLE-211"], "archived", { endDate: "2026-04-10", updatedAt: "2026-04-11" }),
  user("USR-1014", "Olivia", "Wyatt", "Citizen scientist", "", ["ROLE-105"], "active", { displayName: "Liv" }),
  user("USR-1015", "Nathan", "Brooks", "Birdwatcher", "", ["ROLE-105"]),
  user("USR-1016", "Ruby", "Anderson", "Student volunteer", "", ["ROLE-105"], "active", { phone: undefined }),
];

export function fullName(u: Pick<UmUser, "firstName" | "lastName">): string {
  return `${u.firstName} ${u.lastName}`.trim();
}

export function initials(u: Pick<UmUser, "firstName" | "lastName">): string {
  return `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
}

// ---------------------------------------------------------------- derived

/** The context/decisions/2026-09-22-06-biodata-admin-ia-cross-check.md admin IA splits users into BioData and Privileged (plus individuals): derived from the system roles held. */
export type UserType = "BioData" | "Privileged" | "Registered";
export const userTypeOrder: UserType[] = ["BioData", "Privileged", "Registered"];

export function userType(u: Pick<UmUser, "roleIds">): UserType {
  if (u.roleIds.includes("ROLE-101") || u.roleIds.includes("ROLE-102")) return "BioData";
  if (u.roleIds.includes("ROLE-103") || u.roleIds.includes("ROLE-104")) return "Privileged";
  return "Registered";
}

/** A custom role's place in the tree, "Department / Role type". Empty for a system role. */
export function rolePath(role: UmRole): string {
  return role.kind === "custom" ? `${role.department} / ${role.roleType}` : "";
}

// ---------------------------------------------------------------- ids

function nextId(prefix: string, existing: { id: string }[], floor: number): string {
  const highest = existing.reduce((max, r) => Math.max(max, Number(r.id.slice(prefix.length + 1)) || 0), floor);
  return `${prefix}-${highest + 1}`;
}

export const nextUserId = (users: UmUser[]) => nextId("USR", users, 1000);
export const nextRoleId = (roles: UmRole[]) => nextId("ROLE", roles, 200);
export const nextPermissionId = (permissions: UmPermission[]) => nextId("PERM", permissions, 300);

// Every dynamic id listed up front for the GitHub Pages static export: the seeds plus the next ids
// a new record would get (the same approach as staticDsaIds).
const upcoming = (prefix: string, existing: { id: string }[], floor: number, count: number) => {
  const highest = existing.reduce((max, r) => Math.max(max, Number(r.id.slice(prefix.length + 1)) || 0), floor);
  return Array.from({ length: count }, (_, i) => `${prefix}-${highest + 1 + i}`);
};

export const staticUserIds = (count = 50) => [...seedUsers.map((u) => u.id), ...upcoming("USR", seedUsers, 1000, count)];
export const staticRoleIds = (count = 50) => [...allSeedRoles.map((r) => r.id), ...upcoming("ROLE", allSeedRoles, 200, count)];
export const staticPermissionIds = (count = 50) => [...seedPermissions.map((p) => p.id), ...upcoming("PERM", seedPermissions, 300, count)];

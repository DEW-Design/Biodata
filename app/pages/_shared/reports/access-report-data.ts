import {
  accessStatusMeta,
  fullName,
  organisationLabel,
  todayIso,
  userStatusMeta,
  userType,
  type UmPermission,
  type UmRole,
  type UmUser,
} from "@/app/pages/_shared/user-management/um-data";

// The rows of the five reports on who can do what, read from the users, roles and permissions User Management holds (um-store.ts), so a report and the
// record's own page cannot disagree. Each row is one thing: a user, a role, a permission, one role held by one user, or one permission held by one role.
//
// User Management does not record who created a user, role or permission, who last changed it, or a status and dates for a role held by a user or a
// permission held by a role (it keeps the day of the last update, `updatedAt`, and the start and end dates of the record itself). The designer asked
// for the prototype to show them anyway (16 Oct 2026: "yes, but just let it have mock data. Remember, this is a clickable prototype"), so the report
// makes them up from what it does hold, the same way every time (nothing is stored, and the records' own pages do not show them):
//   - Created by and Modified by are the placeholder people (CONTRACTS 0.3), taken in turn by the record's number; Created on is the day the record
//     starts, or the day it was last updated if that is earlier; Modified on is `updatedAt`;
//   - an assignment (a role held by a user, a permission held by a role) is valid from the later of the two records' start dates and until the end of the
//     user (or of the role), and its status follows the two records it joins: Archived or Inactive where either is, Scheduled while it has not started,
//     otherwise Active;
//   - still empty, because nothing here can stand in for them: for a user, the wireframe's Nature of work, Purpose, the three acknowledgements and the
//     two DEW review columns.

const PEOPLE = ["Olivia Wyatt", "Phoenix Baker", "Lana Steiner", "Maya Dewitt"];
const numberOf = (key: string) => Number(key.replace(/\D/g, "")) || 0;
const person = (key: string, shift = 0) => PEOPLE[(numberOf(key) + shift) % PEOPLE.length];
const earlier = (start: string, updated: string) => (start && start <= updated ? start : updated);
const later = (a: string, b: string) => (a > b ? a : b);

/** The mock history of a record: who made it and when, and who last changed it. */
function stamp(key: string, start: string, updated: string) {
  return { createdBy: person(key), created: earlier(start, updated), modifiedBy: person(key, 1), updated };
}

/** The status of an assignment from the status of the two records it joins. `ended` is the label that means a record is no longer in use. */
function assignmentStatus(labels: string[], start: string): string {
  if (labels.some((l) => l === "Archived")) return "Archived";
  if (labels.some((l) => l === "Inactive" || l === "Disabled")) return "Inactive";
  if (labels.some((l) => l === "Scheduled" || l === "Invited") || start > todayIso()) return "Scheduled";
  return "Active";
}

const levelOf = (status: UmRole["status"]) => accessStatusMeta[status].label;

/** What an assignment adds to a row: its status, its valid dates and its history. */
function assignment(key: string, labels: string[], start: string, end: string, updated: string) {
  return { assignmentStatus: assignmentStatus(labels, start), start, end, ...stamp(key, start, updated) };
}

export interface UserRow {
  id: string;
  seq: number;
  userId: string;
  userName: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  alias: string;
  type: string;
  phone: string;
  organisation: string;
  status: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  /** The day of the last update, as an ISO day. */
  updated: string;
}

export function userRowsFor(users: UmUser[]): UserRow[] {
  return users.map((u, i) => ({
    id: u.id,
    seq: i + 1,
    userId: u.id,
    userName: u.username,
    fullName: fullName(u),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    alias: u.displayName ?? "",
    type: userType(u),
    phone: u.phone ?? "",
    organisation: organisationLabel(u),
    status: userStatusMeta[u.status].label,
    ...stamp(u.id, u.startDate, u.updatedAt),
  }));
}

export interface RoleRow {
  id: string;
  seq: number;
  roleId: string;
  name: string;
  description: string;
  /** Empty for a system role: it belongs to BioData, not to a department. */
  department: string;
  type: string;
  status: string;
  start: string;
  end: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  updated: string;
}

export function roleRowsFor(roles: UmRole[]): RoleRow[] {
  return roles.map((r, i) => ({
    id: r.id,
    seq: i + 1,
    roleId: r.id,
    name: r.name,
    description: r.description,
    department: r.department ?? "",
    type: r.roleType,
    status: levelOf(r.status),
    start: r.startDate,
    end: r.endDate ?? "",
    ...stamp(r.id, r.startDate, r.updatedAt),
  }));
}

export interface PermissionRow {
  id: string;
  seq: number;
  permissionId: string;
  name: string;
  description: string;
  /** The category the permission is listed under. */
  type: string;
  status: string;
  start: string;
  end: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  updated: string;
}

export function permissionRowsFor(permissions: UmPermission[]): PermissionRow[] {
  return permissions.map((p, i) => ({
    id: p.id,
    seq: i + 1,
    permissionId: p.id,
    name: p.name,
    description: p.description,
    type: p.category,
    status: levelOf(p.status),
    start: p.startDate,
    end: p.endDate ?? "",
    ...stamp(p.id, p.startDate, p.updatedAt),
  }));
}

export interface UserRoleRow {
  id: string;
  seq: number;
  userId: string;
  userName: string;
  fullName: string;
  userStatus: string;
  roleId: string;
  roleName: string;
  department: string;
  roleType: string;
  roleStatus: string;
  assignmentStatus: string;
  start: string;
  end: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  updated: string;
}

/** One row for each role a user holds, in the order the user lists them. A user with no role has no row. */
export function userRoleRowsFor(users: UmUser[], roles: UmRole[]): UserRoleRow[] {
  const byId = new Map(roles.map((r) => [r.id, r]));
  const rows = users.flatMap((u) =>
    u.roleIds.flatMap((roleId) => {
      const role = byId.get(roleId);
      return role
        ? [
            {
              id: `${u.id}:${role.id}`,
              userId: u.id,
              userName: u.username,
              fullName: fullName(u),
              userStatus: userStatusMeta[u.status].label,
              roleId: role.id,
              roleName: role.name,
              department: role.department ?? "",
              roleType: role.roleType,
              roleStatus: levelOf(role.status),
              ...assignment(`${u.id}${role.id}`, [userStatusMeta[u.status].label, levelOf(role.status)], later(u.startDate, role.startDate), u.endDate ?? "", u.updatedAt),
            },
          ]
        : [];
    }),
  );
  return rows.map((r, i) => ({ ...r, seq: i + 1 }));
}

export interface RolePermissionRow {
  id: string;
  seq: number;
  roleId: string;
  roleName: string;
  department: string;
  roleType: string;
  roleStatus: string;
  permissionId: string;
  permissionName: string;
  assignmentStatus: string;
  start: string;
  end: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  updated: string;
}

/** One row for each permission a role holds, in the order the role lists them. A role with no permission has no row. */
export function rolePermissionRowsFor(roles: UmRole[], permissions: UmPermission[]): RolePermissionRow[] {
  const byId = new Map(permissions.map((p) => [p.id, p]));
  const rows = roles.flatMap((r) =>
    r.permissionIds.flatMap((permissionId) => {
      const permission = byId.get(permissionId);
      return permission
        ? [
            {
              id: `${r.id}:${permission.id}`,
              roleId: r.id,
              roleName: r.name,
              department: r.department ?? "",
              roleType: r.roleType,
              roleStatus: levelOf(r.status),
              permissionId: permission.id,
              permissionName: permission.name,
              ...assignment(`${r.id}${permission.id}`, [levelOf(r.status), levelOf(permission.status)], later(r.startDate, permission.startDate), r.endDate ?? permission.endDate ?? "", r.updatedAt),
            },
          ]
        : [];
    }),
  );
  return rows.map((r, i) => ({ ...r, seq: i + 1 }));
}

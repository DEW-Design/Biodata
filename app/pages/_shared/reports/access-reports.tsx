"use client";

import { useMemo } from "react";
import { Key02, UserCheck01, UsersCheck, Key01, Users01 } from "@untitledui/icons";
import { dayAttribute, dayColumn, distinct, optionsAttribute, periodAttribute, seqColumn, stampColumns } from "@/app/pages/_shared/reports/admin-report-helpers";
import {
  permissionRowsFor,
  rolePermissionRowsFor,
  roleRowsFor,
  userRoleRowsFor,
  userRowsFor,
  type PermissionRow,
  type RolePermissionRow,
  type RoleRow,
  type UserRoleRow,
  type UserRow,
} from "@/app/pages/_shared/reports/access-report-data";
import { REPORT_WIDTH as W, emptyColumn, idColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { DataReport } from "@/app/pages/_shared/reports/report-table";
import { usePermissions, useRoles, useUsers } from "@/app/pages/_shared/user-management/um-store";

// The five reports on who can do what (the designer, 16 Oct 2026, Figma YMproGZfrFB5jUqPHPxMhk: User detail 165:13113, Role detail 165:13421,
// User - role detail 165:13646, Permission detail 165:13881, Role - permission detail 165:14101, each with its Columns panel). They read the users,
// roles and permissions User Management holds (access-report-data.ts says what that does not record, and so which columns are empty).
// BioData Admin and above only (`userManagement`, as User Management itself). Fitted into the shared report pattern (report-table.tsx) with these
// departures from the wireframe, on purpose:
//   - the wireframe's Filters card is the table's own controls (CONTRACTS 4.6 item 4, /patterns/report-toolbar): a name or an ID (User name, User
//     full name, Role name, Role ID) is the search; a line chosen from a list (Institution / Organization, Status) is an attribute of the one Filter
//     menu, and Additional filter is the menu itself. A report that is not run on anything (a project, a dataset) has no Parameters;
//   - the wireframe's Institution / Organization is the role's department on the role reports, and the user's organisation on the user report;
//   - Created by, Created on, Modified by, a role's or permission's assignment status and the assignment's dates are mock data, made up from what User
//     Management holds (access-report-data.ts says how): the designer asked for the prototype to show them (16 Oct 2026);
//   - the wireframe's Permission detail Filters card also asks for a User full name, which no column of that report holds, so it is not offered;
//   - labels are sentence case and spelled out ("Contact No" is "Contact number", "Role Desc" is "Role description", "UR Assignment Status" is
//     "User - role assignment status") and the wireframe's mixed "Permission Id" is "Permission ID";
//   - a column nothing can stand in for (a user's Nature of work, Purpose, acknowledgements and DEW review and approval) is in the table, in the wireframe's
//     place, and left empty (an empty cell is never a stray dash, 2.3).
// The first column, Seq#, is pinned when the table scrolls sideways.

const count = (rows: { status: string }[], status: string) => rows.filter((r) => r.status === status).length.toLocaleString("en-AU");

// ── User detail ──

const userColumns: ViewColumn<UserRow>[] = [
  seqColumn<UserRow>(),
  idColumn("userId", "User ID", W.sm, (r) => r.userId),
  textColumn("userName", "User name", W.md, (r) => r.userName),
  textColumn("fullName", "User full name", W.lg, (r) => r.fullName, { strong: true }),
  textColumn("firstName", "First name", W.md, (r) => r.firstName),
  textColumn("lastName", "Last name", W.md, (r) => r.lastName),
  textColumn("email", "Email", W.xl, (r) => r.email),
  textColumn("alias", "Display name / alias", W.md, (r) => r.alias),
  textColumn("type", "User type", W.md, (r) => r.type),
  textColumn("phone", "Contact number", W.md, (r) => r.phone),
  emptyColumn("natureOfWork", "Nature of work", W.lg),
  textColumn("organisation", "Institution / organisation", W.xl, (r) => r.organisation),
  emptyColumn("purpose", "Purpose", W.lg),
  emptyColumn("acknowledgeTerms", "Acknowledge terms", W.md),
  emptyColumn("acknowledgePrivacy", "Acknowledge privacy notice", W.lg),
  emptyColumn("dataStorageConsent", "Data storage consent", W.md),
  textColumn("status", "Status", W.sm, (r) => r.status),
  emptyColumn("dewReview", "DEW review", W.md),
  emptyColumn("dewApproval", "DEW approval", W.md),
  ...stampColumns<UserRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
];

export function UserDetailReport() {
  const users = useUsers();
  const rows = useMemo(() => userRowsFor(users), [users]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("type", "User type", rows, (r) => r.type),
      ...optionsAttribute("organisation", "Institution / organisation", rows, (r) => r.organisation, { searchable: true }),
      ...optionsAttribute("status", "Status", rows, (r) => r.status),
      dayAttribute<UserRow>("created", "Creation date", (r) => r.created),
      dayAttribute<UserRow>("modified", "Modified on", (r) => r.updated),
    ],
    [rows],
  );
  return (
    <DataReport
      title="User Detail Report"
      subtitle="Every user account: who they are, how to reach them, their organisation, type and status."
      icon={Users01}
      rows={rows}
      rowId={(r) => r.id}
      columns={userColumns}
      attributes={attributes}
      searchText={(r) => [r.userId, r.userName, r.fullName, r.alias, r.email, r.organisation]}
      searchLabel="Search the report"
      searchPlaceholder="Search by user ID, name or email"
      tableLabel="Users, one row each"
      noun="users"
      emptyDescription="Users appear here once they are added in User Management."
      initialSort={{ column: "seq", direction: "ascending" }}
      latest={(r) => r.updated}
      facts={(inView) => [
        { label: "Active", value: count(inView, "Active") },
        { label: "Organisations", value: distinct(inView, (r) => r.organisation) },
      ]}
      exportName="user-detail-report"
    />
  );
}

// ── Role detail ──

const roleColumns: ViewColumn<RoleRow>[] = [
  seqColumn<RoleRow>(),
  idColumn("roleId", "Role ID", W.sm, (r) => r.roleId),
  textColumn("name", "Role name", W.lg, (r) => r.name, { strong: true }),
  textColumn("description", "Role description", W.xl, (r) => r.description, { clamp: true }),
  textColumn("department", "Department", W.xl, (r) => r.department),
  textColumn("type", "Role type", W.lg, (r) => r.type),
  textColumn("status", "Status", W.sm, (r) => r.status),
  dayColumn<RoleRow>("start", "Valid from", W.md, (r) => r.start),
  dayColumn<RoleRow>("end", "Valid until", W.md, (r) => r.end),
  ...stampColumns<RoleRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
];

export function RoleDetailReport() {
  const roles = useRoles();
  const rows = useMemo(() => roleRowsFor(roles), [roles]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("department", "Department", rows, (r) => r.department, { searchable: true }),
      ...optionsAttribute("type", "Role type", rows, (r) => r.type),
      ...optionsAttribute("status", "Status", rows, (r) => r.status),
      periodAttribute<RoleRow>("valid", "Valid period", (r) => r.start, (r) => r.end),
      dayAttribute<RoleRow>("created", "Creation date", (r) => r.created),
      dayAttribute<RoleRow>("modified", "Modified on", (r) => r.updated),
    ],
    [rows],
  );
  return (
    <DataReport
      title="Role Detail Report"
      subtitle="Every role: what it is for, the department it belongs to, its type and when it is valid."
      icon={UserCheck01}
      rows={rows}
      rowId={(r) => r.id}
      columns={roleColumns}
      attributes={attributes}
      searchText={(r) => [r.roleId, r.name, r.description, r.department]}
      searchLabel="Search the report"
      searchPlaceholder="Search by role ID, name or department"
      tableLabel="Roles, one row each"
      noun="roles"
      emptyDescription="Roles appear here once they are added in User Management."
      initialSort={{ column: "seq", direction: "ascending" }}
      latest={(r) => r.updated}
      facts={(inView) => [
        { label: "Active", value: count(inView, "Active") },
        { label: "Departments", value: distinct(inView, (r) => r.department) },
      ]}
      exportName="role-detail-report"
    />
  );
}

// ── User - role detail ──

const userRoleColumns: ViewColumn<UserRoleRow>[] = [
  seqColumn<UserRoleRow>(),
  idColumn("userId", "User ID", W.sm, (r) => r.userId),
  textColumn("userName", "User name", W.md, (r) => r.userName),
  textColumn("fullName", "User full name", W.lg, (r) => r.fullName, { strong: true }),
  textColumn("userStatus", "User status", W.md, (r) => r.userStatus),
  textColumn("roleName", "Role name", W.lg, (r) => r.roleName, { strong: true }),
  textColumn("department", "Department", W.xl, (r) => r.department),
  textColumn("roleType", "Role type", W.lg, (r) => r.roleType),
  textColumn("roleStatus", "Role status", W.md, (r) => r.roleStatus),
  textColumn("assignmentStatus", "User - role assignment status", W.xl, (r) => r.assignmentStatus),
  dayColumn<UserRoleRow>("start", "Valid from", W.md, (r) => r.start),
  dayColumn<UserRoleRow>("end", "Valid until", W.md, (r) => r.end),
  ...stampColumns<UserRoleRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
];

export function UserRoleDetailReport() {
  const users = useUsers();
  const roles = useRoles();
  const rows = useMemo(() => userRoleRowsFor(users, roles), [users, roles]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("userStatus", "User status", rows, (r) => r.userStatus),
      ...optionsAttribute("department", "Department", rows, (r) => r.department, { searchable: true }),
      ...optionsAttribute("roleType", "Role type", rows, (r) => r.roleType),
      ...optionsAttribute("roleStatus", "Role status", rows, (r) => r.roleStatus),
      ...optionsAttribute("assignmentStatus", "Assignment status", rows, (r) => r.assignmentStatus),
      periodAttribute<UserRoleRow>("valid", "Valid period", (r) => r.start, (r) => r.end),
      dayAttribute<UserRoleRow>("created", "Creation date", (r) => r.created),
    ],
    [rows],
  );
  return (
    <DataReport
      title="User - Role Detail Report"
      subtitle="The roles each user holds, one row for each user and role, beside the status of both."
      icon={UsersCheck}
      rows={rows}
      rowId={(r) => r.id}
      columns={userRoleColumns}
      attributes={attributes}
      searchText={(r) => [r.userId, r.userName, r.fullName, r.roleId, r.roleName, r.department]}
      searchLabel="Search the report"
      searchPlaceholder="Search by user, role ID or role name"
      tableLabel="Roles held by users, one row each"
      noun="user roles"
      emptyDescription="A row appears here for each role a user is given in User Management."
      initialSort={{ column: "seq", direction: "ascending" }}
      facts={(inView) => [
        { label: "Users", value: distinct(inView, (r) => r.userId) },
        { label: "Roles", value: distinct(inView, (r) => r.roleId) },
      ]}
      exportName="user-role-detail-report"
    />
  );
}

// ── Permission detail ──

const permissionColumns: ViewColumn<PermissionRow>[] = [
  seqColumn<PermissionRow>(),
  idColumn("permissionId", "Permission ID", W.md, (r) => r.permissionId),
  textColumn("name", "Permission name", W.lg, (r) => r.name, { strong: true }),
  textColumn("description", "Permission description", W.xl, (r) => r.description, { clamp: true }),
  textColumn("type", "Permission type", W.lg, (r) => r.type),
  textColumn("status", "Status", W.sm, (r) => r.status),
  dayColumn<PermissionRow>("start", "Valid from", W.md, (r) => r.start),
  dayColumn<PermissionRow>("end", "Valid until", W.md, (r) => r.end),
  ...stampColumns<PermissionRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
];

export function PermissionDetailReport() {
  const permissions = usePermissions();
  const rows = useMemo(() => permissionRowsFor(permissions), [permissions]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("type", "Permission type", rows, (r) => r.type),
      ...optionsAttribute("status", "Status", rows, (r) => r.status),
      periodAttribute<PermissionRow>("valid", "Valid period", (r) => r.start, (r) => r.end),
      dayAttribute<PermissionRow>("created", "Creation date", (r) => r.created),
      dayAttribute<PermissionRow>("modified", "Modified on", (r) => r.updated),
    ],
    [rows],
  );
  return (
    <DataReport
      title="Permission Detail Report"
      subtitle="Every permission: what it allows, its type, its status and when it is valid."
      icon={Key01}
      rows={rows}
      rowId={(r) => r.id}
      columns={permissionColumns}
      attributes={attributes}
      searchText={(r) => [r.permissionId, r.name, r.description, r.type]}
      searchLabel="Search the report"
      searchPlaceholder="Search by permission ID or name"
      tableLabel="Permissions, one row each"
      noun="permissions"
      emptyDescription="Permissions appear here once they are added in User Management."
      initialSort={{ column: "seq", direction: "ascending" }}
      latest={(r) => r.updated}
      facts={(inView) => [
        { label: "Active", value: count(inView, "Active") },
        { label: "Types", value: distinct(inView, (r) => r.type) },
      ]}
      exportName="permission-detail-report"
    />
  );
}

// ── Role - permission detail ──

const rolePermissionColumns: ViewColumn<RolePermissionRow>[] = [
  seqColumn<RolePermissionRow>(),
  idColumn("roleId", "Role ID", W.sm, (r) => r.roleId),
  textColumn("roleName", "Role name", W.lg, (r) => r.roleName, { strong: true }),
  textColumn("department", "Department", W.xl, (r) => r.department),
  textColumn("roleType", "Role type", W.lg, (r) => r.roleType),
  textColumn("roleStatus", "Role status", W.md, (r) => r.roleStatus),
  idColumn("permissionId", "Permission ID", W.md, (r) => r.permissionId),
  textColumn("permissionName", "Permission name", W.lg, (r) => r.permissionName),
  textColumn("assignmentStatus", "Role - permission assignment status", W.xl, (r) => r.assignmentStatus),
  dayColumn<RolePermissionRow>("start", "Valid from", W.md, (r) => r.start),
  dayColumn<RolePermissionRow>("end", "Valid until", W.md, (r) => r.end),
  ...stampColumns<RolePermissionRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
];

export function RolePermissionDetailReport() {
  const roles = useRoles();
  const permissions = usePermissions();
  const rows = useMemo(() => rolePermissionRowsFor(roles, permissions), [roles, permissions]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("department", "Department", rows, (r) => r.department, { searchable: true }),
      ...optionsAttribute("roleType", "Role type", rows, (r) => r.roleType),
      ...optionsAttribute("roleStatus", "Role status", rows, (r) => r.roleStatus),
      ...optionsAttribute("assignmentStatus", "Assignment status", rows, (r) => r.assignmentStatus),
      periodAttribute<RolePermissionRow>("valid", "Valid period", (r) => r.start, (r) => r.end),
      dayAttribute<RolePermissionRow>("created", "Creation date", (r) => r.created),
    ],
    [rows],
  );
  return (
    <DataReport
      title="Role - Permission Detail Report"
      subtitle="The permissions each role holds, one row for each role and permission, beside the status of the role."
      icon={Key02}
      rows={rows}
      rowId={(r) => r.id}
      columns={rolePermissionColumns}
      attributes={attributes}
      searchText={(r) => [r.roleId, r.roleName, r.department, r.permissionId, r.permissionName]}
      searchLabel="Search the report"
      searchPlaceholder="Search by role or permission, ID or name"
      tableLabel="Permissions held by roles, one row each"
      noun="role permissions"
      emptyDescription="A row appears here for each permission a role is given in User Management."
      initialSort={{ column: "seq", direction: "ascending" }}
      facts={(inView) => [
        { label: "Roles", value: distinct(inView, (r) => r.roleId) },
        { label: "Permissions", value: distinct(inView, (r) => r.permissionId) },
      ]}
      exportName="role-permission-detail-report"
    />
  );
}

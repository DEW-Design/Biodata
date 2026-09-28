"use client";

import { useState, type ReactNode } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Plus, SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { ListFilterButton, matchesFilters, monthOptions, optionsFromValues, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import {
  accessStatusMeta,
  accessStatusOrder,
  formatShortDate,
  fullName,
  initials,
  organisationLabel,
  userStatusMeta,
  userStatusOrder,
  userType,
  userTypeOrder,
  type UmPermission,
  type UmRole,
  type UmUser,
} from "@/app/pages/_shared/user-management/um-data";
import { usePermissions, useRoles, useUsers } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";

// The three User Management lists - Users, Roles, Permissions. Each is the collection pattern
// (CONTRACTS.md 4.2): section header with a count and the add action, a search and the Filter
// button, a sortable table that fits the viewport, numbered pagination, rows that link to their own
// deep dive. The wireframe's lifecycle tabs (Active / Inactive / Invited / Archived; Active /
// Scheduled / Archived) are a Status filter and a Status column here, the same move DLA and DSA made:
// status is a filter, not a place. Its key and people count chips on a role are columns.

const NotApplicable = () => <span className="text-quaternary">Not applicable</span>;

function usePaging<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  return {
    paged: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    reset: () => setPage(1),
    footer: (
      <TableCard.PaginationNumbered
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        totalCount={rows.length}
      />
    ),
  };
}

function ListFrame({
  title,
  count,
  subheading,
  action,
  search,
  onSearch,
  searchPlaceholder,
  filter,
  empty,
  children,
}: {
  title: string;
  count: number;
  subheading: string;
  action: ReactNode;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  filter: ReactNode;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{title}</SectionHeader.Heading>
              <CountBadge count={count} color="brand" />
            </div>
            <SectionHeader.Subheading>{subheading}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>{action}</SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm shrink-0">
            <Input aria-label={`Search ${title.toLowerCase()}`} size="sm" icon={SearchMd} placeholder={searchPlaceholder} value={search} onChange={onSearch} onClear={() => onSearch("")} clearLabel="Clear search" />
          </div>
          <div>{filter}</div>
        </div>
        {empty ? <p className="py-6 text-sm text-tertiary">Nothing matches your search and filters.</p> : children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- users

const userSortKeys: Record<string, (u: UmUser) => SortValue> = {
  name: (u) => fullName(u),
  position: (u) => u.position,
  organisation: (u) => organisationLabel(u),
  type: (u) => userTypeOrder.indexOf(userType(u)),
  status: (u) => userStatusOrder.indexOf(u.status),
  updated: (u) => u.updatedAt,
};

export function UsersList() {
  const users = useUsers();
  const roles = useRoles();
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const systemRoles = roles.filter((r) => r.kind === "system");

  const getters: FilterGetters<UmUser> = {
    status: (u) => u.status,
    type: (u) => userType(u),
    organisation: (u) => organisationLabel(u),
    systemRole: (u) => u.roleIds.filter((id) => systemRoles.some((r) => r.id === id)),
    updated: (u) => u.updatedAt.slice(0, 7),
  };
  const sections: FilterSection[] = [
    { id: "status", label: "Status", options: userStatusOrder.map((id) => ({ id, label: userStatusMeta[id].label })) },
    { id: "type", label: "User type", options: userTypeOrder.map((id) => ({ id, label: id })) },
    { id: "organisation", label: "Organisation", searchable: true, options: optionsFromValues(users.map(organisationLabel)) },
    { id: "systemRole", label: "System role", options: systemRoles.map((r) => ({ id: r.id, label: r.name })) },
    { id: "updated", label: "Updated", options: monthOptions(users.map((u) => u.updatedAt)) },
  ];

  const query = search.trim().toLowerCase();
  const rows = sortRows(
    users
      .filter((u) => matchesFilters(u, filters, getters))
      .filter((u) => !query || [fullName(u), u.username, u.email, u.position, organisationLabel(u)].some((v) => v.toLowerCase().includes(query))),
    sort,
    userSortKeys,
  );
  const { paged, reset, footer } = usePaging(rows);

  return (
    <ListFrame
      title="Users"
      count={rows.length}
      subheading="Everyone with a BioData SA account, across every organisation and status."
      action={
        <Button color="primary" iconLeading={Plus} href={roleHref("/pages/user-management/users/new")}>
          Add user
        </Button>
      }
      search={search}
      onSearch={(v) => {
        setSearch(v);
        reset();
      }}
      searchPlaceholder="Search name, username, email or organisation"
      filter={
        <ListFilterButton
          sections={sections}
          selection={filters}
          onChange={(next) => {
            setFilters(next);
            reset();
          }}
        />
      }
      empty={rows.length === 0}
    >
      <TableCard.Root className="flex min-h-48 flex-1 flex-col">
        <Table bodyScrollable aria-label="Users" sortDescriptor={sort} onSortChange={(next) => { setSort(next); reset(); }}>
          <Table.Header sticky>
            <Table.Head id="name" label="User" isRowHeader allowsSorting />
            <Table.Head id="position" label="Position" allowsSorting />
            <Table.Head id="organisation" label="Organisation" allowsSorting />
            <Table.Head id="type" label="User type" allowsSorting />
            <Table.Head id="status" label="Status" allowsSorting />
            <Table.Head id="updated" label="Updated" allowsSorting />
          </Table.Header>
          <Table.Body items={paged}>
            {(u) => (
              <Table.Row id={u.id} href={roleHref(`/pages/user-management/users/${u.id}`)} textValue={fullName(u)} className="group data-[href]:cursor-pointer">
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" initials={initials(u)} />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{fullName(u)}</span>
                      <span className="truncate text-sm text-tertiary">{u.email}</span>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-secondary">{u.position}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-secondary">{organisationLabel(u)}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary">{userType(u)}</span>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="sm" color={userStatusMeta[u.status].badgeColor}>
                    {userStatusMeta[u.status].label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(u.updatedAt)}</span>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
        {footer}
      </TableCard.Root>
    </ListFrame>
  );
}

// ---------------------------------------------------------------- roles

export function RolesList() {
  const roles = useRoles();
  const users = useUsers();
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [sort, setSort] = useState<SortDescriptor>({ column: "kind", direction: "ascending" });
  const userCount = (r: UmRole) => users.filter((u) => u.roleIds.includes(r.id)).length;

  const sortKeys: Record<string, (r: UmRole) => SortValue> = {
    name: (r) => r.name,
    // System roles first, then custom roles by organisation.
    kind: (r) => (r.kind === "system" ? `0 ${r.id}` : `1 ${r.department} ${r.roleType} ${r.name}`),
    department: (r) => r.department ?? null,
    roleType: (r) => r.roleType,
    permissions: (r) => r.permissionIds.length,
    users: (r) => userCount(r),
    status: (r) => accessStatusOrder.indexOf(r.status),
  };
  const getters: FilterGetters<UmRole> = {
    kind: (r) => r.kind,
    department: (r) => r.department ?? "",
    status: (r) => r.status,
  };
  const sections: FilterSection[] = [
    { id: "kind", label: "Type", options: [{ id: "system", label: "System role" }, { id: "custom", label: "Custom role" }] },
    { id: "department", label: "Department", searchable: true, options: optionsFromValues(roles.flatMap((r) => (r.department ? [r.department] : []))) },
    { id: "status", label: "Status", options: accessStatusOrder.map((id) => ({ id, label: accessStatusMeta[id].label })) },
  ];

  const query = search.trim().toLowerCase();
  const rows = sortRows(
    roles
      .filter((r) => matchesFilters(r, filters, getters))
      .filter((r) => !query || [r.name, r.code, r.department ?? "", r.roleType].some((v) => v.toLowerCase().includes(query))),
    sort,
    sortKeys,
  );
  const { paged, reset, footer } = usePaging(rows);

  return (
    <ListFrame
      title="Roles"
      count={rows.length}
      subheading="System roles apply across BioData SA; custom roles belong to one organisation."
      action={
        <Button color="primary" iconLeading={Plus} href={roleHref("/pages/user-management/roles/new")}>
          Add role
        </Button>
      }
      search={search}
      onSearch={(v) => {
        setSearch(v);
        reset();
      }}
      searchPlaceholder="Search role, code or department"
      filter={
        <ListFilterButton
          sections={sections}
          selection={filters}
          onChange={(next) => {
            setFilters(next);
            reset();
          }}
        />
      }
      empty={rows.length === 0}
    >
      <TableCard.Root className="flex min-h-48 flex-1 flex-col">
        <Table bodyScrollable aria-label="Roles" sortDescriptor={sort} onSortChange={(next) => { setSort(next); reset(); }}>
          <Table.Header sticky>
            <Table.Head id="name" label="Role" isRowHeader allowsSorting />
            <Table.Head id="kind" label="Type" allowsSorting />
            <Table.Head id="department" label="Department" allowsSorting />
            <Table.Head id="roleType" label="Role type" allowsSorting />
            <Table.Head id="permissions" label="Permissions" allowsSorting />
            <Table.Head id="users" label="Users" allowsSorting />
            <Table.Head id="status" label="Status" allowsSorting />
          </Table.Header>
          <Table.Body items={paged}>
            {(r) => (
              <Table.Row id={r.id} href={roleHref(`/pages/user-management/roles/${r.id}`)} textValue={r.name} className="group data-[href]:cursor-pointer">
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{r.name}</span>
                    <span className="text-sm text-tertiary">{r.code}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-secondary">{r.kind === "system" ? "System" : "Custom"}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-secondary">{r.department ?? <NotApplicable />}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary">{r.roleType}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary tabular-nums">{r.permissionIds.length}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary tabular-nums">{userCount(r)}</span>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="sm" color={accessStatusMeta[r.status].badgeColor}>
                    {accessStatusMeta[r.status].label}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
        {footer}
      </TableCard.Root>
    </ListFrame>
  );
}

// ---------------------------------------------------------------- permissions

export function PermissionsList() {
  const permissions = usePermissions();
  const roles = useRoles();
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [sort, setSort] = useState<SortDescriptor>({ column: "category", direction: "ascending" });
  const roleCount = (p: UmPermission) => roles.filter((r) => r.permissionIds.includes(p.id)).length;

  const sortKeys: Record<string, (p: UmPermission) => SortValue> = {
    name: (p) => p.name,
    code: (p) => p.code,
    category: (p) => `${p.category} ${p.id}`,
    roles: (p) => roleCount(p),
    status: (p) => accessStatusOrder.indexOf(p.status),
    updated: (p) => p.updatedAt,
  };
  const getters: FilterGetters<UmPermission> = {
    category: (p) => p.category,
    status: (p) => p.status,
  };
  const sections: FilterSection[] = [
    { id: "category", label: "Category", searchable: true, options: optionsFromValues(permissions.map((p) => p.category)) },
    { id: "status", label: "Status", options: accessStatusOrder.map((id) => ({ id, label: accessStatusMeta[id].label })) },
  ];

  const query = search.trim().toLowerCase();
  const rows = sortRows(
    permissions
      .filter((p) => matchesFilters(p, filters, getters))
      .filter((p) => !query || [p.name, p.code, p.category, p.description].some((v) => v.toLowerCase().includes(query))),
    sort,
    sortKeys,
  );
  const { paged, reset, footer } = usePaging(rows);

  return (
    <ListFrame
      title="Permissions"
      count={rows.length}
      subheading="What a role can do, grouped by category. Roles are given permissions; users are given roles."
      action={
        <Button color="primary" iconLeading={Plus} href={roleHref("/pages/user-management/permissions/new")}>
          Add permission
        </Button>
      }
      search={search}
      onSearch={(v) => {
        setSearch(v);
        reset();
      }}
      searchPlaceholder="Search permission, code or category"
      filter={
        <ListFilterButton
          sections={sections}
          selection={filters}
          onChange={(next) => {
            setFilters(next);
            reset();
          }}
        />
      }
      empty={rows.length === 0}
    >
      <TableCard.Root className="flex min-h-48 flex-1 flex-col">
        <Table bodyScrollable aria-label="Permissions" sortDescriptor={sort} onSortChange={(next) => { setSort(next); reset(); }}>
          <Table.Header sticky>
            <Table.Head id="name" label="Permission" isRowHeader allowsSorting />
            <Table.Head id="code" label="Code" allowsSorting />
            <Table.Head id="category" label="Category" allowsSorting />
            <Table.Head id="roles" label="Roles" allowsSorting />
            <Table.Head id="status" label="Status" allowsSorting />
            <Table.Head id="updated" label="Updated" allowsSorting />
          </Table.Header>
          <Table.Body items={paged}>
            {(p) => (
              <Table.Row id={p.id} href={roleHref(`/pages/user-management/permissions/${p.id}`)} textValue={p.name} className="group data-[href]:cursor-pointer">
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{p.name}</span>
                    <span className="text-sm text-tertiary">{p.description}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary">{p.code}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-secondary">{p.category}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-tertiary tabular-nums">{roleCount(p)}</span>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="sm" color={accessStatusMeta[p.status].badgeColor}>
                    {accessStatusMeta[p.status].label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(p.updatedAt)}</span>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
        {footer}
      </TableCard.Root>
    </ListFrame>
  );
}

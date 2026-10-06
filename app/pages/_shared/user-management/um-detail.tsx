"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Key } from "react-aria-components";
import { Archive, ArrowNarrowLeft, Check, FlipBackward, PauseCircle, Power01, SearchMd, XCircle, Key01, Users01, Grid01, UserCheck01, Edit05 } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Table, TableCard } from "@/components/application/table/table";
import { toast } from "@/components/application/toast/toast";
import { Accordion } from "@/components/base/accordion/accordion";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import { ContactCard } from "@/app/pages/_shared/contact-card";
import { Input } from "@/components/base/input/input";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import {
  accessStatusMeta,
  accessStatusOrder,
  formatShortDate,
  fullName,
  initials,
  organisationLabel,
  rolePath,
  userStatusMeta,
  userStatusOrder,
  userType,
  type AccessStatus,
  type UmPermission,
  type UmRole,
  type UmUser,
  type UserStatus,
} from "@/app/pages/_shared/user-management/um-data";
import { setPermissionStatus, setRoleStatus, setUserStatus, usePermissions, useRoles, useUsers } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";
import type { SortDescriptor } from "react-aria-components";

// The three User Management deep dives: a user, a role, a permission (the right-hand pane of the
// wireframe's two-pane screens, Figma YMproGZfrFB5jUqPHPxMhk node 1558:10575, given its own route per
// the list -> deep dive pattern). Each opens like the DSA/DLA deep dives: a toolbar (back, and every
// action the record can take now, never behind a scroll), then the gradient identity card with its
// short facts, then tabs. The wireframe's "View Logs" is left out: audit logging is not in scope.
// Status changes that can't be undone in one click (archive) are confirmed in a DestructiveModal.

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">{label}</p>
      <div className="text-sm text-white">{children}</div>
    </div>
  );
}

const NotProvided = () => <span className="font-normal text-quaternary">Not provided</span>;

/** A role's permissions, grouped by category the way the wireframe draws them, each group a compact accordion item with its count. */
export function PermissionGroups({
  permissions,
  emptyLabel,
  grantedBy,
}: {
  permissions: UmPermission[];
  emptyLabel: string;
  /** For a user with several roles: the names of the roles that grant each permission (by permission id), shown beside it. */
  grantedBy?: Map<string, string[]>;
}) {
  if (permissions.length === 0) return <p className="text-sm text-tertiary">{emptyLabel}</p>;
  const categories = [...new Set(permissions.map((p) => p.category))];
  return (
    <div className="rounded-lg border border-secondary px-4">
      <Accordion
        variant="compact"
        defaultOpenKeys={[categories[0]!]}
        items={categories.map((category) => {
          const inCategory = permissions.filter((p) => p.category === category);
          return {
            id: category,
            // The count is a badge beside the group's name, as it is beside every other heading (not "(2)" in the text).
            title: (
              <span className="flex items-center gap-2">
                {category}
                <CountBadge count={inCategory.length} color="gray" />
              </span>
            ),
            content: (
              <ul className="flex flex-col gap-4 pt-1 pb-3 pl-4">
                {inCategory.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-secondary">{p.name}</span>
                      <span className="text-sm text-tertiary">{p.description}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {grantedBy?.get(p.id)?.map((role) => (
                        <Badge key={role} size="sm" color="gray">
                          {role}
                        </Badge>
                      ))}
                      {p.status !== "active" && (
                        <Badge size="sm" color={accessStatusMeta[p.status].badgeColor}>
                          {accessStatusMeta[p.status].label}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ),
          };
        })}
      />
    </div>
  );
}

/** Section header + search + table at a small table's own scale (CONTEXT.md): a count by the label, a real search, numbered pagination. */
function EmbeddedTableFrame({ label, count, search, onSearch, placeholder, empty, children }: { label: string; count: number; search: string; onSearch: (v: string) => void; placeholder: string; empty: string | null; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
        <CountBadge count={count} color="gray" />
      </div>
      <div className="w-full max-w-xs">
        <Input aria-label={`Search ${label.toLowerCase()}`} size="sm" icon={SearchMd} placeholder={placeholder} value={search} onChange={onSearch} />
      </div>
      {empty ? <p className="py-4 text-sm text-tertiary">{empty}</p> : children}
    </div>
  );
}

function useEmbeddedPaging<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  return {
    paged: rows.slice((current - 1) * pageSize, current * pageSize),
    reset: () => setPage(1),
    footer: (
      <TableCard.PaginationNumbered
        page={current}
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

// ---------------------------------------------------------------- lifecycle actions

type AccessAction = { to: AccessStatus; label: string; icon: RecordAction["icon"]; confirm: "none" | "plain" | "destructive"; primary?: boolean };

/** What a role or permission can move to from where it is: Scheduled > Active <> Disabled > Archived, restorable to Disabled. */
function accessActions(status: AccessStatus): AccessAction[] {
  switch (status) {
    case "scheduled":
      return [
        { to: "active", label: "Activate now", icon: Power01, confirm: "plain", primary: true },
        { to: "archived", label: "Archive", icon: Archive, confirm: "destructive" },
      ];
    case "active":
      return [
        { to: "disabled", label: "Disable", icon: PauseCircle, confirm: "plain" },
        { to: "archived", label: "Archive", icon: Archive, confirm: "destructive" },
      ];
    case "disabled":
      return [
        { to: "active", label: "Enable", icon: Power01, confirm: "none", primary: true },
        { to: "archived", label: "Archive", icon: Archive, confirm: "destructive" },
      ];
    case "archived":
      return [{ to: "disabled", label: "Restore", icon: FlipBackward, confirm: "none" }];
  }
}

type UserAction = { to: UserStatus; label: string; icon: RecordAction["icon"]; confirm: "none" | "plain" | "destructive"; primary?: boolean };

/** Invited > Active <> Inactive > Archived. Archiving an invitation withdraws it; an archived user is restorable as Inactive. */
function userActions(status: UserStatus): UserAction[] {
  switch (status) {
    case "invited":
      return [{ to: "archived", label: "Withdraw invitation", icon: XCircle, confirm: "destructive" }];
    case "active":
      return [
        { to: "inactive", label: "Deactivate", icon: PauseCircle, confirm: "plain" },
        { to: "archived", label: "Archive", icon: Archive, confirm: "destructive" },
      ];
    case "inactive":
      return [
        { to: "active", label: "Reactivate", icon: Power01, confirm: "none", primary: true },
        { to: "archived", label: "Archive", icon: Archive, confirm: "destructive" },
      ];
    case "archived":
      return [{ to: "inactive", label: "Restore", icon: FlipBackward, confirm: "none" }];
  }
}

function ActionButtons<T extends { label: string; icon: RecordAction["icon"]; confirm: "none" | "plain" | "destructive"; primary?: boolean }>({ actions, onPick, edit }: { actions: T[]; onPick: (action: T) => void; edit?: RecordAction }) {
  const toAction = (a: T): RecordAction => ({ id: a.label, label: a.label, icon: a.icon, destructive: a.confirm === "destructive", onPress: () => onPick(a) });
  // The next step of the lifecycle (Reactivate, Restore) leads when there is one; otherwise it is Edit, the way DLA leads with Edit.
  const primary = actions.find((a) => a.primary);
  return (
    <RecordActionBar
      onDark
      primary={primary ? toAction(primary) : edit}
      secondary={[...(primary && edit ? [edit] : []), ...actions.filter((a) => a !== primary && a.confirm !== "destructive").map(toAction)]}
      menu={actions.filter((a) => a.confirm === "destructive").map(toAction)}
    />
  );
}

/** The confirmation for a status change: plain for a reversible one, destructive for archiving. */
function StatusConfirm({
  pending,
  subject,
  consequence,
  onClose,
  onConfirm,
}: {
  pending: { label: string; icon: RecordAction["icon"]; confirm: "none" | "plain" | "destructive" } | null;
  subject: string;
  consequence: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const open = !!pending && pending.confirm !== "none";
  const props = {
    isOpen: open,
    onOpenChange: (o: boolean) => !o && onClose(),
    title: pending ? `${pending.label} ${subject}?` : "",
    description: consequence,
    confirmLabel: pending?.label ?? "",
    confirmIcon: pending?.icon ?? Check,
    onConfirm,
  };
  return pending?.confirm === "destructive" ? <DestructiveModal {...props} /> : <ConfirmationModal {...props} />;
}

// ---------------------------------------------------------------- user

const USER_CONSEQUENCE: Record<UserStatus, string> = {
  invited: "",
  active: "They can sign in again with the roles they already hold.",
  inactive: "They can't sign in until they are reactivated. Their roles are kept.",
  archived: "They can't sign in and move out of day-to-day lists. You can restore them later as Inactive.",
};

export function UserDetail({ user }: { user: UmUser }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const allRoles = useRoles();
  const permissions = usePermissions();
  const [tab, setTab] = useState<Key>("overview");
  const [pending, setPending] = useState<UserAction | null>(null);
  const roles = allRoles.filter((r) => user.roleIds.includes(r.id));
  // Permissions roll up to the user: every permission any of their roles grants, once, and which role grants it.
  const grantedBy = new Map<string, string[]>();
  for (const r of roles) for (const id of r.permissionIds) grantedBy.set(id, [...(grantedBy.get(id) ?? []), r.name]);
  const effective = permissions.filter((p) => grantedBy.has(p.id));
  const meta = userStatusMeta[user.status];

  const apply = (action: UserAction) => {
    setUserStatus(user.id, action.to);
    toast.success(`${fullName(user)} is now ${userStatusMeta[action.to].label.toLowerCase()}`);
  };
  const pick = (action: UserAction) => (action.confirm === "none" ? apply(action) : setPending(action));
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref("/pages/user-management")}>Back to users</RecordBackLink>

      <RecordHero
        eyebrow="User"
        title={fullName(user)}
        actions={
          <ActionButtons
            actions={userActions(user.status)}
            onPick={pick}
            edit={{ id: "edit", label: "Edit user", icon: Edit05, onPress: () => router.push(roleHref(`/pages/user-management/users/${user.id}/edit`)) }}
          />
        }
      >
        <MetaField label="Position">{user.position}</MetaField>
        <MetaField label="Organisation">{organisationLabel(user)}</MetaField>
        <MetaField label="User type">{userType(user)}</MetaField>
        <MetaField label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </MetaField>
      </RecordHero>

      {user.status === "invited" && (
        <div className="shrink-0 px-6 pt-4">
          <AlertFullWidth
            color="brand"
            title="Invitation pending"
            description={`${user.firstName} becomes Active once they accept the invitation. No email is sent in this preview.`}
            confirmLabel="Noted"
            contained
          />
        </div>
      )}

      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <div className="px-6 pt-4">
          <TabList aria-label="User sections" type="underline" size="md">
            <Tab id="overview" label="Overview" icon={Grid01} />
            <Tab id="roles" label="Roles" icon={UserCheck01} badge={roles.length} />
            <Tab id="permissions" label="Permissions" icon={Key01} badge={effective.length} />
          </TabList>
        </div>

        <TabPanel id="overview" className="flex flex-col gap-4 p-6">
          <p className="text-xs text-tertiary">Last updated {formatShortDate(user.updatedAt)}</p>
          {/* The same row as the DSA's and the project page's Overview: the record's fields in one bordered card, a rail of who to contact
              beside it. Position, organisation, type and status are in the card above, so they are not repeated. */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-secondary">
              <RecordRow label="User ID">{user.id}</RecordRow>
              <RecordRow label="Username">{user.username}</RecordRow>
              <RecordRow label="Display name / alias">{user.displayName || <NotProvided />}</RecordRow>
              <RecordRow label="Access from">{formatShortDate(user.startDate)}</RecordRow>
              <RecordRow label="Access until">{user.endDate ? formatShortDate(user.endDate) : "No end date"}</RecordRow>
            </div>
            <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
              <ContactCard title="Contact" name={fullName(user)} email={user.email} phone={user.phone} />
            </div>
          </div>
        </TabPanel>

        {/* The roles the person holds: each is a card that opens the role. The tab already counts them. */}
        <TabPanel id="roles" className="p-6">
          {roles.length === 0 ? (
            <p className="text-sm text-tertiary">No roles are assigned to {user.firstName} yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roles.map((r) => (
                <Link
                  key={r.id}
                  href={roleHref(`/pages/user-management/roles/${r.id}`)}
                  className="group flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-4 outline-focus-ring transition duration-100 ease-linear hover:border-primary hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold text-primary group-hover:text-brand-700 group-hover:underline">{r.name}</span>
                      {r.kind === "custom" && <span className="text-xs text-tertiary">{rolePath(r)}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {r.status !== "active" && (
                        <Badge size="sm" color={accessStatusMeta[r.status].badgeColor}>
                          {accessStatusMeta[r.status].label}
                        </Badge>
                      )}
                      <Badge size="sm" color="gray">
                        {r.kind === "system" ? "System" : "Custom"}
                      </Badge>
                    </span>
                  </span>
                  <span className="line-clamp-2 text-sm text-tertiary">{r.description}</span>
                  {/* With one role this is the Permissions tab's own count, so it is shown only when roles are being told apart. */}
                  {roles.length > 1 && (
                    <span className="text-sm text-tertiary tabular-nums">
                      {r.permissionIds.length} permission{r.permissionIds.length === 1 ? "" : "s"}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </TabPanel>

        {/* What the roles add up to for this person: each permission once, and with several roles, which one grants it. */}
        <TabPanel id="permissions" className="p-6">
          <PermissionGroups permissions={effective} emptyLabel="Their roles grant no permissions yet." grantedBy={roles.length > 1 ? grantedBy : undefined} />
        </TabPanel>
      </Tabs>

      <StatusConfirm
        pending={pending}
        subject={fullName(user)}
        consequence={pending ? (user.status === "invited" ? "The invitation is withdrawn and the account is archived." : USER_CONSEQUENCE[pending.to]) : ""}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) apply(pending);
          setPending(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- role

const ACCESS_CONSEQUENCE = (kind: "role" | "permission", to: AccessStatus) =>
  ({
    active: `The ${kind} applies from today.`,
    disabled: kind === "role" ? "Users keep the role, but it grants nothing until it is enabled again." : "Roles keep the permission, but it grants nothing until it is enabled again.",
    archived: kind === "role" ? "The role grants nothing and leaves day-to-day lists. You can restore it later as Disabled." : "The permission grants nothing and leaves day-to-day lists. You can restore it later as Disabled.",
    scheduled: "",
  })[to];

const userSortKeys: Record<string, (u: UmUser) => SortValue> = {
  name: (u) => fullName(u),
  organisation: (u) => organisationLabel(u),
  status: (u) => userStatusOrder.indexOf(u.status),
};

export function RoleDetail({ role }: { role: UmRole }) {
  const roleHref = useRoleHref();
  const permissions = usePermissions();
  const users = useUsers().filter((u) => u.roleIds.includes(role.id));
  const [tab, setTab] = useState<Key>("permissions");
  const [pending, setPending] = useState<AccessAction | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const granted = permissions.filter((p) => role.permissionIds.includes(p.id));
  const meta = accessStatusMeta[role.status];

  const query = search.trim().toLowerCase();
  const rows = sortRows(
    users.filter((u) => !query || [fullName(u), u.position, organisationLabel(u)].some((v) => v.toLowerCase().includes(query))),
    sort,
    userSortKeys,
  );
  const { paged, reset, footer } = useEmbeddedPaging(rows);

  const apply = (action: AccessAction) => {
    setRoleStatus(role.id, action.to);
    toast.success(`${role.name} is now ${accessStatusMeta[action.to].label.toLowerCase()}`);
  };
  const pick = (action: AccessAction) => (action.confirm === "none" ? apply(action) : setPending(action));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref("/pages/user-management/roles")}>Back to roles</RecordBackLink>

      <RecordHero eyebrow={role.kind === "system" ? "System role" : "Custom role"} title={role.name} description={role.description} actions={<ActionButtons actions={accessActions(role.status)} onPick={pick} />}>
        <MetaField label="Role ID">{role.id}</MetaField>
        <MetaField label="Role code">{role.code}</MetaField>
        {role.kind === "custom" && <MetaField label="Department">{role.department}</MetaField>}
        <MetaField label="Role type">{role.roleType}</MetaField>
        <MetaField label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </MetaField>
      </RecordHero>

      {role.status === "scheduled" && (
        <div className="shrink-0 px-6 pt-4">
          <AlertFullWidth
            color="brand"
            title="Scheduled"
            description={`This role becomes active on ${formatShortDate(role.startDate)}.`}
            confirmLabel="Noted"
            contained
          />
        </div>
      )}

      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <div className="px-6 pt-4">
          <TabList aria-label="Role sections" type="underline" size="md">
            <Tab id="permissions" label="Permissions" icon={Key01} badge={granted.length} />
            <Tab id="users" label="Users" icon={Users01} badge={users.length} />
          </TabList>
        </div>

        <TabPanel id="permissions" className="p-6">
          <PermissionGroups permissions={granted} emptyLabel="This role has no permissions yet." />
        </TabPanel>

        <TabPanel id="users" className="p-6">
          <EmbeddedTableFrame
            label="Users with this role"
            count={users.length}
            search={search}
            onSearch={(v) => {
              setSearch(v);
              reset();
            }}
            placeholder="Search name, position or organisation"
            empty={users.length === 0 ? "No users hold this role." : rows.length === 0 ? "No users match your search." : null}
          >
            <TableCard.Root size="sm">
              <Table aria-label="Users with this role" sortDescriptor={sort} onSortChange={(next) => { setSort(next); reset(); }}>
                <Table.Header>
                  <Table.Head id="name" label="User" isRowHeader allowsSorting />
                  <Table.Head id="organisation" label="Organisation" allowsSorting />
                  <Table.Head id="status" label="Status" allowsSorting />
                </Table.Header>
                <Table.Body items={paged}>
                  {(u) => (
                    <Table.Row id={u.id} href={roleHref(`/pages/user-management/users/${u.id}`)} textValue={fullName(u)} className="group data-[href]:cursor-pointer">
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" initials={initials(u)} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{fullName(u)}</span>
                            <span className="text-sm text-tertiary">{u.position}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-secondary">{organisationLabel(u)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge size="sm" color={userStatusMeta[u.status].badgeColor}>
                          {userStatusMeta[u.status].label}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
              {footer}
            </TableCard.Root>
          </EmbeddedTableFrame>
        </TabPanel>
      </Tabs>

      <StatusConfirm
        pending={pending}
        subject={role.name}
        consequence={pending ? ACCESS_CONSEQUENCE("role", pending.to) : ""}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) apply(pending);
          setPending(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- permission

const roleSortKeys: Record<string, (r: UmRole) => SortValue> = {
  name: (r) => r.name,
  kind: (r) => r.kind,
  department: (r) => r.department ?? null,
  status: (r) => accessStatusOrder.indexOf(r.status),
};

export function PermissionDetail({ permission }: { permission: UmPermission }) {
  const roleHref = useRoleHref();
  const roles = useRoles().filter((r) => r.permissionIds.includes(permission.id));
  const [pending, setPending] = useState<AccessAction | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const meta = accessStatusMeta[permission.status];

  const query = search.trim().toLowerCase();
  const rows = sortRows(
    roles.filter((r) => !query || [r.name, r.code, r.department ?? ""].some((v) => v.toLowerCase().includes(query))),
    sort,
    roleSortKeys,
  );
  const { paged, reset, footer } = useEmbeddedPaging(rows);

  const apply = (action: AccessAction) => {
    setPermissionStatus(permission.id, action.to);
    toast.success(`${permission.name} is now ${accessStatusMeta[action.to].label.toLowerCase()}`);
  };
  const pick = (action: AccessAction) => (action.confirm === "none" ? apply(action) : setPending(action));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <RecordBackLink href={roleHref("/pages/user-management/permissions")}>Back to permissions</RecordBackLink>

      <RecordHero eyebrow={permission.category} title={permission.name} description={permission.description} actions={<ActionButtons actions={accessActions(permission.status).filter((a) => !(permission.status === "scheduled" && a.to === "active"))} onPick={pick} />}>
        <MetaField label="Permission ID">{permission.id}</MetaField>
        <MetaField label="Permission code">{permission.code}</MetaField>
        <MetaField label="Category">{permission.category}</MetaField>
        <MetaField label={permission.status === "scheduled" ? "Starts" : "Active from"}>{formatShortDate(permission.startDate)}</MetaField>
        <MetaField label="Status">
          <Badge size="sm" color={meta.badgeColor}>
            {meta.label}
          </Badge>
        </MetaField>
      </RecordHero>

      {/* The wireframe's "This permission is ready for activation" banner, with its Activate action. */}
      {permission.status === "scheduled" && (
        <div className="shrink-0 px-6 pt-4">
          <AlertFullWidth
            color="brand"
            title="This permission is ready for activation"
            description={`It becomes active on its own on ${formatShortDate(permission.startDate)}, or you can activate it now.`}
            confirmLabel="Activate permission"
            onConfirm={() => setPending({ to: "active", label: "Activate", icon: Power01, confirm: "plain" })}
            contained
          />
        </div>
      )}

      <div className="p-6">
        <EmbeddedTableFrame
          label="Roles with access"
          count={roles.length}
          search={search}
          onSearch={(v) => {
            setSearch(v);
            reset();
          }}
          placeholder="Search role, code or department"
          empty={roles.length === 0 ? "No role holds this permission yet." : rows.length === 0 ? "No roles match your search." : null}
        >
          <TableCard.Root size="sm">
            <Table aria-label="Roles with access" sortDescriptor={sort} onSortChange={(next) => { setSort(next); reset(); }}>
              <Table.Header>
                <Table.Head id="name" label="Role" isRowHeader allowsSorting />
                <Table.Head id="kind" label="Type" allowsSorting />
                <Table.Head id="department" label="Department" allowsSorting />
                <Table.Head id="status" label="Status" allowsSorting />
              </Table.Header>
              <Table.Body items={paged}>
                {(r) => (
                  <Table.Row id={r.id} href={roleHref(`/pages/user-management/roles/${r.id}`)} textValue={r.name} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{r.name}</span>
                        <span className="text-sm text-tertiary">{r.id}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{r.kind === "system" ? "System" : "Custom"}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{r.department ?? <span className="text-quaternary">Not applicable</span>}</span>
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
        </EmbeddedTableFrame>
      </div>

      <StatusConfirm
        pending={pending}
        subject={permission.name}
        consequence={pending ? ACCESS_CONSEQUENCE("permission", pending.to) : ""}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) apply(pending);
          setPending(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- not found

export function UmNotFound({ kind, id, backHref }: { kind: "user" | "role" | "permission"; id: string; backHref: string }) {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-semibold text-primary">{kind[0]!.toUpperCase() + kind.slice(1)} not found</h1>
      <p className="max-w-sm text-sm text-balance text-tertiary">There is no {kind} {id}. Records you add are kept in this browser only.</p>
      <Button color="link-color" size="sm" href={roleHref(backHref)} iconLeading={ArrowNarrowLeft}>
        Back to {kind}s
      </Button>
    </div>
  );
}

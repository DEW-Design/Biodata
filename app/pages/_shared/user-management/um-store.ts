"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import {
  allSeedRoles,
  codeFor,
  nextPermissionId,
  nextRoleId,
  nextUserId,
  resolveAccessStatus,
  seedPermissions,
  seedUsers,
  todayIso,
  type AccessStatus,
  type UmPermission,
  type UmRole,
  type UmUser,
  type UserStatus,
} from "@/app/pages/_shared/user-management/um-data";

// Users, roles and permissions for User Management, in one zustand store persisted to localStorage
// (the same plumbing as dsa-store.ts / dla-store.ts: SSR-safe storage, rehydrated after the first
// render so it matches the server's seed). Display-only: nothing here feeds the role-access matrix.
// Scheduled -> Active is applied when read, from today's date, so a record kept across days moves on.

interface UmState {
  users: UmUser[];
  roles: UmRole[];
  permissions: UmPermission[];
}

const useUmStore = create<UmState>()(
  persist(() => ({ users: seedUsers, roles: allSeedRoles, permissions: seedPermissions }), {
    name: "biodata-user-management",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** False until localStorage has been read: a deep dive waits for this before saying "not found". */
export function useUmHydrated(): boolean {
  useRehydrate(useUmStore);
  return useHydrated(useUmStore);
}

const get = () => useUmStore.getState();

export function useUsers(): UmUser[] {
  useRehydrate(useUmStore);
  return useUmStore((s) => s.users);
}

export function useUser(id: string | undefined): UmUser | undefined {
  const users = useUsers();
  return id ? users.find((u) => u.id === id) : undefined;
}

export function useRoles(): UmRole[] {
  useRehydrate(useUmStore);
  const roles = useUmStore((s) => s.roles);
  return useMemo(() => roles.map((r) => ({ ...r, status: resolveAccessStatus(r.status, r.startDate) })), [roles]);
}

export function useRole(id: string | undefined): UmRole | undefined {
  const roles = useRoles();
  return id ? roles.find((r) => r.id === id) : undefined;
}

export function usePermissions(): UmPermission[] {
  useRehydrate(useUmStore);
  const permissions = useUmStore((s) => s.permissions);
  return useMemo(() => permissions.map((p) => ({ ...p, status: resolveAccessStatus(p.status, p.startDate) })), [permissions]);
}

export function usePermission(id: string | undefined): UmPermission | undefined {
  const permissions = usePermissions();
  return id ? permissions.find((p) => p.id === id) : undefined;
}

// ---------------------------------------------------------------- users

export type UserDraft = Omit<UmUser, "id" | "username" | "status" | "updatedAt">;

/** A new user starts Invited, the first stage of the user lifecycle. No email is sent in this preview. */
export function addUser(draft: UserDraft): UmUser {
  const { users } = get();
  const base = `${draft.firstName[0] ?? ""}${draft.lastName}`.toLowerCase().replace(/[^a-z]/g, "") || "user";
  let username = base;
  for (let n = 2; users.some((u) => u.username === username); n++) username = `${base}${n}`;
  const record: UmUser = { ...draft, id: nextUserId(users), username, status: "invited", updatedAt: todayIso() };
  useUmStore.setState({ users: [...users, record] });
  return record;
}

export function setUserStatus(id: string, status: UserStatus) {
  const { users } = get();
  useUmStore.setState({ users: users.map((u) => (u.id === id ? { ...u, status, updatedAt: todayIso() } : u)) });
}

// ---------------------------------------------------------------- roles

export type RoleDraft = Omit<UmRole, "id" | "code" | "status" | "permissionIds" | "updatedAt">;

/** Starts Scheduled when the start date is ahead, otherwise Active. Permissions are assigned afterwards. */
export function addRole(draft: RoleDraft): UmRole {
  const { roles } = get();
  const code = codeFor(draft.name, new Set(roles.map((r) => r.code)));
  const record: UmRole = {
    ...draft,
    id: nextRoleId(roles),
    code,
    status: draft.startDate > todayIso() ? "scheduled" : "active",
    permissionIds: [],
    updatedAt: todayIso(),
  };
  useUmStore.setState({ roles: [...roles, record] });
  return record;
}

export function setRoleStatus(id: string, status: AccessStatus) {
  const { roles } = get();
  // Activating a scheduled role brings its start date forward to today, so the date and status agree.
  const today = todayIso();
  useUmStore.setState({
    roles: roles.map((r) => (r.id === id ? { ...r, status, startDate: status === "active" && r.startDate > today ? today : r.startDate, updatedAt: today } : r)),
  });
}

// ---------------------------------------------------------------- permissions

export type PermissionDraft = Omit<UmPermission, "id" | "code" | "status" | "updatedAt">;

/** One or more permissions added together (the wireframe's "+ Add" under one category). */
export function addPermissions(drafts: PermissionDraft[]): UmPermission[] {
  const { permissions } = get();
  const taken = new Set(permissions.map((p) => p.code));
  const today = todayIso();
  const created: UmPermission[] = [];
  for (const draft of drafts) {
    created.push({
      ...draft,
      id: nextPermissionId([...permissions, ...created]),
      code: codeFor(draft.name, taken),
      status: draft.startDate > today ? "scheduled" : "active",
      updatedAt: today,
    });
  }
  useUmStore.setState({ permissions: [...permissions, ...created] });
  return created;
}

export function setPermissionStatus(id: string, status: AccessStatus) {
  const { permissions } = get();
  const today = todayIso();
  useUmStore.setState({
    permissions: permissions.map((p) => (p.id === id ? { ...p, status, startDate: status === "active" && p.startDate > today ? today : p.startDate, updatedAt: today } : p)),
  });
}

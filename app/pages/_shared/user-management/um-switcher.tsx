"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher, type BreadcrumbSwitcherItem } from "@/app/pages/_shared/breadcrumb-switcher";
import type { UmArea } from "@/app/pages/_shared/user-management/um-shell";
import { fullName } from "@/app/pages/_shared/user-management/um-data";
import { usePermissions, useRoles, useUsers } from "@/app/pages/_shared/user-management/um-store";
import { useRoleHref } from "@/lib/use-role-href";

// The area crumb (Users, Roles or Permissions) of a User Management record page: a searchable switcher
// over that area's records, A-Z by name with the ID beside it, with the current one ticked and a
// "View all <area>" bar to that area's list. Picking a record opens it. The three lists show every
// record to the one role that can reach User Management (BioData Admin), so the switcher does too.
const copy: Record<UmArea, { label: string; ariaLabel: string; placeholder: string; viewAll: string }> = {
  users: { label: "Users", ariaLabel: "Switch user", placeholder: "Search users", viewAll: "View all users" },
  roles: { label: "Roles", ariaLabel: "Switch role", placeholder: "Search roles", viewAll: "View all roles" },
  permissions: { label: "Permissions", ariaLabel: "Switch permission", placeholder: "Search permissions", viewAll: "View all permissions" },
};

const byLabel = (a: BreadcrumbSwitcherItem, b: BreadcrumbSwitcherItem) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id);

export function UmSwitcher({ area, currentId, listHref }: { area: UmArea; currentId: string; /** The area's list route (`umAreaPath[area]` in um-shell.tsx). */ listHref: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const users = useUsers();
  const roles = useRoles();
  const permissions = usePermissions();

  const items = useMemo<BreadcrumbSwitcherItem[]>(() => {
    if (area === "users") return users.map((u) => ({ id: u.id, label: fullName(u), addon: u.id })).sort(byLabel);
    if (area === "roles") return roles.map((r) => ({ id: r.id, label: r.name, addon: r.id })).sort(byLabel);
    return permissions.map((p) => ({ id: p.id, label: p.name, addon: p.id })).sort(byLabel);
  }, [area, users, roles, permissions]);

  const text = copy[area];
  return (
    <BreadcrumbSwitcher
      label={text.label}
      ariaLabel={text.ariaLabel}
      placeholder={text.placeholder}
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(roleHref(`/pages/user-management/${area}/${id}`))}
      viewAllLabel={text.viewAll}
      onViewAll={() => router.push(roleHref(listHref))}
    />
  );
}

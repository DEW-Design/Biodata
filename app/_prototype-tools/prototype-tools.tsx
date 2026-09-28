"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Glasses01 } from "@untitledui/icons";
import { hasFeatureAccess, type FeatureKey } from "@/config/role-access.config";
import { useUserRole } from "@/lib/use-user-role";
import { USER_ROLES, type UserRole } from "@/lib/user-role";
import { StatusBar } from "./status-bar";
import { useRegisteredTools, type Tool, type ToolOption } from "./tools";

// The Prototype tools bar, mounted once by every /pages screen (it replaced the role switcher,
// layout options and ingestion outcome buttons on 29 Sept 2026). There is no real login in this
// build, so the role tool is how a persona is previewed: it rewrites `?userRole=`. It is always on
// the bar; other tools are added by the code that owns them (see tools.ts).

// Route prefixes whose *entire* page is gated behind one feature, not a control inside it. Previewing
// a role that can't see the page takes you Home rather than stranding you on the restriction
// message (which stays right for someone arriving by URL).
const wholePageGates: { prefix?: string; pattern?: RegExp; feature: FeatureKey }[] = [
  { prefix: "/pages/dsa", feature: "dsaManagement" },
  { prefix: "/pages/dla", feature: "dlaAccess" },
  { prefix: "/pages/user-management", feature: "userManagement" },
  { prefix: "/pages/nominations", feature: "nominationAccess" },
  { prefix: "/pages/template-finder", feature: "templateFinder" },
  { pattern: /^\/pages\/project-list\/[^/]+\/upload$/, feature: "datasetUpload" },
];

// Role names as User Management writes them (um-data.ts). A public user has no account, so the
// name says what you see: the signed-out site.
const ROLE_OPTIONS: Record<UserRole, Omit<ToolOption, "id">> = {
  "biodata-admin": { label: "BioData Admin" },
  "biodata-user": { label: "BioData User" },
  "privileged-admin": { label: "Privileged Admin" },
  "privileged-user": { label: "Privileged User" },
  "registered-user": { label: "Registered User" },
  "public-user": { label: "Public user", description: "Signed out" },
};

export function PrototypeTools() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRole = useUserRole();
  const registered = useRegisteredTools();

  const setRole = (role: UserRole) => {
    const isBlocked = wholePageGates.some(
      ({ prefix, pattern, feature }) =>
        (prefix ? pathname.startsWith(prefix) : pattern?.test(pathname)) && !hasFeatureAccess(feature, role),
    );
    const targetPath = isBlocked ? "/pages/dashboard" : pathname;
    // A redirect Home starts a clean query string rather than carrying params that mean nothing there.
    const params = new URLSearchParams(isBlocked ? undefined : searchParams.toString());
    params.set("userRole", role);
    router.push(`${targetPath}?${params.toString()}`);
  };

  const role: Tool = {
    id: "role",
    label: "View the app as",
    barLabel: "Viewing as",
    icon: Glasses01,
    options: USER_ROLES.map((r) => ({ id: r, ...ROLE_OPTIONS[r] })),
    value: activeRole,
    onChange: (id) => setRole(id as UserRole),
  };

  return <StatusBar tools={[...registered, role]} />;
}

"use client";

import { usePathname } from "next/navigation";
import { Glasses01 } from "@untitledui/icons";
import { useUserRole } from "@/lib/use-user-role";
import { USER_ROLES, type UserRole } from "@/lib/user-role";
import { isPageBlockedFor } from "./page-gates";
import { productionFor, productionTarget } from "./production-routes";
import { ROLE_OPTIONS, roleLabel } from "./role-options";
import { useSetRole } from "./role-switch";
import { useRecordPage } from "./pages-tool";
import { StatusBar } from "./status-bar";
import { useRegisteredTools, type Tool } from "./tools";

// The Prototype tools bar, mounted once by every /pages screen (it replaced the role switcher,
// layout options and ingestion outcome buttons on 29 Sept 2026). There is no real login in this
// build, so the role tool is how a persona is previewed: it rewrites `?userRole=`. It is always on
// the bar; other tools are added by the code that owns them (see tools.ts).

export function PrototypeTools() {
  const pathname = usePathname();
  const activeRole = useUserRole();
  const registered = useRegisteredTools();
  useRecordPage();

  const setRole = useSetRole();
  const role: Tool = {
    id: "role",
    label: "View the app as",
    barLabel: "Viewing as",
    icon: Glasses01,
    options: USER_ROLES.map((r) => ({ id: r, ...ROLE_OPTIONS[r] })),
    value: activeRole,
    onChange: (id) => setRole(id as UserRole),
  };

  // A lab shows a link to the live page it is about (production-routes.ts), opened as a role that has the feature and is the
  // lab's persona, and the bar says which when it is not the role being viewed ("as Registered User").
  const live = productionFor(pathname);
  const target = live ? productionTarget(live, activeRole, (path, r) => !isPageBlockedFor(path, r)) : undefined;
  const production = live && target ? { label: live.label, href: target.href, note: target.changed ? `as ${roleLabel(target.role)}` : undefined } : undefined;

  return <StatusBar tools={[...registered, role]} production={production} />;
}

// Kept here for the labs that already import them from this file.
export { isPageBlockedFor, roleLabel };

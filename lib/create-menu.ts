import { hasFeatureAccess, type FeatureKey } from "@/config/role-access.config";
import type { UserRole } from "@/lib/user-role";

// What the header's "Add" menu offers each persona. One list, filtered by the same role-access
// matrix everything else uses (`config/role-access.config.ts`), so adding a creatable thing for a
// persona is one entry here - never a per-screen edit. Order is the menu order.
//
// public-user is deliberately not filtered here: a guest sees the same "Add" button and gets the
// sign-up invite instead of a menu (see `CreateMenu`), so nothing they could create is hidden.

export type CreateItemId = "project" | "dataset" | "dla" | "nomination" | "dsa" | "user";

export interface CreateMenuItem {
  id: CreateItemId;
  label: string;
  /** Where picking it goes. The active `userRole` is carried forward by `useRoleHref`. Omit when the
   *  item needs a choice first: Dataset asks which project, which `CreateMenu` handles itself. */
  href?: string;
  /** Omit for an item every signed-in persona gets. */
  feature?: FeatureKey;
}

export const createMenuItems: CreateMenuItem[] = [
  { id: "project", label: "Project", href: "/pages/project-registration" },
  { id: "dataset", label: "Dataset", feature: "datasetUpload" },
  { id: "dla", label: "Data licence request (DLA)", href: "/pages/dla/new", feature: "dlaAccess" },
  { id: "nomination", label: "Sensitive species nomination", href: "/pages/nominations/new", feature: "nominationAccess" },
  { id: "dsa", label: "Data sharing agreement (DSA)", href: "/pages/dsa/new", feature: "dsaManagement" },
  { id: "user", label: "User", href: "/pages/user-management/users/new", feature: "userManagement" },
];

export function createMenuItemsForRole(role: UserRole): CreateMenuItem[] {
  return createMenuItems.filter((item) => !item.feature || hasFeatureAccess(item.feature, role));
}

"use client";

import { canOpenPath } from "@/lib/page-access";
import { useUserRole } from "@/lib/use-user-role";

/**
 * Whether the active role can open `path`. A link, a button or a menu item that moves a person to another screen is shown only where this is
 * true: a role is never taken to a screen that only tells it "this is not for you" (CONTRACTS 3.15). Same `<Suspense>` need as `useUserRole`.
 */
export function useCanOpen() {
  const role = useUserRole();
  return (path: string) => canOpenPath(path, role);
}

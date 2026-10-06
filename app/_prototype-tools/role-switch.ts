"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@/lib/user-role";
import { isPageBlockedFor } from "./page-gates";

/** Switch the viewed persona: rewrites `?userRole=` on the page you are on, or goes Home when that page is not open to the new role
 *  (rather than stranding you on its restriction message). The role tool and the Pages tool share it. */
export function useSetRole() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  return (role: UserRole) => {
    const isBlocked = isPageBlockedFor(pathname, role);
    const targetPath = isBlocked ? "/pages/dashboard" : pathname;
    // A redirect Home starts a clean query string rather than carrying params that mean nothing there.
    const params = new URLSearchParams(isBlocked ? undefined : searchParams.toString());
    params.set("userRole", role);
    router.push(`${targetPath}?${params.toString()}`);
  };
}

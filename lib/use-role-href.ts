"use client";

import { useUserRole } from "@/lib/use-user-role";

/**
 * Appends the active `userRole` to an internal `/pages/**` path, for every same-tab navigation
 * that isn't the current page's own URL (a `Link`/`Row` `href`, a `router.push` target). Every one
 * of these was a plain relative path (e.g. `/pages/project-list/option-1`) with no query string -
 * since there's no real auth/session in this build, the URL is the *only* place the active role
 * lives (see `lib/use-user-role.ts`), so a bare path silently drops it and the destination page
 * falls back to `DEFAULT_USER_ROLE`. Reported directly by the user as a dead end: switching from
 * Home to Projects as `public-user` landed back on `registered-user`'s view. Same
 * `<Suspense>` requirement as `useUserRole` itself.
 */
export function useRoleHref() {
  const role = useUserRole();
  return (path: string) => `${path}?userRole=${role}`;
}

"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { BASE_PATH } from "@/lib/base-path";

// Connects react-aria links (DEW Button with `href`, Table rows with `href`, Link, ...) to the Next
// router: clicks become client-side navigations instead of full page loads, and rendered hrefs get
// the base path, which the GitHub Pages build needs. Paths passed in stay root-relative
// ("/pages/dashboard"); router.push adds the base path itself.
export function AppRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <RouterProvider
      navigate={(path) => router.push(path)}
      useHref={(href) => (href.startsWith("/") ? `${BASE_PATH}${href}` : href)}
    >
      {children}
    </RouterProvider>
  );
}

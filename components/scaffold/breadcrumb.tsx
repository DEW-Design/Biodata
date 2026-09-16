"use client";

/**
 * Live breadcrumb for the Registered User sidebar shell (option-1 pages) - reflects the real IA
 * (`lib/registered-user-nav.ts`) instead of the generic "Home / Project ▾ / ... / [Location]"
 * mockup text it replaced.
 *
 * Fixed shape, per direct feedback after the first (trail-of-NavNode) version got the depth
 * wrong - it descended to the specific leaf ("Manage Project and Datasets") instead of stopping
 * at the section:
 *   - Home page:          Home
 *   - A section's page:   Home / <section label>                      (e.g. "Home / Projects")
 *   - A page below that:  Home / <section, or a switcher for it> / <current>
 *                          (e.g. "Home / Projects⌄ / Adelaide Hills Bushland Survey")
 * `section` is the label only (never the leaf) - pass a switcher component instead of a string
 * when the section itself needs to be interactive (project-detail's ProjectSwitcher).
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronSelectorVertical } from "@untitledui/icons";
import { useRoleHref } from "@/lib/use-role-href";

const HOME_HREF = "/pages/dashboard";

export function Breadcrumb({
  section,
  current,
  orgLabel,
}: {
  /** The current top-level nav section - a plain label (e.g. "Projects"), or a custom
   * interactive element in its place (e.g. a project switcher). Omit for the Home page itself. */
  section?: ReactNode;
  /** A final, page-specific crumb after `section` - e.g. a project's name. Always plain, always current. */
  current?: string;
  /** The org pill's text, or omit to hide the pill entirely. "DEW" for the `biodata-*` roles (a
   * real, fixed org), "ORG" for `privileged-*` (no single real partner-org name to show yet) - see
   * `orgLabelForRole` in `lib/user-role.ts`. Was a plain `showOrgSwitcher` boolean rendering a
   * hardcoded "ORG" - flagged directly by the user to show the real org name where there is one. */
  orgLabel?: string;
}) {
  // A bare HOME_HREF drops the active role (there's no real auth/session in this build, so the
  // URL is the only place it lives - see lib/use-role-href.ts) - the same class of dead end fixed
  // everywhere else internal navigation happens, missed here the first time round since this
  // component isn't one of the 3 page shells. Flagged directly by the user: navigating between
  // pages left the wrong persona active - this crumb is on every non-Home page, so it's the most
  // likely place anyone actually clicked "Home" from.
  const roleHref = useRoleHref();
  const isHomeCurrent = !section && !current;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-tertiary" aria-label="Breadcrumb">
      {isHomeCurrent ? (
        <span className="text-primary">Home</span>
      ) : (
        <Link href={roleHref(HOME_HREF)} className="hover:text-primary">
          Home
        </Link>
      )}
      {orgLabel && (
        <span className="flex items-center gap-1 rounded-full border border-secondary px-1.5 py-0.5 text-[10px] font-medium">
          {orgLabel} <ChevronSelectorVertical className="size-3" />
        </span>
      )}
      {section && (
        <>
          <span>/</span>
          {typeof section === "string" ? <span className={current ? undefined : "text-primary"}>{section}</span> : section}
        </>
      )}
      {current && (
        <>
          <span>/</span>
          <span className="text-primary">{current}</span>
        </>
      )}
    </nav>
  );
}

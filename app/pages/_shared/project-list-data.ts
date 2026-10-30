import type { BadgeColor } from "@/components/base/badges/badges";
import type { UserRole } from "@/lib/user-role";

// Project list data, kept out of project-list-content.tsx (a "use client" file) so server code can
// import it too - the DLA route's generateStaticParams reads it through dla-data.ts.
//
// One array is now the single source for both the table and the header search
// (app/pages/_shared/global-search.tsx), instead of two hand-kept-in-sync lists.
export interface Project {
  id: string;
  /** Display-only BioData project number ("BD-5039"). `id` stays the internal slug. The map search
   *  Projects tab (map-search/search-data.ts) reads the same value, so both tables show one ID. */
  code: string;
  name: string;
  href?: string;
  org: string;
  status: string;
  statusColor: BadgeColor<"pill-color">;
  contributorInitials: string;
  contributorName: string;
  updated: string;
  description: string;
}

/** A project is published once it is Active or Completed. A Draft and a project Under review are not: a signed-out visitor never sees them (the designer, 30 Oct 2026: "published only"). The header search and
 *  Explore already used this rule for species (`global-search.tsx`, `observations-search.tsx`); this is the same rule for the project itself. */
export const PUBLISHED_PROJECT_STATUSES = ["Active", "Completed"];

/** Whether a role may see a project at all: everyone signed in may (their own Draft included); a public user only a published one. */
export function isProjectVisibleTo(project: { status: string }, role: UserRole): boolean {
  return role !== "public-user" || PUBLISHED_PROJECT_STATUSES.includes(project.status);
}

export const projects: Project[] = [
  {
    id: "adelaide-hills",
    code: "BD-5039",
    name: "Adelaide Hills Bushland Survey",
    href: "/pages/project-list/adelaide-hills/project-details",
    org: "Adelaide Hills Landcare",
    status: "Active",
    statusColor: "success",
    contributorInitials: "OW",
    contributorName: "Olivia Wyatt",
    updated: "2 days ago",
    description: "Ongoing flora and fauna monitoring across the Adelaide Hills reserve network.",
  },
  {
    id: "coorong",
    code: "BD-5102",
    href: "/pages/project-list/coorong/project-details",
    name: "Coorong Wetlands Bird Count",
    org: "Birds SA",
    status: "Under review",
    statusColor: "warning",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "5 days ago",
    description: "Seasonal waterbird survey data pending verification.",
  },
  {
    id: "flinders",
    code: "BD-5137",
    href: "/pages/project-list/flinders/project-details",
    name: "Flinders Ranges Reptile Atlas",
    org: "DEW Biodiversity Team",
    status: "Draft",
    statusColor: "gray",
    contributorInitials: "OW",
    contributorName: "Olivia Wyatt",
    updated: "1 week ago",
    description: "Draft submission, not yet published.",
  },
  {
    id: "kangaroo-island",
    code: "BD-4988",
    href: "/pages/project-list/kangaroo-island/project-details",
    name: "Kangaroo Island Recovery Monitoring",
    org: "Natural Resources KI",
    status: "Completed",
    // Brand teal, from the design system: Completed was Untitled UI's blue, which is not in the Figma set (the designer, 30 Oct 2026), and teal is the one colour left that is not Draft's grey, Under review's amber or Active's green.
    statusColor: "brand",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "3 weeks ago",
    description: "Post-bushfire recovery tracking, final report submitted.",
  },
];

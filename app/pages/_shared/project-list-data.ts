import type { BadgeColor } from "@/components/base/badges/badges";

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

export const projects: Project[] = [
  {
    id: "adelaide-hills",
    code: "BD-5039",
    name: "Adelaide Hills Bushland Survey",
    href: "/pages/project-detail",
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
    name: "Kangaroo Island Recovery Monitoring",
    org: "Natural Resources KI",
    status: "Completed",
    statusColor: "blue",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "3 weeks ago",
    description: "Post-bushfire recovery tracking, final report submitted.",
  },
];

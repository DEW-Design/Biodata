"use client";

import { useState } from "react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { useRoleHref } from "@/lib/use-role-href";

// The real Projects list content - shared by every option-1 sidebar shell (dashboard,
// project-list, project-detail) so clicking the Projects icon always shows this, the same
// "content is real, not a placeholder redirect" fix already applied to Home
// (see app/pages/_shared/home-dashboard.tsx). project-detail is the one exception: its
// "Projects" section shows one project's own detail (what the screen exists to do), not this list
// - that's a deliberate difference, not an oversight, since project-detail is reached by drilling
// into a specific project row, not by browsing the category.
//
// A real table, not a stack of cards - flagged directly by the user: with 1000+ projects expected,
// a vertically-stacked card list doesn't scale for scanning or comparing rows the way columns do.
//
// Rebuilt on `TableCard` (components/application/table/table.tsx) - the batteries-included data
// table (card chrome, header with a live row count, pagination) - not the bare `Table` primitive
// (components/base/table/table.tsx) this previously used, wrapped in a hand-rolled `SectionHeader`
// standing in for a table header. Flagged directly by the user: this table didn't follow the
// design system. `TableCard` is the pattern the docs site itself establishes for exactly this case
// (see app/(docs)/components/table/page.tsx's "Team members" example) - this brings the Projects
// table in line with it rather than leaving it on the older primitive.
//
// `TableRow`'s own className doesn't include `group`/`data-[href]:cursor-pointer` the way the
// older base `Row` did (checked the component directly, not assumed) - added on this table's own
// `Table.Row` usage below rather than patching the shared component, since no other TableCard
// consumer currently needs a clickable row and this fix is scoped to what's actually asked for.
//
// Only "Adelaide Hills Bushland Survey" has a real detail page, so it's the only row rendered as a
// real navigable link (react-aria's Row itself takes `href`, so the whole row - not just the name -
// is the click/keyboard target) - same "only wire what has a real page" convention used everywhere
// else in this build.
//
// One array is now the single source for both the table and the header search
// (app/pages/_shared/global-search.tsx), instead of two hand-kept-in-sync lists.
export interface Project {
  id: string;
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
    name: "Adelaide Hills Bushland Survey",
    href: "/pages/project-detail/option-1",
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

export function ProjectListContent() {
  const roleHref = useRoleHref();
  // Real, working pagination state - `pageCount` is 1 with this example's 4 rows, so Previous/Next
  // both render disabled rather than faked as active. TableCard.Pagination is the real missing
  // piece for the "1000+ projects expected" scale this table is built for, not decorative chrome.
  const [page, setPage] = useState(1);

  return (
    <>
      {/* The table used to carry its own TableCard.Header directly above this same heading -
          title "Projects" repeated, an oval gray row-count badge, and a description saying almost
          the same thing as this section's own subheading. Flagged directly by the user: the header
          doubled up, inconsistent with every other page that has exactly one section header. The
          count and description now live here instead, and nowhere else on this screen. */}
      <SectionHeader.Root className="p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Projects</SectionHeader.Heading>
              {/* CountBadge, not Badge - a true circle, not TableCard.Header's own oval
                  padding-tuned Badge. color="brand" per the user: counters should read in the
                  primary colour, not neutral gray - see components/base/badges/badges.tsx. */}
              <CountBadge count={projects.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Every project you&apos;re contributing to or watching.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {/* p-6, not px-6 pb-6 - the table sat flush against SectionHeader's own bottom
          border/padding with no breathing room above it. Flagged directly by the user off a
          screenshot: "see how close the table is to the section header?" */}
      <div className="p-6">
        <TableCard.Root>
          <Table aria-label="Projects">
            <Table.Header>
              <Table.Head id="project" isRowHeader>
                Project
              </Table.Head>
              <Table.Head id="org">Organisation</Table.Head>
              <Table.Head id="status">Status</Table.Head>
              <Table.Head id="contributor">Contributor</Table.Head>
              <Table.Head id="updated">Updated</Table.Head>
            </Table.Header>
            <Table.Body items={projects}>
              {(project) => (
                <Table.Row
                  id={project.id}
                  href={project.href ? roleHref(project.href) : undefined}
                  textValue={project.name}
                  className="group data-[href]:cursor-pointer"
                >
                  <Table.Cell>
                    <div className="flex flex-col gap-0.5">
                      <p className={`text-sm font-medium text-primary ${project.href ? "group-hover:text-brand-700 group-hover:underline" : ""}`}>
                        {project.name}
                      </p>
                      <p className="max-w-md truncate text-xs text-tertiary">{project.description}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary">{project.org}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" color={project.statusColor}>
                      {project.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar size="xs" initials={project.contributorInitials} alt={project.contributorName} />
                      <span className="text-sm text-secondary">{project.contributorName}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm whitespace-nowrap text-tertiary">{project.updated}</span>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <TableCard.Pagination page={page} pageCount={1} onPageChange={setPage} />
        </TableCard.Root>
      </div>
    </>
  );
}

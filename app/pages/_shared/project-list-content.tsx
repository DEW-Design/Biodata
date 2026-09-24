"use client";

import { useState } from "react";
import { SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { Table, TableCard } from "@/components/application/table/table";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { useRoleHref } from "@/lib/use-role-href";

// The real Projects list content - shared by every sidebar shell (dashboard,
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

export function ProjectListContent() {
  const roleHref = useRoleHref();
  // Search, then real, working pagination state - matching dsa-list.tsx/dla-list.tsx's own
  // "Section header, then search, then table" shape (CONTEXT.md's non-negotiable table pattern) -
  // this list was missing the search step. `pageCount` is 1 with this example's 4 rows, so
  // Previous/Next both render disabled rather than faked as active. The numbered footer is the
  // same one the Explore results tables use, so both Projects tables read as one component.
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const query = search.trim().toLowerCase();
  const rows = query ? projects.filter((p) => [p.code, p.name, p.org, p.contributorName].some((v) => v.toLowerCase().includes(query))) : projects;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedProjects = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      <div className="flex flex-col gap-4 p-6">
        <div className="w-full max-w-sm">
          <Input
            aria-label="Search projects"
            size="sm"
            icon={SearchMd}
            placeholder="Search ID, name, organisation or contributor"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">No projects match your search.</p>
        ) : (
        <TableCard.Root>
          <Table aria-label="Projects">
            <Table.Header>
              {/* `label` (not children) - Table.Head only applies the design system's header treatment
                  (text-xs, semibold, text-quaternary) through its own `label` prop, the same way the
                  Explore results tables do. Plain children rendered as unstyled bold black text. */}
              <Table.Head id="code" label="Project ID" isRowHeader />
              <Table.Head id="project" label="Project" />
              <Table.Head id="org" label="Organisation" />
              <Table.Head id="status" label="Status" />
              <Table.Head id="contributor" label="Contributor" />
              <Table.Head id="updated" label="Updated" />
            </Table.Header>
            <Table.Body items={pagedProjects}>
              {(project) => (
                <Table.Row
                  id={project.id}
                  href={project.href ? roleHref(project.href) : undefined}
                  textValue={project.name}
                  className="group data-[href]:cursor-pointer"
                >
                  <Table.Cell>
                    <span className="text-sm whitespace-nowrap text-tertiary">{project.code}</span>
                  </Table.Cell>
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
          <TableCard.PaginationNumbered
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            totalCount={rows.length}
          />
        </TableCard.Root>
        )}
      </div>
    </>
  );
}

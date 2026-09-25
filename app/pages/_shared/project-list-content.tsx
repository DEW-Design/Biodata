"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { Table, TableCard } from "@/components/application/table/table";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { useRoleHref } from "@/lib/use-role-href";
import { projects, type Project } from "@/app/pages/_shared/project-list-data";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { ListFilterButton, RECENCY_OPTIONS, matchesFilters, optionsFromValues, recencyBucket, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";

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
// The project data lives in project-list-data.ts so server code can import it; re-exported here so
// existing imports keep working.
export { projects, type Project } from "@/app/pages/_shared/project-list-data";

// Filter and sort follow the pattern the DSA and DLA lists use (agreement-scope.tsx): one Filter
// button beside the search, nothing selected meaning every status, and sortable column headers that
// each sort by what the column means. Project ID is deliberately not sortable (an identifier, not a
// range you scan). Status sorts by its place in the project's life (Draft, Under review, Active,
// Completed), not alphabetically; Updated sorts by recency, parsed from its relative text.
const projectStatusOrder = ["Draft", "Under review", "Active", "Completed"];

const UNIT_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
/** "3 weeks ago" is 21 days old. */
const daysAgo = (p: Project): number | null => {
  const m = /^(\d+)\s+(day|week|month|year)s?\s+ago$/i.exec(p.updated.trim());
  return m ? Number(m[1]) * UNIT_DAYS[m[2].toLowerCase()] : null;
};
/** Negated so descending order means most recently updated first. */
const recency = (p: Project): SortValue => {
  const d = daysAgo(p);
  return d == null ? null : -d;
};

// What a project can be filtered on: its columns that you would scan. (Not the ID or the name -
// search covers those.)
const projectFilterSections: FilterSection[] = [
  { id: "status", label: "Status", options: projectStatusOrder.map((s) => ({ id: s, label: s })) },
  { id: "org", label: "Organisation", searchable: true, options: optionsFromValues(projects.map((p) => p.org)) },
  { id: "contributor", label: "Contributor", searchable: true, options: optionsFromValues(projects.map((p) => p.contributorName)) },
  { id: "updated", label: "Updated", options: RECENCY_OPTIONS },
];
const projectFilterGetters: FilterGetters<Project> = {
  status: (p) => p.status,
  org: (p) => p.org,
  contributor: (p) => p.contributorName,
  updated: (p) => recencyBucket(daysAgo(p)),
};
const projectSortKeys: Record<string, (p: Project) => SortValue> = {
  project: (p) => p.name,
  org: (p) => p.org,
  status: (p) => projectStatusOrder.indexOf(p.status),
  contributor: (p) => p.contributorName,
  updated: recency,
};

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
  const [filters, setFilters] = useState<FilterSelection>({});
  const [sort, setSort] = useState<SortDescriptor>({ column: "updated", direction: "descending" });
  const query = search.trim().toLowerCase();
  const matching = projects
    .filter((p) => matchesFilters(p, filters, projectFilterGetters))
    .filter((p) => !query || [p.code, p.name, p.org, p.contributorName].some((v) => v.toLowerCase().includes(query)));
  const rows = sortRows(matching, sort, projectSortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedProjects = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The table used to carry its own TableCard.Header directly above this same heading -
          title "Projects" repeated, an oval gray row-count badge, and a description saying almost
          the same thing as this section's own subheading. Flagged directly by the user: the header
          doubled up, inconsistent with every other page that has exactly one section header. The
          count and description now live here instead, and nowhere else on this screen. */}
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Projects</SectionHeader.Heading>
              {/* CountBadge, not Badge - a true circle, not TableCard.Header's own oval
                  padding-tuned Badge. color="brand" per the user: counters should read in the
                  primary colour, not neutral gray - see components/base/badges/badges.tsx. */}
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Every project you&apos;re contributing to or watching.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {/* p-6, not px-6 pb-6 - the table sat flush against SectionHeader's own bottom
          border/padding with no breathing room above it. Flagged directly by the user off a
          screenshot: "see how close the table is to the section header?" */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm shrink-0">
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
          <div>
            <ListFilterButton
              sections={projectFilterSections}
              selection={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">No projects match your search and filters.</p>
        ) : (
        <TableCard.Root className="flex min-h-48 flex-1 flex-col">
          <Table
            aria-label="Projects"
            bodyScrollable
            sortDescriptor={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
          >
            <Table.Header sticky>
              {/* `label` (not children) - Table.Head only applies the design system's header treatment
                  (text-xs, semibold, text-quaternary) through its own `label` prop, the same way the
                  Explore results tables do. Plain children rendered as unstyled bold black text. */}
              <Table.Head id="code" label="Project ID" isRowHeader />
              <Table.Head id="project" label="Project" allowsSorting />
              <Table.Head id="org" label="Organisation" allowsSorting />
              <Table.Head id="status" label="Status" allowsSorting />
              <Table.Head id="contributor" label="Contributor" allowsSorting />
              <Table.Head id="updated" label="Updated" allowsSorting />
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
    </div>
  );
}

"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Plus } from "@untitledui/icons";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { ListFilterButton, matchesFilters, monthOptions, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { CV_ROOT, cvStatus, cvStatusMeta, cvStatusOrder, cvTypeLabel, formatShortDate, identifierLabel, resolvedEntries, sourceTable, type Cv, type CvEntry, type CvStatus } from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { useRoleHref } from "@/lib/use-role-href";

// The vocabulary list (Figma "Ctrl Vocab List - All Columns View", node 1339:28684), re-fitted to the
// collection pattern (CONTRACTS 4.2): section header with count and "New vocabulary", toolbar search
// and Filter, then the table; a row opens the vocabulary's own page. The Figma's Active / Scheduled /
// Drafts / Archived tabs are the Status filter (?status= seeds it). Category is chosen in column 2, so
// the Category column is hidden while one is chosen (it would repeat the filter), and Category is not
// also a filter here (two controls for one fact, 4.3).
//
// Built for hundreds of vocabularies:
//   - The search looks inside the entries too. An admin often knows a value ("Mallee", "CCBY") and
//     not the vocabulary that holds it; a vocabulary found that way says which entries matched, on a
//     line under its name (the Projects list's name-and-description cell).
//   - Filter adds Updated (by month), for "what changed recently" across hundreds.
//   - Start date leaves the table: it is on the vocabulary's page, and Status already says Scheduled.
//   - A search or filter that finds nothing offers to clear itself.
//
// Scheduled is worked out from the start date (the Figma note on node 1339:32515), never stored.

const sortKeys: Record<string, (cv: Cv) => SortValue> = {
  name: (cv) => cv.name,
  category: (cv) => cv.category,
  type: (cv) => cvTypeLabel[cv.type],
  values: (cv) => cv.entries.length,
  status: (cv) => cvStatusOrder.indexOf(cvStatus(cv)),
  updated: (cv) => cv.updatedAt,
};

const filterGetters: FilterGetters<Cv> = {
  status: (cv) => cvStatus(cv),
  type: (cv) => cv.type,
  updated: (cv) => cv.updatedAt.slice(0, 7),
};

/** Entries available to users, of all; a Descriptive vocabulary says which table they come from. */
function valuesSummary(cv: Cv): string {
  const available = cv.entries.filter((e) => e.status === "active").length;
  const from = cv.type === "descriptive" && sourceTable(cv.sourceTable) ? ` from ${sourceTable(cv.sourceTable)!.label}` : "";
  if (cv.entries.length === 0) return "No entries yet";
  return available === cv.entries.length ? `${available} ${available === 1 ? "entry" : "entries"}${from}` : `${available} of ${cv.entries.length} available${from}`;
}

/** The entries a search matched, for a vocabulary whose own name, ID and description did not. */
function entryMatches(cv: Cv, query: string): CvEntry[] {
  return resolvedEntries(cv).filter((e) => [e.code, e.name, e.title, e.value, e.description].some((v) => v.toLowerCase().includes(query)));
}

function matchLine(cv: Cv, matches: CvEntry[]): string {
  const first = matches[0];
  const label = [first.code, first.name].filter(Boolean).join(" · ");
  const more = matches.length > 1 ? ` and ${matches.length - 1} more` : "";
  return `${matches.length === 1 ? "Entry" : "Entries"}: ${identifierLabel(cv.idKind) === "ID" ? `ID ${label}` : label}${more}`;
}

export function CvList( { category, initialStatuses = [] }: { category: string; initialStatuses?: CvStatus[] }) {
  const all = useCvs();
  const roleHref = useRoleHref();
  const base = CV_ROOT;
  const scoped = category ? all.filter((cv) => cv.category.trim() === category) : all;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({ status: new Set<string>(initialStatuses) });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });

  const filterSections: FilterSection[] = [
    { id: "status", label: "Status", options: cvStatusOrder.map((id) => ({ id, label: cvStatusMeta[id].label })) },
    { id: "type", label: "Type", options: [{ id: "reference", label: "Reference" }, { id: "descriptive", label: "Descriptive" }] },
    { id: "updated", label: "Updated", options: monthOptions(scoped.map((cv) => cv.updatedAt)) },
  ];

  const query = search.trim().toLowerCase();
  const found = new Map<string, CvEntry[]>();
  const matching = scoped
    .filter((cv) => matchesFilters(cv, filters, filterGetters))
    .filter((cv) => {
      if (!query || [cv.name, cv.id, cv.description].some((v) => v.toLowerCase().includes(query))) return true;
      const hits = entryMatches(cv, query);
      if (hits.length) found.set(cv.id, hits);
      return hits.length > 0;
    });
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const narrowed = !!query || Object.values(filters).some((set) => set.size > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{category ? `${category} vocabularies` : "Controlled vocabularies"}</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>The lists of permitted values that forms, dataset templates and validation rules use.</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref(`${base}/new`)}>
              New vocabulary
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search vocabularies"
            placeholder="Search vocabularies and their entries"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <div>
            <ListFilterButton
              sections={filterSections}
              selection={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-tertiary">
              {query ? `No vocabularies or entries match “${search.trim()}”${category ? ` in ${category}` : ""}.` : "No vocabularies match your filters."}
            </p>
            {narrowed && (
              <Button
                color="link-color"
                size="sm"
                onPress={() => {
                  setSearch("");
                  setFilters({ status: new Set() });
                  setPage(1);
                }}
              >
                Clear search and filters
              </Button>
            )}
          </div>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table
              bodyScrollable
              aria-label="Controlled vocabularies"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="name" label="Vocabulary" isRowHeader allowsSorting />
                <Table.Head id="id" label="ID" />
                {!category ? <Table.Head id="category" label="Category" allowsSorting /> : null}
                <Table.Head id="type" label="Type" allowsSorting />
                <Table.Head id="values" label="Values" allowsSorting />
                <Table.Head id="status" label="Status" allowsSorting />
                <Table.Head id="updated" label="Updated" allowsSorting />
              </Table.Header>
              {/* The entry-match line depends on the search, not only on the row: react-aria caches rows per item. */}
              <Table.Body items={paged} dependencies={[query]}>
                {(cv) => {
                  const status = cvStatus(cv);
                  const hits = found.get(cv.id);
                  return (
                    <Table.Row id={cv.id} href={roleHref(`${base}/${cv.id}`)} textValue={cv.name} className="group data-[href]:cursor-pointer">
                      <Table.Cell>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{cv.name}</p>
                          {hits && <p className="max-w-md truncate text-xs text-tertiary">{matchLine(cv, hits)}</p>}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary tabular-nums">{cv.id}</span>
                      </Table.Cell>
                      {!category ? (
                        <Table.Cell>
                          <span className="text-sm whitespace-nowrap text-secondary">{cv.category || <span className="text-quaternary">Not provided</span>}</span>
                        </Table.Cell>
                      ) : null}
                      <Table.Cell>
                        <span className="text-sm text-secondary">{cvTypeLabel[cv.type]}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary tabular-nums">{valuesSummary(cv)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge size="sm" color={cvStatusMeta[status].badgeColor}>
                          {cvStatusMeta[status].label}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(cv.updatedAt)}</span>
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
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

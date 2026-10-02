"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { SearchMd } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { CountBadge } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";

// /proto index - a plain list of every prototype lab under app/proto/**, so opening /proto shows
// what's currently being explored instead of a 404. Per direct request: "borrow the same table as
// that in the design system" - this is the real `TableCard`/`Table`/`SectionHeader` combination
// every collection screen uses (see project-list-content.tsx), not a lookalike.
//
// This page itself is not a prototype and not a documented product screen - it's an index, the
// same "not added to lib/nav.ts, reached by direct URL" convention every /proto lab already
// follows. No shell (AppHeader/PrimaryRail): /proto labs are explicitly exempt from the
// three-column contract (CONTRACTS.md 3.1-3.5), and an index of them keeps that same exemption.
//
// The route list below is maintained by hand, the same way this file's own description column is
// a paraphrase of each lab's own header comment - it isn't generated from the filesystem, so a new
// lab needs one line added here when it's created.
interface ProtoEntry {
  route: string;
  description: string;
}

const PROTO_LABS: ProtoEntry[] = [
  {
    route: "admin-dashboard-options",
    description: "What biodata-admin should see on Home, instead of the registered-user dashboard it gets by default.",
  },
  {
    route: "collection-sidebar",
    description: "Column 2 for a List to deep dive collection (DSA, DLA): Actions, Status Tabs, My Items.",
  },
  {
    route: "dashboard-options",
    description: "How much more the registered-user dashboard should say beyond \"Hi, Olivia\" and three KPI numbers.",
  },
  {
    route: "data-model-stress-test",
    description: "A real CSV/JSON/XLS/XLSX ingestion tool - upload a BDBSA export and see it auto-map to the Project, Site, Visit, Occurrence tree.",
  },
  {
    route: "data-provenance",
    description: "Dataset as a tree axis alongside Site. Superseded - the confirmed data model doesn't need it.",
  },
  {
    route: "layouts",
    description: "How much room the table gets on a report's record page: the gradient card, a slim header, a folding column 2, or a facet panel. Reads the table's real size.",
  },
  {
    route: "project-detail",
    description: "project-detail's Overview tab and records tree, before both were folded into the real page.",
  },
  {
    route: "project-header",
    description: "Where a project's owner, contacts and record counts should live on the project-detail header.",
  },
  {
    route: "project-sidebar",
    description: "How project-detail's contextual sidebar should group a project's nested records at scale.",
  },
  {
    route: "public-user",
    description: "The signed-out guest Home landing: the gradient card, and what column 2 explains about BioData SA.",
  },
  {
    route: "public-user-explorations",
    description: "Turning the guest dashboard into an account-creation nudge. Superseded by /proto/public-user.",
  },
  {
    route: "tab-icons",
    description: "Icons on the underline tabs: text only, an icon on every tab, or an icon on the selected tab.",
  },
  {
    route: "tools",
    description: "One home for the preview tools (role, layout options, upload result). The status bar was chosen and is now on every screen; the dock and launcher stay for the record.",
  },
  {
    route: "dataset-ingestion",
    description: "Where a dataset's ingestion progress lives on the project page: a notice, a card in the records tree, or a chip. Simulated run.",
  },
];

const protoSortKeys: Record<string, (p: ProtoEntry) => SortValue> = {
  route: (p) => p.route,
};

export default function ProtoIndexPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "route", direction: "ascending" });

  const query = search.trim().toLowerCase();
  const matching = PROTO_LABS.filter(
    (p) => !query || p.route.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
  );
  const rows = sortRows(matching, sort, protoSortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="font-barlow flex min-h-screen flex-col bg-primary">
      <div className="flex min-h-0 flex-1 flex-col">
        <SectionHeader.Root className="shrink-0 p-6">
          <SectionHeader.Group>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <SectionHeader.Heading>Prototype labs</SectionHeader.Heading>
                <CountBadge count={rows.length} color="brand" />
              </div>
              <SectionHeader.Subheading>
                Every exploration under /proto/** - throwaway routes, imported by nothing, kept as evidence of the directions considered.
              </SectionHeader.Subheading>
            </div>
          </SectionHeader.Group>
        </SectionHeader.Root>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          <div className="w-full max-w-sm shrink-0">
            <Input
              aria-label="Search prototype labs"
              size="sm"
              icon={SearchMd}
              placeholder="Search by route or description"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>

          {rows.length === 0 ? (
            <p className="py-6 text-sm text-tertiary">No prototype labs match your search.</p>
          ) : (
            <TableCard.Root className="flex min-h-48 flex-1 flex-col">
              <Table
                aria-label="Prototype labs"
                bodyScrollable
                sortDescriptor={sort}
                onSortChange={(next) => {
                  setSort(next);
                  setPage(1);
                }}
              >
                <Table.Header sticky>
                  <Table.Head id="route" label="Route" allowsSorting isRowHeader />
                  <Table.Head id="description" label="Description" />
                </Table.Header>
                <Table.Body items={pagedRows}>
                  {(entry) => (
                    <Table.Row id={entry.route} href={`/proto/${entry.route}`} textValue={entry.route} className="group data-[href]:cursor-pointer">
                      <Table.Cell>
                        <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">/proto/{entry.route}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-tertiary">{entry.description}</span>
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
    </div>
  );
}

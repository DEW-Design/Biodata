"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { SearchMd } from "@untitledui/icons";
import { CountBadge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { artefactTypeMeta, type Artefact, type ArtefactType } from "@/app/pages/_shared/artefact-lightbox";
import { ListFilterButton, matchesFilters, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";

// A project's artefacts and attachments as a table (the Explore Artefacts table's shape, without its
// Hierarchy column): search and a Type filter above, sortable columns, numbered pagination. A row
// opens the artefact viewer at that artefact. Embedded in a detail tab, so the page scrolls and the
// rows are few (CONTRACTS 4.2).

export const artefactTypeLabel: Record<ArtefactType, string> = {
  image: "Image",
  pdf: "PDF",
  video: "Video",
  spreadsheet: "Spreadsheet",
  link: "Reference link",
};

const createdTime = (a: Artefact) => {
  const t = Date.parse(a.created.replace(",", ""));
  return Number.isNaN(t) ? null : t;
};

const sortKeys: Record<string, (a: Artefact) => SortValue> = {
  title: (a) => a.title,
  type: (a) => artefactTypeLabel[a.type],
  record: (a) => a.recordLabel,
  creator: (a) => a.creator,
  created: createdTime,
};

const filterGetters: FilterGetters<Artefact> = { type: (a) => a.type };

export function ArtefactTable({ artefacts, onOpen }: { artefacts: Artefact[]; onOpen: (index: number) => void }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [sort, setSort] = useState<SortDescriptor>({ column: "created", direction: "descending" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const types = (Object.keys(artefactTypeLabel) as ArtefactType[]).filter((t) => artefacts.some((a) => a.type === t));
  const filterSections: FilterSection[] = [{ id: "type", label: "Type", options: types.map((id) => ({ id, label: artefactTypeLabel[id] })) }];

  const query = search.trim().toLowerCase();
  const matching = artefacts
    .filter((a) => matchesFilters(a, filters, filterGetters))
    .filter((a) => !query || [a.title, a.recordLabel, a.creator, a.format, artefactTypeLabel[a.type]].some((v) => v.toLowerCase().includes(query)));
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="m-0! text-sm! font-semibold! tracking-normal! text-primary!">Artefacts &amp; Attachments</h2>
        <CountBadge count={rows.length} color="brand" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            aria-label="Search artefacts"
            size="sm"
            icon={SearchMd}
            placeholder="Search name, record or creator"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onClear={() => {
              setSearch("");
              setPage(1);
            }}
            clearLabel="Clear search"
          />
        </div>
        <ListFilterButton
          sections={filterSections}
          selection={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-tertiary">{artefacts.length === 0 ? "No artefacts or attachments yet." : "No artefacts match your search and filters."}</p>
      ) : (
        <TableCard.Root>
          <Table
            bodyScrollable
            aria-label="Artefacts and attachments"
            sortDescriptor={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            onRowAction={(key) => onOpen(artefacts.findIndex((a) => a.id === key))}
          >
            <Table.Header sticky>
              <Table.Head id="title" label="Attached resource" isRowHeader allowsSorting />
              <Table.Head id="type" label="Type" allowsSorting />
              <Table.Head id="record" label="Attached to" allowsSorting />
              <Table.Head id="creator" label="Creator" allowsSorting />
              <Table.Head id="created" label="Created" allowsSorting />
              <Table.Head id="size" label="Size" />
            </Table.Header>
            <Table.Body items={paged}>
              {(a) => {
                const Icon = artefactTypeMeta[a.type].icon;
                return (
                  <Table.Row id={a.id} textValue={a.title} className="group cursor-pointer">
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-quaternary" />
                        <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{a.title}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{artefactTypeLabel[a.type]}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary">{a.recordLabel}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{a.creator}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{a.created}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{a.size}</span>
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
  );
}

"use client";

import { Suspense, useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { SearchMd } from "@untitledui/icons";
import { CountBadge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { ListFilterButton, matchesFilters, optionsFromValues, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { datasetTemplates, type DatasetTemplate } from "@/app/pages/_shared/template-finder/template-data";
import { TemplateDownloads } from "@/app/pages/_shared/template-finder/template-downloads";
import { TemplateFinderShell } from "@/app/pages/_shared/template-finder/template-finder-shell";

// /pages/template-finder - the standard dataset templates, fitted from the wireframe (Figma
// YMproGZfrFB5jUqPHPxMhk node 38:60287) into the collection pattern (CONTRACTS 4.2): Section header,
// search and filter, then the table. Departures from the wireframe, on purpose:
//   - the card grid is a table (every collection screen is a table, 4.2), and the cards' image
//     placeholders are dropped (there are no template images);
//   - the three filter selects and "Find Templates" are the search box and the filter button every
//     list uses, applying as you choose; the "Project ID / Title" filter is left out, since nothing
//     links a template to a project yet;
//   - the Excel and PDF glyphs are named buttons, disabled, as on the upload form (`TemplateDownloads`);
//   - rows are not links: a template has no page of its own.
// Signed-in roles only (`templateFinder`); a public user gets the shell with the restriction in main.

const sortKeys: Record<string, (t: DatasetTemplate) => SortValue> = {
  template: (t) => t.title,
  method: (t) => t.collectionMethod,
  species: (t) => t.speciesType,
};

const filterGetters: FilterGetters<DatasetTemplate> = {
  method: (t) => t.collectionMethod,
  species: (t) => t.speciesType,
};

const filterSections: FilterSection[] = [
  { id: "method", label: "Collection method", options: optionsFromValues(datasetTemplates.map((t) => t.collectionMethod)) },
  { id: "species", label: "Species type", options: optionsFromValues(datasetTemplates.map((t) => t.speciesType)) },
];

export default function TemplateFinderPage() {
  return (
    <Suspense fallback={null}>
      <TemplateFinderShell>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TemplateList />
        </div>
      </TemplateFinderShell>
    </Suspense>
  );
}

function TemplateList() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "template", direction: "ascending" });

  const query = search.trim().toLowerCase();
  const matching = datasetTemplates
    .filter((t) => matchesFilters(t, filters, filterGetters))
    .filter((t) => !query || [t.title, t.description].some((v) => v.toLowerCase().includes(query)));
  const rows = sortRows(matching, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Template Finder</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Browse and download the standard templates for preparing a dataset.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm shrink-0">
            <Input
              aria-label="Search templates"
              size="sm"
              icon={SearchMd}
              placeholder="Search templates"
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
          <p className="py-6 text-sm text-tertiary">No templates match your search and filters.</p>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table
              bodyScrollable
              aria-label="Dataset templates"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="template" label="Template" isRowHeader allowsSorting />
                <Table.Head id="method" label="Collection method" allowsSorting />
                <Table.Head id="species" label="Species type" allowsSorting />
                <Table.Head id="download" label="Download" />
              </Table.Header>
              <Table.Body items={paged}>
                {(t) => (
                  <Table.Row id={t.id} textValue={t.title}>
                    <Table.Cell>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-primary">{t.title}</p>
                        <p className="max-w-md text-xs text-balance text-tertiary">{t.description}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{t.collectionMethod}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{t.speciesType}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <TemplateDownloads />
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

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Feather, SearchLg, Tag01 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { CountBadge } from "@/components/base/badges/badges";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { optionsFromValues, type FilterGetters, type FilterSection, useListFilter } from "@/app/pages/_shared/list-filter";
import { AttributeFilterChips, type AttributeFilterApi } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { datasetTemplates, type DatasetTemplate } from "@/app/pages/_shared/template-finder/template-data";
import { TemplateDownloads } from "@/app/pages/_shared/template-finder/template-downloads";

// The Template Finder's list: section header, search and filter, then the table (the page, /pages/template-finder, says
// how it was fitted from the wireframe). It lives here so the page and the column 2 lab (/proto/column-2) draw the
// same list. The filter is made by `useTemplateFilter` and handed in, because column 2 (`TemplateNav`) is the same
// filter drawn as a list of places: one state, so the Filter menu, its chips and column 2 never disagree (CONTRACTS 4.2d).
// `beforeTable` is a slot for anything shown between the toolbar and the table.

const sortKeys: Record<string, (t: DatasetTemplate) => SortValue> = {
  template: (t) => t.title,
  method: (t) => t.collectionMethod,
  species: (t) => t.speciesType,
};

const filterGetters: FilterGetters<DatasetTemplate> = {
  method: (t) => t.collectionMethod,
  species: (t) => t.speciesType,
};

const filterSectionsFor = (templates: DatasetTemplate[]): FilterSection[] => [
  { id: "method", label: "Collection method", icon: Tag01, options: optionsFromValues(templates.map((t) => t.collectionMethod)) },
  { id: "species", label: "Species type", icon: Feather, options: optionsFromValues(templates.map((t) => t.speciesType)) },
];

/** The list's filter: collection method and species type, as the Filter menu offers them. */
export function useTemplateFilter(templates: DatasetTemplate[] = datasetTemplates) {
  const sections = useMemo(() => filterSectionsFor(templates), [templates]);
  return useListFilter(sections, filterGetters);
}

export function TemplateList({ filter, templates = datasetTemplates, beforeTable }: { filter: AttributeFilterApi<DatasetTemplate>; templates?: DatasetTemplate[]; beforeTable?: ReactNode }) {
  const [search, setSearch] = useState("");
  // The page goes back to 1 whenever a filter changes (4.2d): the page number is only good for the filters it was set under.
  const filterKey = JSON.stringify(filter.applied);
  const [pageAt, setPageAt] = useState({ page: 1, filterKey });
  const page = pageAt.filterKey === filterKey ? pageAt.page : 1;
  const setPage = (next: number) => setPageAt({ page: next, filterKey });
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "template", direction: "ascending" });

  const query = search.trim().toLowerCase();
  const matching = templates
    .filter(filter.matches)
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
          <ToolbarSearch
            label="Search templates"
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
          />
          <FilterMenu filter={filter} />
        </div>
        <AttributeFilterChips filter={filter} />
        {beforeTable}
        {rows.length === 0 ? (
          <ListEmptyState
            icon={SearchLg}
            title="No templates match"
            description="Try a different search, or remove a filter."
            action={{
              label: "Show all templates",
              onPress: () => {
                setSearch("");
                filter.clear();
                setPage(1);
              },
            }}
          />
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table layout="fixed" className="min-w-[840px]"
              bodyScrollable
              aria-label="Dataset templates"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="template" label="Template" isRowHeader allowsSorting className="w-[52%]" />
                <Table.Head id="method" label="Collection method" allowsSorting className="w-[16%]" />
                <Table.Head id="species" label="Species type" allowsSorting className="w-[14%]" />
                <Table.Head id="download" label="Download" className="w-[18%]" />
              </Table.Header>
              <Table.Body items={paged}>
                {(t) => (
                  <Table.Row id={t.id} textValue={t.title}>
                    <Table.Cell>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-primary">{t.title}</p>
                        <p className="max-w-xl text-xs text-balance text-tertiary">{t.description}</p>
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

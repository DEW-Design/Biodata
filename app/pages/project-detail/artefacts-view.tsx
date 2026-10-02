"use client";

// VERSION 3: the Artefacts and attachments tab. Only what is attached to a record's fields in Survey
// records shows here (field-notes-store.ts is the source). Two views of the same list, switched with the
// same control as the records' Tree / Table switch: Cards (the file tiles) and Table (one row per file,
// sortable, paginated). Search and a Type filter sit in the standard collection toolbar (CONTRACTS
// 4.2c), with the view switch at its right end, where the records' switch sits. A card or a row opens the file in the viewer; "Go to record" goes to the record it belongs to.

import { createElement, useMemo, useState } from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  type SortDescriptor,
} from "react-aria-components";
import {
  ArrowNarrowRight,
  LayoutGrid01,
  Table as TableIcon,
  Tag01,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Table, TableCard } from "@/components/application/table/table";
import {
  ArtefactTile,
  artefactTypeMeta,
  type Artefact,
} from "@/app/pages/_shared/artefact-lightbox";
import { type FilterSection, useListFilter } from "@/app/pages/_shared/list-filter";
import { AttributeFilterChips } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { cx } from "@/utils/cx";
import { segmentClass, segmentTrayClass } from "./segmented";

export type FieldArtefact = Artefact & { recordId: string; fieldKey: string };

export function ArtefactsView({
  artefacts,
  onOpen,
  onOpenRecord,
}: {
  artefacts: FieldArtefact[];
  onOpen: (index: number) => void;
  onOpenRecord: (recordId: string, fieldKey: string) => void;
}) {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortDescriptor>({
    column: "title",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const types = useMemo(
    () => [...new Set(artefacts.map((a) => a.type))],
    [artefacts],
  );
  const typeLabel = (t: string) =>
    t === "pdf" ? "PDF" : t.charAt(0).toUpperCase() + t.slice(1);
  const sections: FilterSection[] = [
    {
      id: "type",
      label: "Type",
      icon: Tag01,
      options: types.map((t) => ({ id: t, label: typeLabel(t) })),
    },
  ];
  const filter = useListFilter(sections, { type: (x: FieldArtefact) => x.type }, () => setPage(1));
  const q = query.trim().toLowerCase();
  const passesFilter = filter.matches;
  const rows = useMemo(() => {
    const list = artefacts.filter(
      (a) =>
        passesFilter(a) &&
        (!q ||
          `${a.title} ${a.recordLabel} ${a.creator}`.toLowerCase().includes(q)),
    );
    const key = sort.column as keyof FieldArtefact;
    return [...list].sort((a, b) => {
      const cmp = String(a[key] ?? "").localeCompare(
        String(b[key] ?? ""),
        undefined,
        { numeric: true },
      );
      return sort.direction === "ascending" ? cmp : -cmp;
    });
  }, [artefacts, passesFilter, q, sort]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const paged = rows.slice((current - 1) * pageSize, current * pageSize);
  const indexOf = (a: FieldArtefact) =>
    artefacts.findIndex((x) => x.id === a.id);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-balance text-tertiary">
        Files, photos, recordings and links attached to the fields of this
        project&apos;s records, in Project records. Each one opens in the viewer;
        &ldquo;Go to record&rdquo; shows the record it belongs to.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <ToolbarSearch
          label="Search artefacts"
          placeholder="Search by file, record or who added it"
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
        />
        <FilterMenu filter={filter} />
        <ToggleButtonGroup
          aria-label="Artefacts view"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[view]}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next === "cards" || next === "table") setView(next);
          }}
          className={cx(segmentTrayClass, "ml-auto")}
        >
          <ToggleButton id="cards" className={segmentClass}>
            <LayoutGrid01 className="size-4" />
            Cards
          </ToggleButton>
          <ToggleButton id="table" className={segmentClass}>
            <TableIcon className="size-4" />
            Table
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <AttributeFilterChips filter={filter} />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-secondary p-10 text-center">
          <p className="text-sm font-medium text-primary">No artefacts match</p>
          <p className="text-sm text-tertiary">Try another search or type.</p>
        </div>
      ) : view === "cards" ? (
        <div className="flex flex-wrap gap-4">
          {rows.map((a) => (
            <div key={a.id} className="flex flex-col gap-1.5">
              <ArtefactTile artefact={a} onOpen={() => onOpen(indexOf(a))} />
              <Button
                color="link-color"
                size="sm"
                className="w-max"
                onClick={() => onOpenRecord(a.recordId, a.fieldKey)}
                iconTrailing={ArrowNarrowRight}
              >
                Go to record
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <TableCard.Root className="flex max-h-[calc(100dvh-16rem)] min-h-48 flex-col">
          <Table layout="fixed" className="min-w-[1100px]"
            aria-label="Artefacts and attachments"
            bodyScrollable
            sortDescriptor={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
          >
            <Table.Header sticky>
              <Table.Head id="title" label="File" isRowHeader allowsSorting className="w-[26%]" />
              <Table.Head id="type" label="Type" allowsSorting className="w-[11%]" />
              <Table.Head id="size" label="Size" className="w-[8%]" />
              <Table.Head id="recordLabel" label="Attached to" allowsSorting className="w-[20%]" />
              <Table.Head id="creator" label="Added by" allowsSorting className="w-[13%]" />
              <Table.Head id="created" label="Date" className="w-[11%]" />
              <Table.Head id="open" label="" className="w-[11%]" />
            </Table.Header>
            <Table.Body items={paged}>
              {(a) => {
                const meta = artefactTypeMeta[a.type];
                return (
                  <Table.Row
                    id={a.id}
                    textValue={a.title}
                    onAction={() => onOpen(indexOf(a))}
                    className="cursor-pointer"
                  >
                    <Table.Cell>
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
                        {createElement(meta.icon, {
                          className: "size-4 shrink-0 text-fg-quaternary",
                        })}
                        <span className="truncate">{a.title}</span>
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" color={meta.badgeColor}>
                        {typeLabel(a.type)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">
                        {a.size}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary">
                        {a.recordLabel}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">
                        {a.creator}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">
                        {a.created}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        color="link-color"
                        size="sm"
                        onClick={() => onOpenRecord(a.recordId, a.fieldKey)}
                        iconTrailing={ArrowNarrowRight}
                      >
                        Go to record
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table>
          <TableCard.PaginationNumbered
            page={current}
            pageCount={pageCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            pageSizeOptions={[10, 25, 50]}
            totalCount={rows.length}
          />
        </TableCard.Root>
      )}
    </div>
  );
}

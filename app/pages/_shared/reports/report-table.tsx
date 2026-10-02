"use client";

import { cloneElement, isValidElement, useCallback, useMemo, useState, type FC, type ReactElement, type ReactNode } from "react";
import type { SortDescriptor } from "react-aria-components";
import { SearchLg } from "@untitledui/icons";
import { HeroMeta, RecordHero } from "@/app/pages/_shared/record-hero";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { AttributeFilterChips, useAttributeFilter, type Attribute, type AttributeFilterApi } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ColumnChooser, useColumnChoice } from "@/app/pages/_shared/reports/column-chooser";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { MetricTile } from "@/app/pages/_shared/map-search/metric-tile";
import { cx } from "@/utils/cx";

// The one ledger every report after the Data Ingestion Report is drawn with (designer, 1 Oct 2026: "follow the
// logic on how to bring reports in from the first report"). The first report (ingestion-report.tsx) set the
// pattern and this is that pattern as a component, so each report is only its columns and its rows:
//   - CONTRACTS 4.6: a report is a deep dive, so it opens like the project page: the gradient identity card
//     (`RecordHero`) with the report's name, what it answers, a row of facts and its actions at the top right (one
//     white button, the rest in the "..." menu), under a Back link (`ReportPage`);
//   - CONTRACTS 4.2: then ToolbarSearch and the attribute filter (4.2d: a report has many facets), then the table in
//     a TableCard with a sticky header and the numbered pagination, fitted to the viewport so the page never scrolls
//     because of the table;
//   - every column of the wireframe's "Columns" list is in the table, which scrolls sideways inside its card; the
//     first column is pinned while it does, and a Columns button at the right of the toolbar (`column-chooser.tsx`, the
//     wireframe's column panel) hides, shows and reorders the others;
//   - an empty table is a `ListEmptyState` (4.2e), told apart as "nothing exists yet" and "nothing matches";
//   - an empty cell is left empty and is never a stray dash (2.3).
// A report passes `belowHeader` for what sits between its hero and the toolbar (tiles, a project scope, tabs) and
// `actions` for the hero's action bar (export); both may be functions of the rows in view.
// `report-columns.tsx` has the builders for columns that also know how they read as plain text (for the CSV).

const dayInAdelaide = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Adelaide" });
const dayAsWritten = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** The newest of the rows' dates, as a day, or null. A date written as a day (2026-09-24) is that day; an instant is that day in Adelaide. */
function newestDay<R>(rows: R[], get: (row: R) => string | number | null | undefined): string | null {
  let best: { ms: number; dayOnly: boolean } | null = null;
  for (const r of rows) {
    const v = get(r);
    if (v === null || v === undefined || v === "") continue;
    const ms = typeof v === "number" ? v : Date.parse(v);
    if (Number.isNaN(ms)) continue;
    if (!best || ms > best.ms) best = { ms, dayOnly: typeof v === "string" && v.length === 10 };
  }
  return best ? (best.dayOnly ? dayAsWritten : dayInAdelaide).format(best.ms) : null;
}

export interface ReportFact {
  label: string;
  value: ReactNode;
}

export interface ReportColumn<R> {
  id: string;
  label: string;
  /** A static class (`w-[160px]`) so Tailwind sees it: the column's width, wide enough for the longest value on
   *  one line. The table is fixed-layout, so this is the column's real width, not a floor it grows past. */
  width: string;
  /** Pins the column at the left edge while the table scrolls sideways: the first column only. */
  sticky?: boolean;
  /** What the column sorts by. A column without one is not sortable. */
  sort?: (row: R) => SortValue;
  cell: (row: R) => ReactNode;
}

// ── Cells ──
// The roles the first report's cells set, as components, so every report reads the same: a plain value, a value
// that is the row's subject, an identifier, a number, a scientific name, a long value that clamps to one line.
export function TextCell({ children, strong }: { children?: ReactNode; strong?: boolean }) {
  if (children === undefined || children === null || children === "") return null;
  // One line in a fixed-width column: a value longer than its column is cut with an ellipsis, and the whole of it is the
  // tooltip. (Each column's width is fixed, so a long value can never widen it.)
  return (
    <span className={cx("block truncate text-sm", strong ? "text-primary" : "text-secondary")} title={typeof children === "string" ? children : undefined}>
      {children}
    </span>
  );
}

export function IdCell({ children }: { children?: ReactNode }) {
  if (children === undefined || children === null || children === "") return null;
  return <span className="text-sm font-medium text-primary tabular-nums">{children}</span>;
}

/** A number or a date: tabular, so a changing figure does not shift the column. */
export function NumberCell({ value }: { value: number | string | null | undefined }) {
  if (value === undefined || value === null || value === "") return null;
  return <span className="text-sm text-secondary tabular-nums">{typeof value === "number" ? value.toLocaleString("en-AU") : value}</span>;
}

/** A scientific name, in italics, with the common name under it when there is one. */
export function SpeciesCell({ scientific, common }: { scientific?: string; common?: string }) {
  if (!scientific && !common) return null;
  return (
    <span className="flex flex-col">
      {scientific ? <span className="text-sm text-primary italic">{scientific}</span> : null}
      {common ? <span className={cx("text-xs", scientific ? "text-tertiary" : "text-sm text-primary")}>{common}</span> : null}
    </span>
  );
}

/** A cell that can be long: one line, with the full text as the tooltip. */
export function Clamped({ text, max = "max-w-[272px]" }: { text?: string; max?: string }) {
  if (!text) return null;
  return (
    <span className={cx("block truncate text-sm text-secondary", max)} title={text}>
      {text}
    </span>
  );
}

// ── Tiles ──
/** The row of counts under a report's heading: the shared `MetricTile` (icon, label, count) in the same compact grid the
 *  project page's "Survey at a glance" and Explore's results use, read-only here because a report's totals go nowhere. */
export function ReportTiles({
  tiles,
  label,
  compact = false,
}: {
  tiles: { label: string; value: number | string; icon: FC<{ className?: string }> }[];
  label: string;
  /** One quiet line of icon, label and value instead of a row of tiles (used with the slim header while layouts are compared in /proto/layouts). */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div role="group" aria-label={label} className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1 px-6 pt-3">
        {tiles.map((tile) => (
          <span key={tile.label} className="flex items-center gap-1.5 text-sm text-tertiary">
            <tile.icon className="size-4 text-fg-quaternary" />
            {tile.label}
            <span className="font-medium text-primary tabular-nums">{typeof tile.value === "number" ? tile.value.toLocaleString("en-AU") : tile.value}</span>
          </span>
        ))}
      </div>
    );
  }
  // Up to five tiles sit in one row; six do not fit at the width main has beside the rail and column 2 (two labels
  // would wrap and their counts fall out of line), so they go three across and two down (static classes so Tailwind sees them).
  const wide = tiles.length <= 3 ? "lg:grid-cols-3" : tiles.length === 4 ? "lg:grid-cols-4" : tiles.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-3";
  return (
    <div role="group" aria-label={label} className={cx("grid shrink-0 grid-cols-2 gap-2 px-6 [&+&]:mt-2", wide)}>
      {tiles.map((tile) => (
        <MetricTile key={tile.label} icon={tile.icon} label={tile.label} value={typeof tile.value === "number" ? tile.value.toLocaleString("en-AU") : tile.value} />
      ))}
    </div>
  );
}

// ── The report ──
/** A slot that may depend on the rows the table is showing (after search and filters). */
type RowsSlot<R> = ReactNode | ((rowsInView: R[]) => ReactNode);

export interface DataReportProps<R> {
  title: string;
  subtitle: string;
  /** The empty state's icon. */
  icon: FC<{ className?: string }>;
  /** Already limited to what the signed-in role may see. */
  rows: R[];
  rowId: (row: R) => string;
  columns: ReportColumn<R>[];
  /** Memoised by the caller: the attribute filter keeps its own state against this list. */
  attributes: Attribute<R>[];
  /** The text the search box matches, per row. */
  searchText: (row: R) => (string | undefined)[];
  searchLabel: string;
  searchPlaceholder: string;
  tableLabel: string;
  /** What a row is, plural, lower case: "records". Names the empty states and the "Show all ..." action. */
  noun: string;
  /** What appears here once there is data, for the "nothing exists yet" state. */
  emptyDescription: string;
  initialSort?: SortDescriptor;
  initialQuery?: string;
  /** A row's own date (ms, or an ISO day or time). The newest across all the rows is the "Latest record" fact; leave it out where rows carry no date. */
  latest?: (row: R) => string | number | null | undefined;
  /** More facts in the hero, after Latest record (a label and its value): the report's own totals. A function gets the rows in view. */
  facts?: ReportFact[] | ((rowsInView: R[]) => ReportFact[]);
  /** Right after the search, before Add filter: a scope such as a project. */
  scopeControl?: ReactNode;
  /** Between the hero and the toolbar: tiles, a project scope, tabs. A function gets the rows in view, so tiles can count them. */
  belowHeader?: RowsSlot<R>;
  /** The hero's actions, `<RecordActionBar onDark .../>`. A function gets the rows in view, so export writes exactly the table's rows. */
  actions?: RowsSlot<R>;
  /** The card ("card", the record page's gradient identity card) or a slim header ("line": the list screens' title and subheading, the facts on one line, the actions in a plain bar). Compared in /proto/layouts. */
  header?: "card" | "line";
  /** A panel of facets beside the table in place of the Filter menu and its chips. Gets the filter and every row, so it can count. Compared in /proto/layouts. */
  filterPanel?: (filter: AttributeFilterApi<R>, allRows: R[]) => ReactNode;
  /** When this changes the search, filters, sort and page go back to how they start, without remounting (a tab list
   *  in `belowHeader` keeps its keyboard focus). */
  resetKey?: string;
  /** Wraps everything under `belowHeader` (toolbar, chips, table), so that block can be a tab panel. */
  wrapBody?: (body: ReactNode) => ReactNode;
}

const DEFAULT_PAGE_SIZE = 50;

export function DataReport<R>({
  title,
  subtitle,
  icon,
  rows: allRows,
  rowId,
  columns,
  attributes,
  searchText,
  searchLabel,
  searchPlaceholder,
  tableLabel,
  noun,
  emptyDescription,
  initialSort,
  initialQuery = "",
  latest,
  facts = [],
  scopeControl,
  header = "card",
  filterPanel,
  belowHeader,
  actions,
  resetKey,
  wrapBody,
}: DataReportProps<R>) {
  const [search, setSearch] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortDescriptor | undefined>(initialSort);

  const { visible: shownColumns, chooser } = useColumnChoice(columns);

  const resetPage = useCallback(() => setPage(1), []);
  const filter = useAttributeFilter(attributes, resetPage);

  // Starting over when the key changes (another tab) is adjusting state while rendering, the pattern React documents
  // for a prop that resets state: it renders once more at once and nothing is remounted.
  const [seenKey, setSeenKey] = useState(resetKey);
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setSearch("");
    setPage(1);
    setSort(initialSort);
    filter.clear();
  }

  const sortKeys = useMemo(() => {
    const keys: Record<string, (row: R) => SortValue> = {};
    for (const c of columns) if (c.sort) keys[c.id] = c.sort;
    return keys;
  }, [columns]);

  const query = search.trim().toLowerCase();
  const matching = allRows.filter(filter.matches).filter((r) => !query || searchText(r).some((v) => v?.toLowerCase().includes(query)));
  const rows = sort ? sortRows(matching, sort, sortKeys) : matching;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showAll = () => {
    setSearch("");
    filter.clear();
    setPage(1);
  };

  const resolve = (slot: ReactNode | ((rowsInView: R[]) => ReactNode)) => (typeof slot === "function" ? slot(rows) : slot);
  const heroActions = actions ? resolve(actions) : null;
  const latestDay = latest ? newestDay(allRows, latest) : null;
  const heroFacts = typeof facts === "function" ? facts(rows) : facts;

  const body = (
    <div className={cx("flex min-h-0 min-w-0 flex-1 flex-col", header === "line" ? "gap-3 px-6 pb-4 pt-3" : "gap-4 p-6")}>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <ToolbarSearch
          label={searchLabel}
          placeholder={searchPlaceholder}
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
        {scopeControl}
        {!filterPanel && <FilterMenu filter={filter} />}
        <div className="ml-auto">
          <ColumnChooser chooser={chooser} />
        </div>
      </div>
      {!filterPanel && <AttributeFilterChips filter={filter} />}

      {rows.length === 0 ? (
        allRows.length === 0 ? (
          <ListEmptyState icon={icon} title={`No ${noun} yet`} description={emptyDescription} />
        ) : (
          <ListEmptyState
            icon={SearchLg}
            title={`No ${noun} match`}
            description={filter.count > 0 ? "Try a different search, or remove a filter." : "Try a different search."}
            action={{ label: `Show all ${noun}`, onPress: showAll }}
          />
        )
      ) : (
        <TableCard.Root size="xs" className="flex min-h-48 flex-1 flex-col">
          <Table
            bodyScrollable
            layout="fixed"
            aria-label={tableLabel}
            sortDescriptor={sort}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
          >
            <Table.Header sticky>
              {shownColumns.map((c) => (
                <Table.Head
                  key={c.id}
                  id={c.id}
                  label={c.label}
                  isRowHeader={!!c.sticky}
                  allowsSorting={!!c.sort}
                  className={cx(c.width, c.sticky && "sticky left-0 z-20 border-r border-secondary bg-secondary")}
                />
              ))}
            </Table.Header>
            <Table.Body items={paged} dependencies={[shownColumns]}>
              {(r) => (
                <Table.Row id={rowId(r)} textValue={rowId(r)}>
                  {shownColumns.map((c) => (
                    <Table.Cell key={c.id} className={cx("whitespace-nowrap", c.sticky && "sticky left-0 z-1 border-r border-secondary bg-primary [tr:hover_&]:bg-secondary")}>
                      {c.cell(r)}
                    </Table.Cell>
                  ))}
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
  );

  const lineFacts: ReportFact[] = [...(latestDay ? [{ label: "Latest record", value: latestDay }] : []), ...heroFacts];
  const lineActions = isValidElement(heroActions) ? cloneElement(heroActions as ReactElement<{ onDark?: boolean }>, { onDark: false }) : heroActions;

  const panelled = filterPanel ? (
    <div className="flex min-h-0 flex-1">
      <aside aria-label="Filters" className="w-60 shrink-0 overflow-y-auto border-r border-secondary px-4 py-3">
        {filterPanel(filter, allRows)}
      </aside>
      {body}
    </div>
  ) : (
    body
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header === "line" ? (
        <div className="shrink-0 px-6 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <SectionHeader.Heading>{title}</SectionHeader.Heading>
              <SectionHeader.Subheading>{subtitle}</SectionHeader.Subheading>
              {lineFacts.length > 0 ? (
                <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-tertiary">
                  {lineFacts.map((f) => (
                    <span key={f.label}>
                      {f.label} <span className="font-medium text-primary tabular-nums">{f.value}</span>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
            {lineActions}
          </div>
        </div>
      ) : (
        <RecordHero eyebrow="Report" title={title} description={subtitle} actions={heroActions}>
          {latestDay ? <HeroMeta label="Latest record">{latestDay}</HeroMeta> : null}
          {heroFacts.map((f) => (
            <HeroMeta key={f.label} label={f.label}>
              {f.value}
            </HeroMeta>
          ))}
        </RecordHero>
      )}

      {belowHeader ? <div className={cx("flex shrink-0 flex-col", header === "line" ? "pt-0" : "pt-4")}>{resolve(belowHeader)}</div> : null}

      {wrapBody ? wrapBody(panelled) : panelled}
    </div>
  );
}

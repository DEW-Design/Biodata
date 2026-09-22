"use client";

import type { FC, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button as AriaButton } from "react-aria-components";
import { Columns03, Sliders01, SearchLg, DotsHorizontal, ChevronRight, ChevronUp, ChevronDown, ChevronSelectorVertical, XClose } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Button } from "@/components/base/buttons/button";
import { Table, TableCard } from "@/components/application/table/table";
import { cx } from "@/utils/cx";
import { SidePanel } from "./side-panel";
import { RecordDetailSidebar } from "./record-detail";
import type { SearchEvent } from "./search-data";

// The generic results table shared by all four Events/Occurrences/Observations/Resources tabs on
// the map search results page - one real implementation of "search box + customise-columns +
// type-filter chips + table + row-click detail panel" per direct feedback, rather than four
// hand-duplicated copies. Column *definitions* (what each entity's columns are, how each renders)
// still live with each entity's own data in app/pages/observations/page.tsx - this file
// only owns the shared table chrome/interaction, not domain knowledge of what an Event or a
// Resource actually is.

export interface ColumnDef<T> {
  id: string;
  label: string;
  /** @default true */
  defaultVisible?: boolean;
  /** Renders a HelpCircle tooltip next to the header label - matches Figma's own "?" affordance
   *  on every tab's Type column header. */
  headerTooltip?: string;
  /** Extra className merged onto this column's <Table.Head> - used by the synthetic "view action"
   *  column below to pin itself (`sticky right-0`); not otherwise used by any real data column. */
  headerClassName?: string;
  /** Extra className merged onto this column's <Table.Cell> - same purpose as `headerClassName`. */
  cellClassName?: string;
  render: (row: T) => ReactNode;
}

/** Column id for the synthetic, pinned "view action" column `ResultsTable` appends when
 *  `viewActionLabel` is passed - never part of the caller's own `columns` array, so it can't be
 *  hidden via "Customise columns" and doesn't appear as a field in the row-detail side panel
 *  (both of those iterate the caller's `columns` prop directly, which never includes this one). */
const VIEW_ACTION_COLUMN_ID = "__view_action__";

export interface TypeFilterOption {
  value: string;
  label: string;
  /** Matches Figma's own icon-per-sub-type chip row (a distinct icon per Event/Occurrence/
   *  Resource sub-type, e.g. Folder for "Project", Waves for "Non-Biotic"). */
  icon?: FC<{ className?: string }>;
}

/** The interactive Hierarchy cell, matching Figma's style and per direct feedback on its exact
 *  behaviour:
 *  - `chain` is root-Project-first, ending in the record's own Event - that last segment is
 *    *always* visible (the "last level of hierarchy is the same as the Event ID" rule), never
 *    hidden by "Hide one level up"/"Hide all levels" - only the ancestors above it collapse.
 *  - The last segment is deliberately plain text, never a button - it's the row's own record,
 *    already inspectable via the row itself (click-to-open, or the ID column), so a second,
 *    identical-looking click target for it would be redundant. Every *ancestor* segment above it
 *    is a real button that opens a side panel with that specific ancestor's own details - "-" when
 *    `chain` is empty (a root Project's own Hierarchy cell, or a record attached directly to one,
 *    per `eventChain`/`hierarchyFor` in search-data.ts).
 *  - Starts collapsed to the last two levels (the record itself plus its immediate parent), not
 *    just the one non-clickable level - per direct feedback, the default state must always surface
 *    at least one clickable ancestor rather than requiring "Show one level up" before any link
 *    appears. "Show one level up" reveals one more ancestor above that at a time, "Show all levels"
 *    reveals the full chain, "Hide one level up"/"Hide all levels" collapse back down (never below
 *    the one always-shown, non-clickable level).
 *  `hiddenCount`/`detailEvent` are self-contained per cell instance - each row/column render
 *  produces its own `HierarchyCell` element, so neither state leaks across rows. */
export function HierarchyCell({ chain }: { chain: SearchEvent[] }) {
  const maxHidden = Math.max(0, chain.length - 1);
  const defaultHidden = Math.max(0, chain.length - 2);
  const [hiddenCount, setHiddenCount] = useState(defaultHidden);
  const [detailEvent, setDetailEvent] = useState<SearchEvent | null>(null);

  if (chain.length === 0) return <span className="text-sm text-tertiary">-</span>;

  const visible = chain.slice(hiddenCount);

  return (
    <>
      {/* Stops the click from bubbling to the row's own onAction (which opens the record detail
          panel) - same defensive stopPropagation already used for the Resources tab's reference-
          link anchor in app/pages/observations/page.tsx's resourceColumns. */}
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Dropdown.Root>
          <AriaButton
            aria-label="Hierarchy options"
            className="flex size-6 shrink-0 items-center justify-center rounded-md border border-secondary text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
          >
            <DotsHorizontal className="size-3.5" />
          </AriaButton>
          <Dropdown.Popover placement="bottom left" className="w-56">
            <Dropdown.Menu aria-label="Hierarchy options">
              <Dropdown.Item id="show-one" icon={ChevronUp} isDisabled={hiddenCount === 0} onAction={() => setHiddenCount((n) => Math.max(0, n - 1))}>
                Show one level up
              </Dropdown.Item>
              <Dropdown.Item id="hide-one" icon={ChevronDown} isDisabled={hiddenCount === maxHidden} onAction={() => setHiddenCount((n) => Math.min(maxHidden, n + 1))}>
                Hide one level up
              </Dropdown.Item>
              <Dropdown.Item id="show-all" icon={ChevronSelectorVertical} isDisabled={hiddenCount === 0} onAction={() => setHiddenCount(0)}>
                Show all levels
              </Dropdown.Item>
              <Dropdown.Item id="hide-all" icon={XClose} isDisabled={hiddenCount === maxHidden} onAction={() => setHiddenCount(maxHidden)}>
                Hide all levels
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>

        <div className="flex flex-wrap items-center gap-1" title={chain.map((event) => event.code).join(" > ")}>
          {visible.map((event, i) => {
            // The last visible segment is always the chain's own final entry (the record itself,
            // per eventChain/hierarchyFor) regardless of how many ancestors are currently shown -
            // `visible` only ever trims from the front, so its own last element never changes.
            const isRecordItself = i === visible.length - 1;
            return (
              <span key={event.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 shrink-0 text-quaternary" />}
                {isRecordItself ? (
                  <span className="text-sm font-medium text-secondary">{event.code}</span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailEvent(event);
                    }}
                    className="rounded text-sm font-medium text-brand-secondary outline-focus-ring hover:underline"
                  >
                    {event.code}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Same rich, Figma-matched sidebar a row click on the main table opens (record-detail.tsx)
          - clicking a Hierarchy segment used to open a hand-rolled 6-field `dl` here instead,
          a real inconsistency for the exact same underlying record (a Site clicked as a row got
          the full accordion sidebar; the same Site clicked as an ancestor breadcrumb got a plain
          summary). Reusing the shared component keeps both paths honest about the same data. */}
      <RecordDetailSidebar record={detailEvent ? { kind: "event", event: detailEvent } : null} onClose={() => setDetailEvent(null)} />
    </>
  );
}

function matchesKeyword(haystack: string, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  return !q || haystack.toLowerCase().includes(q);
}

export function ResultsTable<T extends { id: string }>({
  ariaLabel,
  columns,
  rows,
  typeField,
  typeOptions,
  emptyLabel,
  rowTextValue,
  searchText,
  viewActionLabel,
  showHeaderColumnCustomizer = false,
  onRowClick,
  size = "md",
}: {
  ariaLabel: string;
  columns: ColumnDef<T>[];
  rows: T[];
  /** Key of `T` whose value backs the sub-filter chip row - omitted when a table has no natural
   *  sub-type (none of the four tabs currently omit this, but the primitive doesn't require it). */
  typeField?: keyof T;
  typeOptions?: TypeFilterOption[];
  emptyLabel: string;
  rowTextValue: (row: T) => string;
  /** Plain-text haystack for the per-table search box - deliberately separate from whatever each
   *  column renders (a column can render a Badge or an icon, neither of which is text to search). */
  searchText: (row: T) => string;
  /** When set, adds a pinned column at the right edge of the table (`position: sticky; right: 0`,
   *  stays put on horizontal scroll) holding a real `Button` (`color="link-color"`) with this
   *  label, per row - opens the same row-detail side panel a row click already does (a real,
   *  working action, not a fake link to a page that doesn't exist per-row - see the caller for why
   *  this doesn't attempt real per-row navigation). Omit for a table with no such action. */
  viewActionLabel?: string;
  /** Moves the column-customiser trigger into a floating control over the table header. The
   *  control is positioned relative to the table card, outside the horizontal scroll container,
   *  so it remains at the visible right edge while the columns scroll beneath it. */
  showHeaderColumnCustomizer?: boolean;
  /** Overrides the row-click/"view action" behaviour - when set, a row click (or the pinned view
   *  action button) calls this instead of opening this table's own generic column-detail
   *  `SidePanel`. Used by the Projects/Events/Occurrences/Observations tabs to open the real,
   *  Figma-matched `RecordDetailSidebar` instead - the Resources/Artefacts tab has no such sidebar
   *  (no Figma frame documents one) and keeps the generic panel by omitting this prop. */
  onRowClick?: (row: T) => void;
  /** Row/header density. Defaults to "md" so every results tab matches the Projects page's own table. */
  size?: "xs" | "sm" | "md";
}) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.id)));
  const [activeType, setActiveTypeState] = useState<string>("all");
  const [keyword, setKeywordState] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<T | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(50);

  // A new filter/search/page-size invalidates whatever page the user was on - reset to 1
  // directly in these setters (not a `useEffect`, which would cost an extra render and risks the
  // "setState in effect" cascading-render lint this codebase avoids elsewhere) rather than only
  // relying on `currentPage`'s own clamping below, so a user narrowing a filter always lands back
  // on page 1 instead of an arbitrary clamped page from their previous filter.
  const setActiveType = (value: string) => {
    setActiveTypeState(value);
    setPage(1);
  };
  const setKeyword = (value: string) => {
    setKeywordState(value);
    setPage(1);
  };
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  const typeCounts = useMemo(() => {
    if (!typeField) return null;
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = String(row[typeField]);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return counts;
  }, [rows, typeField]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesType = !typeField || activeType === "all" || String(row[typeField]) === activeType;
        return matchesType && matchesKeyword(searchText(row), keyword);
      }),
    [rows, typeField, activeType, keyword, searchText],
  );

  // Real pagination over `filteredRows`, not cosmetic - `TableCard.PaginationNumbered` drives an
  // actual page slice, matching Figma's own numbered-pagination example exactly (node
  // I205:21340;195:10229;1396:59991;1:84675). `currentPage` clamps `page` down if a filter/page-
  // size change shrank the result set out from under a page the user was already past the end of -
  // derived here rather than reset via effect for the same reason the setters above avoid one.
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRows, currentPage, pageSize]);

  const visibleColumns = columns.filter((c) => visibleIds.has(c.id));

  // Appended after the toggleable data columns, never part of `columns` itself - see
  // `VIEW_ACTION_COLUMN_ID`'s own doc comment for why that keeps it out of "Customise columns" and
  // the row-detail panel. `bg-primary`/`bg-secondary` are required, not decorative - a sticky cell
  // needs its own opaque background or the columns scrolling underneath it show through.
  const renderColumns: ColumnDef<T>[] = viewActionLabel
    ? [
        ...visibleColumns,
        {
          id: VIEW_ACTION_COLUMN_ID,
          label: "",
          headerClassName: "sticky right-0 z-10 border-l border-secondary bg-secondary",
          cellClassName: "sticky right-0 z-10 border-l border-secondary bg-primary",
          render: (row) => (
            // Stops the click from bubbling to the row's own onAction (which would otherwise also
            // fire and re-open the same panel from a second event) - same defensive stopPropagation
            // pattern already used for HierarchyCell's buttons and the Resources tab's link cell.
            <div onClick={(e) => e.stopPropagation()}>
              <Button color="link-color" size="sm" onPress={() => (onRowClick ? onRowClick(row) : setDetailRow(row))}>
                {viewActionLabel}
              </Button>
            </div>
          ),
        },
      ]
    : visibleColumns;

  const toggleColumn = (id: string, checked: boolean) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    // h-full min-h-0 - lets this whole table (toolbar + rows + pagination) size itself to a
    // bounded-height flex ancestor instead of growing to its full content height; paired with
    // `flex-1 min-h-0` below on just the table region so only the rows scroll internally while the
    // chip row/search box above and the pagination footer below stay fixed on screen. Flagged
    // directly by the user: the table's own height was pushing the whole page taller than the
    // viewport instead of scrolling internally.
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Sub-type filter chip row - a bespoke Figma pattern ("_Tab button base" + a "Badge"
          instance for the count), not the real Button component in either colour variant, so
          built from raw tokens rather than bending Button's secondary/tertiary styling to fit.
          get_design_context on the chip row itself (I205:21340;195:10229;1396:59991;195:9701)
          confirmed: selected = a boxed pill (bg-primary_alt, border-primary, shadow-xs, rounded-md,
          36px tall, text-brand-secondary), unselected = no box at all (rounded-sm, text-quaternary)
          - both semibold, the weight never changes, only colour/box does. The count itself is a
          real Badge-shaped pill (bg/border/text = the same utility-neutral-50/200/700 trio this
          codebase's own `CountBadge` already uses for this exact purpose), built inline rather than
          via `CountBadge` since that component is a fixed-size circle (no border, `size-5`) while
          Figma's version is a content-width pill with a border - a real, if small, shape
          difference worth keeping accurate here.
          Every chip keeps the *same* box model at all times (h-9, rounded-md, a 1px border, px-3
          py-2) regardless of selection - only border/background colour and shadow toggle, never a
          size/padding/border-width value. Figma's own unselected chips are literally smaller
          (rounded-sm, no border, tighter px-2 py-1) than its selected one - copying that literally
          means every chip's own box changes size the moment it's selected, which reflows every
          chip after it in the row (and can shift the row's own height) exactly like the metrics
          tab row's border-width bug fixed earlier - flagged directly by the user off a screenshot
          of this exact row. Same fix shape as that one: reserve the larger, "selected" box size
          unconditionally and vary only what doesn't affect layout. */}
      {typeField && typeOptions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveType("all")}
            className={cx(
              "h-9 shrink-0 rounded-md border px-3 py-2 text-sm font-semibold whitespace-nowrap",
              activeType === "all" ? "border-primary bg-primary_alt text-brand-secondary shadow-xs" : "border-transparent text-quaternary",
            )}
          >
            All
          </button>
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = activeType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveType(opt.value)}
                className={cx(
                  "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold whitespace-nowrap",
                  active ? "border-primary bg-primary_alt text-brand-secondary shadow-xs" : "border-transparent text-quaternary",
                )}
              >
                {Icon && <Icon className="size-5 shrink-0" />}
                {opt.label}
                <span className="inline-flex items-center rounded-full border border-utility-neutral-200 bg-utility-neutral-50 px-2 py-0.5 text-xs font-medium text-utility-neutral-700">
                  {typeCounts?.get(opt.value) ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <Input icon={SearchLg} placeholder="Search" value={keyword} onChange={setKeyword} className="flex-1" />
        {!showHeaderColumnCustomizer && (
          <Tooltip title="Customise columns">
            <TooltipTrigger onPress={() => setCustomizeOpen(true)} aria-label="Customise columns" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-primary">
              <Sliders01 className="size-4" />
            </TooltipTrigger>
          </Tooltip>
        )}
      </div>

      {/* min-h-0 flex-1 - takes exactly the space left over after the chip row/search box above,
          so the table region below (and, via `bodyScrollable`, its rows specifically) scrolls
          internally instead of growing the whole page taller than the viewport. */}
      <div className="min-h-0 flex-1">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-secondary bg-secondary p-12 text-center">
            <p className="text-sm font-medium text-primary">No {emptyLabel} found</p>
            <p className="max-w-sm text-sm text-tertiary">Try a different filter, or clear the search box above.</p>
          </div>
        ) : (
          // size on TableCard.Root, not just on <Table> below - TableRoot's own context provider
          // prefers an ancestor's size over its own prop (`context?.size ?? size`), so the card's
          // size is the one that counts. h-full min-h-0 flex flex-col - lets
          // the card fill this section's own bounded height, with the middle (`Table`, via its own
          // `bodyScrollable` prop) taking the remaining space and scrolling internally while the
          // pagination footer stays put at the bottom.
          <TableCard.Root size={size} className="relative flex h-full min-h-0 flex-col">
            {/* react-aria's Table requires the *dynamic columns* collection API (a `columns` prop
                plus function children, on both Header and every Row) whenever the column set can
                change at runtime, as it does here via "customise columns" - a static list of
                `<Table.Head>`/`<Table.Cell>` children (fine for every other table in this codebase,
                none of which ever change their own column count) throws "Cell count must match
                column count" the moment a checkbox toggles the set, since the header and each row
                built their static children independently instead of from one shared collection.
                Even with that API used correctly (as below), react-aria's own Collection still
                caches a row's rendered cells keyed by item identity and doesn't reliably re-run a
                row's render function just because the *external* `columns` prop changed underneath
                it - confirmed live (the same "cell count" crash still fired on toggle). The `key`
                below sidesteps that entirely: a change to the visible-column set remounts the whole
                `<Table>` fresh, so header and every row are always built together from the same
                column list in the same pass - simple and robust, and cheap at this table's real row
                counts (a dozen-odd rows, not thousands). */}
            <Table aria-label={ariaLabel} key={renderColumns.map((c) => c.id).join(",")} bodyScrollable>
              <Table.Header columns={renderColumns} sticky>
                {(col) => (
                  // `label`/`tooltip` (not children) - Table.Head's own built-in props already
                  // render the exact "text-xs font-semibold text-quaternary" header styling Figma
                  // specifies (get_design_context on 205:21180) plus a matching "?" tooltip icon;
                  // reimplementing that by hand here previously produced plain, oversized black text
                  // with no header styling applied at all. `aria-label` on the pinned action
                  // column since it has no visible label text of its own to announce.
                  <Table.Head
                    id={col.id}
                    label={col.label}
                    tooltip={col.headerTooltip}
                    isRowHeader={col.id === visibleColumns[0]?.id}
                    className={col.headerClassName}
                    aria-label={col.id === VIEW_ACTION_COLUMN_ID ? "Actions" : undefined}
                  />
                )}
              </Table.Header>
              <Table.Body items={pagedRows}>
                {(row) => (
                  <Table.Row
                    id={row.id}
                    columns={renderColumns}
                    textValue={rowTextValue(row)}
                    className="cursor-pointer"
                    showLastRowBorder
                    onAction={() => (onRowClick ? onRowClick(row) : setDetailRow(row))}
                  >
                    {(col: ColumnDef<T>) => <Table.Cell className={col.cellClassName}>{col.render(row)}</Table.Cell>}
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            {showHeaderColumnCustomizer && (
              <Tooltip title="Customise columns">
                <TooltipTrigger
                  onPress={() => setCustomizeOpen(true)}
                  aria-label="Customise columns"
                  className="absolute top-px right-px z-30 flex size-8 items-center justify-center rounded-xs bg-secondary text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-tertiary hover:text-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <Columns03 className="size-5" />
                </TooltipTrigger>
              </Tooltip>
            )}
            <TableCard.PaginationNumbered
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalCount={filteredRows.length}
              className="shrink-0"
            />
          </TableCard.Root>
        )}
      </div>

      <SidePanel isOpen={customizeOpen} onOpenChange={setCustomizeOpen} title="Customise columns">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-tertiary">Choose which columns appear in this table.</p>
          {columns.map((col) => (
            <Checkbox key={col.id} label={col.label} isSelected={visibleIds.has(col.id)} onChange={(checked) => toggleColumn(col.id, checked)} />
          ))}
        </div>
      </SidePanel>

      <SidePanel isOpen={detailRow != null} onOpenChange={(open) => !open && setDetailRow(null)} title={detailRow ? rowTextValue(detailRow) : "Details"}>
        {detailRow && (
          <dl className="flex flex-col gap-4">
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col gap-1">
                <dt className="text-xs font-semibold tracking-wide text-quaternary uppercase">{col.label}</dt>
                <dd className="text-sm text-primary">{col.render(detailRow)}</dd>
              </div>
            ))}
          </dl>
        )}
      </SidePanel>
    </div>
  );
}

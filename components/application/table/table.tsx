"use client";

import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { createContext, isValidElement, useContext, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ChevronSelectorVertical, Copy01, Edit01, HelpCircle, Trash01 } from "@untitledui/icons";
import type {
    CellProps as AriaCellProps,
    ColumnProps as AriaColumnProps,
    RowProps as AriaRowProps,
    SortDescriptor,
    TableHeaderProps as AriaTableHeaderProps,
    TableProps as AriaTableProps,
} from "react-aria-components";
import {
    Cell as AriaCell,
    Collection as AriaCollection,
    Column as AriaColumn,
    Group as AriaGroup,
    Row as AriaRow,
    Table as AriaTable,
    TableBody as AriaTableBody,
    TableHeader as AriaTableHeader,
    useTableOptions,
} from "react-aria-components";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { NativeSelect } from "@/components/base/select/select-native";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

export const TableRowActionsDropdown = () => (
    <Dropdown.Root>
        <Dropdown.DotsButton />

        <Dropdown.Popover className="w-min">
            <Dropdown.Menu>
                <Dropdown.Item icon={Edit01}>
                    <span className="pr-4">Edit</span>
                </Dropdown.Item>
                <Dropdown.Item icon={Copy01}>
                    <span className="pr-4">Copy link</span>
                </Dropdown.Item>
                <Dropdown.Item icon={Trash01}>
                    <span className="pr-4">Delete</span>
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown.Popover>
    </Dropdown.Root>
);

// "xs" - a third, denser size beyond the existing "sm"/"md" - matches the dense results-table
// pattern from Figma's "Home - Landing Page" file (node 205:20764 -> I205:21340;195:10229;
// 1396:59991): a 34px header row, a 44px body row, and 12px/10px cell padding, none of which
// "sm" (36px/56px, 20px/12px) or "md" (44px/72px, 24px/16px) already covered. Used by the map
// search results table (app/pages/_shared/map-search/results-table.tsx) - a real, reusable size
// option, not a one-off override, since any other page needing this same dense table pattern
// should reach for it instead of re-deriving the same pixel values inline.
const TableContext = createContext<{ size: "xs" | "sm" | "md" }>({ size: "md" });

const TableCardRoot = ({ children, className, size = "md", ...props }: HTMLAttributes<HTMLDivElement> & { size?: "xs" | "sm" | "md" }) => {
    return (
        <TableContext.Provider value={{ size }}>
            <div {...props} className={cx("font-barlow overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary", className)}>
                {children}
            </div>
        </TableContext.Provider>
    );
};

interface TableCardHeaderProps {
    /** The title of the table card header. */
    title: string;
    /** The badge displayed next to the title. */
    badge?: ReactNode;
    /** The description of the table card header. */
    description?: string;
    /** The content displayed after the title and badge. */
    contentTrailing?: ReactNode;
    /** The class name of the table card header. */
    className?: string;
}

const TableCardHeader = ({ title, badge, description, contentTrailing, className }: TableCardHeaderProps) => {
    const { size } = useContext(TableContext);

    return (
        <div
            className={cx(
                "relative flex flex-col items-start gap-4 border-b border-secondary bg-primary px-4 md:flex-row",
                size === "sm" ? "py-4 md:px-5" : "py-5 md:px-6",
                className,
            )}
        >
            <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    {/*
                     * `!` overrides win over the docs site's unlayered `.prose-doc h2` rule
                     * (font-size 20px, 48px/12px top/bottom margin) that would otherwise bleed
                     * into this card title whenever the table renders inside a doc page. Also
                     * using `text-lg` here, not the `text-md` every other component in this repo
                     * reaches for - `--text-md` is never defined in app/globals.css, so `text-md`
                     * compiles to no CSS at all sitewide (a separate, pre-existing gap; flagged,
                     * not fixed here since it's a much larger sweep than this one header).
                     */}
                    <h2 className="m-0! text-lg! font-semibold! tracking-normal! text-primary!">{title}</h2>
                    {badge ? (
                        isValidElement(badge) ? (
                            badge
                        ) : (
                            <Badge
                                color="gray"
                                size="sm"
                                // Badge's own `sm` padding (py-1.5/px-2) is tuned for text labels - fine
                                // when content is naturally wider than tall regardless. A short row
                                // count (e.g. "2") needs less vertical padding to avoid rendering as a
                                // tall oval instead of a near-circle; min-w-5 keeps it round for one
                                // digit while still growing for longer content like "100 users".
                                className="min-w-5 justify-center py-1"
                            >
                                {badge}
                            </Badge>
                        )
                    ) : null}
                </div>
                {description && <p className="text-sm text-tertiary">{description}</p>}
            </div>
            {contentTrailing}
        </div>
    );
};

interface TableRootProps extends AriaTableProps, Omit<ComponentPropsWithRef<"table">, "className" | "slot" | "style"> {
    size?: "xs" | "sm" | "md";
    /** When true, the table's own scroll wrapper also scrolls vertically (in addition to its
     *  existing horizontal scroll) and grows to fill a bounded-height flex ancestor
     *  (`flex-1 min-h-0`), instead of always growing to its full content height. Off by default -
     *  every existing consumer keeps its current "grows with content, page scrolls" behaviour;
     *  opt in only when a caller has already constrained the table's own container to a fixed
     *  height and wants an internal scrollbar instead (see the map search results table, which
     *  needs the toolbar/pagination to stay on-screen while only the rows scroll). Pair with
     *  `Table.Header`'s own `sticky` prop so the header stays visible above the scrolling rows. */
    bodyScrollable?: boolean;
    /** `"fixed"` lays the columns out from the header row alone, so a column keeps its width whatever
     *  rows are showing. The default, `"auto"`, sizes every column to its widest cell, which makes the
     *  whole table reflow when a filter, a search, a sort or the next page brings a longer value (or a
     *  second line) into a column. Every collection table (one a person filters, sorts or pages) is
     *  `"fixed"`. Give EVERY column a width on its `Table.Head` (`className="w-44"`): the widest value that
     *  column can hold, padding included. A column left without one does not share what is left (the
     *  browser leaves a gap), and when the window is wider than the widths add up the extra is shared in
     *  proportion, while a narrower window scrolls the table sideways. A fixed table needs cells that wrap
     *  or truncate. */
    layout?: "auto" | "fixed";
}

/**
 * Sorting cycles through three states per column: the first click sorts one way, the second the
 * other way, and the third resets the table to the sort it opened with (its default, for example
 * Updated, newest first). react-aria only flips between the two directions, which left no way back
 * to the default. The default is the `sortDescriptor` the table was first given, so no caller
 * passes anything extra. A column that is itself the default just flips, since resetting it would
 * change nothing.
 */
function useSortWithReset(sortDescriptor: SortDescriptor | undefined, onSortChange: ((descriptor: SortDescriptor) => void) | undefined) {
    const initial = useRef(sortDescriptor);
    // The direction each column was first sorted in, so its third click can be recognised.
    const firstDirection = useRef<{ column: SortDescriptor["column"]; direction: SortDescriptor["direction"] } | null>(
        sortDescriptor ? { column: sortDescriptor.column, direction: sortDescriptor.direction } : null,
    );
    if (!onSortChange) return undefined;
    return (next: SortDescriptor) => {
        const sameColumn = sortDescriptor?.column === next.column;
        if (!sameColumn || !firstDirection.current || firstDirection.current.column !== next.column) {
            firstDirection.current = { column: next.column, direction: next.direction };
            onSortChange(next);
            return;
        }
        const backToFirst = next.direction === firstDirection.current.direction;
        const isDefaultColumn = initial.current?.column === next.column;
        if (backToFirst && !isDefaultColumn && initial.current) {
            firstDirection.current = { column: initial.current.column, direction: initial.current.direction };
            onSortChange(initial.current);
            return;
        }
        onSortChange(next);
    };
}

const TableRoot = ({ className, size = "md", bodyScrollable, layout = "auto", sortDescriptor, onSortChange, ...props }: TableRootProps) => {
    const context = useContext(TableContext);
    const handleSortChange = useSortWithReset(sortDescriptor, onSortChange);

    return (
        <TableContext.Provider value={{ size: context?.size ?? size }}>
            {/* A scrolling table reserves its scrollbar's space, so the columns are the same width whether or not the rows
                overflow (a list that scrolls beside one that does not, All and My). No cost where scrollbars overlay. */}
            <div className={cx("overflow-x-auto", bodyScrollable && "min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]")}>
                <AriaTable
                    className={(state) => cx("font-barlow w-full overflow-x-hidden", layout === "fixed" && "table-fixed", typeof className === "function" ? className(state) : className)}
                    sortDescriptor={sortDescriptor}
                    onSortChange={handleSortChange}
                    {...props}
                />
            </div>
        </TableContext.Provider>
    );
};
TableRoot.displayName = "Table";

interface TableHeaderProps<T extends object>
    extends AriaTableHeaderProps<T>, Omit<ComponentPropsWithRef<"thead">, "children" | "className" | "slot" | "style"> {
    bordered?: boolean;
    size?: "xs" | "sm" | "md";
    /** Pairs with `Table`'s own `bodyScrollable` - pins the header to the top of that scrolling
     *  wrapper (`sticky top-0`) so column labels stay visible while only the body rows scroll. Off
     *  by default; a no-op for any table that isn't inside a scrolling ancestor. */
    sticky?: boolean;
}

const TableHeader = <T extends object>({ columns, children, bordered = true, sticky, className, size: sizeProp, ...props }: TableHeaderProps<T>) => {
    const context = useContext(TableContext);
    const { selectionBehavior, selectionMode } = useTableOptions();

    const size = sizeProp ?? context.size;

    return (
        <AriaTableHeader
            {...props}
            className={(state) =>
                cx(
                    "relative bg-secondary",
                    size === "xs" ? "h-[34px]" : size === "sm" ? "h-9" : "h-11",
                    sticky && "sticky top-0 z-10",

                    // Row border—using an "after" pseudo-element to avoid the border taking up space.
                    bordered &&
                        "[&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-[var(--ui-border-secondary)] [&>tr>th]:focus-visible:after:bg-transparent",

                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {selectionBehavior === "toggle" && (
                <AriaColumn className={cx("relative py-2 pr-0 pl-4", size === "sm" ? "w-9 md:pl-5" : "w-11 md:pl-6")}>
                    {selectionMode === "multiple" && (
                        <div className="flex items-start">
                            <Checkbox slot="selection" size="md" />
                        </div>
                    )}
                </AriaColumn>
            )}
            <AriaCollection items={columns}>{children}</AriaCollection>
        </AriaTableHeader>
    );
};

TableHeader.displayName = "TableHeader";

interface TableHeadProps extends AriaColumnProps, Omit<ThHTMLAttributes<HTMLTableCellElement>, "children" | "className" | "style" | "id"> {
    label?: string;
    tooltip?: string;
}

const TableHead = ({ className, tooltip, label, children, ...props }: TableHeadProps) => {
    const { size } = useContext(TableContext);
    const { selectionBehavior } = useTableOptions();

    return (
        <AriaColumn
            {...props}
            className={(state) =>
                cx(
                    "relative p-0 py-2 outline-hidden focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
                    size === "xs" ? "px-3" : "px-6",
                    selectionBehavior === "toggle" && "nth-2:pl-3",
                    state.allowsSorting && "cursor-pointer",
                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {(state) => (
                <AriaGroup className="flex items-center gap-1">
                    {/* The header text style sits on this wrapper, not just the `label` span, so header text passed
                        as children gets the same treatment - it used to render as unstyled bold black text. */}
                    <div className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-quaternary">
                        {label && <span>{label}</span>}
                        {typeof children === "function" ? children(state) : children}
                    </div>

                    {tooltip && (
                        <Tooltip title={tooltip} placement="top">
                            <TooltipTrigger className="cursor-pointer text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover">
                                <HelpCircle className="size-4" />
                            </TooltipTrigger>
                        </Tooltip>
                    )}

                    {state.allowsSorting &&
                        (state.sortDirection ? (
                            <ArrowDown className={cx("size-3 stroke-[3px] text-fg-quaternary", state.sortDirection === "ascending" && "rotate-180")} />
                        ) : (
                            <ChevronSelectorVertical size={12} strokeWidth={3} className="text-fg-quaternary" />
                        ))}
                </AriaGroup>
            )}
        </AriaColumn>
    );
};
TableHead.displayName = "TableHead";

interface TableRowProps<T extends object>
    extends AriaRowProps<T>, Omit<ComponentPropsWithRef<"tr">, "children" | "className" | "onClick" | "slot" | "style" | "id"> {
    highlightSelectedRow?: boolean;
    /** Keep the final row divider visible. By default it is hidden so a table card's outer edge
     *  provides the final boundary without drawing a second line. */
    showLastRowBorder?: boolean;
    size?: "xs" | "sm" | "md";
}

const TableRow = <T extends object>({ columns, children, className, highlightSelectedRow = true, showLastRowBorder = false, size: sizeProp, ...props }: TableRowProps<T>) => {
    const context = useContext(TableContext);
    const { selectionBehavior } = useTableOptions();

    const size = sizeProp ?? context.size;

    return (
        <AriaRow
            {...props}
            className={(state) =>
                cx(
                    "relative outline-focus-ring transition-colors after:pointer-events-none hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2",
                    size === "xs" ? "h-11" : size === "sm" ? "h-14" : "h-18",
                    // "selected:" is the tailwindcss-react-aria-components plugin variant, which isn't
                    // registered in app/globals.css (only in the unused styles/globals.css) - "aria-selected:"
                    // is a core Tailwind variant that reads the same attribute React Aria sets, no plugin needed.
                    highlightSelectedRow && "aria-selected:bg-secondary",

                    // Row border—using an "after" pseudo-element to avoid the border taking up space.
                    "[&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full [&>td]:after:bg-[var(--ui-border-secondary)] [&>td]:focus-visible:after:opacity-0 focus-visible:[&>td]:after:opacity-0",
                    !showLastRowBorder && "last:[&>td]:after:hidden",

                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {selectionBehavior === "toggle" && (
                <AriaCell className={cx("relative py-2 pr-0 pl-4", size === "sm" ? "md:pl-5" : "md:pl-6")}>
                    <div className="flex items-end">
                        <Checkbox slot="selection" size="md" />
                    </div>
                </AriaCell>
            )}
            <AriaCollection items={columns}>{children}</AriaCollection>
        </AriaRow>
    );
};

TableRow.displayName = "TableRow";

interface TableCellProps extends AriaCellProps, Omit<TdHTMLAttributes<HTMLTableCellElement>, "children" | "className" | "style" | "id"> {
    ref?: Ref<HTMLTableCellElement>;
    size?: "xs" | "sm" | "md";
}

const TableCell = ({ className, children, size: sizeProp, ...props }: TableCellProps) => {
    const context = useContext(TableContext);
    const { selectionBehavior } = useTableOptions();

    const size = sizeProp ?? context.size;

    return (
        <AriaCell
            {...props}
            className={(state) =>
                cx(
                    "relative text-sm text-tertiary outline-focus-ring focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
                    size === "xs" && "px-3 py-2",
                    size === "sm" && "px-5 py-3",
                    size === "md" && "px-6 py-4",

                    selectionBehavior === "toggle" && "nth-2:pl-3",

                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {children}
        </AriaCell>
    );
};
TableCell.displayName = "TableCell";

interface TableCardPaginationProps {
    /** Current page, 1-indexed. */
    page: number;
    /** Total number of pages. */
    pageCount: number;
    onPageChange: (page: number) => void;
    className?: string;
}

/**
 * The simple "Page X of Y" + Previous/Next footer documented across every table example in
 * Figma's "Application Components" file (node 1:84599) - every one of them ships pagination, so
 * a table card without it was a real, missing piece of this component family, not a style tweak.
 * Doesn't include the richer numbered-page variant (1 2 3 … 8 9 10) some of those examples show -
 * that's a bigger, separate component; logged rather than built speculatively here.
 */
const TableCardPagination = ({ page, pageCount, onPageChange, className }: TableCardPaginationProps) => (
    <div className={cx("flex items-center justify-between border-t border-secondary px-4 py-3 md:px-6", className)}>
        <p className="text-sm text-tertiary tabular-nums">
            Page {page} of {pageCount}
        </p>
        <div className="flex gap-3">
            <Button color="secondary" size="sm" iconLeading={ArrowLeft} isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}>
                Previous
            </Button>
            <Button color="secondary" size="sm" iconTrailing={ArrowRight} isDisabled={page >= pageCount} onPress={() => onPageChange(page + 1)}>
                Next
            </Button>
        </div>
    </div>
);

/** Builds the page-number list `TableCardPaginationNumbered` renders, always showing the first 3
 *  and last 3 pages with a single "ellipsis" gap between - matching Figma's own example exactly
 *  ("1 2 3 … 8 9 10" for page 1 of 10, node I205:21340;195:10229;1396:59991;1:84675). When the
 *  current page falls outside both of those fixed boundaries, it's inserted in the middle with an
 *  ellipsis on each side (e.g. "1 2 3 … 6 … 8 9 10"). Exported for its own sake - a caller with an
 *  unusual pagination need can build a custom list from this same logic. */
export function tableCardPaginationRange(page: number, pageCount: number): (number | "ellipsis")[] {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const leading = [1, 2, 3];
    const trailing = [pageCount - 2, pageCount - 1, pageCount];
    if (leading.includes(page) || trailing.includes(page)) return [...leading, "ellipsis", ...trailing];
    if (page - 1 <= 4) return [...leading, page, "ellipsis", ...trailing];
    if (pageCount - page <= 4) return [...leading, "ellipsis", page, ...trailing];
    return [...leading, "ellipsis", page, "ellipsis", ...trailing];
}

interface TableCardPaginationNumberedProps {
    /** Current page, 1-indexed. */
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    /** Rows shown per page - drives the "Rows per page" control and the "X - Y of Z" summary. */
    pageSize: number;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
    /** Total row count across every page - the "of Z" in "X - Y of Z". */
    totalCount: number;
    className?: string;
}

/**
 * The richer numbered-page footer some Figma table examples show ("Rows per page [50] |
 * ← Previous | 1 2 3 … 8 9 10 | Next → | 1-50 of 250", node
 * I205:21340;195:10229;1396:59991;1:84675, the map search results table's own reference) -
 * previously logged as "a bigger, separate component, not built speculatively" in this codebase's
 * own working notes; built once a real consumer (the map search results table) actually needed it
 * to match Figma exactly, rather than ahead of time. Kept as a genuinely separate component from
 * `TableCardPagination` (the simple "Page X of Y" version) rather than replacing it - every
 * existing consumer of the simple version keeps working unchanged.
 * The "Rows per page" control is the real `NativeSelect` at its small size, so it has the design system's field
 * height, border, radius and chevron like every other select (it was a raw `<select>` with its own tiny styling,
 * which looked cramped beside the Previous button and let a value run under the chevron).
 */
const TableCardPaginationNumbered = ({ page, pageCount, onPageChange, pageSize, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100], totalCount, className }: TableCardPaginationNumberedProps) => {
    const range = tableCardPaginationRange(page, Math.max(pageCount, 1));
    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalCount);

    return (
        // Three columns, the middle one the page numbers: `1fr auto 1fr` keeps them centred whatever the two sides hold, where
        // flexible spacers of unequal neighbours slid them sideways as the range text changed ("1 - 4 of 4", "51 - 100 of 1,234").
        // Every figure is tabular (`tabular-nums`), so a digit is the same width whichever digit it is.
        <div className={cx("grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-secondary px-6 py-3", className)}>
            <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium text-secondary whitespace-nowrap">Rows per page</span>
                    <NativeSelect
                        size="sm"
                        aria-label="Rows per page"
                        value={String(pageSize)}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        options={pageSizeOptions.map((size) => ({ label: String(size), value: String(size) }))}
                        className="w-20 tabular-nums"
                    />
                </div>
                <Button color="secondary" size="md" iconLeading={ArrowLeft} isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}>
                    Previous
                </Button>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                {range.map((item, i) =>
                    item === "ellipsis" ? (
                        <span key={`ellipsis-${i}`} className="flex size-10 shrink-0 items-center justify-center text-sm font-medium text-quaternary">
                            …
                        </span>
                    ) : (
                        <button
                            key={item}
                            type="button"
                            onClick={() => onPageChange(item)}
                            aria-current={item === page ? "page" : undefined}
                            className={cx(
                                "flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-medium tabular-nums outline-focus-ring",
                                item === page ? "bg-primary_hover text-secondary" : "text-quaternary hover:bg-primary_hover",
                            )}
                        >
                            {item}
                        </button>
                    ),
                )}
            </div>

            <div className="flex items-center justify-end gap-3">
                <Button color="secondary" size="md" iconTrailing={ArrowRight} isDisabled={page >= pageCount} onPress={() => onPageChange(page + 1)}>
                    Next
                </Button>
                {/* A fixed minimum width, right-aligned, so Next does not move as the range grows from "1 - 4 of 4" to "51 - 100 of 1,234". */}
                <span className="min-w-32 text-right text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                    {rangeStart} - {rangeEnd} of {totalCount}
                </span>
            </div>
        </div>
    );
};

const TableCard = {
    Root: TableCardRoot,
    Header: TableCardHeader,
    Pagination: TableCardPagination,
    PaginationNumbered: TableCardPaginationNumbered,
};

const Table = TableRoot as typeof TableRoot & {
    Body: typeof AriaTableBody;
    Cell: typeof TableCell;
    Head: typeof TableHead;
    Header: typeof TableHeader;
    Row: typeof TableRow;
};
Table.Body = AriaTableBody;
Table.Cell = TableCell;
Table.Head = TableHead;
Table.Header = TableHeader;
Table.Row = TableRow;

export { Table, TableCard };

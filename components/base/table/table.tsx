"use client";

import {
    Cell as AriaCell,
    Column as AriaColumn,
    Row as AriaRow,
    Table as AriaTable,
    TableBody as AriaTableBody,
    TableHeader as AriaTableHeader,
    type CellProps,
    type ColumnProps,
    type RowProps,
    type TableBodyProps,
    type TableHeaderProps,
    type TableProps,
} from "react-aria-components";
import { cx } from "@/utils/cx";

// A real table primitive - react-aria's Table/TableHeader/Column/TableBody/Row/Cell, styled to
// match the actual Untitled UI table conventions in components/application/table/table.tsx
// (the CLI-pulled reference): a shaded, sentence-case header - not uppercase - row borders via an
// `after` pseudo-element so they don't take up layout space, `text-tertiary` body text with
// `text-primary` reserved for the cell a caller explicitly promotes (e.g. a name column), and the
// same `outline-focus-ring` token every other focusable component in this system uses. Use this
// for a plain list; reach for `components/application/table/table.tsx` when you need row
// selection, sorting, or the TableCard chrome.
//
// Each wrapper's className resolves the function-or-string form react-aria's render-prop
// components accept (same pattern as components/application/modals/modal.tsx) before merging with
// this component's own base classes via `cx`, which only accepts strings.
export function Table({ className, ...props }: TableProps) {
    return (
        <AriaTable {...props} className={(state) => cx("font-barlow w-full text-left", typeof className === "function" ? className(state) : className)} />
    );
}

export function TableHeader<T extends object>({ className, ...props }: TableHeaderProps<T>) {
    return (
        <AriaTableHeader
            {...props}
            className={(state) =>
                cx(
                    "relative bg-secondary",
                    // Row border - using an "after" pseudo-element so it doesn't take up layout space.
                    "[&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-[var(--ui-border-secondary)] [&>tr>th]:focus-visible:after:bg-transparent",
                    typeof className === "function" ? className(state) : className,
                )
            }
        />
    );
}

export function Column({ className, ...props }: ColumnProps) {
    return (
        <AriaColumn
            {...props}
            className={(state) =>
                cx(
                    "relative px-6 py-2 text-left text-xs font-semibold whitespace-nowrap text-quaternary outline-hidden first:pl-6 last:pr-6",
                    "focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
                    state.allowsSorting && "cursor-pointer",
                    typeof className === "function" ? className(state) : className,
                )
            }
        />
    );
}

export function TableBody<T extends object>({ className, ...props }: TableBodyProps<T>) {
    return <AriaTableBody {...props} className={(state) => cx(typeof className === "function" ? className(state) : className)} />;
}

export function Row<T extends object>({ className, ...props }: RowProps<T>) {
    return (
        <AriaRow
            {...props}
            className={(state) =>
                cx(
                    "group relative outline-focus-ring transition-colors duration-100 ease-linear hover:bg-secondary aria-selected:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 data-[href]:cursor-pointer",
                    // Row border - using an "after" pseudo-element so it doesn't take up layout space.
                    "[&>td]:after:pointer-events-none [&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:bg-[var(--ui-border-secondary)] last:[&>td]:after:hidden [&>td]:focus-visible:after:opacity-0",
                    typeof className === "function" ? className(state) : className,
                )
            }
        />
    );
}

export function Cell({ className, ...props }: CellProps) {
    return (
        <AriaCell
            {...props}
            className={(state) =>
                cx(
                    "relative px-6 py-4 align-top text-sm text-tertiary outline-hidden first:pl-6 last:pr-6 focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
                    typeof className === "function" ? className(state) : className,
                )
            }
        />
    );
}

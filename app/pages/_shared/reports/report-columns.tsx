"use client";

import { Clamped, IdCell, NumberCell, TextCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";

// Builders for a report's columns. A column built here also says how it reads as plain text (`text`), which is what the export
// (Export CSV, Export XLSX; report-export.tsx) writes, so the file carries exactly what the table shows.
// The cells are the ones report-table.tsx defines; nothing here sets a type style of its own.

export interface ViewColumn<R> extends ReportColumn<R> {
  /** The cell as plain text: what the export writes. */
  text: (row: R) => string;
}

// Column widths, as static classes so Tailwind sees them: wide enough for the longest value on one line.
export const REPORT_WIDTH = {
  xs: "w-[88px]",
  sm: "w-[120px]",
  md: "w-[160px]",
  lg: "w-[216px]",
  xl: "w-[288px]",
  xxl: "w-[360px]",
} as const;

export type ReportWidth = (typeof REPORT_WIDTH)[keyof typeof REPORT_WIDTH];

interface ColumnOptions {
  sticky?: boolean;
  /** Not sortable (a column that is empty for every row, or a relative time). */
  noSort?: boolean;
}

/** A column of plain text, sorted as text, written to the CSV as it reads. */
export function textColumn<R>(id: string, label: string, width: ReportWidth, get: (row: R) => string | undefined, options: ColumnOptions & { strong?: boolean; clamp?: boolean } = {}): ViewColumn<R> {
  const text = (row: R) => get(row) ?? "";
  return {
    id,
    label,
    width,
    sticky: options.sticky,
    sort: options.noSort ? undefined : text,
    cell: options.clamp ? (row) => <Clamped text={text(row)} /> : (row) => <TextCell strong={options.strong}>{text(row)}</TextCell>,
    text,
  };
}

/** A column that is empty for every row because the app holds no such value. It still has its place in the table. */
export function emptyColumn<R>(id: string, label: string, width: ReportWidth): ViewColumn<R> {
  return { id, label, width, cell: () => null, text: () => "" };
}

/** A row's identifier: medium weight, tabular. */
export function idColumn<R>(id: string, label: string, width: ReportWidth, get: (row: R) => string | undefined, options: ColumnOptions = {}): ViewColumn<R> {
  const text = (row: R) => get(row) ?? "";
  return { id, label, width, sticky: options.sticky, sort: options.noSort ? undefined : text, cell: (row) => <IdCell>{text(row)}</IdCell>, text };
}

/** A count or a figure: tabular, sorted as a number. */
export function numberColumn<R>(id: string, label: string, width: ReportWidth, get: (row: R) => number | string | undefined, options: ColumnOptions = {}): ViewColumn<R> {
  return {
    id,
    label,
    width,
    sticky: options.sticky,
    sort: options.noSort
      ? undefined
      : (row) => {
          const v = get(row);
          return v === undefined || v === "" ? null : typeof v === "number" ? v : Number.isNaN(Number(v)) ? v : Number(v);
        },
    cell: (row) => <NumberCell value={get(row)} />,
    text: (row) => {
      const v = get(row);
      return v === undefined ? "" : String(v);
    },
  };
}

import { isValidElement, type ReactNode } from "react";
import { Download01 } from "@untitledui/icons";
import { downloadCsv, downloadXlsx } from "@/app/pages/_shared/agreement-actions";
import type { RecordAction } from "@/app/pages/_shared/record-action-bar";
import type { ReportColumn } from "@/app/pages/_shared/reports/report-table";

// Export for every report (designer, 6 Oct 2026: "Three dot menu to export as CSV, XLSX"). `DataReport` builds the two actions
// from the report's own columns and the rows in view, so a report does not write its own export and cannot leave it out.
// A file carries exactly what the table shows: a column that knows its plain text says so (`text`, the builders in
// report-columns.tsx); one that does not is read from the cell it draws, the text and values its elements are given.

// The props a report's cells use for what they show: a value (`NumberCell`), text (`Clamped`), a scientific and a common name
// (`SpeciesCell`). Children are read as they are.
const SHOWN_PROPS = ["text", "value", "scientific", "common"] as const;

function shownText(node: ReactNode): string[] {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(shownText);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  const props = node.props;
  const own = SHOWN_PROPS.flatMap((key) => (typeof props[key] === "string" || typeof props[key] === "number" ? [String(props[key])] : []));
  return [...own, ...shownText(props.children as ReactNode)];
}

/** What a cell reads as plain text: the column's own `text`, else the text its cell shows. */
export function columnText<R>(column: ReportColumn<R>, row: R): string {
  return column.text ? column.text(row) : shownText(column.cell(row)).join(" ").replace(/\s+/g, " ").trim();
}

/** Export CSV and Export XLSX for the rows given, every column in the table's order. `baseName` is the file name without its extension. */
export function reportExportActions<R>(rows: R[], columns: ReportColumn<R>[], baseName: string): RecordAction[] {
  const table = () => ({ header: columns.map((c) => c.label), body: rows.map((r) => columns.map((c) => columnText(c, r))) });
  return [
    { id: "export-csv", label: "Export CSV", icon: Download01, onPress: () => downloadCsv(`${baseName}.csv`, table().header, table().body) },
    { id: "export-xlsx", label: "Export XLSX", icon: Download01, onPress: () => void downloadXlsx(`${baseName}.xlsx`, table().header, table().body) },
  ];
}

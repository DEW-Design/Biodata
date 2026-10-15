"use client";

import { useMemo } from "react";
import type { SortDescriptor } from "react-aria-components";
import { summariseFilter, type Attribute, type AttributeFilterApi } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { REPORT_WIDTH as W, idColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { SpeciesCell, type DataReportProps, type ReportFact } from "@/app/pages/_shared/reports/report-table";
import { TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";
import { TAXONOMY_SECTION_LABEL } from "@/lib/registered-user-nav";

// The one way a sheet of the Flora Taxonomy Report becomes a tab (taxonomy-report.tsx): what the sheet is (its title, columns, rows and the metadata
// above its columns) goes in, and the report's props come out.
//
// A sheet's metadata (Species Code & Name, NSX Code, Common Name, Family ... Date) is not a form of its own. Each line is what the table already has
// (the designer, 15 Oct 2026: "doesn't make sense to have two different search bars ... the table search already takes care of this. And filters
// too. I feel like parameters are doubling up"): a typed line (a code, a name, a common name) is the table's search, which matches them; a line that is
// chosen from a list (a family, a region, who created it) and the sheet's date are attributes of the one Filter menu (CONTRACTS 4.2d), with its
// presets, custom range and removable chips. The sheet's title and its metadata lines are still written above the columns of Export CSV and
// Export XLSX, read from the search and the filters in view. So a taxonomy sheet has no Parameters button (report-parameters.tsx is for what the
// search and the Filter cannot say: a project, a dataset).

/** A sheet's metadata as the search and the Filter. */
export interface FilterSpec<R> {
  /** The sheet's metadata lines in its order, as the export writes them. A line that is not a select or the date below is typed: the search covers it, and the export writes the search beside the first. */
  labels: string[];
  /** A line chosen from what the rows hold: an attribute of the Filter menu, named as the sheet names it. */
  selects: { id: string; label: string; get: (row: R) => string | string[]; searchable?: boolean }[];
  /** The sheet's date: the days a row carries, read by the date filter as the span from the earliest to the latest. A row with no day is not in a date range. */
  date?: { label: string; days: (row: R) => string[] };
}

const span = (days: string[]) => {
  if (days.length === 0) return null;
  const sorted = [...days].sort();
  return { start: Date.parse(`${sorted[0]}T00:00:00`), end: Date.parse(`${sorted[sorted.length - 1]}T23:59:59`) };
};

function specAttributes<R>(spec: FilterSpec<R>, rows: R[]): Attribute<R>[] {
  const selects = spec.selects.flatMap((s): Attribute<R>[] => {
    const options = optionsFromValues(rows.flatMap((r) => [s.get(r)].flat()));
    return options.length > 0 ? [{ id: s.id, kind: "options", label: s.label, options, get: s.get, searchable: s.searchable }] : [];
  });
  const date: Attribute<R>[] = spec.date ? [{ id: "date", kind: "date", label: spec.date.label, get: (r) => span(spec.date!.days(r)) }] : [];
  return [...selects, ...date];
}

/** The sheet's title, then each metadata line with what the search and the filters in view say for it (blank where nothing is set). */
function preambleFor<R>(title: string, spec: FilterSpec<R>, state: { search: string; filter: AttributeFilterApi<R> }): string[][] {
  const known = new Set([...spec.selects.map((s) => s.label), ...(spec.date ? [spec.date.label] : [])]);
  const firstTyped = spec.labels.find((l) => !known.has(l));
  return [
    [title],
    ...spec.labels.map((label): string[] => {
      if (label === firstTyped) return [label, state.search.trim()];
      const attribute = state.filter.attributes.find((a) => a.label === label && known.has(label));
      const applied = attribute ? state.filter.applied.find((f) => f.id === attribute.id) : undefined;
      if (!attribute || !applied) return [label, ""];
      if (attribute.kind === "options" && applied.value.kind === "options") {
        const flat = attribute.options.flatMap((o) => o.children ?? [o]);
        return [label, applied.value.ids.map((id) => flat.find((o) => o.id === id)?.label ?? id).join("; ")];
      }
      return [label, summariseFilter(attribute, applied.value)];
    }),
  ];
}

export interface SheetConfig<R> {
  /** The report's name and what it answers, in the hero: the Flora Taxonomy Report's, unless a report (the Fauna Taxonomy Report) gives its own. */
  reportTitle?: string;
  reportSubtitle?: string;
  /** The sheet's title, written on the first row of the exported file. */
  sheetTitle: string;
  spec: FilterSpec<R>;
  /** Every row the sheet holds. Memoised by the caller. */
  rows: R[];
  /** The one mock record the tab shows while it has no row (taxonomy-example-rows.ts). */
  example?: R;
  /** The facets the metadata does not cover (CONTRACTS 4.2d). Memoised by the caller. */
  attributes: Attribute<R>[];
  columns: ViewColumn<R>[];
  rowId: (row: R) => string;
  searchText: (row: R) => (string | undefined)[];
  searchPlaceholder: string;
  tableLabel: string;
  /** What a row is, plural, lower case. */
  noun: string;
  emptyDescription: string;
  initialSort: SortDescriptor;
  latest?: (row: R) => string | number | null | undefined;
  facts: (rowsInView: R[]) => ReportFact[];
  exportName: string;
}

export type SheetProps<R> = Omit<DataReportProps<R>, "belowHeader" | "wrapBody" | "resetKey">;

export function useSheetTab<R>(config: SheetConfig<R>): SheetProps<R> {
  const { rows, spec, sheetTitle } = config;
  const specAttrs = useMemo(() => specAttributes(spec, rows), [spec, rows]);
  const attributes = useMemo(() => [...specAttrs, ...config.attributes], [specAttrs, config.attributes]);
  return {
    title: config.reportTitle ?? TAXONOMY_REPORT_TITLE,
    subtitle: config.reportSubtitle ?? "The taxa BioData holds, one report for each view.",
    icon: sectionIcons[TAXONOMY_SECTION_LABEL],
    rows,
    example: config.example,
    rowId: config.rowId,
    columns: config.columns,
    attributes,
    searchText: config.searchText,
    searchLabel: "Search the report",
    searchPlaceholder: config.searchPlaceholder,
    tableLabel: config.tableLabel,
    noun: config.noun,
    emptyDescription: config.emptyDescription,
    initialSort: config.initialSort,
    latest: config.latest,
    facts: config.facts,
    exportName: config.exportName,
    exportPreamble: (state) => preambleFor(sheetTitle, spec, state),
  };
}

/** The first two columns of every sheet that is about a species: its NSX code, pinned when the table scrolls sideways, and its NSX description (the scientific name). */
export function nsxColumns<R extends { nsx: string; nsxDescription: string }>(): ViewColumn<R>[] {
  return [
    idColumn("nsx", "NSX code", W.sm, (r) => r.nsx, { sticky: true }),
    {
      id: "nsxDescription",
      label: "NSX description",
      width: W.lg,
      sort: (r) => r.nsxDescription,
      cell: (r) => <SpeciesCell scientific={r.nsxDescription} />,
      text: (r) => r.nsxDescription,
    },
  ];
}

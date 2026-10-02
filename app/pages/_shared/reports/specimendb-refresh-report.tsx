"use client";

import { useMemo } from "react";
import { Database01 } from "@untitledui/icons";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { formatIsoDay } from "@/app/pages/_shared/reports/ingestion-report-data";
import { Clamped, DataReport, IdCell, NumberCell, SpeciesCell, TextCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
import { DWC_TERMS, refreshRowsFor, type DwcTerm, type RefreshRow } from "@/app/pages/_shared/reports/specimendb-refresh-report-data";
import { useUserRole } from "@/lib/use-user-role";

// The SpecimenDB Refresh Report (Figma YMproGZfrFB5jUqPHPxMhk frame 1525:13940, columns list node 1532:15068): the
// batches of specimen records refreshed from SpecimenDB into BioData, in Darwin Core. All 93 of the wireframe's
// columns are here, in the wireframe's order, in a table that scrolls sideways: four batch columns, then the 89
// Darwin Core terms. Drawn with the shared report ledger (report-table.tsx), with these departures from the
// wireframe, on purpose:
//   - the 89 Darwin Core columns are generated from one list of terms (`DWC_TERMS`), each labelled with the
//     standard's own spelling (occurrenceID, not "Occurrence ID"); the four batch columns are in sentence case;
//   - the filters are the attribute filter ("Add filter"), as on the Data Ingestion Report, and "Additional filter"
//     is not built. The wireframe's typed filters (scientific name, NSX code, rego ID, NSL code) are the search box,
//     and NSX, rego and NSL are matched there without being columns, because they are not Darwin Core terms;
//   - Darwin Core dates are shown as the standard writes them (2026-08-12), not reformatted; the batch date is en-AU;
//   - a term the app holds no value for is empty, and so is every cell of a record SpecimenDB could not find;
//   - the wireframe's sample rows are Victorian and invented: these are the app's own specimens and species.

// A column's width follows the longer of its label (the label is bold and carries a sort icon) and its longest
// value, in characters. The classes are whole literals so Tailwind sees them.
const WIDTHS: [number, string][] = [
  [12, "w-[120px]"],
  [16, "w-[152px]"],
  [20, "w-[184px]"],
  [24, "w-[216px]"],
  [28, "w-[248px]"],
  [32, "w-[280px]"],
  [36, "w-[312px]"],
  [40, "w-[344px]"],
];
const widest = WIDTHS[WIDTHS.length - 1][1];
const widthFor = (chars: number) => (WIDTHS.find(([max]) => chars <= max) ?? [0, widest])[1];

/** The longest value a term takes, where it is longer than its label. */
const VALUE_CHARS: Partial<Record<DwcTerm, number>> = {
  rightsHolder: 35,
  recordedBy: 28,
  scientificName: 26,
  locality: 20,
  identifiedBy: 28,
  occurrenceRemarks: 34,
  georeferenceRemarks: 34,
  habitat: 34,
  catalogNumber: 16,
  stateProvince: 16,
};

/** Numbers and dates: shown tabular, and the numbers sort as numbers. */
const NUMERIC = new Set<DwcTerm>([
  "startDayOfYear", "year", "month", "day", "decimalLatitude", "decimalLongitude", "coordinateUncertaintyInMeters", "coordinatePrecision",
  "minimumElevationInMeters", "maximumElevationInMeters", "minimumDepthInMeters", "maximumDepthInMeters",
  "minimumDistanceAboveSurfaceInMeters", "maximumDistanceAboveSurfaceInMeters",
]);
const DATES = new Set<DwcTerm>(["modified", "eventDate", "georeferencedDate", "dateIdentified"]);
/** Scientific names, in italics. */
const ITALIC = new Set<DwcTerm>(["scientificName", "genus", "specificEpithet"]);

function termColumn(term: DwcTerm): ReportColumn<RefreshRow> {
  const numeric = NUMERIC.has(term);
  return {
    id: term,
    label: term,
    width: widthFor(Math.max(term.length + 4, VALUE_CHARS[term] ?? 0)),
    sort: (r) => (numeric ? (r.dwc[term] === "" ? null : Number(r.dwc[term])) : r.dwc[term]),
    cell: (r) => {
      const value = r.dwc[term];
      if (ITALIC.has(term)) return <SpeciesCell scientific={value} />;
      if (numeric || DATES.has(term)) return <NumberCell value={value} />;
      return <Clamped text={value} />;
    },
  };
}

const COLUMNS: ReportColumn<RefreshRow>[] = [
  { id: "batchId", label: "Batch ID", width: "w-[136px]", sticky: true, sort: (r) => r.batchId, cell: (r) => <IdCell>{r.batchId}</IdCell> },
  { id: "batchSourceSystem", label: "Batch source system", width: "w-[280px]", sort: (r) => r.batchSourceSystem, cell: (r) => <TextCell>{r.batchSourceSystem}</TextCell> },
  { id: "batchDate", label: "Batch date", width: "w-[148px]", sort: (r) => r.batchDate, cell: (r) => <NumberCell value={formatIsoDay(r.batchDate)} /> },
  { id: "error", label: "Error", width: "w-[320px]", sort: (r) => r.error, cell: (r) => <Clamped text={r.error} /> },
  ...DWC_TERMS.map(termColumn),
];

const YES = "Yes";
const NO = "No";

export function SpecimenDbRefreshReport() {
  const role = useUserRole();
  const rows = useMemo(() => refreshRowsFor(role), [role]);

  // The values a filter offers come from the rows the person can see, so no option leads to an empty table.
  const attributes: Attribute<RefreshRow>[] = useMemo(() => {
    const values = (pick: (r: RefreshRow) => string) => optionsFromValues(rows.map(pick));
    const day = (r: RefreshRow) => ({ start: Date.parse(r.batchDate), end: Date.parse(r.batchDate) });
    return [
      { id: "scientificName", kind: "options", label: "Scientific name", searchable: true, options: values((r) => r.dwc.scientificName), get: (r) => r.dwc.scientificName },
      { id: "datasetType", kind: "options", label: "Dataset type", options: values((r) => r.datasetType), get: (r) => r.datasetType },
      { id: "batchId", kind: "options", label: "Batch ID", options: values((r) => r.batchId), get: (r) => r.batchId },
      { id: "batchSourceSystem", kind: "options", label: "Batch source system", options: values((r) => r.batchSourceSystem), get: (r) => r.batchSourceSystem },
      { id: "batchDate", kind: "date", label: "Batch date", get: day },
      { id: "hasError", kind: "options", label: "Has error", options: [{ id: YES, label: YES }, { id: NO, label: NO }], get: (r) => (r.error ? YES : NO) },
      { id: "family", kind: "options", label: "Family", options: values((r) => r.dwc.family), get: (r) => r.dwc.family },
      { id: "class", kind: "options", label: "Class", options: values((r) => r.dwc.class), get: (r) => r.dwc.class },
    ];
  }, [rows]);

  return (
    <DataReport
      title="SpecimenDB Refresh Report"
      subtitle="The batches of specimen records refreshed from SpecimenDB into BioData, in Darwin Core, and any record that could not be refreshed."
      latest={(r) => r.batchDate}
      icon={Database01}
      rows={rows}
      rowId={(r) => r.id}
      columns={COLUMNS}
      attributes={attributes}
      searchText={(r) => [r.dwc.scientificName, r.dwc.catalogNumber, r.nsxCode, r.nslCode, r.regoId]}
      searchLabel="Search the report"
      searchPlaceholder="Search by name, catalogue number, code or rego"
      tableLabel="Specimen records refreshed from SpecimenDB, in Darwin Core"
      noun="records"
      emptyDescription="Specimen records refreshed from SpecimenDB for your projects appear here once a batch has run."
    />
  );
}

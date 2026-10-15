"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import {
  ausDistributionRowsFor,
  regionalDataRowsFor,
  speciesReferenceRowsFor,
  type AusDistributionRow,
  type FaunaTaxonFacts,
  type RegionalDataRow,
  type SpeciesReferenceRow,
} from "@/app/pages/_shared/reports/fauna-taxonomy-place-data";
import { useFaunaTaxa } from "@/app/pages/_shared/reports/taxonomy-fauna";
import { FAUNA_TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";
import { distinct } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { nsxColumns, useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// Three more tabs of the Fauna Taxonomy Report (the designer, 16 Oct 2026), each a sheet that reads a table off the taxon and each built by `useSheetTab`
// (taxonomy-sheet-tab.tsx) as the first two are (fauna-taxonomy-tabs.tsx): "Taxonomy list - Australian Distribution", "Taxonomy list - Regional Data" and "Taxonomy
// list - Species Reference". The rows are in fauna-taxonomy-place-data.ts, which says which columns the taxon's tables hold and which are mock. Each sheet's
// metadata is the table's own search and Filter, written above the columns of the exports. Departures from the sheets, on purpose, as in the other tabs (sentence
// case, typos fixed, the Filter menu also offering the facets the metadata does not):
//   - Regional Data lists "Australian Status Desc" twice in its metadata, once after the first and once before "NPW Act Status Desc", as the Species Status sheet does:
//     the second is read as the NPW Act status code, which that group lacks. Open for the designer (CONTRACTS 0.4);
//   - Australian Distribution's "Certain" is "Certain?", as its column is;
//   - the date filter reads the days the taxon carries (when it was created and last modified), because the tables' rows have no date of their own.

const REPORT = { reportTitle: FAUNA_TAXONOMY_REPORT_TITLE, reportSubtitle: "The fauna BioData holds, one report for each view." } as const;

/** The created and modified columns every one of these sheets ends with. */
const stampColumns = <R extends FaunaTaxonFacts>(): ViewColumn<R>[] => [
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Created on", W.md, (r) => r.createdOn),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified on", W.md, (r) => r.modifiedOn),
];

/** Yes or No facets, and who made a record: offered only where the rows hold a value. */
function facets<R>(rows: R[], list: [id: string, label: string, get: (r: R) => string][]): Attribute<R>[] {
  return list.flatMap(([id, label, get]): Attribute<R>[] => {
    const options = optionsFromValues(rows.map(get));
    return options.length > 0 ? [{ id, kind: "options", label, options, get }] : [];
  });
}

// ── Australian Distribution ──

const ausColumns: ViewColumn<AusDistributionRow>[] = [
  ...nsxColumns<AusDistributionRow>(),
  textColumn("region", "Region", W.md, (r) => r.region, { strong: true }),
  textColumn("certain", "Certain?", W.sm, (r) => r.certain),
  textColumn("indigenous", "Indigenous?", W.sm, (r) => r.indigenous),
  textColumn("comment", "Comment", W.xl, (r) => r.comment, { clamp: true }),
  ...stampColumns<AusDistributionRow>(),
];

const AUS_SPEC: FilterSpec<AusDistributionRow> = {
  labels: ["Species code & name", "NSX code", "Region", "Certain", "NPW Act status desc", "Date"],
  selects: [
    { id: "region", label: "Region", get: (r) => r.region },
    { id: "certain", label: "Certain", get: (r) => r.certain },
    { id: "npwDesc", label: "NPW Act status desc", get: (r) => r.npwDesc },
  ],
  date: { label: "Date", days: (r) => r.days },
};

export function useFaunaAusDistributionTab() {
  const taxa = useFaunaTaxa();
  const rows = useMemo(() => ausDistributionRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () =>
      facets<AusDistributionRow>(rows, [
        ["indigenous", "Indigenous?", (r) => r.indigenous],
        ["createdBy", "Created by", (r) => r.createdBy],
        ["modifiedBy", "Modified by", (r) => r.modifiedBy],
      ]),
    [rows],
  );
  return useSheetTab<AusDistributionRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list - Australian Distribution",
    spec: AUS_SPEC,
    rows,
    attributes,
    columns: ausColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.region, r.comment],
    searchPlaceholder: "Search by code, species, common name or region",
    tableLabel: "Australian distribution, one row each",
    noun: "regions",
    emptyDescription: "Australian Distribution recorded on a Fauna taxon in Taxonomy Management appears here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Regions", value: distinct(inView.map((r) => r.region)).toLocaleString("en-AU") },
    ],
    exportName: "fauna-taxonomy-australian-distribution-report",
  });
}

// ── Regional Data ──

const regionalColumns: ViewColumn<RegionalDataRow>[] = [
  ...nsxColumns<RegionalDataRow>(),
  textColumn("region", "SA region", W.md, (r) => r.region, { strong: true }),
  textColumn("status", "Status", W.sm, (r) => r.status),
  textColumn("crossBoundary", "Cross boundary?", W.md, (r) => r.crossBoundary),
  textColumn("comment", "Comment", W.xl, (r) => r.comment, { clamp: true }),
  textColumn("certain", "Certain?", W.sm, (r) => r.certain),
  textColumn("official", "Official?", W.sm, (r) => r.official),
  textColumn("indigenous", "Indigenous?", W.sm, (r) => r.indigenous),
  textColumn("accepted", "Accepted?", W.sm, (r) => r.accepted),
  ...stampColumns<RegionalDataRow>(),
];

const REGIONAL_SPEC: FilterSpec<RegionalDataRow> = {
  labels: ["Species code & name", "NSX code", "SA status desc", "Australian status desc", "NPW Act status code", "NPW Act status desc", "Date"],
  selects: [
    { id: "saDesc", label: "SA status desc", get: (r) => r.saDesc },
    { id: "ausDesc", label: "Australian status desc", get: (r) => r.ausDesc },
    { id: "npwCode", label: "NPW Act status code", get: (r) => r.npwCode },
    { id: "npwDesc", label: "NPW Act status desc", get: (r) => r.npwDesc },
  ],
  date: { label: "Date", days: (r) => r.days },
};

export function useFaunaRegionalDataTab() {
  const taxa = useFaunaTaxa();
  const rows = useMemo(() => regionalDataRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () =>
      facets<RegionalDataRow>(rows, [
        ["region", "SA region", (r) => r.region],
        ["status", "Status", (r) => r.status],
        ["crossBoundary", "Cross boundary?", (r) => r.crossBoundary],
        ["certain", "Certain?", (r) => r.certain],
        ["official", "Official?", (r) => r.official],
        ["indigenous", "Indigenous?", (r) => r.indigenous],
        ["accepted", "Accepted?", (r) => r.accepted],
        ["createdBy", "Created by", (r) => r.createdBy],
      ]),
    [rows],
  );
  return useSheetTab<RegionalDataRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list - Regional Data",
    spec: REGIONAL_SPEC,
    rows,
    attributes,
    columns: regionalColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.region, r.comment],
    searchPlaceholder: "Search by code, species, common name or region",
    tableLabel: "Regional data, one row each",
    noun: "regions",
    emptyDescription: "Regional Data recorded on a Fauna taxon in Taxonomy Management appears here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Regions", value: distinct(inView.map((r) => r.region)).toLocaleString("en-AU") },
    ],
    exportName: "fauna-taxonomy-regional-data-report",
  });
}

// ── Species Reference ──

const referenceColumns: ViewColumn<SpeciesReferenceRow>[] = [...nsxColumns<SpeciesReferenceRow>(), textColumn("newSpeciesNo", "New species no", W.md, (r) => r.newSpeciesNo, { strong: true }), ...stampColumns<SpeciesReferenceRow>()];

const REFERENCE_SPEC: FilterSpec<SpeciesReferenceRow> = {
  labels: ["Species code & name", "NSX code", "New species no", "Date"],
  selects: [],
  date: { label: "Date", days: (r) => r.days },
};

/** The one mock record the tab shows while no Fauna taxon has a Species Reference row (designer, 16 Oct 2026): a made-up new species number on a sample Fauna taxon. Not stored. */
const EXAMPLE_REFERENCE: SpeciesReferenceRow = {
  id: "example",
  taxonId: "M01170",
  nsx: "M01170",
  nsxDescription: "Isoodon obesulus",
  common: "Southern Brown Bandicoot",
  commonNames: "Southern Brown Bandicoot",
  newSpeciesNo: "M09001",
  createdBy: "Olivia Wyatt",
  createdOn: "12 Mar 2019",
  modifiedBy: "Lana Steiner",
  modifiedOn: "4 Aug 2026",
  days: ["2019-03-12", "2026-08-04"],
  latestMs: Date.parse("2026-08-04T12:00:00Z"),
};

export function useFaunaSpeciesReferenceTab() {
  const taxa = useFaunaTaxa();
  const rows = useMemo(() => speciesReferenceRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () =>
      facets<SpeciesReferenceRow>(rows, [
        ["createdBy", "Created by", (r) => r.createdBy],
        ["modifiedBy", "Modified by", (r) => r.modifiedBy],
      ]),
    [rows],
  );
  return useSheetTab<SpeciesReferenceRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list - Species Reference",
    spec: REFERENCE_SPEC,
    rows,
    example: EXAMPLE_REFERENCE,
    attributes,
    columns: referenceColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.newSpeciesNo],
    searchPlaceholder: "Search by code, species or new species number",
    tableLabel: "Species references, one row each",
    noun: "species references",
    emptyDescription: "Species References recorded on a Fauna taxon in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [{ label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") }],
    exportName: "fauna-taxonomy-species-reference-report",
  });
}

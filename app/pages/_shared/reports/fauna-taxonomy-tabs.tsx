"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { faunaRowsFor, faunaStatusRowsFor, type FaunaRow, type FaunaStatusRow } from "@/app/pages/_shared/reports/fauna-taxonomy-data";
import { useFaunaTaxa } from "@/app/pages/_shared/reports/taxonomy-fauna";
import { FAUNA_TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";
import { nsxColumns, useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The Fauna Taxonomy Report's two tabs (the designer, 16 Oct 2026, from two sheets: "BioData - Fauna Taxonomy list Detail Report" and "BioData - Fauna Taxonomy
// list - Species Status"; more to follow). The report is built like the Flora Taxonomy Report (taxonomy-report.tsx): one report with a tab for each sheet, each
// sheet's metadata (Species Code & Name, NSX Code, Common Name, Family, Group, Genus, Date and the like) the table's own search and Filter (taxonomy-sheet-tab.tsx),
// written above the columns of Export CSV and Export XLSX, and the sheet's columns in its order. Departures from the sheets, on purpose, as in the Flora report:
//   - labels are sentence case and spelled out ("Common Name Seq" is "Common name seq", "Creation By" is "Created by"), and the sheets' typos are fixed
//     ("Auther" is "author");
//   - the Species Status sheet has "Australian Status Desc" twice, once after the Australian status comment and once before "NPW Act Status Desc". The second is
//     read as the NPW Act status code, the one column that group lacks, and is labelled so. Open for the designer (CONTRACTS 0.4);
//   - the list detail sheet's "Group" is the species group (Bird, Mammal ...), a Filter attribute and not a column, as the sheet has no column for it;
//   - Species status, Australian distribution, Regional data, Species reference and Attributes are each the values of the taxon's tab of that name, joined;
//   - the Filter menu also offers the facets the metadata does not (Indigenous?, Current?, Official?, who created it).
// Columns the app has no value for (Taxonomic sequence, Sub family, Official? and the like, which Taxonomy Management leaves unfilled) are in the table and
// left empty. The first column, NSX code, is pinned when the table scrolls sideways. A Flora taxon is in neither tab (taxonomy-fauna.ts).

const REPORT = { reportTitle: FAUNA_TAXONOMY_REPORT_TITLE, reportSubtitle: "The fauna BioData holds, one report for each view." } as const;

// ── List detail ──

const listColumns: ViewColumn<FaunaRow>[] = [
  ...nsxColumns<FaunaRow>(),
  textColumn("common", "Common name", W.lg, (r) => r.common, { strong: true }),
  textColumn("commonSeq", "Common name seq", W.sm, (r) => r.commonSeq),
  textColumn("commonType", "Common name - type", W.md, (r) => r.commonType),
  textColumn("family", "Family", W.md, (r) => r.family),
  textColumn("taxonomicSeq", "Taxonomic sequence", W.md, (r) => r.taxonomicSeq),
  textColumn("subFamily", "Sub family", W.md, (r) => r.subFamily),
  textColumn("genus", "Genus/Sp", W.md, (r) => r.genus),
  textColumn("species", "Species", W.md, (r) => r.species),
  textColumn("author", "Author", W.md, (r) => r.author),
  textColumn("subspecific", "Subspecific", W.md, (r) => r.subspecific),
  textColumn("subspecificAuthor", "Subspecific author", W.md, (r) => r.subspecificAuthor),
  textColumn("infraspecific", "Infraspecific", W.md, (r) => r.infraspecific),
  textColumn("infraspecificAuthor", "Infraspecific author", W.md, (r) => r.infraspecificAuthor),
  textColumn("indigenous", "Indigenous?", W.sm, (r) => r.indigenous),
  textColumn("current", "Current?", W.sm, (r) => r.current),
  textColumn("official", "Official?", W.sm, (r) => r.official),
  textColumn("nationalIndexNo", "National species index no", W.md, (r) => r.nationalIndexNo),
  textColumn("comment1", "Comment", W.xl, (r) => r.comment1, { clamp: true }),
  textColumn("comment2", "Comment 2", W.xl, (r) => r.comment2, { clamp: true }),
  textColumn("speciesStatus", "Species status", W.xl, (r) => r.speciesStatus, { clamp: true }),
  textColumn("ausDistribution", "Australian distribution", W.lg, (r) => r.ausDistribution, { clamp: true }),
  textColumn("regionalData", "Regional data", W.lg, (r) => r.regionalData, { clamp: true }),
  textColumn("speciesReference", "Species reference", W.lg, (r) => r.speciesReference, { clamp: true }),
  textColumn("attributes", "Attributes", W.lg, (r) => r.attributes, { clamp: true }),
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Creation date", W.md, (r) => r.createdOn),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified date", W.md, (r) => r.modifiedOn),
];

const LIST_SPEC: FilterSpec<FaunaRow> = {
  labels: ["Species code & name", "NSX code", "Common name", "Family", "Group", "Genus", "Date"],
  selects: [
    { id: "family", label: "Family", get: (r) => r.family, searchable: true },
    { id: "group", label: "Group", get: (r) => r.group },
    { id: "genus", label: "Genus", get: (r) => r.genus, searchable: true },
  ],
  date: { label: "Date", days: (r) => r.days },
};

/** A Yes or No facet, or who made a record: offered only where the rows hold a value. */
function facets<R>(rows: R[], list: [id: string, label: string, get: (r: R) => string][]): Attribute<R>[] {
  return list.flatMap(([id, label, get]): Attribute<R>[] => {
    const options = optionsFromValues(rows.map(get));
    return options.length > 0 ? [{ id, kind: "options", label, options, get }] : [];
  });
}

export function useFaunaListDetailTab() {
  const taxa = useFaunaTaxa();
  const rows = useMemo(() => faunaRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () =>
      facets<FaunaRow>(rows, [
        ["indigenous", "Indigenous?", (r) => r.indigenous],
        ["current", "Current?", (r) => r.current],
        ["official", "Official?", (r) => r.official],
        ["createdBy", "Created by", (r) => r.createdBy],
      ]),
    [rows],
  );
  return useSheetTab<FaunaRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list Detail Report",
    spec: LIST_SPEC,
    rows,
    attributes,
    columns: listColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.family, r.genus, r.species, r.author],
    searchPlaceholder: "Search by code, species, common name or family",
    tableLabel: "Fauna taxa, one row each",
    noun: "taxa",
    emptyDescription: "Fauna taxa held in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Families", value: new Set(inView.map((r) => r.family).filter(Boolean)).size.toLocaleString("en-AU") },
      { label: "Genera", value: new Set(inView.map((r) => r.genus).filter(Boolean)).size.toLocaleString("en-AU") },
    ],
    exportName: "fauna-taxonomy-list-detail-report",
  });
}

// ── Species status ──

const statusColumns: ViewColumn<FaunaStatusRow>[] = [
  ...nsxColumns<FaunaStatusRow>(),
  textColumn("saCode", "SA status code", W.md, (r) => r.saCode),
  textColumn("saDesc", "SA status description", W.lg, (r) => r.saDesc),
  textColumn("saComment", "SA status comment", W.xl, (r) => r.saComment, { clamp: true }),
  textColumn("ausCode", "Australian status code", W.md, (r) => r.ausCode),
  textColumn("ausDesc", "Australian status description", W.lg, (r) => r.ausDesc),
  textColumn("ausComment", "Australian status comment", W.xl, (r) => r.ausComment, { clamp: true }),
  textColumn("npwCode", "NPW Act status code", W.md, (r) => r.npwCode),
  textColumn("npwDesc", "NPW Act status description", W.lg, (r) => r.npwDesc),
  textColumn("npwComment", "NPW Act status comment", W.xl, (r) => r.npwComment, { clamp: true }),
  textColumn("epbcCode", "EPBC Act code", W.md, (r) => r.epbcCode),
  textColumn("epbcDesc", "EPBC Act description", W.lg, (r) => r.epbcDesc),
  textColumn("epbcComment", "EPBC Act comment", W.xl, (r) => r.epbcComment, { clamp: true }),
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Creation date", W.md, (r) => r.createdOn),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified on", W.md, (r) => r.modifiedOn),
];

const STATUS_SPEC: FilterSpec<FaunaStatusRow> = {
  labels: ["Species code & name", "NSX code", "SA status desc", "Australian status desc", "NPW Act status desc", "Date"],
  selects: [
    { id: "saDesc", label: "SA status desc", get: (r) => r.saDesc },
    { id: "ausDesc", label: "Australian status desc", get: (r) => r.ausDesc },
    { id: "npwDesc", label: "NPW Act status desc", get: (r) => r.npwDesc },
  ],
  date: { label: "Date", days: (r) => r.days },
};

/** The one mock record the tab shows while no Fauna taxon holds a status (designer, 16 Oct 2026): a made-up status on a sample Fauna taxon, by a placeholder person. Not stored. */
const EXAMPLE_STATUS: FaunaStatusRow = {
  id: "example",
  taxonId: "M01170",
  nsx: "M01170",
  nsxDescription: "Isoodon obesulus",
  common: "Southern Brown Bandicoot",
  saCode: "E",
  saDesc: "Endangered",
  saComment: "",
  ausCode: "",
  ausDesc: "",
  ausComment: "",
  npwCode: "Endangered",
  npwDesc: "Endangered",
  npwComment: "",
  epbcCode: "",
  epbcDesc: "",
  epbcComment: "",
  createdBy: "Olivia Wyatt",
  createdOn: "12 Mar 2019",
  modifiedBy: "Lana Steiner",
  modifiedOn: "4 Aug 2026",
  days: ["2019-03-12", "2026-08-04"],
  latestMs: Date.parse("2026-08-04T12:00:00Z"),
};

export function useFaunaStatusTab() {
  const taxa = useFaunaTaxa();
  const rows = useMemo(() => faunaStatusRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () =>
      facets<FaunaStatusRow>(rows, [
        ["epbcDesc", "EPBC Act description", (r) => r.epbcDesc],
        ["createdBy", "Created by", (r) => r.createdBy],
        ["modifiedBy", "Modified by", (r) => r.modifiedBy],
      ]),
    [rows],
  );
  return useSheetTab<FaunaStatusRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list - Species Status",
    spec: STATUS_SPEC,
    rows,
    example: EXAMPLE_STATUS,
    attributes,
    columns: statusColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.saDesc, r.ausDesc, r.npwDesc, r.epbcDesc],
    searchPlaceholder: "Search by code, species or status",
    tableLabel: "Fauna species statuses, one row each",
    noun: "species statuses",
    emptyDescription: "Statuses recorded on a Fauna taxon in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Under the NPW Act", value: inView.filter((r) => r.npwCode).length.toLocaleString("en-AU") },
      { label: "Under the EPBC Act", value: inView.filter((r) => r.epbcCode).length.toLocaleString("en-AU") },
    ],
    exportName: "fauna-taxonomy-species-status-report",
  });
}

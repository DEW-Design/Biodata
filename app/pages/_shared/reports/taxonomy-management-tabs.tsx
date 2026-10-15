"use client";

import { useMemo } from "react";
import { REPORT_WIDTH as W, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { SpeciesCell } from "@/app/pages/_shared/reports/report-table";
import { EXAMPLE_APPEND, EXAMPLE_RENAME, EXAMPLE_SPLIT, EXAMPLE_SYNONYM } from "@/app/pages/_shared/reports/taxonomy-example-rows";
import { useFloraChanges, useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { appendRowsFor, renameRowsFor, splitRowsFor, synonymRowsFor, type ManagementRow, type SplitRow, type SynonymRow } from "@/app/pages/_shared/reports/taxonomy-management-data";
import { distinct } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The four "Taxonomy list Management Report" sheets of the Taxonomy Report (the designer, 15 Oct 2026): Rename Species, Split Species, Append
// Species and Species Synonym, each built by `useSheetTab`. They share their metadata, in the sheet's order: NSX Code, Species Name, Common
// Name, Created On (a start and an end date) and Created By; it is the table's own search and Filter (taxonomy-sheet-tab.tsx): the typed lines are the
// search, Created By and the date are attributes of the Filter menu, and the export writes them above the columns. Where the rows come from is in taxonomy-management-data.ts: the change log for
// the first three, which is empty until a Rename, Split or Append is committed in Taxonomy Management, and each taxon's synonyms for the
// fourth. Departures from the sheets, on purpose, as in the other tabs:
//   - the sheets leave three blank columns after Created By (Rename, Split) and three between Infraspecific 3 Rank and Infraspecific 3
//     (Append, Synonym), and one after As MS ? (Synonym): none is drawn;
//   - Split Species ends its infraspecific columns with "Infraspecific 3 Rank" where the pattern (Rank 1, Infraspecific 1, Rank 2,
//     Infraspecific 2, Rank 3) makes it the Infraspecific 3 name: it is read as "Infraspecific 3";
//   - Rename Species shows the species as it was before the rename under NSX Desc, and the new name in New Genus, New Species and the
//     infraspecific columns; Split Species shows the species that was split under "Species to Split" and the species it made in the rest;
//   - the app records no editor of a change, so Modified By and Modified On are empty, and a synonym has no creator, so Created By is
//     empty on Species Synonym;
//   - a synonym carries no NSX code of its own here: the NSX Code, Family and Order shown are the taxon it is a synonym of.

const SPEC: FilterSpec<ManagementRow> = {
  labels: ["NSX code", "Species name", "Common name", "Created on", "Created by"],
  selects: [{ id: "createdBy", label: "Created by", get: (r) => r.createdBy }],
  date: { label: "Created on", days: (r) => r.days },
};

const seq = <R extends ManagementRow>() => numberColumn<R>("seq", "Seq#", W.xs, (r) => r.seq, { sticky: true });
const infra = <R extends ManagementRow>(): ViewColumn<R>[] => [
  textColumn("rank1", "Infraspecific 1 rank", W.md, (r) => r.rank1),
  textColumn("infra1", "Infraspecific 1", W.md, (r) => r.infra1),
  textColumn("rank2", "Infraspecific 2 rank", W.md, (r) => r.rank2),
  textColumn("infra2", "Infraspecific 2", W.md, (r) => r.infra2),
  textColumn("rank3", "Infraspecific 3 rank", W.md, (r) => r.rank3),
  textColumn("infra3", "Infraspecific 3", W.md, (r) => r.infra3),
];
const classification = <R extends ManagementRow>(): ViewColumn<R>[] => [
  textColumn("family", "Family", W.md, (r) => r.family),
  textColumn("order", "Order", W.md, (r) => r.order),
  textColumn("majorGroup", "Major group", W.md, (r) => r.majorGroup),
  textColumn("genus", "Genus", W.md, (r) => r.genus),
  textColumn("species", "Species", W.md, (r) => r.species),
];
const history = <R extends ManagementRow>(): ViewColumn<R>[] => [
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Created on", W.lg, (r) => r.createdOn),
  textColumn("comments", "Comments", W.xl, (r) => r.comments, { clamp: true }),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified on", W.md, (r) => r.modifiedOn),
];

const common = {
  spec: SPEC,
  rowId: (r: ManagementRow) => r.id,
  searchText: (r: ManagementRow) => [r.nsx, r.speciesName, r.common, r.commonNames, r.genus, r.species, r.createdBy],
  latest: (r: ManagementRow) => r.createdMs,
  facts: (inView: ManagementRow[]) => [{ label: "Taxa", value: distinct(inView.map((r) => r.nsx)).toLocaleString("en-AU") }],
  attributes: [],
};

// ── Rename Species ──
const renameColumns: ViewColumn<ManagementRow>[] = [
  seq(),
  textColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  {
    id: "nsxDescription",
    label: "NSX description",
    width: W.lg,
    sort: (r) => r.speciesName,
    cell: (r) => <SpeciesCell scientific={r.speciesName} />,
    text: (r) => r.speciesName,
  },
  textColumn("genus", "New genus", W.md, (r) => r.genus),
  textColumn("species", "New species", W.md, (r) => r.species),
  ...infra<ManagementRow>(),
  ...history<ManagementRow>(),
];

export function useRenameTab() {
  const taxa = useFloraTaxa();
  const changes = useFloraChanges();
  const rows = useMemo(() => renameRowsFor(taxa, changes), [taxa, changes]);
  return useSheetTab<ManagementRow>({
    ...common,
    sheetTitle: "BioData - Rename Species | Taxonomy list Management Report",
    rows,
    example: EXAMPLE_RENAME,
    columns: renameColumns,
    searchPlaceholder: "Search by code, species or person",
    tableLabel: "Renamed species, one row each",
    noun: "renames",
    emptyDescription: "A species renamed in Taxonomy Management appears here.",
    initialSort: { column: "seq", direction: "ascending" },
    exportName: "taxonomy-rename-species-report",
  });
}

// ── Split Species ──
const splitColumns: ViewColumn<SplitRow>[] = [
  seq<SplitRow>(),
  textColumn("splitFrom", "Species to split", W.lg, (r) => r.splitFrom, { strong: true }),
  textColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  textColumn("genus", "Genus", W.md, (r) => r.genus),
  textColumn("species", "Species", W.md, (r) => r.species),
  textColumn("rank1", "Rank 1", W.sm, (r) => r.rank1),
  textColumn("infra1", "Infraspecific 1", W.md, (r) => r.infra1),
  textColumn("rank2", "Rank 2", W.sm, (r) => r.rank2),
  textColumn("infra2", "Infraspecific 2", W.md, (r) => r.infra2),
  textColumn("rank3", "Rank 3", W.sm, (r) => r.rank3),
  textColumn("infra3", "Infraspecific 3", W.md, (r) => r.infra3),
  ...history<SplitRow>(),
];

export function useSplitTab() {
  const taxa = useFloraTaxa();
  const changes = useFloraChanges();
  const rows = useMemo(() => splitRowsFor(taxa, changes), [taxa, changes]);
  return useSheetTab<SplitRow>({
    ...common,
    sheetTitle: "BioData - Split Species | Taxonomy list Management Report",
    rows,
    example: EXAMPLE_SPLIT,
    columns: splitColumns,
    searchPlaceholder: "Search by code, species or person",
    tableLabel: "Split species, one row for each species made",
    noun: "split species",
    emptyDescription: "A species split in Taxonomy Management appears here, one row for each species it made.",
    initialSort: { column: "seq", direction: "ascending" },
    exportName: "taxonomy-split-species-report",
  });
}

// ── Append Species ──
const appendColumns: ViewColumn<ManagementRow>[] = [
  seq(),
  textColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  ...classification<ManagementRow>(),
  ...infra<ManagementRow>(),
  ...history<ManagementRow>(),
];

export function useAppendTab() {
  const taxa = useFloraTaxa();
  const changes = useFloraChanges();
  const rows = useMemo(() => appendRowsFor(taxa, changes), [taxa, changes]);
  return useSheetTab<ManagementRow>({
    ...common,
    sheetTitle: "BioData - Append Species | Taxonomy list Management Report",
    rows,
    example: EXAMPLE_APPEND,
    columns: appendColumns,
    searchPlaceholder: "Search by code, species or person",
    tableLabel: "Appended species, one row each",
    noun: "appended species",
    emptyDescription: "A species appended in Taxonomy Management appears here.",
    initialSort: { column: "seq", direction: "ascending" },
    exportName: "taxonomy-append-species-report",
  });
}

// ── Species Synonym ──
const synonymColumns: ViewColumn<SynonymRow>[] = [
  seq<SynonymRow>(),
  textColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  ...classification<SynonymRow>(),
  ...infra<SynonymRow>(),
  textColumn("synPartly", "Syn qualify partly?", W.md, (r) => r.synPartly),
  textColumn("questionably", "Questionably?", W.md, (r) => r.questionably),
  textColumn("asMs", "As MS?", W.sm, (r) => r.asMs),
  textColumn("hybrid", "Hybrid?", W.sm, (r) => r.hybrid),
  textColumn("hybridRank", "Hybrid rank", W.md, (r) => r.hybridRank),
  textColumn("hybridFormula", "Hybrid formula", W.lg, (r) => r.hybridFormula, { clamp: true }),
  textColumn("hybridParent2", "Hybrid parent 2 code and desc", W.lg, (r) => r.hybridParent2),
  textColumn("published", "Published?", W.sm, (r) => r.published),
  textColumn("matchesCc", "Matches CC?", W.md, (r) => r.matchesCc),
  textColumn("date", "Date", W.md, (r) => r.date),
  textColumn("comment", "Comment", W.xl, (r) => r.comment, { clamp: true }),
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Created on", W.md, (r) => r.createdOn),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified on", W.md, (r) => r.modifiedOn),
];

export function useSynonymTab() {
  const taxa = useFloraTaxa();
  const rows = useMemo(() => synonymRowsFor(taxa), [taxa]);
  return useSheetTab<SynonymRow>({
    ...common,
    sheetTitle: "BioData - Species Synonym | Taxonomy list Management Report",
    rows,
    example: EXAMPLE_SYNONYM,
    columns: synonymColumns,
    searchPlaceholder: "Search by code, species or synonym",
    tableLabel: "Synonyms, one row each",
    noun: "synonyms",
    emptyDescription: "The names a species was known by appear here.",
    initialSort: { column: "seq", direction: "ascending" },
    exportName: "taxonomy-species-synonym-report",
  });
}

"use client";

import { useMemo } from "react";
import { REPORT_WIDTH as W, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { EXAMPLE_SYNONYM } from "@/app/pages/_shared/reports/taxonomy-example-rows";
import { useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { synonymRowsFor, type ManagementRow, type SynonymRow } from "@/app/pages/_shared/reports/taxonomy-management-data";
import { distinct } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The "Taxonomy list Management Report" sheet that is still a tab of the Flora Taxonomy Report, Species Synonym (the designer, 15 Oct 2026), built by `useSheetTab`. Its
// metadata, in the sheet's order, is NSX Code, Species Name, Common Name, Created On (a start and an end date) and Created By; it is the table's own search and Filter
// (taxonomy-sheet-tab.tsx): the typed lines are the search, Created By and the date are attributes of the Filter menu, and the export writes them above the columns. Its rows
// are each taxon's synonyms (taxonomy-management-data.ts). The Rename Species, Split Species and Append Species sheets are not tabs any more (the designer, 16 Oct 2026):
// a Rename, Combine, Split or Append committed in Taxonomy Management is a row of the audit log. Departures from the sheet, on purpose, as in the other tabs:
//   - the sheet leaves three blank columns between Infraspecific 3 Rank and Infraspecific 3 and one after As MS ?: none is drawn;
//   - a synonym has no creator, so Created By is empty;
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
const common = {
  spec: SPEC,
  rowId: (r: ManagementRow) => r.id,
  searchText: (r: ManagementRow) => [r.nsx, r.speciesName, r.common, r.commonNames, r.genus, r.species, r.createdBy],
  latest: (r: ManagementRow) => r.createdMs,
  facts: (inView: ManagementRow[]) => [{ label: "Taxa", value: distinct(inView.map((r) => r.nsx)).toLocaleString("en-AU") }],
  attributes: [],
};

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

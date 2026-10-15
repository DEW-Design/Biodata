"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, idColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { SpeciesCell } from "@/app/pages/_shared/reports/report-table";
import { taxonomyRowsFor, type TaxonomyRow } from "@/app/pages/_shared/reports/taxonomy-report-data";
import { useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The Flora Taxonomy Report's first tab, the "Taxonomy list detail report" (the designer, 15 Oct 2026), from the sheet "BioData - Taxonomy list
// Detail Report". The Taxonomy Report is one report with a tab for each sheet (taxonomy-report.tsx).
//
// The sheet has two parts and both are here. Above the columns is its metadata, Species Code & Name, NSX Code, Common Name, Family, Group
// (a Flora taxon's Major group), Genus and Date (Start Date - End Date): it is the table's own search and Filter (taxonomy-sheet-tab.tsx), the typed
// lines being the search and Family, Group, Genus and the date attributes of the Filter menu, and it is written above the columns of Export CSV and
// Export XLSX, as the sheet has it. Under it are the sheet's 53 columns, one row per taxon, in the sheet's order. Fitted into the shared report
// pattern (report-table.tsx) with these departures from the sheet, on purpose:
//   - labels are sentence case and spelled out ("Curr Concept?" is "Current concept?", "Estab in SA?" is "Established in SA?"), and
//     the sheet's typos are fixed ("Auther2", "Pratly?", "Questionalbly?", "Secies Status");
//   - the sheet's "Common Name" is in it twice, as its third column and again after Species status: the first is the taxon's common name,
//     the second every common name it has (Taxonomy Management's Common Name tab);
//   - the Filter menu also offers the facets the metadata does not (Synonym?, Current concept?, Occurs in SA? and so on);
//   - the sheet's trailing blank column is not drawn.
// Columns the app has no value for (Major group, For census? and the other fields Taxonomy Management leaves unfilled) are in the
// table and left empty. The first column, NSX code, is pinned when the table scrolls sideways.

const columns: ViewColumn<TaxonomyRow>[] = [
  idColumn("nsx", "NSX code", W.sm, (r) => r.nsx, { sticky: true }),
  {
    id: "nsxDescription",
    label: "NSX description",
    width: W.lg,
    sort: (r) => r.nsxDescription,
    cell: (r) => <SpeciesCell scientific={r.nsxDescription} />,
    text: (r) => r.nsxDescription,
  },
  textColumn("common", "Common name", W.lg, (r) => r.common, { strong: true }),
  textColumn("family", "Family", W.md, (r) => r.family),
  textColumn("order", "Order", W.md, (r) => r.order),
  textColumn("majorGroup", "Major group", W.md, (r) => r.majorGroup),
  textColumn("genus", "Genus/Sp", W.md, (r) => r.genus),
  textColumn("species", "Species", W.md, (r) => r.species),
  textColumn("author", "Author", W.md, (r) => r.author),
  textColumn("infraspecific1", "Infraspecific 1", W.md, (r) => r.infraspecific1),
  textColumn("author1", "Author 1", W.md, (r) => r.author1),
  textColumn("infraspecific2", "Infraspecific 2", W.md, (r) => r.infraspecific2),
  textColumn("author2", "Author 2", W.md, (r) => r.author2),
  textColumn("infraspecific3", "Infraspecific 3", W.md, (r) => r.infraspecific3),
  textColumn("author3", "Author 3", W.md, (r) => r.author3),
  textColumn("synonym", "Synonym?", W.sm, (r) => r.synonym),
  textColumn("currentConcept", "Current concept?", W.md, (r) => r.currentConcept),
  textColumn("forCensus", "For census?", W.sm, (r) => r.forCensus),
  textColumn("forBs", "For BS?", W.sm, (r) => r.forBs),
  textColumn("synPartly", "Syn qualifiers partly?", W.md, (r) => r.synPartly),
  textColumn("questionably", "Questionably?", W.md, (r) => r.questionably),
  textColumn("asMs", "As MS?", W.sm, (r) => r.asMs),
  textColumn("phrase", "Phrase", W.lg, (r) => r.phrase, { clamp: true }),
  textColumn("idCertain", "ID certain?", W.sm, (r) => r.idCertain),
  textColumn("occursInSa", "Occurs in SA?", W.md, (r) => r.occursInSa),
  textColumn("endemicInSa", "Endemic in SA?", W.md, (r) => r.endemicInSa),
  textColumn("nativeInSa", "Native in SA?", W.md, (r) => r.nativeInSa),
  textColumn("estabInSa", "Established in SA?", W.md, (r) => r.estabInSa),
  textColumn("collectedLast50", "Collected last 50 yrs?", W.md, (r) => r.collectedLast50),
  textColumn("hybrid", "Hybrid?", W.sm, (r) => r.hybrid),
  textColumn("hybridRank", "Hybrid rank", W.md, (r) => r.hybridRank),
  textColumn("hybridFormula", "Hybrid formula", W.lg, (r) => r.hybridFormula, { clamp: true }),
  textColumn("hybridParent2", "Hybrid parent 2", W.lg, (r) => r.hybridParent2),
  textColumn("published", "Published?", W.sm, (r) => r.published),
  textColumn("matchesCc", "Matches CC?", W.md, (r) => r.matchesCc),
  textColumn("date", "Date", W.md, (r) => r.date),
  textColumn("howCreated", "How created?", W.md, (r) => r.howCreated),
  textColumn("lifeSpan", "Life attributes (life span)", W.lg, (r) => r.lifeSpan),
  textColumn("saRegions", "SA regions", W.lg, (r) => r.saRegions, { clamp: true }),
  textColumn("ausWorld", "Aus / World", W.lg, (r) => r.ausWorld, { clamp: true }),
  textColumn("refHerb", "Ref herb", W.lg, (r) => r.refHerb, { clamp: true }),
  textColumn("attributes", "Attributes", W.lg, (r) => r.attributes, { clamp: true }),
  textColumn("speciesStatus", "Species status", W.lg, (r) => r.speciesStatus, { clamp: true }),
  textColumn("commonNames", "Common name", W.lg, (r) => r.commonNames, { clamp: true }),
  textColumn("parents", "Linked species - parents (older taxa)", W.xl, (r) => r.parents, { clamp: true }),
  textColumn("children", "Linked species - children (newer taxa)", W.xl, (r) => r.children, { clamp: true }),
  textColumn("comments", "Comments", W.xl, (r) => r.comments, { clamp: true }),
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Created on", W.md, (r) => r.createdOn),
  textColumn("renamedBy", "Renamed by", W.md, (r) => r.renamedBy),
  textColumn("renamedOn", "Renamed on", W.md, (r) => r.renamedOn),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified on", W.md, (r) => r.modifiedOn),
];

const SPEC: FilterSpec<TaxonomyRow> = {
  labels: ["Species code & name", "NSX code", "Common name", "Family", "Group", "Genus", "Date"],
  selects: [
    { id: "family", label: "Family", get: (r) => r.family, searchable: true },
    { id: "group", label: "Group", get: (r) => r.majorGroup },
    { id: "genus", label: "Genus", get: (r) => r.genus, searchable: true },
  ],
  date: { label: "Date", days: (r) => r.days },
};

export function useListDetailTab() {
  const taxa = useFloraTaxa();
  const rows = useMemo(() => taxonomyRowsFor(taxa), [taxa]);
  const attributes = useMemo(() => {
    const one = (id: string, label: string, get: (r: TaxonomyRow) => string): Attribute<TaxonomyRow>[] => {
      const options = optionsFromValues(rows.map(get));
      return options.length > 0 ? [{ id, kind: "options", label, options, get }] : [];
    };
    return [
      ...one("synonym", "Synonym?", (r) => r.synonym),
      ...one("currentConcept", "Current concept?", (r) => r.currentConcept),
      ...one("occursInSa", "Occurs in SA?", (r) => r.occursInSa),
      ...one("nativeInSa", "Native in SA?", (r) => r.nativeInSa),
      ...one("endemicInSa", "Endemic in SA?", (r) => r.endemicInSa),
      ...one("hybrid", "Hybrid?", (r) => r.hybrid),
      ...one("createdBy", "Created by", (r) => r.createdBy),
    ];
  }, [rows]);

  return useSheetTab<TaxonomyRow>({
    sheetTitle: "BioData - Taxonomy list Detail Report",
    spec: SPEC,
    rows,
    attributes,
    columns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.family, r.genus, r.species, r.author],
    searchPlaceholder: "Search by code, species, common name or family",
    tableLabel: "Taxa, one row each",
    noun: "taxa",
    emptyDescription: "Taxa held in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Families", value: new Set(inView.map((r) => r.family).filter(Boolean)).size.toLocaleString("en-AU") },
      { label: "Genera", value: new Set(inView.map((r) => r.genus).filter(Boolean)).size.toLocaleString("en-AU") },
    ],
    exportName: "taxonomy-list-detail-report",
  });
}

"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { distributionColumns } from "@/app/pages/_shared/reports/taxonomy-distribution-columns";
import { useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { SA_REGIONS_SOURCE, distinct, distributionRowsFor, type DistributionRow } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The Flora Taxonomy Report's second tab, "Taxonomy list - SA Regions" (the designer, 15 Oct 2026), from the sheet "BioData - Taxonomy list - SA
// Regions": a row for each region a taxon is recorded in. Its metadata, Species Code & Name, NSX Code, Region, Herbarium No and Date (Start Date -
// End Date), is the table's own search and Filter (taxonomy-sheet-tab.tsx): the typed lines are the search (which matches the code, the name and the
// Herbarium number), Region and the date are attributes of the Filter menu; it is written above the columns of Export CSV and Export XLSX, as the
// sheet has it. Under it are the sheet's 25 columns, in its order. Departures from the sheet, on purpose, as in the first tab:
//   - labels are sentence case, and "Estab" is spelled out ("Established in Reg?", "Conservation status" for "Cons Stat.", "Collection <
//     50 yrs" for "Colln < 50yrs"); "Reg" is kept as the sheet has it, because the sheet uses it for the region ("Native in Reg?") and,
//     as far as the app says, for the record ("Reg Created By");
//   - the date filter reads the region record's own days, its Reg creation date and Reg edit date;
//   - the Filter menu also offers the facets the metadata does not (the Yes or No columns and who created or edited the record).
// Columns the app has no value for are in the table and left empty. The first column, NSX code, is pinned.

const columns = distributionColumns({ area: "Region", createdBy: "Reg created by", creationDate: "Reg creation date", editedBy: "Reg edited by", editDate: "Reg edit date" });

const SPEC: FilterSpec<DistributionRow> = {
  labels: ["Species code & name", "NSX code", "Region", "Herbarium no", "Date"],
  selects: [{ id: "region", label: "Region", get: (r) => r.region }],
  date: { label: "Date", days: (r) => r.days },
};

export function useSaRegionsTab() {
  const taxa = useFloraTaxa();
  const rows = useMemo(() => distributionRowsFor(taxa, SA_REGIONS_SOURCE), [taxa]);
  const attributes = useMemo(() => {
    const one = (id: string, label: string, get: (r: DistributionRow) => string): Attribute<DistributionRow>[] => {
      const options = optionsFromValues(rows.map(get));
      return options.length > 0 ? [{ id, kind: "options", label, options, get }] : [];
    };
    return [
      ...one("includeCensus", "Include census?", (r) => r.includeCensus),
      ...one("bsAccept", "BS accept?", (r) => r.bsAccept),
      ...one("nativeInReg", "Native in Reg?", (r) => r.nativeInReg),
      ...one("estabInReg", "Established in Reg?", (r) => r.estabInReg),
      ...one("idCertain", "ID certain?", (r) => r.idCertain),
      ...one("dsnCertain", "Dsn certain?", (r) => r.dsnCertain),
      ...one("isRefHbVoucher", "Is ref Hb voucher?", (r) => r.isRefHbVoucher),
      ...one("isTaxonVoucher", "Is taxon voucher?", (r) => r.isTaxonVoucher),
      ...one("regCreatedBy", "Reg created by", (r) => r.regCreatedBy),
      ...one("regEditBy", "Reg edited by", (r) => r.regEditBy),
    ];
  }, [rows]);

  return useSheetTab<DistributionRow>({
    sheetTitle: "BioData - Taxonomy list - SA Regions",
    spec: SPEC,
    rows,
    attributes,
    columns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.region, r.description, r.herbariumNo, r.surname, r.comment],
    searchPlaceholder: "Search by code, species, region or herbarium number",
    tableLabel: "Taxon regions, one row each",
    noun: "regions",
    emptyDescription: "Regions recorded on a taxon in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Regions", value: distinct(inView.map((r) => r.region)).toLocaleString("en-AU") },
    ],
    exportName: "taxonomy-sa-regions-report",
  });
}

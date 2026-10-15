"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { distributionColumns } from "@/app/pages/_shared/reports/taxonomy-distribution-columns";
import { useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { AUS_WORLD_SOURCE, distinct, distributionRowsFor, type DistributionRow } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The Flora Taxonomy Report's third tab, "Taxonomy list - Aus / World" (the designer, 15 Oct 2026), from the sheet "BioData - Taxonomy list - Aus /
// World": a row for each State or overseas area a taxon is recorded in, from its Australian and Overseas Distribution table. Its metadata,
// Species Code & Name, NSX Code, Common Name, State/OS Area and Date (Start Date - End Date), is the table's own search and Filter
// (taxonomy-sheet-tab.tsx) and is written above the columns of Export CSV and Export XLSX, as in the other tabs. Under it are the sheet's 25
// columns, in its order, the same as the SA Regions sheet's apart from the area column (taxonomy-distribution-columns.tsx). Departures from the
// sheet, on purpose, as in the other tabs: sentence case and the spelled-out labels (see taxonomy-sa-regions-tab.tsx); and the sheet's last four labels
// are kept as it has them although they do not agree with each other ("SA Created By", "SA Creation Date", "SA Edited By", then "Reg Edit
// Date"): the designer is asked which is meant. The date filter reads the record's own days, its creation and edit dates.

const columns = distributionColumns({ area: "State/OS area", createdBy: "SA created by", creationDate: "SA creation date", editedBy: "SA edited by", editDate: "Reg edit date" });

const SPEC: FilterSpec<DistributionRow> = {
  labels: ["Species code & name", "NSX code", "Common name", "State/OS area", "Date"],
  selects: [{ id: "area", label: "State/OS area", get: (r) => r.region }],
  date: { label: "Date", days: (r) => r.days },
};

export function useAusWorldTab() {
  const taxa = useFloraTaxa();
  const rows = useMemo(() => distributionRowsFor(taxa, AUS_WORLD_SOURCE), [taxa]);
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
      ...one("regCreatedBy", "SA created by", (r) => r.regCreatedBy),
      ...one("regEditBy", "SA edited by", (r) => r.regEditBy),
    ];
  }, [rows]);

  return useSheetTab<DistributionRow>({
    sheetTitle: "BioData - Taxonomy list - Aus / World",
    spec: SPEC,
    rows,
    attributes,
    columns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.region, r.description, r.herbariumNo, r.surname, r.comment],
    searchPlaceholder: "Search by code, species, common name, area or herbarium number",
    tableLabel: "Taxon areas, one row each",
    noun: "areas",
    emptyDescription: "Areas recorded on a taxon's Australian and Overseas Distribution in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Areas", value: distinct(inView.map((r) => r.region)).toLocaleString("en-AU") },
    ],
    exportName: "taxonomy-aus-world-report",
  });
}

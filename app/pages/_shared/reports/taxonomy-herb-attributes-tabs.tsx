"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { EXAMPLE_ATTRIBUTE } from "@/app/pages/_shared/reports/taxonomy-example-rows";
import { useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { attributeRowsFor, refHerbRowsFor, type AttributeRow, type RefHerbRow } from "@/app/pages/_shared/reports/taxonomy-herb-attributes-data";
import { distinct } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { nsxColumns, useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// Two sheets of the Flora Taxonomy Report that read a table off the taxon (the designer, 15 Oct 2026), each built by `useSheetTab`
// (taxonomy-sheet-tab.tsx): "Taxonomy list - Reg Herb Data" and "Taxonomy list - Species Attributes". The sheets' metadata is the table's own search and
// Filter and is written above the columns of the exports. Departures from the sheets, on purpose, as in the other tabs (sentence case, typos fixed, the
// Filter menu also offering the facets the metadata does not):
//   - Reg Herb Data: "Taxon Voucher" is "Taxon voucher?", as the Reference Herb Data table has it. A Reference Herb row has no date of its
//     own, so the date filter reads the taxon's days (its Date, created, renamed and modified).
//   - Species Attributes: "Attributes is Current" and "Attributes is Officical" are "Attribute is current?" and "Attribute is official?", as
//     the Attributes table has them. The sheet lists "Region Group" twice, in the metadata and in the columns: the second is read as the Region
//     name, the field that follows Region Group in the Attributes table. "Attributes type: Current or Official" is a select of the two, keeping the
//     rows whose flag is on. The date filter reads the Date of assessment.

const herbColumns: ViewColumn<RefHerbRow>[] = [
  ...nsxColumns<RefHerbRow>(),
  textColumn("area", "Area (SAReg/State/OS)", W.lg, (r) => r.area, { strong: true }),
  textColumn("initial", "Initial", W.sm, (r) => r.initial),
  textColumn("surname", "Surname", W.md, (r) => r.surname),
  textColumn("collNo", "Colln no.", W.md, (r) => r.collNo),
  textColumn("adNo", "AD no. AD-X YYY WW n", W.lg, (r) => r.adNo),
  textColumn("areaVoucher", "Area voucher?", W.md, (r) => r.areaVoucher),
  textColumn("taxonVoucher", "Taxon voucher?", W.md, (r) => r.taxonVoucher),
  textColumn("comment", "Comment", W.xl, (r) => r.comment, { clamp: true }),
];

const options = <R,>(rows: R[], id: string, label: string, get: (r: R) => string): Attribute<R>[] => {
  const found = optionsFromValues(rows.map(get));
  return found.length > 0 ? [{ id, kind: "options", label, options: found, get }] : [];
};

const HERB_SPEC: FilterSpec<RefHerbRow> = {
  labels: ["Species code & name", "NSX code", "Common name", "Area (SAReg/State/OS)", "Date"],
  selects: [{ id: "area", label: "Area (SAReg/State/OS)", get: (r) => r.area }],
  date: { label: "Date", days: (r) => r.days },
};

export function useRefHerbTab() {
  const taxa = useFloraTaxa();
  const rows = useMemo(() => refHerbRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () => [
      ...options(rows, "areaVoucher", "Area voucher?", (r) => r.areaVoucher),
      ...options(rows, "taxonVoucher", "Taxon voucher?", (r) => r.taxonVoucher),
      ...options(rows, "surname", "Surname", (r) => r.surname),
    ],
    [rows],
  );
  return useSheetTab<RefHerbRow>({
    sheetTitle: "BioData - Taxonomy list - Reg Herb Data",
    spec: HERB_SPEC,
    rows,
    attributes,
    columns: herbColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.area, r.surname, r.collNo, r.adNo, r.comment],
    searchPlaceholder: "Search by code, species, common name, area or surname",
    tableLabel: "Reference herbarium rows, one each",
    noun: "reference herbarium rows",
    emptyDescription: "Reference Herb Data recorded on a taxon in Taxonomy Management appears here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Areas", value: distinct(inView.map((r) => r.area)).toLocaleString("en-AU") },
    ],
    exportName: "taxonomy-reg-herb-data-report",
  });
}

const attributeColumns: ViewColumn<AttributeRow>[] = [
  ...nsxColumns<AttributeRow>(),
  textColumn("regionGroup", "Region group", W.md, (r) => r.regionGroup),
  textColumn("regionName", "Region name", W.md, (r) => r.regionName),
  textColumn("isCurrent", "Attribute is current?", W.md, (r) => r.isCurrent),
  textColumn("isOfficial", "Attribute is official?", W.md, (r) => r.isOfficial),
  textColumn("attributeGroup", "Attribute group", W.md, (r) => r.attributeGroup),
  textColumn("attributeName", "Attribute name", W.lg, (r) => r.attributeName, { strong: true }),
  textColumn("source", "Source", W.lg, (r) => r.source, { clamp: true }),
  textColumn("dateOfAssessment", "Date of assessment", W.md, (r) => r.dateOfAssessment),
  textColumn("comments", "Comments", W.xl, (r) => r.comments, { clamp: true }),
  textColumn("criteria", "Criteria", W.lg, (r) => r.criteria, { clamp: true }),
  textColumn("trend", "Trend", W.sm, (r) => r.trend),
  textColumn("qualityText", "Quality text", W.lg, (r) => r.qualityText, { clamp: true }),
  textColumn("num", "Num", W.xs, (r) => r.num),
  textColumn("unit", "Unit", W.sm, (r) => r.unit),
  textColumn("qualification", "Qualification", W.md, (r) => r.qualification),
];

const ATTRIBUTES_SPEC: FilterSpec<AttributeRow> = {
  labels: ["Species code & name", "NSX code", "Common name", "Region group", "Region name", "Attributes type", "Date"],
  selects: [
    { id: "regionGroup", label: "Region group", get: (r) => r.regionGroup },
    { id: "regionName", label: "Region name", get: (r) => r.regionName },
    { id: "type", label: "Attributes type", get: (r) => [...(r.isCurrent === "Yes" ? ["Current"] : []), ...(r.isOfficial === "Yes" ? ["Official"] : [])] },
  ],
  date: { label: "Date", days: (r) => r.days },
};

export function useAttributesTab() {
  const taxa = useFloraTaxa();
  const rows = useMemo(() => attributeRowsFor(taxa), [taxa]);
  const attributes = useMemo(
    () => [
      ...options(rows, "attributeGroup", "Attribute group", (r) => r.attributeGroup),
      ...options(rows, "attributeName", "Attribute name", (r) => r.attributeName),
      ...options(rows, "trend", "Trend", (r) => r.trend),
      ...options(rows, "source", "Source", (r) => r.source),
    ],
    [rows],
  );
  return useSheetTab<AttributeRow>({
    sheetTitle: "BioData - Taxonomy list - Species Attributes",
    spec: ATTRIBUTES_SPEC,
    rows,
    example: EXAMPLE_ATTRIBUTE,
    attributes,
    columns: attributeColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.attributeName, r.attributeGroup, r.regionName, r.source, r.comments],
    searchPlaceholder: "Search by code, species, common name, attribute or region",
    tableLabel: "Species attributes, one row each",
    noun: "attributes",
    emptyDescription: "Attributes recorded on a taxon in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Attributes", value: distinct(inView.map((r) => r.attributeName)).toLocaleString("en-AU") },
    ],
    exportName: "taxonomy-species-attributes-report",
  });
}

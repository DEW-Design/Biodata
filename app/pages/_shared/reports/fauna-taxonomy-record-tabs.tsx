"use client";

import { useMemo } from "react";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { faunaAttributeRowsFor, type FaunaAttributeRow } from "@/app/pages/_shared/reports/fauna-taxonomy-place-data";
import { SpeciesCell } from "@/app/pages/_shared/reports/report-table";
import { auditRowsFor, type AuditRow } from "@/app/pages/_shared/reports/taxonomy-audit-data";
import { EXAMPLE_ATTRIBUTE } from "@/app/pages/_shared/reports/taxonomy-example-rows";
import { useFaunaChanges, useFaunaTaxa } from "@/app/pages/_shared/reports/taxonomy-fauna";
import { FAUNA_TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";
import { distinct } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { nsxColumns, useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The last two tabs of the Fauna Taxonomy Report so far (the designer, 16 Oct 2026): "Taxonomy list - Species Attributes" and "Taxonomy list Audit Log Report", each
// built by `useSheetTab` (taxonomy-sheet-tab.tsx) as the Flora report's two are (taxonomy-herb-attributes-tabs.tsx, taxonomy-audit-tab.tsx), whose rows they reuse for
// the Fauna taxa. The sheets' metadata is the table's own search and Filter, written above the columns of the exports. Departures from the sheets, on purpose, as
// there (sentence case, typos fixed, the Filter menu also offering the facets the metadata does not):
//   - Species Attributes: "Attributes is Current" and "Attributes is Officical" are "Attribute is current?" and "Attribute is official?", as the Attributes table has them.
//     The sheet lists "Region Group" twice in its columns and again twice in its metadata; the second of each is read as the Region name, the field that follows
//     Region Group in the Attributes table. "Attributes type: Current or Official" is a select of the two. The date filter reads the Date of assessment. The sheet
//     ends with Created By, Created On, Modified By and Modified On, which the table does not hold per row: they are the taxon's own, as in the other Fauna tabs
//     (fauna-taxonomy-place-data.ts). No Fauna taxon has an attribute yet, so the tab shows one mock Example record;
//   - Audit Log: the same events as the Flora report's (what a person committed in Taxonomy Management, and the days and people a taxon records), for the Fauna
//     taxa. The sheet's Species is the scientific name, and its NSX Code comes before it, so the table has no "Species number" column. The sheet's last columns are
//     User and Comments after three blank columns, which are not drawn; the app records one person for each event and no comment, so Comments, Source type and
//     Source are drawn and left empty. Audit log duration and Modified date are one question, as in the Flora report, and the Filter's date answers it.

const REPORT = { reportTitle: FAUNA_TAXONOMY_REPORT_TITLE, reportSubtitle: "The fauna BioData holds, one report for each view." } as const;

// ── Species Attributes ──

const attributeColumns: ViewColumn<FaunaAttributeRow>[] = [
  ...nsxColumns<FaunaAttributeRow>(),
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
  textColumn("createdBy", "Created by", W.md, (r) => r.createdBy),
  textColumn("createdOn", "Created on", W.md, (r) => r.createdOn),
  textColumn("modifiedBy", "Modified by", W.md, (r) => r.modifiedBy),
  textColumn("modifiedOn", "Modified on", W.md, (r) => r.modifiedOn),
];

const ATTRIBUTES_SPEC: FilterSpec<FaunaAttributeRow> = {
  labels: ["Species code & name", "NSX code", "Common name", "Region group", "Region name", "Attributes type", "Date"],
  selects: [
    { id: "regionGroup", label: "Region group", get: (r) => r.regionGroup },
    { id: "regionName", label: "Region name", get: (r) => r.regionName },
    { id: "type", label: "Attributes type", get: (r) => [...(r.isCurrent === "Yes" ? ["Current"] : []), ...(r.isOfficial === "Yes" ? ["Official"] : [])] },
  ],
  date: { label: "Date", days: (r) => r.days },
};

/** The one mock record the tab shows while no Fauna taxon has an attribute (designer, 16 Oct 2026): a made-up attribute on a sample Fauna taxon. Not stored. */
const EXAMPLE_FAUNA_ATTRIBUTE: FaunaAttributeRow = {
  ...EXAMPLE_ATTRIBUTE,
  taxonId: "M01170",
  nsx: "M01170",
  nsxDescription: "Isoodon obesulus",
  common: "Southern Brown Bandicoot",
  commonNames: "Southern Brown Bandicoot",
  attributeGroup: "Habitat",
  attributeName: "Heathland",
  qualityText: "",
  createdBy: "Olivia Wyatt",
  createdOn: "12 Mar 2019",
  modifiedBy: "Lana Steiner",
  modifiedOn: "4 Aug 2026",
};

export function useFaunaAttributesTab() {
  const taxa = useFaunaTaxa();
  const rows = useMemo(() => faunaAttributeRowsFor(taxa), [taxa]);
  const attributes = useMemo(() => {
    const one = (id: string, label: string, get: (r: FaunaAttributeRow) => string): Attribute<FaunaAttributeRow>[] => {
      const options = optionsFromValues(rows.map(get));
      return options.length > 0 ? [{ id, kind: "options", label, options, get }] : [];
    };
    return [
      ...one("attributeGroup", "Attribute group", (r) => r.attributeGroup),
      ...one("attributeName", "Attribute name", (r) => r.attributeName),
      ...one("trend", "Trend", (r) => r.trend),
      ...one("source", "Source", (r) => r.source),
      ...one("createdBy", "Created by", (r) => r.createdBy),
    ];
  }, [rows]);
  return useSheetTab<FaunaAttributeRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list - Species Attributes",
    spec: ATTRIBUTES_SPEC,
    rows,
    example: EXAMPLE_FAUNA_ATTRIBUTE,
    attributes,
    columns: attributeColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.attributeName, r.attributeGroup, r.regionName, r.source, r.comments],
    searchPlaceholder: "Search by code, species, common name, attribute or region",
    tableLabel: "Species attributes, one row each",
    noun: "attributes",
    emptyDescription: "Attributes recorded on a Fauna taxon in Taxonomy Management appear here.",
    initialSort: { column: "nsxDescription", direction: "ascending" },
    latest: (r) => r.latestMs,
    facts: (inView) => [
      { label: "Taxa", value: distinct(inView.map((r) => r.taxonId)).toLocaleString("en-AU") },
      { label: "Attributes", value: distinct(inView.map((r) => r.attributeName)).toLocaleString("en-AU") },
    ],
    exportName: "fauna-taxonomy-species-attributes-report",
  });
}

// ── Audit log ──

const auditColumns: ViewColumn<AuditRow>[] = [
  numberColumn("seq", "Seq#", W.xs, (r) => r.seq, { sticky: true }),
  textColumn("timestamp", "Timestamp", W.lg, (r) => r.timestamp),
  textColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  {
    id: "species",
    label: "Species",
    width: W.lg,
    sort: (r) => r.nsxDescription,
    cell: (r) => <SpeciesCell scientific={r.nsxDescription} />,
    text: (r) => r.nsxDescription,
  },
  textColumn("common", "Common name", W.lg, (r) => r.common),
  textColumn("entityType", "Entity type", W.md, (r) => r.entityType),
  textColumn("modifiedEntity", "Modified entity", W.lg, (r) => r.modifiedEntity, { strong: true }),
  textColumn("previous", "Previous details", W.xl, (r) => r.previous, { clamp: true }),
  textColumn("current", "Current details", W.xl, (r) => r.current, { clamp: true }),
  textColumn("action", "Action", W.md, (r) => r.action),
  textColumn("sourceType", "Source type", W.md, () => ""),
  textColumn("source", "Source", W.md, () => ""),
  textColumn("user", "User", W.md, (r) => r.user),
  textColumn("comments", "Comments", W.lg, () => ""),
];

const AUDIT_SPEC: FilterSpec<AuditRow> = {
  labels: ["NSX code", "Species code & name", "Common name", "Audit log duration", "Modified by", "Modified date"],
  selects: [{ id: "modifiedBy", label: "Modified by", get: (r) => r.user }],
  date: { label: "Audit log duration", days: (r) => [r.day] },
};

export function useFaunaAuditTab() {
  const taxa = useFaunaTaxa();
  const changes = useFaunaChanges();
  const rows = useMemo(() => auditRowsFor(taxa, changes), [taxa, changes]);
  const attributes = useMemo(() => {
    const action = optionsFromValues(rows.map((r) => r.action));
    const entity = optionsFromValues(rows.map((r) => r.entityType));
    return [
      ...(action.length > 0 ? [{ id: "action", kind: "options" as const, label: "Action", options: action, get: (r: AuditRow) => r.action }] : []),
      ...(entity.length > 0 ? [{ id: "entityType", kind: "options" as const, label: "Entity type", options: entity, get: (r: AuditRow) => r.entityType }] : []),
    ];
  }, [rows]);
  return useSheetTab<AuditRow>({
    ...REPORT,
    sheetTitle: "BioData - Fauna Taxonomy list Audit Log Report",
    spec: AUDIT_SPEC,
    rows,
    attributes,
    columns: auditColumns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.modifiedEntity, r.previous, r.current, r.user],
    searchPlaceholder: "Search by species, name, action or user",
    tableLabel: "Audit log, one row for each event",
    noun: "events",
    emptyDescription: "What is done to a Fauna taxon in Taxonomy Management appears here.",
    initialSort: { column: "seq", direction: "ascending" },
    latest: (r) => r.ms,
    facts: (inView) => [{ label: "Taxa", value: distinct(inView.map((r) => r.nsx)).toLocaleString("en-AU") }],
    exportName: "fauna-taxonomy-audit-log-report",
  });
}

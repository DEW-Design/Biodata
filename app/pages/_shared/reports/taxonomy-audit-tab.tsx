"use client";

import { useMemo } from "react";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { REPORT_WIDTH as W, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { AUDIT_ACTIONS, auditRowsFor, type AuditRow } from "@/app/pages/_shared/reports/taxonomy-audit-data";
import { MOCK_FLORA_AUDIT } from "@/app/pages/_shared/reports/taxonomy-audit-mock";
import { useFloraChanges, useFloraTaxa } from "@/app/pages/_shared/reports/taxonomy-flora";
import { distinct } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The Flora Taxonomy Report's "Taxonomy list Audit Log Report" (the designer, 15 Oct 2026), built by `useSheetTab`. It rolls up the Rename, Combine, Split and Append
// of Taxonomy Management, which have no tab of their own. The rows and what they are made
// of are in taxonomy-audit-data.ts. The sheet's metadata, NSX Code, Species Code & Name, Common Name, Audit log Duration (a start and an end date),
// Modified By and Modified Date ("Date Timelines"), is the table's own search and Filter (taxonomy-sheet-tab.tsx): the typed lines are the search,
// Modified By is a Filter attribute, and the Filter's date (its Last 7, 30 and 90 days and its custom range) is both Audit log Duration and Modified
// Date, which are one question; the export writes it under Audit log Duration. Departures from the sheet, on purpose, as in the other tabs:
//   - the sheet ends with three pairs of User and Comments; the app records one person for each event and no comment, so the first User
//     is filled and the other columns are drawn, in the sheet's order and under its labels, and left empty;
//   - Source type is "Portal" and Source the role that made the change, as in the designer's capture of how an entry is written (taxonomy-audit-data.ts);
//   - the sheet's "Species Number" is "NSX code" (the designer, 16 Oct 2026);
//   - the sheet's blank column between Comments and the second User is not drawn.

const columns: ViewColumn<AuditRow>[] = [
  numberColumn("seq", "Seq#", W.xs, (r) => r.seq, { sticky: true }),
  textColumn("timestamp", "Timestamp", W.lg, (r) => r.timestamp),
  textColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  textColumn("entityType", "Entity type", W.md, (r) => r.entityType),
  textColumn("modifiedEntity", "Modified entity", W.lg, (r) => r.modifiedEntity, { strong: true }),
  textColumn("previous", "Previous details", W.xl, (r) => r.previous, { clamp: true }),
  textColumn("current", "Current details", W.xl, (r) => r.current, { clamp: true }),
  textColumn("action", "Action", W.md, (r) => r.action),
  textColumn("sourceType", "Source type", W.md, (r) => r.sourceType),
  textColumn("source", "Source", W.md, (r) => r.source),
  textColumn("user", "User", W.md, (r) => r.user),
  textColumn("comments", "Comments", W.lg, () => ""),
  textColumn("user2", "User", W.md, () => ""),
  textColumn("comments2", "Comments", W.lg, () => ""),
  textColumn("user3", "User", W.md, () => ""),
  textColumn("comments3", "Comments", W.lg, () => ""),
];

const SPEC: FilterSpec<AuditRow> = {
  labels: ["NSX code", "Species code & name", "Common name", "Audit log duration", "Modified by", "Modified date"],
  selects: [{ id: "modifiedBy", label: "Modified by", get: (r) => r.user }],
  date: { label: "Audit log duration", days: (r) => [r.day] },
};

export function useAuditTab() {
  const taxa = useFloraTaxa();
  const changes = useFloraChanges();
  const rows = useMemo(() => auditRowsFor(taxa, changes, MOCK_FLORA_AUDIT), [taxa, changes]);
  const attributes = useMemo(() => {
    const action = optionsFromValues([...AUDIT_ACTIONS, ...rows.map((r) => r.action)]);
    const entity = optionsFromValues(rows.map((r) => r.entityType));
    return [
      ...(action.length > 0 ? [{ id: "action", kind: "options" as const, label: "Action", options: action, get: (r: AuditRow) => r.action }] : []),
      ...(entity.length > 0 ? [{ id: "entityType", kind: "options" as const, label: "Entity type", options: entity, get: (r: AuditRow) => r.entityType }] : []),
    ];
  }, [rows]);

  return useSheetTab<AuditRow>({
    sheetTitle: "BioData - Taxonomy list Audit Log Report",
    spec: SPEC,
    rows,
    attributes,
    columns,
    rowId: (r) => r.id,
    searchText: (r) => [r.nsx, r.nsxDescription, r.common, r.commonNames, r.modifiedEntity, r.previous, r.current, r.user],
    searchPlaceholder: "Search by species, name, action or user",
    tableLabel: "Audit log, one row for each event",
    noun: "events",
    emptyDescription: "What is done to a taxon in Taxonomy Management appears here.",
    initialSort: { column: "seq", direction: "ascending" },
    latest: (r) => r.ms,
    facts: (inView) => [{ label: "Taxa", value: distinct(inView.map((r) => r.nsx)).toLocaleString("en-AU") }],
    exportName: "taxonomy-audit-log-report",
  });
}

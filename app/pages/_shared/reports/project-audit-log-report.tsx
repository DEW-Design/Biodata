"use client";

import { useMemo } from "react";
import { ClockRewind } from "@untitledui/icons";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { useProjectAuditLog } from "@/app/pages/_shared/project-audit-log-store";
import { auditRowsFor, formatAuditTimestamp, type AuditReportRow } from "@/app/pages/_shared/reports/project-audit-log-report-data";
import { REPORT_WIDTH as W, emptyColumn, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { DataReport } from "@/app/pages/_shared/reports/report-table";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";

// The Project Audit Log Report (Figma YMproGZfrFB5jUqPHPxMhk frame 2658:176999): one row per change to a project, all 13 of the
// wireframe's columns in its order, in a table that scrolls sideways. Fitted into the shared report pattern (report-table.tsx)
// with these departures from the wireframe, on purpose:
//   - the wireframe's Filters card is the one filter menu (CONTRACTS 4.2d): Project ID / Title is the search box's job, Audit log
//     duration and Modified date are one date attribute ("Modified date", with its presets and a custom range), Modified by is
//     "User", and Additional filter is the menu itself, offering Action, Entity type, Source type and Source;
//   - Comments is empty for every row: neither Add Project nor the project's edit asks for a comment, so there is none to show;
//   - the log is only what has been done in this browser since the log began (project-audit-log-store.ts): a CREATE when a project
//     is registered, an UPDATE per field when an edit is saved. A project nobody has registered or edited since has no rows, and
//     none are made up;
//   - Previous details is empty for a CREATE and for a field that had no value before; Current details likewise;
//   - BioData Admin only (role-access `projectAuditLog`): no other role has rows, and the report is not offered to them.

const columns: ViewColumn<AuditReportRow>[] = [
  numberColumn("seq", "Seq#", W.xs, (r) => r.seq, { sticky: true }),
  { ...numberColumn<AuditReportRow>("timestamp", "Timestamp", W.lg, (r) => formatAuditTimestamp(r.at)), sort: (r) => r.at },
  idColumn("projectCode", "Project ID", W.sm, (r) => r.projectCode),
  textColumn("projectTitle", "Project title", W.xl, (r) => r.projectTitle, { strong: true }),
  textColumn("entityType", "Entity type", W.sm, (r) => r.entityType),
  textColumn("modifiedEntity", "Modified entity", W.lg, (r) => r.modifiedEntity),
  textColumn("previous", "Previous details", W.xl, (r) => r.previous, { clamp: true }),
  textColumn("current", "Current details", W.xl, (r) => r.current, { clamp: true }),
  textColumn("action", "Action", W.sm, (r) => r.action),
  textColumn("sourceType", "Source type", W.md, (r) => r.sourceType),
  textColumn("source", "Source", W.lg, (r) => r.source),
  textColumn("user", "User", W.lg, (r) => r.user),
  emptyColumn("comments", "Comments", W.xl),
];

// A filter that has one value to choose (every change so far was made in the web portal) has nothing to narrow by, so it is not
// offered until the log holds a second value.
function auditAttributes(rows: AuditReportRow[]): Attribute<AuditReportRow>[] {
  const values = (pick: (r: AuditReportRow) => string) => optionsFromValues(rows.map(pick).filter(Boolean));
  const all: Attribute<AuditReportRow>[] = [
    { id: "action", kind: "options", label: "Action", options: values((r) => r.action), get: (r) => r.action },
    { id: "entityType", kind: "options", label: "Entity type", options: values((r) => r.entityType), get: (r) => r.entityType },
    { id: "sourceType", kind: "options", label: "Source type", options: values((r) => r.sourceType), get: (r) => r.sourceType },
    { id: "source", kind: "options", label: "Source", options: values((r) => r.source), get: (r) => r.source },
    { id: "user", kind: "options", label: "User", searchable: true, options: values((r) => r.user), get: (r) => r.user },
    { id: "modified", kind: "date", label: "Modified date", get: (r) => ({ start: r.at, end: r.at }) },
  ];
  return all.filter((a) => a.kind === "date" || a.options.length > 1);
}

const count = (rows: AuditReportRow[], action: string) => rows.filter((r) => r.action === action).length.toLocaleString("en-AU");

export function ProjectAuditLogReport() {
  const role = useUserRole();
  const canSee = useFeatureAccess("projectAuditLog");
  const entries = useProjectAuditLog();
  const rows = useMemo(() => auditRowsFor(entries, role), [entries, role]);
  const attributes = useMemo(() => auditAttributes(rows), [rows]);

  if (!canSee) {
    return <ListEmptyState icon={ClockRewind} title="Only BioData Admin can report on the project audit log" description="The audit log covers every change to every project, so this report has no rows for your role." />;
  }

  return (
    <DataReport
      title="Project Audit Log Report"
      subtitle="Every change to a project, one row per field: what it was, what it is now, who changed it and where from."
      icon={ClockRewind}
      rows={rows}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.projectCode, r.projectTitle, r.modifiedEntity, r.previous, r.current, r.user]}
      searchLabel="Search the report"
      searchPlaceholder="Search by project ID or title, field or user"
      tableLabel="Project changes, one row each"
      noun="changes"
      emptyDescription="Changes appear here as projects are registered and edited, from the moment this log began."
      initialSort={{ column: "timestamp", direction: "descending" }}
      latest={(r) => r.at}
      facts={(inView) => [
        { label: "Created", value: count(inView, "CREATE") },
        { label: "Updates", value: count(inView, "UPDATE") },
      ]}
      exportName="project-audit-log-report"
    />
  );
}

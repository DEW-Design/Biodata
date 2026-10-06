"use client";

import { useMemo } from "react";
import { FileCheck02 } from "@untitledui/icons";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { agreementAttributes } from "@/app/pages/_shared/reports/agreement-report-attributes";
import { dateColumn, emailColumn, purposeColumn, requestorColumn, reviewColumns, statusColumn } from "@/app/pages/_shared/reports/agreement-report-columns";
import { dsaRowsFor, type DsaReportRow } from "@/app/pages/_shared/reports/agreement-report-data";
import { csvExportAction, REPORT_WIDTH as W, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { DataReport } from "@/app/pages/_shared/reports/report-table";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";

// The Data Sharing Agreement Report (Figma YMproGZfrFB5jUqPHPxMhk frame 2645:175863, columns list 2645:176111): one row per
// data sharing agreement, all 16 of the wireframe's columns in its order, in a table that scrolls sideways. The same shape and
// the same departures as the Data Licence Agreement Report (dla-agreement-report.tsx), plus:
//   - the wireframe's "Organisation" filter is "Partnership organisation", the column it filters;
//   - "Integration details" is the systems the partner connects, each with what it may do and which scopes it has;
//   - data sharing agreements are managed by BioData Admin alone, so no other role has rows, and the report is not
//     offered to them (reports-data.ts `feature`).

const columns: ViewColumn<DsaReportRow>[] = [
  numberColumn("seq", "Seq#", W.xs, (r) => String(r.seq), { sticky: true }),
  idColumn("id", "DSA ID", W.md, (r) => r.id),
  dateColumn("requestedAt", "Requested date", (r) => r.requestedAt),
  textColumn("organisation", "Partnership organisation", W.lg, (r) => r.organisation),
  purposeColumn(),
  requestorColumn(),
  emailColumn(),
  dateColumn("start", "Agreement start date", (r) => r.startIso),
  dateColumn("end", "Agreement end date", (r) => r.endIso),
  statusColumn("DSA status"),
  ...reviewColumns<DsaReportRow>(),
  textColumn("integration", "Integration details", W.xxl, (r) => r.integration, { clamp: true }),
];

const count = (rows: DsaReportRow[], label: string) => rows.filter((r) => r.statusLabel === label).length.toLocaleString("en-AU");

export function DsaAgreementReport() {
  const role = useUserRole();
  const canSee = useFeatureAccess("dsaManagement");
  const dsas = useDsas();
  const rows = useMemo(() => dsaRowsFor(dsas, role), [dsas, role]);
  const attributes = useMemo(() => agreementAttributes(rows, "Partnership organisation"), [rows]);

  if (!canSee) {
    return <ListEmptyState icon={FileCheck02} title="Only BioData Admin can report on data sharing agreements" description="Data sharing agreements are set up and reviewed by BioData Admin, so this report has no rows for your role." />;
  }

  return (
    <DataReport
      title="Data Sharing Agreement Report"
      subtitle="Every data sharing agreement, with the partner, who asked, who approved it, for how long and how it connects."
      icon={FileCheck02}
      rows={rows}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.id, r.requestor, r.organisation, r.email, r.purpose, r.integration, r.approver]}
      searchLabel="Search the report"
      searchPlaceholder="Search by DSA ID, partner, requestor or purpose"
      tableLabel="Data sharing agreements, one row each"
      noun="agreements"
      emptyDescription="Agreements with partners appear here, with their status and agreement period."
      initialSort={{ column: "requestedAt", direction: "descending" }}
      latest={(r) => r.requestedAt}
      facts={(inView) => [
        { label: "Active", value: count(inView, "Active") },
        { label: "Under review", value: count(inView, "Under review") },
      ]}
      actions={(inView) => <RecordActionBar onDark menu={[csvExportAction(inView, columns, "data-sharing-agreement-report.csv")]} />}
    />
  );
}

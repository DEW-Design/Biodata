"use client";

import { useMemo } from "react";
import { FileCheck02 } from "@untitledui/icons";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { agreementAttributes } from "@/app/pages/_shared/reports/agreement-report-attributes";
import { dateColumn, emailColumn, purposeColumn, requestorColumn, reviewColumns, statusColumn } from "@/app/pages/_shared/reports/agreement-report-columns";
import { dlaRowsFor, type DlaReportRow } from "@/app/pages/_shared/reports/agreement-report-data";
import { csvExportAction, REPORT_WIDTH as W, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { DataReport } from "@/app/pages/_shared/reports/report-table";
import { useUserRole } from "@/lib/use-user-role";

// The Data Licence Agreement Report (Figma YMproGZfrFB5jUqPHPxMhk frame 2645:175676, columns list 2645:176056): one row per
// data licence request or agreement, all 16 of the wireframe's columns in its order, in a table that scrolls sideways.
// Fitted into the shared report pattern (report-table.tsx) with these departures from the wireframe, on purpose:
//   - the title is spelled "Licence", as the DLA screens and the rail spell it; the wireframe says "License";
//   - the wireframe's Filters card (DLA ID, Organization, Requestor, Approver, Agreement Period, "Additional Filter", two
//     chips, Apply Filter) is the one filter every table has: a Filter menu that applies as values are chosen, with the
//     search box doing the ID; "Additional Filter" is not built (CONTRACTS 4.2d);
//   - the Columns list's checkboxes and Apply are the Columns button, which applies as each is chosen (1.9 item 2);
//   - "Data requested" is the locations the request asks for, with the access level of each;
//   - the rows are the app's own requests (the same ones the DLA screens hold), not the wireframe's dashes. Drafts are
//     left out. A registered user sees their own requests and BioData Admin sees every one;
//   - the wireframe's "50 of 1797" is the table's own footer. See agreement-report-data.ts for what each column reads.

const columns: ViewColumn<DlaReportRow>[] = [
  numberColumn("seq", "Seq#", W.xs, (r) => String(r.seq), { sticky: true }),
  idColumn("id", "DLA ID", W.md, (r) => r.id),
  textColumn("dataRequested", "Data requested", W.xl, (r) => r.dataRequested, { clamp: true }),
  dateColumn("requestedAt", "Requested date", (r) => r.requestedAt),
  purposeColumn(),
  requestorColumn(),
  textColumn("organisation", "Organisation", W.lg, (r) => r.organisation),
  emailColumn(),
  dateColumn("start", "Agreement start date", (r) => r.startIso),
  dateColumn("end", "Agreement end date", (r) => r.endIso),
  statusColumn("DLA status"),
  ...reviewColumns<DlaReportRow>(),
];

const count = (rows: DlaReportRow[], label: string) => rows.filter((r) => r.statusLabel === label).length.toLocaleString("en-AU");

export function DlaAgreementReport() {
  const role = useUserRole();
  const dlas = useDlas();
  const rows = useMemo(() => dlaRowsFor(dlas, role), [dlas, role]);
  const attributes = useMemo(() => agreementAttributes(rows, "Organisation"), [rows]);

  return (
    <DataReport
      title="Data Licence Agreement Report"
      subtitle="Every data licence request and agreement, with who asked, what for, who approved it and for how long."
      icon={FileCheck02}
      rows={rows}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.id, r.requestor, r.organisation, r.email, r.purpose, r.dataRequested, r.approver]}
      searchLabel="Search the report"
      searchPlaceholder="Search by DLA ID, requestor, organisation or purpose"
      tableLabel="Data licence requests and agreements, one row each"
      noun="requests"
      emptyDescription="Requests you make for data licences appear here, with their status and agreement period."
      initialSort={{ column: "requestedAt", direction: "descending" }}
      latest={(r) => r.requestedAt}
      facts={(inView) => [
        { label: "Active", value: count(inView, "Active") },
        { label: "Under review", value: count(inView, "Under review") },
      ]}
      actions={(inView) => <RecordActionBar onDark menu={[csvExportAction(inView, columns, "data-licence-agreement-report.csv")]} />}
    />
  );
}

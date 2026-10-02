"use client";

import { ReportPage } from "@/app/pages/_shared/reports/report-page";
import { SpecimenDbRefreshReport } from "@/app/pages/_shared/reports/specimendb-refresh-report";

// /pages/reports/specimendb-refresh - the SpecimenDB Refresh Report, one of the reports on the Reports landing page.
// What a role sees inside it is decided by the report (specimendb-refresh-report-data.ts `visibleTo`).
export default function SpecimenDbRefreshReportPage() {
  return (
    <ReportPage name="SpecimenDB Refresh Report">
      <SpecimenDbRefreshReport />
    </ReportPage>
  );
}

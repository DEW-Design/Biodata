"use client";

import { ConsolidatedReport } from "@/app/pages/_shared/reports/consolidated-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/consolidated - the Consolidated report: every species sighting with its visit, site and project, one of the reports on the
// Reports landing page. What a role sees inside it is decided by the report (report-projects.ts, and the project page's own record access).
export default function ConsolidatedReportPage() {
  return (
    <ReportPage name="Consolidated report">
      <ConsolidatedReport />
    </ReportPage>
  );
}

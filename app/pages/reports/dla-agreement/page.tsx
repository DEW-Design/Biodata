"use client";

import { DlaAgreementReport } from "@/app/pages/_shared/reports/dla-agreement-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/dla-agreement - the Data Licence Agreement Report, one of the reports on the Reports landing page.
// What a role sees inside it is decided by the report (agreement-report-data.ts `dlaRowsFor`).
export default function DlaAgreementReportPage() {
  return (
    <ReportPage name="Data Licence Agreement Report">
      <DlaAgreementReport />
    </ReportPage>
  );
}

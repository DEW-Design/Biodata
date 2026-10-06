"use client";

import { DsaAgreementReport } from "@/app/pages/_shared/reports/dsa-agreement-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/dsa-agreement - the Data Sharing Agreement Report, one of the reports on the Reports landing page.
// BioData Admin only (agreement-report-data.ts `dsaRowsFor`); the landing and the switcher do not offer it to other roles.
export default function DsaAgreementReportPage() {
  return (
    <ReportPage name="Data Sharing Agreement Report">
      <DsaAgreementReport />
    </ReportPage>
  );
}

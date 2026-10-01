"use client";

import { ReportPage } from "@/app/pages/_shared/reports/report-page";
import { SensitiveRestrictionReport } from "@/app/pages/_shared/reports/sensitive-restriction-report";

// /pages/reports/sensitive-restriction - the Project Sensitive and Restriction Report, one of the reports on the
// Reports landing page. What a role sees inside it is decided by the report (sensitive-restriction-report-data.ts `visibleTo`).
export default function SensitiveRestrictionReportPage() {
  return (
    <ReportPage name="Project Sensitive and Restriction Report">
      <SensitiveRestrictionReport />
    </ReportPage>
  );
}

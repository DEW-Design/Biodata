"use client";

import { DataValidationErrorReport } from "@/app/pages/_shared/reports/data-validation-error-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/data-validation-error - the Data Validation Error Report: the errors found in one dataset, chosen by
// project and dataset, one of the reports on the Reports landing page. What a role sees inside it is decided by the
// ingestion report's `visibleTo`.
export default function DataValidationErrorReportPage() {
  return (
    <ReportPage name="Data Validation Error Report">
      <DataValidationErrorReport />
    </ReportPage>
  );
}

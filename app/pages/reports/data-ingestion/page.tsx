"use client";

import { DataIngestionReport } from "@/app/pages/_shared/reports/data-ingestion-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/data-ingestion - the Data Ingestion Report Pre-Flight Validation: every dataset upload, from
// validation to approval, one of the reports on the Reports landing page. What a role sees inside it is decided by the
// ingestion report's `visibleTo`.
export default function DataIngestionReportPage() {
  return (
    <ReportPage name="Data Ingestion Report Pre-Flight Validation">
      <DataIngestionReport />
    </ReportPage>
  );
}

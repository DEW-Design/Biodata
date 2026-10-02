"use client";

import { PostIngestionReport } from "@/app/pages/_shared/reports/post-ingestion-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/post-ingestion - the Project Dataset Post Ingestion report: every dataset submission with its project's
// facts beside it, one of the reports on the Reports landing page. What a role sees inside it is decided by the ingestion
// report's `visibleTo`.
export default function PostIngestionReportPage() {
  return (
    <ReportPage name="Project Dataset Post Ingestion">
      <PostIngestionReport />
    </ReportPage>
  );
}

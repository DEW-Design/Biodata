"use client";

import { ProjectDetailReport } from "@/app/pages/_shared/reports/project-detail-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/project-detail - the Project Detail Report (one row per project), one of the reports on the
// Reports landing page. What a role sees inside it is decided by the report (report-projects.ts).
export default function ProjectDetailReportPage() {
  return (
    <ReportPage name="Project Detail Report">
      <ProjectDetailReport />
    </ReportPage>
  );
}

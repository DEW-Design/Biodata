"use client";

import { SpeciesDetailReport } from "@/app/pages/_shared/reports/species-detail-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/species-detail - the Species Detail Report (one row per species record), one of the reports on
// the Reports landing page. What a role sees inside it is decided by the report (report-projects.ts, and the
// project page's own record access).
export default function SpeciesDetailReportPage() {
  return (
    <ReportPage name="Species Detail Report">
      <SpeciesDetailReport />
    </ReportPage>
  );
}

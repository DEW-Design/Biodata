"use client";

import { FaunaTaxonomyReport } from "@/app/pages/_shared/reports/fauna-taxonomy-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";
import { FAUNA_TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";

// /pages/reports/fauna-taxonomy - the Fauna Taxonomy Report, one of the reports on the Reports landing page: one report with a tab for each sheet
// (?tab=list-detail|species-status|aus-distribution|regional-data|species-reference|attributes|audit-log). BioData Admin and above only (`taxonomyManagement`, as Taxonomy Management and the Flora Taxonomy Report).
export default function FaunaTaxonomyReportPage() {
  return (
    <ReportPage name={FAUNA_TAXONOMY_REPORT_TITLE}>
      <FaunaTaxonomyReport />
    </ReportPage>
  );
}

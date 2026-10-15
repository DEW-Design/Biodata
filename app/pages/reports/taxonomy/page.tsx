"use client";

import { TaxonomyReport } from "@/app/pages/_shared/reports/taxonomy-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";
import { TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";

// /pages/reports/taxonomy - the Flora Taxonomy Report, one of the reports on the Reports landing page: one report with a tab for each
// report inside it (?tab=list-detail|sa-regions). BioData Admin and above only (`taxonomyManagement`, as Taxonomy Management).
export default function TaxonomyReportPage() {
  return (
    <ReportPage name={TAXONOMY_REPORT_TITLE}>
      <TaxonomyReport />
    </ReportPage>
  );
}

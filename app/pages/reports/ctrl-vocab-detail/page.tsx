"use client";

import { CtrlVocabDetailReport } from "@/app/pages/_shared/reports/ctrl-vocab-detail-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/ctrl-vocab-detail - the Control Vocab Detail Report, one of the reports on the Reports landing page. BioData Super Admin only (`ctrlVocabManagement`, as Controlled Vocabulary).
export default function CtrlVocabDetailReportPage() {
  return (
    <ReportPage name="Control Vocab Detail Report">
      <CtrlVocabDetailReport />
    </ReportPage>
  );
}

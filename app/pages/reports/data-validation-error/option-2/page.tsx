"use client";

import { DataValidationErrorReport } from "@/app/pages/_shared/reports/data-validation-error-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/data-validation-error/option-2 - the Data Validation Error Report with the Project and Dataset selects
// as the first row of the card, compared with option 1 (the selects between the card and the counts) through the Layout
// tool on the Prototype tools bar. When one is chosen the other is deleted (CONTRACTS 4.4).
export default function DataValidationErrorReportOption2Page() {
  return (
    <ReportPage name="Data Validation Error Report">
      <DataValidationErrorReport layout="option-2" />
    </ReportPage>
  );
}

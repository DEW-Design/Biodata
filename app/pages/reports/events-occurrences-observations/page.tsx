"use client";

import { RecordsReport } from "@/app/pages/_shared/reports/records-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/events-occurrences-observations - the Events, Occurrences and Observations Report: one report
// with three tabs (?tab=events|occurrences|observations), one of the reports on the Reports landing page. What a
// role sees inside it is decided by the report (report-projects.ts, and the project page's own record access).
export default function EventsOccurrencesObservationsReportPage() {
  return (
    <ReportPage name="Events, Occurrences and Observations Report">
      <RecordsReport />
    </ReportPage>
  );
}

"use client";

import { PermissionDetailReport } from "@/app/pages/_shared/reports/access-reports";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/permission-detail - the Permission Detail Report, one of the reports on the Reports landing page. BioData Admin and above only (`userManagement`, as User Management).
export default function PermissionDetailReportPage() {
  return (
    <ReportPage name="Permission Detail Report">
      <PermissionDetailReport />
    </ReportPage>
  );
}

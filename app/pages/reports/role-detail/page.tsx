"use client";

import { RoleDetailReport } from "@/app/pages/_shared/reports/access-reports";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/role-detail - the Role Detail Report, one of the reports on the Reports landing page. BioData Admin and above only (`userManagement`, as User Management).
export default function RoleDetailReportPage() {
  return (
    <ReportPage name="Role Detail Report">
      <RoleDetailReport />
    </ReportPage>
  );
}

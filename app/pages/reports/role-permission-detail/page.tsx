"use client";

import { RolePermissionDetailReport } from "@/app/pages/_shared/reports/access-reports";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/role-permission-detail - the Role - Permission Detail Report, one of the reports on the Reports landing page. BioData Admin and above only (`userManagement`, as User Management).
export default function RolePermissionDetailReportPage() {
  return (
    <ReportPage name="Role - Permission Detail Report">
      <RolePermissionDetailReport />
    </ReportPage>
  );
}

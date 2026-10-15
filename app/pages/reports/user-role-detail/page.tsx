"use client";

import { UserRoleDetailReport } from "@/app/pages/_shared/reports/access-reports";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/user-role-detail - the User - Role Detail Report, one of the reports on the Reports landing page. BioData Admin and above only (`userManagement`, as User Management).
export default function UserRoleDetailReportPage() {
  return (
    <ReportPage name="User - Role Detail Report">
      <UserRoleDetailReport />
    </ReportPage>
  );
}

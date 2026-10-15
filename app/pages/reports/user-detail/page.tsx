"use client";

import { UserDetailReport } from "@/app/pages/_shared/reports/access-reports";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/user-detail - the User Detail Report, one of the reports on the Reports landing page. BioData Admin and above only (`userManagement`, as User Management).
export default function UserDetailReportPage() {
  return (
    <ReportPage name="User Detail Report">
      <UserDetailReport />
    </ReportPage>
  );
}

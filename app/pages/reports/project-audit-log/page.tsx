"use client";

import { ProjectAuditLogReport } from "@/app/pages/_shared/reports/project-audit-log-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/project-audit-log - the Project Audit Log Report, one of the reports on the Reports landing page.
// BioData Admin only (role-access `projectAuditLog`); the landing and the switcher do not offer it to other roles.
export default function ProjectAuditLogReportPage() {
  return (
    <ReportPage name="Project Audit Log Report">
      <ProjectAuditLogReport />
    </ReportPage>
  );
}

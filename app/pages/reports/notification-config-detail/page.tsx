"use client";

import { NotificationConfigReport } from "@/app/pages/_shared/reports/notification-config-report";
import { ReportPage } from "@/app/pages/_shared/reports/report-page";

// /pages/reports/notification-config-detail - the Notification Config Detail Report, one of the reports on the Reports landing page. BioData Admin and above only (`notificationManagement`, as Notification Management).
export default function NotificationConfigReportPage() {
  return (
    <ReportPage name="Notification Config Detail Report">
      <NotificationConfigReport />
    </ReportPage>
  );
}

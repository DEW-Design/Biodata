"use client";

import { useRouter } from "next/navigation";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { useRoleHref } from "@/lib/use-role-href";

// "Reports" in the breadcrumb of a report: a searchable switcher over the reports (A-Z, the set the Reports landing
// page lists), with the current one ticked and a "View all reports" bar to the landing page. Picking a report opens it.
// The same deep-dive crumb as the project page's `ProjectSwitcher` (`BreadcrumbSwitcher`), for a report.
const items = [...REPORTS].sort((a, b) => a.title.localeCompare(b.title)).map((r) => ({ id: r.id, label: r.title }));

export function ReportSwitcher({ label, currentReportId }: { label: string; currentReportId?: string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  return (
    <BreadcrumbSwitcher
      label={label}
      ariaLabel="Switch report"
      placeholder="Search reports"
      items={items}
      currentId={currentReportId}
      onSelect={(id) => {
        const report = REPORTS.find((r) => r.id === id);
        if (report) router.push(roleHref(report.path));
      }}
      viewAllLabel="View all reports"
      onViewAll={() => router.push(roleHref("/pages/reports"))}
    />
  );
}

"use client";

import { Suspense, type ReactNode } from "react";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { useMarkOpened } from "@/app/pages/_shared/reports/reports-store";
import { ReportsShell } from "@/app/pages/_shared/reports/reports-shell";
import { RecordBackLink } from "@/app/pages/_shared/record-hero";
import { useRoleHref } from "@/lib/use-role-href";

// A report's own route, under /pages/reports/<id>: the Reports shell with the report's name in the breadcrumb, a
// "Back to reports" link above it, then the report. What a role sees inside a report is that report's own rule.
// `name` is the report's title exactly as `REPORTS` (reports-data.ts) lists it.
function Report({ name, children }: { name: string; children: ReactNode }) {
  const roleHref = useRoleHref();
  // Opening a report is what "last opened" records; it is inside the shell, so a role that cannot see reports records nothing.
  useMarkOpened(REPORTS.find((r) => r.title === name)?.id);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordBackLink href={roleHref("/pages/reports")}>Back to reports</RecordBackLink>
      {children}
    </div>
  );
}

export function ReportPage({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ReportsShell current={name}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Report name={name}>{children}</Report>
        </div>
      </ReportsShell>
    </Suspense>
  );
}

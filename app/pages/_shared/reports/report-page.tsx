"use client";

import { Suspense, type ReactNode } from "react";
import { Lock01 } from "@untitledui/icons";
import { hasFeatureAccess } from "@/config/role-access.config";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { useMarkOpened } from "@/app/pages/_shared/reports/reports-store";
import { ReportsShell } from "@/app/pages/_shared/reports/reports-shell";
import { RecordBackLink } from "@/app/pages/_shared/record-hero";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// A report's own route, under /pages/reports/<id>: the Reports shell with the report's name in the breadcrumb, a
// "Back to reports" link above it, then the report. What a role sees inside a report is that report's own rule.
// `name` is the report's title exactly as `REPORTS` (reports-data.ts) lists it. A report whose `feature` the role lacks is not
// listed for it, and opening its address says so here instead of showing rows.
function Report({ name, children }: { name: string; children: ReactNode }) {
  const roleHref = useRoleHref();
  const role = useUserRole();
  const entry = REPORTS.find((r) => r.title === name);
  const allowed = !entry?.feature || hasFeatureAccess(entry.feature, role);
  // Opening a report is what "last opened" records; it is inside the shell, so a role that cannot see reports records nothing.
  useMarkOpened(allowed ? entry?.id : undefined);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordBackLink href={roleHref("/pages/reports")}>Back to reports</RecordBackLink>
      {allowed ? children : <ListEmptyState icon={Lock01} title="This report is not available to your role" description="Your role can open the other reports on the Reports page." />}
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

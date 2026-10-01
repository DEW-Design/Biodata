"use client";

import { Suspense } from "react";
import { ReportsLanding } from "@/app/pages/_shared/reports/reports-landing";
import { ReportsShell } from "@/app/pages/_shared/reports/reports-shell";

// /pages/reports - the Reports landing page: one card per report (reports-data.ts). Each report has its own
// route under /pages/reports/<id>. Signed-in roles only (`reports`); a public user gets the shell with the
// restriction in main.
export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsShell>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <ReportsLanding />
        </div>
      </ReportsShell>
    </Suspense>
  );
}

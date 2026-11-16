import type { ReportEntry } from "@/app/pages/_shared/reports/reports-data";
import { ALL_PROJECTS } from "@/app/pages/_shared/reports/report-scope-select";

// Create a report's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// It answers the fullest branch (the designer, 10 Nov 2026): a report that has a project scope, so the Project question opens, and a project
// from the role's own list. Both come from the lists the dialog offers, so the answers are always ones the role may choose.

export interface ReportSample {
  reportId: string | null;
  projectId: string;
}

export function sampleReport(reports: ReportEntry[], projectIds: string[]): ReportSample {
  const report = reports.find((r) => r.scoped) ?? reports[0];
  return { reportId: report?.id ?? null, projectId: report?.scoped ? (projectIds[0] ?? ALL_PROJECTS) : ALL_PROJECTS };
}

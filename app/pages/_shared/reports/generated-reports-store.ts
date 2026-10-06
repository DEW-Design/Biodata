"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";

// "My reports": the reports a person has generated with Create a report (designer, 6 Oct 2026: "Create a report - choose a
// report - generate"). A generated report is a saved run: which report, the project it was limited to (reports that have a
// project scope), and when. It opens the report as it is now with that scope; it is not a copy of the rows as they were, because
// reports are live views in this build (there is no backend to hold a snapshot). Kept per browser, like favourites
// (reports-store.ts), so "my" is this browser's person.
export interface GeneratedReport {
  id: string;
  reportId: string;
  /** The project it was limited to, or "all". Always "all" for a report with no project scope. */
  projectId: string;
  /** Milliseconds. */
  createdAt: number;
}

interface GeneratedState {
  runs: GeneratedReport[];
}

const useGeneratedStore = create<GeneratedState>()(
  persist<GeneratedState>(() => ({ runs: [] }), {
    name: "biodata-generated-reports",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** The generated reports, newest first, reading the saved ones after the first render. */
export function useGeneratedReports(): GeneratedReport[] {
  useRehydrate(useGeneratedStore);
  const runs = useGeneratedStore((s) => s.runs);
  return [...runs].sort((a, b) => b.createdAt - a.createdAt);
}

export function generateReport(reportId: string, projectId: string): GeneratedReport {
  const run: GeneratedReport = { id: `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, reportId, projectId, createdAt: Date.now() };
  useGeneratedStore.setState((s) => ({ runs: [run, ...s.runs] }));
  return run;
}

export function deleteGeneratedReport(id: string) {
  useGeneratedStore.setState((s) => ({ runs: s.runs.filter((r) => r.id !== id) }));
}

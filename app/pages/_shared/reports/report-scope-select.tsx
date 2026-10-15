"use client";

import { useMemo } from "react";
import { Select } from "@/components/base/select/select";
import type { SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import type { ReportParameters } from "@/app/pages/_shared/reports/report-parameters";

// The project scope of a report ("All Projects" in the wireframes): one project or all of them, limiting the rows and the counts together. It is the
// report's Parameters (report-parameters.tsx), a labelled Select in the popover, and a chip on the toolbar when a project is chosen. It lists only the
// projects the role can report on (`reportProjectsFor`), so it never offers a project the report would then show nothing for on access grounds.

export const ALL_PROJECTS = "all";

/** The chosen scope, or "all" when it is no longer one the role can report on (the role was switched). */
export function activeScope(scope: string, projects: SearchEvent[]): string {
  return scope === ALL_PROJECTS || projects.some((p) => p.id === scope) ? scope : ALL_PROJECTS;
}

function ReportScopeSelect({ projects, value, onChange }: { projects: SearchEvent[]; value: string; onChange: (projectId: string) => void }) {
  const items = useMemo(() => [{ id: ALL_PROJECTS, label: "All projects" }, ...projects.map((p) => ({ id: p.id, label: p.name, supportingText: p.code }))], [projects]);
  return (
    <Select size="sm" label="Project" items={items} selectedKey={activeScope(value, projects)} onSelectionChange={(key) => key && onChange(String(key))} className="w-full">
      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
    </Select>
  );
}

/** A report whose only parameter is its project scope. */
export function scopeParameters(projects: SearchEvent[], value: string, onChange: (projectId: string) => void): ReportParameters {
  const active = activeScope(value, projects);
  const chosen = projects.find((p) => p.id === active);
  return {
    fields: <ReportScopeSelect projects={projects} value={value} onChange={onChange} />,
    summary: chosen ? [["Project", chosen.name]] : [],
    reset: () => onChange(ALL_PROJECTS),
  };
}

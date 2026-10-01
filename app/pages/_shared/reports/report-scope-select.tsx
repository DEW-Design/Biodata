"use client";

import { useMemo } from "react";
import { Select } from "@/components/base/select/select";
import type { SearchEvent } from "@/app/pages/_shared/map-search/search-data";

// The project scope at the left of a report's toolbar ("All Projects" in the wireframes): one project or all of them, limiting
// the rows and the tile counts together. It lists only the projects the role can report on (`reportProjectsFor`), so
// it never offers a project the report would then show nothing for on access grounds.

export const ALL_PROJECTS = "all";

/** The chosen scope, or "all" when it is no longer one the role can report on (the role was switched). */
export function activeScope(scope: string, projects: SearchEvent[]): string {
  return scope === ALL_PROJECTS || projects.some((p) => p.id === scope) ? scope : ALL_PROJECTS;
}

export function ReportScopeSelect({ projects, value, onChange }: { projects: SearchEvent[]; value: string; onChange: (projectId: string) => void }) {
  const items = useMemo(() => [{ id: ALL_PROJECTS, label: "All projects" }, ...projects.map((p) => ({ id: p.id, label: p.name, supportingText: p.code }))], [projects]);
  return (
    <div className="w-64 max-w-full shrink-0">
      <Select
        size="sm"
        aria-label="Project"
        items={items}
        selectedKey={activeScope(value, projects)}
        onSelectionChange={(key) => key && onChange(String(key))}
        className="w-full"
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
    </div>
  );
}

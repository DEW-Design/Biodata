import { rootProjectForParentEventId, rootProjectOfEvent, searchEvents, searchObservations, searchOccurrences } from "@/app/pages/_shared/map-search/search-data";

// A project's page, and a record's own page under it: /pages/project-list/[id]/project-details, and
// .../project-details/occurrences/[recordId], .../observations/[recordId] or .../events/[recordId]
// (a site, visit, transect ...). Paths only; callers add the role through `useRoleHref`. The id
// lists feed the static export (every page must be listed up front for GitHub Pages).

export type ProjectRecordKind = "occurrences" | "observations" | "events";

export function projectDetailsPath(projectId: string): string {
  return `/pages/project-list/${projectId}/project-details`;
}

export function projectRecordPath(projectId: string, kind: ProjectRecordKind, recordId: string): string {
  return `${projectDetailsPath(projectId)}/${kind}/${encodeURIComponent(recordId)}`;
}

export function staticProjectIds(): string[] {
  return searchEvents.filter((e) => e.type === "Project").map((e) => e.id);
}

export function staticProjectRecordParams(): { id: string; kind: ProjectRecordKind; recordId: string }[] {
  const out: { id: string; kind: ProjectRecordKind; recordId: string }[] = [];
  for (const o of searchOccurrences) {
    const project = rootProjectForParentEventId(o.parentEventId);
    if (project) out.push({ id: project.id, kind: "occurrences", recordId: o.id });
  }
  for (const o of searchObservations) {
    const project = rootProjectForParentEventId(o.parentEventId);
    if (project) out.push({ id: project.id, kind: "observations", recordId: o.id });
  }
  for (const e of searchEvents) {
    if (e.type === "Project") continue;
    const project = rootProjectOfEvent(e);
    if (project) out.push({ id: project.id, kind: "events", recordId: e.id });
  }
  return out;
}

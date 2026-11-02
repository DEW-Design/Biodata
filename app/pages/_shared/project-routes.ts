import { rootProjectForParentEventId, rootProjectOfEvent, searchEvents, searchObservations, searchOccurrences } from "@/app/pages/_shared/map-search/search-data";

// A project's page, and a record's own page under it: /pages/project-list/[id]/project-details, and
// .../project-details/occurrences/[recordId], .../observations/[recordId] or .../events/[recordId]
// (a site, visit, transect ...). Paths only; callers add the role through `useRoleHref`. The id
// lists feed the static export (every page must be listed up front for GitHub Pages).

export type ProjectRecordKind = "occurrences" | "observations" | "events";

/** A project made in this browser through Add Project has an id that starts with this (created-projects-store.ts: "new-bd-5103"). */
export const CREATED_PROJECT_ID_PREFIX = "new-";
export const isCreatedProjectId = (projectId: string) => projectId.startsWith(CREATED_PROJECT_ID_PREFIX);

// A static export cannot build a page for an id that only exists once someone creates it, so a project made in this browser has no
// /pages/project-list/<id>/... page. Each of its pages is one fixed route that takes the project in the query. Every address of a project
// is built here, so no caller has to know that (a link built by hand to /pages/project-list/<id>/... is a dead link for a new project).

export function projectDetailsPath(projectId: string): string {
  if (isCreatedProjectId(projectId)) return `/pages/project-detail/created?project=${encodeURIComponent(projectId)}`;
  return `/pages/project-list/${projectId}/project-details`;
}

/** A project's page open on one of its tabs (`datasets`, `records` ...). */
export function projectTabPath(projectId: string, tab: string): string {
  const path = projectDetailsPath(projectId);
  return `${path}${path.includes("?") ? "&" : "?"}tab=${tab}`;
}

/** The page that uploads a dataset to a project. */
export function uploadPath(projectId: string): string {
  if (isCreatedProjectId(projectId)) return `/pages/project-detail/created/upload?project=${encodeURIComponent(projectId)}`;
  return `/pages/project-list/${projectId}/upload`;
}

export function projectRecordPath(projectId: string, kind: ProjectRecordKind, recordId: string): string {
  // Records live under the built-in projects only: a project made in this browser has none of its own.
  return `/pages/project-list/${projectId}/project-details/${kind}/${encodeURIComponent(recordId)}`;
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

// Scopes the shared map-search dataset (app/pages/_shared/map-search/search-data.ts) down to one
// project's own records - the same real Project -> Event -> Occurrence -> Observation -> Resource
// hierarchy that dataset already models, just filtered to a single root instead of searched across
// all of them. Reusing this one real dataset (rather than a second, project-detail-only mock) means
// this page and the map search tool can never show two different versions of the same project.

import {
  rootProjectForParentEventId,
  rootProjectOfEvent,
  searchEvents,
  searchObservations,
  searchOccurrences,
  searchResources,
  type SearchEvent,
  type SearchObservation,
  type SearchOccurrence,
  type SearchResource,
} from "@/app/pages/_shared/map-search/search-data";

export function projectEvents(projectId: string): SearchEvent[] {
  return searchEvents.filter((e) => e.id !== projectId && rootProjectOfEvent(e).id === projectId);
}

export function projectOccurrences(projectId: string): SearchOccurrence[] {
  return searchOccurrences.filter((o) => rootProjectForParentEventId(o.parentEventId)?.id === projectId);
}

export function projectObservations(projectId: string): SearchObservation[] {
  return searchObservations.filter((o) => rootProjectForParentEventId(o.parentEventId)?.id === projectId);
}

export function projectResources(projectId: string): SearchResource[] {
  return searchResources.filter((r) => rootProjectForParentEventId(r.parentEventId)?.id === projectId);
}

export interface EventTreeNode {
  event: SearchEvent;
  children: EventTreeNode[];
  occurrences: SearchOccurrence[];
  observations: SearchObservation[];
}

/** Nests this project's own events by `parentId` into a real tree rooted at every Site (an Event
 *  with no parent other than the project itself), and attaches each event's own directly-recorded
 *  Occurrences/Observations as leaves - the same real parent-pointer chain search-data.ts already
 *  carries, just walked once into a tree shape the TreeView component can render directly. */
export function buildEventTree(projectId: string): EventTreeNode[] {
  const events = projectEvents(projectId);
  const occurrences = projectOccurrences(projectId);
  const observations = projectObservations(projectId);
  const byId = new Map(events.map((e) => [e.id, e]));

  const nodeFor = (event: SearchEvent): EventTreeNode => ({
    event,
    children: events.filter((e) => e.parentId === event.id).map(nodeFor),
    occurrences: occurrences.filter((o) => o.parentEventId === event.id),
    observations: observations.filter((o) => o.parentEventId === event.id),
  });

  // Roots: events whose parent is the project itself (not in `byId`) - i.e. every top-level Site.
  return events.filter((e) => !e.parentId || !byId.has(e.parentId)).map(nodeFor);
}

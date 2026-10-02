"use client";

import { Suspense, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ProjectDetailTemplate } from "@/app/pages/project-detail/project-detail-template";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import type { DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { recordAccess } from "@/app/pages/_shared/map-search/record-access";
import { findObservation, findOccurrence, rootProjectForParentEventId, rootProjectOfEvent, searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { useUserRole } from "@/lib/use-user-role";
import { ProjectNotFound, ProjectRecordView } from "./project-details-view";

// /pages/project-list/[id]/project-details, and .../[kind]/[recordId] for a record's own page.
// Every project's page is the project page template (project-detail-template.tsx): Adelaide Hills
// with its hand-written records, every other project built from Explore's data. A record (occurrence, observation, or event) gets its own page in the project's
// shell (ProjectRecordView), for every project. A record a public user may not see (Level 2 and
// above), or one that doesn't belong to this project, is not shown: the project page says why.

export default function ProjectDetailsRoute() {
  return (
    <Suspense fallback={null}>
      <Route />
    </Suspense>
  );
}

function Route() {
  const router = useRouter();
  const role = useUserRole();
  const { id, kind, recordId } = useParams<{ id: string; kind?: string; recordId?: string }>();
  const project = searchEvents.find((e) => e.id === id && e.type === "Project");
  if (!project) return <ProjectNotFound />;

  // The followed record, only if it really belongs to this project.
  const decodedId = recordId ? decodeURIComponent(recordId) : undefined;
  let record = null as DetailRecord | null;
  if (decodedId && kind === "occurrences") {
    const occurrence = findOccurrence(decodedId);
    if (occurrence && rootProjectForParentEventId(occurrence.parentEventId)?.id === id) record = { kind: "occurrence", occurrence };
  } else if (decodedId && kind === "observations") {
    const observation = findObservation(decodedId);
    if (observation && rootProjectForParentEventId(observation.parentEventId)?.id === id) record = { kind: "observation", observation };
  } else if (decodedId && kind === "events") {
    const event = searchEvents.find((e) => e.id === decodedId);
    if (event && event.type !== "Project" && rootProjectOfEvent(event).id === id) record = { kind: "event", event };
  }
  const data = !record || record.kind === "event" ? null : record.kind === "occurrence" ? record.occurrence : record.observation;
  const hidden = data ? recordAccess(data, role) === "hidden" : false;

  let notice: ReactNode = undefined;
  if (decodedId && !record) {
    notice = (
      <AlertFullWidth
        contained
        wrap
        color="default"
        title="That record isn't available"
        description="It may have been removed, or the link is incomplete. The project's species are listed below."
        confirmLabel="View all projects"
        onConfirm={() => router.push(`/pages/project-list?userRole=${role}`)}
      />
    );
  } else if (hidden) {
    notice = (
      <AlertFullWidth
        contained
        wrap
        color="warning"
        title="That record needs a Data Licencing Agreement"
        description="It is a sensitive record, so it is not shown publicly. Sign up, then request a Data Licencing Agreement (DLA) to see it."
        confirmLabel="Sign up to request access"
        onConfirm={() => router.push("/pages/auth/signup")}
      />
    );
  }

  if (record && !hidden) return <ProjectRecordView project={project} record={record} />;
  return <ProjectDetailTemplate projectId={project.id} basePath={projectDetailsPath(project.id)} notice={notice} />;
}

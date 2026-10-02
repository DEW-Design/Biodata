"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCreatedProject } from "@/app/pages/_shared/created-projects-store";
import { ProjectNotFound } from "@/app/pages/project-list/[id]/project-details/project-details-view";
import { ProjectDetailTemplate } from "../project-detail-template";
import { seedFromCreated } from "../project-seed";

// The page of a project created in this browser through Add Project (/pages/project-detail/created?project=<id>).
// A static export cannot build a page for an id that only exists once someone creates it, so every created
// project shares this one route and says which it is in the query. The project itself is read from
// localStorage (created-projects-store.ts) and drawn by the same project page template as every other project.
export default function CreatedProjectPage() {
  return (
    <Suspense fallback={null}>
      <Route />
    </Suspense>
  );
}

function Route() {
  const id = useSearchParams().get("project");
  const { project, hydrated } = useCreatedProject(id);
  const seed = useMemo(() => (project ? seedFromCreated(project) : null), [project]);
  // Before localStorage has been read the project looks missing: wait rather than flash "not available".
  if (!hydrated) return null;
  if (!project || !seed || !id) return <ProjectNotFound />;
  return <ProjectDetailTemplate projectId={project.id} seed={seed} basePath={`/pages/project-detail/created?project=${encodeURIComponent(project.id)}`} />;
}

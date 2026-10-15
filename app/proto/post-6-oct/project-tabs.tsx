"use client";

// The project's tabs under its header, exactly the production page's: Project, Project records, Species, Artefacts and attachments,
// each with its icon and, after the label, its count (project-detail-template.tsx). Drawn by `ViewTabs` (panel-controls.tsx), which is
// the DEW underline tab list the production page uses. Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { useProjectSpecies } from "@/app/pages/project-detail/species-view";
import { PROJECT_VIEWS, ViewTabs } from "./panel-controls";
import type { ProjectView } from "./project-workspace";

export function ProjectViewTabs({ view, setView, artefactCount }: { view: ProjectView; setView: (v: ProjectView) => void; artefactCount: number }) {
  const { records } = useEditStore();
  const species = useProjectSpecies();
  const counts: Partial<Record<ProjectView, number>> = { records: records.length, species: species.length, artefacts: artefactCount };
  return <ViewTabs views={PROJECT_VIEWS.map((v) => ({ ...v, count: counts[v.id] }))} current={view} onChange={(id) => setView(id as ProjectView)} ariaLabel="Project views" />;
}

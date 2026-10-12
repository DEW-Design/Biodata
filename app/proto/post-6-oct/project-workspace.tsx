"use client";

// The project page's content for /proto/post-6-oct: the same Project, Project records, Species and Artefacts views as
// /pages/project-detail, taken from the real components (`ProjectTab`, `RecordsExplorer`, `SpeciesView`, `ArtefactsView`)
// and the same edit store, so nothing here is a lookalike. What changes is only what sits around them: no Back link, no
// gradient hero and no tab row above the content (the shell's breadcrumb bar and view menu take those jobs), so the first
// screen is the project itself.
//
// The artefact mapping below is the same as `ProjectDetail` in project-detail-template.tsx. It is copied, not shared, so the
// lab leaves the product page alone; fold it into a shared hook if this layout is chosen.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { ArtefactLightbox, type Artefact } from "@/app/pages/_shared/artefact-lightbox";
import type { FilterSelection } from "@/app/pages/_shared/list-filter";
import { ArtefactsView } from "@/app/pages/project-detail/artefacts-view";
import { useEditStore, EditStoreProvider } from "@/app/pages/project-detail/edit-store";
import { allFiles, recordFieldKeys, useFieldNotes } from "@/app/pages/project-detail/field-notes-store";
import { ProjectTab, formatDay } from "@/app/pages/project-detail/project-tab";
import { BranchDrawer } from "./branch-drawer";
import { ProjectLinear } from "./project-linear";
import { ProjectOverview } from "./project-overview";
import { ADELAIDE_HILLS_ID, adelaideHillsSeed, exploreProject, seedFromExplore, type ProjectSeed } from "@/app/pages/project-detail/project-seed";
import { RecordsExplorer, filterForKind, type KindFilter, type RecordsView } from "@/app/pages/project-detail/records-explorer";
import { SpeciesView } from "@/app/pages/project-detail/species-view";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import type { UserRole } from "@/lib/user-role";

export type ProjectView = "overview" | "edit" | "records" | "species" | "artefacts";

/** The project's data, or null for a project the page cannot build (a created one has its own route). */
export function seedFor(projectId: string, role: UserRole): ProjectSeed | null {
  if (projectId === ADELAIDE_HILLS_ID) return adelaideHillsSeed;
  const found = exploreProject(projectId);
  return found ? seedFromExplore(found, role) : null;
}

const withQuery = (path: string, query: string) => `${path}${path.includes("?") ? "&" : "?"}${query}`;

/** Eyebrow, the project's code and name, and one quiet line of facts: what the gradient hero held, in a fraction of the height. */
function ProjectTitle() {
  const { project, meta } = useEditStore();
  const d = project.details;
  const status = project.status;
  const statusColor = status === "Active" ? "success" : status === "Under review" ? "warning" : "gray";
  const owner =
    d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : `${d.dataOwnerContacts[0]?.firstName ?? ""} ${d.dataOwnerContacts[0]?.lastName ?? ""}`.trim();
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
      <h1 className="m-0 text-2xl font-semibold text-balance text-primary">
        <span className="text-quaternary">[{meta.code}]</span> {d.shortTitle}
      </h1>
      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tertiary">
        <BadgeWithDot size="sm" color={statusColor}>
          {status}
        </BadgeWithDot>
        <span>
          {formatDay(d.startDate) || "Start not provided"} to {d.endDate ? formatDay(d.endDate) : "ongoing"}
        </span>
        {owner && <span>Published by {owner}</span>}
      </p>
    </div>
  );
}

/** Every file attached to a field, shaped for the shared artefact viewer (as in project-detail-template.tsx). */
function useArtefacts() {
  const { recordById, meta } = useEditStore();
  const notes = useFieldNotes();
  return useMemo(
    () =>
      allFiles(notes).flatMap(({ recordId, key, file }) => {
        const rec = recordById(recordId);
        if (!rec || !recordFieldKeys(rec).has(key)) return [];
        const field = key.slice(key.indexOf(":") + 1);
        const a: Artefact & { recordId: string; fieldKey: string } = {
          fieldKey: key,
          id: file.id,
          recordId,
          title: file.name,
          type: file.kind,
          size: file.size || "Link",
          recordLabel: `${rec.name} · ${field}`,
          metaTitle: file.name,
          created: file.date,
          creator: file.addedBy,
          objectId: `${meta.objectPrefix}:${rec.code}:${file.id.toUpperCase()}`,
          description: `Attached to "${field}" on ${rec.type} ${rec.code}, ${rec.name}.`,
          format: { image: "image/jpeg", pdf: "application/pdf", spreadsheet: "application/vnd.ms-excel", video: "video/mp4", link: "text/uri-list" }[file.kind],
          identifierUrl: file.url ?? "https://data.environment.sa.gov.au",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          publisher: meta.publisher,
          rightsHolder: meta.publisher,
          dcType: { image: "StillImage", pdf: "Text", spreadsheet: "Dataset", video: "MovingImage", link: "InteractiveResource" }[file.kind],
          bioDataId: `${meta.code.replace("-", "")}-${rec.code}`,
        };
        return [a];
      }),
    [notes, recordById, meta],
  );
}

function Views({ view, setView, branchOpen, onBranchClose, step }: { view: ProjectView; setView: (v: ProjectView) => void; branchOpen: boolean; onBranchClose: () => void; step: number }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const role = useUserRole();
  const { meta } = useEditStore();
  const artefacts = useArtefacts();
  const [selectedId, setSelectedId] = useState<string | null>(meta.id === ADELAIDE_HILLS_ID ? "su1" : null);
  const [recordFilter, setRecordFilter] = useState<FilterSelection>({});
  const [recordsView, setRecordsView] = useState<RecordsView>("tree");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // The Datasets and flagged-concepts screens are their own pages; the lab opens them on the real project page.
  const pagePath = projectDetailsPath(meta.id);
  const datasetsHref = roleHref(withQuery(pagePath, "view=datasets"));
  const datasetHref = (id: string) => roleHref(withQuery(pagePath, `view=datasets&dataset=${encodeURIComponent(id)}`));

  const goToRecords = (kind: KindFilter, recordId?: string) => {
    setRecordFilter(filterForKind(kind));
    if (recordId) setSelectedId(recordId);
    setView("records");
  };
  const openRecord = (id: string) => {
    setRecordFilter({});
    setSelectedId(id);
    setRecordsView("tree");
    setView("records");
  };

  // The branch: a record picked in the tree opens in Project records, selected; the project itself opens it with nothing selected.
  const pickFromBranch = (id: string | null) => {
    if (id) openRecord(id);
    else {
      setRecordFilter({});
      setSelectedId(null);
      setView("records");
    }
    onBranchClose();
  };

  const title = <ProjectTitle />;
  const toFlagged = () => router.push(roleHref(withQuery(pagePath, "view=review&from=project")));
  const artefactKinds = artefacts.map((a) => a.type);
  const artefactRecordCount = new Set(artefacts.map((a) => a.recordId)).size;
  // The body of every view but the Overview; the title above it is the step's own header from step 5.
  const other = (lead?: ReactNode): ReactNode =>
    view === "edit" ? (
      <ProjectTab
        layout="v3"
        lead={lead}
        onGoToRecords={goToRecords}
        onGoToArtefacts={() => setView("artefacts")}
        onGoToDatasets={() => router.push(datasetsHref)}
        onGoToDataset={(id) => router.push(datasetHref(id))}
        artefactKinds={artefactKinds}
        artefactRecordCount={artefactRecordCount}
        onGoToSpecies={() => setView("species")}
        onGoToFlagged={toFlagged}
      />
    ) : (
      <div className="flex flex-col gap-6">
        {lead}
        {view === "records" && (
          <RecordsExplorer focusField={null} selectedId={selectedId} onSelect={setSelectedId} filter={recordFilter} onFilterChange={setRecordFilter} view={recordsView} onViewChange={setRecordsView} />
        )}
        {view === "species" && <SpeciesView onOpenRecord={openRecord} />}
        {view === "artefacts" && <ArtefactsView artefacts={artefacts} onOpen={setLightboxIndex} onOpenRecord={(id) => openRecord(id)} />}
      </div>
    );

  let body: ReactNode;
  if (step >= 5) {
    body = (
      <ProjectLinear view={view} setView={setView} canEdit={role !== "public-user"} artefactKinds={artefactKinds} onGoToRecords={goToRecords}>
        {other()}
      </ProjectLinear>
    );
  } else if (view === "overview") {
    body = (
      <ProjectOverview
        title={title}
        artefactKinds={artefactKinds}
        artefactRecordCount={artefactRecordCount}
        onGoToRecords={goToRecords}
        onGoToSpecies={() => setView("species")}
        onGoToArtefacts={() => setView("artefacts")}
        onGoToDatasets={() => router.push(datasetsHref)}
        onGoToFlagged={toFlagged}
      />
    );
  } else {
    body = other(title);
  }
  return (
    <>
      {body}
      {branchOpen && <BranchDrawer selectedId={selectedId} onPick={pickFromBranch} onClose={onBranchClose} />}
      <ArtefactLightbox artefacts={artefacts} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </>
  );
}

/** One project's content, in a store of its own. Keyed by project and role so switching either starts from that project's seed. */
export function ProjectWorkspace({ projectId, view, setView, branchOpen, onBranchClose, step }: { projectId: string; view: ProjectView; setView: (v: ProjectView) => void; branchOpen: boolean; onBranchClose: () => void; step: number }) {
  const role = useUserRole();
  const seed = useMemo(() => seedFor(projectId, role), [projectId, role]);
  if (!seed) return <p className="m-0 text-sm text-tertiary">This project has no page in the preview yet.</p>;
  return (
    <EditStoreProvider key={`${projectId}:${role}`} canEdit={role !== "public-user"} role={role} seed={seed}>
      <Views view={view} setView={setView} branchOpen={branchOpen} onBranchClose={onBranchClose} step={step} />
    </EditStoreProvider>
  );
}

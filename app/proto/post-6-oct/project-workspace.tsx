"use client";

// The project page's content for /proto/post-6-oct: the same Project, Project records, Species and Artefacts tabs as
// /pages/project-detail, taken from the real components (`ProjectTab`, `RecordsExplorer`, `SpeciesView`, `ArtefactsView`)
// and the same edit store, so nothing here is a lookalike and every section, card and label is the production screen's (the designer,
// 13 Oct 2026: the sections on the production screens are correct, so none is made up here: "we're exploring a new layout, not
// changing all the good work that has gone into the production screens"). What changes is only the layout around them: the Back link is
// the breadcrumb, the gradient hero's content (Project, the title and its five facts) sits on the page, and the page's actions are in
// the shell's bar. The designer's tweaks of 19 Oct 2026: the first tab is Overview; "Project at a glance" is gone (its flagged concepts are a chip beside the title and its system notices a summary row that opens into a list, project-notices.tsx,
// and the counts are the tabs' own); the Overview does not repeat the status and the dates the header shows, nor head itself "Overview" under a tab of that name; and an "i" in
// the bar opens the project's properties (project-properties.tsx). Each is an opt-in of `ProjectTab`, so the product page is unchanged.
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
import { AddArtefactModal } from "./add-artefact-modal";
import { AddRecordFlow } from "./add-record-flow";
import { BranchDrawer } from "./branch-drawer";
import { createPortal } from "react-dom";
import { FlaggedAlert, ProjectNotices } from "./project-notices";
import { ProjectProperties } from "./project-properties";
import { ProjectViewTabs } from "./project-tabs";
import { ADELAIDE_HILLS_ID, adelaideHillsSeed, exploreProject, seedFromExplore, type ProjectSeed } from "@/app/pages/project-detail/project-seed";
import { RecordsExplorer, filterForKind, type KindFilter, type RecordsView } from "@/app/pages/project-detail/records-explorer";
import type { ChildOption } from "@/app/pages/project-detail/record-rules";
import { SpeciesView } from "@/app/pages/project-detail/species-view";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import type { UserRole } from "@/lib/user-role";

export type ProjectView = "project" | "records" | "species" | "artefacts";

/** The project's data, or null for a project the page cannot build (a created one has its own route). */
export function seedFor(projectId: string, role: UserRole): ProjectSeed | null {
  if (projectId === ADELAIDE_HILLS_ID) return adelaideHillsSeed;
  const found = exploreProject(projectId);
  return found ? seedFromExplore(found, role) : null;
}

const withQuery = (path: string, query: string) => `${path}${path.includes("?") ? "&" : "?"}${query}`;

/**
 * The production hero's content, in the same words (`ProjectHero`, project-detail-template.tsx): the eyebrow "Project", the title, and the
 * facts Project ID, Start Date, End Date, Status and Published by, with the same values and the same status colours. Only where it is
 * drawn differs: on the page under the bar instead of on a gradient card. The page's actions are in the bar.
 */
function ProjectHeader() {
  const { project, meta } = useEditStore();
  const d = project.details;
  const status = project.status;
  const statusColor = status === "Active" ? "success" : status === "Under review" ? "warning" : "gray";
  const owner = d.dataOwnerType === "organisation" ? d.dataOwnerOrgName : `${d.dataOwnerContacts[0]?.firstName ?? ""} ${d.dataOwnerContacts[0]?.lastName ?? ""}`.trim();
  const facts: { label: string; value: ReactNode }[] = [
    { label: "Project ID", value: meta.code },
    { label: "Start Date", value: formatDay(d.startDate) || "Not provided" },
    { label: "End Date", value: d.endDate ? formatDay(d.endDate) : "Ongoing" },
    {
      label: "Status",
      value: (
        <BadgeWithDot size="sm" color={statusColor} className="inline-flex align-baseline">
          {status}
        </BadgeWithDot>
      ),
    },
    { label: "Published by", value: owner },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="m-0 text-2xl font-semibold text-balance text-primary">{d.shortTitle}</h1>
      </div>
      {/* The facts sit straight on the page, 32px apart: the white card the frame draws (Figma 484:4104, 8px of padding and corners) is gone (the designer, 19 Oct 2026). */}
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4 self-start">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <p className="m-0 text-xs font-semibold tracking-wide text-quaternary uppercase">{f.label}</p>
            <div className="text-sm text-primary">{f.value}</div>
          </div>
        ))}
      </div>
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
          description: `Attached to "${field}" on ${rec.type} ${rec.code}, ${rec.name}.${file.review?.status === "rejected" ? ` Rejected by ${file.review.by}: ${file.review.reason}` : ""}`,
          review: file.review,
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

interface BarRequestProps {
  /** Where the panel's bar holds the user alert: an element once the bar has drawn it, and `null` before. The alert is drawn into it from here, because it needs this project's data and the bar is
   *  drawn outside it. */
  alertSlot: HTMLElement | null;
  /** The bar's "Add an artefact and attachment" form is open; closing it, and opening the Artefacts and attachments tab once something is added, are the page's. */
  attachOpen: boolean;
  onAttachOpenChange: (open: boolean) => void;
}

interface AddRequestProps {
  /** A record the bar's "+" menu asked to add under the project; the lab's own new-record form (add-record-flow.tsx) opens for it, then calls `onAddRequestConsumed`. */
  addRequest: { option: ChildOption; id: number } | null;
  onAddRequestConsumed: () => void;
}

function Views({ view, setView, branchOpen, onBranchClose, propertiesOpen, onPropertiesClose, addRequest, onAddRequestConsumed, attachOpen, onAttachOpenChange, alertSlot }: { view: ProjectView; setView: (v: ProjectView) => void; branchOpen: boolean; onBranchClose: () => void; propertiesOpen: boolean; onPropertiesClose: () => void } & AddRequestProps & BarRequestProps) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const { meta } = useEditStore();
  const artefacts = useArtefacts();
  const [selectedId, setSelectedId] = useState<string | null>(meta.id === ADELAIDE_HILLS_ID ? "su1" : null);
  const [recordFilter, setRecordFilter] = useState<FilterSelection>({});
  const [recordsView, setRecordsView] = useState<RecordsView>("tree");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [noticesOpen, setNoticesOpen] = useState(false);

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

  const toFlagged = () => router.push(roleHref(withQuery(pagePath, "view=review&from=project")));
  const artefactKinds = artefacts.map((a) => a.type);
  const artefactRecordCount = new Set(artefacts.map((a) => a.recordId)).size;
  // The header and the tabs, 32px apart (Figma 484:3929), then the view: the production page's order (hero, tabs, panel), the hero's content in the page. The notices are the
  // first rows of the Overview's sheet, and a box of their own above the other tabs' content (project-notices.tsx); the flagged-concepts chip is beside the title.
  const lead = (
    <div className="flex flex-col gap-8">
      <ProjectHeader />
      <ProjectViewTabs view={view} setView={setView} artefactCount={artefacts.length} />
    </div>
  );
  const notices = (framed: boolean) => <ProjectNotices framed={framed} expanded={noticesOpen} onExpandedChange={setNoticesOpen} onGoToDataset={(id) => router.push(datasetHref(id))} />;
  const body: ReactNode =
    view === "project" ? (
      <ProjectTab
        layout="v3"
        sheet
        showGlance={false}
        repeatHeaderFacts={false}
        overviewHeading={false}
        lead={lead}
        sheetTop={notices(false)}
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
        {notices(true)}
        {view === "records" && (
          <RecordsExplorer focusField={null} selectedId={selectedId} onSelect={setSelectedId} filter={recordFilter} onFilterChange={setRecordFilter} view={recordsView} onViewChange={setRecordsView} />
        )}
        {view === "species" && <SpeciesView onOpenRecord={openRecord} />}
        {view === "artefacts" && <ArtefactsView artefacts={artefacts} onOpen={setLightboxIndex} onOpenRecord={(id) => openRecord(id)} />}
      </div>
    );
  return (
    <>
      {body}
      {branchOpen && <BranchDrawer selectedId={selectedId} onPick={pickFromBranch} onClose={onBranchClose} />}
      {alertSlot && createPortal(<FlaggedAlert onPress={toFlagged} />, alertSlot)}
      <AddRecordFlow
        request={addRequest}
        onClose={onAddRequestConsumed}
        onCreated={(id) => {
          // The new record is on the project now: show it, selected, in Project records.
          setRecordFilter({});
          setSelectedId(id);
          setRecordsView("tree");
          setView("records");
        }}
      />
      <AddArtefactModal isOpen={attachOpen} onOpenChange={onAttachOpenChange} onAdded={() => setView("artefacts")} />
      {propertiesOpen && <ProjectProperties artefactCount={artefacts.length} onClose={onPropertiesClose} />}
      <ArtefactLightbox artefacts={artefacts} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </>
  );
}

/** One project's content, in a store of its own. Keyed by project and role so switching either starts from that project's seed. */
export function ProjectWorkspace({ projectId, view, setView, branchOpen, onBranchClose, propertiesOpen, onPropertiesClose, addRequest, onAddRequestConsumed, attachOpen, onAttachOpenChange, alertSlot }: { projectId: string; view: ProjectView; setView: (v: ProjectView) => void; branchOpen: boolean; onBranchClose: () => void; propertiesOpen: boolean; onPropertiesClose: () => void } & AddRequestProps & BarRequestProps) {
  const role = useUserRole();
  const seed = useMemo(() => seedFor(projectId, role), [projectId, role]);
  if (!seed) return <p className="m-0 text-sm text-tertiary">This project has no page in the preview yet.</p>;
  return (
    <EditStoreProvider key={`${projectId}:${role}`} canEdit={role !== "public-user"} role={role} seed={seed}>
      <Views view={view} setView={setView} branchOpen={branchOpen} onBranchClose={onBranchClose} propertiesOpen={propertiesOpen} onPropertiesClose={onPropertiesClose} addRequest={addRequest} onAddRequestConsumed={onAddRequestConsumed} attachOpen={attachOpen} onAttachOpenChange={onAttachOpenChange} alertSlot={alertSlot} />
    </EditStoreProvider>
  );
}

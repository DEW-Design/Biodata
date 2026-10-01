"use client";

// The project page template: one page for every project, at /pages/project-list/<id>/project-details
// (and at /pages/project-detail, the Adelaide Hills project's canonical route). It is the "v3 records"
// page rolled in from bc8ad0fb on 29 Sept 2026 as Option 1, made the look of every project page on
// 30 Sept 2026 by direct instruction ("all the project details' look should match option 1's
// survey-records features"). What it shows comes from a `ProjectSeed` (project-seed.ts): Adelaide
// Hills' hand-written records, or another project's records built from Explore's data.
//
// The shell: icon rail and the gradient project header, with no column 2 (designer, 30 Sept 2026,
// CONTRACTS 3.7): the project's actions are in the header's "..." menu, and the breadcrumb's Projects
// crumb switches project. The main area has four tabs:
//
//  - Project: the whole registration (Overview, Data collection and storage, Privacy and
//    restrictions) as one readable page with an "On this page" list (project-tab.tsx).
//  - Survey records: every event, occurrence and observation in a tree or a table, beside a record
//    inspector that shows the selected record's metadata grouped by Darwin Core class
//    (records-explorer.tsx, record-inspector.tsx).
//  - Species: every species recorded in the project, with where and when.
//  - Artefacts and attachments: every file attached to a record, each linked back to its record.
//
// Everyone but public users can edit: project metadata on the Project tab and each record's metadata
// in the inspector, through one shared card and edit flow (editable-section.tsx). Edits are kept for
// the session (edit-store.tsx).

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TabList,
  Tab,
  TabPanel,
  Tabs as ContentTabs,
} from "@/components/application/tabs/tabs";
import { ArrowNarrowRight, Database01, Feather, Folder, Paperclip } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { ProjectDetailLayoutSwitcher } from "@/app/pages/_shared/project-detail-layout-switcher";
import { ProjectCardActions } from "@/app/pages/_shared/project-card-actions";
import {
  ArtefactLightbox,
  type Artefact,
} from "@/app/pages/_shared/artefact-lightbox";
import { ArtefactsView } from "./artefacts-view";
import { ReviewScreen, useLiveEntries, useReviewItems } from "./review-view";
import { useCanReview } from "./field-notes";
import { allFiles, recordFieldKeys, useFieldNotes } from "./field-notes-store";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { navForRole, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { ProjectTab, formatDay } from "./project-tab";
import { SpeciesView, useProjectSpecies } from "./species-view";
import { ProjectSwitcher } from "@/app/pages/_shared/project-switcher";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { EditStoreProvider, useEditStore } from "./edit-store";
import { ADELAIDE_HILLS_ID, adelaideHillsSeed, exploreProject, seedFromExplore } from "./project-seed";
import {
  RecordsExplorer,
  filterForKind,
  type KindFilter,
  type RecordsView,
} from "./records-explorer";
import type { FilterSelection } from "@/app/pages/_shared/list-filter";

type DetailTab = "project" | "records" | "species" | "artefacts";

function ProjectHero() {
  const { project, meta } = useEditStore();
  const d = project.details;
  const status = project.status;
  const statusColor =
    status === "Active"
      ? "success"
      : status === "Under review"
        ? "warning"
        : "gray";
  // The shared record hero, so the title, eyebrow and facts are set exactly as on every other record page.
  return (
    <RecordHero eyebrow="Project" title={d.shortTitle} actions={<ProjectCardActions projectId={meta.id} projectCode={meta.code} />}>
      <HeroMeta label="Project ID">{meta.code}</HeroMeta>
      <HeroMeta label="Start Date">{formatDay(d.startDate) || "Not provided"}</HeroMeta>
      <HeroMeta label="End Date">{d.endDate ? formatDay(d.endDate) : "Ongoing"}</HeroMeta>
      <HeroMeta label="Status">
        <BadgeWithDot size="sm" color={statusColor} className="inline-flex align-baseline">
          {status}
        </BadgeWithDot>
      </HeroMeta>
      <HeroMeta label="Published by">
        {d.dataOwnerType === "organisation"
          ? d.dataOwnerOrgName
          : `${d.dataOwnerContacts[0]?.firstName ?? ""} ${d.dataOwnerContacts[0]?.lastName ?? ""}`.trim()}
      </HeroMeta>
    </RecordHero>
  );
}

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink
          ? "This section has its own page - it isn't embedded here."
          : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button
          color="link-color"
          size="sm"
          href={roleHref(keyHref(relatedLink.key!))}
          iconTrailing={ArrowNarrowRight}
        >
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

export interface ProjectDetailTemplateProps {
  /** The project's route id, e.g. `adelaide-hills`. */
  projectId: string;
  /** This page's own path, which the review screen (`?view=review`) returns to. */
  basePath: string;
  /** Shows the layout switcher on the Prototype tools bar (only on the canonical Adelaide Hills route). */
  layoutSwitcher?: boolean;
  /** An alert shown above the tabs, e.g. that a followed record is not available. */
  notice?: ReactNode;
}

export function ProjectDetailTemplate(props: ProjectDetailTemplateProps) {
  return (
    <Suspense fallback={null}>
      <ProjectDetailWithEdits {...props} />
    </Suspense>
  );
}

function ProjectDetailWithEdits(props: ProjectDetailTemplateProps) {
  const role = useUserRole();
  const canEdit = role !== "public-user";
  const seed = useMemo(() => {
    if (props.projectId === ADELAIDE_HILLS_ID) return adelaideHillsSeed;
    const project = exploreProject(props.projectId);
    return project ? seedFromExplore(project, role) : null;
  }, [props.projectId, role]);
  if (!seed) return null;
  return (
    <EditStoreProvider key={`${props.projectId}:${role}`} canEdit={canEdit} seed={seed}>
      <ProjectDetail {...props} />
    </EditStoreProvider>
  );
}

function ProjectDetail({ basePath, layoutSwitcher = false, notice }: ProjectDetailTemplateProps) {
  const router = useRouter();
  const role = useUserRole();
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [detailTab, setDetailTab] = useState<DetailTab>("project");
  const { project, records, recordById, meta } = useEditStore();
  // Adelaide Hills opens on its first site; another project opens on the project's own summary.
  const [selectedId, setSelectedId] = useState<string | null>(meta.id === ADELAIDE_HILLS_ID ? "su1" : null);
  const [recordFilter, setRecordFilter] = useState<FilterSelection>({});
  const [recordsView, setRecordsView] = useState<RecordsView>("tree");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const species = useProjectSpecies();
  // Reviewing flagged concepts is an admin's job (BioData Admin, Privileged Admin). It is management
  // work, not a view of the records, so it is its own screen (`?view=review`, same route so the
  // session's edits stay), opened from a banner in Survey records or from the admin's Home.
  const canReview = useCanReview();
  const openReviews = useReviewItems().open.length;
  const liveEntries = useLiveEntries();
  const searchParams = useSearchParams();
  const reviewing = canReview && searchParams.get("view") === "review";
  const reviewItem = searchParams.get("item");
  const openReview = () => router.push(roleHref(`${basePath}?view=review`));
  const closeReview = () => {
    setDetailTab("records");
    router.push(roleHref(basePath));
  };
  // Artefacts and attachments belong to a property: every file attached to a field, from the
  // persisted field-notes store, shaped for the shared artefact viewer.
  const notes = useFieldNotes();
  const artefacts = useMemo(
    () =>
      allFiles(notes).flatMap(({ recordId, key, file }) => {
        const rec = recordById(recordId);
        // Only files on a field the record still has.
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
          format: {
            image: "image/jpeg",
            pdf: "application/pdf",
            spreadsheet: "application/vnd.ms-excel",
            video: "video/mp4",
            link: "text/uri-list",
          }[file.kind],
          identifierUrl: file.url ?? "https://data.environment.sa.gov.au",
          licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
          publisher: meta.publisher,
          rightsHolder: meta.publisher,
          dcType: {
            image: "StillImage",
            pdf: "Text",
            spreadsheet: "Dataset",
            video: "MovingImage",
            link: "InteractiveResource",
          }[file.kind],
          bioDataId: `${meta.code.replace("-", "")}-${rec.code}`,
        };
        return [a];
      }),
    [notes, recordById, meta],
  );
  const projectTitle = project.details.shortTitle;
  const activeSectionNode =
    nav.find((section) => section.label === activeSection) ?? nav[0];

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key
      ? section
      : section.items?.find((item) => item.key);
    if (relatedLink?.key) router.push(roleHref(keyHref(relatedLink.key)));
    else setActiveSection(section.label);
  };

  const goToRecords = (kind: KindFilter, recordId?: string) => {
    setRecordFilter(filterForKind(kind));
    if (recordId) setSelectedId(recordId);
    setDetailTab("records");
  };

  // "Open record" from an artefact goes to the record and to the field the file is attached to.
  const [focusField, setFocusField] = useState<{
    recordId: string;
    key: string;
    nonce: number;
  } | null>(null);
  // A counter, not a timestamp, so opening the same field twice still counts as a new jump.
  const [focusSeq, setFocusSeq] = useState(0);
  const openRecord = (id: string, fieldKey?: string) => {
    setRecordFilter({});
    setSelectedId(id);
    setDetailTab("records");
    setRecordsView("tree");
    const nonce = focusSeq + 1;
    setFocusSeq(nonce);
    setFocusField(fieldKey ? { recordId: id, key: fieldKey, nonce } : null);
  };

  // "Go to record" from the all-projects Flagged concepts page arrives as `?record=<id>&field=<key>`:
  // open that record in Survey records at the field, once per link (adjusted during render).
  const recordParam = searchParams.get("record");
  const fieldParam = searchParams.get("field");
  const [openedFromUrl, setOpenedFromUrl] = useState<string | null>(null);
  const urlTarget = recordParam ? `${recordParam}|${fieldParam ?? ""}` : null;
  if (urlTarget && urlTarget !== openedFromUrl) {
    setOpenedFromUrl(urlTarget);
    openRecord(recordParam!, fieldParam ?? undefined);
  }

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      {layoutSwitcher && <ProjectDetailLayoutSwitcher current="option-1" />}
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
        }
        renderBreadcrumb={(orgLabel) =>
          activeSection === "Projects" && reviewing ? (
            <Breadcrumb
              section={
                <span className="flex items-center gap-2">
                  <ProjectSwitcher currentProjectId={meta.id} />
                  <span className="text-quaternary">/</span>
                  <button
                    type="button"
                    onClick={closeReview}
                    className="text-tertiary hover:text-primary"
                  >
                    {projectTitle}
                  </button>
                </span>
              }
              current="Flagged concepts"
              orgLabel={orgLabel}
            />
          ) : activeSection === "Projects" ? (
            <Breadcrumb
              section={<ProjectSwitcher currentProjectId={meta.id} />}
              current={projectTitle}
              orgLabel={orgLabel}
            />
          ) : (
            <Breadcrumb
              section={
                activeSection === "Home" ? undefined : activeSectionNode.label
              }
              orgLabel={orgLabel}
            />
          )
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail
          sections={nav}
          activeSection={activeSection}
          onSelectSection={goToSection}
        />

        {reviewing ? (
          <ReviewScreen
            key={reviewItem ?? "review"}
            entries={liveEntries}
            initialItem={reviewItem}
            exitLabel="Back to survey records"
            onExit={closeReview}
            onGoToRecord={(entry) => {
              router.push(roleHref(basePath));
              if (entry.live) openRecord(entry.live.recordId, entry.live.key);
            }}
          />
        ) : (
          <>
            {/* No column 2 on the project page (designer, 30 Sept 2026, CONTRACTS 3.7): the project's actions
                are in the hero's "..." menu, its records are on the Survey records tab. */}
            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">
              {activeSection === "Projects" ? (
                <div className="flex flex-col pb-6">
                  <RecordBackLink href={roleHref("/pages/project-list")}>Back to projects</RecordBackLink>

                  <ProjectHero />

                  {notice && <div className="px-6 pt-4">{notice}</div>}

                  <ContentTabs
                    selectedKey={detailTab}
                    onSelectionChange={(key) => setDetailTab(key as DetailTab)}
                    className="flex flex-col px-6 pt-4"
                  >
                    <TabList
                      aria-label="Project views"
                      type="underline"
                      size="md"
                      className="gap-6"
                    >
                      <Tab id="project" label="Project" icon={Folder} />
                      <Tab
                        id="records"
                        label="Survey records"
                        icon={Database01}
                        badge={records.length}
                      />
                      <Tab
                        id="species"
                        label="Species"
                        icon={Feather}
                        badge={species.length}
                      />
                      <Tab
                        id="artefacts"
                        label="Artefacts and attachments"
                        icon={Paperclip}
                        badge={artefacts.length}
                      />
                    </TabList>

                    <TabPanel id="project" className="pt-6">
                      <ProjectTab
                        layout="v3"
                        artefactCount={artefacts.length}
                        onGoToRecords={goToRecords}
                        onGoToArtefacts={() => setDetailTab("artefacts")}
                      />
                    </TabPanel>

                    <TabPanel id="records" className="flex flex-col gap-4 pt-4">
                      {canReview && openReviews > 0 && (
                        <AlertFullWidth
                          contained
                          wrap
                          color="warning"
                          actionType="link"
                          title={`${openReviews} flagged concept${openReviews === 1 ? "" : "s"} need${openReviews === 1 ? "s" : ""} review`}
                          description="Across this project."
                          confirmLabel="Review"
                          onConfirm={openReview}
                        />
                      )}
                      <RecordsExplorer
                        focusField={focusField}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        filter={recordFilter}
                        onFilterChange={setRecordFilter}
                        view={recordsView}
                        onViewChange={setRecordsView}
                      />
                    </TabPanel>

                    <TabPanel id="species" className="pt-6">
                      <SpeciesView onOpenRecord={(id) => openRecord(id)} />
                    </TabPanel>

                    <TabPanel id="artefacts" className="pt-6">
                      <ArtefactsView
                        artefacts={artefacts}
                        onOpen={setLightboxIndex}
                        onOpenRecord={openRecord}
                      />
                    </TabPanel>
                  </ContentTabs>
                </div>
              ) : (
                <SectionPlaceholder node={activeSectionNode} />
              )}
            </main>
          </>
        )}
      </div>

      <ArtefactLightbox
        artefacts={artefacts}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}

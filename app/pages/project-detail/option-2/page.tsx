"use client";

// Project detail, Option 2 (route /pages/project-detail/option-2). Until 29 Sept 2026 this was
// "Option 3, version 3" (/pages/project-detail/option-4/v3); the other explorations were deleted when
// it was chosen. Kept below as it was written, with the old route names:
//
// Project detail, Option 3 in the layout switcher (route /pages/project-detail/option-4). Same shell
// as Option 2: icon rail, the Projects list's column 2 (Projects / Datasets, Actions, footer links)
// and the gradient project header. The main area is new and has three tabs:
//
//  - Project: the whole registration (Overview, Data collection and storage, Privacy and
//    restrictions) as one readable page with an "On this page" list (project-tab.tsx).
//  - Survey records: every event, occurrence and observation in a tree or a table, beside a record
//    inspector that shows the selected record's metadata grouped by Darwin Core class
//    (records-explorer.tsx, record-inspector.tsx).
//  - Artefacts and attachments: every file attached to a record, each linked back to its record.
//
// Everyone but public users can edit: project metadata on the Project tab and each record's metadata
// in the inspector, through one shared card and edit flow (editable-section.tsx). Edits are kept for
// the session (edit-store.tsx). The records are this page's own Darwin Core-shaped dataset
// (survey-data.ts). Column 2 is the same for every persona, with project guides below the actions
// (projects-guide.tsx).

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TabList,
  Tab,
  TabPanel,
  Tabs as ContentTabs,
} from "@/components/application/tabs/tabs";
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  LayoutLeft,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
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
import {
  ProjectsSidebar,
  type ProjectScope,
} from "@/app/pages/_shared/projects-sidebar";
import { projects } from "@/app/pages/_shared/project-list-data";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { EditStoreProvider, useEditStore } from "./edit-store";
import {
  RecordsExplorer,
  filterForKind,
  type KindFilter,
  type RecordsView,
} from "./records-explorer";
import type { FilterSelection } from "@/app/pages/_shared/list-filter";

type DetailTab = "project" | "records" | "species" | "artefacts";

const PROJECT = { code: "BD-5039" };

function MetaField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {label}
      </p>
      <div className="text-sm text-white">{children}</div>
    </div>
  );
}

function ProjectHero() {
  const { project } = useEditStore();
  const d = project.details;
  const status = project.status;
  const statusColor =
    status === "Active"
      ? "success"
      : status === "Under review"
        ? "warning"
        : "gray";
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
            Project
          </p>
          <h1 className="text-2xl font-medium text-white">{d.shortTitle}</h1>
        </div>
        <ProjectCardActions projectCode={PROJECT.code} />
      </div>
      <div className="flex flex-wrap items-start gap-8">
        <MetaField label="Project ID">{PROJECT.code}</MetaField>
        <MetaField label="Start Date">
          {formatDay(d.startDate) || "Not provided"}
        </MetaField>
        <MetaField label="End Date">
          {d.endDate ? formatDay(d.endDate) : "Ongoing"}
        </MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color={statusColor}>
            {status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">
          {d.dataOwnerType === "organisation"
            ? d.dataOwnerOrgName
            : `${d.dataOwnerContacts[0]?.firstName ?? ""} ${d.dataOwnerContacts[0]?.lastName ?? ""}`.trim()}
        </MetaField>
      </div>
    </div>
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

export default function ProjectDetailOption4V3Page() {
  return (
    <Suspense fallback={null}>
      <ProjectDetailWithEdits />
    </Suspense>
  );
}

function ProjectDetailWithEdits() {
  const canEdit = useUserRole() !== "public-user";
  return (
    <EditStoreProvider canEdit={canEdit}>
      <ProjectDetail />
    </EditStoreProvider>
  );
}

function ProjectDetail() {
  const router = useRouter();
  const role = useUserRole();
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("project");
  const [selectedId, setSelectedId] = useState<string | null>("su1");
  const [recordFilter, setRecordFilter] = useState<FilterSelection>({});
  const [recordsView, setRecordsView] = useState<RecordsView>("tree");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { project, records, recordById } = useEditStore();
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
  const basePath = "/pages/project-detail/option-2";
  const openReview = () => router.push(roleHref(`${basePath}?view=review`));
  const closeReview = () => {
    setDetailTab("records");
    router.push(roleHref(basePath));
  };
  // Which list this project sits in: "My projects" when the signed-in person contributes to it.
  const projectScope: ProjectScope =
    projects.find((p) => p.code === "BD-5039")?.contributorName ===
    CURRENT_USER_NAME
      ? "mine"
      : "all";
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
          objectId: `AHL:${rec.code}:${file.id.toUpperCase()}`,
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
          publisher: "Adelaide Hills Landcare",
          rightsHolder: "Adelaide Hills Landcare",
          dcType: {
            image: "StillImage",
            pdf: "Text",
            spreadsheet: "Dataset",
            video: "MovingImage",
            link: "InteractiveResource",
          }[file.kind],
          bioDataId: `BD5039-${rec.code}`,
        };
        return [a];
      }),
    [notes, recordById],
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
      <RoleSwitcher />
      <ProjectDetailLayoutSwitcher current="option-2" />
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
                  Projects
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
              section="Projects"
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
            {/* ── Column 2: the Projects list's own column (My projects / All projects, Actions, guides) ── */}
            {activeSection === "Projects" && !sidebarCollapsed && (
              <ProjectsSidebar
                sectionLabel={activeSectionNode.label}
                scope={projectScope}
                onScopeChange={(scope) =>
                  router.push(roleHref(`/pages/project-list?scope=${scope}`))
                }
              />
            )}

            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
              {activeSection === "Projects" ? (
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex items-center gap-3">
                    <Tooltip
                      title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                    >
                      <TooltipTrigger
                        onPress={() => setSidebarCollapsed((c) => !c)}
                        aria-label={
                          sidebarCollapsed ? "Show sidebar" : "Hide sidebar"
                        }
                        className="hidden size-8 items-center justify-center rounded-md text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-tertiary hover:text-primary focus-visible:outline-2 lg:flex"
                      >
                        <LayoutLeft className="size-5" />
                      </TooltipTrigger>
                    </Tooltip>
                    <div className="hidden h-5 w-px bg-[var(--ui-border-primary)] lg:block" />
                    <Link
                      href={roleHref("/pages/project-list")}
                      className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary"
                    >
                      <ArrowNarrowLeft className="size-4" />
                      Back to projects
                    </Link>
                  </div>

                  <ProjectHero />

                  <ContentTabs
                    selectedKey={detailTab}
                    onSelectionChange={(key) => setDetailTab(key as DetailTab)}
                    className="flex flex-col"
                  >
                    <TabList
                      aria-label="Project views"
                      type="underline"
                      size="md"
                      className="gap-6"
                    >
                      <Tab id="project" label="Project" />
                      <Tab
                        id="records"
                        label="Survey records"
                        badge={records.length}
                      />
                      <Tab
                        id="species"
                        label="Species"
                        badge={species.length}
                      />
                      <Tab
                        id="artefacts"
                        label="Artefacts and attachments"
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
                          tintedBackground
                          wrap
                          color="warning"
                          actionType="link"
                          className="max-w-none rounded-lg border border-warning-200 bg-warning-25 px-4 py-3"
                          title={`${openReviews} flagged concept${openReviews === 1 ? "" : "s"}`}
                          description={`need${openReviews === 1 ? "s" : ""} review across this project`}
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

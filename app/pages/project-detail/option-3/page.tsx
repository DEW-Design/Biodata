"use client";

// A third take on the project detail screen, sitting alongside option-1 and option-2 for direct
// comparison (per this build's own precedent: "Create this as a new page. so we can compare old
// option and new option"). Prompted by a Figma reference (wer8CgO1UoCH3aQw2jQkdy, node
// 2537:75960 - this same project, About tab, as one continuous scroll under a plain anchor-link
// sidebar) handed over explicitly "for your idea and reference only... I expect you to come up
// with an even more advanced UX UI and visual design" - not a frame to match. See
// about-content.tsx's own header comment for the actual design reasoning (a persistent "at a
// glance" rail + a horizontal Tab switcher for the 3 real registration stages).
//
// Everything else on this page - the header, the icon rail, the Records/Species tabs, the record
// edit machinery - is reused directly from option-2 rather than re-implemented a third time. That
// machinery (record-store, field-editor, record-fields, record-panel, records-view, project-scope,
// project-registration-data, registration-summary) is genuinely generic - none of it is coupled to
// option-2's own page shell, all of it already takes `project`/data as plain arguments - so
// cross-importing it here is the same "one real dataset, never a second disconnected copy"
// principle already applied to search-data.ts across the map search tool, option-1 and option-2.
// Only the About tab's own layout (about-content.tsx) is genuinely new.

import { Suspense, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DateValue } from "@internationalized/date";
import { TabList, Tab, TabPanel, Tabs as ContentTabs } from "@/components/application/tabs/tabs";
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  Edit02,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { ProjectDetailLayoutSwitcher } from "@/app/pages/_shared/project-detail-layout-switcher";
import { SpeciesResultsView } from "@/app/pages/_shared/map-search/species-results";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";

import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { registeredUserNav, publicUserNav, keyHref, type NavNode } from "@/lib/registered-user-nav";

import { RecordStoreProvider, useRecordStore } from "../option-2/record-store";
import type { DetailRecord } from "../option-2/record-fields";
import { RecordEditPanel } from "../option-2/record-panel";
import { RecordsView, type EntityTab } from "../option-2/records-view";
import { projectEvents, projectObservations, projectOccurrences, projectResources } from "../option-2/project-scope";
import type { FieldSpec, FieldValues } from "../option-2/field-editor";
import { AboutContent, FieldsEditor, PROJECT_STATUS_OPTIONS, parseProjectDate, statusColorFor } from "./about-content";
import { EditColumn, type EditRequest } from "./edit-column";

const PROJECT_ID = "adelaide-hills";
const project = searchEvents.find((e) => e.id === PROJECT_ID)!;
type DetailTab = "overview" | "records" | "species";

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "About" },
  { id: "records", label: "Records" },
  { id: "species", label: "Species" },
];

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink ? "This section has its own page - it isn't embedded here." : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))} iconTrailing={ArrowNarrowRight}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

// ── Project header - matching option-1/option-2's own real meta-row treatment exactly (an
//    eyebrow, the title, then Project ID/Start Date/End Date/Status/Published by as five labelled
//    columns), per direct reference to that exact header. Start Date, End Date and Status are now
//    genuinely editable too, via the same hover-icon -> docked `EditColumn` pattern every card in
//    the About tab already uses - Project ID and Published by stay fixed identifiers, per direct
//    request scoping editability to "start date end date and project status" specifically. ──

const HEADER_STORE_KEY = `event-${project.id}:header`;

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function ProjectHero({ onEditRequest }: { onEditRequest: (req: EditRequest) => void }) {
  const store = useRecordStore();
  const seed: FieldValues = { startDate: parseProjectDate(project.startDate), endDate: parseProjectDate(project.endDate), status: project.status };
  const values = { ...seed, ...store.getSection(HEADER_STORE_KEY) };
  const startDate = values.startDate && typeof values.startDate === "object" ? (values.startDate as DateValue) : null;
  const endDate = values.endDate && typeof values.endDate === "object" ? (values.endDate as DateValue) : null;
  const status = typeof values.status === "string" ? values.status : project.status;

  const fields: FieldSpec[] = [
    { id: "startDate", label: "Start Date", type: "date" },
    { id: "endDate", label: "End Date", type: "date" },
    { id: "status", label: "Status", type: "select", options: PROJECT_STATUS_OPTIONS },
  ];

  return (
    <div className="group relative flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary sm:text-3xl">{project.name}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3 border-b border-secondary pb-5">
        <MetaField label="Project ID">{project.code}</MetaField>
        <MetaField label="Start Date">{startDate ? startDate.toString() : "—"}</MetaField>
        <MetaField label="End Date">{endDate ? endDate.toString() : "—"}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color={statusColorFor(status)}>
            {status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.org}</MetaField>
      </div>
      <button
        type="button"
        aria-label="Edit project status and dates"
        onClick={() =>
          onEditRequest({
            title: "Project status and dates",
            render: (onDone) => (
              <FieldsEditor
                kicker="Project"
                title="Update project status and dates"
                description="Change this project's start date, end date, or current status."
                fields={fields}
                values={values}
                onSave={(next) => store.setSection(HEADER_STORE_KEY, next)}
                onDone={onDone}
              />
            ),
          })
        }
        className="absolute top-0 right-0 flex size-8 items-center justify-center rounded-md text-quaternary opacity-0 transition hover:bg-secondary hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Edit02 className="size-4" />
      </button>
    </div>
  );
}

export default function ProjectDetailOption3Page() {
  return (
    <Suspense fallback={null}>
      <RecordStoreProvider>
        <ProjectDetail />
      </RecordStoreProvider>
    </Suspense>
  );
}

function ProjectDetail() {
  const router = useRouter();
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [recordsInitialTab, setRecordsInitialTab] = useState<EntityTab>("events");
  const [recordsInitialViewMode, setRecordsInitialViewMode] = useState<"tree" | "table">("tree");
  const [speciesPanelRecord, setSpeciesPanelRecord] = useState<DetailRecord | null>(null);
  // The one shared "which card is being edited" slot - a real docked column, not an overlay (see
  // edit-column.tsx's own header comment) - both the header (Start/End Date/Status) and every
  // card in the About tab send their edit requests here, so only one is ever open at a time.
  const [activeEdit, setActiveEdit] = useState<EditRequest | null>(null);
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  const recordCounts: Record<EntityTab, number> = useMemo(
    () => ({
      events: projectEvents(project.id).length,
      occurrences: projectOccurrences(project.id).length,
      observations: projectObservations(project.id).length,
      artefacts: projectResources(project.id).length,
    }),
    [],
  );

  // From the About tab's "At a glance" rail - a record-count click jumps straight to Records'
  // Table view, pre-selected to that exact entity type (see records-view.tsx's own
  // `initialEntityTab`/`initialViewMode`, both read once on mount - safe since the Records
  // TabPanel unmounts whenever it's not the active tab, so a fresh click always re-seeds them).
  const goToRecords = (tab: EntityTab) => {
    setRecordsInitialTab(tab);
    setRecordsInitialViewMode("table");
    setDetailTab("records");
  };

  const projectSpeciesOccurrences = useMemo(() => projectOccurrences(project.id), []);

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setActiveSection(section.label);
    }
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      <ProjectDetailLayoutSwitcher current="option-2" />
      {/* ── Header - identical shape to option-1/option-2's own clean, flat header (no colour
          band): an eyebrow label, the title, and a meta line - per the user's own direct
          preference against a dark banner, confirmed twice already on option-2. ── */}
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
            activeSection === "Projects" ? (
              <Breadcrumb section="Projects" current={project.name} orgLabel={orgLabel} />
            ) : (
              <Breadcrumb section={activeSection === "Home" ? undefined : activeSectionNode.label} orgLabel={orgLabel} />
            )}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Primary icon rail ── */}
        <PrimaryRail sections={nav} activeSection={activeSection} onSelectSection={goToSection} />

        <main className="flex flex-1 flex-col overflow-y-auto">
          {activeSection === "Projects" ? (
            <div className="flex flex-col gap-6 p-6">
              <Link href={roleHref("/pages/project-list")} className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary">
                <ArrowNarrowLeft className="size-4" />
                Back to projects
              </Link>

              <ProjectHero onEditRequest={setActiveEdit} />

              <ContentTabs selectedKey={detailTab} onSelectionChange={(key) => setDetailTab(key as DetailTab)} className="flex flex-1 flex-col">
                <TabList aria-label="Project views" type="underline" size="md" className="gap-6">
                  {detailTabs.map((t) => (
                    <Tab key={t.id} id={t.id} label={t.label} />
                  ))}
                </TabList>

                <TabPanel id="overview" className="pt-4">
                  <AboutContent project={project} counts={recordCounts} onNavigateToRecords={goToRecords} onEditRequest={setActiveEdit} />
                </TabPanel>

                <TabPanel id="records" className="pt-4">
                  <RecordsView project={project} initialEntityTab={recordsInitialTab} initialViewMode={recordsInitialViewMode} />
                </TabPanel>

                <TabPanel id="species" className="pt-4">
                  <SpeciesResultsView rows={projectSpeciesOccurrences} onRowClick={(o) => setSpeciesPanelRecord({ kind: "occurrence", occurrence: o })} />
                  <RecordEditPanel record={speciesPanelRecord} project={project} onClose={() => setSpeciesPanelRecord(null)} />
                </TabPanel>
              </ContentTabs>
            </div>
          ) : (
            <SectionPlaceholder node={activeSectionNode} />
          )}
        </main>

        <EditColumn request={activeEdit} onClose={() => setActiveEdit(null)} />
      </div>
    </div>
  );
}

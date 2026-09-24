"use client";

// A second, deliberately different take on the project detail screen - built to compare directly
// against project-detail/option-1 (per direct request: "Create this as a new page. so we can
// compare old option and new option"). Two Figma references grounded this rebuild:
// wer8CgO1UoCH3aQw2jQkdy node 1938:35405 (the real tree/table view toggle in this screen's own
// top-right corner, and its dark project-identity band) and node 2526:58529 (15 "Details
// Container" frames, one per Event/Occurrence/Observation sub-type, each stacking a read-only view
// of a section directly above a real, editable version of the same fields - see
// field-editor.tsx/record-fields.tsx for how that view/edit pattern was generalised into one
// reusable system instead of 15 bespoke forms).
//
// What's new here, not just restyled:
//  - A dark gradient identity banner (the same real `bg-gradient-to-b from-brand-900 ...` token
//    treatment `home-dashboard.tsx`'s own greeting banner already established - not a raw hex
//    clone of Figma's own dark header) replaces option-1's flat meta row + separate rail card,
//    carrying the project's identity and its 4 headline counts in one glance.
//  - Records and Species are real, first-class tabs (matching the map search tool's own Records/
//    Species split, per direct request to bring that pattern here) instead of a tree buried in the
//    contextual sidebar - the sidebar tree from option-1 is gone; the same tree now lives inside
//    the Records tab, next to a real Table view, toggled by the same tree/table icon pair Figma's
//    own reference shows top-right of that tab.
//  - Every record - the project's own top-level fields (Details tab) and any Event/Occurrence/
//    Observation opened from the Records or Species tab - can actually be edited, not just viewed.
//    No real backend exists anywhere in this build, so an edit commits into this page's own
//    session-only record store (record-store.tsx) rather than a server, honestly flagged in the
//    save toast, same convention as project-registration's own "Save Draft".
//
// Same one concrete project as option-1 (Adelaide Hills Bushland Survey) - now sourced from the
// real, shared map-search dataset (search-data.ts) instead of a second hand-authored mock, so this
// page and the map search tool can never disagree about the same project's own records.

import { Suspense, useMemo, useState, type FC, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button as AriaButton, Dialog, DialogTrigger } from "react-aria-components";
import { TabList, Tab, TabPanel, Tabs as ContentTabs } from "@/components/application/tabs/tabs";
import {
  Upload01,
  Plus,
  ChevronDown,
  ArrowNarrowLeft,
  ArrowNarrowRight,
  HomeLine,
  Folder,
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
  Map01,
  File02,
  Database01,
  Shield01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { MapView } from "@/app/pages/_shared/map-view";
import { SpeciesResultsView } from "@/app/pages/_shared/map-search/species-results";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";

import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { orgLabelForRole } from "@/lib/user-role";
import { registeredUserNav, publicUserNav, registeredUserAccountMenu, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

import { RecordStoreProvider, useRecordStore } from "./record-store";
import { FieldSection, emptyCustomPropertyRow, type CustomPropertyRow } from "./field-editor";
import { buildSections, type DetailRecord } from "./record-fields";
import { RecordEditPanel } from "./record-panel";
import { RecordsView } from "./records-view";
import { projectOccurrences } from "./project-scope";
import { registrationDataCollection, registrationProjectDetails, registrationRestrictions } from "./project-registration-data";
import { DataCollectionCard, DataOwnerCard, GeographicExtentSummary, IdentificationRow, ProjectManagersCard, RestrictionsCard, permitTypeLabel } from "./registration-summary";

const PROJECT_ID = "adelaide-hills";
const project = searchEvents.find((e) => e.id === PROJECT_ID)!;

const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  "Data Licencing Agreement (DLA)": FileLock01,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};

type DetailTab = "overview" | "records" | "species";

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "About" },
  { id: "records", label: "Records" },
  { id: "species", label: "Species" },
];

// ── Project information stages - mirrors the real Add Project wizard's own 3 steps
//    (project-registration/stepper.tsx's STEPS) exactly by name/order, per direct request: "We
//    have three stages and we collect different kind of information in each level. I want the
//    same information collected in the same sort of grouping in the project homepage." A left
//    sidebar (not the wizard's own horizontal stepper - this is a static viewer, not a flow to
//    step through in order) lets a reader jump straight to the group they care about instead of
//    scrolling one long page; the selected stage renders inside a card styled after the wizard's
//    own big rounded question card (see StageCard below) per the follow-up ask to "reflect the
//    card view (Typeform) style." ──

type OverviewStage = "identification" | "data-collection" | "restrictions";

const OVERVIEW_STAGES: { id: OverviewStage; label: string; icon: FC<{ className?: string }>; kicker: string; title: string; description: string }[] = [
  {
    id: "identification",
    label: "Overview",
    icon: File02,
    kicker: "Project Details",
    title: "Project Identification",
    description: "Basic information about the project, including title, description, and who owns and manages it.",
  },
  {
    id: "data-collection",
    label: "Data Collection and Storage",
    icon: Database01,
    kicker: "Data Collection",
    title: "Data Collection and Storage",
    description: "Types of data collected, storage methods, and any relevant handling procedures.",
  },
  {
    id: "restrictions",
    label: "Privacy and Restrictions",
    icon: Shield01,
    kicker: "Privacy",
    title: "Privacy and Restrictions",
    description: "Visibility, embargo, and data-sharing options controlling who can access this project's data.",
  },
];

function OverviewStageNav({ active, onSelect }: { active: OverviewStage; onSelect: (id: OverviewStage) => void }) {
  return (
    <nav aria-label="Project information" className="flex w-full shrink-0 flex-col gap-1 rounded-2xl border border-secondary bg-secondary p-2 lg:w-64">
      {OVERVIEW_STAGES.map((stage) => {
        const Icon = stage.icon;
        const isActive = stage.id === active;
        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelect(stage.id)}
            aria-current={isActive ? "true" : undefined}
            className={cx(
              "flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
              isActive ? "bg-primary shadow-xs ring-1 ring-[var(--color-brand-500)]" : "hover:bg-primary/60",
            )}
          >
            <Icon className={cx("mt-0.5 size-4 shrink-0", isActive ? "text-brand-tertiary" : "text-fg-quaternary")} />
            <span className={cx("text-sm font-medium", isActive ? "text-brand-tertiary" : "text-tertiary")}>{stage.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function StageCard({ stage, children }: { stage: (typeof OVERVIEW_STAGES)[number]; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-secondary bg-primary p-6 sm:p-8">
      <div className="flex flex-col gap-1 border-b border-secondary pb-6">
        <span className="text-xs font-semibold tracking-wide text-brand-tertiary uppercase">{stage.kicker}</span>
        <h2 className="text-xl font-semibold text-primary sm:text-2xl">{stage.title}</h2>
        <p className="text-sm text-tertiary">{stage.description}</p>
      </div>
      <div className="flex flex-col gap-4 pt-6">{children}</div>
    </div>
  );
}

function OverviewSection() {
  const [stage, setStage] = useState<OverviewStage>("identification");
  const activeStage = OVERVIEW_STAGES.find((s) => s.id === stage)!;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <OverviewStageNav active={stage} onSelect={setStage} />
      <StageCard stage={activeStage}>
        {stage === "identification" && (
          <>
            <IdentificationRow details={registrationProjectDetails} />
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Abstract</p>
              <p className="text-sm text-secondary">{registrationProjectDetails.abstract}</p>
            </div>
            <div className="flex flex-col gap-4 border-t border-secondary pt-4 sm:flex-row">
              <div className="min-w-0 flex-1">
                <DataOwnerCard details={registrationProjectDetails} />
              </div>
              <div className="min-w-0 flex-1">
                <ProjectManagersCard managers={registrationProjectDetails.projectManagers} />
              </div>
            </div>
          </>
        )}

        {stage === "data-collection" && (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Geographic Extent</p>
              <GeographicExtentSummary collection={registrationDataCollection} />
              <div className="mt-3 min-h-[200px] overflow-hidden rounded-lg border border-secondary">
                <MapView />
              </div>
            </div>
            <div className="border-t border-secondary pt-4">
              <DataCollectionCard collection={registrationDataCollection} bare />
            </div>
            <div className="border-t border-secondary pt-4">
              <h3 className="mb-3 text-sm font-medium text-primary">Permit &amp; Identifiers</h3>
              <PermitAndUriFields />
            </div>
            <div className="border-t border-secondary pt-4">
              <h3 className="mb-3 text-sm font-medium text-primary">Custom Property</h3>
              <CustomPropertyFields />
            </div>
          </>
        )}

        {stage === "restrictions" && <RestrictionsCard restrictions={registrationRestrictions} bare />}
      </StageCard>
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

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <DialogTrigger onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-1 rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-2">
        <Avatar size="md" initials="OW" alt="Olivia Wyatt" />
        <ChevronDown className={cx("size-3.5 text-quaternary transition-transform", open && "rotate-180")} />
      </AriaButton>
      <Popover size="sm" className="w-48 p-1">
        <Dialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          {registeredUserAccountMenu.map((item) => (
            <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
              {item}
            </p>
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

// ── Hero banner - a single compact row (not a tall stacked block) carrying the project's identity
//    and its 4 headline counts in one glance. Still the same real dark-gradient token treatment
//    home-dashboard.tsx's own greeting banner already established (bg-gradient-to-b from-brand-900
//    via-brand-800 to brand-700) - only the internal layout changed, per direct feedback that the
//    original stacked version ("title" / "meta row" / divider / "stat row") took up too much
//    vertical space before any real content was visible - the dark gradient treatment tried
//    first went further than asked and was flagged directly off a screenshot ("I like this way of
//    the project header and not the green bar"), pointing at option-1's own plain header instead.
//    This is now that same plain, light treatment: an eyebrow label, the title, and a meta row
//    with a bottom rule, no colour block at all - not a restyled dark banner. The 4 headline
//    counts that used to sit in this header are gone rather than relocated - they're already
//    real, live numbers on the Records tab's own metric tiles a click away, and repeating them
//    here would be the same "same fact, two treatments" duplication this file's own cognitive-load
//    principles warn against. ──

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function ProjectHero() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary sm:text-3xl">{project.name}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3 border-b border-secondary pb-5">
        <MetaField label="Project ID">{project.code}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color={project.statusColor}>
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.org}</MetaField>
      </div>
    </div>
  );
}

// ── Permit / URI-DOI / Custom Property - the one part of the Overview tab that stays genuinely
//    editable (through the same FieldSection/record-store system every Tree/Table/Species row
//    uses), seeded from the real registration data above rather than left blank. Everything else
//    in the Overview tab (focus areas, targeted species, data owner, restrictions...) is read-only
//    display - editing those would mean rebuilding the wizard's own multi-select/contact-list UI a
//    second time inline, a much bigger lift than this pass's actual ask (show the information
//    well), so that's deliberately out of scope for now. ──

function PermitAndUriFields() {
  const store = useRecordStore();
  const record: DetailRecord = { kind: "event", event: project };
  const sections = buildSections(record);
  const permitSection = sections.find((s) => s.id === "permit");
  const uriSection = sections.find((s) => s.id === "uri-doi");
  const permit = registrationDataCollection.permits[0];

  const permitKey = `event-${project.id}:permit`;
  const uriKey = `event-${project.id}:uri-doi`;
  const permitValues = { permitType: permitTypeLabel(permit?.type ?? null), permitNo: permit?.number ?? "", ...store.getSection(permitKey) };
  const uriValues = { uriDoi: registrationDataCollection.uriDoi, ...store.getSection(uriKey) };

  return (
    <div className="flex flex-col gap-4">
      {permitSection && <FieldSection fields={permitSection.fields ?? []} values={permitValues} onSave={(next) => store.setSection(permitKey, next)} />}
      <div className="border-t border-secondary pt-4">
        {uriSection && <FieldSection fields={uriSection.fields ?? []} values={uriValues} onSave={(next) => store.setSection(uriKey, next)} />}
      </div>
    </div>
  );
}

function CustomPropertyFields() {
  const store = useRecordStore();
  const storeKey = `event-${project.id}:custom`;
  return (
    <FieldSection
      fields={[]}
      values={{}}
      onSave={() => {}}
      customProperty={{
        rows: store.getCustomRows(storeKey, [emptyCustomPropertyRow(1)]) as CustomPropertyRow[],
        onChange: (rows) => store.setCustomRows(storeKey, rows),
      }}
    />
  );
}

export default function ProjectDetailOption2Page() {
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
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [speciesPanelRecord, setSpeciesPanelRecord] = useState<DetailRecord | null>(null);
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

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
      {/* ── Header ── */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pages/dashboard/gov-sa-dew-lockup.png" alt="Government of South Australia, Department for Environment and Water" className="h-[37px] w-auto" />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          {activeSection === "Projects" ? (
            <Breadcrumb section="Projects" current={project.name} orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined} />
          ) : (
            <Breadcrumb section={activeSection === "Home" ? undefined : activeSectionNode.label} orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined} />
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64 lg:w-[395px]">
              <GlobalProjectSearch />
            </div>
            <GuestActionButton
              icon={Plus}
              label="Add project"
              color="primary"
              isGuest={isPublicUser}
              modalTitle="Sign up to add a project"
              modalDescription="Create a free BioData SA account to start contributing projects to South Australia's biodiversity record."
              href="/pages/project-registration"
            />
            <GuestActionButton
              icon={Upload01}
              label="Upload dataset"
              color="secondary"
              isGuest={isPublicUser}
              modalTitle="Sign up to upload a dataset"
              modalDescription="Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record."
            />
          </div>
          {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Primary icon rail ── */}
        <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-secondary bg-secondary py-4 lg:flex">
          {nav.map((section) => {
            const Icon = sectionIcons[section.label];
            const active = section.label === activeSection;
            return (
              <Tooltip key={section.label} title={section.label} placement="right">
                <TooltipTrigger
                  onPress={() => goToSection(section)}
                  aria-label={section.label}
                  className={cx(
                    "relative flex size-12 items-center justify-center rounded-lg transition duration-100 ease-linear active:scale-[0.96]",
                    active ? "bg-brand-solid text-white" : "text-quaternary hover:bg-tertiary hover:text-primary",
                  )}
                >
                  {Icon && <Icon className="size-5" />}
                </TooltipTrigger>
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Main content - no secondary contextual sidebar. The nested-records tree that used to
            live in a persistent aside now lives inside the Records tab's own Tree view
            (records-view.tsx), and a plain section list mirroring the Tabs below it was dropped
            entirely per direct feedback - it doubled the same navigation the Tabs already give,
            the same "no contextual sidebar" shape this build's own guest single-view layout
            already established elsewhere (see CONTEXT.md's "User roles" section). ── */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          {activeSection === "Projects" ? (
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={roleHref("/pages/project-list/option-1")} className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary">
                  <ArrowNarrowLeft className="size-4" />
                  Back to projects
                </Link>
                <Link href={roleHref("/pages/project-detail/option-1")} className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary">
                  Comparing layouts · View Option 1
                  <ArrowNarrowRight className="size-4" />
                </Link>
              </div>

              <ProjectHero />

              <ContentTabs selectedKey={detailTab} onSelectionChange={(key) => setDetailTab(key as DetailTab)} className="flex flex-1 flex-col">
                <TabList aria-label="Project views" type="underline" size="md" className="gap-6">
                  {detailTabs.map((t) => (
                    <Tab key={t.id} id={t.id} label={t.label} />
                  ))}
                </TabList>

                {/* ── About: every piece of project-level information the real registration
                    wizard collects (project-registration/**), grouped into the exact same 3
                    stages that wizard steps through - Project Identification / Data Collection
                    and Storage / Privacy and Restrictions - via a left sidebar next to a single
                    Typeform-styled card, per direct request to mirror that flow's own grouping
                    and card language on the read-only project page. See OverviewSection above. ── */}
                <TabPanel id="overview" className="pt-4">
                  <OverviewSection />
                </TabPanel>

                <TabPanel id="records" className="pt-4">
                  <RecordsView project={project} />
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
      </div>
    </div>
  );
}

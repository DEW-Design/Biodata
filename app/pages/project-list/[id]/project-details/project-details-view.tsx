"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowLeft, Eye, FileSearch01, Target05 } from "@untitledui/icons";
import { Tabs as ContentTabs, type Key } from "react-aria-components";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { ProjectCardActions } from "@/app/pages/_shared/project-card-actions";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { buildSections, recordTitle, type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { isRestricted, recordAccess } from "@/app/pages/_shared/map-search/record-access";
import { eventTypeIcon, hasScientificName, searchEvents, type SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { SpeciesPhotoCarousel } from "@/app/pages/_shared/map-search/species-photo-carousel";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { projectDetailsPath, projectRecordPath } from "@/app/pages/_shared/project-routes";
import { hasFeatureAccess } from "@/config/role-access.config";
import { SpeciesResultsView } from "@/app/pages/_shared/map-search/species-results";
import { buildEventTree, projectOccurrences, type EventTreeNode } from "@/app/pages/_shared/project-scope";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import type { UserRole } from "@/lib/user-role";
import { cx } from "@/utils/cx";

// The project page for every project that has no hand-written page (all but Adelaide Hills), built
// from the same data Explore searches, so the two can never disagree. Same three-column shell and
// the same identity card as Adelaide Hills' page: the rail with Projects active, column 2 holding
// the project's records as a tree, main opening on the Overview tab (per the designer). Only what
// the data holds is shown; there is no abstract, contact or permit detail to invent here.
//
// A record (an occurrence, observation, or event such as a site or visit) has its own page in the
// same shell, `ProjectRecordView`: the project's records tree stays in column 2 with the record
// highlighted, and main is the record, laid out like every record page (CONTRACTS 4.6). Every tree
// row and species row links to that page; nothing opens in a slide-in panel (per the designer).

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-xs font-semibold tracking-wide text-white/70 uppercase">{label}</p>
      <div className="text-sm text-white">{children}</div>
    </div>
  );
}

function OverviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-secondary px-4 py-3 last:border-b-0 sm:flex-row sm:gap-6">
      <p className="m-0 shrink-0 text-sm text-secondary sm:w-44">{label}</p>
      <div className="min-w-0 flex-1 text-sm text-primary">{children}</div>
    </div>
  );
}

/** The data marks an open-ended project with a lone dash (U+2014); show it as "Ongoing". */
function endDateLabel(endDate: string): string {
  return !endDate || endDate === "\u2014" ? "Ongoing" : endDate;
}

/** The project's records as tree items, following the data model (Project > Site > Visit >
 *  Occurrence > Observation): each event (site, visit, transect ...) with its child events and the
 *  occurrences recorded at it, and each occurrence with the one observation it parents. What a
 *  public user may not see is left out. */
function renderEventNode(node: EventTreeNode, role: UserRole, selectedKey: string | null): ReactNode {
  const Icon = eventTypeIcon[node.event.type];
  const occurrences = node.occurrences.filter((o) => recordAccess(o, role) !== "hidden");
  const key = `event:${node.event.id}`;
  const highlight = (k: string) => (k === selectedKey ? "bg-brand-50 text-brand-secondary" : undefined);
  return (
    <TreeView.Item key={key} id={key} textValue={node.event.name}>
      <TreeView.ItemContent icon={Icon} className={highlight(key)}>
        {node.event.name}
      </TreeView.ItemContent>
      {node.children.map((child) => renderEventNode(child, role, selectedKey))}
      {occurrences.map((o) => {
        const observation = node.observations.find((ob) => ob.occurrenceId === o.id);
        const shown = observation && recordAccess(observation, role) !== "hidden" ? observation : undefined;
        return (
          <TreeView.Item key={`occurrence:${o.id}`} id={`occurrence:${o.id}`} textValue={o.commonName}>
            <TreeView.ItemContent icon={Target05} className={highlight(`occurrence:${o.id}`)}>
              {o.commonName}
            </TreeView.ItemContent>
            {shown && (
              <TreeView.Item key={`observation:${shown.id}`} id={`observation:${shown.id}`} textValue={`Observation ${shown.commonName}`}>
                <TreeView.ItemContent icon={Eye} className={highlight(`observation:${shown.id}`)}>
                  Observation
                </TreeView.ItemContent>
              </TreeView.Item>
            )}
          </TreeView.Item>
        );
      })}
    </TreeView.Item>
  );
}

function recordKey(record: DetailRecord | null): string | null {
  if (!record) return null;
  if (record.kind === "event") return `event:${record.event.id}`;
  return record.kind === "occurrence" ? `occurrence:${record.occurrence.id}` : `observation:${record.observation.id}`;
}

/** The record page's path for a tree row key (`event:<id>`, `occurrence:<id>`, `observation:<id>`). */
function pathForTreeKey(projectId: string, key: Key): string | null {
  const [kind, ...rest] = String(key).split(":");
  const id = rest.join(":");
  if (kind === "event") return projectRecordPath(projectId, "events", id);
  if (kind === "occurrence") return projectRecordPath(projectId, "occurrences", id);
  if (kind === "observation") return projectRecordPath(projectId, "observations", id);
  return null;
}

/** The shell every project page and record page shares: header, rail, column 2 with the project's
 *  records tree (the current record highlighted), and main. */
function ProjectShell({ project, record = null, children }: { project: SearchEvent; record?: DetailRecord | null; children: ReactNode }) {
  const router = useRouter();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);

  const goToSection = (section: NavNode) => {
    const target = section.key ? section : section.items?.find((item) => item.key);
    if (target?.key) router.push(roleHref(keyHref(target.key)));
  };

  const tree = useMemo(() => buildEventTree(project.id), [project.id]);
  const allKeys = useMemo(() => {
    const keys: string[] = [];
    const walk = (n: EventTreeNode) => {
      keys.push(`event:${n.event.id}`);
      // Occurrences open too, so each one's observation shows beneath it.
      n.occurrences.forEach((o) => keys.push(`occurrence:${o.id}`));
      n.children.forEach(walk);
    };
    tree.forEach(walk);
    return keys;
  }, [tree]);

  const openFromTree = (key: Key) => {
    const path = pathForTreeKey(project.id, key);
    if (path) router.push(roleHref(path));
  };

  const projectsHref = roleHref("/pages/project-list");
  const projectHref = roleHref(projectDetailsPath(project.id));

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection="Projects"
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
        }
        renderBreadcrumb={(orgLabel) => (
          <Breadcrumb
            orgLabel={orgLabel}
            section={
              <>
                <Link href={projectsHref} className="hover:text-primary">
                  Projects
                </Link>
                {record && (
                  <>
                    <span>/</span>
                    <Link href={projectHref} className="hover:text-primary">
                      {project.name}
                    </Link>
                  </>
                )}
              </>
            }
            current={record ? recordTitle(record) : project.name}
          />
        )}
      />

      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection="Projects" onSelectSection={goToSection} />

        <aside aria-label="Records" className="hidden w-[286px] shrink-0 flex-col justify-between gap-4 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          <div className="flex flex-col gap-1">
            <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Records</p>
            {tree.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
                <FileSearch01 className="size-5 text-fg-quaternary" />
                <p className="text-xs text-balance text-tertiary">This project has no sites or surveys recorded yet.</p>
              </div>
            ) : (
              <TreeView aria-label={`${project.name} records`} showConnectors onAction={openFromTree} defaultExpandedKeys={allKeys} className="w-full">
                {tree.map((node) => renderEventNode(node, role, recordKey(record)))}
              </TreeView>
            )}
          </div>
          <SidebarFooterLinks />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export function ProjectDetailsView({ project, notice }: { project: SearchEvent; notice?: ReactNode }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const [tab, setTab] = useState<Key>("overview");
  const occurrences = useMemo(() => projectOccurrences(project.id), [project.id]);
  const projectsHref = roleHref("/pages/project-list");

  return (
    <ProjectShell project={project}>
      <div className="px-6 pt-6">
        <Link href={projectsHref} className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary">
          <ArrowNarrowLeft className="size-4" />
          Back to projects
        </Link>
      </div>

      <div className="px-6 pt-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="m-0 text-xs font-semibold tracking-wide text-white/70 uppercase">Project</p>
              <h1 className="m-0 text-2xl font-semibold text-balance text-white">{project.name}</h1>
            </div>
            <ProjectCardActions projectId={project.id} projectCode={project.code} />
          </div>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
            <MetaField label="Project ID">{project.code}</MetaField>
            <MetaField label="Start Date">{project.startDate}</MetaField>
            <MetaField label="End Date">{endDateLabel(project.endDate)}</MetaField>
            <MetaField label="Status">
              <BadgeWithDot size="sm" color={project.statusColor}>
                {project.status}
              </BadgeWithDot>
            </MetaField>
            <MetaField label="Published by">{project.org}</MetaField>
          </div>
        </div>
      </div>

      {notice && <div className="px-6 pt-4">{notice}</div>}

      <ContentTabs selectedKey={tab} onSelectionChange={setTab} className="flex flex-1 flex-col">
        <div className="px-6 pt-4">
          <TabList aria-label="Project views" type="underline" size="md">
            <Tab id="overview" label="Overview" />
            <Tab id="species" label="Species" />
          </TabList>
        </div>
        <TabPanel id="overview" className="p-6">
          <div className="rounded-lg border border-secondary">
            <OverviewRow label="Abstract">
              <p className={cx("m-0 text-balance", !project.description && "text-tertiary")}>{project.description ?? "Not provided"}</p>
            </OverviewRow>
            <OverviewRow label="Published by">{project.org}</OverviewRow>
            <OverviewRow label="Contributor">{project.contributorName ?? <span className="text-tertiary">Not provided</span>}</OverviewRow>
            <OverviewRow label="Region">{project.region}</OverviewRow>
            <OverviewRow label="Location">
              <LocationDetailsTable lat={project.lat} lon={project.lon} />
            </OverviewRow>
          </div>
          <p className="mt-3 text-sm text-balance text-tertiary">
            Contacts, permits and restrictions are recorded when a project is registered; this project&apos;s have not been added to the preview.
          </p>
        </TabPanel>
        <TabPanel id="species" className="p-6">
          <SpeciesResultsView rows={occurrences} onRowClick={(o) => router.push(roleHref(projectRecordPath(project.id, "occurrences", o.id)))} />
        </TabPanel>
      </ContentTabs>
    </ProjectShell>
  );
}

const eventById = new Map(searchEvents.map((e) => [e.id, e]));

/** A record's own page under its project: the Back link, the identity card and facts, then one tab
 *  per section of the record (the same sections Explore shows), the species photo beside the first. */
export function ProjectRecordView({ project, record }: { project: SearchEvent; record: DetailRecord }) {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const sections = useMemo(() => buildSections(record, role), [record, role]);

  const data = record.kind === "event" ? null : record.kind === "occurrence" ? record.occurrence : record.observation;
  const scientificName = data && hasScientificName(data.species) ? data.species : undefined;
  const photo = scientificName ? speciesImage(scientificName) : undefined;
  const parent = data ? eventById.get(data.parentEventId) : record.kind === "event" && record.event.parentId ? eventById.get(record.event.parentId) : undefined;
  const restricted = data ? isRestricted(data) : false;
  const seesAll = hasFeatureAccess("restrictedData", role);

  const eyebrow = record.kind === "event" ? record.event.type : record.kind === "occurrence" ? "Occurrence" : "Observation";
  const idLabel = record.kind === "event" ? "Event ID" : record.kind === "occurrence" ? "Occurrence ID" : "Observation ID";
  const idValue = record.kind === "event" ? record.event.code : data!.id;

  return (
    <ProjectShell project={project} record={record}>
      <RecordBackLink href={roleHref(projectDetailsPath(project.id))}>Back to {project.name}</RecordBackLink>

      <RecordHero eyebrow={eyebrow} title={recordTitle(record)} subtitle={scientificName ? <span className="italic">{scientificName}</span> : undefined}>
        <HeroMeta label={idLabel}>{idValue}</HeroMeta>
        {record.kind === "event" ? (
          <>
            <HeroMeta label="Start date">{record.event.startDate}</HeroMeta>
            <HeroMeta label="End date">{endDateLabel(record.event.endDate)}</HeroMeta>
          </>
        ) : (
          <HeroMeta label="Date">{data!.date}</HeroMeta>
        )}
        {record.kind === "observation" && <HeroMeta label="Observer">{record.observation.observerName}</HeroMeta>}
        {parent && <HeroMeta label="Recorded under">{parent.type === "Project" || parent.name.includes(parent.code) ? parent.name : `${parent.name} (${parent.code})`}</HeroMeta>}
        {restricted && (
          <HeroMeta label="Access">
            <Badge size="sm" color="warning">
              {seesAll ? data!.licenceLevel : "Restricted"}
            </Badge>
          </HeroMeta>
        )}
      </RecordHero>

      {sections.length > 0 && (
        <ContentTabs defaultSelectedKey={String(sections[0].id)} className="flex flex-1 flex-col">
          <div className="px-6 pt-4">
            <TabList aria-label={`${recordTitle(record)} sections`} type="underline" size="md">
              {sections.map((section) => (
                <Tab key={section.id} id={String(section.id)} label={section.title} />
              ))}
            </TabList>
          </div>
          {sections.map((section, index) => (
            <TabPanel key={section.id} id={String(section.id)} className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 rounded-lg border border-secondary p-5">{section.content}</div>
              {index === 0 && photo && data && (
                <div className="w-full shrink-0 overflow-hidden rounded-lg border border-secondary pb-3 sm:max-w-80 lg:w-80">
                  <SpeciesPhotoCarousel scientificName={data.species} alt={data.commonName} />
                </div>
              )}
            </TabPanel>
          ))}
        </ContentTabs>
      )}
    </ProjectShell>
  );
}

/** A project id with no project behind it, in the same three-column shell. */
export function ProjectNotFound() {
  const router = useRouter();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const goToSection = (section: NavNode) => {
    const target = section.key ? section : section.items?.find((item) => item.key);
    if (target?.key) router.push(roleHref(keyHref(target.key)));
  };
  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader section="Projects" current="Project not found" />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection="Projects" onSelectSection={goToSection} />
        <aside aria-label="Records" className="hidden w-[286px] shrink-0 flex-col justify-between border-r border-secondary bg-secondary p-4 lg:flex">
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Records</p>
          <SidebarFooterLinks />
        </aside>
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <FileSearch01 className="size-6 text-fg-quaternary" />
          <h1 className="text-lg font-semibold text-balance text-primary">This project isn&apos;t available</h1>
          <p className="max-w-sm text-sm text-balance text-tertiary">The link may be incomplete, or the project may have been removed.</p>
          <Button color="secondary" size="sm" href={roleHref("/pages/project-list")} iconLeading={ArrowNarrowLeft}>
            Back to projects
          </Button>
        </main>
      </div>
    </div>
  );
}

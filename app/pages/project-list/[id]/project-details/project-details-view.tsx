"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowNarrowLeft, FileSearch01 } from "@untitledui/icons";
import { Tabs as ContentTabs } from "react-aria-components";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { ProjectSwitcher } from "@/app/pages/_shared/project-switcher";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { buildSections, recordTitle, type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { isRestricted } from "@/app/pages/_shared/map-search/record-access";
import { hasScientificName, searchEvents, type SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import { speciesImage } from "@/app/pages/_shared/map-search/species-images";
import { SpeciesPhotoCarousel } from "@/app/pages/_shared/map-search/species-photo-carousel";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { hasFeatureAccess } from "@/config/role-access.config";
import { keyHref, navForRole, type NavNode } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// A project's record pages. The project page itself is the project page template
// (app/pages/project-detail/project-detail-template.tsx), which every project uses.
//
// A record (an occurrence, observation, or event such as a site or visit) has its own page in the
// same shell, `ProjectRecordView`: main is the record, laid out like every record page (CONTRACTS
// 4.6). There is no column 2 here (designer, 30 Sept 2026, CONTRACTS 3.7); the way back to the
// project's records is the Back link above the record. Nothing opens in a slide-in panel (per the
// designer).

/** The data marks an open-ended project with a lone dash (U+2014); show it as "Ongoing". */
function endDateLabel(endDate: string): string {
  return !endDate || endDate === "\u2014" ? "Ongoing" : endDate;
}

/** The shell every project record page shares: header, rail and main. There is no column 2 on the project
 *  screens (designer, 30 Sept 2026, CONTRACTS 3.7); the project's records are on its Survey records tab. */
function ProjectShell({ project, record = null, children }: { project: SearchEvent; record?: DetailRecord | null; children: ReactNode }) {
  const router = useRouter();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);

  const goToSection = (section: NavNode) => {
    const target = section.key ? section : section.items?.find((item) => item.key);
    if (target?.key) router.push(roleHref(keyHref(target.key)));
  };

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
                <ProjectSwitcher currentProjectId={project.id} />
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

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
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

/** A project id with no project behind it, in the same shell as a project page (rail and main). */
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

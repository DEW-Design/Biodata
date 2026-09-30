"use client";

import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings01, Target05 } from "@untitledui/icons";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { Tabs as ContentTabs } from "react-aria-components";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { FloatingMenuFab } from "@/app/pages/_shared/floating-fab";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { ProjectCardActions } from "@/app/pages/_shared/project-card-actions";
import { HeroMeta, RecordHero } from "@/app/pages/_shared/record-hero";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { eventTypeIcon, searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { SpeciesResultsView } from "@/app/pages/_shared/map-search/species-results";
import { buildEventTree, projectOccurrences, type EventTreeNode } from "@/app/pages/_shared/project-scope";
import { IngestionChip } from "@/app/pages/_shared/dataset-upload/ingestion-views";
import { IngestionStrip, IngestionTreeCard } from "@/app/proto/dataset-ingestion/lab-options";
import { useIngestionLab, useRunView, type LabSpeed } from "@/app/proto/dataset-ingestion/ingestion-sim";
import { NEW_EXPANDED_KEYS, NewRecordItems } from "@/app/proto/dataset-ingestion/new-records";
import { navForRole } from "@/lib/registered-user-nav";
import { useUserRole } from "@/lib/use-user-role";

// LAB: where does a dataset's ingestion progress live on the project page?
//
// Ingestion takes time (check the data against the model, map it to the project's structure, build
// the tree), so after "Your files are uploaded" the person needs to know it is happening, that they
// can leave, and where the data lands. Three directions on one axis, how loud and how close to the
// data the progress is:
//   A  a notice under the identity card (one notice saying where the record stands, CONTRACTS 4.6)
//   B  a card at the top of the records tree; the new records appear in the tree as they are built
//   C  one chip beside the card's actions, the stages in a popover
// The run is simulated over 30 seconds (speed 1x/5x/20x, with or without rows that cannot be
// placed) from the "Lab controls" button. Nothing here is saved or sent anywhere.

const PROJECT_ID = "kangaroo-island";
const OPTIONS = [
  { id: "strip", label: "A: Notice under the card" },
  { id: "tree", label: "B: Card in the tree" },
  { id: "chip", label: "C: Chip on the card" },
];
type Option = "strip" | "tree" | "chip";

function eventKeys(node: EventTreeNode): string[] {
  return [`event:${node.event.id}`, ...node.children.flatMap(eventKeys)];
}

function renderExisting(node: EventTreeNode): ReactNode {
  const key = `event:${node.event.id}`;
  return (
    <TreeView.Item key={key} id={key} textValue={node.event.name}>
      <TreeView.ItemContent icon={eventTypeIcon[node.event.type]}>{node.event.name}</TreeView.ItemContent>
      {node.children.map(renderExisting)}
      {node.occurrences.map((o) => (
        <TreeView.Item key={o.id} id={`occurrence:${o.id}`} textValue={o.commonName}>
          <TreeView.ItemContent icon={Target05}>{o.commonName}</TreeView.ItemContent>
        </TreeView.Item>
      ))}
    </TreeView.Item>
  );
}

function Lab() {
  const router = useRouter();
  const search = useSearchParams();
  const role = useUserRole();
  const nav = navForRole(role);
  const option: Option = (["strip", "tree", "chip"] as const).find((o) => o === search.get("option")) ?? "strip";

  // The lab is about someone who can upload, so it opens as a registered user unless told otherwise.
  useEffect(() => {
    if (!search.get("userRole")) router.replace(`/proto/dataset-ingestion?userRole=registered-user&option=${option}`);
  }, [router, search, option]);

  const { run, speed, start, setSpeed, reset } = useIngestionLab();
  const view = useRunView();
  // "Try again" after a failure on our side runs the same scenario again.
  const retry = () => start(run?.outcome ?? "success");
  // One run on first open, so there is something to look at.
  useEffect(() => {
    if (!useIngestionLab.getState().run) start("success");
  }, [start]);

  const project = useMemo(() => searchEvents.find((e) => e.id === PROJECT_ID)!, []);
  const tree = useMemo(() => buildEventTree(PROJECT_ID), []);
  const occurrences = useMemo(() => projectOccurrences(PROJECT_ID), []);
  const existingKeys = useMemo(() => tree.flatMap(eventKeys), [tree]);
  // The new site is only in the tree once its first record is built; remounting the tree at that
  // moment (and never again) lets it open with the new site and visits already expanded.
  const treeStarted = !!view && view.treeProgress > 0;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <AppHeader renderBreadcrumb={(orgLabel) => <Breadcrumb orgLabel={orgLabel} section={<span>Projects</span>} current={project.name} />} />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection="Projects" onSelectSection={() => undefined} />

        <aside aria-label="Records" className="hidden w-[286px] shrink-0 flex-col justify-between gap-4 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
          <div className="flex flex-col gap-1">
            <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Records</p>
            {option === "tree" && view && <IngestionTreeCard view={view} projectId={PROJECT_ID} onRetry={retry} />}
            <TreeView
              key={treeStarted ? "with-new" : "base"}
              aria-label={`${project.name} records`}
              showConnectors
              defaultExpandedKeys={[...existingKeys, ...NEW_EXPANDED_KEYS]}
              className="w-full"
            >
              {tree.map(renderExisting)}
              {view && <NewRecordItems view={view} />}
            </TreeView>
          </div>
          <SidebarFooterLinks />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <RecordHero
            eyebrow="Project"
            title={project.name}
            actions={
              <div className="flex items-center gap-2">
                {option === "chip" && view && <IngestionChip view={view} projectId={PROJECT_ID} onRetry={retry} />}
                <ProjectCardActions projectId={project.id} projectCode={project.code} />
              </div>
            }
          >
            <HeroMeta label="Project ID">{project.code}</HeroMeta>
            <HeroMeta label="Start Date">{project.startDate}</HeroMeta>
            <HeroMeta label="Status">
              <BadgeWithDot size="sm" color={project.statusColor}>
                {project.status}
              </BadgeWithDot>
            </HeroMeta>
            <HeroMeta label="Published by">{project.org}</HeroMeta>
          </RecordHero>

          {option === "strip" && view && (
            <div className="px-6 pt-4">
              <IngestionStrip view={view} projectId={PROJECT_ID} onRetry={retry} />
            </div>
          )}

          <ContentTabs defaultSelectedKey="species" className="flex flex-1 flex-col">
            <div className="px-6 pt-4">
              <TabList aria-label="Project views" type="underline" size="md" className="gap-6">
                <Tab id="species" label="Species" />
                <Tab id="overview" label="Overview" />
              </TabList>
            </div>
            <TabPanel id="species" className="p-6">
              <SpeciesResultsView rows={occurrences} onRowClick={() => undefined} />
            </TabPanel>
            <TabPanel id="overview" className="p-6">
              <p className="m-0 text-sm text-tertiary">{project.description}</p>
            </TabPanel>
          </ContentTabs>
        </main>
      </div>

      <LayoutOptionSwitcher ariaLabel="Ingestion progress options" current={option} options={OPTIONS.map((o) => ({ ...o, href: `/proto/dataset-ingestion?option=${o.id}` }))} />
      <FloatingMenuFab storageKey="ingestion-lab" defaultPosition={{ right: 20, bottom: 208 }} ariaLabel="Lab controls" icon={Settings01}>
        <Dropdown.Menu
          aria-label="Lab controls"
          onAction={(key) => {
            if (key === "start") start("success");
            else if (key === "start-problems") start("partial");
            else if (key === "fail-model" || key === "fail-map" || key === "fail-save") start(key);
            else if (key === "reset") reset();
            else if (String(key).startsWith("speed-")) setSpeed(Number(String(key).slice(6)) as LabSpeed);
          }}
        >
          <Dropdown.Item id="start" label={run ? "Restart ingestion" : "Start ingestion"} />
          <Dropdown.Item id="start-problems" label="Restart, with rows that can't be placed" />
          <Dropdown.Item id="fail-model" label="Restart, fails: file doesn't match the model" />
          <Dropdown.Item id="fail-map" label="Restart, fails: rows don't fit this project" />
          <Dropdown.Item id="fail-save" label="Restart, fails: our side (retry)" />
          <Dropdown.Item id="reset" label="Reset (no ingestion)" />
          {([1, 5, 20] as const).map((s) => (
            <Dropdown.Item key={s} id={`speed-${s}`} label={`Speed ${s}x${speed === s ? " (current)" : ""}`} />
          ))}
        </Dropdown.Menu>
      </FloatingMenuFab>
    </div>
  );
}

export default function DatasetIngestionLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

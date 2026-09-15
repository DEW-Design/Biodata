"use client";

import { useState } from "react";
import { RefreshCcw01 } from "@untitledui/icons";
import { Tab, TabList, TabPanel, Tabs, type Key, type SortDescriptor } from "react-aria-components";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColor } from "@/components/base/badges/badges";
import { Table, TableCard } from "@/components/application/table/table";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { BentoCard } from "@/app/pages/dashboard/option-2/bento-card";
import { PieChart, categoricalPalette, type PieSlice } from "@/app/pages/dashboard/option-2/pie-chart";
import { FloraContent } from "@/app/pages/dashboard/option-2/flora-content";
import { FaunaContent } from "@/app/pages/dashboard/option-2/fauna-content";
import { MapView } from "@/app/pages/dashboard/option-2/map-view";

// option-2's own fork of app/pages/_shared/data-overview.tsx - same Data Dashboard structure and
// real data, built on this shell's own shadow-based BentoCard/PieChart instead of the shared
// border-card versions option-1 still uses. Forked (not edited in place) so option-1's Data
// Dashboard is untouched - this polish pass is scoped to option-2 only.
//
// One addition over the shared version: each TabPanel gets `animate-in fade-in` (tailwindcss-
// animate, already a project dependency - see Tooltip/Popover). React-aria only mounts the
// selected TabPanel, so switching Overview -> Flora -> Fauna remounts the panel and the fade
// re-triggers every time, not just on first load - a soft transition instead of the content
// hard-cutting in, since Flora's panel is significantly taller than Overview's and used to just
// snap to its final height.
//
// Brings over the shared file's two real, honest "make the dashboard more sentient" features
// (per the user directly) instead of building option-2-specific new ones - both already draw on
// data/interactions that exist here already, nothing invented:
//
// - Drill-down: clicking a KPI card's value jumps to that metric's own sub-tab (Flora species ->
//   Flora tab, Fauna species -> Fauna tab, Projects across SA -> Projects tab) - a `selectedKey`
//   change to a tab that's already a sibling in this same Tabs, not new navigation. "Records" has
//   no matching tab (it's the Overview tab's own combined figure), so it stays plain text.
// - Per-card three-dot menu: swaps which of the 4 real metrics sits in which of the 4 card slots.
//   Gated to `biodata-admin` via the shared `metricCardCustomization` feature key
//   (config/role-access.config.ts - shared config, the single source of truth for role gating
//   across every /pages/dashboard/** screen per that file's own doc comment, so reusing it here
//   isn't a shared-file edit, just reading the same data option-1 already reads). `useFeatureAccess`
//   hides the three-dot button entirely for every other role; `metricOrder` still starts from the
//   same `defaultMetricOrder` for everyone since there's no shared backend in this exploratory
//   build to persist an admin's choice across sessions/roles - what's real here is *who can see
//   the control*, not a simulation of cross-role persistence that doesn't exist yet.

const taxonBreakdown: PieSlice[] = [
  { label: "Vascular plants", percent: 45.6, color: categoricalPalette[0] },
  { label: "Birds", percent: 35.0, color: categoricalPalette[1] },
  { label: "Mammals", percent: 9.9, color: categoricalPalette[2] },
  { label: "Fish", percent: 3.9, color: categoricalPalette[3] },
  { label: "Reptiles", percent: 2.9, color: categoricalPalette[4] },
  { label: "Amphibians", percent: 1.2, color: categoricalPalette[5] },
  { label: "Invertebrates", percent: 0.7, color: categoricalPalette[6] },
  { label: "Algae", percent: 0.6, color: categoricalPalette[7] },
  { label: "Other", percent: 0.2, color: categoricalPalette[8] },
];

// Same 4 example projects as app/pages/project-list/option-2 and the shared
// app/pages/_shared/project-list-content.tsx - one real, ground-truthed dataset reused wherever
// this exploratory build needs "a project," not a fresh invented list per screen.
const projects: {
  name: string;
  org: string;
  status: string;
  statusColor: BadgeColor<"pill-color">;
  contributorInitials: string;
  contributorName: string;
  updated: string;
}[] = [
  {
    name: "Adelaide Hills Bushland Survey",
    org: "Adelaide Hills Landcare",
    status: "Active",
    statusColor: "success",
    contributorInitials: "OW",
    contributorName: "Olivia Wyatt",
    updated: "Updated 2 days ago",
  },
  {
    name: "Coorong Wetlands Bird Count",
    org: "Birds SA",
    status: "Under review",
    statusColor: "warning",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "Updated 5 days ago",
  },
  {
    name: "Flinders Ranges Reptile Atlas",
    org: "DEW Biodiversity Team",
    status: "Draft",
    statusColor: "gray",
    contributorInitials: "OW",
    contributorName: "Olivia Wyatt",
    updated: "Updated 1 week ago",
  },
  {
    name: "Kangaroo Island Recovery Monitoring",
    org: "Natural Resources KI",
    status: "Completed",
    statusColor: "blue",
    contributorInitials: "MD",
    contributorName: "Maya Dewitt",
    updated: "Updated 3 weeks ago",
  },
];

// The Data Dashboard's own real table, built on the design-system TableCard (components/
// application/table/table.tsx) instead of another bespoke list - flagged directly by the user
// once that component existed to use, same reasoning as the Home views toggle move to the real
// Tabs component. `allowsSorting` on Project is real (not decorative): React Aria's Table doesn't
// compare data on its own, so this component supplies `sortDescriptor`/`onSortChange` and
// re-sorts `projects` itself, same pattern the Table docs page's Playground demonstrates.
//
// No `TableCard.Header` here, unlike this component's first pass - its `title="Projects"` just
// repeated the "Projects" sub-tab this table already sits under, the only one of the 4 sub-tabs
// (Overview/Flora/Fauna/Projects) that restated its own tab label as a content heading (Flora/
// Fauna dive straight into content, no "Flora"/"Fauna" heading of their own - see those files).
// Flagged directly by the user ("Table component still incorrect"). Count + description move to a
// plain line above the table instead, with a brand-coloured `CountBadge` (true circle, not
// `TableCard.Header`'s own oval gray `Badge`) - same fix already applied to
// app/pages/_shared/project-list-content.tsx's Projects table.
function ProjectsTable() {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "name", direction: "ascending" });

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortDescriptor.column !== "name") return 0;
    const cmp = a.name.localeCompare(b.name);
    return sortDescriptor.direction === "descending" ? -cmp : cmp;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-tertiary">Every submitted project across South Australia</p>
        <CountBadge count={projects.length} color="brand" />
      </div>
      <TableCard.Root>
        <Table aria-label="Projects across South Australia" sortDescriptor={sortDescriptor} onSortChange={setSortDescriptor}>
          <Table.Header>
            <Table.Head id="name" isRowHeader allowsSorting>
              Project
            </Table.Head>
            <Table.Head id="org">Organisation</Table.Head>
            <Table.Head id="status">Status</Table.Head>
            <Table.Head id="contributor">Contributor</Table.Head>
            <Table.Head id="updated">Updated</Table.Head>
          </Table.Header>
          <Table.Body items={sortedProjects}>
            {(project) => (
              <Table.Row id={project.name}>
                <Table.Cell>
                  <span className="font-medium text-primary">{project.name}</span>
                </Table.Cell>
                <Table.Cell>{project.org}</Table.Cell>
                <Table.Cell>
                  <Badge size="sm" color={project.statusColor}>
                    {project.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar size="xs" initials={project.contributorInitials} alt={project.contributorName} />
                    <span className="text-sm text-secondary">{project.contributorName}</span>
                  </div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">{project.updated}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </TableCard.Root>
    </div>
  );
}

type MetricId = "records" | "flora-species" | "fauna-species" | "projects";

interface OverviewMetric {
  id: MetricId;
  value: string;
  label: string;
  /** The sub-tab this metric drills into. Omitted for "Records" - it *is* the Overview tab's own
   * combined figure, so there's nowhere honest for it to drill down to. */
  tabId?: "flora" | "fauna" | "projects";
}

// Same 4 values already on this tab (see the plain MetricCard row this replaces) - just given ids
// so they can be reordered and drilled into, not new numbers.
const overviewMetrics: Record<MetricId, OverviewMetric> = {
  records: { id: "records", value: "6,860,942", label: "Records" },
  "flora-species": { id: "flora-species", value: "9,064", label: "Flora Species", tabId: "flora" },
  "fauna-species": { id: "fauna-species", value: "4,170", label: "Fauna Species", tabId: "fauna" },
  projects: { id: "projects", value: "1,435", label: "Projects across SA", tabId: "projects" },
};
const defaultMetricOrder: MetricId[] = ["records", "flora-species", "fauna-species", "projects"];

function OverviewMetricCard({
  metric,
  canCustomize,
  onSelectMetric,
  onDrillDown,
}: {
  metric: OverviewMetric;
  canCustomize: boolean;
  onSelectMetric: (newId: MetricId) => void;
  onDrillDown: (tabId: "flora" | "fauna" | "projects") => void;
}) {
  return (
    <BentoCard className="relative flex-1 items-center justify-center gap-3 text-center">
      {canCustomize && (
        <div className="absolute top-2 right-2">
          <Dropdown.Root>
            <Dropdown.DotsButton aria-label={`Change "${metric.label}" card`} />
            <Dropdown.Popover placement="bottom right">
              <Dropdown.Menu
                aria-label="Choose a metric for this card"
                selectionMode="single"
                selectedKeys={[metric.id]}
                onSelectionChange={(keys) => {
                  if (keys === "all") return;
                  const [newId] = Array.from(keys) as MetricId[];
                  if (newId) onSelectMetric(newId);
                }}
              >
                {defaultMetricOrder.map((id) => (
                  <Dropdown.Item key={id} id={id} label={overviewMetrics[id].label} />
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        </div>
      )}

      {metric.tabId ? (
        <button
          type="button"
          onClick={() => onDrillDown(metric.tabId!)}
          className="-m-2 flex flex-col items-center gap-3 rounded-md p-2 outline-brand transition-colors duration-100 ease-linear hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <p className="text-4xl font-normal text-primary tabular-nums">{metric.value}</p>
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{metric.label}</p>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-4xl font-normal text-primary tabular-nums">{metric.value}</p>
          <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{metric.label}</p>
        </div>
      )}
    </BentoCard>
  );
}

const dataDashboardTabs = [
  { id: "overview", label: "Overview" },
  { id: "flora", label: "Flora" },
  { id: "fauna", label: "Fauna" },
  { id: "projects", label: "Projects" },
];

export function DataOverviewContent() {
  const canCustomizeMetrics = useFeatureAccess("metricCardCustomization");
  const [activeTab, setActiveTab] = useState<Key>("flora");
  const [metricOrder, setMetricOrder] = useState<MetricId[]>(defaultMetricOrder);

  const swapMetric = (currentId: MetricId, newId: MetricId) => {
    if (currentId === newId) return;
    setMetricOrder((order) => {
      const next = [...order];
      const i = next.indexOf(currentId);
      const j = next.indexOf(newId);
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <>
      <SectionHeader.Root className="px-9 py-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <SectionHeader.Heading>Data Dashboard</SectionHeader.Heading>
          </div>
          <SectionHeader.Actions>
            <div className="flex items-center gap-1.5 text-sm text-tertiary">
              <RefreshCcw01 className="size-3.5 text-quaternary" />
              <span>Last synced 2 hours ago</span>
            </div>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab} className="flex flex-1 flex-col">
        <TabList aria-label="Data dashboard views" className="flex items-stretch gap-6 border-b border-secondary px-9">
          {dataDashboardTabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              className={({ isSelected }) =>
                cx(
                  "relative flex cursor-pointer items-center px-1 py-3 text-sm outline-hidden",
                  isSelected ? "font-medium text-brand-700" : "text-tertiary hover:text-primary",
                )
              }
            >
              {({ isSelected }) => (
                <>
                  {tab.label}
                  {isSelected && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-700" />}
                </>
              )}
            </Tab>
          ))}
        </TabList>

        <TabPanel id="overview" className="flex flex-col gap-4 px-9 py-6 animate-in fade-in duration-200 ease-out">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {metricOrder.map((id) => (
              <OverviewMetricCard
                key={id}
                metric={overviewMetrics[id]}
                canCustomize={canCustomizeMetrics}
                onSelectMetric={(newId) => swapMetric(id, newId)}
                onDrillDown={setActiveTab}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <BentoCard className="w-full lg:flex-1">
              <p className="text-sm font-medium text-primary">Records by taxonomic group</p>
              <PieChart data={taxonBreakdown} ariaLabel="Flora and fauna records by taxonomic group" />
            </BentoCard>

            <BentoCard className="w-full gap-1 lg:flex-1">
              <p className="text-sm font-medium text-primary">Number of flora and fauna records per mapsheet</p>
              <p className="text-xs text-tertiary">South Australia</p>
              <div className="mt-2 flex flex-1 flex-col">
                <MapView />
              </div>
            </BentoCard>
          </div>
        </TabPanel>

        <TabPanel id="flora" className="px-9 py-6 animate-in fade-in duration-200 ease-out">
          <FloraContent />
        </TabPanel>
        <TabPanel id="fauna" className="px-9 py-6 animate-in fade-in duration-200 ease-out">
          <FaunaContent />
        </TabPanel>
        <TabPanel id="projects" className="px-9 py-6 animate-in fade-in duration-200 ease-out">
          <ProjectsTable />
        </TabPanel>
      </Tabs>
    </>
  );
}

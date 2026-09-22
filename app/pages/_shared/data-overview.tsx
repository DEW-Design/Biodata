"use client";

import { useState } from "react";
import type { Key } from "react-aria-components";
import { RefreshCcw01 } from "@untitledui/icons";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { PieChart, categoricalPalette, type PieSlice } from "@/app/pages/_shared/pie-chart";
import { MapView } from "@/app/pages/_shared/map-view";
import { FloraContent } from "@/app/pages/_shared/flora-content";
import { FaunaContent } from "@/app/pages/_shared/fauna-content";

// The Home section's second tab (see app/pages/_shared/home-dashboard.tsx for the first) -
// org-wide accountability numbers, not the signed-in user's own tasks. Restructured from a
// single "Data Overview" screen into "Flora and Fauna Dashboard": 4 sub-tabs (Overview/Flora/
// Fauna/Projects), matching the real SA Flora and Fauna dashboard the user shared as a reference.
// Flora and Fauna are each built off a screenshot of that dashboard's own tab (see
// flora-content.tsx / fauna-content.tsx); Projects doesn't have its sidebar-shell treatment built yet,
// so it still renders the honest "hasn't been scoped yet" placeholder rather than invented numbers.
//
// (The Projects/Datasets split lives one level up, in the icon rail's own "Projects" section
// contextual sidebar - see dashboard's "Projects" Tabs block - not here. First attempt
// at this feedback put the split in this file's own sub-tabs instead; reverted once the user
// clarified the split belonged in the sidebar, matching Home's My BioData/Flora and Fauna
// Dashboard pattern one level higher in the IA, not inside this tab's own content.)
//
// The card shell (BentoCard/MetricCard) and the pie chart live in their own shared files, not
// here, so every tab's data blocks - Overview's today, Flora's now, Fauna's/Projects' whenever
// they're scoped - draw from the same one definition instead of drifting apart per tab. Flagged
// directly by the user: keep the data blocks consistent when flicking between tabs.
//
// Sub-tabs use the real Tabs component's `underline` type (components/application/tabs/tabs.tsx),
// matching option-2's top nav visual language. This used to be hand-rolled directly off
// react-aria-components, from before Tabs was ingested into the design system - replaced once it
// landed, same as any other gap gets resolved the moment the real component exists.
//
// Two "make the dashboard more user-friendly" ideas the user sketched on a screenshot, built here
// since both are real and honest with data we already have - no invented numbers, no fake
// affordances:
//
// - Drill-down: clicking a KPI card's value jumps straight to that metric's own sub-tab (Flora
//   species -> Flora tab, Fauna species -> Fauna tab, Projects across SA -> Projects tab) - the
//   destination already exists as a sibling tab in this same Tabs, so this is a `selectedKey`
//   change, not new navigation. "Records" has no matching tab (it's the combined Overview figure
//   itself), so it stays plain text, not a button to nowhere.
// - Per-card three-dot menu: swaps which of the 4 real metrics sits in which of the 4 card slots,
//   built on the real `Dropdown` component (components/base/dropdown/dropdown.tsx), the same
//   "pick from a list, the view updates" idea as ProjectSwitcher, scaled down to a menu since the
//   option set is 4 fixed items, not a searchable list. Deliberately a *swap*, not a "replace with
//   a new metric" - every number here is one already sourced from the reference dashboard
//   screenshot, and there's no fifth real metric to pull in without inventing one.
//
//   Gated to `biodata-admin` via `metricCardCustomization` (config/role-access.config.ts) -
//   flagged directly by the user: only the admin can actually reconfigure these cards in the real
//   product, and that choice flows through to every other role's view rather than being each
//   user's own preference. `useFeatureAccess` hides the three-dot button entirely for every other
//   role; there's no shared backend in this exploratory build to actually persist an admin's
//   choice and flow it through, so `metricOrder` still starts from the same `defaultMetricOrder`
//   for everyone - what's fixed here is *who can see the control*, not a simulation of
//   cross-user persistence that doesn't exist yet.

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

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-secondary p-6 text-center">
      <p className="text-sm font-medium text-primary">{label}</p>
      <p className="text-sm text-tertiary">This tab hasn&apos;t been scoped yet.</p>
    </div>
  );
}

const dataDashboardTabs = [
  { id: "overview", label: "Overview" },
  { id: "flora", label: "Flora" },
  { id: "fauna", label: "Fauna" },
  { id: "projects", label: "Projects" },
];

type MetricId = "records" | "flora-species" | "fauna-species" | "projects";

interface OverviewMetric {
  id: MetricId;
  value: string;
  label: string;
  /** The sub-tab this metric drills into. Omitted for "Records" - it *is* the Overview tab's own
   * combined figure, so there's nowhere honest for it to drill down to. */
  tabId?: "flora" | "fauna" | "projects";
}

const overviewMetrics: Record<MetricId, OverviewMetric> = {
  records: { id: "records", value: "6,860,942", label: "Records" },
  "flora-species": { id: "flora-species", value: "9,064", label: "Flora species", tabId: "flora" },
  "fauna-species": { id: "fauna-species", value: "4,170", label: "Fauna species", tabId: "fauna" },
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
  const content = (
    <>
      <p className="text-4xl font-normal text-primary tabular-nums">{metric.value}</p>
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{metric.label}</p>
    </>
  );

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
          {content}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">{content}</div>
      )}
    </BentoCard>
  );
}

// `activeTab`/`onActiveTabChange` are optional, controlled-mode overrides - default to the
// existing internal `useState` when omitted, so every current caller (dashboard, project-list,
// project-detail) is unaffected. Added so a consumer can read (or drive) which sub-tab is active
// from outside - e.g. `/proto/public-user-explorations`'s guest banner copy reacting to whichever
// tab a guest is actually browsing, without forking this whole component to lift the state out.
// Same "extend, don't fork" pattern as `Accordion`'s `openKeys`/`onOpenKeysChange`.
export function DataOverviewContent({
  activeTab: controlledActiveTab,
  onActiveTabChange,
}: { activeTab?: Key; onActiveTabChange?: (key: Key) => void } = {}) {
  const canCustomizeMetrics = useFeatureAccess("metricCardCustomization");
  const [internalActiveTab, setInternalActiveTab] = useState<Key>("overview");
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (key: Key) => {
    if (!isControlled) setInternalActiveTab(key);
    onActiveTabChange?.(key);
  };
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
      <SectionHeader.Root className="p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <SectionHeader.Heading>Flora and Fauna Dashboard</SectionHeader.Heading>
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
        {/* pt-4 - the underline Tab's own vertical padding is `pb-2.5 pt-0` (tabs.tsx), so
            without top padding here the labels sit flush against the header's border-b above,
            reading as congested. Flagged directly by the user off a screenshot. */}
        <TabList aria-label="Data dashboard views" type="underline" size="md" className="gap-6 px-6 pt-4">
          {dataDashboardTabs.map((tab) => (
            <Tab key={tab.id} id={tab.id} label={tab.label} />
          ))}
        </TabList>

        <TabPanel id="overview" className="flex flex-col gap-4 p-6">
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
              <h2 className="text-sm font-medium text-primary">Records by taxonomic group</h2>
              <PieChart data={taxonBreakdown} ariaLabel="Flora and fauna records by taxonomic group" />
            </BentoCard>

            <BentoCard className="w-full gap-1 lg:flex-1">
              <h2 className="text-sm font-medium text-primary">Number of flora and fauna records per mapsheet</h2>
              <p className="text-xs text-tertiary">South Australia</p>
              <div className="mt-2 flex flex-1 flex-col">
                <MapView />
              </div>
            </BentoCard>
          </div>
        </TabPanel>

        <TabPanel id="flora" className="p-6">
          <FloraContent />
        </TabPanel>
        <TabPanel id="fauna" className="p-6">
          <FaunaContent />
        </TabPanel>
        <TabPanel id="projects" className="p-6">
          <TabPlaceholder label="Projects" />
        </TabPanel>
      </Tabs>
    </>
  );
}

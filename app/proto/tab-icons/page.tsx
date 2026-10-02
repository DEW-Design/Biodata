"use client";

import { Suspense, useEffect, useRef, useState, type FC, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, ClockRewind, Database01, Feather, FileCheck02, File06, Folder, Grid01, Key01, Link01, Lock01, MarkerPin04, MessageSquare01, Paperclip } from "@untitledui/icons";
import { Tab, TabList } from "@/components/application/tabs/tabs";
import { Tabs } from "react-aria-components";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { recordIcon } from "@/app/pages/_shared/record-icons";

// LAB: icons on tabs. The column 2 tabs and the method tabs already carry icons (CONTRACTS 3.11); the underline tabs
// on record pages, the project page, the dashboards and Explore's results do not. Three treatments on the real label
// sets, with the real counts, in the width each one really has (the last line of each card says what it costs):
//   A  text only (today)
//   B  an icon on every tab
//   C  an icon on the selected tab only
// Icons are the ones the app already uses for the same thing (one icon per concept): the rail's for Projects, the
// records tree's for occurrences and observations, the species group icons for Flora and Fauna, and so on.
const OPTIONS = [
  { id: "text", label: "A: Text only", description: "As today" },
  { id: "all", label: "B: Icon on every tab", description: "The same as column 2" },
  { id: "active", label: "C: Icon on the selected tab", description: "One icon, where you are" },
];
type Option = "text" | "all" | "active";

interface TabItem {
  id: string;
  label: string;
  icon: FC<{ className?: string }>;
  badge?: number;
}
interface TabSetDef {
  id: string;
  title: string;
  where: string;
  width: number;
  size: "sm" | "md";
  tabs: TabItem[];
}

const SETS: TabSetDef[] = [
  {
    id: "dashboard",
    title: "Flora and Fauna dashboard",
    where: "Home, public and registered",
    width: 720,
    size: "md",
    tabs: [
      { id: "overview", label: "Overview", icon: Grid01 },
      { id: "flora", label: "Flora", icon: SPECIES_GROUP_ICON.Plant },
      { id: "fauna", label: "Fauna", icon: SPECIES_GROUP_ICON.Mammal },
      { id: "projects", label: "Projects", icon: Folder },
    ],
  },
  {
    id: "dla",
    title: "DLA record",
    where: "Record pages (DSA and nominations are the same shape)",
    width: 720,
    size: "md",
    tabs: [
      { id: "overview", label: "Overview", icon: Grid01 },
      { id: "locations", label: "Locations & Access", icon: MarkerPin04 },
      { id: "agreement", label: "Agreement", icon: FileCheck02 },
      { id: "audit", label: "Audit Log", icon: ClockRewind },
    ],
  },
  {
    id: "project",
    title: "Project page",
    where: "With counts",
    width: 720,
    size: "md",
    tabs: [
      { id: "project", label: "Project", icon: Folder },
      { id: "records", label: "Survey records", icon: Database01, badge: 8 },
      { id: "species", label: "Species", icon: Feather, badge: 3 },
      { id: "artefacts", label: "Artefacts and attachments", icon: Paperclip, badge: 0 },
    ],
  },
  {
    id: "user",
    title: "User record",
    where: "User Management",
    width: 720,
    size: "md",
    tabs: [
      { id: "roles", label: "Roles and permissions", icon: Key01, badge: 3 },
      { id: "details", label: "Details", icon: File06 },
    ],
  },
  {
    id: "explore",
    title: "Explore results",
    where: "The 400px floating card; it scrolls sideways",
    width: 400,
    size: "sm",
    tabs: [
      { id: "species", label: "Species", icon: Feather, badge: 13 },
      { id: "projects", label: "Projects", icon: Folder, badge: 4 },
      { id: "events", label: "Events", icon: Calendar, badge: 16 },
      { id: "occurrences", label: "Occurrences", icon: recordIcon({ kind: "occurrence", type: "Individual" }), badge: 15 },
      { id: "observations", label: "Observations", icon: recordIcon({ kind: "observation", type: "Individual" }), badge: 15 },
      { id: "artefacts", label: "Artefacts", icon: Paperclip, badge: 6 },
    ],
  },
  {
    id: "project-2",
    title: "Project page, option 2",
    where: "Nine tabs, the most in the app",
    width: 960,
    size: "md",
    tabs: [
      { id: "overview", label: "Overview", icon: Grid01 },
      { id: "locations", label: "Locations", icon: MarkerPin04 },
      { id: "species", label: "Species", icon: Feather },
      { id: "scope", label: "Data Collection Scope", icon: Database01 },
      { id: "permit", label: "Permit", icon: FileCheck02 },
      { id: "uri", label: "URI/DOI", icon: Link01 },
      { id: "privacy", label: "Privacy and Restrictions", icon: Lock01 },
      { id: "artefacts", label: "Artefacts & Attachments", icon: Paperclip },
      { id: "comments", label: "Comments", icon: MessageSquare01 },
    ],
  },
];

function TabSet({ set, option }: { set: TabSetDef; option: Option }) {
  const [selected, setSelected] = useState(set.tabs[0].id);
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ natural: number; overflow: boolean } | null>(null);

  // What the tab list needs, measured from its first tab to its last, against the width it has. The tabs are built a
  // frame after the first render, so the measure waits for one, and again when the selected tab changes its width.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const list = box.current?.querySelector('[role="tablist"]');
      const tabs = list ? [...list.querySelectorAll('[role="tab"]')] : [];
      if (tabs.length === 0) return;
      const natural = Math.round(tabs[tabs.length - 1].getBoundingClientRect().right - tabs[0].getBoundingClientRect().left);
      setFit({ natural, overflow: natural > set.width });
    });
    return () => cancelAnimationFrame(frame);
  }, [option, selected, set.width]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-sm font-semibold text-primary">{set.title}</h2>
        <p className="m-0 text-xs text-tertiary">{set.where}</p>
      </div>
      <div ref={box} style={{ width: set.width }} className="max-w-full overflow-x-auto rounded-lg border border-secondary bg-primary px-4 pt-3">
        <Tabs selectedKey={selected} onSelectionChange={(key) => setSelected(String(key))}>
          <TabList aria-label={set.title} type="underline" size={set.size} className="min-w-max">
            {set.tabs.map((t) => (
              <Tab key={t.id} id={t.id} label={t.label} badge={t.badge} icon={option === "all" || (option === "active" && selected === t.id) ? t.icon : undefined} />
            ))}
          </TabList>
        </Tabs>
      </div>
      <p className="m-0 text-xs text-tertiary tabular-nums">
        {fit ? (fit.overflow ? `Needs ${fit.natural}px of ${set.width}px: ${fit.natural - set.width}px scrolls` : `Needs ${fit.natural}px of ${set.width}px`) : " "}
      </p>
    </section>
  );
}

function Lab() {
  const requested = useSearchParams().get("option");
  const option: Option = (["text", "all", "active"] as const).find((o) => o === requested) ?? "all";
  return (
    <div className="font-barlow min-h-screen bg-secondary p-8">
      <PrototypeTools />
      <div className="mx-auto flex max-w-[1000px] flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-lg font-semibold text-primary">Icons on tabs</h1>
          <p className="m-0 max-w-prose text-sm text-balance text-tertiary">
            The underline tabs, on real label sets and counts, in the width each one really has. Switch the treatment on the Prototype tools bar.
          </p>
        </div>
        {SETS.map((set) => (
          <TabSet key={`${set.id}-${option}`} set={set} option={option} />
        ))}
      </div>
      <LayoutOptionSwitcher ariaLabel="Tab icon options" current={option} options={OPTIONS.map((o) => ({ ...o, href: `/proto/tab-icons?option=${o.id}` }))} />
    </div>
  );
}

export default function TabIconsLab(): ReactNode {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

"use client";

import "./picker.css";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns03, Database01, Folder, Glasses01 } from "@untitledui/icons";
import { Tabs } from "react-aria-components";
import { Tab, TabList, TabPanel } from "@/components/application/tabs/tabs";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { ProjectActions } from "@/app/pages/_shared/project-actions";
import { ProjectListContent } from "@/app/pages/_shared/project-list-content";
import { useUserRole } from "@/lib/use-user-role";
import { navForRole } from "@/lib/registered-user-nav";
import { USER_ROLES, type UserRole } from "@/lib/user-role";
import type { Tool } from "./tools-model";
import { DockVariant, LauncherVariant } from "./variants";
import { StatusBarVariant } from "./status-bar";

// /proto/tools - where the floating preview tools live. Today each one (role switcher, layout
// options, ingestion outcome, lab controls) is its own round button that defaults to a different
// spot and can land on another, so the corner reads as a pile. Three arrangements of the same tools
// as one cluster, over the real Projects list (its pagination sits bottom-right, where the tools do).
// References: the designer's Figma frames (one dark capsule of round buttons) and the Lapse toolbar
// (a quiet bar that shows every value). The tools here are simulated except the role, which is real.

const VARIANTS = [
  { id: "dock", label: "Dock", Component: DockVariant },
  { id: "status-bar", label: "Status bar", Component: StatusBarVariant },
  { id: "launcher", label: "Launcher", Component: LauncherVariant },
] as const;

// Role names as User Management already writes them (um-data.ts). A public user has no account,
// so the name says what you see: the signed-out site.
const ROLE_NAMES: Record<UserRole, { label: string; description?: string }> = {
  "biodata-admin": { label: "BioData Admin" },
  "biodata-user": { label: "BioData User" },
  "privileged-admin": { label: "Privileged Admin" },
  "privileged-user": { label: "Privileged User" },
  "registered-user": { label: "Registered User" },
  "public-user": { label: "Public user", description: "Signed out" },
};

// The screens the bar has to be right on, each with exactly the tools it has (context/decisions/2026-09-29-07-proto-tools-status-bar-refined-for-approval-not.md, Sept 29
// 2026 table). Layout labels are the ones each screen's own switcher uses today.
type Screen = {
  id: string;
  label: string;
  layouts?: { id: string; label: string; description?: string }[];
  dataset?: boolean;
};
const SCREENS: Screen[] = [
  {
    id: "explore",
    label: "Explore",
    layouts: [
      { id: "option-1", label: "Option 1", description: "Search, then a results page" },
      { id: "option-2", label: "Option 2", description: "Floating card, areas as layers" },
    ],
  },
  {
    id: "add-project",
    label: "Add Project",
    layouts: [
      { id: "option-1", label: "Option 1", description: "One question per card" },
      { id: "option-2", label: "Option 2", description: "Sections in column 2" },
    ],
  },
  {
    id: "adelaide",
    label: "Adelaide Hills project, no dataset yet",
    layouts: [
      { id: "option-1", label: "Option 1" },
      { id: "option-2", label: "Option 2" },
    ],
  },
  {
    id: "adelaide-dataset",
    label: "Adelaide Hills project, dataset uploading",
    layouts: [
      { id: "option-1", label: "Option 1" },
      { id: "option-2", label: "Option 2" },
    ],
    dataset: true,
  },
  {
    id: "project-dataset",
    label: "Any other project, dataset uploading",
    dataset: true,
  },
  {
    id: "plain",
    label: "Home, Projects, DLA, DSA, Nominations, User Management",
  },
];

const OUTCOMES = [
  { id: "success", label: "Succeeds", description: "Every row is added" },
  { id: "partial", label: "Some rows can't be placed", short: "Partly added", description: "The rest are added" },
  { id: "fail-model", label: "Fails: the file doesn't match the data model", short: "Fails: wrong format", description: "Nothing is added" },
  { id: "fail-map", label: "Fails: the rows don't fit this project", short: "Fails: rows don't fit", description: "Nothing is added" },
  { id: "fail-save", label: "Fails on our side", short: "Fails: our side", description: "Try again works" },
];

function Lab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = useUserRole();

  const initial = Math.min(
    Math.max((parseInt(searchParams.get("v") ?? "1", 10) || 1) - 1, 0),
    VARIANTS.length - 1,
  );
  const [current, setCurrent] = useState(initial);
  const [screenId, setScreenId] = useState("adelaide-dataset");

  const screen = SCREENS.find((sc) => sc.id === screenId) ?? SCREENS[0];
  const [layout, setLayout] = useState("option-2");
  const [outcome, setOutcome] = useState("success");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setRole = (r: string) => setParam("userRole", r);
  const layouts = screen.layouts;
  const layoutIndex = layouts
    ? Math.max(0, layouts.findIndex((o) => o.id === layout))
    : 0;
  const tools: Tool[] = [
    ...(layouts
      ? [
          {
            id: "layout",
            label: "Layout to show",
            shortLabel: "Layout",
            barLabel: "Layout",
            barValue: `Option ${layoutIndex + 1} of ${layouts.length}`,
            icon: Columns03,
            options: layouts,
            value: layout,
            onChange: setLayout,
          },
        ]
      : []),
    ...(screen.dataset
      ? [
          {
            id: "ingestion",
            label: "How the upload ends",
            shortLabel: "Upload",
            barLabel: "Upload result",
            icon: Database01,
            options: OUTCOMES,
            value: outcome,
            onChange: setOutcome,
            override: outcome === "success" ? undefined : "Forced outcome",
          },
        ]
      : []),
    {
      id: "role",
      label: "View the app as",
      shortLabel: "Role",
      barLabel: "Viewing as",
      icon: Glasses01,
      options: USER_ROLES.map((r) => ({ id: r, ...ROLE_NAMES[r] })),
      value: role,
      onChange: setRole,
    },
  ];

  const select = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setParam("v", String(i + 1));
  };

  // Picker keys: 1-3 and the arrows switch. Ignored while typing, with a modifier, or inside an open
  // menu (arrows move through its items there).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (
        t.closest(
          "[role=menu],[role=dialog],[role=listbox],[role=toolbar],[role=tablist]",
        )
      )
        return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) select(n - 1);
      else if (e.key === "ArrowRight") select((current + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft")
        select((current - 1 + VARIANTS.length) % VARIANTS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const nav = navForRole(role);
  const Variant = VARIANTS[current].Component;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <AppHeader section="Projects" />
      <Tabs
        orientation="vertical"
        defaultSelectedKey="projects"
        className="flex flex-1 overflow-hidden"
      >
        <PrimaryRail
          sections={nav}
          activeSection="Projects"
          onSelectSection={() => {}}
        />
        <aside
          aria-label="Section"
          className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex"
        >
          <div className="flex flex-col gap-1">
            <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">
              Projects
            </p>
            <TabList
              aria-label="Projects views"
              orientation="vertical"
              type="button-brand"
              fullWidth
              className="w-full"
            >
              <Tab id="projects" label="Projects" icon={Folder} />
            </TabList>
            <ProjectActions />
          </div>
          <SidebarFooterLinks />
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">
          <LabContext screenId={screen.id} setScreenId={setScreenId} />
          <TabPanel id="projects" className="flex min-h-0 flex-1 flex-col">
            <ProjectListContent />
          </TabPanel>
        </main>
      </Tabs>

      <Variant key={VARIANTS[current].id} tools={tools} />
      <Picker current={current} onSelect={select} />
    </div>
  );
}

/** Lab-only strip: which screen to pretend this is. The bar shows only that screen's tools. */
function LabContext(props: {
  screenId: string;
  setScreenId: (id: string) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-secondary bg-secondary px-6 py-2 font-sans text-xs text-tertiary">
      <label className="flex items-center gap-2">
        <span className="font-medium text-secondary">Lab: pretend this is</span>
        <select
          value={props.screenId}
          onChange={(e) => props.setScreenId(e.target.value)}
          className="rounded-md bg-primary px-2 py-1 text-xs text-primary ring-1 ring-secondary"
        >
          {SCREENS.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.label}
            </option>
          ))}
        </select>
      </label>
      <span className="text-quaternary">
        The bar shows only the tools that screen has. Role is always there.
      </span>
    </div>
  );
}

function Picker({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (i: number) => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const move = () => {
      const el = itemRefs.current[current];
      const hl = highlightRef.current;
      if (!el || !hl) return;
      hl.style.width = `${el.offsetWidth}px`;
      hl.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [current]);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  // The variants live at the bottom of the screen, so the picker moves to the top (the one allowed
  // change to its spec).
  return (
    <nav
      ref={navRef}
      className="proto-picker"
      data-position="top"
      data-ready={ready ? "" : undefined}
      aria-label="Prototype variants"
    >
      <span
        ref={highlightRef}
        className="proto-picker-highlight"
        aria-hidden="true"
      />
      {VARIANTS.map((v, i) => (
        <button
          key={v.id}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          className="proto-picker-item"
          data-active={i === current ? "" : undefined}
          aria-current={i === current ? "true" : undefined}
          onClick={() => onSelect(i)}
        >
          {v.label}
        </button>
      ))}
    </nav>
  );
}

export default function ToolsLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

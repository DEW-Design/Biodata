"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Exploring how project-detail's
// contextual sidebar (app/pages/project-detail/page.tsx, the <aside aria-label="Section">
// TreeView around line 672-736) should show a project's nested records at scale - the current
// implementation dumps every child (observations, occurrences, transects, quadrats, blocks,
// rambles, traps, custom events) as flat siblings under one Site node, which doesn't scale to the
// thousands of records a real project could have. This is the same cognitive-overload problem
// already being designed against elsewhere (see CONTEXT.md's "Design principles (cognitive load)"
// section). KEPT after promotion (per the user: never delete explorations - they're the evidence
// that all the options were actually considered, not just the one that shipped). See CONTEXT.md's
// entry for where "Grouped by Type + Search" landed in the real page.

import type { FC, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  HomeLine,
  Folder,
  Eye,
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
  SearchMd,
  ChevronRight,
  Calendar,
  MarkerPin01,
  Route,
  Grid01,
  LayoutGrid01,
  Compass,
  Package,
  Bookmark,
} from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { CountBadge } from "@/components/base/badges/badges";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { cx } from "@/utils/cx";

// ── Real example data - a project with real scale, not a tidy demo. Two sites (Kuitpo North/South)
// are fully authored down to Observation/Occurrence level so the tree-based variants have genuine
// depth to navigate; the other 10 sites carry their real record counts as a trailing CountBadge
// instead of invented children, since authoring 2,482 individual nodes by hand would defeat the
// point of the exercise - the counts themselves are the "worst content" here, not a longer tree. ──
type RecordType = "Sites" | "Visits" | "Observations" | "Occurrences" | "Transects" | "Quadrats" | "Blocks" | "Rambles" | "Traps" | "Custom Events";

type IconType = FC<{ className?: string }>;

const recordTypeMeta: Record<RecordType, { icon: IconType; count: number }> = {
  Sites: { icon: Folder, count: 12 },
  Visits: { icon: Calendar, count: 94 },
  Observations: { icon: Eye, count: 1428 },
  Occurrences: { icon: MarkerPin01, count: 612 },
  Transects: { icon: Route, count: 38 },
  Quadrats: { icon: Grid01, count: 205 },
  Blocks: { icon: LayoutGrid01, count: 17 },
  Rambles: { icon: Compass, count: 4 },
  Traps: { icon: Package, count: 63 },
  "Custom Events": { icon: Bookmark, count: 9 },
};

const recordTypes = Object.keys(recordTypeMeta) as RecordType[];

// Built from recordTypeMeta, not hand-typed, so the copy can't drift from the actual set of
// searchable record types. Flagged directly by the user: "Search records…" didn't say what a
// search here actually covers - naming every type is more useful than a generic noun, even though
// the full string runs past the sidebar's visible width once rendered (aria-label below stays short
// and gets announced in full regardless, so screen reader users aren't affected by the truncation).
const searchPlaceholder = `Search ${recordTypes
  .slice(0, -1)
  .map((t) => t.toLowerCase())
  .join(", ")}, or ${recordTypes[recordTypes.length - 1].toLowerCase()}…`;

interface RecordNode {
  id: string;
  type: RecordType;
  label: string;
  children?: RecordNode[];
  // Set only on the 10 sites left uncontented (no authored children) - shown as a trailing
  // CountBadge, never baked into the label. A truncating label with "(382 records)" appended
  // clips exactly the fact being demonstrated once the row is narrower than the full string.
  recordCount?: number;
}

const extraSiteNames = [
  "Mount Bold",
  "Scott Creek",
  "Belair",
  "Cleland",
  "Morialta",
  "Black Hill",
  "Onkaparinga",
  "Aldinga",
  "Sandy Creek",
  "Para Wirra",
];
const extraSiteCounts = [382, 41, 156, 289, 63, 118, 27, 94, 205, 58];

const projectTree: RecordNode[] = [
  {
    id: "site-1",
    type: "Sites",
    label: "Site SU00501 — Kuitpo Forest North Block",
    children: [
      {
        id: "visit-1",
        type: "Visits",
        label: "Visit VU00501 — 12 Feb 2025, AM survey",
        children: [
          { id: "obs-1", type: "Observations", label: "Observation OBS10482 · Nonbiotic — soil moisture & canopy cover" },
          { id: "obs-2", type: "Observations", label: "Observation OBS10483 · Community — understorey vegetation transect" },
          { id: "occ-1", type: "Occurrences", label: "Occurrence OBS10482 · Population — Eucalyptus leucoxylon" },
          { id: "occ-2", type: "Occurrences", label: "Occurrence OBS10483 · Individual — Pomatostomus superciliosus (grey-crowned babbler)" },
        ],
      },
      {
        id: "visit-2",
        type: "Visits",
        label: "Visit VU00502 — 3 Mar 2025, PM survey",
        children: [{ id: "obs-3", type: "Observations", label: "Observation OBS10490 · Community — post-burn regrowth assessment" }],
      },
      { id: "transect-1", type: "Transects", label: "Transect TR00501 — 200m north-south grid line" },
      { id: "quadrat-1", type: "Quadrats", label: "Quadrat QR00501 — 1m² understorey plot" },
    ],
  },
  {
    id: "site-2",
    type: "Sites",
    label: "Site SU00502 — Kuitpo Forest South Block",
    children: [
      {
        id: "visit-3",
        type: "Visits",
        label: "Visit VU00503 — 18 Apr 2025, dawn chorus survey",
        // 150 generated Observations, not hand-authored - the real stress case a "grouped by
        // type" sidebar has to survive: one visit, one dawn survey, still hundreds of records.
        children: [
          { id: "obs-4", type: "Observations", label: "Observation OBS10512 · Nonbiotic — weather and light conditions" },
          { id: "occ-3", type: "Occurrences", label: "Occurrence OBS10512 · Population — Calyptorhynchus banksii (red-tailed black cockatoo)" },
          ...Array.from({ length: 150 }, (_, i) => ({
            id: `visit-3-obs-${i}`,
            type: "Observations" as const,
            label: `Observation OBS${20000 + i} · Community — routine transect bird count`,
          })),
        ],
      },
      { id: "trap-1", type: "Traps", label: "Trap TRP00502 — Elliott trap line, station 4" },
    ],
  },
  ...extraSiteNames.map((name, i) => ({
    id: `site-${i + 3}`,
    type: "Sites" as const,
    label: `Site SU005${String(i + 3).padStart(2, "0")} — ${name} Conservation Park`,
    recordCount: extraSiteCounts[i],
  })),
];

function filterTree(nodes: RecordNode[], query: string): RecordNode[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  const result: RecordNode[] = [];
  for (const n of nodes) {
    const selfMatch = n.label.toLowerCase().includes(q);
    const filteredChildren = n.children ? filterTree(n.children, query) : undefined;
    if (selfMatch || (filteredChildren && filteredChildren.length > 0)) {
      result.push({ ...n, children: selfMatch ? n.children : filteredChildren });
    }
  }
  return result;
}

// Mirrors renderGroupedNode's own bucketing decision so the synthetic type-bucket ids it introduces
// (`${node.id}__${type}`) are included too - otherwise a search match sitting inside a bucket would
// resolve correctly but stay visually collapsed.
function collectGroupedContainerIds(nodes: RecordNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (!n.children || n.children.length === 0) continue;
    acc.push(n.id);
    const grouped = groupByType(n.children);
    const distinctTypes = Array.from(grouped.keys());
    if (distinctTypes.length <= 1) {
      collectGroupedContainerIds(n.children, acc);
    } else {
      for (const type of distinctTypes) {
        const bucketItems = grouped.get(type)!;
        acc.push(`${n.id}__${type}`);
        collectGroupedContainerIds(bucketItems, acc);
      }
    }
  }
  return acc;
}

// A site genuinely contains visits, observations, occurrences, transects, etc. side by side (per
// the real record model - see the Figma wireframe's per-type Details Containers) - flattening that
// into type-only buckets loses which site/visit a record actually belongs to. This groups by type
// only where a node's own children are a *mix* of types (so a lone type isn't wrapped in a
// pointless single-item bucket), recursing into each bucket's contents so nesting keeps working at
// every depth, not just the first level. Each bucket still caps its visible rows at TRUNCATE_AT and
// says how many more exist instead of rendering all of them - grouping by type reduces how many
// buckets you see, it doesn't make a 150-record bucket safe to render in full.
const TRUNCATE_AT = 8;

function groupByType(children: RecordNode[]): Map<RecordType, RecordNode[]> {
  const map = new Map<RecordType, RecordNode[]>();
  for (const c of children) {
    const list = map.get(c.type) ?? [];
    list.push(c);
    map.set(c.type, list);
  }
  return map;
}

function renderGroupedNodes(nodes: RecordNode[]): ReactNode {
  return nodes.map((n) => renderGroupedNode(n));
}

function renderGroupedNode(n: RecordNode): ReactNode {
  const Icon = recordTypeMeta[n.type].icon;
  const hasChildren = !!n.children && n.children.length > 0;

  if (!hasChildren) {
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
        <TreeView.ItemContent icon={Icon} action={n.recordCount != null ? <CountBadge count={n.recordCount} /> : undefined}>
          {n.label}
        </TreeView.ItemContent>
      </TreeView.Item>
    );
  }

  const grouped = groupByType(n.children!);
  const distinctTypes = Array.from(grouped.keys());

  if (distinctTypes.length <= 1) {
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
        <TreeView.ItemContent icon={Icon}>{n.label}</TreeView.ItemContent>
        {renderGroupedNodes(n.children!)}
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
      <TreeView.ItemContent icon={Icon}>{n.label}</TreeView.ItemContent>
      {distinctTypes.map((type) => {
        const items = grouped.get(type)!;
        const TypeIcon = recordTypeMeta[type].icon;
        const bucketId = `${n.id}__${type}`;
        const shown = items.slice(0, TRUNCATE_AT);
        const remaining = items.length - shown.length;
        return (
          <TreeView.Item key={bucketId} id={bucketId} textValue={`${type} (${items.length})`}>
            <TreeView.ItemContent icon={TypeIcon} action={<CountBadge count={items.length} />}>
              {type}
            </TreeView.ItemContent>
            {renderGroupedNodes(shown)}
            {remaining > 0 && (
              <TreeView.Item key={`${bucketId}__more`} id={`${bucketId}__more`} textValue={`${remaining} more`} isDisabled>
                <TreeView.ItemContent>{`+${remaining.toLocaleString()} more — search to narrow`}</TreeView.ItemContent>
              </TreeView.Item>
            )}
          </TreeView.Item>
        );
      })}
    </TreeView.Item>
  );
}

// ── Shared chrome - faithful static reproductions of the real page's icon rail and main-content
// area. The sidebar is what's under test here, not these two, so they stay static context (same
// convention as /proto/project-header's IconRail/TabsRowStub). ──
const sectionIcons = [HomeLine, Folder, Eye, FileLock01, Feather, BarChart01, FileSearch01];

function IconRailStub() {
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
      {sectionIcons.map((Icon, i) => (
        <div key={i} className={cx("flex size-12 items-center justify-center rounded-lg", i === 1 ? "bg-brand-solid text-white" : "text-quaternary")}>
          <Icon className="size-5" />
        </div>
      ))}
    </nav>
  );
}

function MainPlaceholder() {
  const tabs = ["Overview", "Datasets", "Details", "Restrictions", "Additional Information"];
  return (
    <main className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-1 p-6 pb-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">Adelaide Hills Bushland Survey</h1>
      </div>
      <div className="flex gap-6 border-b border-secondary px-6">
        {tabs.map((tab, i) => (
          <span key={tab} className={cx("pb-2.5 text-md font-semibold", i === 0 ? "border-b-2 border-brand-600 text-brand-secondary" : "text-quaternary")}>
            {tab}
          </span>
        ))}
      </div>
      <div className="flex min-h-[160px] flex-1 items-center justify-center p-6 text-center">
        <p className="max-w-xs text-sm text-tertiary">Overview tab content (unchanged, not the focus of this exploration) - see /proto/project-header instead.</p>
      </div>
    </main>
  );
}

// ── Variant 1: Baseline - the real, current implementation, unchanged. One site, every child
// (observations, occurrences, visit, transect, quadrat, block, ramble, trap, custom event) dumped
// as flat siblings, fully expanded by default. ──
function VariantBaseline() {
  return (
    <>
      <IconRailStub />
      <aside aria-label="Section" className="flex w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4">
        <div className="flex flex-col gap-1">
          <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Adelaide Hills Bushland Survey</p>
          <TreeView aria-label="Adelaide Hills Bushland Survey records" showConnectors defaultExpandedKeys={["site", "visit"]} className="w-full">
            <TreeView.Item id="site" textValue="Site SU00501">
              <TreeView.ItemContent icon={Folder}>Site SU00501</TreeView.ItemContent>
              <TreeView.Item id="obs-nonbiotic" textValue="Observation OBS094 · Nonbiotic">
                <TreeView.ItemContent icon={Eye}>Observation OBS094 · Nonbiotic</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="obs-community" textValue="Observation OBS094 · Community">
                <TreeView.ItemContent icon={Eye}>Observation OBS094 · Community</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="obs-094" textValue="Observation OBS094">
                <TreeView.ItemContent icon={Eye}>Observation OBS094</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="occ-individual" textValue="Occurrence OBS094 · Individual">
                <TreeView.ItemContent icon={MarkerPin01}>Occurrence OBS094 · Individual</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="occ-population" textValue="Occurrence OBS094 · Population">
                <TreeView.ItemContent icon={MarkerPin01}>Occurrence OBS094 · Population</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="visit" textValue="Visit VU00501">
                <TreeView.ItemContent icon={Folder}>Visit VU00501</TreeView.ItemContent>
                <TreeView.Item id="visit-obs" textValue="Observation OBS095">
                  <TreeView.ItemContent icon={Eye}>Observation OBS095</TreeView.ItemContent>
                </TreeView.Item>
              </TreeView.Item>
              <TreeView.Item id="transect" textValue="Transect TR00501">
                <TreeView.ItemContent icon={Route}>Transect TR00501</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="quadrat" textValue="Quadrat QR00501">
                <TreeView.ItemContent icon={Grid01}>Quadrat QR00501</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="block" textValue="Block BK00501">
                <TreeView.ItemContent icon={LayoutGrid01}>Block BK00501</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="ramble" textValue="Ramble RMB00501">
                <TreeView.ItemContent icon={Compass}>Ramble RMB00501</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="trap" textValue="Trap TRP00501">
                <TreeView.ItemContent icon={Package}>Trap TRP00501</TreeView.ItemContent>
              </TreeView.Item>
              <TreeView.Item id="custom-event" textValue="Custom Event">
                <TreeView.ItemContent icon={Bookmark}>Custom Event</TreeView.ItemContent>
              </TreeView.Item>
            </TreeView.Item>
          </TreeView>
        </div>
      </aside>
      <MainPlaceholder />
    </>
  );
}

// ── Variant 2: Grouped by Type, Nested - axis: grouping model, corrected to preserve containment.
// A site genuinely contains visits, observations, occurrences, and transects side by side (checked
// against the Figma wireframe's per-record-type Details Containers, YMproGZfrFB5jUqPHPxMhk#1970-
// 162922) - the first pass of this variant flattened everything by type and lost which site/visit a
// record actually came from. This keeps the real Site > Visit > record hierarchy intact, but groups
// a node's own children by type only where they're genuinely a mix (Visits/Transects/Quadrats all
// sitting under one Site) instead of dumping them as flat siblings - the exact bug this whole
// exploration started from (see renderGroupedNode above). Flagged directly by the user: "a site can
// have events, observations, or occurrences inside them" - grouping had to happen inside the
// hierarchy, not instead of it. Each bucket still caps its visible rows and admits how many more
// exist rather than rendering all of them - one dawn-survey visit alone can carry 150+ observations
// (see the generated stress-test data on Visit VU00503 above), so grouping by type reduces how many
// buckets appear, it doesn't make a single bucket safe to render in full. ──
function VariantGroupedByType() {
  return (
    <>
      <IconRailStub />
      <aside aria-label="Section" className="flex w-[286px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Adelaide Hills Bushland Survey</p>
        <TreeView aria-label="Adelaide Hills Bushland Survey records, grouped by type" showConnectors defaultExpandedKeys={["site-1"]} className="w-full">
          {renderGroupedNodes(projectTree)}
        </TreeView>
      </aside>
      <MainPlaceholder />
    </>
  );
}

// ── Variant 3: Grouped by Type + Search - axis: discovery model, merging variant 2's type-bucketed
// nesting with a search-first filter box (the combination the user asked for directly). The tree
// stays grouped by type at every level exactly as in "Grouped by Type, Nested" - Site > Visit >
// type buckets > records, each capped with "+N more" - but now a search box filters across the
// whole hierarchy first, and only the buckets/branches actually containing a match expand. Search
// narrows the tree; grouping keeps what's left legible once it does. This is the direction promoted
// into the real page (see CONTEXT.md). ──
function VariantGroupedSearch() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterTree(projectTree, query), [query]);
  const expandedKeys = useMemo(() => (query ? collectGroupedContainerIds(filtered) : ["site-1"]), [query, filtered]);

  return (
    <>
      <IconRailStub />
      <aside aria-label="Section" className="flex w-[286px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-secondary bg-secondary p-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Adelaide Hills Bushland Survey</p>
        <Input size="sm" placeholder={searchPlaceholder} icon={SearchMd} value={query} onChange={setQuery} aria-label="Search records" />
        {query && filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
            <FileSearch01 className="size-5 text-fg-quaternary" />
            <p className="text-xs text-tertiary">No records match &ldquo;{query}&rdquo;. Try a different name, ID, or record type.</p>
          </div>
        ) : (
          <TreeView
            aria-label="Adelaide Hills Bushland Survey records, grouped by type"
            key={query}
            showConnectors
            defaultExpandedKeys={expandedKeys}
            className="w-full"
          >
            {renderGroupedNodes(filtered)}
          </TreeView>
        )}
      </aside>
      <MainPlaceholder />
    </>
  );
}

// ── Variant 4: Breadcrumb Drill-Down - axis: navigation model. No nested indentation at all - one
// level is visible at a time, a breadcrumb tracks the path in, and clicking a folder row replaces
// the list rather than expanding beneath it. The visible list is never deeper than however many
// items sit at one level, no matter how many thousand records the project holds overall. ──
function VariantBreadcrumbDrillDown() {
  const [path, setPath] = useState<RecordNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const currentLevel = path.length ? (path[path.length - 1].children ?? []) : projectTree;

  return (
    <>
      <IconRailStub />
      <aside aria-label="Section" className="flex w-[286px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-secondary bg-secondary p-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setPath([])}
            className={cx(
              "truncate rounded-sm font-semibold tracking-wide uppercase outline-focus-ring focus-visible:outline-2",
              path.length === 0 ? "text-primary" : "text-quaternary hover:text-primary",
            )}
          >
            Adelaide Hills Bushland Survey
          </button>
          {path.map((node, i) => (
            <span key={node.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3 shrink-0 text-quaternary" />
              <button
                type="button"
                onClick={() => setPath(path.slice(0, i + 1))}
                className={cx(
                  "truncate rounded-sm font-semibold outline-focus-ring focus-visible:outline-2",
                  i === path.length - 1 ? "text-primary" : "text-quaternary hover:text-primary",
                )}
              >
                {node.label}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex flex-col gap-0.5">
          {currentLevel.length === 0 ? (
            <p className="px-2 py-3 text-xs text-tertiary">No child records at this level.</p>
          ) : (
            currentLevel.map((node) => {
              const hasChildren = !!node.children && node.children.length > 0;
              const Icon = hasChildren ? Folder : recordTypeMeta[node.type].icon;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => (hasChildren ? setPath([...path, node]) : setSelectedId(node.id))}
                  className={cx(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-focus-ring hover:bg-primary_hover focus-visible:outline-2",
                    selectedId === node.id && "bg-secondary",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-fg-quaternary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-tertiary">{node.label}</span>
                  {node.recordCount != null && <CountBadge count={node.recordCount} />}
                  {hasChildren && <ChevronRight className="size-4 shrink-0 text-fg-quaternary" />}
                </button>
              );
            })
          )}
        </div>
      </aside>
      <MainPlaceholder />
    </>
  );
}

// ── Variant 5: Flat Virtualized List + Type Filter Chips - axis: structure model. Drops the
// folder/tree metaphor entirely - every record (2,482 of them, generated from the real counts
// above) lives in one flat, filterable, chip-scoped list. A small hand-rolled windowed renderer
// (~30 DOM rows regardless of list length) is the actual scale answer here, not a UI trick that
// only looks like it scales. ──
const ALL_RECORDS: { id: string; type: RecordType; label: string }[] = recordTypes.flatMap((type) =>
  Array.from({ length: recordTypeMeta[type].count }, (_, i) => ({
    id: `${type}-${i}`,
    type,
    label: `${type.replace(/s$/, "")} ${String(i + 1).padStart(4, "0")}`,
  })),
);

const ROW_HEIGHT = 32;
const OVERSCAN = 6;
const VISIBLE_COUNT = 20;

function VariantFlatVirtualized() {
  const [activeType, setActiveType] = useState<"All" | RecordType>("All");
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_RECORDS.filter((r) => (activeType === "All" || r.type === activeType) && (!q || r.label.toLowerCase().includes(q)));
  }, [activeType, query]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filtered.length, startIndex + VISIBLE_COUNT + OVERSCAN * 2);
  const visible = filtered.slice(startIndex, endIndex);

  return (
    <>
      <IconRailStub />
      <aside aria-label="Section" className="flex w-[286px] shrink-0 flex-col gap-3 overflow-hidden border-r border-secondary bg-secondary p-4">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Adelaide Hills Bushland Survey</p>
        <Input size="sm" placeholder="Search records…" icon={SearchMd} value={query} onChange={setQuery} aria-label="Search records" />
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...recordTypes] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              className={cx(
                "rounded-full px-2.5 py-1 text-xs font-medium outline-focus-ring transition-colors duration-150 focus-visible:outline-2",
                activeType === t ? "bg-brand-solid text-white" : "bg-primary text-tertiary hover:bg-primary_hover",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-quaternary" aria-live="polite">
          {filtered.length.toLocaleString()} record{filtered.length === 1 ? "" : "s"}
        </p>
        <div onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} className="min-h-0 flex-1 overflow-y-auto">
          <div style={{ height: filtered.length * ROW_HEIGHT, position: "relative" }}>
            {visible.map((r, i) => {
              const Icon = recordTypeMeta[r.type].icon;
              return (
                <div
                  key={r.id}
                  style={{ position: "absolute", top: (startIndex + i) * ROW_HEIGHT, height: ROW_HEIGHT }}
                  className="flex w-full items-center gap-2 px-1 text-sm text-tertiary"
                >
                  <Icon className="size-4 shrink-0 text-fg-quaternary" />
                  <span className="min-w-0 flex-1 truncate">{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
      <MainPlaceholder />
    </>
  );
}

const variants = [
  { name: "Baseline", render: VariantBaseline },
  { name: "Grouped by Type", render: VariantGroupedByType },
  { name: "Grouped by Type + Search", render: VariantGroupedSearch },
  { name: "Breadcrumb Drill-Down", render: VariantBreadcrumbDrillDown },
  { name: "Flat Virtualized", render: VariantFlatVirtualized },
];

// ── Picker chrome - copied verbatim from the prototype skill's PICKER.md, React-ified (same code
// as /proto/project-header's Picker) ──
function Picker({ current, setCurrent }: { current: number; setCurrent: (i: number) => void }) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlightStyle, setHighlightStyle] = useState({ width: 0, x: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = itemRefs.current[current];
    if (el) setHighlightStyle({ width: el.offsetWidth, x: el.offsetLeft });
  }, [current]);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(raf1);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) setCurrent(num - 1);
      else if (e.key === "ArrowRight") setCurrent((current + 1) % variants.length);
      else if (e.key === "ArrowLeft") setCurrent((current - 1 + variants.length) % variants.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <nav
      aria-label="Prototype variants"
      data-ready={ready ? "" : undefined}
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 4,
        borderRadius: 999,
        background: "rgba(10, 10, 10, 0.82)",
        backdropFilter: "blur(12px) saturate(1.4)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 8px 24px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.12)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 4,
          left: 0,
          height: 28,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          width: highlightStyle.width,
          transform: `translateX(${highlightStyle.x}px)`,
          transition: ready ? "transform 250ms cubic-bezier(0.23,1,0.32,1), width 250ms cubic-bezier(0.23,1,0.32,1)" : "none",
        }}
      />
      {variants.map((v, i) => (
        <button
          key={v.name}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          data-active={i === current ? "" : undefined}
          aria-current={i === current ? "true" : undefined}
          onClick={() => setCurrent(i)}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: 28,
            padding: "0 12px",
            border: 0,
            borderRadius: 999,
            background: "transparent",
            color: i === current ? "#fff" : "rgba(255,255,255,0.55)",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          {v.name}
        </button>
      ))}
    </nav>
  );
}

export default function ProjectSidebarProto() {
  // Always 0 on first render (server and client match, no hydration mismatch) - corrected from
  // the URL right after mount, a browser-only source of truth SSR can't see.
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
    // One-time correction from a browser-only source (the URL) SSR can't read - not the
    // cascading-render case this rule normally guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v >= 1 && v <= variants.length) setCurrent(v - 1);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(current + 1));
    window.history.replaceState(null, "", url);
  }, [current]);

  const Variant = variants[current].render;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      <div className="flex flex-1 overflow-hidden">
        <Variant />
      </div>
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}

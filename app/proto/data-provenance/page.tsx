"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Kept per the "never delete prototypes" rule as
// evidence of the exploration, but its own premise (Dataset as a tree axis worth comparing against
// Site) is SUPERSEDED as of 2026-09-14 - see the project_projects_data_model memory. The user
// corrected the model directly: "we're not worried too much about the dataset (which is just
// treated as a template to ingest data)" - Dataset isn't a tree level at all anymore in production
// (project-detail/option-1, observation-detail/option-1), so "Variant 1: By Dataset" here is no
// longer a live comparison, just a record of what was tried. Provenance tags (Variant 2's per-record
// dataset badge) were separately removed per the user directly, before this model correction landed.
// The two trees below are left running the OLD Dataset/Sub-site shape for historical accuracy of
// what was actually explored, but their leaf TYPES are updated to the corrected valid list
// (Block/Trap/Custom Event removed - see leafTypeMeta) so this lab doesn't reference types that no
// longer exist anywhere else in the build.
//
// Original brief, for context: two directions on the project-sidebar tree's primary axis - "By
// Dataset" (the tree as it stood then) vs "By Site (consolidated)" (re-rooted at Site, one branch
// per dataset merged, provenance tag per record - since removed). Both variants render the real
// TreeView (components/application/tree-view/tree-view.tsx) with no `selectionMode` (no checkboxes)
// and the tree's own `onAction` for "click to view" instead.

import type { FC, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import {
  SearchMd,
  FileSearch01,
  Database01,
  Map01,
  MarkerPin02,
  Calendar,
  Eye,
  MarkerPin01,
  Route,
  Grid01,
  Compass,
  Folder,
} from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { cx } from "@/utils/cx";

// ── Shared record-type language - identical icon-per-type mapping to the real page's own
// recordTypeMeta, so this reads as the same design system, not a new one. ──
type LeafType = "Visits" | "Observations" | "Occurrences" | "Transects" | "Quadrats" | "Rambles";

const leafTypeMeta: Record<LeafType, { icon: FC<{ className?: string }> }> = {
  Visits: { icon: Calendar },
  Observations: { icon: Eye },
  Occurrences: { icon: MarkerPin01 },
  Transects: { icon: Route },
  Quadrats: { icon: Grid01 },
  Rambles: { icon: Compass },
};

const TRUNCATE_AT = 8;

// ── The two real datasets already established elsewhere in this build (project-detail/option-1's
// own projectDatasets) - same names, same totals, not invented for this lab. ──
interface DatasetMeta {
  id: string;
  label: string;
  badgeColor: "brand" | "blue";
}

const datasets: DatasetMeta[] = [
  { id: "fleurieu", label: "Fleurieu Transect Survey — Autumn 2025", badgeColor: "brand" },
  { id: "cleland", label: "Cleland Incidental Observations", badgeColor: "blue" },
];

const datasetById = new Map(datasets.map((d) => [d.id, d]));

function ProvenanceTag({ datasetId }: { datasetId: string }) {
  const dataset = datasetById.get(datasetId)!;
  return (
    <Badge size="sm" color={dataset.badgeColor}>
      {dataset.label.split(" ")[0]}
    </Badge>
  );
}

// ── Variant 1 data: Dataset > Site > Sub-site > grouped leaf records - identical shape to
// project-detail/option-1's real projectRecordTree. ──
type DatasetTreeType = "Datasets" | "Sites" | "Sub-sites" | LeafType;

const datasetTreeMeta: Record<DatasetTreeType, { icon: FC<{ className?: string }> }> = {
  Datasets: { icon: Database01 },
  Sites: { icon: Map01 },
  "Sub-sites": { icon: MarkerPin02 },
  ...leafTypeMeta,
};

interface DatasetTreeNode {
  id: string;
  type: DatasetTreeType;
  label: string;
  children?: DatasetTreeNode[];
}

const datasetRootedTree: DatasetTreeNode[] = [
  {
    id: "dataset-fleurieu",
    type: "Datasets",
    label: "Fleurieu Transect Survey — Autumn 2025",
    children: [
      {
        id: "site",
        type: "Sites",
        label: "Site SU00501",
        children: [
          {
            id: "subsite-a",
            type: "Sub-sites",
            label: "Sub-site SU00501-A",
            children: [
              { id: "obs-nonbiotic", type: "Observations", label: "Observation OBS094 · Nonbiotic" },
              { id: "obs-community", type: "Observations", label: "Observation OBS094 · Community" },
              { id: "obs-094", type: "Observations", label: "Observation OBS094 · Individual" },
              { id: "occ-individual", type: "Occurrences", label: "Occurrence OBS094 · Individual" },
              { id: "occ-population", type: "Occurrences", label: "Occurrence OBS094 · Population" },
              {
                id: "visit",
                type: "Visits",
                label: "Visit VU00501",
                children: [{ id: "visit-obs", type: "Observations", label: "Observation OBS095" }],
              },
              { id: "transect", type: "Transects", label: "Transect TR00501" },
              { id: "quadrat", type: "Quadrats", label: "Quadrat QR00501" },
            ],
          },
          {
            id: "subsite-b",
            type: "Sub-sites",
            label: "Sub-site SU00501-B",
            children: [
              { id: "ramble", type: "Rambles", label: "Ramble RMB00501" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "dataset-cleland",
    type: "Datasets",
    label: "Cleland Incidental Observations",
    children: [
      {
        id: "site-777",
        type: "Sites",
        label: "Site SU00777",
        children: [
          {
            id: "subsite-777-a",
            type: "Sub-sites",
            label: "Sub-site SU00777-A",
            children: [
              { id: "inc-obs", type: "Observations", label: "Observation INC-0231 · Individual" },
            ],
          },
        ],
      },
    ],
  },
];

function groupByType<T extends { type: string }>(children: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const c of children) {
    const list = map.get(c.type) ?? [];
    list.push(c);
    map.set(c.type, list);
  }
  return map;
}

function renderDatasetNode(n: DatasetTreeNode, currentKey: string | null): ReactNode {
  const Icon = datasetTreeMeta[n.type].icon;
  const highlighted = n.id === currentKey ? "bg-brand-50 text-brand-secondary" : undefined;
  const hasChildren = !!n.children && n.children.length > 0;

  if (!hasChildren) {
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
        <TreeView.ItemContent icon={Icon} className={highlighted}>
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
        <TreeView.ItemContent icon={Icon} className={highlighted}>
          {n.label}
        </TreeView.ItemContent>
        {n.children!.map((child) => renderDatasetNode(child, currentKey))}
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
      <TreeView.ItemContent icon={Icon} className={highlighted}>
        {n.label}
      </TreeView.ItemContent>
      {distinctTypes.map((type) => {
        const items = grouped.get(type)!;
        const TypeIcon = datasetTreeMeta[type as DatasetTreeType].icon;
        const bucketId = `${n.id}__${type}`;
        const shown = items.slice(0, TRUNCATE_AT);
        const remaining = items.length - shown.length;
        return (
          <TreeView.Item key={bucketId} id={bucketId} textValue={`${type} (${items.length})`}>
            <TreeView.ItemContent
              icon={TypeIcon}
              action={<CountBadge count={items.length} />}
              className={bucketId === currentKey ? "bg-brand-50 text-brand-secondary" : undefined}
            >
              {type}
            </TreeView.ItemContent>
            {shown.map((child) => renderDatasetNode(child, currentKey))}
            {remaining > 0 && (
              <TreeView.Item key={`${bucketId}__more`} id={`${bucketId}__more`} textValue={`${remaining} more`} isDisabled>
                <TreeView.ItemContent>{`+${remaining} more — search to narrow`}</TreeView.ItemContent>
              </TreeView.Item>
            )}
          </TreeView.Item>
        );
      })}
    </TreeView.Item>
  );
}

// ── Variant 2 data: Site > Sub-site > grouped leaf records, consolidated ACROSS datasets. Same
// physical sites/sub-sites/records as Variant 1's tree - this isn't new content, it's the same
// underlying data re-rooted by a different axis, with a `datasetId` added to every leaf so its
// provenance can be shown. Site SU00501 mixes in one Cleland-sourced Occurrence
// ("occ-incidental") - the one deliberately invented illustrative cross-dataset record, called out
// in its own label so it doesn't read as an accident. ──
type SiteTreeType = "Sites" | "Sub-sites" | LeafType;

const siteTreeMeta: Record<SiteTreeType, { icon: FC<{ className?: string }> }> = {
  Sites: { icon: Map01 },
  "Sub-sites": { icon: MarkerPin02 },
  ...leafTypeMeta,
};

interface SiteTreeNode {
  id: string;
  type: SiteTreeType;
  label: string;
  datasetId?: string;
  children?: SiteTreeNode[];
}

const siteRootedTree: SiteTreeNode[] = [
  {
    id: "site",
    type: "Sites",
    label: "Site SU00501",
    children: [
      {
        id: "subsite-a",
        type: "Sub-sites",
        label: "Sub-site SU00501-A",
        children: [
          { id: "obs-nonbiotic", type: "Observations", label: "Observation OBS094 · Nonbiotic", datasetId: "fleurieu" },
          { id: "obs-community", type: "Observations", label: "Observation OBS094 · Community", datasetId: "fleurieu" },
          { id: "obs-094", type: "Observations", label: "Observation OBS094 · Individual", datasetId: "fleurieu" },
          { id: "occ-individual", type: "Occurrences", label: "Occurrence OBS094 · Individual", datasetId: "fleurieu" },
          { id: "occ-population", type: "Occurrences", label: "Occurrence OBS094 · Population", datasetId: "fleurieu" },
          {
            id: "occ-incidental",
            type: "Occurrences",
            label: "Occurrence INC-0231 (incidental sighting)",
            datasetId: "cleland",
          },
          {
            id: "visit",
            type: "Visits",
            label: "Visit VU00501",
            datasetId: "fleurieu",
            children: [{ id: "visit-obs", type: "Observations", label: "Observation OBS095", datasetId: "fleurieu" }],
          },
          { id: "transect", type: "Transects", label: "Transect TR00501", datasetId: "fleurieu" },
          { id: "quadrat", type: "Quadrats", label: "Quadrat QR00501", datasetId: "fleurieu" },
        ],
      },
      {
        id: "subsite-b",
        type: "Sub-sites",
        label: "Sub-site SU00501-B",
        children: [
          { id: "ramble", type: "Rambles", label: "Ramble RMB00501", datasetId: "fleurieu" },
        ],
      },
    ],
  },
  {
    id: "site-777",
    type: "Sites",
    label: "Site SU00777",
    children: [
      {
        id: "subsite-777-a",
        type: "Sub-sites",
        label: "Sub-site SU00777-A",
        children: [
          { id: "inc-obs", type: "Observations", label: "Observation INC-0231 · Individual", datasetId: "cleland" },
        ],
      },
    ],
  },
];

function renderSiteNode(n: SiteTreeNode, currentKey: string | null): ReactNode {
  const Icon = siteTreeMeta[n.type].icon;
  const highlighted = n.id === currentKey ? "bg-brand-50 text-brand-secondary" : undefined;
  const hasChildren = !!n.children && n.children.length > 0;
  const action = n.datasetId ? <ProvenanceTag datasetId={n.datasetId} /> : undefined;

  if (!hasChildren) {
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
        <TreeView.ItemContent icon={Icon} action={action} className={highlighted}>
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
        <TreeView.ItemContent icon={Icon} action={action} className={highlighted}>
          {n.label}
        </TreeView.ItemContent>
        {n.children!.map((child) => renderSiteNode(child, currentKey))}
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
      <TreeView.ItemContent icon={Icon} action={action} className={highlighted}>
        {n.label}
      </TreeView.ItemContent>
      {distinctTypes.map((type) => {
        const items = grouped.get(type)!;
        const TypeIcon = siteTreeMeta[type as SiteTreeType].icon;
        const bucketId = `${n.id}__${type}`;
        const shown = items.slice(0, TRUNCATE_AT);
        const remaining = items.length - shown.length;
        // No "mixed sources" hint on the bucket itself - flagged directly by the user: provenance
        // already lives at the item level (each leaf's own ProvenanceTag), so a bucket-level callout
        // is redundant. What matters about the consolidated view is just that all the data is there
        // in one place - a plain count is enough at this level.
        return (
          <TreeView.Item key={bucketId} id={bucketId} textValue={`${type} (${items.length})`}>
            <TreeView.ItemContent
              icon={TypeIcon}
              action={<CountBadge count={items.length} />}
              className={bucketId === currentKey ? "bg-brand-50 text-brand-secondary" : undefined}
            >
              {type}
            </TreeView.ItemContent>
            {shown.map((child) => renderSiteNode(child, currentKey))}
            {remaining > 0 && (
              <TreeView.Item key={`${bucketId}__more`} id={`${bucketId}__more`} textValue={`${remaining} more`} isDisabled>
                <TreeView.ItemContent>{`+${remaining} more — search to narrow`}</TreeView.ItemContent>
              </TreeView.Item>
            )}
          </TreeView.Item>
        );
      })}
    </TreeView.Item>
  );
}

// ── Shared sidebar chrome - matches project-detail/option-1's real sidebar (search input, no
// checkboxes, TreeView's own onAction for clicks) so only the tree's PRIMARY AXIS is the variable
// being judged, not the surrounding chrome. ──
function ProjectSidebar<T extends { id: string; label: string }>({
  title,
  placeholder,
  tree,
  renderNode,
  onAction,
  currentKey,
}: {
  title: string;
  placeholder: string;
  tree: T[];
  renderNode: (node: T, currentKey: string | null) => ReactNode;
  onAction: (key: Key) => void;
  currentKey: string | null;
}) {
  const [query, setQuery] = useState("");

  return (
    <aside aria-label="Section" className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{title}</p>
      <div className="flex flex-col gap-3">
        <Input size="sm" placeholder={placeholder} icon={SearchMd} value={query} onChange={setQuery} aria-label="Search records" />
        {query && !tree.some((n) => JSON.stringify(n).toLowerCase().includes(query.toLowerCase())) ? (
          <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
            <FileSearch01 className="size-5 text-fg-quaternary" />
            <p className="text-xs text-tertiary">No records match &ldquo;{query}&rdquo;.</p>
          </div>
        ) : (
          <TreeView aria-label={title} showConnectors onAction={onAction} defaultExpandedKeys={["dataset-fleurieu", "site", "subsite-a"]} className="w-full">
            {tree.map((node) => renderNode(node, currentKey))}
          </TreeView>
        )}
      </div>
    </aside>
  );
}

function MainStandIn({ currentKey, currentLabel }: { currentKey: string | null; currentLabel: string | null }) {
  if (!currentKey) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <FeaturedIcon icon={Folder} color="gray" theme="modern" size="lg" />
        <p className="text-sm text-tertiary">Click anything in the tree - this stand-in just proves the click actually goes somewhere.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">You clicked</p>
      <h1 className="text-lg font-medium text-primary">{currentLabel}</h1>
      <p className="text-xs text-tertiary">id: {currentKey}</p>
    </div>
  );
}

// ── Variant 1: By Dataset - the tree already shipped on project-detail/option-1, unchanged. ──
function VariantByDataset() {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const label = useMemo(() => findLabel(datasetRootedTree, currentKey), [currentKey]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProjectSidebar
        title="Adelaide Hills Bushland Survey"
        placeholder="Search datasets, sites, sub-sites…"
        tree={datasetRootedTree}
        renderNode={renderDatasetNode}
        onAction={(key) => setCurrentKey(String(key))}
        currentKey={currentKey}
      />
      <MainStandIn currentKey={currentKey} currentLabel={label} />
    </div>
  );
}

// ── Variant 2: By Site (consolidated) - the same data, re-rooted, with per-record provenance. ──
function VariantBySite() {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const label = useMemo(() => findLabel(siteRootedTree, currentKey), [currentKey]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProjectSidebar
        title="Adelaide Hills Bushland Survey"
        placeholder="Search sites, sub-sites, records…"
        tree={siteRootedTree}
        renderNode={renderSiteNode}
        onAction={(key) => setCurrentKey(String(key))}
        currentKey={currentKey}
      />
      <MainStandIn currentKey={currentKey} currentLabel={label} />
    </div>
  );
}

function findLabel<T extends { id: string; label: string; children?: T[] }>(nodes: T[], id: string | null): string | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node.label;
    if (node.children) {
      const found = findLabel(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

const variants = [
  { name: "By Dataset", render: VariantByDataset },
  { name: "By Site (consolidated)", render: VariantBySite },
];

// ── Picker chrome - copied verbatim from the prototype skill's PICKER.md, React-ified (same
// pattern as every other /proto lab this build has used) ──
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

export default function DataProvenanceProto() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v >= 1 && v <= variants.length) setCurrent(v - 1);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(current + 1));
    window.history.replaceState(null, "", url);
  }, [current]);

  const Render = variants[current].render;

  return (
    <div className={cx("font-barlow flex h-screen flex-col overflow-hidden bg-primary")}>
      <Render key={current} />
      <Picker current={current} setCurrent={setCurrent} />
    </div>
  );
}

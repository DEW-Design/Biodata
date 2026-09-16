"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. Started as an exploration of project-detail/
// option-1's Overview tab (traceback/hierarchy card, new data blocks, flagged-field indicator,
// artefacts carousel + lightbox - see the variant comments below for that original brief). Extended
// per direct follow-up feedback: "Please bring the whole scaffold in. We need to test the
// breadcrumbs as well... We're able to switch projects (correct), we could even switch between
// observation, transect, quadrat, etc. The chain needs to be visible to vet the proto."
//
// What's new in this pass:
// - The real shell (icon rail, header, contextual sidebar) wraps the Overview content instead of
//   just the page's immediate neighbours - so the breadcrumb/sidebar can be judged in situ, not in
//   isolation.
// - The sidebar's records tree now models the CONFIRMED containment depth (Project > Dataset > Site
//   > Sub-site > leaf record type), not just the flat "one Site, mixed children" tree the real page
//   currently has - deep enough to actually stress-test a breadcrumb chain (up to 5 levels).
// - Clicking any tree node selects it and drives a real breadcrumb chain (ChainBreadcrumb below) -
//   this is the actual thing being vetted. The real, shared `Breadcrumb` component
//   (components/scaffold/breadcrumb.tsx) is a deliberately FIXED 3-level shape (Home / section /
//   current) - flagged directly by the user off an earlier iteration as "the depth got wrong" when
//   it wasn't fixed. A 5-level record chain doesn't fit that shape, so this prototype builds a
//   genuinely different breadcrumb (same visual language: Home link, org pill, a switcher crumb,
//   "/" separators) that collapses a long middle into a "…" overflow menu instead. That's the open
//   question this lab exists to answer: does collapsing work, or does the fixed 3-level shape need
//   to change some other way once records get this deep.
// - Selecting a record swaps the main content to an honest placeholder (not a fabricated detail
//   view) - the real per-record detail screens are separate, later work (the observation deep-dive
//   the user mentioned) - this lab is only testing the chain, not building those screens yet.

import type { FC, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Key, Selection } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger, Focusable } from "react-aria-components";
import { TabList, Tab } from "@/components/application/tabs/tabs";
import { Tabs as AriaTabs } from "react-aria-components";
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronSelectorVertical,
  Mail01,
  Phone01,
  Calendar,
  Eye,
  MarkerPin01,
  MarkerPin02,
  Route,
  Grid01,
  LayoutGrid01,
  Compass,
  Package,
  Bookmark,
  Database01,
  Map01,
  Flag03,
  Image01,
  FileAttachment02,
  VideoRecorder,
  FileCheck02,
  DownloadCloud02,
  HomeLine,
  Folder,
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { Badge, BadgeWithDot, CountBadge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ModalOverlay, Modal, Dialog as ModalDialog } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { BentoCard, MetricCard } from "@/app/pages/_shared/bento-card";
import { MapView } from "@/app/pages/_shared/map-view";
import { cx } from "@/utils/cx";

// ── Shared data - same project as the real page, extended with the pieces this brief adds ──

const project = { id: "BD-5039", startDate: "3 Feb 2025", endDate: "—", status: "Active" as const, publishedBy: "Adelaide Hills Landcare" };
const PROJECT_NAME = "Adelaide Hills Bushland Survey";

const abstract =
  "Ongoing flora and fauna monitoring across the Adelaide Hills reserve network, tracking indicator species before and after prescribed burns. The project brings together local Landcare volunteers, DEW ecologists and university researchers to build a long-term baseline for reserve management decisions, with quarterly transect surveys feeding directly into the region's fire-recovery reporting.";

interface ProjectContact {
  name: string;
  role?: string;
  email: string;
  phone: string;
}
const dataOwner: ProjectContact = { name: "Olivia Wyatt", email: "olivia.wyatt@adelaidehillslandcare.org.au", phone: "(08) 8388 4188" };
const projectManager: ProjectContact = { name: "Maya Dewitt", role: "DEW Ecologist", email: "maya.dewitt@sa.gov.au", phone: "(08) 8204 1910" };

// The new data-block row - flagged directly by the user: "The data blocks needs to be changed -
// Records, Flora, Fauna, Sensitive Species."
const dataBlocks = [
  { label: "Records", value: "1,842" },
  { label: "Flora", value: "312" },
  { label: "Fauna", value: "128" },
  { label: "Sensitive Species", value: "6" },
];

// The confirmed containment model (Project > Datasets > Sites > Sub-sites > leaf record types) -
// per the user directly: "IA wise: which is correct atm, don't change." These summary counts drive
// the Project Details card's "This project contains" section; the actual browsable instances live
// in `projectDatasetTree` below (fewer, concrete nodes - deep enough to test the breadcrumb chain,
// not trying to visually reconcile to these exact totals).
const hierarchyLevels = [
  { label: "Datasets", count: 2, icon: Database01 },
  { label: "Sites", count: 5, icon: Map01 },
  { label: "Sub-sites", count: 12, icon: MarkerPin02 },
];

const leafRecordCounts = [
  { label: "Visits", count: 34, icon: Calendar },
  { label: "Observations", count: 156, icon: Eye },
  { label: "Occurrences", count: 89, icon: MarkerPin01 },
  { label: "Transects", count: 6, icon: Route },
  { label: "Quadrats", count: 14, icon: Grid01 },
  { label: "Blocks", count: 3, icon: LayoutGrid01 },
  { label: "Rambles", count: 2, icon: Compass },
  { label: "Traps", count: 8, icon: Package },
  { label: "Custom Events", count: 1, icon: Bookmark },
];

const flaggedFields = new Set(["Targeted Species", "Study Area"]);

function FlagIndicator() {
  return (
    <Tooltip title="Flagged by an admin - this field may need review or updating">
      <span className="inline-flex shrink-0 items-center justify-center">
        <Flag03 className="size-3.5 text-fg-warning-primary" />
      </span>
    </Tooltip>
  );
}

// ── The browsable records tree - real depth (Dataset > Site > Sub-site > leaf record type), not
// the flat "one Site, mixed children" tree the real page currently has. Two datasets (matching the
// Datasets tab's own `projectDatasets` list), each with real sites/sub-sites/records under them, so
// selecting a deep leaf produces a genuine 4-6 level chain to test the breadcrumb against. Same
// icon-per-record-type language as the real page's `recordTypeMeta`, extended with Dataset/Site/
// Sub-site icons (Database01/Map01/MarkerPin02, matching hierarchyLevels above). ──
type LeafType = "Visits" | "Observations" | "Occurrences" | "Transects" | "Quadrats" | "Blocks" | "Rambles" | "Traps" | "Custom Events";
type NodeType = "dataset" | "site" | "subsite" | LeafType;

const nodeTypeMeta: Record<NodeType, { icon: FC<{ className?: string }> }> = {
  dataset: { icon: Database01 },
  site: { icon: Map01 },
  subsite: { icon: MarkerPin02 },
  Visits: { icon: Calendar },
  Observations: { icon: Eye },
  Occurrences: { icon: MarkerPin01 },
  Transects: { icon: Route },
  Quadrats: { icon: Grid01 },
  Blocks: { icon: LayoutGrid01 },
  Rambles: { icon: Compass },
  Traps: { icon: Package },
  "Custom Events": { icon: Bookmark },
};

interface TreeNode {
  id: string;
  type: NodeType;
  label: string;
  children?: TreeNode[];
}

// "Observation OBS094 · Individual" - the same "Individual Observation" record type the user is
// having built out separately as a real viewing screen (Figma node 1970-147841) - kept as the same
// concrete example here rather than a different invented one, so this tree's deepest, most-tested
// path is also the one that'll eventually link to a real detail page.
const projectDatasetTree: TreeNode[] = [
  {
    id: "dataset-fleurieu",
    type: "dataset",
    label: "Fleurieu Transect Survey — Autumn 2025",
    children: [
      {
        id: "site-su00501",
        type: "site",
        label: "Site SU00501",
        children: [
          {
            id: "subsite-su00501-a",
            type: "subsite",
            label: "Sub-site SU00501-A",
            children: [
              { id: "obs-094-individual", type: "Observations", label: "Observation OBS094 · Individual" },
              { id: "obs-094-community", type: "Observations", label: "Observation OBS094 · Community" },
              { id: "occ-094-individual", type: "Occurrences", label: "Occurrence OBS094 · Individual" },
              {
                id: "visit-00501",
                type: "Visits",
                label: "Visit VU00501",
                children: [{ id: "obs-095", type: "Observations", label: "Observation OBS095" }],
              },
              { id: "transect-00501", type: "Transects", label: "Transect TR00501" },
              { id: "quadrat-00501", type: "Quadrats", label: "Quadrat QR00501" },
            ],
          },
          {
            id: "subsite-su00501-b",
            type: "subsite",
            label: "Sub-site SU00501-B",
            children: [
              { id: "block-00501", type: "Blocks", label: "Block BK00501" },
              { id: "ramble-00501", type: "Rambles", label: "Ramble RMB00501" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "dataset-cleland",
    type: "dataset",
    label: "Cleland Incidental Observations",
    children: [
      {
        id: "site-su00777",
        type: "site",
        label: "Site SU00777",
        children: [
          {
            id: "subsite-su00777-a",
            type: "subsite",
            label: "Sub-site SU00777-A",
            children: [
              { id: "trap-00777", type: "Traps", label: "Trap TRP00777" },
              { id: "custom-00777", type: "Custom Events", label: "Custom Event CE00777" },
            ],
          },
        ],
      },
    ],
  },
];

function groupByType(children: TreeNode[]): Map<NodeType, TreeNode[]> {
  const map = new Map<NodeType, TreeNode[]>();
  for (const c of children) {
    const list = map.get(c.type) ?? [];
    list.push(c);
    map.set(c.type, list);
  }
  return map;
}

// Same "group mixed children by type, single-type runs pass straight through" decision as the real
// page's renderGroupedNode - a sub-site's children are a real mix of up to 9 leaf types, so those
// get bucketed under a type header (e.g. "Observations (2)"); Dataset/Site/Sub-site levels are
// single-type runs at every point in this data, so they render as plain nesting.
function renderTreeNode(node: TreeNode): ReactNode {
  const meta = nodeTypeMeta[node.type];
  const hasChildren = !!node.children?.length;

  if (!hasChildren) {
    return (
      <TreeView.Item key={node.id} id={node.id} textValue={node.label}>
        <TreeView.ItemContent icon={meta.icon}>{node.label}</TreeView.ItemContent>
      </TreeView.Item>
    );
  }

  const grouped = groupByType(node.children!);
  const distinctTypes = Array.from(grouped.keys());

  if (distinctTypes.length <= 1) {
    return (
      <TreeView.Item key={node.id} id={node.id} textValue={node.label}>
        <TreeView.ItemContent icon={meta.icon}>{node.label}</TreeView.ItemContent>
        {node.children!.map((child) => renderTreeNode(child))}
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={node.id} id={node.id} textValue={node.label}>
      <TreeView.ItemContent icon={meta.icon}>{node.label}</TreeView.ItemContent>
      {distinctTypes.map((type) => {
        const items = grouped.get(type)!;
        const bucketId = `${node.id}__${type}`;
        const TypeIcon = nodeTypeMeta[type].icon;
        return (
          <TreeView.Item key={bucketId} id={bucketId} textValue={`${type} (${items.length})`}>
            <TreeView.ItemContent icon={TypeIcon} action={<CountBadge count={items.length} />}>
              {type}
            </TreeView.ItemContent>
            {items.map((item) => renderTreeNode(item))}
          </TreeView.Item>
        );
      })}
    </TreeView.Item>
  );
}

interface ChainCrumb {
  id: string;
  type: NodeType;
  label: string;
}

// Mirrors renderTreeNode's own bucketing exactly, so a bucket header id ("<parentId>__<type>") -
// selectable in the tree like any other item - resolves to a real crumb too ("...Sub-site SU00501-A
// / Observations"), not just leaf records. Returns the full root-to-target chain, or null if the id
// isn't in the tree (defensive - shouldn't happen since selection only ever comes from the tree
// itself).
function findChain(nodes: TreeNode[], targetId: string, trail: ChainCrumb[] = []): ChainCrumb[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, { id: node.id, type: node.type, label: node.label }];
    if (node.id === targetId) return nextTrail;
    if (node.children?.length) {
      const grouped = groupByType(node.children);
      const distinctTypes = Array.from(grouped.keys());
      if (distinctTypes.length <= 1) {
        const found = findChain(node.children, targetId, nextTrail);
        if (found) return found;
      } else {
        for (const type of distinctTypes) {
          const bucketId = `${node.id}__${type}`;
          const bucketTrail = [...nextTrail, { id: bucketId, type, label: type }];
          if (bucketId === targetId) return bucketTrail;
          const found = findChain(grouped.get(type)!, targetId, bucketTrail);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

// Artefacts - unchanged from the earlier Overview-tab pass (see the carousel/lightbox section
// below); reference image (a dark media-viewer overlay) is structure-only, restyled entirely in our
// own tokens.
interface Artefact {
  id: string;
  title: string;
  type: "image" | "pdf" | "video" | "spreadsheet";
  size: string;
  created: string;
  creator: string;
  format: string;
  license: string;
  publisher: string;
  identifier: string;
}

const artefacts: Artefact[] = [
  {
    id: "photopoint-blue-014",
    title: "Photopoint - Site BLUE-014",
    type: "image",
    size: "1.2 MB",
    created: "14 Dec 2024, 16:13",
    creator: "Olivia Wyatt",
    format: "image/jpeg",
    license: "CC BY-NC-SA 4.0",
    publisher: "Adelaide Hills Landcare",
    identifier: "BDR-00897",
  },
  {
    id: "survey-instructions",
    title: "Survey instructions",
    type: "pdf",
    size: "200 KB",
    created: "3 Feb 2025, 09:02",
    creator: "Maya Dewitt",
    format: "application/pdf",
    license: "CC BY-NC-SA 4.0",
    publisher: "DEW Biodiversity Team",
    identifier: "BDR-00891",
  },
  {
    id: "transect-photo-1",
    title: "Transect TR00501 - north face",
    type: "image",
    size: "2.4 MB",
    created: "18 Mar 2025, 11:47",
    creator: "Olivia Wyatt",
    format: "image/jpeg",
    license: "CC BY-NC-SA 4.0",
    publisher: "Adelaide Hills Landcare",
    identifier: "BDR-00902",
  },
  {
    id: "slope-recording",
    title: "Slope recording",
    type: "video",
    size: "6.4 MB",
    created: "18 Mar 2025, 11:52",
    creator: "Olivia Wyatt",
    format: "video/mp4",
    license: "CC BY-NC-SA 4.0",
    publisher: "Adelaide Hills Landcare",
    identifier: "BDR-00903",
  },
  {
    id: "slope-measurement",
    title: "Slope measurement",
    type: "spreadsheet",
    size: "3.4 MB",
    created: "18 Mar 2025, 11:55",
    creator: "Maya Dewitt",
    format: "application/vnd.ms-excel",
    license: "CC BY-NC-SA 4.0",
    publisher: "DEW Biodiversity Team",
    identifier: "BDR-00904",
  },
  {
    id: "photopoint-blue-021",
    title: "Photopoint - Site BLUE-021",
    type: "image",
    size: "1.6 MB",
    created: "2 Apr 2025, 08:30",
    creator: "Olivia Wyatt",
    format: "image/jpeg",
    license: "CC BY-NC-SA 4.0",
    publisher: "Adelaide Hills Landcare",
    identifier: "BDR-00911",
  },
];

const artefactTypeMeta: Record<Artefact["type"], { icon: FC<{ className?: string }>; badgeColor: "error" | "blue" | "success" | "gray" }> = {
  image: { icon: Image01, badgeColor: "gray" },
  pdf: { icon: FileAttachment02, badgeColor: "error" },
  video: { icon: VideoRecorder, badgeColor: "blue" },
  spreadsheet: { icon: FileCheck02, badgeColor: "success" },
};

// Same 4 example projects as the real page's ProjectSwitcher - only this one has a real detail
// page, same "only wire what has a real page" convention.
const switcherProjects = [
  { name: PROJECT_NAME, current: true },
  { name: "Coorong Wetlands Bird Count" },
  { name: "Flinders Ranges Reptile Atlas" },
  { name: "Kangaroo Island Recovery Monitoring" },
];

// ── Shared small components ──

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, flagged = false }: { label: string; value: ReactNode; flagged?: boolean }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="flex w-56 shrink-0 items-center gap-1.5 text-sm text-tertiary">
        {label}
        {flagged && <FlagIndicator />}
      </span>
      <p className="text-sm text-primary">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-secondary p-6">
      <h2 className="text-md font-medium text-primary">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function PropertyRow({ label, children, flagged = false }: { label: string; children: ReactNode; flagged?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-1.5 text-tertiary">
        {label}
        {flagged && <FlagIndicator />}
      </span>
      <span className="font-medium text-primary">{children}</span>
    </div>
  );
}

function ContactCard({ title, orgLabel, contacts }: { title: string; orgLabel?: string; contacts: ProjectContact[] }) {
  return (
    <BentoCard className="flex-1">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-primary">{title}</h2>
        {orgLabel && <p className="text-sm text-tertiary">{orgLabel}</p>}
      </div>
      <div className="flex flex-col gap-4 border-t border-secondary pt-4">
        {contacts.map((contact) => (
          <div key={contact.email} className="flex flex-col gap-1">
            <p className="text-sm font-medium text-primary">
              {contact.name}
              {contact.role && <span className="font-normal text-tertiary"> · {contact.role}</span>}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tertiary">
              <span className="flex items-center gap-1.5">
                <Mail01 className="size-3.5 text-quaternary" />
                {contact.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone01 className="size-3.5 text-quaternary" />
                {contact.phone}
              </span>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

function DataBlocksRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {dataBlocks.map((block) => (
        <MetricCard key={block.label} size="sm" value={block.value} label={block.label} />
      ))}
    </div>
  );
}

function HierarchyList({ dense = false }: { dense?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {hierarchyLevels.map((level) => (
        <PropertyRow key={level.label} label={level.label}>
          {level.count}
        </PropertyRow>
      ))}
      {!dense && (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-secondary pt-3">
          {leafRecordCounts.map((leaf) => (
            <span key={leaf.label} className="flex items-center gap-1 text-xs text-tertiary">
              <leaf.icon className="size-3.5 text-quaternary" />
              {leaf.count} {leaf.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function HierarchyPills() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {hierarchyLevels.map((level, i) => (
          <div key={level.label} className="flex items-center gap-1.5">
            {i > 0 && <ArrowNarrowRight className="size-3.5 shrink-0 text-quaternary" />}
            <span className="flex items-center gap-1.5 rounded-full border border-secondary bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
              <level.icon className="size-3.5 text-fg-brand-primary" />
              {level.label}
              <CountBadge count={level.count} color="brand" />
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-secondary pt-3">
        {leafRecordCounts.map((leaf) => (
          <span key={leaf.label} className="flex items-center gap-1 text-xs text-tertiary">
            <leaf.icon className="size-3.5 text-quaternary" />
            {leaf.count} {leaf.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Artefacts carousel + lightbox (unchanged from the earlier pass) ──

function ArtefactTile({ artefact, onOpen, size = "md" }: { artefact: Artefact; onOpen: () => void; size?: "sm" | "md" }) {
  const meta = artefactTypeMeta[artefact.type];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        "group flex shrink-0 flex-col gap-2 rounded-lg border border-secondary bg-primary p-2 text-left outline-brand transition-colors duration-100 ease-linear hover:border-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
        size === "sm" ? "w-32" : "w-44",
      )}
    >
      <div className={cx("flex items-center justify-center rounded-md bg-secondary", size === "sm" ? "h-20" : "h-28")}>
        <meta.icon className={cx("text-quaternary", size === "sm" ? "size-6" : "size-8")} />
      </div>
      <div className="flex flex-col gap-1 px-0.5 pb-0.5">
        <p className="truncate text-xs font-medium text-primary">{artefact.title}</p>
        <div className="flex items-center gap-1.5">
          <Badge size="sm" color={meta.badgeColor}>
            {artefact.type}
          </Badge>
          <span className="text-xs text-quaternary">{artefact.size}</span>
        </div>
      </div>
    </button>
  );
}

function ArtefactCarousel({ onOpen, size = "md" }: { onOpen: (index: number) => void; size?: "sm" | "md" }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <div className="group/carousel relative">
      <div ref={scrollerRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-1" style={{ scrollbarWidth: "none" }}>
        {artefacts.map((artefact, i) => (
          <ArtefactTile key={artefact.id} artefact={artefact} size={size} onOpen={() => onOpen(i)} />
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll artefacts left"
        onClick={() => scrollBy(-240)}
        className="absolute top-1/2 -left-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-secondary bg-primary text-tertiary opacity-0 shadow-sm outline-brand transition-opacity duration-100 ease-linear group-hover/carousel:opacity-100 hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll artefacts right"
        onClick={() => scrollBy(240)}
        className="absolute top-1/2 -right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-secondary bg-primary text-tertiary opacity-0 shadow-sm outline-brand transition-opacity duration-100 ease-linear group-hover/carousel:opacity-100 hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function ArtefactLightbox({ index, onClose, onNavigate }: { index: number | null; onClose: () => void; onNavigate: (index: number) => void }) {
  const artefact = index !== null ? artefacts[index] : null;

  useEffect(() => {
    if (index === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") onNavigate((index! + 1) % artefacts.length);
      else if (e.key === "ArrowLeft") onNavigate((index! - 1 + artefacts.length) % artefacts.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!artefact) return null;
  const meta = artefactTypeMeta[artefact.type];

  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="w-full max-w-4xl">
        <ModalDialog aria-label={artefact.title}>
          <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-4">
            <h2 className="text-md font-semibold text-primary">{artefact.title}</h2>
            <CloseButton onPress={onClose} label="Close" />
          </div>
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              <div className="relative flex h-80 items-center justify-center rounded-lg bg-secondary">
                <meta.icon className="size-16 text-quaternary" />
                <button
                  type="button"
                  aria-label="Previous artefact"
                  onClick={() => onNavigate((index! - 1 + artefacts.length) % artefacts.length)}
                  className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-tertiary shadow-sm outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next artefact"
                  onClick={() => onNavigate((index! + 1) % artefacts.length)}
                  className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-tertiary shadow-sm outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  Attached Resources <CountBadge count={artefacts.length} color="gray" />
                </p>
                <div className="flex flex-col gap-1.5">
                  {artefacts.map((item, i) => {
                    const itemMeta = artefactTypeMeta[item.type];
                    const active = i === index;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onNavigate(i)}
                        className={cx(
                          "flex items-center gap-3 rounded-md border p-2 text-left outline-brand transition-colors duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                          active ? "border-brand-300 bg-brand-50" : "border-secondary hover:bg-secondary",
                        )}
                      >
                        <itemMeta.icon className="size-4 shrink-0 text-quaternary" />
                        <span className="flex-1 truncate text-sm text-primary">{item.title}</span>
                        <span className="shrink-0 text-xs text-quaternary">{item.size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-secondary lg:border-l lg:pl-6">
              <div className="flex flex-col gap-3">
                <MetaField label="Created">{artefact.created}</MetaField>
                <MetaField label="Creator">{artefact.creator}</MetaField>
                <MetaField label="Format">{artefact.format}</MetaField>
                <MetaField label="License">{artefact.license}</MetaField>
                <MetaField label="Publisher">{artefact.publisher}</MetaField>
                <MetaField label="BioDataID">{artefact.identifier}</MetaField>
              </div>
              <Button color="primary" iconLeading={DownloadCloud02} className="mt-auto w-full">
                Download
              </Button>
            </div>
          </div>
        </ModalDialog>
      </Modal>
    </ModalOverlay>
  );
}

// ── Overview variants (unchanged from the earlier pass - see each one's own comment) ──

function VariantBaseline() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-4 p-6">
      <DataBlocksRow />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4">
          <DetailSection title="Overview">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Abstract</p>
              <p className="line-clamp-3 text-sm text-secondary">{abstract}</p>
            </div>
            <div className="flex flex-col gap-2 border-t border-secondary pt-4">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Geographic scope</p>
              <div className="mt-2 flex min-h-[220px] flex-1 flex-col">
                <MapView />
              </div>
            </div>
          </DetailSection>
          <DetailSection title="Artefacts">
            <ArtefactCarousel onOpen={setLightboxIndex} />
          </DetailSection>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <BentoCard className="gap-3">
            <h2 className="text-sm font-semibold text-primary">Project Details</h2>
            <div className="flex flex-col gap-3 border-t border-secondary pt-3">
              <PropertyRow label="Status">
                <BadgeWithDot size="sm" color="success">
                  {project.status}
                </BadgeWithDot>
              </PropertyRow>
              <PropertyRow label="Project ID">{project.id}</PropertyRow>
              <PropertyRow label="Start Date">{project.startDate}</PropertyRow>
              <PropertyRow label="End Date">{project.endDate}</PropertyRow>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-tertiary">Published By</span>
                <span className="text-sm font-medium text-primary">{project.publishedBy}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-secondary pt-3">
              <h3 className="text-xs font-semibold tracking-wide text-quaternary uppercase">This project contains</h3>
              <HierarchyList />
            </div>
          </BentoCard>
          <ContactCard title="Data Owner" orgLabel="Adelaide Hills Landcare" contacts={[dataOwner]} />
          <ContactCard title="Project Manager" contacts={[projectManager]} />
        </div>
      </div>
      <ArtefactLightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </div>
  );
}

function VariantHierarchyTrail() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-4 p-6">
      <DataBlocksRow />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1">
          <DetailSection title="Overview">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Abstract</p>
              <p className="line-clamp-3 text-sm text-secondary">{abstract}</p>
            </div>
            <div className="flex flex-col gap-2 border-t border-secondary pt-4">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Geographic scope</p>
              <div className="mt-2 flex min-h-[220px] flex-1 flex-col">
                <MapView />
              </div>
            </div>
          </DetailSection>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <BentoCard className="gap-3">
            <h2 className="text-sm font-semibold text-primary">Project Details</h2>
            <div className="flex flex-col gap-3 border-t border-secondary pt-3">
              <PropertyRow label="Status">
                <BadgeWithDot size="sm" color="success">
                  {project.status}
                </BadgeWithDot>
              </PropertyRow>
              <PropertyRow label="Project ID">{project.id}</PropertyRow>
              <PropertyRow label="Start Date">{project.startDate}</PropertyRow>
              <PropertyRow label="End Date">{project.endDate}</PropertyRow>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-tertiary">Published By</span>
                <span className="text-sm font-medium text-primary">{project.publishedBy}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-secondary pt-3">
              <h3 className="text-xs font-semibold tracking-wide text-quaternary uppercase">This project contains</h3>
              <HierarchyPills />
            </div>
          </BentoCard>
          <ContactCard title="Data Owner" orgLabel="Adelaide Hills Landcare" contacts={[dataOwner]} />
          <ContactCard title="Project Manager" contacts={[projectManager]} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-primary">Artefacts</h2>
          <CountBadge count={artefacts.length} color="brand" />
        </div>
        <ArtefactCarousel onOpen={setLightboxIndex} />
      </div>
      <ArtefactLightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </div>
  );
}

function VariantConsolidatedRail() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-4 p-6">
      <DataBlocksRow />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1">
          <DetailSection title="Overview">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Abstract</p>
              <p className="line-clamp-3 text-sm text-secondary">{abstract}</p>
            </div>
            <div className="flex flex-col gap-2 border-t border-secondary pt-4">
              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Geographic scope</p>
              <div className="mt-2 flex min-h-[220px] flex-1 flex-col">
                <MapView />
              </div>
            </div>
          </DetailSection>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
          <BentoCard className="gap-4">
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-primary">Project Details</h2>
              <div className="flex flex-col gap-3">
                <PropertyRow label="Status">
                  <BadgeWithDot size="sm" color="success">
                    {project.status}
                  </BadgeWithDot>
                </PropertyRow>
                <PropertyRow label="Project ID">{project.id}</PropertyRow>
                <PropertyRow label="Start Date">{project.startDate}</PropertyRow>
                <PropertyRow label="End Date">{project.endDate}</PropertyRow>
                <PropertyRow label="Published By">{project.publishedBy}</PropertyRow>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-secondary pt-4">
              <h3 className="text-xs font-semibold tracking-wide text-quaternary uppercase">Contains</h3>
              <HierarchyList dense />
            </div>
            <div className="flex flex-col gap-3 border-t border-secondary pt-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-quaternary uppercase">Artefacts</h3>
                <CountBadge count={artefacts.length} color="brand" />
              </div>
              <ArtefactCarousel onOpen={setLightboxIndex} size="sm" />
            </div>
          </BentoCard>
          <ContactCard title="Data Owner" orgLabel="Adelaide Hills Landcare" contacts={[dataOwner]} />
          <ContactCard title="Project Manager" contacts={[projectManager]} />
        </div>
      </div>
      <ArtefactLightbox index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
    </div>
  );
}

const detailsPreviewFields: { label: string; value: string }[] = [
  { label: "Targeted Species", value: "Yellow-footed Antechinus (Antechinus flavipes), Southern Brown Bandicoot (Isoodon obesulus)" },
  { label: "Study Area", value: "Cleland Conservation Park and surrounding reserves, Adelaide Hills" },
  { label: "Method of Data Collection", value: "Structured transect surveys" },
];

function FlaggedFieldsPreview() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-secondary p-4">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Details tab preview - flagged concept indicator</p>
      {detailsPreviewFields.map((field) => (
        <DetailRow key={field.label} label={field.label} value={field.value} flagged={flaggedFields.has(field.label)} />
      ))}
    </div>
  );
}

const overviewVariants = [
  { name: "Baseline", render: VariantBaseline },
  { name: "Pill Trail", render: VariantHierarchyTrail },
  { name: "Consolidated Rail", render: VariantConsolidatedRail },
];

// ── The chain breadcrumb - the thing actually being vetted this pass. Same visual language as the
// real, shared Breadcrumb (components/scaffold/breadcrumb.tsx): a plain Home link, an org pill, "/"
// separators, the current crumb in text-primary. Genuinely different shape, though - that component
// is deliberately fixed at 3 levels (Home / section / current), which a 5-level record chain can't
// fit. Long chains collapse everything except the first crumb after the project (broadest new
// context) and the last one (the thing you're actually looking at) behind a "…" overflow menu -
// same convention GitHub/Finder-style path bars use for this exact problem, not invented. ──
function ChainBreadcrumb({ chain, onSelectCrumb }: { chain: ChainCrumb[]; onSelectCrumb: (id: string | null) => void }) {
  const MAX_VISIBLE_AFTER_PROJECT = 2;
  const showAll = chain.length <= MAX_VISIBLE_AFTER_PROJECT;
  const collapsed = showAll ? [] : chain.slice(0, chain.length - MAX_VISIBLE_AFTER_PROJECT);
  const visible = showAll ? chain : chain.slice(chain.length - MAX_VISIBLE_AFTER_PROJECT);

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-tertiary" aria-label="Breadcrumb">
      <Link href="#" className="hover:text-primary">
        Home
      </Link>
      <span className="flex items-center gap-1 rounded-full border border-secondary px-1.5 py-0.5 text-[10px] font-medium">
        DEW <ChevronSelectorVertical className="size-3" />
      </span>
      <span>/</span>
      <ProjectSwitcher onSelectCrumb={onSelectCrumb} />
      <span>/</span>
      {chain.length === 0 ? (
        <span className="text-primary">{PROJECT_NAME}</span>
      ) : (
        <button type="button" onClick={() => onSelectCrumb(null)} className="hover:text-primary">
          {PROJECT_NAME}
        </button>
      )}
      {collapsed.length > 0 && (
        <>
          <span>/</span>
          <DialogTrigger>
            <AriaButton
              aria-label={`${collapsed.length} more levels`}
              className="rounded px-1 text-tertiary outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              …
            </AriaButton>
            <Popover size="sm" className="w-64 p-1">
              <AriaDialog className="outline-hidden">
                {collapsed.map((c) => {
                  const Icon = nodeTypeMeta[c.type].icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectCrumb(c.id)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-secondary hover:bg-secondary"
                    >
                      <Icon className="size-3.5 shrink-0 text-quaternary" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </AriaDialog>
            </Popover>
          </DialogTrigger>
        </>
      )}
      {visible.map((c, i) => (
        <span key={c.id} className="flex items-center gap-2">
          <span>/</span>
          {i === visible.length - 1 ? (
            <span className="text-primary">{c.label}</span>
          ) : (
            <button type="button" onClick={() => onSelectCrumb(c.id)} className="hover:text-primary">
              {c.label}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}

// Same searchable-switcher pattern as the real page's ProjectSwitcher - selecting a different
// project isn't wired to real data here (only Adelaide Hills Bushland Survey has a tree to browse),
// so the other 3 rows are inert text, same "only wire what has a real page" convention as the real
// switcher. Clicking this project's own row clears any record selection, same as clicking the
// project-name crumb next to it.
function ProjectSwitcher({ onSelectCrumb }: { onSelectCrumb: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-1 rounded-md outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2">
        Projects
        <ChevronSelectorVertical className="size-3" />
      </AriaButton>
      <Popover size="sm" className="w-64 p-1">
        <AriaDialog className="outline-hidden">
          {switcherProjects.map((p) =>
            p.current ? (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  onSelectCrumb(null);
                  setOpen(false);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-secondary"
              >
                {p.name}
              </button>
            ) : (
              <p key={p.name} className="rounded-md px-3 py-2 text-sm text-tertiary">
                {p.name}
              </p>
            ),
          )}
        </AriaDialog>
      </Popover>
    </DialogTrigger>
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
        <AriaDialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          <p className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">Profile Settings</p>
          <p className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">Logout</p>
        </AriaDialog>
      </Popover>
    </DialogTrigger>
  );
}

// The real icon rail's sections (lib/registered-user-nav.ts) - Projects is the only one with
// anywhere real to go inside this lab, same "only wire what has a real page" convention. The rest
// are disabled with a tooltip rather than dead buttons - this lab is testing the records tree/
// breadcrumb, not re-testing section navigation already covered by the real page.
const railSections: { label: string; icon: FC<{ className?: string }> }[] = [
  { label: "Home", icon: HomeLine },
  { label: "Projects", icon: Folder },
  { label: "Observations", icon: Eye },
  { label: "Data Licencing Agreement (DLA)", icon: FileLock01 },
  { label: "Nominate Sensitive Species", icon: Feather },
  { label: "Reports (Own Submissions)", icon: BarChart01 },
  { label: "Template Finder", icon: FileSearch01 },
];

function IconRail() {
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
      {railSections.map((section) => {
        if (section.label === "Home") {
          return (
            <Tooltip key={section.label} title={section.label} placement="right">
              <Link
                href="/pages/dashboard"
                className="flex size-12 items-center justify-center rounded-lg text-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary active:scale-[0.96]"
              >
                <section.icon className="size-5" />
              </Link>
            </Tooltip>
          );
        }
        if (section.label === "Projects") {
          return (
            <Tooltip key={section.label} title={section.label} placement="right">
              <TooltipTrigger className="flex size-12 items-center justify-center rounded-lg bg-brand-solid text-white transition duration-100 ease-linear active:scale-[0.96]">
                <section.icon className="size-5" />
              </TooltipTrigger>
            </Tooltip>
          );
        }
        return (
          <Tooltip key={section.label} title={`${section.label} - not part of this prototype`} placement="right">
            <Focusable>
              <span className="flex size-12 items-center justify-center rounded-lg text-quaternary opacity-40">
                <section.icon className="size-5" />
              </span>
            </Focusable>
          </Tooltip>
        );
      })}
    </nav>
  );
}

// The main content when a record is selected in the sidebar - an honest placeholder, not a
// fabricated detail view. What's real here is the breadcrumb chain above it; the record's own
// detail screen is separate, later work (the observation deep-dive the user mentioned).
function SelectedRecordPanel({ crumb, onBack }: { crumb: ChainCrumb; onBack: () => void }) {
  const meta = nodeTypeMeta[crumb.type];
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <FeaturedIcon icon={meta.icon} color="brand" theme="modern" size="lg" />
      <h1 className="text-lg font-medium text-primary">{crumb.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        This record&apos;s own detail view isn&apos;t built yet - this panel exists to prove the breadcrumb chain above updates correctly when you select
        deep into the tree, not to show real content.
      </p>
      <Button color="link-color" size="sm" iconLeading={ArrowNarrowLeft} onClick={onBack}>
        Back to project overview
      </Button>
    </div>
  );
}

function ProjectOverview({ overviewVariant }: { overviewVariant: number }) {
  const Render = overviewVariants[overviewVariant].render;
  return (
    <>
      <div className="p-6 pb-0">
        <span className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary">
          <ArrowNarrowLeft className="size-4" />
          Back to projects
        </span>
      </div>
      <div className="flex flex-col gap-1 p-6 pb-0">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h1 className="text-2xl font-medium text-primary">{PROJECT_NAME}</h1>
      </div>
      <div className="flex flex-wrap items-start gap-8 border-b border-secondary p-6">
        <MetaField label="Project ID">{project.id}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color="success">
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.publishedBy}</MetaField>
      </div>
      <AriaTabs selectedKey="overview" className="flex flex-col">
        <TabList aria-label="Project views" type="underline" size="md" className="gap-6 px-6 pt-4">
          <Tab id="overview" label="Overview" />
          <Tab id="datasets" label="Datasets" />
          <Tab id="details" label="Details" />
          <Tab id="restrictions" label="Restrictions" />
          <Tab id="additional" label="Additional Information" />
        </TabList>
      </AriaTabs>
      <Render />
      <div className="px-6 pb-6">
        <FlaggedFieldsPreview />
      </div>
    </>
  );
}

// ── Picker chrome for the Overview-layout axis - copied verbatim from the prototype skill's
// PICKER.md, React-ified. Bottom-fixed, the default position - a top-fixed version was tried first
// but collided with the header's own breadcrumb overflow ("…") button, since the shell now has a
// real fixed header near the top of the viewport that the original trimmed-context version didn't. ──
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
      if (num >= 1 && num <= overviewVariants.length) setCurrent(num - 1);
      else if (e.key === "ArrowRight") setCurrent((current + 1) % overviewVariants.length);
      else if (e.key === "ArrowLeft") setCurrent((current - 1 + overviewVariants.length) % overviewVariants.length);
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
      {overviewVariants.map((v, i) => (
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

export default function ProjectDetailProto() {
  const [overviewVariant, setOverviewVariant] = useState(0);
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);

  useEffect(() => {
    const v = parseInt(new URLSearchParams(window.location.search).get("v") ?? "", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v >= 1 && v <= overviewVariants.length) setOverviewVariant(v - 1);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(overviewVariant + 1));
    window.history.replaceState(null, "", url);
  }, [overviewVariant]);

  const chain = useMemo(() => (selectedKey ? (findChain(projectDatasetTree, String(selectedKey)) ?? []) : []), [selectedKey]);
  const currentCrumb = chain.length > 0 ? chain[chain.length - 1] : null;

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const [key] = Array.from(keys);
    setSelectedKey(key ?? null);
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      {/* ── Header ── */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pages/dashboard/gov-sa-dew-lockup.png"
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <ChainBreadcrumb chain={chain} onSelectCrumb={(id) => setSelectedKey(id)} />
        </div>
        <ProfileMenu />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <IconRail />

        {/* ── Contextual sidebar: the deep records tree - the thing this pass adds depth to ── */}
        <aside aria-label="Section" className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{PROJECT_NAME}</p>
          <TreeView
            aria-label="Adelaide Hills Bushland Survey records, grouped by type"
            showConnectors
            selectionMode="single"
            selectedKeys={selectedKey ? [selectedKey] : []}
            onSelectionChange={handleSelectionChange}
            defaultExpandedKeys={["dataset-fleurieu", "site-su00501", "subsite-su00501-a"]}
            className="w-full"
          >
            {projectDatasetTree.map((node) => renderTreeNode(node))}
          </TreeView>
        </aside>

        <main className="flex flex-1 flex-col overflow-y-auto">
          {currentCrumb ? (
            <SelectedRecordPanel crumb={currentCrumb} onBack={() => setSelectedKey(null)} />
          ) : (
            <ProjectOverview overviewVariant={overviewVariant} />
          )}
        </main>
      </div>

      <Picker current={overviewVariant} setCurrent={setOverviewVariant} />
    </div>
  );
}

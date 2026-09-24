"use client";

import type { FC, ReactNode } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Key } from "react-aria-components";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable, Tabs } from "react-aria-components";
import { TabList, Tab } from "@/components/application/tabs/tabs";
import {
  SearchMd,
  Upload01,
  Plus,
  ChevronDown,
  ChevronSelectorVertical,
  ArrowNarrowLeft,
  ArrowNarrowRight,
  HomeLine,
  Folder,
  Eye,
  FileCheck02, FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
  User01,
  PieChart03,
  Flag03,
  Map01,
  Calendar,
  MarkerPin01,
  Route,
  Grid01,
  Compass,
} from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { Badge, BadgeWithDot, CountBadge } from "@/components/base/badges/badges";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@/components/base/table/table";
import { Accordion } from "@/components/base/accordion/accordion";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { HomeTabPanels } from "@/app/pages/_shared/home-tab-panels";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { MapView } from "@/app/pages/_shared/map-view";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { orgLabelForRole } from "@/lib/user-role";
import { navForRole, registeredUserAccountMenu, registeredUserFooterLinks, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";
import { projectRecordTree, type RecordNode, type RecordType } from "@/app/pages/_shared/project-record-tree";

// One observation's viewing screen, on the sidebar-nav shell - same three-column chrome as
// project-detail, forked from that file rather than shared with it (this codebase's own
// established convention: per-page local chrome, not a cross-page shared shell component - see
// project-detail's own NavTree/ProfileMenu/GuestAuthActions, each a local copy too).
//
// Content model (the fields grouped into Observation Details/Species/Observers/Temporal Details/
// Location Information/Custom Property, and their order) is drawn directly from the Figma
// "Observation Individual Container/View" component (https://www.figma.com/design/
// YMproGZfrFB5jUqPHPxMhk/..., node 1970-147841) - per the user directly, that component is "all the
// concepts (or fields) that go into this type of observation," a field schema reference, not a
// finished screen. Every field group renders through this design system's real components
// (Accordion, DetailRow, the bare Table primitive, MapView) instead of the Figma's own hand-drawn
// accordion/table chrome - same "reference for content, not pixels" rule as project-detail's own
// Figma references.
//
// One concrete example (OBS094, an Individual Observation of a Yellow-footed Antechinus - the same
// species already named in project-detail's "Targeted Species" field, not a fresh invented
// one), nested under the same Adelaide Hills Bushland Survey project's real record tree
// (Site SU00501) - not a dynamic per-ID route, same "one hardcoded instance" scope as every other
// page in this build. Reachable only by direct URL for now - the project's own records tree
// (project-detail's sidebar) doesn't link into individual records yet; that wiring, and
// the deep breadcrumb chain a real record this many levels down would need, is being vetted
// separately at /proto/project-detail before it's promoted.
//
// This is the VIEWING screen only. The user's own next step: "we'll build the edit an observation
// view off the viewing an observation component design" - editing is explicitly future work, not
// started here.

const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  "Data Licencing Agreement (DLA)": FileLock01,
  "Data Sharing Agreement (DSA)": FileCheck02,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};

function NavTree({ node, depth = 0, defaultOpen = false }: { node: NavNode; depth?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!node.items?.length;
  const href = node.key ? keyHref(node.key) : undefined;
  const indent = { paddingLeft: depth * 12 };

  if (!hasChildren) {
    return href ? (
      <Link
        href={href}
        style={indent}
        className="rounded-md py-2 text-sm font-medium text-primary transition-colors duration-100 ease-linear hover:bg-tertiary"
      >
        {node.label}
      </Link>
    ) : (
      <p style={indent} className="py-2 text-sm text-tertiary">
        {node.label}
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={indent}
        className={cx(
          "flex w-full items-center justify-between gap-2 py-2 text-left",
          depth === 0 ? "text-xs font-semibold tracking-wide text-quaternary uppercase" : "text-sm font-medium text-primary",
        )}
      >
        {node.label}
        <ChevronDown className={cx("size-3.5 shrink-0 text-quaternary transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5">
          {node.items!.map((child) => (
            <NavTree key={child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── The focused tree view - same data (app/pages/_shared/project-record-tree.ts, shared with
// project-detail), grouping, and styling as project-detail's own sidebar. "Focused" per the user
// directly: this page IS the smallest/most specific element (the last item on a breadcrumb), so the
// tree opens already expanded down to it, current row highlighted. Clicking any other node navigates
// instead of showing a second copy of its content: the Project root goes back to the project's plain
// Overview, anything else deep-links to project-detail's own SelectedRecordPanel via `?select=<id>`.
//
// Record model, per CONTEXT.md: Project > Site > Visit > Occurrence > Observation, an Occurrence
// parenting exactly one Observation; Transect/Quadrat/Ramble nest under the Visit they belong to.

const recordTypeMeta: Record<RecordType, { icon: FC<{ className?: string }> }> = {
  Projects: { icon: Folder },
  Sites: { icon: Map01 },
  Visits: { icon: Calendar },
  Occurrences: { icon: MarkerPin01 },
  Observations: { icon: Eye },
  Transects: { icon: Route },
  Quadrats: { icon: Grid01 },
  Rambles: { icon: Compass },
};

const recordTypes = Object.keys(recordTypeMeta) as RecordType[];

const recordSearchPlaceholder = `Search ${recordTypes
  .slice(0, -1)
  .map((t) => t.toLowerCase())
  .join(", ")}, or ${recordTypes[recordTypes.length - 1].toLowerCase()}…`;


// This observation's own id is "obs-094" - the CURRENT_RECORD_ID this page focuses the tree on.
// Two Site (Event) roots directly - no Dataset/Sub-site wrapper.

const CURRENT_RECORD_ID = "obs-094";
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

function filterRecordTree(node: RecordNode, query: string): RecordNode | null {
  if (!query.trim()) return node;
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return node;
  const filteredChildren = node.children?.map((c) => filterRecordTree(c, query)).filter((c): c is RecordNode => c !== null) ?? [];
  return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
}

function filterRecordForest(nodes: RecordNode[], query: string): RecordNode[] {
  return nodes.map((n) => filterRecordTree(n, query)).filter((n): n is RecordNode => n !== null);
}

function collectGroupedContainerIds(node: RecordNode, acc: string[] = []): string[] {
  if (!node.children || node.children.length === 0) return acc;
  acc.push(node.id);
  const grouped = groupByType(node.children);
  const distinctTypes = Array.from(grouped.keys());
  if (distinctTypes.length <= 1) {
    for (const child of node.children) collectGroupedContainerIds(child, acc);
  } else {
    for (const type of distinctTypes) {
      acc.push(`${node.id}__${type}`);
      for (const item of grouped.get(type)!) collectGroupedContainerIds(item, acc);
    }
  }
  return acc;
}

interface ChainCrumb {
  id: string;
  type: RecordType;
  label: string;
}

function findRecordChain(nodes: RecordNode[], targetId: string, trail: ChainCrumb[] = []): ChainCrumb[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, { id: node.id, type: node.type, label: node.label }];
    if (node.id === targetId) return nextTrail;
    if (node.children?.length) {
      const grouped = groupByType(node.children);
      const distinctTypes = Array.from(grouped.keys());
      if (distinctTypes.length <= 1) {
        const found = findRecordChain(node.children, targetId, nextTrail);
        if (found) return found;
      } else {
        for (const type of distinctTypes) {
          const bucketId = `${node.id}__${type}`;
          const bucketTrail = [...nextTrail, { id: bucketId, type, label: type }];
          if (bucketId === targetId) return bucketTrail;
          const found = findRecordChain(grouped.get(type)!, targetId, bucketTrail);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

// bg-brand-50/text-brand-secondary - the same highlight project-detail settled on for its
// own "current row" treatment (its first attempt, bg-brand-secondary, silently didn't render -
// logged directly in that page's own comment).
const CURRENT_ROW_CLASSNAME = "bg-brand-50 text-brand-secondary";

function renderGroupedNode(n: RecordNode, currentKey: string): ReactNode {
  const Icon = recordTypeMeta[n.type].icon;
  const hasChildren = !!n.children && n.children.length > 0;

  if (!hasChildren) {
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
        <TreeView.ItemContent icon={Icon} className={n.id === currentKey ? CURRENT_ROW_CLASSNAME : undefined}>
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
        <TreeView.ItemContent icon={Icon} className={n.id === currentKey ? CURRENT_ROW_CLASSNAME : undefined}>
          {n.label}
        </TreeView.ItemContent>
        {n.children!.map((child) => renderGroupedNode(child, currentKey))}
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
      <TreeView.ItemContent icon={Icon} className={n.id === currentKey ? CURRENT_ROW_CLASSNAME : undefined}>
        {n.label}
      </TreeView.ItemContent>
      {distinctTypes.map((type) => {
        const items = grouped.get(type)!;
        const TypeIcon = recordTypeMeta[type].icon;
        const bucketId = `${n.id}__${type}`;
        const shown = items.slice(0, TRUNCATE_AT);
        const remaining = items.length - shown.length;
        return (
          <TreeView.Item key={bucketId} id={bucketId} textValue={`${type} (${items.length})`}>
            <TreeView.ItemContent icon={TypeIcon} action={<CountBadge count={items.length} />} className={bucketId === currentKey ? CURRENT_ROW_CLASSNAME : undefined}>
              {type}
            </TreeView.ItemContent>
            {shown.map((child) => renderGroupedNode(child, currentKey))}
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

// This page's own full chain (Dataset > Site > Sub-site > Observations bucket > this Observation)
// - drives both the sidebar's default-expanded set (just the ids) and the header's own breadcrumb
// (the full crumbs, with labels/types) below. Static, not state - this page is always this one
// record.
const recordChain = findRecordChain(projectRecordTree, CURRENT_RECORD_ID)!;
const focusedExpandedKeys = recordChain.map((c) => c.id);

const switcherProjects = [
  { name: "Adelaide Hills Bushland Survey", href: "/pages/project-detail" },
  { name: "Coorong Wetlands Bird Count" },
  { name: "Flinders Ranges Reptile Atlas" },
  { name: "Kangaroo Island Recovery Monitoring" },
];

function ProjectSwitcher() {
  const roleHref = useRoleHref();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = switcherProjects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <AriaButton className="flex items-center gap-1 rounded-md outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2">
        Projects
        <ChevronSelectorVertical className="size-3" />
      </AriaButton>
      <Popover size="auto" className="w-72 p-2">
        <Dialog className="outline-hidden">
          <Input size="sm" placeholder="Find project…" icon={SearchMd} value={query} onChange={setQuery} />
          <div className="mt-1 flex max-h-60 flex-col overflow-y-auto">
            {filtered.length === 0 && <p className="px-2 py-2 text-sm text-tertiary">No projects found.</p>}
            {filtered.map((project) =>
              project.href ? (
                <Link
                  key={project.name}
                  href={roleHref(project.href)}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2 text-sm text-primary hover:bg-secondary"
                >
                  {project.name}
                </Link>
              ) : (
                <p key={project.name} className="rounded-md px-2 py-2 text-sm text-tertiary">
                  {project.name}
                </p>
              ),
            )}
          </div>
          <div className="mt-1 shrink-0 border-t border-secondary pt-1">
            <Link
              href={roleHref("/pages/project-list")}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2 text-sm font-medium text-brand-700 hover:bg-secondary"
            >
              View all projects
            </Link>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

// ── The chain breadcrumb - same component/behavior as project-detail's own
// ChainBreadcrumb (ported here rather than shared, same "each page keeps its own local copy of
// chrome" convention this whole build follows). Flagged directly by the user off a screenshot:
// this page was still using the original fixed-3-level `Breadcrumb` (Home / Projects⌄ / current),
// which for a record this deep just skipped straight from "Projects" to "Observation Individual
// OBS094" - no project name, no "…", nothing in between. `chain` here is always
// `recordChain` (this page's own fixed Dataset > Site > Sub-site > bucket > Observation path, not
// a live selection), so collapsing behaves identically to project-detail's own version for a chain
// this length - everything before the last crumb goes behind "…". ──
function ChainBreadcrumb({ chain, onSelectCrumb, orgLabel }: { chain: ChainCrumb[]; onSelectCrumb: (id: string) => void; orgLabel?: string }) {
  const roleHref = useRoleHref();
  const MAX_VISIBLE_AFTER_PROJECT = 1;
  const showAll = chain.length <= MAX_VISIBLE_AFTER_PROJECT;
  const collapsed = showAll ? [] : chain.slice(0, chain.length - MAX_VISIBLE_AFTER_PROJECT);
  const visible = showAll ? chain : chain.slice(chain.length - MAX_VISIBLE_AFTER_PROJECT);

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm text-nowrap text-tertiary" aria-label="Breadcrumb">
      <Link href={roleHref("/pages/dashboard")} className="shrink-0 hover:text-primary">
        Home
      </Link>
      {orgLabel && (
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-secondary px-1.5 py-0.5 text-[10px] font-medium">
          {orgLabel} <ChevronSelectorVertical className="size-3" />
        </span>
      )}
      <span className="shrink-0">/</span>
      <span className="shrink-0">
        <ProjectSwitcher />
      </span>
      <span className="shrink-0">/</span>
      <Link href={roleHref("/pages/project-detail")} className="min-w-0 shrink truncate hover:text-primary">
        Adelaide Hills Bushland Survey
      </Link>
      {collapsed.length > 0 && (
        <>
          <span className="shrink-0">/</span>
          <DialogTrigger>
            <AriaButton
              aria-label={`${collapsed.length} more levels`}
              className="shrink-0 rounded px-1 text-tertiary outline-brand hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              …
            </AriaButton>
            <Popover size="sm" className="w-64 p-1">
              <Dialog className="outline-hidden">
                {collapsed.map((c) => {
                  const Icon = recordTypeMeta[c.type].icon;
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
              </Dialog>
            </Popover>
          </DialogTrigger>
        </>
      )}
      {visible.map((c, i) => (
        <span key={c.id} className="flex min-w-0 items-center gap-2">
          <span className="shrink-0">/</span>
          {i === visible.length - 1 ? (
            <span className="min-w-0 truncate text-primary">{c.label}</span>
          ) : (
            <button type="button" onClick={() => onSelectCrumb(c.id)} className="min-w-0 shrink truncate hover:text-primary">
              {c.label}
            </button>
          )}
        </span>
      ))}
    </nav>
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
        <Dialog className="outline-hidden">
          <p className="px-3 py-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Profile</p>
          {registeredUserAccountMenu.map((item) => (
            <p key={item} className="cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-secondary">
              {item}
            </p>
          ))}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

function SectionPlaceholder({ node }: { node: NavNode }) {
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  const roleHref = useRoleHref();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <h1 className="text-lg font-medium text-primary">{node.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        {relatedLink
          ? "This section has its own page - it isn't embedded here."
          : "This section's content hasn't been scoped yet - only its place in the navigation is decided so far."}
      </p>
      {relatedLink && (
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))} iconTrailing={ArrowNarrowRight}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

// The concept-level flag indicator - "if the admin flags a field, it should show the registered
// user or above that a field (or concept) has been flagged." Just the indicator here (an icon +
// tooltip on the flagged field) - the real flag-management UI (who flagged it, why, resolving it)
// is separate, later work; the user was explicit this observation viewing screen is exactly where
// that indicator should first show up for real, not a hypothetical for later.
function FlagIndicator() {
  return (
    <Tooltip title="Flagged by an admin - this field may need review or updating">
      <span className="inline-flex shrink-0 items-center justify-center">
        <Flag03 className="size-3.5 text-fg-warning-primary" />
      </span>
    </Tooltip>
  );
}

// `fieldId` renders as a real DOM id (`field-<fieldId>`) - the anchor a flagged-concept banner
// elsewhere (project-detail's Overview tab) scrolls to after this page loads with
// `?flag=<fieldId>` in the URL. Only flagged rows need to pass it; every other row is fine without
// one.
function DetailRow({
  label,
  value,
  flagged = false,
  fieldId,
}: {
  label: string;
  value: ReactNode;
  flagged?: boolean;
  fieldId?: string;
}) {
  return (
    <div id={fieldId ? `field-${fieldId}` : undefined} className="flex scroll-mt-6 flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="flex w-56 shrink-0 items-center gap-1.5 text-sm text-tertiary">
        {label}
        {flagged && <FlagIndicator />}
      </span>
      <p className="text-sm text-primary">{value}</p>
    </div>
  );
}

// A label:value row whose value is itself a short line + a longer description underneath - the
// Figma reference used this shape for fields like Life Form, Collection Method, Location Method,
// and Datum (a code/name on top, a plain-language description below it).
function DetailRowWithDescription({
  label,
  value,
  description,
  flagged = false,
  fieldId,
}: {
  label: string;
  value: ReactNode;
  description: string;
  flagged?: boolean;
  fieldId?: string;
}) {
  return (
    <div id={fieldId ? `field-${fieldId}` : undefined} className="flex scroll-mt-6 flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="flex w-56 shrink-0 items-center gap-1.5 text-sm text-tertiary">
        {label}
        {flagged && <FlagIndicator />}
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-primary">{value}</p>
        <p className="text-sm text-tertiary">{description}</p>
      </div>
    </div>
  );
}

interface Measurement {
  type: string;
  value: string;
  unit: string;
}

const measurements: Measurement[] = [
  { type: "Weight", value: "28", unit: "gms" },
  { type: "Head-Body Length", value: "12", unit: "cm" },
  { type: "Tail Length", value: "11", unit: "cm" },
];

function MeasurementsTable() {
  return (
    <Table aria-label="Measurements">
      <TableHeader>
        <Column isRowHeader>Type</Column>
        <Column>Value</Column>
        <Column>Unit</Column>
      </TableHeader>
      <TableBody items={measurements}>
        {(row) => (
          <Row id={row.type} textValue={row.type}>
            <Cell>
              <span className="text-sm font-medium text-primary">{row.type}</span>
            </Cell>
            <Cell>
              <span className="text-sm text-secondary">{row.value}</span>
            </Cell>
            <Cell>
              <span className="text-sm text-secondary">{row.unit}</span>
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}

// The observation this page shows - one concrete example (OBS094, an Individual Observation of a
// Yellow-footed Antechinus), not a generic per-record schema. Grounded in project-detail's
// own real data: the same species named in that page's "Targeted Species" field, the same
// Observer/Data Owner pair (Olivia Wyatt/Maya Dewitt), the same Site SU00501 - this is a real record
// living inside that project's already-established world, not a fresh invented one.
const observation = {
  id: "OBS094",
  name: "Observation Individual OBS094",
  type: "Individual Observation",
  status: "Verified" as const,
  recordedDate: "18 Mar 2025",
};

// Attached Resources isn't given a working viewer here - unlike the project-level Artefacts
// carousel/lightbox explored at /proto/project-detail (not yet promoted), building a second, real
// media viewer for observation-level resources ahead of that decision would duplicate work rather
// than reuse it. Disabled with a tooltip instead of a dead link, same honest-gap convention as
// DisabledQuickAction elsewhere in this build.
function AttachedResourcesRow() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="w-56 shrink-0 text-sm text-tertiary">Attached Resources</span>
        <div className="flex items-center gap-2">
          <CountBadge count={2} color="brand" />
          <Tooltip title="Coming soon - the resource viewer for observations isn't wired up yet">
            <Focusable>
              <span className="inline-flex">
                <Button color="link-color" size="sm" isDisabled>
                  View resources
                </Button>
              </span>
            </Focusable>
          </Tooltip>
        </div>
      </div>
      <div className="flex gap-6 text-sm text-tertiary">
        <div className="flex flex-1 flex-col gap-1">
          <span>Occurrences</span>
          <span className="font-medium text-primary">1</span>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span>Observations</span>
          <span className="font-medium text-primary">0</span>
        </div>
      </div>
    </div>
  );
}

// Which accordion section a flagged field's `fieldId` lives inside - so a deep link
// (?flag=pouch-status) knows which section to auto-open before it can scroll to the field itself.
// Kept as an explicit map rather than derived from observationAccordionItems below, since content
// is JSX at that point, not data this could search - to add a flag target, add a `fieldId` on its
// DetailRow above and a matching entry here.
const flaggedFieldSections: Record<string, string> = {
  "pouch-status": "species",
  "location-method": "location-information",
};

const observationAccordionItems = [
  {
    id: "observation-details",
    title: "Observation Details",
    content: (
      <div className="flex flex-col gap-3">
        <DetailRow label="Observation ID" value={observation.id} />
        <DetailRow label="Observation Name" value={observation.name} />
        <DetailRow label="Description" value="-" />
        <DetailRow label="Observation Comment" value="-" />
        <AttachedResourcesRow />
      </div>
    ),
  },
  {
    id: "species",
    title: "Species",
    content: (
      <div className="flex flex-col gap-3">
        <DetailRow label="Line" value="Antechinus flavipes (Yellow-footed Antechinus)" />
        <DetailRowWithDescription label="Life Form & Desc" value="Mammal" description="Small carnivorous marsupial" />
        <DetailRowWithDescription label="Collection Method & Desc" value="Camera trap" description="Motion-activated camera trap, checked fortnightly" />
        <DetailRowWithDescription label="Strata & Desc" value="Understorey" description="Leaf litter and low shrub layer" />
        <DetailRowWithDescription label="Macro Habitat & Desc" value="Eucalypt woodland" description="Open eucalypt woodland with a sparse shrub understorey" />
        <DetailRowWithDescription label="Micro Habitat & Desc" value="Fallen timber" description="Observed near a fallen log with leaf litter cover" />
        <DetailRow label="Activity" value="Foraging" />
        <DetailRow label="Association Dominance" value="-" />
        <DetailRow label="Sex" value="Female" />
        <DetailRow label="Regeneration" value="-" />
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
          <span className="w-56 shrink-0 text-sm text-tertiary">Measurements</span>
          <div className="flex-1 overflow-hidden rounded-lg border border-secondary">
            <MeasurementsTable />
          </div>
        </div>
        <DetailRow label="Gravid?" value="No" />
        <DetailRow label="Teats" value="-" />
        <DetailRow label="Vagina" value="-" />
        <DetailRow label="Pouch Status" value="-" flagged fieldId="pouch-status" />
        <DetailRow label="No. in Pouch" value="-" />
        <DetailRow label="Testes" value="-" />
        <DetailRow label="Animal Life Stage" value="Adult" />
        <DetailRow label="Plant Life Stage" value="-" />
        <DetailRow label="Planted/Released" value="-" />
      </div>
    ),
  },
  {
    id: "observers",
    title: "Observers",
    content: (
      <div className="flex flex-col gap-3">
        <DetailRow label="Observer 1" value="Olivia Wyatt" />
        <DetailRow label="Observer 2" value="Maya Dewitt" />
        <DetailRow label="Observer 3" value="-" />
      </div>
    ),
  },
  {
    id: "temporal-details",
    title: "Temporal Details",
    content: (
      <div className="flex flex-col gap-3">
        <DetailRow label="Start Date" value="18 Mar 2025, 07:42" />
        <DetailRow label="End Date" value="18 Mar 2025, 07:55" />
        <DetailRow label="Duration" value="13 minutes" />
        <DetailRow label="Date Accuracy" value="Exact" />
      </div>
    ),
  },
  {
    id: "location-information",
    title: "Location Information",
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex min-h-[220px] flex-col overflow-hidden rounded-lg">
          <MapView />
        </div>
        <div className="flex flex-col gap-3">
          {/* Same shared coordinate table as every other record type. This mock observation
              carries no coordinates of its own, so every cell is an honest "-". The shapefile
              link stays underneath it - still a real (not-yet-wired) attachment on this record. */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span className="w-56 shrink-0 text-sm text-tertiary sm:pt-2.5">Location Details</span>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <LocationDetailsTable />
              <Tooltip title="Coming soon - shapefile downloads aren't wired up yet">
                <Focusable>
                  <span className="inline-flex">
                    <Button color="link-color" size="sm" isDisabled>
                      Shapefile.shp
                    </Button>
                  </span>
                </Focusable>
              </Tooltip>
            </div>
          </div>
          <DetailRow label="IBRA Region" value="Flinders Lofty Block" />
          <DetailRow label="IBRA Sub Region" value="Southern Lofty" />
          <DetailRowWithDescription label="Location Method" value="GPS" description="Handheld GPS unit, ±5m accuracy" flagged fieldId="location-method" />
          <DetailRowWithDescription label="Datum" value="GDA2020" description="Geocentric Datum of Australia 2020" />
          <DetailRowWithDescription label="Reliability" value="High" description="Confirmed via GPS with clear satellite lock" />
          <DetailRow label="Sample Site Dimensions" value="-" />
          <DetailRow label="Location Comment" value="-" />
        </div>
      </div>
    ),
  },
  {
    id: "custom-property",
    title: "Custom Property",
    content: (
      <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-secondary p-8 text-center">
        <p className="text-sm font-medium text-primary">No custom properties</p>
        <p className="text-sm text-tertiary">No custom properties have been added to this observation type yet.</p>
      </div>
    ),
  },
];

export default function ObservationDetailPage() {
  return (
    <Suspense fallback={null}>
      <ObservationDetail />
    </Suspense>
  );
}

function ObservationDetail() {
  const router = useRouter();
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [homeTab, setHomeTab] = useState<Key>("dashboard");
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  // Deep-link target for a flagged concept - project-detail's flagged-concepts banner
  // links here as `?flag=<fieldId>` (see flaggedFieldSections above for the fieldId->section map).
  // The accordion section opens on first render (defaultOpenKeys, not a controlled prop the shared
  // Accordion component doesn't expose) and a plain scrollIntoView after a short delay lands on
  // the exact field once its section has finished expanding - same "let the real open animation
  // finish before scrolling" reasoning as any anchor link into collapsed content.
  const searchParams = useSearchParams();
  const flagTarget = searchParams.get("flag");
  const flagSection = flagTarget ? flaggedFieldSections[flagTarget] : undefined;

  useEffect(() => {
    if (!flagTarget) return;
    const timeout = setTimeout(() => {
      document.getElementById(`field-${flagTarget}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => clearTimeout(timeout);
  }, [flagTarget]);

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setActiveSection(section.label);
    }
  };

  // The focused tree view - same "grouped by type + search" mechanics as project-detail's
  // own sidebar, opened by default to this page's own record (focusedExpandedKeys).
  const [recordQuery, setRecordQuery] = useState("");
  const filteredRecordForest = useMemo(() => filterRecordForest(projectRecordTree, recordQuery), [recordQuery]);
  const recordExpandedKeys = useMemo(
    () => (recordQuery ? filteredRecordForest.flatMap((n) => collectGroupedContainerIds(n)) : focusedExpandedKeys),
    [recordQuery, filteredRecordForest],
  );

  // Clicking a row here doesn't show a second copy of that record's content on this same page -
  // it navigates. The current record (CURRENT_RECORD_ID, already this page) is a no-op. The Project
  // root (the broadest node in this tree) goes back to the project's plain Overview - flagged directly by the user off the original "Dataset"
  // version of this same idea: the broadest node in the tree doesn't get its own dedicated
  // placeholder, it just returns to the project. Everything else deep-links to
  // project-detail's own SelectedRecordPanel via `?select=<id>`.
  const handleTreeAction = (key: Key) => {
    const id = String(key);
    if (id === CURRENT_RECORD_ID) return;
    const isProjectRoot = projectRecordTree.some((root) => root.id === id);
    if (isProjectRoot) {
      router.push(roleHref("/pages/project-detail"));
    } else {
      router.push(`/pages/project-detail?userRole=${role}&select=${id}`);
    }
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header ── */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
        {/* min-w-0 so this block can shrink (and the breadcrumb inside it truncate) instead of
            forcing the header's own flex-wrap to push "search + actions" onto a second row - same
            fix as project-detail's own header, for the same reason. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          >
            {!isPublicUser && activeSection === "Home" &&
              ((close: () => void) => (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setHomeTab("dashboard");
                      close();
                    }}
                    className={cx(
                      "rounded-md px-3 py-2 text-left text-sm font-medium outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                      homeTab === "dashboard" ? "bg-secondary text-primary" : "text-primary hover:bg-secondary",
                    )}
                  >
                    My BioData
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHomeTab("overview");
                      close();
                    }}
                    className={cx(
                      "rounded-md px-3 py-2 text-left text-sm font-medium outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                      homeTab === "overview" ? "bg-secondary text-primary" : "text-primary hover:bg-secondary",
                    )}
                  >
                    Flora and Fauna Dashboard
                  </button>
                </>
              ))}
          </MobileNavTrigger>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pages/dashboard/gov-sa-dew-lockup.png"
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          {activeSection === "Projects" ? (
            <ChainBreadcrumb chain={recordChain} onSelectCrumb={handleTreeAction} orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined} />
          ) : (
            <Breadcrumb
              section={activeSection === "Home" ? undefined : activeSectionNode.label}
              orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined}
            />
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-64 lg:w-[395px]">
              <GlobalProjectSearch />
            </div>
            <GuestActionButton
              icon={Plus}
              label="Add project"
              color="primary"
              isGuest={isPublicUser}
              modalTitle="Sign up to add a project"
              modalDescription="Create a free BioData SA account to start contributing projects to South Australia's biodiversity record."
              href="/pages/project-registration"
            />
            <GuestActionButton
              icon={Upload01}
              label="Upload dataset"
              color="secondary"
              isGuest={isPublicUser}
              modalTitle="Sign up to upload a dataset"
              modalDescription="Create a free BioData SA account to start contributing datasets to South Australia's biodiversity record."
            />
          </div>
          {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
        </div>
      </header>

      {/* ── Primary icon rail: top-level IA (nav chrome - not pixel-matched) ── */}
      {(() => {
        const iconRail = (
          <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-secondary bg-secondary py-4 lg:flex">
            {nav.map((section) => {
              const Icon = sectionIcons[section.label];
              const active = section.label === activeSection;
              const badgeCount = !isPublicUser && section.label === "Home" ? dashboardTasks.length : 0;
              return (
                <Tooltip key={section.label} title={section.label} placement="right">
                  <TooltipTrigger
                    onPress={() => goToSection(section)}
                    aria-label={section.label}
                    className={cx(
                      "relative flex size-12 items-center justify-center rounded-lg transition duration-100 ease-linear active:scale-[0.96]",
                      active ? "bg-brand-solid text-white" : "text-quaternary hover:bg-tertiary hover:text-primary",
                    )}
                  >
                    {Icon && <Icon className="size-5" />}
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-error-solid text-[10px] font-semibold tabular-nums text-white">
                        {badgeCount}
                      </span>
                    )}
                  </TooltipTrigger>
                </Tooltip>
              );
            })}
          </nav>
        );

        if (activeSection === "Home") {
          return (
            <Tabs orientation="vertical" selectedKey={homeTab} onSelectionChange={setHomeTab} className="flex flex-1 overflow-hidden">
              {iconRail}
              <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
                <div className="flex flex-col gap-1">
                  <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
                  <TabList aria-label="Home views" orientation="vertical" type="button-brand" fullWidth className="w-full">
                    <Tab id="dashboard" label="My BioData" icon={User01} />
                    <Tab id="overview" label="Flora and Fauna Dashboard" icon={PieChart03} />
                  </TabList>
                </div>
                <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
                  {registeredUserFooterLinks.map((link) => (
                    <p key={link}>{link}</p>
                  ))}
                </div>
              </aside>
              <main className="flex flex-1 flex-col overflow-y-auto">
                <HomeTabPanels />
              </main>
            </Tabs>
          );
        }

        return (
          <div className="flex flex-1 overflow-hidden">
            {iconRail}

            {/* ── Contextual sidebar: the focused tree view when on Projects (same tree/styling as
                project-detail's own sidebar, opened to reveal this page's own record),
                otherwise the selected section's children (nav chrome - not pixel-matched) ── */}
            <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
              <div className="flex flex-col gap-1">
                <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">
                  {activeSection === "Projects" ? "Adelaide Hills Bushland Survey" : activeSectionNode.label}
                </p>
                {activeSection === "Projects" ? (
                  <div className="flex flex-col gap-3">
                    <Input
                      size="sm"
                      placeholder={recordSearchPlaceholder}
                      icon={SearchMd}
                      value={recordQuery}
                      onChange={setRecordQuery}
                      aria-label="Search records"
                    />
                    {recordQuery && filteredRecordForest.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
                        <FileSearch01 className="size-5 text-fg-quaternary" />
                        <p className="text-xs text-tertiary">No records match &ldquo;{recordQuery}&rdquo;. Try a different name, ID, or record type.</p>
                      </div>
                    ) : (
                      <TreeView
                        aria-label="Adelaide Hills Bushland Survey records, grouped by type"
                        key={recordQuery}
                        showConnectors
                        onAction={handleTreeAction}
                        defaultExpandedKeys={recordExpandedKeys}
                        className="w-full"
                      >
                        {filteredRecordForest.map((node) => renderGroupedNode(node, CURRENT_RECORD_ID))}
                      </TreeView>
                    )}
                  </div>
                ) : (
                  activeSectionNode.items?.map((item) => <NavTree key={item.label} node={item} depth={1} />)
                )}
              </div>
              <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
                {registeredUserFooterLinks.map((link) => (
                  <p key={link}>{link}</p>
                ))}
              </div>
            </aside>

            <main className="flex flex-1 flex-col overflow-y-auto">
              {activeSection === "Projects" ? (
                <>
                  <div className="p-6 pb-0">
                    <Link
                      href={roleHref("/pages/project-detail")}
                      className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary"
                    >
                      <ArrowNarrowLeft className="size-4" />
                      Back to Adelaide Hills Bushland Survey
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1 p-6 pb-0">
                    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Observation</p>
                    <h1 className="text-2xl font-medium text-primary">{observation.name}</h1>
                  </div>

                  <div className="flex flex-wrap items-start gap-8 border-b border-secondary p-6">
                    <MetaField label="Observation ID">{observation.id}</MetaField>
                    <MetaField label="Type">
                      <Badge size="sm" color="brand">
                        {observation.type}
                      </Badge>
                    </MetaField>
                    <MetaField label="Recorded">{observation.recordedDate}</MetaField>
                    <MetaField label="Status">
                      <BadgeWithDot size="sm" color="success">
                        {observation.status}
                      </BadgeWithDot>
                    </MetaField>
                  </div>

                  <div className="p-6">
                    <Accordion items={observationAccordionItems} defaultOpenKeys={flagSection ? [flagSection] : []} />
                  </div>
                </>
              ) : (
                <SectionPlaceholder node={activeSectionNode} />
              )}
            </main>
          </div>
        );
      })()}
    </div>
  );
}

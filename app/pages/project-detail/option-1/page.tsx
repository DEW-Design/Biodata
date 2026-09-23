"use client";

import type { FC, ReactNode, Key as ReactKey } from "react";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Key } from "react-aria-components";
import { Button as AriaButton, Dialog, DialogTrigger, Tabs } from "react-aria-components";
import { TabList, Tab, TabPanel, Tabs as ContentTabs } from "@/components/application/tabs/tabs";
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
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
  User01,
  PieChart03,
  Mail01,
  Phone01,
  Calendar,
  MarkerPin01,
  Route,
  Grid01,
  Compass,
  Flag03,
  Map01,
} from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { BadgeWithDot, CountBadge } from "@/components/base/badges/badges";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@/components/base/table/table";
import { Accordion } from "@/components/base/accordion/accordion";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { HomeTabPanels } from "@/app/pages/_shared/home-tab-panels";
import { dashboardTasks } from "@/app/pages/_shared/home-dashboard";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { GuestActionButton } from "@/app/pages/_shared/guest-action-gate";
import { GuestAuthActions } from "@/app/pages/_shared/guest-auth-actions";
import { ArtefactCarousel, ArtefactLightbox, type Artefact } from "@/app/pages/_shared/artefact-lightbox";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { MapView } from "@/app/pages/_shared/map-view";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";

import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { orgLabelForRole } from "@/lib/user-role";
import { registeredUserNav, publicUserNav, registeredUserAccountMenu, registeredUserFooterLinks, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// This page's project is the same Adelaide Hills project the map search dataset models - its real
// coordinates back the shared Location Details table in the Locations accordion.
const adelaideHillsProject = searchEvents.find((e) => e.id === "adelaide-hills");

// One project's detail view, on the sidebar-nav shell - same three-column chrome as
// project-list/option-1 (icon rail + contextual sidebar + main content), reused verbatim. Reached
// by clicking "Adelaide Hills Bushland Survey" from project-list/option-1 - the other three rows
// there aren't wired yet, same "only link what has a real page" convention used everywhere else.
//
// Content model (not layout) is drawn from the other designer's Projects Figma
// (https://www.figma.com/design/wer8CgO1UoCH3aQw2jQkdy/..., node 2266-40134) - per the user
// directly: reference it for content only, ignore its visual design, apply our own patterns. What's
// reused is the shape of a project: identifying metadata (ID, dates, status, publisher), a Project
// Details block, an Overview (abstract + geographic scope), and a nested-records tree of survey
// record types (Site, Observation, Occurrence, Visit, Transect, Quadrat, Block, Ramble, Trap,
// Custom Event) that live inside it. That tree renders with the same NavTree expand/collapse
// pattern already used for the registered-user IA (see dashboard/option-1) rather than the Figma's
// own tree-explorer widget - our pattern, their content.
//
// One concrete example project, not a dynamic per-ID route - same "one hardcoded instance, not a
// generalized system yet" scope as the rest of these explorations.

const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  "Data Licencing Agreement (DLA)": FileLock01,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};

// The nested-records tree that lives inside this project renders with the real `TreeView`
// component (components/application/tree-view/tree-view.tsx), composed inline where it's used
// below - not the hand-rolled NavTree used for the registered-user IA sidebar elsewhere on this
// page. That distinction matters: NavTree is nav chrome (IA not decided yet, exempt from real-
// component fidelity per CONTEXT.md); this tree is actual project content (a real data hierarchy),
// which is exactly the "contained widget" case that must use a real component when one exists -
// flagged directly by the user after this was built with NavTree instead. Content is real
// survey-methodology vocabulary (Site/Observation/Occurrence/Visit/Transect/Quadrat/Block/Ramble/
// Trap/Custom Event) drawn from the Figma reference in the file header comment, not invented.

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
        // Neutral `bg-tertiary` hover, matching the Home Tabs switcher's own hover state
        // (components/application/tabs/tabs.tsx's `button-brand` type) and the primary icon
        // rail's non-active hover - previously this used the brand-tinted fill instead, flagged
        // directly by the user as a mismatch against the icon rail sitting next to it.
        className="rounded-md py-2 text-sm font-medium text-primary transition-colors duration-100 ease-linear hover:bg-tertiary"
      >
        {node.label}
      </Link>
    ) : (
      // No real page yet - text-tertiary (not text-primary/font-medium like the link above) so
      // the sidebar itself shows which of its items are actual destinations, not just labels
      // holding a place in the IA.
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

// ── Contextual sidebar records tree: "grouped by type + search" - decided from /proto/project-
// sidebar (see CONTEXT.md's entry for the full rejected-options list). Below TRUNCATE_AT records
// shown per type at any one level, the rest are named ("+N more") rather than rendered - this
// project's real data never reaches that cap, but the mechanism is real, not decorative, so it
// doesn't silently break the day a project does. Search filters across the whole tree and
// auto-expands only the branches (including type buckets) that contain a match.
//
// CORRECTED record model (2026-09-14, user direct - see the project_projects_data_model memory for
// the full reasoning): Dataset is not a tree level - "we're not worried too much about the dataset
// (which is just treated as a template to ingest data)" - so the old Dataset > Site > Sub-site
// nesting, and "Sub-site" as a concept, are both gone. A project directly contains 3 kinds of
// record: **Event** (5 types: Site, Transect, Ramble, Quadrat, Visit - Site is just one Event type
// now, not a special top-of-hierarchy container), **Occurrence** (Individual, Population), and
// **Observation** (Individual, Non-biotic, Community, Population). "Block", "Trap", and "Custom
// Event" no longer exist as types. Nesting rule, stated exactly by the user: "An event can have
// observations or occurrences or both. However, an event cannot be a child of an observation or
// occurrence" - Events can nest inside other Events (Site > Visit > Transect/Quadrat/Ramble, real
// survey methodology: place > field trip > survey method) and can have Observations/Occurrences as
// children, but never the reverse. The tree below is now an array of Site (Event) roots directly,
// not Dataset roots - `projectDatasets` further down stays a flat, separate attribution table (who
// uploaded what, when), decoupled from this browsable tree, matching "dataset = ingestion
// template," not a container.
type RecordType = "Sites" | "Visits" | "Observations" | "Occurrences" | "Transects" | "Quadrats" | "Rambles";

const recordTypeMeta: Record<RecordType, { icon: FC<{ className?: string }> }> = {
  Sites: { icon: Map01 },
  Visits: { icon: Calendar },
  Observations: { icon: Eye },
  Occurrences: { icon: MarkerPin01 },
  Transects: { icon: Route },
  Quadrats: { icon: Grid01 },
  Rambles: { icon: Compass },
};

const recordTypes = Object.keys(recordTypeMeta) as RecordType[];

// Built from recordTypeMeta, not hand-typed, so the copy can't drift from the actual set of
// searchable record types - flagged directly by the user: a generic "Search records…" didn't say
// what a search here actually covers. Visually this runs past the sidebar's width and truncates;
// the separate aria-label below stays short and is announced in full regardless.
const recordSearchPlaceholder = `Search ${recordTypes
  .slice(0, -1)
  .map((t) => t.toLowerCase())
  .join(", ")}, or ${recordTypes[recordTypes.length - 1].toLowerCase()}…`;

interface RecordNode {
  id: string;
  type: RecordType;
  label: string;
  children?: RecordNode[];
}

// "Observation OBS094 · Individual" (id "obs-094") is the one node with a real page behind it -
// app/pages/observation-detail/option-1, the concrete "Individual Observation" record that page
// documents field-for-field. Every other node here is honest content with nowhere real to go yet -
// selecting one shows what it is and where it sits (via SelectedRecordPanel below), not a fake link.
// Two Site (Event) roots directly, matching the corrected model above - no Dataset/Sub-site wrapper.
const projectRecordTree: RecordNode[] = [
  {
    id: "site",
    type: "Sites",
    label: "Site SU00501",
    children: [
      { id: "obs-094", type: "Observations", label: "Observation OBS094 · Individual" },
      { id: "obs-nonbiotic", type: "Observations", label: "Observation OBS094 · Non-biotic" },
      { id: "obs-community", type: "Observations", label: "Observation OBS094 · Community" },
      { id: "occ-individual", type: "Occurrences", label: "Occurrence OBS094 · Individual" },
      { id: "occ-population", type: "Occurrences", label: "Occurrence OBS094 · Population" },
      {
        id: "visit",
        type: "Visits",
        label: "Visit VU00501",
        children: [{ id: "visit-obs", type: "Observations", label: "Observation OBS095 · Individual" }],
      },
      { id: "transect", type: "Transects", label: "Transect TR00501" },
      { id: "quadrat", type: "Quadrats", label: "Quadrat QR00501" },
      { id: "ramble", type: "Rambles", label: "Ramble RMB00501" },
    ],
  },
  {
    id: "site-777",
    type: "Sites",
    label: "Site SU00777",
    children: [
      { id: "inc-obs-1", type: "Observations", label: "Observation INC-0231 · Individual" },
      { id: "inc-obs-2", type: "Observations", label: "Observation INC-0232 · Community" },
    ],
  },
];

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
  const selfMatch = node.label.toLowerCase().includes(q);
  if (selfMatch) return node;
  const filteredChildren = node.children?.map((c) => filterRecordTree(c, query)).filter((c): c is RecordNode => c !== null) ?? [];
  return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
}

// Runs filterRecordTree (still single-root logic) across every Dataset root and drops any that
// come back empty - same "search across the whole tree" behavior as before, just over an array of
// roots instead of one.
function filterRecordForest(nodes: RecordNode[], query: string): RecordNode[] {
  return nodes.map((n) => filterRecordTree(n, query)).filter((n): n is RecordNode => n !== null);
}

// Mirrors renderGroupedNode's own bucketing decision so the synthetic type-bucket ids it introduces
// (`${node.id}__${type}`) are included too - otherwise a search match sitting inside a bucket would
// resolve correctly but stay visually collapsed.
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

// `currentKey` just drives a plain highlight (bg-secondary, the same treatment react-aria's own
// `isSelected` would apply) - no `selectionMode` on the tree itself, so no checkbox. Clicking a row
// fires the tree's own `onAction` (see the TreeView element below), not a selection toggle; a
// checkbox implies "include this in a bulk action," which isn't what a single click here means -
// flagged directly by the user off a screenshot ("what's with the checkbox tree view? there's no
// checkboxes in production").
function renderGroupedNode(n: RecordNode, currentKey: string | null): ReactNode {
  const Icon = recordTypeMeta[n.type].icon;
  const hasChildren = !!n.children && n.children.length > 0;
  // bg-brand-50/text-brand-secondary, not react-aria's own isSelected treatment (bg-secondary) -
  // this sidebar's own <aside> background is already bg-secondary, so that treatment was
  // invisible here. bg-brand-secondary (the same pairing NavTree uses elsewhere in this file)
  // turned out not to render at all in this spot - computed style came back identical to the
  // aside's own background despite the class being present in the DOM, a real gap worth flagging
  // separately - bg-brand-50 is the token already confirmed working elsewhere this session
  // (ContinueStrip, the artefact lightbox's own active-row state).
  const highlightClassName = "bg-brand-50 text-brand-secondary";

  if (!hasChildren) {
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
        <TreeView.ItemContent icon={Icon} className={n.id === currentKey ? highlightClassName : undefined}>
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
        <TreeView.ItemContent icon={Icon} className={n.id === currentKey ? highlightClassName : undefined}>
          {n.label}
        </TreeView.ItemContent>
        {n.children!.map((child) => renderGroupedNode(child, currentKey))}
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={n.id} id={n.id} textValue={n.label}>
      <TreeView.ItemContent icon={Icon} className={n.id === currentKey ? highlightClassName : undefined}>
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
            <TreeView.ItemContent icon={TypeIcon} action={<CountBadge count={items.length} />} className={bucketId === currentKey ? highlightClassName : undefined}>
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

interface ChainCrumb {
  id: string;
  type: RecordType;
  label: string;
}

// The one node with a real page behind it - clicking it navigates for real instead of showing
// SelectedRecordPanel's honest placeholder. See projectRecordTree's own comment.
const REAL_PAGE_RECORD_ID = "obs-094";

// Walks the same grouping renderGroupedNode uses, so a synthetic bucket id ("<parentId>__<type>")
// resolves to a real crumb too ("...Sub-site SU00501-A / Observations"), not just leaf records.
// Returns the full root-to-target chain, or null if the id isn't in the tree.
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

// What the main column shows when a record without a real page is selected in the sidebar tree -
// an honest placeholder (real breadcrumb chain above it, real record label/type), not a fabricated
// detail view. The one record that DOES have a real page (Observation OBS094 · Individual) never
// reaches this - selecting it navigates for real instead (see the TreeView's onAction below).
function SelectedRecordPanel({ crumb, onBack }: { crumb: ChainCrumb; onBack: () => void }) {
  const Icon = recordTypeMeta[crumb.type].icon;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <FeaturedIcon icon={Icon} color="brand" theme="modern" size="lg" />
      <h1 className="text-lg font-medium text-primary">{crumb.label}</h1>
      <p className="max-w-sm text-sm text-tertiary">
        This record&apos;s own detail view isn&apos;t built yet - only Observation OBS094 · Individual has one so far
        (app/pages/observation-detail/option-1).
      </p>
      <Button color="link-color" size="sm" iconLeading={ArrowNarrowLeft} onClick={onBack}>
        Back to project overview
      </Button>
    </div>
  );
}

// Same 4 example projects as project-list/option-1 - only this one has a real detail page, so it's
// the only clickable row, same "only wire what has a real page" convention used everywhere else.
const switcherProjects = [
  { name: "Adelaide Hills Bushland Survey", href: "/pages/project-detail/option-1" },
  { name: "Coorong Wetlands Bird Count" },
  { name: "Flinders Ranges Reptile Atlas" },
  { name: "Kangaroo Island Recovery Monitoring" },
];

// The breadcrumb's "Projects" segment (the category crumb, not the specific project) as a
// switcher, Supabase-style - click it for a searchable list of your other projects and jump
// straight to one, rather than backing out to the projects list first. The caret lives on this
// parent crumb, never on the child/current-project name next to it - that's a static label with no
// switcher behaviour, since dropdown affordances belong to the navigational level, not the data
// instance. Familiar pattern per the user's "reduce cognitive overload, build on what people
// already know" steer.
// Controlled DialogTrigger (isOpen/onOpenChange), not uncontrolled like ProfileMenu below - this
// one's items are real Links that should also close the dropdown on click, which needs `open` in
// our own state rather than left entirely to react-aria. Outside-click/Escape dismissal still
// comes from DialogTrigger/Popover itself either way.
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
      {/* size="auto": sm/md/lg apply a `max-h-*!` (important) that a later className can't
          override - confirmed via computed styles, not just visual inspection, after the first
          "just add a bigger max-h" attempt silently lost to the !important and kept clipping
          "View all projects". This popover has its own fixed header (search) + footer (view all)
          around one scrollable region (the list, capped to ~5-6 rows via max-h-60 below) - it
          should size to its content, not be capped as a whole. */}
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
              href={roleHref("/pages/project-list/option-1")}
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

// ── The chain breadcrumb - vetted at /proto/project-detail and rolled in here per the user
// directly ("Breadcrumb's fine too - I like how it is... this can be rolled in all together once
// we sort out the project detail page"). Same visual language as the real, shared Breadcrumb
// (components/scaffold/breadcrumb.tsx): a plain Home link, an org pill, "/" separators, the current
// crumb in text-primary - genuinely different shape, though, since that component is deliberately
// fixed at 3 levels (Home / section / current), which a record this many levels deep (Dataset >
// Site > Sub-site > Observation, or deeper once a bucket is selected) can't fit. Only rendered for
// the Projects section - Home and every other section still use the original, fixed-shape
// Breadcrumb (see the header's own conditional below). Long chains collapse everything except the
// first crumb after the project (broadest new context) and the last one (the thing you're actually
// looking at) behind a "…" overflow menu - same convention GitHub/Finder-style path bars use for
// this exact problem, not invented. ──
function ChainBreadcrumb({ chain, onSelectCrumb, orgLabel }: { chain: ChainCrumb[]; onSelectCrumb: (id: string | null) => void; orgLabel?: string }) {
  const roleHref = useRoleHref();
  // 1, not 2 - flagged directly by the user off a screenshot ("breadcrumb breaks the layout"): a
  // 2-deep chain (Dataset + Site) always showed both in full, and a real dataset name
  // ("Fleurieu Transect Survey — Autumn 2025") is long enough on its own to push the header's
  // search bar onto its own line. Collapsing to just the single deepest crumb keeps this nav's own
  // width small in the common case; `truncate` below is the second layer of defense for whatever
  // still doesn't fit (a genuinely long leaf record name).
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
      {chain.length === 0 ? (
        <span className="min-w-0 truncate text-primary">Adelaide Hills Bushland Survey</span>
      ) : (
        <button type="button" onClick={() => onSelectCrumb(null)} className="min-w-0 shrink truncate hover:text-primary">
          Adelaide Hills Bushland Survey
        </button>
      )}
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

// Two honest states, not one: a section either has a real page elsewhere (Home -> dashboard,
// Projects -> project-list) - say so and link to it, don't claim it's unscoped when it
// demonstrably isn't - or it genuinely has no page yet, which does get the "not scoped" copy.
// Conflating the two read as a bug: clicking Home from another screen showed "hasn't been scoped
// yet" directly above a working "Go to Home" link.
function SectionPlaceholder({ node }: { node: NavNode }) {
  // A section can itself be the link (a leaf like Home) or have one keyed child (like Projects).
  const relatedLink = node.key ? node : node.items?.find((item) => item.key);
  // A bare path drops the active role - see lib/use-role-href.ts. Another instance of the same
  // dead end fixed everywhere else, missed here the first time round.
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

// The concept-level flag indicator - if an admin flags a field, a registered user sees that it's
// been flagged (an icon + tooltip), same convention now shared with
// app/pages/observation-detail/option-1's own copy of this exact component. Just the indicator -
// the real flag-management UI is separate, later work.
function FlagIndicator() {
  return (
    <Tooltip title="Flagged by an admin - this field may need review or updating">
      <span className="inline-flex shrink-0 items-center justify-center">
        <Flag03 className="size-3.5 text-fg-warning-primary" />
      </span>
    </Tooltip>
  );
}

// `fieldId` renders as a real DOM id (`field-<fieldId>`) - the anchor the Overview tab's flagged-
// concepts banner scrolls to once the Details tab's matching accordion section has been forced
// open (see flaggedConcepts/FlaggedConceptsBanner below).
function DetailRow({ label, value, flagged = false, fieldId }: { label: string; value: ReactNode; flagged?: boolean; fieldId?: string }) {
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

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-secondary p-6">
      <h2 className="text-md font-medium text-primary">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

const abstract =
  "Ongoing flora and fauna monitoring across the Adelaide Hills reserve network, tracking indicator species before and after prescribed burns. The project brings together local Landcare volunteers, DEW ecologists and university researchers to build a long-term baseline for reserve management decisions, with quarterly transect surveys feeding directly into the region's fire-recovery reporting.";

// One shared shape for every contact in this project - Data Owner and Project Manager used to be
// 4 near-identical raw tables (Primary/Additional Contact x Data Owner/Project Manager), separated
// only by a thin rule and a text label, in both the lo-fi and hi-fi references. Same "repeated
// table shapes need distinct containers, not just a label" principle from CONTEXT.md's "Design
// principles (cognitive load)" section - one real card, used 4 times with different data, so a
// contact is instantly recognisable as a contact rather than something to re-read labels to place.
interface ProjectContact {
  name: string;
  role?: string;
  email: string;
  phone: string;
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

// Adelaide Hills Bushland Survey is owned by the org whose name already appears elsewhere for this
// same project (project-list-content.tsx's "Adelaide Hills Landcare") - one real accountable
// person behind that org attribution, per the confirmed data model, not a shared org-wide login.
const dataOwner: ProjectContact = { name: "Olivia Wyatt", email: "olivia.wyatt@adelaidehillslandcare.org.au", phone: "(08) 8388 4188" };
const projectManager: ProjectContact = { name: "Maya Dewitt", role: "DEW Ecologist", email: "maya.dewitt@sa.gov.au", phone: "(08) 8204 1910" };

// One place for the identifying metadata, so the meta row under the title and the rail's "Project
// Details" card below can't drift apart - "Meta Under Title, Full Rail" decided from
// /proto/project-header (see CONTEXT.md's entry for the full rejected-options list): the meta row
// stays under the title exactly where it always was, and is deliberately repeated in the rail too,
// on the theory that a fact worth showing once is worth being scannable without scrolling back up.
//
// `fullName` is a real, distinct field from both the page's own H1 (the short display name,
// "Adelaide Hills Bushland Survey") and `abstract` below (the descriptive summary) - confirmed
// against two independent Figma references that treat Project No/Short Title/Full Project Name/
// Abstract as 4 separate fields (see the project_projects_data_model memory) - not three copies of
// the same string, which is what the newest reference's own placeholder content did.
// `attachedResources` (4) matches the real per-record rollup: this project's one Site currently has
// 2 Observations, each with 2 of its own attached artefacts - 4 total, not an independently-tracked
// project-level count (per the user directly - see that same memory).
const project = {
  id: "BD-5039",
  fullName: "Adelaide Hills Bushland Flora and Fauna Monitoring Survey",
  startDate: "3 Feb 2025",
  endDate: "—",
  status: "Active" as const,
  publishedBy: "Adelaide Hills Landcare",
  attachedResources: 4,
};

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

// Consolidated per the user directly, off a second Figma reference (bgksKvmSaVR7ZptB98LzGr's own
// "Project Details" card - see the project_projects_data_model memory) that independently landed
// on the same instinct as /proto/project-detail's "Consolidated Rail" variant they picked: one
// denser card (identity fields + Attached Resources + Events/Occurrences/Observations) beats
// splitting those counts into a separate MetricCard row above it - fewer visual blocks, same
// information, less to scan before finding the one you need.
// Grouped into 3 chunks (identity/dates, descriptive fields, activity) with a divider between
// each, rather than one flat 7-row list - a get-creative pass on the consolidated card: folding
// Events/Occurrences/Observations and Attached Resources into this one card (see the comment above
// `project`) removed 3 separate MetricCard tiles, but a flat list of 7 rows plus a 3-metric footer
// reads as a wall of text without some chunking to scan by, even inside a single card.
function ProjectDetailsCard() {
  return (
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
      </div>
      <div className="flex flex-col gap-3 border-t border-secondary pt-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-tertiary">Full Project Name</span>
          <span className="text-sm font-medium text-primary">{project.fullName}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-tertiary">Published By</span>
          <span className="text-sm font-medium text-primary">{project.publishedBy}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-secondary pt-3">
        <PropertyRow label="Attached Resources">{project.attachedResources}</PropertyRow>
        {/* Summed from projectDatasets below (the Datasets tab's own real table), not a second,
            independently-typed set of numbers - referencing it here is safe despite the textual
            order (this function only runs at render time, well after the module has finished
            evaluating every top-level const). */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-medium text-primary tabular-nums">{projectDatasets.reduce((sum, d) => sum + d.events, 0)}</span>
            <span className="text-xs text-tertiary">Events</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-medium text-primary tabular-nums">{projectDatasets.reduce((sum, d) => sum + d.occurrences, 0)}</span>
            <span className="text-xs text-tertiary">Occurrences</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-medium text-primary tabular-nums">{projectDatasets.reduce((sum, d) => sum + d.observations, 0)}</span>
            <span className="text-xs text-tertiary">Observations</span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

// Contribution is open - any registered user can add a dataset to any project, per the confirmed
// data model - so this project (like a real one would) has datasets from more than one person, not
// a single owner-uploaded list. Counts sum to the same Events/Occurrences/Observations totals (6/
// 18/42) already shown elsewhere on this page - two real contributions, not two independent totals.
interface ProjectDataset {
  id: string;
  name: string;
  contributor: string;
  contributorInitials: string;
  uploadedDate: string;
  events: number;
  occurrences: number;
  observations: number;
}

const projectDatasets: ProjectDataset[] = [
  {
    id: "fleurieu-autumn-2025",
    name: "Fleurieu Transect Survey — Autumn 2025",
    contributor: "Olivia Wyatt",
    contributorInitials: "OW",
    uploadedDate: "4 Feb 2025",
    events: 4,
    occurrences: 12,
    observations: 28,
  },
  {
    id: "cleland-incidental",
    name: "Cleland Incidental Observations",
    contributor: "Maya Dewitt",
    contributorInitials: "MD",
    uploadedDate: "18 Mar 2025",
    events: 2,
    occurrences: 6,
    observations: 14,
  },
];

// One Accordion item per fill-once reference field group (Data Collection Scope, Locations,
// Permit, URI/DOI) - collapsed by default, so the "Details" tab isn't a forced scroll through
// fields most visits don't need, per the same cognitive-load principles. Fields with no honest
// value are omitted entirely (Method Details, exact survey-extent coordinates) rather than shown
// as a stray "-" - this project doesn't have a DOI yet since it's still ongoing, which is the
// point: a field can genuinely not apply yet, and the UI should say that plainly instead of
// padding out empty rows.
const detailAccordionItems = [
  {
    id: "data-collection",
    title: "Data Collection Scope",
    content: (
      <div className="flex flex-col gap-3">
        <DetailRow label="Project Focus Areas" value="Biological" />
        <DetailRow label="Targeted Species" value="Yellow-footed Antechinus (Antechinus flavipes), Southern Brown Bandicoot (Isoodon obesulus)" flagged fieldId="targeted-species" />
        <DetailRow label="Method of Data Collection" value="Structured transect surveys" />
        <DetailRow label="Limitations and biases" value="Surveys conducted only in accessible reserve areas; nocturnal species may be under-detected." />
        <DetailRow label="Raw Data Storage Details" value="DEW BioData SA repository" />
      </div>
    ),
  },
  {
    id: "locations",
    title: "Locations",
    content: (
      <div className="flex flex-col gap-3">
        {/* Same shared coordinate table as every other record type - this project's real
            coordinates come from the same Adelaide Hills project in the search dataset. */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
          <span className="w-56 shrink-0 text-sm text-tertiary sm:pt-2.5">Location Details</span>
          <div className="min-w-0 flex-1">
            <LocationDetailsTable lat={adelaideHillsProject?.lat} lon={adelaideHillsProject?.lon} />
          </div>
        </div>
        <DetailRow label="Study Area" value="Cleland Conservation Park and surrounding reserves, Adelaide Hills" flagged fieldId="study-area" />
      </div>
    ),
  },
  {
    id: "permit",
    title: "Permit",
    content: (
      <div className="flex flex-col gap-3">
        <DetailRow label="Permit Type" value="Scientific Research Permit" />
        <DetailRow label="Permit No." value="SA-2025-0142" />
      </div>
    ),
  },
  {
    id: "uri-doi",
    title: "URI / DOI",
    content: <DetailRow label="URI / DOI Number" value="Not yet assigned - this project hasn't been published." />,
  },
];

// Empty for this project, deliberately - an open community Landcare survey with no embargo or
// sensitive species, a real, honest example of the "None" state rather than every project needing
// something to restrict. The Restrictions tab renders one plain line for this case instead of 5
// empty restriction-type tables (Embargo/Species/Location/Project Data/Other), which is what both
// the lo-fi and hi-fi references did regardless of whether a given restriction actually applied.
const projectRestrictions: { id: string; title: string; content: ReactNode }[] = [];

// ── Artefacts - vetted at /proto/project-detail, rolled in here per the user directly ("Images and
// artefacts... this bit needs to be rolled into our current instance of option 1"). An artefact
// belongs to whichever specific record it was uploaded against (an Observation, an Occurrence...),
// not the project itself - this list is the real rollup: `project.attachedResources` (4) below
// exactly matches these 4 rows, 2 from Observation OBS094 · Individual and 2 from Observation
// OBS095 (see the project_projects_data_model memory for the full reasoning). No real photo asset
// exists in this build yet (see public/ - only the DEW lockup/logo and one geographic-scope
// screenshot) - image artefacts get an honest placeholder tile (an icon on a neutral surface)
// rather than a fake photo, same "no invented lookalikes" rule as everywhere else.
//
// The modal itself (`ArtefactLightbox`/`ArtefactCarousel`, `Artefact` type) now lives in
// app/pages/_shared/artefact-lightbox.tsx - extracted once the map search results page's own
// Artefacts and Attachments tab needed the exact same modal, per direct request, rather than a
// second, diverging copy. Its metadata panel fields were also corrected there to match Figma's
// "Artefacts and Attachments Overlay" frame exactly - see that file's own comment for the full
// field-by-field mapping. `identifierUrl` points at a real, already-established domain this
// codebase uses elsewhere for BDBSA content (data.environment.sa.gov.au) rather than a fabricated
// one; `licenseUrl` is the real Creative Commons licence URL Figma's own frame shows, not a short
// label.
const artefacts: Artefact[] = [
  {
    id: "photopoint-blue-014",
    title: "Photopoint - Site BLUE-014",
    type: "image",
    size: "1.2 MB",
    recordLabel: "Observation OBS094 · Individual",
    metaTitle: "Photopoint image of the BLUE-014 monitoring site, Adelaide Hills Bushland Survey",
    created: "14 Dec 2024, 16:13",
    creator: "Olivia Wyatt",
    objectId: "AHL:AHL:BLUE-014",
    description: "Photopoint image of the BLUE-014 monitoring site, Adelaide Hills Bushland Survey",
    format: "image/jpeg",
    identifierUrl: "https://data.environment.sa.gov.au/biodata/BDR-00897",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    publisher: "Adelaide Hills Landcare",
    rightsHolder: "Adelaide Hills Landcare",
    dcType: "StillImage",
    bioDataId: "BDR-00897",
  },
  {
    id: "survey-instructions",
    title: "Survey instructions",
    type: "pdf",
    size: "200 KB",
    recordLabel: "Observation OBS094 · Individual",
    metaTitle: "Survey instructions for Observation OBS094 (Individual) field protocol",
    created: "3 Feb 2025, 09:02",
    creator: "Maya Dewitt",
    objectId: "DEW:DEW:SURVEY-OBS094",
    description: "Survey instructions for Observation OBS094 (Individual) field protocol",
    format: "application/pdf",
    identifierUrl: "https://data.environment.sa.gov.au/biodata/BDR-00891",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    publisher: "DEW Biodiversity Team",
    rightsHolder: "DEW Biodiversity Team",
    dcType: "Text",
    bioDataId: "BDR-00891",
  },
  {
    id: "slope-recording",
    title: "Slope recording",
    type: "video",
    size: "6.4 MB",
    recordLabel: "Observation OBS095",
    metaTitle: "Slope recording video for Observation OBS095 site assessment",
    created: "18 Mar 2025, 11:52",
    creator: "Olivia Wyatt",
    objectId: "AHL:AHL:SLOPE-OBS095",
    description: "Slope recording video for Observation OBS095 site assessment",
    format: "video/mp4",
    identifierUrl: "https://data.environment.sa.gov.au/biodata/BDR-00903",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    publisher: "Adelaide Hills Landcare",
    rightsHolder: "Adelaide Hills Landcare",
    dcType: "MovingImage",
    bioDataId: "BDR-00903",
  },
  {
    id: "slope-measurement",
    title: "Slope measurement",
    type: "spreadsheet",
    size: "3.4 MB",
    recordLabel: "Observation OBS095",
    metaTitle: "Slope measurement dataset for Observation OBS095 site assessment",
    created: "18 Mar 2025, 11:55",
    creator: "Maya Dewitt",
    objectId: "DEW:DEW:SLOPE-OBS095",
    description: "Slope measurement dataset for Observation OBS095 site assessment",
    format: "application/vnd.ms-excel",
    identifierUrl: "https://data.environment.sa.gov.au/biodata/BDR-00904",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    publisher: "DEW Biodiversity Team",
    rightsHolder: "DEW Biodiversity Team",
    dcType: "Dataset",
    bioDataId: "BDR-00904",
  },
];

// Which Details-tab accordion item a flagged field's `fieldId` lives inside - so a banner click can
// force that section open (via Accordion's new controlled `openKeys`) before scrolling to the
// field itself. Mirrors app/pages/observation-detail/option-1's own flaggedFieldSections map for
// its own accordion.
const detailFieldSections: Record<string, string> = {
  "targeted-species": "data-collection",
  "study-area": "locations",
};

// The full roll-up of flagged concepts touching this project - some are the project's own fields
// (Details tab, above), some belong to a specific record inside it (this project's one real
// Observation so far) - same "counts/artefacts roll up from records to the project" principle as
// Attached Resources (see project.attachedResources's own comment). Flagged directly by the user:
// a bottom-of-page list was the wrong home for this - "similar to the continue where you left off
// banner... there's 3 flagged concepts. When user clicks to investigate, it opens the <mock
// observation page>... and scrolls directly to that particular concept." `href` targets are built
// with the active role manually (not `roleHref`, which assumes no existing query string) since
// this is the one place a link needs both `userRole` and `flag` together.
interface FlaggedConcept {
  id: string;
  label: string;
  location: string;
  kind: "details-tab" | "observation";
}

const flaggedConcepts: FlaggedConcept[] = [
  { id: "targeted-species", label: "Targeted Species", location: "Project · Details tab", kind: "details-tab" },
  { id: "study-area", label: "Study Area", location: "Project · Details tab", kind: "details-tab" },
  { id: "pouch-status", label: "Pouch Status", location: "Observation OBS094 · Individual", kind: "observation" },
  { id: "location-method", label: "Location Method", location: "Observation OBS094 · Individual", kind: "observation" },
];

// A strip, not a bottom-of-page block - same visual family as ContinueStrip
// (app/pages/_shared/home-dashboard.tsx): a light warning-tinted background pairing with the
// FlagIndicator's own warning-coloured icon (same "the surrounding surface matches the content's
// real semantic colour" reasoning ContinueStrip's bg-brand-50 already established, not an
// invented one-off treatment), a short summary, and a "Review" control that opens the full list.
function FlaggedConceptsBanner({ onSelect }: { onSelect: (concept: FlaggedConcept) => void }) {
  const [open, setOpen] = useState(false);

  if (flaggedConcepts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-primary">
        <Flag03 className="size-4 shrink-0 text-fg-warning-primary" />
        <span>
          <span className="font-semibold">{flaggedConcepts.length} flagged concepts</span> need review across this project
        </span>
      </div>
      <DialogTrigger isOpen={open} onOpenChange={setOpen}>
        <AriaButton className="flex items-center gap-1 rounded-md text-sm font-semibold text-brand-secondary outline-brand hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2">
          Review
          <ArrowNarrowRight className="size-4" />
        </AriaButton>
        <Popover size="sm" className="w-72 p-1">
          <Dialog className="outline-hidden">
            {flaggedConcepts.map((concept) => (
              <button
                key={concept.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect(concept);
                }}
                className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left hover:bg-secondary"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Flag03 className="size-3.5 shrink-0 text-fg-warning-primary" />
                  {concept.label}
                </span>
                <span className="pl-5 text-xs text-tertiary">{concept.location}</span>
              </button>
            ))}
          </Dialog>
        </Popover>
      </DialogTrigger>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProjectDetail />
    </Suspense>
  );
}

function ProjectDetail() {
  const router = useRouter();
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  // public-user reads a different, smaller nav tree entirely - see dashboard/option-1's copy of
  // this same branch for the full rationale. Doesn't change this page's own "Projects" content
  // (this project's detail + records tree) - that's already a single view for every role, not the
  // two-peer-tab pattern dashboard/option-1 and project-list/option-1 have to branch around.
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Projects");
  const [homeTab, setHomeTab] = useState<Key>("dashboard");
  const [abstractExpanded, setAbstractExpanded] = useState(false);
  const [detailTab, setDetailTab] = useState<Key>("overview");
  const [recordQuery, setRecordQuery] = useState("");
  // Controlled (not the Accordion's own default uncontrolled state) so a flagged-concept click can
  // force the right section open even after this page has already mounted - see
  // FlaggedConceptsBanner/handleFlaggedConceptSelect below.
  const [detailOpenKeys, setDetailOpenKeys] = useState<Set<ReactKey>>(new Set());
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  // A flagged concept either lives on this same page (the Details tab) or on a specific record's
  // own page (so far, only the Observation deep-dive) - two different "jump to it" mechanics, same
  // as the concept's own two possible `kind`s. Same "let the real open animation finish before
  // scrolling" delay as observation-detail/option-1's own copy of this pattern.
  const handleFlaggedConceptSelect = (concept: FlaggedConcept) => {
    if (concept.kind === "details-tab") {
      setDetailTab("details");
      setDetailOpenKeys(new Set([detailFieldSections[concept.id]]));
      setTimeout(() => {
        document.getElementById(`field-${concept.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    } else {
      router.push(`/pages/observation-detail/option-1?userRole=${role}&flag=${concept.id}`);
    }
  };

  // Grouped by type + search, decided from /proto/project-sidebar - filtered once per keystroke,
  // not on every render of the tree, and the auto-expand set is derived from the same filtered
  // result so a match's containing buckets open without needing separate state to track them. Now
  // over an array of Dataset roots (filterRecordForest), not the single Site object this used to be.
  const filteredRecordForest = useMemo(() => filterRecordForest(projectRecordTree, recordQuery), [recordQuery]);

  // Selecting a record drives the breadcrumb chain (ChainBreadcrumb) and swaps the main column to
  // SelectedRecordPanel - unless it's the one record with a real page of its own
  // (REAL_PAGE_RECORD_ID), which navigates there for real instead of ever setting this state.
  // Fixes a real bug flagged directly by the user: "when I click on an observation... it goes
  // nowhere right now" - every leaf in this tree was purely structural before, no selection or
  // action at all.
  // Initial value can come from `?select=<id>` - the focused tree view on
  // app/pages/observation-detail/option-1 links back here with this for any record besides a
  // Dataset (Datasets go to the plain Overview instead - see that page's own comment on why).
  const searchParams = useSearchParams();
  const [selectedRecordKey, setSelectedRecordKey] = useState<string | null>(() => searchParams.get("select"));
  const recordChain = useMemo(() => (selectedRecordKey ? (findRecordChain(projectRecordTree, selectedRecordKey) ?? []) : []), [selectedRecordKey]);
  const currentRecordCrumb = recordChain.length > 0 ? recordChain[recordChain.length - 1] : null;

  // A `?select=` deep-link into something deeper than the default expand set needs its own
  // ancestor chain expanded too, or the sidebar would show the highlighted row without ever
  // revealing it.
  const recordExpandedKeys = useMemo(
    () =>
      recordQuery
        ? filteredRecordForest.flatMap((n) => collectGroupedContainerIds(n))
        : Array.from(new Set(["site", ...recordChain.map((c) => c.id)])),
    [recordQuery, filteredRecordForest, recordChain],
  );

  // The tree's own `onAction` (react-aria's row-activation event, fired on a plain click when the
  // tree has no `selectionMode` set) rather than selection - see renderGroupedNode's own comment
  // for why: a checkbox implies "include this in a bulk action," not "show me this one."
  const handleRecordAction = (key: Key) => {
    const nextKey = String(key);
    if (nextKey === REAL_PAGE_RECORD_ID) {
      router.push(roleHref("/pages/observation-detail/option-1"));
      return;
    }
    setSelectedRecordKey((current) => (current === nextKey ? null : nextKey));
  };

  // Artefacts carousel/lightbox - see the artefacts array's own comment for the real per-record
  // rollup this reflects.
  const [artefactLightboxIndex, setArtefactLightboxIndex] = useState<number | null>(null);

  // Home and Projects both have a real page of their own - clicking either now actually navigates
  // there instead of faking the content in place. Unlike dashboard/project-list, this page has no
  // "own" nav key to stay put for (it's reached by drilling into one specific project, not a
  // generic destination), so both always navigate - "Projects" from here means the real projects
  // list, not re-showing this same project's own detail. Sections with no real page yet stay a
  // local, in-place section switch. See dashboard/option-1's copy of this fix for the full
  // rationale - flagged directly by the user off a screenshot. `roleHref` (not a bare path) so the
  // active role survives the navigation - see lib/use-role-href.ts.
  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setActiveSection(section.label);
    }
  };

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header ── */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
        {/* min-w-0 so this block can actually shrink (and the breadcrumb inside it truncate)
            instead of forcing the header's own flex-wrap to push "search + actions" onto a second
            row - the concrete "breadcrumb breaks the layout" bug, since a deep record chain's
            unbounded width previously had nowhere to give. */}
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
            <ChainBreadcrumb
              chain={recordChain}
              onSelectCrumb={setSelectedRecordKey}
              orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined}
            />
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
            {/* Visible for every role, gated by click instead of by visibility for public-user -
                see app/pages/_shared/guest-action-gate.tsx / dashboard/option-1's copy for the
                full rationale. */}
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

        // Home's two views (My BioData / Flora and Fauna Dashboard) get their own Tabs boundary, mounted
        // only while Home is active - not one Tabs wrapping the whole page permanently. React-aria's
        // Tabs keeps a single internal collection for its whole lifetime; wrapping the entire
        // three-column row in a permanent Tabs while TabList only mounted conditionally (once you
        // switched to Home) broke that - a real runtime crash the first time TabList mounted
        // ("Cannot destructure property 'onAction' ... as it is undefined"). Scoping Tabs to just
        // this branch means TabList and TabPanel always mount and unmount together.
        if (activeSection === "Home") {
          return (
            <Tabs orientation="vertical" selectedKey={homeTab} onSelectionChange={setHomeTab} className="flex flex-1 overflow-hidden">
              {iconRail}

              {/* ── Contextual sidebar: Home's My BioData/Flora and Fauna Dashboard tab list (nav chrome - not pixel-matched) ── */}
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

              {/* ── Main content: Home's tab panels render the shared real dashboard content
                  (see app/pages/_shared/home-dashboard.tsx and data-overview.tsx) ── */}
              <main className="flex flex-1 flex-col overflow-y-auto">
                <HomeTabPanels />
              </main>
            </Tabs>
          );
        }

        return (
          <div className="flex flex-1 overflow-hidden">
            {iconRail}

            {/* ── Contextual sidebar: this project's nested-records tree when on Projects,
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
                        onAction={handleRecordAction}
                        defaultExpandedKeys={recordExpandedKeys}
                        className="w-full"
                      >
                        {filteredRecordForest.map((node) => renderGroupedNode(node, selectedRecordKey))}
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

            {/* ── Main content: Projects has this screen's own content - every other section is an
                honest placeholder (see SectionPlaceholder above) until it's actually scoped ── */}
            <main className="flex flex-1 flex-col overflow-y-auto">
              {activeSection === "Projects" ? (
                currentRecordCrumb ? (
                  <SelectedRecordPanel crumb={currentRecordCrumb} onBack={() => setSelectedRecordKey(null)} />
                ) : (
                <>
                  {/* "Back to projects" is column 3's own content, above everything else here -
                      not spanning the nav columns (icon rail, contextual sidebar). */}
                  <div className="p-6 pb-0">
                    <Link
                      href={roleHref("/pages/project-list/option-1")}
                      className="flex w-fit items-center gap-1.5 text-sm font-medium text-tertiary hover:text-primary"
                    >
                      <ArrowNarrowLeft className="size-4" />
                      Back to projects
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1 p-6 pb-0">
                    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
                    <h1 className="text-2xl font-medium text-primary">Adelaide Hills Bushland Survey</h1>
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

                  {/* Restructured from one continuous scroll of ~10 flat sections (Project
                      Details, Overview, Data Owner/s, Project Manager/s, Locations, Data
                      Collection Scope, Permit, URI/DOI, Privacy and Restrictions, Additional
                      Details, Comments - the full content inventory from both the lo-fi and hi-fi
                      references) into real Tabs, per CONTEXT.md's "Design principles (cognitive
                      load)" section - grouped by how it's used (Overview = checked often,
                      Details = filled once, Restrictions = conditional, Additional Information =
                      free-form), not by schema order. Events/Occurrences/Observations don't get
                      their own tabs here the way the references had them - that hierarchy is
                      already real and browsable in this page's own contextual-sidebar TreeView, so
                      repeating it as 3 more flat tabs would just be the same records twice, one of
                      them without the real component. */}
                  <ContentTabs selectedKey={detailTab} onSelectionChange={setDetailTab} className="flex flex-1 flex-col">
                    <TabList aria-label="Project views" type="underline" size="md" className="gap-6 px-6 pt-4">
                      <Tab id="overview" label="Overview" />
                      <Tab id="datasets" label="Datasets" />
                      <Tab id="details" label="Details" />
                      <Tab id="restrictions" label="Restrictions" />
                      <Tab id="additional" label="Additional Information" />
                    </TabList>

                    <TabPanel id="overview" className="flex flex-col gap-4 p-6">
                      {/* "Meta Under Title, Full Rail" - decided from /proto/project-header (see
                          CONTEXT.md). Below the flagged-concepts banner, Overview (abstract + map)
                          takes the wide column and a persistent rail repeats Project Details
                          alongside Data Owner/Project Manager - deliberate duplication of the meta
                          row above, not an oversight, so dates/status/contacts are scannable
                          without scrolling back to the header. The record-count tiles that used to
                          sit here as their own MetricCard row are now folded into ProjectDetailsCard
                          itself instead - consolidated per the user directly, off a second Figma
                          reference that independently landed on the same "fewer, denser cards"
                          instinct as /proto/project-detail's "Consolidated Rail" variant (see the
                          project_projects_data_model memory). */}
                      <FlaggedConceptsBanner onSelect={handleFlaggedConceptSelect} />

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="flex flex-1 flex-col gap-4">
                          <DetailSection title="Overview">
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Abstract</p>
                              <p className={cx("text-sm text-secondary", !abstractExpanded && "line-clamp-3")}>{abstract}</p>
                              <Button color="link-color" size="sm" className="self-start" onClick={() => setAbstractExpanded((e) => !e)}>
                                {abstractExpanded ? "Show less" : "Read more"}
                              </Button>
                            </div>
                            <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                              <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Geographic scope</p>
                              <div className="mt-2 flex min-h-[220px] flex-1 flex-col">
                                <MapView />
                              </div>
                            </div>
                          </DetailSection>
                          <DetailSection title="Artefacts">
                            <ArtefactCarousel artefacts={artefacts} onOpen={setArtefactLightboxIndex} />
                          </DetailSection>
                        </div>
                        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
                          <ProjectDetailsCard />
                          <ContactCard title="Data Owner" orgLabel="Adelaide Hills Landcare" contacts={[dataOwner]} />
                          <ContactCard title="Project Manager" contacts={[projectManager]} />
                        </div>
                      </div>
                      <ArtefactLightbox
                        artefacts={artefacts}
                        index={artefactLightboxIndex}
                        onClose={() => setArtefactLightboxIndex(null)}
                        onNavigate={setArtefactLightboxIndex}
                      />
                    </TabPanel>

                    <TabPanel id="datasets" className="p-6">
                      {/* Contribution is open - any registered user can add a dataset to any
                          project (see the Projects data model decisions) - so this table has more
                          than one contributor, not a single owner-uploaded list. Counts sum to the
                          same 6/18/42 totals shown in Overview - two real contributions, not two
                          independent totals invented on top of the existing numbers. */}
                      <Table aria-label="Datasets">
                        <TableHeader>
                          <Column isRowHeader>Dataset</Column>
                          <Column>Contributor</Column>
                          <Column>Uploaded</Column>
                          <Column>Events</Column>
                          <Column>Occurrences</Column>
                          <Column>Observations</Column>
                        </TableHeader>
                        <TableBody items={projectDatasets}>
                          {(dataset) => (
                            <Row id={dataset.id} textValue={dataset.name}>
                              <Cell>
                                <p className="text-sm font-medium text-primary">{dataset.name}</p>
                              </Cell>
                              <Cell>
                                <div className="flex items-center gap-2">
                                  <Avatar size="xs" initials={dataset.contributorInitials} alt={dataset.contributor} />
                                  <span className="text-sm text-secondary">{dataset.contributor}</span>
                                </div>
                              </Cell>
                              <Cell>
                                <span className="text-sm whitespace-nowrap text-tertiary">{dataset.uploadedDate}</span>
                              </Cell>
                              <Cell>
                                <span className="text-sm text-secondary">{dataset.events}</span>
                              </Cell>
                              <Cell>
                                <span className="text-sm text-secondary">{dataset.occurrences}</span>
                              </Cell>
                              <Cell>
                                <span className="text-sm text-secondary">{dataset.observations}</span>
                              </Cell>
                            </Row>
                          )}
                        </TableBody>
                      </Table>
                    </TabPanel>

                    <TabPanel id="details" className="p-6">
                      <Accordion items={detailAccordionItems} openKeys={detailOpenKeys} onOpenKeysChange={setDetailOpenKeys} />
                    </TabPanel>

                    <TabPanel id="restrictions" className="p-6">
                      {projectRestrictions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-secondary p-12 text-center">
                          <p className="text-sm font-medium text-primary">No restrictions</p>
                          <p className="text-sm text-tertiary">This project&apos;s data is publicly available.</p>
                        </div>
                      ) : (
                        <Accordion items={projectRestrictions} />
                      )}
                    </TabPanel>

                    <TabPanel id="additional" className="flex flex-col gap-4 p-6">
                      <DetailSection title="Additional Details">
                        <p className="text-sm text-tertiary">No additional details have been added to this project yet.</p>
                      </DetailSection>
                      <DetailSection title="Comments">
                        <p className="text-sm text-tertiary">No comments yet.</p>
                      </DetailSection>
                    </TabPanel>
                  </ContentTabs>
                </>
                )
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

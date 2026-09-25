"use client";

import type { FC } from "react";
import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { Selection } from "react-aria-components";
import { Tabs } from "react-aria-components";
import { TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import {
  ChevronDown,
  ChevronUp,
  Folder,
  Eye,
  Activity,
  Target05,
  File06,
  Image01,
  File01,
  Link02,
  Circle,
  Pentagon,
  Trash01,
  MarkerPin02,
  Map02,
  PenTool02,
  SearchLg,
  ArrowNarrowLeft,
  LayerSingle,
  LayersThree01,
  Waves,
  Users01,
  Download01,
  FileDownload01,
  File07,
  Printer,
  FilterLines,
  UploadCloud02,
  File04,
  Plus,
  FileLock01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { InputFile } from "@/components/base/input/input-file";
import { MultiSelect } from "@/components/base/select/multi-select";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { SidebarFooterLinks } from "@/app/pages/_shared/sidebar-footer-links";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { SA_NATIONAL_PARKS, isPointInAnyBoundary, boundarySummary, wholeStateBoundary, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { parseShapefileUpload, shapefileLayerSummary, type ShapefileLayer } from "@/app/pages/_shared/map-search/shapefile";
import {
  searchEvents,
  searchOccurrences,
  searchObservations,
  searchResources,
  eventChain,
  hierarchyFor,
  eventTypeIcon,
  rootProjectOfEvent,
  rootProjectForParentEventId,
  type SearchEvent,
  type SearchOccurrence,
  type SearchObservation,
  type SearchResource,
  type ResourceType,
  type OccurrenceType,
} from "@/app/pages/_shared/map-search/search-data";
import { ResultsTable, HierarchyCell, type ColumnDef, type TypeFilterOption } from "@/app/pages/_shared/map-search/results-table";
import { MetricTile } from "@/app/pages/_shared/map-search/metric-tile";
import { SpeciesResultsView, EXPORT_HEADERS, exportRowFor } from "@/app/pages/_shared/map-search/species-results";
import { downloadCsv, downloadExcel, printAsPdf } from "@/app/pages/_shared/map-search/export-utils";
import { RecordDetailSidebar, type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { ArtefactLightbox, type Artefact, type ArtefactType } from "@/app/pages/_shared/artefact-lightbox";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { navForRole, keyHref, type NavNode } from "@/lib/registered-user-nav";
import { cx } from "@/utils/cx";

// The map search interface built for the sidebar's Observations item, per direct request: a real,
// interactive map of South Australia (Leaflet + OpenStreetMap tiles, not a fabricated grid) that
// lets a user define a search area by drawing a circle/polygon, entering coordinates, or picking a
// real South Australian national park, then hand that area off to a results view with the area's
// Projects, Events, Occurrence and Observation records in a table, one tab per record type.
//
// Same "leaf with its own key" nav treatment Home and Projects already have (see
// lib/registered-user-nav.ts) - this screen is reached for real from every sidebar shell's icon
// rail via the same generic `goToSection`/`keyHref` machinery those two already use, with no
// per-shell changes needed. Renamed "Observations" -> "Explore" in the nav per direct feedback on
// this build (see the changelog note in lib/registered-user-nav.ts) - only the nav label/icon;
// "Observations" is still the real name of one of the 4 record types this screen searches for
// (`entityTabs` below), the route/key (`/pages/observations`) is untouched.
//
// The map itself (app/pages/_shared/map-search/sa-map.tsx) is loaded with `ssr: false` - Leaflet
// touches `window` at import time, which breaks server rendering otherwise - and shows an honest
// loading placeholder rather than nothing while its client bundle loads.
const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-secondary">
      <p className="text-sm text-tertiary">Loading map…</p>
    </div>
  ),
});
const CURRENT_KEY = "observations";

type Method = "draw" | "coordinates" | "location" | "shapefile";
// Reversed per direct business feedback: Projects is its own top-level tab again, separate from
// Events - matches the new Figma reference (node 209:27950, "Projects" first in the metrics bar,
// ahead of Events/Occurrences/Observations/Resources). A Project is still internally an Event
// (`type: "Project"` in search-data.ts, no change to the underlying data model - only which tab a
// Project-type row surfaces in) - `filteredProjects`/`filteredEvents` below split the same
// underlying `searchEvents` array so a Project is never counted or shown in both tabs at once.
type EntityTab = "projects" | "events" | "occurrence" | "observations" | "resources";

const methodTabs: { id: Method; label: string; icon: FC<{ className?: string }> }[] = [
  // Short labels so all 4 methods fit one row in the 480px panel.
  { id: "draw", label: "Draw", icon: PenTool02 },
  { id: "coordinates", label: "Coordinates", icon: MarkerPin02 },
  { id: "location", label: "Location", icon: Map02 },
  { id: "shapefile", label: "Shapefile", icon: UploadCloud02 },
];

// Icons match Figma's own "Metrics section" exactly (node 209:27950, superseding the earlier
// 4-tab version at 205:20764 -> I205:21340;195:10228) - Folder/Activity/Target05/Eye/File06, in
// that order, Projects first. The last tab's own label is "Artefacts and Attachments", not
// "Resources", per direct feedback - it holds every file/image/reference link attached to an
// individual Event/Occurrence/Observation record (see `searchResources`' own doc comment in
// search-data.ts), and "Resources" read as ambiguous with a project's own resourcing. The
// internal `EntityTab` id/data model ("resources", `searchResources`, `resourceColumns`, etc.)
// is unchanged - only the user-facing label.
const entityTabs: { id: EntityTab; label: string; icon: FC<{ className?: string }> }[] = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "events", label: "Events", icon: Activity },
  { id: "occurrence", label: "Occurrences", icon: Target05 },
  { id: "observations", label: "Observations", icon: Eye },
  { id: "resources", label: "Artefacts and Attachments", icon: File06 },
];

// Records-mode export headers, one per EntityTab - per direct feedback ("the export results
// disappears when records view is selected... make sure the export button stays"), the header-row
// export control now works in Records mode too, not just Species mode. Each row list is the same
// plain, already-real fields that tab's own ColumnDef list already renders (see projectColumns/
// eventColumns/occurrenceColumns/observationColumns/resourceColumns above) - never a fabricated
// field with no real data behind it.
const recordsExportHeaders: Record<EntityTab, string[]> = {
  projects: ["Project ID", "Project", "Organisation", "Status", "Contributor", "Updated"],
  events: ["Event ID", "Event Name", "Event Type", "Start Date", "End Date"],
  occurrence: ["Occurrence ID", "Occurrence Name", "Occurrence Type", "Scientific Name", "Date"],
  observations: ["Observation ID", "Observation Name", "Observation Type", "Scientific Name", "Date"],
  resources: ["Attached Resource", "Type", "Attached to Concept", "Record ID", "Record Name"],
};

const parkItems = SA_NATIONAL_PARKS.map((park) => ({ id: park.id, label: park.name }));

function matchesKeyword(haystack: string, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  return !q || haystack.toLowerCase().includes(q);
}

// Same toggle-a-value-in-a-Set helper species-results.tsx's own `toggleInSet` already provides for
// Species mode's facet checkboxes - duplicated here (not imported) since it's a tiny, self-
// contained utility and this file doesn't otherwise import from that one.
function toggleInSet<T>(set: Set<T>, value: T, checked: boolean): Set<T> {
  const next = new Set(set);
  if (checked) next.add(value);
  else next.delete(value);
  return next;
}

// ── Records mode's "All Filters" panel is built directly from each entity tab's own real
//    ColumnDef list, per direct feedback ("the all filters side panel... [is] not reflecting the
//    column headers and values as filters. Use the same column headers and column values as
//    filters and values. You can ignore the hierarchy column as filter") - never a separate,
//    invented facet set (the previous Region/Organisation pair). A column only participates when
//    it declares a real `filterValue` (see ColumnDef's own doc comment in results-table.tsx) -
//    Hierarchy never does (a breadcrumb, not a discrete value), and neither do occurrenceColumns'
//    ~25 `defaultVisible: false` placeholder columns, whose value never varies by row. ──

function filterableColumns<T>(columns: ColumnDef<T>[]): (ColumnDef<T> & { filterValue: (row: T) => string })[] {
  return columns.filter((c): c is ColumnDef<T> & { filterValue: (row: T) => string } => c.id !== "hierarchy" && Boolean(c.filterValue));
}

function matchesColumnFilters<T>(row: T, columns: ColumnDef<T>[], selected: Record<string, Set<string>>): boolean {
  return columns.every((col) => {
    const values = selected[col.id];
    if (!values || values.size === 0 || !col.filterValue) return true;
    return values.has(col.filterValue(row));
  });
}

/** One real accordion section per filterable column, its real distinct values (from `rows`, not
 *  narrowed by any other currently-selected facet - same "independent option lists" precedent
 *  Species mode's own Family/Genus/Species/Authority dropdowns already use) as checkboxes. */
function buildColumnFilterSections<T>(
  rows: T[],
  columns: ColumnDef<T>[],
  selected: Record<string, Set<string>>,
  onToggle: (columnId: string, value: string, checked: boolean) => void,
): AccordionItemType[] {
  return filterableColumns(columns).map((col) => {
    const values = [...new Set(rows.map(col.filterValue))].sort();
    const selectedSet = selected[col.id] ?? new Set<string>();
    return {
      id: col.id,
      title: col.label,
      content:
        values.length === 0 ? (
          <p className="py-2 text-sm text-tertiary">No values in this search.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {values.map((v) => (
              <Checkbox key={v} label={v} isSelected={selectedSet.has(v)} onChange={(checked) => onToggle(col.id, v, checked)} />
            ))}
          </div>
        ),
    };
  });
}

// ── Result table column definitions, one array per entity - the customise-columns feature (see
//    ResultsTable) toggles visibility over exactly these, so a column only exists here once,
//    never invented separately for the customiser vs. the table itself. `defaultVisible: false`
//    columns are real, working columns - just hidden until the user opts in, matching the Figma
//    reference's own default-visible-subset-of-a-much-larger-column-set pattern without
//    replicating its full 30-column mega-table (which the reference itself only half-populates
//    with real data past its first few columns). ──
// eventTypeIcon now lives in search-data.ts (imported above) - HierarchyCell's own per-segment
// detail panel needs the same per-type icon this page's Type column uses, so it moved to the one
// shared module both files already import from, rather than staying duplicated here.

// Individual/Population confirmed directly against Figma's own "Occurence" tab chip row
// (get_design_context on I195:15188;195:10266;1396:60338;195:9855, node 215:28069) - Individual
// uses the real "layer-single" DS - Foundations component (a single flattened layer outline,
// @untitledui/icons `LayerSingle`), Population uses "layers-three-01" (three stacked layers,
// `LayersThree01`) - both real, exported icons, neither the previously-guessed `CircleCut`/
// `LayersTwo02`. Non-Biotic/Community were not present in this frame's own mock data (0/1 count),
// so left as the already-confirmed `Waves`/`Users01` from the earlier eighth-follow-up audit.
const occurrenceTypeIcon: Record<OccurrenceType, FC<{ className?: string }>> = {
  Individual: LayerSingle,
  Population: LayersThree01,
  "Non-Biotic": Waves,
  Community: Users01,
};

const occurrenceEventById = new Map(searchEvents.map((event) => [event.id, event]));

function linkedEventForOccurrence(occurrence: SearchOccurrence): SearchEvent | undefined {
  return occurrenceEventById.get(occurrence.parentEventId);
}

function projectForOccurrence(occurrence: SearchOccurrence): SearchEvent | undefined {
  let event = linkedEventForOccurrence(occurrence);
  while (event?.parentId) event = occurrenceEventById.get(event.parentId);
  return event?.type === "Project" ? event : undefined;
}

const occurrenceText = (value?: string) => <span className="text-sm whitespace-nowrap text-tertiary">{value || "—"}</span>;

// Projects (type === "Project" root Events) now matches the real Projects page's own columns
// exactly (app/pages/_shared/project-list-content.tsx: Project/Organisation/Status/Contributor/
// Updated), per direct feedback - the same underlying project, so the same columns, rather than
// the Event-shaped ID/Name/Start Date/End Date/Hierarchy set every other tab here uses (a root
// Project's own Hierarchy is always "-" anyway, and Start/End Date/Project ID aren't part of that
// reference table at all). No "Type" column (every row here is a Project) or sub-type filter chips
// (ResultsTable's typeField/typeOptions are omitted below), same as before.
const projectColumns: ColumnDef<SearchEvent>[] = [
  { id: "code", label: "Project ID", render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.code}</span> },
  {
    id: "name",
    label: "Project",
    filterValue: (e) => e.name,
    render: (e) => (
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-primary">{e.name}</p>
        {e.description && <p className="max-w-md truncate text-xs text-tertiary">{e.description}</p>}
      </div>
    ),
  },
  { id: "org", label: "Organisation", filterValue: (e) => e.org, render: (e) => <span className="text-sm text-secondary">{e.org}</span> },
  {
    id: "status",
    label: "Status",
    filterValue: (e) => e.status,
    render: (e) => (
      <Badge size="sm" color={e.statusColor}>
        {e.status}
      </Badge>
    ),
  },
  {
    id: "contributor",
    label: "Contributor",
    filterValue: (e) => e.contributorName ?? "-",
    render: (e) =>
      e.contributorName ? (
        <div className="flex items-center gap-2">
          <Avatar size="xs" initials={e.contributorInitials} alt={e.contributorName} />
          <span className="text-sm text-secondary">{e.contributorName}</span>
        </div>
      ) : (
        <span className="text-sm text-tertiary">-</span>
      ),
  },
  {
    id: "updated",
    label: "Updated",
    filterValue: (e) => e.updated ?? "-",
    render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.updated ?? "-"}</span>,
  },
];

const eventColumns: ColumnDef<SearchEvent>[] = [
  { id: "id", label: "Event ID", filterValue: (e) => e.code, render: (e) => <span className="text-sm text-tertiary">{e.code}</span> },
  { id: "name", label: "Event Name", filterValue: (e) => e.name, render: (e) => <span className="text-sm font-medium text-primary">{e.name}</span> },
  {
    id: "type",
    label: "Event Type",
    headerTooltip: "The kind of event this row represents within a Site: Visit, Transect, Quadrat, Block, Ramble, Trap or Custom event.",
    filterValue: (e) => e.type,
    render: (e) => {
      const Icon = eventTypeIcon[e.type];
      return (
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-quaternary" />
          <span className="text-sm text-tertiary">{e.type}</span>
        </div>
      );
    },
  },
  { id: "startDate", label: "Start Date", filterValue: (e) => e.startDate, render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.startDate}</span> },
  { id: "endDate", label: "End Date", filterValue: (e) => e.endDate, render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.endDate}</span> },
  // No filterValue - a breadcrumb, not a discrete value to select, per direct request ("ignore the
  // hierarchy column as filter").
  { id: "hierarchy", label: "Hierarchy", render: (e) => <HierarchyCell chain={eventChain(e)} /> },
];

// "Project" deliberately excluded - Project-type rows now live in their own Projects tab (see
// EntityTab above), never mixed into the Events tab's own sub-filter chips.
const eventTypeOptions: TypeFilterOption[] = (["Site", "Visit", "Transect", "Quadrat", "Block", "Ramble", "Trap", "Custom event"] as const).map((t) => ({
  value: t,
  label: t,
  icon: eventTypeIcon[t],
}));

// Only the 5 default-visible columns below get a `filterValue` - the ~25 `defaultVisible: false`
// columns further down are honest Figma-documented placeholders whose `render` never varies per
// row (most take no row argument at all, always "-"), so a filter built from them would have
// exactly one, functionally useless option. Per direct request the "All Filters" panel should
// reflect this table's real column headers/values (Hierarchy excluded) - these placeholder columns
// have no real per-row value to reflect, so they're left out the same way Hierarchy is, not a
// silent gap.
const occurrenceColumns: ColumnDef<SearchOccurrence>[] = [
  { id: "id", label: "Occurrence ID", filterValue: (o) => o.id, render: (o) => <span className="text-sm text-tertiary">{o.id}</span> },
  { id: "name", label: "Occurrence Name", filterValue: (o) => o.commonName, render: (o) => <span className="text-sm font-medium text-primary">{o.commonName}</span> },
  {
    id: "type",
    label: "Occurrence Type",
    headerTooltip: "Individual, Population, Non-Biotic, or Community - the record's biological classification.",
    filterValue: (o) => o.type,
    render: (o) => {
      const Icon = occurrenceTypeIcon[o.type];
      return (
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-quaternary" />
          <span className="text-sm text-tertiary">{o.type}</span>
        </div>
      );
    },
  },
  { id: "species", label: "Scientific Name", filterValue: (o) => o.species, render: (o) => <span className="text-sm text-tertiary italic">{o.species}</span> },
  { id: "date", label: "Date", filterValue: (o) => o.date, render: (o) => <span className="text-sm whitespace-nowrap text-tertiary">{o.date}</span> },
  { id: "hierarchy", label: "Hierarchy", render: (o) => <HierarchyCell chain={hierarchyFor(o.parentEventId)} /> },
  { id: "project", label: "Project", defaultVisible: false, render: (o) => occurrenceText(projectForOccurrence(o)?.name) },
  { id: "event-linked-parent", label: "Event Linked (Parent)", defaultVisible: false, render: (o) => occurrenceText(linkedEventForOccurrence(o)?.name) },
  { id: "occurrences", label: "Occurrences", defaultVisible: false, render: (o) => occurrenceText(o.commonName) },
  {
    id: "occurrence-status",
    label: "Occurrence Status",
    defaultVisible: false,
    render: (o) => <Badge size="sm" color={o.status === "Present" ? "success" : "gray"}>{o.status}</Badge>,
  },
  { id: "observations", label: "Observations", defaultVisible: false, render: (o) => occurrenceText(o.id) },
  { id: "source-id", label: "Source ID", defaultVisible: false, render: (o) => occurrenceText(o.id) },
  { id: "occurrence-description", label: "Occurrence Description", defaultVisible: false, render: (o) => occurrenceText(`${o.commonName} recorded in ${o.region}.`) },
  { id: "observers", label: "Observers", defaultVisible: false, render: () => occurrenceText() },
  { id: "occurrence-type-source", label: "Occurrence Type??", defaultVisible: false, render: (o) => occurrenceText(o.type) },
  { id: "nsx-code-species", label: "NSX Code & Species", defaultVisible: false, render: (o) => occurrenceText(o.species) },
  { id: "legacy-sighting", label: "Legacy Sighting # (its from legacy OP system)", defaultVisible: false, render: () => occurrenceText() },
  { id: "released-planted", label: "Released/Planted", defaultVisible: false, render: () => occurrenceText("No") },
  { id: "voucher-series", label: "Voucher Series", defaultVisible: false, render: () => occurrenceText() },
  { id: "voucher-number", label: "Voucher Number", defaultVisible: false, render: () => occurrenceText() },
  { id: "voucher-images", label: "Voucher Images", defaultVisible: false, render: () => occurrenceText() },
  { id: "institution-name", label: "Institution Name", defaultVisible: false, render: () => occurrenceText() },
  { id: "institution-registration", label: "Institution Rego #", defaultVisible: false, render: () => occurrenceText() },
  { id: "voucher-comments", label: "Voucher Comments", defaultVisible: false, render: () => occurrenceText() },
  { id: "determiner-1", label: "Determiner 1", defaultVisible: false, render: () => occurrenceText() },
  { id: "determiner-2", label: "Determiner 2", defaultVisible: false, render: () => occurrenceText() },
  { id: "determination-date", label: "Determination Date", defaultVisible: false, render: (o) => occurrenceText(o.date) },
  { id: "transfer-date", label: "Transfer Date", defaultVisible: false, render: () => occurrenceText() },
  { id: "determination-date-accuracy", label: "Determination Date Accuracy", defaultVisible: false, render: () => occurrenceText("Day") },
  { id: "source-event", label: "Source Event ID -Name", defaultVisible: false, render: (o) => {
    const event = linkedEventForOccurrence(o);
    return occurrenceText(event ? `${event.code} - ${event.name}` : undefined);
  } },
  { id: "creation-date", label: "Creation Date", defaultVisible: false, render: (o) => occurrenceText(o.date) },
  { id: "created-by-source", label: "Created By/Source", defaultVisible: false, render: () => occurrenceText("Field survey") },
  { id: "updated-on", label: "Updated On", defaultVisible: false, render: (o) => occurrenceText(o.date) },
  { id: "updated-by", label: "Updated By", defaultVisible: false, render: () => occurrenceText() },
  { id: "updated-by-source", label: "Updated By / Source", defaultVisible: false, render: () => occurrenceText() },
];

const occurrenceTypeOptions: TypeFilterOption[] = (["Individual", "Population", "Non-Biotic", "Community"] as const).map((t) => ({
  value: t,
  label: t,
  icon: occurrenceTypeIcon[t],
}));

const observationColumns: ColumnDef<SearchObservation>[] = [
  { id: "id", label: "Observation ID", filterValue: (o) => o.id, render: (o) => <span className="text-sm text-tertiary">{o.id}</span> },
  { id: "name", label: "Observation Name", filterValue: (o) => o.commonName, render: (o) => <span className="text-sm font-medium text-primary">{o.commonName}</span> },
  {
    id: "type",
    label: "Observation Type",
    headerTooltip: "Individual, Population, Non-Biotic, or Community - the record's biological classification.",
    filterValue: (o) => o.type,
    render: (o) => {
      const Icon = occurrenceTypeIcon[o.type];
      return (
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-quaternary" />
          <span className="text-sm text-tertiary">{o.type}</span>
        </div>
      );
    },
  },
  { id: "species", label: "Scientific Name", filterValue: (o) => o.species, render: (o) => <span className="text-sm text-tertiary italic">{o.species}</span> },
  { id: "date", label: "Date", filterValue: (o) => o.date, render: (o) => <span className="text-sm whitespace-nowrap text-tertiary">{o.date}</span> },
  { id: "hierarchy", label: "Hierarchy", render: (o) => <HierarchyCell chain={hierarchyFor(o.parentEventId)} /> },
];

const resourceTypeIcon: Record<ResourceType, FC<{ className?: string }>> = { Image: Image01, File: File01, "Reference Link": Link02 };

const resourceColumns: ColumnDef<SearchResource>[] = [
  {
    id: "name",
    label: "Attached Resource",
    filterValue: (r) => r.name,
    render: (r) => {
      const Icon = resourceTypeIcon[r.type];
      return (
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-quaternary" />
          {r.type === "Reference Link" ? (
            <a
              href={r.name}
              target="_blank"
              rel="noreferrer"
              className="max-w-52 truncate text-sm font-medium text-brand-secondary underline"
              onClick={(e) => e.stopPropagation()}
            >
              {r.name}
            </a>
          ) : (
            <span className="max-w-52 truncate text-sm font-medium text-primary">{r.name}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "type",
    label: "Type",
    headerTooltip: "Image, File, or Reference Link - what kind of resource is attached.",
    filterValue: (r) => r.type,
    render: (r) => {
      const Icon = resourceTypeIcon[r.type];
      return (
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 shrink-0 text-quaternary" />
          <span className="text-sm text-tertiary">{r.type}</span>
        </div>
      );
    },
  },
  { id: "attachedTo", label: "Attached to Concept", filterValue: (r) => r.attachedToConcept, render: (r) => <span className="text-sm text-tertiary">{r.attachedToConcept}</span> },
  { id: "recordId", label: "Record ID", filterValue: (r) => r.recordId, render: (r) => <span className="font-mono text-sm text-secondary">{r.recordId}</span> },
  { id: "recordName", label: "Record Name", filterValue: (r) => r.recordName, render: (r) => <span className="text-sm text-secondary">{r.recordName}</span> },
  { id: "hierarchy", label: "Hierarchy", render: (r) => <HierarchyCell chain={hierarchyFor(r.parentEventId)} /> },
];

const resourceTypeOptions: TypeFilterOption[] = (["Image", "File", "Reference Link"] as const).map((t) => ({
  value: t,
  label: t === "Reference Link" ? "Reference Links" : `${t}s`,
  icon: resourceTypeIcon[t],
}));

// Maps a real SearchResource row into the shared `Artefact` shape (app/pages/_shared/artefact-
// lightbox.tsx) so clicking one opens the exact same modal project-detail already uses,
// per direct request, rather than a second, diverging preview. Every derived field below comes
// from real data already on the resource (its own filename extension, its parent chain's real
// Project org via `rootProjectForParentEventId`) - never a fabricated value. `size`/`creator` stay
// an honest "-" - this dataset doesn't track a real file size or a per-resource author.
const CC_LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/";

function resourceArtefactType(r: SearchResource): ArtefactType {
  if (r.type === "Reference Link") return "link";
  if (r.type === "Image") return "image";
  const lower = r.name.toLowerCase();
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return "spreadsheet";
  if (lower.endsWith(".mp4") || lower.endsWith(".mov")) return "video";
  return "pdf";
}

function resourceFormat(kind: ArtefactType): string {
  switch (kind) {
    case "link":
      return "text/uri-list";
    case "image":
      return "image/jpeg";
    case "spreadsheet":
      return "application/vnd.ms-excel";
    case "video":
      return "video/mp4";
    default:
      return "application/pdf";
  }
}

function resourceDcType(kind: ArtefactType): string {
  switch (kind) {
    case "image":
      return "StillImage";
    case "video":
      return "MovingImage";
    case "spreadsheet":
      return "Dataset";
    case "link":
      return "InteractiveResource";
    default:
      return "Text";
  }
}

function resourceToArtefact(r: SearchResource): Artefact {
  const kind = resourceArtefactType(r);
  const project = rootProjectForParentEventId(r.parentEventId);
  const orgInitials = project
    ? project.org
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "BDR";
  const description = `${r.attachedToConcept} attached to ${r.recordName} (${r.recordId})`;

  return {
    id: r.id,
    title: r.name,
    type: kind,
    size: "-",
    recordLabel: `${r.recordName} · ${r.recordId}`,
    metaTitle: description,
    created: r.date,
    creator: "-",
    objectId: `${orgInitials}:${orgInitials}:${r.recordId}`,
    description,
    format: resourceFormat(kind),
    identifierUrl: kind === "link" ? r.name : `https://data.environment.sa.gov.au/biodata/${r.id}`,
    licenseUrl: CC_LICENSE_URL,
    publisher: project?.org ?? r.region,
    rightsHolder: project?.org ?? r.region,
    dcType: resourceDcType(kind),
    bioDataId: r.id.toUpperCase(),
  };
}

// Same NavTree/SectionPlaceholder/ProfileMenu/GuestAuthActions shape as every other sidebar shell
// (see project-list's own copies) - kept local rather than extracted, matching this
// build's existing per-shell duplication of this exact chrome.
function NavTree({ node, depth = 1 }: { node: NavNode; depth?: number }) {
  const href = node.key ? keyHref(node.key) : undefined;
  const indent = { paddingLeft: 8 + (depth - 1) * 12, paddingRight: 8 };

  return href ? (
    <a
      href={href}
      style={indent}
      className="rounded-md py-2 text-sm font-medium text-primary transition-colors duration-100 ease-linear hover:bg-tertiary"
    >
      {node.label}
    </a>
  ) : (
    <p style={indent} className="py-2 text-sm text-tertiary">
      {node.label}
    </p>
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
        <Button color="link-color" size="sm" href={roleHref(keyHref(relatedLink.key!))}>
          Go to {relatedLink.label}
        </Button>
      )}
    </div>
  );
}

export default function ObservationsPage() {
  return (
    <Suspense fallback={null}>
      <ObservationsSearch />
    </Suspense>
  );
}

function ObservationsSearch() {
  const router = useRouter();
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = navForRole(role);
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Explore");
  // `?q=` comes from the header search (app/pages/_shared/global-search.tsx): a species or record
  // term to search for across all of South Australia, opened straight in Species view. With no
  // drawn area, the whole-state area stands in, so the same spatial + keyword filtering runs.
  const urlQuery = useSearchParams().get("q");
  const [appliedQuery, setAppliedQuery] = useState(urlQuery);
  const activeSectionNode = nav.find((section) => section.label === activeSection) ?? nav[0];

  const goToSection = (section: NavNode) => {
    const relatedLink = section.key ? section : section.items?.find((item) => item.key);
    if (relatedLink?.key && relatedLink.key !== CURRENT_KEY) {
      router.push(roleHref(keyHref(relatedLink.key)));
    } else {
      setActiveSection(section.label);
    }
  };

  // ── Search state ──
  // Multiple boundaries can be active at once, per direct feedback ("allow to add multiple
  // location selections"). `manualBoundaries` holds every drawn shape and every entered-
  // coordinate point - each an explicit, immutable add via a button press, only ever removed the
  // same way. Park selections are kept separately (`selectedParkIds` + the one shared
  // `parkRadius`) and turned into their own circle boundaries reactively via `parkBoundaries`
  // below, so changing the radius or the selection recomputes just those, never touching a
  // manually drawn shape or entered point.
  const [mode, setMode] = useState<"search" | "results">(urlQuery ? "results" : "search");
  // Floating search panel over the full-width map - collapsible so the whole map is visible.
  const [searchPanelOpen, setSearchPanelOpen] = useState(true);
  // Results header's "N search areas" disclosure - lists each area so the user can see what was searched.
  const [showSearchAreas, setShowSearchAreas] = useState(false);
  const [method, setMethod] = useState<Method>("draw");
  const [manualBoundaries, setManualBoundaries] = useState<Boundary[]>(() => (urlQuery ? [wholeStateBoundary()] : []));
  const [activeDrawTool, setActiveDrawTool] = useState<"circle" | "polygon" | null>(null);
  const [keyword, setKeyword] = useState(urlQuery ?? "");
  const [entityTab, setEntityTab] = useState<EntityTab>("projects");
  // Species mode vs. the existing Projects/Events/Occurrences/Observations/Artefacts record-by-
  // record view (app/pages/_shared/map-search/species-results.tsx), per direct request - an
  // additive sibling view, not a replacement. Defaults to "records" so first load is unchanged.
  const [viewMode, setViewMode] = useState<"records" | "species">(urlQuery ? "species" : "records");
  // Records mode's own shared search box + "All Filters" panel, per direct request ("do the same
  // for Records as well... there will be an All Filters button which will show the side bar on the
  // left"). One search term/facet selection shared across all 5 entity tabs, same "page-level, not
  // per-tab" precedent `keyword`/`boundaries` above already use - each `ResultsTable` call below
  // wires its own internal search box to this via `searchValue`/`onSearchChange`/`hideSearchBox`.
  const [recordsSearch, setRecordsSearch] = useState("");
  const [recordsFilterPanelOpen, setRecordsFilterPanelOpen] = useState(false);
  // The "All Filters" panel's own facet selections, per direct feedback that it must reflect each
  // tab's own real column headers/values (Hierarchy excluded) rather than a fixed Region/
  // Organisation pair - keyed first by EntityTab, then by that tab's own ColumnDef id, so switching
  // tabs can never show or apply a different tab's selections (each tab has its own real column
  // set, sometimes sharing an id like "id" or "type" with a different real meaning).
  const [columnFilters, setColumnFilters] = useState<Record<EntityTab, Record<string, Set<string>>>>({
    projects: {},
    events: {},
    occurrence: {},
    observations: {},
    resources: {},
  });
  // The rich, Figma-matched record-detail sidebar (record-detail.tsx) - opened by clicking a
  // Project/Event/Occurrence/Observation row, per direct request. Lifted to page level (not local
  // to ResultsTable) so it persists correctly regardless of which tab's table triggered it.
  const [selectedRecord, setSelectedRecord] = useState<DetailRecord | null>(null);
  // The Artefacts and Attachments tab's own row click - opens the exact same artefact preview
  // modal project-detail uses (app/pages/_shared/artefact-lightbox.tsx), per direct
  // request, rather than the generic column-detail panel every other tab still falls back to for
  // resources (there's no Figma frame for a resource-specific record-detail sidebar the way
  // Project/Event/Occurrence/Observation rows have - see record-detail.tsx's own note on this).
  const [artefactIndex, setArtefactIndex] = useState<number | null>(null);
  // The Level 1/Level 2 access banner's own guest sign-up prompt (see below) - a guest sees the
  // same real banner and CTA a registered user does, but has no DLA section to navigate to, so
  // the CTA opens the same invite modal `GuestActionButton` already uses instead of a dead link.
  const [dlaSignUpOpen, setDlaSignUpOpen] = useState(false);
  // A guest's "Export results" opens its own prompt (it used to reuse the licence one, which asked
  // them to request full data access - the wrong message for an export).
  const [exportSignUpOpen, setExportSignUpOpen] = useState(false);
  // The banner is dismissible (a real corner close icon, per direct feedback) - once dismissed for
  // this session it stays gone rather than reappearing on every re-render; it's a live notice about
  // the current search's own data, not a one-time onboarding tip, so no persistence beyond this
  // component's own lifetime is attempted.
  const [dlaBannerDismissed, setDlaBannerDismissed] = useState(false);
  // Species mode's own currently fully-filtered rows, reported up via `SpeciesResultsView`'s
  // `onExportableRowsChange` - per a real Figma reference (node 2294:175340), "Export results" now
  // lives in this page's own header row next to the Records/Species toggle, not inside that
  // component, but the filtering that decides *which* rows are exportable still lives there.
  const [speciesExportRows, setSpeciesExportRows] = useState<SearchOccurrence[]>([]);

  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [coordRadius, setCoordRadius] = useState(25);
  // Bumped after every "Add point" - forces the (uncontrolled) Latitude/Longitude fields to remount
  // and clear, so the next point can be entered without the previous one lingering. The radius
  // field is left alone so it carries over for the next point.
  const [coordResetKey, setCoordResetKey] = useState(0);

  const [selectedParkIds, setSelectedParkIds] = useState<Selection>(new Set());
  const [parkRadius, setParkRadius] = useState(15);

  const addManualBoundary = (boundary: Boundary) => setManualBoundaries((prev) => [...prev, boundary]);

  const applyCoordinates = () => {
    if (lat == null || lon == null) return;
    addManualBoundary({ id: `coord-${Date.now()}`, kind: "circle", center: [lat, lon], radiusKm: coordRadius });
    setLat(null);
    setLon(null);
    setCoordResetKey((k) => k + 1);
  };

  const parkBoundaries = useMemo<Boundary[]>(() => {
    const isSelected = (id: string) => selectedParkIds === "all" || selectedParkIds.has(id);
    return SA_NATIONAL_PARKS.filter((park) => isSelected(park.id)).map((park) => ({
      id: `park-${park.id}`,
      source: `park:${park.id}`,
      kind: "circle",
      center: [park.lat, park.lon],
      radiusKm: parkRadius,
      label: park.name,
    }));
  }, [selectedParkIds, parkRadius]);

  // Uploaded shapefiles - each file stays one grouped entry (one row in the areas list, removed as
  // a whole), expanded into real boundaries below: a circle of `shapefileRadius` around each point
  // (the map's own marker shows each point) and each polygon as drawn.
  const [shapefileLayers, setShapefileLayers] = useState<ShapefileLayer[]>([]);
  const [shapefileRadius, setShapefileRadius] = useState(5);
  const [shapefileError, setShapefileError] = useState<string | null>(null);
  const [shapefileBusy, setShapefileBusy] = useState(false);
  const [shapefileInputKey, setShapefileInputKey] = useState(0);

  const handleShapefileUpload = async (files: File[]) => {
    setShapefileBusy(true);
    setShapefileError(null);
    try {
      const layer = await parseShapefileUpload(files);
      setShapefileLayers((prev) => [...prev, layer]);
      setShapefileInputKey((k) => k + 1);
    } catch (error) {
      setShapefileError(error instanceof Error ? error.message : "We couldn't read that file.");
    } finally {
      setShapefileBusy(false);
    }
  };

  // A new `?q=` (the header search, used while already on this page) replaces the current search
  // with that term across the whole state. Adjusted during render, not in an effect, so there is no
  // flash of the previous results; `appliedQuery` stops it re-running for the same term.
  if (urlQuery && urlQuery !== appliedQuery) {
    setAppliedQuery(urlQuery);
    setKeyword(urlQuery);
    setManualBoundaries([wholeStateBoundary()]);
    setSelectedParkIds(new Set());
    setShapefileLayers([]);
    setMode("results");
    setViewMode("species");
    setEntityTab("projects");
    setRecordsSearch("");
  }

  const shapefileBoundaries = useMemo<Boundary[]>(
    () =>
      shapefileLayers.flatMap((layer) => [
        ...layer.points.map<Boundary>((center, i) => ({
          id: `${layer.id}-pt-${i}`,
          source: `shapefile:${layer.id}`,
          kind: "circle",
          center,
          radiusKm: shapefileRadius,
        })),
        ...layer.polygons.map<Boundary>((points, i) => ({
          id: `${layer.id}-poly-${i}`,
          source: `shapefile:${layer.id}`,
          kind: "polygon",
          points,
        })),
      ]),
    [shapefileLayers, shapefileRadius],
  );

  const boundaries = useMemo(
    () => [...manualBoundaries, ...parkBoundaries, ...shapefileBoundaries],
    [manualBoundaries, parkBoundaries, shapefileBoundaries],
  );

  const removeBoundary = (target: Boundary) => {
    if (target.source?.startsWith("park:")) {
      const removedParkId = target.source.slice("park:".length);
      setSelectedParkIds((prev) =>
        prev === "all"
          ? new Set(SA_NATIONAL_PARKS.map((park) => park.id).filter((id) => id !== removedParkId))
          : new Set([...prev].filter((id) => id !== removedParkId)),
      );
    } else {
      setManualBoundaries((prev) => prev.filter((b) => b.id !== target.id));
    }
  };

  const clearAllBoundaries = () => {
    setManualBoundaries([]);
    setSelectedParkIds(new Set());
    setShapefileLayers([]);
  };

  // What the user thinks of as "a search area": each drawn/entered shape and each selected park is
  // one, but an uploaded shapefile is one area however many locations it holds. Used by the search
  // panel's list and the results header's "N search areas" disclosure so both count the same way.
  const areaEntries = useMemo(
    () => [
      ...[...manualBoundaries, ...parkBoundaries].map((b) => ({
        id: b.id,
        icon: b.kind === "circle" ? MarkerPin02 : Pentagon,
        summary: boundarySummary(b),
        onRemove: () => removeBoundary(b),
      })),
      ...shapefileLayers.map((layer) => ({
        id: layer.id,
        icon: File04,
        summary: shapefileLayerSummary(layer),
        onRemove: () => setShapefileLayers((prev) => prev.filter((l) => l.id !== layer.id)),
      })),
    ],
    [manualBoundaries, parkBoundaries, shapefileLayers],
  );

  // ── Results filtering - real spatial + keyword filtering against the union of every active
  //     boundary, not decorative furniture: a circle boundary uses real haversine distance, a
  //     polygon uses a real point-in-polygon test (see app/pages/_shared/map-search/geo.ts). This
  //     is the *search panel's* keyword field, applied once before entering results mode - each
  //     tab's own per-table search box (ResultsTable) then further refines within this set. ──
  //
  // Core invariant, per direct feedback: every Event/Occurrence/Observation/Artefact shown in a
  // results tab must belong (via its real Project -> Event -> Occurrence -> Observation ancestry,
  // see CONTEXT.md's "BDBSA domain research") to a Project that's also shown in the Projects tab -
  // "if there are 20 events shown, it means the 20 events are somehow linked to the projects that
  // are fetched as results." Computed in two passes:
  //  1. `matchingProjectIds` - a Project qualifies if it, or ANY of its descendants (an Event, an
  //     Occurrence, an Observation, or an Artefact/Attachment), spatially + keyword matches, and
  //     the Project's own status is published (Active/Completed - same exclusion as before). A
  //     roll-up match, not just the Project's own single point - a Project is a container, not a
  //     point on the map, so it's "found" once any real data under it falls inside the search area.
  //  2. Each child tab then shows only records that (a) themselves spatially + keyword match, AND
  //     (b) belong to a Project in `matchingProjectIds` - so a record under an excluded Project
  //     (unpublished, or with nothing else in the area) never appears orphaned from its own parent.
  const matchingProjectIds = useMemo(() => {
    const touched = new Set<string>();
    for (const e of searchEvents) {
      if (isPointInAnyBoundary([e.lat, e.lon], boundaries) && matchesKeyword(`${e.name} ${e.type} ${e.org}`, keyword)) {
        touched.add(rootProjectOfEvent(e).id);
      }
    }
    for (const o of searchOccurrences) {
      if (isPointInAnyBoundary([o.lat, o.lon], boundaries) && matchesKeyword(`${o.species} ${o.commonName} ${o.type}`, keyword)) {
        const project = rootProjectForParentEventId(o.parentEventId);
        if (project) touched.add(project.id);
      }
    }
    for (const o of searchObservations) {
      if (isPointInAnyBoundary([o.lat, o.lon], boundaries) && matchesKeyword(`${o.species} ${o.observerName} ${o.type}`, keyword)) {
        const project = rootProjectForParentEventId(o.parentEventId);
        if (project) touched.add(project.id);
      }
    }
    for (const r of searchResources) {
      if (isPointInAnyBoundary([r.lat, r.lon], boundaries) && matchesKeyword(`${r.name} ${r.recordName} ${r.attachedToConcept}`, keyword)) {
        const project = rootProjectForParentEventId(r.parentEventId);
        if (project) touched.add(project.id);
      }
    }
    // Draft and Under review projects are excluded from search results entirely, same precedent
    // already established for the "Featured Projects" home-dashboard section (app/pages/_shared/
    // home-dashboard.tsx's `featuredProjects`) - and, per the invariant above, excluding a Project
    // here also excludes every one of its descendants below, rather than leaving them shown with
    // no visible parent in the Projects tab.
    return new Set(
      searchEvents.filter((e) => e.type === "Project" && touched.has(e.id) && (e.status === "Active" || e.status === "Completed")).map((e) => e.id),
    );
  }, [boundaries, keyword]);

  // "pre-facet" - spatial + keyword + matchingProjectIds only, same as before this round. The
  // Records-mode "All Filters" panel (see below) layers two more real facets - Region and
  // Organisation - on top of this set, per direct request ("do the same for Records as well...
  // add filter categories and filter values for each group"). Kept separate from the final
  // `filteredX` arrays below so the panel's own Region/Organisation option lists can be derived
  // from this wider set rather than shrinking to nothing the moment a facet is picked.
  const preFacetProjects = useMemo(() => searchEvents.filter((e) => e.type === "Project" && matchingProjectIds.has(e.id)), [matchingProjectIds]);

  const preFacetEvents = useMemo(
    () =>
      searchEvents.filter(
        (e) =>
          e.type !== "Project" &&
          isPointInAnyBoundary([e.lat, e.lon], boundaries) &&
          matchesKeyword(`${e.name} ${e.type} ${e.org}`, keyword) &&
          matchingProjectIds.has(rootProjectOfEvent(e).id),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const preFacetOccurrences = useMemo(
    () =>
      searchOccurrences.filter(
        (o) =>
          isPointInAnyBoundary([o.lat, o.lon], boundaries) &&
          matchesKeyword(`${o.species} ${o.commonName} ${o.type}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(o.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const preFacetObservations = useMemo(
    () =>
      searchObservations.filter(
        (o) =>
          isPointInAnyBoundary([o.lat, o.lon], boundaries) &&
          matchesKeyword(`${o.species} ${o.observerName} ${o.type}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(o.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const preFacetResources = useMemo(
    () =>
      searchResources.filter(
        (r) =>
          isPointInAnyBoundary([r.lat, r.lon], boundaries) &&
          matchesKeyword(`${r.name} ${r.recordName} ${r.attachedToConcept}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(r.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds],
  );

  const toggleColumnFilterValue = (tab: EntityTab, columnId: string, value: string, checked: boolean) => {
    setColumnFilters((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [columnId]: toggleInSet(prev[tab][columnId] ?? new Set<string>(), value, checked) },
    }));
  };

  const filteredProjects = useMemo(
    () => preFacetProjects.filter((e) => matchesColumnFilters(e, projectColumns, columnFilters.projects)),
    [preFacetProjects, columnFilters.projects],
  );
  const filteredEvents = useMemo(
    () => preFacetEvents.filter((e) => matchesColumnFilters(e, eventColumns, columnFilters.events)),
    [preFacetEvents, columnFilters.events],
  );
  const filteredOccurrences = useMemo(
    () => preFacetOccurrences.filter((o) => matchesColumnFilters(o, occurrenceColumns, columnFilters.occurrence)),
    [preFacetOccurrences, columnFilters.occurrence],
  );
  const filteredObservations = useMemo(
    () => preFacetObservations.filter((o) => matchesColumnFilters(o, observationColumns, columnFilters.observations)),
    [preFacetObservations, columnFilters.observations],
  );
  const filteredResources = useMemo(
    () => preFacetResources.filter((r) => matchesColumnFilters(r, resourceColumns, columnFilters.resources)),
    [preFacetResources, columnFilters.resources],
  );
  const resourceArtefacts = useMemo(() => filteredResources.map(resourceToArtefact), [filteredResources]);

  // The "All Filters" panel's own accordion content - one real section per the active tab's own
  // filterable columns (see buildColumnFilterSections above), so switching tabs shows that tab's
  // own real column headers/values, never a fixed, invented facet set.
  const columnFilterSections = useMemo((): AccordionItemType[] => {
    switch (entityTab) {
      case "projects":
        return buildColumnFilterSections(preFacetProjects, projectColumns, columnFilters.projects, (id, v, c) => toggleColumnFilterValue("projects", id, v, c));
      case "events":
        return buildColumnFilterSections(preFacetEvents, eventColumns, columnFilters.events, (id, v, c) => toggleColumnFilterValue("events", id, v, c));
      case "occurrence":
        return buildColumnFilterSections(preFacetOccurrences, occurrenceColumns, columnFilters.occurrence, (id, v, c) =>
          toggleColumnFilterValue("occurrence", id, v, c),
        );
      case "observations":
        return buildColumnFilterSections(preFacetObservations, observationColumns, columnFilters.observations, (id, v, c) =>
          toggleColumnFilterValue("observations", id, v, c),
        );
      case "resources":
        return buildColumnFilterSections(preFacetResources, resourceColumns, columnFilters.resources, (id, v, c) => toggleColumnFilterValue("resources", id, v, c));
    }
  }, [entityTab, preFacetProjects, preFacetEvents, preFacetOccurrences, preFacetObservations, preFacetResources, columnFilters]);

  // The active tab's own filterable columns as plain {id, label} pairs - used for the pill row
  // below, kept separate from `columnFilterSections` (which needs real option values too, not just
  // the column identity) so building pills doesn't require re-deriving every column's full value
  // list a second time.
  const activeFilterableColumns = useMemo((): { id: string; label: string }[] => {
    switch (entityTab) {
      case "projects":
        return filterableColumns(projectColumns).map((c) => ({ id: c.id, label: c.label }));
      case "events":
        return filterableColumns(eventColumns).map((c) => ({ id: c.id, label: c.label }));
      case "occurrence":
        return filterableColumns(occurrenceColumns).map((c) => ({ id: c.id, label: c.label }));
      case "observations":
        return filterableColumns(observationColumns).map((c) => ({ id: c.id, label: c.label }));
      case "resources":
        return filterableColumns(resourceColumns).map((c) => ({ id: c.id, label: c.label }));
    }
  }, [entityTab]);

  const activeTabColumnFilters = columnFilters[entityTab];
  const recordsFilterCount = Object.values(activeTabColumnFilters).reduce((sum, values) => sum + values.size, 0);

  // One removable pill per selected value, scoped to the currently active tab only - matching how
  // the panel itself only ever shows that tab's own real columns, never a cross-tab combined list.
  const recordsFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    for (const col of activeFilterableColumns) {
      const values = activeTabColumnFilters[col.id] ?? new Set<string>();
      for (const v of values) {
        pills.push({ key: `${col.id}:${v}`, label: `${col.label}: ${v}`, onRemove: () => toggleColumnFilterValue(entityTab, col.id, v, false) });
      }
    }
    return pills;
  }, [activeFilterableColumns, activeTabColumnFilters, entityTab]);

  const clearRecordsFilters = () => setColumnFilters((prev) => ({ ...prev, [entityTab]: {} }));

  const countFor = (tab: EntityTab) =>
    ({
      projects: filteredProjects.length,
      events: filteredEvents.length,
      occurrence: filteredOccurrences.length,
      observations: filteredObservations.length,
      resources: filteredResources.length,
    })[tab];
  const totalCount = filteredProjects.length + filteredEvents.length + filteredOccurrences.length + filteredObservations.length + filteredResources.length;

  const runSearch = () => {
    setMode("results");
    setEntityTab("projects");
  };

  // Same real behaviour the top-level DLA banner's own "Go to DLA"/"Sign up for access" CTA
  // already uses (see the AlertFullWidth below) - pulled out so Species mode's own DLA notice and
  // export gating (species-results.tsx) can reuse it rather than reimplementing the branch.
  const requestDlaAccess = () => {
    if (isPublicUser) {
      setDlaSignUpOpen(true);
      return;
    }
    const dlaSection = nav.find((section) => section.label === "Data Licencing Agreement (DLA)");
    if (dlaSection) goToSection(dlaSection);
  };

  // Records mode's own export rows, one branch per EntityTab, each pulling straight from that
  // tab's own already-filtered array (filteredProjects/filteredEvents/...) - the same plain fields
  // recordsExportHeaders above names, in the same order.
  const recordsExportRows = (): string[][] => {
    switch (entityTab) {
      case "projects":
        return filteredProjects.map((e) => [e.code, e.name, e.org, e.status, e.contributorName ?? "-", e.updated ?? "-"]);
      case "events":
        return filteredEvents.map((e) => [e.code, e.name, e.type, e.startDate, e.endDate]);
      case "occurrence":
        return filteredOccurrences.map((o) => [o.id, o.commonName, o.type, o.species, o.date]);
      case "observations":
        return filteredObservations.map((o) => [o.id, o.commonName, o.type, o.species, o.date]);
      case "resources":
        return filteredResources.map((r) => [r.name, r.type, r.attachedToConcept, r.recordId, r.recordName]);
    }
  };

  // Header-row "Export results" control - works in both view modes, per direct feedback ("the
  // export results disappears when records view is selected... make sure the export button
  // stays"). Species mode reuses `EXPORT_HEADERS`/`exportRowFor` exported from species-results.tsx
  // and `speciesExportRows` (that component's own currently fully-filtered rows, reported up via
  // `onExportableRowsChange`); Records mode exports whichever entity tab is currently active, via
  // `recordsExportHeaders`/`recordsExportRows` above. Same guest gating either way - a guest's
  // click opens the sign-up invite modal instead of downloading anything.
  const runExport = (kind: "csv" | "excel" | "pdf") => {
    if (isPublicUser) {
      setExportSignUpOpen(true);
      return;
    }
    const headers = viewMode === "species" ? EXPORT_HEADERS : recordsExportHeaders[entityTab];
    const rowsOut = viewMode === "species" ? speciesExportRows.map(exportRowFor) : recordsExportRows();
    const baseName = viewMode === "species" ? "biodata-sa-species-search" : `biodata-sa-${entityTab}-search`;
    const title =
      viewMode === "species" ? "BioData SA - Species Search Results" : `BioData SA - ${entityTabs.find((t) => t.id === entityTab)?.label} Results`;
    if (kind === "csv") downloadCsv(`${baseName}.csv`, headers, rowsOut);
    if (kind === "excel") downloadExcel(`${baseName}.xls`, headers, rowsOut);
    if (kind === "pdf") printAsPdf(title, headers, rowsOut);
  };

  // A results view with nothing left to show (every area was removed from within it) isn't a
  // useful state to sit in - derived, not synced via an effect, so removing the last boundary
  // falls back to the search view in the same render rather than flashing an empty results screen
  // first. `mode` still tracks the user's own intent (e.g. pressing "Search records" again once a
  // boundary exists works immediately, no stale effect to catch up with).
  const displayMode = boundaries.length === 0 ? "search" : mode;

  const iconRail = (
    <PrimaryRail sections={nav} activeSection={activeSection} onSelectSection={goToSection} />
  );

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header ── */}
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
        }
        section={"Explore"}
      />

      {activeSection !== "Explore" ? (
        <div className="flex flex-1 overflow-hidden">
          {iconRail}
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
              {activeSectionNode.items?.map((item) => <NavTree key={item.label} node={item} />)}
            </div>
            <SidebarFooterLinks />
          </aside>
          <main className="flex flex-1 flex-col overflow-y-auto">
            <SectionPlaceholder node={activeSectionNode} />
          </main>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {iconRail}

          {/* Search mode keeps the page-level scroll it always had (overflow-y-auto +
              [scrollbar-gutter:stable], the fix two rounds ago for the metrics tab row's own
              horizontal/vertical shift on tab switch - see that comment's own history). Results
              mode drops it entirely (`overflow-hidden`) - the results view now manages its own
              internal scroll region around just the table's rows (see `ResultsTable` and
              `Table`'s `bodyScrollable`/`sticky` props), so the toolbar/pagination stay on-screen
              and the page itself never grows taller than the viewport, per direct feedback. */}
          <main className={cx("flex flex-1 flex-col", displayMode === "search" ? "overflow-y-auto [scrollbar-gutter:stable]" : "overflow-hidden")}>
            {displayMode === "search" ? (
              // The map fills the whole content area. The page heading and the search controls live
              // together in one floating card over it (no separate top bar), per direct feedback.
              // `z-[1000]` - Leaflet's own panes go up to ~700, so a plain z-50 renders under tiles.
              <div className="relative min-h-[640px] flex-1 overflow-hidden">
                <div className="absolute inset-0">
                  <SAMap
                    boundaries={boundaries}
                    onBoundaryAdd={addManualBoundary}
                    activeDrawTool={activeDrawTool}
                    onDrawToolChange={setActiveDrawTool}
                    fitPaddingTopLeft={searchPanelOpen ? [512, 48] : [48, 120]}
                    className="size-full"
                  />
                </div>

                {/* Collapsing minimises the card to its own header (title + a one-line status of
                    what's defined so far) rather than swapping it for a separate button - the card
                    stays the same object in the same place, just folded, with Search still one
                    click away once areas exist. */}
                <section
                  aria-label="Search biodiversity records"
                  className="absolute top-4 right-4 left-4 z-[1000] flex max-h-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg lg:right-auto lg:w-[480px]"
                >
                  <div className="flex shrink-0 items-start gap-3 p-4">
                    <button
                      type="button"
                      aria-expanded={searchPanelOpen}
                      aria-controls="search-panel-body"
                      onClick={() => setSearchPanelOpen((v) => !v)}
                      className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-md text-left outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <span className="text-lg font-semibold text-primary">Search biodiversity records</span>
                      <span className="text-sm text-tertiary">
                        {searchPanelOpen
                          ? "Define one or more areas to search Projects, Events, Occurrences and Observations across South Australia."
                          : areaEntries.length > 0
                            ? `${areaEntries.length} search area${areaEntries.length === 1 ? "" : "s"} defined${keyword ? ` · "${keyword}"` : ""}`
                            : "No search area defined yet"}
                      </span>
                    </button>
                    {!searchPanelOpen && boundaries.length > 0 && (
                      <Button color="primary" size="sm" iconLeading={SearchLg} className="shrink-0" onPress={runSearch}>
                        Search
                      </Button>
                    )}
                    <Button
                      color="tertiary"
                      size="sm"
                      iconLeading={searchPanelOpen ? ChevronUp : ChevronDown}
                      aria-label={searchPanelOpen ? "Minimise search panel" : "Expand search panel"}
                      className="shrink-0"
                      onPress={() => setSearchPanelOpen((v) => !v)}
                    />
                  </div>

                  {searchPanelOpen && (
                  <div id="search-panel-body" className="flex min-h-0 flex-col overflow-y-auto border-t border-secondary p-4">
                    <Tabs selectedKey={method} onSelectionChange={(key) => setMethod(key as Method)} className="flex flex-col gap-3">
                      <TabList aria-label="Boundary method" type="button-border" size="sm" fullWidth>
                        {methodTabs.map((m) => (
                          <Tab key={m.id} id={m.id} label={m.label} icon={m.icon} />
                        ))}
                      </TabList>

                      <TabPanel id="draw" className="flex flex-col gap-3 pt-4">
                        <p className="text-sm text-tertiary">Draw as many circles or polygons as you need directly on the map to define your search area.</p>
                        <div className="flex gap-2">
                          <Button
                            color={activeDrawTool === "circle" ? "primary" : "secondary"}
                            size="sm"
                            iconLeading={Circle}
                            className="flex-1"
                            onPress={() => setActiveDrawTool(activeDrawTool === "circle" ? null : "circle")}
                          >
                            {activeDrawTool === "circle" ? "Drawing…" : "Draw circle"}
                          </Button>
                          <Button
                            color={activeDrawTool === "polygon" ? "primary" : "secondary"}
                            size="sm"
                            iconLeading={Pentagon}
                            className="flex-1"
                            onPress={() => setActiveDrawTool(activeDrawTool === "polygon" ? null : "polygon")}
                          >
                            {activeDrawTool === "polygon" ? "Drawing…" : "Draw polygon"}
                          </Button>
                        </div>
                        {activeDrawTool && (
                          <p className="text-xs text-tertiary">
                            {activeDrawTool === "circle"
                              ? "Click and drag on the map to set the centre and radius."
                              : "Click to place each point, then double-click to finish."}
                          </p>
                        )}
                      </TabPanel>

                      <TabPanel id="coordinates" className="flex flex-col gap-3 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <InputNumber key={`lat-${coordResetKey}`} label="Latitude" placeholder="-34.93" step={0.01} minValue={-38} maxValue={-25} onChange={setLat} />
                          <InputNumber key={`lon-${coordResetKey}`} label="Longitude" placeholder="138.60" step={0.01} minValue={129} maxValue={141} onChange={setLon} />
                        </div>
                        <InputNumber label="Search radius (km)" defaultValue={25} minValue={1} maxValue={300} step={5} onChange={setCoordRadius} />
                        <Button color="secondary" size="sm" iconLeading={Plus} isDisabled={lat == null || lon == null} onPress={applyCoordinates}>
                          Add point
                        </Button>
                      </TabPanel>

                      <TabPanel id="location" className="flex flex-col gap-3 pt-4">
                        <MultiSelect
                          label="Select location"
                          placeholder="Choose one or more parks"
                          items={parkItems}
                          selectedKeys={selectedParkIds}
                          onSelectionChange={setSelectedParkIds}
                          className="w-full"
                        >
                          {(item) => <MultiSelect.Item {...item}>{item.label}</MultiSelect.Item>}
                        </MultiSelect>
                        <InputNumber label="Search radius (km)" defaultValue={15} minValue={1} maxValue={100} step={5} onChange={setParkRadius} />
                      </TabPanel>
                      <TabPanel id="shapefile" className="flex flex-col gap-3 pt-4">
                        <p className="text-sm text-tertiary">
                          Upload a shapefile to search around the locations it contains. Points are searched within the radius below; polygons are searched as drawn.
                        </p>
                        <InputFile
                          key={`shp-${shapefileInputKey}`}
                          label="Shapefile"
                          placeholder={shapefileBusy ? "Reading file…" : "Choose file(s)"}
                          acceptedFileTypes={[".zip", ".shp", ".dbf", ".prj", ".cpg", ".geojson", ".json"]}
                          allowsMultiple
                          isInvalid={!!shapefileError}
                          hint={
                            shapefileError ??
                            "A .zip of the shapefile, or the .shp with its .dbf and .prj selected together. GeoJSON also works. Up to 500 locations."
                          }
                          onChange={(files) => files && files.length > 0 && handleShapefileUpload(Array.from(files))}
                        />
                        <InputNumber label="Radius around each point (km)" value={shapefileRadius} minValue={1} maxValue={100} step={1} onChange={(v) => setShapefileRadius(v || 1)} />
                      </TabPanel>
                    </Tabs>

                    {areaEntries.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {areaEntries.map((entry) => (
                          <div key={entry.id} className="flex items-start justify-between gap-3 rounded-lg border border-secondary bg-secondary p-3">
                            <div className="flex min-w-0 items-start gap-2 text-sm text-secondary">
                              <entry.icon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                              <span className="break-words">{entry.summary}</span>
                            </div>
                            <Button color="link-gray" size="sm" iconLeading={Trash01} className="shrink-0" onPress={entry.onRemove}>
                              Remove
                            </Button>
                          </div>
                        ))}
                        {areaEntries.length > 1 && (
                          <Button color="link-gray" size="sm" className="self-start" onPress={clearAllBoundaries}>
                            Clear all
                          </Button>
                        )}
                      </div>
                    )}

                    <Input icon={SearchLg} placeholder="Species or keyword (optional)" value={keyword} onChange={setKeyword} className="mt-4" />

                    <Button color="primary" size="md" className="mt-4 w-full" isDisabled={boundaries.length === 0} onPress={runSearch}>
                      Search records
                    </Button>
                  </div>
                  )}
                </section>
              </div>
            ) : (
              // min-h-0 - lets this results view shrink to <main>'s own bounded height (now
              // overflow-hidden, not overflow-y-auto - see <main>'s own comment above) instead of
              // growing past the viewport; its own children below split into fixed-height toolbar
              // pieces (shrink-0) and the one `flex-1 min-h-0` table region that actually scrolls.
              <div className="flex min-h-0 flex-1 flex-col">
                {/* A real, single-line warning banner - not the plain-text caption this used to
                    be - sitting above everything else on the results screen, per direct request
                    ("on the top"), shown to every role. Registered users get a real "Go to DLA"
                    link (`publicUserNav` has no Data Licencing Agreement section for a guest to
                    land on, so that destination doesn't exist for them) - a guest instead gets the
                    same real, always-visible CTA pattern `GuestActionButton` already established
                    elsewhere on this page: the control is real, not hidden, but a guest's click
                    opens the sign-up invite modal instead of navigating somewhere that isn't
                    theirs to use yet.
                    Per direct UI feedback: dismissible (a real corner close icon - `onClose`
                    already renders one on `AlertFullWidth`, just wasn't wired up before), left-
                    aligned and slim (the `className` override already documented on that
                    component for exactly this - dropping the centred `max-w-container` and
                    cutting vertical padding), and a subtle warning tint on the background/bottom
                    border instead of the neutral default (`tintedBackground`, a new additive prop
                    on `AlertFullWidth` - see alerts.tsx - defaulting to false so every other real
                    consumer of that shared component is untouched). */}
                {!dlaBannerDismissed && (
                  <div className="shrink-0">
                    <AlertFullWidth
                      color="warning"
                      tintedBackground
                      hideDismissButton
                      title="You're viewing public data"
                      description="Some records are restricted. Request a Data Licencing Agreement (DLA) for full access."
                      confirmLabel={isPublicUser ? "Sign up for access" : "Go to DLA"}
                      onConfirm={requestDlaAccess}
                      onClose={() => setDlaBannerDismissed(true)}
                      className="mx-0 max-w-none px-6 py-2.5 md:px-6 md:py-2.5"
                    />
                  </div>
                )}
                <SignUpPromptModal
                  isOpen={exportSignUpOpen}
                  onOpenChange={setExportSignUpOpen}
                  icon={Download01}
                  title="Sign up to export data"
                  description="Exporting records needs a free BioData SA account. Create one to download project and record data."
                />
                <SignUpPromptModal
                  isOpen={dlaSignUpOpen}
                  onOpenChange={setDlaSignUpOpen}
                  icon={FileLock01}
                  title="Sign up to request full access"
                  description="Restricted data needs a free BioData SA account. Create one to request a Data Licencing Agreement (DLA)."
                />

                {/* "Edit search" is grouped tightly with the heading/subheading (see its own
                    earlier fix, still in place). The Records/Species view-mode toggle used to sit
                    in its own full-width row below this header, an awkward, disconnected spot per
                    direct feedback - moved into `SectionHeader.Actions`, the header row's own
                    established trailing-content slot (already used this way elsewhere in this
                    codebase, e.g. app/pages/_shared/data-overview.tsx), so title and view switch
                    read as one coherent header instead of two stacked, unrelated rows. */}
                <SectionHeader.Root className="shrink-0 p-6">
                  <div className="flex flex-col gap-2">
                    <Button color="link-gray" size="sm" iconLeading={ArrowNarrowLeft} onPress={() => setMode("search")} className="self-start">
                      Edit search
                    </Button>
                    <SectionHeader.Group>
                      <div className="flex flex-1 flex-col gap-1">
                        <SectionHeader.Heading>Search results</SectionHeader.Heading>
                        <SectionHeader.Subheading>
                          {totalCount} record{totalCount === 1 ? "" : "s"} found across{" "}
                          <button
                            type="button"
                            aria-expanded={showSearchAreas}
                            aria-controls="search-areas-list"
                            onClick={() => setShowSearchAreas((v) => !v)}
                            className="inline-flex cursor-pointer items-center gap-0.5 rounded font-semibold text-brand-secondary underline decoration-dotted underline-offset-2 outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {areaEntries.length} search area{areaEntries.length === 1 ? "" : "s"}
                            {showSearchAreas ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                        </SectionHeader.Subheading>
                        {showSearchAreas && (
                          <ul id="search-areas-list" className="mt-2 flex flex-wrap gap-2">
                            {areaEntries.map((entry) => (
                              <li key={entry.id} className="inline-flex max-w-full items-start gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary">
                                <entry.icon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                                <span className="break-words">{entry.summary}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <SectionHeader.Actions>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-secondary bg-secondary p-1">
                          {/* Species first, Records second - per direct feedback ("interchange
                              species and records - species must be first"). The default active
                              view (`viewMode`'s own initial state, still "records") is untouched -
                              only the two buttons' left-to-right order changed. */}
                          {(["species", "records"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setViewMode(m)}
                              className={cx(
                                "rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition duration-100 ease-linear",
                                viewMode === m ? "bg-primary text-brand-secondary shadow-xs" : "text-tertiary hover:text-secondary",
                              )}
                            >
                              {m === "records" ? "Records" : "Species"}
                            </button>
                          ))}
                        </div>
                        {/* Export results - now works in both Records and Species mode, per direct
                            feedback ("the export results disappears when records view is
                            selected... make sure the export button stays"). Sits in the header row
                            next to the view toggle either way - see runExport's own comment for how
                            it branches on `viewMode`/`entityTab` to export whatever's currently
                            shown. */}
                        {isPublicUser ? (
                          // `Tooltip` (not `TooltipTrigger`, which renders its own real
                          // `<button>`) wrapping a real, enabled `Button` directly -
                          // `TooltipTrigger` would nest one button inside another, invalid HTML.
                          <Tooltip title="Create a free account to export results">
                            <Button color="secondary" size="md" iconLeading={Download01} onPress={() => setExportSignUpOpen(true)}>
                              Export results
                            </Button>
                          </Tooltip>
                        ) : (
                          <Dropdown.Root>
                            <Button color="secondary" size="md" iconLeading={Download01}>
                              Export results
                            </Button>
                            <Dropdown.Popover placement="bottom right" className="w-48">
                              <Dropdown.Menu aria-label="Export format">
                                <Dropdown.Item id="csv" icon={FileDownload01} onAction={() => runExport("csv")}>
                                  Export as CSV
                                </Dropdown.Item>
                                <Dropdown.Item id="excel" icon={File07} onAction={() => runExport("excel")}>
                                  Export as Excel
                                </Dropdown.Item>
                                <Dropdown.Item id="pdf" icon={Printer} onAction={() => runExport("pdf")}>
                                  Export as PDF
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown.Root>
                        )}
                      </SectionHeader.Actions>
                    </SectionHeader.Group>
                  </div>
                </SectionHeader.Root>

                {/* ── View mode ── Species vs. the existing Projects/Events/Occurrences/
                    Observations/Artefacts record-by-record view below, per direct request: "a
                    toggle view to view results as a species mode or Projects, Events,
                    Occurrences, Observations and Resources leaving what we have accomplished
                    already." Everything below this toggle for "Records" is completely unchanged
                    from before this feature - only "Species" is new. Both branches now share the
                    same `p-6`/`px-6 pt-4` rhythm as the header above - the Records-mode metrics
                    row used to have no horizontal padding of its own at all (flush to the
                    viewport edge while the header and table content on either side of it were
                    both padded), the concrete "padding is kind of broken" bug per direct
                    feedback. */}
                {viewMode === "species" && (
                  <div className="min-h-0 flex-1 overflow-hidden p-6 pt-4">
                    <SpeciesResultsView
                      rows={filteredOccurrences}
                      onRowClick={(o) => setSelectedRecord({ kind: "occurrence", occurrence: o })}
                      onExportableRowsChange={setSpeciesExportRows}
                    />
                  </div>
                )}

                {viewMode === "records" && (
                  <>
                {/* ── Metrics section ── a real, working stat-tile switcher, originally built to
                    match Figma's own "Metrics section" exactly (get_design_context on I209:27950)
                    - plain buttons, not react-aria Tab semantics, matching Figma's own generated
                    markup there. Now renders through the shared `MetricTile` (metric-tile.tsx),
                    per direct feedback to keep this row and the Species view's own taxonomic-group
                    tile row visually identical - a deliberate departure from that Figma frame's
                    flush, un-rounded, colour-only-on-underline tiles (`MetricTile`'s selected state
                    is a real border-colour + light-brand-background change instead, gapped and
                    rounded, matching the "light brand BG, border colour = brand" card-selection
                    language already established on the signup flow's affiliation cards) - see
                    metric-tile.tsx's own doc comment for why this is bug-safe without the earlier
                    absolutely-positioned underline-bar workaround. ── */}
                <div className="flex w-full shrink-0 items-stretch gap-2 px-6 pt-4">
                  {entityTabs.map((t) => (
                    <MetricTile key={t.id} icon={t.icon} label={t.label} value={countFor(t.id)} active={entityTab === t.id} onClick={() => setEntityTab(t.id)} />
                  ))}
                </div>

                {/* ── Shared search + "All Filters" row - a full-width search box with the "All
                    Filters" button pinned to its right edge, per direct feedback ("the search bar
                    shall be full width and the all filters button on the right. Do the same for
                    records screen as well") - same full-width shape as Species mode's own toolbar
                    (species-results.tsx). One search box and one filter panel trigger shared across
                    all 5 entity tabs. Each tab's own `ResultsTable` below wires its internal search
                    box to `recordsSearch` via `searchValue`/`onSearchChange`/`hideSearchBox`
                    instead of rendering its own, and picks up `showHeaderColumnCustomizer` so its
                    "Customise columns" trigger stays a floating icon over the table (opening the
                    same right-hand SidePanel it always has) rather than an empty leftover row where
                    its own search box used to be. ── */}
                <div className="flex shrink-0 items-center gap-3 px-6 pt-4">
                  <Input icon={SearchLg} placeholder="Search" value={recordsSearch} onChange={setRecordsSearch} className="flex-1" />
                  <Button
                    color="secondary"
                    size="md"
                    iconLeading={FilterLines}
                    onPress={() => setRecordsFilterPanelOpen(true)}
                    className="min-w-[220px] shrink-0 justify-center"
                  >
                    All Filters{recordsFilterCount > 0 ? ` (${recordsFilterCount})` : ""}
                  </Button>
                </div>

                {recordsFilterPills.length > 0 && (
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-6 pt-2">
                    {recordsFilterPills.map((pill) => (
                      <span
                        key={pill.key}
                        className="inline-flex items-center gap-1 rounded-full border border-secondary bg-secondary py-1 pr-1 pl-2.5 text-xs font-medium text-secondary"
                      >
                        {pill.label}
                        <button
                          type="button"
                          onClick={pill.onRemove}
                          aria-label={`Remove filter: ${pill.label}`}
                          className="flex size-4 shrink-0 items-center justify-center rounded-full text-quaternary outline-focus-ring hover:bg-primary_hover hover:text-primary"
                        >
                          <Trash01 className="size-3" />
                        </button>
                      </span>
                    ))}
                    <Button color="link-gray" size="sm" onPress={clearRecordsFilters}>
                      Clear all
                    </Button>
                  </div>
                )}

                {/* min-h-0 flex-1 overflow-hidden - takes exactly the space left over below the
                    toolbar pieces above; ResultsTable's own internal scroll region (its table
                    body, via Table's `bodyScrollable` prop) fills this and scrolls on its own,
                    keeping the chip row/pagination on-screen at all times. */}
                <div className="min-h-0 flex-1 overflow-hidden p-6 pt-4">
                  {entityTab === "projects" && (
                    <ResultsTable
                      ariaLabel="Projects"
                      columns={projectColumns}
                      rows={filteredProjects}
                      emptyLabel="projects"
                      rowTextValue={(e) => e.name}
                      searchText={(e) => `${e.code} ${e.name} ${e.org}`}
                      viewActionLabel="View Project"
                      onRowClick={(e) => setSelectedRecord({ kind: "event", event: e })}
                      searchValue={recordsSearch}
                      onSearchChange={setRecordsSearch}
                      hideSearchBox
                      showHeaderColumnCustomizer
                    />
                  )}

                  {entityTab === "events" && (
                    <ResultsTable
                      ariaLabel="Events"
                      columns={eventColumns}
                      rows={filteredEvents}
                      typeField="type"
                      typeOptions={eventTypeOptions}
                      emptyLabel="events"
                      rowTextValue={(e) => e.name}
                      searchText={(e) => `${e.id} ${e.name} ${e.type} ${e.org}`}
                      onRowClick={(e) => setSelectedRecord({ kind: "event", event: e })}
                      searchValue={recordsSearch}
                      onSearchChange={setRecordsSearch}
                      hideSearchBox
                      showHeaderColumnCustomizer
                    />
                  )}

                  {entityTab === "occurrence" && (
                    <ResultsTable
                      ariaLabel="Occurrences"
                      columns={occurrenceColumns}
                      rows={filteredOccurrences}
                      typeField="type"
                      typeOptions={occurrenceTypeOptions}
                      emptyLabel="occurrence records"
                      rowTextValue={(o) => o.commonName}
                      searchText={(o) => `${o.id} ${o.commonName} ${o.species} ${o.type}`}
                      showHeaderColumnCustomizer
                      onRowClick={(o) => setSelectedRecord({ kind: "occurrence", occurrence: o })}
                      searchValue={recordsSearch}
                      onSearchChange={setRecordsSearch}
                      hideSearchBox
                    />
                  )}

                  {entityTab === "observations" && (
                    <ResultsTable
                      ariaLabel="Observations"
                      columns={observationColumns}
                      rows={filteredObservations}
                      typeField="type"
                      typeOptions={occurrenceTypeOptions}
                      emptyLabel="observations"
                      rowTextValue={(o) => o.commonName}
                      searchText={(o) => `${o.id} ${o.commonName} ${o.species} ${o.observerName} ${o.type}`}
                      onRowClick={(o) => setSelectedRecord({ kind: "observation", observation: o })}
                      searchValue={recordsSearch}
                      onSearchChange={setRecordsSearch}
                      hideSearchBox
                      showHeaderColumnCustomizer
                    />
                  )}

                  {entityTab === "resources" && (
                    <ResultsTable
                      ariaLabel="Artefacts and Attachments"
                      columns={resourceColumns}
                      rows={filteredResources}
                      typeField="type"
                      typeOptions={resourceTypeOptions}
                      emptyLabel="artefacts or attachments"
                      rowTextValue={(r) => r.name}
                      searchText={(r) => `${r.id} ${r.name} ${r.recordName} ${r.attachedToConcept}`}
                      onRowClick={(r) => setArtefactIndex(filteredResources.findIndex((row) => row.id === r.id))}
                      searchValue={recordsSearch}
                      onSearchChange={setRecordsSearch}
                      hideSearchBox
                      showHeaderColumnCustomizer
                    />
                  )}
                </div>

                {/* ── "All Filters" panel - left-anchored, matching Species mode's own left panel
                    (see species-results.tsx). Content is the currently active entity tab's own
                    real column headers/values (`columnFilterSections`, built from that tab's own
                    ColumnDef list - see buildColumnFilterSections above), per direct feedback that
                    this panel must reflect the table's real columns rather than an invented facet
                    set. Hierarchy is never a section (excluded in `filterableColumns`), per direct
                    request. ── */}
                <SidePanel
                  isOpen={recordsFilterPanelOpen}
                  onOpenChange={setRecordsFilterPanelOpen}
                  title="All Filters"
                  side="left"
                  widthClassName="max-w-sm"
                  headerActions={
                    recordsFilterCount > 0 ? (
                      <Button color="link-gray" size="sm" onPress={clearRecordsFilters}>
                        Clear all
                      </Button>
                    ) : undefined
                  }
                >
                  <Accordion variant="compact" items={columnFilterSections} />
                </SidePanel>
                  </>
                )}
              </div>
            )}

            <RecordDetailSidebar record={selectedRecord} onClose={() => setSelectedRecord(null)} />
            <ArtefactLightbox artefacts={resourceArtefacts} index={artefactIndex} onClose={() => setArtefactIndex(null)} onNavigate={setArtefactIndex} />
          </main>
        </div>
      )}
    </div>
  );
}

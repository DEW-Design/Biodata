"use client";

import type { FC } from "react";
import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Selection } from "react-aria-components";
import { Button as AriaButton, Dialog, DialogTrigger, Focusable, Tabs } from "react-aria-components";
import { TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import {
  ChevronDown,
  HomeLine,
  Folder,
  Eye,
  FileLock01,
  Feather,
  BarChart01,
  FileSearch01,
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
  Map01,
  Map02,
  PenTool02,
  SearchLg,
  ArrowNarrowLeft,
  Plus,
  LayerSingle,
  LayersThree01,
  Waves,
  Users01,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { MultiSelect } from "@/components/base/select/multi-select";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Popover } from "@/components/base/select/popover";
import { Breadcrumb } from "@/components/scaffold/breadcrumb";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { RoleSwitcher } from "@/app/pages/_shared/role-switcher";
import { GuestActionButton, SignUpPromptModal } from "@/app/pages/_shared/guest-action-gate";
import { GlobalProjectSearch } from "@/app/pages/_shared/global-search";
import { SA_NATIONAL_PARKS, isPointInAnyBoundary, boundarySummary, type Boundary } from "@/app/pages/_shared/map-search/geo";
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
import { RecordDetailSidebar, type DetailRecord } from "@/app/pages/_shared/map-search/record-detail";
import { ArtefactLightbox, type Artefact, type ArtefactType } from "@/app/pages/_shared/artefact-lightbox";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { useUserRole } from "@/lib/use-user-role";
import { useRoleHref } from "@/lib/use-role-href";
import { orgLabelForRole } from "@/lib/user-role";
import { registeredUserNav, publicUserNav, registeredUserAccountMenu, registeredUserFooterLinks, keyHref, type NavNode } from "@/lib/registered-user-nav";
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
// (`entityTabs` below), the route/key (`/pages/observations/option-1`) is untouched.
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

const sectionIcons: Record<string, FC<{ className?: string }>> = {
  Home: HomeLine,
  Projects: Folder,
  Explore: Map01,
  "Data Licencing Agreement (DLA)": FileLock01,
  "Nominate Sensitive Species": Feather,
  "Reports (Own Submissions)": BarChart01,
  "Template Finder": FileSearch01,
};

const CURRENT_KEY = "observations";

type Method = "draw" | "coordinates" | "location";
// Reversed per direct business feedback: Projects is its own top-level tab again, separate from
// Events - matches the new Figma reference (node 209:27950, "Projects" first in the metrics bar,
// ahead of Events/Occurrences/Observations/Resources). A Project is still internally an Event
// (`type: "Project"` in search-data.ts, no change to the underlying data model - only which tab a
// Project-type row surfaces in) - `filteredProjects`/`filteredEvents` below split the same
// underlying `searchEvents` array so a Project is never counted or shown in both tabs at once.
type EntityTab = "projects" | "events" | "occurrence" | "observations" | "resources";

const methodTabs: { id: Method; label: string; icon: FC<{ className?: string }> }[] = [
  { id: "draw", label: "Draw on map", icon: PenTool02 },
  { id: "coordinates", label: "Enter coordinates", icon: MarkerPin02 },
  { id: "location", label: "Select a location", icon: Map02 },
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

const parkItems = SA_NATIONAL_PARKS.map((park) => ({ id: park.id, label: park.name }));

function matchesKeyword(haystack: string, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  return !q || haystack.toLowerCase().includes(q);
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
  {
    id: "name",
    label: "Project",
    render: (e) => (
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-primary">{e.name}</p>
        {e.description && <p className="max-w-md truncate text-xs text-tertiary">{e.description}</p>}
      </div>
    ),
  },
  { id: "org", label: "Organisation", render: (e) => <span className="text-sm text-secondary">{e.org}</span> },
  {
    id: "status",
    label: "Status",
    render: (e) => (
      <Badge size="sm" color={e.statusColor}>
        {e.status}
      </Badge>
    ),
  },
  {
    id: "contributor",
    label: "Contributor",
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
  { id: "updated", label: "Updated", render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.updated ?? "-"}</span> },
];

const eventColumns: ColumnDef<SearchEvent>[] = [
  { id: "id", label: "Event ID", render: (e) => <span className="text-sm text-tertiary">{e.code}</span> },
  { id: "name", label: "Event Name", render: (e) => <span className="text-sm font-medium text-primary">{e.name}</span> },
  {
    id: "type",
    label: "Event Type",
    headerTooltip: "The kind of event this row represents in the Site → Visit/Transect/Quadrat/Block/Ramble/Trap/Custom event hierarchy.",
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
  { id: "startDate", label: "Start Date", render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.startDate}</span> },
  { id: "endDate", label: "End Date", render: (e) => <span className="text-sm whitespace-nowrap text-tertiary">{e.endDate}</span> },
  { id: "hierarchy", label: "Hierarchy", render: (e) => <HierarchyCell chain={eventChain(e)} /> },
];

// "Project" deliberately excluded - Project-type rows now live in their own Projects tab (see
// EntityTab above), never mixed into the Events tab's own sub-filter chips.
const eventTypeOptions: TypeFilterOption[] = (["Site", "Visit", "Transect", "Quadrat", "Block", "Ramble", "Trap", "Custom event"] as const).map((t) => ({
  value: t,
  label: t,
  icon: eventTypeIcon[t],
}));

const occurrenceColumns: ColumnDef<SearchOccurrence>[] = [
  { id: "id", label: "Occurrence ID", render: (o) => <span className="text-sm text-tertiary">{o.id}</span> },
  { id: "name", label: "Occurrence Name", render: (o) => <span className="text-sm font-medium text-primary">{o.commonName}</span> },
  {
    id: "type",
    label: "Occurrence Type",
    headerTooltip: "Individual, Population, Non-Biotic, or Community - the record's biological classification.",
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
  { id: "species", label: "Scientific Name", render: (o) => <span className="text-sm text-tertiary italic">{o.species}</span> },
  { id: "date", label: "Date", render: (o) => <span className="text-sm whitespace-nowrap text-tertiary">{o.date}</span> },
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
  { id: "id", label: "Observation ID", render: (o) => <span className="text-sm text-tertiary">{o.id}</span> },
  { id: "name", label: "Observation Name", render: (o) => <span className="text-sm font-medium text-primary">{o.commonName}</span> },
  {
    id: "type",
    label: "Observation Type",
    headerTooltip: "Individual, Population, Non-Biotic, or Community - the record's biological classification.",
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
  { id: "species", label: "Scientific Name", render: (o) => <span className="text-sm text-tertiary italic">{o.species}</span> },
  { id: "date", label: "Date", render: (o) => <span className="text-sm whitespace-nowrap text-tertiary">{o.date}</span> },
  { id: "hierarchy", label: "Hierarchy", render: (o) => <HierarchyCell chain={hierarchyFor(o.parentEventId)} /> },
];

const resourceTypeIcon: Record<ResourceType, FC<{ className?: string }>> = { Image: Image01, File: File01, "Reference Link": Link02 };

const resourceColumns: ColumnDef<SearchResource>[] = [
  {
    id: "name",
    label: "Attached Resource",
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
  { id: "attachedTo", label: "Attached to Concept", render: (r) => <span className="text-sm text-tertiary">{r.attachedToConcept}</span> },
  { id: "recordId", label: "Record ID", render: (r) => <span className="font-mono text-sm text-secondary">{r.recordId}</span> },
  { id: "recordName", label: "Record Name", render: (r) => <span className="text-sm text-secondary">{r.recordName}</span> },
  { id: "hierarchy", label: "Hierarchy", render: (r) => <HierarchyCell chain={hierarchyFor(r.parentEventId)} /> },
];

const resourceTypeOptions: TypeFilterOption[] = (["Image", "File", "Reference Link"] as const).map((t) => ({
  value: t,
  label: t === "Reference Link" ? "Reference Links" : `${t}s`,
  icon: resourceTypeIcon[t],
}));

// Maps a real SearchResource row into the shared `Artefact` shape (app/pages/_shared/artefact-
// lightbox.tsx) so clicking one opens the exact same modal project-detail/option-1 already uses,
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

// Same NavTree/SectionPlaceholder/ProfileMenu/GuestAuthActions shape as every other option-1 shell
// (see project-list/option-1's own copies) - kept local rather than extracted, matching this
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

function GuestAuthActions() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="secondary" isDisabled>
              Log in
            </Button>
          </span>
        </Focusable>
      </Tooltip>
      <Tooltip title="Coming soon - authentication isn't built yet">
        <Focusable>
          <span className="inline-flex">
            <Button color="primary" isDisabled>
              Sign up
            </Button>
          </span>
        </Focusable>
      </Tooltip>
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
  const showOrgSwitcher = useFeatureAccess("orgSwitcher");
  const role = useUserRole();
  const isPublicUser = role === "public-user";
  const nav = isPublicUser ? publicUserNav : registeredUserNav;
  const roleHref = useRoleHref();
  const [activeSection, setActiveSection] = useState("Explore");
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
  const [mode, setMode] = useState<"search" | "results">("search");
  const [method, setMethod] = useState<Method>("draw");
  const [manualBoundaries, setManualBoundaries] = useState<Boundary[]>([]);
  const [activeDrawTool, setActiveDrawTool] = useState<"circle" | "polygon" | null>(null);
  const [keyword, setKeyword] = useState("");
  const [entityTab, setEntityTab] = useState<EntityTab>("projects");
  // The rich, Figma-matched record-detail sidebar (record-detail.tsx) - opened by clicking a
  // Project/Event/Occurrence/Observation row, per direct request. Lifted to page level (not local
  // to ResultsTable) so it persists correctly regardless of which tab's table triggered it.
  const [selectedRecord, setSelectedRecord] = useState<DetailRecord | null>(null);
  // The Artefacts and Attachments tab's own row click - opens the exact same artefact preview
  // modal project-detail/option-1 uses (app/pages/_shared/artefact-lightbox.tsx), per direct
  // request, rather than the generic column-detail panel every other tab still falls back to for
  // resources (there's no Figma frame for a resource-specific record-detail sidebar the way
  // Project/Event/Occurrence/Observation rows have - see record-detail.tsx's own note on this).
  const [artefactIndex, setArtefactIndex] = useState<number | null>(null);
  // The Level 1/Level 2 access banner's own guest sign-up prompt (see below) - a guest sees the
  // same real banner and CTA a registered user does, but has no DLA section to navigate to, so
  // the CTA opens the same invite modal `GuestActionButton` already uses instead of a dead link.
  const [dlaSignUpOpen, setDlaSignUpOpen] = useState(false);

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

  const boundaries = useMemo(() => [...manualBoundaries, ...parkBoundaries], [manualBoundaries, parkBoundaries]);

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
  };

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

  const filteredProjects = useMemo(() => searchEvents.filter((e) => e.type === "Project" && matchingProjectIds.has(e.id)), [matchingProjectIds]);

  const filteredEvents = useMemo(
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
  const filteredOccurrences = useMemo(
    () =>
      searchOccurrences.filter(
        (o) =>
          isPointInAnyBoundary([o.lat, o.lon], boundaries) &&
          matchesKeyword(`${o.species} ${o.commonName} ${o.type}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(o.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const filteredObservations = useMemo(
    () =>
      searchObservations.filter(
        (o) =>
          isPointInAnyBoundary([o.lat, o.lon], boundaries) &&
          matchesKeyword(`${o.species} ${o.observerName} ${o.type}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(o.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const filteredResources = useMemo(
    () =>
      searchResources.filter(
        (r) =>
          isPointInAnyBoundary([r.lat, r.lon], boundaries) &&
          matchesKeyword(`${r.name} ${r.recordName} ${r.attachedToConcept}`, keyword) &&
          matchingProjectIds.has(rootProjectForParentEventId(r.parentEventId)?.id ?? ""),
      ),
    [boundaries, keyword, matchingProjectIds],
  );
  const resourceArtefacts = useMemo(() => filteredResources.map(resourceToArtefact), [filteredResources]);

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

  // A results view with nothing left to show (every area was removed from within it) isn't a
  // useful state to sit in - derived, not synced via an effect, so removing the last boundary
  // falls back to the search view in the same render rather than flashing an empty results screen
  // first. `mode` still tracks the user's own intent (e.g. pressing "Search records" again once a
  // boundary exists works immediately, no stale effect to catch up with).
  const displayMode = boundaries.length === 0 ? "search" : mode;

  const iconRail = (
    <nav aria-label="Primary" className="hidden w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-secondary bg-secondary py-4 lg:flex">
      {nav.map((section) => {
        const Icon = sectionIcons[section.label];
        const active = section.label === activeSection;
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
            </TooltipTrigger>
          </Tooltip>
        );
      })}
    </nav>
  );

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <RoleSwitcher />
      {/* ── Header ── */}
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-secondary bg-primary px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={activeSection}
            onSelectSection={(label) => {
              const section = nav.find((s) => s.label === label);
              if (section) goToSection(section);
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pages/dashboard/gov-sa-dew-lockup.png"
            alt="Government of South Australia, Department for Environment and Water"
            className="h-[37px] w-auto"
          />
          <div className="h-6 w-px bg-secondary" />
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <Breadcrumb section="Explore" orgLabel={showOrgSwitcher ? orgLabelForRole(role) : undefined} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
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
            />
          </div>
          {isPublicUser ? <GuestAuthActions /> : <ProfileMenu />}
        </div>
      </header>

      {activeSection !== "Explore" ? (
        <div className="flex flex-1 overflow-hidden">
          {iconRail}
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            <div className="flex flex-col gap-1">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{activeSectionNode.label}</p>
              {activeSectionNode.items?.map((item) => <NavTree key={item.label} node={item} />)}
            </div>
            <div className="flex flex-col gap-2 border-t border-secondary pt-4 text-xs text-quaternary">
              {registeredUserFooterLinks.map((link) => (
                <p key={link}>{link}</p>
              ))}
            </div>
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
              <div className="flex flex-1 flex-col">
                <SectionHeader.Root className="p-6">
                  <SectionHeader.Group>
                    <div className="flex flex-1 flex-col gap-1">
                      <SectionHeader.Heading>Search biodiversity records</SectionHeader.Heading>
                      <SectionHeader.Subheading>
                        Define an area of interest to search Projects, Events, Occurrence and Observation records across South Australia.
                      </SectionHeader.Subheading>
                    </div>
                  </SectionHeader.Group>
                </SectionHeader.Root>

                {/* No padding, no gap, no corner radius on this row or its two panels - both the
                    boundary-method panel and the map now sit flush against each other and the
                    viewport edges, per direct feedback. */}
                <div className="flex flex-1 flex-col lg:flex-row">
                  {/* ── Boundary method panel ── */}
                  {/* 480px, not 360px - a real Figma reference for this exact panel (node 188:4788
                      in the same landing-page file) shows the 3 method tabs as a single horizontal
                      row, each a fixed ~155px, which only fits without cramping at roughly this
                      width. The panel's earlier 360px width was the real bug behind "not enough
                      space" - fixed by widening the panel to fit the reference's own horizontal
                      tab row, not by re-orienting the tabs (reverted the previous vertical-tabs
                      workaround now that the actual cause is fixed). */}
                  <div className="flex w-full flex-col border border-secondary bg-primary p-4 lg:w-[480px] lg:shrink-0">
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
                    </Tabs>

                    {boundaries.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {boundaries.map((b) => (
                          <div key={b.id} className="flex items-start justify-between gap-3 rounded-lg border border-secondary bg-secondary p-3">
                            <div className="flex min-w-0 items-start gap-2 text-sm text-secondary">
                              <MarkerPin02 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                              <span className="break-words">{boundarySummary(b)}</span>
                            </div>
                            <Button color="link-gray" size="sm" iconLeading={Trash01} className="shrink-0" onPress={() => removeBoundary(b)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                        {boundaries.length > 1 && (
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

                  {/* ── The map itself ── */}
                  <div className="relative min-h-[420px] flex-1 overflow-hidden">
                    <SAMap boundaries={boundaries} onBoundaryAdd={addManualBoundary} activeDrawTool={activeDrawTool} onDrawToolChange={setActiveDrawTool} className="size-full" />
                  </div>
                </div>
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
                    theirs to use yet. */}
                <div className="shrink-0">
                  <AlertFullWidth
                    color="warning"
                    title="Level 1 (public) data"
                    description="Level 2 (DLA-licensed) access is managed separately, through the Data Licencing Agreement (DLA) process."
                    confirmLabel={isPublicUser ? "Sign up for access" : "Go to DLA"}
                    onConfirm={() => {
                      if (isPublicUser) {
                        setDlaSignUpOpen(true);
                        return;
                      }
                      const dlaSection = nav.find((section) => section.label === "Data Licencing Agreement (DLA)");
                      if (dlaSection) goToSection(dlaSection);
                    }}
                  />
                </div>
                <SignUpPromptModal
                  isOpen={dlaSignUpOpen}
                  onOpenChange={setDlaSignUpOpen}
                  icon={FileLock01}
                  title="Sign up to request DLA access"
                  description="Level 2 (DLA-licensed) data needs a free BioData SA account. Create one to request a Data Licencing Agreement."
                />

                {/* Order and style match Figma exactly (node 205:20764): a plain "Edit search"
                    link sits above the heading block, not beside it as a bordered Action button -
                    get_design_context on 205:23084 confirmed it's a link (icon + text-tertiary
                    text, no border/background), not a Button. */}
                <SectionHeader.Root className="shrink-0 p-6">
                  <Button color="link-gray" size="sm" iconLeading={ArrowNarrowLeft} onPress={() => setMode("search")} className="self-start">
                    Edit search
                  </Button>
                  <SectionHeader.Group>
                    <div className="flex flex-1 flex-col gap-1">
                      <SectionHeader.Heading>Search results</SectionHeader.Heading>
                      <SectionHeader.Subheading>
                        {totalCount} record{totalCount === 1 ? "" : "s"} found across {boundaries.length} search area{boundaries.length === 1 ? "" : "s"}
                      </SectionHeader.Subheading>
                    </div>
                  </SectionHeader.Group>
                </SectionHeader.Root>

                {/* ── Metrics section ── a real, working stat-tile switcher matching Figma's own
                    "Metrics section" exactly (get_design_context on I209:27950, the 5-tab version
                    superseding the earlier 4-tab 205:20764 one): plain buttons, not react-aria Tab
                    semantics - Figma's own generated code uses <button> here, not a tab/tabpanel
                    role, so this is composed from real tokens rather than forced through the DEW
                    Tabs component.
                    Every tile keeps an identical 1px border box at all times (colour toggles, the
                    width never does) - the active tile's visible "underline" is a separate,
                    absolutely-positioned 1.5px bar sitting on the tile's own bottom edge, not an
                    actual border-width change. Flagged directly by the user off a screenshot: the
                    selected tile was shifting vertically by ~1px on selection, because the old
                    version toggled real border width between states (inactive: 1px on all 4 sides;
                    active: 0px top/sides + 1.5px bottom only) - a different total border height per
                    state, so the button's own box (and everything inside it) physically moved when
                    switching. An absolutely-positioned indicator is taken out of normal flow
                    entirely, so it can never affect the button's box height regardless of its own
                    width - the standard fix for this exact "underline causes reflow" tab bug class,
                    not specific to this codebase. Both border colours remain real @theme values
                    with no matching @utility yet (same "reference the CSS variable directly"
                    precedent as tree-view's connector line / progress bar's track). ── */}
                <div className="flex w-full shrink-0 items-stretch">
                  {entityTabs.map((t) => {
                    const Icon = t.icon;
                    const active = entityTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEntityTab(t.id)}
                        className={cx(
                          "relative flex flex-1 flex-col items-start gap-1 border bg-primary px-4 py-2 text-left",
                          active ? "border-transparent" : "border-[var(--color-brand-100)]",
                        )}
                      >
                        {active && <span className="absolute inset-x-0 -bottom-px h-[1.5px] bg-[var(--color-brand-500)]" />}
                        <span className={cx("flex w-full items-center gap-1 text-sm", active ? "font-medium text-brand-tertiary" : "font-normal text-tertiary")}>
                          <Icon className="size-4 shrink-0" />
                          {t.label}
                        </span>
                        <span className={cx("text-lg font-medium", active ? "text-brand-secondary" : "text-tertiary")}>{countFor(t.id)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* min-h-0 flex-1 overflow-hidden - takes exactly the space left over below the
                    toolbar pieces above; ResultsTable's own internal scroll region (its table
                    body, via Table's `bodyScrollable` prop) fills this and scrolls on its own,
                    keeping the chip row/search box/pagination on-screen at all times. */}
                <div className="min-h-0 flex-1 overflow-hidden p-6 pt-4">
                  {entityTab === "projects" && (
                    <ResultsTable
                      ariaLabel="Projects"
                      columns={projectColumns}
                      rows={filteredProjects}
                      emptyLabel="projects"
                      rowTextValue={(e) => e.name}
                      searchText={(e) => `${e.id} ${e.name} ${e.org}`}
                      viewActionLabel="View Project"
                      onRowClick={(e) => setSelectedRecord({ kind: "event", event: e })}
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
                    />
                  )}
                </div>
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

"use client";

// The Records tab - the tree/table toggle from the Figma reference (wer8CgO1UoCH3aQw2jQkdy, node
// 1938:35405's own top-right icon pair: a tree/hierarchy glyph and a table/grid glyph), plus the
// same Events/Occurrences/Observations/Artefacts metric-tile switcher already proven out for the
// map search results page's own Records mode (app/pages/observations/option-1) - scoped down to
// just this one project's own records instead of a cross-project search. Both view modes open the
// same real, editable `RecordEditPanel` on click - this is the one place in the whole page a user
// can actually inspect and edit a specific Event/Occurrence/Observation.

import { useMemo, useState } from "react";
import { GitBranch01, Table as TableIcon, SearchLg, Activity, Target05, Eye, File06, Image01, File01, Link02 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { ResultsTable, type ColumnDef, type TypeFilterOption } from "@/app/pages/_shared/map-search/results-table";
import { MetricTile } from "@/app/pages/_shared/map-search/metric-tile";
import { ArtefactLightbox, type Artefact, type ArtefactType } from "@/app/pages/_shared/artefact-lightbox";
import {
  eventTypeIcon,
  rootProjectForParentEventId,
  type OccurrenceType,
  type ResourceType,
  type SearchEvent,
  type SearchObservation,
  type SearchOccurrence,
  type SearchResource,
} from "@/app/pages/_shared/map-search/search-data";
import { buildEventTree, projectEvents, projectObservations, projectOccurrences, projectResources, type EventTreeNode } from "./project-scope";
import { RecordEditPanel } from "./record-panel";
import type { DetailRecord } from "./record-fields";
import { cx } from "@/utils/cx";

export type EntityTab = "events" | "occurrences" | "observations" | "artefacts";

const entityTabs: { id: EntityTab; label: string; icon: typeof GitBranch01 }[] = [
  { id: "events", label: "Events", icon: Activity },
  { id: "occurrences", label: "Occurrences", icon: Target05 },
  { id: "observations", label: "Observations", icon: Eye },
  { id: "artefacts", label: "Artefacts", icon: File06 },
];

const occurrenceTypeIcon: Record<OccurrenceType, typeof GitBranch01> = {
  Individual: eventTypeIcon.Site,
  Population: eventTypeIcon.Visit,
  "Non-Biotic": eventTypeIcon.Trap,
  Community: eventTypeIcon.Ramble,
};

const resourceTypeIcon: Record<ResourceType, typeof GitBranch01> = { Image: Image01, File: File01, "Reference Link": Link02 };

function resourceArtefactType(r: SearchResource): ArtefactType {
  if (r.type === "Reference Link") return "link";
  if (r.type === "Image") return "image";
  const lower = r.name.toLowerCase();
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".csv")) return "spreadsheet";
  if (lower.endsWith(".mp4") || lower.endsWith(".mov")) return "video";
  return "pdf";
}

function resourceToArtefact(r: SearchResource): Artefact {
  const kind = resourceArtefactType(r);
  const project = rootProjectForParentEventId(r.parentEventId);
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
    objectId: `${r.recordId}`,
    description,
    format: kind === "link" ? "text/uri-list" : kind === "image" ? "image/jpeg" : kind === "video" ? "video/mp4" : kind === "spreadsheet" ? "application/vnd.ms-excel" : "application/pdf",
    identifierUrl: kind === "link" ? r.name : `https://data.environment.sa.gov.au/biodata/${r.id}`,
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    publisher: project?.org ?? r.region,
    rightsHolder: project?.org ?? r.region,
    dcType: kind === "image" ? "StillImage" : kind === "video" ? "MovingImage" : kind === "spreadsheet" ? "Dataset" : kind === "link" ? "InteractiveResource" : "Text",
    bioDataId: r.id.toUpperCase(),
  };
}

const textCell = (value?: string) => <span className="text-sm whitespace-nowrap text-tertiary">{value || "-"}</span>;

function eventColumns(): ColumnDef<SearchEvent>[] {
  return [
    { id: "code", label: "Event ID", render: (e) => <span className="text-sm font-medium text-primary">{e.code}</span>, filterValue: (e) => e.code },
    { id: "name", label: "Event Name", render: (e) => textCell(e.name), filterValue: (e) => e.name },
    {
      id: "type",
      label: "Event Type",
      render: (e) => {
        const Icon = eventTypeIcon[e.type];
        return (
          <span className="flex items-center gap-1.5 text-sm text-tertiary">
            <Icon className="size-4 shrink-0" />
            {e.type}
          </span>
        );
      },
      filterValue: (e) => e.type,
    },
    { id: "startDate", label: "Start Date", render: (e) => textCell(e.startDate), filterValue: (e) => e.startDate },
    { id: "endDate", label: "End Date", render: (e) => textCell(e.endDate), filterValue: (e) => e.endDate },
  ];
}

const eventTypeOptions: TypeFilterOption[] = (["Site", "Visit", "Transect", "Quadrat", "Block", "Ramble", "Trap", "Custom event"] as const).map((t) => ({
  value: t,
  label: t,
  icon: eventTypeIcon[t],
}));

function occurrenceColumns(): ColumnDef<SearchOccurrence>[] {
  return [
    { id: "id", label: "Occurrence ID", render: (o) => <span className="text-sm font-medium text-primary">{o.id}</span>, filterValue: (o) => o.id },
    { id: "name", label: "Occurrence Name", render: (o) => textCell(o.commonName), filterValue: (o) => o.commonName },
    {
      id: "type",
      label: "Occurrence Type",
      render: (o) => {
        const Icon = occurrenceTypeIcon[o.type];
        return (
          <span className="flex items-center gap-1.5 text-sm text-tertiary">
            <Icon className="size-4 shrink-0" />
            {o.type}
          </span>
        );
      },
      filterValue: (o) => o.type,
    },
    { id: "species", label: "Scientific Name", render: (o) => <span className="text-sm whitespace-nowrap text-tertiary italic">{o.species}</span>, filterValue: (o) => o.species },
    { id: "date", label: "Date", render: (o) => textCell(o.date), filterValue: (o) => o.date },
  ];
}

const occurrenceTypeOptions: TypeFilterOption[] = (["Individual", "Population", "Non-Biotic", "Community"] as const).map((t) => ({ value: t, label: t, icon: occurrenceTypeIcon[t] }));

function observationColumns(): ColumnDef<SearchObservation>[] {
  return [
    { id: "id", label: "Observation ID", render: (o) => <span className="text-sm font-medium text-primary">{o.id}</span>, filterValue: (o) => o.id },
    { id: "name", label: "Observation Name", render: (o) => textCell(o.commonName), filterValue: (o) => o.commonName },
    {
      id: "type",
      label: "Observation Type",
      render: (o) => {
        const Icon = occurrenceTypeIcon[o.type];
        return (
          <span className="flex items-center gap-1.5 text-sm text-tertiary">
            <Icon className="size-4 shrink-0" />
            {o.type}
          </span>
        );
      },
      filterValue: (o) => o.type,
    },
    { id: "species", label: "Scientific Name", render: (o) => <span className="text-sm whitespace-nowrap text-tertiary italic">{o.species}</span>, filterValue: (o) => o.species },
    { id: "date", label: "Date", render: (o) => textCell(o.date), filterValue: (o) => o.date },
  ];
}

function resourceColumns(): ColumnDef<SearchResource>[] {
  return [
    {
      id: "name",
      label: "Attached Resource",
      render: (r) => {
        const Icon = resourceTypeIcon[r.type];
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-primary">
            <Icon className="size-4 shrink-0 text-fg-quaternary" />
            <span className="truncate">{r.name}</span>
          </span>
        );
      },
      filterValue: (r) => r.name,
    },
    { id: "type", label: "Type", render: (r) => textCell(r.type), filterValue: (r) => r.type },
    { id: "attachedTo", label: "Attached to Concept", render: (r) => textCell(r.attachedToConcept), filterValue: (r) => r.attachedToConcept },
    { id: "recordId", label: "Record ID", render: (r) => textCell(r.recordId), filterValue: (r) => r.recordId },
    { id: "date", label: "Date", render: (r) => textCell(r.date), filterValue: (r) => r.date },
  ];
}

// ── Tree view ──

function TreeNode({ node, currentKey }: { node: EventTreeNode; currentKey: string | null }) {
  const Icon = eventTypeIcon[node.event.type];
  const hasChildren = node.children.length > 0 || node.occurrences.length > 0 || node.observations.length > 0;
  const key = `event-${node.event.id}`;
  const highlight = key === currentKey ? "bg-brand-50 text-brand-secondary" : undefined;

  if (!hasChildren) {
    return (
      <TreeView.Item key={key} id={key} textValue={node.event.name}>
        <TreeView.ItemContent icon={Icon} className={highlight}>
          {node.event.name}
        </TreeView.ItemContent>
      </TreeView.Item>
    );
  }

  return (
    <TreeView.Item key={key} id={key} textValue={node.event.name}>
      <TreeView.ItemContent icon={Icon} className={highlight}>
        {node.event.name}
      </TreeView.ItemContent>
      {node.occurrences.map((o) => {
        const oKey = `occurrence-${o.id}`;
        const OIcon = occurrenceTypeIcon[o.type];
        return (
          <TreeView.Item key={oKey} id={oKey} textValue={`Occurrence ${o.commonName}`}>
            <TreeView.ItemContent icon={OIcon} className={oKey === currentKey ? "bg-brand-50 text-brand-secondary" : undefined}>
              {`Occurrence · ${o.commonName}`}
            </TreeView.ItemContent>
          </TreeView.Item>
        );
      })}
      {node.observations.map((o) => {
        const obKey = `observation-${o.id}`;
        const OIcon = occurrenceTypeIcon[o.type];
        return (
          <TreeView.Item key={obKey} id={obKey} textValue={`Observation ${o.commonName}`}>
            <TreeView.ItemContent icon={OIcon} className={obKey === currentKey ? "bg-brand-50 text-brand-secondary" : undefined}>
              {`Observation · ${o.commonName}`}
            </TreeView.ItemContent>
          </TreeView.Item>
        );
      })}
      {node.children.map((child) => (
        <TreeNode key={`event-${child.event.id}`} node={child} currentKey={currentKey} />
      ))}
    </TreeView.Item>
  );
}

function matchesQuery(node: EventTreeNode, query: string): boolean {
  const q = query.toLowerCase();
  if (node.event.name.toLowerCase().includes(q) || node.event.code.toLowerCase().includes(q)) return true;
  if (node.occurrences.some((o) => o.commonName.toLowerCase().includes(q))) return true;
  if (node.observations.some((o) => o.commonName.toLowerCase().includes(q))) return true;
  return node.children.some((c) => matchesQuery(c, q));
}

function filterTree(nodes: EventTreeNode[], query: string): EventTreeNode[] {
  if (!query.trim()) return nodes;
  return nodes.filter((n) => matchesQuery(n, query));
}

export function RecordsView({
  project,
  initialEntityTab,
  initialViewMode,
}: {
  project: SearchEvent;
  /** Pre-selects a specific entity type - e.g. a click on the About tab's "At a glance" record
   *  counts. Read once on mount only; safe because this component unmounts whenever its own
   *  TabPanel isn't the active tab, so a fresh navigation always re-seeds it correctly. */
  initialEntityTab?: EntityTab;
  /** Pre-selects Tree or Table view for the same reason - a count click wants Table (the filtered,
   *  per-type list), not the Tree view Records opens into by default. */
  initialViewMode?: "tree" | "table";
}) {
  const [viewMode, setViewMode] = useState<"tree" | "table">(initialViewMode ?? "tree");
  const [entityTab, setEntityTab] = useState<EntityTab>(initialEntityTab ?? "events");
  const [query, setQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DetailRecord | null>(null);
  const [artefactIndex, setArtefactIndex] = useState<number | null>(null);

  const tree = useMemo(() => buildEventTree(project.id), [project.id]);
  const filteredTree = useMemo(() => filterTree(tree, query), [tree, query]);

  const events = useMemo(() => projectEvents(project.id), [project.id]);
  const occurrences = useMemo(() => projectOccurrences(project.id), [project.id]);
  const observations = useMemo(() => projectObservations(project.id), [project.id]);
  const resources = useMemo(() => projectResources(project.id), [project.id]);
  const artefacts = useMemo(() => resources.map(resourceToArtefact), [resources]);

  const counts: Record<EntityTab, number> = { events: events.length, occurrences: occurrences.length, observations: observations.length, artefacts: resources.length };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input icon={SearchLg} placeholder="Search this project's records…" value={query} onChange={setQuery} className="max-w-md flex-1" />
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-secondary bg-secondary p-1">
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            aria-label="Tree view"
            className={cx("flex size-8 items-center justify-center rounded-md transition-colors", viewMode === "tree" ? "bg-primary text-brand-secondary shadow-xs" : "text-quaternary hover:text-secondary")}
          >
            <GitBranch01 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
            className={cx("flex size-8 items-center justify-center rounded-md transition-colors", viewMode === "table" ? "bg-primary text-brand-secondary shadow-xs" : "text-quaternary hover:text-secondary")}
          >
            <TableIcon className="size-4" />
          </button>
        </div>
      </div>

      {viewMode === "table" && (
        <div className="flex flex-wrap gap-3">
          {entityTabs.map((t) => (
            <MetricTile key={t.id} icon={t.icon} label={t.label} value={counts[t.id]} active={entityTab === t.id} onClick={() => setEntityTab(t.id)} />
          ))}
        </div>
      )}

      {viewMode === "tree" ? (
        filteredTree.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-secondary bg-secondary p-12 text-center">
            <p className="text-sm font-medium text-primary">No records match &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="rounded-xl border border-secondary p-4">
            <TreeView aria-label={`${project.name} records`} showConnectors onAction={(key) => setSelectedRecord(keyToRecord(String(key), tree))} className="w-full">
              {filteredTree.map((node) => (
                <TreeNode key={`event-${node.event.id}`} node={node} currentKey={selectedRecord ? recordKeyOf(selectedRecord) : null} />
              ))}
            </TreeView>
          </div>
        )
      ) : (
        <div className="h-[560px]">
          {entityTab === "events" && (
            <ResultsTable
              ariaLabel="Events"
              columns={eventColumns()}
              rows={events}
              typeField="type"
              typeOptions={eventTypeOptions}
              emptyLabel="events"
              rowTextValue={(e) => e.name}
              searchText={(e) => `${e.code} ${e.name}`}
              searchValue={query}
              onSearchChange={setQuery}
              hideSearchBox
              onRowClick={(e) => setSelectedRecord({ kind: "event", event: e })}
            />
          )}
          {entityTab === "occurrences" && (
            <ResultsTable
              ariaLabel="Occurrences"
              columns={occurrenceColumns()}
              rows={occurrences}
              typeField="type"
              typeOptions={occurrenceTypeOptions}
              emptyLabel="occurrences"
              rowTextValue={(o) => o.commonName}
              searchText={(o) => `${o.id} ${o.commonName} ${o.species}`}
              searchValue={query}
              onSearchChange={setQuery}
              hideSearchBox
              onRowClick={(o) => setSelectedRecord({ kind: "occurrence", occurrence: o })}
            />
          )}
          {entityTab === "observations" && (
            <ResultsTable
              ariaLabel="Observations"
              columns={observationColumns()}
              rows={observations}
              typeField="type"
              typeOptions={occurrenceTypeOptions}
              emptyLabel="observations"
              rowTextValue={(o) => o.commonName}
              searchText={(o) => `${o.id} ${o.commonName} ${o.species}`}
              searchValue={query}
              onSearchChange={setQuery}
              hideSearchBox
              onRowClick={(o) => setSelectedRecord({ kind: "observation", observation: o })}
            />
          )}
          {entityTab === "artefacts" && (
            <ResultsTable
              ariaLabel="Artefacts and Attachments"
              columns={resourceColumns()}
              rows={resources}
              emptyLabel="artefacts"
              rowTextValue={(r) => r.name}
              searchText={(r) => `${r.name} ${r.recordName}`}
              searchValue={query}
              onSearchChange={setQuery}
              hideSearchBox
              onRowClick={(r) => setArtefactIndex(resources.findIndex((x) => x.id === r.id))}
            />
          )}
        </div>
      )}

      <RecordEditPanel record={selectedRecord} project={project} onClose={() => setSelectedRecord(null)} />
      <ArtefactLightbox artefacts={artefacts} index={artefactIndex} onClose={() => setArtefactIndex(null)} onNavigate={setArtefactIndex} />
    </div>
  );
}

function recordKeyOf(record: DetailRecord): string {
  if (record.kind === "event") return `event-${record.event.id}`;
  if (record.kind === "occurrence") return `occurrence-${record.occurrence.id}`;
  return `observation-${record.observation.id}`;
}

function findEventNode(nodes: EventTreeNode[], eventId: string): EventTreeNode | undefined {
  for (const node of nodes) {
    if (node.event.id === eventId) return node;
    const found = findEventNode(node.children, eventId);
    if (found) return found;
  }
  return undefined;
}

function keyToRecord(key: string, tree: EventTreeNode[]): DetailRecord | null {
  const [kind, ...rest] = key.split("-");
  const id = rest.join("-");
  if (kind === "event") {
    const node = findEventNode(tree, id);
    return node ? { kind: "event", event: node.event } : null;
  }
  if (kind === "occurrence") {
    const match = flattenOccurrences(tree).find((o) => o.id === id);
    return match ? { kind: "occurrence", occurrence: match } : null;
  }
  if (kind === "observation") {
    const match = flattenObservations(tree).find((o) => o.id === id);
    return match ? { kind: "observation", observation: match } : null;
  }
  return null;
}

function flattenOccurrences(nodes: EventTreeNode[]): SearchOccurrence[] {
  return nodes.flatMap((n) => [...n.occurrences, ...flattenOccurrences(n.children)]);
}

function flattenObservations(nodes: EventTreeNode[]): SearchObservation[] {
  return nodes.flatMap((n) => [...n.observations, ...flattenObservations(n.children)]);
}

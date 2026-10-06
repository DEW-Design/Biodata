"use client";

import { useMemo, useState, type FC, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, Eye, Target05, Calendar } from "@untitledui/icons";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { recordIcon } from "@/app/pages/_shared/record-icons";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import {
  eventRowsFor,
  observationRowsFor,
  occurrenceRowsFor,
  type EventRow,
  type ObservationRow,
  type OccurrenceRow,
  type RecordTab,
} from "@/app/pages/_shared/reports/records-report-data";
import { datasetCountsByProject, reportBundlesFor } from "@/app/pages/_shared/reports/report-records";
import { ALL_PROJECTS, activeScope, ReportScopeSelect } from "@/app/pages/_shared/reports/report-scope-select";
import { DataReport, IdCell, TextCell } from "@/app/pages/_shared/reports/report-table";
import { REPORT_WIDTH as W, emptyColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { useUserRole } from "@/lib/use-user-role";

// The Events, Occurrences and Observations Report: the wireframe's three screens (Figma YMproGZfrFB5jUqPHPxMhk frames
// 1583:31626, 1583:31821, 1583:32016) differ only in the table under a tab row, so they are one report with three
// tabs, each with its own columns, filters, search and sort (`?tab=events|occurrences|observations`). Fitted into the
// shared report pattern (report-table.tsx) with these departures from the wireframe, on purpose:
//   - one project scope (a Select above the tabs) limits the rows of every tab, so the attribute filters do not offer
//     a Project attribute; the four tiles (Datasets, Events, Occurrences, Observations) are the counts in that scope,
//     as the wireframe draws them, so the tabs carry no count badge of their own (a number is shown once);
//   - labels are sentence case and spelled out ("Occurences" is "Occurrences");
//   - the wireframe lists some labels twice. Events: the second "Occurences" and "Observations" (after Source ID) and
//     the second "Created By/Source", "Updated On", "Updated By" and "Updated By / Source" (after Source Event ID) are
//     left out. Occurrences: the second "Occurrence Type??" and the second "Updated On", "Updated By" and "Updated By /
//     Source". Observations: none. Each first occurrence is kept where the wireframe first puts it;
//   - the wireframe's "Creation date" filter is not offered: the app holds no creation date for a record;
//   - the wireframe's "Export as" is Export CSV: the rows of the tab in view, every column.
// Columns the app has no value for are in the table and left empty. The first column of each tab is the wireframe's
// first, "Project", and is the one that stays put when the table scrolls sideways.

const TAB_LABELS: Record<RecordTab, string> = { events: "Events", occurrences: "Occurrences", observations: "Observations" };
const TABS: RecordTab[] = ["events", "occurrences", "observations"];
// The same icons the records tree and Explore's results use for each kind.
const TAB_ICONS: Record<RecordTab, FC<{ className?: string }>> = {
  events: Calendar,
  occurrences: recordIcon({ kind: "occurrence", type: "Individual" }),
  observations: recordIcon({ kind: "observation", type: "Individual" }),
};

const isTab = (value: string | null): value is RecordTab => value === "events" || value === "occurrences" || value === "observations";

/** A record's own ID and its name, the way the project page's record tables name a record. */
function recordColumn<R>(id: string, label: string, get: (row: R) => { code: string; name: string }): ViewColumn<R> {
  return {
    id,
    label,
    width: W.xl,
    sort: (r) => get(r).code,
    cell: (r) => (
      <span className="flex items-baseline gap-2">
        <IdCell>{get(r).code}</IdCell>
        <TextCell strong>{get(r).name}</TextCell>
      </span>
    ),
    text: (r) => `${get(r).code} ${get(r).name}`,
  };
}

const people = (names: string[]) => names.join(", ");

// The columns every tab ends with in the wireframe: who and when a record was created and last changed.
function history<R>(): ViewColumn<R>[] {
  return [
    emptyColumn("creationDate", "Creation date", W.md),
    emptyColumn("createdBy", "Created by/source", W.md),
    emptyColumn("updatedOn", "Updated on", W.md),
    emptyColumn("updatedBy", "Updated by", W.md),
    emptyColumn("updatedBySource", "Updated by/source", W.md),
  ];
}

const eventColumns: ViewColumn<EventRow>[] = [
  textColumn("project", "Project", W.lg, (r) => r.project, { sticky: true }),
  recordColumn("event", "Event", (r) => ({ code: r.code, name: r.name })),
  textColumn("type", "Event type", W.sm, (r) => r.type),
  textColumn("status", "Event status", W.md, (r) => r.status),
  numberColumn("occurrences", "Occurrences", W.sm, (r) => r.occurrences),
  numberColumn("observations", "Observations", W.sm, (r) => r.observations),
  textColumn("siteDescription", "Site description", W.xl, (r) => r.siteDescription, { clamp: true }),
  textColumn("observers", "Physical observers", W.lg, (r) => people(r.observers)),
  textColumn("sourceId", "Source ID", W.md, (r) => r.sourceId),
  textColumn("siteGrouping", "Site grouping", W.lg, (r) => r.siteGrouping),
  textColumn("location", "Generated location", W.md, (r) => r.location),
  emptyColumn("mapSheet", "Map sheet", W.sm),
  emptyColumn("hundred", "Hundred", W.sm),
  emptyColumn("section", "Section", W.sm),
  textColumn("property", "Specific property details", W.xl, (r) => r.property, { clamp: true }),
  numberColumn("altitude", "Altitude", W.sm, (r) => r.altitude),
  textColumn("areaSize", "Area size", W.md, (r) => r.areaSize),
  emptyColumn("landscapesRegion", "Landscapes region", W.md),
  emptyColumn("bcmRegion", "BCM region", W.md),
  textColumn("ibraRegion", "IBRA association", W.lg, (r) => r.ibraRegion),
  textColumn("ibraSubregion", "IBRA subregion", W.lg, (r) => r.ibraSubregion),
  emptyColumn("mudMap", "Mud map (file link)", W.md),
  textColumn("paddock", "Paddock", W.md, (r) => r.paddock),
  ...history<EventRow>(),
  textColumn("sourceEvent", "Source event ID - name", W.lg, (r) => r.sourceEvent),
];

const occurrenceColumns: ViewColumn<OccurrenceRow>[] = [
  textColumn("project", "Project", W.lg, (r) => r.project, { sticky: true }),
  textColumn("parent", "Event linked (parent)", W.xl, (r) => r.parent),
  recordColumn("occurrence", "Occurrences", (r) => ({ code: r.code, name: r.name })),
  textColumn("type", "Occurrence type", W.md, (r) => r.type),
  textColumn("status", "Occurrence status", W.md, (r) => r.status),
  numberColumn("observations", "Observations", W.sm, (r) => r.observations),
  emptyColumn("sourceId", "Source ID", W.sm),
  textColumn("description", "Occurrence description", W.xl, (r) => r.description, { clamp: true }),
  textColumn("observers", "Physical observers", W.lg, (r) => people(r.observers)),
  textColumn("species", "NSX code and species", W.xl, (r) => r.species),
  textColumn("legacy", "Legacy sighting #", W.lg, (r) => r.legacy),
  textColumn("released", "Released/planted", W.md, (r) => r.released),
  textColumn("voucherSeries", "Voucher series", W.md, (r) => r.voucherSeries),
  textColumn("voucherNumber", "Voucher number", W.md, (r) => r.voucherNumber),
  textColumn("voucherImages", "Voucher images", W.xl, (r) => r.voucherImages, { clamp: true }),
  textColumn("institution", "Institution name", W.lg, (r) => r.institution),
  textColumn("rego", "Institution rego #", W.md, (r) => r.rego),
  emptyColumn("voucherComments", "Voucher comments", W.md),
  textColumn("determiner1", "Determiner 1", W.md, (r) => r.determiner1),
  textColumn("determiner2", "Determiner 2", W.md, (r) => r.determiner2),
  textColumn("determinationDate", "Determination date", W.md, (r) => r.determinationDate),
  textColumn("transferDate", "Transfer date", W.md, (r) => r.transferDate),
  textColumn("determinationAccuracy", "Determination date accuracy", W.lg, (r) => r.determinationAccuracy),
  textColumn("sourceEvent", "Source event ID - name", W.lg, (r) => r.sourceEvent),
  ...history<OccurrenceRow>(),
];

const observationColumns: ViewColumn<ObservationRow>[] = [
  textColumn("project", "Project", W.lg, (r) => r.project, { sticky: true }),
  textColumn("linked", "Event or occurrence linked", W.xl, (r) => r.linked),
  recordColumn("observation", "Observations", (r) => ({ code: r.code, name: r.name })),
  textColumn("type", "Observation type", W.md, (r) => r.type),
  emptyColumn("status", "Observation status", W.md),
  emptyColumn("sourceId", "Source ID", W.sm),
  textColumn("description", "Observation description", W.xl, (r) => r.description, { clamp: true }),
  textColumn("observers", "Physical observers", W.lg, (r) => people(r.observers)),
  emptyColumn("dung", "Dung", W.sm),
  emptyColumn("tracks", "Tracks", W.sm),
  emptyColumn("burrows", "Burrows", W.sm),
  emptyColumn("sighting", "Sighting", W.sm),
  emptyColumn("material", "Material", W.sm),
  textColumn("cover", "Cover/abundance and description", W.lg, (r) => r.cover),
  numberColumn("line", "Line", W.xs, (r) => r.line),
  emptyColumn("notInQuadrat", "Not in quadrat", W.md),
  textColumn("activity", "Activity", W.md, (r) => r.activity),
  textColumn("lifeForm", "Life form and description", W.lg, (r) => r.lifeForm),
  textColumn("collection", "Collection method and description", W.lg, (r) => r.collection),
  textColumn("strata", "Strata and description", W.lg, (r) => r.strata),
  textColumn("macroHabitat", "Macro habitat and description", W.lg, (r) => r.macroHabitat),
  textColumn("microHabitat", "Micro habitat and description", W.lg, (r) => r.microHabitat),
  textColumn("sex", "Sex", W.md, (r) => r.sex),
  numberColumn("weight", "Weight (g)", W.sm, (r) => r.weight),
  numberColumn("length", "Length (mm)", W.sm, (r) => r.length),
  emptyColumn("lengthMethod", "Length method", W.md),
  emptyColumn("linkedVoucher", "LnkVch #", W.sm),
  numberColumn("snoutVent", "Snout-vent length (mm)", W.md, (r) => r.snoutVent),
  textColumn("gravid", "Gravid?", W.sm, (r) => r.gravid),
  textColumn("teats", "Teats", W.sm, (r) => r.teats),
  textColumn("vagina", "Vagina", W.sm, (r) => r.vagina),
  textColumn("pouch", "Pouch", W.md, (r) => r.pouch),
  textColumn("testes", "Testes", W.sm, (r) => r.testes),
  textColumn("inPouch", "No. in pouch", W.sm, (r) => r.inPouch),
  textColumn("sourceLinked", "Occurrence or event ID - name", W.lg, (r) => r.sourceLinked),
  textColumn("comments", "Observation comments", W.xl, (r) => r.comments, { clamp: true }),
  emptyColumn("creationDate", "Creation date", W.md),
  emptyColumn("createdBy", "Created by/source", W.md),
];

/** The rows of the chosen project, or every row for "All projects". */
function inProject<R extends { projectId: string }>(rows: R[], scope: string): R[] {
  return scope === ALL_PROJECTS ? rows : rows.filter((r) => r.projectId === scope);
}

/** An attribute that filters on one value of a row, offered only when the data has values to choose from. */
function choice<R>(rows: R[], id: string, label: string, get: (row: R) => string | string[], searchable?: boolean): Attribute<R>[] {
  const options = optionsFromValues(rows.flatMap((r) => [get(r)].flat()));
  return options.length > 0 ? [{ id, kind: "options", label, options, get, searchable }] : [];
}

export function RecordsReport() {
  const role = useUserRole();
  const datasets = useDatasets();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: RecordTab = isTab(tabParam) ? tabParam : "events";
  // A generated report (My reports) opens with the project it was made for, `?project=`.
  const [scope, setScope] = useState(searchParams.get("project") ?? ALL_PROJECTS);

  const bundles = useMemo(() => reportBundlesFor(role), [role]);
  const projects = useMemo(() => bundles.map((b) => b.project), [bundles]);
  const active = activeScope(scope, projects);
  const inScope = useMemo(() => bundles.filter((b) => active === ALL_PROJECTS || b.project.id === active), [bundles, active]);

  const allEvents = useMemo(() => bundles.flatMap(eventRowsFor), [bundles]);
  const allOccurrences = useMemo(() => bundles.flatMap(occurrenceRowsFor), [bundles]);
  const allObservations = useMemo(() => bundles.flatMap(observationRowsFor), [bundles]);
  const events = useMemo(() => inProject(allEvents, active), [allEvents, active]);
  const occurrences = useMemo(() => inProject(allOccurrences, active), [allOccurrences, active]);
  const observations = useMemo(() => inProject(allObservations, active), [allObservations, active]);
  const counts: Record<RecordTab, number> = { events: events.length, occurrences: occurrences.length, observations: observations.length };

  const datasetCounts = useMemo(() => datasetCountsByProject(datasets), [datasets]);
  const datasetTotal = inScope.reduce((n, b) => n + (datasetCounts.get(b.project.id) ?? 0), 0);

  const eventAttributes = useMemo(
    () => [
      ...choice(allEvents, "type", "Event type", (r) => r.type),
      ...choice(allEvents, "status", "Event status", (r) => r.status),
      ...choice(allEvents, "observer", "Physical observer", (r) => r.observers, true),
    ],
    [allEvents],
  );
  const occurrenceAttributes = useMemo(
    () => [
      ...choice(allOccurrences, "type", "Occurrence type", (r) => r.type),
      ...choice(allOccurrences, "status", "Occurrence status", (r) => r.status),
      ...choice(allOccurrences, "observer", "Physical observer", (r) => r.observers, true),
      ...choice(allOccurrences, "group", "Species group", (r) => r.group),
    ],
    [allOccurrences],
  );
  const observationAttributes = useMemo(
    () => [
      ...choice(allObservations, "type", "Observation type", (r) => r.type),
      ...choice(allObservations, "observer", "Physical observer", (r) => r.observers, true),
      ...choice(allObservations, "group", "Species group", (r) => r.group),
    ],
    [allObservations],
  );

  const setTab = (next: RecordTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const common = {
    title: "Events, Occurrences and Observations Report",
    subtitle: "Every event, occurrence and observation, one tab for each.",
    scopeControl: <ReportScopeSelect projects={projects} value={scope} onChange={setScope} />,
    facts: [
      { label: "Datasets", value: datasetTotal.toLocaleString("en-AU") },
      { label: "Events", value: counts.events.toLocaleString("en-AU") },
      { label: "Occurrences", value: counts.occurrences.toLocaleString("en-AU") },
      { label: "Observations", value: counts.observations.toLocaleString("en-AU") },
    ],
    searchLabel: "Search the report",
    resetKey: tab,
  };

  const tabs = (
    <div className="shrink-0 px-6 pt-4">
      <TabList type="underline" aria-label="Kind of record">
        {TABS.map((id) => (
          <Tab key={id} id={id} icon={TAB_ICONS[id]}>
            {TAB_LABELS[id]}
          </Tab>
        ))}
      </TabList>
    </div>
  );

  const belowHeader = (
    <>
      {tabs}
    </>
  );
  const wrapBody = (body: ReactNode) => (
    <TabPanel id={tab} className="flex min-h-0 flex-1 flex-col">
      {body}
    </TabPanel>
  );

  let report: ReactNode;
  if (tab === "events") {
    report = (
      <DataReport<EventRow>
        {...common}
        icon={Activity}
        rows={events}
        rowId={(r) => r.id}
        columns={eventColumns}
        attributes={eventAttributes}
        searchText={(r) => [r.code, r.name, r.type, r.siteDescription, people(r.observers), r.sourceEvent]}
        searchPlaceholder="Search by event, type, description or observer"
        tableLabel="Events, one row each"
        noun="events"
        emptyDescription="Events recorded in your projects appear here."
        initialSort={{ column: "event", direction: "ascending" }}
        belowHeader={belowHeader}
        wrapBody={wrapBody}
        exportName="events-report"
      />
    );
  } else if (tab === "occurrences") {
    report = (
      <DataReport<OccurrenceRow>
        {...common}
        icon={Target05}
        rows={occurrences}
        rowId={(r) => r.id}
        columns={occurrenceColumns}
        attributes={occurrenceAttributes}
        searchText={(r) => [r.code, r.name, r.species, r.parent, r.legacy, people(r.observers)]}
        searchPlaceholder="Search by occurrence, species, event or observer"
        tableLabel="Occurrences, one row each"
        noun="occurrences"
        emptyDescription="Occurrences recorded in your projects appear here."
        initialSort={{ column: "occurrence", direction: "ascending" }}
        belowHeader={belowHeader}
        wrapBody={wrapBody}
        exportName="occurrences-report"
      />
    );
  } else {
    report = (
      <DataReport<ObservationRow>
        {...common}
        icon={Eye}
        rows={observations}
        rowId={(r) => r.id}
        columns={observationColumns}
        attributes={observationAttributes}
        searchText={(r) => [r.code, r.name, r.linked, r.description, people(r.observers)]}
        searchPlaceholder="Search by observation, linked record or observer"
        tableLabel="Observations, one row each"
        noun="observations"
        emptyDescription="Observations recorded in your projects appear here."
        initialSort={{ column: "observation", direction: "ascending" }}
        belowHeader={belowHeader}
        wrapBody={wrapBody}
        exportName="observations-report"
      />
    );
  }

  return (
    <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as RecordTab)} className="min-h-0 flex-1">
      {report}
    </Tabs>
  );
}

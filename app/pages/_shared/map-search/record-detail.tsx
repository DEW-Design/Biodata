"use client";

import type { Key, ReactNode } from "react";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronSelectorVertical } from "@untitledui/icons";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { Avatar } from "@/components/base/avatar/avatar";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { SidePanel } from "./side-panel";
import type { EventType, OccurrenceType, SearchEvent, SearchObservation, SearchOccurrence } from "./search-data";

// The record-detail sidebar shown when a user clicks a Project/Event/Occurrence/Observation row
// on the map search results page - built directly from the Figma "Details Container" frames
// (https://www.figma.com/design/u4FTv88XXfy58MiLN5T5Wu/Home---Landing-Page?node-id=220-52656),
// one real accordion section per frame section, per direct request. Resources/Artefacts are
// deliberately excluded - no Figma frame documents a resource sidebar, and the user's own request
// named "project, event, occurrence and observation" only; that tab keeps the existing generic
// column-detail SidePanel (results-table.tsx's own `detailRow` panel), unchanged.
//
// Every field this file renders is a real field Figma's own frames document (never an invented
// prop) - most render an honest "-" because this build's mock data model (search-data.ts) simply
// doesn't carry that level of BDBSA-schema detail (Legacy IDs, IBRA regions, voucher records,
// landscape-context scores, ...), the same "-" Figma's own mock content shows for the same fields.
// The two places this build *does* have real data (Start/End Date, and every record's own real
// lat/lon) render that real value instead of a placeholder. A few of Figma's own densest,
// multi-column stat/measurement grids (Occurrence's "Measurements" table, Observation
// Community's "Overstorey Measurements" reading pairs) are flattened into plain label rows rather
// than reproduced as exact multi-column tables - a deliberate simplification given none of this
// build's data ever populates them, logged in CONTEXT.md rather than silently done.

const LocationMap = dynamic(() => import("./sa-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 w-full items-center justify-center rounded-lg bg-secondary text-sm text-tertiary">Loading map…</div>
  ),
});

const DASH = "-";

export type DetailRecord =
  | { kind: "event"; event: SearchEvent }
  | { kind: "occurrence"; occurrence: SearchOccurrence }
  | { kind: "observation"; observation: SearchObservation };

function recordKey(record: DetailRecord): string {
  if (record.kind === "event") return `event-${record.event.id}`;
  if (record.kind === "occurrence") return `occurrence-${record.occurrence.id}`;
  return `observation-${record.observation.id}`;
}

function recordTitle(record: DetailRecord): string {
  if (record.kind === "event") return record.event.name;
  if (record.kind === "occurrence") return record.occurrence.commonName;
  return record.observation.commonName;
}

// ── Shared row/field primitives - every section below is built from these two. ──

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
      <span className="shrink-0 text-sm text-secondary sm:w-44">{label}</span>
      <span className="min-w-0 flex-1 text-sm font-medium text-primary">{value}</span>
    </div>
  );
}

function FieldStack({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((f, i) => (
        <Field key={`${f.label}-${i}`} label={f.label} value={f.value} />
      ))}
    </div>
  );
}

/** A plain field-label list, every value an honest "-" - for the dense, domain-specific field
 *  groups (Species biology, Land & Surfaces, Landscape Context Scores, ...) where every real
 *  Figma-documented field name is shown, but none of them have real data behind them yet. */
function PlaceholderFields({ labels }: { labels: string[] }) {
  return <FieldStack fields={labels.map((label) => ({ label, value: DASH }))} />;
}

/** A small, real column table (real tokens, not a hand-drawn image) - used for Project's "Data
 *  Collection Location", Site/Non-Biotic/Community's "Coordinates", and Permit's Type/No. table.
 *  `rows` are optionally labelled on the left (Site's "Entered Value"/"GDA2020 Equivalent"); when
 *  no row carries a `label`, the leading label column is omitted entirely (Project's own single-row
 *  location table, Permit's table). */
function ColumnTable({ columns, rows }: { columns: string[]; rows: { label?: string; values: string[] }[] }) {
  const hasRowLabels = rows.some((r) => r.label !== undefined);
  return (
    <div className="overflow-x-auto rounded-lg border border-secondary">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary">
            {hasRowLabels && <th className="border-b border-secondary px-3 py-2" />}
            {columns.map((c) => (
              <th key={c} className="border-b border-secondary px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-quaternary">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label ?? i}>
              {hasRowLabels && (
                <td className="border-b border-secondary px-3 py-2 text-sm font-medium whitespace-nowrap text-primary last:border-b-0">{row.label}</td>
              )}
              {row.values.map((v, j) => (
                <td key={j} className="border-b border-secondary px-3 py-2 text-sm font-medium text-primary last:border-b-0">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A real, working small map (the same Leaflet `SAMap` the search screen itself uses, not a
 *  fabricated static image) centred on the record's own real lat/lon - one of the few fields this
 *  sidebar always has genuine data for. */
function LocationMapPreview({ lat, lon }: { lat: number; lon: number }) {
  return (
    <div className="h-48 w-full overflow-hidden rounded-lg border border-secondary">
      <LocationMap
        boundaries={[{ id: "record-location", kind: "circle", center: [lat, lon], radiusKm: 1 }]}
        onBoundaryAdd={() => {}}
        activeDrawTool={null}
        onDrawToolChange={() => {}}
        className="size-full"
      />
    </div>
  );
}

// ── Sections shared across every record type - Temporal Details, Observers, Location
//    Information, Custom Property, Comments - matching Figma's own repeated accordion pattern
//    across all 15 "Details Container" frames. ──

function TemporalDetailsSection({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  return (
    <FieldStack
      fields={[
        { label: "Start Date", value: startDate ?? DASH },
        { label: "End Date", value: endDate ?? DASH },
        { label: "Duration", value: DASH },
        { label: "Date Accuracy", value: DASH },
      ]}
    />
  );
}

function ObserversSection({ names = [] }: { names?: (string | undefined)[] }) {
  return <FieldStack fields={[0, 1, 2].map((i) => ({ label: `Observer ${i + 1}`, value: names[i] ?? DASH }))} />;
}

function CoordinatesTable({ lat, lon }: { lat: number; lon: number }) {
  return (
    <ColumnTable
      columns={["Zone", "Easting", "Northing", "Latitude", "Longitude"]}
      rows={[
        { label: "Entered Value", values: [DASH, DASH, DASH, lat.toFixed(4), lon.toFixed(4)] },
        { label: "GDA2020 Equivalent", values: [DASH, DASH, DASH, DASH, DASH] },
      ]}
    />
  );
}

/** `full` adds the real Coordinates table - Figma's own two Location Information variants:
 *  Site, and Observation's Non-Biotic/Community, carry the full coordinate table; every other
 *  event/occurrence/observation type gets the simpler map-plus-fields version. */
function LocationInformationSection({ lat, lon, full = false }: { lat: number; lon: number; full?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <LocationMapPreview lat={lat} lon={lon} />
      <Field label="Location Details" value={DASH} />
      {full && <CoordinatesTable lat={lat} lon={lon} />}
      <PlaceholderFields
        labels={["IBRA Region", "IBRA Sub Region", "Location Method", "Datum", "Reliability", "Sample Site Dimensions", "Location Comment"]}
      />
    </div>
  );
}

function PhotopointSection() {
  return <PlaceholderFields labels={["Photopoint Marker Present", "Photopoint Disc Number", "Photopoint Direction"]} />;
}

/** `[Custom field name]`/`[Custom field value]` render verbatim, not as fabricated content - the
 *  same literal-bracket-placeholder convention this build already uses elsewhere (CONTEXT.md's
 *  "no fabricated ... beats a plausible-looking fake" rule) for an unconfigured custom field slot,
 *  not a stand-in the way a fabricated name/value would be. */
function CustomPropertySection() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <Field
          key={i}
          label="[Custom field name]"
          value={
            <div className="flex flex-col gap-0.5">
              <span>[Custom field value]</span>
              <span className="text-xs text-tertiary">Description</span>
            </div>
          }
        />
      ))}
    </div>
  );
}

function CommentsSection() {
  return <FieldStack fields={[0, 1, 2].map(() => ({ label: "[Comment type]", value: DASH }))} />;
}

// ── Project (11 accordions - node 220:45522 and its 11 child "Accordion" instances). ──

function ContactBlock({ orgName, contributorName, contributorInitials }: { orgName: string; contributorName?: string; contributorInitials?: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex h-20 w-full shrink-0 items-center justify-center rounded-md bg-secondary px-3 text-center text-sm font-medium text-primary sm:w-40">
        {orgName}
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-wide text-brand-tertiary uppercase">Primary Contact</p>
          {contributorName ? (
            <div className="flex items-center gap-2">
              <Avatar size="xs" initials={contributorInitials} alt={contributorName} />
              <span className="text-sm font-medium text-primary">{contributorName}</span>
            </div>
          ) : (
            <span className="text-sm text-tertiary">{DASH}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 border-t border-secondary pt-4">
          <p className="text-xs font-medium tracking-wide text-brand-tertiary uppercase">Secondary Contact</p>
          <span className="text-sm text-tertiary">{DASH}</span>
        </div>
      </div>
    </div>
  );
}

function ProjectOverviewSection({ event }: { event: SearchEvent }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-secondary">Abstract</p>
        <p className="text-sm text-tertiary">{event.description ?? DASH}</p>
      </div>
      <div className="h-px bg-secondary" />
      <p className="text-sm font-medium text-secondary">Geographic scope</p>
      <LocationMapPreview lat={event.lat} lon={event.lon} />
    </div>
  );
}

function ProjectLocationsSection({ lat, lon }: { lat: number; lon: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Data Collection Location"
        value={<ColumnTable columns={["MGA Easting", "MGA Northing", "Latitude", "Longitude"]} rows={[{ values: [DASH, DASH, lat.toFixed(4), lon.toFixed(4)] }]} />}
      />
      <Field label="Study Area Description" value={DASH} />
    </div>
  );
}

function DataCollectionScopeSection() {
  return (
    <PlaceholderFields
      labels={["Project Focus Areas", "Targetted Species", "Limitations and biases", "Method of Data Collection", "Method Details", "Raw Data Storage Details"]}
    />
  );
}

function PermitSection() {
  return <ColumnTable columns={["Permit Type", "Permit No."]} rows={[{ values: [DASH, DASH] }]} />;
}

/** Every restriction type (Embargo/Species/Location/Project Data/Other) is conditional in Figma's
 *  own frame, per this build's "a conditional field is conditional in the UI too" design
 *  principle - none of this build's mock projects carry real restriction data, so this section
 *  shows the same honest "No restrictions recorded" empty state `project-detail/option-1`'s own
 *  Restrictions tab already established, rather than rendering all 5 sub-blocks unconditionally. */
function PrivacyRestrictionsSection() {
  return <p className="text-sm text-tertiary">No restrictions recorded for this project.</p>;
}

type EventDetailShape = "project" | "site" | "visit" | "simple";

function eventDetailShape(type: EventType): EventDetailShape {
  if (type === "Project") return "project";
  if (type === "Site") return "site";
  if (type === "Visit") return "visit";
  return "simple";
}

function eventDetailsFields(event: SearchEvent): { label: string; value: ReactNode }[] {
  switch (eventDetailShape(event.type)) {
    case "project":
      return [
        { label: "Project No", value: event.code },
        { label: "Short Title (Display Name)", value: event.name },
        { label: "Full Project Name", value: event.description ?? DASH },
        { label: "Start Date", value: event.startDate },
        { label: "End Date", value: event.endDate },
      ];
    case "site":
      return [
        { label: "Site ID", value: event.code },
        { label: "Legacy Site ID", value: DASH },
        { label: "Site Name", value: event.name },
        { label: "Description", value: DASH },
        { label: "Site Grouping", value: DASH },
        { label: "Specific Property Details", value: DASH },
        { label: "Altitude", value: DASH },
        { label: "Mud Map", value: DASH },
        { label: "Paddock", value: DASH },
        { label: "Site Comment", value: DASH },
      ];
    case "visit":
      return [
        { label: "Visit ID", value: event.code },
        { label: "Legacy Visit ID", value: DASH },
        { label: "Visit Name", value: event.name },
        { label: "Description", value: DASH },
        { label: "Visit Seq No.", value: DASH },
        { label: "Source ID", value: DASH },
        { label: "Visit Comment", value: DASH },
      ];
    default:
      return [
        { label: `${event.type} ID`, value: event.code },
        { label: `${event.type} Name`, value: event.name },
        { label: "Description", value: DASH },
        { label: "Source ID", value: DASH },
        { label: `${event.type} Comment`, value: DASH },
      ];
  }
}

function buildProjectSections(event: SearchEvent): AccordionItemType[] {
  return [
    { id: "details", title: "Project Details", content: <FieldStack fields={eventDetailsFields(event)} /> },
    { id: "overview", title: "Overview", content: <ProjectOverviewSection event={event} /> },
    { id: "data-owner", title: "Data Owner/s", content: <ContactBlock orgName={event.org} contributorName={event.contributorName} contributorInitials={event.contributorInitials} /> },
    { id: "project-manager", title: "Project Manager/s", content: <ContactBlock orgName={event.org} contributorName={event.contributorName} contributorInitials={event.contributorInitials} /> },
    { id: "locations", title: "Locations", content: <ProjectLocationsSection lat={event.lat} lon={event.lon} /> },
    { id: "data-collection-scope", title: "Data Collection Scope", content: <DataCollectionScopeSection /> },
    { id: "permit", title: "Permit", content: <PermitSection /> },
    { id: "uri-doi", title: "URI / DOI", content: <Field label="URI / DOI Number" value={DASH} /> },
    { id: "privacy", title: "Privacy and Restrictions", content: <PrivacyRestrictionsSection /> },
    { id: "custom", title: "Custom Property", content: <CustomPropertySection /> },
    { id: "comments", title: "Comments", content: <CommentsSection /> },
  ];
}

// ── Site/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom event (5-6 accordions each). Visit,
//    Transect and Quadrat were each confirmed directly against their own Figma frame (nodes
//    220:48119/220:48392/220:48737) and are byte-for-byte the same 6-accordion shape (Details ->
//    Temporal Details -> Observers -> Location Information -> Photopoint -> Custom Property),
//    differing only by the type name interpolated into each label - Block/Ramble/Trap/Custom
//    event follow the identical confirmed template. Site (node 220:47659) is the one real
//    exception - no "Temporal Details" accordion, and its own Location Information carries the
//    full Coordinates table (it's the root spatial record every other event type is relative to,
//    not a child location). ──

function buildEventSections(event: SearchEvent): AccordionItemType[] {
  if (event.type === "Project") return buildProjectSections(event);

  const sections: AccordionItemType[] = [{ id: "details", title: `${event.type} Details`, content: <FieldStack fields={eventDetailsFields(event)} /> }];

  if (event.type !== "Site") {
    sections.push({ id: "temporal", title: "Temporal Details", content: <TemporalDetailsSection startDate={event.startDate} endDate={event.endDate} /> });
  }

  sections.push({ id: "observers", title: "Observers", content: <ObserversSection /> });
  sections.push({
    id: "location",
    title: "Location Information",
    content: <LocationInformationSection lat={event.lat} lon={event.lon} full={event.type === "Site"} />,
  });
  sections.push({ id: "photopoint", title: "Photopoint", content: <PhotopointSection /> });
  sections.push({ id: "custom", title: "Custom Property", content: <CustomPropertySection /> });
  return sections;
}

// ── Occurrence Individual/Population (nodes 220:50890/220:51320) - identical shape except
//    Individual carries an extra "Voucher" accordion Population doesn't. ──

function occurrenceDetailsFields(o: SearchOccurrence): { label: string; value: ReactNode }[] {
  return [
    { label: "Occurrence ID", value: o.id },
    { label: "Legacy Sighting #", value: DASH },
    { label: "Species Seq No", value: DASH },
    { label: "Occurrence Name", value: o.commonName },
    { label: "Description", value: DASH },
    { label: "Taxonomic Type", value: DASH },
    { label: "NSX Code & Species", value: o.species },
    { label: "Occurrence Status", value: o.status },
    { label: "Occurrence Comment", value: DASH },
  ];
}

function VoucherSection() {
  return (
    <div className="flex flex-col gap-3">
      <PlaceholderFields labels={["Voucher Type", "Voucher Series", "Voucher Number"]} />
      <Field label="Voucher Images" value={DASH} />
      <PlaceholderFields labels={["Institution Name", "Institution Rego #", "Determination Date", "Determination Date Accuracy", "Determiner 1", "Determiner 2", "Transfer Date"]} />
    </div>
  );
}

function buildOccurrenceSections(o: SearchOccurrence): AccordionItemType[] {
  const sections: AccordionItemType[] = [
    { id: "details", title: "Occurrence Details", content: <FieldStack fields={occurrenceDetailsFields(o)} /> },
    { id: "temporal", title: "Temporal Details", content: <TemporalDetailsSection startDate={o.date} /> },
    { id: "observers", title: "Observers", content: <ObserversSection /> },
  ];
  if (o.type === "Individual") {
    sections.push({ id: "voucher", title: "Voucher", content: <VoucherSection /> });
  }
  sections.push({ id: "location", title: "Location Information", content: <LocationInformationSection lat={o.lat} lon={o.lon} /> });
  sections.push({ id: "custom", title: "Custom Property", content: <CustomPropertySection /> });
  return sections;
}

// ── Observation Individual/Population/Non-Biotic/Community (nodes 220:51644/220:52233/
//    220:44074/220:46704) - all 4 real Figma frames confirmed directly. Every type shares
//    Details -> [type-specific sections] -> Observers -> Temporal Details -> Location Information
//    -> Custom Property; Non-Biotic and Community both carry the full Coordinates table (they're
//    site-level/plot-level records, not a single organism), and each has its own extra
//    domain-specific accordions Individual/Population don't. ──

const INDIVIDUAL_SPECIES_FIELDS = [
  "Line",
  "Life Form & Desc",
  "Collection Method & Desc",
  "Strata & Desc",
  "Macro Habitat & Desc",
  "Micro Habitat & Desc",
  "Activity",
  "Association Dominance",
  "Sex",
  "Regeneration",
  "Weight",
  "Height",
  "Gravid ?",
  "Teats",
  "Vagina",
  "Pouch Status",
  "No. in Pouch",
  "Testes",
  "Animal Life Stage",
  "Plant Life Stage",
  "Planted/Released",
];

const POPULATION_SPECIES_FIELDS = [
  "Number Observed",
  "Line",
  "Is Annual Herb ?",
  "Life Form & Desc",
  "Collection Method & Desc",
  "Strata & Desc",
  "Macro Habitat & Desc",
  "Micro Habitat & Desc",
  "Cover/Abundance & Desc",
  "Activity",
  "Association Dominance",
  "Animal Life Stage",
  "Plant Life Stage",
  "Planted/Released",
];

const LANDSCAPE_CONTEXT_BASE_FIELDS = ["Landscape Context Score", "IBRA Association", "IBRA subregion", "Vegetation cover", "Block shape", "Number of Landform Features within Block"];

function observationDetailsFields(o: SearchObservation): { label: string; value: ReactNode }[] {
  const fields: { label: string; value: ReactNode }[] = [
    { label: "Observation ID", value: o.id },
    { label: "Observation Name", value: o.commonName },
    { label: "Description", value: DASH },
  ];
  if (o.type === "Non-Biotic") {
    fields.push(
      { label: "Fire Scars", value: DASH },
      { label: "Bare Earth Estimate %", value: DASH },
      { label: "Litter Estimate %", value: DASH },
      { label: "Climatic Condition", value: DASH },
      { label: "Disturbance Impact (Code & Desc)", value: DASH },
    );
  }
  if (o.type === "Community") {
    fields.push(
      { label: "Vegetation Conditions", value: DASH },
      { label: "SA Structural Formation", value: DASH },
      { label: "Disturbance Impact (Code & Desc)", value: DASH },
      { label: "Assemblage Information (Muir)", value: DASH },
      { label: "Assemblage Information (Canopy)", value: DASH },
      { label: "Upper Stratum (Code & Desc)", value: DASH },
      { label: "Ephemerals Present?", value: DASH },
    );
  }
  fields.push({ label: "Observation Comment", value: DASH });
  return fields;
}

function speciesFieldsFor(type: OccurrenceType): string[] | null {
  if (type === "Individual") return INDIVIDUAL_SPECIES_FIELDS;
  if (type === "Population") return POPULATION_SPECIES_FIELDS;
  return null;
}

function buildObservationSections(o: SearchObservation): AccordionItemType[] {
  const sections: AccordionItemType[] = [{ id: "details", title: "Observation Details", content: <FieldStack fields={observationDetailsFields(o)} /> }];

  const speciesFields = speciesFieldsFor(o.type);
  if (speciesFields) {
    sections.push({ id: "species", title: "Species", content: <PlaceholderFields labels={speciesFields} /> });
  }

  if (o.type === "Non-Biotic") {
    sections.push(
      {
        id: "land-surfaces",
        title: "Land & Surfaces",
        content: (
          <PlaceholderFields
            labels={[
              "Site Slope",
              "Site Aspect",
              "Land Form Pattern",
              "Land Form Element",
              "Geological Surface",
              "Outcrop Cover",
              "Outcrop Lithology",
              "Surface Strew Size",
              "Surface Strew Cover",
              "Surface Strew Lithology",
              "Soil Texture Class",
              "Landform Comment",
            ]}
          />
        ),
      },
      { id: "landscape-context", title: "Landscape Context Scores", content: <PlaceholderFields labels={LANDSCAPE_CONTEXT_BASE_FIELDS} /> },
      { id: "environmental", title: "Environmental Conditions", content: <PlaceholderFields labels={["Air Temperature - Max", "Air Temperature - Min"]} /> },
    );
  }

  if (o.type === "Community") {
    sections.push(
      {
        id: "landscape-context",
        title: "Landscape Context Scores",
        content: (
          <PlaceholderFields
            labels={[...LANDSCAPE_CONTEXT_BASE_FIELDS, "Native veg. remaining", "Native veg. protected", "Wetland / riparian", "Does the block contain a wetland feature ?"]}
          />
        ),
      },
      {
        id: "overstorey",
        title: "Overstorey Measurements",
        content: (
          <PlaceholderFields
            labels={[
              "Canopy Type",
              "Projected Foliage Cover",
              "Overstorey Height Average",
              "Crown Depth Average",
              "Canopy Diameter Average",
              "Gaps Average",
              "Crown Separation Ratio",
              "Overstorey Measurement Count",
            ]}
          />
        ),
      },
      {
        id: "tree-health",
        title: "Tree Health",
        content: (
          <PlaceholderFields
            labels={[
              "Crown Extent %",
              "Crown Extent Score",
              "Crown Density %",
              "Crown Density Score",
              "Extent of Reproduction",
              "Extent Bark Cracking",
              "DBH (mm)",
              "Leaf Die off",
              "New Tip Growth",
              "Epicormic Growth",
              "Mistletoe Load",
              "Leaf Damage",
            ]}
          />
        ),
      },
    );
  }

  sections.push({ id: "observers", title: "Observers", content: <ObserversSection names={[o.observerName]} /> });
  sections.push({ id: "temporal", title: "Temporal Details", content: <TemporalDetailsSection startDate={o.date} /> });
  sections.push({
    id: "location",
    title: "Location Information",
    content: <LocationInformationSection lat={o.lat} lon={o.lon} full={o.type === "Non-Biotic" || o.type === "Community"} />,
  });
  sections.push({ id: "custom", title: "Custom Property", content: <CustomPropertySection /> });
  return sections;
}

function buildSections(record: DetailRecord): AccordionItemType[] {
  if (record.kind === "event") return buildEventSections(record.event);
  if (record.kind === "occurrence") return buildOccurrenceSections(record.occurrence);
  return buildObservationSections(record.observation);
}

/**
 * The sidebar itself - a full-viewport-height slide-over (`SidePanel`'s own `inset-y-0`/`h-full`),
 * its accordion content scrolling internally rather than the sidebar growing past the viewport,
 * per direct request. The header's own expand/collapse-all toggle stays fixed at the top
 * regardless of scroll position (it lives in `SidePanel`'s `headerActions` slot, not inside the
 * scrolling body) - also per direct request ("keep an icon on the top").
 *
 * `openState` is reset to "first section open" the moment a different record is selected, via the
 * documented React pattern of adjusting state during render when a tracked key changes (not a
 * `useEffect`, which would cost an extra render for the same result) - clicking a second row while
 * the sidebar is already open swaps content immediately instead of carrying over whichever
 * sections the previous record happened to have expanded.
 */
export function RecordDetailSidebar({ record, onClose }: { record: DetailRecord | null; onClose: () => void }) {
  const sections = useMemo(() => (record ? buildSections(record) : []), [record]);
  const currentKey = record ? recordKey(record) : null;

  const [openState, setOpenState] = useState<{ key: string | null; openKeys: Set<Key> }>({ key: null, openKeys: new Set() });
  if (openState.key !== currentKey) {
    setOpenState({ key: currentKey, openKeys: new Set(sections[0] ? [sections[0].id] : []) });
  }

  const allOpen = sections.length > 0 && openState.openKeys.size === sections.length;
  const toggleAll = () => setOpenState((s) => ({ ...s, openKeys: allOpen ? new Set() : new Set(sections.map((sec) => sec.id)) }));

  return (
    <SidePanel
      isOpen={record != null}
      onOpenChange={(open) => !open && onClose()}
      title={record ? recordTitle(record) : "Details"}
      widthClassName="max-w-2xl"
      headerActions={
        record && (
          <Tooltip title={allOpen ? "Collapse all sections" : "Expand all sections"}>
            <TooltipTrigger
              onPress={toggleAll}
              aria-label={allOpen ? "Collapse all sections" : "Expand all sections"}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
            >
              <ChevronSelectorVertical className="size-4" />
            </TooltipTrigger>
          </Tooltip>
        )
      }
    >
      {record && (
        <Accordion
          items={sections}
          variant="boxed"
          openKeys={openState.openKeys}
          onOpenKeysChange={(keys) => setOpenState((s) => ({ ...s, openKeys: keys }))}
        />
      )}
    </SidePanel>
  );
}

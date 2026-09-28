"use client";

import type { Key, ReactNode } from "react";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronSelectorVertical, Lock01 } from "@untitledui/icons";
import { Accordion, type AccordionItemType } from "@/components/base/accordion/accordion";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { obfuscateCoordinate } from "./geo";
import { projectDetailsPath, projectRecordPath } from "@/app/pages/_shared/project-routes";
import { generalisedKm } from "./record-access";
import type { UserRole } from "@/lib/user-role";
import { SidePanel } from "./side-panel";
import { LocationDetailsTable } from "@/app/pages/_shared/location-details-table";
import {
  rootProjectOfEvent,
  rootProjectForParentEventId,
  type EventType,
  type OccurrenceType,
  type SearchEvent,
  type SearchObservation,
  type SearchOccurrence,
  type SpeciesGroup,
} from "./search-data";
import { SPECIES_GROUP_COLOR } from "./species-group-icons";

// The record-detail sidebar shown when a user clicks a Project/Event/Occurrence/Observation row
// on the map search results page - built directly from the Figma "Details Container" frames
// (https://www.figma.com/design/u4FTv88XXfy58MiLN5T5Wu/Home---Landing-Page?node-id=220-52656),
// one real accordion section per frame section, per direct request. Resources/Artefacts are
// deliberately excluded - no Figma frame documents a resource sidebar, and the user's own request
// named "project, event, occurrence and observation" only; that tab keeps the existing generic
// column-detail SidePanel (results-table.tsx's own `detailRow` panel), unchanged.
//
// `ProjectSummaryHeader` (below `buildSections`) - a common, non-collapsible header shown at the
// top of every record type's sidebar, above the Figma accordion sections, so it's always clear
// which real Project a record belongs to. First built as a Project/Parent/Hierarchy field list,
// then replaced per direct feedback with this eyebrow-label + title + meta-row shape instead - the
// same real "PROJECT" eyebrow / big title / Project ID-Start Date-End Date-Status-Published by
// meta row already established for `project-detail`'s own page header (`MetaField` there,
// reused here as a page-local copy since it's a small, page-scoped primitive, not something this
// codebase cross-imports between `/pages/**` files). Shows the record's own root Project -
// `rootProjectOfEvent`/`rootProjectForParentEventId` - every field real (`code`/`name`/
// `startDate`/`endDate`/`status`/`statusColor`/`org`), nothing fabricated.
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

export function recordTitle(record: DetailRecord): string {
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

/** A small, real column table (real tokens, not a hand-drawn image) - used for Permit's Type/No.
 *  table and other small grids (location coordinates use the shared LocationDetailsTable).
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

/** The map preview for a restricted (Level 2) record: a soft, blurred area around the
 *  generalised position, never a pin on the real one. The fit is steered by a hidden circle a
 *  little larger than the area so the whole blur is in view. */
function RestrictedLocationMapPreview({ lat, lon, radiusKm, color }: { lat: number; lon: number; radiusKm: number; color?: string }) {
  return (
    <div className="h-48 w-full overflow-hidden rounded-lg border border-secondary">
      <LocationMap
        boundaries={[{ id: "record-area", kind: "circle", center: [lat, lon], radiusKm: radiusKm * 2 }]}
        showBoundaries={false}
        markers={[{ id: "record-area", position: [lat, lon], label: `Within about ${radiusKm} km of here`, fuzzyRadiusKm: radiusKm, color }]}
        onBoundaryAdd={() => {}}
        activeDrawTool={null}
        onDrawToolChange={() => {}}
        className="size-full"
      />
    </div>
  );
}

/** "Request access" for a restricted location: a signed-in person requests a Data Licencing
 *  Agreement, a guest is invited to sign up first (a guest has no DLA of their own to request). */
function RequestAccessButton() {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const href = role === "public-user" ? "/pages/auth/signup" : roleHref("/pages/dla/new");
  return (
    <Button color="secondary" size="sm" href={href}>
      {role === "public-user" ? "Sign up to request access" : "Request access"}
    </Button>
  );
}

/** A restricted record's coordinates: the generalised values only (the real ones never reach the
 *  page), blurred behind a padlock with a way to request access. */
function RestrictedLocationDetails({ lat, lon, radiusKm }: { lat: number; lon: number; radiusKm: number }) {
  return (
    <div className="relative overflow-hidden rounded-lg">
      <div aria-hidden className="pointer-events-none blur-[5px] select-none">
        <LocationDetailsTable lat={lat} lon={lon} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary shadow-xs ring-1 ring-secondary">
          <Lock01 className="size-4 text-fg-quaternary" />
        </span>
        <p className="text-sm font-medium text-balance text-primary">Location restricted</p>
        <p className="max-w-xs text-xs text-balance text-tertiary">
          This is a sensitive species, so its location is shown only to within about {radiusKm} km.
        </p>
        <RequestAccessButton />
      </div>
    </div>
  );
}

/** Every record type's Location Information - the map, then the shared Location Details
 *  coordinate table (the same format everywhere: Projects, Events, Occurrences, Observations),
 *  then the remaining location fields. A restricted (Level 2) record shows a blurred area and
 *  blurred, generalised coordinates instead (`restrictedKm`). */
function LocationInformationSection({ lat, lon, restrictedKm, group }: { lat: number; lon: number; restrictedKm?: number | null; group?: SpeciesGroup }) {
  if (restrictedKm) {
    const area = obfuscateCoordinate(lat, lon, restrictedKm);
    return (
      <div className="flex flex-col gap-4">
        <RestrictedLocationMapPreview lat={area.lat} lon={area.lon} radiusKm={restrictedKm} color={group ? SPECIES_GROUP_COLOR[group] : undefined} />
        <Field label="Location Details" value={<RestrictedLocationDetails lat={area.lat} lon={area.lon} radiusKm={restrictedKm} />} />
        <PlaceholderFields
          labels={["IBRA Region", "IBRA Sub Region", "Location Method", "Datum", "Reliability", "Sample Site Dimensions", "Location Comment"]}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <LocationMapPreview lat={lat} lon={lon} />
      <Field label="Location Details" value={<LocationDetailsTable lat={lat} lon={lon} />} />
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
      <div className="h-px bg-[var(--ui-border-primary)]" />
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
        value={<LocationDetailsTable lat={lat} lon={lon} />}
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
 *  shows the same honest "No restrictions recorded" empty state `project-detail`'s own
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
//    exception - no "Temporal Details" accordion. Every type's Location Information shows the same
//    shared Location Details coordinate table (location-details-table.tsx). ──

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
    content: <LocationInformationSection lat={event.lat} lon={event.lon} />,
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

function buildOccurrenceSections(o: SearchOccurrence, role: UserRole): AccordionItemType[] {
  const sections: AccordionItemType[] = [
    { id: "details", title: "Occurrence Details", content: <FieldStack fields={occurrenceDetailsFields(o)} /> },
    { id: "temporal", title: "Temporal Details", content: <TemporalDetailsSection startDate={o.date} /> },
    { id: "observers", title: "Observers", content: <ObserversSection /> },
  ];
  if (o.type === "Individual") {
    sections.push({ id: "voucher", title: "Voucher", content: <VoucherSection /> });
  }
  sections.push({ id: "location", title: "Location Information", content: <LocationInformationSection lat={o.lat} lon={o.lon} restrictedKm={generalisedKm(o, role)} group={o.group} /> });
  sections.push({ id: "custom", title: "Custom Property", content: <CustomPropertySection /> });
  return sections;
}

// ── Observation Individual/Population/Non-Biotic/Community (nodes 220:51644/220:52233/
//    220:44074/220:46704) - all 4 real Figma frames confirmed directly. Every type shares
//    Details -> [type-specific sections] -> Observers -> Temporal Details -> Location Information
//    -> Custom Property, with the same shared Location Details coordinate table as every other
//    record type; Non-Biotic and Community each have their own extra domain-specific accordions
//    Individual/Population don't. ──

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

function buildObservationSections(o: SearchObservation, role: UserRole): AccordionItemType[] {
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
    content: <LocationInformationSection lat={o.lat} lon={o.lon} restrictedKm={generalisedKm(o, role)} group={o.group} />,
  });
  sections.push({ id: "custom", title: "Custom Property", content: <CustomPropertySection /> });
  return sections;
}

/** Every section for a record - shared by the sidebar below (Explore option 1) and the record's own
 *  page under its project (ProjectRecordView, one tab per section), so the two can never show a
 *  record differently. `role` decides
 *  whether a restricted location is shown as recorded or generalised (record-access.ts). */
export function buildSections(record: DetailRecord, role: UserRole): AccordionItemType[] {
  if (record.kind === "event") return buildEventSections(record.event);
  if (record.kind === "occurrence") return buildOccurrenceSections(record.occurrence, role);
  return buildObservationSections(record.observation, role);
}

// ── Common "which Project does this belong to" header, shown at the top of every record type's
//    sidebar (Project/Site/Visit/.../Occurrence/Observation alike). ──

/** The root Project this record ultimately belongs to - itself, when the record already is a root
 *  Project. */
export function projectFor(record: DetailRecord): SearchEvent | undefined {
  if (record.kind === "event") return rootProjectOfEvent(record.event);
  const parentEventId = record.kind === "occurrence" ? record.occurrence.parentEventId : record.observation.parentEventId;
  return rootProjectForParentEventId(parentEventId);
}

/** Same small "small-caps label above value" stat field `project-detail`'s own page
 *  header (`MetaField` there) already establishes - kept as a page-local copy here rather than
 *  cross-imported, matching this codebase's convention for small, page-scoped primitives. */
function MetaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      <div className="text-sm text-primary">{children}</div>
    </div>
  );
}

function ProjectSummaryHeader({ project }: { project?: SearchEvent }) {
  if (!project) return null;
  return (
    <div className="mb-6 flex flex-col gap-5 border-b border-secondary pb-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">Project</p>
        <h2 className="text-xl font-medium text-primary">{project.name}</h2>
      </div>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <MetaField label="Project ID">{project.code}</MetaField>
        <MetaField label="Start Date">{project.startDate}</MetaField>
        <MetaField label="End Date">{!project.endDate || project.endDate === "\u2014" ? "Ongoing" : project.endDate}</MetaField>
        <MetaField label="Status">
          <BadgeWithDot size="sm" color={project.statusColor}>
            {project.status}
          </BadgeWithDot>
        </MetaField>
        <MetaField label="Published by">{project.org}</MetaField>
      </div>
    </div>
  );
}

// ── "Go to project" - the sidebar's own top-right quick action, per direct request: opens the
//    project's own real detail page with the same record selected in that page's own TreeView. ──

/** The record's own page under its project (/pages/project-list/[id]/project-details/<kind>/<id>);
 *  a root project is its project page. `null` only if the record belongs to no project. The path only; callers add the role through `useRoleHref`. */
export function projectDetailPath(record: DetailRecord): string | null {
  const project = projectFor(record);
  if (!project) return null;
  if (record.kind === "occurrence") return projectRecordPath(project.id, "occurrences", record.occurrence.id);
  if (record.kind === "observation") return projectRecordPath(project.id, "observations", record.observation.id);
  if (record.event.type !== "Project") return projectRecordPath(project.id, "events", record.event.id);
  return projectDetailsPath(project.id);
}

function GoToProjectButton({ record }: { record: DetailRecord }) {
  const roleHref = useRoleHref();
  const path = projectDetailPath(record);
  if (!path) return null;
  return (
    <Button color="secondary" size="sm" href={roleHref(path)}>
      Go to project
    </Button>
  );
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
export function RecordDetailSidebar({
  record,
  onClose,
  showGoToProject = true,
}: {
  record: DetailRecord | null;
  onClose: () => void;
  /** Off on the project's own page, where "Go to project" would lead back to the same page. */
  showGoToProject?: boolean;
}) {
  const role = useUserRole();
  const sections = useMemo(() => (record ? buildSections(record, role) : []), [record, role]);
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
          <>
            {showGoToProject && <GoToProjectButton record={record} />}
            <Tooltip title={allOpen ? "Collapse all sections" : "Expand all sections"}>
              <TooltipTrigger
                onPress={toggleAll}
                aria-label={allOpen ? "Collapse all sections" : "Expand all sections"}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
              >
                <ChevronSelectorVertical className="size-4" />
              </TooltipTrigger>
            </Tooltip>
          </>
        )
      }
    >
      {record && (
        <>
          <ProjectSummaryHeader project={projectFor(record)} />
          <Accordion
            items={sections}
            variant="boxed"
            openKeys={openState.openKeys}
            onOpenKeysChange={(keys) => setOpenState((s) => ({ ...s, openKeys: keys }))}
          />
        </>
      )}
    </SidePanel>
  );
}

"use client";

// Per-record-type field specs, editable - the same field vocabulary
// app/pages/_shared/map-search/record-detail.tsx already established in view-only form (itself
// built from a different Figma file's "Details Container" frames), re-expressed here as
// `FieldSpec[]` so each field can declare its own edit control. Cross-checked directly against
// this build's own edit-mode reference (wer8CgO1UoCH3aQw2jQkdy, node 2526:58529's 15 "Details
// Container" frames) - Site/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom event share one
// confirmed 6-section template there exactly as record-detail.tsx already documents, and
// Occurrence/Observation's own edit-mode fields (Taxonomic Type, NSX Code & Species, Occurrence
// Status, Location Method, Datum, Reliability, Date Accuracy, Voucher Type, Observers as a real
// multi-select, Start/End Date as real date pickers, Duration as a Days/Hours/Mins triple) are
// reproduced exactly as that reference renders them, not invented.
//
// Select-type fields need a real option list to choose from - Figma's own frames show these as
// unpopulated "Please Select" dropdowns (no live taxonomy/vocabulary service behind this preview),
// so each option list below is this build's own honest, illustrative enumeration, the same
// "illustrative where Figma leaves the dropdown unpopulated" convention already used for
// project-registration's own concept option lists (see that file's data.ts).

import type { EventType, OccurrenceType, SearchEvent, SearchObservation, SearchOccurrence } from "@/app/pages/_shared/map-search/search-data";
import type { FieldOption, FieldSpec } from "./field-editor";
import { specs } from "./field-editor";

const { field } = specs;

export type DetailRecord = { kind: "event"; event: SearchEvent } | { kind: "occurrence"; occurrence: SearchOccurrence } | { kind: "observation"; observation: SearchObservation };

export function recordKey(record: DetailRecord): string {
  if (record.kind === "event") return `event-${record.event.id}`;
  if (record.kind === "occurrence") return `occurrence-${record.occurrence.id}`;
  return `observation-${record.observation.id}`;
}

export function recordTitle(record: DetailRecord): string {
  if (record.kind === "event") return record.event.name;
  if (record.kind === "occurrence") return record.occurrence.commonName;
  return record.observation.commonName;
}

// ── Shared option vocabularies ──

const OBSERVER_OPTIONS: FieldOption[] = [
  { id: "olivia-wyatt", label: "Olivia Wyatt" },
  { id: "maya-dewitt", label: "Maya Dewitt" },
  { id: "phoenix-baker", label: "Phoenix Baker" },
  { id: "lana-steiner", label: "Lana Steiner" },
];

const LOCATION_METHOD_OPTIONS: FieldOption[] = [
  { id: "gps", label: "GPS" },
  { id: "map", label: "Map Reading" },
  { id: "gazetteer", label: "Gazetteer" },
  { id: "estimated", label: "Estimated" },
];

const DATUM_OPTIONS: FieldOption[] = [
  { id: "gda2020", label: "GDA2020" },
  { id: "gda94", label: "GDA94" },
  { id: "wgs84", label: "WGS84" },
];

const RELIABILITY_OPTIONS: FieldOption[] = [
  { id: "high", label: "High (< 10 m)" },
  { id: "medium", label: "Medium (10-100 m)" },
  { id: "low", label: "Low (> 100 m)" },
];

const DATE_ACCURACY_OPTIONS: FieldOption[] = [
  { id: "exact", label: "Exact" },
  { id: "approximate", label: "Approximate" },
  { id: "unknown", label: "Unknown" },
];

const TAXONOMIC_TYPE_OPTIONS: FieldOption[] = [
  { id: "fauna", label: "Fauna" },
  { id: "flora", label: "Flora" },
  { id: "fungi", label: "Fungi" },
];

const OCCURRENCE_STATUS_OPTIONS: FieldOption[] = [
  { id: "present", label: "Present" },
  { id: "absent", label: "Absent" },
];

const VOUCHER_TYPE_OPTIONS: FieldOption[] = [
  { id: "specimen", label: "Specimen" },
  { id: "photograph", label: "Photograph" },
  { id: "none", label: "None" },
];

const SITE_GROUPING_OPTIONS: FieldOption[] = [
  { id: "reserve", label: "Reserve" },
  { id: "private-land", label: "Private Land" },
  { id: "roadside", label: "Roadside" },
  { id: "waterway", label: "Waterway" },
];

const SEX_OPTIONS: FieldOption[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "unknown", label: "Unknown" },
];

const ACTIVITY_OPTIONS: FieldOption[] = [
  { id: "foraging", label: "Foraging" },
  { id: "resting", label: "Resting" },
  { id: "moving", label: "Moving" },
  { id: "breeding", label: "Breeding" },
  { id: "vocalising", label: "Vocalising" },
];

const LIFE_STAGE_OPTIONS: FieldOption[] = [
  { id: "adult", label: "Adult" },
  { id: "juvenile", label: "Juvenile" },
  { id: "sub-adult", label: "Sub-adult" },
  { id: "unknown", label: "Unknown" },
];

// ── Section field lists - shared across every event-shaped type ──

function temporalFields(): FieldSpec[] {
  return [field("startDate", "Start Date", "date"), field("endDate", "End Date", "date"), field("durationDays", "Duration (days)", "number"), field("dateAccuracy", "Date Accuracy", "select", { options: DATE_ACCURACY_OPTIONS })];
}

function observersField(): FieldSpec[] {
  return [field("observers", "Observers", "multiselect", { options: OBSERVER_OPTIONS, placeholder: "Select observers" })];
}

function locationFields(): FieldSpec[] {
  return [
    field("ibraRegion", "IBRA Region", "text"),
    field("ibraSubRegion", "IBRA Sub Region", "text"),
    field("locationMethod", "Location Method", "select", { options: LOCATION_METHOD_OPTIONS }),
    field("datum", "Datum", "select", { options: DATUM_OPTIONS }),
    field("reliability", "Reliability", "select", { options: RELIABILITY_OPTIONS }),
    field("sampleSiteDimensions", "Sample Site Dimensions", "text"),
    field("locationComment", "Location Comment", "textarea"),
  ];
}

function photopointFields(): FieldSpec[] {
  return [field("photopointMarkerPresent", "Photopoint Marker Present", "boolean"), field("photopointDiscNumber", "Photopoint Disc Number", "number"), field("photopointDirection", "Photopoint Direction", "number", { unit: "Degrees" })];
}

export interface SectionSpec {
  id: string;
  title: string;
  fields?: FieldSpec[];
  /** Custom Property is a repeatable-row editor, not a fixed field list - see field-editor.tsx's
   *  own CustomPropertyEditor. */
  isCustomProperty?: boolean;
}

// ── Project ──

function projectDetailsFields(): FieldSpec[] {
  return [
    field("code", "Project No", "readonly"),
    field("name", "Short Title (Display Name)", "text"),
    field("fullName", "Full Project Name", "textarea"),
    field("startDate", "Start Date", "date"),
    field("endDate", "End Date", "date"),
  ];
}

function projectSections(): SectionSpec[] {
  return [
    { id: "details", title: "Project Details", fields: projectDetailsFields() },
    { id: "overview", title: "Overview", fields: [field("abstract", "Abstract", "textarea")] },
    { id: "data-collection-scope", title: "Data Collection Scope", fields: [field("focusAreas", "Project Focus Areas", "text"), field("targetedSpecies", "Targeted Species", "textarea"), field("limitations", "Limitations and biases", "textarea"), field("collectionMethod", "Method of Data Collection", "text")] },
    { id: "locations", title: "Locations", fields: [field("studyArea", "Study Area Description", "textarea")] },
    { id: "permit", title: "Permit", fields: [field("permitType", "Permit Type", "text"), field("permitNo", "Permit No.", "text")] },
    { id: "uri-doi", title: "URI / DOI", fields: [field("uriDoi", "URI / DOI Number", "text")] },
    { id: "custom", title: "Custom Property", isCustomProperty: true },
  ];
}

// ── Site/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom event ──

type EventDetailShape = "site" | "visit" | "simple";

function eventDetailShape(type: EventType): EventDetailShape {
  if (type === "Site") return "site";
  if (type === "Visit") return "visit";
  return "simple";
}

function eventDetailsFields(event: SearchEvent): FieldSpec[] {
  switch (eventDetailShape(event.type)) {
    case "site":
      return [
        field("code", "Site ID", "readonly"),
        field("legacyId", "Legacy Site ID", "text"),
        field("name", "Site Name", "text"),
        field("description", "Description", "textarea"),
        field("siteGrouping", "Site Grouping", "select", { options: SITE_GROUPING_OPTIONS }),
        field("specificPropertyDetails", "Specific Property Details", "text"),
        field("altitude", "Altitude", "number", { unit: "m" }),
        field("mudMap", "Mud Map", "boolean"),
        field("paddock", "Paddock", "text"),
        field("comment", "Site Comment", "textarea"),
      ];
    case "visit":
      return [
        field("code", "Visit ID", "readonly"),
        field("legacyId", "Legacy Visit ID", "text"),
        field("name", "Visit Name", "text"),
        field("description", "Description", "textarea"),
        field("visitSeqNo", "Visit Seq No.", "number"),
        field("sourceId", "Source ID", "text"),
        field("comment", "Visit Comment", "textarea"),
      ];
    default:
      return [
        field("code", `${event.type} ID`, "readonly"),
        field("name", `${event.type} Name`, "text"),
        field("description", "Description", "textarea"),
        field("sourceId", "Source ID", "text"),
        field("comment", `${event.type} Comment`, "textarea"),
      ];
  }
}

function eventSections(event: SearchEvent): SectionSpec[] {
  if (event.type === "Project") return projectSections();

  const sections: SectionSpec[] = [{ id: "details", title: `${event.type} Details`, fields: eventDetailsFields(event) }];
  if (event.type !== "Site") sections.push({ id: "temporal", title: "Temporal Details", fields: temporalFields() });
  sections.push({ id: "observers", title: "Observers", fields: observersField() });
  sections.push({ id: "location", title: "Location Information", fields: locationFields() });
  sections.push({ id: "photopoint", title: "Photopoint", fields: photopointFields() });
  sections.push({ id: "custom", title: "Custom Property", isCustomProperty: true });
  return sections;
}

// ── Occurrence Individual/Population ──

function occurrenceDetailsFields(): FieldSpec[] {
  return [
    field("id", "Occurrence ID", "readonly"),
    field("legacySighting", "Legacy Sighting #", "text"),
    field("speciesSeqNo", "Species Seq No", "number"),
    field("name", "Occurrence Name", "text"),
    field("description", "Description", "textarea"),
    field("taxonomicType", "Taxonomic Type", "select", { options: TAXONOMIC_TYPE_OPTIONS }),
    field("species", "NSX Code & Species", "text"),
    field("status", "Occurrence Status", "select", { options: OCCURRENCE_STATUS_OPTIONS }),
    field("comment", "Occurrence Comment", "textarea"),
  ];
}

function voucherFields(): FieldSpec[] {
  return [
    field("voucherType", "Voucher Type", "select", { options: VOUCHER_TYPE_OPTIONS }),
    field("voucherSeries", "Voucher Series", "text"),
    field("voucherNumber", "Voucher Number", "number"),
    field("institutionName", "Institution Name", "text"),
    field("institutionRego", "Institution Rego #", "text"),
    field("determinationDate", "Determination Date", "date"),
    field("determinationAccuracy", "Determination Date Accuracy", "select", { options: DATE_ACCURACY_OPTIONS }),
    field("determiner1", "Determiner 1", "text"),
    field("determiner2", "Determiner 2", "text"),
  ];
}

function occurrenceSections(o: SearchOccurrence): SectionSpec[] {
  const sections: SectionSpec[] = [
    { id: "details", title: "Occurrence Details", fields: occurrenceDetailsFields() },
    { id: "temporal", title: "Temporal Details", fields: temporalFields() },
    { id: "observers", title: "Observers", fields: observersField() },
  ];
  if (o.type === "Individual") sections.push({ id: "voucher", title: "Voucher", fields: voucherFields() });
  sections.push({ id: "location", title: "Location Information", fields: locationFields() });
  sections.push({ id: "custom", title: "Custom Property", isCustomProperty: true });
  return sections;
}

// ── Observation Individual/Population/Non-Biotic/Community ──

function individualSpeciesFields(): FieldSpec[] {
  return [
    field("lifeForm", "Life Form & Desc", "text"),
    field("collectionMethod", "Collection Method & Desc", "text"),
    field("strata", "Strata & Desc", "text"),
    field("macroHabitat", "Macro Habitat & Desc", "textarea"),
    field("microHabitat", "Micro Habitat & Desc", "textarea"),
    field("activity", "Activity", "select", { options: ACTIVITY_OPTIONS }),
    field("sex", "Sex", "select", { options: SEX_OPTIONS }),
    field("weight", "Weight", "number", { unit: "g" }),
    field("height", "Height", "number", { unit: "cm" }),
    field("gravid", "Gravid ?", "boolean"),
    field("pouchStatus", "Pouch Status", "text"),
    field("lifeStage", "Animal Life Stage", "select", { options: LIFE_STAGE_OPTIONS }),
    field("plantedReleased", "Planted/Released", "boolean"),
  ];
}

function populationSpeciesFields(): FieldSpec[] {
  return [
    field("numberObserved", "Number Observed", "number"),
    field("isAnnualHerb", "Is Annual Herb ?", "boolean"),
    field("lifeForm", "Life Form & Desc", "text"),
    field("collectionMethod", "Collection Method & Desc", "text"),
    field("coverAbundance", "Cover/Abundance & Desc", "text"),
    field("activity", "Activity", "select", { options: ACTIVITY_OPTIONS }),
    field("lifeStage", "Animal Life Stage", "select", { options: LIFE_STAGE_OPTIONS }),
    field("plantedReleased", "Planted/Released", "boolean"),
  ];
}

function speciesFieldsFor(type: OccurrenceType): FieldSpec[] | null {
  if (type === "Individual") return individualSpeciesFields();
  if (type === "Population") return populationSpeciesFields();
  return null;
}

function observationDetailsFields(o: SearchObservation): FieldSpec[] {
  const fields: FieldSpec[] = [field("id", "Observation ID", "readonly"), field("name", "Observation Name", "text"), field("description", "Description", "textarea")];
  if (o.type === "Non-Biotic") {
    fields.push(
      field("fireScars", "Fire Scars", "boolean"),
      field("bareEarthPct", "Bare Earth Estimate %", "number", { unit: "%" }),
      field("litterEstimatePct", "Litter Estimate %", "number", { unit: "%" }),
      field("climaticCondition", "Climatic Condition", "text"),
    );
  }
  if (o.type === "Community") {
    fields.push(field("vegetationConditions", "Vegetation Conditions", "text"), field("structuralFormation", "SA Structural Formation", "text"), field("ephemeralsPresent", "Ephemerals Present?", "boolean"));
  }
  fields.push(field("comment", "Observation Comment", "textarea"));
  return fields;
}

function observationSections(o: SearchObservation): SectionSpec[] {
  const sections: SectionSpec[] = [{ id: "details", title: "Observation Details", fields: observationDetailsFields(o) }];
  const speciesFields = speciesFieldsFor(o.type);
  if (speciesFields) sections.push({ id: "species", title: "Species", fields: speciesFields });
  if (o.type === "Non-Biotic") {
    sections.push({ id: "landscape-context", title: "Landscape Context Scores", fields: [field("landscapeScore", "Landscape Context Score", "number"), field("vegCover", "Vegetation cover", "number", { unit: "%" })] });
  }
  if (o.type === "Community") {
    sections.push({ id: "overstorey", title: "Overstorey Measurements", fields: [field("canopyType", "Canopy Type", "text"), field("overstoreyHeight", "Overstorey Height Average", "number", { unit: "m" })] });
  }
  sections.push({ id: "observers", title: "Observers", fields: observersField() });
  sections.push({ id: "temporal", title: "Temporal Details", fields: temporalFields() });
  sections.push({ id: "location", title: "Location Information", fields: locationFields() });
  sections.push({ id: "custom", title: "Custom Property", isCustomProperty: true });
  return sections;
}

export function buildSections(record: DetailRecord): SectionSpec[] {
  if (record.kind === "event") return eventSections(record.event);
  if (record.kind === "occurrence") return occurrenceSections(record.occurrence);
  return observationSections(record.observation);
}

/** Seed values for a section's fields, read straight off the real record where a real field
 *  exists (name/description/dates/species/status/comment...) - every other field has no real data
 *  behind it in this build's mock model (same "-" placeholder convention as record-detail.tsx),
 *  starting empty until a user actually edits it. */
export function seedValues(record: DetailRecord, section: SectionSpec): Record<string, string> {
  if (section.id === "details" || section.id === "overview") {
    if (record.kind === "event") {
      const e = record.event;
      if (e.type === "Project") {
        if (section.id === "overview") return { abstract: e.description ?? "" };
        return { code: e.code, name: e.name, fullName: e.description ?? "", startDate: "", endDate: "" };
      }
      return { code: e.code, name: e.name, description: "" };
    }
    if (record.kind === "occurrence") {
      const o = record.occurrence;
      return { id: o.id, name: o.commonName, species: o.species, status: o.status === "Present" ? "present" : "absent" };
    }
    const ob = record.observation;
    return { id: ob.id, name: ob.commonName };
  }
  return {};
}

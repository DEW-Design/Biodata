// The survey records for option 3 of the project detail page (route: /pages/project-detail/option-2).
//
// One project, Adelaide Hills Bushland Survey (BD-5039), modelled the way a Darwin Core user reads a
// survey: Events nest under the Site (Site > Visit, and Site > sampling event; a Visit holds no events), Occurrences sit under the sampling event that
// recorded them, and Observations hold the measurements (MeasurementOrFact) taken for an Occurrence,
// or, for Non-biotic and Community observations, taken directly at a sampling event.
//
// Every event type (Site, Visit, Transect, Quadrat, Block, Ramble, Trap, Custom event), both
// occurrence types (Individual, Population) and all four observation types (Individual, Population,
// Non-biotic, Community) appear at least once, per direct request. Species are real South
// Australian natives already used elsewhere in this build; people are the placeholder cast
// (Olivia Wyatt, Phoenix Baker, Lana Steiner, Maya Dewitt). Field labels follow the BDBSA "Details
// Container" frames (Figma wer8CgO1UoCH3aQw2jQkdy, node 1610:47608, used for reference only); the
// Darwin Core term next to a label is shown only where a real term exists, never invented.
//
// Deliberately page-local rather than folded into map-search/search-data.ts: this dataset carries
// far more metadata per record than Explore needs, and renaming records there would change Explore.

import type { Artefact } from "@/app/pages/_shared/artefact-lightbox";
import type { GeoExtentValue } from "@/app/pages/project-registration/types";
import { NSX_SPECIES, ibraFor, type FieldType, type TrapEntry } from "./field-schema";
import { FACTORS_FOR, type FactorId, type LandscapeInputs } from "./landscape";

// The event skeleton (code, name, parent), declared first because the record builders below read it
// while the full records are being assembled.
const RAW_EVENTS: Record<string, { id: string; code: string; name: string; parent: string | null }> = {
  su1: { id: "su1", code: "SU00501", name: "Cleland Stringybark Woodland", parent: null },
  su2: { id: "su2", code: "SU00502", name: "Mylor Creek Riparian Corridor", parent: null },
  vu1: { id: "vu1", code: "VU00501", name: "Spring survey 2025", parent: "su1" },
  vu2: { id: "vu2", code: "VU00502", name: "Autumn survey 2026", parent: "su2" },
  tr1: { id: "tr1", code: "TR00501", name: "Ridge-top bird transect", parent: "su1" },
  qr1: { id: "qr1", code: "QR00501", name: "Stringybark woodland quadrat", parent: "su1" },
  trp1: { id: "trp1", code: "TRP00501", name: "Pitfall and Elliott trap line A", parent: "su1" },
  bk1: { id: "bk1", code: "BK00501", name: "Creekline fauna search block", parent: "su2" },
  rmb1: { id: "rmb1", code: "RMB00501", name: "Opportunistic creek-bank ramble", parent: "su2" },
  cu1: { id: "cu1", code: "CU00501", name: "Nocturnal spotlighting survey", parent: "su2" },
};

export type RecordKind = "event" | "occurrence" | "observation";
export type SurveyEventType = "Site" | "Visit" | "Transect" | "Quadrat" | "Block" | "Ramble" | "Trap" | "Custom event";
export type SurveyOccurrenceType = "Individual" | "Population";
export type SurveyObservationType = "Individual" | "Population" | "Non-biotic" | "Community";

export interface MetaRow {
  label: string;
  /** The Darwin Core term this field maps to, when one exists. */
  term?: string;
  value: string;
  /** How the field is entered, from the Figma annotation (field-schema.ts); when absent it is worked out from the label. */
  type?: FieldType;
  /** A code table's columns, when they differ from its label (field-options.ts CODE_TABLES). */
  table?: string;
}

/** One overstorey reading (a tree or stem measured). */
export interface OverstoreyReading {
  height: string;
  crownDepth: string;
  canopyDiameter: string;
  gaps: string;
  valueType: string;
}
export interface OverstoreyData {
  canopyType: string;
  /** Projected foliage cover, %. */
  foliageCover: string;
  readings: OverstoreyReading[];
}

export interface MetaSection {
  id: string;
  title: string;
  rows?: MetaRow[];
  /** A measurement table (MeasurementOrFact), rendered as a real table. */
  measurements?: { type: string; value: string; unit: string; method: string }[];
  /** Renders the record's map and the shared coordinate table above the rows. */
  withMap?: boolean;
  /** A trap's trap types, each with its Effort and Specs lines (field-schema.ts). */
  trapEffort?: TrapEntry[];
  /** Landscape context scores: which factors this record scores, and what was entered (landscape.ts). */
  landscape?: { factors: FactorId[]; inputs: LandscapeInputs };
  /** Overstorey measurements (Community). */
  overstorey?: OverstoreyData;
}

export interface SurveyRecord {
  id: string;
  code: string;
  kind: RecordKind;
  type: SurveyEventType | SurveyOccurrenceType | SurveyObservationType;
  name: string;
  /** `null` = directly under the project. */
  parentId: string | null;
  /** ISO date. */
  date: string;
  lat: number;
  lon: number;
  scientificName?: string;
  /** One short line shown under the name in the tree, table and inspector. */
  summary: string;
  /** Set when a project restriction generalises this record's location. */
  locationNote?: string;
  /** Where the record is, as chosen in the location picker (shapefile, drawn shape, list or coordinates). */
  location?: GeoExtentValue;
  sections: MetaSection[];
}

/** Plain-language meaning of each type, shown beside the type in the inspector. */
export const TYPE_DESCRIPTIONS: Record<string, string> = {
  Site: "A fixed, revisitable survey location",
  Visit: "One survey occasion at a site",
  Transect: "A line walked and recorded along its length",
  Quadrat: "A fixed-area plot sampled in full",
  Block: "A bounded area searched for a set time",
  Ramble: "An unstructured, opportunistic area search",
  Trap: "A trap or trap line left open for a period",
  "Custom event": "Any other sampling method",
  "Occurrence:Individual": "One organism, recorded on its own",
  "Occurrence:Population": "A group of the same species, counted or estimated",
  "Observation:Individual": "Measurements taken from one organism",
  "Observation:Population": "Counts and structure of a group of one species",
  "Observation:Non-biotic": "Soil, ground cover and other physical conditions",
  "Observation:Community": "The vegetation community as a whole",
};

export function typeDescription(r: SurveyRecord): string {
  return TYPE_DESCRIPTIONS[r.kind === "event" ? r.type : `${r.kind === "occurrence" ? "Occurrence" : "Observation"}:${r.type}`] ?? "";
}

const NP = "Not provided";
const CUSTOM: MetaSection = {
  id: "custom",
  title: "Custom properties",
  rows: [{ label: "Custom properties", value: "None recorded" }],
};

function observersSection(names: string[]): MetaSection {
  return { id: "observers", title: "Observers", rows: [{ label: "Recorded by", term: "recordedBy", value: names.join(" | ") }] };
}

// ── Events ──

/** A site, with the fields and field types of the Figma "Site Details Container / Edit" frame (1970:143519). */
function site(o: {
  id: string;
  code: string;
  legacy: string;
  name: string;
  date: string;
  lat: number;
  lon: number;
  radiusKm: number;
  description: string;
  grouping: string;
  property: string;
  altitude: string;
  mudMap: string;
  paddock: string;
  comment: string;
  dimensions: string;
  locationComment: string;
  photopoint: { present: string; disc: string; direction: string };
}): SurveyRecord {
  return {
    id: o.id,
    code: o.code,
    kind: "event",
    type: "Site",
    name: o.name,
    parentId: null,
    date: o.date,
    lat: o.lat,
    lon: o.lon,
    location: { method: "map", boundary: { id: `site-${o.id}`, kind: "circle", center: [o.lat, o.lon], radiusKm: o.radiusKm } },
    summary: o.description,
    sections: siteSections({ ...o, observers: ["Olivia Wyatt", "Maya Dewitt"] }),
  };
}

export function siteSections(o: {
  code: string;
  legacy: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  grouping: string;
  property: string;
  altitude: string;
  mudMap: string;
  paddock: string;
  comment: string;
  dimensions: string;
  locationComment: string;
  observers: string[];
  photopoint: { present: string; disc: string; direction: string };
}): MetaSection[] {
  const ibra = ibraFor(o.lat, o.lon);
  return [
    {
      id: "details",
      title: "Site details",
      rows: [
        { label: "Site ID", term: "locationID", value: o.code, type: "system" },
        { label: "Legacy site ID", value: o.legacy, type: "system" },
        { label: "Site name", term: "locality", value: o.name, type: "text" },
        { label: "Description", value: o.description, type: "text" },
        { label: "Site grouping", value: o.grouping, type: "text" },
        { label: "Specific property details", value: o.property, type: "text" },
        { label: "Altitude", term: "minimumElevationInMeters", value: o.altitude, type: "number" },
        { label: "Mud map", value: o.mudMap, type: "yesno" },
        { label: "Paddock", value: o.paddock, type: "text" },
        { label: "Site comment", term: "locationRemarks", value: o.comment, type: "textarea" },
      ],
    },
    observersSection(o.observers),
    {
      id: "location",
      title: "Location information",
      withMap: true,
      rows: [
        { label: "IBRA region", value: ibra.region, type: "derived" },
        { label: "IBRA subregion", value: ibra.subregion, type: "derived" },
        { label: "Location method", term: "georeferenceProtocol", value: "GPS", type: "vocab" },
        { label: "Datum", term: "geodeticDatum", value: "GDA2020", type: "vocab" },
        { label: "Reliability", term: "coordinateUncertaintyInMeters", value: "1", type: "vocab" },
        { label: "Sample site dimensions", term: "sampleSizeValue", value: o.dimensions, type: "dimensions" },
        { label: "Location comment", term: "locationRemarks", value: o.locationComment, type: "textarea" },
      ],
    },
    {
      id: "photopoint",
      title: "Photopoint",
      rows: [
        { label: "Photopoint marker present", value: o.photopoint.present, type: "yesno" },
        { label: "Photopoint disc number", value: o.photopoint.disc, type: "number" },
        { label: "Photopoint direction", value: o.photopoint.direction, type: "unitNumber" },
      ],
    },
    { ...CUSTOM },
  ];
}

/** The words a Figma event frame uses for its own fields: "Transect name", "Trap array comment", "Event ID". */
export function eventLabels(type: string): { noun: string; name: string; comment: string } {
  if (type === "Trap") return { noun: "Trap", name: "Trap array name", comment: "Trap array comment" };
  if (type === "Custom event") return { noun: "Event", name: "Event name", comment: "Event comment" };
  return { noun: type, name: `${type} name`, comment: `${type} comment` };
}

export interface EventFields {
  type: Exclude<SurveyEventType, "Site">;
  code: string;
  name: string;
  description: string;
  sourceId: string;
  comment: string;
  /** Visit only: "1/3", the visit's place among its site's visits. */
  seq?: string;
  /** Custom event only. */
  eventArray?: string;
  startDate: string;
  /** ISO date, or "Not provided". */
  endDate: string;
  /** "2d 3h 30m" (field-schema.ts). */
  duration: string;
  dateAccuracy: string;
  observers: string[];
  lat: number;
  lon: number;
  dimensions: string;
  locationComment: string;
  photopoint: { present: string; disc: string; direction: string };
  trapEffort?: TrapEntry[];
}

/**
 * Every event other than a site, with the fields and field types of its Figma "Details Container /
 * Edit" frame (file YMproGZfrFB5jUqPHPxMhk): Visit 1970:143761, Transect 1970:143999, Quadrat
 * 1970:144274, Block 1970:144564, Ramble 1970:144861, Trap 1970:145237, Custom event 1970:145642.
 * The sampling events share one layout; a visit has no location of its own; a trap lists its trap
 * effort in place of observers (the trap effort itself follows the designer's table, not Figma).
 */
export function eventSections(o: EventFields): MetaSection[] {
  const l = eventLabels(o.type);
  const ibra = ibraFor(o.lat, o.lon);
  const isVisit = o.type === "Visit";
  return [
    {
      id: "details",
      title: `${l.noun} details`,
      rows: [
        { label: `${l.noun} ID`, term: "eventID", value: o.code, type: "system" },
        ...(isVisit ? [{ label: "Legacy visit ID", value: NP, type: "system" as const }] : []),
        { label: l.name, value: o.name, type: "text" },
        { label: "Description", value: o.description, type: "text" },
        ...(isVisit ? [{ label: "Visit sequence number", value: o.seq ?? NP, type: "system" as const }] : []),
        ...(o.type === "Custom event" ? [{ label: "Event array", value: o.eventArray ?? NP, type: "text" as const }] : []),
        { label: "Source ID", value: o.sourceId, type: "text" },
        { label: l.comment, term: "eventRemarks", value: o.comment, type: "textarea" },
      ],
    },
    {
      id: "temporal",
      title: "Temporal details",
      rows: [
        { label: "Start date", term: "eventDate", value: formatDate(o.startDate) },
        { label: "End date", value: o.endDate, type: "date" },
        { label: "Duration", term: "samplingEffort", value: o.duration, type: "duration" },
        { label: "Date accuracy", value: o.dateAccuracy, type: "vocab" },
      ],
    },
    ...(o.type === "Trap" ? [{ id: "trapEffort", title: "Trap effort", trapEffort: o.trapEffort ?? [] }] : [observersSection(o.observers)]),
    ...(isVisit
      ? []
      : [
          {
            id: "location",
            title: "Location information",
            withMap: true,
            rows: [
              { label: "IBRA region", value: ibra.region, type: "derived" as const },
              { label: "IBRA subregion", value: ibra.subregion, type: "derived" as const },
              { label: "Location method", term: "georeferenceProtocol", value: "GPS", type: "vocab" as const },
              { label: "Datum", term: "geodeticDatum", value: "GDA2020", type: "vocab" as const },
              { label: "Reliability", term: "coordinateUncertaintyInMeters", value: "1", type: "vocab" as const },
              { label: "Sample site dimensions", term: "sampleSizeValue", value: o.dimensions, type: "dimensions" as const },
              { label: "Location comment", term: "locationRemarks", value: o.locationComment, type: "textarea" as const },
            ],
          },
        ]),
    {
      id: "photopoint",
      title: "Photopoint",
      rows: [
        { label: "Photopoint marker present", value: o.photopoint.present, type: "yesno" },
        { label: "Photopoint disc number", value: o.photopoint.disc, type: "number" },
        { label: "Photopoint direction", value: o.photopoint.direction, type: "unitNumber" },
      ],
    },
    { ...CUSTOM },
  ];
}

function event(o: Omit<EventFields, "code" | "name"> & { id: string; parentId: string; radiusKm?: number }): SurveyRecord {
  const raw = RAW_EVENTS[o.id];
  return {
    id: o.id,
    code: raw.code,
    kind: "event",
    type: o.type,
    name: raw.name,
    parentId: o.parentId,
    date: o.startDate,
    lat: o.lat,
    lon: o.lon,
    location: o.type === "Visit" ? undefined : { method: "map", boundary: { id: `ev-${o.id}`, kind: "circle", center: [o.lat, o.lon], radiusKm: o.radiusKm ?? 0.05 } },
    summary: o.description,
    sections: eventSections({ ...o, code: raw.code, name: raw.name }),
  };
}

const NO_PHOTOPOINT = { present: "No", disc: NP, direction: NP };

// ── Occurrences and observations ──
//
// Fields and field types from the Figma "Details Container / Edit" frames (file YMproGZfrFB5jUqPHPxMhk):
// Occurrence Individual 1970:145957, Occurrence Population 1970:146253, Observation Individual
// 1970:148058, Population 1970:148456, Non-biotic 1970:146612, Community 1970:147303. The types come
// from the Figma components; option lists are in field-options.ts. Two things are not in Figma and
// were added here: Canopy type and Projected foliage cover in Overstorey (the designer's request).

const BANDICOOT_NOTE = "Location generalised to 10 km for public release (project species restriction).";

export interface CommonFields {
  code: string;
  name: string;
  description: string;
  comment: string;
  startDate: string;
  endDate: string;
  duration: string;
  dateAccuracy: string;
  observers: string[];
  lat: number;
  lon: number;
  locationMethod?: string;
  reliability?: string;
  locationComment: string;
}

function temporalSection(o: Pick<CommonFields, "startDate" | "endDate" | "duration" | "dateAccuracy">): MetaSection {
  return {
    id: "temporal",
    title: "Temporal details",
    rows: [
      { label: "Start date", term: "eventDate", value: formatDate(o.startDate) },
      { label: "End date", value: o.endDate, type: "date" },
      { label: "Duration", term: "samplingEffort", value: o.duration, type: "duration" },
      { label: "Date accuracy", value: o.dateAccuracy, type: "vocab" },
    ],
  };
}

function recordLocation(o: Pick<CommonFields, "lat" | "lon" | "locationMethod" | "reliability" | "locationComment">): MetaSection {
  const ibra = ibraFor(o.lat, o.lon);
  return {
    id: "location",
    title: "Location information",
    withMap: true,
    rows: [
      { label: "IBRA region", value: ibra.region, type: "derived" },
      { label: "IBRA subregion", value: ibra.subregion, type: "derived" },
      { label: "Location method", term: "georeferenceProtocol", value: o.locationMethod ?? "GPS", type: "vocab" },
      { label: "Datum", term: "geodeticDatum", value: "GDA2020", type: "vocab" },
      { label: "Reliability", term: "coordinateUncertaintyInMeters", value: o.reliability ?? "1", type: "vocab" },
      { label: "Location comment", term: "locationRemarks", value: o.locationComment, type: "textarea" },
    ],
  };
}

export interface OccurrenceFields extends CommonFields {
  type: SurveyOccurrenceType;
  legacy: string;
  seq: string;
  taxonomicType: string;
  /** NSX code (field-schema.ts NSX_SPECIES). */
  nsx: string;
  status: string;
  voucher?: {
    type: string;
    number: string;
    images: string[];
    institution: string;
    rego: string;
    determinationDate: string;
    determinationAccuracy: string;
    determiners: string[];
    transferDate: string;
  };
}

const list = (items: string[]) => (items.length ? items.join(" | ") : NP);
const json = (items: unknown[]) => (items.length ? JSON.stringify(items) : NP);

export function occurrenceSections(o: OccurrenceFields): MetaSection[] {
  const v = o.voucher;
  return [
    {
      id: "details",
      title: "Occurrence details",
      rows: [
        { label: "Occurrence ID", term: "occurrenceID", value: o.code, type: "system" },
        { label: "Legacy sighting #", value: o.legacy, type: "system" },
        { label: "Species seq no.", value: o.seq, type: "system" },
        { label: "Occurrence name", value: o.name, type: "text" },
        { label: "Description", value: o.description, type: "text" },
        { label: "Taxonomic type", value: o.taxonomicType, type: "select" },
        { label: "NSX code & species", term: "scientificName", value: o.nsx, type: "species" },
        { label: "Occurrence status", term: "occurrenceStatus", value: o.status, type: "select" },
        { label: "Occurrence comment", term: "occurrenceRemarks", value: o.comment, type: "textarea" },
      ],
    },
    temporalSection(o),
    observersSection(o.observers),
    ...(o.type === "Individual"
      ? [
          {
            id: "voucher",
            title: "Voucher",
            rows: [
              { label: "Voucher type", value: v?.type ?? NP, type: "select" as const },
              { label: "Voucher number", term: "catalogNumber", value: v?.number ?? NP, type: "voucher" as const },
              { label: "Voucher images", value: json(v?.images ?? []), type: "images" as const },
              { label: "Institution name", term: "institutionCode", value: v?.institution ?? NP, type: "select" as const },
              { label: "Institution rego #", value: v?.rego ?? NP, type: "select" as const },
              { label: "Determination date", term: "dateIdentified", value: v?.determinationDate ?? NP, type: "date" as const },
              { label: "Determination date accuracy", value: v?.determinationAccuracy ?? NP, type: "vocab" as const },
              { label: "Determiners", term: "identifiedBy", value: list(v?.determiners ?? []), type: "people" as const },
              { label: "Transfer date", value: v?.transferDate ?? NP, type: "date" as const },
            ],
          },
        ]
      : []),
    recordLocation(o),
    { ...CUSTOM },
  ];
}

export interface ObservationFields extends CommonFields {
  type: SurveyObservationType;
  /** Species section values by label (Individual and Population); anything left out is "Not provided". */
  species?: Record<string, string>;
  measurements?: { type: string; value: string; unit: string }[];
  /** Non-biotic and Community: extra detail rows by label. */
  details?: Record<string, string>;
  land?: Record<string, string>;
  landscape?: LandscapeInputs & { landformFeatures?: string; wetlandFeature?: string };
  environment?: { max?: string; min?: string };
  overstorey?: OverstoreyData;
  treeHealth?: Record<string, string>;
}

const rowsOf = (labels: (string | [string, FieldType])[], values: Record<string, string> = {}): MetaRow[] =>
  labels.map((l) => {
    const [label, type] = Array.isArray(l) ? l : [l, undefined];
    return { label, value: values[label] ?? NP, ...(type ? { type } : {}) };
  });

const SPECIES_SHARED = ["Line", "Life form & desc", "Collection method & desc", "Strata & desc", "Macro habitat & desc", "Micro habitat & desc"];

export function observationSections(o: ObservationFields): MetaSection[] {
  const head: MetaRow[] = [
    { label: "Observation ID", term: "measurementID", value: o.code, type: "system" },
    { label: "Observation name", value: o.name, type: "text" },
    { label: "Description", value: o.description, type: "text" },
  ];
  const comment: MetaRow = { label: "Observation comment", term: "measurementRemarks", value: o.comment, type: "textarea" };
  const tail = [observersSection(o.observers), temporalSection(o), recordLocation(o), { ...CUSTOM }];
  const landscape = (factors: FactorId[], extra: (string | [string, FieldType])[]): MetaSection => ({
    id: "landscape",
    title: "Landscape context scores",
    landscape: { factors, inputs: { cover: o.landscape?.cover, perimeter: o.landscape?.perimeter, protectedPct: o.landscape?.protectedPct, riparian: o.landscape?.riparian, swamp: o.landscape?.swamp } },
    rows: rowsOf(extra, { "Number of landform features within block": o.landscape?.landformFeatures ?? NP, "Does the block contain a wetland feature?": o.landscape?.wetlandFeature ?? NP }),
  });

  const treeHealth: MetaSection = {
      id: "treeHealth",
      title: "Tree health",
      rows: rowsOf(
        [
          "Crown extent",
          ["Crown extent score", "score"],
          "Crown density",
          ["Crown density score", "score"],
          "Extent of reproduction",
          "Extent bark cracking",
          "DBH",
          "Leaf die off",
          "New tip growth",
          "Epicormic growth",
          "Mistletoe load",
          "Leaf damage",
        ],
        o.treeHealth,
      ),
    };

  if (o.type === "Individual") {
    return [
      { id: "details", title: "Observation details", rows: [...head, comment] },
      {
        id: "species",
        title: "Species",
        measurements: (o.measurements ?? []).map((m) => ({ ...m, method: "" })),
        rows: rowsOf(
          [
            ...SPECIES_SHARED,
            "Activity",
            "Association dominance",
            "Sex",
            ["Regeneration", "yesno"],
            ["Measurements", "measurements"],
            ["Gravid?", "yesno"],
            "Teats",
            "Vagina",
            "Pouch status",
            "No. in pouch",
            "Testes",
            "Animal life stage",
            "Plant life stage",
            ["Planted/Released", "yesno"],
          ],
          o.species,
        ),
      },
      treeHealth,
      ...tail,
    ];
  }
  if (o.type === "Population") {
    return [
      { id: "details", title: "Observation details", rows: [...head, comment] },
      {
        id: "species",
        title: "Species",
        rows: rowsOf(
          [
            ["Number observed", "number"],
            "Line",
            ["Is annual herb?", "yesno"],
            ...SPECIES_SHARED.slice(1),
            "Cover/abundance & desc",
            "Activity",
            "Association dominance",
            "Animal life stage",
            "Plant life stage",
            ["Planted/Released", "yesno"],
          ],
          o.species,
        ),
      },
      tail[0],
      tail[1],
      tail[2],
      tail[3],
    ];
  }
  if (o.type === "Non-biotic") {
    return [
      {
        id: "details",
        title: "Observation details",
        rows: [
          ...head,
          ...rowsOf([["Fire scars", "yesno"], "Bare earth estimate", "Litter estimate", "Climatic condition"], o.details),
          { label: "Disturbance impact", table: "Disturbance impact (Muir)", value: o.details?.["Disturbance impact"] ?? NP },
          comment,
        ],
      },
      {
        id: "land",
        title: "Land and surfaces",
        rows: rowsOf(
          [
            "Site slope",
            "Site aspect",
            "Land form pattern",
            "Land form element",
            "Geological surface",
            "Outcrop cover",
            "Outcrop lithology",
            "Surface strew size",
            "Surface strew cover",
            "Surface strew lithology",
            "Soil texture class",
            ["Landform comment", "textarea"],
          ],
          o.land,
        ),
      },
      landscape(FACTORS_FOR["Non-biotic"], [["Number of landform features within block", "number"]]),
      {
        id: "environment",
        title: "Environmental conditions",
        rows: [
          { label: "Air temperature (max)", value: o.environment?.max ?? NP },
          { label: "Air temperature (min)", value: o.environment?.min ?? NP },
        ],
      },
      ...tail,
    ];
  }
  // Community
  return [
    {
      id: "details",
      title: "Observation details",
      rows: [
        ...head,
        ...rowsOf(["Vegetation conditions", "SA structural formation", "Disturbance impact", "Assemblage information", "Upper stratum (code & desc)", ["Ephemerals present?", "yesno"]], o.details),
        comment,
      ],
    },
    landscape(FACTORS_FOR.Community, [
      ["Number of landform features within block", "number"],
      ["Does the block contain a wetland feature?", "yesno"],
    ]),
    { id: "overstorey", title: "Overstorey measurements", overstorey: o.overstorey ?? { canopyType: NP, foliageCover: NP, readings: [] } },
    ...tail,
  ];
}

const speciesByNsx = (nsx: string) => NSX_SPECIES.find((x) => x.nsx === nsx);

function occurrence(o: Omit<OccurrenceFields, "code" | "name" | "description" | "startDate" | "endDate" | "duration" | "dateAccuracy" | "locationComment"> & {
  id: string;
  code: string;
  parentId: string;
  date: string;
  common: string;
  summary: string;
  description?: string;
  locationComment?: string;
  locationNote?: string;
}): SurveyRecord {
  const sp = speciesByNsx(o.nsx);
  return {
    id: o.id,
    code: o.code,
    kind: "occurrence",
    type: o.type,
    name: o.common,
    scientificName: sp?.scientific,
    parentId: o.parentId,
    date: o.date,
    lat: o.lat,
    lon: o.lon,
    summary: o.summary,
    locationNote: o.locationNote,
    location: o.locationNote ? undefined : { method: "coordinates", boundary: { id: `pt-${o.id}`, kind: "circle", center: [o.lat, o.lon], radiusKm: 0.01 } },
    sections: occurrenceSections({
      ...o,
      name: o.common,
      description: o.description ?? NP,
      startDate: o.date,
      endDate: NP,
      duration: NP,
      dateAccuracy: "D",
      locationMethod: o.locationNote ? "GEN" : "GPS",
      reliability: o.locationNote ? "4" : "1",
      locationComment: o.locationComment ?? o.locationNote ?? NP,
    }),
  };
}

function observation(o: Omit<ObservationFields, "startDate" | "endDate" | "duration" | "dateAccuracy" | "locationComment" | "description"> & {
  id: string;
  parentId: string;
  date: string;
  summary: string;
  scientific?: string;
  description?: string;
  locationNote?: string;
  /** The block's extent, for a Community or Non-biotic observation (its area feeds the block shape score). */
  radiusKm?: number;
}): SurveyRecord {
  return {
    id: o.id,
    code: o.code,
    kind: "observation",
    type: o.type,
    name: o.name,
    scientificName: o.scientific,
    parentId: o.parentId,
    date: o.date,
    lat: o.lat,
    lon: o.lon,
    summary: o.summary,
    locationNote: o.locationNote,
    location: o.locationNote ? undefined : { method: o.radiusKm ? "map" : "coordinates", boundary: { id: `pt-${o.id}`, kind: "circle", center: [o.lat, o.lon], radiusKm: o.radiusKm ?? 0.01 } },
    sections: observationSections({
      ...o,
      description: o.description ?? NP,
      startDate: o.date,
      endDate: NP,
      duration: NP,
      dateAccuracy: "D",
      locationMethod: o.locationNote ? "GEN" : "GPS",
      reliability: o.locationNote ? "4" : "1",
      locationComment: o.locationNote ?? NP,
    }),
  };
}

// ── The dataset ──

const S1 = { lat: -35.03, lon: 138.72 };
const S2 = { lat: -35.0, lon: 138.68 };

const events: SurveyRecord[] = [
  site({
    id: "su1",
    code: "SU00501",
    legacy: "Site - 5034",
    name: "Cleland Stringybark Woodland",
    date: "2025-11-02",
    ...S1,
    description: "Messmate stringybark open woodland on a north-facing ridge, burnt in autumn 2024.",
    radiusKm: 0.5,
    grouping: "Fire-recovery monitoring",
    property: "Cleland National Park, Waterfall Gully fire-track block",
    altitude: "412",
    mudMap: "Yes",
    paddock: "Ridge block 3",
    comment: "Access via the Waterfall Gully fire track; gate key held by Cleland ranger station.",
    dimensions: "100 × 100 m",
    locationComment: "Centre of the plot is the star picket at the fire-track bend.",
    photopoint: { present: "Yes", disc: "192", direction: "45" },
  }),
  site({
    id: "su2",
    code: "SU00502",
    legacy: "Site - 5035",
    name: "Mylor Creek Riparian Corridor",
    date: "2025-11-02",
    ...S2,
    description: "River red gum and tea-tree riparian strip along a permanent creekline.",
    radiusKm: 0.4,
    grouping: "Riparian condition",
    property: "Mylor Conservation Park, creekline reserve",
    altitude: "318",
    mudMap: "No",
    paddock: "Not provided",
    comment: "Creek crossing can flood after heavy rain; use the eastern bank track.",
    dimensions: "200 × 50 m",
    locationComment: "Plot runs along the eastern bank from the ford.",
    photopoint: { present: "Yes", disc: "193", direction: "180" },
  }),
  event({ id: "vu1", type: "Visit", parentId: "su1", ...S1, description: "First spring round after the 2024 burn.", sourceId: "AHL-2025-SPR", comment: "Clear, light north-easterly, 14 to 22 °C.", seq: "1/1", startDate: "2025-10-14", endDate: "2025-10-15", duration: "1d 0h 30m", dateAccuracy: "D", observers: ["Olivia Wyatt", "Maya Dewitt", "Phoenix Baker"], dimensions: NP, locationComment: NP, photopoint: { present: "Yes", disc: "192", direction: "45" } }),
  event({ id: "vu2", type: "Visit", parentId: "su2", ...S2, description: "Autumn round after the first winter rains.", sourceId: "AHL-2026-AUT", comment: "Overcast after rain, still, 11 to 17 °C.", seq: "1/1", startDate: "2026-03-18", endDate: "2026-03-18", duration: "0d 6h 30m", dateAccuracy: "D", observers: ["Olivia Wyatt", "Lana Steiner"], dimensions: NP, locationComment: NP, photopoint: NO_PHOTOPOINT }),
  event({ id: "tr1", type: "Transect", parentId: "su1", lat: -35.029, lon: 138.719, description: "Fixed-width bird transect (2 ha / 20 min) along the fire break.", sourceId: "AHL-TR-01", comment: "Walked south to north along the fire break.", startDate: "2025-10-14", endDate: "2025-10-14", duration: "0d 0h 40m", dateAccuracy: "D", observers: ["Maya Dewitt", "Phoenix Baker"], dimensions: "200 × 100 m", locationComment: "Start at the northern gate, end at the dam.", photopoint: NO_PHOTOPOINT }),
  event({ id: "qr1", type: "Quadrat", parentId: "su1", lat: -35.031, lon: 138.721, description: "Vegetation quadrat, BDBSA standard.", sourceId: "AHL-QR-01", comment: "Permanent star pickets at all four corners.", startDate: "2025-10-14", endDate: "2025-10-14", duration: "0d 2h 30m", dateAccuracy: "D", observers: ["Olivia Wyatt", "Maya Dewitt"], dimensions: "20 × 20 m", locationComment: "South-west corner picket is the origin.", photopoint: { present: "Yes", disc: "194", direction: "0" } }),
  event({
    id: "trp1",
    type: "Trap",
    parentId: "su1",
    lat: -35.032,
    lon: 138.723,
    description: "Pitfall and Elliott trapping along a 60 m drift fence.",
    sourceId: "AHL-TRP-A",
    comment: "Traps baited with peanut butter and oats; checked each morning for four nights.",
    startDate: "2025-10-14",
    endDate: "2025-10-18",
    duration: "4d 0h 0m",
    dateAccuracy: "D",
    observers: [],
    dimensions: "60 × 2 m",
    locationComment: "Drift fence runs east to west from the fire-track bend.",
    photopoint: NO_PHOTOPOINT,
    trapEffort: [
      { trapType: "Elliott", values: { count: { value: "20" } }, durations: [{ value: "4", unit: "nights" }], specs: [{ field: "length", value: "30" }] },
      { trapType: "Pitfall", values: { count: { value: "6" } }, durations: [{ value: "4", unit: "nights" }], specs: [] },
    ],
  }),
  event({ id: "bk1", type: "Block", parentId: "su2", lat: -35.001, lon: 138.681, description: "Timed area search of the creekline.", sourceId: "AHL-BK-01", comment: "Logs, rocks and leaf litter turned and replaced.", startDate: "2026-03-18", endDate: "2026-03-18", duration: "0d 1h 0m", dateAccuracy: "D", observers: ["Olivia Wyatt", "Lana Steiner"], dimensions: "100 × 100 m", locationComment: NP, photopoint: NO_PHOTOPOINT }),
  event({ id: "rmb1", type: "Ramble", parentId: "su2", lat: -34.998, lon: 138.679, description: "Opportunistic search along about 800 m of creek bank.", sourceId: NP, comment: "Unstructured search while walking back to the vehicle.", startDate: "2026-03-18", endDate: "2026-03-18", duration: "0d 0h 45m", dateAccuracy: "D", observers: ["Lana Steiner"], dimensions: NP, locationComment: NP, photopoint: NO_PHOTOPOINT }),
  event({ id: "cu1", type: "Custom event", parentId: "su2", lat: -35.002, lon: 138.683, description: "Spotlighting on foot with two 50 W lights over a 1.2 km route.", sourceId: "AHL-SPOT-01", comment: "Moon one-quarter, no wind. Route repeated in both directions.", eventArray: "Nocturnal fauna", startDate: "2026-03-18", endDate: "2026-03-18", duration: "0d 2h 0m", dateAccuracy: "D", observers: ["Olivia Wyatt", "Lana Steiner"], dimensions: NP, locationComment: NP, photopoint: NO_PHOTOPOINT }),
];

const occurrences: SurveyRecord[] = [
  occurrence({ id: "oc1", code: "OC00501", type: "Population", parentId: "tr1", common: "Superb Fairywren", nsx: "M03050", taxonomicType: "Fauna", status: "Present", legacy: "Sighting - 88213", seq: "1", date: "2025-10-14", lat: -35.029, lon: 138.719, observers: ["Maya Dewitt"], comment: "Family group foraging in the regrowth along the fire break.", summary: "6 birds" }),
  occurrence({ id: "oc2", code: "OC00502", type: "Population", parentId: "qr1", common: "South Australian Blue Gum", nsx: "P01937", taxonomicType: "Flora", status: "Present", legacy: "Sighting - 88214", seq: "1", date: "2025-10-14", lat: -35.031, lon: 138.721, observers: ["Olivia Wyatt"], comment: "All stems resprouting from the base after the burn.", summary: "14 stems" }),
  occurrence({ id: "oc3", code: "OC00503", type: "Population", parentId: "qr1", common: "Yacca", nsx: "P04411", taxonomicType: "Flora", status: "Present", legacy: "Sighting - 88215", seq: "2", date: "2025-10-14", lat: -35.031, lon: 138.721, observers: ["Maya Dewitt", "Olivia Wyatt"], comment: "Heavy post-fire flowering.", summary: "Cover 10 to 20%" }),
  occurrence({
    id: "oc4",
    code: "OC00504",
    type: "Individual",
    parentId: "trp1",
    common: "Southern Brown Bandicoot",
    nsx: "M01170",
    taxonomicType: "Fauna",
    status: "Present",
    legacy: "Sighting - 88216",
    seq: "1",
    date: "2025-10-15",
    lat: -35.032,
    lon: 138.723,
    observers: ["Phoenix Baker"],
    comment: "Captured in Elliott trap 7, released at the point of capture.",
    summary: "Female, adult",
    locationNote: BANDICOOT_NOTE,
    voucher: {
      type: "Hair sample",
      number: "24518",
      images: ["Hair sample tube.jpg", "Label close-up.jpg"],
      institution: "South Australian Museum",
      rego: "Mammals",
      determinationDate: "2025-10-20",
      determinationAccuracy: "D",
      determiners: ["Phoenix Baker", "Lana Steiner"],
      transferDate: "2025-10-22",
    },
  }),
  occurrence({ id: "oc5", code: "OC00505", type: "Population", parentId: "bk1", common: "Common Froglet", nsx: "A00215", taxonomicType: "Fauna", status: "Present", legacy: "Sighting - 88217", seq: "1", date: "2026-03-18", lat: -35.001, lon: 138.681, observers: ["Lana Steiner"], comment: "Calling from the flooded margins.", summary: "11 to 20 calling males" }),
  occurrence({ id: "oc6", code: "OC00506", type: "Individual", parentId: "rmb1", common: "Short-beaked Echidna", nsx: "M01002", taxonomicType: "Fauna", status: "Present", legacy: "Sighting - 88218", seq: "1", date: "2026-03-18", lat: -34.998, lon: 138.679, observers: ["Lana Steiner"], comment: "Digging at a termite mound on the creek bank.", summary: "Adult, digging" }),
  occurrence({ id: "oc7", code: "OC00507", type: "Individual", parentId: "cu1", common: "Common Brushtail Possum", nsx: "M01130", taxonomicType: "Fauna", status: "Present", legacy: "Sighting - 88219", seq: "1", date: "2026-03-18", lat: -35.002, lon: 138.683, observers: ["Olivia Wyatt"], comment: "Feeding in a blue gum canopy.", summary: "Male, 8 m up a blue gum" }),
  occurrence({ id: "oc8", code: "OC00508", type: "Individual", parentId: "qr1", common: "South Australian Blue Gum", nsx: "P01937", taxonomicType: "Flora", status: "Present", legacy: "Sighting - 88220", seq: "3", date: "2025-10-14", lat: -35.031, lon: 138.721, observers: ["Olivia Wyatt"], comment: "Tagged tree 7 at the quadrat's north-east corner, monitored for fire recovery.", summary: "Tree 7 · 340 mm DBH" }),
];

const observations: SurveyRecord[] = [
  observation({ id: "ob1", code: "OB00501", type: "Population", parentId: "oc1", name: "Fairywren group composition", scientific: "Malurus cyaneus", date: "2025-10-14", lat: -35.029, lon: 138.719, observers: ["Maya Dewitt"], comment: "One male in breeding plumage.", summary: "6 birds · 1 breeding male", species: { "Number observed": "6", Line: "1", "Is annual herb?": "No", "Collection method & desc": "OBS", "Strata & desc": "M", "Macro habitat & desc": "WD", "Micro habitat & desc": "LL", Activity: "Foraging", "Animal life stage": "Juvenile | Adult", "Planted/Released": "No" } }),
  observation({ id: "ob2", code: "OB00502", type: "Population", parentId: "oc2", name: "Blue gum stand structure", scientific: "Eucalyptus leucoxylon", date: "2025-10-14", lat: -35.031, lon: 138.721, observers: ["Olivia Wyatt"], comment: "Epicormic resprouting on most stems.", summary: "14 stems · cover class 3", species: { "Number observed": "14", Line: "1", "Is annual herb?": "No", "Life form & desc": "T", "Collection method & desc": "OBS", "Strata & desc": "U", "Macro habitat & desc": "WD", "Cover/abundance & desc": "3", "Association dominance": "Co-dominant", "Plant life stage": "Mature | Flowering", "Planted/Released": "No" } }),
  observation({ id: "ob3", code: "OB00503", type: "Population", parentId: "oc3", name: "Yacca cover and flowering", scientific: "Xanthorrhoea semiplana", date: "2025-10-14", lat: -35.031, lon: 138.721, observers: ["Maya Dewitt"], comment: "Nine flowering spikes in the quadrat.", summary: "Cover class 3 · flowering", species: { "Number observed": "32", Line: "1", "Is annual herb?": "No", "Life form & desc": "S", "Collection method & desc": "OBS", "Strata & desc": "G", "Macro habitat & desc": "WD", "Cover/abundance & desc": "3", "Association dominance": "Associated", "Plant life stage": "Flowering", "Planted/Released": "No" } }),
  observation({
    id: "ob4",
    code: "OB00504",
    type: "Community",
    parentId: "qr1",
    name: "Stringybark woodland community",
    radiusKm: 0.25,
    date: "2025-10-14",
    lat: -35.031,
    lon: 138.721,
    observers: ["Olivia Wyatt", "Maya Dewitt"],
    comment: "Canopy recovering well; mid-storey still sparse after the burn.",
    summary: "Open woodland · good condition",
    details: {
      "Vegetation conditions": "Good",
      "SA structural formation": "Open woodland",
      "Disturbance impact": JSON.stringify([["FI", "Recent"], ["WE", "Active"]]),
      "Assemblage information": JSON.stringify([["LA", "c"]]),
      "Upper stratum (code & desc)": JSON.stringify([["EOB"], ["ELE"]]),
      "Ephemerals present?": "Yes",
    },
    landscape: { cover: "18", perimeter: "300", protectedPct: "8", riparian: "No", swamp: "No", landformFeatures: "2", wetlandFeature: "No" },
    overstorey: {
      canopyType: "Tree",
      foliageCover: "32",
      readings: [
        { height: "18", crownDepth: "7", canopyDiameter: "9", gaps: "4", valueType: "Measured" },
        { height: "16", crownDepth: "6", canopyDiameter: "8", gaps: "5", valueType: "Measured" },
        { height: "21", crownDepth: "9", canopyDiameter: "11", gaps: "3", valueType: "Estimated" },
      ],
    },
  }),
  observation({
    id: "ob5",
    code: "OB00505",
    type: "Non-biotic",
    parentId: "qr1",
    name: "Soil and ground cover",
    radiusKm: 0.25,
    date: "2025-10-14",
    lat: -35.031,
    lon: 138.721,
    observers: ["Maya Dewitt"],
    comment: "Point intercept, 100 points.",
    summary: "Litter 64% · bare earth 9%",
    details: { "Fire scars": "Yes", "Bare earth estimate": "9", "Litter estimate": "64", "Climatic condition": "Average", "Disturbance impact": JSON.stringify([["SB", "i"]]) },
    land: {
      "Site slope": "8",
      "Site aspect": "15",
      "Land form pattern": "Hills",
      "Land form element": "Upper slope",
      "Geological surface": "Consolidated",
      "Outcrop cover": "2 to 10%",
      "Outcrop lithology": "Quartzite",
      "Surface strew size": "Medium gravel",
      "Surface strew cover": "Less than 2%",
      "Surface strew lithology": "Quartzite",
      "Soil texture class": "Sandy loam",
      "Landform comment": "Shallow stony soil on the ridge crest.",
    },
    landscape: { cover: "18", perimeter: "300", landformFeatures: "2" },
    environment: { max: "22 °C", min: "14 °C" },
  }),
  observation({
    id: "ob6",
    code: "OB00506",
    type: "Individual",
    parentId: "oc4",
    name: "Bandicoot capture measurements",
    scientific: "Isoodon obesulus",
    date: "2025-10-15",
    lat: -35.032,
    lon: 138.723,
    observers: ["Phoenix Baker"],
    comment: "Handled for under five minutes, released at the trap.",
    summary: "Female · 780 g · pouch young",
    locationNote: BANDICOOT_NOTE,
    species: { Line: "1", "Life form & desc": "V", "Collection method & desc": "CAP", "Strata & desc": "G", "Macro habitat & desc": "WD", "Micro habitat & desc": "LL", Activity: "Resting", Sex: "F", Regeneration: "No", "Gravid?": "No", Teats: "Lactating", Vagina: "Perforate", "Pouch status": "Pouch young", "No. in pouch": "2 young", "Animal life stage": "Adult", "Planted/Released": "No" },
    measurements: [
      { type: "Body mass", value: "780", unit: "g" },
      { type: "Head-body length", value: "312", unit: "mm" },
      { type: "Pes length", value: "58", unit: "mm" },
    ],
  }),
  observation({ id: "ob7", code: "OB00507", type: "Population", parentId: "oc5", name: "Froglet chorus count", scientific: "Crinia signifera", date: "2026-03-18", lat: -35.001, lon: 138.681, observers: ["Lana Steiner"], comment: "Five-minute call count; water 13.5 °C.", summary: "Chorus class 2 (11 to 20 males)", species: { "Number observed": "15", Line: "1", "Is annual herb?": "No", "Life form & desc": "V", "Collection method & desc": "HRD", "Strata & desc": "G", "Macro habitat & desc": "RP", Activity: "Calling", "Animal life stage": "Adult", "Planted/Released": "No" } }),
  observation({ id: "ob8", code: "OB00508", type: "Individual", parentId: "oc6", name: "Echidna sighting", scientific: "Tachyglossus aculeatus", date: "2026-03-18", lat: -34.998, lon: 138.679, observers: ["Lana Steiner"], comment: "Not handled.", summary: "Adult · digging", species: { Line: "1", "Life form & desc": "V", "Collection method & desc": "OBS", "Strata & desc": "G", "Macro habitat & desc": "RP", "Micro habitat & desc": "LG", Activity: "Digging", Sex: "U", "Animal life stage": "Adult", "Planted/Released": "No" }, measurements: [{ type: "Distance from observer", value: "6", unit: "m" }] }),
  observation({ id: "ob9", code: "OB00509", type: "Individual", parentId: "oc7", name: "Possum spotlight sighting", scientific: "Trichosurus vulpecula", date: "2026-03-18", lat: -35.002, lon: 138.683, observers: ["Olivia Wyatt"], comment: "Spotlighting from the track.", summary: "Male · 8 m up a blue gum", species: { Line: "1", "Life form & desc": "V", "Collection method & desc": "OBS", "Strata & desc": "U", "Macro habitat & desc": "RP", "Micro habitat & desc": "CA", Activity: "Foraging", Sex: "M", "Animal life stage": "Adult", "Planted/Released": "No" }, measurements: [
    { type: "Height in tree", value: "8", unit: "m" },
    { type: "Eyeshine distance", value: "25", unit: "m" },
  ] }),
  observation({
    id: "ob10",
    code: "OB00510",
    type: "Individual",
    parentId: "oc8",
    name: "Blue gum tree 7 health check",
    scientific: "Eucalyptus leucoxylon",
    date: "2025-10-14",
    lat: -35.031,
    lon: 138.721,
    observers: ["Olivia Wyatt"],
    comment: "Canopy recovering after the 2024 burn; heavy epicormic regrowth on the trunk.",
    summary: "Crown extent 62% · DBH 340 mm",
    species: { Line: "1", "Life form & desc": "T", "Collection method & desc": "OBS", "Strata & desc": "U", "Macro habitat & desc": "WD", "Association dominance": "Co-dominant", Regeneration: "Yes", "Plant life stage": "Mature | Flowering", "Planted/Released": "No" },
    treeHealth: {
      "Crown extent": "62",
      "Crown density": "45",
      "Extent of reproduction": "Common",
      "Extent bark cracking": "Minor",
      DBH: "340",
      "Leaf die off": "Minor",
      "New tip growth": "Common",
      "Epicormic growth": "Abundant",
      "Mistletoe load": "None",
      "Leaf damage": "Minor",
    },
  }),
];

export const SURVEY_RECORDS: SurveyRecord[] = [...events, ...occurrences, ...observations];

const byId = new Map(SURVEY_RECORDS.map((r) => [r.id, r]));

export function recordById(id: string | null | undefined): SurveyRecord | undefined {
  return id ? byId.get(id) : undefined;
}

export function childrenOf(parentId: string | null): SurveyRecord[] {
  return SURVEY_RECORDS.filter((r) => r.parentId === parentId);
}

export function ancestorsOf(record: SurveyRecord): SurveyRecord[] {
  const chain: SurveyRecord[] = [];
  let current = recordById(record.parentId);
  while (current) {
    chain.unshift(current);
    current = recordById(current.parentId);
  }
  return chain;
}

// ── Artefacts attached to records (the shared lightbox's own shape) ──


const LICENCE = "https://creativecommons.org/licenses/by/4.0/";
const ID_URL = "https://data.environment.sa.gov.au";

function artefact(a: Omit<Artefact, "licenseUrl" | "identifierUrl" | "publisher" | "rightsHolder"> & { recordId: string }): Artefact & { recordId: string } {
  return { ...a, licenseUrl: LICENCE, identifierUrl: `${ID_URL}/bdbsa/${a.bioDataId}`, publisher: "Adelaide Hills Landcare", rightsHolder: "Adelaide Hills Landcare" };
}

export const SURVEY_ARTEFACTS: (Artefact & { recordId: string })[] = [
  artefact({ id: "a1", recordId: "su1", title: "Photopoint PP-0192, Oct 2025", type: "image", size: "4.2 MB", recordLabel: "Site SU00501", metaTitle: "Cleland Stringybark Woodland photopoint PP-0192, spring 2025", created: "14 Oct 2025", creator: "Olivia Wyatt", objectId: "AHL:SU00501:PP0192", description: "North-east view from the photopoint disc, 18 months after the autumn 2024 burn.", format: "image/jpeg", dcType: "StillImage", bioDataId: "BD5039-A001" }),
  artefact({ id: "a2", recordId: "trp1", title: "Trap line A layout.pdf", type: "pdf", size: "860 KB", recordLabel: "Trap TRP00501", metaTitle: "Pitfall and Elliott trap line A, layout and trap numbers", created: "13 Oct 2025", creator: "Phoenix Baker", objectId: "AHL:TRP00501:LAYOUT", description: "Trap positions, drift fence alignment and bait schedule.", format: "application/pdf", dcType: "Text", bioDataId: "BD5039-A002" }),
  artefact({ id: "a3", recordId: "ob6", title: "Bandicoot capture sheet.xlsx", type: "spreadsheet", size: "38 KB", recordLabel: "Observation OB00506", metaTitle: "Southern Brown Bandicoot capture measurements, trap line A", created: "15 Oct 2025", creator: "Phoenix Baker", objectId: "AHL:OB00506:SHEET", description: "Raw capture data sheet, including morphometrics and pouch check.", format: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dcType: "Dataset", bioDataId: "BD5039-A003" }),
  artefact({ id: "a4", recordId: "ob7", title: "Froglet chorus recording", type: "video", size: "22 MB", recordLabel: "Observation OB00507", metaTitle: "Common Froglet chorus, Mylor Creek, March 2026", created: "18 Mar 2026", creator: "Lana Steiner", objectId: "AHL:OB00507:AUDIO", description: "Five-minute call count recording used for the chorus class.", format: "video/mp4", dcType: "MovingImage", bioDataId: "BD5039-A004" }),
];

export function artefactsFor(recordId: string) {
  return SURVEY_ARTEFACTS.filter((a) => a.recordId === recordId);
}

// ── Helpers ──

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

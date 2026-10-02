// The Events, Occurrences and Observations Report: the three wireframe screens (Figma YMproGZfrFB5jUqPHPxMhk frames
// 1583:31626, 1583:31821, 1583:32016; columns lists 1594:67593, 1594:69255, 1594:69686) differ only in their table,
// so they are one report with three tabs, each with its own rows, columns and filters.
//
// A row is read from the project page's own records (report-records.ts) by the field labels the record page uses,
// so the report and the record page cannot disagree. Events are the project's Sites, Visits, Transects, Quadrats,
// Blocks, Rambles, Traps and Custom events; occurrences are its species occurrences; observations are the
// observations made for those and the Non-biotic and Community observations taken at an event.
//
// The app holds no creation or update history for a record (who created it, when, where it came from), so those
// columns are empty, and the wireframe's "Creation date" filter is not offered: a filter on a date the data does
// not have cannot filter anything (CONTRACTS 4.2d).

import { fieldOf, firstField, groupOfRecord, indexOf, measurementOf, nsxOf, peopleOf, recordLabel, recordsOfKind, type ReportProject, type SeedIndex } from "@/app/pages/_shared/reports/report-records";
import { searchEvents } from "@/app/pages/_shared/map-search/search-data";
import { INSTITUTION_PREFIX } from "@/app/pages/project-detail/field-options";
import type { SurveyRecord } from "@/app/pages/project-detail/survey-data";

export type RecordTab = "events" | "occurrences" | "observations";

export interface EventRow {
  id: string;
  projectId: string;
  project: string;
  code: string;
  name: string;
  type: string;
  status: string;
  occurrences: number;
  observations: number;
  siteDescription: string;
  observers: string[];
  sourceId: string;
  siteGrouping: string;
  location: string;
  property: string;
  altitude: string;
  areaSize: string;
  ibraRegion: string;
  ibraSubregion: string;
  paddock: string;
  sourceEvent: string;
}

export interface OccurrenceRow {
  id: string;
  projectId: string;
  project: string;
  parent: string;
  code: string;
  name: string;
  type: string;
  status: string;
  observations: number;
  description: string;
  observers: string[];
  species: string;
  group: string;
  legacy: string;
  released: string;
  voucherSeries: string;
  voucherNumber: string;
  voucherImages: string;
  institution: string;
  rego: string;
  determiner1: string;
  determiner2: string;
  determinationDate: string;
  transferDate: string;
  determinationAccuracy: string;
  sourceEvent: string;
}

export interface ObservationRow {
  id: string;
  projectId: string;
  project: string;
  linked: string;
  code: string;
  name: string;
  type: string;
  description: string;
  observers: string[];
  group: string;
  cover: string;
  line: string;
  activity: string;
  lifeForm: string;
  collection: string;
  strata: string;
  macroHabitat: string;
  microHabitat: string;
  sex: string;
  weight: string;
  length: string;
  snoutVent: string;
  gravid: string;
  teats: string;
  vagina: string;
  pouch: string;
  testes: string;
  inPouch: string;
  sourceLinked: string;
  comments: string;
}

const eventStatus = new Map(searchEvents.map((e) => [e.id, e.status]));

/** The observations made at an event: those filed directly under it and those made for its occurrences. */
function observationsAt(event: SurveyRecord, index: SeedIndex): number {
  const children = index.childrenOf.get(event.id) ?? [];
  const direct = children.filter((r) => r.kind === "observation").length;
  const viaOccurrences = children.filter((r) => r.kind === "occurrence").reduce((n, o) => n + (index.childrenOf.get(o.id) ?? []).filter((r) => r.kind === "observation").length, 0);
  return direct + viaOccurrences;
}

const legacyOf = (record: SurveyRecord) => firstField(record, "Legacy site ID", "Legacy visit ID", "Legacy sighting #");

export function eventRowsFor({ project, seed }: ReportProject): EventRow[] {
  const index = indexOf(seed);
  return recordsOfKind(seed, "event").map((event) => {
    const children = index.childrenOf.get(event.id) ?? [];
    return {
      id: `${project.id}:${event.id}`,
      projectId: project.id,
      project: project.name,
      code: event.code,
      name: event.name,
      type: event.type,
      // Explore's events carry a status (Active, Completed); the hand-written Adelaide Hills events do not.
      status: eventStatus.get(event.id) ?? "",
      occurrences: children.filter((r) => r.kind === "occurrence").length,
      observations: observationsAt(event, index),
      siteDescription: event.type === "Site" ? fieldOf(event, "Description") : "",
      observers: peopleOf(fieldOf(event, "Recorded by")),
      sourceId: fieldOf(event, "Source ID"),
      siteGrouping: fieldOf(event, "Site grouping"),
      location: `${event.lat}, ${event.lon}`,
      property: fieldOf(event, "Specific property details"),
      altitude: fieldOf(event, "Altitude"),
      areaSize: fieldOf(event, "Sample site dimensions"),
      ibraRegion: fieldOf(event, "IBRA region"),
      ibraSubregion: fieldOf(event, "IBRA subregion"),
      paddock: fieldOf(event, "Paddock"),
      sourceEvent: legacyOf(event),
    };
  });
}

export function occurrenceRowsFor({ project, seed }: ReportProject): OccurrenceRow[] {
  const index = indexOf(seed);
  return recordsOfKind(seed, "occurrence").map((occurrence) => {
    const children = index.childrenOf.get(occurrence.id) ?? [];
    const observation = children.find((r) => r.kind === "observation");
    const parent = occurrence.parentId ? index.byId.get(occurrence.parentId) : undefined;
    const determiners = peopleOf(fieldOf(occurrence, "Determiners"));
    const nsx = nsxOf(occurrence);
    const institution = fieldOf(occurrence, "Institution name");
    return {
      id: `${project.id}:${occurrence.id}`,
      projectId: project.id,
      project: project.name,
      parent: recordLabel(parent),
      code: occurrence.code,
      name: occurrence.name,
      type: occurrence.type,
      status: fieldOf(occurrence, "Occurrence status"),
      observations: children.filter((r) => r.kind === "observation").length,
      description: fieldOf(occurrence, "Description"),
      observers: peopleOf(fieldOf(occurrence, "Recorded by")),
      species: nsx ? `${nsx} ${occurrence.scientificName ?? ""}`.trim() : (occurrence.scientificName ?? ""),
      group: groupOfRecord(occurrence, index) ?? "",
      legacy: fieldOf(occurrence, "Legacy sighting #"),
      released: observation ? fieldOf(observation, "Planted/Released") : "",
      voucherSeries: INSTITUTION_PREFIX[institution] ?? "",
      voucherNumber: fieldOf(occurrence, "Voucher number").replace(/^[A-Z]+ /, ""),
      voucherImages: fieldOf(occurrence, "Voucher images"),
      institution,
      rego: fieldOf(occurrence, "Institution rego #"),
      determiner1: determiners[0] ?? "",
      determiner2: determiners[1] ?? "",
      determinationDate: fieldOf(occurrence, "Determination date"),
      transferDate: fieldOf(occurrence, "Transfer date"),
      determinationAccuracy: fieldOf(occurrence, "Determination date accuracy"),
      sourceEvent: parent ? legacyOf(parent) : "",
    };
  });
}

export function observationRowsFor({ project, seed }: ReportProject): ObservationRow[] {
  const index = indexOf(seed);
  return recordsOfKind(seed, "observation").map((observation) => {
    const linked = observation.parentId ? index.byId.get(observation.parentId) : undefined;
    return {
      id: `${project.id}:${observation.id}`,
      projectId: project.id,
      project: project.name,
      linked: recordLabel(linked),
      code: observation.code,
      name: observation.name,
      type: observation.type,
      description: fieldOf(observation, "Description"),
      observers: peopleOf(fieldOf(observation, "Recorded by")),
      group: groupOfRecord(observation, index) ?? "",
      cover: fieldOf(observation, "Cover/abundance & desc"),
      line: fieldOf(observation, "Line"),
      activity: fieldOf(observation, "Activity"),
      lifeForm: fieldOf(observation, "Life form & desc"),
      collection: fieldOf(observation, "Collection method & desc"),
      strata: fieldOf(observation, "Strata & desc"),
      macroHabitat: fieldOf(observation, "Macro habitat & desc"),
      microHabitat: fieldOf(observation, "Micro habitat & desc"),
      sex: fieldOf(observation, "Sex"),
      weight: measurementOf(observation, (t) => t === "Body mass", "g"),
      length: measurementOf(observation, (t) => t === "Head-body length", "mm"),
      snoutVent: measurementOf(observation, (t) => /snout/i.test(t), "mm"),
      gravid: fieldOf(observation, "Gravid?"),
      teats: fieldOf(observation, "Teats"),
      vagina: fieldOf(observation, "Vagina"),
      pouch: fieldOf(observation, "Pouch status"),
      testes: fieldOf(observation, "Testes"),
      inPouch: fieldOf(observation, "No. in pouch"),
      sourceLinked: linked ? legacyOf(linked) : "",
      comments: fieldOf(observation, "Observation comment"),
    };
  });
}

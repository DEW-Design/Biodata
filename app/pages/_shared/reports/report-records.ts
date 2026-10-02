// What the Project Detail, Species Detail and Events, Occurrences and Observations reports read: each project's
// records, exactly as its project page has them. Adelaide Hills is the hand-written seed, every other project is
// built from Explore's data (`seedFromExplore`, with the role), so a report and a project page can never disagree
// about a project's name, dates, counts or records. A record the role may not see is left out by `seedFromExplore`
// itself (recordAccess), so nothing here re-decides access.

import { findOccurrence, searchEvents, type SearchEvent, type SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import type { Dataset } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { sampleRuns } from "@/app/pages/_shared/reports/ingestion-report-data";
import { reportProjectsFor } from "@/app/pages/_shared/reports/report-projects";
import { displayValue, EMPTY_VALUES, NSX_SPECIES } from "@/app/pages/project-detail/field-schema";
import { ADELAIDE_HILLS_ID, adelaideHillsSeed, seedFromExplore, type ProjectSeed } from "@/app/pages/project-detail/project-seed";
import type { RecordKind, SurveyRecord } from "@/app/pages/project-detail/survey-data";
import type { UserRole } from "@/lib/user-role";

export interface ReportProject {
  project: SearchEvent;
  /** 1-based place in the platform's project order (Explore's root Project events), the same for every role. */
  seq: number;
  seed: ProjectSeed;
}

const PLATFORM_ORDER = searchEvents.filter((e) => e.type === "Project").map((e) => e.id);
const seeds = new Map<string, ProjectSeed>();

function seedFor(project: SearchEvent, role: UserRole): ProjectSeed {
  if (project.id === ADELAIDE_HILLS_ID) return adelaideHillsSeed;
  const key = `${role}:${project.id}`;
  let seed = seeds.get(key);
  if (!seed) {
    seed = seedFromExplore(project, role);
    seeds.set(key, seed);
  }
  return seed;
}

/** The projects a role can report on, in platform order, each with its page's records. */
export function reportBundlesFor(role: UserRole): ReportProject[] {
  return reportProjectsFor(role).map((project) => ({ project, seq: PLATFORM_ORDER.indexOf(project.id) + 1, seed: seedFor(project, role) }));
}

// ── Counting ──
export function recordsOfKind(seed: ProjectSeed, kind: RecordKind): SurveyRecord[] {
  return seed.records.filter((r) => r.kind === kind);
}

export interface KindCounts {
  events: number;
  occurrences: number;
  observations: number;
}

export function countKinds(seed: ProjectSeed): KindCounts {
  return { events: recordsOfKind(seed, "event").length, occurrences: recordsOfKind(seed, "occurrence").length, observations: recordsOfKind(seed, "observation").length };
}

export function sumCounts(counts: KindCounts[]): KindCounts {
  return counts.reduce((sum, c) => ({ events: sum.events + c.events, occurrences: sum.occurrences + c.occurrences, observations: sum.observations + c.observations }), { events: 0, occurrences: 0, observations: 0 });
}

/** Dataset uploads on a project: the real uploads in the dataset store plus the sample history (`sampleRuns`). */
export function datasetCountsByProject(datasets: Dataset[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of [...datasets.map((d) => d.projectId), ...sampleRuns().map((r) => r.projectId)]) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

// ── Reading a record by its field labels ──
/** A field's value as the record page shows it (code lists with their descriptions), or "" when it has none. */
export function fieldOf(record: SurveyRecord, label: string): string {
  for (const section of record.sections) {
    const rows = section.rows;
    const row = rows?.find((r) => r.label === label);
    if (rows && row) {
      const value = displayValue(row, rows);
      return EMPTY_VALUES.has(value) ? "" : value;
    }
  }
  return "";
}

/** The first of a field's values that is set, for a label that one record type spells two ways. */
export function firstField(record: SurveyRecord, ...labels: string[]): string {
  for (const label of labels) {
    const value = fieldOf(record, label);
    if (value) return value;
  }
  return "";
}

/** A measurement (MeasurementOrFact) taken for the record, by its type and unit. */
export function measurementOf(record: SurveyRecord, test: (type: string) => boolean, unit: string): string {
  for (const section of record.sections) {
    const hit = section.measurements?.find((m) => test(m.type) && m.unit === unit);
    if (hit) return hit.value;
  }
  return "";
}

/** People as a list, from a people field ("Olivia Wyatt, Maya Dewitt"). */
export const peopleOf = (value: string): string[] => value.split(",").map((v) => v.trim()).filter(Boolean);

// ── Relationships inside one project's records ──
export interface SeedIndex {
  byId: Map<string, SurveyRecord>;
  childrenOf: Map<string, SurveyRecord[]>;
}

const indexes = new WeakMap<ProjectSeed, SeedIndex>();
export function indexOf(seed: ProjectSeed): SeedIndex {
  let index = indexes.get(seed);
  if (!index) {
    const childrenOf = new Map<string, SurveyRecord[]>();
    for (const r of seed.records) if (r.parentId) childrenOf.set(r.parentId, [...(childrenOf.get(r.parentId) ?? []), r]);
    index = { byId: new Map(seed.records.map((r) => [r.id, r])), childrenOf };
    indexes.set(seed, index);
  }
  return index;
}

/** "SU00501 Cleland Stringybark Woodland": a record as a link column names it, its ID then its name. */
export const recordLabel = (r: SurveyRecord | undefined): string => (r ? `${r.code} ${r.name}` : "");

/** The broad taxonomic group of an occurrence or observation: its own, else its species', else its occurrence's. */
export function groupOfRecord(record: SurveyRecord, index: SeedIndex): SpeciesGroup | undefined {
  if (record.group) return record.group;
  const fromSpecies = record.scientificName ? NSX_SPECIES.find((s) => s.scientific === record.scientificName)?.group : undefined;
  if (fromSpecies) return fromSpecies;
  const parent = record.parentId ? index.byId.get(record.parentId) : undefined;
  return record.kind === "observation" && parent?.kind === "occurrence" ? groupOfRecord(parent, index) : undefined;
}

/** The NSX code of a species occurrence, from the species list; never made up for a species it does not hold. */
export function nsxOf(record: SurveyRecord): string {
  const named = NSX_SPECIES.find((s) => s.scientific === record.scientificName);
  if (named) return named.nsx;
  const code = fieldOf(record, "NSX code & species").split(" ")[0];
  return NSX_SPECIES.some((s) => s.nsx === code) ? code : "";
}

/** How many sightings the Explore data counted for an occurrence (Explore-built projects only). */
export function countedOf(record: SurveyRecord): number | undefined {
  return findOccurrence(record.code)?.count ?? undefined;
}

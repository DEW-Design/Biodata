// The Data Validation Error Report: the errors found in ONE dataset (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk node
// 1520:12791; its Columns list is node 1520:12528). Unlike the ledger reports a row here is one record with one error.
//
// Nothing is stored and no file is read (real validation is not built). The error rows are DERIVED from a simulated
// ingestion run (`IngestionRow`), deterministically, seeded by the run's id, so the report, the ingestion report and the
// project page agree and the server and the browser render the same rows:
//   - how many records have errors is the run's own `ruleFailures`; a run that failed validation before rows were
//     checked has none counted, so it gets a small count from its size;
//   - each row takes a category (Business rule, Coordinate mismatch, Metadata) in a fixed 55 / 30 / 15 split, then one
//     of that category's rules, written in the wireframe's own vocabulary (BR-FAUNA-METHOD, CM-SPECIES-OUTLIER,
//     MD-VOCAB), with flora equivalents where a rule is about fauna;
//   - the species are real South Australian species from Explore's occurrences, of the kind the template is for (every
//     template in the app is for flora, so a dataset here carries plants), preferring the ones recorded on the project.
//
// Where each record is (for Map visualise in Explore) is also derived, never read: a record sits at the point of the real
// occurrence its species was taken from, nudged by about a kilometre so repeats do not stack. A project with no occurrences
// of its own takes the occurrences within 60 km of one seeded occurrence, so a dataset is one place, not the whole state.
// The project's extent is the circle that holds those occurrences. A coordinate outlier (CM-SPECIES-OUTLIER) takes the
// point of a real occurrence 12 km or more from the species' cluster, and an out-of-extent record (CM-OUT-OF-EXTENT) the
// point of one outside the extent, so a record flagged as far away is far away on the map, on land, and the distance in
// its description is the distance between the two points.

import { haversineDistanceKm, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { hasScientificName, kingdomForGroup, rootProjectForParentEventId, searchEvents, searchOccurrences, type SearchOccurrence } from "@/app/pages/_shared/map-search/search-data";
import type { BadgeColor } from "@/components/base/badges/badges";
import type { IngestionRow } from "@/app/pages/_shared/reports/ingestion-report-data";

export type ErrorCategory = "Business rule" | "Coordinate mismatch" | "Metadata";
export type ErrorSeverity = "High" | "Medium" | "Low";

export const ERROR_CATEGORIES: ErrorCategory[] = ["Business rule", "Coordinate mismatch", "Metadata"];
export const ERROR_SEVERITIES: ErrorSeverity[] = ["High", "Medium", "Low"];
export const severityColor: Record<ErrorSeverity, BadgeColor<"pill-color">> = { High: "error", Medium: "warning", Low: "gray" };
export const severityRank = (s: ErrorSeverity) => ERROR_SEVERITIES.indexOf(s);

/** Where a record is on the map: the point of the real occurrence it takes its place from. Explore draws an occurrence
 *  restricted for the role as a block (`occurrenceId` is how the map asks), so a precise point is never given away. */
export interface ErrorLocation {
  lat: number;
  lon: number;
  occurrenceId: string;
}

/** A coordinate outlier: a record far from where it should be. "cluster": far from the other records of its species
 *  (`distanceKm` is the gap to `from`, the cluster's centre). "extent": outside the project's registered extent
 *  (`distanceKm` is how far beyond the extent's edge, `from` is the extent's centre). */
export interface ErrorOutlier {
  kind: "cluster" | "extent";
  distanceKm: number;
  from: [number, number];
}

export interface ErrorRow {
  /** REC0001: the record's place in the dataset. Unique within one dataset, so it is the row's id. */
  recordId: string;
  recordNumber: number;
  projectCode: string;
  scientificName: string;
  commonName: string;
  category: ErrorCategory;
  rule: string;
  concept: string;
  severity: ErrorSeverity;
  description: string;
  location: ErrorLocation;
  /** Set on the records that fail CM-SPECIES-OUTLIER and CM-OUT-OF-EXTENT. */
  outlier?: ErrorOutlier;
}

/** A run has errors to report when rows failed the business rules, or when it failed validation outright. */
export function hasErrors(run: IngestionRow): boolean {
  return (run.ruleFailures ?? 0) > 0 || run.validation === "Failed";
}

/** How many records have errors. The count the ingestion report shows, capped at the records there are; a run that
 *  failed before rows were checked has none counted, so it is given a small count from its size. */
export function errorCountFor(run: IngestionRow): number {
  if (!hasErrors(run)) return 0;
  if ((run.ruleFailures ?? 0) > 0) return Math.min(run.ruleFailures ?? 0, run.rows);
  return Math.min(run.rows, Math.max(3, Math.round(run.rows / 100)));
}

// ── The rules ──
type Kind = "Flora" | "Fauna";

interface RuleContext {
  scientificName: string;
  /** For a coordinate outlier: how far its place is from the species' cluster, in km. */
  distanceKm: number;
  rand: () => number;
}

interface Rule {
  id: string;
  category: ErrorCategory;
  concept: string;
  severity: ErrorSeverity;
  /** How often this rule comes up among its category's errors. */
  weight: number;
  /** The kinds of dataset it applies to. */
  kinds: Kind[];
  describe: (context: RuleContext) => string;
}

const HABITAT_VALUES = ["Mallee scrub", "Open bush", "Woodland and forest", "Creek bank"];
const HABITAT_TERMS = "Open woodland, Mallee woodland, Heathy woodland";

const RULES: Rule[] = [
  { id: "BR-FAUNA-METHOD", category: "Business rule", concept: "Observation method", severity: "High", weight: 65, kinds: ["Fauna"], describe: () => "Observation method is required for all fauna records but is missing" },
  { id: "BR-FAUNA-COUNT", category: "Business rule", concept: "Number observed", severity: "High", weight: 35, kinds: ["Fauna"], describe: () => "Number observed must be 1 or more for a record marked present" },
  { id: "BR-FLORA-COVER", category: "Business rule", concept: "Cover abundance", severity: "High", weight: 65, kinds: ["Flora"], describe: () => "Cover abundance is required for all flora records but is missing" },
  { id: "BR-FLORA-STRATUM", category: "Business rule", concept: "Vegetation stratum", severity: "Medium", weight: 35, kinds: ["Flora"], describe: () => "Vegetation stratum is required when cover abundance is recorded but is missing" },
  {
    id: "CM-SPECIES-OUTLIER",
    category: "Coordinate mismatch",
    concept: "Easting/Northing",
    severity: "Medium",
    weight: 70,
    kinds: ["Flora", "Fauna"],
    describe: ({ scientificName, distanceKm }) => `Location is ${distanceKm} km from the typical cluster of other ${scientificName} records in this dataset (10 reference records) - verify identification or coordinates`,
  },
  { id: "CM-OUT-OF-EXTENT", category: "Coordinate mismatch", concept: "Easting/Northing", severity: "High", weight: 30, kinds: ["Flora", "Fauna"], describe: () => "Coordinates fall outside the geographic extent registered for the project" },
  {
    id: "MD-VOCAB",
    category: "Metadata",
    concept: "Habitat",
    severity: "Medium",
    weight: 70,
    kinds: ["Flora", "Fauna"],
    describe: ({ rand }) => `Habitat value "${HABITAT_VALUES[Math.floor(rand() * HABITAT_VALUES.length)]}" is not in the controlled vocabulary (accepted terms include ${HABITAT_TERMS})`,
  },
  { id: "MD-VISIT-DATE", category: "Metadata", concept: "Visit date", severity: "Low", weight: 30, kinds: ["Flora", "Fauna"], describe: () => "Visit date is not in the standard DD/MM/YYYY format and was read as written" },
];

/** The rules a dataset of this run's kind is checked against: what the Rule and Concept filters offer. */
export function rulesFor(run: IngestionRow | null): { id: string; concept: string }[] {
  const kind: Kind = run?.templateType === "Fauna" ? "Fauna" : "Flora";
  return RULES.filter((r) => r.kinds.includes(kind));
}

// ── A small deterministic generator (no random calls), seeded from the run's id ──
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 33) + text.charCodeAt(i)) >>> 0;
  return h;
}

const REGION_KM = 60;
/** The least gap, in km, for a point to count as away from a cluster. */
const OUTLIER_MIN_KM = 12;

interface Region {
  pool: SearchOccurrence[];
  home: [number, number];
  radiusKm: number;
}

const centroid = (points: SearchOccurrence[]): [number, number] => [points.reduce((n, p) => n + p.lat, 0) / points.length, points.reduce((n, p) => n + p.lon, 0) / points.length];
const at = (o: SearchOccurrence): [number, number] => [o.lat, o.lon];

const kindOf = (run: IngestionRow): Kind => (run.templateType === "Fauna" ? "Fauna" : "Flora");
const occurrencesOf = (kind: Kind) => searchOccurrences.filter((o) => hasScientificName(o.species) && o.group && kingdomForGroup(o.group) === kind);

/** The place a dataset is about: the occurrences its species come from, the centre of that place and the radius of the
 *  project's extent, which holds all of them. */
function regionFor(run: IngestionRow, kind: Kind): Region {
  const ofKind = occurrencesOf(kind);
  const onProject = ofKind.filter((o) => rootProjectForParentEventId(o.parentEventId)?.id === run.projectId);
  let pool = onProject;
  let home: [number, number] | undefined;
  if (onProject.length > 0) {
    const project = searchEvents.find((e) => e.type === "Project" && e.id === run.projectId);
    home = project ? [project.lat, project.lon] : centroid(onProject);
  } else {
    const anchor = ofKind[hash(run.id) % ofKind.length];
    pool = ofKind.filter((o) => haversineDistanceKm(at(anchor), at(o)) <= REGION_KM);
    home = at(anchor);
  }
  const reach = Math.max(...pool.map((o) => haversineDistanceKm(home, at(o))));
  return { pool, home, radiusKm: Math.max(12, Math.ceil(reach) + 3) };
}

/** The project's registered extent, as the map draws it: a circle that holds the dataset's records. */
export function projectExtentFor(run: IngestionRow): Boundary {
  const { home, radiusKm } = regionFor(run, kindOf(run));
  return { id: `extent-${run.projectId}`, kind: "circle", center: home, radiusKm };
}

/** A real occurrence of this kind at least `minKm` from `from`, picked from the generator; none when nothing is that far. */
function farOccurrence(kind: Kind, from: [number, number], minKm: number, rand: () => number): SearchOccurrence | null {
  const far = occurrencesOf(kind).filter((o) => haversineDistanceKm(from, at(o)) >= minKm);
  return far.length > 0 ? far[Math.floor(rand() * far.length)] : null;
}

function pickRule(category: ErrorCategory, kind: Kind, rand: () => number): Rule {
  const rules = RULES.filter((r) => r.category === category && r.kinds.includes(kind));
  const total = rules.reduce((n, r) => n + r.weight, 0);
  let at = rand() * total;
  for (const rule of rules) {
    at -= rule.weight;
    if (at < 0) return rule;
  }
  return rules[rules.length - 1];
}

// The rows are a pure function of what the run says about itself, so they are kept: a live run re-reads its clock
// every second and the same rows must come back as the same array, not a rebuilt copy of it.
const cache = new Map<string, ErrorRow[]>();

/** The error rows of one run, in record order. The same run always gives the same rows. */
export function errorRowsFor(run: IngestionRow): ErrorRow[] {
  const key = [run.id, run.rows, run.ruleFailures, run.validation, run.templateType, run.projectCode].join("|");
  let rows = cache.get(key);
  if (!rows) {
    rows = buildErrorRows(run);
    cache.set(key, rows);
  }
  return rows;
}

function buildErrorRows(run: IngestionRow): ErrorRow[] {
  const count = errorCountFor(run);
  if (count === 0) return [];
  const rand = lcg(hash(run.id));
  const kind = kindOf(run);
  const { pool, home, radiusKm } = regionFor(run, kind);
  // Where records are placed has its own generator, so choosing a place never changes which species or rule a record gets.
  const where = lcg(hash(`${run.id}|where`));

  // Which records have errors: a stable sample of the dataset's record numbers, in order.
  const numbers = Array.from({ length: run.rows }, (_, i) => i + 1);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rand() * (numbers.length - i));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  const records = numbers.slice(0, count).sort((a, b) => a - b);

  // The category split is exact (55 / 30 / 15 of the count), then spread through the records.
  const business = Math.round(count * 0.55);
  const coordinates = Math.round(count * 0.3);
  const categories: ErrorCategory[] = [
    ...Array<ErrorCategory>(business).fill("Business rule"),
    ...Array<ErrorCategory>(coordinates).fill("Coordinate mismatch"),
    ...Array<ErrorCategory>(count - business - coordinates).fill("Metadata"),
  ];
  for (let i = categories.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [categories[i], categories[j]] = [categories[j], categories[i]];
  }

  return records.map((recordNumber, i) => {
    const category = categories[i];
    const rule = pickRule(category, kind, rand);
    const occurrence = pool[Math.floor(rand() * pool.length)];
    const placed = placeRecord(rule.id, occurrence, { pool, home, radiusKm }, kind, where);
    return {
      recordId: `REC${String(recordNumber).padStart(4, "0")}`,
      recordNumber,
      projectCode: run.projectCode,
      scientificName: occurrence.species,
      commonName: occurrence.commonName,
      category,
      rule: rule.id,
      concept: rule.concept,
      severity: rule.severity,
      description: rule.describe({ scientificName: occurrence.species, distanceKm: placed.outlier?.distanceKm ?? 0, rand }),
      location: placed.location,
      ...(placed.outlier && { outlier: placed.outlier }),
    };
  });
}

/** Where one record is on the map (see the header). A coordinate outlier is moved to a real point far from its place; the
 *  rest sit at their own occurrence's point, nudged by about a kilometre. */
function placeRecord(ruleId: string, occurrence: SearchOccurrence, region: Region, kind: Kind, where: () => number): { location: ErrorLocation; outlier?: ErrorOutlier } {
  const nudge = (): [number, number] => [occurrence.lat + (where() - 0.5) * 0.03, occurrence.lon + (where() - 0.5) * 0.03];
  const own = nudge();
  const ownLocation: ErrorLocation = { lat: own[0], lon: own[1], occurrenceId: occurrence.id };
  const moved = (o: SearchOccurrence): ErrorLocation => ({ lat: o.lat, lon: o.lon, occurrenceId: o.id });

  if (ruleId === "CM-SPECIES-OUTLIER") {
    const cluster = centroid(region.pool.filter((o) => o.species === occurrence.species));
    const far = farOccurrence(kind, cluster, OUTLIER_MIN_KM, where);
    if (far) return { location: moved(far), outlier: { kind: "cluster", distanceKm: Math.round(haversineDistanceKm(cluster, at(far))), from: cluster } };
  }
  if (ruleId === "CM-OUT-OF-EXTENT") {
    const far = farOccurrence(kind, region.home, region.radiusKm + OUTLIER_MIN_KM, where);
    if (far) return { location: moved(far), outlier: { kind: "extent", distanceKm: Math.round(haversineDistanceKm(region.home, at(far)) - region.radiusKm), from: region.home } };
  }
  return { location: ownLocation };
}

/** The six counts over a dataset, all from the same rows the table lists, so the tiles and the table cannot disagree. */
export function errorTilesFor(run: IngestionRow, errors: ErrorRow[]) {
  const inCategory = (category: ErrorCategory) => errors.filter((e) => e.category === category).length;
  return [
    { label: "Total records", value: run.rows },
    { label: "Clean records", value: run.rows - errors.length },
    { label: "Records with errors", value: errors.length },
    { label: "Business rule failures", value: inCategory("Business rule") },
    { label: "Coordinate mismatch", value: inCategory("Coordinate mismatch") },
    { label: "Metadata mismatch", value: inCategory("Metadata") },
  ];
}

// ── Download ──
/** The error report as a file: every error of the dataset, with the wireframe's eight columns. */
export function errorReportCsv(errors: ErrorRow[]): { header: string[]; rows: string[][] } {
  return {
    header: ["Record ID", "Project", "Scientific name", "Common name", "Category", "Rule", "Concept", "Severity", "Description"],
    rows: errors.map((e) => [e.recordId, e.projectCode, e.scientificName, e.commonName, e.category, e.rule, e.concept, e.severity, e.description]),
  };
}

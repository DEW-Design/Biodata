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

import { hasScientificName, kingdomForGroup, rootProjectForParentEventId, searchOccurrences } from "@/app/pages/_shared/map-search/search-data";
import type { BadgeColor } from "@/components/base/badges/badges";
import type { IngestionRow } from "@/app/pages/_shared/reports/ingestion-report-data";

export type ErrorCategory = "Business rule" | "Coordinate mismatch" | "Metadata";
export type ErrorSeverity = "High" | "Medium" | "Low";

export const ERROR_CATEGORIES: ErrorCategory[] = ["Business rule", "Coordinate mismatch", "Metadata"];
export const ERROR_SEVERITIES: ErrorSeverity[] = ["High", "Medium", "Low"];
export const severityColor: Record<ErrorSeverity, BadgeColor<"pill-color">> = { High: "error", Medium: "warning", Low: "gray" };
export const severityRank = (s: ErrorSeverity) => ERROR_SEVERITIES.indexOf(s);

export interface ErrorRow {
  /** REC0001: the record's place in the dataset. Unique within one dataset, so it is the row's id. */
  recordId: string;
  recordNumber: number;
  projectCode: string;
  scientificName: string;
  commonName: string;
  category: ErrorCategory;
  rule: string;
  field: string;
  severity: ErrorSeverity;
  description: string;
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
  rand: () => number;
}

interface Rule {
  id: string;
  category: ErrorCategory;
  field: string;
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
  { id: "BR-FAUNA-METHOD", category: "Business rule", field: "Observation method", severity: "High", weight: 65, kinds: ["Fauna"], describe: () => "Observation method is required for all fauna records but is missing" },
  { id: "BR-FAUNA-COUNT", category: "Business rule", field: "Number observed", severity: "High", weight: 35, kinds: ["Fauna"], describe: () => "Number observed must be 1 or more for a record marked present" },
  { id: "BR-FLORA-COVER", category: "Business rule", field: "Cover abundance", severity: "High", weight: 65, kinds: ["Flora"], describe: () => "Cover abundance is required for all flora records but is missing" },
  { id: "BR-FLORA-STRATUM", category: "Business rule", field: "Vegetation stratum", severity: "Medium", weight: 35, kinds: ["Flora"], describe: () => "Vegetation stratum is required when cover abundance is recorded but is missing" },
  {
    id: "CM-SPECIES-OUTLIER",
    category: "Coordinate mismatch",
    field: "Easting/Northing",
    severity: "Medium",
    weight: 70,
    kinds: ["Flora", "Fauna"],
    describe: ({ scientificName, rand }) => `Location is ${12 + Math.floor(rand() * 248)} km from the typical cluster of other ${scientificName} records in this dataset (10 reference records) - verify identification or coordinates`,
  },
  { id: "CM-OUT-OF-EXTENT", category: "Coordinate mismatch", field: "Easting/Northing", severity: "High", weight: 30, kinds: ["Flora", "Fauna"], describe: () => "Coordinates fall outside the geographic extent registered for the project" },
  {
    id: "MD-VOCAB",
    category: "Metadata",
    field: "Habitat",
    severity: "Medium",
    weight: 70,
    kinds: ["Flora", "Fauna"],
    describe: ({ rand }) => `Habitat value "${HABITAT_VALUES[Math.floor(rand() * HABITAT_VALUES.length)]}" is not in the controlled vocabulary (accepted terms include ${HABITAT_TERMS})`,
  },
  { id: "MD-VISIT-DATE", category: "Metadata", field: "Visit date", severity: "Low", weight: 30, kinds: ["Flora", "Fauna"], describe: () => "Visit date is not in the standard DD/MM/YYYY format and was read as written" },
];

/** The rules a dataset of this run's kind is checked against: what the Rule and Field filters offer. */
export function rulesFor(run: IngestionRow | null): { id: string; field: string }[] {
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

function speciesFor(run: IngestionRow, kind: Kind) {
  const ofKind = searchOccurrences.filter((o) => hasScientificName(o.species) && o.group && kingdomForGroup(o.group) === kind);
  const onProject = ofKind.filter((o) => rootProjectForParentEventId(o.parentEventId)?.id === run.projectId);
  return onProject.length > 0 ? onProject : ofKind;
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
  const kind: Kind = run.templateType === "Fauna" ? "Fauna" : "Flora";
  const pool = speciesFor(run, kind);

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
    return {
      recordId: `REC${String(recordNumber).padStart(4, "0")}`,
      recordNumber,
      projectCode: run.projectCode,
      scientificName: occurrence.species,
      commonName: occurrence.commonName,
      category,
      rule: rule.id,
      field: rule.field,
      severity: rule.severity,
      description: rule.describe({ scientificName: occurrence.species, rand }),
    };
  });
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
    header: ["Record ID", "Project", "Scientific name", "Common name", "Category", "Rule", "Field", "Severity", "Description"],
    rows: errors.map((e) => [e.recordId, e.projectCode, e.scientificName, e.commonName, e.category, e.rule, e.field, e.severity, e.description]),
  };
}

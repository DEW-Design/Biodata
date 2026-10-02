// The field types of project records, and the rules that turn a type into a control. One source for
// every event, occurrence and observation, so a rule set for one record type applies to all of them
// (designer instruction, 28 Sept 2026: "anything I give you for context must be applied across all
// the project records").
//
// Field lists come from the Figma "Details Container / Edit" frames (file YMproGZfrFB5jUqPHPxMhk),
// which annotate every field with its type. Site is the first (node 1970:143519); the others follow.
//  - "System Generated": no input, never editable.
//  - "Text Field" / "Free text": a text input.
//  - "Text field 2000 words": a text area.
//  - "Number Text Field": the DEW number input.
//  - "Degrees- Number Text Field": a number with a fixed unit.
//  - "Two Values with unit": two numbers and a unit.
//  - "Yes/No": a Yes / No choice (radio buttons).
//  - "Ctrl Vocab": a code from a controlled vocabulary, with that code's description beside it.
//  - IBRA region and subregion are worked out from the location, never typed.

import { isPointInBoundary, type Boundary } from "@/app/pages/_shared/map-search/geo";
import type { MetaRow, SurveyRecord } from "./survey-data";
import type { SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import { CODE_FIELDS, CODE_TABLES, CODE_VOCABS, INSTITUTION_PREFIX, MULTI_OPTIONS, NUMBER_UNITS, PEOPLE_FIELDS, SELECT_OPTIONS, crownScore } from "./field-options";

export type FieldType =
  | "system"
  | "derived"
  | "text"
  | "textarea"
  | "number"
  | "yesno"
  | "vocab"
  | "unitNumber"
  | "dimensions"
  | "date"
  | "duration"
  // Added with the occurrence and observation frames:
  | "select"
  | "multi"
  | "people"
  | "codes"
  | "numberUnit"
  | "images"
  | "voucher"
  | "species"
  | "score"
  | "measurements";

/** IDs, record type, parent: set by the system. */
export const LOCKED = /(^|\s)ID$|^Event type$|^Parent event$|^Linked to$|^Observation type$/;
export const LONG = /Description|comment|Comment|Behaviour|Justification/;

export interface VocabTerm {
  code: string;
  description: string;
}

// Illustrative lists until the Control Vocabulary module supplies the real ones. Not sourced.
export const VOCABS: Record<string, VocabTerm[]> = {
  "Location method": [
    { code: "GPS", description: "Hand-held GPS" },
    { code: "DGPS", description: "Differential GPS" },
    { code: "MAP", description: "Read from a map" },
    { code: "AER", description: "Aerial photo or satellite image" },
    { code: "EST", description: "Estimated from a description" },
    { code: "INH", description: "Inherited from the parent record" },
    { code: "GEN", description: "Generalised to protect a restricted species" },
  ],
  Datum: [
    { code: "GDA2020", description: "Geocentric Datum of Australia 2020" },
    { code: "GDA94", description: "Geocentric Datum of Australia 1994" },
    { code: "WGS84", description: "World Geodetic System 1984" },
    { code: "AGD66", description: "Australian Geodetic Datum 1966" },
  ],
  Reliability: [
    { code: "1", description: "Within 10 m" },
    { code: "2", description: "Within 100 m" },
    { code: "3", description: "Within 1 km" },
    { code: "4", description: "Within 10 km" },
    { code: "5", description: "More than 10 km" },
  ],
  "Date accuracy": [
    { code: "D", description: "Exact to the day" },
    { code: "M", description: "To the month" },
    { code: "Y", description: "To the year" },
    { code: "S", description: "To the season" },
    { code: "U", description: "Unknown" },
  ],
};

/** The Reliability code for a location uncertainty in metres. */
export function reliabilityCode(metres: number): string {
  if (metres <= 10) return "1";
  if (metres <= 100) return "2";
  if (metres <= 1000) return "3";
  if (metres <= 10000) return "4";
  return "5";
}

/** Numbers with a fixed unit. The unit is part of the number field (Intl unit formatting). */
export const UNIT_FIELDS: Record<string, { unit: "degree" | "meter" | "percent" | "millimeter"; label: string; min?: number; max?: number }> = {
  "Photopoint direction": { unit: "degree", label: "degrees", min: 0, max: 359 },
  "Site slope": { unit: "degree", label: "degrees", min: 0, max: 90 },
  "Site aspect": { unit: "degree", label: "degrees from north", min: 0, max: 359 },
  "Bare earth estimate": { unit: "percent", label: "%", min: 0, max: 100 },
  "Litter estimate": { unit: "percent", label: "%", min: 0, max: 100 },
  "Crown extent": { unit: "percent", label: "%", min: 0, max: 100 },
  "Crown density": { unit: "percent", label: "%", min: 0, max: 100 },
  DBH: { unit: "millimeter", label: "mm", min: 0 },
};

/** Formats a unit number: "45°", "9%", "320 mm". Percent values are stored as 0 to 100. */
export function formatUnitNumber(label: string, n: number): string {
  const spec = UNIT_FIELDS[label];
  if (!spec) return String(n);
  if (spec.unit === "percent") return `${n}%`;
  return new Intl.NumberFormat("en-AU", { style: "unit", unit: spec.unit, unitDisplay: spec.unit === "degree" ? "narrow" : "short" }).format(n);
}

export const DIMENSION_UNITS = ["m", "km"] as const;

const LABEL_TYPES: Record<string, FieldType> = {
  "IBRA region": "derived",
  "IBRA subregion": "derived",
  "Location method": "vocab",
  Datum: "vocab",
  Reliability: "vocab",
  Altitude: "number",
  "Photopoint direction": "unitNumber",
  "Sample site dimensions": "dimensions",
  "Mud map": "yesno",
  "Photopoint marker present": "yesno",
  "End date": "date",
  Duration: "duration",
  "Date accuracy": "vocab",
  "Determination date accuracy": "vocab",
  "Determination date": "date",
  "Transfer date": "date",
};

/** A code list under another label: "Determination date accuracy" uses "Date accuracy". */
const VOCAB_ALIAS: Record<string, string> = { "Determination date accuracy": "Date accuracy" };

/** The codes a code-and-description field offers. */
export function vocabTerms(label: string): VocabTerm[] {
  return VOCABS[VOCAB_ALIAS[label] ?? label] ?? CODE_VOCABS[CODE_FIELDS[label]] ?? [];
}

export function fieldTypeOf(row: Pick<MetaRow, "label" | "type" | "table">): FieldType {
  if (row.type) return row.type;
  if (row.table && CODE_TABLES[row.table]) return "codes";
  if (LABEL_TYPES[row.label]) return LABEL_TYPES[row.label];
  if (CODE_FIELDS[row.label]) return "vocab";
  if (SELECT_OPTIONS[row.label]) return "select";
  if (MULTI_OPTIONS[row.label]) return "multi";
  if (PEOPLE_FIELDS.has(row.label)) return "people";
  if (CODE_TABLES[row.label]) return "codes";
  if (NUMBER_UNITS[row.label]) return "numberUnit";
  if (UNIT_FIELDS[row.label]) return "unitNumber";
  if (LOCKED.test(row.label)) return "system";
  if (LONG.test(row.label)) return "textarea";
  return "text";
}

export const EMPTY_VALUES = new Set(["Not provided", "None recorded", ""]);

export function vocabTerm(label: string, code: string): VocabTerm | undefined {
  return vocabTerms(label).find((t) => t.code === code);
}

// ── Values stored as text ──
// Rows keep one string value, so list-like values are stored as JSON or joined text:
//  - people and multi-selects: "Olivia Wyatt | Maya Dewitt"
//  - code tables: JSON rows of codes, [["LA","d"],["SB","c"]]
//  - images: JSON file names
//  - a number with a chosen unit: "24 °C"

export const splitList = (v: string): string[] => (EMPTY_VALUES.has(v) ? [] : v.split("|").map((x) => x.trim()).filter(Boolean));
export const joinList = (items: string[]): string => (items.length ? items.join(" | ") : "Not provided");

export function parseJsonList<T>(v: string): T[] {
  if (EMPTY_VALUES.has(v)) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
export const toJsonList = (items: unknown[]): string => (items.length ? JSON.stringify(items) : "Not provided");

export function parseNumberUnit(v: string): { value: string; unit: string } {
  const m = v.match(/^\s*(-?[\d.]+)\s*(.*)$/);
  return m ? { value: m[1], unit: m[2].trim() } : { value: "", unit: "" };
}

/** The NSX species list for "NSX code & species" (the occurrence's species). */
export const NSX_SPECIES: { nsx: string; scientific: string; common: string; kingdom: string; family: string; group: SpeciesGroup }[] = [
  { nsx: "M03050", scientific: "Malurus cyaneus", common: "Superb Fairywren", kingdom: "Fauna", family: "Maluridae", group: "Bird" },
  { nsx: "P01937", scientific: "Eucalyptus leucoxylon", common: "South Australian Blue Gum", kingdom: "Flora", family: "Myrtaceae", group: "Plant" },
  { nsx: "P04411", scientific: "Xanthorrhoea semiplana", common: "Yacca", kingdom: "Flora", family: "Asphodelaceae", group: "Plant" },
  { nsx: "M01170", scientific: "Isoodon obesulus", common: "Southern Brown Bandicoot", kingdom: "Fauna", family: "Peramelidae", group: "Mammal" },
  { nsx: "A00215", scientific: "Crinia signifera", common: "Common Froglet", kingdom: "Fauna", family: "Myobatrachidae", group: "Amphibian" },
  { nsx: "M01002", scientific: "Tachyglossus aculeatus", common: "Short-beaked Echidna", kingdom: "Fauna", family: "Tachyglossidae", group: "Mammal" },
  { nsx: "M01130", scientific: "Trichosurus vulpecula", common: "Common Brushtail Possum", kingdom: "Fauna", family: "Phalangeridae", group: "Mammal" },
];
export const nsxSpecies = (code: string) => NSX_SPECIES.find((s) => s.nsx === code);

/** Fields the system sets or works out: read only, so they never show an edit icon. */
export const LOCKED_TYPES = new Set<FieldType>(["system", "derived", "score"]);
export const isLockedRow = (row: Pick<MetaRow, "label" | "type" | "table">) => LOCKED_TYPES.has(fieldTypeOf(row));

/** A row has something to show when viewed. Empty rows are left out of the view (they still show in edit mode). */
export function rowHasValue(row: MetaRow, rows: MetaRow[] = []): boolean {
  return !EMPTY_VALUES.has(displayValue(row, rows));
}

/** Calculated rows worked out from another row in the same section. */
export function derivedFrom(label: string, rows: MetaRow[]): string | undefined {
  const pct = (l: string) => {
    const r = rows.find((x) => x.label === l);
    return r && !EMPTY_VALUES.has(r.value) ? Number(r.value) : NaN;
  };
  if (label === "Crown extent score") return crownScore(pct("Crown extent"));
  if (label === "Crown density score") return crownScore(pct("Crown density"));
  return undefined;
}

export function parseDimensions(value: string): { a: number | null; b: number | null; unit: string } {
  const m = value.match(/^\s*([\d.]+)\s*[x×]\s*([\d.]+)\s*(m|km)\s*$/i);
  if (!m) return { a: null, b: null, unit: "m" };
  return { a: Number(m[1]), b: Number(m[2]), unit: m[3].toLowerCase() };
}

export function formatDimensions(a: number | null, b: number | null, unit: string): string {
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) return "Not provided";
  return `${a} × ${b} ${unit}`;
}

// ── Duration ("Days / Hours / Mins", three numbers) ──
// Stored as "2d 3h 30m" so it round-trips; read as "2 days, 3 hours, 30 mins".

export interface DurationParts {
  d: number;
  h: number;
  m: number;
}

export function parseDuration(value: string): DurationParts | null {
  const m = value.match(/^\s*(\d+)d\s+(\d+)h\s+(\d+)m\s*$/);
  return m ? { d: Number(m[1]), h: Number(m[2]), m: Number(m[3]) } : null;
}

export function formatDuration(p: DurationParts): string {
  return p.d || p.h || p.m ? `${p.d}d ${p.h}h ${p.m}m` : "Not provided";
}

function readDuration(p: DurationParts): string {
  const part = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : null);
  return [part(p.d, "day", "days"), part(p.h, "hour", "hours"), part(p.m, "min", "mins")].filter(Boolean).join(", ");
}

/** "2025-10-14" as "14 Oct 2025". */
export function readIsoDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// ── Trap effort ──
// Not from Figma (designer's table, 28 Sept 2026). Each trap type has its own fixed set of fields,
// so picking a trap type is the whole choice: nothing else is added line by line. Effort is how much
// trapping was done (number of traps, duration, hauls); specs describe the gear, and only Elliott
// traps (their size) and eFishing (the electrical settings) have any. The same trap type can be
// listed more than once (two fishing-line sets). Lists are illustrative until the Control
// Vocabulary module supplies the real ones; Elliott's width and height are added beside the table's
// length so the trap's size reads as one dimension.

export type TrapGroup = "Effort" | "Specs";
export type TrapFieldId = "count" | "duration" | "hauls" | "length" | "width" | "height" | "voltage" | "frequency" | "dutyCycle" | "waveForm";

export interface TrapField {
  id: TrapFieldId;
  label: string;
  group: TrapGroup;
  /** A fixed unit, written after the number. */
  unit?: string;
  /** Units to choose from (duration). */
  units?: string[];
  /** A choice rather than a number (wave form). */
  options?: string[];
  max?: number;
}

export const TRAP_FIELDS: Record<TrapFieldId, TrapField> = {
  count: { id: "count", label: "Number of traps", group: "Effort" },
  duration: { id: "duration", label: "Duration", group: "Effort", units: ["minutes", "hours", "days", "nights", "months"] },
  hauls: { id: "hauls", label: "Hauls", group: "Effort" },
  length: { id: "length", label: "Length", group: "Specs", unit: "cm" },
  width: { id: "width", label: "Width", group: "Specs", unit: "cm" },
  height: { id: "height", label: "Height", group: "Specs", unit: "cm" },
  voltage: { id: "voltage", label: "Voltage", group: "Specs", unit: "volts" },
  frequency: { id: "frequency", label: "Frequency", group: "Specs", unit: "Hz" },
  dutyCycle: { id: "dutyCycle", label: "Duty cycle", group: "Specs", unit: "%", max: 100 },
  waveForm: { id: "waveForm", label: "Wave form", group: "Specs", options: ["AC", "DC", "Pulsed DC"] },
};

export const TRAP_TYPE_FIELDS: Record<string, TrapFieldId[]> = {
  Elliott: ["count", "duration", "length", "width", "height"],
  Pitfall: ["count", "duration"],
  "Hair tube": ["count", "duration"],
  Harp: ["count", "duration"],
  "Dip net": ["duration"],
  "Seine net": ["hauls"],
  eFishing: ["voltage", "frequency", "dutyCycle", "waveForm"],
  "Fishing line": ["count", "duration"],
};

export const TRAP_TYPES = Object.keys(TRAP_TYPE_FIELDS);

export interface TrapValue {
  value: string;
  unit?: string;
  /** Row id while editing (never saved). */
  rid?: number;
}

export interface TrapSpec {
  field: TrapFieldId;
  value: string;
  rid?: number;
}

/**
 * One trap type on a trap event. Number of traps and hauls are single values; a trap type can have
 * several durations (added like custom properties) and its specs are picked one at a time.
 */
export interface TrapEntry {
  trapType: string;
  values: Partial<Record<"count" | "hauls", TrapValue>>;
  durations: TrapValue[];
  specs: TrapSpec[];
}

export const trapFieldsFor = (trapType: string): TrapField[] => (TRAP_TYPE_FIELDS[trapType] ?? []).map((id) => TRAP_FIELDS[id]);
export const trapSpecsFor = (trapType: string): TrapField[] => trapFieldsFor(trapType).filter((f) => f.group === "Specs");
export const trapHas = (trapType: string, id: TrapFieldId) => (TRAP_TYPE_FIELDS[trapType] ?? []).includes(id);

/** A new trap type starts with its single effort fields blank and no durations or specs: both are added one unit or spec at a time. */
export function newTrapEntry(trapType: string): TrapEntry {
  return { trapType, values: {}, durations: [], specs: [] };
}

/** What is still missing on a trap type, as short phrases. */
export function trapMissing(entry: TrapEntry): string[] {
  const out: string[] = [];
  (["count", "hauls"] as const).forEach((id) => trapHas(entry.trapType, id) && !entry.values[id]?.value?.trim() && out.push(TRAP_FIELDS[id].label));
  if (trapHas(entry.trapType, "duration") && (entry.durations.length === 0 || entry.durations.some((d) => !d.value.trim()))) out.push("Duration");
  if (entry.specs.some((s) => !s.value.trim())) out.push("Specs");
  return out;
}

/** Each entry's name, numbered when a trap type is listed more than once ("Fishing line", "Fishing line 2"). */
export function trapLabels(entries: Pick<TrapEntry, "trapType">[]): string[] {
  const seen: Record<string, number> = {};
  return entries.map((e) => {
    seen[e.trapType] = (seen[e.trapType] ?? 0) + 1;
    return seen[e.trapType] === 1 ? e.trapType : `${e.trapType} ${seen[e.trapType]}`;
  });
}

const plural = (n: string, one: string, many: string) => `${n} ${n === "1" ? one : many}`;

/** A spec as read: "30 cm", "50% duty cycle", "AC wave form". */
export function readTrapSpec(s: TrapSpec): string {
  const f = TRAP_FIELDS[s.field];
  if (!s.value.trim()) return `${f.label}: Not provided`;
  if (s.field === "dutyCycle") return `${s.value}% duty cycle`;
  if (s.field === "waveForm") return `${s.value} wave form`;
  if (["length", "width", "height"].includes(s.field)) return `${f.label} ${s.value} ${f.unit}`;
  return `${s.value} ${f.unit ?? ""}`.trim();
}

/** A duration as read: "4 nights", "1 night". */
export function readTrapDuration(d: TrapValue): string {
  const unit = d.unit ?? "";
  return `${d.value} ${d.value === "1" ? unit.replace(/s$/, "") : unit}`.trim();
}

/**
 * A trap entry as two short lists: effort (["20 traps", "4 nights"]) and specs (["Length 30 cm"]).
 * Only one duration per unit counts (older data could hold the same unit twice).
 */
export function trapSummary(entry: TrapEntry): { effort: string[]; specs: string[] } {
  const v = (id: "count" | "hauls") => entry.values[id]?.value?.trim() ?? "";
  const effort: string[] = [];
  if (v("count")) effort.push(plural(v("count"), "trap", "traps"));
  const seen = new Set<string>();
  (entry.durations ?? []).forEach((d) => {
    if (!d.value.trim() || seen.has(d.unit ?? "")) return;
    seen.add(d.unit ?? "");
    effort.push(readTrapDuration(d));
  });
  if (v("hauls")) effort.push(plural(v("hauls"), "haul", "hauls"));
  return { effort, specs: (entry.specs ?? []).map(readTrapSpec) };
}

/** How a row reads when viewed. `rows` are the other rows of its section, for values that depend on them. */
export function displayValue(row: MetaRow, rows: MetaRow[] = []): string {
  const type = fieldTypeOf(row);
  if (type === "score") return derivedFrom(row.label, rows) ?? "Not provided";
  if (EMPTY_VALUES.has(row.value)) return row.value;
  if (type === "people" || type === "multi") return splitList(row.value).join(", ");
  if (type === "vocab") {
    const term = vocabTerm(row.label, row.value);
    return term ? `${term.code} · ${term.description}` : row.value;
  }
  if (type === "species") {
    const sp = nsxSpecies(row.value);
    return sp ? `${sp.nsx} · ${sp.scientific}` : row.value;
  }
  if (type === "voucher") {
    const inst = rows.find((r) => r.label === "Institution name")?.value ?? "";
    const prefix = INSTITUTION_PREFIX[inst];
    return prefix ? `${prefix} ${row.value}` : row.value;
  }
  if (type === "images") return parseJsonList<string>(row.value).join(", ");
  if (type === "codes") {
    const cols = CODE_TABLES[row.table ?? row.label] ?? [];
    return parseJsonList<string[]>(row.value)
      .map((codes) => codes.map((c, i) => (cols[i]?.vocab ? `${c} · ${CODE_VOCABS[cols[i].vocab!]?.find((t) => t.code === c)?.description ?? ""}` : c)).join(", "))
      .join("\n");
  }
  if (type === "date") return readIsoDate(row.value);
  if (type === "duration") {
    const d = parseDuration(row.value);
    return d ? readDuration(d) || "Not provided" : row.value;
  }
  if (type === "unitNumber") {
    const n = Number(row.value);
    if (UNIT_FIELDS[row.label] && Number.isFinite(n)) return formatUnitNumber(row.label, n);
  }
  return row.value;
}

// ── IBRA ──
// Approximate South Australian IBRA regions and subregions, by latitude and longitude boxes, checked
// in order. The names are real IBRA 7 names; the boxes are rough, for this preview only, until the
// real IBRA boundaries are loaded.
const IBRA_BOXES: { region: string; subregion: string; lat: [number, number]; lon: [number, number] }[] = [
  { region: "Kanmantoo", subregion: "Kangaroo Island", lat: [-36.1, -35.5], lon: [136.5, 138.2] },
  { region: "Kanmantoo", subregion: "Fleurieu", lat: [-35.75, -35.35], lon: [138.1, 138.95] },
  { region: "Flinders Lofty Block", subregion: "Mount Lofty Ranges", lat: [-35.35, -34.3], lon: [138.45, 139.1] },
  { region: "Flinders Lofty Block", subregion: "Broughton", lat: [-34.3, -33.2], lon: [137.9, 139.0] },
  { region: "Flinders Lofty Block", subregion: "Southern Flinders", lat: [-33.2, -32.2], lon: [137.7, 138.9] },
  { region: "Flinders Lofty Block", subregion: "Northern Flinders", lat: [-32.2, -30.0], lon: [138.0, 139.8] },
  { region: "Naracoorte Coastal Plain", subregion: "Lucindale", lat: [-38.1, -36.0], lon: [139.6, 141.0] },
  { region: "Murray Darling Depression", subregion: "Murray Mallee", lat: [-36.0, -33.5], lon: [139.1, 141.0] },
  { region: "Eyre Yorke Block", subregion: "St Vincent", lat: [-35.3, -33.8], lon: [137.2, 138.45] },
  { region: "Eyre Yorke Block", subregion: "Eyre Hills", lat: [-35.0, -33.0], lon: [135.0, 137.2] },
  { region: "Gawler", subregion: "Myall Plains", lat: [-33.0, -30.5], lon: [133.0, 137.7] },
  { region: "Nullarbor", subregion: "Nullarbor Plain", lat: [-32.5, -30.0], lon: [129.0, 133.0] },
  { region: "Stony Plains", subregion: "Breakaways", lat: [-30.0, -26.0], lon: [133.0, 137.5] },
  { region: "Simpson Strzelecki Dunefields", subregion: "Strzelecki Desert", lat: [-30.0, -26.0], lon: [137.5, 141.0] },
  { region: "Great Victoria Desert", subregion: "Maralinga", lat: [-30.0, -26.0], lon: [129.0, 133.0] },
];

export function ibraFor(lat: number, lon: number): { region: string; subregion: string } {
  const hit = IBRA_BOXES.find((b) => lat >= b.lat[0] && lat <= b.lat[1] && lon >= b.lon[0] && lon <= b.lon[1]);
  return hit ? { region: hit.region, subregion: hit.subregion } : { region: "Not in a mapped region", subregion: "Not in a mapped region" };
}

// ── Location ──

/** The centre of a location shape: a circle's centre, or the average of a polygon's corners. */
export function boundaryCentre(b: Boundary): [number, number] {
  if (b.kind === "circle") return b.center;
  const n = b.points.length || 1;
  return [b.points.reduce((s, p) => s + p[0], 0) / n, b.points.reduce((s, p) => s + p[1], 0) / n];
}

/** Points that must all fall inside an allowed area for the shape to count as inside it. */
function samplePoints(b: Boundary): [number, number][] {
  if (b.kind === "polygon") return b.points;
  const [lat, lon] = b.center;
  const dLat = b.radiusKm / 111;
  const dLon = b.radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [b.center, ...Array.from({ length: 16 }, (_, i): [number, number] => [lat + dLat * Math.sin((i * Math.PI) / 8), lon + dLon * Math.cos((i * Math.PI) / 8)])];
}

export function isBoundaryInside(inner: Boundary, outer: Boundary): boolean {
  return samplePoints(inner).every((p) => isPointInBoundary(p, outer));
}

/** How a record's location was entered, in words: "Drawn on the map · circle, 500 m radius". */
export function locationSummary(location: { method: string | null; shapefileName?: string; boundary?: Boundary | null } | undefined): string {
  if (!location?.boundary) return "Not provided";
  const how =
    location.method === "shapefile"
      ? `Uploaded shapefile${location.shapefileName ? ` (${location.shapefileName})` : ""}`
      : location.method === "list"
        ? `Chosen from a list${location.boundary.label ? ` (${location.boundary.label})` : ""}`
        : location.method === "coordinates"
          ? "Entered coordinates"
          : "Drawn on the map";
  const b = location.boundary;
  const shape = b.kind === "circle" ? `circle, ${b.radiusKm < 1 ? `${Math.round(b.radiusKm * 1000)} m` : `${b.radiusKm} km`} radius` : `polygon, ${b.points.length} points`;
  return `${how} · ${shape}`;
}

/** A record shows a date only when its type has a date field (a site, for one, has none). */
export function hasDateField(record: SurveyRecord): boolean {
  return record.sections.some((s) => (s.rows ?? []).some((r) => r.term === "eventDate" || r.term === "measurementDeterminedDate" || /\bdate\b/i.test(r.label)));
}

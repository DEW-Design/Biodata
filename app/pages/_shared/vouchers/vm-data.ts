import { formatShortDate } from "@/app/pages/_shared/dsa/dsa-data";
import type { BadgeColors } from "@/components/base/badges/badge-types";

// Voucher Management (BioData Super Admin only): a scan runs on a set interval against one source at
// a time, the Herbarium or the SA Museum (the designer, 1 Oct 2026: "the batches are run separately"),
// and compares every vouchered BioData record with the specimen record that source holds for it,
// matched on Rego ID, Voucher ID or both. Four fields are compared (Figma "Biodata Wireframe
// Presentation", node 1584:10220): scientific name, Rego ID, who identified or determined it and
// when, and who observed it and when. Thousands of records are checked; a few differ, and an admin
// decides, field by field, to update BioData to the source's value (or a value they choose) or to
// ignore the difference.
//
// Sample data. Species are this build's NSX list (project-detail/field-schema.ts), so no NSX code is
// made up; source-only names (a subspecies the Herbarium has redetermined a specimen to) are real
// taxa with no BioData taxon yet. People are the placeholder people (CONTRACTS 0.3). Record IDs
// follow the wireframe's shapes (REG-4421, ADH-2021-044, AD-7712). The scan's interval is not known
// yet (weekly or monthly, not decided), so nothing on screen states one.

export const VM_ROOT = "/pages/vouchers";

export type VmSource = "herbarium" | "museum";
export const SOURCE_LABEL: Record<VmSource, string> = { herbarium: "Herbarium", museum: "SA Museum" };
export const SOURCES: VmSource[] = ["herbarium", "museum"];

export type MatchKey = "both" | "voucher" | "rego";
export const MATCH_LABEL: Record<MatchKey, string> = { both: "Rego and Voucher ID", voucher: "Voucher ID", rego: "Rego ID" };

export type FieldKey = "name" | "rego" | "determined" | "observed";
/** `short` is the review table's label, where four value columns share the width. */
export const FIELDS: { key: FieldKey; label: string; short: string }[] = [
  { key: "name", label: "Scientific name", short: "Scientific name" },
  { key: "rego", label: "Rego ID", short: "Rego ID" },
  { key: "determined", label: "Identified / determined by", short: "Determined by" },
  { key: "observed", label: "Observed by", short: "Observed by" },
];
/**
 * The fields an admin can update. Observed by and date is compared and shown, but it is the observer's
 * record and is not updated from a scan (the designer, 1 Oct 2026: "Observed by is not editable"; the
 * Figma draws no update for it).
 */
export const UPDATABLE: ReadonlySet<FieldKey> = new Set(["name", "rego", "determined"]);
export const fieldLabel = (key: FieldKey) => FIELDS.find((f) => f.key === key)!.label;
export const fieldShort = (key: FieldKey) => FIELDS.find((f) => f.key === key)!.short;

/**
 * One compared value. `text` is the name, the Rego ID, or the person; `date` (ISO) goes with a person.
 * `note` is shown beside the name and never compared: the authorship on the source's side, the NSX
 * code on BioData's. `taxonId` is the BioData taxon a scientific name points at.
 */
export interface FieldValue {
  text: string;
  date?: string;
  note?: string;
  taxonId?: string;
}

export type FieldSet = Record<FieldKey, FieldValue | null>;

export interface VmRecord {
  id: string;
  source: VmSource;
  matchedOn: MatchKey;
  src: FieldSet;
  bio: FieldSet;
}

export interface VmBatch {
  id: string;
  /** ISO date the scan ran. */
  ranOn: string;
  /** Each batch scans one source. */
  source: VmSource;
  /** Records the scan compared. */
  checked: number;
  /** Only the records with at least one difference; the rest matched (see `matchedRecords`). */
  records: VmRecord[];
}

export type Decision =
  | { kind: "pushed"; value: FieldValue; by: string; at: string }
  /** Ignoring needs a reason (the designer, 2 Oct 2026), so whoever meets the difference again knows why. */
  | { kind: "ignored"; by: string; at: string; reason: string }
  /** A difference ignored in an earlier batch, put back to review in this one. */
  | { kind: "reopened"; by: string; at: string };

export const decisionKey = (batchId: string, recordId: string, field: FieldKey) => `${batchId}|${recordId}|${field}`;

// ── Comparison ──

export const sameValue = (a: FieldValue | null, b: FieldValue | null) => (a?.text ?? "") === (b?.text ?? "") && (a?.date ?? "") === (b?.date ?? "");

/** Which parts of a value differ: the text, the date, or the whole value is missing on one side. */
export function diffParts(src: FieldValue | null, bio: FieldValue | null): { text: boolean; date: boolean; missing: boolean } {
  if (!bio || !src) return { text: true, date: true, missing: !bio && !!src };
  return { text: src.text !== bio.text, date: (src.date ?? "") !== (bio.date ?? ""), missing: false };
}

export const differingFields = (r: VmRecord): FieldKey[] => FIELDS.map((f) => f.key).filter((k) => !sameValue(r.src[k], r.bio[k]));

/** "14 Jun 2021", or the value as given. */
export const readDate = (iso?: string) => (iso ? formatShortDate(iso) : "");

/** A value in words: "Lana Steiner, 14 Aug 2026"; a BioData taxon with its NSX code, "Eucalyptus leucoxylon P01937". */
export function valueText(v: FieldValue | null): string {
  if (!v) return "Not recorded";
  if (v.taxonId && v.note) return `${v.text} ${v.note}`;
  return v.date ? `${v.text}, ${readDate(v.date)}` : v.text;
}

// ── Species (the NSX list) ──

interface Species {
  name: string;
  nsx: string;
  author: string;
}
const FLORA: Species[] = [
  { name: "Eucalyptus leucoxylon", nsx: "P01937", author: "F.Muell." },
  { name: "Xanthorrhoea semiplana", nsx: "P04411", author: "F.Muell." },
];
const FAUNA: Species[] = [
  { name: "Malurus cyaneus", nsx: "M03050", author: "(Ellis, 1782)" },
  { name: "Isoodon obesulus", nsx: "M01170", author: "(Shaw, 1797)" },
  { name: "Crinia signifera", nsx: "A00215", author: "Girard, 1853" },
  { name: "Tachyglossus aculeatus", nsx: "M01002", author: "(Shaw, 1792)" },
  { name: "Trichosurus vulpecula", nsx: "M01130", author: "(Kerr, 1792)" },
];
const ALL_SPECIES = [...FLORA, ...FAUNA];
const species = (name: string) => ALL_SPECIES.find((s) => s.name === name)!;

const PEOPLE = ["Olivia Wyatt", "Phoenix Baker", "Lana Steiner", "Maya Dewitt"];

/** The source's name, with its authorship. */
const srcName = (name: string, author?: string): FieldValue => ({ text: name, note: author ?? species(name).author });
/** BioData's name, pointing at its taxon. A name with no taxon (an old synonym) has no code. */
const bioName = (name: string): FieldValue => {
  const s = ALL_SPECIES.find((x) => x.name === name);
  return s ? { text: name, note: s.nsx, taxonId: s.nsx } : { text: name };
};
const person = (text: string, date: string): FieldValue => ({ text, date });
const rego = (text: string): FieldValue => ({ text });

/** A record whose four fields match, then the given BioData values swapped in. */
function rec(id: string, source: VmSource, matchedOn: MatchKey, base: { name: string; rego: string; det: [string, string]; obs: [string, string] }, src: Partial<FieldSet>, bio: Partial<FieldSet>): VmRecord {
  const same: FieldSet = { name: srcName(base.name), rego: rego(base.rego), determined: person(...base.det), observed: person(...base.obs) };
  const bioBase: FieldSet = { ...same, name: bioName(base.name) };
  return { id, source, matchedOn, src: { ...same, ...src }, bio: { ...bioBase, ...bio } };
}

// ── Batches ──

// The records each batch found a difference in. Comments say what each sample is for; nothing the UI
// renders describes it (ref-domain: sample data never self-describes).
// Herbarium batches are the even numbers, SA Museum batches the odd ones.
const DIFFERENCES: Record<string, VmRecord[]> = {
  "1012": [
    // The Herbarium redetermined the specimen to a subspecies BioData has no taxon for: the name
    // needs a taxon chosen, and the determination moves with it.
    rec(
      "ADH-2024-118",
      "herbarium",
      "both",
      { name: "Eucalyptus leucoxylon", rego: "REG-5873", det: ["Phoenix Baker", "2019-03-02"], obs: ["Phoenix Baker", "2019-02-21"] },
      { name: srcName("Eucalyptus leucoxylon subsp. pruinosa", "(F.Muell. ex Miq.) Boland"), determined: person("Lana Steiner", "2026-08-14") },
      {},
    ),
    // A Rego ID mistyped in BioData, and the determination month entered wrong.
    rec(
      "REG-4421",
      "herbarium",
      "both",
      { name: "Xanthorrhoea semiplana", rego: "REG-4421", det: ["Maya Dewitt", "2021-06-11"], obs: ["Maya Dewitt", "2021-06-03"] },
      {},
      { rego: rego("REG-442"), determined: person("Maya Dewitt", "2021-01-11"), observed: person("Maya Dewitt", "2021-06-30") },
    ),
    rec(
      "AD-7712",
      "herbarium",
      "voucher",
      { name: "Eucalyptus leucoxylon", rego: "REG-3307", det: ["Lana Steiner", "2021-06-21"], obs: ["Lana Steiner", "2021-06-21"] },
      {},
      { determined: person("Lana Steiner", "2021-01-21") },
    ),
    // The name difference was ignored in batch 1010 and carries over; the rest is new.
    rec(
      "ADH-2021-044",
      "herbarium",
      "voucher",
      { name: "Xanthorrhoea semiplana", rego: "ADH-2021-044", det: ["Phoenix Baker", "2021-06-14"], obs: ["Phoenix Baker", "2021-06-09"] },
      { name: srcName("Xanthorrhoea semiplana subsp. tateana", "(F.Muell.) D.J.Bedford") },
      { rego: null, determined: person("Phoenix Baker", "2021-01-14") },
    ),
  ],
  "1011": [
    // BioData still holds an old synonym, and has no Rego ID at all.
    rec(
      "MUS-2022-310",
      "museum",
      "voucher",
      { name: "Crinia signifera", rego: "REG-5120", det: ["Olivia Wyatt", "2022-09-30"], obs: ["Olivia Wyatt", "2022-09-28"] },
      {},
      { name: bioName("Ranidella signifera"), rego: null },
    ),
    rec(
      "MUS-2023-047",
      "museum",
      "rego",
      { name: "Isoodon obesulus", rego: "REG-6018", det: ["Maya Dewitt", "2023-03-02"], obs: ["Maya Dewitt", "2023-02-18"] },
      {},
      { determined: person("Maya Dewitt", "2023-03-20") },
    ),
    rec(
      "MUS-2021-882",
      "museum",
      "both",
      { name: "Trichosurus vulpecula", rego: "REG-2290", det: ["Olivia Wyatt", "2021-11-05"], obs: ["Olivia Wyatt", "2021-11-01"] },
      {},
      { name: bioName("Didelphis vulpecula") },
    ),
  ],
  "1010": [
    rec(
      "ADH-2021-044",
      "herbarium",
      "voucher",
      { name: "Xanthorrhoea semiplana", rego: "ADH-2021-044", det: ["Phoenix Baker", "2021-06-14"], obs: ["Phoenix Baker", "2021-06-09"] },
      { name: srcName("Xanthorrhoea semiplana subsp. tateana", "(F.Muell.) D.J.Bedford") },
      {},
    ),
    rec(
      "ADH-2025-019",
      "herbarium",
      "rego",
      { name: "Eucalyptus leucoxylon", rego: "REG-7741", det: ["Lana Steiner", "2025-04-12"], obs: ["Lana Steiner", "2025-04-10"] },
      {},
      { rego: rego("REG-7714") },
    ),
    rec(
      "ADH-2022-071",
      "herbarium",
      "voucher",
      { name: "Xanthorrhoea semiplana", rego: "REG-3962", det: ["Maya Dewitt", "2022-05-19"], obs: ["Maya Dewitt", "2022-05-16"] },
      {},
      { determined: null },
    ),
  ],
  "1009": [
    rec(
      "MUS-2024-215",
      "museum",
      "both",
      { name: "Tachyglossus aculeatus", rego: "REG-6650", det: ["Phoenix Baker", "2024-10-08"], obs: ["Phoenix Baker", "2024-10-02"] },
      {},
      { determined: person("Lana Steiner", "2024-10-08") },
    ),
  ],
  "1007": [
    rec(
      "MUS-2020-133",
      "museum",
      "voucher",
      { name: "Malurus cyaneus", rego: "REG-1408", det: ["Olivia Wyatt", "2020-08-24"], obs: ["Olivia Wyatt", "2020-08-20"] },
      {},
      { rego: rego("REG-1480") },
    ),
  ],
  "1006": [
    rec(
      "ADH-2023-260",
      "herbarium",
      "both",
      { name: "Eucalyptus leucoxylon", rego: "REG-4802", det: ["Phoenix Baker", "2023-12-01"], obs: ["Phoenix Baker", "2023-11-28"] },
      {},
      { determined: person("Phoenix Baker", "2023-01-12") },
    ),
  ],
  "1005": [
    rec(
      "MUS-2019-064",
      "museum",
      "rego",
      { name: "Crinia signifera", rego: "REG-0931", det: ["Maya Dewitt", "2019-07-15"], obs: ["Maya Dewitt", "2019-07-11"] },
      {},
      { determined: person("Lana Steiner", "2019-07-15") },
    ),
  ],
  "1004": [
    rec(
      "ADH-2020-402",
      "herbarium",
      "voucher",
      { name: "Xanthorrhoea semiplana", rego: "REG-2117", det: ["Lana Steiner", "2020-10-09"], obs: ["Lana Steiner", "2020-10-06"] },
      {},
      { rego: null },
    ),
  ],
};

// Batches 1001 to 1012, a week apart (14 Jul to 29 Sep) and ending before today, alternating between the two sources.
export const BATCHES: VmBatch[] = Array.from({ length: 12 }, (_, i): VmBatch => {
  const id = String(1001 + i);
  const source: VmSource = i % 2 ? "herbarium" : "museum";
  const d = new Date(Date.UTC(2026, 6, 14 + i * 7));
  return { id, ranOn: d.toISOString().slice(0, 10), source, checked: (source === "herbarium" ? 3261 : 1532) + i * 3, records: DIFFERENCES[id] ?? [] };
}).reverse();

export const vmBatch = (id: string | undefined) => BATCHES.find((b) => b.id === id);
export const staticBatchIds = () => BATCHES.map((b) => b.id);

// Decisions already made on the older batches. The newest of each source, and Herbarium 1010, are
// left with differences to review.
export const SEED_DECISIONS: Record<string, Decision> = {
  [decisionKey("1011", "MUS-2021-882", "name")]: { kind: "pushed", value: bioName("Trichosurus vulpecula"), by: "Olivia Wyatt", at: "2026-09-24T10:20:00" },
  [decisionKey("1010", "ADH-2021-044", "name")]: { kind: "ignored", by: "Phoenix Baker", at: "2026-09-16T10:12:00", reason: "The subspecies isn't in BioData's taxonomy yet. Keep the species until Taxonomy Management adds it." },
  [decisionKey("1010", "ADH-2025-019", "rego")]: { kind: "pushed", value: rego("REG-7741"), by: "Lana Steiner", at: "2026-09-17T14:02:00" },
  [decisionKey("1009", "MUS-2024-215", "determined")]: { kind: "ignored", by: "Maya Dewitt", at: "2026-09-09T09:15:00", reason: "The museum's date is when it was catalogued, not determined. BioData has the determination." },
  [decisionKey("1007", "MUS-2020-133", "rego")]: { kind: "pushed", value: rego("REG-1408"), by: "Olivia Wyatt", at: "2026-08-26T09:40:00" },
  [decisionKey("1006", "ADH-2023-260", "determined")]: { kind: "pushed", value: person("Phoenix Baker", "2023-12-01"), by: "Maya Dewitt", at: "2026-08-19T11:05:00" },
  [decisionKey("1005", "MUS-2019-064", "determined")]: { kind: "ignored", by: "Maya Dewitt", at: "2026-08-12T11:07:00", reason: "Checked with the determiner: BioData's record is right." },
  [decisionKey("1004", "ADH-2020-402", "rego")]: { kind: "pushed", value: rego("REG-2117"), by: "Lana Steiner", at: "2026-08-05T15:30:00" },
};

// ── Records that matched ──

/**
 * The batch's records with no difference, made up from the species list so "All records" can show
 * the whole scan. Deterministic: the same batch always lists the same records.
 */
export function matchedRecords(batch: VmBatch): VmRecord[] {
  const out: VmRecord[] = [];
  const n = batch.checked - batch.records.length;
  const source = batch.source;
  for (let i = 0; i < n; i++) {
    const pool = source === "museum" ? FAUNA : FLORA;
    const s = pool[(i * 7) % pool.length];
    const year = 2015 + (i % 11);
    const month = String(1 + (i % 12)).padStart(2, "0");
    const day = String(1 + (i % 27)).padStart(2, "0");
    const who = PEOPLE[i % PEOPLE.length];
    const id = `${source === "museum" ? "MUS" : "ADH"}-${year}-${String(100 + i).padStart(4, "0")}`;
    const matchedOn: MatchKey = i % 5 === 0 ? "voucher" : i % 7 === 0 ? "rego" : "both";
    const same = { rego: rego(`REG-${String(10000 + i)}`), determined: person(who, `${year}-${month}-${day}`), observed: person(who, `${year}-${month}-${day}`) };
    out.push({ id, source, matchedOn, src: { name: srcName(s.name, s.author), ...same }, bio: { name: bioName(s.name), ...same } });
  }
  return out;
}

// ── Statuses ──

/** "noted": a field that is not updated from a scan (Observed by) and differs; shown, never decided. */
export type FieldState = "match" | "noted" | "pending" | "pushed" | "ignored";
export type RecordResult = "review" | "updated" | "ignored" | "matched";
export const RESULT_META: Record<RecordResult, { label: string; color: BadgeColors }> = {
  review: { label: "Needs review", color: "warning" },
  updated: { label: "Updated", color: "success" },
  ignored: { label: "Ignored", color: "gray" },
  matched: { label: "Matched", color: "gray" },
};

export type BatchStatus = "review" | "reviewed" | "clean";
export const BATCH_STATUS: Record<BatchStatus, { label: string; color: BadgeColors }> = {
  review: { label: "Needs review", color: "warning" },
  reviewed: { label: "Reviewed", color: "success" },
  clean: { label: "No differences", color: "gray" },
};
export const BATCH_STATUS_ORDER: BatchStatus[] = ["review", "reviewed", "clean"];

export function formatDateTime(iso: string): string {
  const [date, time = ""] = iso.split("T");
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return formatShortDate(date);
  const hour = h % 12 || 12;
  return `${formatShortDate(date)}, ${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

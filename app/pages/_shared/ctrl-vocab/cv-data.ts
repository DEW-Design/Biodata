import { NSX_SPECIES } from "@/app/pages/project-detail/field-schema";
import { formatShortDate, todayIso } from "@/app/pages/_shared/dsa/dsa-data";
import type { BadgeColors } from "@/components/base/badges/badge-types";

// Controlled Vocabulary (BRD REQ-18.1 to 18.11): a controlled set of values that forms, projects,
// dataset templates and validation rules pick from, instead of each keeping its own list. BioData
// Super Admin only (`biodata-super-admin`, the BRD's "Super Admin"; a BioData Admin has no access,
// REQ-18.1; the designer, 30 Sept 2026).
//
// Two types (REQ-18.3, 18.4):
//   reference    - the values are typed in and kept here (the Figma "Reference" grid of text inputs).
//   descriptive  - the values live in an existing database table (REQ-18.4). The vocabulary names the
//                  table, maps its columns to Code / Name / Title / Description / Value (Columns step),
//                  then picks which of the table's rows it offers, in a grid like Reference's where
//                  every cell is a search and select over that column's values (the Figma's
//                  "Create Ctrl Vocab - Descriptive"; the designer, 30 Sept 2026: "select values from
//                  dropdown very similar to reference but here the fields are not free text"). An
//                  entry keeps only the row's key; its values are read from the table each time.
//
// An entry's Status is whether users can pick it: "Available" is offered in forms' dropdowns,
// "Hidden" is not, but stays on the records that already hold it (REQ-18.5's Active and Inactive, in
// the words the admin decides with; the designer, 30 Sept 2026).
//
// Row order is display order (REQ-18.2's configured order): rows are dragged or moved into place, and
// Order is the row's position, 1, 2, 3 down the list, so there is one control for it, not two (the
// designer, 30 Sept 2026: "Order must be the order in which the options are shown - this must be tied
// to the row order").
//
// Nothing is ever deleted (REQ-18.6): a vocabulary is archived, an entry is hidden, and IDs and
// codes are never reused. Every change is written to the vocabulary's own history (REQ-18.11).

/** Where Controlled Vocabulary lives. */
export const CV_ROOT = "/pages/ctrl-vocab";

export type CvType = "reference" | "descriptive";

/** What is stored. "Scheduled" and "archived by end date" are worked out from the dates (see cvStatus). */
export type CvState = "draft" | "published" | "archived";

/** What is shown: the Figma list's four buckets (Active, Scheduled, Drafts, Archived). */
export type CvStatus = "draft" | "scheduled" | "active" | "archived";

export type EntryStatus = "active" | "inactive";

export type StandardField = "code" | "name" | "title" | "description" | "value" | "order";

/**
 * What identifies an entry (the designer, Sept 30 2026: "the code column can be code or No"):
 *   code    typed in by the admin (CCBY, IMG, ...), unique within the vocabulary
 *   number  "ID", filled in automatically on a new row (1, 2, 3 ...), one past the highest in use, and
 *           editable like any field (the designer, 30 Sept 2026: "ID must be an editable field. It
 *           does get auto-generated on creation but when dragged it will remain the same"). It is not
 *           the order: records keep the ID, so moving a row never changes it, while Order is the row's
 *           place in the list and changes with every move. The grid shows the ID right after Order. The BRD's Measurement example is numbered this way.
 * Fixed once the vocabulary is live: records keep the identifier, not the name.
 */
export type IdentifierKind = "code" | "number";

export const identifierLabel = (kind: IdentifierKind | undefined) => (kind === "number" ? "ID" : "Code");

export const cvTypeLabel: Record<CvType, string> = { reference: "Reference", descriptive: "Descriptive" };

export const cvStatusMeta: Record<CvStatus, { label: string; badgeColor: BadgeColors }> = {
  draft: { label: "Draft", badgeColor: "gray" },
  scheduled: { label: "Scheduled", badgeColor: "brand" },
  active: { label: "Active", badgeColor: "success" },
  archived: { label: "Archived", badgeColor: "gray" },
};

export const cvStatusOrder: CvStatus[] = ["active", "scheduled", "draft", "archived"];

/** Whether users can pick the entry in a form's dropdown. */
export const entryStatusMeta: Record<EntryStatus, { label: string; badgeColor: BadgeColors }> = {
  active: { label: "Available", badgeColor: "success" },
  inactive: { label: "Hidden", badgeColor: "gray" },
};

/** The standard fields, in the Figma's column order. Code and Name are always used (the Figma notes mark both mandatory). */
export const STANDARD_FIELDS: { id: StandardField; label: string; required?: boolean }[] = [
  { id: "code", label: "Code", required: true },
  { id: "name", label: "Name", required: true },
  { id: "title", label: "Title" },
  { id: "description", label: "Description" },
  { id: "value", label: "Value" },
  // The row's place in the list (see withDerivedOrder), shown as a column when chosen. Rows keep
  // their order either way: without the column they are still moved by drag or the row menu.
  { id: "order", label: "Order" },
];

/**
 * The columns a vocabulary chooses, in the order the Columns step lists them: Order first, as it
 * leads the grid. Code (or ID) and Name are always there.
 */
export const OPTIONAL_FIELDS: StandardField[] = ["order", "title", "description", "value"];

/** The standard columns a vocabulary shows, in column order. */
export const shownFields = (d: Pick<Cv, "fields">) => STANDARD_FIELDS.filter((f) => f.required || d.fields.includes(f.id));

/** REQ-18.2: "a maximum of 5 custom fields". */
export const MAX_CUSTOM_COLUMNS = 5;

export interface CvCustomColumn {
  id: string;
  label: string;
}

export interface CvEntry {
  id: string;
  code: string;
  name: string;
  title: string;
  description: string;
  value: string;
  order: string;
  status: EntryStatus;
  /** Custom column id -> text (REQ-18.3: custom columns on a Reference vocabulary are text). */
  custom: Record<string, string>;
  /** Descriptive only: the key of the source table row this entry offers. Its values are read from the row. */
  sourceKey?: string;
}

export interface CvChange {
  field: string;
  from: string;
  to: string;
}

/**
 * One template download. The template goes out to the people who fill it in and comes back
 * later; until its filled copy is uploaded (or the admin stops waiting for it), the vocabulary is
 * "waiting for a template", and the list and the vocabulary's page lead back to it.
 */
export interface CvTemplateHandout {
  /** "T1", "T2" ... per vocabulary, written into the file so the upload finds its way back. */
  id: string;
  downloadedAt: string;
  by: string;
  returnedAt?: string;
  closedAt?: string;
}

export const openHandouts = (cv: Pick<Cv, "templates">) => (cv.templates ?? []).filter((t) => !t.returnedAt && !t.closedAt);

export interface CvAuditEvent {
  /** ISO date and time. */
  at: string;
  by: string;
  action: string;
  changes?: CvChange[];
}

export interface Cv {
  /** System-generated, never reused (REQ-18.1). */
  id: string;
  name: string;
  category: string;
  type: CvType;
  /** Missing on records saved before Code or ID existed: read as "code". */
  idKind?: IdentifierKind;
  state: CvState;
  startDate: string;
  endDate: string;
  description: string;
  /** Which optional standard fields this vocabulary uses (Code and Name always are). */
  fields: StandardField[];
  customColumns: CvCustomColumn[];
  /** Reference: the values. Descriptive: the source rows offered, by key. In display order. */
  entries: CvEntry[];
  /** Descriptive only: the source table's id. */
  sourceTable: string;
  /** Descriptive only: field id (standard or custom) -> the source columns it reads, in order. More than one column is combined. */
  mapping: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
  history: CvAuditEvent[];
  /** Template downloads, oldest first. */
  templates?: CvTemplateHandout[];
}

export type CvDraft = Omit<Cv, "id" | "state" | "createdAt" | "updatedAt" | "history" | "templates">;

// ── Status ──

/** Draft, Archived (by hand, or because the end date has passed), Scheduled (published with a start date still ahead), or Active. */
export function cvStatus(cv: Pick<Cv, "state" | "startDate" | "endDate">, today = todayIso()): CvStatus {
  if (cv.state === "draft") return "draft";
  if (cv.state === "archived") return "archived";
  if (cv.endDate && cv.endDate < today) return "archived";
  if (cv.startDate && cv.startDate > today) return "scheduled";
  return "active";
}

/** True when the vocabulary archived itself because its end date passed (REQ-18.5: reactivated by extending the end date). */
export function archivedByEndDate(cv: Cv, today = todayIso()): boolean {
  return cv.state === "published" && !!cv.endDate && cv.endDate < today;
}

// ── Source tables (Descriptive) ──

export interface SourceColumn {
  id: string;
  label: string;
}

export interface SourceTable {
  id: string;
  label: string;
  /** The column that identifies a row: what a Descriptive entry keeps. */
  key: string;
  columns: SourceColumn[];
  rows: Record<string, string>[];
}

// The real database tables and their column identifiers were not supplied, so each table here is
// named by what it holds, and the form shows the rest as a gap until the real list arrives.
//   Taxonomy       the table the BRD names (REQ-18.4: "common name, scientific name and NSX code from
//                  taxonomy table"). Its rows are this build's existing species list (NSX_SPECIES,
//                  used by survey records), not new ones: no NSX code is invented here.
//   IBRA regions   the published IBRA 7 bioregions that fall in South Australia, with their codes
//                  (Interim Biogeographic Regionalisation for Australia, version 7, Australian
//                  Government). Codes as published; to be checked against the BDBSA table.
export const SOURCE_TABLES: SourceTable[] = [
  {
    id: "taxonomy",
    label: "Taxonomy",
    key: "nsx",
    columns: [
      { id: "nsx", label: "NSX code" },
      { id: "scientific", label: "Scientific name" },
      { id: "common", label: "Common name" },
    ],
    rows: NSX_SPECIES.map((s) => ({ nsx: s.nsx, scientific: s.scientific, common: s.common, kingdom: s.kingdom })),
  },
  {
    id: "ibra",
    label: "IBRA regions",
    key: "code",
    columns: [
      { id: "code", label: "IBRA code" },
      { id: "name", label: "Region name" },
    ],
    rows: [
      ["BHC", "Broken Hill Complex"],
      ["CER", "Central Ranges"],
      ["CHC", "Channel Country"],
      ["EYB", "Eyre Yorke Block"],
      ["FIN", "Finke"],
      ["FLB", "Flinders Lofty Block"],
      ["GAW", "Gawler"],
      ["GVD", "Great Victoria Desert"],
      ["HAM", "Hampton"],
      ["KAN", "Kanmantoo"],
      ["MDD", "Murray Darling Depression"],
      ["NCP", "Naracoorte Coastal Plain"],
      ["NUL", "Nullarbor"],
      ["RIV", "Riverina"],
      ["SSD", "Simpson Strzelecki Dunefields"],
      ["STP", "Stony Plains"],
    ].map(([code, name]) => ({ code, name })),
  },
];

export const sourceTable = (id: string) => SOURCE_TABLES.find((t) => t.id === id);

export function columnLabel(tableId: string, columnId: string): string {
  return sourceTable(tableId)?.columns.find((c) => c.id === columnId)?.label ?? columnId;
}

/** The mapped value for one source row: the mapped columns' values joined, as REQ-18.4's "NSX Code + Common Name + Scientific Name". */
export function mappedValue(row: Record<string, string>, columns: string[] | undefined): string {
  return (columns ?? []).map((c) => row[c]).filter(Boolean).join(" · ");
}

/** A Descriptive entry's source row, by its key. */
export function sourceRow(tableId: string, key: string | undefined): Record<string, string> | undefined {
  const table = sourceTable(tableId);
  return key && table ? table.rows.find((row) => row[table.key] === key) : undefined;
}

/** A Descriptive entry with its values read from its source row through the mapping; a Reference entry as it is. */
export function resolveEntry(cv: Pick<Cv, "type" | "sourceTable" | "mapping" | "customColumns">, entry: CvEntry): CvEntry {
  if (cv.type === "reference") return entry;
  const row = sourceRow(cv.sourceTable, entry.sourceKey);
  if (!row) return { ...entry, code: "", name: "", title: "", description: "", value: "" };
  return {
    ...entry,
    code: mappedValue(row, cv.mapping.code),
    name: mappedValue(row, cv.mapping.name),
    title: mappedValue(row, cv.mapping.title),
    description: mappedValue(row, cv.mapping.description),
    value: mappedValue(row, cv.mapping.value),
    custom: Object.fromEntries(cv.customColumns.map((c) => [c.id, mappedValue(row, cv.mapping[c.id])])),
  };
}

/** Every value a vocabulary offers, in display order, whatever its type. */
export function resolvedEntries(cv: Pick<Cv, "type" | "entries" | "sourceTable" | "mapping" | "customColumns">): CvEntry[] {
  return withDerivedOrder(cv.entries.map((e) => resolveEntry(cv, e)));
}

/** Row order is display order (REQ-18.2's configured order); kept for callers that ask for "sorted". */
export function sortEntries(entries: CvEntry[]): CvEntry[] {
  return entries;
}

/** Order is the row's position: 1, 2, 3 down the list, the order users see the values in. */
export function withDerivedOrder(entries: CvEntry[]): CvEntry[] {
  return entries.map((e, i) => ({ ...e, order: String(i + 1) }));
}

// ── IDs ──

let uid = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`;

/** The next ID: one past the highest ever issued. Vocabularies are never deleted, so an ID is never reused (REQ-18.1). */
export function nextCvId(existing: Cv[]): string {
  const highest = existing.reduce((max, cv) => Math.max(max, Number(cv.id.split("-")[1]) || 0), 0);
  return `BIODATA-${String(highest + 1).padStart(3, "0")}`;
}

/** For the static export: every seed id plus the next ones a new vocabulary would get. */
export function staticCvIds(count = 50): string[] {
  const highest = seedCvs.reduce((max, cv) => Math.max(max, Number(cv.id.split("-")[1]) || 0), 0);
  return [...seedCvs.map((cv) => cv.id), ...Array.from({ length: count }, (_, i) => `BIODATA-${String(highest + 1 + i).padStart(3, "0")}`)];
}

// ── Dates ──

export function nowIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "19 Aug 2026, 10:12". */
export function formatDateTime(iso: string): string {
  const [date, time] = iso.split("T");
  return time ? `${formatShortDate(date)}, ${time.slice(0, 5)}` : formatShortDate(date);
}

export { formatShortDate, todayIso };

// ── Drafts ──

/** The next ID for a numbered vocabulary: one past the highest in use (entries are never deleted once saved, so none is reused). */
export function nextNumber(entries: CvEntry[]): string {
  return String(entries.reduce((max, e) => Math.max(max, Number(e.code) || 0), 0) + 1);
}

export const emptyEntry = (): CvEntry => ({ id: newId("entry"), code: "", name: "", title: "", description: "", value: "", order: "", status: "active", custom: {} });

export function emptyCvDraft(): CvDraft {
  return {
    name: "",
    category: "",
    type: "reference",
    idKind: "code",
    startDate: todayIso(),
    endDate: "",
    description: "",
    fields: [...OPTIONAL_FIELDS],
    customColumns: [],
    entries: [emptyEntry()],
    sourceTable: "",
    mapping: {},
  };
}

export function draftOf(cv: Cv): CvDraft {
  const { name, category, type, startDate, endDate, description, fields, customColumns, entries, sourceTable: table, mapping } = cv;
  return structuredClone({ name, category, type, idKind: cv.idKind ?? "code", startDate, endDate, description, fields, customColumns, entries, sourceTable: table, mapping });
}

// ── Validation (REQ-18.3, 18.7) ──

export type CvSection = "details" | "columns" | "values";
export type CvErrors = Record<string, string>;

export function errorSection(path: string): CvSection {
  if (path.startsWith("custom.") || path.startsWith("map.") || path === "columns") return "columns";
  if (path.startsWith("entry.") || path === "entries") return "values";
  return "details";
}

const norm = (v: string) => v.trim().toLowerCase();

/**
 * A draft only needs its name (what identifies it); publishing checks the rest. Messages name the
 * thing to fix (REQ-18.7: "clear validation messages identifying the information that must be
 * corrected").
 */
export function validateCv(draft: CvDraft, intent: "draft" | "publish", all: Cv[], selfId?: string): CvErrors {
  const errors: CvErrors = {};
  const others = all.filter((cv) => cv.id !== selfId);

  if (!draft.name.trim()) errors.name = "Vocabulary name";
  else if (others.some((cv) => norm(cv.name) === norm(draft.name))) errors.name = "Vocabulary name is already used by another vocabulary";
  if (intent === "draft") return errors;

  if (!draft.category.trim()) errors.category = "Category name";
  if (!draft.startDate) errors.startDate = "Start date";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) errors.endDate = "End date must be on or after the start date";
  if (draft.type === "descriptive" && !draft.sourceTable) errors.sourceTable = "Source table";

  // Custom columns: a label each, unique within this vocabulary and not a standard field's name.
  const labels = new Set(STANDARD_FIELDS.map((f) => norm(f.label)).concat("status"));
  for (const column of draft.customColumns) {
    const label = norm(column.label);
    if (!label) errors[`custom.${column.id}`] = "Custom column name";
    else if (labels.has(label)) errors[`custom.${column.id}`] = `Custom column "${column.label.trim()}" is already a column`;
    labels.add(label);
  }

  if (draft.type === "descriptive") {
    if (!draft.sourceTable) return errors;
    if (!draft.mapping.code?.length) errors["map.code"] = "Code column";
    if (!draft.mapping.name?.length) errors["map.name"] = "Name column";
    // Entries: each picks a row; a row once; and the mapped codes stay unique (REQ-18.4).
    if (draft.entries.length === 0) errors.entries = "At least one entry";
    const keys = new Map<string, number>();
    const codes = new Map<string, number>();
    draft.entries.forEach((entry, i) => {
      const n = i + 1;
      if (!entry.sourceKey) return void (errors[`entry.${entry.id}.source`] = `A value in row ${n}`);
      if (keys.has(entry.sourceKey)) errors[`entry.${entry.id}.source`] = `Row ${n} repeats row ${keys.get(entry.sourceKey)}`;
      else keys.set(entry.sourceKey, n);
      const code = norm(resolveEntry(draft, entry).code);
      if (code && codes.has(code) && !errors[`entry.${entry.id}.source`]) errors[`entry.${entry.id}.source`] = `Row ${n} has the same code as row ${codes.get(code)}`;
      else codes.set(code, n);
    });
    return errors;
  }

  // Reference entries: Code and Name required, Code unique (inactive entries included, so a code is
  // never reused - REQ-18.6), and no two entries identical (REQ-18.2: "prevent duplicate entries").
  if (draft.entries.length === 0) errors.entries = "At least one entry";
  const codes = new Map<string, string>();
  const rows = new Map<string, string>();
  const idLabel = identifierLabel(draft.idKind);
  // A numbered vocabulary names its rows by ID ("ID 3"); a coded one by position ("row 3").
  const where = (entry: CvEntry, i: number) => (draft.idKind === "number" && entry.code.trim() ? `ID ${entry.code.trim()}` : `row ${i + 1}`);
  draft.entries.forEach((entry, i) => {
    const at = where(entry, i);
    if (!entry.code.trim()) errors[`entry.${entry.id}.code`] = `${idLabel} in ${at}`;
    else if (draft.idKind === "number" && !/^[1-9]\d*$/.test(entry.code.trim())) errors[`entry.${entry.id}.code`] = `ID "${entry.code.trim()}" must be a whole number`;
    else if (codes.has(norm(entry.code))) errors[`entry.${entry.id}.code`] = `${idLabel} "${entry.code.trim()}" in ${at} is already used in ${codes.get(norm(entry.code))}`;
    else codes.set(norm(entry.code), at);
    if (!entry.name.trim()) errors[`entry.${entry.id}.name`] = `Name in ${at}`;
    const signature = [entry.name, entry.title, entry.value, ...draft.customColumns.map((c) => entry.custom[c.id] ?? "")].map(norm).join("|");
    if (entry.name.trim() && rows.has(signature)) errors[`entry.${entry.id}.name`] = `${at[0].toUpperCase()}${at.slice(1)} repeats ${rows.get(signature)}`;
    else rows.set(signature, at);
  });
  return errors;
}

// ── Change log (REQ-18.11: previous and updated values) ──

const show = (v: string) => (v.trim() ? v.trim() : "Not provided");

export function diffCv(before: CvDraft, after: CvDraft): CvChange[] {
  const changes: CvChange[] = [];
  const scalar = (field: string, a: string, b: string) => {
    if (a !== b) changes.push({ field, from: show(a), to: show(b) });
  };
  scalar("Vocabulary name", before.name, after.name);
  scalar("Category", before.category, after.category);
  scalar("Identifier", identifierLabel(before.idKind), identifierLabel(after.idKind));
  scalar("Start date", before.startDate ? formatShortDate(before.startDate) : "", after.startDate ? formatShortDate(after.startDate) : "");
  scalar("End date", before.endDate ? formatShortDate(before.endDate) : "", after.endDate ? formatShortDate(after.endDate) : "");
  scalar("Short description", before.description, after.description);
  const fieldList = (d: CvDraft) => shownFields(d).map((f) => f.label).join(", ");
  scalar("Columns", fieldList(before), fieldList(after));
  scalar("Custom columns", before.customColumns.map((c) => c.label).join(", "), after.customColumns.map((c) => c.label).join(", "));
  scalar("Source table", sourceTable(before.sourceTable)?.label ?? "", sourceTable(after.sourceTable)?.label ?? "");
  const mappingText = (d: CvDraft) =>
    Object.entries(d.mapping)
      .filter(([, cols]) => cols.length)
      .map(([field, cols]) => `${STANDARD_FIELDS.find((f) => f.id === field)?.label ?? d.customColumns.find((c) => c.id === field)?.label ?? field}: ${cols.map((c) => columnLabel(d.sourceTable, c)).join(" + ")}`)
      .join("; ");
  scalar("Column mapping", mappingText(before), mappingText(after));

  const beforeById = new Map(before.entries.map((e) => [e.id, resolveEntry(before, e)]));
  for (const raw of after.entries) {
    const entry = resolveEntry(after, raw);
    const prev = beforeById.get(entry.id);
    const label = `Entry ${after.idKind === "number" ? "ID " : ""}${show(entry.code)}`;
    if (!prev) {
      changes.push({ field: label, from: "Not provided", to: [entry.name, entry.title, entry.value].filter((v) => v.trim()).join(" · ") || "Added" });
      continue;
    }
    for (const f of STANDARD_FIELDS) if (f.id !== "order") scalar(`${label} · ${f.label}`, prev[f.id], entry[f.id]);
    scalar(`${label} · Available to users`, entryStatusMeta[prev.status].label, entryStatusMeta[entry.status].label);
    for (const c of after.customColumns) scalar(`${label} · ${c.label}`, prev.custom[c.id] ?? "", entry.custom[c.id] ?? "");
  }
  // Rows moved: the order of the entries that were already there, before and after.
  const kept = new Set(after.entries.map((e) => e.id));
  const orderOf = (d: CvDraft) => d.entries.filter((e) => kept.has(e.id) && beforeById.has(e.id)).map((e) => resolveEntry(d, e).code || resolveEntry(d, e).name).join(", ");
  scalar("Row order", orderOf(before), orderOf(after));
  return changes;
}

// ── Seeds ──

// Placeholder people only (CONTRACTS 0.3). The acting admin in this preview is Olivia Wyatt
// (agreement-scope.tsx's CURRENT_USER_NAME).
const CREATED_BY = "Phoenix Baker";
const EDITED_BY = "Lana Steiner";

const entry = (code: string, name: string, extra: Partial<CvEntry> = {}): CvEntry => ({
  id: `seed-${code}-${name}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
  code,
  name,
  title: "",
  description: "",
  value: "",
  order: "",
  status: "active",
  custom: {},
  ...extra,
});

/** Numbered entries (ID 1, 2, 3 ...), for lists with no published code set. */
const numbered = (names: (string | [string, Partial<CvEntry>])[]): CvEntry[] =>
  names.map((n, i) => (typeof n === "string" ? entry(String(i + 1), n) : entry(String(i + 1), n[0], n[1])));

/** Descriptive entries: the source rows offered, by key. */
const rowsOf = (keys: string[]): CvEntry[] => keys.map((key) => ({ ...entry(key, ""), id: `seed-row-${key.toLowerCase()}`, sourceKey: key }));

const base = (partial: Partial<Cv> & Pick<Cv, "id" | "name" | "category" | "type" | "state" | "startDate" | "createdAt">): Cv => ({
  idKind: "code",
  templates: [],
  endDate: "",
  description: "",
  customColumns: [],
  entries: [],
  sourceTable: "",
  mapping: {},
  updatedAt: partial.createdAt,
  history: [{ at: `${partial.createdAt}T09:30`, by: CREATED_BY, action: partial.state === "draft" ? "Saved as draft" : "Created" }],
  ...partial,
  // Every sample shows Order: they were made when it was always shown.
  fields: ["order", ...(partial.fields ?? [])],
});

// Sample vocabularies, as close to real as published sources allow (the designer, 30 Sept 2026:
// "Come up with as much close real data as possible"). Each list's source is named beside it. Where
// a list has no published code set, it is numbered (ID) rather than given invented codes. Names are
// what the admin would call them, not database codes. IDs start at 101 so they never collide with a
// vocabulary created in this browser before these seeds replaced the Figma's names.
export const seedCvs: Cv[] = [
  // Survey trap and capture methods used in South Australian fauna surveys. Numbered: no published codes.
  base({
    id: "BIODATA-101",
    name: "Trap type",
    category: "Survey methods",
    type: "reference",
    idKind: "number",
    state: "published",
    startDate: "2026-08-19",
    createdAt: "2026-08-19",
    description: "How an animal was captured or detected during a survey.",
    fields: ["description"],
    entries: numbered([
      ["Pitfall trap", { description: "A buried container, usually with a drift fence." }],
      ["Elliott trap", { description: "Aluminium box trap for small mammals." }],
      ["Cage trap", { description: "Wire cage trap for medium-sized mammals." }],
      ["Funnel trap", { description: "Mesh funnel trap along a drift fence, for reptiles." }],
      ["Harp trap", { description: "Strung frame that catches bats in flight." }],
      ["Mist net", { description: "Fine net for birds and bats." }],
      ["Camera trap", { description: "Motion-triggered camera." }],
      ["Hair tube", { description: "Collects hair for identification." }],
    ]),
  }),
  // Planned: goes live on 15 Oct 2026. The 20-minute, 2-hectare search is BirdLife Australia's standard bird survey.
  base({
    id: "BIODATA-102",
    name: "Survey method",
    category: "Survey methods",
    type: "reference",
    idKind: "number",
    state: "published",
    startDate: "2026-10-15",
    createdAt: "2026-09-24",
    entries: numbered(["Active search", "Spotlighting", "Bird survey, 20 minutes in 2 hectares", "Bird survey, 500 metre area search", "Call playback", "Opportunistic sighting"]),
  }),
  // Geodetic datums used in Australia, with their EPSG codes. AGD66 and AGD84 are legacy: hidden, so
  // they stay on old records but can't be picked for new ones.
  base({
    id: "BIODATA-103",
    name: "Datum",
    category: "Location",
    type: "reference",
    state: "published",
    startDate: "2026-08-20",
    createdAt: "2026-08-20",
    description: "The geodetic datum a record's coordinates were captured in.",
    fields: ["title", "value"],
    entries: [
      entry("GDA2020", "Geocentric Datum of Australia 2020", { title: "Current", value: "EPSG:7844" }),
      entry("GDA94", "Geocentric Datum of Australia 1994", { title: "Superseded", value: "EPSG:4283" }),
      entry("WGS84", "World Geodetic System 1984", { title: "GPS default", value: "EPSG:4326" }),
      entry("AGD84", "Australian Geodetic Datum 1984", { title: "Legacy", value: "EPSG:4203", status: "inactive" }),
      entry("AGD66", "Australian Geodetic Datum 1966", { title: "Legacy", value: "EPSG:4202", status: "inactive" }),
    ],
  }),
  // How a location was worked out. Numbered: no published codes. Archived by its end date passing.
  base({
    id: "BIODATA-104",
    name: "Location method",
    category: "Location",
    type: "reference",
    idKind: "number",
    state: "published",
    startDate: "2026-01-12",
    endDate: "2026-06-30",
    createdAt: "2026-01-12",
    entries: numbered(["GPS", "Differential GPS", "Topographic map", "Aerial photograph", "Georeferenced from locality description"]),
  }),
  // The IBRA 7 bioregions in South Australia, read from the IBRA regions table.
  base({
    id: "BIODATA-105",
    name: "IBRA region",
    category: "Location",
    type: "descriptive",
    state: "published",
    startDate: "2026-08-22",
    createdAt: "2026-08-22",
    description: "The bioregion a site falls in.",
    sourceTable: "ibra",
    mapping: { code: ["code"], name: ["name"] },
    entries: rowsOf(["FLB", "KAN", "EYB", "MDD", "NCP", "GAW", "NUL", "STP", "SSD", "CHC", "BHC", "GVD", "CER", "FIN", "HAM", "RIV"]),
  }),
  // Darwin Core basisOfRecord, the standard's recommended values (TDWG).
  base({
    id: "BIODATA-106",
    name: "Basis of record",
    category: "Occurrence",
    type: "reference",
    state: "published",
    startDate: "2026-08-25",
    createdAt: "2026-08-25",
    description: "The kind of evidence a record is based on (Darwin Core basisOfRecord).",
    entries: [
      entry("HumanObservation", "Human observation"),
      entry("MachineObservation", "Machine observation"),
      entry("PreservedSpecimen", "Preserved specimen"),
      entry("LivingSpecimen", "Living specimen"),
      entry("MaterialSample", "Material sample"),
      entry("FossilSpecimen", "Fossil specimen"),
    ],
  }),
  // Darwin Core occurrenceStatus, the standard's recommended values.
  base({
    id: "BIODATA-107",
    name: "Occurrence status",
    category: "Occurrence",
    type: "reference",
    state: "published",
    startDate: "2026-08-25",
    createdAt: "2026-08-25",
    entries: [entry("present", "Present"), entry("absent", "Absent")],
  }),
  // Still being set up. Numbered: no published codes.
  base({
    id: "BIODATA-108",
    name: "Life stage",
    category: "Occurrence",
    type: "reference",
    idKind: "number",
    state: "draft",
    startDate: "2026-10-01",
    createdAt: "2026-09-28",
    entries: numbered(["Adult", "Subadult", "Juvenile", "Egg"]),
  }),
  // Environment Protection and Biodiversity Conservation Act 1999 (Cth), s178 categories and their usual abbreviations.
  base({
    id: "BIODATA-109",
    name: "EPBC Act status",
    category: "Conservation status",
    type: "reference",
    state: "published",
    startDate: "2026-08-28",
    createdAt: "2026-08-28",
    description: "Threatened species category under the Commonwealth EPBC Act.",
    entries: [
      entry("EX", "Extinct"),
      entry("EW", "Extinct in the wild"),
      entry("CR", "Critically Endangered"),
      entry("EN", "Endangered"),
      entry("VU", "Vulnerable"),
      entry("CD", "Conservation Dependent"),
    ],
  }),
  // National Parks and Wildlife Act 1972 (SA): Schedules 7, 8 and 9.
  base({
    id: "BIODATA-110",
    name: "SA NPW Act status",
    category: "Conservation status",
    type: "reference",
    state: "published",
    startDate: "2026-08-28",
    createdAt: "2026-08-28",
    description: "Threatened species status under South Australia's National Parks and Wildlife Act.",
    fields: ["title"],
    entries: [entry("E", "Endangered", { title: "Schedule 7" }), entry("V", "Vulnerable", { title: "Schedule 8" }), entry("R", "Rare", { title: "Schedule 9" })],
  }),
  // Creative Commons licences, by their SPDX identifiers.
  base({
    id: "BIODATA-111",
    name: "Data licence",
    category: "Licensing and media",
    type: "reference",
    state: "published",
    startDate: "2026-08-19",
    createdAt: "2026-08-19",
    fields: ["title"],
    entries: [
      entry("CC-BY-4.0", "Creative Commons Attribution 4.0", { title: "CC BY 4.0" }),
      entry("CC-BY-NC-4.0", "Creative Commons Attribution Non-Commercial 4.0", { title: "CC BY-NC 4.0" }),
      entry("CC0-1.0", "Creative Commons Zero, public domain dedication", { title: "CC0 1.0" }),
    ],
  }),
  // Dublin Core type vocabulary, as used by Audubon Core for media.
  base({
    id: "BIODATA-112",
    name: "Media type",
    category: "Licensing and media",
    type: "reference",
    state: "published",
    startDate: "2026-08-21",
    createdAt: "2026-08-21",
    entries: [entry("StillImage", "Photograph or image"), entry("Sound", "Sound recording"), entry("MovingImage", "Video"), entry("Text", "Document")],
  }),
  // The real BDBSA partners (.claude/rules/ref-domain.md). Numbered: no published codes.
  base({
    id: "BIODATA-113",
    name: "Data partner",
    category: "Organisations",
    type: "reference",
    idKind: "number",
    state: "published",
    startDate: "2026-08-25",
    createdAt: "2026-08-25",
    entries: numbered(["Department for Environment and Water", "BirdLife Australia", "Birds SA", "South Australian Museum"]),
  }),
  // The BRD's own worked example (REQ-18.2), row for row: numbered 1 to 8, ordered within each name.
  base({
    id: "BIODATA-114",
    name: "Measurement",
    category: "Measurements",
    type: "reference",
    idKind: "number",
    state: "published",
    startDate: "2026-09-01",
    createdAt: "2026-09-01",
    updatedAt: "2026-09-18",
    fields: ["title", "value"],
    entries: withDerivedOrder([
      entry("1", "Tree Height", { title: "Range 1", value: "0m to 10m" }),
      entry("2", "Tree Height", { title: "Range 2", value: "10m to 15m" }),
      entry("3", "Tree Height", { title: "Range 3", value: "15m to 20m" }),
      entry("4", "Tree Height", { title: "Range 4", value: "20m to 25m" }),
      entry("5", "Crown Diameter", { title: "Range 1", value: "0m to 5m" }),
      entry("6", "Crown Diameter", { title: "Range 2", value: "5m to 10m" }),
      entry("7", "Crown Diameter", { title: "Range 3", value: "10m to 15m" }),
      entry("8", "Crown Diameter", { title: "Range 4", value: "15m to 20m" }),
    ]),
    history: [
      { at: "2026-09-01T09:30", by: CREATED_BY, action: "Created" },
      { at: "2026-09-18T14:05", by: EDITED_BY, action: "Edited", changes: [{ field: "Entry ID 8 · Value", from: "15m to 25m", to: "15m to 20m" }] },
    ],
  }),
  // Species from the Taxonomy table (REQ-18.4's example): NSX code, common name, scientific name.
  base({
    id: "BIODATA-115",
    name: "Fauna species",
    category: "Taxonomy",
    type: "descriptive",
    state: "published",
    startDate: "2026-08-28",
    createdAt: "2026-08-28",
    fields: ["title"],
    sourceTable: "taxonomy",
    mapping: { code: ["nsx"], name: ["common"], title: ["scientific"] },
    entries: rowsOf(NSX_SPECIES.filter((sp) => sp.kingdom === "Fauna").map((sp) => sp.nsx)),
  }),
  base({
    id: "BIODATA-116",
    name: "Flora species",
    category: "Taxonomy",
    type: "descriptive",
    state: "published",
    startDate: "2026-09-02",
    createdAt: "2026-09-02",
    fields: ["title"],
    sourceTable: "taxonomy",
    mapping: { code: ["nsx"], name: ["common"], title: ["scientific"] },
    entries: rowsOf(NSX_SPECIES.filter((sp) => sp.kingdom === "Flora").map((sp) => sp.nsx)),
  }),
];

/** The first seeds (the Figma's vocabulary names, BIODATA-001 to 011), retired by the store's migration. */
export const RETIRED_SEED_IDS = Array.from({ length: 11 }, (_, i) => `BIODATA-${String(i + 1).padStart(3, "0")}`);

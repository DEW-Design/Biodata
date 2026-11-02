// Imported by `_shared/dataset-upload/file-facts.ts` (Add Project option 2's Dataset step) and by the Data ingestion stress test page (`/pages/data-ingestion-stress-test`, a lab until 27 Oct 2026). The pure half of
// multi-tab ingestion: reading every sheet of a workbook, working out what each tab holds, and the
// column-name conventions a tab uses to point at another tab's records. No React, no records - the
// page owns `ParsedRecord` and the linking pass that uses these helpers.
//
// Per the user directly: "If I insert an excel file that has the structure present but split in
// different tabs, the ingestion model needs to be smart enough to pick up, link and create the tree
// structure accordingly." Three separate jobs, in this order:
// 1. **Pick up** - every non-empty tab is read (the tool used to read only the first), with the
//    header row found even when a title line or blank rows sit above it (`gridToRows`).
// 2. **Work out what each tab is** - `classifySource`: the tab's own Kind column wins; then the tab
//    name ("Sites", "Visit data", "Species Flora"), then the file name for a one-tab file, then the
//    columns it carries (`columnSignature`). The same word rules read a file name, so the existing
//    "starts with site/visit/species" convention keeps working and now also matches "1211_Site.csv".
// 3. **Link** - a tab points at another tab's records by a key column ("Site ID" on a Visit tab,
//    "Visit ID" on a species tab); `findReferenceColumns` / `findOwnIdColumn` name the conventions,
//    `linkByReference` in the page resolves them.
//
// Everything is derived from the schema already in `config/data-model-schema.ts` (the field lists
// and the BDBSA crosswalk) plus the header names the page already reads (NSX code, Number
// Observed, Taxonomic Type). No new field names are invented here.

import { read as readWorkbook, utils as sheetUtils } from "xlsx";
import { BDBSA_KEY_CROSSWALK, FIELD_SCHEMA, type TaxonomicType } from "@/config/data-model-schema";

export type RawRow = Record<string, string>;

// Case/spacing-insensitive header matching, so "Parent ID", "parent_id", and "ParentId" all
// resolve to the same structural (or schema) field - real-world spreadsheets are never perfectly
// consistent. A slash is dropped too: BDBSA's own SITE tab heads its key columns "Camp/Map",
// "Quad/Site" and "Patch/Quad".
const normalizedHeaders = new Map<string, string>();

export function normalizeHeader(s: string): string {
  let out = normalizedHeaders.get(s);
  if (out === undefined) {
    out = s.toLowerCase().replace(/[\s_/-]/g, "");
    normalizedHeaders.set(s, out);
  }
  return out;
}

export function findColumn(row: RawRow, candidates: string[]): string | null {
  const normalizedCandidates = candidates.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    if (normalizedCandidates.includes(normalizeHeader(key))) return key;
  }
  return null;
}

// ── 1. Pick up: every tab, header row found ──

export interface SheetRows {
  sheetName: string;
  rows: RawRow[];
  // Every cell as trimmed text, rows by columns, for a tab that is a form rather than a table (see
  // `template-ingest.ts`). Empty for a hidden tab, which is not read.
  grid: string[][];
  // A hidden tab is a lookup (a species list, an observer list) by convention. It is listed in the
  // tab report and left out, never ingested.
  hidden: boolean;
  // Data rows in the tab's used range, so a hidden tab that is not read can still show a size.
  rowCount: number;
  // Sheet protection is on ("locked"). In these templates it covers the entry sheets too (the input
  // cells are unlocked), so it is not "admin only" by itself; the page decides what to do with it.
  locked: boolean;
  // The share of the tab's filled cells that are formulas, 0 to 1. A tab that is nearly all formulas
  // is calculated by the template from other tabs, not entered.
  formulaShare: number;
}

// Is this a workbook the reader can open? Macro-enabled (.xlsm) and template (.xltx, .xltm) files are
// workbooks too; only the extension used to say .xlsx or .xls.
export function isWorkbookFileName(name: string): boolean {
  return /\.(xlsx|xlsm|xlsb|xls|xltx|xltm)$/i.test(name);
}

// How far down to look for the header row. A title line, a "Generated on ..." line and a blank row
// is typical; ten is generous without ever mistaking a data row for a header.
const HEADER_SEARCH_ROWS = 10;

// A formula that failed leaves "#N/A", "#DIV/0!" and the like in the cell. That is the template
// reporting a gap, not a value somebody entered.
const SPREADSHEET_ERROR = /^#(N\/A|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|NULL!)$/;

function cellText(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return SPREADSHEET_ERROR.test(text) ? "" : text;
}

// The row under a header that explains each column ("Zone - either 52, 53 or 54 for SA") rather than
// holding a record: its cells are sentences under a header of short names.
function isHelpRow(row: string[], headerCells: string[]): boolean {
  const lengths = (cells: string[]) => cells.filter((c) => c !== "").map((c) => c.length);
  const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
  const cells = lengths(row);
  return cells.length >= 3 && mean(cells) > 30 && mean(cells) > 2 * mean(lengths(headerCells));
}

// The header is the first row, within the first few, that is nearly as wide as the widest of them
// and has at least two cells - a one-cell title line above a ten-column table is skipped. A sheet
// whose widest row is a single cell (one column of values) falls back to its first non-empty row.
function gridToRows(grid: string[][]): RawRow[] {
  const nonEmpty = (row: string[]) => row.filter((c) => c !== "").length;
  const head = grid.slice(0, HEADER_SEARCH_ROWS);
  const widest = Math.max(0, ...head.map(nonEmpty));
  if (widest === 0) return [];
  const threshold = widest < 2 ? 1 : Math.max(2, Math.ceil(widest * 0.6));
  const headerIndex = head.findIndex((row) => nonEmpty(row) >= threshold);
  if (headerIndex < 0) return [];

  const headerCells = grid[headerIndex];
  const seen = new Map<string, number>();
  const headers = headerCells.map((cell, i) => {
    const base = cell || `Column ${i + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });

  // BDBSA's own 3-tier tabs carry two header rows: readable names, then the legacy column keys
  // (SURVEYNR, OLDZONE ...). The second row is a header too, not a record - recognised by being
  // all upper-case tokens under a header that is not.
  const isKeyRow = (row: string[]) => {
    const cells = row.filter((c) => c !== "");
    return cells.length >= 2 && cells.every((c) => /^[A-Z][A-Z0-9_]*$/.test(c));
  };
  const hasKeyRow = headerIndex + 1 < grid.length && isKeyRow(grid[headerIndex + 1]) && !isKeyRow(headerCells);
  const afterHeader = headerIndex + (hasKeyRow ? 2 : 1);
  const hasHelpRow = afterHeader < grid.length && isHelpRow(grid[afterHeader], headerCells);

  return grid
    .slice(afterHeader + (hasHelpRow ? 1 : 0))
    .filter((row) => nonEmpty(row) > 0)
    .map((row) => {
      const out: RawRow = {};
      headers.forEach((h, i) => {
        out[h] = row[i] ?? "";
      });
      return out;
    });
}

// Which tabs are protected, read from the workbook's own XML: SheetJS does not surface it. An old
// binary .xls has no such XML, and none of its tabs are reported as locked.
function sheetXmlFacts(workbook: ReturnType<typeof readWorkbook>): { locked: Set<string>; formulaShare: Map<string, number> } {
  const locked = new Set<string>();
  const formulaShare = new Map<string, number>();
  const files = (workbook as unknown as { files?: Record<string, { content?: Uint8Array | string }> }).files;
  const text = (entry?: { content?: Uint8Array | string }) => (entry?.content === undefined ? "" : typeof entry.content === "string" ? entry.content : new TextDecoder().decode(entry.content));
  const rels = text(files?.["xl/_rels/workbook.xml.rels"]);
  if (!files || !rels) return { locked, formulaShare };
  const target = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[1])?.[1];
    const to = /\bTarget="([^"]+)"/.exec(m[1])?.[1];
    if (id && to) target.set(id, to);
  }
  workbook.Workbook?.Sheets?.forEach((sheetMeta, index) => {
    const meta = sheetMeta as typeof sheetMeta & { id?: string };
    const to = meta.id ? target.get(meta.id) : undefined;
    if (!to || (meta.Hidden ?? 0) !== 0) return;
    const xml = text(files[to.startsWith("/") ? to.slice(1) : `xl/${to}`]);
    if (/<sheetProtection\b[^>]*\bsheet="(1|true)"/.test(xml)) locked.add(workbook.SheetNames[index]);
    // Counted in the XML, not from SheetJS: it keeps a formula only on the first cell of a shared one, so a
    // tab filled by a dragged-down formula reads as mostly typed values.
    const formulas = (xml.match(/<f[\s>/]/g) ?? []).length;
    const values = (xml.match(/<v>|<is>/g) ?? []).length;
    formulaShare.set(workbook.SheetNames[index], values === 0 ? 0 : Math.min(1, formulas / values));
  });
  return { locked, formulaShare };
}

// Every sheet with at least one data row. An empty sheet is not an error - a workbook often has a
// blank scratch tab - and is simply absent from the result.
//
// Dates come out as ISO (2024-12-04), never as the US-ordered text SheetJS would write for a date
// cell (12/4/24), which reads as a different day to anyone who writes day first.
export function readWorkbookSheets(buffer: ArrayBuffer): SheetRows[] {
  const workbook = readWorkbook(buffer, { type: "array", cellDates: true, bookFiles: true });
  if (workbook.SheetNames.length === 0) throw new Error("This workbook has no sheets");
  const { locked: lockedNames, formulaShare: formulaShares } = sheetXmlFacts(workbook);
  return workbook.SheetNames.flatMap((sheetName, index): SheetRows[] => {
    const sheet = workbook.Sheets[sheetName];
    const hidden = (workbook.Workbook?.Sheets?.[index]?.Hidden ?? 0) !== 0;
    if (hidden) {
      const range = sheet?.["!ref"] ? sheetUtils.decode_range(sheet["!ref"]) : null;
      return [{ sheetName, rows: [], grid: [], hidden: true, rowCount: range ? Math.max(0, range.e.r - range.s.r) : 0, locked: false, formulaShare: 0 }];
    }
    const grid = sheetUtils
      .sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: false, dateNF: "yyyy-mm-dd" })
      .map((row) => row.map(cellText));
    const rows = gridToRows(grid);
    return rows.length > 0 || grid.length > 0
      ? [{ sheetName, rows, grid, hidden: false, rowCount: rows.length, locked: lockedNames.has(sheetName), formulaShare: formulaShares.get(sheetName) ?? 0 }]
      : [];
  });
}

// ── 2. Work out what a tab holds ──

export interface SourceRole {
  id: string;
  label: string;
  kind: string;
  type?: string;
  taxonomicType?: TaxonomicType;
  // Whole words (singularised) that name this role in a tab or file name.
  words: string[];
}

// `species_fauna` / `species_flora` are listed before `species` so the more specific role wins a
// tie on position. "species" and "observation" are one role: either way each row is a species
// record that `expandSpeciesOccurrences` splits into its Occurrence and Observation, and that
// only happens for a row that did not state its own Type or ID.
export const SOURCE_ROLES: SourceRole[] = [
  { id: "site", label: "Site", kind: "Event", type: "Site", words: ["site"] },
  { id: "visit", label: "Visit", kind: "Event", type: "Visit", words: ["visit"] },
  { id: "transect", label: "Transect", kind: "Event", type: "Transect", words: ["transect"] },
  { id: "quadrat", label: "Quadrat", kind: "Event", type: "Quadrat", words: ["quadrat"] },
  { id: "ramble", label: "Ramble", kind: "Event", type: "Ramble", words: ["ramble"] },
  { id: "occurrence", label: "Occurrence", kind: "Occurrence", words: ["occurrence"] },
  { id: "species_fauna", label: "Species (fauna)", kind: "Observation", taxonomicType: "Fauna", words: ["fauna"] },
  { id: "species_flora", label: "Species (flora)", kind: "Observation", taxonomicType: "Flora", words: ["flora"] },
  { id: "species", label: "Species", kind: "Observation", words: ["species", "observation"] },
];

function singular(token: string): string {
  return token.length > 3 && token.endsWith("s") && !token.endsWith("ss") && token !== "species" ? token.slice(0, -1) : token;
}

// Roles whose words appear in a name, earliest word first, one entry per role. "Species Fauna"
// matches both `species_fauna` and `species`; the generic one is dropped when a fauna/flora role
// matched, since the file/tab is plainly the more specific thing.
function rolesInName(name: string): SourceRole[] {
  const tokens = name
    .toLowerCase()
    .replace(/\.(csv|json|xlsx?)$/i, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singular);
  const found: { role: SourceRole; at: number }[] = [];
  for (const role of SOURCE_ROLES) {
    const at = tokens.findIndex((t) => role.words.includes(t));
    if (at >= 0) found.push({ role, at });
  }
  const hasTaxonomicRole = found.some((f) => f.role.taxonomicType);
  return found
    .filter((f) => !(hasTaxonomicRole && f.role.id === "species"))
    .sort((a, b) => a.at - b.at)
    .map((f) => f.role);
}

// Columns that belong to one record family and not the others, built from the schema itself: a
// field name that appears only in Site's field list, only in Visit's, or only across the four
// Observation lists; plus the raw BDBSA column names the crosswalk records for each (CAMPMAP,
// QUADSITE, FIELDSEQNR ...), kept only where no other family also uses them (OLDEASTING is on
// Site and species rows alike, so it tells you nothing).
type Family = "site" | "visit" | "observation";

const FAMILY_FIELDS: Record<Family, string[]> = {
  site: FIELD_SCHEMA["Event:Site"] ?? [],
  visit: FIELD_SCHEMA["Event:Visit"] ?? [],
  observation: Object.entries(FIELD_SCHEMA)
    .filter(([key]) => key.startsWith("Observation:"))
    .flatMap(([, fields]) => fields),
};

function rawColumnsOf(crosswalkKeys: string[]): string[] {
  const out: string[] = [];
  for (const key of crosswalkKeys) {
    for (const value of Object.values(BDBSA_KEY_CROSSWALK[key] ?? {})) {
      if (value) out.push(...(value.match(/[A-Z][A-Z0-9_]{3,}/g) ?? []));
    }
  }
  return out;
}

const FAMILY_RAW_COLUMNS: Record<Family, string[]> = {
  site: rawColumnsOf(["Event:Site"]),
  visit: rawColumnsOf(["Event:Visit"]),
  observation: rawColumnsOf(Object.keys(BDBSA_KEY_CROSSWALK).filter((k) => k.startsWith("Observation:"))),
};

// Headers the page already reads off a species row to classify it (`expandSpeciesOccurrences`).
const SPECIES_ROW_HEADERS = ["Species", "NSX code", "Taxonomic Type", "SPECIESTYPE", "Number Observed"];

function exclusiveSet(family: Family): Set<string> {
  const others = (Object.keys(FAMILY_FIELDS) as Family[]).filter((f) => f !== family);
  const normalizedOthers = new Set(others.flatMap((f) => [...FAMILY_FIELDS[f], ...FAMILY_RAW_COLUMNS[f]]).map(normalizeHeader));
  const own = [...FAMILY_FIELDS[family], ...FAMILY_RAW_COLUMNS[family], ...(family === "observation" ? SPECIES_ROW_HEADERS : [])];
  return new Set(own.map(normalizeHeader).filter((h) => !normalizedOthers.has(h)));
}

const EXCLUSIVE: Record<Family, Set<string>> = {
  site: exclusiveSet("site"),
  visit: exclusiveSet("visit"),
  observation: exclusiveSet("observation"),
};

// A tab's own key column ("Site ID", "Visit Name") is a weaker signal than a schema field, but a
// tab with "Visit ID" and "Visit Seq No." is plainly a Visit tab.
const OWN_KEY_HEADERS: Record<Family, string[]> = {
  site: ["site id", "site code", "site key", "site name"],
  visit: ["visit id", "visit code", "visit key", "visit name"],
  observation: ["observation id", "obs id", "occurrence id"],
};

const FAMILY_ROLE: Record<Family, string> = { site: "site", visit: "visit", observation: "species" };

interface ColumnSignature {
  role: SourceRole | null;
  hits: string[];
}

// The family whose exclusive columns the tab carries most of, when that is at least two and
// strictly more than any other family. One shared column is never enough: Easting and Observer 1
// sit on several record types.
function columnSignature(headers: string[]): ColumnSignature {
  const normalized = headers.map(normalizeHeader);
  const scored = (Object.keys(EXCLUSIVE) as Family[]).map((family) => {
    const hits = headers.filter((h, i) => EXCLUSIVE[family].has(normalized[i]) || OWN_KEY_HEADERS[family].map(normalizeHeader).includes(normalized[i]));
    return { family, hits };
  });
  scored.sort((a, b) => b.hits.length - a.hits.length);
  const [top, second] = scored;
  if (top.hits.length < 2 || top.hits.length === second.hits.length) return { role: null, hits: [] };
  return { role: SOURCE_ROLES.find((r) => r.id === FAMILY_ROLE[top.family]) ?? null, hits: top.hits };
}

export type SourceVia = "kind-column" | "tab-name" | "file-name" | "columns" | "none";

export interface SourceClassification {
  role: SourceRole | null;
  via: SourceVia;
  // Plain-language reason shown beside the tab: what the decision was based on.
  reason: string;
}

// Decide what one tab (or one CSV/JSON file) holds. `fileName` is passed only for a source that is
// the whole file (a CSV, JSON, or a one-tab workbook): in a multi-tab workbook the file name says
// nothing about any single tab, and letting "site_data.xlsx" stamp Site on its Visit tab is the
// exact mistake this pass exists to avoid.
export function classifySource({ sheetName, fileName, rows }: { sheetName?: string; fileName?: string; rows: RawRow[] }): SourceClassification {
  const headers = Object.keys(rows[0] ?? {});
  const columns = columnSignature(headers);

  const statesKind = rows.length > 0 && rows.every((row) => Boolean(row[findColumn(row, ["kind"]) ?? ""]));
  if (statesKind) return { role: null, via: "kind-column", reason: "Every row states its own Kind" };

  const fromName = (name: string): SourceRole | null => {
    const roles = rolesInName(name);
    if (roles.length <= 1) return roles[0] ?? null;
    // Two families named at once ("Site visits", "Site - Flora Sp."): the columns settle it if they point at
    // one of them. The species roles are one family, so Flora or Fauna agrees with a column signature of "species".
    const sameFamily = (a: SourceRole, b: SourceRole | null) => b !== null && (a.id === b.id || (a.kind === "Observation" && b.kind === "Observation"));
    return roles.find((r) => sameFamily(r, columns.role)) ?? roles[0];
  };

  if (sheetName) {
    const role = fromName(sheetName);
    if (role) return { role, via: "tab-name", reason: `Tab name "${sheetName}"` };
  }
  if (fileName) {
    const role = fromName(fileName);
    if (role) return { role, via: "file-name", reason: `File name "${fileName}"` };
  }
  if (columns.role) return { role: columns.role, via: "columns", reason: `Columns ${columns.hits.slice(0, 3).join(", ")}` };
  return { role: null, via: "none", reason: "No Site, Visit or species signal in its name or columns" };
}

// ── 3. Link: the key-column conventions ──

// Deepest first: a row that names both its Visit and its Site belongs under the Visit.
export const REFERENCE_TYPES = ["Occurrence", "Visit", "Quadrat", "Transect", "Ramble", "Site"] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

const KEY_SUFFIXES = ["id", "ref", "code", "key"];

// The header spellings of a key column for a record type: "Site ID", "site_code", "SiteKey".
function keyHeaders(type: string): string[] {
  return KEY_SUFFIXES.map((suffix) => `${type} ${suffix}`);
}

// A tab's own identifier when it has no generic "ID" column: "Site ID" on a Site tab, "Visit ID"
// on a Visit tab. Tried by Type first, then by Kind (an Observation tab with "Observation ID").
export function findOwnIdColumn(row: RawRow, kind: string, type: string): string | null {
  const names = [type, kind].filter(Boolean);
  if (kind === "Observation") names.push("Obs");
  for (const name of names) {
    const col = findColumn(row, keyHeaders(name));
    if (col) return col;
  }
  return null;
}

export interface ReferenceColumn {
  type: ReferenceType;
  column: string;
}

// Which other record types a record may point at: an Event only at other Events, an Occurrence at
// an Event, an Observation at an Occurrence or an Event. A record never points at its own type
// (that column is its own key), and Site and Visit refs on a Site are never read as parents.
function mayReference(kind: string, type: string, target: ReferenceType): boolean {
  if (target === type) return false;
  if (kind === "Event") return target !== "Occurrence" && !(type === "Site");
  if (kind === "Occurrence") return target !== "Occurrence";
  return true;
}

// Every column on the row that reads as a pointer to another record: "Site ID", "Visit Ref", a bare
// "Visit" column, or "Site Name" (a name rather than an ID - `linkByReference` matches by either).
// A Site's own "Site Name" is not a pointer: its own type is skipped above.
export function findReferenceColumns(row: RawRow, kind: string, type: string): ReferenceColumn[] {
  const out: ReferenceColumn[] = [];
  for (const target of REFERENCE_TYPES) {
    if (!mayReference(kind, type, target)) continue;
    const column = findColumn(row, [...keyHeaders(target), target, `${target} name`, `parent ${target}`]);
    if (column) out.push({ type: target, column });
  }
  return out;
}

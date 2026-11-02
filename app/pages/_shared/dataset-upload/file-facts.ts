// What a dataset file says about itself, read in the browser from the file the person adds (nothing leaves it, and only these facts are kept,
// never the rows): the days it was surveyed, how many sites, visits and species records it holds, and which species. Add Project option 2
// shows them in its Dataset step so the project can be built up from the data instead of typed again (the designer, 30 Oct 2026: "when I
// upload a dataset, the rest of the project should build up too").
//
// It reads a file the way the Data ingestion stress test page does, with the same readers, in the same order: the form a person fills in and
// sends (the Ramble form), a sample matrix, a flat BDBSA return, and otherwise the tabs of a workbook that are named or shaped like a Site, a
// Visit or species. A tab it cannot place is left out, never guessed at. A fact the file does not state is null or zero, and the caller says
// "Not in the file": it is never made up (CONTRACTS 0.3).

import { classifySource, findColumn, isWorkbookFileName, readWorkbookSheets, type RawRow } from "@/app/pages/data-ingestion-stress-test/workbook-ingest";
import { convertRambleTemplate, type TemplateConversion } from "@/app/pages/data-ingestion-stress-test/template-ingest";
import { convertFlatReturns, convertSampleMatrix, isFlatReturn } from "@/app/pages/data-ingestion-stress-test/methodology-ingest";

export interface FileSpecies {
  /** The NSX code when the file has one, else the name: what makes two rows the same species. */
  key: string;
  name: string;
  commonName: string;
}

export interface FileFacts {
  file: string;
  /** What the file was recognised as, in words a person knows (a form, a return, a matrix), or empty when only its tabs were read. */
  readAs: string;
  sites: number;
  visits: number;
  /** Species records (one per row of a species tab). */
  records: number;
  species: FileSpecies[];
  /** The first and last day any visit or record is dated, as `YYYY-MM-DD`, or null when the file states no date. */
  firstDay: string | null;
  lastDay: string | null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function iso(y: number, m: number, d: number): string | null {
  if (y < 1800 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date.toISOString().slice(0, 10) : null;
}

/** Every day a cell states, as `YYYY-MM-DD`: "2019-10-17", "17/10/2019" (day first, as BDBSA writes it), "17 Oct 2019", and two of them in one cell. */
export function daysIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) out.push(iso(+m[1], +m[2], +m[3]) ?? "");
  for (const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) out.push(iso(+m[3], +m[2], +m[1]) ?? "");
  for (const m of text.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/g)) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    out.push(month ? (iso(+m[3], month, +m[1]) ?? "") : "");
  }
  return out.filter(Boolean);
}

const DATE_COLUMNS = ["visit date", "observation date", "date", "start date", "survey date", "sample date"];
const SCIENTIFIC_COLUMNS = ["scientific name", "scientificname", "species", "taxon name", "taxonname"];
const COMMON_COLUMNS = ["common name", "commonname"];
const NSX_COLUMNS = ["nsx code", "nsxcode"];

type Role = "site" | "visit" | "species";
interface Tier {
  role: Role;
  rows: RawRow[];
}

function roleOfTier(name: string): Role | null {
  const n = name.toLowerCase();
  if (n.includes("species") || n.includes("observation") || n.includes("occurrence")) return "species";
  if (n.includes("visit")) return "visit";
  if (n.includes("site")) return "site";
  return null;
}

const DERIVED_FORMULA_SHARE = 0.8;

/** Reads a workbook. Rejects with a plain message when it cannot be opened as one. */
export async function readFileFacts(file: File): Promise<FileFacts> {
  if (!isWorkbookFileName(file.name)) throw new Error("This is not a workbook (.xls or .xlsx)");
  const sheets = readWorkbookSheets(await file.arrayBuffer());
  const visible = sheets.filter((s) => !s.hidden);
  const asSheet = (s: (typeof sheets)[number]) => ({ sheetName: s.sheetName, grid: s.grid });

  let conversion: TemplateConversion | null = null;
  let readAs = "";
  const take = (c: TemplateConversion | null, as: string) => {
    if (!conversion && c) {
      conversion = c;
      readAs = as;
    }
  };
  take(convertRambleTemplate(visible.map(asSheet)), "the DEW Ramble survey form");
  take(convertSampleMatrix(visible.map(asSheet)), "a sample matrix");
  if (!conversion) {
    const returns = visible.filter((s) => isFlatReturn(s.grid));
    const finished = returns.filter((s) => s.formulaShare < DERIVED_FORMULA_SHARE);
    take(convertFlatReturns((finished.length > 0 ? finished : returns).map(asSheet)), "a BDBSA return");
  }

  let tiers: Tier[];
  if (conversion) {
    const made: TemplateConversion = conversion;
    tiers = made.tiers.flatMap((t) => {
      const role = roleOfTier(t.name);
      return role ? [{ role, rows: t.rows }] : [];
    });
  } else {
    readAs = "";
    tiers = visible
      .filter((s) => !(s.locked && visible.length > 1))
      .flatMap((s) => {
        const verdict = classifySource({ sheetName: s.sheetName, fileName: visible.length === 1 ? file.name : undefined, rows: s.rows });
        const role = verdict.role ? roleOfTier(verdict.role.id) : null;
        return role ? [{ role, rows: s.rows }] : [];
      });
  }

  const days: string[] = [];
  const species = new Map<string, FileSpecies>();
  let records = 0;
  for (const tier of tiers) {
    const first = tier.rows[0];
    if (!first) continue;
    const dateColumn = findColumn(first, DATE_COLUMNS);
    if (dateColumn) for (const row of tier.rows) days.push(...daysIn(row[dateColumn] ?? ""));
    if (tier.role !== "species") continue;
    records += tier.rows.length;
    const nsx = findColumn(first, NSX_COLUMNS);
    const scientific = findColumn(first, SCIENTIFIC_COLUMNS);
    const common = findColumn(first, COMMON_COLUMNS);
    for (const row of tier.rows) {
      const code = nsx ? (row[nsx] ?? "").trim() : "";
      const name = scientific ? (row[scientific] ?? "").trim() : "";
      const commonName = common ? (row[common] ?? "").trim() : "";
      const key = code && code !== "0" ? code : name || commonName;
      if (key && !species.has(key)) species.set(key, { key, name: name || commonName || code, commonName });
    }
  }
  const sorted = days.sort();
  return {
    file: file.name,
    readAs,
    sites: tiers.filter((t) => t.role === "site").reduce((n, t) => n + t.rows.length, 0),
    visits: tiers.filter((t) => t.role === "visit").reduce((n, t) => n + t.rows.length, 0),
    records,
    species: [...species.values()],
    firstDay: sorted[0] ?? null,
    lastDay: sorted[sorted.length - 1] ?? null,
  };
}

/** The facts of several files as one: the whole span of days, every species once. */
export function mergeFacts(all: FileFacts[]): Omit<FileFacts, "file" | "readAs"> & { files: number } {
  const days = all.flatMap((f) => [f.firstDay, f.lastDay]).filter((d): d is string => !!d).sort();
  const species = new Map<string, FileSpecies>();
  for (const f of all) for (const s of f.species) if (!species.has(s.key)) species.set(s.key, s);
  return {
    files: all.length,
    sites: all.reduce((n, f) => n + f.sites, 0),
    visits: all.reduce((n, f) => n + f.visits, 0),
    records: all.reduce((n, f) => n + f.records, 0),
    species: [...species.values()],
    firstDay: days[0] ?? null,
    lastDay: days[days.length - 1] ?? null,
  };
}

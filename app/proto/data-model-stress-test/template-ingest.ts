// PROTOTYPE LAB - throwaway, imported only by `/proto/data-model-stress-test`. Turns the form a
// person fills in and sends to BDBSA (the DEW Ramble survey form) into the 3-tier rows BDBSA's own
// automation produces from it - a Site, a Visit, and one species row per plant or animal - so the
// stress test can ingest what a user actually sends, not only what BDBSA's automation hands back.
//
// Per the user directly: "What if we ingest the user-sent template, break it into the 3 tier sheet
// and then smartly build out the structure?" The converted rows are ordinary rows with the same
// column names a real SITE / VISIT / SPECIES tab carries (Survey #, Zone, Easting, Northing, Visit
// Date, NSX Code, Number Observed ...), so everything downstream - tab classification, linking by
// coordinates and visit date, the Occurrence / Observation split - is the pipeline that already
// exists. Nothing here builds a tree.
//
// Verified against a real submission: "Heathfield Council Depot Ramble Oct 2019.xlsx" holds the
// filled-in form (RAMBLE, FAUNA, OTHER COMMENTS) and, in the same file, BDBSA's own SITE, VISIT,
// SPECIES and SPECIES FAUNA tabs for it. Every field mapped below was checked against those tabs
// (same NSX codes, comments, source ids, coordinates, visit date, observer); see the decision log.
//
// Deliberately NOT done, and reported to the person rather than guessed:
// - **No code tables.** BDBSA's output carries codes (Datum 4, Vegetation Condition 4, Method 6,
//   Species Type P). The form carries words (GDA94, Degraded Natural, Observed-no method stated).
//   Only a handful of pairs can be read off one submission, not a table, so the words are kept.
// - **No Survey #.** BDBSA assigns it on receipt (653 here, against FIMS ID 615 on the form); it is
//   not on the form, so it stays blank rather than being made up.
// - **Cover abundance and the OTHER COMMENTS tab** are not carried: BDBSA's own conversion leaves
//   them out too. They are counted in the notes so a person knows they were skipped.
//
// No imports: pure functions over a grid of cell text, so a node script can run it directly.

export type Grid = string[][];
export type TierRow = Record<string, string>;

export interface TierSheet {
  // The tab name the rows would have in a BDBSA 3-tier workbook.
  name: string;
  rows: TierRow[];
}

export interface TemplateConversion {
  // Which form this was read as.
  formName: string;
  // The tabs that are the form itself (the main form, the fauna list, the other-comments tab and
  // the readme), so the caller can list them as read.
  formTabs: { sheetName: string; role: string }[];
  tiers: TierSheet[];
  // Plain-language lines for what was not carried or could not be known.
  notes: string[];
}

interface TemplateSheet {
  sheetName: string;
  grid: Grid;
}

// ── Reading a form ──

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// A formula that found nothing leaves a literal 0 behind in a text cell. Never a real value there.
function textValue(value: string): string {
  const v = value.trim();
  return v === "0" ? "" : v;
}

function firstNonEmpty(row: string[]): string {
  return row.find((c) => c.trim() !== "")?.trim() ?? "";
}

function findRow(grid: Grid, predicate: (row: string[]) => boolean, limit = grid.length): number {
  for (let r = 0; r < Math.min(limit, grid.length); r++) if (predicate(grid[r] ?? [])) return r;
  return -1;
}

// The label cells of the Ramble form's top block, and the section headings that end a value.
const FORM_LABELS: Record<string, string> = {
  "survey date": "surveyDate",
  "observer 1": "observer1",
  "observer 2": "observer2",
  "fims id no": "fims",
  "ramble size": "rambleSize",
  datum: "datum",
  zone: "zone",
  easting: "easting",
  northing: "northing",
  "park property": "property",
  "loc description": "locDescription",
  "veg type": "vegType",
  structure: "structure",
  condition: "condition",
  "habitat comments": "habitatComments",
};
const FORM_HEADINGS = new Set(["general", "location", "vegetation information", "required"]);

// Each label's value is the first non-empty cell to its right on the same row. A label that meets
// another label (or a heading) first has no value: OBSERVER 2 left blank must not borrow the next
// block's EASTING label as its answer. Merged cells hold their text in the leftmost cell.
function readFormFields(grid: Grid, endRow: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (let r = 0; r < endRow; r++) {
    const row = grid[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const key = FORM_LABELS[norm(row[c] ?? "")];
      if (!key || out[key] !== undefined) continue;
      let value = "";
      for (let k = c + 1; k < row.length; k++) {
        const cell = (row[k] ?? "").trim();
        if (cell === "") continue;
        const n = norm(cell);
        if (!FORM_LABELS[n] && !FORM_HEADINGS.has(n)) value = cell;
        break;
      }
      out[key] = value;
    }
  }
  return out;
}

interface TableColumn {
  key: string;
  start: number;
  end: number;
}

// A table whose header cells are labels and whose rows hold each value in the first cell of that
// header's span (the header cells are merged across several columns, so a value sits under the
// leftmost one and its neighbours repeat or are empty).
function readTable(grid: Grid, headerRow: number, keys: Record<string, string>): { columns: TableColumn[]; rows: Record<string, string>[] } {
  const header = grid[headerRow] ?? [];
  const starts: { key: string; start: number }[] = [];
  header.forEach((cell, c) => {
    const key = keys[norm(cell ?? "")];
    if (key) starts.push({ key, start: c });
  });
  const columns = starts.map((s, i) => ({ key: s.key, start: s.start, end: starts[i + 1]?.start ?? Math.max(header.length, s.start + 1) }));

  const rows: Record<string, string>[] = [];
  for (let r = headerRow + 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const out: Record<string, string> = {};
    for (const col of columns) out[col.key] = firstNonEmpty(row.slice(col.start, col.end));
    rows.push(out);
  }
  return { columns, rows };
}

const FLORA_KEYS: Record<string, string> = {
  "enter scientific name here": "scientificName",
  "common name": "commonName",
  "voucher no": "voucher",
  nsxcode: "nsxCode",
  "dominant storey": "dominantStorey",
  "cover abundance": "coverAbundance",
  "life stage": "lifeStage",
  "regen mode": "regenMode",
  "released reveg": "released",
  "species comment": "comment",
};

const FAUNA_KEYS: Record<string, string> = {
  "enter scientific name here": "scientificName",
  "common name": "commonName",
  nsxcode: "nsxCode",
  "species type": "speciesType",
  "number observed": "numberObserved",
  "method observed": "method",
  comment: "comment",
};

// ── Dates ──

const SURVEY_DATE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;

// "17/10/2019 & 18/10/2019" -> its first and last day as ISO dates. The form is Australian
// (day first). Anything that is not that shape comes back unparsed and the caller keeps the text.
function surveyDateRange(text: string): { start: string; end: string } | null {
  const days = [...text.matchAll(SURVEY_DATE)].map(([, d, m, y]) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  if (days.length === 0) return null;
  return { start: days[0], end: days[days.length - 1] };
}

// ── Detecting and converting ──

function isRambleMain(grid: Grid): boolean {
  const title = findRow(grid, (row) => norm(firstNonEmpty(row)).startsWith("ramble survey"), 4);
  return title >= 0 && findRow(grid, (row) => row.some((c) => norm(c ?? "") === "enter scientific name here")) >= 0;
}

function isFaunaList(grid: Grid): boolean {
  return findRow(grid, (row) => row.some((c) => norm(c ?? "") === "number observed") && row.some((c) => norm(c ?? "") === "species type")) >= 0;
}

function isOtherComments(grid: Grid): boolean {
  return norm(firstNonEmpty(grid[0] ?? [])).startsWith("further comments");
}

function isReadme(grid: Grid): boolean {
  return findRow(grid, (row) => row.some((c) => norm(c ?? "").endsWith("ramble survey form")), 6) >= 0;
}

function sequence(n: number): string {
  return String(n).padStart(2, "0");
}

// The Ramble form -> the 3-tier rows, or null when no tab of the workbook is a Ramble form.
export function convertRambleTemplate(sheets: TemplateSheet[]): TemplateConversion | null {
  const main = sheets.find((s) => s.grid.length > 0 && isRambleMain(s.grid));
  if (!main) return null;

  const headerRow = findRow(main.grid, (row) => row.some((c) => norm(c ?? "") === "enter scientific name here"));
  const form = readFormFields(main.grid, headerRow);
  const flora = readTable(main.grid, headerRow, FLORA_KEYS).rows.filter((r) => textValue(r.scientificName) !== "");

  const faunaSheet = sheets.find((s) => s !== main && s.grid.length > 0 && isFaunaList(s.grid));
  const faunaHeader = faunaSheet ? findRow(faunaSheet.grid, (row) => row.some((c) => norm(c ?? "") === "number observed")) : -1;
  const fauna = faunaSheet ? readTable(faunaSheet.grid, faunaHeader, FAUNA_KEYS).rows.filter((r) => textValue(r.scientificName) !== "") : [];

  const commentsSheet = sheets.find((s) => s !== main && s !== faunaSheet && s.grid.length > 0 && isOtherComments(s.grid));
  const readmeSheet = sheets.find((s) => s !== main && s !== faunaSheet && s !== commentsSheet && s.grid.length > 0 && isReadme(s.grid));

  const dates = surveyDateRange(form.surveyDate ?? "");
  const fims = (form.fims ?? "").trim();
  const place = { Zone: form.zone ?? "", Easting: form.easting ?? "", Northing: form.northing ?? "" };
  const visitId = fims || [place.Easting, place.Northing, form.surveyDate ?? ""].filter(Boolean).join("-");
  const where = { "Survey #": "", ...place, "Visit Date": form.surveyDate ?? "" };

  const tiers: TierSheet[] = [];

  tiers.push({
    name: "SITE",
    rows: [
      {
        "Survey #": "",
        ...place,
        Datum: form.datum ?? "",
        "Specific Property Details": form.property ?? "",
        "Location Comment": form.locDescription ?? "",
        "Ramble Size": form.rambleSize ?? "",
        "FIMS ID": fims,
      },
    ],
  });

  tiers.push({
    name: "VISIT",
    rows: [
      {
        "Visit ID": visitId,
        ...where,
        "Start Date": dates?.start ?? form.surveyDate ?? "",
        "End Date": dates?.end ?? "",
        "Observer 1": form.observer1 ?? "",
        "Observer 2": form.observer2 ?? "",
        // The form's vegetation answers stay on the Visit, as BDBSA's own VISIT tab holds them. The
        // tree stays Site, Visit, Occurrence, Observation: an Observation always sits under an
        // Occurrence, and a vegetation answer has no species to be an Occurrence of. These columns
        // have no field in the Visit template yet, so the page keeps them and flags them for review.
        "Veg Type": form.vegType ?? "",
        Structure: form.structure ?? "",
        Condition: form.condition ?? "",
        "Habitat Comment": form.habitatComments ?? "",
      },
    ],
  });

  const sourceId = (n: number) => (fims ? `${fims}-${sequence(n)}` : "");

  if (flora.length > 0) {
    tiers.push({
      name: "SPECIES FLORA",
      rows: flora.map((r, i) => ({
        ...where,
        "Taxonomic Type": "Plant",
        "NSX Code": textValue(r.nsxCode),
        Species: textValue(r.scientificName),
        "Common Name": textValue(r.commonName),
        "Number Observed": "Present but not counted",
        "Association Dominance": textValue(r.dominantStorey),
        "Plant Life Stage": textValue(r.lifeStage),
        Regeneration: textValue(r.regenMode),
        "Planted/Released": textValue(r.released),
        "Voucher Number": textValue(r.voucher),
        "Observation Comment": textValue(r.comment),
        "Source ID": sourceId(i + 1),
      })),
    });
  }

  if (fauna.length > 0) {
    tiers.push({
      name: "SPECIES FAUNA",
      rows: fauna.map((r, i) => ({
        ...where,
        "Taxonomic Type": textValue(r.speciesType),
        "NSX Code": textValue(r.nsxCode),
        Species: textValue(r.scientificName),
        "Common Name": textValue(r.commonName),
        "Number Observed": r.numberObserved.trim(),
        "Collection Method": textValue(r.method),
        "Observation Comment": textValue(r.comment),
        "Source ID": sourceId(i + 1),
      })),
    });
  }

  const notes: string[] = [
    "Survey # is assigned by BDBSA when the form is received and is not on it, so it is left blank. The Project id stays blank until it is added.",
  ];
  const withCover = flora.filter((r) => textValue(r.coverAbundance) !== "").length;
  if (withCover > 0) notes.push(`Cover abundance on ${withCover} plant rows is not carried: BDBSA's own conversion leaves it out as well.`);
  const commentSections = commentsSheet ? commentsSheet.grid.slice(1).filter((row) => firstNonEmpty(row) !== "").length : 0;
  if (commentsSheet && commentSections > 0) notes.push("The Other comments tab is not carried: it has no field in the 3-tier sheet.");
  notes.push("Datum, vegetation condition, structure and collection method are kept as the words on the form, not BDBSA's codes.");

  const formTabs = [{ sheetName: main.sheetName, role: "Ramble form" }];
  if (faunaSheet) formTabs.push({ sheetName: faunaSheet.sheetName, role: "Fauna list" });
  if (commentsSheet) formTabs.push({ sheetName: commentsSheet.sheetName, role: "Other comments" });
  if (readmeSheet) formTabs.push({ sheetName: readmeSheet.sheetName, role: "Instructions" });

  return { formName: "DEW Ramble survey form", formTabs, tiers, notes };
}

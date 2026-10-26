// Imported only by the Data ingestion stress test page (`/pages/data-ingestion-stress-test`, a lab until 27 Oct 2026). Two more ways a record
// set reaches BDBSA, read into the same 3-tier rows (Site, Visit, species) the Ramble form becomes
// (`template-ingest.ts`), so the rest of the pipeline - linking, the Occurrence and Observation
// split, the tree - is the one that already exists:
//
// 1. **The flat BDBSA return** ("Release of Data / Survey/Project Number / Zone / Easting / ...").
//    One row per species record, no Site and no Visit. It is what the BAM and RAM scoresheets end
//    in (their EK-flora tab is the finished return) and what the Bioblitz tab "Input Data
//    Formatted" is. Site and Visit are not in it, so they are derived: a Site is a survey and a
//    place (coordinates, or the location comment when there are none), a Visit is a Site on a date.
// 2. **The Bioblitz sample matrix** (one column per sample, one row per taxon, an abundance in each
//    cell). Un-pivoted into one species row per filled cell.
//
// Checked against the sample files the designer sent: BAM Site 42, RAM-VA1, and the Bioblitz
// macroinvertebrate workbook, whose flat tab holds the same 440 records as its matrix. See the
// decision log.
//
// Not decided here, and reported to the person instead of guessed:
// - **Survey number.** Not in the matrix and not on the form; BDBSA assigns it. The caller takes it
//   from BDBSA's own tab in the same file when there is one.
// - **Record status flags** (the "U" in the two status columns) are BDBSA's own and are not carried.
// - **The scoring** the BAM and RAM scoresheets exist for (condition scores, offsets, utilisation
//   tallies) has no home in the 3-tier model. It is not read.
//
// Imports are types only, so a node script can run this file directly.

import type { Grid, TemplateConversion, TierRow, TierSheet } from "./template-ingest";

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// A formula that found nothing leaves a literal 0 in a text cell; a zero coordinate or datum is the
// template saying "not entered", never a place on the map.
function blankZero(value: string): string {
  const v = value.trim();
  return v === "0" ? "" : v;
}

// Day first, as BDBSA writes it (the return says DD/MM/YYYY). A date that is already ISO is kept.
function toIsoDate(text: string): string {
  const t = text.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(t);
  if (!m) return t;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

// BDBSA's own species type codes (the Data Returns Template, Codes tab: A Amphibian, B Bird,
// F Fish, M Mammal, R Reptile, P Plant, I Invertebrates). The word is kept, as everywhere else.
const SPECIES_TYPE_WORDS: Record<string, string> = {
  A: "Amphibian",
  B: "Bird",
  F: "Fish",
  M: "Mammal",
  R: "Reptile",
  P: "Plant",
  I: "Invertebrate",
};

export function speciesTypeWord(raw: string): string {
  const t = raw.trim();
  return SPECIES_TYPE_WORDS[t.toUpperCase()] ?? t;
}

// ── A species record, wherever it came from ──

interface SpeciesRecord {
  survey: string;
  zone: string;
  easting: string;
  northing: string;
  latitude: string;
  longitude: string;
  datum: string;
  accuracy: string;
  coordinateSource: string;
  // Where, in words: the location comment of a return, or "River - Site" of a matrix.
  place: string;
  placeIsName: boolean;
  reserve: string;
  date: string;
  dateReliability: string;
  observer: string;
  speciesType: string;
  species: string;
  commonName: string;
  nsx: string;
  number: string;
  method: string;
  comment: string;
  sourceId: string;
  voucher: string;
  // Fields with no home in the template (family, habitat, life stage ...), kept on the Occurrence and
  // flagged by the page for review.
  extras: Record<string, string>;
  // Fields of the Visit this record belongs to (a matrix sample's citizens, ecologist, lab).
  visitExtras?: Record<string, string>;
  visitName?: string;
}

function siteKeyOf(r: SpeciesRecord): string {
  if (r.easting && r.northing) return `${r.survey}|${r.zone}|${r.easting}|${r.northing}`;
  return `${r.survey}|place:${r.place}`;
}

function siteIdOf(r: SpeciesRecord): string {
  if (r.easting && r.northing) return `${r.easting}-${r.northing}`;
  return r.place || "Unlocated";
}

// The Site, the Visit and the species rows of a set of records. A Site is a survey and a place; a
// Visit is a Site on a date. Each species row names its Visit by an explicit Visit ID, so nothing
// downstream has to guess the link.
function buildTiers(records: SpeciesRecord[]): { tiers: TierSheet[]; siteCount: number; visitCount: number; unlocated: number } {
  const sites = new Map<string, TierRow>();
  const visits = new Map<string, TierRow>();
  const observers = new Map<string, Set<string>>();
  const visitExtras = new Map<string, Record<string, Set<string>>>();
  const flora: TierRow[] = [];
  const fauna: TierRow[] = [];
  let unlocated = 0;

  for (const r of records) {
    const siteKey = siteKeyOf(r);
    const siteId = siteIdOf(r);
    if (!(r.easting && r.northing) && !r.place) unlocated++;
    if (!sites.has(siteKey)) {
      sites.set(siteKey, {
        "Site ID": siteId,
        Label: `Site ${siteId}`,
        "Survey #": r.survey,
        Zone: r.zone,
        Easting: r.easting,
        Northing: r.northing,
        Latitude: r.latitude,
        Longitude: r.longitude,
        Datum: r.datum,
        "Location Method": r.coordinateSource,
        Reliability: r.accuracy,
        "Specific Property Details": r.reserve,
        "Location Comment": r.placeIsName ? "" : r.place,
      });
    }

    const visitKey = `${siteKey}|${r.date}`;
    const visitId = `${siteId}@${r.date || "undated"}`;
    if (!visits.has(visitKey)) {
      visits.set(visitKey, {
        "Visit ID": visitId,
        Label: r.date ? `Visit ${r.date}` : "Visit (no date)",
        "Site ID": siteId,
        "Survey #": r.survey,
        Zone: r.zone,
        Easting: r.easting,
        Northing: r.northing,
        "Visit Date": r.date,
        "Start Date": r.date,
        "Date Accuracy": r.dateReliability,
        "Visit Name": r.visitName ?? "",
      });
    }
    if (r.observer) (observers.get(visitKey) ?? observers.set(visitKey, new Set()).get(visitKey)!).add(r.observer);
    if (r.visitExtras) {
      const bag = visitExtras.get(visitKey) ?? visitExtras.set(visitKey, {}).get(visitKey)!;
      for (const [k, v] of Object.entries(r.visitExtras)) if (v) (bag[k] ??= new Set()).add(v);
    }

    const word = speciesTypeWord(r.speciesType);
    const row: TierRow = {
      "Survey #": r.survey,
      "Visit ID": visitId,
      "Visit Date": r.date,
      "Taxonomic Type": word,
      "NSX Code": r.nsx,
      Species: r.species,
      "Common Name": r.commonName,
      "Number Observed": r.number,
      "Collection Method": r.method,
      "Observation Comment": r.comment,
      "Source ID": r.sourceId,
      "Voucher Number": r.voucher,
      ...r.extras,
    };
    (/plant|flora/i.test(word) ? flora : fauna).push(row);
  }

  for (const [key, visit] of visits) {
    const names = [...(observers.get(key) ?? [])];
    visit["Observer 1"] = names[0] ?? "";
    visit["Observer 2"] = names[1] ?? "";
    for (const [k, set] of Object.entries(visitExtras.get(key) ?? {})) visit[k] = [...set].join("; ");
  }

  const tiers: TierSheet[] = [
    { name: "SITE", rows: [...sites.values()] },
    { name: "VISIT", rows: [...visits.values()] },
  ];
  if (flora.length > 0) tiers.push({ name: "SPECIES FLORA", rows: flora });
  if (fauna.length > 0) tiers.push({ name: "SPECIES FAUNA", rows: fauna });
  return { tiers, siteCount: sites.size, visitCount: visits.size, unlocated };
}

// ── 1. The flat BDBSA return ──

// Header text (normalised, parentheses dropped) to what the column is. The first prefix that matches
// wins, so the longer names come first.
const RETURN_COLUMNS: [string, string][] = [
  ["release of data", "release"],
  ["survey project number", "survey"],
  ["zone", "zone"],
  ["easting", "easting"],
  ["northing", "northing"],
  ["latitude", "latitude"],
  ["longitude", "longitude"],
  ["coordinate source", "coordinateSource"],
  ["datum", "datum"],
  ["location accuracy", "accuracy"],
  ["date reliability", "dateReliability"],
  ["date", "date"],
  ["observer", "observer"],
  ["species type", "speciesType"],
  ["common name", "commonName"],
  ["nsx code", "nsx"],
  ["scientific name", "scientific"],
  ["epa taxacode", "epaCode"],
  ["family", "family"],
  ["taxonname", "taxonName"],
  ["life stage", "lifeStage"],
  ["number", "number"],
  ["observation collection method", "method"],
  ["general location comment", "place"],
  ["habitat", "habitat"],
  ["transect number", "transect"],
  ["reserve name", "reserve"],
  ["field voucher", "voucher"],
  ["specimen registration", "specimen"],
  ["comments", "comment"],
  ["scientific permit number", "sourceId"],
  ["location record status", "locationStatus"],
  ["species record status", "speciesStatus"],
];

// Prefix, not whole word: the same column is "General Location Comment" in one template and "General Location
// Comments" in another, and a header carries instructions after its name.
function returnKey(header: string): string | null {
  const n = norm(header);
  return RETURN_COLUMNS.find(([prefix]) => n.startsWith(prefix))?.[1] ?? null;
}

// A coordinate typed as "303061.000" is the number 303061; keep the digits that mean something so the
// same place is the same text on every row, and the Site's id reads cleanly.
function tidyNumber(value: string): string {
  const v = value.trim();
  return /^-?\d+\.\d+$/.test(v) ? String(Number(v)) : v;
}

interface ReturnColumn {
  key: string;
  start: number;
  end: number;
}

function returnHeaderRow(grid: Grid): number {
  for (let r = 0; r < Math.min(6, grid.length); r++) {
    const keys = new Set((grid[r] ?? []).map(returnKey));
    if (keys.has("survey") && keys.has("nsx") && keys.has("scientific")) return r;
    if (keys.has("survey") && keys.has("taxonName")) return r;
  }
  return -1;
}

export function isFlatReturn(grid: Grid): boolean {
  return returnHeaderRow(grid) >= 0;
}

function meanLength(cells: string[]): number {
  const lengths = cells.filter((c) => c.trim() !== "").map((c) => c.length);
  return lengths.length === 0 ? 0 : lengths.reduce((a, b) => a + b, 0) / lengths.length;
}

interface ReadReturn {
  records: SpeciesRecord[];
  rowsRead: number;
}

function readFlatReturn(grid: Grid): ReadReturn {
  const headerRow = returnHeaderRow(grid);
  const header = grid[headerRow] ?? [];
  const starts: { key: string; start: number }[] = [];
  header.forEach((cell, c) => {
    const key = returnKey(cell ?? "");
    if (key) starts.push({ key, start: c });
  });
  const columns: ReturnColumn[] = starts.map((s, i) => ({ key: s.key, start: s.start, end: starts[i + 1]?.start ?? Math.max(header.length, s.start + 1) }));

  // The row under the header often explains each column in a sentence; it is not a record.
  const next = grid[headerRow + 1] ?? [];
  const firstData = meanLength(next) > 30 && meanLength(next) > 2 * meanLength(header) ? headerRow + 2 : headerRow + 1;

  const records: SpeciesRecord[] = [];
  for (let r = firstData; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const v: Record<string, string> = {};
    for (const col of columns) {
      const cells = row.slice(col.start, col.end).map((c) => (c ?? "").trim());
      v[col.key] = col.key === "scientific" ? cells.filter(Boolean).join(" ") : (cells.find(Boolean) ?? "");
    }
    const species = v.scientific || v.taxonName || "";
    if (!v.nsx && !species && !v.commonName) continue;

    const place = v.place ?? "";
    const extras: Record<string, string> = {};
    if (v.family) extras.Family = v.family;
    if (v.epaCode) extras["EPA Taxa Code"] = v.epaCode;
    if (v.lifeStage) extras["Life Stage"] = v.lifeStage;
    if (v.habitat) extras.Habitat = v.habitat;
    if (v.transect) extras["Transect Number"] = v.transect;
    if (v.specimen) extras["Institution Rego #"] = v.specimen;

    records.push({
      survey: blankZero(v.survey ?? ""),
      zone: blankZero(v.zone ?? ""),
      easting: tidyNumber(blankZero(v.easting ?? "")),
      northing: tidyNumber(blankZero(v.northing ?? "")),
      latitude: tidyNumber(blankZero(v.latitude ?? "")),
      longitude: tidyNumber(blankZero(v.longitude ?? "")),
      datum: blankZero(v.datum ?? ""),
      accuracy: blankZero(v.accuracy ?? ""),
      coordinateSource: blankZero(v.coordinateSource ?? ""),
      place,
      placeIsName: false,
      reserve: blankZero(v.reserve ?? ""),
      date: toIsoDate(v.date ?? ""),
      dateReliability: blankZero(v.dateReliability ?? ""),
      observer: blankZero(v.observer ?? ""),
      speciesType: blankZero(v.speciesType ?? ""),
      species,
      commonName: blankZero(v.commonName ?? ""),
      nsx: blankZero(v.nsx ?? ""),
      number: v.number ?? "",
      method: blankZero(v.method ?? ""),
      comment: blankZero(v.comment ?? ""),
      sourceId: blankZero(v.sourceId ?? ""),
      voucher: blankZero(v.voucher ?? ""),
      extras,
    });
  }
  return { records, rowsRead: records.length };
}

interface ReturnSheet {
  sheetName: string;
  grid: Grid;
}

// Every return tab given, read together: a workbook can hold a flora return and a fauna return for
// the same survey, and one Site and Visit must serve both. The caller decides which tabs are given.
export function convertFlatReturns(sheets: ReturnSheet[]): TemplateConversion | null {
  const found = sheets.filter((s) => isFlatReturn(s.grid));
  if (found.length === 0) return null;
  const all = found.flatMap((s) => readFlatReturn(s.grid).records);
  if (all.length === 0) return null;

  const { tiers, siteCount, visitCount, unlocated } = buildTiers(all);
  const notes = [
    `A return has no Site or Visit, so they are made from each row: ${siteCount} Site${siteCount === 1 ? "" : "s"} (a survey and a place) and ${visitCount} Visit${visitCount === 1 ? "" : "s"} (a Site on a date).`,
  ];
  const withoutCoordinates = all.filter((r) => !(r.easting && r.northing)).length;
  if (withoutCoordinates > 0) {
    notes.push(
      unlocated > 0
        ? `${withoutCoordinates} rows have no coordinates and ${unlocated} have no location comment either, so those share one unlocated Site.`
        : `${withoutCoordinates} rows have no coordinates, so their Site is named by the general location comment.`,
    );
  }
  if (all.some((r) => !r.survey)) notes.push("Some rows carry no survey number (BDBSA assigns it).");
  notes.push("The two record status columns are BDBSA's own flags and are not carried.");

  return { formName: "BDBSA return", formTabs: found.map((s) => ({ sheetName: s.sheetName, role: "Species return" })), tiers, notes };
}

// ── 2. The Bioblitz sample matrix ──

// The labels down the left of the header block, and what each is.
const MATRIX_LABELS: Record<string, string> = {
  "12 2023 sample code": "fieldCode",
  "sample code": "sampleCode",
  river: "river",
  site: "site",
  "sample date": "date",
  habitat: "habitat",
  citizens: "citizens",
  ecologist: "ecologist",
  "lab id": "labId",
};

const MATRIX_TAXON_COLUMNS: Record<string, string> = {
  order: "order",
  "taxon code": "taxonCode",
  family: "family",
  genus: "taxon",
  "life stage": "lifeStage",
  "common name": "commonName",
};

function matrixLayout(grid: Grid): { headerRow: number; labelCol: number; taxonCols: Record<string, number>; sampleCols: number[]; labelRows: Record<string, number> } | null {
  const headerRow = grid.findIndex((row) => {
    const keys = new Set(row.map((c) => MATRIX_TAXON_COLUMNS[norm(c ?? "")]));
    return keys.has("taxonCode") && keys.has("family") && keys.has("taxon");
  });
  if (headerRow < 0) return null;
  const taxonCols: Record<string, number> = {};
  grid[headerRow].forEach((c, i) => {
    const key = MATRIX_TAXON_COLUMNS[norm(c ?? "")];
    if (key && taxonCols[key] === undefined) taxonCols[key] = i;
  });

  const labelRows: Record<string, number> = {};
  let labelCol = -1;
  for (let r = 0; r < headerRow; r++) {
    (grid[r] ?? []).forEach((c, i) => {
      const key = MATRIX_LABELS[norm(c ?? "")];
      if (key && labelRows[key] === undefined) {
        labelRows[key] = r;
        labelCol = i;
      }
    });
  }
  if (labelRows.date === undefined || labelRows.sampleCode === undefined || labelRows.river === undefined) return null;

  const firstSampleCol = Math.max(...Object.values(taxonCols), labelCol) + 1;
  const sampleCols: number[] = [];
  const width = Math.max(...grid.map((r) => r.length));
  for (let c = firstSampleCol; c < width; c++) {
    if (["sampleCode", "river", "date"].some((k) => (grid[labelRows[k]]?.[c] ?? "").trim() !== "")) sampleCols.push(c);
  }
  return sampleCols.length > 0 ? { headerRow, labelCol, taxonCols, sampleCols, labelRows } : null;
}

export function isSampleMatrix(grid: Grid): boolean {
  return matrixLayout(grid) !== null;
}

function abundanceText(cell: string): string {
  const t = cell.trim();
  return /^present but not counted$/i.test(t) ? "Present but not counted" : t;
}

export function convertSampleMatrix(sheets: ReturnSheet[]): TemplateConversion | null {
  const main = sheets.find((s) => isSampleMatrix(s.grid));
  if (!main) return null;
  const layout = matrixLayout(main.grid)!;
  const { grid } = main;
  const at = (rowKey: string, col: number) => (layout.labelRows[rowKey] === undefined ? "" : (grid[layout.labelRows[rowKey]]?.[col] ?? "").trim());

  const records: SpeciesRecord[] = [];
  for (let r = layout.headerRow + 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const cellOf = (key: string) => (layout.taxonCols[key] === undefined ? "" : (row[layout.taxonCols[key]] ?? "").trim());
    const taxon = cellOf("taxon");
    if (!taxon && !cellOf("order")) continue;
    for (const col of layout.sampleCols) {
      const abundance = abundanceText(row[col] ?? "");
      if (!abundance) continue;
      const river = at("river", col);
      const site = at("site", col);
      records.push({
        survey: "",
        zone: "",
        easting: "",
        northing: "",
        latitude: "",
        longitude: "",
        datum: "",
        accuracy: "",
        coordinateSource: "",
        // A river and a site name; with no site name, the river and the sample point's own code (SNC010,
        // SNC020 are two points on Sunny Creek, not one place).
        place: site ? [river, site].filter(Boolean).join(" - ") : river ? (at("fieldCode", col) ? `${river} (${at("fieldCode", col)})` : river) : "Unlocated",
        placeIsName: true,
        reserve: "",
        date: toIsoDate(at("date", col)),
        dateReliability: "",
        observer: "",
        // The matrix names no species type; it is the macroinvertebrate matrix.
        speciesType: "I",
        species: taxon,
        commonName: cellOf("commonName"),
        nsx: "",
        number: abundance,
        method: "",
        comment: "",
        sourceId: "",
        voucher: "",
        extras: {
          ...(cellOf("order") ? { Order: cellOf("order") } : {}),
          ...(cellOf("family") ? { Family: cellOf("family") } : {}),
          ...(cellOf("taxonCode") ? { "EPA Taxa Code": cellOf("taxonCode") } : {}),
          ...(cellOf("lifeStage") ? { "Life Stage": cellOf("lifeStage") } : {}),
          ...(at("habitat", col) ? { Habitat: at("habitat", col) } : {}),
        },
        visitName: at("sampleCode", col),
        visitExtras: {
          "Legacy Visit ID": at("fieldCode", col),
          Citizens: at("citizens", col),
          Ecologist: at("ecologist", col),
          "Lab ID": at("labId", col),
        },
      });
    }
  }
  if (records.length === 0) return null;

  const { tiers, siteCount, visitCount } = buildTiers(records);
  const notes = [
    `The matrix is read one species row per filled cell: ${layout.sampleCols.length} samples by ${new Set(records.map((r) => r.species)).size} taxa gives ${records.length} records, in ${siteCount} Site${siteCount === 1 ? "" : "s"} and ${visitCount} Visit${visitCount === 1 ? "" : "s"}.`,
    "A Site is a river and a site name (the river and the sample point code when there is no site name); a Visit is a Site on a sample date. Where two samples share a site and a date (a pool and a riffle) they share a Visit, and the habitat stays on each record.",
    "The matrix names no species type or survey number. Every taxon is read as an invertebrate, because it is the macroinvertebrate matrix; the survey number is taken from BDBSA's own tab in the file when there is one.",
    "An abundance written as a range (2 - 10, 11 - 100, 101 - 1000) is kept as written and read as more than one animal.",
  ];
  return { formName: "Bioblitz macroinvertebrate matrix", formTabs: [{ sheetName: main.sheetName, role: "Sample matrix" }], tiers, notes };
}

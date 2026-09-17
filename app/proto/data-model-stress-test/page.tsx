"use client";

// PROTOTYPE LAB - throwaway, imported by nothing. "Data model stress test" - per the user's own
// lo-fi wireframe (upload a CSV/XLSX on the left, a parsed Field/Value list on the right) and
// direct brief: "when data is uploaded, it auto-maps to site, auto-maps all observations,
// occurrences, etc. and tags it accurately... we need to build in a way that siphons each data bit
// into a correct field with all checks and balances. This is a low-cost stress test before the
// actual data model is implemented during development."
//
// This is a real, working tool, not a static mock - it actually parses an uploaded file and runs
// real validation against the corrected record model (see the `project_projects_data_model`
// memory / this session's own work on project-detail/option-1 and observation-detail/option-1):
// a project directly contains Events (Site/Transect/Ramble/Quadrat/Visit), Occurrences (Individual/
// Population), and Observations (Individual/Non-biotic/Community/Population); an Event can nest
// under any other Event except a Site can never sit under a Visit; an Observation is always a leaf.
// **Refined, this pass, per the user directly**: an Occurrence is no longer always a leaf too - "each
// row on the species CSVs are occurrences... this is a nuance that sits between visits and
// observations," confirmed as a real tree level (Visit -> Occurrence -> Observation), not just a
// descriptive label. An Occurrence may now parent exactly one thing, its own Observation, and
// nothing else - see `expandSpeciesOccurrences` and `classifySpeciesRow` (`config/data-model-
// schema.ts`) for how a real species row is classified into the pair. This refinement is scoped to
// this ingestion sandbox for now - the live product trees (project-detail/option-1, observation-
// detail/option-1) still show Occurrence as a leaf and haven't been revisited against it yet.
//
// Scope decisions, made explicit rather than silently assumed:
// - **CSV and JSON parse with zero new dependencies** (a small hand-rolled RFC4180-ish CSV parser
//   below, `JSON.parse` for JSON). **XLS/XLSX needs a real parsing library** - there's no way to
//   read a binary spreadsheet by hand - added once the user confirmed a new dependency was worth
//   it: `xlsx` (SheetJS). Installed from SheetJS's own CDN tarball
//   (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), not the npm registry package - the
//   registry version (0.18.5) carries two unpatched high-severity advisories (prototype pollution,
//   ReDoS) with no fix published there; SheetJS's own docs say the npm registry copy is stale and
//   point at their CDN for the current, patched build instead. Only the first sheet of a workbook
//   is read - a real multi-sheet ingestion (e.g. one sheet per record type) is a bigger, separate
//   task, logged rather than built speculatively.
// - **Every format - CSV, JSON, XLS, XLSX - parses entirely in the browser, never on a server.**
//   This file has no `fetch`, no API route, no `"use server"` anywhere - `handleFileChange` reads
//   the chosen file with the browser's own `FileReader` (`readAsText` for CSV/JSON,
//   `readAsArrayBuffer` for XLS/XLSX so SheetJS can read its binary bytes) and every parsing/
//   validation function runs as plain client-side JS in this page's own bundle. Confirmed directly
//   for the user: nothing about an uploaded file's contents ever leaves the browser. The gradient
//   upload card states this outright ("This is a sandbox - nothing is uploaded or processed on a
//   server") so it doesn't rely on someone reading this comment to trust it.
// - **Each row must state its own `Kind` (Event/Occurrence/Observation) and `Type` (the specific
//   subtype) as two separate columns, not inferred from which other columns happen to be
//   present.** "Individual" alone is genuinely ambiguous - it's both a valid Occurrence type and a
//   valid Observation type - so a single free-text "Type" column can't be disambiguated without
//   also knowing the Kind. This mirrors the real schema directly rather than guessing at a fuzzy
//   column-based classifier, which would be much harder to trust for something whose whole point
//   is "does the data come into the system correctly."
// - **Structural validation only, not deep semantic field-mapping - superseded for the 6 record
//   types with a real schema, see `FIELD_SCHEMA` below.** Originally: every column beyond the
//   structural ones (Kind/Type/ID/Parent ID/Label) was treated as a generic "detail field" and
//   passed through verbatim, since "building a canonical per-type field schema... is a materially
//   bigger, separate task." That task is exactly what the user asked for directly once Visit and
//   the 4 Observation types' real fields came in: "Observation could be any type - needs to be
//   baked into the JSON." `FIELD_SCHEMA` now holds each type's real field list (Site, Visit,
//   Observation Non-biotic/Community/Individual/Population) and `toRecords` scopes every schema'd
//   record to exactly its own type's fields, flagging a value that belongs to a *different* type's
//   schema as a new validation error. Record types without a provided schema yet (Occurrence's two
//   types, Transect/Ramble/Quadrat) still fall back to the original generic passthrough - this
//   wasn't a full rewrite, just extended one level down from structure into field membership for
//   the types that now have one.
// - **Sample data is deliberately NOT all-valid.** "Load sample data" seeds 11 good records (the
//   same Site SU00501/Visit VU00501/Observation OBS094-095 tree already used as this project's real
//   example content elsewhere, plus a Community and a Population Observation so all 4 Observation
//   types get exercised) and 7 deliberately broken ones, one per validation rule this tool checks -
//   a stress test that only ever sees clean data hasn't tested anything.
// - **The Site record's own field set is real, not invented** - pulled directly from the "Site
//   details ingestion template" Figma frame (`YMproGZfrFB5jUqPHPxMhk`, node `1970-143360`), per the
//   user directly: "Ignore the design of this figma reference - we just need to make sure the data
//   structure is correct." Only the field *names and shape* were taken from it (Legacy Site ID,
//   Site Name, Site Grouping, Specific Property Details, Altitude, Mud Map, Paddock, Site Comment,
//   Observer 1-3, Location Details, IBRA Region, IBRA Sub Region, Location Method, Datum,
//   Reliability, Sample Site Dimensions, Location Comment, Photopoint Marker Present/Disc Number/
//   Direction, plus one "Vegetation Type" column standing in for that frame's dynamic Custom
//   Property section - already the exact mechanism every non-structural CSV column in this tool
//   provides) - none of the frame's own accordion/map/card visual design was copied. Other record
//   types (Visit, Observation, Occurrence, ...) still use the original generic Species/Notes
//   columns - their own real field sets haven't been provided yet.
// - **Field names/shape only, never the wireframe's own example values.** Per the user directly:
//   "we need to strip out any 'value' that's visible in these wireframes. The intent is to get an
//   ingestion template first - a solid foundation." Site's `SU00501` row originally carried the
//   Figma frame's own literal example values (Legacy Site ID "Site - 5034", Site Name "2.1KM NNE
//   of Yalata", Location Details "Shapefile.shp") - removed, left blank. Applies to every future
//   record-type schema pulled from a wireframe too: take the field list and units, never the
//   filled-in example content.
// - **Selecting a tree node shows that record's own detail on the right, not a flat list of every
//   record**, per the user directly: "Left - tree view, right - details on page selection from the
//   tree. If I select site parent, then I see site details." Matches the exact tree-drives-detail
//   interaction already established in `/proto/project-detail` (`TreeView` with
//   `selectionMode="single"`, a controlled `selectedKeys`/`onSelectionChange` pair) rather than
//   inventing a new selection pattern for this lab.
// - **The ingested JSON is rooted at a single Project object, not a bare array of top-level
//   records** - normalised per the user's own reference diagram ("this is the structure"): Project
//   -> Event-Site -> Event-Visit -> Observation, one root, everything else nested under it. Matches
//   the real BDBSA model directly (see this file's own model comment above / CONTEXT.md's "BDBSA
//   domain research": "all data entered into the BDBSA must be assigned to a project number" -
//   Project is the mandatory top-level container, not a peer of the Events it holds). The Structure
//   tree gained the same single Project root (`PROJECT_NODE_ID`, label `PROJECT_LABEL` - the real
//   "Adelaide Hills Bushland Survey" project name already used elsewhere in this codebase) so the
//   visible tree and the exported JSON can never disagree about what the actual root is - the same
//   principle this file already applies to the Structure tree vs. the record cards. Selecting the
//   Project node shows a small summary card (its own direct Events/Occurrences/Observations count),
//   the same "Nested records" concept every Event-kind record already gets, one level up.
// - **Project has a real `id`: the Survey Number.** Per the user directly: "Project has an ID -
//   in this case it starts with Survey Number. That's the primary." Confirmed against real data,
//   not assumed: Site, Visit, and Species rows in a real BDBSA export all carry the same Survey
//   Number - the one identifier that ties the whole hierarchy together (see `/config/data-model`'s
//   Known Gaps). `findSurveyNumber` takes the first non-blank one found across all records;
//   `handleSave` re-applies the edited JSON's own top-level `id` afterward, since a Survey Number
//   was never one of any node's own `fields` to begin with (a project-level structural column, same
//   tier as Kind/Type/ID/Parent ID, not a regular field - see `ParsedRecord.surveyNumber`). Confirmed
//   the full chain stays Project -> Site -> Visit -> Observation, unchanged - Site is still a real,
//   distinct level (this was a live scoping question, answered directly: not a proposal to flatten
//   Visits straight onto Project).

import { useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { Key, Selection } from "react-aria-components";
import { read as readWorkbook, utils as sheetUtils } from "xlsx";
import { UploadCloud02, AlertCircle, AlertTriangle, CheckCircle, XCircle, Database02, FileCode01, Copy01, Check, Save01, Lock01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Table, TableHeader, Column, TableBody, Row, Cell } from "@/components/base/table/table";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Tabs, TabList, Tab } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";
// The corrected record model and the real per-type field schema (`FIELD_SCHEMA`) live in
// `config/data-model-schema.ts`, shared with the `/config/data-model` reference page, rather than
// duplicated here - two independent copies of ~130 field names would drift the moment one changed.
// See that file's own header comment for the Figma frames this schema is sourced from.
import {
  isRecordKind,
  VALID_TYPES_BY_KIND,
  FIELD_SCHEMA,
  ALL_SCHEMA_FIELD_NAMES,
  BDBSA_KEY_CROSSWALK,
  FIELD_UNITS,
  classifySpeciesRow,
  type TaxonomicType,
} from "@/config/data-model-schema";

// ── Parsing - CSV (a small, real RFC4180-ish parser: handles quoted fields, embedded commas,
// escaped quotes) and JSON (a plain array of row objects). No third-party dependency for either -
// see the header comment on why XLSX is out of scope for this pass. ──
type RawRow = Record<string, string>;

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function parseCsv(text: string): RawRow[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const row: RawRow = {};
    headers.forEach((h, i) => {
      row[h] = (r[i] ?? "").trim();
    });
    return row;
  });
}

function parseJson(text: string): RawRow[] {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("Expected a JSON array of records");
  return data.map((item) => {
    const row: RawRow = {};
    if (item && typeof item === "object") {
      for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        row[key] = value === null || value === undefined ? "" : String(value);
      }
    }
    return row;
  });
}

// XLS/XLSX - read entirely from the file's own bytes (an `ArrayBuffer`, handed up from
// `UploadPanel`'s `FileReader.readAsArrayBuffer`) via SheetJS, still 100% client-side - no
// different from `parseCsv`/`parseJson` in that respect, just needs a real binary parser instead of
// a hand-rolled one. Only the first sheet is read - see this file's header comment.
function parseXlsx(buffer: ArrayBuffer): RawRow[] {
  const workbook = readWorkbook(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("This workbook has no sheets");
  const sheet = workbook.Sheets[sheetName];
  const rows = sheetUtils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  return rows.map((row) => {
    const out: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value === null || value === undefined ? "" : String(value);
    }
    return out;
  });
}

// "Load sample data could take more than one XLSX, CSV or JSON files to smartly map everything
// together" - per the user directly. Each file is parsed independently (it may have its own
// header/column shape - a Site export and a Species export never share a schema), then every
// file's rows are concatenated into one array before `toRecords`/`buildTree` ever run. That's the
// whole mechanism: a Visit row from file 2 referencing a Site ID that only exists in file 1
// resolves correctly, for free, the moment both files' rows sit in the same array this tool
// already builds one tree from - no separate cross-file join logic needed on top of Parent ID.
// "It didn't smartly map. Anything that starts with any filename that starts with site is mapped
// to site, any filename that starts with visit is mapped to visit, anything that starts with
// species is mapped to observations." Per the user directly, after uploading the real BDBSA files
// together - none of SITE_SU1211.csv/VISIT_SU1211.csv/SPECIES_FAUNA_SU1211.csv/
// SPECIES_FLORA_SU1211.csv carry a Kind/Type column at all (confirmed - real exports never do), so
// every row fell back to fully generic passthrough with no way to tell what it even was. A
// filename-based convention is the pragmatic fix: it's real, observable metadata (unlike guessing
// Kind/Type from which columns happen to be populated) and it's exactly the naming pattern BDBSA's
// own exports already use. Species files only map to Kind "Observation," not a specific Type -
// real Species data has no field stating Individual/Population/Community/Non-biotic at all (see
// `/config/data-model`'s Known Gaps), so guessing one would be fabricating data this tool otherwise
// goes out of its way never to invent. Never overrides a row that already states its own Kind/Type.
// The two species-specific prefixes must come before the generic "species" fallback - `.find`
// takes the first match, and "species_fauna_su1211..."/"species_flora_su1211..." both also start
// with plain "species". The generic entry stays for a hand-named upload that doesn't follow the
// real BDBSA SPECIES_FAUNA_*/SPECIES_FLORA_* convention - it still gets Kind=Observation, just no
// taxonomic-type hint, so `expandSpeciesOccurrences` below falls back to the row's own Taxonomic
// Type/SPECIESTYPE column instead (see that function's own comment).
const FILENAME_KIND_TYPE_RULES: { prefix: string; kind: string; type?: string; taxonomicType?: TaxonomicType }[] = [
  { prefix: "site", kind: "Event", type: "Site" },
  { prefix: "visit", kind: "Event", type: "Visit" },
  { prefix: "species_fauna", kind: "Observation", taxonomicType: "Fauna" },
  { prefix: "species_flora", kind: "Observation", taxonomicType: "Flora" },
  { prefix: "species", kind: "Observation" },
];

function applyFilenameKindType(rows: RawRow[], fileName: string): RawRow[] {
  const base = fileName.toLowerCase();
  const rule = FILENAME_KIND_TYPE_RULES.find((r) => base.startsWith(r.prefix));
  if (!rule) return rows;

  return rows.map((row) => {
    const kindCol = findColumn(row, ["kind"]);
    const typeCol = findColumn(row, ["type"]);
    const hasKind = kindCol ? Boolean(row[kindCol]) : false;
    const hasType = typeCol ? Boolean(row[typeCol]) : false;

    const next = { ...row };
    if (!hasKind) next[kindCol ?? "Kind"] = rule.kind;
    if (!hasType && rule.type) next[typeCol ?? "Type"] = rule.type;
    // A hidden, structural-only marker - stripped by `expandSpeciesOccurrences` before any record
    // ever reaches `toRecords`, never shown as a real field.
    if (rule.taxonomicType) next.__taxonomicTypeHint = rule.taxonomicType;
    return next;
  });
}

function parseFileToRows(file: File): Promise<RawRow[]> {
  if (/\.xlsx?$/i.test(file.name)) {
    return file.arrayBuffer().then(parseXlsx).then((rows) => applyFilenameKindType(rows, file.name));
  }
  return file.text().then((text) => {
    const isJson = file.name.toLowerCase().endsWith(".json") || text.trim().startsWith("[");
    const rows = isJson ? parseJson(text) : parseCsv(text);
    return applyFilenameKindType(rows, file.name);
  });
}

// Case/spacing-insensitive header matching, so "Parent ID", "parent_id", and "ParentId" all
// resolve to the same structural (or schema) field - real-world spreadsheets are never perfectly
// consistent.
function normalizeHeader(s: string): string {
  return s.toLowerCase().replace(/[\s_-]/g, "");
}

function findColumn(row: RawRow, candidates: string[]): string | null {
  const normalizedCandidates = candidates.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    if (normalizedCandidates.includes(normalizeHeader(key))) return key;
  }
  return null;
}

function isKnownSchemaFieldName(key: string): boolean {
  const normalized = normalizeHeader(key);
  return ALL_SCHEMA_FIELD_NAMES.some((f) => normalizeHeader(f) === normalized);
}

// "Each row on the species CSVs are occurrences... this is a nuance that sits between visits and
// observations" - per the user directly, confirmed live: Occurrence is a real tree level (Visit ->
// Occurrence -> Observation), not just a label, and Fauna Number Observed > 1 resolves to
// Observation:Population, not the literally-stated "community observation" (see `classifySpeciesRow`
// in `config/data-model-schema.ts` for the full, confirmed rule and reasoning). This closes the
// "No explicit Observation-type discriminator in real data" Known Gap that schema file used to
// carry - a real species row already tells you everything needed to place it.
//
// Runs once on the whole combined upload (`applyRows`), after every file's Kind has already been
// filename-inferred but before `toRecords` ever runs - a single pass means the synthetic Occurrence/
// Observation IDs this creates only need to be unique within one call, no cross-file collision risk
// from processing each file in isolation.
//
// A row only splits when it's a genuine, unclassified species row: Kind is already "Observation"
// (stamped by `applyFilenameKindType`) and both Type and ID are still blank - real BDBSA SPECIES
// exports have neither. A row that already carries an explicit Type or ID (any manually-authored or
// sample-data Observation) is left untouched, same "never override an explicit value" rule as
// everywhere else in this file.
//
// Taxonomic Type (Flora vs Fauna) is read from `__taxonomicTypeHint` first - the filename-derived
// signal `applyFilenameKindType` stamps on for real SPECIES_FAUNA_*/SPECIES_FLORA_* uploads, since
// the real Taxonomic Type/SPECIESTYPE *column* only encodes a narrower group (Bird/Reptile/Plant/
// ...), not literally "Flora"/"Fauna". When no filename hint is available (a hand-named upload),
// that column value is used as a fallback: anything containing "plant" reads as Flora, anything
// else as Fauna. A row with no Number Observed value and no way to tell Flora from Fauna at all is
// left as a single, unclassified Observation - the same honest "Missing Type" outcome this tool
// already produced before this feature existed, never a guess with no real signal behind it.
function expandSpeciesOccurrences(rows: RawRow[]): RawRow[] {
  return rows.flatMap((row, i) => {
    const { __taxonomicTypeHint, ...rest } = row;

    const kindCol = findColumn(rest, ["kind"]);
    const typeCol = findColumn(rest, ["type"]);
    const idCol = findColumn(rest, ["id", "recordid"]);
    const kind = kindCol ? rest[kindCol] : "";
    const hasType = typeCol ? Boolean(rest[typeCol]) : false;
    const hasId = idCol ? Boolean(rest[idCol]) : false;
    if (kind !== "Observation" || hasType || hasId) return [rest];

    const numberObservedCol = findColumn(rest, ["number observed", "numobserved"]);
    const numberObserved = numberObservedCol ? rest[numberObservedCol] : "";

    let taxonomicType: TaxonomicType | "" = "";
    if (__taxonomicTypeHint === "Flora" || __taxonomicTypeHint === "Fauna") {
      taxonomicType = __taxonomicTypeHint;
    } else {
      const taxonomicTypeCol = findColumn(rest, ["taxonomic type", "speciestype"]);
      const rawTaxonomicType = taxonomicTypeCol ? rest[taxonomicTypeCol] : "";
      if (rawTaxonomicType) taxonomicType = rawTaxonomicType.toLowerCase().includes("plant") ? "Flora" : "Fauna";
    }

    if (!numberObserved || !taxonomicType) return [rest];
    const classification = classifySpeciesRow(taxonomicType, numberObserved);
    if (!classification) return [rest];

    const nsxCodeCol = findColumn(rest, ["nsxcode", "nsx code"]);
    const nsxCode = nsxCodeCol ? rest[nsxCodeCol] : "";
    const idBase = nsxCode || `SP${i}`;
    const occurrenceId = `${idBase}-${i}-OCC`;
    const observationId = `${idBase}-${i}-OBS`;

    const surveyCol = findColumn(rest, ["survey number", "survey #", "surveynr", "survey"]);
    const eastingCol = findColumn(rest, ["easting", "old easting", "oldeasting"]);
    const northingCol = findColumn(rest, ["northing", "old northing", "oldnorthing"]);
    const zoneCol = findColumn(rest, ["zone", "old zone", "oldzone"]);
    const visitDateCol = findColumn(rest, ["edited visit", "visit date", "visitdate"]);

    // The Occurrence only carries what actually identifies "this real-world occurrence" - the
    // structural coordinate/date columns `resolveNaturalKeyRelationships` needs to trace it back to
    // its Visit, plus species identity and the raw count. The ecological detail columns (Weight,
    // Strata, Life Form, ...) belong to the Observation underneath it, not duplicated here.
    const occurrenceRow: RawRow = {
      Kind: "Occurrence",
      Type: classification.occurrenceType,
      ID: occurrenceId,
      ...(surveyCol ? { "Survey Number": rest[surveyCol] } : {}),
      ...(eastingCol ? { Easting: rest[eastingCol] } : {}),
      ...(northingCol ? { Northing: rest[northingCol] } : {}),
      ...(zoneCol ? { Zone: rest[zoneCol] } : {}),
      ...(visitDateCol ? { "Visit date": rest[visitDateCol] } : {}),
      ...(nsxCode ? { "NSX code": nsxCode } : {}),
      "Number Observed": numberObserved,
      "Taxonomic Type": taxonomicType,
    };

    const observationRow: RawRow = {
      ...rest,
      [typeCol ?? "Type"]: classification.observationType,
      [idCol ?? "ID"]: observationId,
      "Parent ID": occurrenceId,
    };

    return [occurrenceRow, observationRow];
  });
}

// `flagged` marks a field that isn't part of any known schema for this record's own kind:type -
// either a genuine BDBSA column we haven't mapped yet, or a real custom property; this tool can't
// tell the two apart, so it flags both for a human to hand-check rather than silently accepting
// either. See the "// double check this" comment `serializeIngestedNode` adds for these in the
// exported JSON, per the user directly: "If there's gaps identified, let's add a comment on the
// JSON."
interface ParsedField {
  field: string;
  value: string;
  flagged?: boolean;
}

interface ParsedRecord {
  rowNumber: number;
  id: string;
  parentId: string;
  label: string;
  kind: string;
  type: string;
  fields: ParsedField[];
  errors: string[];
  // Set by `validateRecords` - true when this record's own Kind is missing/invalid, or its Parent
  // ID is dangling/self-referencing/wrongly-shaped, i.e. its *place in the hierarchy* genuinely
  // can't be trusted. Deliberately not triggered by a missing/invalid Type alone - real BDBSA
  // Species data has no Type column at all, yet its placement can still be confirmed via
  // `resolveNaturalKeyRelationships`'s coordinate+date traceback; Type problems stay real, visible
  // errors on the record without blocking it from the Resolved tree it's actually, confidently
  // nested in. Drives the Structure tree's Resolved/Unresolved split - see `StructureTree` below.
  unresolved: boolean;
  // "Project has an ID - it starts with Survey Number. That's the primary." Per the user directly,
  // confirmed against real data: every row of a real BDBSA export (Site, Visit, and Species alike)
  // carries the same Survey Number, the one true project-level identifier. A structural column, not
  // a regular field - excluded from `fields` in `toRecords` the same way ID/Parent ID/Kind/Type
  // already are, and rolled up into the single Project root's own `id` by `toIngestedProject`.
  surveyNumber: string;
  // "I think I figured out the traceback from Obs to Visit to Site to Project" - per the user
  // directly, confirmed against real data (see `resolveNaturalKeyRelationships` below for the full
  // reasoning). These four are read alongside `fields`, never excluded from it - Easting/Northing/
  // Zone are real recognised fields for Non-biotic/Community/Individual/Population already, so they
  // still display normally; this is a parallel read for the matching algorithm, not a second
  // source of truth for what's shown.
  easting: string;
  northing: string;
  zone: string;
  // A Visit's own date (`EDITED_VISIT`) and an Observation's reference to which Visit it belongs to
  // (`VISITDATE`/`Visit date`) are two names for the same concept from each side - one lookup finds
  // whichever applies.
  visitDateKey: string;
  // A real Site row has no single ID column - CAMPMAP-QUADSITE-PATCHQUAD is its own natural
  // identity instead. Blank when any of the three is missing (never a partial, misleading key).
  siteNaturalKey: string;
}

function toRecords(rows: RawRow[]): ParsedRecord[] {
  return rows.map((row, i) => {
    const kindCol = findColumn(row, ["kind"]);
    const typeCol = findColumn(row, ["type"]);
    const idCol = findColumn(row, ["id", "recordid"]);
    const parentIdCol = findColumn(row, ["parentid", "parent"]);
    const labelCol = findColumn(row, ["label", "name"]);
    const surveyCol = findColumn(row, ["survey number", "survey #", "surveynr", "survey"]);
    const eastingCol = findColumn(row, ["easting", "old easting", "oldeasting"]);
    const northingCol = findColumn(row, ["northing", "old northing", "oldnorthing"]);
    const zoneCol = findColumn(row, ["zone", "old zone", "oldzone"]);
    const visitDateCol = findColumn(row, ["edited visit", "visit date", "visitdate"]);
    const campmapCol = findColumn(row, ["campmap"]);
    const quadsiteCol = findColumn(row, ["quadsite"]);
    const patchquadCol = findColumn(row, ["patchquad"]);

    const errors: string[] = [];
    if (!kindCol) errors.push("No \"Kind\" column found");
    if (!typeCol) errors.push("No \"Type\" column found");
    if (!idCol) errors.push("No \"ID\" column found");

    const kind = kindCol ? row[kindCol] : "";
    const type = typeCol ? row[typeCol] : "";
    const structuralCols = new Set([kindCol, typeCol, idCol, parentIdCol, labelCol, surveyCol].filter((c): c is string => c !== null));
    const schemaFieldNames = FIELD_SCHEMA[`${kind}:${type}`];

    // A record whose kind:type has a real schema gets exactly that schema's own fields, always
    // shown even when blank (matching how the real templates render every field, dash if empty).
    // Any other populated column either belongs to a *different* type's schema (a real mistake -
    // flagged as an error) or is a genuinely novel name (a legitimate Custom Property field, passed
    // through same as this tool has always done for an unrecognised type). See this file's header
    // comment / the `FIELD_SCHEMA` comment for the full reasoning.
    const fields: ParsedField[] = [];
    const matchedCols = new Set<string>();
    if (schemaFieldNames) {
      // "The UI field names are the source of truth... don't show BDBSA column names in the UI" -
      // per the user directly, reversing an earlier decision. `findColumn` still matches a schema
      // field against whatever the real file happens to call it (`METHODNR`, `MUIRCODE`, ...) -
      // that part is unchanged, real data's own header text still decides *whether* a column
      // counts as a match - but the field is now always stored and displayed under our own
      // canonical name, never the raw column text. Two reasons: it's what the user asked for
      // directly, and it fixes a real bug the old behaviour caused - `BDBSA_KEY_CROSSWALK` and
      // `FIELD_UNITS` are both keyed by our canonical names, so displaying the raw column text
      // instead silently broke both annotations for any real file whose header didn't happen to
      // already match our schema's own wording (i.e. every real file's schema'd fields).
      for (const field of schemaFieldNames) {
        const col = findColumn(row, [field]);
        if (col) matchedCols.add(col);
        fields.push({ field, value: col ? row[col] : "" });
      }
    }
    for (const [key, value] of Object.entries(row)) {
      if (structuralCols.has(key) || matchedCols.has(key)) continue;
      if (!schemaFieldNames) {
        // No known schema for this record's kind:type at all (often because Kind/Type are missing
        // entirely, e.g. a raw legacy export with no normalization) - every field here is equally
        // unverified, not just the ones that happen to collide with another type's schema. Flagged
        // the same way, so an unclassified file reads as *more* suspicious in the JSON, not less.
        // Caught directly by the user uploading a real, unnormalized BDBSA XLSX: with no Kind/Type
        // column, nothing was flagged at all and the JSON looked deceptively clean.
        fields.push({ field: key, value, flagged: true });
      } else if (value && isKnownSchemaFieldName(key)) {
        errors.push(`"${key}" isn't part of the ${kind || "Unknown"}:${type || "Unknown"} ingestion template - it belongs to a different record type`);
      } else if (value) {
        // Genuinely novel on a schema'd type - a real custom property, or a real BDBSA column this
        // schema hasn't mapped yet. Flagged for review rather than silently accepted either way.
        fields.push({ field: key, value, flagged: true });
      }
    }

    // "Auto name the tree structure upon ingestion - <Event name> <Event ID>, e.g. Site SU00501."
    // Per the user directly. A real BDBSA export has no Label column at all, so without this every
    // record fell back to a bare ID (or, missing that too, an opaque "Row 50") - this is the fix at
    // the source, not just a display-time patch, so the auto-generated name flows into the exported
    // JSON's own `label` too. An explicit Label column, when present, always wins.
    const id = idCol ? row[idCol] : "";
    const explicitLabel = labelCol ? row[labelCol] : "";
    const label = explicitLabel || (type && id ? `${type} ${id}` : id);

    const campmap = campmapCol ? row[campmapCol] : "";
    const quadsite = quadsiteCol ? row[quadsiteCol] : "";
    const patchquad = patchquadCol ? row[patchquadCol] : "";

    return {
      rowNumber: i + 2, // +1 for 0-index, +1 for the header row
      id,
      parentId: parentIdCol ? row[parentIdCol] : "",
      label,
      kind,
      type,
      fields,
      errors,
      unresolved: false, // finalised by `validateRecords`
      surveyNumber: surveyCol ? row[surveyCol] : "",
      easting: eastingCol ? row[eastingCol] : "",
      northing: northingCol ? row[northingCol] : "",
      zone: zoneCol ? row[zoneCol] : "",
      visitDateKey: visitDateCol ? row[visitDateCol] : "",
      siteNaturalKey: campmap && quadsite && patchquad ? `${campmap}-${quadsite}-${patchquad}` : "",
    };
  });
}

// "I think I figured out the traceback from Obs to Visit to Site to Project... Can we simulate that
// traceback visually?" - per the user directly, confirmed against real data (see `/config/data-
// model`'s "No ID-based relationships in the legacy system" Known Gap). A real BDBSA export has no
// Parent ID column at all, so without this every Visit and Occurrence would land in Unresolved
// purely for lacking one, even once `applyFilenameKindType`/`expandSpeciesOccurrences` have
// correctly worked out their Kind/Type. This derives the same relationship a human would trace by
// hand:
// - A Visit finds its Site by matching (Survey Number, Easting, Northing).
// - An Occurrence finds its Site the same way, then finds the specific Visit at that Site whose own
//   date matches the Occurrence's `visitDateKey` - coordinates alone aren't enough once a Site has
//   more than one Visit. (Not Observation, since `expandSpeciesOccurrences` already gives every
//   Observation an explicit Parent ID pointing at its own Occurrence sibling - see that function's
//   own comment for why Occurrence is the real intermediate tree level now, not Observation.)
// Real Site/Visit rows have no single ID column either, so both get a synthetic one first
// (CAMPMAP-QUADSITE-PATCHQUAD for a Site, falling back to its own coordinates; coordinates + visit
// date for a Visit) - otherwise there'd be nothing for a derived Parent ID to actually point at. An
// Observation-kind row that `expandSpeciesOccurrences` couldn't classify (no Number Observed/
// Taxonomic Type signal) still falls back to its own NSX-code-based synthetic ID here, same as
// before this feature existed, so it still gets a real name in the tree instead of the bare
// "Row 50" placeholder even while unclassified.
// Never overrides a record that already has an explicit Parent ID or ID - this only fills in what's
// genuinely missing, same "no silent drop, no fabrication beyond what the data actually supports"
// principle as everywhere else in this tool. An Occurrence whose coordinates match a Site but whose
// date matches no real Visit stays unresolved rather than being silently attached to the Site
// anyway - a failed date match is a real data-quality question worth surfacing, not smoothing over.
function findFieldValue(record: ParsedRecord, candidates: string[]): string {
  const normalized = candidates.map(normalizeHeader);
  return record.fields.find((f) => normalized.includes(normalizeHeader(f.field)))?.value ?? "";
}

function resolveNaturalKeyRelationships(records: ParsedRecord[]): ParsedRecord[] {
  const withSiteIds = records.map((r) => {
    if (r.kind === "Event" && r.type === "Site" && !r.id) {
      const syntheticId = r.siteNaturalKey || (r.easting && r.northing ? `${r.easting}-${r.northing}` : "");
      if (syntheticId) return { ...r, id: syntheticId, label: r.label || `${r.type} ${syntheticId}` };
    }
    if (r.kind === "Observation" && !r.id) {
      const nsxCode = findFieldValue(r, ["nsxcode", "nsx code"]);
      const syntheticId = `${nsxCode || "OBS"}-${r.rowNumber}`;
      return { ...r, id: syntheticId, label: r.label || `${r.kind} ${syntheticId}` };
    }
    return r;
  });

  const siteByCoord = new Map<string, ParsedRecord>();
  for (const r of withSiteIds) {
    if (r.kind === "Event" && r.type === "Site" && r.easting && r.northing) {
      siteByCoord.set(`${r.surveyNumber}|${r.easting}|${r.northing}`, r);
    }
  }

  const withVisitIds = withSiteIds.map((r) => {
    if (r.kind === "Event" && r.type === "Visit" && !r.id && r.easting && r.northing) {
      const syntheticId = `${r.surveyNumber}-${r.easting}-${r.northing}-${r.visitDateKey || r.rowNumber}`;
      return { ...r, id: syntheticId, label: r.label || `${r.type} ${syntheticId}` };
    }
    return r;
  });

  const visitByCoordAndDate = new Map<string, ParsedRecord>();
  for (const r of withVisitIds) {
    if (r.kind === "Event" && r.type === "Visit" && r.easting && r.northing && r.visitDateKey) {
      visitByCoordAndDate.set(`${r.surveyNumber}|${r.easting}|${r.northing}|${r.visitDateKey}`, r);
    }
  }

  return withVisitIds.map((r) => {
    if (r.parentId) return r; // an explicit relationship always wins - never overridden

    if (r.kind === "Event" && r.type === "Visit" && r.easting && r.northing) {
      const site = siteByCoord.get(`${r.surveyNumber}|${r.easting}|${r.northing}`);
      if (site) return { ...r, parentId: site.id };
    }

    if (r.kind === "Occurrence" && r.easting && r.northing && r.visitDateKey) {
      const visit = visitByCoordAndDate.get(`${r.surveyNumber}|${r.easting}|${r.northing}|${r.visitDateKey}`);
      if (visit) return { ...r, parentId: visit.id };
    }

    return r;
  });
}

// ── Validation - the actual "checks and balances." Every rule here is a direct, real rule from
// the corrected data model, not an invented one. ──
function validateRecords(records: ParsedRecord[]): ParsedRecord[] {
  const idCounts = new Map<string, number>();
  for (const r of records) {
    if (r.id) idCounts.set(r.id, (idCounts.get(r.id) ?? 0) + 1);
  }
  const byId = new Map(records.filter((r) => r.id).map((r) => [r.id, r] as const));

  return records.map((r) => {
    const errors = [...r.errors];
    // True the moment this record's own Kind/Type is invalid, or its Parent ID can't be trusted
    // (dangling, self-referencing, or the wrong shape) - i.e. its place in the hierarchy is
    // genuinely in question, not just a field-level mismatch. Computed here, not duplicated
    // elsewhere - `StructureTree`'s Resolved/Unresolved split reads this flag directly.
    let unresolved = false;

    if (!r.id) errors.push("Missing ID");
    else if ((idCounts.get(r.id) ?? 0) > 1) errors.push(`Duplicate ID "${r.id}" - IDs must be unique across the file`);

    // Missing/invalid Kind blocks *placement* - most nesting rules below need to know at least
    // whether this is an Event/Occurrence/Observation. Missing/invalid Type does not: real BDBSA
    // Species data has no Type column at all (see `/config/data-model`'s Known Gaps), yet its Kind,
    // and therefore where it belongs, can still be confirmed via `resolveNaturalKeyRelationships`'s
    // coordinate+date traceback. So Type problems stay real, visible errors - just not an
    // `unresolved` trigger on their own. (The one placement rule that does need Type - "a Site
    // can't be a child of a Visit" - simply can't be evaluated when Type is unknown, and correctly
    // doesn't fire rather than guessing.)
    if (!r.kind) {
      if (!errors.some((e) => e.includes("Kind"))) errors.push("Missing Kind");
      unresolved = true;
    } else if (!isRecordKind(r.kind)) {
      errors.push(`Unknown Kind "${r.kind}" - expected Event, Occurrence, or Observation`);
      unresolved = true;
    } else if (!r.type) {
      errors.push("Missing Type");
    } else if (!VALID_TYPES_BY_KIND[r.kind].includes(r.type)) {
      errors.push(`"${r.type}" isn't a valid ${r.kind} type - expected ${VALID_TYPES_BY_KIND[r.kind].join(", ")}`);
    }

    if (r.parentId) {
      const parent = byId.get(r.parentId);
      if (!parent) {
        errors.push(`Parent ID "${r.parentId}" doesn't match any record in this file`);
        unresolved = true;
      } else if (parent.rowNumber === r.rowNumber) {
        errors.push(`Parent ID "${r.parentId}" is this record's own ID - a record can't be its own parent`);
        unresolved = true;
      } else {
        // Refined per the user directly: "each row on the species CSVs are occurrences... this is
        // a nuance that sits between visits and observations," confirmed as a real tree level, not
        // just a label - Occurrence -> Observation. An Observation is still always a leaf; an
        // Occurrence may now parent exactly one thing, its own Observation, and nothing else.
        if (parent.kind === "Observation") {
          errors.push(`Parent "${r.parentId}" is an Observation - Observations can never be a parent`);
          unresolved = true;
        } else if (parent.kind === "Occurrence" && r.kind !== "Observation") {
          errors.push(`Parent "${r.parentId}" is an Occurrence - an Occurrence can only ever be the parent of its own Observation`);
          unresolved = true;
        }
        if (r.kind === "Event" && parent.kind !== "Event") {
          errors.push(`An Event's parent must be another Event, not ${parent.kind || "unknown"}`);
          unresolved = true;
        }
        if (r.type === "Site" && parent.type === "Visit") {
          errors.push(`A Site cannot be a child of a Visit ("${r.parentId}")`);
          unresolved = true;
        }
      }
    } else if (r.kind === "Occurrence" || r.kind === "Observation") {
      errors.push(`${r.kind} records need a Parent ID - they can't sit at the root`);
      unresolved = true;
    }

    return { ...r, errors, unresolved };
  });
}

// ── Structure - not just "is each row individually valid," but "does the file actually assemble
// into a tree" - the user directly: "we also need the tree structure... this needs to be visible
// as well." Built defensively, not just for the happy path, since this same data is what's being
// stress-tested: duplicate IDs resolve to whichever record was seen first (matching how
// `validateRecords` above resolves parent lookups, so the tree and the error messages never
// disagree about which record a given ID means); a dangling or missing Parent ID surfaces the
// record as its own root instead of silently dropping it, same "no silent drop" rule as everywhere
// else in this codebase; and rendering guards against a genuine parent/child cycle (A's parent is
// B, B's parent is A) by refusing to re-descend into an ancestor already on the current branch,
// so a malformed file can't hang the page in infinite recursion. ──
interface TreeNode {
  record: ParsedRecord;
  children: TreeNode[];
}

function buildTree(records: ParsedRecord[]): TreeNode[] {
  const firstById = new Map<string, ParsedRecord>();
  for (const r of records) {
    if (r.id && !firstById.has(r.id)) firstById.set(r.id, r);
  }
  const nodeByRow = new Map<number, TreeNode>(records.map((r) => [r.rowNumber, { record: r, children: [] }]));

  const roots: TreeNode[] = [];
  for (const r of records) {
    const node = nodeByRow.get(r.rowNumber)!;
    const parent = r.parentId ? firstById.get(r.parentId) : undefined;
    if (!parent || parent.rowNumber === r.rowNumber) {
      roots.push(node);
    } else {
      nodeByRow.get(parent.rowNumber)!.children.push(node);
    }
  }
  return roots;
}

// "Nested Records" - the same Events/Occurrences/Observations child-count breakdown the real Site
// details ingestion template surfaces directly under a Site's own fields (see this file's header
// comment for the Figma frame this is sourced from). Computed once from the same `TreeNode[]` the
// Structure tree and the JSON panel already share, so it can't disagree with either about what's
// actually nested under a given record. Only ever shown for Event-kind records - Occurrences/
// Observations are always leaves in the corrected data model, so a "0/0/0" row on every one of them
// would be pure noise, not information.
interface NestedCounts {
  events: number;
  occurrences: number;
  observations: number;
}

function countChildrenByKind(children: TreeNode[]): NestedCounts {
  const counts: NestedCounts = { events: 0, occurrences: 0, observations: 0 };
  for (const child of children) {
    if (child.record.kind === "Event") counts.events++;
    else if (child.record.kind === "Occurrence") counts.occurrences++;
    else if (child.record.kind === "Observation") counts.observations++;
  }
  return counts;
}

function buildNestedCountsByRow(roots: TreeNode[]): Map<number, NestedCounts> {
  const byRow = new Map<number, NestedCounts>();
  const visit = (node: TreeNode) => {
    byRow.set(node.record.rowNumber, countChildrenByKind(node.children));
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return byRow;
}

// The same tree, serialized - "expose the ingestion JSON file as well." Deliberately built from
// the same `TreeNode[]` the Structure panel renders, not a second independent pass over
// `records`, so the JSON and the visible tree can never disagree about how the data nested. Same
// "pure structure" scope as the tree view itself - no `errors` field here either; this is what the
// data *looks like once ingested*, not a validation report (that's `RecordCard`'s job, unchanged).
interface IngestedNode {
  id: string;
  kind: string;
  type: string;
  label: string;
  fields: Record<string, string>;
  flaggedFields: string[];
  children: IngestedNode[];
}

function toIngestedJson(nodes: TreeNode[]): IngestedNode[] {
  return nodes.map((n) => ({
    id: n.record.id,
    kind: n.record.kind,
    type: n.record.type,
    label: n.record.label,
    fields: Object.fromEntries(n.record.fields.map((f) => [f.field, f.value])),
    flaggedFields: n.record.fields.filter((f) => f.flagged).map((f) => f.field),
    children: toIngestedJson(n.children),
  }));
}

// The single Project root every ingested file's records nest under - real BDBSA name already used
// elsewhere in this codebase (`/proto/project-detail`'s `PROJECT_NAME`), not a new placeholder.
// `PROJECT_NODE_ID` is a synthetic id (no CSV/JSON row ever produces it) so it can't collide with a
// real record's `row-${rowNumber}` tree key.
const PROJECT_LABEL = "Adelaide Hills Bushland Survey";
const PROJECT_NODE_ID = "project-root";

// How many Unresolved records show before "Load more" - see `StructureTree`'s own comment.
const UNRESOLVED_PAGE_SIZE = 50;

interface IngestedProject {
  id: string;
  kind: "Project";
  label: string;
  children: IngestedNode[];
}

// "Project has an ID - it starts with Survey Number. That's the primary." Per the user directly.
// Every record in a real export carries the same Survey Number (confirmed against real Site/Visit/
// Species files - it's the one identifier that ties the whole hierarchy together), so the first
// non-blank one found across all records is the Project's own id - not per-node data, a project-
// level identifier, same tier as `PROJECT_LABEL`.
function findSurveyNumber(records: ParsedRecord[]): string {
  return records.find((r) => r.surveyNumber)?.surveyNumber ?? "";
}

function toIngestedProject(records: ParsedRecord[]): IngestedProject {
  return { id: findSurveyNumber(records), kind: "Project", label: PROJECT_LABEL, children: toIngestedJson(buildTree(records)) };
}

// "I need a template view of this as well - with all fields and all values stripped out." Same
// tree shape as the ingested JSON, same field names in the same order (so it still shows exactly
// what a Site/Visit/Observation record needs), but every id/label/field value is blanked - a clean,
// reusable ingestion template, not a specific record's data. Kind/Type stay - they're what
// distinguishes a Site template from a Visit template, not instance data to strip. This is the
// shape meant to "roll into the Projects screen" per the user directly - a real download/copy
// target for "here's what to fill in," independent of whatever happens to be loaded right now.
function toTemplateNode(node: IngestedNode): IngestedNode {
  return {
    id: "",
    kind: node.kind,
    type: node.type,
    label: "",
    fields: Object.fromEntries(Object.keys(node.fields).map((field) => [field, ""])),
    flaggedFields: node.flaggedFields,
    children: node.children.map(toTemplateNode),
  };
}

function toTemplateProject(project: IngestedProject): IngestedProject {
  return { id: "", kind: project.kind, label: "", children: project.children.map(toTemplateNode) };
}

// "If there's gaps identified, let's add a comment on the JSON" - per the user directly. JSON has
// no comment syntax, so this is a small hand-rolled serializer (not `JSON.stringify`) that appends
// a real `// double check this` line comment after any field whose name isn't part of a known
// schema for its record's own kind:type (see `ParsedField.flagged`/`IngestedNode.flaggedFields`
// above). Indentation matches `JSON.stringify(x, null, 2)` exactly (2 spaces per level) so this
// reads identically to the plain JSON it replaces - only the comments are new. `stripJsonComments`
// below is the exact inverse, used before `JSON.parse` on Save so an edited-but-still-annotated
// blob keeps working.
// Annotates our own field names with their real BDBSA column, per the user directly: "My only ask
// was the have BDBSA key mapped to the template. That's it." - never a replacement of our
// Figma-shaped field names (that was a different, wrong fix, tried and reverted). Only speaks up
// for `kind:type`s actually present in `BDBSA_KEY_CROSSWALK` - silent for everything else, rather
// than guessing at a mapping nobody's confirmed yet. Also annotates the field's real-world unit
// (`FIELD_UNITS`) when one applies - "let's get rid of any units in the concept names, like Weight
// (gms) - let's just keep Weight... handle that in the units bit in the json," per the user
// directly. Units used to be baked into the field name itself; now the name always matches the
// real column exactly, and the unit is this separate, explicit `// Unit: gms` note instead.
function serializeIngestedFields(fields: Record<string, string>, flaggedFields: string[], kind: string, type: string, indent: string): string {
  const entries = Object.entries(fields);
  if (entries.length === 0) return "{}";
  const crosswalk = BDBSA_KEY_CROSSWALK[`${kind}:${type}`];
  const units = FIELD_UNITS[`${kind}:${type}`];
  const lines = entries.map(([key, value], i) => {
    const comma = i < entries.length - 1 ? "," : "";
    const notes: string[] = [];
    if (flaggedFields.includes(key)) notes.push("double check this");
    if (crosswalk && key in crosswalk) notes.push(crosswalk[key] ? `BDBSA: ${crosswalk[key]}` : "BDBSA: no equivalent found");
    if (units && key in units) notes.push(`Unit: ${units[key]}`);
    const comment = notes.length > 0 ? ` // ${notes.join(" - ")}` : "";
    return `${indent}  ${JSON.stringify(key)}: ${JSON.stringify(value)}${comma}${comment}`;
  });
  return `{\n${lines.join("\n")}\n${indent}}`;
}

function serializeIngestedChildren(children: IngestedNode[], indent: string): string {
  if (children.length === 0) return "[]";
  const lines = children.map((child) => `${indent}  ${serializeIngestedNode(child, `${indent}  `)}`);
  return `[\n${lines.join(",\n")}\n${indent}]`;
}

function serializeIngestedNode(node: IngestedNode, indent: string): string {
  const inner = `${indent}  `;
  return (
    `{\n` +
    `${inner}"id": ${JSON.stringify(node.id)},\n` +
    `${inner}"kind": ${JSON.stringify(node.kind)},\n` +
    `${inner}"type": ${JSON.stringify(node.type)},\n` +
    `${inner}"label": ${JSON.stringify(node.label)},\n` +
    `${inner}"fields": ${serializeIngestedFields(node.fields, node.flaggedFields, node.kind, node.type, inner)},\n` +
    `${inner}"children": ${serializeIngestedChildren(node.children, inner)}\n` +
    `${indent}}`
  );
}

function serializeIngestedProject(project: IngestedProject): string {
  const inner = "  ";
  return (
    `{\n` +
    `${inner}"id": ${JSON.stringify(project.id)},\n` +
    `${inner}"kind": ${JSON.stringify(project.kind)},\n` +
    `${inner}"label": ${JSON.stringify(project.label)},\n` +
    `${inner}"children": ${serializeIngestedChildren(project.children, inner)}\n` +
    `}`
  );
}

// String-literal-aware: only strips `//...` when it appears outside a quoted JSON string, so a
// field value that legitimately contains "//" (a URL, say) survives Save intact.
function stripJsonComments(text: string): string {
  let result = "";
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (escapeNext) {
      result += c;
      escapeNext = false;
      continue;
    }
    if (inString) {
      result += c;
      if (c === "\\") escapeNext = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      result += c;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      result += "\n";
      continue;
    }
    result += c;
  }
  return result;
}

// Tolerates the pre-normalisation shape too (a bare array of top-level records, what this tool
// exported before the Project root was added) - the same "small hand-edit shouldn't require every
// field to be perfectly well-formed" leniency `normalizeIngestedNode` already applies, one level up.
function normalizeIngestedProjectChildren(parsed: unknown): IngestedNode[] {
  if (Array.isArray(parsed)) return parsed.map(normalizeIngestedNode);
  const obj = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  return Array.isArray(obj.children) ? obj.children.map(normalizeIngestedNode) : [];
}

// The Project's own top-level `id` (Survey Number) isn't part of any node's `fields` - it's applied
// once, edited-JSON-wide, on Save (see `handleSave`), not re-derived from a per-record column the
// way it is on fresh ingestion.
function extractProjectId(parsed: unknown): string {
  const obj = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  return typeof obj.id === "string" ? obj.id : "";
}

// The reverse of `toIngestedJson`, for "Allow me to edit the json file - and save, and that
// becomes the structure" - a hand-edited JSON blob becomes the new authoritative source for the
// whole page, not just this panel. `normalizeIngestedNode` is deliberately lenient (a missing/
// wrong-typed field defaults rather than throwing) so a small hand-edit - renaming a label, moving
// a node under a different parent, deleting a child - doesn't require every field to be perfectly
// well-formed; `flattenIngestedNodes` walks the (possibly-edited) tree back into the same flat
// `ParsedRecord[]` shape an uploaded file produces, assigning fresh synthetic row numbers and
// deriving each child's Parent ID from its parent node's own `id`, so the result can be run back
// through the exact same `validateRecords` an upload gets - editing gets the same checks and
// balances as ingestion, not a separate, weaker path.
function normalizeIngestedNode(raw: unknown): IngestedNode {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawFields = obj.fields && typeof obj.fields === "object" ? (obj.fields as Record<string, unknown>) : {};
  return {
    id: typeof obj.id === "string" ? obj.id : "",
    kind: typeof obj.kind === "string" ? obj.kind : "",
    type: typeof obj.type === "string" ? obj.type : "",
    label: typeof obj.label === "string" ? obj.label : "",
    fields: Object.fromEntries(Object.entries(rawFields).map(([k, v]) => [k, v == null ? "" : String(v)])),
    flaggedFields: [], // a hand-edited/pasted JSON was already reviewed once - no re-flagging on Save
    children: Array.isArray(obj.children) ? obj.children.map(normalizeIngestedNode) : [],
  };
}

function flattenIngestedNodes(nodes: IngestedNode[], parentId: string, counter: { n: number }): ParsedRecord[] {
  let out: ParsedRecord[] = [];
  for (const node of nodes) {
    counter.n += 1;
    out.push({
      rowNumber: counter.n,
      id: node.id,
      parentId,
      label: node.label,
      kind: node.kind,
      type: node.type,
      fields: Object.entries(node.fields).map(([field, value]) => ({ field, value })),
      errors: [],
      unresolved: false, // finalised by `validateRecords`, re-run on this before it's applied
      surveyNumber: "", // the edited JSON's own top-level Project `id` is re-applied by `handleSave`
      easting: "",
      northing: "",
      zone: "",
      visitDateKey: "",
      siteNaturalKey: "", // an edited/saved JSON already has real Parent IDs - natural-key matching doesn't re-run on it
    });
    out = out.concat(flattenIngestedNodes(node.children, node.id, counter));
  }
  return out;
}

// Pure structure - no validity/error styling here, per the user directly: "Tree structure
// shouldn't have the error messages. Just what's under each and how the data's been structured."
// Whether a record is valid is `RecordCard`'s job, on the right - showing it twice (an error icon
// here too) would be the exact "never restate the same fact in two different treatments" pattern
// this codebase already flags elsewhere.
//
// No trailing "Kind · Type" tag either (removed after shipping - see the screenshot feedback) - it
// took fixed width away from the one thing worth reading here, the record's own name, which is
// exactly why "Site SU00501" and "Observation OBS..." were truncating to "O." and "Ob..." while
// "Event · Site" sat fully visible next to them. Per the user directly: "remove 'Event • Site',
// etc. This is already understood internally. It's too much info. The actual name should be
// visible." Kind/Type are still fully available - `RecordCard` shows them as a real `Badge` once a
// record is selected - this was strictly about the tree not needing to repeat it a second time.
function renderTreeNode(node: TreeNode, ancestorRows: ReadonlySet<number>): ReactNode {
  const { record } = node;
  if (ancestorRows.has(record.rowNumber)) return null; // a real parent/child cycle - stop, don't hang
  const label = record.label || record.id || `Row ${record.rowNumber}`;
  const nextAncestors = new Set(ancestorRows).add(record.rowNumber);

  return (
    <TreeView.Item key={record.rowNumber} id={`row-${record.rowNumber}`} textValue={label}>
      <TreeView.ItemContent>
        <span className="truncate">{label}</span>
      </TreeView.ItemContent>
      {node.children.map((child) => renderTreeNode(child, nextAncestors))}
    </TreeView.Item>
  );
}

// ── Sample data - the same Site SU00501/Visit VU00501/Observation OBS094-095 tree already used as
// this project's real example content (project-detail/option-1, observation-detail/option-1), now
// with a Community and a Population Observation added so all 4 Observation types actually get
// exercised, plus 7 deliberately broken rows, one per rule this tool checks (the 7th - a field that
// belongs to a different type's schema - added alongside `FIELD_SCHEMA` above). A stress test that
// only ever sees clean data hasn't tested anything.
//
// Column list is derived from `FIELD_SCHEMA` itself (`ALL_SCHEMA_FIELD_NAMES`), not hand-typed a
// second time - two independent copies of ~120 field names would drift the moment one changed.
// "Notes"/"Species" stay as generic columns for the record types that don't have a real schema yet
// (Occurrence, Transect/Ramble/Quadrat) - the original fallback behaviour, unchanged for them.
// Every other Kind/Type leaves a given row's irrelevant columns blank, same as a real mixed-type
// spreadsheet export would - an honest, expected shape for a flat CSV holding several different
// record types, not a fidelity gap to fix. ──
const SAMPLE_COLUMNS = ["Kind", "Type", "ID", "Parent ID", "Label", "Survey Number", "Species", "Notes", ...ALL_SCHEMA_FIELD_NAMES, "Vegetation Type"];

type SampleRow = Partial<Record<string, string>>;

const SAMPLE_ROWS: SampleRow[] = [
  { Kind: "Event", Type: "Site", ID: "SU00501", Label: "Site SU00501", "Survey Number": "1211" },
  {
    Kind: "Event",
    Type: "Visit",
    ID: "VU00501",
    "Parent ID": "SU00501",
    Label: "Visit VU00501",
    "Survey Number": "1211",
    "Visit Seq No.": "1 of 2",
    "Start Date": "2024-09-12",
    "End Date": "2024-09-12",
    "Observer 1": "P. Ngoc",
  },
  {
    Kind: "Observation",
    Type: "Individual",
    ID: "OBS094",
    "Parent ID": "SU00501",
    Label: "Observation OBS094 - Individual",
    "Life Form": "Mammal",
    Sex: "Female",
    "Weight": "410",
    "Animal Life Stage": "Adult",
  },
  {
    Kind: "Observation",
    Type: "Non-biotic",
    ID: "OBS094B",
    "Parent ID": "SU00501",
    Label: "Observation OBS094 - Non-biotic",
    "Observation Comment": "Soil sample",
    "Site Slope": "Gentle",
    "Soil Texture Class": "Loam",
  },
  { Kind: "Occurrence", Type: "Individual", ID: "OCC094", "Parent ID": "SU00501", Label: "Occurrence OBS094 - Individual", Species: "Yellow-footed Antechinus" },
  { Kind: "Event", Type: "Transect", ID: "TR00501", "Parent ID": "SU00501", Label: "Transect TR00501" },
  {
    Kind: "Observation",
    Type: "Individual",
    ID: "OBS095",
    "Parent ID": "VU00501",
    Label: "Observation OBS095 - Individual",
    "Life Form": "Amphibian",
    "Weight": "35",
  },
  {
    Kind: "Observation",
    Type: "Community",
    ID: "OBS096",
    "Parent ID": "SU00501",
    Label: "Observation OBS096 - Community",
    "Vegetation Conditions": "Good",
    "SA Structural Formation": "Low Woodland",
    "Crown Extent": "45",
    "DBH": "220",
  },
  {
    Kind: "Event",
    Type: "Site",
    ID: "SU00777",
    Label: "Site SU00777",
    "Survey Number": "1211",
    "Legacy Site ID": "Site - 5091",
    "Site Name": "Adelaide Hills roadside verge",
    "Site Grouping": "Roadside",
    Altitude: "420m",
    "Observer 1": "J. Combe",
    "IBRA Region": "Mount Lofty Ranges",
    "IBRA Sub Region": "Southern Lofty",
    "Location Method": "GPS",
    Datum: "GDA2020",
    Reliability: "High",
    "Photopoint Marker Present": "Yes",
    "Vegetation Type": "Mallee Woodland",
  },
  {
    Kind: "Observation",
    Type: "Individual",
    ID: "INC0231",
    "Parent ID": "SU00777",
    Label: "Observation INC-0231 - Individual",
    "Life Form": "Bird",
    Activity: "Foraging",
  },
  {
    Kind: "Observation",
    Type: "Population",
    ID: "OBS097",
    "Parent ID": "SU00777",
    Label: "Observation OBS097 - Population",
    "Number Observed": "14",
    "Is Annual Herb?": "No",
    "Life Form": "Herb",
    "Cover/Abundance": "Moderate",
  },
  // Every row below is deliberately broken - one per validation rule this tool checks (see this
  // file's header comment) - but per the user directly: "the records ingested will not have these
  // comments like 'Quadrat parented under observation'... it's never going to have that. It's just
  // going to be QUADRAT AB131 - whatever that might be called." A real broken record doesn't
  // self-describe its own mistake in its label or comment field - it just looks like an ordinary
  // record. Labels here match the same plain naming convention as every good row above; what each
  // one actually tests is documented in the comment beside it, never in a field the UI renders.
  { Kind: "Occurrence", Type: "Population", ID: "OCC777", Label: "Occurrence OCC777 - Population" }, // Occurrences can't sit at the root - no Parent ID
  { Kind: "Event", Type: "Site", ID: "BADSITE", "Parent ID": "VU00501", Label: "Site SU00888" }, // a Site can't be a child of a Visit
  { Kind: "Observation", Type: "Flying", ID: "OBSBAD", "Parent ID": "SU00501", Label: "Observation OBSBAD" }, // "Flying" isn't a real Observation type
  { Kind: "Event", Type: "Site", ID: "SU00501", Label: "Site SU00501" }, // duplicate ID - a real data-entry mistake looks identical to the original
  { Kind: "Event", Type: "Quadrat", ID: "QR00501", "Parent ID": "OBS094", Label: "Quadrat QR00501" }, // an Event's parent must be another Event, not an Observation
  { Kind: "Event", Type: "Ramble", ID: "RMB00501", "Parent ID": "NOTAREALID", Label: "Ramble RMB00501" }, // dangling Parent ID - NOTAREALID doesn't exist in this file
  { Kind: "Observation", Type: "Individual", ID: "OBSBAD2", "Parent ID": "SU00501", Label: "Observation OBSBAD2 - Individual", "Number Observed": "3" }, // "Number Observed" belongs to Population's template, not Individual's
];

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const SAMPLE_CSV = [SAMPLE_COLUMNS.join(","), ...SAMPLE_ROWS.map((row) => SAMPLE_COLUMNS.map((col) => csvField(row[col] ?? "")).join(","))].join("\n");

// ── UI ──

// A plain button + a hidden native file input, not `InputFile` - `InputFile`'s readonly-field-plus-
// button look (components/base/input/input-file.tsx) is right for a form where the chosen file is
// one value among others; here it's a single, one-shot action ("pick a file, see it processed"),
// so a fake disabled-looking text field showing the filename is the wrong affordance. Flagged
// directly by the user: "Why text field? this should just be a button." The loaded file's name
// still surfaces - in `SummaryBar` below, once parsing succeeds - just not faked as form input.
//
// Full-width gradient card, same template as the real registered-user greeting banner
// (`app/pages/_shared/home-dashboard.tsx`'s "Hi, Olivia" card / the `bg-gradient-to-b from-
// brand-900 via-brand-800 via-[63.942%] to-brand-700` this whole session has reused since the
// Sept 16 layout decision) - a pattern, not a one-off style, per the user directly: "redesign the
// upload card into a gradient card component that we use to greet the user, sits at the top."
//
// Accepts multiple files at once (`multiple` on the input) - each one is just handed up to the
// parent as a real `File`; all parsing (including the per-file text-vs-binary decision) happens
// there via `parseFileToRows`, same "UploadPanel only reads browser objects, the page does the real
// parsing" split this file has used since the XLS/XLSX pass. No upload, no network request, per the
// sandbox callout below - `multiple` doesn't change that, it's still `<input type="file">` reading
// local bytes.
function UploadPanel({ onFiles, onSampleData, error }: { onFiles: (files: File[]) => void; onSampleData: () => void; error: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-selecting the same file name(s) twice in a row
    if (files.length === 0) return;
    onFiles(files);
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-medium text-white">Upload one or more CSV, JSON, XLS, or XLSX files</p>
        <p className="text-md text-white/80">
          Structured or unstructured data - real DEW project records, straight from a spreadsheet export. Select several files at once (e.g. Site, Visit,
          and Species exports) to map them into one structure together.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.json,.xls,.xlsx,text/csv,application/json,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button color="secondary" iconLeading={UploadCloud02} onClick={() => fileInputRef.current?.click()}>
          Choose file(s)
        </Button>
        <Button color="secondary" iconLeading={FileCode01} onClick={onSampleData}>
          Load sample data
        </Button>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-white/10 p-3 text-sm text-white/80">
        <Lock01 className="mt-0.5 size-4 shrink-0" />
        This is a sandbox - your file is parsed entirely in this browser tab. Nothing is uploaded or processed on a server.
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-white/10 p-3 text-sm text-white">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

function SummaryBar({ fileName, records }: { fileName: string; records: ParsedRecord[] }) {
  const validCount = records.filter((r) => r.errors.length === 0).length;
  const invalidCount = records.length - validCount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary bg-secondary p-4">
      <div className="flex items-center gap-2">
        <Database02 className="size-4 text-quaternary" />
        <span className="text-sm font-medium text-primary">{fileName}</span>
        <CountBadge count={records.length} color="gray" />
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-fg-success-primary">
          <CheckCircle className="size-4" />
          {validCount} valid
        </span>
        <span className={cx("flex items-center gap-1.5", invalidCount > 0 ? "text-fg-error-primary" : "text-quaternary")}>
          <XCircle className="size-4" />
          {invalidCount} with errors
        </span>
      </div>
    </div>
  );
}

// WYSIWYG, per the user directly ("this isn't an actual component that sits on our projects
// page... it has to be a 1:1 match") - the first pass wrapped the real `TreeView` in an invented
// floating card (rounded corners, its own border on all sides, a made-up "STRUCTURE" card label)
// that doesn't exist anywhere in the real product. This is now the exact same contextual-sidebar
// shell markup as `project-detail/option-1`'s own record-tree `<aside>` (same classes, verbatim -
// `w-[286px] shrink-0 flex-col justify-between overflow-y-auto border-r border-secondary
// bg-secondary p-4`, same section-label paragraph styling) - not a lookalike, the real shape this
// tree actually ships in. The point of showing structure at all is to prove ingested data forms
// correctly under that real tree, so the container has to be the real one, not a proto-only stand-
// in. Footer links (Terms/Privacy/Help) from the real `<aside>` are left out - they're not part of
// what's being tested here and would be inert clutter, not a fidelity concern.
// Selectable, per the user directly: "Left - tree view, right - details on page selection from the
// tree. If I select site parent, then I see site details." Same `selectionMode="single"` +
// controlled `selectedKeys`/`onSelectionChange` pair `/proto/project-detail` already uses for its
// own tree-drives-detail interaction, not a new pattern invented for this lab.
function StructureTree({
  records,
  selectedKey,
  onSelectionChange,
}: {
  records: ParsedRecord[];
  selectedKey: Key | null;
  onSelectionChange: (key: Key | null) => void;
}) {
  // Split before building any tree, per the user directly: "Tree view (Resolved), let's add a
  // section under and call it (Unresolved)." Today's `buildTree` already treats a dangling/self-
  // referencing Parent ID as "just another root" (no silent drop), which quietly hid the exact
  // thing worth surfacing during ingestion - a record whose place in the hierarchy can't be
  // trusted, sitting visually identical to a real root (a Site with no parent, correctly). Splitting
  // on `record.unresolved` (set by `validateRecords`, from the same Kind/Type/Parent-ID checks -
  // never duplicated here) makes that distinction real: Resolved only ever contains records whose
  // structural placement is trustworthy; Unresolved is a flat list (deliberately not nested - their
  // placement is exactly what's in question) of everything else, one row per problem record.
  const resolvedRecords = records.filter((r) => !r.unresolved);
  const unresolvedRecords = records.filter((r) => r.unresolved);
  const roots = buildTree(resolvedRecords);

  // "From a performance perspective, maybe load until Row 50, then say Load more." Per the user
  // directly - a real, unnormalized multi-file upload (no Kind/Type/ID/Label at all) can dump every
  // row straight into Unresolved with nothing to nest by, so this is exactly the list that can grow
  // unbounded. The Resolved tree doesn't get this treatment - it's a real hierarchy, not a flat
  // dump, and shallower in practice. `visibleUnresolvedCount` resets per file load via this
  // component's own `key={fileName}` on the parent's usage, the same reset mechanism already used
  // for `IngestedJsonPanel`.
  const [visibleUnresolvedCount, setVisibleUnresolvedCount] = useState(UNRESOLVED_PAGE_SIZE);
  const visibleUnresolvedRecords = unresolvedRecords.slice(0, visibleUnresolvedCount);
  const remainingUnresolvedCount = unresolvedRecords.length - visibleUnresolvedRecords.length;
  // Every Event-kind record can have children (Occurrences/Observations never can) - expanded by
  // default, same "always fully visible" behaviour this tool had before the Project root made any
  // node collapsible at all.
  const expandedKeys = [PROJECT_NODE_ID, ...resolvedRecords.filter((r) => r.kind === "Event").map((r) => `row-${r.rowNumber}`)];

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const [key] = Array.from(keys);
    onSelectionChange(key ?? null);
  };

  return (
    <aside aria-label="Structure" className="flex w-[286px] shrink-0 flex-col overflow-y-auto border-r border-secondary bg-secondary p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Structure</p>

      <p className="mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">Resolved</p>
      <TreeView
        aria-label="Resolved record structure"
        showConnectors
        selectionMode="single"
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelectionChange={handleSelectionChange}
        defaultExpandedKeys={expandedKeys}
        className="w-full"
      >
        <TreeView.Item id={PROJECT_NODE_ID} textValue={PROJECT_LABEL}>
          <TreeView.ItemContent>
            <span className="truncate font-medium">{PROJECT_LABEL}</span>
          </TreeView.ItemContent>
          {roots.map((node) => renderTreeNode(node, new Set()))}
        </TreeView.Item>
      </TreeView>

      {unresolvedRecords.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-quaternary uppercase">
            Unresolved{unresolvedRecords.length > UNRESOLVED_PAGE_SIZE ? ` (${visibleUnresolvedRecords.length} of ${unresolvedRecords.length})` : ""}
          </p>
          <TreeView aria-label="Unresolved records - hierarchy couldn't be confirmed" selectionMode="single" selectedKeys={selectedKey ? [selectedKey] : []} onSelectionChange={handleSelectionChange} className="w-full">
            {visibleUnresolvedRecords.map((r) => (
              <TreeView.Item key={r.rowNumber} id={`row-${r.rowNumber}`} textValue={r.label || r.id || `Row ${r.rowNumber}`}>
                <TreeView.ItemContent icon={AlertTriangle}>
                  <span className="truncate">{r.label || r.id || `Row ${r.rowNumber}`}</span>
                </TreeView.ItemContent>
              </TreeView.Item>
            ))}
          </TreeView>
          {remainingUnresolvedCount > 0 && (
            <Button size="sm" color="secondary" className="mt-2" onClick={() => setVisibleUnresolvedCount((n) => n + UNRESOLVED_PAGE_SIZE)}>
              Load {Math.min(remainingUnresolvedCount, UNRESOLVED_PAGE_SIZE)} more
            </Button>
          )}
        </>
      )}
    </aside>
  );
}

// Editable, per the user directly: "Allow me to edit the json file - and save, and that becomes
// the structure." Same code-block visual language this codebase's doc pages use for a real Usage
// snippet, just swapped from `<pre><code>` to a real `<textarea>` so it can be typed into - still
// monospace, still the same border/background, so it doesn't read as a different kind of surface
// just because it became interactive. `text` is local, seeded once from the current records and
// then independent of them - editing doesn't fight live re-renders, and "Save" is what commits the
// edit back. Saving re-parses the edited JSON (via `normalizeIngestedNode`/`flattenIngestedNodes`,
// the reverse of `toIngestedJson`) and re-runs the same `validateRecords` an upload gets, then
// hands the result to `onApply` - the parent's `records` state - so the Structure tree, the record
// cards, and the summary bar all pick up the hand-edited structure, not just this panel. Invalid
// JSON shows an inline error instead of silently discarding the edit, same honesty convention as
// the upload path's own `parseError`.
type JsonPanelView = "data" | "template";

// Two views sharing one panel, per the user directly: "In addition to copy, save - I need a
// template view of this as well - with all fields and all values stripped out." Real `Tabs`
// (`components/application/tabs/tabs.tsx`, `type="button-border"` - the same compact pill style
// this codebase already uses for a small in-panel switch) rather than a second, separate panel -
// Data and Template are the same underlying structure, just two ways of looking at it, so they
// belong in one place, not two competing blocks. Editing/Save only make sense for Data (a blank
// template has nothing to validate); Copy works for whichever view is active. "Let's make sure this
// is patted down nice and well so we can roll this logic into our Projects screen, across all user
// roles" - the Template view is exactly that reusable artifact: kind/type preserved (they define
// which record type's template this is), id/label/every field value blanked.
function IngestedJsonPanel({ records, onApply }: { records: ParsedRecord[]; onApply: (records: ParsedRecord[]) => void }) {
  const [view, setView] = useState<JsonPanelView>("data");
  const [text, setText] = useState(() => serializeIngestedProject(toIngestedProject(records)));
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isTemplateView = view === "template";
  const templateText = serializeIngestedProject(toTemplateProject(toIngestedProject(records)));
  const displayedText = isTemplateView ? templateText : text;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = () => {
    try {
      const parsed: unknown = JSON.parse(stripJsonComments(text));
      const flat = flattenIngestedNodes(normalizeIngestedProjectChildren(parsed), "", { n: 0 });
      if (flat.length === 0) throw new Error("No records found in this JSON");
      // Carry the edited JSON's own Project `id` forward - `flattenIngestedNodes` has no per-node
      // source for it (it was never one of the node's own `fields`), so without this a Save would
      // silently reset the Project's Survey Number to blank.
      const projectId = extractProjectId(parsed);
      const flatWithSurveyNumber = projectId ? flat.map((r) => ({ ...r, surveyNumber: r.surveyNumber || projectId })) : flat;
      onApply(validateRecords(flatWithSurveyNumber));
      setSaveError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Couldn't parse this JSON");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-primary">Ingested JSON</p>
          <p className="text-xs text-tertiary">
            {isTemplateView
              ? "The same structure, every value stripped - a blank template ready to fill in."
              : "Edit directly, then save to re-run the structure and checks from this JSON."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs selectedKey={view} onSelectionChange={(key) => setView(key === "template" ? "template" : "data")}>
            <TabList aria-label="Data or template view" type="button-border" size="sm">
              <Tab id="data" label="Data" />
              <Tab id="template" label="Template" />
            </TabList>
          </Tabs>
          <Button size="sm" color="secondary" iconLeading={copied ? Check : Copy01} onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          {!isTemplateView && (
            <Button size="sm" color="primary" iconLeading={saved ? Check : Save01} onClick={handleSave}>
              {saved ? "Saved" : "Save"}
            </Button>
          )}
        </div>
      </div>
      <textarea
        value={displayedText}
        onChange={isTemplateView ? undefined : (e) => setText(e.target.value)}
        readOnly={isTemplateView}
        spellCheck={false}
        className={cx(
          "h-96 w-full resize-y rounded-xl border border-secondary p-5 font-mono text-[13px] text-secondary outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring",
          isTemplateView ? "bg-tertiary" : "bg-secondary",
        )}
      />
      {!isTemplateView && saveError && (
        <div className="flex items-start gap-2 rounded-lg bg-error-50 p-3 text-sm text-error-primary">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {saveError}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record, nestedCounts }: { record: ParsedRecord; nestedCounts?: NestedCounts }) {
  const isValid = record.errors.length === 0;
  const kindLabel = isRecordKind(record.kind) ? record.kind : record.kind || "Unknown kind";

  return (
    <div className={cx("flex flex-col gap-3 rounded-xl border p-4", isValid ? "border-secondary bg-primary" : "border-error-subtle bg-error-50")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" color={isValid ? "gray" : "error"}>
            {kindLabel}
            {record.type ? ` · ${record.type}` : ""}
          </Badge>
          <span className="text-sm font-semibold text-primary">{record.label || record.id || `Row ${record.rowNumber}`}</span>
          {record.id && <span className="text-xs text-quaternary">ID: {record.id}</span>}
          {record.parentId && <span className="text-xs text-quaternary">Parent: {record.parentId}</span>}
        </div>
        {isValid ? (
          <span className="flex items-center gap-1 text-xs font-medium text-fg-success-primary">
            <CheckCircle className="size-3.5" />
            Valid
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-fg-error-primary">
            <XCircle className="size-3.5" />
            {record.errors.length} error{record.errors.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {record.kind === "Event" && nestedCounts && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-secondary p-3 text-xs text-tertiary">
          <span className="font-medium text-primary">Nested records</span>
          <span>Events: {nestedCounts.events}</span>
          <span>Occurrences: {nestedCounts.occurrences}</span>
          <span>Observations: {nestedCounts.observations}</span>
        </div>
      )}

      {!isValid && (
        <ul className="flex flex-col gap-1 rounded-lg bg-primary p-3">
          {record.errors.map((err) => (
            <li key={err} className="flex items-start gap-1.5 text-xs text-error-primary">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {record.fields.length > 0 && (
        <Table aria-label={`Fields for ${record.label || record.id}`}>
          <TableHeader>
            <Column id="field" isRowHeader>
              Field
            </Column>
            <Column id="value">Value</Column>
          </TableHeader>
          <TableBody items={record.fields}>
            {(f) => (
              <Row id={f.field}>
                <Cell>{f.field}</Cell>
                <Cell>{f.value || <span className="text-quaternary">-</span>}</Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Selecting the Project node in the Structure tree - the same "Nested records" concept every
// Event-kind `RecordCard` already gets, one level up: Project's own direct children by kind.
function ProjectSummaryCard({ counts }: { counts: NestedCounts }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" color="brand">
          Project
        </Badge>
        <span className="text-sm font-semibold text-primary">{PROJECT_LABEL}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-secondary p-3 text-xs text-tertiary">
        <span className="font-medium text-primary">Nested records</span>
        <span>Events: {counts.events}</span>
        <span>Occurrences: {counts.occurrences}</span>
        <span>Observations: {counts.observations}</span>
      </div>
    </div>
  );
}

export default function DataModelStressTestProto() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);

  const applyRows = (rows: RawRow[], name: string) => {
    if (rows.length === 0) throw new Error("No rows found in this file");
    // `expandSpeciesOccurrences` runs on the whole combined upload, once, before any row becomes a
    // `ParsedRecord` - see that function's own comment for why (synthetic Occurrence/Observation IDs
    // only need to be unique within this one call).
    setRecords(validateRecords(resolveNaturalKeyRelationships(toRecords(expandSpeciesOccurrences(rows)))));
    setFileName(name);
    setParseError(null);
    setSelectedKey(null);
  };

  const handleParseError = (e: unknown) => {
    setParseError(e instanceof Error ? e.message : "Couldn't parse this file");
    setRecords([]);
    setFileName(null);
    setSelectedKey(null);
  };

  const handleFiles = async (files: File[]) => {
    try {
      const rowsPerFile = await Promise.all(files.map(parseFileToRows));
      applyRows(rowsPerFile.flat(), files.map((f) => f.name).join(", "));
    } catch (e) {
      handleParseError(e);
    }
  };

  const handleSampleData = () => {
    try {
      applyRows(parseCsv(SAMPLE_CSV), "sample-data.csv");
    } catch (e) {
      handleParseError(e);
    }
  };

  const handleApplyEditedJson = (nextRecords: ParsedRecord[]) => {
    setRecords(nextRecords);
    setSelectedKey(null);
  };

  // Nested-record counts (Project summary, each Event's own "Nested records" row) are computed
  // from the same resolved-only tree `StructureTree` renders, so a count never claims a record is
  // nested somewhere the Unresolved split has since pulled it out of.
  const treeRoots = buildTree(records.filter((r) => !r.unresolved));
  const isProjectSelected = String(selectedKey) === PROJECT_NODE_ID;
  const selectedRecord = selectedKey != null && !isProjectSelected ? records.find((r) => `row-${r.rowNumber}` === String(selectedKey)) : undefined;
  const nestedCountsByRow = buildNestedCountsByRow(treeRoots);

  return (
    <div className="font-barlow min-h-screen bg-primary p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-primary">Data model stress test</h1>
          <p className="text-sm text-tertiary">
            Upload one or more CSV, JSON, XLS, or XLSX exports and see them validated against the real Event/Occurrence/Observation model, before
            that model is implemented for real. Structured or unstructured data - the checks are the same either way.
          </p>
        </div>

        <UploadPanel onFiles={handleFiles} onSampleData={handleSampleData} error={parseError} />

        {records.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-secondary p-12 text-center">
            <p className="text-sm font-medium text-primary">No file loaded yet</p>
            <p className="text-sm text-tertiary">Upload a file or load the sample data to see records parsed and validated here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <StructureTree key={fileName} records={records} selectedKey={selectedKey} onSelectionChange={setSelectedKey} />

            <div className="flex flex-1 flex-col gap-4">
              <SummaryBar fileName={fileName ?? ""} records={records} />
              {isProjectSelected ? (
                <ProjectSummaryCard counts={countChildrenByKind(treeRoots)} />
              ) : selectedRecord ? (
                <RecordCard key={`${selectedRecord.id || "row"}-${selectedRecord.rowNumber}`} record={selectedRecord} nestedCounts={nestedCountsByRow.get(selectedRecord.rowNumber)} />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-secondary p-12 text-center">
                  <p className="text-sm font-medium text-primary">No record selected</p>
                  <p className="text-sm text-tertiary">Select a record in the Structure tree on the left to see its details here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {records.length > 0 && <IngestedJsonPanel key={fileName} records={records} onApply={handleApplyEditedJson} />}
      </div>
    </div>
  );
}

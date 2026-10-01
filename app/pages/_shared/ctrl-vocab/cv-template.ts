import { parseCsv } from "@/app/pages/_shared/ctrl-vocab/cv-csv";
import { STANDARD_FIELDS, emptyEntry, entryStatusMeta, identifierLabel, nextNumber, type Cv, type CvDraft, type CvEntry, type StandardField, shownFields } from "@/app/pages/_shared/ctrl-vocab/cv-data";

// The template round trip (the designer, Sept 30 2026): the admin downloads a vocabulary's
// template, it is shared with the people who fill it in, and later the admin uploads the filled copy.
//
// The file finds its own way back. Its first row names the vocabulary and the hand-out
// ("Vocabulary ID, BIODATA-012, ..., Template, T2"), so an upload from the list goes straight to the
// right vocabulary and closes the right hand-out, whoever filled it in and whatever they renamed the
// file to. The second row says how to fill it in. Then the column names, then every entry the
// vocabulary already has, so the people filling it in see what exists and can correct it.
//
// Coming back, rows are matched to entries by their identifier (Code, or ID): a match updates that
// entry, a row with a new code (or an empty ID) adds one, and an entry missing from the file is
// kept, never removed (REQ-18.6). Nothing is saved until the admin checks the rows and saves.

export const META_LABEL = "Vocabulary ID";

export function templateFileName(cv: Pick<Cv, "id" | "name">, handoutId: string): string {
  return `${cv.id} ${cv.name} template ${handoutId}.csv`;
}

/** The file's rows: the meta row, the instruction row, the column names, then the current entries. */
export function templateRows(cv: Cv, handoutId: string, downloadedAt: string): { first: string[]; rest: string[][] } {
  const idLabel = identifierLabel(cv.idKind);
  const fields = shownFields(cv);
  const header = [...fields.filter((f) => f.id !== "order").map((f) => (f.id === "code" ? idLabel : f.label)), "Available to users", ...cv.customColumns.map((c) => c.label)];
  const instruction =
    cv.idKind === "number"
      ? "One row per entry. Leave ID empty for a new entry: it is numbered on upload. Change a row to correct it. Available to users is Available or Hidden. Row order is display order. Keep the first row and the column names as they are."
      : "One row per entry. Give each new entry a Code not used above. Change a row to correct it. Available to users is Available or Hidden. Row order is display order. Keep the first row and the column names as they are.";
  return {
    first: [META_LABEL, cv.id, "Vocabulary", cv.name, "Template", handoutId, "Downloaded", downloadedAt.replace("T", " ")],
    rest: [
      [instruction],
      header,
      ...cv.entries.map((e) => [...fields.filter((f) => f.id !== "order").map((f) => e[f.id]), entryStatusMeta[e.status].label, ...cv.customColumns.map((c) => e.custom[c.id] ?? "")]),
    ],
  };
}

export interface ParsedTemplate {
  vocabId?: string;
  handoutId?: string;
  header: string[];
  rows: string[][];
}

/** Reads the meta row when there is one, then finds the column names (the first row naming Code or ID, and Name). */
export function parseTemplate(text: string): ParsedTemplate | { error: string } {
  const all = parseCsv(text.replace(/^﻿/, ""));
  if (all.length === 0) return { error: "The file is empty" };
  let vocabId: string | undefined;
  let handoutId: string | undefined;
  let start = 0;
  if (all[0][0]?.trim() === META_LABEL) {
    vocabId = all[0][1]?.trim() || undefined;
    const t = all[0].findIndex((c) => c.trim() === "Template");
    handoutId = t >= 0 ? all[0][t + 1]?.trim() || undefined : undefined;
    start = 1;
  }
  const isId = (h: string) => ["code", "id", "no", "no.", "number"].includes(h.trim().toLowerCase().replace(/\*$/, ""));
  const headerAt = all.findIndex((row, i) => i >= start && row.some(isId) && row.some((h) => h.trim().toLowerCase().replace(/\*$/, "") === "name"));
  if (headerAt < 0) return { error: "No row names a Code (or ID) column and a Name column" };
  return { vocabId, handoutId, header: all[headerAt], rows: all.slice(headerAt + 1) };
}

export interface MergeResult {
  entries: CvEntry[];
  /** Optional standard fields the file had a column for, switched on. */
  fields: StandardField[];
  added: string[];
  updated: string[];
  unchanged: number;
  ignored: string[];
}

/** Matches the file's rows to the draft's entries by identifier: update, add, keep. */
export function mergeTemplate(draft: CvDraft, parsed: ParsedTemplate): MergeResult {
  const key = (h: string) => h.trim().toLowerCase().replace(/\*$/, "");
  const standard = new Map<string, StandardField>(STANDARD_FIELDS.map((f) => [f.label.toLowerCase(), f.id]));
  for (const alias of ["id", "no", "no.", "number"]) standard.set(alias, "code");
  const custom = new Map(draft.customColumns.map((c) => [c.label.trim().toLowerCase(), c.id]));
  const columns = parsed.header.map((h) => ({ raw: h.trim(), std: standard.get(key(h)), custom: custom.get(key(h)), status: ["status", "available", "available to users"].includes(key(h)) }));

  const entries = draft.entries.map((e) => ({ ...e, custom: { ...e.custom } }));
  const byCode = new Map(entries.map((e) => [e.code.trim().toLowerCase(), e]));
  const added: string[] = [];
  const updated: string[] = [];
  let unchanged = 0;

  for (const cells of parsed.rows) {
    if (!cells.some((c) => c.trim())) continue;
    const row = emptyEntry();
    columns.forEach((c, i) => {
      const v = (cells[i] ?? "").trim();
      if (c.std) row[c.std] = v;
      else if (c.custom) row.custom[c.custom] = v;
      else if (c.status) row.status = ["inactive", "hidden", "no"].includes(v.toLowerCase()) ? "inactive" : "active";
    });
    const existing = row.code ? byCode.get(row.code.toLowerCase()) : undefined;
    if (existing) {
      const before = JSON.stringify(existing);
      for (const c of columns) {
        if (c.std) existing[c.std] = row[c.std];
        else if (c.custom) existing.custom[c.custom] = row.custom[c.custom] ?? "";
        else if (c.status) existing.status = row.status;
      }
      if (JSON.stringify(existing) === before) unchanged += 1;
      else updated.push(existing.id);
      continue;
    }
    if (!row.code && draft.idKind === "number") row.code = nextNumber(entries);
    entries.push(row);
    if (row.code) byCode.set(row.code.toLowerCase(), row);
    added.push(row.id);
  }

  return {
    entries,
    fields: columns.map((c) => c.std).filter((f): f is StandardField => !!f && f !== "code" && f !== "name"),
    added,
    updated,
    unchanged,
    ignored: columns.filter((c) => !c.std && !c.custom && !c.status && c.raw).map((c) => c.raw),
  };
}

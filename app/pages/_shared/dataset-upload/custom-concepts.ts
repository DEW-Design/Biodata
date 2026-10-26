"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ALL_SCHEMA_FIELD_NAMES_WITH_ALIASES, BDBSA_KEY_CROSSWALK } from "@/config/data-model-schema";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { allCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { todayIso } from "@/app/pages/_shared/dla/dla-data";

// Custom concepts: a column an uploader adds to a data sheet that BioData does not know (26 Oct 2026 request:
// "if a user, during data upload, adds a new column (or concept), then those concepts need to be flagged for
// admin approval ... if a concept doesn't exist in the control vocabs ... create a section to show 'custom'
// concepts").
//
// What is read, and what is kept. When a workbook is added to the upload, the first row of every visible
// sheet is read in the browser (`readWorkbookColumns`): the sheet's name and each heading with its column
// letter. Nothing else is kept, no values: the dataset store's rule is "never their contents".
//
// What counts as known. A heading is known when it is one of the data model's fields or their aliases
// (`config/data-model-schema.ts`), a BDBSA column key the model maps (the crosswalk), one of the structural or
// identity columns the ingestion reads (the Data ingestion stress test's list, below), the name of a controlled vocabulary,
// or a custom concept an admin has already approved. Headings are compared the way the model compares them: case,
// spaces, underscores, slashes and hyphens ignored. Anything else is custom, and is flagged for approval.
//
// A decision is per concept name: approving "Soil pH" approves every dataset that added it, and from then on
// it is known, so the next upload of it is not flagged again.

export type ConceptStatus = "pending" | "approved" | "rejected";

export interface SheetColumn {
  name: string;
  /** The spreadsheet column, "A", "B", ... "AA". */
  letter: string;
}
export interface SheetColumns {
  sheet: string;
  columns: SheetColumn[];
}

/** One place a custom concept appears: a file, a sheet and a column. */
export interface ConceptPlace {
  fileName: string;
  sheet: string;
  letter: string;
}

/** A custom concept found in files that are not saved yet (the upload form's section). */
export interface DetectedConcept {
  /** The heading as it was first written. */
  name: string;
  key: string;
  places: ConceptPlace[];
}

/** A custom concept an uploader submitted, with where it stands. One per concept per dataset. */
export interface CustomConcept {
  id: string;
  key: string;
  name: string;
  places: ConceptPlace[];
  datasetId: string;
  projectId: string;
  projectCode: string;
  uploadedBy: string;
  /** ISO date. */
  uploadedAt: string;
  status: ConceptStatus;
  decidedBy?: string;
  decidedAt?: string;
  /** Why it was not approved, or an approver's note. */
  reason?: string;
}

export const conceptStatusMeta: Record<ConceptStatus, { label: string; color: "warning" | "success" | "error" }> = {
  pending: { label: "Awaiting approval", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Not approved", color: "error" },
};

/** Case, spaces, underscores, slashes and hyphens ignored: the model's own way of comparing headings (the lab's `normalizeHeader`). */
export const conceptKey = (heading: string) => heading.toLowerCase().replace(/[\s_/-]/g, "");

// The structural and identity columns the ingestion reads that are not a field of any one record type: the
// Data ingestion stress test's `IDENTITY_COLUMNS` and the columns it finds by name (kind, type, id, parent, label, survey,
// the coordinates). Copied here when that tool was still a lab, which a product file cannot import from (5.4); it is a page
// now and a page's file is no place to import from either. Open: the two lists should be one, in `config/data-model-schema.ts`.
const STRUCTURAL_HEADINGS = [
  "Kind",
  "Type",
  "ID",
  "Record ID",
  "Parent ID",
  "Parent",
  "Label",
  "Name",
  "Survey Number",
  "Survey #",
  "Survey",
  "Zone",
  "Easting",
  "Northing",
  "Latitude",
  "Longitude",
  "Species",
  "Scientific Name",
  "Common Name",
  "Source ID",
  "Voucher Number",
  "Voucher #",
  "Voucher No",
  "Order",
  "Family",
  "EPA Taxa Code",
  "Life Stage",
  "Habitat",
  "Transect Number",
  "Institution Rego #",
  "Specimen Registration #",
];

// A BDBSA column key is a short upper-case code (METHODNR, CAMPNAME). The crosswalk's values are mostly keys, and
// a few are prose ("composite, no single ID column"), which are not headings.
const isBdbsaKey = (v: string | null): v is string => !!v && /^[A-Z][A-Z0-9_]{1,23}$/.test(v);

let modelKeys: Set<string> | null = null;
function dataModelKeys(): Set<string> {
  if (!modelKeys) {
    modelKeys = new Set([
      ...ALL_SCHEMA_FIELD_NAMES_WITH_ALIASES.map(conceptKey),
      ...STRUCTURAL_HEADINGS.map(conceptKey),
      ...Object.values(BDBSA_KEY_CROSSWALK).flatMap((m) => Object.values(m).filter(isBdbsaKey).map(conceptKey)),
    ]);
  }
  return modelKeys;
}

// ── The store ──

interface State {
  concepts: CustomConcept[];
}

const useStore = create<State>()(
  persist(() => ({ concepts: [] as CustomConcept[] }), {
    name: "biodata-custom-concepts",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** Every submitted custom concept. Call it on any screen that reads or adds them, so the saved list is loaded first. */
export function useCustomConcepts(): CustomConcept[] {
  useRehydrate(useStore);
  return useStore((s) => s.concepts);
}

/** The keys that are known: the data model, the controlled vocabularies, and the concepts an admin approved. */
function knownKeys(concepts: CustomConcept[]): Set<string> {
  const known = new Set(dataModelKeys());
  for (const cv of allCvs()) known.add(conceptKey(cv.name));
  for (const c of concepts) if (c.status === "approved") known.add(c.key);
  return known;
}

/** Headings in `sheets` that are not known, once each, with every place they appear. */
export function detectCustomConcepts(files: { name: string; sheets?: SheetColumns[] }[], concepts: CustomConcept[]): DetectedConcept[] {
  const known = knownKeys(concepts);
  const found = new Map<string, DetectedConcept>();
  for (const file of files) {
    for (const { sheet, columns } of file.sheets ?? []) {
      for (const column of columns) {
        const key = conceptKey(column.name);
        if (!key || known.has(key)) continue;
        const place = { fileName: file.name, sheet, letter: column.letter };
        const existing = found.get(key);
        if (existing) existing.places.push(place);
        else found.set(key, { name: column.name.trim(), key, places: [place] });
      }
    }
  }
  return [...found.values()];
}

/** The custom concepts in files that are being added, as the upload form shows them before they are saved. */
export function useDetectedConcepts(files: { name: string; sheets?: SheetColumns[] }[]): DetectedConcept[] {
  const concepts = useCustomConcepts();
  return useMemo(() => detectCustomConcepts(files, concepts), [files, concepts]);
}

export const customConceptActions = {
  /** Flag a saved dataset's custom concepts for approval. Safe to call twice for one dataset. */
  submit(dataset: { id: string; projectId: string; projectCode: string; uploadedBy: string; uploadedAt: string; files: { name: string; sheets?: SheetColumns[] }[] }): CustomConcept[] {
    const state = useStore.getState().concepts;
    if (state.some((c) => c.datasetId === dataset.id)) return [];
    const added = detectCustomConcepts(dataset.files, state).map(
      (d): CustomConcept => ({
        id: `${dataset.id}|${d.key}`,
        key: d.key,
        name: d.name,
        places: d.places,
        datasetId: dataset.id,
        projectId: dataset.projectId,
        projectCode: dataset.projectCode,
        uploadedBy: dataset.uploadedBy,
        uploadedAt: dataset.uploadedAt,
        status: "pending",
      }),
    );
    if (added.length) useStore.setState({ concepts: [...state, ...added] });
    return added;
  },
  /** Approve or not approve every pending request for a concept, whichever dataset added it. Returns what they were, for Undo. */
  decide(key: string, status: "approved" | "rejected", reason: string): CustomConcept[] {
    const before = useStore.getState().concepts.filter((c) => c.key === key && c.status === "pending");
    const ids = new Set(before.map((c) => c.id));
    const at = todayIso();
    useStore.setState((s) => ({
      concepts: s.concepts.map((c) => (ids.has(c.id) ? { ...c, status, decidedBy: CURRENT_USER_NAME, decidedAt: at, ...(reason.trim() ? { reason: reason.trim() } : {}) } : c)),
    }));
    return before;
  },
  /** Put back what `decide` changed. */
  restore(before: CustomConcept[]) {
    const byId = new Map(before.map((c) => [c.id, c]));
    useStore.setState((s) => ({ concepts: s.concepts.map((c) => byId.get(c.id) ?? c) }));
  },
};

// ── Reading a workbook's headings ──

const columnLetter = (index: number): string => {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
};

/**
 * The first row of every visible sheet that has a row of headings (two or more filled cells), read from the
 * file's bytes in the browser. Hidden sheets (lookups) are skipped. Only the headings are returned.
 */
export async function readWorkbookColumns(buffer: ArrayBuffer): Promise<SheetColumns[]> {
  const { read, utils } = await import("xlsx");
  const workbook = read(buffer, { type: "array", sheetRows: 2 });
  const hidden = workbook.Workbook?.Sheets ?? [];
  const out: SheetColumns[] = [];
  workbook.SheetNames.forEach((sheet, i) => {
    if (hidden[i]?.Hidden) return;
    const rows = utils.sheet_to_json<unknown[]>(workbook.Sheets[sheet], { header: 1, defval: "", blankrows: false, raw: false });
    const header = rows[0] ?? [];
    const columns = header.flatMap((cell, index): SheetColumn[] => {
      const name = String(cell ?? "").trim();
      return name ? [{ name, letter: columnLetter(index) }] : [];
    });
    if (columns.length >= 2) out.push({ sheet, columns });
  });
  return out;
}

/**
 * "Sheet Species, column H", and how many other places when there are more. The file's name leads only
 * when there is more than one file to tell apart (`withFile`): beside a single file it is already on screen.
 */
export function describePlace(places: ConceptPlace[], withFile = false): string {
  const [first, ...rest] = places;
  if (!first) return "";
  const more = rest.length ? ` and ${rest.length} other ${rest.length === 1 ? "place" : "places"}` : "";
  const where = `${withFile ? "sheet" : "Sheet"} ${first.sheet}, column ${first.letter}${more}`;
  return withFile ? `${first.fileName}, ${where}` : where;
}

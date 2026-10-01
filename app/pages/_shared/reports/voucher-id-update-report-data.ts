// The Voucher ID Update Report: for every vouchered specimen, what the museum or herbarium holds beside what BioData
// holds for the same specimen, and which field, if any, disagrees (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk
// frame 1507:13649, columns list node 1507:14480, with 21 columns).
//
// A row is never stored. The BioData side is the specimen record the app holds (specimen-records.ts: the species,
// voucher, NSX code, registration and observers of Explore's occurrences and the Adelaide Hills survey). The
// museum or herbarium side is the simulated SpecimenDB copy of the same specimen: the same values, except on a few
// rows where one field differs so the Mismatch column has something to say. Which rows those are is listed in
// MUSEUM_DIFFERS below, in this file only: nothing a person reads on screen describes it.
//
// SAMPLE: the batches (BT-0041 to BT-0044) and their dates are illustrative, deterministic and fixed, so the
// server and the browser agree. The voucher numbers other than the survey's own (24518) are derived, not real.

import { reportProjectsFor } from "@/app/pages/_shared/reports/report-projects";
import { HERBARIUM, projectLabel, specimens, type Specimen } from "@/app/pages/_shared/reports/specimen-records";
import type { UserRole } from "@/lib/user-role";

export type MismatchField = "Scientific name" | "Voucher ID" | "NSX code" | "Registration ID" | "Observer name";
export type BatchSourceSystem = "Museum" | "Herbarium" | "iNaturalist";
export type BatchSource = "File" | "API";

/** What one side holds about a specimen. */
export interface VoucherSide {
  scientific: string;
  voucherId: string;
  nsx: string;
  rego: string;
  observer: string;
}

export interface VoucherRow {
  id: string;
  batchSourceSystem: BatchSourceSystem;
  museum: VoucherSide;
  biodata: VoucherSide;
  /** The field that differs, or "" when the two sides agree. */
  mismatch: MismatchField | "";
  class: string;
  species: string;
  genus: string;
  family: string;
  order: string;
  projectId: string;
  projectTitle: string;
  batchId: string;
  /** ISO day. */
  batchDate: string;
  batchSource: BatchSource;
}

interface Batch {
  id: string;
  system: BatchSourceSystem;
  source: BatchSource;
  date: string;
}

const BATCHES: Batch[] = [
  { id: "BT-0041", system: "Museum", source: "File", date: "2026-09-03" },
  { id: "BT-0042", system: "Herbarium", source: "API", date: "2026-09-10" },
  { id: "BT-0043", system: "Museum", source: "API", date: "2026-09-17" },
  { id: "BT-0044", system: "Herbarium", source: "File", date: "2026-09-24" },
];

/** The last two digits of a voucher number swapped: a slip a hand-typed register makes. */
function swapLastTwo(voucherId: string): string {
  return voucherId.slice(0, -2) + voucherId.slice(-1) + voucherId.slice(-2, -1);
}

// SOURCE COMMENT, not shown on screen: the rows where the museum or herbarium copy deliberately differs from BioData,
// so the Mismatch column is exercised in every shape. Every other row agrees field for field.
//   occ-12   scientific name: the museum still files the Southern Bell Frog under its older genus (Ranoidea)
//   OCRP094  NSX code: the museum holds another species' code (the Common Brushtail Possum's, M01130)
//   occ-8    voucher ID: two digits transposed
//   occ-18   voucher ID: two digits transposed, on the herbarium side
//   occ-9    registration ID: BioData has none recorded; the museum holds "Birds"
//   occ-11   observer name: the museum credits a different observer
//   OC00503  observer name: the museum credits one of the two observers
const MUSEUM_DIFFERS: Record<string, (specimen: Specimen, side: VoucherSide) => { museum?: Partial<VoucherSide>; biodata?: Partial<VoucherSide>; field: MismatchField }> = {
  "occ-12": () => ({ field: "Scientific name", museum: { scientific: "Ranoidea raniformis" } }),
  OCRP094: () => ({ field: "NSX code", museum: { nsx: "M01130" } }),
  "occ-8": (_, side) => ({ field: "Voucher ID", museum: { voucherId: swapLastTwo(side.voucherId) } }),
  "occ-18": (_, side) => ({ field: "Voucher ID", museum: { voucherId: swapLastTwo(side.voucherId) } }),
  "occ-9": () => ({ field: "Registration ID", biodata: { rego: "" } }),
  "occ-11": () => ({ field: "Observer name", museum: { observer: "Lana Steiner" } }),
  OC00503: (_, side) => ({ field: "Observer name", museum: { observer: side.observer.split(", ")[0] } }),
};

function rowsFor(all: Specimen[]): VoucherRow[] {
  // Fauna go to the museum's batches and flora to the herbarium's, the first part of each to the earlier batch.
  const museumBatches = BATCHES.filter((b) => b.system === "Museum");
  const herbariumBatches = BATCHES.filter((b) => b.system === "Herbarium");
  const fauna = all.filter((s) => s.institution !== HERBARIUM);
  const flora = all.filter((s) => s.institution === HERBARIUM);

  const batchOf = (s: Specimen): Batch => {
    const list = s.institution === HERBARIUM ? flora : fauna;
    const batches = s.institution === HERBARIUM ? herbariumBatches : museumBatches;
    return list.indexOf(s) < Math.ceil(list.length / 2) ? batches[0] : batches[1];
  };

  return all.map((s) => {
    const biodata: VoucherSide = { scientific: s.scientific, voucherId: s.voucherId, nsx: s.nsx, rego: s.rego, observer: s.observers.join(", ") };
    const difference = MUSEUM_DIFFERS[s.id]?.(s, biodata);
    const batch = batchOf(s);
    return {
      id: `${batch.id}-${s.id}`,
      batchSourceSystem: batch.system,
      museum: { ...biodata, ...difference?.museum },
      biodata: { ...biodata, ...difference?.biodata },
      mismatch: difference?.field ?? "",
      class: s.class,
      species: s.epithet,
      genus: s.genus,
      family: s.family,
      order: s.order,
      projectId: s.projectId,
      projectTitle: projectLabel(s.projectId).title,
      batchId: batch.id,
      batchDate: batch.date,
      batchSource: batch.source,
    };
  });
}

let cached: VoucherRow[] | null = null;
/** Every row, built once per page load. */
export function voucherRows(): VoucherRow[] {
  cached ??= rowsFor(specimens());
  return cached;
}

// ── Who sees what ──
/** BioData Admin sees every voucher; everyone else sees the vouchers of the projects they contribute to. */
export function visibleTo(rows: VoucherRow[], role: UserRole): VoucherRow[] {
  if (role === "biodata-admin") return rows;
  const mine = new Set(reportProjectsFor(role).map((p) => p.id));
  return rows.filter((r) => mine.has(r.projectId));
}

/** Whether the two sides disagree on this field, so the cell can say so. */
export const differs = (row: VoucherRow, field: MismatchField) => row.mismatch === field;

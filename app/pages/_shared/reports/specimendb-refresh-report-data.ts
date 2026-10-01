// The SpecimenDB Refresh Report: the batches of specimen records refreshed from SpecimenDB into BioData, each
// record in Darwin Core (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk frame 1525:13940, columns list node 1532:15068,
// with 93 columns: four batch fields, then 89 Darwin Core terms).
//
// A row is never stored. It is DERIVED from the specimen records the app holds (specimen-records.ts), the same
// specimens the Voucher ID Update Report compares, filed under the institution that holds them: the South
// Australian Museum (institutionCode SAMA) for fauna and the State Herbarium of South Australia (AD) for flora.
// A Darwin Core term is filled only where the app has a value: the species, taxonomy, place, date, observers and
// the one survey voucher's preparation, determiners and remarks are the app's own. Every other term is left empty
// rather than invented (no ORCIDs, no elevations, no georeference details, no authorship).
//
// SAMPLE: the four batches (B-2026-001 to B-2026-004), their dates and the catalogue numbers are illustrative,
// deterministic and fixed, so the server and the browser agree. The catalogue numbers other than the survey's own
// voucher (24518) are derived in the style the data uses ("SAMA:24518"); they are not real catalogue numbers.
// The two deliberately errored rows are listed in ERRORED below, in this file only.
//
// A restricted (Level 2) record's coordinates follow the same access rule as every other screen
// (record-access.ts): BioData Admin sees the precise point, anyone else sees it generalised to a grid, with the
// uncertainty that goes with it.

import { generalisedKm } from "@/app/pages/_shared/map-search/record-access";
import { obfuscateCoordinate } from "@/app/pages/_shared/map-search/geo";
import { reportProjectsFor } from "@/app/pages/_shared/reports/report-projects";
import { HERBARIUM, specimens, type DatasetType, type Specimen } from "@/app/pages/_shared/reports/specimen-records";
import type { UserRole } from "@/lib/user-role";

// The 89 Darwin Core terms, in the wireframe's order. Their spelling is the standard's and is the column's label.
export const DWC_TERMS = [
  "id", "type", "modified", "license", "rightsHolder", "institutionCode", "collectionCode", "datasetName", "basisOfRecord",
  "occurrenceID", "catalogNumber", "recordNumber", "recordedBy", "recordedByID", "lifeStage", "reproductiveCondition",
  "establishmentMeans", "georeferenceVerificationStatus", "occurrenceStatus", "preparations", "disposition",
  "associatedOccurrences", "associatedSequences", "associatedTaxa", "otherCatalogNumbers", "occurrenceRemarks",
  "previousIdentifications", "parentEventID", "eventDate", "startDayOfYear", "year", "month", "day", "verbatimEventDate",
  "habitat", "eventRemarks", "continent", "waterBody", "islandGroup", "island", "country", "countryCode", "stateProvince",
  "county", "locality", "verbatimLocality", "minimumElevationInMeters", "maximumElevationInMeters", "verbatimElevation",
  "minimumDepthInMeters", "maximumDepthInMeters", "verbatimDepth", "minimumDistanceAboveSurfaceInMeters",
  "maximumDistanceAboveSurfaceInMeters", "locationRemarks", "decimalLatitude", "decimalLongitude", "geodeticDatum",
  "coordinateUncertaintyInMeters", "coordinatePrecision", "verbatimCoordinates", "verbatimLatitude", "verbatimLongitude",
  "verbatimCoordinateSystem", "verbatimSRS", "georeferencedBy", "georeferencedDate", "georeferenceProtocol",
  "georeferenceSources", "georeferenceRemarks", "identificationQualifier", "typeStatus", "identifiedBy", "identifiedByID",
  "dateIdentified", "identificationRemarks", "scientificName", "kingdom", "phylum", "class", "order", "family", "genus",
  "specificEpithet", "infraspecificEpithet", "taxonRank", "scientificNameAuthorship", "nomenclaturalCode",
  "nomenclaturalStatus",
] as const;

export type DwcTerm = (typeof DWC_TERMS)[number];
export type DwcRecord = Record<DwcTerm, string>;

export interface RefreshRow {
  /** The batch and the specimen: a specimen can be refreshed in more than one batch. */
  id: string;
  batchId: string;
  batchSourceSystem: string;
  /** ISO day. */
  batchDate: string;
  /** Why SpecimenDB could not give a clean record, or "" for a clean one. */
  error: string;
  dwc: DwcRecord;
  // Not columns (the wireframe's filters name them, the 93 columns do not): kept for the search and the filters.
  projectId: string;
  datasetType: DatasetType;
  nsxCode: string;
  /** NSL codes are not held anywhere in the app yet. */
  nslCode: string;
  regoId: string;
}

interface Batch {
  id: string;
  institution: "museum" | "herbarium";
  system: string;
  date: string;
}

const BATCHES: Batch[] = [
  { id: "B-2026-001", institution: "museum", system: "South Australian Museum", date: "2026-09-04" },
  { id: "B-2026-002", institution: "herbarium", system: "State Herbarium of South Australia", date: "2026-09-11" },
  { id: "B-2026-003", institution: "museum", system: "South Australian Museum", date: "2026-09-18" },
  { id: "B-2026-004", institution: "herbarium", system: "State Herbarium of South Australia", date: "2026-09-25" },
];

// SOURCE COMMENT, not shown on screen: the rows that deliberately carry an error, each in the voice of the ingestion
// report's reasons (what happened, plainly). A record SpecimenDB could not find has nothing but what BioData asked for
// (the catalogue number and the institution); a record with a missing date has everything but the date.
//   occ-7    the Southern Hairy-nosed Wombat voucher: not found in SpecimenDB
//   occ-19   the Grass Tree voucher: the collection date is missing in SpecimenDB
const ERRORED: Record<string, { reason: string; kind: "not-found" | "no-date" }> = {
  "occ-7": { reason: "The voucher wasn't found in SpecimenDB.", kind: "not-found" },
  "occ-19": { reason: "The collection date is missing in SpecimenDB.", kind: "no-date" },
};

const empty = (): DwcRecord => Object.fromEntries(DWC_TERMS.map((t) => [t, ""])) as DwcRecord;

function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

function record(s: Specimen, role: UserRole, kind: "clean" | "not-found" | "no-date"): DwcRecord {
  const dwc = empty();
  const catalogNumber = `${s.institution.code}:${s.voucherNumber}`;
  // SpecimenDB never found the voucher: all that is known is what BioData asked for.
  if (kind === "not-found") {
    return { ...dwc, catalogNumber, institutionCode: s.institution.code, collectionCode: s.rego };
  }

  const [year, month, day] = s.date.split("-");
  const km = generalisedKm({ licenceLevel: s.licenceLevel, group: s.group }, role);
  const point = km ? obfuscateCoordinate(s.lat, s.lon, km) : null;
  const flora = s.datasetType === "Flora";
  const island = s.region === "Kangaroo Island" ? "Kangaroo Island" : "";

  return {
    ...dwc,
    type: "PhysicalObject",
    license: "CC BY 4.0",
    rightsHolder: s.institution.name,
    institutionCode: s.institution.code,
    collectionCode: s.rego,
    basisOfRecord: "PreservedSpecimen",
    occurrenceID: s.id,
    catalogNumber,
    recordedBy: s.observers.join(" | "),
    occurrenceStatus: "present",
    preparations: s.voucherType,
    occurrenceRemarks: s.remarks,
    ...(kind === "no-date" ? {} : { eventDate: s.date, startDayOfYear: String(dayOfYear(s.date)), year, month: String(Number(month)), day: String(Number(day)) }),
    continent: "Oceania",
    island,
    country: "Australia",
    countryCode: "AU",
    stateProvince: "South Australia",
    locality: s.region,
    decimalLatitude: String(point ? point.lat : s.lat),
    decimalLongitude: String(point ? point.lon : s.lon),
    geodeticDatum: "WGS84",
    coordinateUncertaintyInMeters: km ? String(km * 1000) : "",
    georeferenceRemarks: km ? `Location generalised to ${km} km: this is a restricted (Level 2) record.` : "",
    identifiedBy: s.identifiedBy.join(" | "),
    dateIdentified: s.dateIdentified,
    scientificName: s.scientific,
    kingdom: flora ? "Plantae" : "Animalia",
    phylum: flora ? "Tracheophyta" : "Chordata",
    class: s.class,
    order: s.order,
    family: s.family,
    genus: s.genus,
    specificEpithet: s.epithet,
    taxonRank: "species",
    nomenclaturalCode: flora ? "ICN" : "ICZN",
  };
}

function rowsFor(all: Specimen[], role: UserRole): RefreshRow[] {
  const fauna = all.filter((s) => s.institution !== HERBARIUM);
  const flora = all.filter((s) => s.institution === HERBARIUM);
  const museumBatches = BATCHES.filter((b) => b.institution === "museum");
  const herbariumBatches = BATCHES.filter((b) => b.institution === "herbarium");

  return all.map((s) => {
    const list = s.institution === HERBARIUM ? flora : fauna;
    const batches = s.institution === HERBARIUM ? herbariumBatches : museumBatches;
    // The first half of each institution's specimens went in its earlier batch, the rest in the later one.
    const batch = list.indexOf(s) < Math.ceil(list.length / 2) ? batches[0] : batches[1];
    const errored = ERRORED[s.id];
    return {
      id: `${batch.id}-${s.id}`,
      batchId: batch.id,
      batchSourceSystem: batch.system,
      batchDate: batch.date,
      error: errored?.reason ?? "",
      dwc: record(s, role, errored?.kind ?? "clean"),
      projectId: s.projectId,
      datasetType: s.datasetType,
      nsxCode: s.nsx,
      nslCode: "",
      regoId: s.rego,
    };
  });
}

// ── Who sees what ──
/** A platform-wide refresh log, not a project's: BioData Admin sees every record, everyone else the records of the
 *  specimens on projects they contribute to. The rows are built per role, because a restricted record's coordinates are. */
export function refreshRowsFor(role: UserRole): RefreshRow[] {
  const rows = rowsFor(specimens(), role);
  if (role === "biodata-admin") return rows;
  const mine = new Set(reportProjectsFor(role).map((p) => p.id));
  return rows.filter((r) => mine.has(r.projectId));
}

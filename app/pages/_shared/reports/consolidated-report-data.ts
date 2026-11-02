// The Consolidated report: one row per species sighting, an occurrence of a species, with the visit it was made on, the site that
// visit was at and the project it belongs to, so a sighting reads with where and when it was made (the designer's sheet, 29 Oct 2026:
// its metadata lines, its Add Filters and Add Columns, and its column list).
//
// A row is read from the project page's own records (report-records.ts), by the field labels the record page uses, so the report and
// the record page cannot disagree. The visit and the site are the sighting's nearest ancestors of those types. A value the app does not
// hold for a record is left empty and is never made up (CONTRACTS 0.3): Zone, Easting, Northing, Site type, Generated location, Photos
// and Tissue and description have no field anywhere in the app, so they are in the table and empty.
//
// Location (CONTRACTS record access): the sighting a project restriction generalises (`blockKm`: it is shown only as a block) must
// not reach a place through this report. The columns that name one (the coordinates and the generated location) are left empty on
// such a row, rather than showing the site's exact position beside a sighting that is shown as a block.

import { countedOf, fieldOf, indexOf, nsxOf, peopleOf, recordsOfKind, type ReportProject, type SeedIndex } from "@/app/pages/_shared/reports/report-records";
import type { SurveyRecord } from "@/app/pages/project-detail/survey-data";

export interface ConsolidatedRow {
  id: string;
  projectId: string;
  /** Who the project's data belongs to: its organisation, or the person when it is not an organisation's. */
  owner: string;
  ownerEmail: string;
  visitSeq: string;
  /** "BD-5039 - Adelaide Hills Bushland Survey". */
  project: string;
  /** The site's ID and name, "SU00501 - Cleland Stringybark Woodland", and the site's record ID (what the Sites filter chooses). */
  site: string;
  siteId: string;
  visitId: string;
  /** The visit's day as the record page writes it ("14 Oct 2025"), and as an ISO day for the date filter and the sort. */
  visitDate: string;
  visitDay: string;
  observers: string[];
  nsx: string;
  scientific: string;
  common: string;
  released: string;
  accuracy: string;
  sighting: string;
  numberObserved: string;
  sourceId: string;
  siteProperty: string;
  altitude: string;
  paddock: string;
  siteType: string;
  camp: string;
  latitude: string;
  longitude: string;
  locationMethod: string;
  methodName: string;
  datum: string;
  reliability: string;
  locationComments: string;
  landForm: string;
  bareEarth: string;
}

/** The nearest ancestor of a record that passes `test`: a sighting's visit, then the site it was at. */
function ancestor(record: SurveyRecord, index: SeedIndex, test: (r: SurveyRecord) => boolean): SurveyRecord | undefined {
  let current = record.parentId ? index.byId.get(record.parentId) : undefined;
  while (current) {
    if (test(current)) return current;
    current = current.parentId ? index.byId.get(current.parentId) : undefined;
  }
  return undefined;
}

/** The first of the records that has the field set. */
function fromAny(records: (SurveyRecord | undefined)[], label: string): string {
  for (const record of records) {
    const value = record ? fieldOf(record, label) : "";
    if (value) return value;
  }
  return "";
}

/** "GPS - Hand-held GPS" as its code and its meaning: the vocabulary list reads a code and its description with a hyphen between them. */
function codeAndName(value: string): [code: string, name: string] {
  const at = value.indexOf(" - ");
  return at === -1 ? [value, ""] : [value.slice(0, at), value.slice(at + 3)];
}

const label = (r: SurveyRecord | undefined) => (r ? `${r.code} - ${r.name}` : "");
const degrees = (n: number) => n.toFixed(5);

export function consolidatedRowsFor({ project, seed }: ReportProject): ConsolidatedRow[] {
  const index = indexOf(seed);
  const owner = seed.meta.publisher;
  const ownerEmail = seed.project.details.dataOwnerContacts.map((c) => c.email).filter(Boolean).join(", ");
  return recordsOfKind(seed, "occurrence").map((occurrence) => {
    const observation = (index.childrenOf.get(occurrence.id) ?? []).find((r) => r.kind === "observation");
    const visit = ancestor(occurrence, index, (r) => r.kind === "event" && r.type === "Visit");
    const site = ancestor(occurrence, index, (r) => r.kind === "event" && r.type === "Site");
    const counted = countedOf(occurrence);
    const hidesPlace = occurrence.blockKm !== undefined;
    const [methodCode, methodName] = codeAndName(site ? fieldOf(site, "Location method") : "");
    const record = [occurrence, observation, visit, site];
    return {
      id: `${project.id}:${occurrence.id}`,
      projectId: project.id,
      owner,
      ownerEmail,
      visitSeq: visit ? fieldOf(visit, "Visit sequence number") : "",
      project: `${project.code} - ${project.name}`,
      site: label(site),
      siteId: site ? `${project.id}:${site.id}` : "",
      visitId: visit?.code ?? "",
      visitDate: visit ? fieldOf(visit, "Start date") : "",
      visitDay: visit?.date ?? "",
      observers: visit ? peopleOf(fieldOf(visit, "Recorded by")) : [],
      nsx: nsxOf(occurrence),
      scientific: occurrence.scientificName ?? "",
      common: occurrence.name,
      released: observation ? fieldOf(observation, "Planted/Released") : "",
      accuracy: fieldOf(occurrence, "Date accuracy"),
      sighting: fieldOf(occurrence, "Legacy sighting #"),
      numberObserved: (observation ? fieldOf(observation, "Number observed") : "") || (counted === undefined ? "" : String(counted)),
      sourceId: fieldOf(occurrence, "Source ID"),
      siteProperty: site ? fieldOf(site, "Specific property details") : "",
      altitude: site ? fieldOf(site, "Altitude") : "",
      paddock: site ? fieldOf(site, "Paddock") : "",
      siteType: site ? fieldOf(site, "Site type") : "",
      camp: site ? fieldOf(site, "Site grouping") : "",
      latitude: site && !hidesPlace ? degrees(site.lat) : "",
      longitude: site && !hidesPlace ? degrees(site.lon) : "",
      locationMethod: hidesPlace ? "" : methodCode,
      methodName: hidesPlace ? "" : methodName,
      datum: site ? fieldOf(site, "Datum") : "",
      reliability: site ? fieldOf(site, "Reliability") : "",
      locationComments: hidesPlace || !site ? "" : fieldOf(site, "Location comment"),
      landForm: fromAny(record, "Land form pattern"),
      bareEarth: fromAny(record, "Bare earth estimate"),
    };
  });
}

// The Species Detail Report: one row per species record, an occurrence of a species together with the observation
// made for it (Figma YMproGZfrFB5jUqPHPxMhk frame 1583:31367, columns list node 1594:65311, 45 columns).
//
// A row is read from the project page's own records (report-records.ts), by the field labels the record page uses
// (survey-data.ts), so the report and the record page cannot disagree. Only species occurrences make a row: Explore's
// Non-biotic and Community records are not a species and the project page files them as plain observations, so they
// are in the Events, Occurrences and Observations Report and not here. A record the role may not see is not in the
// project's records at all (seedFromExplore leaves it out, CONTRACTS record access), so it cannot appear.
//
// No column here shows a location, so a generalised (Level 2) record cannot leak one through this report.

import { countedOf, fieldOf, firstField, groupOfRecord, indexOf, measurementOf, nsxOf, recordsOfKind, type ReportProject } from "@/app/pages/_shared/reports/report-records";

export interface SpeciesRow {
  id: string;
  projectId: string;
  project: string;
  seq: string;
  common: string;
  /** The species group (Mammal, Bird, Plant ...): the broad class the app holds for a species. */
  group: string;
  status: string;
  nsx: string;
  scientific: string;
  dateAccuracy: string;
  voucherId: string;
  treeHealth: string;
  dominance: string;
  legacy: string;
  numberObserved: string;
  line: string;
  lifeForm: string;
  cover: string;
  activity: string;
  collection: string;
  strata: string;
  macroHabitat: string;
  microHabitat: string;
  sex: string;
  weight: string;
  length: string;
  snoutVent: string;
  gravid: string;
  teats: string;
  vagina: string;
  pouch: string;
  testes: string;
  inPouch: string;
  comments: string;
  annualHerb: string;
}

/** Tree health is many fields on the record page; here it reads as the ones that were recorded. */
function treeHealthOf(record: Parameters<typeof fieldOf>[0]): string {
  const section = record.sections.find((s) => s.id === "treeHealth");
  const parts = (section?.rows ?? [])
    .filter((row) => !row.label.endsWith("score"))
    .map((row) => {
      const value = fieldOf(record, row.label);
      if (!value) return "";
      return `${row.label} ${value.toLowerCase()}`;
    })
    .filter(Boolean);
  return parts.join(", ");
}

export function speciesRowsFor({ project, seed }: ReportProject): SpeciesRow[] {
  const index = indexOf(seed);
  return recordsOfKind(seed, "occurrence").map((occurrence) => {
    // An occurrence parents exactly one observation (Project > Site > Visit > Occurrence > Observation).
    const observation = (index.childrenOf.get(occurrence.id) ?? []).find((r) => r.kind === "observation");
    const ob = (label: string) => (observation ? fieldOf(observation, label) : "");
    const counted = countedOf(occurrence);
    return {
      id: `${project.id}:${occurrence.id}`,
      projectId: project.id,
      project: project.name,
      seq: fieldOf(occurrence, "Species seq no."),
      common: occurrence.name,
      group: groupOfRecord(occurrence, index) ?? "",
      status: fieldOf(occurrence, "Occurrence status"),
      nsx: nsxOf(occurrence),
      scientific: occurrence.scientificName ?? "",
      dateAccuracy: fieldOf(occurrence, "Date accuracy"),
      voucherId: fieldOf(occurrence, "Voucher number"),
      treeHealth: observation ? treeHealthOf(observation) : "",
      dominance: ob("Association dominance"),
      legacy: fieldOf(occurrence, "Legacy sighting #"),
      numberObserved: ob("Number observed") || (counted === undefined ? "" : String(counted)),
      line: ob("Line"),
      lifeForm: ob("Life form & desc"),
      cover: ob("Cover/abundance & desc"),
      activity: ob("Activity"),
      collection: ob("Collection method & desc"),
      strata: ob("Strata & desc"),
      macroHabitat: ob("Macro habitat & desc"),
      microHabitat: ob("Micro habitat & desc"),
      sex: ob("Sex"),
      weight: observation ? measurementOf(observation, (t) => t === "Body mass", "g") : "",
      length: observation ? measurementOf(observation, (t) => t === "Head-body length", "mm") : "",
      snoutVent: observation ? measurementOf(observation, (t) => /snout/i.test(t), "mm") : "",
      gravid: ob("Gravid?"),
      teats: ob("Teats"),
      vagina: ob("Vagina"),
      pouch: ob("Pouch status"),
      testes: ob("Testes"),
      inPouch: ob("No. in pouch"),
      comments: (observation ? firstField(observation, "Observation comment") : "") || fieldOf(occurrence, "Occurrence comment"),
      annualHerb: ob("Is annual herb?"),
    };
  });
}

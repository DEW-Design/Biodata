// The specimens the Voucher ID Update Report and the SpecimenDB Refresh Report both draw on: one list, so a
// voucher reads the same in both. A specimen is a species occurrence the app already holds (Explore's dataset in
// map-search/search-data.ts, and the Adelaide Hills survey records in project-detail/survey-data.ts), kept at
// the institution that would hold its voucher: the South Australian Museum for fauna, the State Herbarium of
// South Australia for flora (the two institutions field-options.ts already names).
//
// What is real and what is derived:
//   - the species, the place, the date, the observers, the NSX code (only where field-schema.ts lists the species)
//     and the project are the app's own;
//   - the one voucher the survey data actually carries (OC00504, a Southern Brown Bandicoot hair sample, number
//     24518, registered under "Mammals") is used as it stands;
//   - every other voucher number is DERIVED, deterministically, in the style the data already uses (the
//     institution's prefix and a number). They are sample identifiers, not real catalogue numbers;
//   - the registration ("Institution rego #") is the register the species' group belongs to, from the
//     options list in field-options.ts;
//   - an NSX code is never invented: a species field-schema.ts does not list has none.

import {
  hasScientificName,
  rootProjectForParentEventId,
  searchEvents,
  searchObservations,
  searchOccurrences,
  type LicenceLevel,
  type SpeciesGroup,
} from "@/app/pages/_shared/map-search/search-data";
import { NSX_SPECIES } from "@/app/pages/project-detail/field-schema";
import { SURVEY_RECORDS, type SurveyRecord } from "@/app/pages/project-detail/survey-data";

export interface Institution {
  name: string;
  /** The institution's Darwin Core institutionCode. */
  code: string;
  /** How the app writes a voucher number for it ("SAM 24518"). */
  prefix: string;
}

export const MUSEUM: Institution = { name: "South Australian Museum", code: "SAMA", prefix: "SAM" };
export const HERBARIUM: Institution = { name: "State Herbarium of South Australia", code: "AD", prefix: "AD" };

export type DatasetType = "Flora" | "Fauna";

interface Taxon {
  group: SpeciesGroup;
  class: string;
  order: string;
  family: string;
}

// Real taxonomy for every species in the dataset. Family follows Explore's own records where it gives one.
const TAXA: Record<string, Taxon> = {
  "Macropus giganteus": { group: "Mammal", class: "Mammalia", order: "Diprotodontia", family: "Macropodidae" },
  "Tachyglossus aculeatus": { group: "Mammal", class: "Mammalia", order: "Monotremata", family: "Tachyglossidae" },
  "Sternula nereis": { group: "Bird", class: "Aves", order: "Charadriiformes", family: "Laridae" },
  "Tiliqua adelaidensis": { group: "Reptile", class: "Reptilia", order: "Squamata", family: "Scincidae" },
  "Petrogale xanthopus": { group: "Mammal", class: "Mammalia", order: "Diprotodontia", family: "Macropodidae" },
  "Lasiorhinus latifrons": { group: "Mammal", class: "Mammalia", order: "Diprotodontia", family: "Vombatidae" },
  "Dromaius novaehollandiae": { group: "Bird", class: "Aves", order: "Casuariiformes", family: "Dromaiidae" },
  "Leipoa ocellata": { group: "Bird", class: "Aves", order: "Galliformes", family: "Megapodiidae" },
  "Macropus rufus": { group: "Mammal", class: "Mammalia", order: "Diprotodontia", family: "Macropodidae" },
  "Polytelis anthopeplus": { group: "Bird", class: "Aves", order: "Psittaciformes", family: "Psittaculidae" },
  "Litoria raniformis": { group: "Amphibian", class: "Amphibia", order: "Anura", family: "Pelodryadidae" },
  "Pseudomys shortridgei": { group: "Mammal", class: "Mammalia", order: "Rodentia", family: "Muridae" },
  "Acacia pycnantha": { group: "Plant", class: "Magnoliopsida", order: "Fabales", family: "Fabaceae" },
  "Eucalyptus leucoxylon": { group: "Plant", class: "Magnoliopsida", order: "Myrtales", family: "Myrtaceae" },
  "Xanthorrhoea semiplana": { group: "Plant", class: "Liliopsida", order: "Asparagales", family: "Xanthorrhoeaceae" },
  "Santalum acuminatum": { group: "Plant", class: "Magnoliopsida", order: "Santalales", family: "Santalaceae" },
  "Grevillea lavandulacea": { group: "Plant", class: "Magnoliopsida", order: "Proteales", family: "Proteaceae" },
  "Isoodon obesulus": { group: "Mammal", class: "Mammalia", order: "Peramelemorphia", family: "Peramelidae" },
  "Malurus cyaneus": { group: "Bird", class: "Aves", order: "Passeriformes", family: "Maluridae" },
  "Crinia signifera": { group: "Amphibian", class: "Amphibia", order: "Anura", family: "Myobatrachidae" },
  "Trichosurus vulpecula": { group: "Mammal", class: "Mammalia", order: "Diprotodontia", family: "Phalangeridae" },
};

/** The register a group of species is held in (the options in field-options.ts "Institution rego #"). */
const REGO_FOR_GROUP: Record<SpeciesGroup, string> = {
  Mammal: "Mammals",
  Bird: "Birds",
  Reptile: "Herpetology",
  Amphibian: "Herpetology",
  Plant: "Vascular plants",
};

export interface Specimen {
  /** The occurrence's own id in the app ("occ-12", "OC00504"). */
  id: string;
  projectId: string;
  scientific: string;
  genus: string;
  epithet: string;
  class: string;
  order: string;
  family: string;
  group: SpeciesGroup;
  datasetType: DatasetType;
  observers: string[];
  date: string;
  lat: number;
  lon: number;
  region: string;
  licenceLevel: LicenceLevel | undefined;
  institution: Institution;
  /** "24518". */
  voucherNumber: string;
  /** "SAM 24518". */
  voucherId: string;
  rego: string;
  /** Empty when field-schema.ts does not list the species. */
  nsx: string;
  /** What the survey data holds about the voucher, where it holds any. */
  voucherType: string;
  remarks: string;
  identifiedBy: string[];
  dateIdentified: string;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const NOT_PROVIDED = "Not provided";
/** A row's value on a survey record, or "" when the record has none. */
function surveyValue(record: SurveyRecord, label: string): string {
  for (const section of record.sections) {
    const row = section.rows?.find((r) => r.label === label);
    if (row) return row.value === NOT_PROVIDED ? "" : row.value;
  }
  return "";
}
const splitList = (value: string) => (value ? value.split("|").map((v) => v.trim()) : []);

interface Seed {
  id: string;
  projectId: string;
  scientific: string;
  observers: string[];
  date: string;
  lat: number;
  lon: number;
  region: string;
  licenceLevel: LicenceLevel | undefined;
  nsx: string;
  voucher: { number: string; type: string; institution: Institution } | null;
  remarks: string;
  identifiedBy: string[];
  dateIdentified: string;
}

function seeds(): Seed[] {
  const out: Seed[] = [];
  // The Adelaide Hills survey's own occurrences (the hand-written records), with their voucher where they hold one.
  for (const r of SURVEY_RECORDS) {
    if (r.kind !== "occurrence" || !r.scientificName || surveyValue(r, "Occurrence status") !== "Present") continue;
    const number = surveyValue(r, "Voucher number");
    const institutionName = surveyValue(r, "Institution name");
    out.push({
      id: r.code,
      projectId: "adelaide-hills",
      scientific: r.scientificName,
      observers: splitList(surveyValue(r, "Recorded by")),
      date: r.date,
      lat: r.lat,
      lon: r.lon,
      region: "Adelaide Hills",
      licenceLevel: undefined,
      nsx: surveyValue(r, "NSX code & species"),
      voucher: number ? { number, type: surveyValue(r, "Voucher type"), institution: institutionName === HERBARIUM.name ? HERBARIUM : MUSEUM } : null,
      remarks: surveyValue(r, "Occurrence comment"),
      identifiedBy: splitList(surveyValue(r, "Determiners")),
      dateIdentified: surveyValue(r, "Determination date"),
    });
  }
  // Explore's species occurrences that were present (an absence is not a specimen).
  for (const o of searchOccurrences) {
    if (!hasScientificName(o.species) || o.status !== "Present") continue;
    const project = rootProjectForParentEventId(o.parentEventId);
    if (!project) continue;
    out.push({
      id: o.id,
      projectId: project.id,
      scientific: o.species,
      observers: [searchObservations.find((b) => b.occurrenceId === o.id)?.observerName ?? ""].filter(Boolean),
      date: o.date,
      lat: o.lat,
      lon: o.lon,
      region: o.region,
      licenceLevel: o.licenceLevel,
      nsx: NSX_SPECIES.find((s) => s.scientific === o.species)?.nsx ?? "",
      voucher: null,
      remarks: "",
      identifiedBy: [],
      dateIdentified: "",
    });
  }
  return out;
}

function build(): Specimen[] {
  const rand = lcg(20260929);
  const used = new Set<string>();
  return seeds().flatMap((s) => {
    const taxon = TAXA[s.scientific];
    if (!taxon) return [];
    const datasetType: DatasetType = taxon.group === "Plant" ? "Flora" : "Fauna";
    const institution = s.voucher?.institution ?? (datasetType === "Flora" ? HERBARIUM : MUSEUM);
    let number = s.voucher?.number ?? "";
    while (!number || used.has(number)) {
      number = institution === HERBARIUM ? String(96000000 + Math.floor(rand() * 3999999)) : String(20000 + Math.floor(rand() * 40000));
    }
    used.add(number);
    const [genus, epithet] = s.scientific.split(" ");
    return [
      {
        id: s.id,
        projectId: s.projectId,
        scientific: s.scientific,
        genus,
        epithet,
        class: taxon.class,
        order: taxon.order,
        family: taxon.family,
        group: taxon.group,
        datasetType,
        observers: s.observers,
        date: s.date,
        lat: s.lat,
        lon: s.lon,
        region: s.region,
        licenceLevel: s.licenceLevel,
        institution,
        voucherNumber: number,
        voucherId: `${institution.prefix} ${number}`,
        rego: REGO_FOR_GROUP[taxon.group],
        nsx: s.nsx,
        voucherType: s.voucher?.type ?? "",
        remarks: s.remarks,
        identifiedBy: s.identifiedBy,
        dateIdentified: s.dateIdentified,
      },
    ];
  });
}

let cached: Specimen[] | null = null;
/** Every specimen: the Adelaide Hills survey's first, then Explore's. Built once per page load. */
export function specimens(): Specimen[] {
  cached ??= build();
  return cached;
}

/** A project's title and code, for a report row. */
export function projectLabel(projectId: string): { code: string; title: string } {
  const project = searchEvents.find((e) => e.type === "Project" && e.id === projectId);
  return { code: project?.code ?? "", title: project?.name ?? "" };
}

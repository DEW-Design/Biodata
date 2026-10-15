// The Taxonomy Report's "Taxonomy list detail report": one row per taxon, the columns of the designer's sheet in its order
// ("BioData - Taxonomy list Detail Report", 15 Oct 2026), and the parameters that sit above those columns in the sheet
// (Species Code & Name, NSX Code, Common Name, Family, Group, Genus, Date) as a filter on the rows.
//
// A row is read from the taxa Taxonomy Management holds (`useTaxa`, tx-store.ts) by the fields its Main, Status, Common Name,
// SA Regions, Australian and Overseas Distribution, Reference Herb Data, Attributes and Linked Species tabs use, so the report and the
// taxon's own page cannot disagree. Flora and Fauna name some of the same facts differently (Flora's "Synonym?" is Fauna's
// inverse "Non Synonym?", Flora's "Native in SA?" is Fauna's "Indigenous?"), so each column reads whichever the taxon has.
// A column the taxon holds no value for is left empty and never a stray dash (CONTRACTS 2.3).

import type { Taxon } from "@/app/pages/_shared/taxonomy/tx-data";

export interface TaxonomyRow {
  id: string;
  /** Flora or Fauna, for the hero's totals. */
  kingdom: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  family: string;
  order: string;
  majorGroup: string;
  genus: string;
  species: string;
  author: string;
  infraspecific1: string;
  author1: string;
  infraspecific2: string;
  author2: string;
  infraspecific3: string;
  author3: string;
  synonym: string;
  currentConcept: string;
  forCensus: string;
  forBs: string;
  synPartly: string;
  questionably: string;
  asMs: string;
  phrase: string;
  idCertain: string;
  occursInSa: string;
  endemicInSa: string;
  nativeInSa: string;
  estabInSa: string;
  collectedLast50: string;
  hybrid: string;
  hybridRank: string;
  hybridFormula: string;
  hybridParent2: string;
  published: string;
  matchesCc: string;
  date: string;
  howCreated: string;
  lifeSpan: string;
  saRegions: string;
  ausWorld: string;
  refHerb: string;
  attributes: string;
  speciesStatus: string;
  commonNames: string;
  parents: string;
  children: string;
  comments: string;
  createdBy: string;
  createdOn: string;
  renamedBy: string;
  renamedOn: string;
  modifiedBy: string;
  modifiedOn: string;
  /** Every day the taxon carries (its Date, created, renamed and modified), as ISO days: what the Date parameter reads. */
  days: string[];
  /** The newest of those days, as a time in ms: the report's "Latest record". */
  latestMs: number | null;
}

export const joined = (values: (string | undefined)[], separator = "; ") => values.filter((v): v is string => !!v && v.trim() !== "").join(separator);

/** The first of a taxon's field values that is held. */
const held = (values: Record<string, string>, ...keys: string[]) => keys.map((k) => values[k]).find((v) => v !== undefined && v.trim() !== "") ?? "";

/** A written day ("4 Aug 2026") as an ISO day, or null when it is not one. */
export function isoDay(written: string): string | null {
  const ms = Date.parse(`${written} 12:00 UTC`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString().slice(0, 10);
}

/** A day as the report writes it ("10 Aug 2026"). The date field in Taxonomy Management stores an ISO day; anything else (the placeholder dates, a time) is shown as it is held. */
export function dayText(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** A table's rows, one value from each. */
const column = (taxon: Taxon, table: string, key: string) => joined((taxon.tables[table] ?? []).map((r) => r[key]));

export function taxonomyRowsFor(taxa: Taxon[]): TaxonomyRow[] {
  const byId = new Map(taxa.map((t) => [t.id, t]));
  const named = (ids: string[]) => joined(ids.map((id) => byId.get(id)?.scientific));

  return taxa.map((t) => {
    const v = t.values;
    const flora = t.kingdom === "Flora";
    const infra = (n: 1 | 2 | 3) => {
      if (flora) return { name: joined([v[`infraRank${n}`], v[`infraName${n}`]], " "), author: v[`infraAuthor${n}`] ?? "" };
      // Fauna's Main has a Subspecific and an Infraspecific, each with an author.
      if (n === 1) return { name: v.subspecific ?? "", author: v.subspecificAuthor ?? "" };
      if (n === 2) return { name: v.infraspecific ?? "", author: v.infraspecificAuthor ?? "" };
      return { name: "", author: "" };
    };
    const [i1, i2, i3] = [infra(1), infra(2), infra(3)];
    const nonSynonym = v.nonSynonym;
    const dates = [held(v, "date"), v.createdOn, v.renamedOn, held(v, "editedOn", "modifiedOn")];
    const days = dates.flatMap((d) => (d ? [isoDay(d)] : [])).filter((d): d is string => d !== null);
    const newest = days.length > 0 ? days.reduce((a, b) => (a > b ? a : b)) : null;

    return {
      id: t.id,
      kingdom: t.kingdom,
      nsx: t.nsx ?? "",
      nsxDescription: t.scientific,
      common: t.common,
      family: held(v, "family") || t.ranks.family,
      order: held(v, "order") || t.ranks.order,
      majorGroup: v.majorGroup ?? "",
      genus: held(v, "genus") || t.ranks.genus,
      species: held(v, "species"),
      author: held(v, "author") || t.author,
      infraspecific1: i1.name,
      author1: i1.author,
      infraspecific2: i2.name,
      author2: i2.author,
      infraspecific3: i3.name,
      author3: i3.author,
      synonym: held(v, "synonym") || (nonSynonym ? (nonSynonym === "Yes" ? "No" : "Yes") : ""),
      // A taxon's concept is current until a Combine or Split retires it: the taxon says so, not a typed field.
      currentConcept: t.current ? "Yes" : "No",
      forCensus: v.forCensus ?? "",
      forBs: v.forBs ?? "",
      synPartly: v.synPartly ?? "",
      questionably: v.questionably ?? "",
      asMs: v.asMs ?? "",
      phrase: v.phrase ?? "",
      idCertain: v.idCertain ?? "",
      occursInSa: held(v, "occursInSa", "inSa"),
      endemicInSa: held(v, "endemicInSa", "endemicSa"),
      nativeInSa: held(v, "nativeInSa", "indigenous"),
      estabInSa: v.estabInSa ?? "",
      collectedLast50: v.collectedLast50 ?? "",
      hybrid: v.hybrid ?? "",
      hybridRank: v.hybridRank ?? "",
      hybridFormula: v.hybridFormula ?? "",
      hybridParent2: joined([v.hybridParent2Nsx, v.hybridParent2Taxon], " "),
      published: v.published ?? "",
      matchesCc: v.matchesCc ?? "",
      date: dayText(v.date ?? ""),
      howCreated: v.howCreated ?? "",
      lifeSpan: v.lifeSpan ?? "",
      saRegions: flora ? column(t, "saRegions", "region") : column(t, "regionalData", "region"),
      ausWorld: flora ? column(t, "ausDistribution", "stateOs") : column(t, "ausDistribution", "region"),
      refHerb: column(t, "refHerb", "area"),
      attributes: column(t, "attributes", "attributeName"),
      speciesStatus: joined([
        v.epbcAct && `EPBC Act ${v.epbcAct}`,
        flora ? v.saNpwAct && `SA NPW Act ${v.saNpwAct}` : v.npwActStatusCode && `NPW Act ${v.npwActStatusCode}`,
        v.saStatusCode && `SA ${v.saStatusCode}`,
        v.australianStatus && `Australian ${v.australianStatus}`,
      ]),
      commonNames: column(t, "commonName", "name"),
      parents: named(t.parents),
      children: named(t.children),
      comments: joined([held(v, "comments"), v.comment1, v.comment2]),
      createdBy: v.createdBy ?? "",
      createdOn: v.createdOn ?? "",
      renamedBy: v.renamedBy ?? "",
      renamedOn: v.renamedOn ?? "",
      modifiedBy: held(v, "editedBy", "modifiedBy"),
      modifiedOn: held(v, "editedOn", "modifiedOn"),
      days,
      latestMs: newest ? Date.parse(`${newest}T12:00:00Z`) : null,
    };
  });
}

import { dayText, isoDay, joined } from "@/app/pages/_shared/reports/taxonomy-report-data";
import type { Taxon } from "@/app/pages/_shared/taxonomy/tx-data";

// The rows of the Fauna Taxonomy Report's two sheets (the designer, 16 Oct 2026): "BioData - Fauna Taxonomy list Detail Report", one row per Fauna taxon, and
// "BioData - Fauna Taxonomy list - Species Status", one row per Fauna taxon that holds a status. A row is read from the taxa Taxonomy Management holds
// (`useTaxa`, tx-store.ts) by the fields its Fauna Main, Species Status, Common Name, Australian Distribution, Regional Data, Species Reference and Attributes tabs use,
// so the report and the taxon's own page cannot disagree. A column the taxon holds no value for is left empty and never a stray dash (CONTRACTS 2.3).

/** The first of a taxon's field values that is held. */
const held = (values: Record<string, string>, ...keys: string[]) => keys.map((k) => values[k]).find((v) => v !== undefined && v.trim() !== "") ?? "";

/** A table's rows, one value from each. */
const column = (taxon: Taxon, table: string, key: string) => joined((taxon.tables[table] ?? []).map((r) => r[key]));

/** The days a taxon carries (when it was created and last modified), as ISO days: what the Date filter reads. */
function daysOf(values: Record<string, string>): string[] {
  return [values.createdOn, held(values, "modifiedOn", "editedOn")].flatMap((d) => (d ? [isoDay(d)] : [])).filter((d): d is string => d !== null);
}
const newestMs = (days: string[]) => (days.length > 0 ? Date.parse(`${days.reduce((a, b) => (a > b ? a : b))}T12:00:00Z`) : null);

// ── List detail ──

export interface FaunaRow {
  id: string;
  taxonId: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  commonSeq: string;
  commonType: string;
  family: string;
  /** The species group (Bird, Mammal ...): the sheet's Group, which is not a column. */
  group: string;
  taxonomicSeq: string;
  subFamily: string;
  genus: string;
  species: string;
  author: string;
  subspecific: string;
  subspecificAuthor: string;
  infraspecific: string;
  infraspecificAuthor: string;
  indigenous: string;
  current: string;
  official: string;
  nationalIndexNo: string;
  comment1: string;
  comment2: string;
  speciesStatus: string;
  ausDistribution: string;
  regionalData: string;
  speciesReference: string;
  attributes: string;
  createdBy: string;
  createdOn: string;
  modifiedBy: string;
  modifiedOn: string;
  days: string[];
  latestMs: number | null;
}

/** A status as the Species Status tab shows it: the code, then its text. */
const statusText = (values: Record<string, string>, key: string) => joined([values[key], values[`${key}__text`]], " - ");

export function faunaRowsFor(taxa: Taxon[]): FaunaRow[] {
  return taxa.map((t) => {
    const v = t.values;
    // The common name the taxon is listed by, and its place and type in the Common Name tab.
    const names = t.tables.commonName ?? [];
    const name = names.find((n) => n.name === t.common) ?? names[0];
    const days = daysOf(v);
    return {
      id: t.id,
      taxonId: t.id,
      nsx: t.nsx ?? "",
      nsxDescription: t.scientific,
      common: t.common,
      commonSeq: name?.seq ?? "",
      commonType: name?.type ?? "",
      family: held(v, "family") || t.ranks.family,
      group: t.group,
      taxonomicSeq: v.taxonomicSeq ?? "",
      subFamily: v.subFamily ?? "",
      genus: held(v, "genus") || t.ranks.genus,
      species: held(v, "species"),
      author: held(v, "author") || t.author,
      subspecific: v.subspecific ?? "",
      subspecificAuthor: v.subspecificAuthor ?? "",
      infraspecific: v.infraspecific ?? "",
      infraspecificAuthor: v.infraspecificAuthor ?? "",
      indigenous: v.indigenous ?? "",
      // A taxon's concept is current until a Combine or Split retires it: the taxon says so, not a typed field.
      current: t.current ? "Yes" : "No",
      official: v.official ?? "",
      nationalIndexNo: v.nationalSpeciesIndexNo ?? "",
      comment1: v.comment1 ?? "",
      comment2: v.comment2 ?? "",
      speciesStatus: joined([
        v.saStatusCode && `SA ${statusText(v, "saStatusCode")}`,
        v.australianStatus && `Australian ${statusText(v, "australianStatus")}`,
        v.npwActStatusCode && `NPW Act ${statusText(v, "npwActStatusCode")}`,
        v.epbcAct && `EPBC Act ${statusText(v, "epbcAct")}`,
      ]),
      ausDistribution: column(t, "ausDistribution", "region"),
      regionalData: column(t, "regionalData", "region"),
      speciesReference: column(t, "speciesReference", "species"),
      attributes: column(t, "attributes", "attributeName"),
      createdBy: v.createdBy ?? "",
      createdOn: dayText(v.createdOn ?? ""),
      modifiedBy: held(v, "modifiedBy", "editedBy"),
      modifiedOn: dayText(held(v, "modifiedOn", "editedOn")),
      days,
      latestMs: newestMs(days),
    };
  });
}

// ── Species status ──

export interface FaunaStatusRow {
  id: string;
  taxonId: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  saCode: string;
  saDesc: string;
  saComment: string;
  ausCode: string;
  ausDesc: string;
  ausComment: string;
  npwCode: string;
  npwDesc: string;
  npwComment: string;
  epbcCode: string;
  epbcDesc: string;
  epbcComment: string;
  createdBy: string;
  createdOn: string;
  modifiedBy: string;
  modifiedOn: string;
  days: string[];
  latestMs: number | null;
}

/** The status fields of a Fauna taxon's Species Status tab. */
const STATUS_KEYS = ["saStatusCode", "australianStatus", "npwActStatusCode", "epbcAct"];

/**
 * One row for each taxon that holds at least one status. The NPW Act and EPBC Act codes are categories from a list ("Endangered", "Vulnerable"), so their code is
 * their own description when the taxon gives no other text; the SA and Australian codes are free codes, and their description is the text beside them.
 */
export function faunaStatusRowsFor(taxa: Taxon[]): FaunaStatusRow[] {
  return taxa
    .filter((t) => STATUS_KEYS.some((k) => (t.values[k] ?? "").trim() !== ""))
    .map((t) => {
      const v = t.values;
      const days = daysOf(v);
      return {
        id: t.id,
        taxonId: t.id,
        nsx: t.nsx ?? "",
        nsxDescription: t.scientific,
        common: t.common,
        saCode: v.saStatusCode ?? "",
        saDesc: v.saStatusCode__text ?? "",
        saComment: v.saStatusCodeComment ?? "",
        ausCode: v.australianStatus ?? "",
        ausDesc: v.australianStatus__text ?? "",
        ausComment: v.australianStatusComment ?? "",
        npwCode: v.npwActStatusCode ?? "",
        npwDesc: v.npwActStatusCode__text || v.npwActStatusCode || "",
        npwComment: v.npwActComment ?? "",
        epbcCode: v.epbcAct ?? "",
        epbcDesc: v.epbcAct__text || v.epbcAct || "",
        epbcComment: v.epbcComment ?? "",
        createdBy: v.createdBy ?? "",
        createdOn: dayText(v.createdOn ?? ""),
        modifiedBy: held(v, "modifiedBy", "editedBy"),
        modifiedOn: dayText(held(v, "modifiedOn", "editedOn")),
        days,
        latestMs: newestMs(days),
      };
    });
}

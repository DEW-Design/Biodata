import { dayText, isoDay, joined } from "@/app/pages/_shared/reports/taxonomy-report-data";
import { attributeRowsFor, type AttributeRow } from "@/app/pages/_shared/reports/taxonomy-herb-attributes-data";
import type { Taxon } from "@/app/pages/_shared/taxonomy/tx-data";

// The rows of the Fauna Taxonomy Report's sheets that read a table off the taxon (the designer, 16 Oct 2026): "Taxonomy list - Australian Distribution" (its
// Australian Distribution table), "Taxonomy list - Regional Data" (its Regional Data table), "Taxonomy list - Species Reference" (its Species Reference table) and
// "Taxonomy list - Species Attributes" (its Attributes table). A row is a row of the taxon's own table in Taxonomy Management, so the report and the taxon's tab cannot
// disagree. A taxon with no row in a table has none in the report.
//
// The tables hold less than the sheets ask for: a distribution row is a region and a comment, and no row records who made it or when. The designer asked for the
// prototype to show the rest anyway (16 Oct 2026: "this is a clickable prototype not a production screen"), so a column a row does not hold is made up from what
// the taxon holds, the same way every time, and marked as mock here:
//   - Created by, Created on, Modified by and Modified on are the taxon's own (its Created On and By, its Modified On and By);
//   - Indigenous? is the taxon's Indigenous?;
//   - Certain?, Official?, Accepted? and Cross boundary? are "Yes", "Yes", "Yes" and "No", and Status is "Current": the wireframe says nothing about their values.
// None of it is stored, and Taxonomy Management does not show it. Where a row does hold the field (a key of that name on it), the row's own value wins.

const held = (values: Record<string, string>, ...keys: string[]) => keys.map((k) => values[k]).find((v) => v !== undefined && v.trim() !== "") ?? "";

/** What every row of these sheets says about its taxon, and the taxon's own history (the created and modified columns). */
export interface FaunaTaxonFacts {
  id: string;
  taxonId: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  /** Every common name the taxon has. */
  commonNames: string;
  createdBy: string;
  createdOn: string;
  modifiedBy: string;
  modifiedOn: string;
  /** The days the taxon carries (created, modified), as ISO days: what the Date filter reads. */
  days: string[];
  latestMs: number | null;
}

export function factsFor(t: Taxon, id: string): FaunaTaxonFacts {
  const v = t.values;
  const days = [v.createdOn, held(v, "modifiedOn", "editedOn")].flatMap((d) => (d ? [isoDay(d)] : [])).filter((d): d is string => d !== null);
  return {
    id,
    taxonId: t.id,
    nsx: t.nsx ?? "",
    nsxDescription: t.scientific,
    common: t.common,
    commonNames: joined((t.tables.commonName ?? []).map((n) => n.name)),
    createdBy: v.createdBy ?? "",
    createdOn: dayText(v.createdOn ?? ""),
    modifiedBy: held(v, "modifiedBy", "editedBy"),
    modifiedOn: dayText(held(v, "modifiedOn", "editedOn")),
    days,
    latestMs: days.length > 0 ? Date.parse(`${days.reduce((a, b) => (a > b ? a : b))}T12:00:00Z`) : null,
  };
}

/** A taxon's NPW Act status as the Species Status tab shows it: the text, or the category itself. */
const npwDescOf = (v: Record<string, string>) => v.npwActStatusCode__text || v.npwActStatusCode || "";

// ── Australian Distribution ──

export interface AusDistributionRow extends FaunaTaxonFacts {
  region: string;
  certain: string;
  indigenous: string;
  comment: string;
  /** The taxon's NPW Act status description, for the sheet's NPW Act Status Desc. */
  npwDesc: string;
}

export function ausDistributionRowsFor(taxa: Taxon[]): AusDistributionRow[] {
  return taxa.flatMap((t) =>
    (t.tables.ausDistribution ?? []).map((r, i) => ({
      ...factsFor(t, `${t.id}:aus${i}`),
      region: r.region ?? "",
      certain: r.certain ?? "Yes",
      indigenous: r.indigenous ?? t.values.indigenous ?? "",
      comment: r.comment ?? "",
      npwDesc: npwDescOf(t.values),
    })),
  );
}

// ── Regional Data ──

export interface RegionalDataRow extends FaunaTaxonFacts {
  region: string;
  status: string;
  crossBoundary: string;
  comment: string;
  certain: string;
  official: string;
  indigenous: string;
  accepted: string;
  /** The taxon's statuses, for the sheet's SA Status Desc, Australian Status Desc, NPW Act Status Code and NPW Act Status Desc. */
  saDesc: string;
  ausDesc: string;
  npwCode: string;
  npwDesc: string;
}

export function regionalDataRowsFor(taxa: Taxon[]): RegionalDataRow[] {
  return taxa.flatMap((t) =>
    (t.tables.regionalData ?? []).map((r, i) => ({
      ...factsFor(t, `${t.id}:reg${i}`),
      region: r.region ?? "",
      status: r.status ?? "Current",
      crossBoundary: r.crossBoundary ?? "No",
      comment: r.comment ?? "",
      certain: r.certain ?? "Yes",
      official: r.official ?? (t.values.official || "Yes"),
      indigenous: r.indigenous ?? t.values.indigenous ?? "",
      accepted: r.accepted ?? "Yes",
      saDesc: t.values.saStatusCode__text ?? "",
      ausDesc: t.values.australianStatus__text ?? "",
      npwCode: t.values.npwActStatusCode ?? "",
      npwDesc: npwDescOf(t.values),
    })),
  );
}

// ── Species Reference ──

export interface SpeciesReferenceRow extends FaunaTaxonFacts {
  newSpeciesNo: string;
}

export function speciesReferenceRowsFor(taxa: Taxon[]): SpeciesReferenceRow[] {
  return taxa.flatMap((t) => (t.tables.speciesReference ?? []).map((r, i) => ({ ...factsFor(t, `${t.id}:ref${i}`), newSpeciesNo: r.newSpeciesNo ?? "" })));
}

// ── Species Attributes ──

/** An attribute row of the Flora report's sheet (taxonomy-herb-attributes-data.ts), with the taxon's own history for the sheet's created and modified columns. */
export interface FaunaAttributeRow extends AttributeRow {
  createdBy: string;
  createdOn: string;
  modifiedBy: string;
  modifiedOn: string;
}

export function faunaAttributeRowsFor(taxa: Taxon[]): FaunaAttributeRow[] {
  const byId = new Map(taxa.map((t) => [t.id, t]));
  return attributeRowsFor(taxa).map((r) => {
    const { createdBy, createdOn, modifiedBy, modifiedOn } = factsFor(byId.get(r.taxonId)!, r.id);
    return { ...r, createdBy, createdOn, modifiedBy, modifiedOn };
  });
}

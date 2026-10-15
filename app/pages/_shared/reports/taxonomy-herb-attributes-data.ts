// The rows of two sheets of the Taxonomy Report that read a table off the taxon: "Taxonomy list - Reg Herb Data" (the taxon's Reference Herb
// Data table, Flora only) and "Taxonomy list - Species Attributes" (its Attributes table, both kingdoms), each with the parameters that sit
// above the sheet's columns (the designer, 15 Oct 2026). A row is a row of the taxon's own table in Taxonomy Management, so the report and
// the taxon's tab cannot disagree. A taxon with no row in the table has none in the report.

import { dayText, isoDay, joined } from "@/app/pages/_shared/reports/taxonomy-report-data";
import type { Taxon } from "@/app/pages/_shared/taxonomy/tx-data";

interface TaxonFacts {
  id: string;
  taxonId: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  /** Every common name the taxon has, for the Common name parameter. */
  commonNames: string;
}

const factsOf = (t: Taxon, id: string): TaxonFacts => ({
  id,
  taxonId: t.id,
  nsx: t.nsx ?? "",
  nsxDescription: t.scientific,
  common: t.common,
  commonNames: joined((t.tables.commonName ?? []).map((n) => n.name)),
});

const days = (written: (string | undefined)[]) => written.flatMap((d) => (d ? [isoDay(d)] : [])).filter((d): d is string => d !== null);
const latestOf = (iso: string[]) => (iso.length > 0 ? Date.parse(`${iso.reduce((a, b) => (a > b ? a : b))}T12:00:00Z`) : null);

// ── Reg Herb Data ──

export interface RefHerbRow extends TaxonFacts {
  area: string;
  initial: string;
  surname: string;
  collNo: string;
  adNo: string;
  areaVoucher: string;
  taxonVoucher: string;
  comment: string;
  /** A Reference Herb row carries no date of its own, so the taxon's days (its Date, created, renamed and modified) stand for it. */
  days: string[];
  latestMs: number | null;
}

export function refHerbRowsFor(taxa: Taxon[]): RefHerbRow[] {
  return taxa.flatMap((t) => {
    const v = t.values;
    const taxonDays = days([v.date, v.createdOn, v.renamedOn, v.editedOn ?? v.modifiedOn]);
    return (t.tables.refHerb ?? []).map((r, i) => ({
      ...factsOf(t, `${t.id}:${i}`),
      area: r.area ?? "",
      initial: r.voucherInitial ?? "",
      surname: r.surname ?? "",
      collNo: r.collnNo ?? "",
      adNo: r.adNo ?? "",
      areaVoucher: r.areaVoucher ?? "",
      taxonVoucher: r.taxonVoucher ?? "",
      comment: r.comment ?? "",
      days: taxonDays,
      latestMs: latestOf(taxonDays),
    }));
  });
}

// ── Species Attributes ──

export interface AttributeRow extends TaxonFacts {
  isCurrent: string;
  isOfficial: string;
  regionGroup: string;
  regionName: string;
  attributeGroup: string;
  attributeName: string;
  source: string;
  dateOfAssessment: string;
  comments: string;
  criteria: string;
  trend: string;
  qualityText: string;
  num: string;
  unit: string;
  qualification: string;
  days: string[];
  latestMs: number | null;
}

export function attributeRowsFor(taxa: Taxon[]): AttributeRow[] {
  return taxa.flatMap((t) =>
    (t.tables.attributes ?? []).map((r, i) => {
      const v = (key: string) => r[key] ?? "";
      const assessed = days([r.dateOfAssessment]);
      return {
        ...factsOf(t, `${t.id}:${i}`),
        isCurrent: v("isCurrent"),
        isOfficial: v("isOfficial"),
        regionGroup: v("regionGroup"),
        regionName: v("regionName"),
        attributeGroup: v("attributeGroup"),
        attributeName: v("attributeName"),
        source: v("source"),
        dateOfAssessment: dayText(v("dateOfAssessment")),
        comments: v("comments"),
        criteria: v("criteria"),
        trend: v("trend"),
        qualityText: v("qualityText"),
        num: v("num"),
        unit: v("unit"),
        qualification: v("qualification"),
        days: assessed,
        latestMs: latestOf(assessed),
      };
    }),
  );
}

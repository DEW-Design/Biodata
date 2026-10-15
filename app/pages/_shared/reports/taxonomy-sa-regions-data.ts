// The Taxonomy Report's "Taxonomy list - SA Regions" (the designer, 15 Oct 2026, the sheet "BioData - Taxonomy list - SA Regions") and
// "Taxonomy list - Aus / World": one row for each area a taxon is recorded in, with that area's record. The two sheets have the same
// columns and differ in the table they read and in the parameters above their columns, so the row, its builder and the SA Regions
// parameters are here and the Aus / World parameters are in taxonomy-aus-world-data.ts.
//
// A row is a row of one of the taxon's distribution tables in Taxonomy Management: SA Regions (`tables.saRegions`) or Australian and Overseas
// Distribution (`tables.ausDistribution`) for Flora, whose columns are DISTRIBUTION_COLUMNS in tx-data.ts, so the report and the taxon's own
// tab cannot disagree. A Fauna taxon keeps its areas in Regional Data (SA regions) and Australian Distribution, each a region and a comment,
// so a Fauna row has those two and the rest are empty. A taxon with no area recorded has no row.

import { isoDay } from "@/app/pages/_shared/reports/taxonomy-report-data";
import type { Taxon } from "@/app/pages/_shared/taxonomy/tx-data";

export interface DistributionRow {
  id: string;
  taxonId: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  /** Every common name the taxon has, for the Common name parameter. */
  commonNames: string;
  /** The region (SA Regions) or the State / OS area (Aus / World). */
  region: string;
  description: string;
  includeCensus: string;
  bsAccept: string;
  nativeInReg: string;
  estabInReg: string;
  idCertain: string;
  dsnCertain: string;
  consStat: string;
  colln50: string;
  nameMatch: string;
  herbariumNo: string;
  voucherInitials: string;
  surname: string;
  collNo: string;
  isRefHbVoucher: string;
  isTaxonVoucher: string;
  comment: string;
  adherbName: string;
  regCreatedBy: string;
  regCreationDate: string;
  regEditBy: string;
  regEditDate: string;
  /** The region record's creation and edit days, as ISO days: what the Date parameter reads. */
  days: string[];
  /** The newest of those days, as a time in ms: the report's "Latest record". */
  latestMs: number | null;
}

/** Which table of a taxon holds the areas, and which of its fields names the area, for Flora and for Fauna. */
export interface DistributionSource {
  flora: { table: string; area: string };
  fauna: { table: string; area: string };
}

export const SA_REGIONS_SOURCE: DistributionSource = { flora: { table: "saRegions", area: "region" }, fauna: { table: "regionalData", area: "region" } };
export const AUS_WORLD_SOURCE: DistributionSource = { flora: { table: "ausDistribution", area: "stateOs" }, fauna: { table: "ausDistribution", area: "region" } };

export function distributionRowsFor(taxa: Taxon[], source: DistributionSource): DistributionRow[] {
  return taxa.flatMap((t) => {
    const from = t.kingdom === "Flora" ? source.flora : source.fauna;
    const records = t.tables[from.table] ?? [];
    return records.map((r, i): DistributionRow => {
      const days = [r.regCreationDate, r.regEditDate].flatMap((d) => (d ? [isoDay(d)] : [])).filter((d): d is string => d !== null);
      const newest = days.length > 0 ? days.reduce((a, b) => (a > b ? a : b)) : null;
      const v = (key: string) => r[key] ?? "";
      return {
        id: `${t.id}:${i}`,
        taxonId: t.id,
        nsx: t.nsx ?? "",
        nsxDescription: t.scientific,
        common: t.common,
        commonNames: (t.tables.commonName ?? []).map((n) => n.name).filter(Boolean).join("; "),
        region: v(from.area),
        description: v("description"),
        includeCensus: v("includeCensus"),
        bsAccept: v("bsAccept"),
        nativeInReg: v("nativeInReg"),
        estabInReg: v("estabInReg"),
        idCertain: v("idCertain"),
        dsnCertain: v("dsnCertain"),
        consStat: v("consStat"),
        colln50: v("colln50"),
        nameMatch: v("nameMatch"),
        herbariumNo: v("herbariumNo"),
        voucherInitials: v("voucherInitials"),
        surname: v("surname"),
        collNo: v("collNo"),
        isRefHbVoucher: v("isRefHbVoucher"),
        isTaxonVoucher: v("isTaxonVoucher"),
        comment: v("comment"),
        adherbName: v("adherbName"),
        regCreatedBy: v("regCreatedBy"),
        regCreationDate: v("regCreationDate"),
        regEditBy: v("regEditBy"),
        regEditDate: v("regEditDate"),
        days,
        latestMs: newest ? Date.parse(`${newest}T12:00:00Z`) : null,
      };
    });
  });
}

export const distinct = (values: string[]) => new Set(values.filter((v) => v !== "")).size;

"use client";

import { REPORT_WIDTH as W, idColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { SpeciesCell } from "@/app/pages/_shared/reports/report-table";
import type { DistributionRow } from "@/app/pages/_shared/reports/taxonomy-sa-regions-data";

// The columns of the Taxonomy Report's SA Regions and Aus / World tabs. The two sheets have the same 25 columns, in the same order, and differ
// only in the name of the area column ("Region", "State/OS Area") and in what the sheet calls the record's creator and editor at the
// end, so the tabs give those names and the rest is here once. The first column, NSX code, is pinned when the table scrolls sideways.

export interface DistributionLabels {
  /** The area column: "Region" or "State/OS area". */
  area: string;
  createdBy: string;
  creationDate: string;
  editedBy: string;
  editDate: string;
}

export function distributionColumns(labels: DistributionLabels): ViewColumn<DistributionRow>[] {
  return [
    idColumn("nsx", "NSX code", W.sm, (r) => r.nsx, { sticky: true }),
    {
      id: "nsxDescription",
      label: "NSX description",
      width: W.lg,
      sort: (r) => r.nsxDescription,
      cell: (r) => <SpeciesCell scientific={r.nsxDescription} />,
      text: (r) => r.nsxDescription,
    },
    textColumn("region", labels.area, W.lg, (r) => r.region, { strong: true }),
    textColumn("description", "Description", W.xl, (r) => r.description, { clamp: true }),
    textColumn("includeCensus", "Include census?", W.md, (r) => r.includeCensus),
    textColumn("bsAccept", "BS accept?", W.md, (r) => r.bsAccept),
    textColumn("nativeInReg", "Native in Reg?", W.md, (r) => r.nativeInReg),
    textColumn("estabInReg", "Established in Reg?", W.md, (r) => r.estabInReg),
    textColumn("idCertain", "ID certain?", W.sm, (r) => r.idCertain),
    textColumn("dsnCertain", "Dsn certain?", W.md, (r) => r.dsnCertain),
    textColumn("consStat", "Conservation status", W.md, (r) => r.consStat),
    textColumn("colln50", "Collection < 50 yrs", W.md, (r) => r.colln50),
    textColumn("nameMatch", "Name match", W.md, (r) => r.nameMatch),
    textColumn("herbariumNo", "Herbarium no", W.md, (r) => r.herbariumNo),
    textColumn("voucherInitials", "Herb voucher initials", W.md, (r) => r.voucherInitials),
    textColumn("surname", "Surname", W.md, (r) => r.surname),
    textColumn("collNo", "Collection no", W.md, (r) => r.collNo),
    textColumn("isRefHbVoucher", "Is ref Hb voucher?", W.md, (r) => r.isRefHbVoucher),
    textColumn("isTaxonVoucher", "Is taxon voucher?", W.md, (r) => r.isTaxonVoucher),
    textColumn("comment", "Comment", W.xl, (r) => r.comment, { clamp: true }),
    textColumn("adherbName", "Adherb name", W.lg, (r) => r.adherbName),
    textColumn("regCreatedBy", labels.createdBy, W.md, (r) => r.regCreatedBy),
    textColumn("regCreationDate", labels.creationDate, W.md, (r) => r.regCreationDate),
    textColumn("regEditBy", labels.editedBy, W.md, (r) => r.regEditBy),
    textColumn("regEditDate", labels.editDate, W.md, (r) => r.regEditDate),
  ];
}

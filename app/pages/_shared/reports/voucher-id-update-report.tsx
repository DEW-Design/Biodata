"use client";

import { useMemo, type ReactNode } from "react";
import { Tag01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { formatIsoDay } from "@/app/pages/_shared/reports/ingestion-report-data";
import { DataReport, IdCell, NumberCell, SpeciesCell, TextCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
import { differs, visibleTo, voucherRows, type MismatchField, type VoucherRow, type VoucherSide } from "@/app/pages/_shared/reports/voucher-id-update-report-data";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";

// The Voucher ID Update Report (Figma YMproGZfrFB5jUqPHPxMhk frame 1507:13649, columns list node 1507:14480): the
// voucher details a museum or herbarium holds beside what BioData holds for the same specimen, one row per
// voucher, and which field disagrees. All 21 of the wireframe's columns are here, in a table that scrolls sideways,
// drawn with the shared report ledger (report-table.tsx), with these departures from the wireframe, on purpose:
//   - "Batch date" is listed twice in the wireframe with no second meaning given: it is one column here;
//   - the filters are the attribute filter ("Add filter"), as on the Data Ingestion Report, and "Additional filter"
//     is not built. The wireframe's typed filters (voucher ID, NSX code, registration ID, scientific name) are the
//     search box;
//   - the two sides of a pair read "Museum / Herbarium - ..." and "BioData - ...", and where they disagree the
//     differing values are marked, beside the Mismatch column that names the field;
//   - an empty cell is left empty, and a row that agrees has an empty Mismatch cell, not "None" or "NA";
//   - the wireframe's sample rows are invented: these are the app's own specimens, projects and placeholder cast.
// Which vouchers a person sees (a registered user their projects', BioData Admin all) is `visibleTo`.

const W = {
  batchSystem: "w-[172px]",
  scientific: "w-[308px]",
  voucherId: "w-[288px]",
  code: "w-[272px]",
  rego: "w-[264px]",
  observer: "w-[308px]",
  mismatch: "w-[168px]",
  rank: "w-[148px]",
  project: "w-[248px]",
  batchId: "w-[132px]",
  batchDate: "w-[148px]",
  batchSource: "w-[148px]",
} as const;

/** A value where the two sides of a pair disagree: marked the way the ingestion report marks a failure count. */
function Value({ children, marked }: { children?: ReactNode; marked: boolean }) {
  if (!children) return null;
  return <span className={cx("text-sm", marked ? "font-medium text-error-primary" : "text-secondary")}>{children}</span>;
}

function ScientificValue({ name, marked }: { name: string; marked: boolean }) {
  if (!name) return null;
  if (!marked) return <SpeciesCell scientific={name} />;
  return <span className="text-sm text-error-primary italic">{name}</span>;
}

const side = (row: VoucherRow, which: "museum" | "biodata"): VoucherSide => row[which];

function pairColumns(which: "museum" | "biodata", prefix: string): ReportColumn<VoucherRow>[] {
  const sort = (pick: (s: VoucherSide) => string) => (r: VoucherRow) => pick(side(r, which));
  const marked = (r: VoucherRow, field: MismatchField) => differs(r, field);
  return [
    {
      id: `${which}Scientific`,
      label: `${prefix} - Scientific name`,
      width: W.scientific,
      sort: sort((s) => s.scientific),
      cell: (r) => <ScientificValue name={side(r, which).scientific} marked={marked(r, "Scientific name")} />,
    },
    {
      id: `${which}Voucher`,
      label: `${prefix} - Voucher ID`,
      width: W.voucherId,
      sort: sort((s) => s.voucherId),
      cell: (r) => <Value marked={marked(r, "Voucher ID")}>{side(r, which).voucherId}</Value>,
    },
    {
      id: `${which}Nsx`,
      label: `${prefix} - NSX code`,
      width: W.code,
      sort: sort((s) => s.nsx),
      cell: (r) => <Value marked={marked(r, "NSX code")}>{side(r, which).nsx}</Value>,
    },
    {
      id: `${which}Rego`,
      label: `${prefix} - Rego ID`,
      width: W.rego,
      sort: sort((s) => s.rego),
      cell: (r) => <Value marked={marked(r, "Registration ID")}>{side(r, which).rego}</Value>,
    },
    {
      id: `${which}Observer`,
      label: `${prefix} - Observer name`,
      width: W.observer,
      sort: sort((s) => s.observer),
      cell: (r) => <Value marked={marked(r, "Observer name")}>{side(r, which).observer}</Value>,
    },
  ];
}

const [museumScientific, museumVoucher, museumNsx, museumRego, museumObserver] = pairColumns("museum", "Museum / Herbarium");
const [biodataScientific, biodataVoucher, biodataNsx, biodataRego, biodataObserver] = pairColumns("biodata", "BioData");

const COLUMNS: ReportColumn<VoucherRow>[] = [
  { id: "batchSourceSystem", label: "Batch source system", width: W.batchSystem, sticky: true, sort: (r) => r.batchSourceSystem, cell: (r) => <IdCell>{r.batchSourceSystem}</IdCell> },
  museumScientific,
  museumVoucher,
  museumNsx,
  museumRego,
  museumObserver,
  biodataScientific,
  biodataVoucher,
  biodataNsx,
  biodataRego,
  biodataObserver,
  {
    id: "mismatch",
    label: "Mismatch",
    width: W.mismatch,
    sort: (r) => r.mismatch,
    cell: (r) =>
      r.mismatch ? (
        <Badge size="sm" color="warning">
          {r.mismatch}
        </Badge>
      ) : null,
  },
  { id: "class", label: "Class", width: W.rank, sort: (r) => r.class, cell: (r) => <TextCell>{r.class}</TextCell> },
  { id: "species", label: "Species", width: W.rank, sort: (r) => r.species, cell: (r) => <TextCell>{r.species}</TextCell> },
  { id: "genus", label: "Genus", width: W.rank, sort: (r) => r.genus, cell: (r) => <TextCell>{r.genus}</TextCell> },
  { id: "family", label: "Family", width: W.rank, sort: (r) => r.family, cell: (r) => <TextCell>{r.family}</TextCell> },
  { id: "order", label: "Order", width: W.rank, sort: (r) => r.order, cell: (r) => <TextCell>{r.order}</TextCell> },
  { id: "project", label: "Project", width: W.project, sort: (r) => r.projectTitle, cell: (r) => <TextCell strong>{r.projectTitle}</TextCell> },
  { id: "batchId", label: "Batch ID", width: W.batchId, sort: (r) => r.batchId, cell: (r) => <IdCell>{r.batchId}</IdCell> },
  { id: "batchDate", label: "Batch date", width: W.batchDate, sort: (r) => r.batchDate, cell: (r) => <NumberCell value={formatIsoDay(r.batchDate)} /> },
  { id: "batchSource", label: "Batch source", width: W.batchSource, sort: (r) => r.batchSource, cell: (r) => <TextCell>{r.batchSource}</TextCell> },
];

const NONE = "None";

export function VoucherIdUpdateReport() {
  const role = useUserRole();
  const rows = useMemo(() => visibleTo(voucherRows(), role), [role]);

  // The values a filter offers come from the rows the person can see, so no option leads to an empty table.
  const attributes: Attribute<VoucherRow>[] = useMemo(() => {
    const values = (pick: (r: VoucherRow) => string) => optionsFromValues(rows.map(pick));
    const projects = [...new Map(rows.map((r) => [r.projectId, r.projectTitle])).entries()];
    return [
      { id: "batchSourceSystem", kind: "options", label: "Batch source system", options: values((r) => r.batchSourceSystem), get: (r) => r.batchSourceSystem },
      // "None" is first and means the two sides agree.
      { id: "mismatch", kind: "options", label: "Mismatch", options: [{ id: NONE, label: NONE }, ...values((r) => r.mismatch)], get: (r) => r.mismatch || NONE },
      { id: "class", kind: "options", label: "Class", options: values((r) => r.class), get: (r) => r.class },
      { id: "family", kind: "options", label: "Family", options: values((r) => r.family), get: (r) => r.family },
      { id: "order", kind: "options", label: "Order", options: values((r) => r.order), get: (r) => r.order },
      { id: "project", kind: "options", label: "Project", searchable: true, options: projects.map(([id, label]) => ({ id, label })), get: (r) => r.projectId },
      { id: "batchSource", kind: "options", label: "Batch source", options: values((r) => r.batchSource), get: (r) => r.batchSource },
      { id: "batchDate", kind: "date", label: "Batch date", get: (r) => ({ start: Date.parse(r.batchDate), end: Date.parse(r.batchDate) }) },
    ];
  }, [rows]);

  return (
    <DataReport
      title="Voucher ID Update Report"
      subtitle="The voucher details each museum or herbarium holds beside what BioData holds for the same specimen, and the field that disagrees."
      latest={(r) => r.batchDate}
      icon={Tag01}
      rows={rows}
      rowId={(r) => r.id}
      columns={COLUMNS}
      attributes={attributes}
      searchText={(r) => [
        r.museum.scientific,
        r.biodata.scientific,
        r.museum.voucherId,
        r.biodata.voucherId,
        r.museum.nsx,
        r.biodata.nsx,
        r.museum.rego,
        r.biodata.rego,
        r.museum.observer,
        r.biodata.observer,
        r.genus,
        r.species,
        r.batchId,
      ]}
      searchLabel="Search the report"
      searchPlaceholder="Search by name, voucher, NSX code, rego or observer"
      tableLabel="Voucher details held by the museum or herbarium and by BioData"
      noun="vouchers"
      emptyDescription="Vouchers for the specimens on your projects appear here once a museum or herbarium batch has been compared with BioData."
    />
  );
}

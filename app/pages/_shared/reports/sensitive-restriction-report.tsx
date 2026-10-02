"use client";

import { useMemo } from "react";
import { Lock01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { useNominations } from "@/app/pages/_shared/nominations/nomination-store";
import { formatIsoDay } from "@/app/pages/_shared/reports/ingestion-report-data";
import { Clamped, DataReport, IdCell, NumberCell, SpeciesCell, TextCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
import { allRestrictions, msOf, visibleTo, type RestrictionRow } from "@/app/pages/_shared/reports/sensitive-restriction-report-data";
import { useUserRole } from "@/lib/use-user-role";

// The Project Sensitive and Restriction Report (Figma YMproGZfrFB5jUqPHPxMhk frame 1504:12441, columns list node
// 1510:14749): every restriction applied to a project, one row per restriction, all 32 of the wireframe's columns in
// a table that scrolls sideways. Drawn with the shared report ledger (report-table.tsx), with these departures from
// the wireframe, on purpose:
//   - the filters are the attribute filter ("Add filter"), as on the Data Ingestion Report. "Project timeline" is
//     left out (the project list carries no dates to filter on), and so is "Additional filter" (decided for the
//     first report). Project, Project status, Privacy restrictions, Sensitive type, Access level, Embargo type, DEW
//     reviewer, DEW approver and two dates are the attributes;
//   - the vocabulary is written in sentence case ("Project embargo", not "Project Embargo") and an empty cell is
//     left empty, not "NA" or a dash;
//   - the wireframe's sample rows are invented people and projects: these are the app's own projects, the
//     placeholder cast and the sensitive species nominations and restrictions the app already holds;
//   - "Justification or comments" is labelled "Justification / comments".
// Which restrictions a person sees (a registered user theirs, BioData Admin all) is `visibleTo`.

// Column widths (px), as static classes so Tailwind sees them: wide enough for the label and the longest value.
const W = {
  id: "w-[132px]",
  code: "w-[128px]",
  title: "w-[248px]",
  long: "w-[320px]",
  status: "w-[132px]",
  date: "w-[148px]",
  yesNo: "w-[160px]",
  privacy: "w-[196px]",
  embargoType: "w-[216px]",
  dateLong: "w-[180px]",
  years: "w-[172px]",
  sensitive: "w-[148px]",
  attribute: "w-[148px]",
  value: "w-[232px]",
  sub: "w-[200px]",
  person: "w-[172px]",
  personLong: "w-[212px]",
  dateOn: "w-[172px]",
  access: "w-[168px]",
  treatment: "w-[260px]",
} as const;

const dateCell = (iso: string) => <NumberCell value={formatIsoDay(iso)} />;

const COLUMNS: ReportColumn<RestrictionRow>[] = [
  { id: "id", label: "Record ID", width: W.id, sticky: true, sort: (r) => r.id, cell: (r) => <IdCell>{r.id}</IdCell> },
  { id: "projectCode", label: "Project ID", width: W.code, sort: (r) => r.projectCode, cell: (r) => <IdCell>{r.projectCode}</IdCell> },
  { id: "projectTitle", label: "Project title", width: W.title, sort: (r) => r.projectTitle, cell: (r) => <TextCell strong>{r.projectTitle}</TextCell> },
  { id: "projectDescription", label: "Project description", width: W.long, cell: (r) => <Clamped text={r.projectDescription} /> },
  {
    id: "projectStatus",
    label: "Status",
    width: W.status,
    sort: (r) => r.projectStatus,
    cell: (r) => (
      <Badge size="sm" color={r.projectStatusColor}>
        {r.projectStatus}
      </Badge>
    ),
  },
  { id: "startDate", label: "Start date", width: W.date, sort: (r) => r.startDate, cell: (r) => dateCell(r.startDate) },
  { id: "endDate", label: "End date", width: W.date, sort: (r) => r.endDate, cell: (r) => dateCell(r.endDate) },
  // Every row is a restriction on a project, so this is always Yes: a project with none has no row.
  { id: "projectRestriction", label: "Project restriction", width: W.yesNo, cell: () => <TextCell>Yes</TextCell> },
  { id: "privacy", label: "Privacy restrictions", width: W.privacy, sort: (r) => r.privacy, cell: (r) => <TextCell>{r.privacy}</TextCell> },
  { id: "embargoType", label: "Embargo type", width: W.embargoType, sort: (r) => r.embargoType, cell: (r) => <TextCell>{r.embargoType}</TextCell> },
  { id: "embargoDetails", label: "Embargo details", width: W.long, cell: (r) => <Clamped text={r.embargoDetails} /> },
  { id: "embargoFrom", label: "Embargo from date", width: W.dateLong, sort: (r) => r.embargoFrom, cell: (r) => dateCell(r.embargoFrom) },
  { id: "embargoTo", label: "Embargo to date", width: W.dateLong, sort: (r) => r.embargoTo, cell: (r) => dateCell(r.embargoTo) },
  { id: "embargoYears", label: "Embargo period (years)", width: W.years, sort: (r) => r.embargoYears, cell: (r) => <NumberCell value={r.embargoYears} /> },
  { id: "sensitiveType", label: "Sensitive type", width: W.sensitive, sort: (r) => r.sensitiveType, cell: (r) => <TextCell>{r.sensitiveType}</TextCell> },
  { id: "attribute", label: "Attribute", width: W.attribute, sort: (r) => r.attribute, cell: (r) => <TextCell>{r.attribute}</TextCell> },
  {
    id: "attributeValue",
    label: "Attribute value",
    width: W.value,
    sort: (r) => r.attributeValue,
    // A species is named by its scientific name, in italics; any other value is plain text.
    cell: (r) => (r.attribute === "Species" ? <SpeciesCell scientific={r.attributeValue} /> : <Clamped text={r.attributeValue} />),
  },
  { id: "subAttribute", label: "Sub attribute", width: W.sub, sort: (r) => r.subAttribute, cell: (r) => <TextCell>{r.subAttribute}</TextCell> },
  { id: "subAttributeValue", label: "Sub attribute value", width: W.value, sort: (r) => r.subAttributeValue, cell: (r) => <Clamped text={r.subAttributeValue} /> },
  { id: "justification", label: "Justification / comments", width: W.long, cell: (r) => <Clamped text={r.justification} /> },
  { id: "reviewer", label: "DEW reviewer", width: W.person, sort: (r) => r.reviewer, cell: (r) => <TextCell>{r.reviewer}</TextCell> },
  { id: "reviewedOn", label: "Reviewed on", width: W.dateOn, sort: (r) => r.reviewedOn, cell: (r) => dateCell(r.reviewedOn) },
  { id: "approver", label: "DEW approver", width: W.person, sort: (r) => r.approver, cell: (r) => <TextCell>{r.approver}</TextCell> },
  { id: "approvedOn", label: "Approved on", width: W.dateOn, sort: (r) => r.approvedOn, cell: (r) => dateCell(r.approvedOn) },
  { id: "accessLevel", label: "Access level", width: W.access, sort: (r) => r.accessLevel, cell: (r) => <TextCell>{r.accessLevel}</TextCell> },
  { id: "treatments", label: "Restriction treatments", width: W.treatment, sort: (r) => r.treatments, cell: (r) => <TextCell>{r.treatments}</TextCell> },
  { id: "nominatedBy", label: "Nomination submitted by", width: W.personLong, sort: (r) => r.nominatedBy, cell: (r) => <TextCell>{r.nominatedBy}</TextCell> },
  { id: "nominatedOn", label: "Nomination submitted on", width: W.personLong, sort: (r) => r.nominatedOn, cell: (r) => dateCell(r.nominatedOn) },
  { id: "createdBy", label: "Project created by", width: W.personLong, sort: (r) => r.createdBy, cell: (r) => <TextCell>{r.createdBy}</TextCell> },
  { id: "createdOn", label: "Project created on", width: W.personLong, sort: (r) => r.createdOn, cell: (r) => dateCell(r.createdOn) },
  { id: "updatedBy", label: "Last updated by", width: W.person, sort: (r) => r.updatedBy, cell: (r) => <TextCell>{r.updatedBy}</TextCell> },
  { id: "updatedOn", label: "Last updated on", width: W.dateOn, sort: (r) => r.updatedOn, cell: (r) => dateCell(r.updatedOn) },
];

export function SensitiveRestrictionReport() {
  const role = useUserRole();
  const nominations = useNominations();
  const rows = useMemo(() => visibleTo(allRestrictions(nominations), role), [nominations, role]);

  // The values a filter offers come from the rows the person can see, so no option leads to an empty table.
  const attributes: Attribute<RestrictionRow>[] = useMemo(() => {
    const people = (pick: (r: RestrictionRow) => string) => optionsFromValues(rows.map(pick));
    const projects = [...new Map(rows.map((r) => [r.projectId, `${r.projectTitle} (${r.projectCode})`])).entries()];
    const span = (iso: string) => {
      const ms = msOf(iso);
      return ms === null ? null : { start: ms, end: ms };
    };
    return [
      { id: "project", kind: "options", label: "Project", searchable: true, options: projects.map(([id, label]) => ({ id, label })), get: (r) => r.projectId },
      { id: "projectStatus", kind: "options", label: "Project status", options: people((r) => r.projectStatus), get: (r) => r.projectStatus },
      { id: "privacy", kind: "options", label: "Privacy restrictions", options: people((r) => r.privacy), get: (r) => r.privacy },
      { id: "sensitiveType", kind: "options", label: "Sensitive type", options: people((r) => r.sensitiveType), get: (r) => r.sensitiveType },
      { id: "accessLevel", kind: "options", label: "Access level", options: people((r) => r.accessLevel), get: (r) => r.accessLevel },
      { id: "embargoType", kind: "options", label: "Embargo type", options: people((r) => r.embargoType), get: (r) => r.embargoType },
      { id: "reviewer", kind: "options", label: "DEW reviewer", options: people((r) => r.reviewer), get: (r) => r.reviewer },
      { id: "approver", kind: "options", label: "DEW approver", options: people((r) => r.approver), get: (r) => r.approver },
      { id: "reviewedOn", kind: "date", label: "Reviewed on", get: (r) => span(r.reviewedOn) },
      { id: "nominatedOn", kind: "date", label: "Nomination submitted on", get: (r) => span(r.nominatedOn) },
    ];
  }, [rows]);

  return (
    <DataReport
      title="Project Sensitive and Restriction Report"
      subtitle="Every restriction applied to a project: embargoes, sensitive species and the treatment each one gets."
      latest={(r) => r.updatedOn}
      icon={Lock01}
      rows={rows}
      rowId={(r) => r.id}
      columns={COLUMNS}
      attributes={attributes}
      searchText={(r) => [r.id, r.projectTitle, r.projectCode, r.attributeValue, r.subAttribute, r.subAttributeValue, r.reviewer, r.approver, r.nominatedBy, r.createdBy, r.updatedBy]}
      searchLabel="Search the report"
      searchPlaceholder="Search by record, project, species or person"
      tableLabel="Restrictions applied to projects"
      noun="restrictions"
      emptyDescription="Embargoes, sensitive species and other restrictions on your projects appear here once they are applied."
    />
  );
}

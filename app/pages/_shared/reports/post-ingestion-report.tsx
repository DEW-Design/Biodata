"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Database01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { projects } from "@/app/pages/_shared/project-list-data";
import { datasetTemplates } from "@/app/pages/_shared/template-finder/template-data";
import { Clamped, DataReport, IdCell, NumberCell, TextCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
import { useIngestionRuns } from "@/app/pages/_shared/reports/use-ingestion-runs";
import {
  PROCESSING_STATUSES,
  SUBMISSION_STATUSES,
  VALIDATION_STATUSES,
  formatIsoDay,
  processingColor,
  processingRank,
  submissionColor,
  submissionRank,
} from "@/app/pages/_shared/reports/ingestion-report-data";
import { formatAdelaideDay, withProjectFacts, type PostIngestionRow } from "@/app/pages/_shared/reports/post-ingestion-report-data";

// The Project Dataset Post Ingestion report (Figma YMproGZfrFB5jUqPHPxMhk node 1503:7729): every dataset submission
// with the facts of the project it went into beside it, all 28 of the wireframe's columns (Columns list, node
// 1510:15114) in the shared report table, which scrolls sideways with the Record ID pinned. The rows are the Data
// Ingestion Report's own (`useIngestionRuns`), so the two reports agree on every submission. Departures from the
// wireframe, on purpose, the same ones the first report made:
//   - the always-open filters and "Apply Filter" are the attribute filter (CONTRACTS 4.2d): choose an attribute, then
//     its values. The wireframe's Project ID and Project title filters are one searchable Project attribute, and its
//     free-text filters are the search box. "Project timeline" is left out because the project list carries no dates to
//     filter on, and the wireframe's "Additional filter" is what choosing an attribute replaces;
//   - column names are sentence case and spelled out, and the wireframe's annotations are dropped;
//   - an empty cell is left empty (2.3): a project with no end date, or with no restriction data in the app;
//   - the people are the placeholder cast and the projects the app's own.
// Which submissions a person sees (a registered user theirs, BioData Admin all) is `visibleTo`.

const WIDTH = {
  id: "w-[128px]",
  projectCode: "w-[120px]",
  projectTitle: "w-[264px]",
  projectDescription: "w-[360px]",
  projectStatus: "w-[132px]",
  date: "w-[132px]",
  restriction: "w-[156px]",
  embargo: "w-[248px]",
  sensitive: "w-[172px]",
  file: "w-[256px]",
  template: "w-[264px]",
  type: "w-[132px]",
  rows: "w-[148px]",
  failures: "w-[180px]",
  submission: "w-[168px]",
  comments: "w-[320px]",
  method: "w-[120px]",
  by: "w-[156px]",
  processing: "w-[220px]",
  person: "w-[172px]",
} as const;

const FAILURE_CLASS = { some: "text-sm font-medium tabular-nums text-error-primary", none: "text-sm tabular-nums text-secondary" };

const columns: ReportColumn<PostIngestionRow>[] = [
  { id: "id", label: "Record ID", width: WIDTH.id, sticky: true, sort: (r) => r.id, cell: (r) => <IdCell>{r.id}</IdCell> },
  { id: "projectCode", label: "Project ID", width: WIDTH.projectCode, sort: (r) => r.projectCode, cell: (r) => <TextCell>{r.projectCode}</TextCell> },
  { id: "projectTitle", label: "Project title", width: WIDTH.projectTitle, sort: (r) => r.projectTitle, cell: (r) => <TextCell strong>{r.projectTitle}</TextCell> },
  { id: "projectDescription", label: "Project description", width: WIDTH.projectDescription, sort: (r) => r.projectDescription, cell: (r) => <Clamped text={r.projectDescription} max="max-w-[336px]" /> },
  {
    id: "projectStatus",
    label: "Status",
    width: WIDTH.projectStatus,
    sort: (r) => r.projectStatus,
    cell: (r) => (
      <Badge size="sm" color={r.projectStatusColor}>
        {r.projectStatus}
      </Badge>
    ),
  },
  { id: "projectStart", label: "Start date", width: WIDTH.date, sort: (r) => r.projectStart, cell: (r) => <NumberCell value={formatIsoDay(r.projectStart)} /> },
  { id: "projectEnd", label: "End date", width: WIDTH.date, sort: (r) => r.projectEnd, cell: (r) => <NumberCell value={formatIsoDay(r.projectEnd)} /> },
  { id: "restriction", label: "Project restriction", width: WIDTH.restriction, sort: (r) => r.restriction, cell: (r) => <TextCell>{r.restriction}</TextCell> },
  { id: "embargoType", label: "Embargo type", width: WIDTH.embargo, sort: (r) => r.embargoType, cell: (r) => <TextCell>{r.embargoType}</TextCell> },
  { id: "sensitiveType", label: "Sensitive type", width: WIDTH.sensitive, sort: (r) => r.sensitiveType, cell: (r) => <TextCell>{r.sensitiveType}</TextCell> },
  {
    id: "file",
    label: "Dataset file",
    width: WIDTH.file,
    sort: (r) => r.fileName,
    cell: (r) => (
      <TextCell>
        {r.fileName}
        {r.fileCount > 1 ? <span className="text-tertiary"> +{r.fileCount - 1} more</span> : null}
      </TextCell>
    ),
  },
  { id: "template", label: "Template", width: WIDTH.template, sort: (r) => r.template, cell: (r) => <TextCell>{r.template}</TextCell> },
  { id: "templateType", label: "Template type", width: WIDTH.type, sort: (r) => r.templateType, cell: (r) => <TextCell>{r.templateType}</TextCell> },
  { id: "rows", label: "Overall dataset", width: WIDTH.rows, sort: (r) => r.rows, cell: (r) => <NumberCell value={r.rows} /> },
  {
    id: "failures",
    label: "Business rule failures",
    width: WIDTH.failures,
    sort: (r) => r.ruleFailures,
    cell: (r) => (r.ruleFailures === null ? null : <span className={r.ruleFailures > 0 ? FAILURE_CLASS.some : FAILURE_CLASS.none}>{r.ruleFailures.toLocaleString("en-AU")}</span>),
  },
  {
    id: "submission",
    label: "Submission status",
    width: WIDTH.submission,
    sort: (r) => submissionRank(r.submission),
    cell: (r) => (
      <Badge size="sm" color={submissionColor[r.submission]}>
        {r.submission}
      </Badge>
    ),
  },
  { id: "submissionComments", label: "Submission comments", width: WIDTH.comments, cell: (r) => <Clamped text={r.submissionComments} /> },
  { id: "method", label: "Method", width: WIDTH.method, sort: (r) => r.method, cell: (r) => <TextCell>{r.method}</TextCell> },
  { id: "datasetType", label: "Dataset type", width: WIDTH.type, sort: (r) => r.datasetType, cell: (r) => <TextCell>{r.datasetType}</TextCell> },
  { id: "by", label: "Ingested by", width: WIDTH.by, sort: (r) => r.ingestedBy, cell: (r) => <TextCell>{r.ingestedBy}</TextCell> },
  { id: "at", label: "Ingested on", width: WIDTH.date, sort: (r) => r.at, cell: (r) => <NumberCell value={formatAdelaideDay(r.at)} /> },
  {
    id: "processing",
    label: "Dataset processing status",
    width: WIDTH.processing,
    sort: (r) => processingRank(r.processing),
    cell: (r) => (
      <Badge size="sm" color={processingColor[r.processing]}>
        {r.processing}
      </Badge>
    ),
  },
  { id: "reviewedBy", label: "Data reviewed by", width: WIDTH.person, sort: (r) => r.reviewedBy, cell: (r) => <TextCell>{r.reviewedBy}</TextCell> },
  { id: "reviewerComments", label: "Reviewer comments", width: WIDTH.comments, cell: (r) => <Clamped text={r.reviewerComments} /> },
  { id: "reviewedOn", label: "Data reviewed on", width: WIDTH.date, sort: (r) => r.reviewedOn, cell: (r) => <NumberCell value={formatIsoDay(r.reviewedOn)} /> },
  { id: "approvedBy", label: "Data approved by", width: WIDTH.person, sort: (r) => r.approvedBy, cell: (r) => <TextCell>{r.approvedBy}</TextCell> },
  { id: "approvedOn", label: "Data approved on", width: WIDTH.date, sort: (r) => r.approvedOn, cell: (r) => <NumberCell value={formatIsoDay(r.approvedOn)} /> },
  { id: "approverComments", label: "Approver comments", width: WIDTH.comments, cell: (r) => <Clamped text={r.approverComments} /> },
];

export function PostIngestionReport() {
  const { isAdmin, runs } = useIngestionRuns();
  const initialQuery = useSearchParams().get("q") ?? "";
  const rows = useMemo(() => runs.map(withProjectFacts), [runs]);

  // Validation status is a filter of the wireframe that is not one of its 28 columns, so it filters on the row's own
  // validation without adding a column the wireframe does not list.
  const attributes: Attribute<PostIngestionRow>[] = useMemo(
    () => [
      { id: "project", kind: "options", label: "Project", searchable: true, options: projects.map((p) => ({ id: p.id, label: `${p.name} (${p.code})` })), get: (r) => r.projectId },
      { id: "projectStatus", kind: "options", label: "Project status", options: optionsFromValues(projects.map((p) => p.status)), get: (r) => r.projectStatus },
      { id: "templateType", kind: "options", label: "Template type", options: optionsFromValues(datasetTemplates.map((t) => t.speciesType)), get: (r) => r.templateType },
      { id: "template", kind: "options", label: "Template", options: optionsFromValues(datasetTemplates.map((t) => t.title)), get: (r) => r.template },
      { id: "validation", kind: "options", label: "Validation status", options: VALIDATION_STATUSES.map((s) => ({ id: s, label: s })), get: (r) => r.validation },
      { id: "submission", kind: "options", label: "Submission status", options: SUBMISSION_STATUSES.map((s) => ({ id: s, label: s })), get: (r) => r.submission },
      { id: "processing", kind: "options", label: "Dataset processing status", options: PROCESSING_STATUSES.map((s) => ({ id: s, label: s })), get: (r) => r.processing },
      { id: "by", kind: "options", label: "Ingested by", searchable: true, options: optionsFromValues(rows.map((r) => r.ingestedBy)), get: (r) => r.ingestedBy },
      { id: "ingested", kind: "date", label: "Ingested", get: (r) => ({ start: r.at, end: r.at }) },
    ],
    [rows],
  );

  return (
    <DataReport<PostIngestionRow>
      title="Project Dataset Post Ingestion"
      subtitle="Every dataset submission with the project it went into, through to review and approval."
      scope={isAdmin ? "All uploads" : "Your uploads and your projects"}
      latest={(r) => r.at}
      icon={Database01}
      rows={rows}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.id, r.projectCode, r.projectTitle, r.fileName, r.template, r.ingestedBy]}
      searchLabel="Search the report"
      searchPlaceholder="Search by record, project, file, template or person"
      tableLabel="Dataset submissions with their project details"
      noun="submissions"
      emptyDescription="Datasets you upload, and uploads to your projects, appear here with their project details once they are submitted."
      initialSort={{ column: "at", direction: "descending" }}
      initialQuery={initialQuery}
    />
  );
}

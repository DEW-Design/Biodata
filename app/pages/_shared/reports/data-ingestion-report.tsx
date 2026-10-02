"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download01, UploadCloud02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { useRoleHref } from "@/lib/use-role-href";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { projects } from "@/app/pages/_shared/project-list-data";
import { datasetTemplates } from "@/app/pages/_shared/template-finder/template-data";
import { Clamped, DataReport, IdCell, NumberCell, TextCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
import { hasErrors } from "@/app/pages/_shared/reports/data-validation-error-report-data";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { useIngestionRuns } from "@/app/pages/_shared/reports/use-ingestion-runs";
import {
  PROCESSING_STATUSES,
  SUBMISSION_STATUSES,
  VALIDATION_STATUSES,
  errorFileCsv,
  formatDateTime,
  formatIsoDay,
  processingColor,
  processingRank,
  submissionColor,
  submissionRank,
  successFileCsv,
  validationColor,
  validationRank,
  type FileAvailability,
  type IngestionRow,
} from "@/app/pages/_shared/reports/ingestion-report-data";

// The Data Ingestion Report Pre-Flight Validation (Figma YMproGZfrFB5jUqPHPxMhk node 1495:6545): every dataset upload
// from its pre-flight validation through submission to review and approval, all 21 of the wireframe's columns in the
// shared report table (`DataReport`), which scrolls sideways with the Record ID pinned. It is the first report, rebuilt
// on the engine the other reports use so all nine look and behave the same (CONTRACTS 4.6 item 4): the gradient card
// with Scope, Latest record, Rows and Columns, then search, the attribute filter and the table. Departures from the
// wireframe, on purpose:
//   - the 12 always-open filters, their chips and "Apply Filter" are one "Add filter" button (CONTRACTS 4.2d): choose an
//     attribute, then its values. The four project filters are one searchable Project attribute and Project status;
//     "Project timeline" is left out because the project list carries no start or end dates to filter on. "Ingested" is
//     a date range. The wireframe's "Additional filter" is what choosing an attribute replaces (designer, 30 Sept 2026);
//   - "50 of 1797" with a progress bar is the numbered pagination every list has;
//   - column names are sentence case and spelled out ("Business rule failures", not "(PF)"; "successful");
//   - an empty cell is left empty and "None" says a download does not apply, instead of "NA" and dashes;
//   - the wireframe draws no actions, so the card's "..." menu is absent;
//   - the people are the placeholder cast and the projects the app's own.
// Which uploads a person sees (a registered user theirs, BioData Admin all) and the live clock are `useIngestionRuns`.

// Column widths (px), as static classes so Tailwind sees them. Every column is wide enough for its longest value on one
// line; the three comment columns are capped and truncate, with the full text on hover.
const WIDTH = {
  id: "w-[128px]",
  at: "w-[164px]",
  project: "w-[232px]",
  file: "w-[256px]",
  template: "w-[264px]",
  type: "w-[116px]",
  rows: "w-[132px]",
  failures: "w-[172px]",
  validation: "w-[148px]",
  errorFile: "w-[172px]",
  successFile: "w-[208px]",
  by: "w-[156px]",
  submission: "w-[168px]",
  submissionComments: "w-[320px]",
  processing: "w-[208px]",
  reviewedBy: "w-[164px]",
  reviewerComments: "w-[320px]",
  reviewedOn: "w-[148px]",
  approvedBy: "w-[156px]",
  approvedOn: "w-[148px]",
  approverComments: "w-[320px]",
} as const;

const FAILURE_CLASS = { some: "text-sm font-medium tabular-nums text-error-primary", none: "text-sm tabular-nums text-secondary" };

const VALIDATION_ERROR_REPORT = REPORTS.find((report) => report.id === "data-validation-error")!.path;

/** Where a run with errors is reported (the report opens on `?dataset=`). */
function useErrorsHref() {
  const roleHref = useRoleHref();
  return (row: IngestionRow) => roleHref(`${VALIDATION_ERROR_REPORT}?dataset=${encodeURIComponent(row.id)}`);
}

/** A run with errors opens its own Data Validation Error report. Where the run has none (still processing, or passed
 *  clean) the cell is just its value: that report lists only datasets with errors, so there is nothing to open. */
function ErrorsLink({ row, children }: { row: IngestionRow; children: ReactNode }) {
  const href = useErrorsHref();
  if (!hasErrors(row)) return <>{children}</>;
  return (
    <Link
      href={href(row)}
      aria-label={`View the validation errors for ${row.id}`}
      className="group inline-flex rounded-full outline-focus-ring transition duration-100 ease-linear hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </Link>
  );
}

/** The Record ID: a link to the run's errors where it has any (brand text with an underline on hover, the link treatment the
 *  field notes use), the plain ID otherwise. */
function RecordIdCell({ row }: { row: IngestionRow }) {
  const href = useErrorsHref();
  if (!hasErrors(row)) return <IdCell>{row.id}</IdCell>;
  return (
    <Link
      href={href(row)}
      aria-label={`View the validation errors for ${row.id}`}
      className="rounded-sm text-sm font-medium text-brand-secondary tabular-nums outline-focus-ring hover:text-brand-secondary_hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {row.id}
    </Link>
  );
}

/** Nothing while the run is still going, "None" where the file does not apply, otherwise a download of the real CSV. */
function DownloadCell({ availability, label, onDownload }: { availability: FileAvailability; label: string; onDownload: () => void }) {
  if (availability === "pending") return null;
  if (availability === "none") return <span className="text-sm text-tertiary">None</span>;
  return (
    <Button color="link-color" size="sm" iconLeading={Download01} onPress={onDownload} aria-label={label}>
      Download
    </Button>
  );
}

const columns: ReportColumn<IngestionRow>[] = [
  { id: "id", label: "Record ID", width: WIDTH.id, sticky: true, sort: (r) => r.id, cell: (r) => <RecordIdCell row={r} /> },
  { id: "at", label: "Date and time", width: WIDTH.at, sort: (r) => r.at, cell: (r) => <NumberCell value={formatDateTime(r.at)} /> },
  { id: "project", label: "Project title", width: WIDTH.project, sort: (r) => r.projectTitle, cell: (r) => <TextCell strong>{r.projectTitle}</TextCell> },
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
  { id: "type", label: "Template type", width: WIDTH.type, sort: (r) => r.templateType, cell: (r) => <TextCell>{r.templateType}</TextCell> },
  { id: "rows", label: "Overall dataset", width: WIDTH.rows, sort: (r) => r.rows, cell: (r) => <NumberCell value={r.rows} /> },
  {
    id: "failures",
    label: "Business rule failures",
    width: WIDTH.failures,
    sort: (r) => r.ruleFailures,
    cell: (r) =>
      r.ruleFailures === null ? null : (
        <ErrorsLink row={r}>
          <span className={cx(r.ruleFailures > 0 ? FAILURE_CLASS.some : FAILURE_CLASS.none, "group-hover:underline")}>{r.ruleFailures.toLocaleString("en-AU")}</span>
        </ErrorsLink>
      ),
  },
  {
    id: "validation",
    label: "Validation status",
    width: WIDTH.validation,
    sort: (r) => validationRank(r.validation),
    cell: (r) => (
      <ErrorsLink row={r}>
        <Badge size="sm" color={validationColor[r.validation]}>
          {r.validation}
        </Badge>
      </ErrorsLink>
    ),
  },
  {
    id: "errorFile",
    label: "Download error file",
    width: WIDTH.errorFile,
    cell: (r) => (
      <DownloadCell
        availability={r.errorFile}
        label={`Download the error file for ${r.id}`}
        onDownload={() => {
          const { header, rows: lines } = errorFileCsv(r);
          downloadCsv(`${r.id}-errors.csv`, header, lines);
        }}
      />
    ),
  },
  {
    id: "successFile",
    label: "Download successful file",
    width: WIDTH.successFile,
    cell: (r) => (
      <DownloadCell
        availability={r.successFile}
        label={`Download the successful file for ${r.id}`}
        onDownload={() => {
          const { header, rows: lines } = successFileCsv(r);
          downloadCsv(`${r.id}-added.csv`, header, lines);
        }}
      />
    ),
  },
  { id: "by", label: "Ingested by", width: WIDTH.by, sort: (r) => r.ingestedBy, cell: (r) => <TextCell>{r.ingestedBy}</TextCell> },
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
  { id: "submissionComments", label: "Submission comments", width: WIDTH.submissionComments, cell: (r) => <Clamped text={r.submissionComments} /> },
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
  { id: "reviewedBy", label: "Data reviewed by", width: WIDTH.reviewedBy, sort: (r) => r.reviewedBy, cell: (r) => <TextCell>{r.reviewedBy}</TextCell> },
  { id: "reviewerComments", label: "Reviewer comments", width: WIDTH.reviewerComments, cell: (r) => <Clamped text={r.reviewerComments} /> },
  { id: "reviewedOn", label: "Data reviewed on", width: WIDTH.reviewedOn, sort: (r) => r.reviewedOn, cell: (r) => <NumberCell value={formatIsoDay(r.reviewedOn)} /> },
  { id: "approvedBy", label: "Data approved by", width: WIDTH.approvedBy, sort: (r) => r.approvedBy, cell: (r) => <TextCell>{r.approvedBy}</TextCell> },
  { id: "approvedOn", label: "Data approved on", width: WIDTH.approvedOn, sort: (r) => r.approvedOn, cell: (r) => <NumberCell value={formatIsoDay(r.approvedOn)} /> },
  { id: "approverComments", label: "Approver comments", width: WIDTH.approverComments, cell: (r) => <Clamped text={r.approverComments} /> },
];

export function DataIngestionReport() {
  const { runs } = useIngestionRuns();
  const initialQuery = useSearchParams().get("q") ?? "";

  const attributes: Attribute<IngestionRow>[] = useMemo(
    () => [
      { id: "validation", kind: "options", label: "Validation status", options: VALIDATION_STATUSES.map((s) => ({ id: s, label: s })), get: (r) => r.validation },
      { id: "submission", kind: "options", label: "Submission status", options: SUBMISSION_STATUSES.map((s) => ({ id: s, label: s })), get: (r) => r.submission },
      { id: "processing", kind: "options", label: "Dataset processing status", options: PROCESSING_STATUSES.map((s) => ({ id: s, label: s })), get: (r) => r.processing },
      { id: "templateType", kind: "options", label: "Template type", options: optionsFromValues(datasetTemplates.map((t) => t.speciesType)), get: (r) => r.templateType },
      { id: "template", kind: "options", label: "Template", options: optionsFromValues(datasetTemplates.map((t) => t.title)), get: (r) => r.template },
      { id: "project", kind: "options", label: "Project", searchable: true, options: projects.map((p) => ({ id: p.id, label: `${p.name} (${p.code})` })), get: (r) => r.projectId },
      { id: "projectStatus", kind: "options", label: "Project status", options: optionsFromValues(projects.map((p) => p.status)), get: (r) => r.projectStatus },
      { id: "by", kind: "options", label: "Ingested by", searchable: true, options: optionsFromValues(runs.map((r) => r.ingestedBy)), get: (r) => r.ingestedBy },
      { id: "ingested", kind: "date", label: "Ingested", get: (r) => ({ start: r.at, end: r.at }) },
    ],
    [runs],
  );

  return (
    <DataReport<IngestionRow>
      title="Data Ingestion Report Pre-Flight Validation"
      subtitle="Every dataset upload, from pre-flight validation through to review and approval."
      latest={(r) => r.at}
      icon={UploadCloud02}
      rows={runs}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.id, r.projectTitle, r.projectCode, r.fileName, r.template, r.ingestedBy]}
      searchLabel="Search the report"
      searchPlaceholder="Search by record, project, file, template or person"
      tableLabel="Dataset uploads, from validation to approval"
      noun="uploads"
      emptyDescription="Datasets you upload, and uploads to your projects, appear here from pre-flight validation onwards."
      initialSort={{ column: "at", direction: "descending" }}
      initialQuery={initialQuery}
    />
  );
}

// The Data Ingestion Report Pre-Flight Validation: one row per dataset upload, from the file's pre-flight
// validation through submission to review and approval (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk node
// 1495:6545, with 21 columns).
//
// A row is never stored. It is DERIVED from a dataset's workflow status (dataset-data.ts) and its
// simulated ingestion (ingestion.ts), so the report and the project page's ingestion chip can never
// disagree, and a run moves on its own clock (Uploaded, Validating, Processing, Under review) without the
// project page being open. The wireframe's three status columns (Validation, Submission, Dataset processing)
// are three readings of that one status, not three fields (designer, Sept 30 2026).
//
// Real uploads make rows. So the report is not empty before anyone has uploaded, it also carries
// SAMPLE_RUNS: sample history in the same shape, built from the placeholder cast and the app's own projects
// and templates. It is illustrative, deterministic, and marked as sample in the code; real validation and
// real review are not built (see context/decisions/2026-09-28-38).

import { REVIEWING_ADMIN_NAME, CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { datasetStatusFor, type Dataset, type DatasetStatus } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { reasonsFor, rowsFromSize, viewAt, unmappedRowsFor, type IngestionSubject, type Outcome, type Reason } from "@/app/pages/_shared/dataset-upload/ingestion";
import { projects } from "@/app/pages/_shared/project-list-data";
import { datasetTemplates } from "@/app/pages/_shared/template-finder/template-data";
import type { BadgeColor } from "@/components/base/badges/badges";
import type { UserRole } from "@/lib/user-role";

// ── The three readings of one workflow status ──
export type ValidationStatus = "Processing" | "Successful" | "Failed";
export type SubmissionStatus = "Pending" | "Submitted" | "Submission failed";
export type ProcessingStatus = "Queued" | "Processing" | "Pending review/approval" | "Auto-approved" | "Approved" | "Rejected";

export const VALIDATION_STATUSES: ValidationStatus[] = ["Processing", "Successful", "Failed"];
export const SUBMISSION_STATUSES: SubmissionStatus[] = ["Pending", "Submitted", "Submission failed"];
export const PROCESSING_STATUSES: ProcessingStatus[] = ["Queued", "Processing", "Pending review/approval", "Auto-approved", "Approved", "Rejected"];

export const validationColor: Record<ValidationStatus, BadgeColor<"pill-color">> = { Processing: "warning", Successful: "success", Failed: "error" };
export const submissionColor: Record<SubmissionStatus, BadgeColor<"pill-color">> = { Pending: "gray", Submitted: "success", "Submission failed": "error" };
export const processingColor: Record<ProcessingStatus, BadgeColor<"pill-color">> = {
  Queued: "gray",
  Processing: "warning",
  "Pending review/approval": "warning",
  "Auto-approved": "success",
  Approved: "success",
  Rejected: "error",
};

/** Where a status sits in its workflow, for sorting a status column by progress rather than by name. */
export const validationRank = (s: ValidationStatus) => VALIDATION_STATUSES.indexOf(s);
export const submissionRank = (s: SubmissionStatus) => SUBMISSION_STATUSES.indexOf(s);
export const processingRank = (s: ProcessingStatus) => PROCESSING_STATUSES.indexOf(s);

export function validationFor(status: DatasetStatus): ValidationStatus {
  if (status === "validation_failed") return "Failed";
  if (status === "file_uploaded" || status === "validation_requested" || status === "validation_in_progress") return "Processing";
  return "Successful";
}

export function submissionFor(status: DatasetStatus): SubmissionStatus {
  const validation = validationFor(status);
  if (validation === "Failed") return "Submission failed";
  // Confirming the upload is the person's submission; once validation has passed the dataset is submitted.
  if (validation === "Processing" || status === "validation_passed" || status === "draft_saved") return "Pending";
  return "Submitted";
}

export function processingFor(status: DatasetStatus): ProcessingStatus {
  switch (status) {
    case "validation_failed":
    case "rejected":
      return "Rejected";
    case "processing":
      return "Processing";
    case "under_review":
      return "Pending review/approval";
    case "auto_approved":
      return "Auto-approved";
    case "approved":
      return "Approved";
    default:
      return "Queued";
  }
}

// ── A row ──
/** Whether a download exists: `ready`, not there because it does not apply (`none`), or not there yet (`pending`). */
export type FileAvailability = "ready" | "none" | "pending";

export interface IngestionRow {
  id: string;
  /** Milliseconds since the epoch: when the upload was made. */
  at: number;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  projectStatus: string;
  fileName: string;
  fileCount: number;
  template: string;
  templateType: string;
  /** Rows in the dataset. */
  rows: number;
  /** Rows that failed the business rules; null when the check never got that far. */
  ruleFailures: number | null;
  validation: ValidationStatus;
  errorFile: FileAvailability;
  successFile: FileAvailability;
  ingestedBy: string;
  submission: SubmissionStatus;
  submissionComments: string;
  processing: ProcessingStatus;
  reviewedBy: string;
  reviewerComments: string;
  reviewedOn: string;
  approvedBy: string;
  approvedOn: string;
  approverComments: string;
  /** Still moving on the ingestion clock, so the report should keep re-reading it. */
  live: boolean;
  /** For the downloads. */
  outcome: Outcome;
  subject: IngestionSubject;
  reasons: Reason[];
}

/** The review and approval a sample run carries (real uploads have none yet: nobody reviews them). */
interface Review {
  reviewedBy: string;
  reviewerComments: string;
  reviewedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  approverComments?: string;
}

// The template a file is checked against. Real validation would read it out of the file; the simulation
// picks it from words in the file name and otherwise from the file's position, from the app's own template list.
const KEYWORD_TEMPLATES: [string, string][] = [
  ["bushland", "bushland-assessment-method"],
  ["ramble", "ramble"],
  ["return", "species-data-return"],
  ["waterbug", "waterbug-bioblitz"],
  ["quadrat", "rangeland-assessment-method"],
];

function templateFor(fileName: string, seed: number) {
  const name = fileName.toLowerCase();
  const id = KEYWORD_TEMPLATES.find(([word]) => name.includes(word))?.[1];
  return datasetTemplates.find((t) => t.id === id) ?? datasetTemplates[seed % datasetTemplates.length];
}

/** What the run says about itself, in a sentence. */
function submissionComment(status: DatasetStatus, outcome: Outcome, reasons: Reason[], live: boolean): string {
  if (status === "file_uploaded" || status === "validation_requested" || status === "validation_in_progress") return "Upload in progress, awaiting validation.";
  if (reasons.length > 0) return reasons.map((r, i) => (i === 0 ? r.title : r.title.charAt(0).toLowerCase() + r.title.slice(1))).join("; ") + ".";
  if (live) return "Validation passed. Adding the records.";
  return outcome === "success" ? "All records passed validation." : "All records validated successfully.";
}

/** The columns that follow from where a run is, however the run was made. */
function describe(input: {
  id: string;
  at: number;
  projectId: string;
  files: { name: string }[];
  rows: number;
  uploadedBy: string;
  status: DatasetStatus;
  outcome: Outcome;
  done: boolean;
  live: boolean;
  seed: number;
  review: Review | null;
}): IngestionRow {
  const project = projects.find((p) => p.id === input.projectId) ?? projects[0];
  const fileName = input.files[0]?.name ?? input.id;
  const subject: IngestionSubject = { fileName, rows: input.rows, projectCode: project.code };
  const template = templateFor(fileName, input.seed);
  const reasons = input.done && input.outcome !== "success" ? reasonsFor(input.outcome as Exclude<Outcome, "success">, subject) : [];
  const validation = validationFor(input.status);

  // Rows that failed the business rules: those that could not be placed, or every row of a run whose rows
  // did not fit the project. A run that never got as far as checking rows (wrong columns, our fault) has none to count.
  let ruleFailures: number | null = 0;
  if (input.done && input.outcome === "partial") ruleFailures = unmappedRowsFor(input.rows);
  else if (input.done && input.outcome === "fail-map") ruleFailures = input.rows;
  else if (input.done && (input.outcome === "fail-model" || input.outcome === "fail-save")) ruleFailures = null;

  const errorFile: FileAvailability = !input.done ? "pending" : input.outcome === "success" || input.outcome === "fail-save" ? "none" : "ready";
  const successFile: FileAvailability = !input.done ? "pending" : input.outcome === "success" || input.outcome === "partial" ? "ready" : "none";

  const review = input.review;
  return {
    id: input.id,
    at: input.at,
    projectId: project.id,
    projectCode: project.code,
    projectTitle: project.name,
    projectStatus: project.status,
    fileName,
    fileCount: input.files.length,
    template: template.title,
    templateType: template.speciesType,
    rows: input.rows,
    ruleFailures,
    validation,
    errorFile,
    successFile,
    ingestedBy: input.uploadedBy,
    submission: submissionFor(input.status),
    submissionComments: submissionComment(input.status, input.outcome, reasons, input.live),
    processing: processingFor(input.status),
    reviewedBy: review?.reviewedBy ?? "",
    reviewerComments: review?.reviewerComments ?? "",
    reviewedOn: review?.reviewedOn ?? "",
    approvedBy: review?.approvedBy ?? "",
    approvedOn: review?.approvedOn ?? "",
    approverComments: review?.approverComments ?? "",
    live: input.live,
    outcome: input.outcome,
    subject,
    reasons,
  };
}

/** A real upload as a row, as it stands `now`. Its status is read off the simulated ingestion's clock, not from
 *  the stored status, which only moves while the project page is open. */
export function rowFromDataset(d: Dataset, now: number): IngestionRow {
  const rows = rowsFromSize(d.files.reduce((n, f) => n + f.size, 0));
  const outcome: Outcome = d.ingestion?.outcome ?? "success";
  const startedAt = d.ingestion?.startedAt ?? Date.parse(d.uploadedAt);
  const subject: IngestionSubject = { fileName: d.files[0]?.name ?? d.id, rows, projectCode: d.projectCode };
  const view = d.ingestion ? viewAt(outcome, Math.max(0, now - startedAt), subject) : null;
  const status: DatasetStatus = view ? datasetStatusFor(view) : d.status;
  const done = view ? view.done : true;
  return describe({
    id: d.id,
    at: startedAt,
    projectId: d.projectId,
    files: d.files,
    rows,
    uploadedBy: d.uploadedBy,
    status,
    outcome,
    done,
    live: !done,
    seed: Number(d.id.replace(/\D/g, "")) || 0,
    review: null,
  });
}

// ── Sample history ──
// A small deterministic generator (no Math.random) counting back from a FIXED day, so the sample reads the same on
// every load and identically on the server and in the browser (a clock here would make the two disagree and
// break hydration). The days do not move on: in time the sample history is simply older than real uploads.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const UPLOADERS = ["Olivia Wyatt", "Phoenix Baker", "Lana Steiner", "Maya Dewitt"];
const TOPICS = ["flora_census", "bird_transects", "site_visits", "species_return", "quadrat_counts", "bushland_assessment", "ramble_records", "waterbug_bioblitz"];

const REVIEW_COMMENTS = [
  "Data looks consistent with prior submissions.",
  "Site coordinates checked against the project extent.",
  "Species list matches the targeted species for this project.",
  "Visit dates are in order. No concerns.",
  "Minor formatting differences; nothing that affects the records.",
];
const APPROVAL_COMMENTS = [
  "Confirmed. Dataset meets all quality thresholds.",
  "Approved for release under the project's restrictions.",
  "Approved. The embargo on sensitive species still applies.",
  "Approved after review.",
];
const REJECTION_COMMENTS = [
  "Too many rows could not be placed. Correct the species codes and upload the corrected rows as a new file.",
  "The unplaced rows point to species missing from the taxonomy. Please check and resubmit.",
  "Rows could not be placed against this project's sites. Correct the file and upload it again.",
];

interface Scenario {
  status: DatasetStatus;
  outcome: Outcome;
  /** How many of the 60 sample runs follow this shape. */
  count: number;
}

// The mix: most runs end approved; a few are waiting, rejected or failed at validation.
const SCENARIOS: Scenario[] = [
  { status: "approved", outcome: "success", count: 22 },
  { status: "approved", outcome: "partial", count: 5 },
  { status: "auto_approved", outcome: "success", count: 10 },
  { status: "under_review", outcome: "success", count: 7 },
  { status: "under_review", outcome: "partial", count: 3 },
  { status: "rejected", outcome: "partial", count: 3 },
  { status: "validation_failed", outcome: "fail-model", count: 3 },
  { status: "validation_failed", outcome: "fail-map", count: 3 },
  { status: "processing", outcome: "fail-save", count: 2 },
  { status: "processing", outcome: "success", count: 2 },
];

const dayMs = 24 * 60 * 60 * 1000;
/** The day the sample history counts back from: 29 Sept 2026, 4:00 pm in Adelaide. */
const SAMPLE_ANCHOR = Date.UTC(2026, 8, 29, 6, 30);
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function buildSampleRuns(now: number): IngestionRow[] {
  const rand = lcg(20260930);
  const shapes = SCENARIOS.flatMap((s) => Array.from({ length: s.count }, () => s));
  // A stable shuffle, so outcomes are spread through the timeline instead of clumped.
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }
  return shapes.map((shape, i) => {
    const project = projects[Math.floor(rand() * projects.length)];
    // The project's contributor does most of its uploads; the others are colleagues. The signed-in placeholder
    // (Olivia Wyatt) only ever uploads to her own projects, so a registered user's view of the report is a
    // believable slice of it, not most of it.
    const colleagues = UPLOADERS.filter((name) => name !== project.contributorName && name !== CURRENT_USER_NAME);
    const uploadedBy = rand() < 0.65 ? project.contributorName : colleagues[Math.floor(rand() * colleagues.length)];
    // Newest first, two to three days apart on average, from the day before the module loaded.
    const daysBack = 1 + Math.floor(i * 2.4 + rand() * 2);
    const at = now - daysBack * dayMs - Math.floor(rand() * 9 * 60 * 60 * 1000);
    const rows = 40 + Math.floor(rand() * 1800);
    const topic = TOPICS[Math.floor(rand() * TOPICS.length)];
    const fileName = `${project.id.replace(/-/g, "_")}_${topic}_${String(1 + Math.floor(rand() * 9)).padStart(2, "0")}.xlsx`;
    const reviewedOn = isoDay(at + 2 * dayMs);
    const approvedOn = isoDay(at + 3 * dayMs);
    const pick = (list: string[]) => list[Math.floor(rand() * list.length)];

    let review: Review | null = null;
    if (shape.status === "approved") {
      review = { reviewedBy: REVIEWING_ADMIN_NAME, reviewerComments: pick(REVIEW_COMMENTS), reviewedOn, approvedBy: REVIEWING_ADMIN_NAME, approvedOn, approverComments: pick(APPROVAL_COMMENTS) };
    } else if (shape.status === "auto_approved") {
      review = { reviewedBy: "System", reviewerComments: "Auto-approved: zero business rule failures.", reviewedOn: isoDay(at + dayMs), approvedBy: "System", approvedOn: isoDay(at + dayMs), approverComments: "Approved automatically." };
    } else if (shape.status === "under_review" && i % 2 === 0) {
      review = { reviewedBy: REVIEWING_ADMIN_NAME, reviewerComments: pick(REVIEW_COMMENTS), reviewedOn };
    } else if (shape.status === "rejected") {
      review = { reviewedBy: REVIEWING_ADMIN_NAME, reviewerComments: pick(REJECTION_COMMENTS), reviewedOn };
    }

    return describe({
      id: `DS-2026-${String(1001 + i).padStart(5, "0")}`,
      at,
      projectId: project.id,
      files: [{ name: fileName }],
      rows,
      uploadedBy,
      status: shape.status,
      outcome: shape.outcome,
      // A run that is still being processed has no files to download yet.
      done: !(shape.status === "processing" && shape.outcome === "success"),
      live: false,
      seed: i,
      review,
    });
  });
}

let sample: IngestionRow[] | null = null;
/** The sample history, built once per page load. */
export function sampleRuns(): IngestionRow[] {
  sample ??= buildSampleRuns(SAMPLE_ANCHOR);
  return sample;
}

// ── Who sees what ──
/** BioData Admin sees every run; everyone else sees the runs on projects they contribute to and the ones they made
 *  (designer, Sept 28 2026: "seen per person for the projects they can access, and BioData Admin sees all"). */
export function visibleTo(rows: IngestionRow[], role: UserRole): IngestionRow[] {
  if (role === "biodata-admin") return rows;
  return rows.filter((r) => r.ingestedBy === CURRENT_USER_NAME || projects.find((p) => p.id === r.projectId)?.contributorName === CURRENT_USER_NAME);
}

// ── Downloads ──
/** The error file: what went wrong and what to do. The files are never read, so this is what the checks know. */
export function errorFileCsv(row: IngestionRow): { header: string[]; rows: string[][] } {
  return {
    header: ["Where", "Problem", "What to do"],
    rows: row.reasons.map((r) => [r.where || "The whole upload", r.title, r.fix]),
  };
}

/** The successful file: the rows that were added. */
export function successFileCsv(row: IngestionRow): { header: string[]; rows: string[][] } {
  const added = row.rows - (row.ruleFailures ?? 0);
  return {
    header: ["Row", "Result"],
    rows: Array.from({ length: Math.max(0, added) }, (_, i) => [String(i + 1), "Added"]),
  };
}

// ── Display ──
const dateTime = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Adelaide" });
export const formatDateTime = (ms: number) => dateTime.format(ms).replace(",", "");
const dateOnly = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const formatIsoDay = (iso: string) => (iso ? dateOnly.format(Date.parse(iso)) : "");

import { rowsFromSize, type DataKind, type IngestionSubject, type Outcome, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import type { SheetColumns } from "@/app/pages/_shared/dataset-upload/custom-concepts";
import type { BadgeColor } from "@/components/base/badges/badges";
import { datasetTemplates, type DatasetTemplate } from "@/app/pages/_shared/template-finder/template-data";

// Dataset upload: the data model and the fixed vocabularies. A dataset is one upload to a project:
// its files, the acknowledgement the uploader gave, and where it is in the dataset workflow.

// ── Workflow status ──
// From the business sheet "DataSet - users Workflow Status" (designer, Sept 28 2026). The order is
// the sheet's sequence: File Uploaded, Pre-flight Validation Requested, Pre-flight Validation in
// Progress, Validation Passed or Failed, Save draft or Submit, Processing (post-flight), Under Review
// or Auto-Approved, Approved. The sheet's step 8 ("All Records Approved = complete") is struck
// through and is not modelled. **Only `file_uploaded` is written today**: uploading stages the file
// for validation. Validation and everything after it is the next piece of work (see context/decisions/2026-09-28-38-upload-dataset-built-from-the-wireframes.md).
export type DatasetStatus =
  | "file_uploaded"
  | "validation_requested"
  | "validation_in_progress"
  | "validation_passed"
  | "validation_failed"
  | "draft_saved"
  | "submitted"
  | "processing"
  | "under_review"
  | "auto_approved"
  | "approved"
  | "rejected";

export const datasetStatusOrder: DatasetStatus[] = [
  "file_uploaded",
  "validation_requested",
  "validation_in_progress",
  "validation_passed",
  "validation_failed",
  "draft_saved",
  "submitted",
  "processing",
  "under_review",
  "auto_approved",
  "approved",
  "rejected",
];

export const datasetStatusMeta: Record<DatasetStatus, { label: string; stage: string; badgeColor: BadgeColor<"pill-color"> }> = {
  file_uploaded: { label: "File uploaded", stage: "Upload file", badgeColor: "gray" },
  validation_requested: { label: "Pre-flight validation requested", stage: "Validate", badgeColor: "brand" },
  validation_in_progress: { label: "Pre-flight validation in progress", stage: "Validation in progress", badgeColor: "warning" },
  validation_passed: { label: "Validation passed", stage: "Validation result", badgeColor: "success" },
  validation_failed: { label: "Validation failed", stage: "Validation result", badgeColor: "error" },
  draft_saved: { label: "Draft saved", stage: "Save", badgeColor: "gray" },
  submitted: { label: "Submitted", stage: "Save", badgeColor: "brand" },
  processing: { label: "Processing (post-flight)", stage: "Data processing", badgeColor: "warning" },
  under_review: { label: "Under review", stage: "Record review", badgeColor: "warning" },
  auto_approved: { label: "Auto-approved", stage: "Record review", badgeColor: "success" },
  approved: { label: "Approved", stage: "Dataset approval", badgeColor: "success" },
  // A reviewer turned the dataset down (Data Ingestion Report, Dataset processing status "Rejected").
  // Not in the business sheet's list; added with the report (designer, Sept 30 2026).
  rejected: { label: "Rejected", stage: "Record review", badgeColor: "error" },
};

/** The statuses that are going on right now, not waiting for a person: a badge that names one shows the loader (Badge `isLoading`). A finished or waiting status does not. */
export const isProcessingStatus = (status: DatasetStatus) => status === "validation_requested" || status === "validation_in_progress" || status === "processing";

// ── The acknowledgement ──
export type DataLicence = "cc0" | "ccby";
export type SecurityClassification = "official" | "official_sensitive";
export type FirstNationsConsideration = "none" | "authorised" | "restricted";

// Wording is the wireframe's (Figma YMproGZfrFB5jUqPHPxMhk node 67:33213), with the dash in
// "Restricted - subject to IIA conditions" written as a hyphen (CONTRACTS 2.3).
export const dataLicenceOptions: { id: DataLicence; label: string }[] = [
  { id: "cc0", label: "CC-0 (Public Domain)" },
  { id: "ccby", label: "CC-BY (Attribution Required)" },
];

export const securityClassificationOptions: { id: SecurityClassification; label: string }[] = [
  { id: "official", label: "Official" },
  { id: "official_sensitive", label: "Official Sensitive" },
];

export const firstNationsOptions: { id: FirstNationsConsideration; label: string }[] = [
  { id: "none", label: "No First Nations considerations identified" },
  { id: "authorised", label: "Authorised Open Data under IIA clearance" },
  { id: "restricted", label: "Restricted - subject to IIA conditions" },
];

/** "Authorised" and "Restricted" both need the approving authority named. */
export function needsIiaReference(value: FirstNationsConsideration | ""): boolean {
  return value === "authorised" || value === "restricted";
}

export const licenceLabel = (id: DataLicence) => dataLicenceOptions.find((o) => o.id === id)?.label ?? id;
export const classificationLabel = (id: SecurityClassification) => securityClassificationOptions.find((o) => o.id === id)?.label ?? id;
export const firstNationsLabel = (id: FirstNationsConsideration) => firstNationsOptions.find((o) => o.id === id)?.label ?? id;

// ── What is uploaded: structured or unstructured ──
// Structured data is a spreadsheet, checked before it is uploaded (pre-flight) and again after (post-flight). Unstructured data (PDFs, images, Word,
// audio, video) skips pre-flight validation and goes straight to post-flight validation on Fluree (the designer, 2 Nov 2026). Both are added with
// the same upload component, `UploadDropzone` and its queue, in one upload: the upload form takes spreadsheets and the unstructured types together
// (the designer, 2 Nov 2026: a dataset upload can have a few unstructured types). A dataset with no spreadsheet in it is unstructured.
export type { DataKind };

/** What a file queue takes: spreadsheets only (the project-creation step), or spreadsheets and the unstructured types (the upload form). */
export type Accepts = "spreadsheets" | "everything";

/** 10 MB, for each unstructured file (the designer, 2 Nov 2026). */
export const UNSTRUCTURED_MAX_BYTES = 10 * 1024 * 1024;

// RAW is every camera's own raw format; the common ones are listed so the file picker offers them. Audio and video formats are the usual
// container formats; the designer named the groups, not the extensions, so this list is for the designer to confirm.
const UNSTRUCTURED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".raw",
  ".dng",
  ".cr2",
  ".nef",
  ".arw",
  ".doc",
  ".docx",
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".mov",
] as const;

export const fileRulesFor = (accepts: Accepts = "spreadsheets") =>
  accepts === "everything"
    ? {
        extensions: [...ACCEPTED_EXTENSIONS, ...UNSTRUCTURED_EXTENSIONS] as string[],
        /** The line under "Click to upload". */
        formats: "XLS or XLSX, or PDF, images (JPG, PNG, GIF, RAW), Word, audio or video up to 10 MB each",
        /** The format list inside a sentence ("Only X files can be uploaded"). */
        only: ".XLS, .XLSX, PDF, image, Word, audio and video",
      }
    : { extensions: ACCEPTED_EXTENSIONS, formats: "XLS or XLSX", only: ".XLS and .XLSX" };

// ── Records ──
export interface DatasetFile {
  name: string;
  /** Bytes. */
  size: number;
  /** The headings read from the first row of each visible sheet (names and letters only, never values). Absent on files saved before custom concepts, or when the file could not be read. */
  sheets?: SheetColumns[];
}

export interface Dataset {
  id: string;
  projectId: string;
  projectCode: string;
  files: DatasetFile[];
  licence: DataLicence;
  classification: SecurityClassification;
  firstNations: FirstNationsConsideration;
  /** The approving authority, only when First Nations is Authorised or Restricted. */
  iiaReference?: string;
  /** Absent means structured. */
  kind?: DataKind;
  status: DatasetStatus;
  uploadedBy: string;
  /** ISO date. */
  uploadedAt: string;
  history: { status: DatasetStatus; at: string; by: string }[];
  /** The simulated ingestion (see ingestion.ts): how it will end, and when it started (ms since epoch).
   *  Absent on datasets saved before ingestion existed. */
  ingestion?: { outcome: Outcome; startedAt: number };
}

/** What an ingestion run is about, for a stored dataset: its first file, its size in rows (the number of files, for unstructured data; the spreadsheets' size, where a PDF or an image came with them), its project. */
export function subjectOf(d: Dataset): IngestionSubject {
  const unstructured = d.kind === "unstructured";
  return {
    fileName: d.files[0]?.name ?? d.id,
    rows: unstructured ? d.files.length : rowsFromSize(d.files.filter((f) => isSpreadsheet(f.name)).reduce((n, f) => n + f.size, 0)),
    projectCode: d.projectCode,
    ...(unstructured ? { kind: d.kind } : {}),
  };
}

/** What the upload form collects. */
export interface UploadDraft {
  kind?: DataKind;
  files: DatasetFile[];
  licence: DataLicence | "";
  classification: SecurityClassification | "";
  firstNations: FirstNationsConsideration | "";
  iiaReference: string;
  privacyConfirmed: boolean;
}

export const emptyUploadDraft: UploadDraft = { files: [], licence: "", classification: "", firstNations: "", iiaReference: "", privacyConfirmed: false };

// ── The form's sections ──
export type UploadSection = "files" | "custom" | "acknowledgement";
export const UPLOAD_SECTION_ORDER: UploadSection[] = ["files", "acknowledgement"];

/** The sections in order. "Custom concepts" is there only when the files hold some: a conditional section is conditional in the UI (4.3). */
export const uploadSectionOrder = (hasCustomConcepts: boolean): UploadSection[] => (hasCustomConcepts ? ["files", "custom", "acknowledgement"] : UPLOAD_SECTION_ORDER);

export const uploadSections: Record<UploadSection, { title: string; description: string }> = {
  files: { title: "Upload files", description: "Add the dataset files for this project. Use the recommended templates when preparing your data." },
  custom: { title: "Custom concepts", description: "Columns in your files that aren't in BioData's controlled vocabularies." },
  acknowledgement: { title: "Data upload acknowledgement", description: "Before uploading, you must confirm the classification and clearance details of this dataset." },
};

/** What is still missing in each section, in the words shown in the "Details missing" alert. */
export function missingForUpload(draft: UploadDraft, uploading: boolean): Record<UploadSection, string[]> {
  const files: string[] = [];
  if (draft.files.length === 0) files.push("Add at least one file");
  else if (uploading) files.push("Wait for the files to finish uploading");

  const acknowledgement: string[] = [];
  if (!draft.licence) acknowledgement.push("Data licence");
  if (!draft.classification) acknowledgement.push("Security classification");
  if (!draft.firstNations) acknowledgement.push("First Nations considerations");
  else if (needsIiaReference(draft.firstNations) && !draft.iiaReference.trim()) acknowledgement.push("IIA reference or authority name");
  if (!draft.privacyConfirmed) acknowledgement.push("Privacy and restriction confirmation");

  // Nothing in the custom concepts section is required: the concepts are flagged, the upload goes ahead.
  return { files, custom: [], acknowledgement };
}

// ── Recommended templates ──
// The three the upload wireframe recommends, taken from the one template list the Template Finder
// also reads, so the two can't drift apart.
export type { DatasetTemplate };

const RECOMMENDED_TEMPLATE_IDS = ["site-visit-species-load", "site-visit-species-load-custom", "species-data-return"];

export const recommendedTemplates: DatasetTemplate[] = datasetTemplates.filter((t) => RECOMMENDED_TEMPLATE_IDS.includes(t.id));

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ACCEPTED_EXTENSIONS = [".xls", ".xlsx"];
export const isAcceptedFile = (name: string, accepts: Accepts = "spreadsheets") => fileRulesFor(accepts).extensions.some((ext) => name.toLowerCase().endsWith(ext));

/** A workbook: the one structured file type. Anything else the upload takes is unstructured. */
export const isSpreadsheet = (name: string) => ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

/** What a set of files makes: unstructured when there are files and none is a spreadsheet, structured otherwise (a spreadsheet with a PDF beside it is structured). */
export const kindOfFiles = (files: { name: string }[]): DataKind => (files.length > 0 && !files.some((f) => isSpreadsheet(f.name)) ? "unstructured" : "structured");

// How a dataset's workflow status moves with its ingestion. PROPOSED mapping onto the statuses of the
// business sheet "DataSet - users Workflow Status" (none is invented), for the designer to confirm:
//   just uploaded ............... File uploaded
//   checking against the model .. Pre-flight validation in progress
//   mapping and building ........ Processing (post-flight)
//   finished (in full or partly)  Under review
//   stopped while checking, or while mapping (the file or its rows are the problem) ... Validation failed
//   stopped while saving (our side) ... stays Processing, since nothing about the data was rejected
export function datasetStatusFor(view: RunView): DatasetStatus {
  // Unstructured data has no pre-flight: it is uploaded, then processed (post-flight, on Fluree), then reviewed. A failed validation is a failed validation.
  if (view.subject.kind === "unstructured") {
    if (view.failed) return "validation_failed";
    if (view.done) return "under_review";
    return view.overall <= 0 ? "file_uploaded" : "processing";
  }
  if (view.failedStage === 0 || view.failedStage === 1) return "validation_failed";
  if (view.failedStage === 2) return "processing";
  if (view.done) return "under_review";
  if (view.overall <= 0) return "file_uploaded";
  return view.stageIndex === 0 ? "validation_in_progress" : "processing";
}

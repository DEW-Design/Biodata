import type { Outcome, RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import type { BadgeColor } from "@/components/base/badges/badges";

// Dataset upload: the data model and the fixed vocabularies. A dataset is one upload to a project:
// its files, the acknowledgement the uploader gave, and where it is in the dataset workflow.

// ── Workflow status ──
// From the business sheet "DataSet - users Workflow Status" (designer, Sept 28 2026). The order is
// the sheet's sequence: File Uploaded, Pre-flight Validation Requested, Pre-flight Validation in
// Progress, Validation Passed or Failed, Save draft or Submit, Processing (post-flight), Under Review
// or Auto-Approved, Approved. The sheet's step 8 ("All Records Approved = complete") is struck
// through and is not modelled. **Only `file_uploaded` is written today**: uploading stages the file
// for validation. Validation and everything after it is the next piece of work (see CONTEXT.md).
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
  | "approved";

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
};

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

// ── Records ──
export interface DatasetFile {
  name: string;
  /** Bytes. */
  size: number;
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
  status: DatasetStatus;
  uploadedBy: string;
  /** ISO date. */
  uploadedAt: string;
  history: { status: DatasetStatus; at: string; by: string }[];
  /** The simulated ingestion (see ingestion.ts): how it will end, and when it started (ms since epoch).
   *  Absent on datasets saved before ingestion existed. */
  ingestion?: { outcome: Outcome; startedAt: number };
}

/** What the upload form collects. */
export interface UploadDraft {
  files: DatasetFile[];
  licence: DataLicence | "";
  classification: SecurityClassification | "";
  firstNations: FirstNationsConsideration | "";
  iiaReference: string;
  privacyConfirmed: boolean;
}

export const emptyUploadDraft: UploadDraft = { files: [], licence: "", classification: "", firstNations: "", iiaReference: "", privacyConfirmed: false };

// ── The form's sections ──
export type UploadSection = "files" | "acknowledgement";
export const UPLOAD_SECTION_ORDER: UploadSection[] = ["files", "acknowledgement"];

export const uploadSections: Record<UploadSection, { title: string; description: string }> = {
  files: { title: "Upload files", description: "Add the dataset files for this project. Use the recommended templates when preparing your data." },
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

  return { files, acknowledgement };
}

// ── Recommended templates ──
// Names, descriptions and the two facts are the wireframe's own copy. There are no template files
// in the preview, so the downloads are shown but disabled. (The Template Finder section is where
// templates will be browsed and downloaded.)
export interface DatasetTemplate {
  id: string;
  title: string;
  description: string;
  collectionMethod: string;
  speciesType: string;
}

export const recommendedTemplates: DatasetTemplate[] = [
  {
    id: "site-visit-species-load",
    title: "Site Visit Species Load Template",
    description: "A legacy ecological data framework retained for historical reference and comparison with newer assessment methods.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "site-visit-species-load-custom",
    title: "Site Visit Species Load Template (Custom)",
    description: "A legacy ecological data framework retained for historical reference and comparison with newer assessment methods.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
  {
    id: "species-data-return",
    title: "Species Data Return Template",
    description: "An older standardized format for submitting biodiversity and survey data, maintained for compatibility with historical records.",
    collectionMethod: "Others",
    speciesType: "Flora",
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ACCEPTED_EXTENSIONS = [".xls", ".xlsx"];
export const isAcceptedFile = (name: string) => ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

// How a dataset's workflow status moves with its ingestion. PROPOSED mapping onto the statuses of the
// business sheet "DataSet - users Workflow Status" (none is invented), for the designer to confirm:
//   just uploaded ............... File uploaded
//   checking against the model .. Pre-flight validation in progress
//   mapping and building ........ Processing (post-flight)
//   finished (in full or partly)  Under review
//   stopped while checking, or while mapping (the file or its rows are the problem) ... Validation failed
//   stopped while saving (our side) ... stays Processing, since nothing about the data was rejected
export function datasetStatusFor(view: RunView): DatasetStatus {
  if (view.failedStage === 0 || view.failedStage === 1) return "validation_failed";
  if (view.failedStage === 2) return "processing";
  if (view.done) return "under_review";
  if (view.overall <= 0) return "file_uploaded";
  return view.stageIndex === 0 ? "validation_in_progress" : "processing";
}

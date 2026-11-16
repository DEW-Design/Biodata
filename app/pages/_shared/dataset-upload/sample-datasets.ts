import type { Dataset } from "@/app/pages/_shared/dataset-upload/dataset-data";

// The project's sample uploads, shown on its Datasets tab beside the ones uploaded in this browser (project-detail/datasets-view.tsx). They live here,
// and not in that view, so the dataset store can see their ids: a new upload is numbered after every id in use, the samples' included, or the tab
// would list two datasets with one id.

// The project the sample uploads belong to. Every other project shows only its own uploads.
export const SAMPLE_PROJECT = { id: "adelaide-hills", code: "BD-5039" };

// SAMPLE: three earlier uploads to BD-5039, one per way a run can end (added, partly added, not
// ingested), uploaded by the placeholder people. Illustrative, like the project records themselves.
export const SAMPLE_DATASETS: Dataset[] = [
  {
    id: "DS-2025-00012",
    projectId: SAMPLE_PROJECT.id,
    projectCode: SAMPLE_PROJECT.code,
    files: [{ name: "AHL_spring_survey_2025.xlsx", size: 421_888 }],
    licence: "ccby",
    firstNations: "none",
    status: "approved",
    uploadedBy: "Phoenix Baker",
    uploadedAt: "2025-10-18",
    history: [
      { status: "file_uploaded", at: "2025-10-18", by: "Phoenix Baker" },
      { status: "validation_in_progress", at: "2025-10-18", by: "System" },
      { status: "processing", at: "2025-10-18", by: "System" },
      { status: "under_review", at: "2025-10-18", by: "System" },
      { status: "approved", at: "2025-10-24", by: "Maya Dewitt" },
    ],
    ingestion: { outcome: "success", startedAt: 0 },
  },
  {
    id: "DS-2025-00018",
    projectId: SAMPLE_PROJECT.id,
    projectCode: SAMPLE_PROJECT.code,
    files: [{ name: "AHL_bandicoot_trapping_Nov2025.xlsx", size: 98_304 }],
    licence: "ccby",
    firstNations: "none",
    status: "under_review",
    uploadedBy: "Lana Steiner",
    uploadedAt: "2025-11-22",
    history: [
      { status: "file_uploaded", at: "2025-11-22", by: "Lana Steiner" },
      { status: "validation_in_progress", at: "2025-11-22", by: "System" },
      { status: "processing", at: "2025-11-22", by: "System" },
      { status: "under_review", at: "2025-11-22", by: "System" },
    ],
    ingestion: { outcome: "partial", startedAt: 0 },
  },
  {
    id: "DS-2026-00003",
    projectId: SAMPLE_PROJECT.id,
    projectCode: SAMPLE_PROJECT.code,
    files: [{ name: "AHL_summer_vegetation_2026.xlsx", size: 161_792 }],
    licence: "cc0",
    firstNations: "none",
    status: "validation_failed",
    uploadedBy: "Olivia Wyatt",
    uploadedAt: "2026-02-09",
    history: [
      { status: "file_uploaded", at: "2026-02-09", by: "Olivia Wyatt" },
      { status: "validation_in_progress", at: "2026-02-09", by: "System" },
      { status: "validation_failed", at: "2026-02-09", by: "System" },
    ],
    ingestion: { outcome: "fail-model", startedAt: 0 },
  },
];


/** The ids the samples use, which a new upload must not take. */
export const SAMPLE_DATASET_IDS: readonly string[] = SAMPLE_DATASETS.map((d) => d.id);

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { todayIso } from "@/app/pages/_shared/dla/dla-data";
import type { Outcome } from "@/app/pages/_shared/dataset-upload/ingestion";
import type { Dataset, DatasetStatus, UploadDraft } from "@/app/pages/_shared/dataset-upload/dataset-data";

// Datasets (uploads to a project) in a zustand store persisted to localStorage, the same client-only
// persistence as DSA, DLA and nominations (see zustand-persist.ts). Only the files' names and sizes
// are kept, never their contents. Uploading creates a dataset at "File uploaded" (staged, waiting
// for pre-flight validation); the transitions after that arrive with the validation work.

interface DatasetStoreState {
  datasets: Dataset[];
}

const useDatasetStore = create<DatasetStoreState>()(
  persist(() => ({ datasets: [] as Dataset[] }), {
    name: "biodata-datasets",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** Every dataset. Call it on any screen that will add one, so the saved list is loaded first and an
 *  upload never overwrites it. */
export function useDatasets(): Dataset[] {
  useRehydrate(useDatasetStore);
  return useDatasetStore((s) => s.datasets);
}

function nextDatasetId(existing: Dataset[]): string {
  const year = new Date().getFullYear();
  const prefix = `DS-${year}-`;
  const max = existing.reduce((n, d) => (d.id.startsWith(prefix) ? Math.max(n, Number(d.id.slice(prefix.length)) || 0) : n), 0);
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

/** Stage a dataset for validation. The draft must be complete (the form guarantees it). */
export function addDataset(project: { id: string; code: string }, draft: UploadDraft): Dataset {
  const existing = useDatasetStore.getState().datasets;
  const now = todayIso();
  const dataset: Dataset = {
    id: nextDatasetId(existing),
    projectId: project.id,
    projectCode: project.code,
    files: draft.files,
    licence: draft.licence as Dataset["licence"],
    classification: draft.classification as Dataset["classification"],
    firstNations: draft.firstNations as Dataset["firstNations"],
    ...(draft.iiaReference.trim() ? { iiaReference: draft.iiaReference.trim() } : {}),
    status: "file_uploaded",
    uploadedBy: CURRENT_USER_NAME,
    uploadedAt: now,
    history: [{ status: "file_uploaded", at: now, by: CURRENT_USER_NAME }],
    // Ingestion starts as soon as the files are in. It succeeds unless the preview control says otherwise.
    ingestion: { outcome: "success", startedAt: Date.now() },
  };
  useDatasetStore.setState({ datasets: [...existing, dataset] });
  return dataset;
}

/** Run a dataset's ingestion again, ending the way `outcome` says. Used by "Try again" (a fault on
 *  our side succeeds the second time) and by the preview control that sets how ingestion ends. */
export function restartIngestion(id: string, outcome: Outcome): void {
  useDatasetStore.setState((s) => ({
    datasets: s.datasets.map((d) => (d.id === id ? { ...d, ingestion: { outcome, startedAt: Date.now() } } : d)),
  }));
}

/** Move a dataset to a new workflow status, recording it in its history. Does nothing if it is already there. */
export function setDatasetStatus(id: string, status: DatasetStatus): void {
  useDatasetStore.setState((s) => ({
    datasets: s.datasets.map((d) =>
      d.id === id && d.status !== status ? { ...d, status, history: [...d.history, { status, at: todayIso(), by: "System" }] } : d,
    ),
  }));
}

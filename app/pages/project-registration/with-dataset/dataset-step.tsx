"use client";

import { useState, type ReactNode } from "react";
import { FormRow } from "@/app/pages/_shared/form-row";
import { AcknowledgementRows, emptyAcknowledgement, type Acknowledgement } from "@/app/pages/_shared/dataset-upload/acknowledgement-rows";
import { FileQueue, UploadDropzone, useFileQueue } from "@/app/pages/_shared/dataset-upload/upload-dropzone";
import { addDataset, useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { readFileFacts } from "@/app/pages/_shared/dataset-upload/file-facts";
import { FileFactsCard, type FileRead } from "./file-facts-card";
import {
  classificationLabel,
  emptyUploadDraft,
  firstNationsLabel,
  formatFileSize,
  isAcceptedFile,
  licenceLabel,
  missingForUpload,
  type UploadDraft,
} from "@/app/pages/_shared/dataset-upload/dataset-data";

// The Datasets step of Add Project option 2: the files of the dataset being added and what the person agrees to for it, the same
// questions in the same words as the upload form (`AcknowledgementRows`, the file area and its queue), asked while the project is
// being made. The step is optional: with no file added it is skipped, and the primary button says so. What is added is created
// as the project's dataset when the project is created, and runs the same ingestion as any upload.
//
// The queue lives here, in the flow's hook, and not in the step's screen: the screen unmounts when the person goes to another
// section, and the files they added must still be there when they come back.

export interface ReviewRow {
  label: string;
  value: string;
}

export interface DatasetStep {
  /** At least one file has been added. A step with none is skipped. */
  hasFiles: boolean;
  /** Nothing is missing: either no dataset, or every file is in and every question answered. */
  valid: boolean;
  /** What the step still needs, named as the form labels it. Empty when valid. */
  missing: string[];
  /** Something has been added or answered, so leaving the form asks first. */
  dirty: boolean;
  /** "Skip, add datasets later" while there are no files, "Continue" once there are. */
  primaryLabel: string;
  /** The step's fields. */
  fields: (showErrors: boolean) => ReactNode;
  /** The step as the review's rows. */
  reviewRows: ReviewRow[];
  /** Creates the dataset on the project that was just created. Does nothing when no file was added. */
  create: (project: { id: string; code: string }) => void;
}

export function useDatasetStep(): DatasetStep {
  useDatasets(); // loads the saved datasets before this one is added, as the upload form does
  const queue = useFileQueue();
  const [answers, setAnswers] = useState<Acknowledgement>(emptyAcknowledgement);
  const update = (change: Partial<Acknowledgement>) => setAnswers((a) => ({ ...a, ...change }));

  // What each file says about the project's data (dates, sites, visits, species), read from the real file as it is added, by name and size.
  const [reads, setReads] = useState<Record<string, FileRead>>({});
  const keyOf = (f: { name: string; size: number }) => `${f.name}:${f.size}`;
  const addFiles = (incoming: File[]) => {
    queue.add(incoming);
    for (const file of incoming.filter((f) => isAcceptedFile(f.name))) {
      const key = keyOf(file);
      setReads((r) => ({ ...r, [key]: { state: "reading" } }));
      readFileFacts(file).then(
        (facts) => setReads((r) => ({ ...r, [key]: { state: "read", facts } })),
        () => setReads((r) => ({ ...r, [key]: { state: "error", file: file.name } })),
      );
    }
  };
  const removeFile = (id: string) => {
    const file = queue.files.find((f) => f.id === id);
    queue.remove(id);
    if (file)
      setReads((r) => {
        const next = { ...r };
        delete next[keyOf(file)];
        return next;
      });
  };

  const files = queue.files.filter((f) => f.status === "complete").map((f) => ({ name: f.name, size: f.size, ...(f.sheets ? { sheets: f.sheets } : {}) }));
  const draft: UploadDraft = { ...emptyUploadDraft, ...answers, files };
  const hasFiles = queue.files.length > 0;
  const needed = missingForUpload(draft, queue.uploading);
  // A file that could not be read is not a dataset: with only those in the queue there is nothing to create.
  const missing = !hasFiles ? [] : queue.uploading || files.length === 0 ? needed.files : needed.acknowledgement;
  const dirty = hasFiles || answers.licence !== "" || answers.classification !== "" || answers.firstNations !== "" || answers.privacyConfirmed;

  const reviewRows: ReviewRow[] = !hasFiles
    ? [{ label: "Dataset files", value: "None added" }]
    : [
        { label: "Dataset files", value: files.map((f) => `${f.name} (${formatFileSize(f.size)})`).join(", ") },
        { label: "Data licence", value: answers.licence ? licenceLabel(answers.licence) : "" },
        { label: "Security classification", value: answers.classification ? classificationLabel(answers.classification) : "" },
        { label: "First Nations considerations", value: answers.firstNations ? `${firstNationsLabel(answers.firstNations)}${answers.iiaReference.trim() ? `, ${answers.iiaReference.trim()}` : ""}` : "" },
        { label: "Privacy and restriction", value: answers.privacyConfirmed ? "Confirmed" : "" },
      ];

  return {
    hasFiles,
    valid: missing.length === 0,
    missing,
    dirty,
    primaryLabel: hasFiles ? "Continue" : "Skip, add datasets later",
    fields: (showErrors) => (
      <>
        <FormRow
          title="Dataset files"
          description="Optional. Add one or more files now, or skip this step and add datasets later from the project's Upload menu."
          error={queue.rejected.length ? `Only .XLS and .XLSX files can be uploaded. Not added: ${queue.rejected.join(", ")}.` : undefined}
        >
          <UploadDropzone onAdd={addFiles} />
          <FileQueue files={queue.files} onRemove={removeFile} />
        </FormRow>
        {hasFiles && (
          <FormRow title="From your file" description="What the file itself states about the project's data.">
            <FileFactsCard reads={queue.files.flatMap((f) => (reads[keyOf(f)] ? [reads[keyOf(f)]] : []))} />
          </FormRow>
        )}
        {/* Conditional in the UI (4.3): the questions about a dataset only appear once there is a dataset. */}
        {hasFiles && (
          <AcknowledgementRows
            answers={answers}
            update={update}
            showErrors={showErrors}
            privacyNote={
              <p className="text-sm text-balance text-tertiary">
                Project-level privacy controls are set in the Privacy and Restrictions step. If this dataset needs additional or different restrictions, set them there before you create the project.
              </p>
            }
          />
        )}
      </>
    ),
    reviewRows,
    create: (project) => {
      if (hasFiles && missing.length === 0) addDataset(project, draft);
    },
  };
}

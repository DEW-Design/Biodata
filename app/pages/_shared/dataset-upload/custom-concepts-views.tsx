"use client";

import { useMemo } from "react";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { conceptStatusMeta, describePlace, useCustomConcepts, type ConceptStatus, type CustomConcept } from "@/app/pages/_shared/dataset-upload/custom-concepts";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";

// The custom concepts of an upload, in the two places the person sees them: the upload form's "Custom
// concepts" section (before the files are sent: the name and where it is, no status yet) and the dataset's
// ingestion detail, the chip's popover and the project's Datasets page (after: the same rows with where each
// stands). One list, so the two cannot drift apart.

export interface ConceptRow {
  key: string;
  name: string;
  where: string;
  /** Absent before the dataset is saved: nothing has been sent for approval yet. */
  status?: ConceptStatus;
  /** Why it was not approved. */
  reason?: string;
}

export function CustomConceptRows({ rows, label }: { rows: ConceptRow[]; label: string }) {
  // A plain list with a line between the rows, like the ingestion's reasons: a box with its own corners inside the
  // dataset's card would have to be concentric with it (2.13), and the lines say all there is to say.
  return (
    <ul aria-label={label} className="m-0 flex list-none flex-col p-0 [&>li:not(:first-child)]:border-t [&>li:not(:first-child)]:border-secondary">
      {rows.map((row) => (
        <li key={row.key} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="m-0 text-sm font-semibold text-balance break-words text-primary">{row.name}</p>
            <p className="m-0 text-xs text-balance break-words text-tertiary">{row.where}</p>
            {row.status === "rejected" && row.reason && <p className="m-0 mt-0.5 text-xs text-balance text-tertiary">Reason: {row.reason}</p>}
          </div>
          {row.status && (
            <Badge size="sm" color={conceptStatusMeta[row.status].color} className="shrink-0">
              {conceptStatusMeta[row.status].label}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * The custom concepts an admin can act on: those of a dataset that was added. A dataset whose ingestion failed
 * added nothing (the run says "Nothing was added to this project"), so its columns are not up for approval; the
 * corrected upload flags them. One that is retried and succeeds brings them back.
 */
export function useConceptsToReview(): CustomConcept[] {
  const all = useCustomConcepts();
  const datasets = useDatasets();
  return useMemo(() => {
    const failed = new Set(datasets.filter((d) => d.ingestion?.outcome.startsWith("fail-")).map((d) => d.id));
    return all.filter((c) => !failed.has(c.datasetId));
  }, [all, datasets]);
}

/** A dataset's custom concepts and where each stands, for its ingestion detail. Nothing when it has none. */
export function CustomConceptsSection({ datasetId }: { datasetId: string }) {
  const all = useConceptsToReview();
  const dataset = useDatasets().find((d) => d.id === datasetId);
  const mine = all.filter((c) => c.datasetId === datasetId);
  if (mine.length === 0) return null;
  // The file's name is on screen beside a one-file dataset already; with several it says which.
  const withFile = (dataset?.files.length ?? 1) > 1;
  const waiting = mine.some((c) => c.status === "pending");
  return (
    <div className="flex flex-col gap-3 border-t border-secondary pt-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="m-0 text-sm font-semibold text-primary">Custom concepts</p>
          <CountBadge count={mine.length} />
        </div>
        {waiting && <p className="m-0 text-xs text-balance text-tertiary">Columns that aren&apos;t in the controlled vocabularies. A BioData admin approves each one.</p>}
      </div>
      <CustomConceptRows
        label="Custom concepts in this dataset"
        rows={mine.map((c) => ({ key: c.id, name: c.name, where: describePlace(c.places, withFile), status: c.status, reason: c.reason }))}
      />
    </div>
  );
}

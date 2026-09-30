"use client";

import { useEffect, useState } from "react";
import { Database01 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { datasetStatusFor, datasetStatusMeta } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { restartIngestion, setDatasetStatus, useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { runLengthMs, rowsFromSize, viewAt, type Outcome } from "@/app/pages/_shared/dataset-upload/ingestion";
import { IngestionChip } from "@/app/pages/_shared/dataset-upload/ingestion-views";

// A project's dataset ingestion, on the project page: one chip in the identity card's actions while a
// dataset is being added ("Uploading files - 62%"), opening the stages, the file and, when something went
// wrong, why and what to do. It follows the latest dataset uploaded to the project. A successful
// run's chip goes a minute after it finishes; one that failed or needs attention stays until the next
// upload, because it is not resolved. Everything is simulated (ingestion.ts); nothing reads the file.

/** How long the "records added" chip stays after a successful run. */
const SUCCESS_VISIBLE_MS = 60_000;

// The "Upload result" tool on the Prototype tools bar: how this dataset's simulated ingestion ends.
const OUTCOMES: { id: Outcome; label: string; short?: string; description: string }[] = [
  { id: "success", label: "Succeeds", description: "Every row is added" },
  { id: "partial", label: "Some rows can't be placed", short: "Partly added", description: "The rest are added" },
  { id: "fail-model", label: "Fails: the file doesn't match the data model", short: "Fails: wrong format", description: "Nothing is added" },
  { id: "fail-map", label: "Fails: the rows don't fit this project", short: "Fails: rows don't fit", description: "Nothing is added" },
  { id: "fail-save", label: "Fails on our side", short: "Fails: our side", description: "Try again works" },
];

export function ProjectIngestionChip({ projectId }: { projectId: string }) {
  const datasets = useDatasets();
  // The latest upload to this project that has an ingestion.
  const dataset = [...datasets].reverse().find((d) => d.projectId === projectId && d.ingestion);
  const startedAt = dataset?.ingestion?.startedAt ?? 0;
  const outcome = dataset?.ingestion?.outcome ?? "success";

  const [now, setNow] = useState(() => Date.now());
  const endsAt = startedAt + runLengthMs(outcome);
  // Tick while it runs, and while a finished success is still on screen waiting to go.
  const ticking = !!dataset && (now < endsAt || (outcome === "success" && now < endsAt + SUCCESS_VISIBLE_MS));
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  const file = dataset?.files[0];
  const subject = dataset
    ? { fileName: file?.name ?? dataset.id, rows: rowsFromSize(dataset.files.reduce((n, f) => n + f.size, 0)), projectCode: dataset.projectCode }
    : null;
  // `now` can lag a fresh restart by a tick; never read a negative elapsed time.
  const view = subject ? viewAt(outcome, Math.max(0, now - startedAt), subject) : null;
  const target = view ? datasetStatusFor(view) : null;

  // The dataset's workflow status moves with its ingestion: written to the store (and its history)
  // whenever the run crosses into a new status.
  const datasetId = dataset?.id;
  const datasetStatus = dataset?.status;
  useEffect(() => {
    if (datasetId && target && datasetStatus !== target) setDatasetStatus(datasetId, target);
  }, [datasetId, datasetStatus, target]);

  // Only a project with a dataset has an ingestion to preview, so only then is the tool on the bar.
  useRegisterTool(
    dataset
      ? {
          id: "ingestion",
          label: "How the upload ends",
          barLabel: "Upload result",
          icon: Database01,
          options: OUTCOMES,
          value: outcome,
          onChange: (id) => {
            restartIngestion(dataset.id, id as Outcome);
            setNow(Date.now());
          },
          override: outcome === "success" ? undefined : "Forced outcome",
        }
      : null,
  );

  if (!dataset || !view || !subject) return null;
  const expired = view.done && outcome === "success" && now > endsAt + SUCCESS_VISIBLE_MS;
  const statusMeta = datasetStatusMeta[target ?? dataset.status];

  if (expired) return null;
  return (
    <IngestionChip
      view={view}
      projectId={projectId}
      title={`Uploading files against ${dataset.projectCode}`}
      datasetStatus={{ label: statusMeta.label, color: statusMeta.badgeColor }}
      // A fault on our side is transient: the second attempt succeeds.
      onRetry={() => {
        restartIngestion(dataset.id, "success");
        setNow(Date.now());
      }}
    />
  );
}

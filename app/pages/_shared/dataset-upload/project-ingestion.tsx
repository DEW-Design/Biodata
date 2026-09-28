"use client";

import { useEffect, useState } from "react";
import { Database01 } from "@untitledui/icons";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { FloatingMenuFab } from "@/app/pages/_shared/floating-fab";
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

const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "success", label: "Succeeds" },
  { id: "partial", label: "Some rows can't be placed" },
  { id: "fail-model", label: "Fails: file doesn't match the model" },
  { id: "fail-map", label: "Fails: rows don't fit this project" },
  { id: "fail-save", label: "Fails: our side (retry works)" },
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

  if (!dataset || !view || !subject) return null;
  const expired = view.done && outcome === "success" && now > endsAt + SUCCESS_VISIBLE_MS;
  const statusMeta = datasetStatusMeta[target ?? dataset.status];

  return (
    <>
      {!expired && (
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
      )}
      {/* A preview tool, like the role switcher: sets how this dataset's ingestion ends and runs it again. */}
      <FloatingMenuFab storageKey="ingestion-outcome" defaultPosition={{ right: 20, bottom: 148 }} ariaLabel="Ingestion outcome (preview)" icon={Database01}>
        <Dropdown.Menu
          aria-label="How this ingestion ends"
          selectionMode="single"
          selectedKeys={[outcome]}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const [id] = Array.from(keys) as Outcome[];
            if (!id) return;
            restartIngestion(dataset.id, id);
            setNow(Date.now());
          }}
        >
          {OUTCOMES.map((o) => (
            <Dropdown.Item key={o.id} id={o.id} label={o.label} />
          ))}
        </Dropdown.Menu>
      </FloatingMenuFab>
    </>
  );
}

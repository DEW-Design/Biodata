"use client";

// A project's upload status on the post-6-oct lab's bar: the lab's own copy of what the product page's chip does (`ProjectIngestionChip` and `IngestionChip`), drawn as the round icon button of
// `upload-status-button.tsx`. It lives here and not in the product files so that nothing of this lab sits in production code (the designer, 19 Oct 2026: "post-6-oct stuff should sit only on the
// /proto route without being rolled into production"); the product's two files are as they were. It reads the same datasets, the same simulated runs (ingestion.ts) and the same popover
// content (`IngestionDetail`, exported by the product), so the two cannot say different things.
// It follows the latest dataset uploaded to the project. It is there while the run goes and for a minute after it ends, whatever the result, and then it goes: what is left to deal with is in
// the project's notices and the bell. The "Upload result" tool on the Prototype tools bar sets how the run ends. Everything is simulated; nothing reads the file.
// A copy of product code, by the designer's instruction: CONTRACTS 1.6 (extend, do not fork) and 0.9 are overridden for this lab only (logged in context/decisions, 19 Oct 2026).
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useEffect, useState } from "react";
import { Dialog, DialogTrigger } from "react-aria-components";
import { Database01, File06 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { Badge } from "@/components/base/badges/badges";
import { Popover } from "@/components/base/select/popover";
import { datasetStatusFor, datasetStatusMeta } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { restartIngestion, setDatasetStatus, useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { rowsFromSize, runLengthMs, viewAt, type Outcome } from "@/app/pages/_shared/dataset-upload/ingestion";
import { IngestionDetail, statusOf } from "@/app/pages/_shared/dataset-upload/ingestion-views";
import { UploadStatusButton } from "./upload-status-button";

/** How long the icon stays after a run ends. */
const VISIBLE_AFTER_MS = 60_000;

// The "Upload result" tool on the Prototype tools bar: how this dataset's simulated ingestion ends.
const OUTCOMES: { id: Outcome; label: string; short?: string; description: string }[] = [
  { id: "success", label: "Succeeds", description: "Every row is added" },
  { id: "partial", label: "Some rows can't be placed", short: "Partly added", description: "The rest are added" },
  { id: "fail-model", label: "Fails: the file doesn't match the data model", short: "Fails: wrong format", description: "Nothing is added" },
  { id: "fail-map", label: "Fails: the rows don't fit this project", short: "Fails: rows don't fit", description: "Nothing is added" },
  { id: "fail-save", label: "Fails on our side", short: "Fails: our side", description: "Try again works" },
];

export function ProjectUploadStatus({ projectId }: { projectId: string }) {
  const datasets = useDatasets();
  // The latest upload to this project that has an ingestion.
  const dataset = [...datasets].reverse().find((d) => d.projectId === projectId && d.ingestion);
  const startedAt = dataset?.ingestion?.startedAt ?? 0;
  const outcome = dataset?.ingestion?.outcome ?? "success";

  const [now, setNow] = useState(() => Date.now());
  const endsAt = startedAt + runLengthMs(outcome);
  // Tick while it runs, and while a finished run is still on screen waiting to go.
  const ticking = !!dataset && now < endsAt + VISIBLE_AFTER_MS;
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

  // The dataset's workflow status moves with its ingestion: written to the store (and its history) whenever the run crosses into a new status.
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
          // A restarted run moves `startedAt` forward, which wakes the ticker below, so the icon follows within a quarter of a second without the handler touching the clock.
          onChange: (id) => restartIngestion(dataset.id, id as Outcome),
          override: outcome === "success" ? undefined : "Forced outcome",
        }
      : null,
  );

  if (!dataset || !view || !subject) return null;
  if (view.done && now > endsAt + VISIBLE_AFTER_MS) return null;
  const status = statusOf(view);
  const statusMeta = datasetStatusMeta[target ?? dataset.status];
  return (
    <DialogTrigger>
      <UploadStatusButton view={view} />
      <Popover size="auto" placement="bottom end" offset={8} className="font-barlow w-96">
        <Dialog className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-4 outline-hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-balance text-primary">{`Uploading files against ${dataset.projectCode}`}</p>
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
          </div>
          {/* A fault on our side is transient: the second attempt succeeds. */}
          <IngestionDetail
            view={view}
            projectId={projectId}
            datasetId={dataset.id}
            onRetry={() => restartIngestion(dataset.id, "success")}
          />
          <ul className="m-0 flex list-none flex-col gap-1 border-t border-secondary p-0 pt-3 text-xs text-tertiary">
            <li className="flex items-center gap-2">
              <File06 className="size-4 shrink-0 text-fg-quaternary" />
              <span className="min-w-0 flex-1 truncate" title={view.subject.fileName}>
                {view.subject.fileName}
              </span>
              <span className="shrink-0">{view.subject.rows} rows</span>
            </li>
          </ul>
          <div className="flex items-center justify-between gap-3 text-xs text-tertiary">
            <span>Dataset status</span>
            <Badge size="sm" color={statusMeta.badgeColor}>
              {statusMeta.label}
            </Badge>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

"use client";

// The uploads in the bell (the designer, 19 Oct 2026: the upload's progress icon is temporary, so what it said must also be in the activity notifications, with a filter for
// uploads). One row for each upload whose run has ended: added, partly added, or not added. A run still going is not a notification, it is the icon on the project bar
// (upload-status-button.tsx). The rows are read from the same datasets and the same outcomes as the project's Datasets view and notices, so the three cannot disagree: the
// Adelaide Hills sample uploads and any upload made here to that project come from `useProjectDatasets`, an upload made here to another project from the store. A row opens
// that dataset on the project page. Nothing is shown to a signed out visitor, who cannot upload.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle } from "@untitledui/icons";
import type { Dataset } from "@/app/pages/_shared/dataset-upload/dataset-data";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { rowsFromSize, runLengthMs, viewAt, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { projectDetailsPath } from "@/app/pages/_shared/project-routes";
import { useProjectDatasets } from "@/app/pages/project-detail/datasets-view";
import { ADELAIDE_HILLS_ID } from "@/app/pages/project-detail/project-seed";
import { useUserRole } from "@/lib/use-user-role";
import type { AttentionTask } from "./attention";

const count = (n: number) => n.toLocaleString("en-AU");

function taskFor(dataset: Dataset, view: RunView | null): AttentionTask | null {
  if (!view?.done || !dataset.ingestion) return null;
  const { startedAt, outcome } = dataset.ingestion;
  const file = dataset.files[0]?.name ?? dataset.id;
  // A sample upload finished long ago and has only a date; one made here ended when its run did.
  const at = startedAt === 0 ? dataset.uploadedAt : new Date(startedAt + runLengthMs(outcome)).toISOString();
  const state = view.failed ? "failed" : view.partial ? "partial" : "added";
  const common = {
    id: `upload:${dataset.id}:${startedAt}:${outcome}`,
    kind: "upload" as const,
    at,
    href: `${projectDetailsPath(dataset.projectId)}?view=datasets&dataset=${encodeURIComponent(dataset.id)}`,
    file,
    project: dataset.projectCode,
    detail: `${file} \u00b7 ${dataset.projectCode}`,
    // Uploads that ended the same way, in the same project, on the same day fold into one row.
    group: `${state}|${dataset.projectCode}|${at.slice(0, 10)}`,
    segments: [],
  };
  // A failure and a partial add ask something of the person; an upload that was added only tells them.
  if (view.failed) return { ...common, attention: true, title: "Upload failed", groupTitle: (n) => `${n} uploads failed`, icon: AlertCircle, tone: "error" };
  if (view.partial) {
    const rows = `${count(view.unmapped)} ${view.unmapped === 1 ? "row" : "rows"}`;
    return { ...common, attention: true, title: `Upload partly added: ${rows} could not be placed`, groupTitle: (n) => `${n} uploads partly added`, icon: AlertTriangle, tone: "warning" };
  }
  return { ...common, attention: false, title: "Upload added", groupTitle: (n) => `${n} uploads added`, icon: CheckCircle, tone: "success" };
}

export function useUploadActivity(): AttentionTask[] {
  const role = useUserRole();
  const stored = useDatasets();
  const adelaide = useProjectDatasets(ADELAIDE_HILLS_ID);
  const others = useMemo(() => stored.filter((d) => d.projectId !== ADELAIDE_HILLS_ID && d.ingestion), [stored]);

  // Uploads to other projects are not ticked by `useProjectDatasets`, so their runs are followed here until they end.
  const [now, setNow] = useState(() => Date.now());
  const running = others.some((d) => d.ingestion && now < d.ingestion.startedAt + runLengthMs(d.ingestion.outcome));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  return useMemo(() => {
    if (role === "public-user") return [];
    const rows = [
      ...adelaide.map((r) => ({ dataset: r.dataset, view: r.view })),
      ...others.map((d) => {
        const ingestion = d.ingestion!;
        const subject = { fileName: d.files[0]?.name ?? d.id, rows: rowsFromSize(d.files.reduce((n, f) => n + f.size, 0)), projectCode: d.projectCode };
        return { dataset: d, view: viewAt(ingestion.outcome, Math.max(0, now - ingestion.startedAt), subject) };
      }),
    ];
    return rows
      .flatMap(({ dataset, view }) => taskFor(dataset, view) ?? [])
      .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  }, [role, adelaide, others, now]);
}

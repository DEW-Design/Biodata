"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Database01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { TaskItem } from "@/app/pages/_shared/home-dashboard";
import { STAGES, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { IngestionProblems, estimateOf, headline, isSystemFault, placedRows, stageDetail, statusOf } from "@/app/pages/_shared/dataset-upload/ingestion-views";

// Options A and B of /proto/dataset-ingestion, kept in the lab only: the designer chose the chip (C)
// for the project page, so these are not folded into production.

// ── Option A: a notice under the identity card ──
// The record-page rule (CONTRACTS 4.6): one notice saying where the record stands. Built on the
// real `TaskItem` (a status badge and a multi-step progress), the same card Home uses for "waiting
// on someone else" tasks, so it is not a new pattern. A failure keeps the same card: the failed step
// turns red, and the reasons and actions sit in its footer.
export function IngestionStrip({ view, projectId, onRetry }: { view: RunView; projectId: string; onRetry: () => void }) {
  const status = statusOf(view);
  const problems = view.done && (view.failed || view.partial);
  const detail = view.failed
    ? isSystemFault(view)
      ? "Something went wrong on our side. Nothing was added to this project."
      : `${view.reasons.length} ${view.reasons.length === 1 ? "problem" : "problems"} in your file. Nothing was added to this project.`
    : view.done
      ? view.partial
        ? `${view.unmapped} of ${view.subject.rows} rows couldn't be placed in the project's structure. The other ${placedRows(view)} are in the records tree.`
        : `${placedRows(view)} occurrences are now in the records tree, marked New.`
      : `${view.subject.fileName}. ${estimateOf(view)}.`;
  return (
    <TaskItem
      icon={problems ? AlertCircle : Database01}
      iconColor={view.failed ? "error" : problems ? "warning" : "brand"}
      title="Dataset ingestion"
      detail={detail}
      status={status.label}
      statusColor={status.color}
      progress={{ steps: STAGES.map((stage, i) => ({ label: stage.label, detail: stageDetail(i, view), percent: view.stagePercents[i], failed: view.failedStage === i })) }}
      footer={
        problems ? (
          <div className="border-t border-secondary pt-4">
            <IngestionProblems view={view} projectId={projectId} onRetry={onRetry} />
          </div>
        ) : undefined
      }
    />
  );
}

// ── Option B: a card at the top of the records tree (column 2) ──
// The tree is where the data lands, so the progress sits with it; the new records appear in the tree
// as the last stage runs (see `NewRecordItems`). Reasons open inside the card, since column 2 is
// too narrow for a dialog to feel like part of it.
export function IngestionTreeCard({ view, projectId, onRetry }: { view: RunView; projectId: string; onRetry: () => void }) {
  const status = statusOf(view);
  const problems = view.done && (view.failed || view.partial);
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-secondary bg-primary p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">Dataset ingestion</p>
        <Badge size="sm" color={status.color}>
          {status.label}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        <ProgressBarBase value={Math.round(view.overall * 100)} progressClassName={view.failed ? "bg-fg-error-primary" : undefined} />
        {!view.done && <p className="m-0 text-xs text-tertiary">{estimateOf(view)}</p>}
      </div>
      <p className="text-xs text-balance text-tertiary">{headline(view)}</p>
      {problems && (
        <>
          <Button color="link-color" size="sm" iconTrailing={open ? ChevronUp : ChevronDown} className="self-start" onPress={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Hide reasons" : view.failed ? "Why wasn't it added?" : "See what needs attention"}
          </Button>
          {open && (
            <div className="border-t border-secondary pt-3">
              <IngestionProblems view={view} projectId={projectId} onRetry={onRetry} />
            </div>
          )}
        </>
      )}
    </div>
  );
}


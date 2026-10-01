"use client";

import type { ReactNode } from "react";
import { Dialog, DialogTrigger } from "react-aria-components";
import { AlertCircle, BarChart01, CheckCircle, ChevronDown, Eye, File06, RefreshCcw01, UploadCloud02 } from "@untitledui/icons";
import { Badge, type BadgeColor } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Popover } from "@/components/base/select/popover";
import { cx } from "@/utils/cx";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import { STAGES, type Reason, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { useRoleHref } from "@/lib/use-role-href";

// The three ways to show an ingestion's progress on a project page, and the new records it adds to
// the tree. The lab (page.tsx) composes them; each is built from real DEW components (`TaskItem`,
// `ProgressBarBase`, `Progress`, `TreeView`, `Popover`, `Badge`, `Button`).

export const placedRows = (view: RunView) => view.subject.rows - view.unmapped;

/** "About 20 seconds left": an estimate, rounded so it doesn't tick every second. */
export function estimateOf(view: RunView): string {
  const s = view.secondsLeft;
  if (s < 5) return "Almost done";
  if (s < 60) return `About ${Math.round(s / 5) * 5} seconds left`;
  const m = Math.round(s / 60);
  return `About ${m} ${m === 1 ? "minute" : "minutes"} left`;
}

/** The one status the whole run shows: running, added, added with problems, or not ingested. */
export function statusOf(view: RunView): { label: string; color: "brand" | "success" | "warning" | "error" } {
  if (!view.done) return { label: "Ingesting", color: "brand" };
  if (view.failed) return { label: "Not ingested", color: "error" };
  return view.partial ? { label: "Needs attention", color: "warning" } : { label: "Added", color: "success" };
}

export function stageDetail(index: number, view: RunView): string {
  if (view.failedStage !== null) {
    if (index === view.failedStage) return "Stopped here";
    if (index > view.failedStage) return "Not started";
  }
  if (index === 0) return `${view.subject.rows} rows in 1 file`;
  if (index === 1) {
    if (view.stagePercents[1] === 100) return view.unmapped > 0 ? `${placedRows(view)} of ${view.subject.rows} rows placed` : `All ${view.subject.rows} rows placed`;
    return view.stagePercents[1] > 0 ? `${view.rowsMapped} of ${view.subject.rows} rows placed` : "Rows placed under this project";
  }
  return view.done ? `${placedRows(view)} records added` : "New sites, visits and records";
}

/** One line on what happened and what it means for the project. */
export function headline(view: RunView): string {
  if (!view.done) return `Step ${view.stageIndex + 1}: ${STAGES[view.stageIndex].label}`;
  if (view.failed) return `Stopped at step ${(view.failedStage ?? 0) + 1}: ${STAGES[view.failedStage ?? 0].label}. Nothing was added to this project.`;
  return view.partial ? `${placedRows(view)} of ${view.subject.rows} rows were added; ${view.unmapped} need attention` : `${placedRows(view)} records added to this project`;
}

export const isSystemFault = (view: RunView) => view.reasons.length > 0 && view.reasons.every((r) => r.kind === "system");

// ── The reasons, and what to do about them ──
// Shared by all three options: a failure has to say WHY, in the person's terms, whose it is to fix,
// and what to do next. Reasons a file can fix come with "Upload a corrected file"; a fault on our
// side comes with "Try again". The error file download is disabled until real validation writes one.
function ReasonList({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {reasons.map((reason) => (
        <li key={reason.id} className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-error-primary" />
          <div className="flex min-w-0 max-w-prose flex-col gap-0.5">
            {/* Read top to bottom: what happened, what to do, then where it is (smallest, last). */}
            <p className="m-0 text-sm font-semibold text-balance text-primary">{reason.title}</p>
            <p className="m-0 text-sm text-balance text-secondary">{reason.fix}</p>
            {reason.where && <p className="m-0 mt-0.5 text-xs text-balance break-words text-tertiary">{reason.where}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReasonActions({ view, projectId, datasetId, onRetry }: { view: RunView; projectId: string; datasetId?: string; onRetry: () => void }) {
  const roleHref = useRoleHref();
  const system = isSystemFault(view);
  return (
    // Indented by the reason icon (16px) and its gap (10px), so the buttons line up with the reason
    // text above them rather than hanging off the icon column.
    <div className="flex flex-wrap items-center gap-2 pl-6.5">
      {system ? (
        <Button color="primary" size="sm" iconLeading={RefreshCcw01} onPress={onRetry}>
          Try again
        </Button>
      ) : (
        <Button color="primary" size="sm" iconLeading={UploadCloud02} href={roleHref(`/pages/project-list/${projectId}/upload`)}>
          Upload a corrected file
        </Button>
      )}
      {/* Every ingestion that doesn't fully succeed is in Reports as well, error file included: the
          Data Ingestion Report, opened on this dataset's row when we know which one it is. */}
      <Button iconLeading={BarChart01} color="secondary" size="sm" href={roleHref(datasetId ? `/pages/reports/data-ingestion?q=${datasetId}` : "/pages/reports/data-ingestion")}>
        View in Reports
      </Button>
    </div>
  );
}

export function IngestionProblems({ view, projectId, datasetId, onRetry }: { view: RunView; projectId: string; datasetId?: string; onRetry: () => void }) {
  if (view.reasons.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <ReasonList reasons={view.reasons} />
      <ReasonActions view={view} projectId={projectId} datasetId={datasetId} onRetry={onRetry} />
    </div>
  );
}

// The gap between the chip and its popover, in the spacing scale: 2 units of the 4px base
// (spacing-2, 0.5rem). The shared Popover defaults to 4px, which reads as touching for a panel this
// size; every other dropdown keeps that default.
const POPOVER_OFFSET = 2 * 4;

// The leading spinner turns; the trailing chevron must not, so it is its own icon component
// rather than a class on every icon in the button.
function SpinningIcon(props: { className?: string }) {
  return <RefreshCcw01 {...props} className={cx(props.className, "motion-safe:animate-spin")} />;
}

// ── Option C: a chip beside the card's actions, opening the detail ──
// The quietest: one button in the identity card ("Uploading files - 62%"), the stages and files in a
// popover. Nothing changes on the page itself until it is opened, except that a failure turns the
// chip red, so it is not missed.
export function IngestionChip({
  view,
  projectId,
  datasetId,
  onRetry,
  title = "Dataset ingestion",
  datasetStatus,
}: {
  view: RunView;
  projectId: string;
  /** The dataset being ingested, so "View in Reports" opens on its row. */
  datasetId?: string;
  onRetry: () => void;
  /** The popover heading. */
  title?: string;
  /** The dataset's workflow status, when it has one: shown at the foot of the popover. */
  datasetStatus?: { label: string; color: BadgeColor<"pill-color"> };
}) {
  const status = statusOf(view);
  const percent = Math.round(view.overall * 100);
  // The percentage sits in a fixed-width slot with tabular figures, so the chip keeps one width from
  // 0% to 100% and doesn't shift as the number changes.
  const label: ReactNode = view.failed ? (
    "Not ingested"
  ) : view.done ? (
    view.partial ? (
      "Needs attention"
    ) : (
      `${placedRows(view)} records added`
    )
  ) : (
    <>
      Uploading files ·{" "}
      <span className="inline-block min-w-[4.5ch] text-left tabular-nums">{percent}%</span>
    </>
  );
  return (
    <DialogTrigger>
      {/* The chevron says the chip opens something, and turns over while it is open. */}
      <Button
        color={view.failed ? "secondary-destructive" : "secondary"}
        size="sm"
        iconLeading={view.failed ? AlertCircle : view.done ? (view.partial ? Eye : CheckCircle) : SpinningIcon}
        iconTrailing={ChevronDown}
        className="aria-expanded:[&>[data-icon=trailing]]:rotate-180 [&>[data-icon=trailing]]:transition-transform [&>[data-icon=trailing]]:duration-150 motion-reduce:[&>[data-icon=trailing]]:transition-none"
      >
        {label}
      </Button>
      <Popover size="auto" placement="bottom end" offset={POPOVER_OFFSET} className="font-barlow w-96">
        <Dialog className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-4 outline-hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-balance text-primary">{title}</p>
            <Badge size="sm" color={status.color}>
              {status.label}
            </Badge>
          </div>
          <div className="flex flex-col gap-1.5">
            <ProgressBarBase value={percent} progressClassName={view.failed ? "bg-fg-error-primary" : undefined} />
            <div className="flex items-center justify-between gap-3 text-xs text-tertiary">
              <span className="tabular-nums">{view.done ? "" : estimateOf(view)}</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
          </div>
          <Progress.IconsWithText
            type="number"
            orientation="vertical"
            size="sm"
            items={STAGES.map((stage, i) => ({
              title: stage.label,
              description: stageDetail(i, view),
              status: view.stagePercents[i] === 100 && view.failedStage !== i ? ("complete" as const) : view.stagePercents[i] > 0 ? ("current" as const) : ("incomplete" as const),
              error: view.failedStage === i || (view.partial && i === 1),
            }))}
          />
          {view.done && (view.failed || view.partial) && (
            <div className="flex flex-col gap-4 border-t border-secondary pt-4">
              <IngestionProblems view={view} projectId={projectId} datasetId={datasetId} onRetry={onRetry} />
            </div>
          )}
          <ul className="m-0 flex list-none flex-col gap-1 border-t border-secondary p-0 pt-3 text-xs text-tertiary">
            <li className="flex items-center gap-2">
              <File06 className="size-4 shrink-0 text-fg-quaternary" />
              <span className="min-w-0 flex-1 truncate" title={view.subject.fileName}>
                {view.subject.fileName}
              </span>
              <span className="shrink-0">{view.subject.rows} rows</span>
            </li>
          </ul>
          {datasetStatus && (
            <div className="flex items-center justify-between gap-3 text-xs text-tertiary">
              <span>Dataset status</span>
              <Badge size="sm" color={datasetStatus.color}>
                {datasetStatus.label}
              </Badge>
            </div>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

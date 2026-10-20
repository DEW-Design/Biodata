"use client";

// Two kinds of message about a project, named by the designer (19 Oct 2026, on an annotated screenshot): a **user alert** is specific to the person, here the flagged concepts they are
// able to review; a **system notification** is what the system has to say about the project, here the banner of uploads that failed or were partly added. The user alert is in the panel's bar,
// which had nothing at its left ("looks empty ... this could be a user-specific alert that could sit on top"), as `FlaggedAlert`; the system notification is under the tabs. (A chip beside the
// title, tried first, was retired with the other options on 19 Oct 2026.)
//
// The notices of a project (the designer, 19 Oct 2026, and his frame, Figma 484:4583, 16 Oct 2026). Two things, drawn apart (the designer, 19 Oct 2026: "Option 2 for System notice stack."):
//   - Flagged concepts are a standing review queue, not a message, so they are the user alert (`FlaggedAlert`), for the roles that manage them (`useCanReview`) and only while one is open. It opens
//     the flagged concepts.
//   - System notices are the banner for what the system has to say about the project, such as an upload that failed. In the designer's frame the banner is the first row of the
//     Overview sheet, flush with its edges, in Flinders Violet 100 with one line of medium text and a chevron; a tab with no sheet draws the same rows in a box of their own, so they
//     are there on every tab. The frame draws one banner, so the stack is this lab's: one notice is drawn as itself; two or more are one summary row ("3 notices need
//     attention: 1 failed, 2 partly added", saying what is inside, and the icon of the worst of them) that opens in place to list them, each a row that opens its dataset. Nothing is drawn while there is nothing to say (CONTRACTS 2.12).
// A system notice is one dataset of the project whose run has ended with a failure or with rows that could not be placed, the same datasets and the same outcomes as the Datasets
// view (`useProjectDatasets`, so the sample uploads of Adelaide Hills count and an upload made here joins them). The worst come first (failed, then partly added), newest first within each.
// The icon says which (an alert circle for a failure, a triangle for a partial add): the frame draws only an info icon, because its banner is a placeholder ("Banner notifications can
// go here"). A success needs no notice: the ingestion chip says it. The Prototype tools bar's "Upload result" decides how a run ends, so every case can be seen.
// A notice stays until its dataset is dealt with: the frame's banner has no close, and a failure is not resolved by dismissing it.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useId, type FC, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Flag01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { useProjectDatasets } from "@/app/pages/project-detail/datasets-view";
import { useCanReview } from "@/app/pages/project-detail/field-notes";
import { useReviewItems } from "@/app/pages/project-detail/review-view";

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-AU")} ${n === 1 ? one : many}`;

interface SystemNotice {
  datasetId: string;
  tone: "failed" | "partial";
  title: string;
  description: string;
}

const toneIcon = { failed: AlertCircle, partial: AlertTriangle } as const;
const toneClass = { failed: "text-fg-error-primary", partial: "text-fg-warning-primary" } as const;

/** The project's datasets whose run ended badly, the worst first and the newest first within each (the rows already come newest first, and a sort keeps ties in order). */
function useSystemNotices(projectId: string): SystemNotice[] {
  const notices = useProjectDatasets(projectId).flatMap(({ dataset, view }): SystemNotice[] => {
    if (!view?.done || (!view.failed && !view.partial)) return [];
    const fileName = dataset.files[0]?.name ?? dataset.id;
    if (view.failed) return [{ datasetId: dataset.id, tone: "failed", title: `${fileName} could not be added`, description: view.reasons[0]?.title ?? "Nothing was added." }];
    return [{ datasetId: dataset.id, tone: "partial", title: `${fileName} was partly added`, description: `${plural(view.unmapped, "row", "rows")} could not be placed.` }];
  });
  return notices.sort((a, b) => Number(b.tone === "failed") - Number(a.tone === "failed"));
}

/**
 * The user alert in the panel's bar: the flagged concepts open on this project, as a line of the bar's own text with a warning flag and a chevron, the whole line one button that
 * opens them. Drawn only for a role that reviews them and only while there is one, so a person with nothing to review has no alert (the bar is then only its buttons at the right).
 * The hover fill is 24px tall, like the bar's buttons, so with the bar's own 8px inset it is 8px from the top, the bottom and the left edge of the panel, and its 8px corner is concentric with the
 * panel's 16px one (CONTRACTS 2.13); 8px either side of the flag and of the chevron; white, one step lighter than the bar. It was first 4px on one side and 6px on the other in a grey lighter than the
 * bar's ("hover padding is weird as heck"), then 28px tall and 10px in, 14px from the left but 6px from the top ("still weird padding"): its insets did not agree with each other. The flag now sits 16px in
 * from the panel's edge, not 24px on the line of the content below: equal insets round the chip were chosen over that line.
 */
export function FlaggedAlert({ onPress }: { onPress: () => void }) {
  const canReview = useCanReview();
  const flagged = useReviewItems().open.length;
  if (!canReview || flagged === 0) return null;
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex h-6 min-w-0 items-center gap-2 rounded-lg px-2 text-left text-sm text-secondary outline-focus-ring transition-colors duration-100 ease-linear hover:bg-primary hover:text-primary focus-visible:outline-2"
    >
      <Flag01 aria-hidden className="size-4 shrink-0 text-fg-warning-primary" />
      <span className="truncate">
        <span className="font-medium text-primary tabular-nums">{plural(flagged, "flagged concept", "flagged concepts")}</span> {flagged === 1 ? "needs" : "need"} review in this project
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-quaternary" />
    </button>
  );
}

/**
 * One row of the banner, drawn as the designer's frame has it (Figma 484:4583): the full width of the sheet, Flinders Violet 100, 16px icon, 14px medium text and a chevron, the whole row
 * one button. A row that opens something ends in a right chevron; the summary row, which opens the list in place, ends in a down chevron that turns over while the list is open.
 */
function NoticeRow({
  icon: Icon,
  iconClass,
  children,
  onPress,
  expanded,
  controls,
}: {
  icon: FC<{ className?: string }>;
  iconClass?: string;
  children: ReactNode;
  onPress: () => void;
  /** Set on the summary row only: whether its list is open. */
  expanded?: boolean;
  controls?: string;
}) {
  const Chevron = expanded === undefined ? ChevronRight : ChevronDown;
  return (
    <button
      type="button"
      onClick={onPress}
      aria-expanded={expanded}
      aria-controls={expanded ? controls : undefined}
      className="flex w-full items-center gap-1.5 border-b border-secondary bg-flinders-violet-100 px-5 py-3 text-left outline-focus-ring last:border-b-0 hover:bg-flinders-violet-200 focus-visible:-outline-offset-2 focus-visible:outline-2"
    >
      <Icon aria-hidden className={cx("size-4 shrink-0 text-primary", iconClass)} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{children}</span>
      <Chevron aria-hidden className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150 ease-out motion-reduce:transition-none", expanded && "rotate-180")} />
    </button>
  );
}

/**
 * The system notices, or nothing. `framed` draws them as their own rounded box (the tabs that have no sheet to sit at the top of); without it they are the sheet's first rows.
 * `expanded` is kept by the page, not here, because the rows are drawn in a different place on each tab and a person who opened the list should not find it shut again.
 */
export function ProjectNotices({
  framed = false,
  expanded,
  onExpandedChange,
  onGoToDataset,
}: {
  framed?: boolean;
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  onGoToDataset: (id: string) => void;
}) {
  const { meta } = useEditStore();
  const notices = useSystemNotices(meta.id);
  const listId = useId();
  if (notices.length === 0) return null;

  const row = (n: SystemNotice) => (
    <NoticeRow key={n.datasetId} icon={toneIcon[n.tone]} iconClass={toneClass[n.tone]} onPress={() => onGoToDataset(n.datasetId)}>
      {n.title}. {n.description}
    </NoticeRow>
  );
  const worst = notices[0].tone;
  const failed = notices.filter((n) => n.tone === "failed").length;
  const partial = notices.length - failed;
  const summary = [failed > 0 && `${failed} failed`, partial > 0 && `${partial} partly added`].filter(Boolean).join(", ");
  const rows =
    notices.length === 1 ? (
      row(notices[0])
    ) : (
      <>
        <NoticeRow icon={toneIcon[worst]} iconClass={toneClass[worst]} expanded={expanded} controls={listId} onPress={() => onExpandedChange(!expanded)}>
          {notices.length} notices need attention: {summary}
        </NoticeRow>
        {expanded && (
          <div id={listId} className="flex flex-col">
            {notices.map(row)}
          </div>
        )}
      </>
    );
  return framed ? <div className="flex flex-col overflow-hidden rounded-xl border border-secondary">{rows}</div> : <div className="flex flex-col">{rows}</div>;
}

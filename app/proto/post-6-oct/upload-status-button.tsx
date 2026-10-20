"use client";

// The upload's trigger on the project bar (the designer, 19 Oct 2026: the pill that spelled out the file name and its status took too much room, "what should it be
// instead? ... this is mainly to track the progress of uploads"). One round button, the size of its neighbours (`barBtn`), that is there only while an upload runs and for a
// minute after it ends (`ProjectUploadStatus`, lab-ingestion.tsx): the upload icon inside a ring that fills as it goes; when it ends the icon and the ring say how, in an icon
// shape as well as a colour (a check for added, a triangle for partly added, an octagon alert for failed). Drawn as the designer's tweaked frame has the failed state (Figma 484:4068,
// 19 Oct 2026): a white circle, no border, a thin ring in its place that is the progress (the track at 10% of the colour), left where the run stopped when it failed, and a red
// octagon alert. Added and partly added are not in the frame and take the same ring, full. Pressed, it
// opens the same popover as the product page's chip: the stages, why it went wrong and what to do. The file name and the result are the tooltip and the accessible name.
// What is left after the minute is in the project's notices and the bell. Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { Button as AriaButton } from "react-aria-components";
import { AlertOctagon, AlertTriangle, CheckCircle, UploadCloud02 } from "@untitledui/icons";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import type { RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { barBtn } from "./panel-controls";

// The ring sits on the button's edge: 1.2px thick, so its outside is the 12px radius of the 24px circle (Figma 484:4068). The button has no border at all (`border-0`, not a
// transparent one): an absolutely placed child starts inside a border, so even a clear 1px border pushes the 24px ring 1px right and down off the circle.
const STROKE = 1.2;
const RADIUS = 12 - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type State = "running" | "added" | "partial" | "failed";

const STATES: Record<State, { icon: typeof UploadCloud02; tone: string }> = {
  running: { icon: UploadCloud02, tone: "text-fg-brand-primary hover:text-fg-brand-primary" },
  added: { icon: CheckCircle, tone: "text-fg-success-primary hover:text-fg-success-primary" },
  partial: { icon: AlertTriangle, tone: "text-fg-warning-primary hover:text-fg-warning-primary" },
  failed: { icon: AlertOctagon, tone: "text-fg-error-primary hover:text-fg-error-primary" },
};

export function UploadStatusButton({ view }: { view: RunView }) {
  const percent = Math.round(view.overall * 100);
  const state: State = !view.done ? "running" : view.failed ? "failed" : view.partial ? "partial" : "added";
  const { icon: Icon, tone } = STATES[state];
  const file = view.subject.fileName;
  const words = { running: `Uploading ${file}: ${percent}%`, added: `${file} was added`, partial: `${file} needs attention`, failed: `${file} could not be added` }[state];
  // A running upload fills the ring as it goes and a failed one keeps it where the run stopped; one that ended with the rows added fills it.
  const filled = state === "running" || state === "failed" ? view.overall : 1;
  return (
    <>
      <Tooltip title={words} placement="bottom">
        <AriaButton aria-label={words} className={cx(barBtn, "relative border-0", tone)}>
          <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 size-6 -rotate-90 fill-none stroke-current">
            <circle cx="12" cy="12" r={RADIUS} strokeWidth={STROKE} className="opacity-10" />
            <circle
              cx="12"
              cy="12"
              r={RADIUS}
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
              className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
            />
          </svg>
          <Icon aria-hidden className="size-3" />
        </AriaButton>
      </Tooltip>
      {/* A button's label changing is not announced, so the end of the run is said once, out of sight. */}
      <span role="status" className="sr-only">
        {view.done ? words : ""}
      </span>
    </>
  );
}

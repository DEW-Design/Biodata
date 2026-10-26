"use client";

// A project's records are marked by their kind only, one shape each (designer, 23 Oct 2026): a square for an event,
// a circle for an occurrence, a triangle for an observation, in the kind's colour (the records table's Record badge).
// The type is the text beside the shape ("Event-Site", "Occurrence-Population"), so no screen draws an icon per type.
// Every screen that marks a record (the records tree and table, the details panel, the full view, the review queue,
// the project's glance tiles, the records report) takes its shape from here.

import type { FC } from "react";
import { cx } from "@/utils/cx";

export type RecordKind = "event" | "occurrence" | "observation";
type Shape = FC<{ className?: string }>;

const KIND_NAME: Record<RecordKind, string> = { event: "Event", occurrence: "Occurrence", observation: "Observation" };
const KIND_FILL: Record<RecordKind, string> = {
  event: "fill-fg-brand-primary",
  occurrence: "fill-fg-success-primary",
  observation: "fill-utility-blue-500",
};

// The shape is half its box, so it sits in the space an icon of the same size would take; the box takes the
// caller's size classes, and the fill is the kind's whatever text colour the caller sets.
const shape = (kind: RecordKind, mark: React.ReactNode): Shape => {
  const KindShape: Shape = ({ className }) => (
    <span aria-hidden className={cx("inline-flex size-5 shrink-0 items-center justify-center", className)}>
      <svg viewBox="0 0 10 10" className={cx("size-1/2", KIND_FILL[kind])}>
        {mark}
      </svg>
    </span>
  );
  KindShape.displayName = `${KIND_NAME[kind]}Shape`;
  return KindShape;
};

export const EventShape = shape("event", <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" />);
export const OccurrenceShape = shape("occurrence", <circle cx="5" cy="5" r="4.75" />);
export const ObservationShape = shape("observation", <path d="M5 0.4 9.7 9.3H0.3Z" />);

const SHAPES: Record<RecordKind, Shape> = { event: EventShape, occurrence: OccurrenceShape, observation: ObservationShape };

export function kindShape(kind: RecordKind): Shape {
  return SHAPES[kind];
}

/** A record's full type, its kind first: "Event-Site", "Occurrence-Population", "Observation-Individual". */
export function typeLabel(r: { kind: RecordKind; type: string }) {
  return `${KIND_NAME[r.kind]}-${r.type}`;
}

/** What the three shapes mean, for the records tree's header. */
export function KindShapeLegend({ className }: { className?: string }) {
  return (
    <ul aria-label="Legend" className={cx("flex items-center gap-3 text-xs text-tertiary", className)}>
      {(["event", "occurrence", "observation"] as RecordKind[]).map((kind) => {
        const Shape = SHAPES[kind];
        return (
          <li key={kind} className="flex items-center gap-1">
            <Shape className="size-4" />
            {KIND_NAME[kind]}
          </li>
        );
      })}
    </ul>
  );
}

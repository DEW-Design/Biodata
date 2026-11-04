"use client";

import { Badge } from "@/components/base/badges/badges";
import { agreementStatusMeta, type AgreementStatus } from "@/app/pages/_shared/agreement-status";
import { cx } from "@/utils/cx";

// The DLA flow as a picture: each status is the real status badge, each line is a move. Laid out by hand on a 1000 by 350 grid, because the
// flow has nine statuses and is not going to grow without the designer's say; the lines are the moves of `config/workflows/dla-workflow.ts`
// and the table under it is the exact list. Pressing a status filters that table to the moves into and out of it.

const W = 1000;
const H = 350;

const NODES: Record<AgreementStatus, { x: number; y: number }> = {
  draft: { x: 60, y: 95 },
  submitted: { x: 235, y: 95 },
  under_review: { x: 430, y: 95 },
  approved: { x: 640, y: 95 },
  active: { x: 800, y: 95 },
  closed: { x: 940, y: 95 },
  on_hold: { x: 430, y: 200 },
  rejected: { x: 560, y: 200 },
  cancelled: { x: 520, y: 305 },
};

type Style = "person" | "clock" | "cancel";

interface Edge {
  key: string;
  d: string;
  label?: { text: string; x: number; y: number; anchor?: "start" | "end" | "middle" };
  style: Style;
  touches: AgreementStatus[];
  both?: boolean;
}

const EDGES: Edge[] = [
  { key: "submit", d: "M 98 95 H 183", label: { text: "Submit", x: 141, y: 83, anchor: "middle" }, style: "person", touches: ["draft", "submitted"] },
  { key: "start-review", d: "M 289 95 H 368", label: { text: "Start review", x: 329, y: 83, anchor: "middle" }, style: "person", touches: ["submitted", "under_review"] },
  { key: "approve", d: "M 492 95 H 590", label: { text: "Approve", x: 541, y: 83, anchor: "middle" }, style: "person", touches: ["under_review", "approved"] },
  { key: "auto-activate", d: "M 690 95 H 758", label: { text: "Starts", x: 724, y: 83, anchor: "middle" }, style: "clock", touches: ["approved", "active"] },
  { key: "auto-close", d: "M 842 95 H 898", label: { text: "Ends", x: 870, y: 83, anchor: "middle" }, style: "clock", touches: ["active", "closed"] },
  {
    key: "approve-active",
    d: "M 450 78 C 510 -2, 745 -2, 795 76",
    label: { text: "Approve, start date has arrived", x: 622, y: 24, anchor: "middle" },
    style: "person",
    touches: ["under_review", "active"],
  },
  { key: "hold", d: "M 430 114 V 182", label: { text: "Hold and resume", x: 420, y: 156, anchor: "end" }, style: "person", touches: ["under_review", "on_hold"], both: true },
  { key: "reject", d: "M 468 114 L 532 184", label: { text: "Reject", x: 512, y: 142, anchor: "start" }, style: "person", touches: ["under_review", "rejected"] },
  { key: "bus", d: "M 235 262 H 800", style: "cancel", touches: ["submitted", "under_review", "on_hold", "approved", "active", "cancelled"] },
  { key: "stub-submitted", d: "M 235 112 V 262", style: "cancel", touches: ["submitted", "cancelled"] },
  { key: "stub-review", d: "M 392 112 V 138 H 300 V 262", style: "cancel", touches: ["under_review", "cancelled"] },
  { key: "stub-hold", d: "M 430 218 V 262", style: "cancel", touches: ["on_hold", "cancelled"] },
  { key: "stub-approved", d: "M 660 112 V 262", style: "cancel", touches: ["approved", "cancelled"] },
  { key: "stub-active", d: "M 800 112 V 262", style: "cancel", touches: ["active", "cancelled"] },
  { key: "to-cancelled", d: "M 520 262 V 286", label: { text: "Cancel, from any state before Closed", x: 245, y: 281, anchor: "start" }, style: "cancel", touches: ["cancelled"] },
];

/** The lines each move is drawn with. A move that happens inside a status (editing, adding a location, a reminder) has none. */
export const MOVE_EDGES: Record<string, string[]> = {
  submit: ["submit"],
  "start-review": ["start-review"],
  hold: ["hold"],
  resume: ["hold"],
  approve: ["approve", "approve-active"],
  reject: ["reject"],
  cancel: ["bus", "stub-submitted", "stub-review", "stub-hold", "stub-approved", "stub-active", "to-cancelled"],
  "auto-activate": ["auto-activate"],
  "auto-close": ["auto-close"],
};

export interface Lit {
  states: AgreementStatus[];
  edges: string[];
}

/**
 * With `onSelect`, a press on a status selects it and the lines into and out of it are lit. With `lit` instead, the caller says which
 * statuses and lines to light (the Business rules tab lights what a rule governs) and the statuses are not buttons.
 */
export function FlowDiagram({ selected = null, onSelect, lit }: { selected?: AgreementStatus | null; onSelect?: (status: AgreementStatus | null) => void; lit?: Lit }) {
  const anyLit = lit ? lit.states.length + lit.edges.length > 0 : selected !== null;
  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[860px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {EDGES.map((edge) => {
            const isLit = lit ? lit.edges.includes(edge.key) : selected !== null && edge.touches.includes(selected);
            const dim = anyLit && !isLit;
            return (
              <g key={edge.key} className={cx(isLit ? "text-brand-secondary" : "text-quaternary", dim && "opacity-40", "transition-opacity duration-100")}>
                <path
                  d={edge.d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isLit ? 2 : 1.5}
                  strokeDasharray={edge.style === "clock" ? "1 5" : edge.style === "cancel" ? "6 4" : undefined}
                  strokeLinecap="round"
                  markerEnd={edge.key === "bus" || edge.key.startsWith("stub") ? undefined : "url(#flow-arrow)"}
                  markerStart={edge.both ? "url(#flow-arrow)" : undefined}
                />
                {edge.label && (
                  <text x={edge.label.x} y={edge.label.y} textAnchor={edge.label.anchor ?? "middle"} className="fill-current text-tertiary" style={{ fontSize: 12 }}>
                    {edge.label.text}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {(Object.keys(NODES) as AgreementStatus[]).map((status) => {
          const { x, y } = NODES[status];
          const isSelected = lit ? lit.states.includes(status) : selected === status;
          const position = { left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` };
          const badge = (
            <Badge type="pill-color" size="md" color={agreementStatusMeta[status].badgeColor}>
              {agreementStatusMeta[status].label}
            </Badge>
          );
          const ring = "rounded-full transition duration-100 ease-linear";
          const lifted = isSelected && "ring-2 ring-brand ring-offset-2 ring-offset-[var(--ui-bg-primary)]";
          const dimmed = anyLit && !isSelected && "opacity-40";
          return onSelect ? (
            <button
              key={status}
              type="button"
              aria-pressed={isSelected}
              aria-label={agreementStatusMeta[status].label}
              onClick={() => onSelect(isSelected ? null : status)}
              className={cx("absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2", ring, lifted)}
              style={position}
            >
              {badge}
            </button>
          ) : (
            <span key={status} className={cx("absolute -translate-x-1/2 -translate-y-1/2", ring, lifted, dimmed)} style={position}>
              {badge}
            </span>
          );
        })}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-6 gap-y-1 p-0 text-xs text-tertiary">
        <li className="flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="27" y2="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          A person makes the move
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="27" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" />
          </svg>
          The clock makes it
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="27" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
          </svg>
          Cancel
        </li>
      </ul>
    </div>
  );
}

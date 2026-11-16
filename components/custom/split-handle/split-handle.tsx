"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { cx } from "@/utils/cx";

// The handle between two panes that share a row or a column: drag it, or focus it and use the arrow keys, to give one
// pane more room and the other less; a double click puts the split back. First written inline for the project page's
// records tree and details panel (records-explorer.tsx), and made a component when Explore's map and table needed the
// same (designer, 6 Nov 2026, CONTRACTS 1.10). The handle owns the gesture; the screen owns the sizes, so each screen
// keeps its own limits and units (a percentage, a width in pixels).
//
// `orientation` is the separator's own, as ARIA has it: "vertical" is a vertical line between panes side by side
// (dragged left and right, the Left and Right keys), "horizontal" a horizontal line between panes stacked one above the
// other (dragged up and down, the Up and Down keys).

export interface SplitHandleProps {
  orientation: "vertical" | "horizontal";
  /** What it resizes, for a screen reader: "Resize the map and the table". */
  label: string;
  /** Where the split is now, in the screen's own unit (aria-valuenow). */
  value: number;
  /** The pointer, in client coordinates, on every move of a drag. */
  onMove: (pointer: { x: number; y: number }) => void;
  /** An arrow key: -1 towards the start (left or up), 1 towards the end (right or down). */
  onStep: (direction: -1 | 1) => void;
  /** A double click: the split as it starts. */
  onReset: () => void;
  className?: string;
}

export function SplitHandle({ orientation, label, value, onMove, onStep, onReset, className }: SplitHandleProps) {
  const vertical = orientation === "vertical";

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: globalThis.PointerEvent) => onMove({ x: ev.clientX, y: ev.clientY });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const back = vertical ? "ArrowLeft" : "ArrowUp";
    const forward = vertical ? "ArrowRight" : "ArrowDown";
    if (e.key !== back && e.key !== forward) return;
    e.preventDefault();
    onStep(e.key === back ? -1 : 1);
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={onReset}
      title="Drag to resize. Double-click to reset."
      className={cx(
        "group flex shrink-0 touch-none items-center justify-center outline-focus-ring focus-visible:outline-2",
        vertical ? "w-[16px] cursor-col-resize" : "h-[16px] cursor-row-resize",
        className,
      )}
    >
      <span
        className={cx(
          "rounded-full bg-[var(--ui-border-primary)] transition-colors group-hover:bg-[var(--color-brand-500)] group-focus-visible:bg-[var(--color-brand-500)]",
          vertical ? "h-12 w-1" : "h-1 w-12",
        )}
      />
    </div>
  );
}

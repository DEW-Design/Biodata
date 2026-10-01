"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { cx } from "@/utils/cx";

// Columns a person can resize, first built for Controlled Vocabulary's grids (30 Sept 2026) and
// shared so every resizable table behaves the same (Voucher Management, 1 Oct 2026: "use a resizable
// column like what we did in contrl vocab"). Composed, not a real component (CONTRACTS 1.2): the design
// system's Table (react-aria) has no column resizing.
//
// A header's right edge resizes its column: drag it, or focus it and use the arrow keys; a double click
// resets it. Widths are a personal preference, remembered in this browser per table (`storageName`)
// and per screen within it (`key`).

export interface ColumnWidthsConfig {
  /** The localStorage name the widths are kept under. */
  storageName: string;
  defaults: Record<string, number>;
  /** Used for a column with no default. */
  fallback: number;
  min: number;
  max: number;
  /** How far an arrow key moves the edge. */
  step: number;
}

export type ColumnWidths = {
  width: (id: string) => number;
  set: (id: string, px: number) => void;
  reset: (id: string) => void;
  min: number;
  max: number;
  step: number;
};

/** One width store per table; call at module level and use the hook it returns in the component. */
export function createColumnWidths(config: ColumnWidthsConfig) {
  const useStore = create<{ byKey: Record<string, Record<string, number>> }>()(
    persist(() => ({ byKey: {} as Record<string, Record<string, number>> }), {
      name: config.storageName,
      version: 0,
      storage: createJSONStorage(browserStorage),
      skipHydration: true,
      // Controlled Vocabulary kept its widths under `byVocab` before this was shared.
      merge: (persisted, current) => {
        const p = persisted as { byKey?: Record<string, Record<string, number>>; byVocab?: Record<string, Record<string, number>> } | undefined;
        return { ...current, byKey: p?.byKey ?? p?.byVocab ?? {} };
      },
    }),
  );

  return function useColumnWidths(key: string): ColumnWidths {
    useRehydrate(useStore);
    const widths = useStore((s) => s.byKey[key]) ?? {};
    const write = (next: Record<string, number>) => useStore.setState((s) => ({ byKey: { ...s.byKey, [key]: next } }));
    return {
      width: (id) => widths[id] ?? config.defaults[id] ?? config.fallback,
      set: (id, px) => write({ ...widths, [id]: Math.min(config.max, Math.max(config.min, Math.round(px))) }),
      reset: (id) => {
        const next = { ...widths };
        delete next[id];
        write(next);
      },
      min: config.min,
      max: config.max,
      step: config.step,
    };
  };
}

/** A header whose right edge resizes its column: by pointer, or by the arrow keys once focused. */
export function ResizableTh({
  id,
  label,
  required,
  widths,
  className,
  last = false,
}: {
  id: string;
  label: string;
  required?: boolean;
  widths: ColumnWidths;
  className: string;
  /** The table's last column: its handle sits inside the edge, so it never widens the table by a few pixels. */
  last?: boolean;
}) {
  const width = widths.width(id);
  const startDrag = (e: ReactPointerEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const move = (ev: PointerEvent) => widths.set(id, width + ev.clientX - x0);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <th scope="col" style={{ width }} className={cx(className, "relative")}>
      <span className="block truncate pr-2">
        {label}
        {required && <span className="text-brand-tertiary"> *</span>}
      </span>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize the ${label} column`}
        aria-valuenow={width}
        aria-valuemin={widths.min}
        aria-valuemax={widths.max}
        tabIndex={0}
        title="Drag to resize. Double-click to reset."
        onPointerDown={startDrag}
        onDoubleClick={() => widths.reset(id)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            widths.set(id, width + (e.key === "ArrowRight" ? widths.step : -widths.step));
          }
        }}
        className={cx("group absolute inset-y-0 z-1 flex w-2 cursor-col-resize touch-none justify-center outline-focus-ring focus-visible:outline-2", last ? "right-0" : "-right-1")}

      >
        <span className="my-1.5 w-px bg-[var(--ui-border-secondary)] group-hover:w-0.5 group-hover:bg-brand-solid group-focus-visible:w-0.5 group-focus-visible:bg-brand-solid" />
      </div>
    </th>
  );
}

/** The table's width: every column set, so the sized columns keep the width they're given. */
export const tableWidth = (resizable: number[], fixed: number[]) => [...resizable, ...fixed].reduce((a, b) => a + b, 0);

"use client";

import type { ReactNode } from "react";
import { ChevronRight, Maximize01, Minimize01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CountBadge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

// The chrome for the second Explore layout's results: a panel floating over the right of the map, so
// the results and the map are on one screen and a person never switches between a map view and a
// table view. It can be widened (to read a wide table) or folded to a small pill (to see the whole
// map); the map behind it keeps its state either way. `z-[1000]` - Leaflet's own panes reach ~700,
// so a plain z-50 would render under the tiles.

export function FloatingResultsPanel({
  open,
  onOpenChange,
  expanded,
  onExpandedChange,
  count,
  summary,
  actions,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** The total number of records found, shown on the panel and on the folded pill. */
  count: number;
  /** The one-line summary at the top ("38 records across 2 areas"). */
  summary: ReactNode;
  /** Small controls before the widen and fold buttons (a notice chip, Export). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="absolute top-4 right-4 z-[1000] flex cursor-pointer items-center gap-2 rounded-full border border-secondary bg-primary py-2 pr-3 pl-4 text-sm font-semibold text-primary shadow-lg outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Show results
        <CountBadge count={count} color="brand" />
      </button>
    );
  }

  return (
    <section
      aria-label="Search results"
      className={cx(
        "absolute top-4 right-4 bottom-4 z-[1000] flex flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg transition-[width] duration-200 ease-out",
        expanded ? "w-[min(1080px,calc(100%-2rem))]" : "w-[min(500px,calc(100%-2rem))]",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1 truncate text-sm text-tertiary">{summary}</div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <Button
            color="tertiary"
            size="sm"
            iconLeading={expanded ? Minimize01 : Maximize01}
            aria-label={expanded ? "Narrow the results panel" : "Widen the results panel"}
            onPress={() => onExpandedChange(!expanded)}
          />
          <Button color="tertiary" size="sm" iconLeading={ChevronRight} aria-label="Fold the results panel to see the whole map" onPress={() => onOpenChange(false)} />
        </div>
      </div>
      {children}
    </section>
  );
}

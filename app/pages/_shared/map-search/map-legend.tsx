"use client";

import { cx } from "@/utils/cx";

// The key to the coloured dots on Explore's map: one entry per colour in view, each a swatch and a
// name, so colour is never the only way to tell groups apart. One line, title first, so it takes as
// little of the map as possible (per the designer). Where the map is too narrow for one line (under
// 680px, measured against the nearest @container, the map's panel layer) it becomes a two-column
// grid under the title instead of a ragged wrap. Only what is actually on the map is
// listed. A restricted record's block gets its own row, since a flat square is not otherwise
// self-explanatory. Composed from tokens (no DEW legend component exists); it sits on the map like
// the zoom buttons and is not interactive.

export interface LegendItem {
  id: string;
  label: string;
  /** A token var, e.g. `var(--color-utility-blue-500)`. */
  color: string;
  /** Draw the swatch as a flat square, like a restricted block on the map. */
  fuzzy?: boolean;
}

export function MapLegend({ title, items, className }: { title: string; items: LegendItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div
      role="group"
      aria-label={`Map key: ${title}`}
      className={cx(
        "pointer-events-none flex max-w-full flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 shadow-sm @max-[679px]:grid @max-[679px]:grid-cols-2",
        className,
      )}
    >
      <p className="m-0 text-xs font-semibold tracking-wide whitespace-nowrap text-quaternary uppercase @max-[679px]:col-span-2">{title}</p>
      {/* `contents` so the title and every entry wrap as one row; role="list" keeps it a list for screen readers. */}
      <ul role="list" className="contents">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              aria-hidden
              className={cx("shrink-0", item.fuzzy ? "size-3.5 rounded-[2px] opacity-60" : "size-3 rounded-full ring-2 ring-[var(--ui-bg-primary)] shadow-xs")}
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-secondary">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

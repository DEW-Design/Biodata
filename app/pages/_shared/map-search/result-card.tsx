"use client";

import type { FC, ReactNode } from "react";
import { cx } from "@/utils/cx";

// One result in the floating panel's list: an icon, a title with an optional small label (a badge)
// beside it, and up to two short grey lines. The badge sits next to the name, not at the card's right
// edge: out there it widened every row and was far from the thing it qualifies. The name gives way
// (it truncates) and the badge never does. It is a button, so the whole card is the target. Hovering or
// focusing it reports up so the matching dot on the map can be highlighted (the same record, seen
// twice). The table stays the place for every column; a card is the short version.

export function ResultCard({
  icon: Icon,
  thumb,
  title,
  subtitle,
  subtitleItalic,
  meta,
  badge,
  onSelect,
  onHoverChange,
}: {
  icon: FC<{ className?: string }>;
  /** Replaces the icon, e.g. a species photo. */
  thumb?: ReactNode;
  title: string;
  subtitle?: string;
  /** Italicise the subtitle (a scientific name). */
  subtitleItalic?: boolean;
  /** A second grey line, e.g. who published the record. */
  meta?: string;
  /** A small label about the record, e.g. "Restricted", shown beside the title. */
  badge?: ReactNode;
  onSelect: () => void;
  onHoverChange?: (hovered: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      {thumb ?? <Icon className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-primary">{title}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </span>
        {subtitle && <span className={cx("truncate text-xs text-tertiary", subtitleItalic && "italic")}>{subtitle}</span>}
        {meta && <span className="truncate text-xs text-secondary">{meta}</span>}
      </div>
    </button>
  );
}

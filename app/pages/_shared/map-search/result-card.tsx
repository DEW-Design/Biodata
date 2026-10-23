"use client";

import type { FC, ReactNode } from "react";
import { FittedText } from "@/app/pages/_shared/fitted-text";
import { cx } from "@/utils/cx";

// One result in the floating panel's list: an icon, a title with an optional small label (a badge)
// beside it, and up to two short grey lines. The badge sits next to the name by default, not at the card's right
// edge: out there it widened every row and was far from the thing it qualifies. A list where every row carries a status (a severity) can put it at the right edge instead (`badgeAlign="end"`). The name gives way
// (it truncates) and the badge never does. It is a button, so the whole card is the target. Hovering or
// focusing it reports up so the matching dot on the map can be highlighted (the same record, seen
// twice). The table stays the place for every column; a card is the short version.
// Type: the title is the row's one focal point (14/500, primary), and both grey lines under it are the same supporting treatment (12/400, tertiary), as a list row's
// description is on the Projects list and Home. The meta line was one grey darker than the subtitle above it (secondary), so the lines got darker going down; the
// line that tells rows apart is the title's to carry, so the caller puts it there. A line too long for the row is cut after its last whole word that fits (`FittedText`), not mid-word.

export function ResultCard({
  icon: Icon,
  thumb,
  title,
  titleItalic,
  subtitle,
  subtitleItalic,
  meta,
  badge,
  badgeAlign = "title",
  onSelect,
  onHoverChange,
}: {
  /** The row's icon; left out where `thumb` stands in its place. */
  icon?: FC<{ className?: string }>;
  /** Replaces the icon, e.g. a species photo, or a dot in the colour its marker has on the map. */
  thumb?: ReactNode;
  title: string;
  /** Italicise the title, for a row that leads with a scientific name (as the report's Species column does). */
  titleItalic?: boolean;
  subtitle?: string;
  /** Italicise the subtitle (a scientific name). */
  subtitleItalic?: boolean;
  /** A second grey line, e.g. who published the record. */
  meta?: string;
  /** A small label about the record, e.g. "Restricted", shown beside the title. */
  badge?: ReactNode;
  /** Where the badge sits: "title" (the default) beside the name; "end" at the row's right edge, in a column the eye can run down, for a label every row has and that is read as a status (a severity), where
   *  beside the name it moved with the name's length and left the right of every row empty (the Map visualise card). */
  badgeAlign?: "title" | "end";
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
      {thumb ?? (Icon ? <Icon className="mt-0.5 size-5 shrink-0 text-fg-quaternary" /> : null)}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <FittedText text={title} className={cx("text-sm font-medium text-primary", titleItalic && "italic")} />
          {badge && <span className={cx("shrink-0", badgeAlign === "end" && "ml-auto")}>{badge}</span>}
        </span>
        {subtitle && <FittedText text={subtitle} className={cx("text-xs text-tertiary", subtitleItalic && "italic")} />}
        {meta && <FittedText text={meta} className="text-xs text-tertiary" />}
      </div>
    </button>
  );
}

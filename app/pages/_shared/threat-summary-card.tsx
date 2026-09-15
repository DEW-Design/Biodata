"use client";

import { Star01 } from "@untitledui/icons";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { PieChart, type PieSlice } from "@/app/pages/_shared/pie-chart";
import { cx } from "@/utils/cx";

// The "threat tier" card shape Flora's tab introduced first (a pie + two stat numbers + a pin
// toggle) - pulled out into its own file once Fauna needed the exact same shape with different
// data, so the card and its pinning behavior have one definition instead of two copies drifting
// apart. See flora-content.tsx / fauna-content.tsx for the real data each tab plugs in.
export interface ThreatSummary {
  title: string;
  data: PieSlice[];
  recordsLabel: string;
  records: string;
  speciesLabel: string;
  species: string;
}

// Pinning is real, local interactivity (not a fabricated "recommended for you" - there's no
// backend to personalize from yet) - a returning user can bring the threat tier they actually
// work with to the front of this row instead of re-scanning the same fixed order every visit.
export function ThreatSummaryCard({ summary, isPinned, onTogglePin }: { summary: ThreatSummary; isPinned: boolean; onTogglePin: () => void }) {
  const { title, data, recordsLabel, records, speciesLabel, species } = summary;

  return (
    <BentoCard className="flex-1">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-medium text-primary">{title}</h2>
        <button
          type="button"
          onClick={onTogglePin}
          aria-pressed={isPinned}
          aria-label={isPinned ? `Unpin ${title}` : `Pin ${title}`}
          className="relative shrink-0 rounded-md p-0.5 text-quaternary outline-brand transition-transform before:absolute before:-inset-2.5 before:content-[''] hover:text-warning-500 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.96]"
        >
          <Star01 className={cx("size-4", isPinned && "fill-warning-500 text-warning-500")} />
        </button>
      </div>
      <PieChart data={data} size={140} ariaLabel={title} />
      <div className="grid grid-cols-2 gap-4 border-t border-secondary pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-normal text-primary tabular-nums">{records}</p>
          <p className="text-xs text-tertiary">{recordsLabel}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-normal text-primary tabular-nums">{species}</p>
          <p className="text-xs text-tertiary">{speciesLabel}</p>
        </div>
      </div>
    </BentoCard>
  );
}

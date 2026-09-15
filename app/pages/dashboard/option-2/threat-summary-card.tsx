"use client";

import { Star01 } from "@untitledui/icons";
import { BentoCard } from "@/app/pages/dashboard/option-2/bento-card";
import { PieChart, type PieSlice } from "@/app/pages/dashboard/option-2/pie-chart";
import { cx } from "@/utils/cx";

// option-2's own fork of app/pages/_shared/threat-summary-card.tsx - same shape and the same real
// pinning behavior (a returning user can bring the threat tier they actually work with to the
// front of the row - no fabricated "recommended for you", there's no backend to personalize from
// yet), just built on this shell's own shadow-based BentoCard/PieChart. Extracted into its own
// file (mirroring the shared version's own file split) so Flora and Fauna's tabs share one
// definition instead of two copies drifting apart - flora-content.tsx used to have a local,
// unpinned copy of this card; that's replaced by this fork so Flora and Fauna behave identically
// on this shell, same as they already do on option-1.
export interface ThreatSummary {
  title: string;
  data: PieSlice[];
  recordsLabel: string;
  records: string;
  speciesLabel: string;
  species: string;
}

export function ThreatSummaryCard({ summary, isPinned, onTogglePin }: { summary: ThreatSummary; isPinned: boolean; onTogglePin: () => void }) {
  const { title, data, recordsLabel, records, speciesLabel, species } = summary;

  return (
    <BentoCard className="flex-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-primary">{title}</p>
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

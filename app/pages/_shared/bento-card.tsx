"use client";

import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

// The one card shell every "data block" on the Flora and Fauna Dashboard's tabs shares - border,
// radius, and padding - so metric tiles, pie charts, and the map read as one consistent grid on every
// tab (Overview, Flora, ...) instead of each tab's content inventing its own chrome. Pulled out
// of data-overview.tsx once Flora needed the same blocks, so the shell has exactly one
// definition instead of drifting between tabs - flagged directly by the user: keep the data
// blocks consistent when flicking between tabs.
export function BentoCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex flex-col gap-4 rounded-lg border border-secondary p-6", className)}>{children}</div>;
}

// `size="md"` (default) is the Flora and Fauna Dashboard's own KPI-row treatment - large centered
// number, meant to be the visual anchor of a landing tab. `size="sm"` is a second, deliberately
// smaller variant for contexts where the number is supporting detail, not the headline - e.g.
// project-detail's Overview tab, where 4 of these sitting at `md` size pushed real
// content (Data Owner, Project Manager) below the fold. Left-aligned, not centered, and noticeably
// shorter (smaller value text, tighter internal gap) - reads as a compact stat row, not a second
// KPI dashboard stacked on top of the page's actual content.
//
// Padding is still the shared `p-6` from `BentoCard` itself, not overridden down to `p-4` - a
// first attempt shrank the outer padding too, which broke the one thing every card on a page
// needs regardless of size: the same padding as its neighbours. Flagged directly by the user
// ("all cards - data and content cards" need equal padding) - the compactness here comes entirely
// from smaller content (value/label text size, gap-1 instead of gap-3), not from a smaller card
// shell, so a `sm` metric tile still lines up edge-to-edge with a `ContactCard`/`DetailSection`
// sitting next to or below it.
export function MetricCard({ value, label, size = "md" }: { value: string; label: string; size?: "md" | "sm" }) {
  if (size === "sm") {
    return (
      <BentoCard className="flex-1 gap-1">
        <p className="text-xl font-medium text-primary tabular-nums">{value}</p>
        <p className="text-xs font-medium text-tertiary">{label}</p>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="flex-1 items-center justify-center gap-3 text-center">
      <p className="text-4xl font-normal text-primary tabular-nums">{value}</p>
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    </BentoCard>
  );
}

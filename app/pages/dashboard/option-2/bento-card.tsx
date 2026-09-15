"use client";

import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

// option-2's own fork of app/pages/_shared/bento-card.tsx - same shell, different depth
// treatment. The shared version signals its edge with `border border-secondary`, a solid color
// tuned to exactly one background; every "data block" card on this shell's Data Dashboard
// (metric tiles, pie chart cards, threat-summary cards) swaps that for a shadow + translucent
// ring stack instead, so the card reads as raised rather than stamped onto the page - see the
// emil-surfaces skill's "depth without borders" principle. Forked rather than editing the shared
// file directly so option-1's Data Dashboard (same components) is untouched - user-scoped this
// polish pass to option-2 only.
export function BentoCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex flex-col gap-4 rounded-lg bg-primary p-6 shadow-sm ring-1 ring-black/5", className)}>{children}</div>;
}

export function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <BentoCard className="flex-1 items-center justify-center gap-3 text-center">
      <p className="text-4xl font-normal text-primary tabular-nums">{value}</p>
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    </BentoCard>
  );
}

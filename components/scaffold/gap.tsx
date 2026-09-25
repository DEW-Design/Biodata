import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

// The shared `?` marker (CONTRACTS.md section 1.2). When no existing component does a job, the screen
// shows this at the exact position instead of a lookalike or a silent omission. It is Scaffold
// tooling: it says "a component is missing here", and it appears in the daily audit's open-gaps
// list until a real component replaces it.
//
//   <Gap name="Date range picker" note="input-date.tsx is single-value only" />
export function Gap({ name, note, className, children }: { name: string; note?: string; className?: string; children?: ReactNode }) {
  return (
    <div role="note" aria-label={`Missing component: ${name}`} className={cx("font-sans flex items-start gap-3 rounded-lg border border-dashed border-primary bg-secondary p-3", className)}>
      <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-primary text-sm font-semibold text-tertiary">
        ?
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-semibold text-primary">{name}</p>
        {note && <p className="text-xs text-tertiary">{note}</p>}
        {children}
      </div>
    </div>
  );
}

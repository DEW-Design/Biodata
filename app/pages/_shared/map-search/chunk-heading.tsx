import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

// The name of a chunk of a map card's list, in the eyebrow layer the record summary uses (12/600, uppercase, wide tracking, quaternary), with its count after it where the chunk's count is not already on a tab. At the
// right is whatever belongs to the whole chunk: the name of the column of badges below it (Map visualise's "Severity": a lone "HIGH" is not self-explanatory, it could be priority, confidence or count), or the
// action that takes the chunk away (Explore's "Export data"). It is the first row of the list and scrolls with it. The same row heads the list in every view of a card: the same labels in the same places whichever tab is
// chosen. Documented at /patterns/map-list-card.
// A heading with a control at its right (an action, not the name of a column) is given the room for the control's target (`ghost-fill`: 40px, 10px past its line): `roomy`, so the target clears the tabs above and
// the first row below (2.16).
export function ChunkHeading({ label, count, trailing, roomy = false }: { label: string; count?: number; trailing?: ReactNode; roomy?: boolean }) {
  return (
    <h3 className={cx("m-0! flex items-center justify-between gap-3 px-3 pt-3 pb-1 text-xs! font-semibold! tracking-wide! text-quaternary! uppercase first:pt-1", roomy && "pb-2.5 first:pt-2.5")}>
      <span>
        {label}
        {count !== undefined && <span className="ml-1 tabular-nums">{count.toLocaleString("en-AU")}</span>}
      </span>
      {/* A control here takes the heading's own type (12/600, uppercase, quaternary), so the row reads as one layer, as drawn: the Button's label and icon, set once here and not at each call site (its line is 16px, so its ghost box is sized from 36px to stay 32px high like every ghost). */}
      {trailing && (
        <span className={cx("shrink-0", roomy && "[&_[data-text]]:text-xs [&_[data-text]]:font-semibold [&_[data-text]]:tracking-wide [&_[data-text]]:uppercase [&_button]:[--ghost-min:36px] [&_button]:text-quaternary")}>{trailing}</span>
      )}
    </h3>
  );
}

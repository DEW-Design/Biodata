"use client";

import type { FC, ReactNode } from "react";
import { cx } from "@/utils/cx";

// One real, shared tile component for every icon+label+count quick-filter row on the map search
// results page - the Records view's own Projects/Events/Occurrences/Observations/Artefacts
// switcher (app/pages/observations/option-1/page.tsx) and the Species view's taxonomic-group
// breakdown (species-results.tsx) used to be two hand-copied, independently-styled versions of the
// same idea; per direct feedback ("follow the same styling in the records view... make sure both
// styling are the same"), they now render through this one component so the two can never drift.
//
// Selected state is a real border-colour + light-brand-background change (`border-brand-500
// bg-brand-50`) - the same "light brand BG and border colour = brand" card-selection treatment
// already established on the signup flow's primary-affiliation cards (app/pages/auth/setup-profile)
// - not the earlier absolutely-positioned underline bar. That bar existed only to avoid a real
// border-*width* reflow bug (see the Records view's own git history) - a pure colour change never
// changes the box's own dimensions, so the bug class this component would otherwise need to guard
// against doesn't exist here: every tile keeps the same 1px border at all times, colour is the only
// thing that toggles.
//
// No outer card/border wraps a row of these - per the same feedback, the tiles are the whole
// component; a surrounding bordered container was redundant chrome around chrome.
export function MetricTile({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: FC<{ className?: string }>;
  label: string;
  value: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex flex-1 flex-col items-start gap-1 rounded-md border px-4 py-2 text-left transition-colors",
        active ? "border-brand-500 bg-brand-50" : "border-secondary bg-primary hover:bg-secondary",
      )}
    >
      <span className={cx("flex w-full items-center gap-1.5 text-sm", active ? "font-medium text-brand-tertiary" : "font-normal text-tertiary")}>
        <Icon className="size-4 shrink-0" />
        {label}
      </span>
      <span className={cx("text-lg font-medium tabular-nums", active ? "text-brand-secondary" : "text-tertiary")}>{value}</span>
    </button>
  );
}

"use client";

import { Suspense } from "react";
import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the Explore layouts being compared. Option 1 is the original flow (search on the
// map, then a results page); option 2 puts the search in column 2 and the results in a floating
// panel on the right; options 3 to 5 keep the floating search card on the left of the map and differ
// in what happens after it (see observations-search.tsx).
export type ExploreLayoutOption = "option-1" | "option-2" | "option-3" | "option-4" | "option-5";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1: search, then results page", href: "/pages/observations" },
  { id: "option-2", label: "Option 2: column search, results right", href: "/pages/observations/option-2" },
  { id: "option-3", label: "Option 3: card grows in place", href: "/pages/observations/option-3" },
  { id: "option-4", label: "Option 4: card and bottom sheet", href: "/pages/observations/option-4" },
  { id: "option-5", label: "Option 5: keyword bar and areas popover", href: "/pages/observations/option-5" },
];

// The switcher reads the role from the URL (useRoleHref), so it sits in its own Suspense boundary:
// the static export needs one around anything that calls useSearchParams.
export function ExploreLayoutSwitcher({ current }: { current: ExploreLayoutOption }) {
  return (
    <Suspense fallback={null}>
      <LayoutOptionSwitcher ariaLabel="Compare Explore layouts" options={OPTIONS} current={current} />
    </Suspense>
  );
}

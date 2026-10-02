"use client";

import { Suspense } from "react";
import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two Explore layouts. Option 1 is the floating card over the map: search areas are
// layers and the results show in the same card as you search (see observations-search.tsx). Option 2
// is the original flow (search on the map, then a results page). The two were swapped on Sept 30 2026,
// by direct instruction: the plain route now shows the floating card.
export type ExploreLayoutOption = "option-1" | "option-2";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "Floating card, areas as layers", href: "/pages/observations" },
  { id: "option-2", label: "Option 2", description: "Search, then a results page", href: "/pages/observations/option-2" },
];

// The switcher reads the role from the URL (useRoleHref), so it sits in its own Suspense boundary:
// the static export needs one around anything that calls useSearchParams.
export function ExploreLayoutSwitcher({ current }: { current: ExploreLayoutOption }) {
  return (
    <Suspense fallback={null}>
      <LayoutOptionSwitcher ariaLabel="Explore layout to show" options={OPTIONS} current={current} />
    </Suspense>
  );
}

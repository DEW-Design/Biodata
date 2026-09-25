"use client";

import { Suspense } from "react";
import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Jump between the two Explore layouts. Option 1 is the original flow (search on the map, then a
// results page); option 2 keeps the floating card over the map, treats search areas as layers and
// shows the results in the same card as you search (see observations-search.tsx).
export type ExploreLayoutOption = "option-1" | "option-2";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1: search, then results page", href: "/pages/observations" },
  { id: "option-2", label: "Option 2: floating card, areas as layers", href: "/pages/observations/option-2" },
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

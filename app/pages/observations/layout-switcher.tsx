"use client";

import { Suspense } from "react";
import { LayoutOptionSwitcher, type LayoutOption } from "@/app/pages/_shared/layout-option-switcher";

// Compare Explore's two layouts (6 Nov 2026): the map alone, as it is (option 1), and "Table toggle" (option 2), where a floating
// "Map only" / "Map and table" switch stacks the map over the Species Detail Report's table of what the search found.
// Option 1 is not changed by the comparison (4.4).
export type ExploreLayout = "option-1" | "option-2";

const OPTIONS: LayoutOption[] = [
  { id: "option-1", label: "Option 1", description: "The map alone, as it is today", href: "/pages/observations" },
  { id: "option-2", label: "Option 2", description: "Table toggle: map only, or map and table", href: "/pages/observations/option-2" },
];

// The switcher reads the role from the URL (useSearchParams), so it sits in its own Suspense boundary, as the static export needs.
export function ExploreLayoutSwitcher({ current }: { current: ExploreLayout }) {
  return (
    <Suspense fallback={null}>
      <LayoutOptionSwitcher ariaLabel="Explore layout to show" options={OPTIONS} current={current} />
    </Suspense>
  );
}

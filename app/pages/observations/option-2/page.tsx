"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, second layout: search controls in column 2, the map always in view, results in a floating
// panel over it. See observations-search.tsx.
export default function ObservationsOption2Page() {
  return (
    <>
      <ObservationsExplore layout="split" />
      <ExploreLayoutSwitcher current="option-2" />
    </>
  );
}

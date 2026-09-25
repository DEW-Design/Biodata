"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, second layout: one floating card over the map. Search areas are layers (show, hide, rename,
// resize, remove), adding one is a single menu, and the card grows a results list in place with no
// Search step. See observations-search.tsx.
export default function ObservationsOption2Page() {
  return (
    <>
      <ObservationsExplore layout="float" />
      <ExploreLayoutSwitcher current="option-2" />
    </>
  );
}

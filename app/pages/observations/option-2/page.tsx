"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, second layout: search on the map, press Search, land on a results page.
export default function ObservationsOption2Page() {
  return (
    <>
      <ObservationsExplore layout="classic" />
      <ExploreLayoutSwitcher current="option-2" />
    </>
  );
}

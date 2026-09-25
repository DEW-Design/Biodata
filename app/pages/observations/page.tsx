"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, first layout: search on the map, press Search, land on a results page. The second layout
// is at /pages/observations/option-2; the floating options control switches between them.
export default function ObservationsPage() {
  return (
    <>
      <ObservationsExplore layout="classic" />
      <ExploreLayoutSwitcher current="option-1" />
    </>
  );
}

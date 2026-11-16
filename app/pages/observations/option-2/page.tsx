"use client";

import { ObservationsExplore } from "@/app/pages/observations/observations-search";
import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";

// Explore, option 2, "Table toggle" (6 Nov 2026): option 1's map with a floating "Map only" / "Map and table" switch above the zoom
// buttons. Map and table stacks the map (search card and all) over the Species Detail Report's table of the species records the search
// found, split by the project page's handle, the table able to go full screen. See observations-search.tsx, "Table toggle".
export default function ObservationsTableTogglePage() {
  return (
    <>
      <ObservationsExplore variant="table-toggle" />
      <ExploreLayoutSwitcher current="option-2" />
    </>
  );
}

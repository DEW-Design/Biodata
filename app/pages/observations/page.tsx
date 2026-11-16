"use client";

import { ObservationsExplore } from "@/app/pages/observations/observations-search";
import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";

// Explore: one floating card over the map. Search areas are layers (show, hide, rename, resize, remove),
// adding one is a single menu, and the card grows a results list in place with no Search step. See
// observations-search.tsx. (The earlier second layout, a search and then a results page, was at
// /pages/observations/option-2 and was retired on 23 Oct 2026, CONTRACTS 4.4. The route is used again,
// from 6 Nov 2026, for "Table toggle", compared through the Layout tool.)
export default function ObservationsPage() {
  return (
    <>
      <ObservationsExplore />
      <ExploreLayoutSwitcher current="option-1" />
    </>
  );
}

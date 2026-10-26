"use client";

import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore: one floating card over the map. Search areas are layers (show, hide, rename, resize, remove),
// adding one is a single menu, and the card grows a results list in place with no Search step. See
// observations-search.tsx. (The second layout, a search and then a results page, was at
// /pages/observations/option-2 and was retired on 23 Oct 2026, CONTRACTS 4.4.)
export default function ObservationsPage() {
  return <ObservationsExplore />;
}

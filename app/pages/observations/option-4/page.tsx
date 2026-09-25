"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, option 4: A small floating setup card on the left, and a wide results sheet along the bottom (peek, half, full). See observations-search.tsx.
export default function ObservationsOption4Page() {
  return (
    <>
      <ObservationsExplore layout="float-sheet" />
      <ExploreLayoutSwitcher current="option-4" />
    </>
  );
}

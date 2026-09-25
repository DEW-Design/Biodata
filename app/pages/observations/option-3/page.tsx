"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, option 3: One floating card on the left. Once there is an area, the setup folds to chips and the same card grows a results list. See observations-search.tsx.
export default function ObservationsOption3Page() {
  return (
    <>
      <ObservationsExplore layout="float-grow" />
      <ExploreLayoutSwitcher current="option-3" />
    </>
  );
}

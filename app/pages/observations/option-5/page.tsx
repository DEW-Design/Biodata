"use client";

import { ExploreLayoutSwitcher } from "@/app/pages/observations/layout-switcher";
import { ObservationsExplore } from "@/app/pages/observations/observations-search";

// Explore, option 5: A floating keyword bar with an Areas popover; the results hang beneath it and update as you search. See observations-search.tsx.
export default function ObservationsOption5Page() {
  return (
    <>
      <ObservationsExplore layout="float-command" />
      <ExploreLayoutSwitcher current="option-5" />
    </>
  );
}

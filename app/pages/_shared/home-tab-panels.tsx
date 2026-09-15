"use client";

import { TabPanel } from "@/components/application/tabs/tabs";
import { HomeDashboardContent } from "@/app/pages/_shared/home-dashboard";
import { DataOverviewContent } from "@/app/pages/_shared/data-overview";

// Home's two TabPanels (My BioData / Flora and Fauna Dashboard). Used to also render a shared
// alert banner here (a lifted `bannerOpen` state above both panels, so dismissing it on either
// tab dismissed it on both) - removed because the banner's actual content was placeholder copy
// ("This is where alerts go") shipping as real, user-facing text on every visit to Home. Once
// there's a real alert to show, reintroduce it here (not back inside HomeDashboardContent) so the
// "one state, shown on both tabs" behaviour isn't lost again.
export function HomeTabPanels() {
  return (
    <>
      <TabPanel id="dashboard">
        <HomeDashboardContent />
      </TabPanel>
      <TabPanel id="overview">
        <DataOverviewContent />
      </TabPanel>
    </>
  );
}

"use client";

import { ArrowNarrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BentoCard, MetricCard } from "@/app/pages/_shared/bento-card";
import { MapView } from "@/app/pages/_shared/map-view";
import { PieChart, categoricalPalette, type PieSlice } from "@/app/pages/_shared/pie-chart";
import { useRoleHref } from "@/lib/use-role-href";

// The Projects tab of the Flora and Fauna Dashboard: the platform's projects as numbers and breakdowns, built the way Flora's tab
// is (flora-content.tsx), off a screenshot of the live SA Flora and Fauna Data Dashboard's Projects tab (designer, 6 Oct 2026:
// "data dashboard - project"). The figures are that screenshot's, not computed from this app's four sample projects, the same
// convention as the Overview and Flora tabs (1,435 matches the Overview's "Projects across SA"). The reference's survey-type
// slices add to 101% because it rounds each; they are shown as it shows them.
//
// Departures from the reference, on purpose:
//   - its Filters panel (Landscape SA region, National Parks and Wildlife region) is not built: nothing in this app carries a
//     region for the dashboard's totals to be filtered by, and a filter that cannot change a number would be a fabricated control
//     (CONTRACTS 0.3, 4.2d). The other tabs have no filters either;
//   - "Number of projects per mapsheet" is the same real Australian map the other tabs use, South Australia highlighted, because
//     no mapsheet boundaries are bundled (map-view.tsx says so); it is not a per-mapsheet heat map;
//   - its "Want to explore the data in more detail? Access the full Project List" is a real link to the Projects list;
//   - pie colours are the design system's (categorical palette, brand and neutral for two-slice splits), not the reference's blues.
const surveyType: PieSlice[] = [
  { label: "Fauna survey", percent: 41, color: categoricalPalette[0] },
  { label: "Flora and fauna survey", percent: 28, color: categoricalPalette[1] },
  { label: "Flora survey", percent: 26, color: categoricalPalette[2] },
  { label: "Other survey", percent: 6, color: categoricalPalette[3] },
];

const dataSensitivity: PieSlice[] = [
  { label: "Publicly available", percent: 89, color: "var(--color-utility-brand-500)" },
  { label: "Only available under licence", percent: 11, color: "var(--color-utility-neutral-500)" },
];

const dataAccessibility: PieSlice[] = [
  { label: "Projects with data entered", percent: 70, color: "var(--color-utility-brand-500)" },
  { label: "Projects without data entered", percent: 30, color: "var(--color-utility-neutral-500)" },
];

function Statement({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-4xl font-normal text-primary tabular-nums">{value}</p>
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    </div>
  );
}

export function ProjectsContent() {
  const roleHref = useRoleHref();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-col gap-4 lg:flex-1">
          <MetricCard value="1,435" label="Total number of projects" />
          <BentoCard>
            <h2 className="text-sm font-semibold text-primary">Survey type</h2>
            <PieChart data={surveyType} ariaLabel="Projects by survey type" />
          </BentoCard>
        </div>

        <BentoCard className="w-full gap-1 lg:flex-1">
          <h2 className="text-sm font-semibold text-primary">Number of projects per mapsheet</h2>
          <p className="text-xs text-tertiary">South Australia</p>
          <div className="mt-2 flex flex-1 flex-col">
            <MapView />
          </div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BentoCard className="flex-1">
          <h2 className="text-sm font-semibold text-primary">Data sensitivity</h2>
          <PieChart data={dataSensitivity} size={140} ariaLabel="Projects by data sensitivity" />
        </BentoCard>
        <BentoCard className="flex-1">
          <h2 className="text-sm font-semibold text-primary">Data accessibility</h2>
          <PieChart data={dataAccessibility} size={140} ariaLabel="Projects by whether data has been entered" />
        </BentoCard>
        <BentoCard className="flex-1 items-center justify-center gap-4">
          <Statement value="126" label="Projects have captured" />
          <Statement value="7,236" label="Photopoints at" />
          <Statement value="4,048" label="Locations" />
        </BentoCard>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tertiary">
        <p className="m-0 text-balance">Want to explore the data in more detail? Open the full Project list to view each project&apos;s metadata.</p>
        <Button color="link-color" size="sm" href={roleHref("/pages/project-list")} iconTrailing={ArrowNarrowRight}>
          Open the Project list
        </Button>
      </div>
    </div>
  );
}

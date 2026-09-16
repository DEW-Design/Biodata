"use client";

import { useState } from "react";
import { BentoCard, MetricCard } from "@/app/pages/_shared/bento-card";
import { type PieSlice, PieChart } from "@/app/pages/_shared/pie-chart";
import { MapView } from "@/app/pages/_shared/map-view";
import { ThreatSummaryCard, type ThreatSummary } from "@/app/pages/_shared/threat-summary-card";

// Fauna's real data blocks - numbers and slice breakdowns taken directly off a screenshot of the
// live SA Flora and Fauna dashboard's Fauna tab (not invented), same "honest, ground-truthed
// content" convention as Flora. Same severity/semantic color mapping convention as Flora too:
// "type" breakdown uses the same brand/sky/purple/orange/pink/slate sequence in descending percent
// order, severity breakdowns use the warning/error scale ordered by severity, and non-severity
// catch-all buckets ("Other", "Conservation dependent") get a neutral slate rather than an
// invented severity color.
const faunaTypeBreakdown: PieSlice[] = [
  { label: "Birds", percent: 65.4, color: "var(--color-utility-brand-500)" },
  { label: "Mammals", percent: 18.5, color: "var(--color-utility-sky-500)" },
  { label: "Fish", percent: 7.3, color: "var(--color-utility-purple-500)" },
  { label: "Reptiles", percent: 5.4, color: "var(--color-utility-orange-500)" },
  { label: "Amphibians", percent: 2.2, color: "var(--color-utility-pink-500)" },
  { label: "Invertebrates", percent: 1.2, color: "var(--color-utility-slate-500)" },
];

const allFaunaRecords: PieSlice[] = [
  { label: "Threatened", percent: 15.5, color: "var(--color-utility-red-500)" },
  { label: "Not threatened", percent: 84.5, color: "var(--color-utility-neutral-500)" },
];

const nationallyThreatenedFauna: PieSlice[] = [
  { label: "Vulnerable", percent: 46.8, color: "var(--color-warning-400)" },
  { label: "Endangered", percent: 19.7, color: "var(--color-warning-700)" },
  { label: "Critically endangered", percent: 1.6, color: "var(--color-error-600)" },
  { label: "Extinct", percent: 2.0, color: "var(--color-error-800)" },
  { label: "Conservation dependent", percent: 0.0, color: "var(--color-utility-slate-300)" },
  { label: "Other", percent: 29.9, color: "var(--color-utility-slate-500)" },
];

const stateThreatenedFauna: PieSlice[] = [
  { label: "Rare", percent: 34.1, color: "var(--color-warning-300)" },
  { label: "Vulnerable", percent: 35.3, color: "var(--color-warning-500)" },
  { label: "Endangered", percent: 15.3, color: "var(--color-error-600)" },
  { label: "Other", percent: 15.3, color: "var(--color-utility-slate-500)" },
];

const threatSummaries: ThreatSummary[] = [
  {
    title: "All fauna records",
    data: allFaunaRecords,
    records: "569,188",
    recordsLabel: "Threatened records",
    species: "425",
    speciesLabel: "Threatened species",
  },
  {
    title: "Nationally threatened fauna records",
    data: nationallyThreatenedFauna,
    records: "381,577",
    recordsLabel: "Nationally threatened records",
    species: "198",
    speciesLabel: "Nationally threatened species",
  },
  {
    title: "State threatened fauna records",
    data: stateThreatenedFauna,
    records: "476,834",
    recordsLabel: "State threatened records",
    species: "373",
    speciesLabel: "State threatened species",
  },
];

export function FaunaContent() {
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const orderedSummaries = [...threatSummaries].sort((a, b) => Number(pinned.has(b.title)) - Number(pinned.has(a.title)));

  const togglePin = (title: string) => {
    setPinned((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-col gap-4 lg:flex-1">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard value="3,675,692" label="Total fauna records" />
            <MetricCard value="4,170" label="Total fauna species" />
          </div>
          <BentoCard>
            <h2 className="text-sm font-medium text-primary">Fauna type</h2>
            <PieChart data={faunaTypeBreakdown} ariaLabel="Fauna records by fauna type" />
          </BentoCard>
        </div>

        <BentoCard className="w-full gap-1 lg:flex-1">
          <h2 className="text-sm font-medium text-primary">Number of fauna records per mapsheet</h2>
          <p className="text-xs text-tertiary">South Australia</p>
          <div className="mt-2 flex flex-1 flex-col">
            <MapView />
          </div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {orderedSummaries.map((summary) => (
          <ThreatSummaryCard
            key={summary.title}
            summary={summary}
            isPinned={pinned.has(summary.title)}
            onTogglePin={() => togglePin(summary.title)}
          />
        ))}
      </div>
    </div>
  );
}

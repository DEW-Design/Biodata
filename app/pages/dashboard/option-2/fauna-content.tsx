"use client";

import { useState } from "react";
import { BentoCard, MetricCard } from "@/app/pages/dashboard/option-2/bento-card";
import { PieChart, type PieSlice } from "@/app/pages/dashboard/option-2/pie-chart";
import { MapView } from "@/app/pages/dashboard/option-2/map-view";
import { ThreatSummaryCard, type ThreatSummary } from "@/app/pages/dashboard/option-2/threat-summary-card";

// option-2's own fork of app/pages/_shared/fauna-content.tsx - same real data (off the live SA
// Flora and Fauna dashboard screenshot, not invented), same severity color mapping, just built on
// this shell's own BentoCard/PieChart/ThreatSummaryCard (shadow-based cards, hoverable legends,
// pinning) instead of the shared border-card versions option-1 still uses. Forked rather than
// editing the shared file so option-1 is untouched - this mirror pass is scoped to option-2 only.
// Was previously a `TabPlaceholder` here ("hasn't been scoped yet") even though the real content
// already existed on option-1 - flagged directly by the user ("Fauna stuff hasn't come through").
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
            <p className="text-sm font-medium text-primary">Fauna type</p>
            <PieChart data={faunaTypeBreakdown} ariaLabel="Fauna records by fauna type" />
          </BentoCard>
        </div>

        <BentoCard className="w-full gap-1 lg:flex-1">
          <p className="text-sm font-medium text-primary">Number of fauna records per mapsheet</p>
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

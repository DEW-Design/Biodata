"use client";

import { useState } from "react";
import { BentoCard, MetricCard } from "@/app/pages/dashboard/option-2/bento-card";
import { PieChart, type PieSlice } from "@/app/pages/dashboard/option-2/pie-chart";
import { MapView } from "@/app/pages/dashboard/option-2/map-view";
import { ThreatSummaryCard, type ThreatSummary } from "@/app/pages/dashboard/option-2/threat-summary-card";

// option-2's own fork of app/pages/_shared/flora-content.tsx - same real data (off the live SA
// Flora and Fauna dashboard screenshot, not invented), same severity color mapping, just built on
// this shell's own BentoCard/PieChart (shadow-based cards, hoverable legends) instead of the
// shared border-card versions option-1 still uses. Forked rather than editing the shared file so
// option-1 is untouched - this polish pass is scoped to option-2 only.
const floraTypeBreakdown: PieSlice[] = [
  { label: "Vascular plants", percent: 98.2, color: "var(--color-utility-brand-500)" },
  { label: "Algae", percent: 1.3, color: "var(--color-utility-sky-500)" },
  { label: "Fungi", percent: 0.3, color: "var(--color-utility-purple-500)" },
  { label: "Lichen", percent: 0.1, color: "var(--color-utility-orange-500)" },
  { label: "Bryophytes", percent: 0.1, color: "var(--color-utility-pink-500)" },
  { label: "Other flora", percent: 0.0, color: "var(--color-utility-slate-500)" },
];

const allFloraRecords: PieSlice[] = [
  { label: "Threatened", percent: 3.6, color: "var(--color-utility-red-500)" },
  { label: "Not threatened", percent: 96.4, color: "var(--color-utility-neutral-200)" },
];

const nationallyThreatenedFlora: PieSlice[] = [
  { label: "Vulnerable", percent: 41.6, color: "var(--color-warning-400)" },
  { label: "Endangered", percent: 49.5, color: "var(--color-warning-700)" },
  { label: "Critically endangered", percent: 8.4, color: "var(--color-error-600)" },
  { label: "Extinct", percent: 0.4, color: "var(--color-error-800)" },
];

const stateThreatenedFlora: PieSlice[] = [
  { label: "Rare", percent: 50.2, color: "var(--color-warning-300)" },
  { label: "Vulnerable", percent: 19.7, color: "var(--color-warning-500)" },
  { label: "Endangered", percent: 30.1, color: "var(--color-error-600)" },
];

const threatSummaries: ThreatSummary[] = [
  {
    title: "All flora records",
    data: allFloraRecords,
    records: "113,838",
    recordsLabel: "Threatened records",
    species: "866",
    speciesLabel: "Threatened species",
  },
  {
    title: "Nationally threatened flora records",
    data: nationallyThreatenedFlora,
    records: "45,109",
    recordsLabel: "Nationally threatened records",
    species: "138",
    speciesLabel: "Nationally threatened species",
  },
  {
    title: "State threatened flora records",
    data: stateThreatenedFlora,
    records: "113,648",
    recordsLabel: "State threatened records",
    species: "854",
    speciesLabel: "State threatened species",
  },
];

export function FloraContent() {
  // Pinning was missing from this fork - the shared app/pages/_shared/flora-content.tsx it's
  // forked from already has it (same ThreatSummaryCard feature Fauna's tab also uses below), it
  // just never made it into option-2's polish pass. Added here rather than left inconsistent with
  // the new Fauna tab sitting right next to it.
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
            <MetricCard value="3,185,250" label="Total flora records" />
            <MetricCard value="9,064" label="Total flora species" />
          </div>
          <BentoCard>
            <p className="text-sm font-medium text-primary">Flora type</p>
            <PieChart data={floraTypeBreakdown} ariaLabel="Flora records by flora type" />
          </BentoCard>
        </div>

        <BentoCard className="w-full gap-1 lg:flex-1">
          <p className="text-sm font-medium text-primary">Number of flora records per mapsheet</p>
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

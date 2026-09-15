"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Generic pie chart + legend, built on Highcharts (via the official `highcharts-react-official`
// wrapper) rather than a hand-rolled SVG - every pie on the Data Dashboard (Overview's taxonomic
// breakdown, Flora's type/threat breakdowns) renders through this one component so they stay
// visually identical. Migrated off TanStack Charts to Highcharts, per the user directly - same
// external API (`PieChart`/`PieSlice`/`categoricalPalette`) so `data-overview.tsx`/
// `flora-content.tsx` didn't need any changes beyond the swapped import.
export interface PieSlice {
  label: string;
  percent: number;
  color: string;
}

// The design system's utility badge/tag palette (globals.css) - the one place this codebase
// already declares a categorical color set - sliced per chart instead of inventing hex values
// per dataset. Callers needing a semantic mapping (e.g. severity) pass their own `color` per
// slice instead of pulling from this array.
export const categoricalPalette = [
  "var(--color-utility-brand-500)",
  "var(--color-utility-sky-500)",
  "var(--color-utility-purple-500)",
  "var(--color-utility-orange-500)",
  "var(--color-utility-pink-500)",
  "var(--color-utility-yellow-500)",
  "var(--color-utility-slate-500)",
  "var(--color-utility-green-500)",
  "var(--color-utility-red-500)",
];

export function PieChart({ data, size = 200, ariaLabel }: { data: PieSlice[]; size?: number; ariaLabel: string }) {
  const options: Highcharts.Options = {
    chart: {
      type: "pie",
      height: size,
      width: size,
      backgroundColor: "transparent",
      margin: [0, 0, 0, 0],
      style: { fontFamily: "inherit" },
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { enabled: false },
    series: [
      {
        type: "pie",
        name: ariaLabel,
        data: data.map((slice) => ({ name: slice.label, y: slice.percent, color: slice.color })),
        size: "100%",
        borderWidth: 1,
        borderColor: "var(--color-bg-primary)",
        dataLabels: { enabled: false },
      },
    ],
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div style={{ height: size, width: size }} className="shrink-0" role="img" aria-label={ariaLabel}>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
      <ul className="flex w-full flex-1 flex-col gap-1.5">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
            <span className="flex-1 text-secondary">{slice.label}</span>
            <span className="tabular-nums text-tertiary">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

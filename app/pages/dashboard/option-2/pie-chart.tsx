"use client";

import { useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { cx } from "@/utils/cx";

// option-2's own fork of app/pages/_shared/pie-chart.tsx - same Highcharts-based chart, plus a
// hovered-legend-row state that dims every other slice's legend row (text-tertiary -> text-
// quaternary-ish drop) and bolds the hovered one, so the legend reads as connected to the chart
// instead of a static key sitting next to it. Forked rather than editing the shared file so
// option-1's Data Dashboard is untouched - this polish pass is scoped to option-2 only. Migrated
// off TanStack Charts to Highcharts alongside the shared file, per the user directly - same
// legend-hover behaviour carried over unchanged, only the charting engine underneath it changed.
export interface PieSlice {
  label: string;
  percent: number;
  color: string;
}

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
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

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
          <li
            key={slice.label}
            onMouseEnter={() => setHoveredLabel(slice.label)}
            onMouseLeave={() => setHoveredLabel((current) => (current === slice.label ? null : current))}
            className={cx(
              "flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors duration-100 ease-linear",
              hoveredLabel === slice.label && "bg-secondary",
            )}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
            <span className={cx("flex-1 transition-colors duration-100 ease-linear", hoveredLabel === slice.label ? "font-medium text-primary" : "text-secondary")}>
              {slice.label}
            </span>
            <span className="tabular-nums text-tertiary">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

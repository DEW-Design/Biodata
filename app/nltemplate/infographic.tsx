"use client";

import type { FC } from "react";
import { AlertTriangle, ArrowDown, BarChart01, BatteryCharging01, Eye, Globe02, Home02, LayersThree01, Lightbulb01, Lock01, Scales01, Server01, Sun, Target01, TrendUp02 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { OPPORTUNITIES, PROBLEMS, VISION } from "./newsletter-data";

// The top of the newsletter as one infographic: the vision, the problems and the opportunity areas, in the project's own words
// (newsletter-data.ts). Reviewed with the design foundations (14 Oct 2026), then made more visual at the designer's ask. The three
// bands are told apart by what they are, not by rules: the vision is the one dark band (the header's gradient), the problems sit on a
// warm tint (the system's warning scale, the colour for something that needs attention), the opportunity areas on the brand tint. A
// small arrow on each seam says the story runs down: vision, then problems, then what they open up. Each problem and each
// opportunity is a white card with an icon for what it says; the figures are set large; words in the figures are small.
// The block answers to the width it is given (container queries): at email width it is the stacked card above; from 768px it lays
// out in rows, the vision beside its objective, the five problems in one row and the six opportunity areas in one row, about 40%
// shorter. Built from the system's own pieces (FeaturedIcon, the brand and warning tints, Home's gradient and type); no slide colours
// or artwork.
const OPPORTUNITY_ICON: Record<(typeof OPPORTUNITIES)[number]["id"], FC<{ className?: string }>> = {
  development: TrendUp02,
  planning: Home02,
  extinction: BatteryCharging01,
  climate: Sun,
  epbc: Scales01,
  data: Globe02,
};

const PROBLEM_ICON: Record<string, FC<{ className?: string }>> = {
  "Biodiversity crisis": AlertTriangle,
  "Outdated technology": Server01,
  "Fragmented data": LayersThree01,
  "Limited accessibility": Lock01,
  "Growing data volume": BarChart01,
};

function BandLabel({ icon: Icon, children, className }: { icon: FC<{ className?: string }>; children: string; className?: string }) {
  return (
    <h2 className={cx("m-0 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase", className)}>
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </h2>
  );
}

/** The arrow on a seam between two bands: the story runs down. */
function Seam() {
  return (
    <span aria-hidden="true" className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
      <FeaturedIcon icon={ArrowDown} color="gray" theme="modern" size="sm" />
    </span>
  );
}

function Vision() {
  const [before, after] = VISION.objective.split(VISION.emphasis);
  return (
    <section aria-label="Vision" className="bg-brand-800 bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700 p-6 @3xl:px-10 @3xl:py-8">
      {/* Wide, the tagline and the objective sit side by side; narrow, one above the other. */}
      <div className="flex flex-col gap-4 @3xl:grid @3xl:grid-cols-[auto_1fr] @3xl:items-end @3xl:gap-12">
        <div className="flex flex-col gap-4">
          <BandLabel icon={Eye} className="text-white/80">
            Vision
          </BandLabel>
          <p className="m-0 flex flex-col text-2xl font-semibold text-white @3xl:text-3xl">
            <span>{VISION.line1}</span>
            <span className="text-brand-200">{VISION.line2}</span>
          </p>
        </div>
        <p className="m-0 text-sm text-white/80">
          <span className="font-semibold text-white">Objective: </span>
          {before}
          <span className="font-semibold text-white">{VISION.emphasis}</span>
          {after}
        </p>
      </div>
    </section>
  );
}

function Figure({ figure }: { figure: NonNullable<(typeof PROBLEMS)[number]["figure"]> }) {
  return (
    <p className="m-0 flex items-baseline whitespace-nowrap text-warning-700 tabular-nums">
      {figure.pre ? <span className="mr-1 text-sm font-medium">{figure.pre}</span> : null}
      <span className="text-2xl font-semibold">{figure.main}</span>
      {figure.post ? <span className="text-sm font-medium">{figure.post}</span> : null}
    </p>
  );
}

// A tile has no box: a rule of its band's colour along the top (the stage tracker's own idiom) and the icon, figure and words under
// it. The tint of the band does the separating; a card per item added padding and height and told the eye nothing more.
function ProblemTile({ problem }: { problem: (typeof PROBLEMS)[number] }) {
  const Icon = PROBLEM_ICON[problem.lead];
  return (
    // Narrow: the three with a figure across, the two without in a row of two. Wide: all five in one row.
    <div className={cx("flex flex-col gap-1.5 border-t-2 border-warning-300 pt-3 @3xl:col-span-1", problem.figure ? "col-span-2" : "col-span-3")}>
      <div className="flex items-center gap-2">
        <FeaturedIcon icon={Icon} color="warning" theme="light" size="sm" />
        {problem.figure ? <Figure figure={problem.figure} /> : null}
      </div>
      <h3 className="m-0 text-sm font-semibold text-primary">{problem.lead}</h3>
      <p className="m-0 text-xs text-tertiary">{problem.text}</p>
    </div>
  );
}

function Problems({ five }: { five: boolean }) {
  return (
    <section aria-label="Problems" className="relative flex flex-col gap-5 bg-warning-primary p-6 pt-8 @3xl:px-10">
      <Seam />
      <BandLabel icon={Target01} className="text-warning-700">
        Problems
      </BandLabel>
      <div className={cx("grid grid-cols-6 gap-x-5 gap-y-5 @3xl:grid-cols-5", five && "@3xl:gap-x-4")}>
        {PROBLEMS.map((p) => (
          <ProblemTile key={p.lead} problem={p} />
        ))}
      </div>
    </section>
  );
}

function Opportunities({ columns, tight }: { columns: 3 | 5 | 6; tight: boolean }) {
  return (
    <section aria-label="Opportunity areas" className="relative flex flex-col gap-5 bg-brand-50 p-6 pt-8 @3xl:px-10">
      <Seam />
      <BandLabel icon={Lightbulb01} className="text-brand-secondary">
        Opportunity areas
      </BandLabel>
      <div className={cx("grid grid-cols-3 gap-x-5 gap-y-6", columns === 5 && "@3xl:grid-cols-5", columns === 6 && "@3xl:grid-cols-6", tight && "@3xl:gap-x-4")}>
        {OPPORTUNITIES.map((o) => {
          const Icon = OPPORTUNITY_ICON[o.id];
          return (
            <div key={o.id} className="flex flex-col gap-2 border-t-2 border-brand-300 pt-3">
              <FeaturedIcon icon={Icon} color="brand" theme="light" size="sm" />
              <h3 className="m-0 text-sm font-semibold text-primary">{o.title}</h3>
              <p className="m-0 text-xs text-tertiary">{o.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The whole infographic: the block that is lifted out as the picture. */
/** `flush`: no card around the bands, so they run edge to edge of whatever holds them (option 10, where they share the page's columns). */
/** `five`: the problems' gap is 16px, the gap of a five-column page grid. `opportunityColumns`: how many the opportunity areas go across when wide (6 by default; 3 gives two rows of three, 5 puts the sixth on a row of its own). */
export function TopInfographic({ className, five = false, flush = false, opportunityColumns = 6 }: { className?: string; five?: boolean; flush?: boolean; opportunityColumns?: 3 | 5 | 6 }) {
  return (
    <div className={cx("@container overflow-hidden bg-primary", !flush && "rounded-xl border border-secondary", className)}>
      <Vision />
      <Problems five={five} />
      <Opportunities columns={opportunityColumns} tight={five} />
    </div>
  );
}

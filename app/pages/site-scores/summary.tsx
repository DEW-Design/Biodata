"use client";

// LAB: the site's scores as the scoresheet's "Total Scores for the Site" lists them (landscape context, vegetation condition,
// conservation significance, unit biodiversity, total biodiversity), and how the two products are worked out.

import { fixed2, round2 } from "./vegetation-condition";

const NP = "Not provided";

/** The scoresheet's sums, each with this site's numbers in it. */
function Sums({ rows }: { rows: { label: string; sum: string }[] }) {
  return (
    <dl className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-1 gap-0.5 text-sm @md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] @md:gap-x-4">
          <dt className="text-tertiary">{r.label}</dt>
          <dd className="text-primary tabular-nums">{r.sum}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface SiteTotals {
  /** The block's score; not provided until it is there. */
  landscape?: number;
  /** Not provided until a BCM community is chosen: there is no benchmark to score against. */
  vegetation?: number;
  conservation: number;
  sizeHa?: number;
}

export const unitScore = (t: SiteTotals) => (t.landscape == null || t.vegetation == null ? undefined : round2(t.vegetation * t.landscape * t.conservation));

/** The site's scores, as the scoresheet's "Total Scores for the Site" lists them. */
export function SiteScoreFigures({ t }: { t: SiteTotals }) {
  const unit = unitScore(t);
  const stats = [
    { label: "Landscape context score", value: t.landscape != null ? fixed2(t.landscape) : NP },
    { label: "Vegetation condition score", value: t.vegetation != null ? fixed2(t.vegetation) : NP },
    { label: "Conservation significance score", value: fixed2(t.conservation) },
    { label: "Unit biodiversity score", value: unit != null ? fixed2(unit) : NP },
    { label: "Total biodiversity score", value: unit != null && t.sizeHa != null ? fixed2(unit * t.sizeHa) : NP },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @2xl:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-balance text-tertiary">{s.label}</dt>
          <dd className={s.value === NP ? "text-sm font-medium text-quaternary" : "text-sm font-medium text-primary tabular-nums"}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TotalsBreakdown({ t }: { t: SiteTotals }) {
  const unit = unitScore(t);
  return (
    <div className="flex flex-col gap-4">
      <Sums
        rows={[
          { label: "Unit biodiversity score", sum: unit != null ? `${fixed2(t.vegetation!)} x ${fixed2(t.landscape!)} x ${fixed2(t.conservation)} = ${fixed2(unit)}` : "Not provided: it needs the vegetation condition and landscape context scores" },
          {
            label: "Total biodiversity score",
            sum:
              unit == null
                ? "Not provided: it needs the unit biodiversity score"
                : t.sizeHa != null
                  ? `${fixed2(unit)} x ${t.sizeHa} ha = ${fixed2(unit * t.sizeHa)}`
                  : "Not provided: the size of the site is not entered",
          },
        ]}
      />
      <p className="text-xs text-balance text-tertiary">
        Vegetation condition x landscape context x conservation significance, then x the site&apos;s hectares. The landscape context score is the
        block&apos;s.
      </p>
    </div>
  );
}

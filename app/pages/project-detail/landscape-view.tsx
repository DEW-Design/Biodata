"use client";

// VERSION 3: how landscape context scores and overstorey measurements read (landscape.ts).
//
// Landscape context scores follow the Figma sections (Community 1970:147553, Non-biotic 1970:146811)
// and the view reference 1970:147032: a total card on top (points of the maximum, a bar, and the
// IBRA association and subregion the location falls in), then one line per factor. Each factor
// shows what was entered or worked out, the band it fell in (a strip of every band with the
// matched one filled, so the reader sees where the value sits and what the other bands are), and the
// points it scored. The same strip and total are shown live while editing.
//
// Overstorey: canopy type and projected foliage cover (with its structural class worked out), the
// averages worked out from the readings, then the readings themselves.

import { cx } from "@/utils/cx";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { foliageCoverClass } from "./field-options";
import {
  BLOCK_BANDS,
  COVER_BANDS,
  FACTOR_TITLES,
  PROTECTED_BANDS,
  REMAINING_BANDS,
  pts,
  scoreLandscape,
  type Band,
  type FactorId,
  type FactorResult,
} from "./landscape";
import type { OverstoreyData } from "./survey-data";
import { EMPTY_VALUES } from "./field-schema";

export const FACTOR_BANDS: Partial<Record<FactorId, Band[]>> = {
  cover: COVER_BANDS,
  block: BLOCK_BANDS,
  remaining: REMAINING_BANDS,
  protected: PROTECTED_BANDS,
};

export type LandscapeScore = ReturnType<typeof scoreLandscape>;

/** The points pill beside a factor: brand when it scored, muted when it didn't. */
export function PointsPill({ points, max }: { points: number; max: number }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        points > 0
          ? "bg-brand-50 text-brand-secondary"
          : "bg-secondary text-tertiary",
      )}
      title={`${pts(points)} of ${pts(max)} points`}
    >
      {pts(points)} pts
    </span>
  );
}

/** Every band of a factor, the matched one filled. `bands` is a factor's scale; `match` its label. */
export function BandStrip({
  bands,
  match,
  compact,
}: {
  bands: Band[];
  match?: string;
  compact?: boolean;
}) {
  return (
    <ol className="flex w-full max-w-md gap-0.5" aria-label="Bands">
      {bands.map((b) => {
        const on = b.label === match;
        return (
          <li
            key={b.label}
            aria-current={on ? "true" : undefined}
            className="min-w-0 flex-1"
          >
            <span
              className={cx(
                "block h-1.5 rounded-full",
                on ? "bg-brand-solid" : "bg-tertiary",
              )}
            />
            {!compact && (
              <span
                className={cx(
                  "mt-1 block truncate text-center text-xs tabular-nums",
                  on ? "font-medium text-brand-secondary" : "text-quaternary",
                )}
              >
                {b.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** The total card: points of the maximum, a bar, and the IBRA context the location falls in. */
export function LandscapeTotal({
  score,
  live,
}: {
  score: LandscapeScore;
  live?: boolean;
}) {
  const pct = score.max > 0 ? Math.round((score.total / score.max) * 100) : 0;
  const entered = score.results.filter((r) => r.entered).length;
  // The IBRA association matters only to the factors that read it (Community); Non-biotic doesn't show it.
  const usesIbra = score.results.some(
    (r) => r.id === "remaining" || r.id === "protected",
  );
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary p-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p className="flex items-baseline gap-1.5">
          <span className="text-display-xs font-semibold text-primary tabular-nums">
            {pts(score.total)}
          </span>
          <span className="text-sm text-tertiary">
            pts of {pts(score.max)} max
          </span>
        </p>
        <p className="text-sm font-medium text-secondary tabular-nums">
          {pct}%
        </p>
      </div>
      <ProgressBarBase value={pct} />
      {usesIbra && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm @md:grid-cols-2">
          <div className="flex gap-1.5">
            <dt className="text-tertiary">IBRA association</dt>
            <dd className="text-primary">{score.ibra.association}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-tertiary">IBRA subregion</dt>
            <dd className="text-primary">{score.ibra.subregion}</dd>
          </div>
        </dl>
      )}
      <p className="text-xs text-balance text-tertiary">
        {live ? "Updates as you enter values. " : ""}
        {entered < score.results.length
          ? `${entered} of ${score.results.length} factors scored; the rest count as 0 until entered. `
          : ""}
        {usesIbra
          ? "IBRA association and subregion are worked out from the location."
          : ""}
      </p>
    </div>
  );
}

/** A factor as it reads when viewed: what was entered, its band, and its points. */
export function FactorValue({ result }: { result: FactorResult }) {
  const bands = FACTOR_BANDS[result.id];
  return (
    <span className="flex flex-col gap-2">
      <span className="flex items-start justify-between gap-3">
        <span
          className={cx(
            "text-sm",
            result.entered ? "text-primary" : "text-quaternary",
          )}
        >
          {result.detail}
        </span>
        <PointsPill points={result.points} max={result.max} />
      </span>
      {bands && result.id !== "remaining" && (
        <BandStrip bands={bands} match={result.band} />
      )}
    </span>
  );
}

export const factorLabel = (id: FactorId) => FACTOR_TITLES[id].short;

// ── Overstorey ──

const num = (v: string) =>
  EMPTY_VALUES.has(v) || v.trim() === "" ? NaN : Number(v);
const mean = (values: number[]) => {
  const ok = values.filter(Number.isFinite);
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : NaN;
};
const metres = (n: number) =>
  Number.isFinite(n) ? `${n.toFixed(1)} m` : "Not provided";

/** The overstorey averages, worked out from the readings. Crown separation ratio = average gap / average canopy diameter. */
export function overstoreyStats(o: OverstoreyData) {
  const height = mean(o.readings.map((r) => num(r.height)));
  const crownDepth = mean(o.readings.map((r) => num(r.crownDepth)));
  const canopyDiameter = mean(o.readings.map((r) => num(r.canopyDiameter)));
  const gaps = mean(o.readings.map((r) => num(r.gaps)));
  const csr =
    Number.isFinite(gaps) &&
    Number.isFinite(canopyDiameter) &&
    canopyDiameter > 0
      ? gaps / canopyDiameter
      : NaN;
  return [
    { label: "Overstorey height average", value: metres(height) },
    { label: "Crown depth average", value: metres(crownDepth) },
    { label: "Canopy diameter average", value: metres(canopyDiameter) },
    { label: "Gaps average", value: metres(gaps) },
    {
      label: "Crown separation ratio",
      value: Number.isFinite(csr) ? csr.toFixed(2) : "Not provided",
    },
    { label: "Overstorey measurement count", value: String(o.readings.length) },
  ];
}

export function foliageCoverText(v: string): string {
  const n = num(v);
  return Number.isFinite(n)
    ? `${n}% · ${foliageCoverClass(n)}`
    : "Not provided";
}

/** The worked-out averages, as a small grid of figures. */
export function OverstoreyStats({
  data,
  live,
}: {
  data: OverstoreyData;
  live?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-secondary bg-secondary p-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @md:grid-cols-3">
        {overstoreyStats(data).map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-tertiary">{s.label}</dt>
            <dd
              className={cx(
                "text-sm font-medium tabular-nums",
                s.value === "Not provided" ? "text-quaternary" : "text-primary",
              )}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-tertiary">
        {live
          ? "Worked out from the readings below as you enter them."
          : "Worked out from the readings."}
      </p>
    </div>
  );
}

export const READING_COLUMNS: {
  key: keyof OverstoreyData["readings"][number];
  label: string;
  unit?: string;
}[] = [
  { key: "height", label: "Height", unit: "m" },
  { key: "crownDepth", label: "Crown depth", unit: "m" },
  { key: "canopyDiameter", label: "Canopy diameter", unit: "m" },
  { key: "gaps", label: "Gaps", unit: "m" },
  { key: "valueType", label: "Value type" },
];
export const VALUE_TYPES = ["Measured", "Estimated"];

/** The readings, as a table. */
export function ReadingsTable({ data }: { data: OverstoreyData }) {
  if (data.readings.length === 0)
    return <p className="text-sm text-quaternary">No readings yet</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-secondary">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="px-3 py-2 text-xs font-semibold text-quaternary">
              #
            </th>
            {READING_COLUMNS.map((c) => (
              <th
                key={c.key}
                className="px-3 py-2 text-xs font-semibold whitespace-nowrap text-quaternary"
              >
                {c.label}
                {c.unit && <span className="font-normal"> ({c.unit})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.readings.map((r, i) => (
            <tr key={i} className="border-t border-secondary">
              <td className="px-3 py-2 text-quaternary tabular-nums">
                {i + 1}
              </td>
              {READING_COLUMNS.map((c) => (
                <td key={c.key} className="px-3 py-2 text-primary tabular-nums">
                  {r[c.key] || (
                    <span className="text-xs text-quaternary">
                      Not provided
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

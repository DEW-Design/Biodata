// Landscape context scores: how the land around a survey block scores, factor by factor, and the total. Only a Block event
// carries them (designer, 9 Nov 2026: "Landscape context scores will only be applicable for block type events"). The rules,
// bands, points and words are DEW's scoresheet ("Landscape Context Scores", the Bushland Assessment workbook the designer
// supplied), which replaces the Figma frames these were first read from (Community 1970:147553, Non-biotic 1970:146811).
//
// What is typed is what the sheet colours purple: percent vegetation cover (5 km radius), the block's cleared perimeter (m), and
// whether a riparian zone and a swamp or wetland are present. Everything else is worked out: the cleared perimeter to area ratio
// (the perimeter over the block's area, from its location), and the IBRA association and subregion (from the location) with their
// native vegetation remaining and protected.
//
// The total is the sheet's: every block scores at least 1 ("Blocks will score a minimum Landscape Context Score of 1"), and the
// factors' points are added to it. The sheet names the maximum 1.25; its own top bands add up to 1.27 (0.06 + 0.03 + 0.10 + 0.03
// + 0.05), which is raised with the designer. 1.25 is shown, as the sheet shows it.

import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import { ibraFor } from "./field-schema";

export type FactorId = "cover" | "block" | "remaining" | "protected" | "wetland";

/** The sheet's purple cells: what a person types. */
export interface LandscapeInputs {
  /** Percent vegetation cover within 5 km. */
  cover?: string;
  /** Cleared perimeter of the block, in metres. */
  perimeter?: string;
  riparian?: "Yes" | "No";
  swamp?: "Yes" | "No";
}

export interface Band {
  label: string;
  points: number;
  /** Is a value in this band. */
  test: (v: number) => boolean;
}

export const COVER_BANDS: Band[] = [
  { label: "0–5%", points: 0, test: (v) => v <= 5 },
  { label: ">5–10%", points: 0.02, test: (v) => v > 5 && v <= 10 },
  { label: ">10–25%", points: 0.04, test: (v) => v > 10 && v <= 25 },
  { label: ">25–50%", points: 0.06, test: (v) => v > 25 && v <= 50 },
  { label: ">50–75%", points: 0.03, test: (v) => v > 50 && v <= 75 },
  { label: ">75–100%", points: 0, test: (v) => v > 75 },
];
export const BLOCK_BANDS: Band[] = [
  { label: "<6", points: 0.03, test: (v) => v < 6 },
  { label: "6–<12", points: 0.02, test: (v) => v >= 6 && v < 12 },
  { label: "12–<18", points: 0.01, test: (v) => v >= 12 && v < 18 },
  { label: "≥18", points: 0, test: (v) => v >= 18 },
];
export const REMAINING_BANDS: Band[] = [
  { label: "0–10%", points: 0.05, test: (v) => v <= 10 },
  { label: ">10–20%", points: 0.04, test: (v) => v > 10 && v <= 20 },
  { label: ">20–30%", points: 0.03, test: (v) => v > 20 && v <= 30 },
  { label: ">30–60%", points: 0.02, test: (v) => v > 30 && v <= 60 },
  { label: ">60%", points: 0, test: (v) => v > 60 },
];
export const PROTECTED_BANDS: Band[] = [
  { label: "0–10%", points: 0.03, test: (v) => v <= 10 },
  { label: ">10–20%", points: 0.02, test: (v) => v > 10 && v <= 20 },
  { label: ">20–40%", points: 0.01, test: (v) => v > 20 && v <= 40 },
  { label: ">40%", points: 0, test: (v) => v > 40 },
];
export const RIPARIAN_POINTS = 0.02;
export const SWAMP_POINTS = 0.03;

export const FACTOR_TITLES: Record<FactorId, { title: string; short: string; subtitle: string }> = {
  cover: { title: "Percent vegetation cover", short: "Vegetation cover", subtitle: "Within 5 km radius" },
  block: { title: "Block shape", short: "Block shape", subtitle: "Cleared perimeter to area ratio (km/km²)" },
  remaining: { title: "% native veg. remaining", short: "Native veg. remaining", subtitle: "In IBRA association and subregion, both scored, then summed" },
  protected: { title: "% native veg. protected", short: "Native veg. protected", subtitle: "In IBRA association" },
  wetland: { title: "Wetland or riparian habitat", short: "Wetland / riparian", subtitle: "Presence, not extent" },
};

/** The concept the score is shown and hidden as. */
export const LANDSCAPE_SCORE_LABEL = "Landscape context score";

/** Every factor the sheet scores, in its reading order. */
export const BLOCK_FACTORS: FactorId[] = ["cover", "block", "remaining", "protected", "wetland"];
/** Every block scores at least this; the factors are added to it. */
export const LANDSCAPE_MIN = 1;
/** The maximum the sheet names. */
export const LANDSCAPE_MAX = 1.25;

// Native vegetation remaining in each IBRA association and subregion, and protected in the association. Mount Lofty Ranges and
// Aldinga (3% and 15% remaining, 8% protected) are the Figma example's values; the rest are illustrative until the real IBRA
// statistics are loaded, have no protected figure, and the association is one per subregion, for this preview only.
const REMAINING_BY_SUBREGION: Record<string, { association: string; associationPct: number; subregionPct: number; protectedPct?: number }> = {
  "Mount Lofty Ranges": { association: "Aldinga", associationPct: 3, subregionPct: 15, protectedPct: 8 },
  Fleurieu: { association: "Myponga", associationPct: 12, subregionPct: 18 },
  "Kangaroo Island": { association: "Gosse", associationPct: 48, subregionPct: 52 },
  Broughton: { association: "Clare", associationPct: 6, subregionPct: 9 },
};

export function ibraContext(lat: number, lon: number) {
  const ibra = ibraFor(lat, lon);
  const known = REMAINING_BY_SUBREGION[ibra.subregion];
  return {
    ...ibra,
    association: known?.association ?? "Not in a mapped association",
    associationPct: known?.associationPct,
    subregionPct: known?.subregionPct,
    protectedPct: known?.protectedPct,
  };
}

/** A block's area in km², from its location shape (a circle, or a polygon's shoelace area). */
export function boundaryAreaKm2(b: Boundary | null | undefined): number | undefined {
  if (!b) return undefined;
  if (b.kind === "circle") return Math.PI * b.radiusKm * b.radiusKm;
  if (b.points.length < 3) return undefined;
  const lat0 = (b.points.reduce((s, p) => s + p[0], 0) / b.points.length) * (Math.PI / 180);
  const xy = b.points.map(([lat, lon]) => [lon * 111.32 * Math.cos(lat0), lat * 110.57] as const);
  let a = 0;
  xy.forEach(([x, y], i) => {
    const [x2, y2] = xy[(i + 1) % xy.length];
    a += x * y2 - x2 * y;
  });
  return Math.abs(a) / 2;
}

const num = (v?: string) => (v == null || v.trim() === "" ? NaN : Number(v));
const bandFor = (bands: Band[], v: number) => (Number.isFinite(v) ? bands.find((b) => b.test(v)) : undefined);

export interface FactorResult {
  id: FactorId;
  points: number;
  max: number;
  /** A short read of what was entered or worked out, for the view: "10% cover". */
  detail: string;
  /** The band the value fell in, if it is a banded factor. */
  band?: string;
  entered: boolean;
}

/** Scores every factor for a record. `areaKm2` and the location come from the record. */
export function scoreLandscape(ids: FactorId[], inputs: LandscapeInputs, ctx: { lat: number; lon: number; areaKm2?: number }) {
  const ibra = ibraContext(ctx.lat, ctx.lon);
  const ratio = ctx.areaKm2 && Number.isFinite(num(inputs.perimeter)) ? num(inputs.perimeter) / 1000 / ctx.areaKm2 : NaN;
  const results: FactorResult[] = ids.map((id) => {
    if (id === "cover") {
      const v = num(inputs.cover);
      const b = bandFor(COVER_BANDS, v);
      return { id, points: b?.points ?? 0, max: 0.06, band: b?.label, entered: !!b, detail: b ? `${v}% cover` : "Not entered" };
    }
    if (id === "block") {
      const b = bandFor(BLOCK_BANDS, ratio);
      return { id, points: b?.points ?? 0, max: 0.03, band: b?.label, entered: !!b, detail: b ? `Ratio ${ratio.toFixed(2)} (${inputs.perimeter} m cleared perimeter)` : "Not entered" };
    }
    if (id === "remaining") {
      const a = bandFor(REMAINING_BANDS, ibra.associationPct ?? NaN);
      const s = bandFor(REMAINING_BANDS, ibra.subregionPct ?? NaN);
      return {
        id,
        points: (a?.points ?? 0) + (s?.points ?? 0),
        max: 0.1,
        entered: !!(a || s),
        detail: a || s ? `${ibra.association} ${ibra.associationPct ?? "?"}%, ${ibra.subregion} ${ibra.subregionPct ?? "?"}%` : "No IBRA figures for this location",
      };
    }
    if (id === "protected") {
      const v = ibra.protectedPct ?? NaN;
      const b = bandFor(PROTECTED_BANDS, v);
      return { id, points: b?.points ?? 0, max: 0.03, band: b?.label, entered: !!b, detail: b ? `${v}% protected` : "No IBRA figure for this location" };
    }
    const r = inputs.riparian === "Yes";
    const w = inputs.swamp === "Yes";
    const parts = [r && "Riparian zone", w && "Swamp or wetland"].filter(Boolean) as string[];
    return {
      id,
      points: (r ? RIPARIAN_POINTS : 0) + (w ? SWAMP_POINTS : 0),
      max: RIPARIAN_POINTS + SWAMP_POINTS,
      entered: inputs.riparian != null || inputs.swamp != null,
      detail: inputs.riparian == null && inputs.swamp == null ? "Not entered" : parts.length ? parts.join(" and ") : "Neither present",
    };
  });
  const points = results.reduce((s, f) => s + f.points, 0);
  return { results, points, total: LANDSCAPE_MIN + points, max: LANDSCAPE_MAX, ratio, ibra };
}

export const pts = (n: number) => n.toFixed(2);

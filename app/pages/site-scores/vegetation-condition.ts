// The vegetation condition score of a Bushland Assessment (BAM) site, worked out as the DEW scoresheet works it out
// ("Bushland Assessment Scoresheet", Version - 1 September 2024, sheet "Site - Scores"). Each function names the cell it
// reproduces, so a number on screen can be checked against the workbook.
//
// What is entered (the purple cells): the BCM community, the vegetation association description, the site's size, the
// cover rating of each native plant life form, the top five weeds and their cover, whether the community is naturally
// treeless, the native:exotic understorey biomass score, and (for a community with trees) four tree attributes.
// What is worked out: everything else. The number of native species and of regenerating native species are counted from
// the site's plant species list ("Site - Flora Sp."), not typed on this sheet; a weed's threat rating is looked up by the
// block's BCM region ("Weed Threat rating"); and the thresholds of each score come from the community's benchmark
// ("Benchmark"). The lookups are in bam-lookups.json, read out of the workbook unchanged.

import lookups from "./bam-lookups.json";

/** A benchmark row: 30 thresholds, workbook columns D to AG. "SNB" is Score Not Benchmarked. */
type Thresholds = (number | "SNB" | null)[];

export interface Community {
  name: string;
  treeless: boolean;
  diversity: Thresholds | null;
  weeds: Thresholds | null;
  lifeForms: Thresholds | null;
  regeneration: Thresholds | null;
}

export interface Weed {
  name: string;
  common: string;
  threat: Record<string, number | null>;
}

export const COMMUNITIES = lookups.communities as Community[];
export const WEEDS = lookups.weeds as Weed[];
export const BCM_REGIONS = lookups.regions;

/** The native plant life forms, in the scoresheet's order (G10 to G28). */
export const LIFE_FORMS = [
  "Trees > 15m",
  "Trees 5 - 15 m",
  "Trees < 5m",
  "Mallee > 5m",
  "Mallee < 5m",
  "Shrubs > 2m",
  "Shrubs 0.5 - 2m",
  "Shrubs <0.5m",
  "Forbs",
  "Mat Plants",
  "Grasses > 0.2m",
  "Grasses < 0.2m",
  "Sedges > 1m",
  "Sedges < 1m",
  "Hummock grasses",
  "Vines, scramblers",
  "Mistletoe",
  "Ferns",
  "Grass-tree",
] as const;

export interface WeedEntry {
  species?: string;
  /** Cover, 0 to 6. */
  cover?: number;
}

export interface VegetationInputs {
  community?: string;
  associationDescription?: string;
  sizeHa?: number;
  /** Cover rating by life form. */
  lifeForms: Partial<Record<(typeof LIFE_FORMS)[number], number>>;
  /** The top five weeds by cover x threat. */
  weeds: WeedEntry[];
  naturallyTreeless?: boolean;
  /** Native:exotic understorey biomass score, 0 to 5. */
  biomass?: number;
  /** Tree attributes, scored only where the community has trees. */
  fallenTimber?: number;
  hollowTrees?: number;
  matureTrees?: number;
  canopyCover?: number;
}

/** Counted from the site's plant species list (E11 and E15), not entered on the scores sheet. */
export interface SpeciesCounts {
  native: number;
  regenerating: number;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * The workbook keeps each total as it shows it, to two decimals (its cached H42 is 30.32, not 30.315), and the next cell
 * works from that: 30.32 x 66 / 80 = 25.01, x 1.17 = 29.26, x 20 = 585.20. Rounding at the same cells gives the same numbers.
 */
export const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A rising scale (E13, E17, H30): at or under the first threshold scores 0, a value inside pair k scores k, at or over
 * the threshold after the last pair scores one more. A value in a gap between pairs scores nothing, as the workbook's
 * " " does in a SUM.
 */
function risingBand(v: number, t: Thresholds, pairs: number): number | "SNB" | null {
  if (t[0] === "SNB") return "SNB";
  if (isNum(t[0]) && v <= t[0]) return 0;
  for (let k = 1; k <= pairs; k++) {
    const lo = t[2 * k - 1];
    const hi = t[2 * k];
    if (isNum(lo) && isNum(hi) && v >= lo && v <= hi) return k;
  }
  const top = t[2 * pairs + 1];
  return isNum(top) && v >= top ? pairs + 1 : null;
}

/** The weed scale (E27) falls: at or over the first threshold scores 0, the fewer weeds the higher the score, to 15. */
function fallingBand(v: number, t: Thresholds): number | null {
  if (isNum(t[0]) && v >= t[0]) return 0;
  for (let k = 1; k <= 14; k++) {
    const hi = t[2 * k - 1];
    const lo = t[2 * k];
    if (isNum(lo) && isNum(hi) && v <= hi && v >= lo) return k;
  }
  return isNum(t[29]) && v <= t[29] ? 15 : null;
}

/** A weed's threat rating in a BCM region (C21 to C25); "-" (not rated there) counts as 0 in C x I. */
export function weedThreat(species: string | undefined, region: string): number | undefined {
  if (!species) return undefined;
  const w = WEEDS.find((x) => x.name === species);
  const t = w?.threat[region];
  return isNum(t) ? t : undefined;
}

export interface Part {
  /** The attribute's score, or "SNB" where the community is not benchmarked for it. */
  score: number | "SNB";
  max: number;
  /** What the score was worked out from. */
  from: number;
}

export function scoreVegetation(inputs: VegetationInputs, counts: SpeciesCounts, region: string) {
  const community = COMMUNITIES.find((c) => c.name === inputs.community);
  const band = (b: number | "SNB" | null) => (typeof b === "number" ? b : 0);

  const diversityBand = community?.diversity ? risingBand(counts.native, community.diversity, 14) : null;
  const diversity: Part = { score: diversityBand === "SNB" ? "SNB" : band(diversityBand) * 2, max: 30, from: counts.native };

  const regenBand = community?.regeneration ? risingBand(counts.regenerating, community.regeneration, 7) : null;
  const regeneration: Part = { score: regenBand === "SNB" ? "SNB" : band(regenBand) * 1.5, max: 12, from: counts.regenerating };

  const weedRows = inputs.weeds.map((w) => {
    const threat = weedThreat(w.species, region);
    return { ...w, threat, cxi: w.species && isNum(w.cover) && isNum(threat) ? w.cover * threat : 0 };
  });
  const coverByThreat = weedRows.reduce((s, w) => s + w.cxi, 0);
  const weedBand = community?.weeds ? (community.weeds[0] === "SNB" ? null : fallingBand(coverByThreat, community.weeds)) : null;
  const weeds: Part = { score: band(weedBand), max: 15, from: coverByThreat };

  const lifeFormTotal = LIFE_FORMS.reduce((s, f) => s + (inputs.lifeForms[f] ?? 0), 0);
  const lifeBand = community?.lifeForms ? risingBand(lifeFormTotal, community.lifeForms, 9) : null;
  const lifeForms: Part = { score: lifeBand === "SNB" ? "SNB" : band(lifeBand) * 2, max: 20, from: lifeFormTotal };

  // H32, or the benchmark marks the community treeless (A77).
  const treeless = !!inputs.naturallyTreeless || !!community?.treeless;
  const biomass = inputs.biomass ?? 0;
  const num = (p: Part) => (p.score === "SNB" ? 0 : p.score);

  // H42: the positive attributes. Tree attributes count only where there are trees; a treeless community is multiplied
  // by 1.29, and one not benchmarked for regeneration by 1.24.
  const base =
    num(diversity) + num(regeneration) + num(lifeForms) + (treeless ? 0 : (inputs.fallenTimber ?? 0) + (inputs.hollowTrees ?? 0) + (inputs.matureTrees ?? 0));
  const positive = round2(base * (treeless ? 1.29 : 1) * (regeneration.score === "SNB" ? 1.24 : 1));

  // H43: the negative attributes. Treeless: (15 - weeds) + (10 - biomass x 2)² / 2; with trees the second biomass is the
  // tree canopy cover score.
  const second = treeless ? biomass : (inputs.canopyCover ?? 0);
  const negative = round2(15 - num(weeds) + (10 - biomass - second) ** 2 / 2);

  // H44.
  const score = round2(positive * ((80 - negative) / 80));

  return { community, treeless, diversity, regeneration, weeds, weedRows, lifeForms, positive, negative, score };
}

export type VegetationScore = ReturnType<typeof scoreVegetation>;

/** Two decimals, as the scoresheet shows its totals. */
export const fixed2 = (n: number) => n.toFixed(2);
/** One decimal where the scoresheet shows one (the attribute scores). */
export const fixed1 = (p: Part) => (p.score === "SNB" ? "SNB" : p.score.toFixed(1));

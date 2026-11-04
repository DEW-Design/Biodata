// The conservation significance score of a BAM site, as the scoresheet works it out (sheet "Site - Scores", I2 to N30).
//
// What is entered (the purple cells N3 to N7): whether the vegetation association is a threatened community or ecosystem,
// at each of five statuses. Only the highest one ticked counts (N8). What is worked out: the threatened flora and fauna
// counts, from the site's plant and animal species lists ("Site - Flora Sp.", "Site - Fauna Sp"), by their State (NP&W Act)
// and National (EPBC Act) ratings; a species with both is counted only for its national rating. Each count is weighted,
// the weighted total falls in a band, and the band's points are added (N18, N28). Every site scores at least 1.

export type CommunityStatus = "stateRare" | "stateVulnerable" | "stateEndangered" | "nationalVulnerable" | "nationalEndangered";

/** In the scoresheet's order (N3 to N7), with its points and wording. */
export const COMMUNITY_STATUSES: { id: CommunityStatus; label: string; points: number }[] = [
  { id: "stateRare", label: "State rare community", points: 0.1 },
  { id: "stateVulnerable", label: "State vulnerable community", points: 0.2 },
  { id: "stateEndangered", label: "State endangered community", points: 0.3 },
  { id: "nationalVulnerable", label: "Nationally vulnerable community", points: 0.35 },
  { id: "nationalEndangered", label: "Nationally endangered or critically endangered community", points: 0.4 },
];

export type SpeciesStatus = CommunityStatus;

/** Points per species of each status (N12 to N16, N22 to N26). */
export const SPECIES_STATUSES: { id: SpeciesStatus; label: string; weight: number }[] = [
  { id: "stateRare", label: "State rare", weight: 1 },
  { id: "stateVulnerable", label: "State vulnerable", weight: 2.5 },
  { id: "stateEndangered", label: "State endangered", weight: 5 },
  { id: "nationalVulnerable", label: "Nationally vulnerable", weight: 10 },
  { id: "nationalEndangered", label: "Nationally endangered or critically endangered", weight: 20 },
];

export type SpeciesCountsByStatus = Record<SpeciesStatus, number>;

export interface ConservationInputs {
  community: Partial<Record<CommunityStatus, boolean>>;
}

// N18 and N28: the weighted total's band. Fauna scores half of flora at every band.
const BANDS = [
  { label: "0", test: (v: number) => v < 1, flora: 0, fauna: 0 },
  { label: "under 2", test: (v: number) => v >= 1 && v < 2, flora: 0.04, fauna: 0.02 },
  { label: "2 to under 5", test: (v: number) => v >= 2 && v < 5, flora: 0.08, fauna: 0.04 },
  { label: "5 to under 10", test: (v: number) => v >= 5 && v < 10, flora: 0.12, fauna: 0.06 },
  { label: "10 to under 20", test: (v: number) => v >= 10 && v < 20, flora: 0.16, fauna: 0.08 },
  { label: "20 or more", test: (v: number) => v >= 20, flora: 0.2, fauna: 0.1 },
];

function threatened(counts: SpeciesCountsByStatus, kind: "flora" | "fauna") {
  const weighted = SPECIES_STATUSES.reduce((s, x) => s + counts[x.id] * x.weight, 0);
  const band = BANDS.find((b) => b.test(weighted))!;
  return { counts, weighted, band: band.label, points: band[kind], max: kind === "flora" ? 0.2 : 0.1 };
}

export function scoreConservation(inputs: ConservationInputs, flora: SpeciesCountsByStatus, fauna: SpeciesCountsByStatus) {
  // N8 reads from the highest status down, so only the highest ticked counts.
  const highest = [...COMMUNITY_STATUSES].reverse().find((s) => inputs.community[s.id]);
  const community = { status: highest, points: highest?.points ?? 0, max: 0.4 };
  const f = threatened(flora, "flora");
  const a = threatened(fauna, "fauna");
  // N30.
  const score = 1 + community.points + f.points + a.points;
  return { community, flora: f, fauna: a, score };
}

export type ConservationScore = ReturnType<typeof scoreConservation>;

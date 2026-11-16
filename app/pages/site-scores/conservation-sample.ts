import type { ConservationSheet } from "./scoresheet";

// The conservation significance score's sample answers, for the Pre-fill sample content switch on the Prototype tools bar
// (app/_prototype-tools/sample-content.ts). The designer, 10 Nov 2026: "fill every tick and count", so every one of the five community statuses
// is ticked (the sheet counts only the highest, so the others show that it does) and every one of the ten species counts is above zero, so the
// score moves from the 1.00 an empty sheet scores. The numbers are placeholders for a site's own, not a real site's.
export function sampleConservation(): ConservationSheet {
  return {
    inputs: { community: { stateRare: true, stateVulnerable: true, stateEndangered: true, nationalVulnerable: true, nationalEndangered: true } },
    flora: { stateRare: 2, stateVulnerable: 1, stateEndangered: 1, nationalVulnerable: 1, nationalEndangered: 1 },
    fauna: { stateRare: 3, stateVulnerable: 2, stateEndangered: 1, nationalVulnerable: 1, nationalEndangered: 1 },
  };
}

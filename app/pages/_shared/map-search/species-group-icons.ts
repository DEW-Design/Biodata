import type { FC } from "react";
import { Bird, Droplets, Leaf, PawPrint, Turtle } from "lucide-react";
import type { SpeciesGroup } from "./search-data";

// One icon per species group, shared by the Species tiles in Explore and the header search so a
// species looks the same everywhere. @untitledui/icons has no animal or plant glyphs (confirmed by
// search), so these come from lucide-react, the one deliberate exception to the DEW-icons-only rule
// (authorised for exactly these five). Mammal, Bird, Reptile and Plant are literal matches;
// lucide has no amphibian icon, so Droplets stands in for its defining trait (a water-dependent
// life cycle).
export const SPECIES_GROUP_ICON: Record<SpeciesGroup, FC<{ className?: string }>> = {
  Mammal: PawPrint,
  Bird,
  Reptile: Turtle,
  Amphibian: Droplets,
  Plant: Leaf,
};

// One colour per species group, for the dots on Explore's map and their legend. Real utility
// tokens (app/globals.css), chosen to be far apart in hue so five dots read as five groups; the
// legend always names each colour, so colour is never the only cue. "Other" (a Non-biotic or
// Community record, which has no species group) is neutral grey.
export const SPECIES_GROUP_COLOR: Record<SpeciesGroup, string> = {
  Mammal: "var(--color-utility-orange-500)",
  Bird: "var(--color-utility-blue-500)",
  Reptile: "var(--color-utility-purple-500)",
  Amphibian: "var(--color-utility-pink-500)",
  Plant: "var(--color-utility-green-500)",
};

export const OTHER_RECORD_COLOR = "var(--color-utility-neutral-500)";

/** Legend order: the same order as the Species tiles. */
export const SPECIES_GROUP_ORDER: SpeciesGroup[] = ["Mammal", "Bird", "Reptile", "Amphibian", "Plant"];

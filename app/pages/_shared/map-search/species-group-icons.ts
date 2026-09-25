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

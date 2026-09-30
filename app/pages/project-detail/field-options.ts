// Option lists for survey record fields: the dropdowns, multi-selects, code tables and units the
// Figma occurrence and observation frames use (file YMproGZfrFB5jUqPHPxMhk: Occurrence Individual
// 1970:145957, Occurrence Population 1970:146253, Observation Non-biotic 1970:146612, Community
// 1970:147303, Individual 1970:148058, Population 1970:148456).
//
// Figma gives each field's control ("Please Select", "3 Selected", a code with a description) but
// never its options. Every list here is illustrative until the Control Vocabulary module supplies
// the real ones; none of it is sourced. The two institution codes (SAM, AD) are the real acronyms of
// the South Australian Museum and the State Herbarium of South Australia.

import type { VocabTerm } from "./field-schema";

/** Plain dropdowns ("Please Select"). */
export const SELECT_OPTIONS: Record<string, string[]> = {
  // Occurrence
  "Taxonomic type": ["Fauna", "Flora", "Fungi"],
  "Occurrence status": ["Present", "Absent", "Present but not counted"],
  "Voucher type": ["Specimen", "Tissue sample", "Hair sample", "Photograph", "Sound recording"],
  "Institution name": ["South Australian Museum", "State Herbarium of South Australia"],
  "Institution rego #": ["Mammals", "Birds", "Herpetology", "Invertebrates", "Vascular plants"],
  // Observation: species
  Line: ["1", "2", "3", "4", "5"],
  Activity: ["Foraging", "Resting", "Calling", "Nesting", "Moving", "Digging", "Dead"],
  "Association dominance": ["Dominant", "Co-dominant", "Associated", "Emergent", "Occasional"],
  Teats: ["Not developed", "Developed", "Lactating", "Regressed"],
  Vagina: ["Closed", "Open", "Perforate"],
  "Pouch status": ["No pouch young", "Pouch young", "Lactating", "Regressed"],
  Testes: ["Abdominal", "Scrotal", "Enlarged", "Regressed"],
  // Observation: non-biotic
  "Climatic condition": ["Dry", "Average", "Wet", "Drought"],
  "Land form pattern": ["Hills", "Plains", "Rises", "Mountains", "Dunefield", "Alluvial plain"],
  "Land form element": ["Crest", "Upper slope", "Mid slope", "Lower slope", "Flat", "Drainage line"],
  "Geological surface": ["Unconsolidated", "Consolidated", "Mixed"],
  "Outcrop cover": ["None", "Less than 2%", "2 to 10%", "10 to 20%", "20 to 50%", "More than 50%"],
  "Outcrop lithology": ["Sandstone", "Siltstone", "Quartzite", "Limestone", "Granite", "Schist"],
  "Surface strew size": ["None", "Fine gravel", "Medium gravel", "Coarse gravel", "Cobbles", "Stones", "Boulders"],
  "Surface strew cover": ["None", "Less than 2%", "2 to 10%", "10 to 20%", "20 to 50%", "More than 50%"],
  "Surface strew lithology": ["Sandstone", "Siltstone", "Quartzite", "Limestone", "Granite", "Schist"],
  "Soil texture class": ["Sand", "Loamy sand", "Sandy loam", "Loam", "Clay loam", "Light clay", "Medium clay", "Heavy clay"],
  // Observation: community
  "Vegetation conditions": ["Excellent", "Good", "Moderate", "Poor", "Very poor"],
  "SA structural formation": ["Open forest", "Woodland", "Open woodland", "Tall shrubland", "Low shrubland", "Grassland", "Sedgeland"],
  "Extent of reproduction": ["None", "Scarce", "Common", "Abundant"],
  "Extent bark cracking": ["None", "Minor", "Moderate", "Severe"],
  "Leaf die off": ["None", "Minor", "Moderate", "Severe"],
  "New tip growth": ["None", "Scarce", "Common", "Abundant"],
  "Epicormic growth": ["None", "Scarce", "Common", "Abundant"],
  "Mistletoe load": ["None", "Light", "Moderate", "Heavy"],
  "Leaf damage": ["None", "Minor", "Moderate", "Severe"],
};

/** Multi-selects ("3 Selected"). People come from the observer list. */
export const MULTI_OPTIONS: Record<string, string[]> = {
  "Animal life stage": ["Egg", "Juvenile", "Sub-adult", "Adult"],
  "Plant life stage": ["Seedling", "Juvenile", "Mature", "Flowering", "Fruiting", "Senescent"],
};
export const PEOPLE_FIELDS = new Set(["Recorded by", "Determiners"]);

/** Code and description ("-" with a disabled description box), like Location method. */
export const CODE_VOCABS: Record<string, VocabTerm[]> = {
  "Life form": [
    { code: "T", description: "Tree" },
    { code: "M", description: "Mallee" },
    { code: "S", description: "Shrub" },
    { code: "G", description: "Grass" },
    { code: "H", description: "Herb" },
    { code: "V", description: "Vertebrate animal" },
  ],
  "Collection method": [
    { code: "OBS", description: "Seen" },
    { code: "HRD", description: "Heard" },
    { code: "CAP", description: "Captured and released" },
    { code: "TRK", description: "Tracks or signs" },
    { code: "COL", description: "Collected" },
  ],
  Strata: [
    { code: "U", description: "Upper stratum" },
    { code: "M", description: "Mid stratum" },
    { code: "G", description: "Ground stratum" },
  ],
  "Macro habitat": [
    { code: "WD", description: "Woodland" },
    { code: "SH", description: "Shrubland" },
    { code: "RP", description: "Riparian" },
    { code: "GR", description: "Grassland" },
  ],
  "Micro habitat": [
    { code: "LL", description: "Leaf litter" },
    { code: "LG", description: "Fallen log" },
    { code: "RK", description: "Under rock" },
    { code: "CA", description: "Canopy" },
    { code: "BK", description: "Bark" },
  ],
  Sex: [
    { code: "M", description: "Male" },
    { code: "F", description: "Female" },
    { code: "U", description: "Unknown" },
  ],
  "Cover/abundance": [
    { code: "1", description: "Less than 5%, few individuals" },
    { code: "2", description: "Less than 5%, many individuals" },
    { code: "3", description: "5 to 25%" },
    { code: "4", description: "25 to 50%" },
    { code: "5", description: "More than 50%" },
  ],
  "Muir code": [
    { code: "LA", description: "Low woodland A" },
    { code: "LB", description: "Low woodland B" },
    { code: "SA", description: "Shrubland A" },
    { code: "SB", description: "Shrubland B" },
  ],
  "Canopy code": [
    { code: "d", description: "Dense" },
    { code: "c", description: "Mid-dense" },
    { code: "i", description: "Sparse" },
    { code: "r", description: "Very sparse" },
  ],
  "Disturbance code": [
    { code: "FI", description: "Fire" },
    { code: "GZ", description: "Grazing" },
    { code: "WE", description: "Weeds" },
    { code: "TR", description: "Tracks and roads" },
    { code: "CL", description: "Clearing" },
  ],
  "Upper stratum code": [
    { code: "EOB", description: "Eucalyptus obliqua" },
    { code: "ELE", description: "Eucalyptus leucoxylon" },
    { code: "ECA", description: "Eucalyptus camaldulensis" },
  ],
};

/** Which code list a code-and-description field uses (the field label and the list name differ). */
export const CODE_FIELDS: Record<string, string> = {
  "Life form & desc": "Life form",
  "Collection method & desc": "Collection method",
  "Strata & desc": "Strata",
  "Macro habitat & desc": "Macro habitat",
  "Micro habitat & desc": "Micro habitat",
  Sex: "Sex",
  "Cover/abundance & desc": "Cover/abundance",
};

/**
 * Repeatable rows of codes ("Add another"): each column is a code from a list (its description
 * shown beside it, read only) or a plain choice (Status).
 */
export interface CodeColumn {
  label: string;
  /** A code list from CODE_VOCABS. */
  vocab?: string;
  /** A plain choice instead. */
  options?: string[];
}
export const CODE_TABLES: Record<string, CodeColumn[]> = {
  // Non-biotic's disturbance impact is recorded with Muir and canopy codes.
  "Disturbance impact (Muir)": [
    { label: "Muir code", vocab: "Muir code" },
    { label: "Canopy code", vocab: "Canopy code" },
  ],
  "Disturbance impact": [
    { label: "Code", vocab: "Disturbance code" },
    { label: "Status", options: ["Active", "Recent", "Old", "Unknown"] },
  ],
  "Assemblage information": [
    { label: "Muir code", vocab: "Muir code" },
    { label: "Canopy code", vocab: "Canopy code" },
  ],
  "Upper stratum (code & desc)": [{ label: "Code", vocab: "Upper stratum code" }],
};

/** A number with a unit picked from a short list ("Value" and "Unit" in Figma). */
export const NUMBER_UNITS: Record<string, string[]> = {
  "Air temperature (max)": ["°C", "°F"],
  "Air temperature (min)": ["°C", "°F"],
  "No. in pouch": ["young", "embryos"],
};

/** Measurement types and units for Individual observations (a type, a value and a unit). */
export const MEASUREMENT_TYPES = [
  "Body mass",
  "Head-body length",
  "Tail length",
  "Pes length",
  "Ear length",
  "Snout-vent length",
  "Wing length",
  "Distance from observer",
  "Height in tree",
  "Eyeshine distance",
  "Reproductive condition",
  "Body condition",
  "Activity",
];
export const MEASUREMENT_UNITS = ["g", "kg", "mm", "cm", "m", "No unit"];

/** Voucher numbers are shown with the institution's prefix: "SAM 24518". */
export const INSTITUTION_PREFIX: Record<string, string> = {
  "South Australian Museum": "SAM",
  "State Herbarium of South Australia": "AD",
};

/** Canopy type (my proposal: Figma names the field but gives no control). */
export const CANOPY_TYPES = ["Tree", "Mallee", "Tall shrub", "Shrub", "Grass", "Sedge"];

/**
 * Projected foliage cover class, worked out from the percentage (Specht's structural classes).
 * Shown beside the number, like other calculated values.
 */
export function foliageCoverClass(pct: number): string {
  if (!Number.isFinite(pct)) return "";
  if (pct > 70) return "Closed (more than 70%)";
  if (pct > 30) return "Mid-dense (30 to 70%)";
  if (pct >= 10) return "Sparse (10 to 30%)";
  return "Very sparse (less than 10%)";
}

/** Crown extent and crown density scores from their percentages (0 to 5, tree condition style). */
export function crownScore(pct: number): string {
  if (!Number.isFinite(pct)) return "Not provided";
  if (pct === 0) return "0 · None";
  if (pct <= 10) return "1 · 1 to 10%";
  if (pct <= 25) return "2 · 11 to 25%";
  if (pct <= 50) return "3 · 26 to 50%";
  if (pct <= 75) return "4 · 51 to 75%";
  return "5 · 76 to 100%";
}

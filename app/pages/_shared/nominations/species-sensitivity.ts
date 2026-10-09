import type { BadgeColors } from "@/components/base/badges/badge-types";
import { REGISTRATION_SPECIES } from "@/app/pages/project-registration/data";
import { NOMINATION_ATTRIBUTES, attributeLabel, attributeValueLabel, type NominationArea, type NominationAttribute } from "@/app/pages/_shared/nominations/nomination-data";

// Species sensitivity: the BioData Super Admin's configuration of each species' data release risk and user access level
// (Nominations version 2, the designer, 9 Oct 2026). Both scales come from the DEW "Risk Ratings and Treatments" and "Users
// Access Permissions" figures the designer shared (Figures 2 to 7):
//   - Data release risk: Negligible (open data), Low (coordinates obscured to 1 km2), Medium (10 km2), High (embargoed or
//     withheld), Extreme (no access). Low and Medium also generalise the location text.
//   - User access level: who sees the records as held. Level 1 Public, Level 2 DLA, Level 3 Government, Level 4 Admin only.
// A rating covers the whole species, or only some of its attributes, each with its value: Location as the areas it applies in
// ("a particular species in a particular location only", the designer), Activity as Nesting, and so on. The attributes are the
// nomination's (Location as areas, then the Occurrence and Observation fields of the project form), and so is the editor
// (`ConceptRows`, `AreasEditor`). Attributes not listed stay open. Every species starts at Negligible and Level 1.
//
// The access rule (the designer, 9 Oct 2026): each risk has a standard level, the lowest that may see the data as held
// (`STANDARD_ACCESS`). The level can be set higher than the standard, never lower: a lower one would show as held what the
// risk says to obscure or withhold.

export type ReleaseRisk = "negligible" | "low" | "medium" | "high" | "extreme";
export type AccessLevel = "level-1" | "level-2" | "level-3" | "level-4";

export const RELEASE_RISK_ORDER: ReleaseRisk[] = ["negligible", "low", "medium", "high", "extreme"];
export const ACCESS_LEVEL_ORDER: AccessLevel[] = ["level-1", "level-2", "level-3", "level-4"];

/** Badges follow the pyramid's bands (blues, orange, red). Negligible is gray, not green: it is the default for nearly every
 *  species, and a list of thousands of green badges would hide the few that are rated. */
export const releaseRiskMeta: Record<ReleaseRisk, { label: string; short: string; treatment: string; badgeColor: BadgeColors }> = {
  negligible: { label: "Negligible", short: "Open data", treatment: "Open data", badgeColor: "gray" },
  low: { label: "Low", short: "Obfuscated 1 km²", treatment: "Coordinates obfuscated to 1 km², location text generalised", badgeColor: "sky" },
  medium: { label: "Medium", short: "Obfuscated 10 km²", treatment: "Coordinates obfuscated to 10 km², location text generalised", badgeColor: "blue" },
  high: { label: "High", short: "Embargo / withheld", treatment: "Embargoed or withheld data", badgeColor: "orange" },
  extreme: { label: "Extreme", short: "No access", treatment: "No access", badgeColor: "error" },
};

export const accessLevelMeta: Record<AccessLevel, { label: string; who: string }> = {
  "level-1": { label: "Level 1 - Public", who: "everyone, signed in or not" },
  "level-2": { label: "Level 2 - DLA", who: "registered users with a Data Licence Agreement" },
  "level-3": { label: "Level 3 - Government", who: "DEW staff and agencies with a Data Sharing Agreement" },
  "level-4": { label: "Level 4 - Admin only", who: "BioData administrators" },
};

/** The lowest access level that may see each risk's data as held. */
export const STANDARD_ACCESS: Record<ReleaseRisk, AccessLevel> = {
  negligible: "level-1",
  low: "level-2",
  medium: "level-2",
  high: "level-3",
  extreme: "level-4",
};

/** Whether a level may be chosen for a risk: the standard level or higher, never lower. */
export const isAccessAllowed = (risk: ReleaseRisk, access: AccessLevel) => ACCESS_LEVEL_ORDER.indexOf(access) >= ACCESS_LEVEL_ORDER.indexOf(STANDARD_ACCESS[risk]);

/** The attributes a rating can be limited to: the nomination's, without "Other" (a rule needs a field BioData holds). */
export const SENSITIVITY_ATTRIBUTES = NOMINATION_ATTRIBUTES.filter((c) => c.id !== "other");

/** "Location: Coorong National Park", "Activity: Nesting". */
export function ruleLabel(a: NominationAttribute): string {
  const value = a.attribute === "location" ? a.areas.map((x) => x.name).join(", ") : attributeValueLabel(a);
  return value ? `${attributeLabel(a)}: ${value}` : attributeLabel(a);
}

export interface Rating {
  risk: ReleaseRisk;
  access: AccessLevel;
}

/** An attribute and its value (the nomination's stored row, areas included), with the rating that applies to it. */
export type AttributeRating = NominationAttribute & Rating;

export interface SpeciesRating extends Rating {
  /** "species": `risk` and `access` cover all of its data. "attributes": only the listed attributes are rated. */
  appliesTo: "species" | "attributes";
  attributes: AttributeRating[];
}

export const OPEN: Rating = { risk: "negligible", access: "level-1" };
export const DEFAULT_RATING: SpeciesRating = { appliesTo: "species", ...OPEN, attributes: [] };

/** One saved change to a species' rating, newest last. */
export interface RatingChange {
  speciesId: string;
  rating: SpeciesRating;
  at: string;
  by: string;
  note?: string;
}

/** The highest risk and level a rating applies anywhere: what the list shows and sorts by. */
export function ratingSummary(r: SpeciesRating): Rating {
  if (r.appliesTo === "species" || r.attributes.length === 0) return { risk: r.risk, access: r.access };
  const top = <T,>(order: T[], values: T[]) => order[Math.max(...values.map((v) => order.indexOf(v)))];
  return { risk: top(RELEASE_RISK_ORDER, r.attributes.map((a) => a.risk)), access: top(ACCESS_LEVEL_ORDER, r.attributes.map((a) => a.access)) };
}

export function appliesToLabel(r: SpeciesRating): string {
  if (r.appliesTo === "species") return "Whole species";
  return r.attributes.map(ruleLabel).join("; ");
}

/** The species listed: every species in the shared dataset (21 in this preview; about 15,000 in BioData). */
export const SENSITIVITY_SPECIES = REGISTRATION_SPECIES;

export const speciesSlug = (id: string) => id.toLowerCase().replace(/\s+/g, "-");
export const speciesBySlug = (slug: string) => SENSITIVITY_SPECIES.find((s) => speciesSlug(s.id) === slug);

// ── Seeds. Illustrative ratings, so the preview shows every risk and every level at least once (the designer asked for
// that); they are not DEW's ratings. The four species the shared dataset already holds as Level 2 records are rated above
// Negligible, and the two accepted nominations are rated as their decision notes describe, by attribute. ──

const PANEL = "Sensitive species panel";
const area = (id: string, name: string, center: [number, number], radiusKm: number): NominationArea => ({ id, name, method: "list", boundary: { id: `b-${id}`, kind: "circle", center, radiusKm, label: name } });
const rule = (id: number, attribute: string, rating: Rating, patch: Partial<NominationAttribute> = {}): AttributeRating => ({
  id,
  attribute,
  attributeOther: "",
  value: "",
  values: [],
  dateFrom: null,
  dateTo: null,
  areas: [],
  ...patch,
  ...rating,
});
const whole = (risk: ReleaseRisk, access: AccessLevel): SpeciesRating => ({ appliesTo: "species", risk, access, attributes: [] });
const byAttribute = (...attributes: AttributeRating[]): SpeciesRating => ({ appliesTo: "attributes", ...OPEN, attributes });

export const seedRatingChanges: RatingChange[] = [
  { speciesId: "Neophema chrysogaster", rating: whole("extreme", "level-4"), at: "2026-05-14", by: PANEL },
  { speciesId: "Petrogale xanthopus", rating: whole("high", "level-3"), at: "2026-06-02", by: PANEL },
  { speciesId: "Leipoa ocellata", rating: whole("medium", "level-2"), at: "2026-06-02", by: PANEL },
  { speciesId: "Tiliqua adelaidensis", rating: whole("low", "level-2"), at: "2026-06-02", by: PANEL },
  { speciesId: "Isoodon obesulus", rating: byAttribute(rule(1, "observer", { risk: "low", access: "level-2" }, { values: ["olivia-wyatt"] })), at: "2026-07-09", by: PANEL, note: "From nomination NSS-2026-00007" },
  {
    speciesId: "Sternula nereis",
    rating: byAttribute(
      rule(1, "location", { risk: "medium", access: "level-2" }, { areas: [area("sens-coorong", "Coorong National Park", [-35.79, 139.29], 15)], values: ["sens-coorong"] }),
      rule(2, "activity", { risk: "high", access: "level-3" }, { value: "nesting" }),
    ),
    at: "2026-08-29",
    by: PANEL,
    note: "From nomination NSS-2026-00005",
  },
  { speciesId: "Lasiorhinus latifrons", rating: whole("medium", "level-3"), at: "2026-09-25", by: PANEL, note: "Level 3 while warren disturbance is investigated" },
];

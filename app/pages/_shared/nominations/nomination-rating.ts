import type { BadgeColors } from "@/components/base/badges/badge-types";
import { attributeLabel, attributeValueLabel, type NominationAttribute } from "@/app/pages/_shared/nominations/nomination-data";

// A nomination's rating (Nominations version 2): the data release risk and user access level the BioData Super Admin sets for
// what a nomination protects, when reviewing or approving it, or later by editing it. Both scales come from the DEW "Risk
// Ratings and Treatments" and "Users Access Permissions" figures the designer shared (Figures 2 to 7):
//   - Data release risk: Negligible (open data), Low (coordinates obscured to 1 km2), Medium (10 km2), High (embargoed or
//     withheld), Extreme (no access). Low and Medium also generalise the location text.
//   - User access level: who sees the records as held. Level 1 Public, Level 2 DLA, Level 3 Government, Level 4 Admin only.
// A species nomination is rated for the whole species, or per attribute it protects (Location as its areas, Activity as
// Nesting ...); a location nomination has one rating for the place. A species' current rating is its accepted nominations'
// ratings merged (`currentSpeciesRating`); the separate Species sensitivity configuration was removed (the designer,
// 12 Oct 2026: "we have covered the same in nominations itself"). Attributes not rated stay open.
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

/** The highest risk and level a rating applies anywhere: what the list shows and sorts by. */
export function ratingSummary(r: SpeciesRating): Rating {
  if (r.appliesTo === "species" || r.attributes.length === 0) return { risk: r.risk, access: r.access };
  const top = <T,>(order: T[], values: T[]) => order[Math.max(...values.map((v) => order.indexOf(v)))];
  return { risk: top(RELEASE_RISK_ORDER, r.attributes.map((a) => a.risk)), access: top(ACCESS_LEVEL_ORDER, r.attributes.map((a) => a.access)) };
}

/** The key one area of a Location attribute is rated under (the designer, 14 Oct 2026: "location can be rated per area"). */
// A function declaration, not a const: nomination-data.ts calls `ratingsPerArea` while its seeds are built, and the two modules
// import each other, so this must exist before this module's body runs.
export function areaRatingKey(attributeId: number, areaId: string): string {
  return `area:${attributeId}:${areaId}`;
}

type RatedShape = { kind?: string; scope: string; attributes: Pick<NominationAttribute, "id" | "attribute" | "areas">[] };

/** The keys a nomination's ratings are stored under: the whole species; or each attribute protected, a Location by each of its
 *  areas; or a location nomination's place. */
export function nominationRatingKeys(n: RatedShape): string[] {
  if (n.kind === "location") return ["location"];
  if (n.scope === "all") return ["species"];
  return n.attributes.flatMap((a) => (a.attribute === "location" ? a.areas.map((area) => areaRatingKey(a.id, area.id)) : [String(a.id)]));
}

/** What a rating key names, for messages and lists: "All data", "Location: Coorong National Park", "Activity: Nesting". */
export function ratingKeyLabel(n: { kind?: string; attributes: NominationAttribute[] }, key: string): string {
  if (key === "species") return "All data";
  if (key === "location") return "Location";
  const [, attributeId, areaId] = key.startsWith("area:") ? key.split(":") : [];
  if (areaId) {
    const area = n.attributes.find((a) => String(a.id) === attributeId)?.areas.find((x) => x.id === areaId);
    return area ? `Location: ${area.name}` : "Location";
  }
  const attribute = n.attributes.find((a) => String(a.id) === key);
  return attribute ? ruleLabel(attribute) : key;
}

/** Ratings stored before a Location was rated per area (one under the attribute's id): each area takes the attribute's rating. */
export function ratingsPerArea<T extends RatedShape & { ratings?: Record<string, Rating> }>(n: T): T {
  if (!n.ratings) return n;
  const ratings = { ...n.ratings };
  for (const a of n.attributes) {
    const old = a.attribute === "location" ? ratings[String(a.id)] : undefined;
    if (!old) continue;
    for (const area of a.areas) ratings[areaRatingKey(a.id, area.id)] ??= old;
    delete ratings[String(a.id)];
  }
  return { ...n, ratings };
}

/** The species rating an accepted nomination sets: the whole species, or each protected attribute with its value (a Location
 *  as one rule per area). */
export function ratingFromNomination(n: { scope: string; attributes: NominationAttribute[]; ratings?: Record<string, Rating> }): SpeciesRating | null {
  const r = n.ratings ?? {};
  if (!nominationRatingKeys(n).every((k) => r[k])) return null;
  if (n.scope === "all") return { appliesTo: "species", ...r.species, attributes: [] };
  return {
    appliesTo: "attributes",
    ...OPEN,
    attributes: n.attributes.flatMap((a) =>
      a.attribute === "location"
        ? a.areas.map((area, i) => ({ ...a, id: a.id * 1000 + i + 1, areas: [area], ...r[areaRatingKey(a.id, area.id)] }))
        : [{ ...a, ...r[String(a.id)] }],
    ),
  };
}

const higher = (a: Rating, b: Rating): Rating => ({
  risk: RELEASE_RISK_ORDER[Math.max(RELEASE_RISK_ORDER.indexOf(a.risk), RELEASE_RISK_ORDER.indexOf(b.risk))],
  access: ACCESS_LEVEL_ORDER[Math.max(ACCESS_LEVEL_ORDER.indexOf(a.access), ACCESS_LEVEL_ORDER.indexOf(b.access))],
});
const isOpen = (r: SpeciesRating) => r.appliesTo === "species" && r.risk === OPEN.risk && r.access === OPEN.access;

/**
 * An accepted nomination's rating added to the species' current one (the designer, 12 Oct 2026: merge, never replace), so
 * accepting never lowers what is already protected:
 * - nothing rated yet: the nomination's rating as it is;
 * - either is the whole species: the whole species, at the higher of the two (an attribute rule counts as its highest);
 * - both by attribute: the current rules, then the nomination's; a rule for the same attribute and value takes the higher.
 */
export function mergeRatings(current: SpeciesRating, incoming: SpeciesRating): SpeciesRating {
  if (isOpen(current)) return incoming;
  if (current.appliesTo === "species" || incoming.appliesTo === "species")
    return { appliesTo: "species", ...higher(ratingSummary(current), ratingSummary(incoming)), attributes: [] };
  const attributes = [...current.attributes];
  let nextId = Math.max(0, ...attributes.map((a) => a.id)) + 1;
  for (const a of incoming.attributes) {
    const same = attributes.findIndex((b) => ruleLabel(b) === ruleLabel(a));
    if (same >= 0) attributes[same] = { ...attributes[same], ...higher(attributes[same], a) };
    else attributes.push({ ...a, id: nextId++ });
  }
  return { appliesTo: "attributes", ...OPEN, attributes };
}

/**
 * A species' current rating, made from the nominations themselves (the designer, 12 Oct 2026: there is no separate Species
 * sensitivity configuration): every accepted species nomination with its ratings set, merged in the order they were accepted
 * (`mergeRatings`). A species with none is open (Negligible, Level 1).
 */
export function currentSpeciesRating(
  nominations: { kind?: string; status: string; speciesId: string; scope: string; attributes: NominationAttribute[]; ratings?: Record<string, Rating>; history: { status: string; at: string }[] }[],
  speciesId: string,
): SpeciesRating {
  const acceptedAt = (n: (typeof nominations)[number]) => [...n.history].reverse().find((e) => e.status === "accepted")?.at ?? "";
  return nominations
    .filter((n) => n.kind !== "location" && n.status === "accepted" && n.speciesId === speciesId)
    .sort((a, b) => acceptedAt(a).localeCompare(acceptedAt(b)))
    .reduce<SpeciesRating>((current, n) => {
      const rating = ratingFromNomination(n);
      return rating ? mergeRatings(current, rating) : current;
    }, DEFAULT_RATING);
}

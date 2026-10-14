import { parseDate } from "@internationalized/date";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { formatShortDate, todayIso, type DlaLocationMethod } from "@/app/pages/_shared/dla/dla-data";
import { REGISTRATION_SPECIES, SPECIES_CONCEPTS, type ConceptOption, type RegistrationSpecies } from "@/app/pages/project-registration/data";
import { emptyConceptRow, isGeoExtentComplete, type ConceptValueRow, type GeoExtentValue } from "@/app/pages/project-registration/types";
import { SA_NATIONAL_PARKS } from "@/app/pages/_shared/map-search/geo";
import { areaRatingKey, ratingsPerArea, type Rating } from "@/app/pages/_shared/nominations/nomination-rating";

// Sensitive species nominations (Master Flows lo-fi, Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936):
// one species per nomination, what should be protected (all of its data, or selected attributes),
// and why. Reviewed by BioData Admin (the sensitive species panel). See context/decisions/2026-09-28-09-nominate-sensitive-species-built-per-direct-request-from.md, "Nominate
// Sensitive Species".

export { formatShortDate, todayIso };

export type NominationStatus = "draft" | "submitted" | "under_review" | "returned" | "accepted" | "rejected";

/** Workflow order: the Status column and the Status filter sort by this, not alphabetically. */
export const nominationStatusOrder: NominationStatus[] = ["draft", "submitted", "under_review", "returned", "accepted", "rejected"];

export const nominationStatusMeta: Record<NominationStatus, { label: string; badgeColor: BadgeColors }> = {
  draft: { label: "Draft", badgeColor: "gray" },
  submitted: { label: "Submitted", badgeColor: "brand" },
  under_review: { label: "Under review", badgeColor: "warning" },
  returned: { label: "Returned for more information", badgeColor: "warning" },
  accepted: { label: "Accepted", badgeColor: "success" },
  rejected: { label: "Rejected", badgeColor: "error" },
};

export type ProtectionScope = "all" | "selected";

export const protectionMeta: Record<ProtectionScope, { label: string; description: string }> = {
  all: { label: "All data", description: "Protect every record of this species, and everything recorded with it." },
  selected: { label: "Specific attributes", description: "Protect only the attributes you choose, such as where it was found." },
};

/** What is nominated (Nominations version 2, the designer, 12 Oct 2026): a species (the existing flow), or a location, in the
 *  same form and steps: Location (a name, and the area chosen as the project form chooses one, `GeoExtentPicker`: a shapefile, a
 *  drawing, a national park or coordinates) with its justification, then Review. A location protects everything recorded in it. A record
 *  saved before kinds existed is a species. */
export type NominationKind = "species" | "location";

export interface NominationLocation {
  name: string;
  extent: GeoExtentValue;
}

export const kindOf = (n: { kind?: NominationKind }): NominationKind => n.kind ?? "species";

/** What the nomination is for: the species' common name, or the location's name. */
export function nominationSubject(n: { kind?: NominationKind; speciesId: string; location?: NominationLocation }): string {
  if (kindOf(n) === "location") return n.location?.name.trim() || "Location not named";
  return speciesFor(n.speciesId)?.commonName ?? (n.speciesId || "Species not chosen");
}

/** A location as one area, so it lists and maps like a Location attribute's areas (`AreaList`, `AreasMap`). A national park
 *  is drawn as a circle at its centre: the park list holds centres, not surveyed boundaries. */
export function locationArea(location: NominationLocation, parkRadiusKm = 15): NominationArea | null {
  const { extent } = location;
  const park = extent.method === "list" ? SA_NATIONAL_PARKS.find((p) => p.id === extent.parkId) : undefined;
  const boundary: Boundary | null = extent.boundary ?? (park ? { id: `park-${park.id}`, kind: "circle", center: [park.lat, park.lon], radiusKm: parkRadiusKm, label: park.name } : null);
  if (!boundary || !extent.method) return null;
  return { id: `loc-${boundary.id}`, name: location.name.trim() || "Location", method: extent.method, boundary };
}

/** An area whose records of this species are obscured: drawn on the map, uploaded, picked from the park list, or entered as coordinates. */
export interface NominationArea {
  id: string;
  name: string;
  method: DlaLocationMethod;
  boundary: Boundary;
  /** This area's own justification. Absent: the nomination's justification applies (`protectedItems`). */
  justification?: string;
}

export function areaMethodLabel(area: NominationArea): string {
  if (area.method === "shapefile") return "Shapefile";
  if (area.method === "list") return "National park";
  if (area.method === "coordinates") return "Coordinates";
  return area.boundary.kind === "polygon" ? "Drawn polygon" : "Drawn circle";
}

/**
 * The attributes a nomination can protect: Location as a set of areas (per the designer: "a set of
 * areas, points, etc that need to be obfuscated"), then the species attributes the project flow's
 * species restriction already uses, minus its own "Location (coordinates)" precision concept,
 * which Location-as-areas replaces here.
 */
export const NOMINATION_ATTRIBUTES: ConceptOption[] = [
  { id: "location", label: "Location", valueType: "areas" },
  ...SPECIES_CONCEPTS.filter((c) => c.id !== "location"),
];

/** A stored attribute row: the editor's `ConceptValueRow`, with dates as ISO strings and the areas themselves, so it survives localStorage. */
export interface NominationAttribute {
  id: number;
  attribute: string | null;
  attributeOther: string;
  value: string;
  values: string[];
  dateFrom: string | null;
  dateTo: string | null;
  areas: NominationArea[];
  /** This attribute's own justification (not used by Location, whose areas carry theirs). Absent: the nomination's applies. */
  justification?: string;
}

export interface NominationEvent {
  status: NominationStatus;
  at: string;
  by: string;
  note?: string;
}

export interface Nomination {
  /** NSS-<year>-<5 digits>. */
  id: string;
  /** Version 2. Absent on a species nomination. */
  kind?: NominationKind;
  /** A location nomination's place. Its `speciesId` is empty, its scope "all" and its attributes none. */
  location?: NominationLocation;
  /** The species' scientific name, the id `REGISTRATION_SPECIES` uses. */
  speciesId: string;
  scope: ProtectionScope;
  attributes: NominationAttribute[];
  /** The justification shared by everything protected; an attribute or area may carry its own instead (the designer, 14 Oct 2026). */
  justification: string;
  nominator: { name: string; organisation: string; email: string };
  status: NominationStatus;
  createdAt: string;
  updatedAt: string;
  /** The reviewer's note on the latest decision (why it was returned or rejected, or a note on acceptance). */
  decisionNote?: string;
  history: NominationEvent[];
  /** Version 2: the data release risk and user access level the BioData Super Admin sets while reviewing, approving or editing,
   *  one per thing protected: `"species"` for the whole species, `"location"` for a place, else the attribute's id. Once accepted,
   *  a species nomination's count towards the species' current rating (`currentSpeciesRating`). */
  ratings?: Record<string, Rating>;
}

export type NominationDraft = Pick<Nomination, "speciesId" | "scope" | "attributes" | "justification" | "kind" | "location">;

export function emptyNominationDraft(): NominationDraft {
  return { speciesId: "", scope: "all", attributes: [], justification: "" };
}

export function speciesFor(id: string): RegistrationSpecies | undefined {
  return REGISTRATION_SPECIES.find((s) => s.id === id);
}

// ── Converting between the stored attribute rows and the shared concept editor's rows. ──

export function toEditorRows(attributes: NominationAttribute[]): { rows: ConceptValueRow[]; areas: Record<number, NominationArea[]> } {
  const rows = attributes.length
    ? attributes.map((a) => ({
        id: a.id,
        concept: a.attribute,
        conceptOther: a.attributeOther,
        value: a.value,
        values: a.values,
        dateFrom: a.dateFrom ? parseDate(a.dateFrom) : null,
        dateTo: a.dateTo ? parseDate(a.dateTo) : null,
        justification: "",
      }))
    : [{ ...emptyConceptRow(1), concept: "location" }];
  const areas = Object.fromEntries(attributes.map((a) => [a.id, a.areas]));
  return { rows, areas };
}

export function fromEditorRows(rows: ConceptValueRow[], areas: Record<number, NominationArea[]>): NominationAttribute[] {
  return rows.map((r) => ({
    id: r.id,
    attribute: r.concept,
    attributeOther: r.conceptOther,
    value: r.value,
    values: r.concept === "location" ? (areas[r.id] ?? []).map((a) => a.id) : r.values,
    dateFrom: r.dateFrom ? r.dateFrom.toString() : null,
    dateTo: r.dateTo ? r.dateTo.toString() : null,
    areas: r.concept === "location" ? (areas[r.id] ?? []) : [],
  }));
}

export function attributeLabel(a: NominationAttribute): string {
  if (a.attribute === "other") return a.attributeOther || "Other";
  return NOMINATION_ATTRIBUTES.find((o) => o.id === a.attribute)?.label ?? "Not provided";
}

export function attributeValueLabel(a: NominationAttribute): string {
  const option = NOMINATION_ATTRIBUTES.find((o) => o.id === a.attribute);
  const labelFor = (id: string) => option?.options?.find((o) => o.id === id)?.label ?? id;
  switch (option?.valueType) {
    case "areas":
      return `${a.areas.length} ${a.areas.length === 1 ? "area" : "areas"}`;
    case "none":
      return "Withheld entirely";
    case "multi":
      return a.values.map(labelFor).join(", ");
    case "select":
      return labelFor(a.value);
    case "boolean":
      return a.value === "yes" ? "Yes" : a.value === "no" ? "No" : "";
    case "dateRange":
      return a.dateFrom && a.dateTo ? `${formatShortDate(a.dateFrom)} to ${formatShortDate(a.dateTo)}` : a.dateFrom ? `From ${formatShortDate(a.dateFrom)}` : a.dateTo ? `Until ${formatShortDate(a.dateTo)}` : "";
    default:
      return a.value;
  }
}

/** One thing a nomination protects that is justified on its own: a Location attribute's area, or any other chosen attribute.
 *  `key` is stable while editing (`attr:<id>`, `area:<attribute id>:<area id>`). Each uses the nomination's main justification
 *  unless it carries its own. */
export interface ProtectedItem {
  key: string;
  label: string;
  own?: string;
}

export function protectedItems(attributes: NominationAttribute[]): ProtectedItem[] {
  return attributes.flatMap((a): ProtectedItem[] => {
    if (!a.attribute) return [];
    if (a.attribute === "location") return a.areas.map((ar) => ({ key: areaRatingKey(a.id, ar.id), label: ar.name, own: ar.justification }));
    return [{ key: `attr:${a.id}`, label: attributeLabel(a), own: a.justification }];
  });
}

// ── Sections of the form and what each one needs to be complete. ──
// Justification is no longer a step (the designer, 14 Oct 2026): it is asked beside what it justifies, on What to protect or
// Location, once for everything with a way to give an attribute or area its own.

export type NominationSection = "species" | "protection" | "location" | "review";

export const nominationSections: Record<NominationSection, { title: string; description: string }> = {
  species: { title: "Species", description: "Choose the species you want treated as sensitive." },
  protection: { title: "What to protect", description: "Protect all of its data, or only the attributes you choose, and tell the panel why." },
  location: { title: "Location", description: "Name the place, choose its area and tell the panel why. Everything recorded in it is protected." },
  review: { title: "Review and submit", description: "Check the nomination before it goes to the sensitive species panel." },
};

export const NOMINATION_SECTION_ORDER: NominationSection[] = ["species", "protection", "review"];
export const LOCATION_SECTION_ORDER: NominationSection[] = ["location", "review"];
export const sectionOrderFor = (kind: NominationKind) => (kind === "location" ? LOCATION_SECTION_ORDER : NOMINATION_SECTION_ORDER);

/** Missing mandatory details, by section. A draft only needs what identifies it: the species, or the location's name. */
export function missingForNomination(draft: NominationDraft, mode: "draft" | "submit" = "submit"): Record<NominationSection, string[]> {
  const missing: Record<NominationSection, string[]> = { species: [], protection: [], location: [], review: [] };
  if (kindOf(draft) === "location") {
    if (!draft.location?.name.trim()) missing.location.push("Name the location");
    if (mode === "draft") return missing;
    if (!draft.location || !isGeoExtentComplete(draft.location.extent)) missing.location.push("Define the location's area");
    if (!draft.justification.trim()) missing.location.push("Enter a reason");
    return missing;
  }
  if (!draft.speciesId) missing.species.push("Choose a species");
  if (mode === "draft") return missing;
  if (draft.scope === "selected") {
    if (draft.attributes.length === 0) missing.protection.push("Add at least one attribute");
    draft.attributes.forEach((a, i) => {
      const n = draft.attributes.length > 1 ? ` (attribute ${i + 1})` : "";
      if (!a.attribute) missing.protection.push(`Choose an attribute${n}`);
      else if (a.attribute === "other" && !a.attributeOther.trim()) missing.protection.push(`Name the attribute${n}`);
      else if (a.attribute === "location" && a.areas.length === 0) missing.protection.push(`Add at least one area${n}`);
      else if (!attributeValueLabel(a).trim()) missing.protection.push(`Give a value for ${attributeLabel(a)}`);
    });
  }
  // The shared justification is needed once there is something to justify; an item that has its own needs it filled.
  const items = draft.scope === "selected" ? protectedItems(draft.attributes) : [];
  const usesMain = draft.scope === "all" || items.length === 0 || items.some((item) => item.own === undefined);
  if (usesMain && !draft.justification.trim()) missing.protection.push("Enter the main reason");
  items.forEach((item) => {
    if (item.own !== undefined && !item.own.trim()) missing.protection.push(`Enter a reason for ${item.label}`);
  });
  return missing;
}

export function nextNominationId(existing: Nomination[]): string {
  const highest = existing.reduce((max, n) => Math.max(max, Number(n.id.split("-")[2]) || 0), 0);
  return `NSS-${new Date().getFullYear()}-${String(highest + 1).padStart(5, "0")}`;
}

/** An open nomination is one still with the nominator or the panel: another for the same species would be a duplicate. */
export function isOpenNomination(n: Nomination): boolean {
  return n.status === "submitted" || n.status === "under_review" || n.status === "returned";
}

// ── Seeds. Real species from the shared dataset; people from the placeholder cast; organisations
// from the BDBSA research in CONTEXT.md. The Southern Bell Frog nomination is the one Home's task
// list already describes as under review by the panel. ──

const olivia = { name: CURRENT_USER_NAME, organisation: "", email: "olivia.wyatt@example.org" };
const maya = { name: "Maya Dewitt", organisation: "South Australian Museum", email: "maya.dewitt@example.org" };
const phoenix = { name: "Phoenix Baker", organisation: "BirdLife Australia", email: "phoenix.baker@example.org" };
const lana = { name: "Lana Steiner", organisation: "Birds SA", email: "lana.steiner@example.org" };
const PANEL = "Sensitive species panel";

const area = (id: string, name: string, method: DlaLocationMethod, boundary: Boundary): NominationArea => ({ id, name, method, boundary });
const attr = (id: number, attribute: string, patch: Partial<NominationAttribute> = {}): NominationAttribute => ({
  id,
  attribute,
  attributeOther: "",
  value: "",
  values: [],
  dateFrom: null,
  dateTo: null,
  areas: [],
  ...patch,
});

const SEEDS: Nomination[] = [
  {
    id: "NSS-2026-00001",
    speciesId: "Litoria raniformis",
    scope: "selected",
    attributes: [
      attr(1, "location", {
        areas: [
          area("area-seed-1", "Naracoorte Caves National Park", "list", { id: "b-seed-1", kind: "circle", center: [-36.97, 140.8], radiusKm: 15, label: "Naracoorte Caves National Park" }),
          area("area-seed-2", "Breeding wetland", "coordinates", { id: "b-seed-2", kind: "circle", center: [-36.98, 140.82], radiusKm: 1 }),
        ],
      }),
      attr(2, "activity", { value: "breeding" }),
    ],
    justification: "Breeding sites for this frog are few and easily disturbed. Exact locations should not be public while the wetland recovery work is under way.",
    nominator: olivia,
    status: "under_review",
    createdAt: "2026-09-19",
    updatedAt: "2026-09-22",
    history: [
      { status: "draft", at: "2026-09-19", by: olivia.name },
      { status: "submitted", at: "2026-09-21", by: olivia.name },
      { status: "under_review", at: "2026-09-22", by: PANEL },
    ],
  },
  {
    id: "NSS-2026-00002",
    speciesId: "Polytelis anthopeplus",
    scope: "selected",
    attributes: [attr(1, "activity", { value: "nesting" }), attr(2, "micro-habitat", { value: "tree-hollow" })],
    justification: "",
    nominator: olivia,
    status: "draft",
    createdAt: "2026-09-26",
    updatedAt: "2026-09-26",
    history: [{ status: "draft", at: "2026-09-26", by: olivia.name }],
  },
  {
    id: "NSS-2026-00003",
    speciesId: "Lasiorhinus latifrons",
    scope: "selected",
    attributes: [
      attr(1, "location", {
        areas: [area("area-seed-3", "Warren complex", "map", { id: "b-seed-3", kind: "polygon", points: [[-32.4, 134.9], [-32.4, 135.1], [-32.55, 135.1], [-32.55, 134.9]] })],
      }),
    ],
    justification: "Warren locations have been targeted by illegal disturbance. Obscuring the warren complex protects the colony without hiding the species from general search.",
    nominator: maya,
    status: "submitted",
    createdAt: "2026-09-23",
    updatedAt: "2026-09-24",
    history: [
      { status: "draft", at: "2026-09-23", by: maya.name },
      { status: "submitted", at: "2026-09-24", by: maya.name },
    ],
  },
  {
    id: "NSS-2026-00004",
    speciesId: "Pseudomys shortridgei",
    scope: "all",
    attributes: [],
    justification: "Records are sparse and the known populations are small.",
    nominator: phoenix,
    status: "returned",
    createdAt: "2026-09-02",
    updatedAt: "2026-09-15",
    decisionNote: "Please say which populations you mean and whether all attributes need protecting, or only location. The panel can't assess 'all data' without that.",
    history: [
      { status: "draft", at: "2026-09-02", by: phoenix.name },
      { status: "submitted", at: "2026-09-03", by: phoenix.name },
      { status: "under_review", at: "2026-09-08", by: PANEL },
      { status: "returned", at: "2026-09-15", by: PANEL, note: "Please say which populations you mean and whether all attributes need protecting, or only location. The panel can't assess 'all data' without that." },
    ],
  },
  {
    id: "NSS-2026-00005",
    speciesId: "Sternula nereis",
    scope: "selected",
    attributes: [
      attr(1, "location", {
        areas: [area("area-seed-4", "Coorong National Park", "list", { id: "b-seed-4", kind: "circle", center: [-35.79, 139.29], radiusKm: 15, label: "Coorong National Park" })],
      }),
      attr(2, "activity", { value: "nesting" }),
    ],
    justification: "Beach-nesting colonies fail when disturbed during the breeding season. Nest locations should be obscured.",
    nominator: lana,
    status: "accepted",
    createdAt: "2026-08-11",
    updatedAt: "2026-08-29",
    decisionNote: "Accepted. Nest locations in the Coorong will be obscured in public results.",
    // The rating the panel set on accepting it.
    ratings: { "1": { risk: "medium", access: "level-2" }, "2": { risk: "high", access: "level-3" } },
    history: [
      { status: "draft", at: "2026-08-11", by: lana.name },
      { status: "submitted", at: "2026-08-12", by: lana.name },
      { status: "under_review", at: "2026-08-18", by: PANEL },
      { status: "accepted", at: "2026-08-29", by: PANEL, note: "Accepted. Nest locations in the Coorong will be obscured in public results." },
    ],
  },
  {
    id: "NSS-2026-00006",
    speciesId: "Santalum acuminatum",
    scope: "all",
    attributes: [],
    justification: "Plants are sometimes harvested for fruit.",
    nominator: maya,
    status: "rejected",
    createdAt: "2026-07-30",
    updatedAt: "2026-08-14",
    decisionNote: "The panel found no evidence that public records are driving harvesting. Nominate specific stands if that changes.",
    history: [
      { status: "draft", at: "2026-07-30", by: maya.name },
      { status: "submitted", at: "2026-07-30", by: maya.name },
      { status: "under_review", at: "2026-08-04", by: PANEL },
      { status: "rejected", at: "2026-08-14", by: PANEL, note: "The panel found no evidence that public records are driving harvesting. Nominate specific stands if that changes." },
    ],
  },
  {
    id: "NSS-2026-00007",
    speciesId: "Isoodon obesulus",
    scope: "selected",
    attributes: [attr(1, "observer", { values: ["olivia-wyatt"] })],
    justification: "Records identify private landholders who have asked not to be named.",
    nominator: olivia,
    status: "accepted",
    createdAt: "2026-06-20",
    updatedAt: "2026-07-09",
    decisionNote: "Accepted. Observer names will be withheld for this species.",
    ratings: { "1": { risk: "low", access: "level-2" } },
    history: [
      { status: "draft", at: "2026-06-20", by: olivia.name },
      { status: "submitted", at: "2026-06-21", by: olivia.name },
      { status: "under_review", at: "2026-06-26", by: PANEL },
      { status: "accepted", at: "2026-07-09", by: PANEL, note: "Accepted. Observer names will be withheld for this species." },
    ],
  },
];

// Version 2's location nominations. Real places (the bat cave and the Brolga wetland are documented); the nominators and dates
// are the preview cast's. NSS-2026-00009 is accepted with the rating the panel set.
SEEDS.push(
  {
    id: "NSS-2026-00008",
    kind: "location",
    speciesId: "",
    scope: "all",
    attributes: [],
    location: { name: "Naracoorte Caves bat maternity cave", extent: { method: "list", parkId: "naracoorte-caves", boundary: null } },
    justification: "The maternity cave of the Southern Bent-wing Bat. Visits during the breeding season disturb the colony, and public records lead people to the cave.",
    nominator: maya,
    status: "under_review",
    createdAt: "2026-10-01",
    updatedAt: "2026-10-05",
    history: [
      { status: "submitted", at: "2026-10-01", by: maya.name },
      { status: "under_review", at: "2026-10-05", by: PANEL },
    ],
  },
  {
    id: "NSS-2026-00009",
    kind: "location",
    speciesId: "",
    scope: "all",
    attributes: [],
    location: { name: "Bool Lagoon breeding wetland", extent: { method: "map", boundary: { id: "seed-bool-lagoon", kind: "circle", center: [-37.13, 140.7], radiusKm: 5, label: "Bool Lagoon" } } },
    justification: "Brolga and other waterbirds nest on the lagoon. Exact nest records draw visitors into the breeding area.",
    nominator: lana,
    status: "accepted",
    createdAt: "2026-08-21",
    updatedAt: "2026-09-10",
    decisionNote: "Accepted. Records in the wetland are withheld from public results.",
    ratings: { location: { risk: "high", access: "level-3" } },
    history: [
      { status: "submitted", at: "2026-08-21", by: lana.name },
      { status: "under_review", at: "2026-08-26", by: PANEL },
      { status: "accepted", at: "2026-09-10", by: PANEL, note: "Accepted. Records in the wetland are withheld from public results." },
    ],
  },
  // More location nominations, one per way of choosing an area and across the statuses, so the Locations tab has a list to
  // work with (the designer, 12 Oct 2026). Illustrative, like the species seeds: not real nominations.
  {
    id: "NSS-2026-00010",
    kind: "location",
    speciesId: "",
    scope: "all",
    attributes: [],
    location: { name: "Coorong Hooded Plover nesting beaches", extent: { method: "list", parkId: "coorong", boundary: null } },
    justification: "Hooded Plovers nest on the open beach from August to March. Public nest records bring walkers and vehicles onto the nesting strip.",
    nominator: phoenix,
    status: "submitted",
    createdAt: "2026-10-08",
    updatedAt: "2026-10-08",
    history: [{ status: "submitted", at: "2026-10-08", by: phoenix.name }],
  },
  {
    id: "NSS-2026-00011",
    kind: "location",
    speciesId: "",
    scope: "all",
    attributes: [],
    location: {
      name: "Kangaroo Island Glossy Black-Cockatoo nest trees",
      extent: { method: "map", boundary: { id: "seed-ki-glossy", kind: "circle", center: [-35.73, 137.33], radiusKm: 4, label: "Glossy Black-Cockatoo nest trees" } },
    },
    justification: "The nest hollows are few and known by tree. Published records have led to hollows being disturbed.",
    nominator: olivia,
    status: "returned",
    createdAt: "2026-09-18",
    updatedAt: "2026-09-30",
    decisionNote: "Please narrow the area to the nesting gullies, and say whether feeding sites need protecting too.",
    history: [
      { status: "submitted", at: "2026-09-18", by: olivia.name },
      { status: "under_review", at: "2026-09-24", by: PANEL },
      { status: "returned", at: "2026-09-30", by: PANEL, note: "Please narrow the area to the nesting gullies, and say whether feeding sites need protecting too." },
    ],
  },
  {
    id: "NSS-2026-00012",
    kind: "location",
    speciesId: "",
    scope: "all",
    attributes: [],
    location: { name: "Yellow-footed Rock-wallaby colony, Flinders Ranges", extent: { method: "list", parkId: "flinders-ranges", boundary: null } },
    justification: "A small colony on the gorge walls. Exact sightings guide people to the rock piles where the wallabies shelter.",
    nominator: maya,
    status: "accepted",
    createdAt: "2026-07-14",
    updatedAt: "2026-08-04",
    decisionNote: "Accepted. Coordinates in the park are obscured to 10 km².",
    ratings: { location: { risk: "medium", access: "level-2" } },
    history: [
      { status: "submitted", at: "2026-07-14", by: maya.name },
      { status: "under_review", at: "2026-07-20", by: PANEL },
      { status: "accepted", at: "2026-08-04", by: PANEL, note: "Accepted. Coordinates in the park are obscured to 10 km²." },
    ],
  },
  {
    id: "NSS-2026-00013",
    kind: "location",
    speciesId: "",
    scope: "all",
    attributes: [],
    location: { name: "Dalhousie mound springs", extent: { method: "coordinates", boundary: { id: "coordinates", kind: "circle", center: [-26.42, 135.5], radiusKm: 25 } } },
    justification: "The springs hold fish and snails found nowhere else. Visitor numbers are already managed on site.",
    nominator: lana,
    status: "rejected",
    createdAt: "2026-06-02",
    updatedAt: "2026-06-20",
    decisionNote: "Rejected. Visitor access to the springs is already managed on site.",
    history: [
      { status: "submitted", at: "2026-06-02", by: lana.name },
      { status: "under_review", at: "2026-06-09", by: PANEL },
      { status: "rejected", at: "2026-06-20", by: PANEL, note: "Rejected. Visitor access to the springs is already managed on site." },
    ],
  },
  // A nomination with twelve attributes and three reasons, to stress the page that lists what it protects (the designer, 14 Oct
  // 2026: "stress test it with more fields like 10 or 12 fields"). Illustrative, not a real nomination.
  {
    id: "NSS-2026-00014",
    speciesId: "Neophema chrysogaster",
    scope: "selected",
    attributes: [
      attr(1, "location", {
        areas: [
          area("area-seed-14a", "Coorong saltmarsh roost", "map", { id: "b-seed-14a", kind: "polygon", points: [[-35.74, 139.25], [-35.74, 139.36], [-35.84, 139.36], [-35.84, 139.25]] }),
          area("area-seed-14b", "Coorong National Park", "list", { id: "b-seed-14b", kind: "circle", center: [-35.9, 139.4], radiusKm: 15, label: "Coorong National Park" }),
          {
            ...area("area-seed-14c", "Release aviary site", "coordinates", { id: "b-seed-14c", kind: "circle", center: [-35.79, 139.3], radiusKm: 2 }),
            justification: "Captive-bred birds are released here. A public point would lead people to the aviary while birds are settling.",
          },
        ],
      }),
      attr(2, "date-observed", { dateFrom: "2026-04-01", dateTo: "2026-09-30" }),
      attr(3, "animal-life-stage", { values: ["juvenile", "adult"] }),
      attr(4, "sex", { value: "female" }),
      attr(5, "activity", { value: "roosting" }),
      attr(6, "micro-habitat", { value: "nest-mound" }),
      attr(7, "observer", { values: ["phoenix-baker", "lana-steiner"], justification: "Observers are volunteers on private land who have asked not to be named." }),
      attr(8, "determiners", { values: ["maya-dewitt"], justification: "Observers are volunteers on private land who have asked not to be named." }),
      attr(9, "voucher-institution", { value: "sa-museum" }),
      attr(10, "comments"),
      attr(11, "resources"),
      attr(12, "other", { attributeOther: "Leg band number", value: "Band numbers and colour combinations" }),
    ],
    justification:
      "Fewer than a hundred birds return to the mainland each winter. Roost and feeding records draw birdwatchers and photographers onto the saltmarsh, which flushes the flock.",
    nominator: lana,
    status: "accepted",
    createdAt: "2026-08-10",
    updatedAt: "2026-09-02",
    decisionNote: "Accepted. Roosts and the release site are withheld; the rest is generalised.",
    ratings: {
      "1": { risk: "high", access: "level-3" },
      "2": { risk: "medium", access: "level-2" },
      "3": { risk: "low", access: "level-2" },
      "4": { risk: "low", access: "level-2" },
      "5": { risk: "medium", access: "level-2" },
      "6": { risk: "high", access: "level-3" },
      "7": { risk: "medium", access: "level-3" },
      "8": { risk: "medium", access: "level-3" },
      "9": { risk: "low", access: "level-2" },
      "10": { risk: "medium", access: "level-2" },
      "11": { risk: "high", access: "level-3" },
      "12": { risk: "extreme", access: "level-4" },
    },
    history: [
      { status: "draft", at: "2026-08-10", by: lana.name },
      { status: "submitted", at: "2026-08-12", by: lana.name },
      { status: "under_review", at: "2026-08-18", by: PANEL },
      { status: "accepted", at: "2026-09-02", by: PANEL, note: "Accepted. Roosts and the release site are withheld; the rest is generalised." },
    ],
  },
);

/** The seeds, their Location ratings by area (written by attribute above, as they were first seeded). */
export const seedNominations: Nomination[] = SEEDS.map(ratingsPerArea);

export const REVIEW_PANEL = PANEL;

/** Every id a static export must pre-render: the seeds plus the next ids a new nomination would get. */
export function staticNominationIds(count = 50): string[] {
  const highest = seedNominations.reduce((max, n) => Math.max(max, Number(n.id.split("-")[2]) || 0), 0);
  const year = new Date().getFullYear();
  const upcoming = [year, year + 1].flatMap((y) => Array.from({ length: count }, (_, i) => `NSS-${y}-${String(highest + 1 + i).padStart(5, "0")}`));
  return [...new Set([...seedNominations.map((n) => n.id), ...upcoming])];
}

import { parseDate } from "@internationalized/date";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { formatShortDate, todayIso, type DlaLocationMethod } from "@/app/pages/_shared/dla/dla-data";
import { REGISTRATION_SPECIES, SPECIES_CONCEPTS, type ConceptOption, type RegistrationSpecies } from "@/app/pages/project-registration/data";
import { emptyConceptRow, type ConceptValueRow } from "@/app/pages/project-registration/types";

// Sensitive species nominations (Master Flows lo-fi, Figma YMproGZfrFB5jUqPHPxMhk node 1401:10936):
// one species per nomination, what should be protected (all of its data, or selected attributes),
// and why. Reviewed by BioData Admin (the sensitive species panel). See CONTEXT.md, "Nominate
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

/** An area whose records of this species are obscured: drawn on the map, uploaded, picked from the park list, or entered as coordinates. */
export interface NominationArea {
  id: string;
  name: string;
  method: DlaLocationMethod;
  boundary: Boundary;
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
  /** The species' scientific name, the id `REGISTRATION_SPECIES` uses. */
  speciesId: string;
  scope: ProtectionScope;
  attributes: NominationAttribute[];
  justification: string;
  nominator: { name: string; organisation: string; email: string };
  status: NominationStatus;
  createdAt: string;
  updatedAt: string;
  /** The reviewer's note on the latest decision (why it was returned or rejected, or a note on acceptance). */
  decisionNote?: string;
  history: NominationEvent[];
}

export type NominationDraft = Pick<Nomination, "speciesId" | "scope" | "attributes" | "justification">;

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

// ── Sections of the form and what each one needs to be complete. ──

export type NominationSection = "species" | "protection" | "justification" | "review";

export const nominationSections: Record<NominationSection, { title: string; description: string }> = {
  species: { title: "Species", description: "Choose the species you want treated as sensitive." },
  protection: { title: "What to protect", description: "Protect all of its data, or only the attributes you choose." },
  justification: { title: "Justification", description: "Tell the panel why this species needs protecting." },
  review: { title: "Review and submit", description: "Check the nomination before it goes to the sensitive species panel." },
};

export const NOMINATION_SECTION_ORDER: NominationSection[] = ["species", "protection", "justification", "review"];

/** Missing mandatory details, by section. A draft only needs the species (what identifies it). */
export function missingForNomination(draft: NominationDraft, mode: "draft" | "submit" = "submit"): Record<NominationSection, string[]> {
  const missing: Record<NominationSection, string[]> = { species: [], protection: [], justification: [], review: [] };
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
  if (!draft.justification.trim()) missing.justification.push("Enter a justification");
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

export const seedNominations: Nomination[] = [
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
    history: [
      { status: "draft", at: "2026-06-20", by: olivia.name },
      { status: "submitted", at: "2026-06-21", by: olivia.name },
      { status: "under_review", at: "2026-06-26", by: PANEL },
      { status: "accepted", at: "2026-07-09", by: PANEL, note: "Accepted. Observer names will be withheld for this species." },
    ],
  },
];

export const REVIEW_PANEL = PANEL;

/** Every id a static export must pre-render: the seeds plus the next ids a new nomination would get. */
export function staticNominationIds(count = 50): string[] {
  const highest = seedNominations.reduce((max, n) => Math.max(max, Number(n.id.split("-")[2]) || 0), 0);
  const year = new Date().getFullYear();
  const upcoming = [year, year + 1].flatMap((y) => Array.from({ length: count }, (_, i) => `NSS-${y}-${String(highest + 1 + i).padStart(5, "0")}`));
  return [...new Set([...seedNominations.map((n) => n.id), ...upcoming])];
}

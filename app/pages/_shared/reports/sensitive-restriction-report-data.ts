// The Project Sensitive and Restriction Report: a ledger of every restriction applied to a project, one row per
// restriction (the wireframe, Figma YMproGZfrFB5jUqPHPxMhk frame 1504:12441, columns list node 1510:14749, with
// 32 columns).
//
// A row is never stored. It is DERIVED from three sources the app already holds, so the report and the screens
// that set a restriction can never disagree:
//   1. a project's own restrictions state (`RestrictionsState`, what the Add Project wizard collects): Adelaide
//      Hills is the one project with a real one (an embargo and a species restriction). No other project has any,
//      and none is invented for them;
//   2. sensitive species nominations (the nominations store, seeded by `seedNominations`): each nomination the
//      panel has accepted or has under review makes one row per attribute it protects, on every project that holds
//      records of that species. A nomination decided in the app appears here without this file changing;
//   3. the restricted (Level 2) species Explore already generalises (`licenceLevel` in search-data.ts): one row
//      per project and species, the same rule `existingRestrictionsForSpecies` reads.
//
// What the app has no data for is left empty, not invented: the registration form records only an embargo's END
// date (no start, so no period), a project has no "created on" date, and a Level 2 flag carries no justification.
//
// SAMPLE: a project's restriction has no review record in the app, so its DEW reviewer and approver are the admin
// reviewer (REVIEWING_ADMIN_NAME) and the two dates are derived from the project's start date (8 and 12 days
// after it). The vocabulary for the access level and the treatment is the wireframe's own, used where the app has
// no equivalent; the generalisation distance follows `restrictedRadiusKm` (birds 5 km, everything else 10 km).

import { CURRENT_USER_NAME, REVIEWING_ADMIN_NAME } from "@/app/pages/_shared/agreement-scope";
import { hasEndDate, hasScientificName, restrictedRadiusKm, searchEvents, searchOccurrences, type SearchEvent } from "@/app/pages/_shared/map-search/search-data";
import {
  REVIEW_PANEL,
  attributeLabel,
  attributeValueLabel,
  type Nomination,
  type NominationAttribute,
} from "@/app/pages/_shared/nominations/nomination-data";
import { reportProjectsFor } from "@/app/pages/_shared/reports/report-projects";
import { EMBARGO_TYPE_OPTIONS, SPECIES_CONCEPTS } from "@/app/pages/project-registration/data";
import type { ConceptValueRow } from "@/app/pages/project-registration/types";
import { ADELAIDE_HILLS_ID } from "@/app/pages/project-detail/project-seed";
import { registrationRestrictions } from "@/app/pages/project-detail/project-registration-data";
import type { BadgeColor } from "@/components/base/badges/badges";
import type { UserRole } from "@/lib/user-role";

// ── The wireframe's vocabulary ──
export type PrivacyKind = "Project embargo" | "Sensitive species" | "Sensitive location" | "Project metadata" | "Other restrictions";
export type SensitiveType = "Species" | "Locations" | "Metadata" | "Others";
export type AccessLevel = "Restricted" | "Highly restricted" | "Internal only";

export interface RestrictionRow {
  /** RS-<project number>-<sequence>: stable for a restriction, whatever else is added to the project. */
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  projectDescription: string;
  projectStatus: string;
  projectStatusColor: BadgeColor<"pill-color">;
  /** ISO days. */
  startDate: string;
  endDate: string;
  privacy: PrivacyKind;
  embargoType: string;
  embargoDetails: string;
  embargoFrom: string;
  embargoTo: string;
  embargoYears: number | null;
  sensitiveType: SensitiveType | "";
  attribute: string;
  attributeValue: string;
  subAttribute: string;
  subAttributeValue: string;
  justification: string;
  reviewer: string;
  reviewedOn: string;
  approver: string;
  approvedOn: string;
  accessLevel: AccessLevel | "";
  treatments: string;
  nominatedBy: string;
  nominatedOn: string;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

// ── Dates ──
const dayMs = 24 * 60 * 60 * 1000;
/** The day relative times ("2 days ago") count back from: 29 Sept 2026, the same fixed day the other reports use. */
const ANCHOR = Date.UTC(2026, 8, 29);
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => isoDay(Date.parse(iso) + days * dayMs);

/** "2 days ago", "1 week ago", "3 weeks ago" as a day. */
function agoToIso(text: string | undefined): string {
  const m = text?.match(/^(\d+) (day|week)s? ago$/);
  if (!m) return "";
  return isoDay(ANCHOR - Number(m[1]) * (m[2] === "week" ? 7 : 1) * dayMs);
}

// ── What a restriction does ──
function plainKm(label: string): string {
  return label.replace(/^Generalise to (\d+) km$/, "$1");
}

/** How a restricted concept is treated. Location is the app's own rule; the rest is worded after the concept. */
function treatmentFor(concept: string | null, conceptLabel: string, valueLabel: string, radiusKm: number | null): string {
  if (concept === "location") {
    if (radiusKm) return `Generalise to ${radiusKm} km grid`;
    if (/^Generalise to \d+ km$/.test(valueLabel)) return `Generalise to ${plainKm(valueLabel)} km grid`;
    return "Withhold precise coordinates";
  }
  if (concept === "observer") return "Withhold observer names";
  return `Withhold ${conceptLabel.toLowerCase()}`;
}

function accessFor(concept: string | null, valueLabel: string): AccessLevel {
  return concept === "location" && valueLabel === "Hide location completely" ? "Highly restricted" : "Restricted";
}

function conceptValueLabel(row: ConceptValueRow): string {
  const option = SPECIES_CONCEPTS.find((o) => o.id === row.concept);
  const labelFor = (id: string) => option?.options?.find((o) => o.id === id)?.label ?? id;
  switch (option?.valueType) {
    case "none":
      return "Withheld entirely";
    case "multi":
      return row.values.map(labelFor).join(", ");
    case "select":
      return labelFor(row.value);
    case "boolean":
      return row.value === "yes" ? "Yes" : row.value === "no" ? "No" : "";
    case "dateRange":
      return row.dateFrom && row.dateTo ? `${row.dateFrom.toString()} to ${row.dateTo.toString()}` : "";
    default:
      return row.value;
  }
}

// ── Building the rows ──
const projectRoots = () => searchEvents.filter((e) => e.type === "Project");

type Draft = Omit<RestrictionRow, "id" | "projectId" | "projectCode" | "projectTitle" | "projectDescription" | "projectStatus" | "projectStatusColor" | "startDate" | "endDate" | "createdBy" | "createdOn">;

const blank: Draft = {
  privacy: "Sensitive species",
  embargoType: "",
  embargoDetails: "",
  embargoFrom: "",
  embargoTo: "",
  embargoYears: null,
  sensitiveType: "",
  attribute: "",
  attributeValue: "",
  subAttribute: "",
  subAttributeValue: "",
  justification: "",
  reviewer: "",
  reviewedOn: "",
  approver: "",
  approvedOn: "",
  accessLevel: "",
  treatments: "",
  nominatedBy: "",
  nominatedOn: "",
  updatedBy: "",
  updatedOn: "",
};

/** The restrictions a project's own state holds (Adelaide Hills only) and the restricted species Explore generalises. */
function projectRestrictions(project: SearchEvent): Draft[] {
  const drafts: Draft[] = [];
  const reviewedOn = addDays(project.startDate, 8);
  const approvedOn = addDays(project.startDate, 12);
  const stamp = { reviewer: REVIEWING_ADMIN_NAME, reviewedOn, approver: REVIEWING_ADMIN_NAME, approvedOn, updatedBy: project.contributorName ?? "", updatedOn: agoToIso(project.updated) };

  if (project.id === ADELAIDE_HILLS_ID) {
    const state = registrationRestrictions;
    if (state.enabledTypes.has("embargo")) {
      const labels = state.embargo.types.map((t) => EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label ?? t);
      drafts.push({
        ...blank,
        ...stamp,
        privacy: "Project embargo",
        embargoType: labels.join(", "),
        embargoDetails: state.embargo.reason,
        embargoTo: state.embargo.endDate?.toString() ?? "",
        accessLevel: "Internal only",
        treatments: "Withhold from general release",
      });
    }
    if (state.enabledTypes.has("species")) {
      for (const entry of state.species) {
        const rows = entry.scope === "all" ? [null] : entry.concepts;
        for (const concept of rows) {
          const sub = concept ? SPECIES_CONCEPTS.find((o) => o.id === concept.concept)?.label ?? "" : "All attributes";
          const value = concept ? conceptValueLabel(concept) : "All data";
          drafts.push({
            ...blank,
            ...stamp,
            privacy: "Sensitive species",
            sensitiveType: "Species",
            attribute: "Species",
            attributeValue: entry.speciesId,
            subAttribute: sub,
            subAttributeValue: value,
            justification: entry.justification,
            accessLevel: concept ? accessFor(concept.concept, value) : "Highly restricted",
            treatments: concept ? treatmentFor(concept.concept, sub, value, null) : "Withhold precise coordinates",
          });
        }
      }
    }
  }

  // Restricted (Level 2) species: one row per species on the project, its location generalised by the app's own rule.
  const seen = new Set<string>();
  for (const occ of searchOccurrences) {
    if (occ.licenceLevel !== "Level 2" || !hasScientificName(occ.species) || seen.has(occ.species)) continue;
    const event = searchEvents.find((e) => e.id === occ.parentEventId);
    if ((event ? projectFor(event)?.id : undefined) !== project.id) continue;
    seen.add(occ.species);
    const km = restrictedRadiusKm(occ) ?? 10;
    drafts.push({
      ...blank,
      ...stamp,
      privacy: "Sensitive species",
      sensitiveType: "Species",
      attribute: "Species",
      attributeValue: occ.species,
      subAttribute: "Location (coordinates)",
      subAttributeValue: `Generalise to ${km} km`,
      accessLevel: "Restricted",
      treatments: `Generalise to ${km} km grid`,
    });
  }
  return drafts;
}

function projectFor(event: SearchEvent): SearchEvent | undefined {
  let current: SearchEvent | undefined = event;
  while (current?.parentId) current = searchEvents.find((e) => e.id === current!.parentId);
  return current;
}

/** The value a nomination's attribute protects, in words: the named areas for a location, the label otherwise. */
function nominationValue(a: NominationAttribute): string {
  if (a.attribute === "location" && a.areas.length > 0) return a.areas.map((area) => area.name).join(", ");
  return attributeValueLabel(a);
}

/** The restrictions a sensitive species nomination makes on one project: one row per attribute it protects. */
function nominationRestrictions(n: Nomination): Draft[] {
  if (n.status !== "accepted" && n.status !== "under_review") return [];
  const submitted = n.history.find((e) => e.status === "submitted");
  const review = n.history.find((e) => e.status === "under_review");
  const decision = n.history.find((e) => e.status === "accepted");
  const last = n.history[n.history.length - 1];
  const accepted = n.status === "accepted";
  const group = searchOccurrences.find((o) => o.species === n.speciesId)?.group;
  const radius = restrictedRadiusKm({ licenceLevel: "Level 2", group });

  const attributes = n.scope === "all" || n.attributes.length === 0 ? [null] : n.attributes;
  return attributes.map((a) => {
    const concept = a?.attribute ?? null;
    const value = a ? nominationValue(a) : "All data";
    const label = a ? attributeLabel(a) : "All attributes";
    return {
      ...blank,
      privacy: "Sensitive species",
      sensitiveType: "Species",
      attribute: "Species",
      attributeValue: n.speciesId,
      subAttribute: label,
      subAttributeValue: value,
      justification: n.justification,
      reviewer: review?.by ?? "",
      reviewedOn: review?.at ?? "",
      approver: accepted ? (decision?.by ?? REVIEW_PANEL) : "",
      approvedOn: accepted ? (decision?.at ?? "") : "",
      // A nomination the panel is still reviewing has no access level or treatment yet: nothing is applied until it is accepted.
      accessLevel: accepted ? accessFor(concept, value) : "",
      treatments: accepted ? (a ? treatmentFor(concept, label, value, radius) : "Withhold precise coordinates") : "",
      nominatedBy: n.nominator.name,
      nominatedOn: submitted?.at ?? "",
      updatedBy: last?.by ?? n.nominator.name,
      updatedOn: n.updatedAt,
    };
  });
}

/** Every restriction on the platform, for the nominations as they stand. */
export function allRestrictions(nominations: Nomination[]): RestrictionRow[] {
  const roots = projectRoots();
  const byProject = new Map<string, Draft[]>(roots.map((p) => [p.id, projectRestrictions(p)]));

  const sorted = [...nominations].sort((a, b) => a.id.localeCompare(b.id));
  for (const n of sorted) {
    const drafts = nominationRestrictions(n);
    if (drafts.length === 0) continue;
    // A nomination protects a species wherever it is recorded: one set of rows for each project that holds it.
    const holders = new Set(
      searchOccurrences
        .filter((o) => o.species === n.speciesId)
        .map((o) => {
          const event = searchEvents.find((e) => e.id === o.parentEventId);
          return event ? projectFor(event)?.id : undefined;
        })
        .filter((id): id is string => !!id),
    );
    for (const id of holders) byProject.get(id)?.push(...drafts);
  }

  return roots
    .sort((a, b) => a.code.localeCompare(b.code))
    .flatMap((project) =>
      (byProject.get(project.id) ?? []).map((d, i) => ({
        ...d,
        id: `RS-${project.code.replace(/\D/g, "")}-${String(i + 1).padStart(2, "0")}`,
        projectId: project.id,
        projectCode: project.code,
        projectTitle: project.name,
        projectDescription: project.description ?? "",
        projectStatus: project.status,
        projectStatusColor: project.statusColor,
        startDate: project.startDate,
        endDate: hasEndDate(project.endDate) ? project.endDate : "",
        createdBy: project.contributorName ?? "",
        // The app records no date a project was created, so the column is left empty.
        createdOn: "",
      })),
    );
}

// ── Who sees what ──
/** BioData Admin sees every restriction; everyone else sees the restrictions on the projects they contribute to and
 *  the ones on nominations they submitted. */
export function visibleTo(rows: RestrictionRow[], role: UserRole): RestrictionRow[] {
  if (role === "biodata-admin") return rows;
  const mine = new Set(reportProjectsFor(role).map((p) => p.id));
  return rows.filter((r) => mine.has(r.projectId) || r.nominatedBy === CURRENT_USER_NAME);
}

// ── Display ──
/** An ISO day as milliseconds, for a date filter; null when the row has no such date. */
export const msOf = (iso: string) => (iso ? Date.parse(iso) : null);

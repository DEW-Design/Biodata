import { COLLECTION_METHOD_OPTIONS, EMBARGO_TYPE_OPTIONS, FOCUS_AREA_OPTIONS, PERMIT_TYPE_OPTIONS, PROJECT_METADATA_CONCEPTS, REGISTRATION_SPECIES, ROLE_OF_WORK_OPTIONS, SURVEY_TYPE_OPTIONS } from "@/app/pages/project-registration/data";
import type { DataCollectionState, ProjectDetailsState, RestrictionsState, RestrictionTypeKey } from "@/app/pages/project-registration/types";

// What changed between two saves of a project, as the project audit log records it: one entry per field whose value, read the way
// the project page shows it, is different (project-audit-log-store.ts). The field names are the ones the Project Detail Report
// uses for the same facts. A value is its text; a field that is empty reads as an empty string, which the report leaves blank.

/** The part of a project the log compares: the registration's three sections and its status. */
export interface ProjectFieldState {
  details: ProjectDetailsState;
  collection: DataCollectionState;
  restrictions: RestrictionsState;
  status: string;
}

export interface FieldChange {
  field: string;
  previous: string;
  current: string;
}

const labelOf = (options: { id: string; label: string }[], id: string | null | undefined) => (id ? (options.find((o) => o.id === id)?.label ?? id) : "");
const day = (d: { toString: () => string } | null) => (d ? d.toString() : "");
const person = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
const list = (values: string[]) => values.filter(Boolean).join("; ");

const RESTRICTION_TITLES: Record<RestrictionTypeKey, string> = {
  embargo: "Embargo",
  species: "Species restriction",
  locations: "Location restriction",
  metadata: "Project metadata restriction",
  other: "Other restriction",
};

const roleText = (d: ProjectDetailsState) => (d.roleOfWork === "other" ? d.roleOfWorkOther : labelOf(ROLE_OF_WORK_OPTIONS, d.roleOfWork));

/** The fields compared, each as a name and a way to read it. */
const FIELDS: { field: string; read: (s: ProjectFieldState) => string }[] = [
  { field: "Project title", read: (s) => s.details.shortTitle },
  { field: "Full title", read: (s) => (s.details.sameAsShortTitle ? "" : s.details.fullTitle) },
  { field: "Project description", read: (s) => s.details.abstract },
  { field: "Status", read: (s) => s.status },
  { field: "Start date", read: (s) => day(s.details.startDate) },
  { field: "End date", read: (s) => day(s.details.endDate) },
  { field: "Project owner", read: (s) => (s.details.dataOwnerType === "organisation" ? s.details.dataOwnerOrgName : person(s.details.dataOwnerContacts[0] ?? { firstName: "", lastName: "" })) },
  { field: "Owner contact", read: (s) => list(s.details.dataOwnerContacts.map((c) => [person(c), c.email, c.phone].filter(Boolean).join(", "))) },
  { field: "Owner role", read: (s) => roleText(s.details) },
  { field: "Project manager", read: (s) => list(s.details.projectManagers.map(person)) },
  { field: "Project manager email", read: (s) => list(s.details.projectManagers.map((m) => m.email)) },
  {
    field: "Project location",
    read: (s) => {
      const e = s.collection.geographicExtent;
      return e.boundary?.label ?? e.shapefileName ?? (e.method ? `Defined by ${e.method}` : "");
    },
  },
  { field: "Focus areas", read: (s) => list(s.collection.focusAreas.map((id) => (id === "other" && s.collection.focusAreaOther ? s.collection.focusAreaOther : labelOf(FOCUS_AREA_OPTIONS, id)))) },
  { field: "Survey type", read: (s) => labelOf(SURVEY_TYPE_OPTIONS, s.collection.surveyType) },
  { field: "Data collection method", read: (s) => labelOf(COLLECTION_METHOD_OPTIONS, s.collection.collectionMethod) },
  { field: "Methodology", read: (s) => s.collection.methodDetails },
  { field: "Targeted species", read: (s) => list(s.collection.targetedSpeciesIds.map((id) => REGISTRATION_SPECIES.find((sp) => sp.id === id)?.commonName ?? id)) },
  { field: "Permit type", read: (s) => list(s.collection.permits.map((p) => labelOf(PERMIT_TYPE_OPTIONS, p.type))) },
  { field: "Permit number", read: (s) => list(s.collection.permits.map((p) => p.number)) },
  { field: "URI/DOI number", read: (s) => s.collection.uriDoi },
  { field: "Limitations and biases", read: (s) => s.collection.limitationsAndBiases },
  { field: "Project restriction", read: (s) => (s.restrictions.hasRestrictions ? list([...s.restrictions.enabledTypes].map((k) => RESTRICTION_TITLES[k])) : "") },
  { field: "Embargo type", read: (s) => list(s.restrictions.embargo.types.map((t) => (t === "other" ? s.restrictions.embargo.typeOther : labelOf(EMBARGO_TYPE_OPTIONS, t)))) },
  { field: "Embargo reason", read: (s) => s.restrictions.embargo.reason },
  { field: "Embargo end date", read: (s) => day(s.restrictions.embargo.endDate) },
  { field: "Restricted species", read: (s) => list(s.restrictions.species.map((r) => REGISTRATION_SPECIES.find((sp) => sp.id === r.speciesId)?.commonName ?? r.speciesId)) },
  { field: "Restricted location", read: (s) => list(s.restrictions.locations.map((l) => l.name)) },
  { field: "Restricted project metadata", read: (s) => list(s.restrictions.metadata.concepts.map((c) => (c.concept === "other" ? c.conceptOther : labelOf(PROJECT_METADATA_CONCEPTS, c.concept)))) },
  { field: "Other restriction", read: (s) => s.restrictions.otherRestrictions },
];

export function diffProjectFields(before: ProjectFieldState, after: ProjectFieldState): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const { field, read } of FIELDS) {
    const previous = read(before);
    const current = read(after);
    if (previous !== current) changes.push({ field, previous, current });
  }
  return changes;
}

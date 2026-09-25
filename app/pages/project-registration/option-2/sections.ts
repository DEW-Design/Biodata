import { isGeoExtentComplete, type DataCollectionState, type ProjectDetailsState, type RestrictionsState, type RestrictionTypeKey } from "../types";
import { isTypeValid, RESTRICTION_TYPE_META } from "../step-3-privacy-restrictions";

// The Add Project flow's sections for the second (three-column) layout. The first layout asks one
// question per card (~14 cards before Create); here related fields share a screen, grouped by how
// a person thinks about the project (what it is, who owns it, who runs it), and column 2 lists
// every section so the whole flow - and what still needs attention - is visible at once.
//
// Steps and their titles/descriptions come from the same Figma wireframe as the first layout
// (node 2298:179004): Project Identification / Data Collection and Storage / Privacy and
// Restrictions.

export type SectionId = "basics" | "owner" | "team" | "extent" | "method" | "restrictions" | RestrictionTypeKey | "review";

export interface FormState {
  details: ProjectDetailsState;
  collection: DataCollectionState;
  restrictions: RestrictionsState;
}

export interface SectionMeta {
  id: SectionId;
  step: 1 | 2 | 3 | null;
  title: string;
  description: string;
}

export const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: "Project Identification",
  2: "Data Collection and Storage",
  3: "Privacy and Restrictions",
};

const FIXED_SECTIONS: Record<Exclude<SectionId, RestrictionTypeKey>, Omit<SectionMeta, "id">> = {
  basics: { step: 1, title: "Project basics", description: "What the project is called, what it is about, and when it runs." },
  owner: { step: 1, title: "Data owner", description: "The organisation or person responsible for this project's data, and who to contact about it." },
  team: { step: 1, title: "Project team", description: "Your role on the project, and who manages it day to day." },
  extent: { step: 2, title: "Extent and focus", description: "Where the data was collected and which domains the project covers." },
  method: { step: 2, title: "Method and details", description: "How the data was collected, plus any permits, identifiers or limitations." },
  restrictions: { step: 3, title: "Restrictions", description: "BDBSA data is open access by default. Choose which protections, if any, apply to this project." },
  review: { step: null, title: "Review and create", description: "Check every section, then create the project." },
};

const TYPE_TITLES: Record<RestrictionTypeKey, { title: string; description: string }> = {
  embargo: { title: "Embargo", description: "Choose why this project is embargoed and when it should become available." },
  species: { title: "Species restrictions", description: "Nominate every species whose records in this project should be treated as sensitive." },
  locations: { title: "Location restrictions", description: "Nominate every location whose records in this project should be protected." },
  metadata: { title: "Project metadata restrictions", description: "Pick the project details to protect, and tell us why." },
  other: { title: "Other restrictions", description: "Anything not covered by the other restriction types." },
};

export function sectionMeta(id: SectionId): SectionMeta {
  if (id in TYPE_TITLES) return { id, step: 3, ...TYPE_TITLES[id as RestrictionTypeKey] };
  return { id, ...FIXED_SECTIONS[id as Exclude<SectionId, RestrictionTypeKey>] };
}

/** Every section in order - the restriction-type sections appear only once that type is ticked. */
export function visibleSections(restrictions: RestrictionsState): SectionId[] {
  const types = restrictions.hasRestrictions ? RESTRICTION_TYPE_META.map((m) => m.key).filter((k) => restrictions.enabledTypes.has(k)) : [];
  return ["basics", "owner", "team", "extent", "method", "restrictions", ...types, "review"];
}

function contactValid(c: ProjectDetailsState["dataOwnerContacts"][number] | undefined): boolean {
  return !!c && c.firstName.trim().length > 0 && c.lastName.trim().length > 0 && c.email.trim().length > 0;
}

export function isSectionValid(id: SectionId, s: FormState): boolean {
  const d = s.details;
  const c = s.collection;
  switch (id) {
    case "basics":
      return d.shortTitle.trim().length > 0 && d.abstract.trim().length > 0 && !!d.startDate;
    case "owner":
      return (d.dataOwnerType === "individual" || d.dataOwnerOrgName.trim().length > 0) && contactValid(d.dataOwnerContacts[0]);
    case "team":
      return (
        !!d.roleOfWork &&
        (d.roleOfWork !== "other" || d.roleOfWorkOther.trim().length > 0) &&
        d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim())
      );
    case "extent":
      return isGeoExtentComplete(c.geographicExtent) && c.focusAreas.length > 0 && (!c.focusAreas.includes("other") || c.focusAreaOther.trim().length > 0);
    case "method":
      return !!c.collectionMethod && c.methodDetails.trim().length > 0;
    case "restrictions":
      return !s.restrictions.hasRestrictions || s.restrictions.enabledTypes.size > 0;
    case "review":
      return visibleSections(s.restrictions)
        .filter((sec) => sec !== "review")
        .every((sec) => isSectionValid(sec, s));
    default:
      return isTypeValid(id, s.restrictions);
  }
}

/** The whole form: every visible section valid (what "Create project" needs). */
export function isFormValid(s: FormState): boolean {
  return isSectionValid("review", s);
}

/** The mandatory details a section is still missing, named the way the form labels them. Shown in the
 *  "Details missing" alert when Continue is pressed. Empty exactly when `isSectionValid` is true. */
export function missingFields(id: SectionId, s: FormState): string[] {
  const d = s.details;
  const c = s.collection;
  const r = s.restrictions;
  const out: string[] = [];
  const blank = (v: string) => !v.trim();
  switch (id) {
    case "basics":
      if (blank(d.shortTitle)) out.push("Project name");
      if (blank(d.abstract)) out.push("Abstract");
      if (!d.startDate) out.push("Start date");
      break;
    case "owner": {
      const contact = d.dataOwnerContacts[0];
      if (d.dataOwnerType === "organisation" && blank(d.dataOwnerOrgName)) out.push("Organisation / Institution name");
      if (!contact || blank(contact.firstName)) out.push("Primary contact first name");
      if (!contact || blank(contact.lastName)) out.push("Primary contact last name");
      if (!contact || blank(contact.email)) out.push("Primary contact email");
      break;
    }
    case "team":
      if (!d.roleOfWork) out.push("Your role");
      else if (d.roleOfWork === "other" && blank(d.roleOfWorkOther)) out.push("Your role (please specify)");
      if (!d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim())) out.push("A project manager with a name and email");
      break;
    case "extent":
      if (!isGeoExtentComplete(c.geographicExtent)) out.push("Geographic extent");
      if (c.focusAreas.length === 0) out.push("Focus areas");
      if (c.focusAreas.includes("other") && blank(c.focusAreaOther)) out.push("Focus area (please specify)");
      break;
    case "method":
      if (!c.collectionMethod) out.push("Method of data collection");
      if (blank(c.methodDetails)) out.push("Method details");
      break;
    case "restrictions":
      if (r.hasRestrictions && r.enabledTypes.size === 0) out.push("At least one kind of restriction");
      break;
    case "embargo":
      if (r.embargo.types.length === 0) out.push("Type of embargo");
      if (r.embargo.types.includes("other") && blank(r.embargo.typeOther)) out.push("Embargo type (please specify)");
      if (blank(r.embargo.reason)) out.push("Embargo reason");
      if (!r.embargo.endDate) out.push("Embargo end date");
      break;
    case "species":
      if (r.species.length === 0) out.push("At least one species");
      else if (!isTypeValid("species", r)) out.push("Details for each restricted species");
      break;
    case "locations":
      if (r.locations.length === 0) out.push("At least one location");
      break;
    case "metadata":
      if (!isTypeValid("metadata", r)) out.push("A project detail to restrict, and the justification");
      break;
    case "other":
      if (blank(r.otherRestrictions)) out.push("Description of the restriction");
      break;
    case "review":
      for (const sec of visibleSections(r)) if (sec !== "review" && !isSectionValid(sec, s)) out.push(sectionMeta(sec).title);
      break;
  }
  return out;
}

import { OTHER_METHODOLOGY } from "../methodology-fields";
import { isGeoExtentComplete, type DataCollectionState, type MethodologyChoice, type ProjectContact, type ProjectDetailsState, type RestrictionsState, type RestrictionTypeKey } from "../types";
import { isTypeValid, OFFERED_RESTRICTION_TYPES } from "../step-3-privacy-restrictions";

// The Add Project flow's sections for the second (three-column) layout. The first layout asks one
// question per card (~14 cards before Create); here related fields share a screen, grouped by how
// a person thinks about the project (what it is, who owns it, who runs it), and column 2 lists
// every section so the whole flow - and what still needs attention - is visible at once.
//
// Steps and their titles/descriptions come from the same Figma wireframe as the first layout
// (node 2298:179004): Project Identification / Data Collection and Storage / Privacy and
// Restrictions. The designer renamed the second step "Data Collection and Methodology" (2 Oct 2026).

/** Option 2 has two versions, compared on the Prototype tools bar (the designer, 9 Oct 2026). Version 2: one Project
 *  contacts list with a role per person, focus areas in Method and details, no survey type, and one Methodology question:
 *  Incidental observations, Systematic or Not recorded, a Systematic project adding each methodology it used, one at a
 *  time, with its own variation, limitation or bias. Every function here takes the
 *  version and defaults to 1, so the project page's edit form, which reuses these, is unchanged. */
export type FormVersion = 1 | 2;

/** The longest project name version 2 accepts: short enough for a card, a breadcrumb and a table column. */
export const PROJECT_NAME_MAX = 60;

export type SectionId = "basics" | "owner" | "extent" | "method" | "restrictions" | RestrictionTypeKey | "review";

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
  2: "Data Collection and Methodology",
  3: "Privacy and Restrictions",
};

const FIXED_SECTIONS: Record<Exclude<SectionId, RestrictionTypeKey>, Omit<SectionMeta, "id">> = {
  basics: { step: 1, title: "Project basics", description: "What the project is called, what it is about, and when it runs." },
  // Project team was rolled into this section (the designer, 2 Oct 2026: "roll all step 3 into step 2"); your role
  // then moved to Step 2's Method and details (6 Oct 2026: "Role should be shown in Step 2").
  owner: { step: 1, title: "Data owner", description: "The organisation or person responsible for this project's data, who to contact about it, and who manages it day to day." },
  extent: { step: 2, title: "Extent and focus", description: "Where the data was collected and which domains the project covers." },
  method: { step: 2, title: "Method and details", description: "The kind of survey, how the data was collected and your role in it, plus any permits, identifiers or limitations." },
  restrictions: { step: 3, title: "Restrictions", description: "BDBSA data is open access by default. Choose which protections, if any, apply to this project." },
  review: { step: null, title: "Review and create", description: "Check every section, then create the project." },
};

// Version 2 moved focus areas into Method and details, and took survey type and your role out of it.
const FIXED_SECTIONS_V2: Partial<typeof FIXED_SECTIONS> = {
  owner: { step: 1, title: "Data owner", description: "The organisation or person responsible for this project's data, and the people to contact about it." },
  extent: { step: 2, title: "Geographic extent", description: "Where the data was collected." },
  method: { step: 2, title: "Method and details", description: "Which domains the project covers and how the data was collected, plus any permits or identifiers." },
};

const TYPE_TITLES: Record<RestrictionTypeKey, { title: string; description: string }> = {
  embargo: { title: "Embargo", description: "Choose why this project is embargoed and when it should become available." },
  species: { title: "Species restrictions", description: "Nominate every species whose records in this project should be treated as sensitive." },
  locations: { title: "Location restrictions", description: "Nominate every location whose records in this project should be protected." },
  metadata: { title: "Project metadata restrictions", description: "Pick the project details to protect, and tell us why." },
  other: { title: "Other restrictions", description: "Anything not covered by the other restriction types." },
};

// "Other restrictions" is hidden for now (the designer, 2 Oct 2026): nothing offers it, so it never has a
// section here, even though the type still exists for a project that already has one.
const OFFERED_TYPES = OFFERED_RESTRICTION_TYPES.map((m) => m.key);

export function sectionMeta(id: SectionId, version: FormVersion = 1): SectionMeta {
  if (id in TYPE_TITLES) return { id, step: 3, ...TYPE_TITLES[id as RestrictionTypeKey] };
  const key = id as Exclude<SectionId, RestrictionTypeKey>;
  return { id, ...((version === 2 && FIXED_SECTIONS_V2[key]) || FIXED_SECTIONS[key]) };
}

/** Every section in order - the restriction-type sections appear only once that type is ticked. */
export function visibleSections(restrictions: RestrictionsState): SectionId[] {
  const types = restrictions.hasRestrictions ? OFFERED_TYPES.filter((k) => restrictions.enabledTypes.has(k)) : [];
  return ["basics", "owner", "extent", "method", "restrictions", ...types, "review"];
}

function contactValid(c: ProjectDetailsState["dataOwnerContacts"][number] | undefined): boolean {
  return !!c && c.firstName.trim().length > 0 && c.lastName.trim().length > 0 && c.email.trim().length > 0;
}

function roleValid(d: ProjectDetailsState): boolean {
  return !!d.roleOfWork && (d.roleOfWork !== "other" || d.roleOfWorkOther.trim().length > 0);
}

// ── Version 2 ──

export const contactsOf = (d: ProjectDetailsState): ProjectContact[] => d.projectContacts ?? [];
const contactRoleValid = (p: ProjectContact) => !!p.role && (p.role !== "other" || p.roleOther.trim().length > 0);

/** Every mandatory detail of the Project contacts list, named the way the form labels it. */
function missingContactFields(d: ProjectDetailsState): string[] {
  const people = contactsOf(d);
  const out: string[] = [];
  people.forEach((p, i) => {
    const who = people.length > 1 ? `Contact ${i + 1} ` : "";
    if (!p.firstName.trim()) out.push(`${who}first name`.trim());
    if (!p.lastName.trim()) out.push(`${who}last name`.trim());
    if (!p.email.trim()) out.push(`${who}email`.trim());
    if (!p.role) out.push(`${who}role in project`.trim());
    else if (!contactRoleValid(p)) out.push(`${who}role in project (please specify)`.trim());
  });
  if (!people.some((p) => p.isPrimary)) out.push("A primary contact");
  // An organisation names who manages the project, as version 1 asked; an individual owner is the person.
  if (d.dataOwnerType === "organisation" && !people.some((p) => p.isManager)) out.push("A project manager");
  return out.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
}

function missingMethodFieldsV2(c: DataCollectionState): string[] {
  const out: string[] = [];
  if (c.focusAreas.length === 0) out.push("Focus areas");
  if (c.focusAreas.includes("other") && !c.focusAreaOther.trim()) out.push("Focus area (please specify)");
  if (!c.collectionMethod) out.push("Methodology");
  if (c.collectionMethod === "systematic") {
    const chosen = c.methodologies ?? [];
    if (chosen.length === 0) out.push("At least one methodology");
    if (chosen.some((m) => m.id === OTHER_METHODOLOGY && !m.other?.trim())) out.push("Other methodology (please name it)");
  }
  return out;
}

function missingFieldsV2(id: SectionId, s: FormState): string[] | null {
  const d = s.details;
  switch (id) {
    case "owner":
      return [...(d.dataOwnerType === "organisation" && !d.dataOwnerOrgName.trim() ? ["Organisation / Institution name"] : []), ...missingContactFields(d)];
    case "extent":
      return isGeoExtentComplete(s.collection.geographicExtent) ? [] : ["Geographic extent"];
    case "method":
      return missingMethodFieldsV2(s.collection);
    default:
      return null;
  }
}

/** The methodologies as text: names for `methodDetails`, and each note under its name for `limitationsAndBiases`. */
export function methodologySummary(c: DataCollectionState): { names: string; notes: string } {
  const label = (m: MethodologyChoice) => (m.id === OTHER_METHODOLOGY && m.other?.trim() ? m.other.trim() : m.id);
  const chosen = c.collectionMethod === "systematic" ? (c.methodologies ?? []) : [];
  return {
    names: chosen.map(label).join(", "),
    notes: chosen
      .filter((m) => m.note.trim())
      .map((m) => `${label(m)}: ${m.note.trim()}`)
      .join("\n"),
  };
}

/** A version 2 form as the project page reads it: the contacts written out as the data owner's contacts (the primary
 *  first) and the project managers, and the methodologies as `methodDetails` and `limitationsAndBiases`. */
export function toSavedForm(s: FormState, version: FormVersion): FormState {
  if (version === 1) return s;
  const people = contactsOf(s.details);
  const primary = people.find((p) => p.isPrimary) ?? people[0];
  const ordered = primary ? [primary, ...people.filter((p) => p !== primary)] : people;
  const { names, notes } = methodologySummary(s.collection);
  return {
    ...s,
    details: {
      ...s.details,
      roleOfWork: primary?.role ?? null,
      roleOfWorkOther: primary?.roleOther ?? "",
      dataOwnerContacts: ordered.map(({ id, firstName, lastName, email, phone, role, roleOther }) => ({ id, firstName, lastName, email, phone, role, roleOther })),
      projectManagers: people.filter((p) => p.isManager).map(({ id, firstName, lastName, email, phone, organisation, role, roleOther, isPrimary }) => ({ id, firstName, lastName, email, phone, organisation, role, roleOther, isPrimary })),
    },
    collection: { ...s.collection, surveyType: null, methodDetails: names, limitationsAndBiases: notes },
  };
}

export function isSectionValid(id: SectionId, s: FormState, version: FormVersion = 1): boolean {
  if (version === 2) {
    if (id === "review") return visibleSections(s.restrictions).filter((sec) => sec !== "review").every((sec) => isSectionValid(sec, s, 2));
    const v2 = missingFieldsV2(id, s);
    if (v2) return v2.length === 0;
  }
  const d = s.details;
  const c = s.collection;
  switch (id) {
    case "basics":
      return d.shortTitle.trim().length > 0 && d.abstract.trim().length > 0 && !!d.startDate;
    case "owner":
      return (
        (d.dataOwnerType === "individual" || d.dataOwnerOrgName.trim().length > 0) &&
        contactValid(d.dataOwnerContacts[0]) &&
        // An individual owner is the person: they give their role here and have no project managers; an organisation names its managers.
        (d.dataOwnerType === "individual" ? roleValid(d) : d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim()))
      );
    case "extent":
      return isGeoExtentComplete(c.geographicExtent) && c.focusAreas.length > 0 && (!c.focusAreas.includes("other") || c.focusAreaOther.trim().length > 0);
    case "method":
      return !!c.surveyType && !!c.collectionMethod && c.methodDetails.trim().length > 0 && (d.dataOwnerType === "individual" || roleValid(d));
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
export function isFormValid(s: FormState, version: FormVersion = 1): boolean {
  return isSectionValid("review", s, version);
}

/** The data owner half of the Data owner section: the owner and the primary contact. The project page edits
 *  it as its own card. */
export function missingOwnerFields(s: FormState): string[] {
  const d = s.details;
  const contact = d.dataOwnerContacts[0];
  const out: string[] = [];
  if (d.dataOwnerType === "organisation" && !d.dataOwnerOrgName.trim()) out.push("Organisation / Institution name");
  if (!contact || !contact.firstName.trim()) out.push("Primary contact first name");
  if (!contact || !contact.lastName.trim()) out.push("Primary contact last name");
  if (!contact || !contact.email.trim()) out.push("Primary contact email");
  return out;
}

/** The team half of the Data owner section (it was the Project team section): the managers of an organisation, or the role of an individual. */
export function missingTeamFields(s: FormState): string[] {
  const d = s.details;
  const out: string[] = [];
  if (d.dataOwnerType === "individual") {
    if (!d.roleOfWork) out.push("Your role");
    else if (d.roleOfWork === "other" && !d.roleOfWorkOther.trim()) out.push("Your role (please specify)");
  } else if (!d.projectManagers.some((m) => m.firstName.trim() && m.lastName.trim() && m.email.trim())) out.push("A project manager with a name and email");
  return out;
}

/** The mandatory details a section is still missing, named the way the form labels them. Shown in the
 *  "Details missing" alert when Continue is pressed. Empty exactly when `isSectionValid` is true. */
export function missingFields(id: SectionId, s: FormState, version: FormVersion = 1): string[] {
  if (version === 2) {
    if (id === "review") return visibleSections(s.restrictions).filter((sec) => sec !== "review" && !isSectionValid(sec, s, 2)).map((sec) => sectionMeta(sec, 2).title);
    const v2 = missingFieldsV2(id, s);
    if (v2) return v2;
  }
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
    case "owner":
      out.push(...missingOwnerFields(s), ...missingTeamFields(s));
      break;
    case "extent":
      if (!isGeoExtentComplete(c.geographicExtent)) out.push("Geographic extent");
      if (c.focusAreas.length === 0) out.push("Focus areas");
      if (c.focusAreas.includes("other") && blank(c.focusAreaOther)) out.push("Focus area (please specify)");
      break;
    case "method":
      if (!c.surveyType) out.push("Survey type");
      if (!c.collectionMethod) out.push("Method of data collection");
      if (blank(c.methodDetails)) out.push("Methodology");
      if (d.dataOwnerType === "organisation") {
        if (!d.roleOfWork) out.push("Your role");
        else if (d.roleOfWork === "other" && blank(d.roleOfWorkOther)) out.push("Your role (please specify)");
      }
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

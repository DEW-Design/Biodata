// Shared form-state shapes for the 3-step Add Project wizard (see page.tsx's own header comment
// for the Figma source and overall design). Pure data - no components import from here except to
// read/write this shape, so the step files can stay focused on their own JSX.

import type { DateValue } from "react-aria-components";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";

// ── Step 1: Project Details ──

export type DataOwnerType = "organisation" | "individual";

export interface ContactPerson {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    /** The contact's own team/organisation, if it differs from the project's own publishing
     *  organisation (`dataOwnerOrgName`) - e.g. a DEW staffer publishing on behalf of a partner
     *  org still belongs to their own internal team. Optional and not asked by the wizard's own
     *  Data Owner step today (that step only asks for the org name once, not per contact) - real
     *  display-only detail a caller can set directly on seed data, same as `ProjectManager.
     *  organisation` already supports per manager. */
    organisation?: string;
}

export function emptyContact(id: number): ContactPerson {
    return { id, firstName: "", lastName: "", email: "", phone: "" };
}

// A Project Manager, per Figma's own "Project Manager/s" card (node 2298:175996) - richer than a
// name-only pick: First/Last/Email are the card's own required fields (asterisked in the source),
// Organisation/Role/Phone/Primary are present in the same card but carry no asterisk there - i.e.
// real, optional, per-person detail, not a second mandatory block. Flagged directly by the user
// off the first pass, which only captured a name.
export interface ProjectManager {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    organisation: string;
    /** A `ROLE_OF_WORK_OPTIONS` id - the same role vocabulary as the top-level "Role or type of
     *  work" question, since Figma's own "Role or type of work" select for a manager offers the
     *  identical option list. */
    role: string | null;
    roleOther: string;
    isPrimary: boolean;
}

export function emptyProjectManager(id: number): ProjectManager {
    return { id, firstName: "", lastName: "", email: "", phone: "", organisation: "", role: null, roleOther: "", isPrimary: false };
}

/** Optional org/institution logo picked on Step 1's data-ownership card - a local object URL
 *  only (no backend exists in this build), see logo-upload.tsx. */
export interface OrgLogo {
    fileName: string;
    sizeBytes: number;
    previewUrl: string;
}

export interface ProjectDetailsState {
    roleOfWork: string | null;
    roleOfWorkOther: string;
    shortTitle: string;
    fullTitle: string;
    /** Defaults `true` - Full Title mirrors Short Title until the user explicitly asks to
     *  customise it (see the Step 1 "optional details" review screen). Inverted from an early
     *  version of this field, which defaulted `false` and asked for both titles up front. */
    sameAsShortTitle: boolean;
    abstract: string;
    startDate: DateValue | null;
    endDate: DateValue | null;
    dataOwnerType: DataOwnerType;
    dataOwnerOrgName: string;
    dataOwnerOrgLogo: OrgLogo | null;
    dataOwnerContacts: ContactPerson[];
    projectManagers: ProjectManager[];
}

export function initialProjectDetails(): ProjectDetailsState {
    return {
        roleOfWork: null,
        roleOfWorkOther: "",
        shortTitle: "",
        fullTitle: "",
        sameAsShortTitle: true,
        abstract: "",
        startDate: null,
        endDate: null,
        dataOwnerType: "organisation",
        dataOwnerOrgName: "",
        dataOwnerOrgLogo: null,
        dataOwnerContacts: [emptyContact(1)],
        // The first manager defaults to Primary Contact - a project always has a real single
        // point of contact in practice, and defaulting it removes a click for the common case
        // (one manager) rather than asking the user to flip a toggle that only ever has one
        // sensible answer. Flagged directly by the user off the first pass, which left every
        // manager unset by default.
        projectManagers: [{ ...emptyProjectManager(1), isPrimary: true }],
    };
}

// ── Shared: geographic extent (Step 2's own extent, and every location restriction entry) ──

export type GeoMethod = "shapefile" | "map" | "list" | "coordinates";

export interface GeoExtentValue {
    method: GeoMethod | null;
    shapefileName?: string;
    /** Set by "Draw on the Map" or "Coordinates". */
    boundary?: Boundary | null;
    /** Set by "Choose from a List" - the selected national park's id. */
    parkId?: string;
}

export function emptyGeoExtent(): GeoExtentValue {
    return { method: null, boundary: null };
}

export function isGeoExtentComplete(extent: GeoExtentValue): boolean {
    if (extent.method === "shapefile") return !!extent.shapefileName;
    if (extent.method === "list") return !!extent.parkId;
    if (extent.method === "map" || extent.method === "coordinates") return !!extent.boundary;
    return false;
}

// ── Step 2: Data Collection Details ──

export type CollectionMethod = "incidental" | "systematic" | "unknown" | "other";

export interface PermitRow {
    id: number;
    type: string | null;
    number: string;
}

export function emptyPermitRow(id: number): PermitRow {
    return { id, type: null, number: "" };
}

export interface DataCollectionState {
    geographicExtent: GeoExtentValue;
    focusAreas: string[];
    /** Only populated when `focusAreas` includes `"other"` - the user's own free-text description
     *  of the additional, non-listed domain, same "Other" reveal pattern as `roleOfWorkOther`. */
    focusAreaOther: string;
    targetedSpeciesIds: string[];
    collectionMethod: CollectionMethod | null;
    methodDetails: string;
    permits: PermitRow[];
    uriDoi: string;
    limitationsAndBiases: string;
}

export function initialDataCollection(): DataCollectionState {
    return {
        geographicExtent: emptyGeoExtent(),
        // "Biological" defaults selected, and can never be unselected - see data.ts's
        // FOCUS_AREA_OPTIONS comment.
        focusAreas: ["biological"],
        focusAreaOther: "",
        targetedSpeciesIds: [],
        collectionMethod: null,
        methodDetails: "",
        permits: [emptyPermitRow(1)],
        uriDoi: "",
        limitationsAndBiases: "",
    };
}

// ── Step 3: Privacy and Restrictions ──

export type RestrictionTypeKey = "embargo" | "species" | "locations" | "metadata" | "other";

export type EmbargoType = "publication" | "completion" | "cultural" | "other";

export interface EmbargoState {
    /** Multi-select, per direct feedback - a project can have more than one real reason to stay
     *  embargoed at once (e.g. both a publication embargo and a cultural one). The system-provided
     *  maximum embargo period is the longest of every selected type's own maximum (see
     *  `data.ts`'s `maxEmbargoMonths`) - the strictest single reason never gets silently
     *  shortened just because a less-restrictive one is also selected. */
    types: EmbargoType[];
    typeOther: string;
    reason: string;
    endDate: DateValue | null;
}

export function emptyEmbargo(): EmbargoState {
    return { types: [], typeOther: "", reason: "", endDate: null };
}

/** "Restrict all concepts" vs. "restrict only the concepts I pick" - the one choice a species
 *  restriction asks (replaces the old custom-restrictions checkbox + All/Specific radio pair). */
export type ConceptScope = "all" | "selected";

/** One restricted concept and its value. Which field holds the value depends on the concept's
 *  own `valueType` (see data.ts's `ConceptOption`): text/select/boolean fill `value`, multi fills
 *  `values`, dateRange fills `dateFrom`/`dateTo`, none uses no value at all. */
export interface ConceptValueRow {
    id: number;
    concept: string | null;
    conceptOther: string;
    value: string;
    values: string[];
    dateFrom: DateValue | null;
    dateTo: DateValue | null;
}

export function emptyConceptRow(id: number): ConceptValueRow {
    return { id, concept: null, conceptOther: "", value: "", values: [], dateFrom: null, dateTo: null };
}

export interface SpeciesRestrictionEntry {
    id: number;
    speciesId: string;
    scope: ConceptScope;
    concepts: ConceptValueRow[];
    justification: string;
}

export interface LocationRestrictionEntry {
    id: number;
    name: string;
    extent: GeoExtentValue;
    justification: string;
}

export interface MetadataRestrictionState {
    concepts: ConceptValueRow[];
    justification: string;
}

export function initialMetadataRestriction(): MetadataRestrictionState {
    return { concepts: [emptyConceptRow(1)], justification: "" };
}

export interface RestrictionsState {
    hasRestrictions: boolean;
    enabledTypes: Set<RestrictionTypeKey>;
    embargo: EmbargoState;
    species: SpeciesRestrictionEntry[];
    locations: LocationRestrictionEntry[];
    metadata: MetadataRestrictionState;
    otherRestrictions: string;
}

export function initialRestrictions(): RestrictionsState {
    return {
        hasRestrictions: false,
        enabledTypes: new Set(),
        embargo: emptyEmbargo(),
        species: [],
        locations: [],
        metadata: initialMetadataRestriction(),
        otherRestrictions: "",
    };
}

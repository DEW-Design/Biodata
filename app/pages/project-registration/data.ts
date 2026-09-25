// Static option lists + real species/persona data this wizard reuses from the rest of the build,
// rather than inventing a second, disconnected dataset. See page.tsx's header comment for why.

import { searchOccurrences, rootProjectForParentEventId, type SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";

export const ROLE_OF_WORK_OPTIONS = [
    { id: "field-survey", label: "Field Survey" },
    { id: "research", label: "Research" },
    { id: "student", label: "Student" },
    { id: "management", label: "Management" },
    { id: "support", label: "Support" },
    { id: "other", label: "Other" },
];

// The same placeholder persona set this build already uses everywhere a "who's involved" list
// needs real, recognisable-as-fake names - never invented fresh ones (see CONTEXT.md's
// "Placeholder person convention").
export const PERSONA_OPTIONS = [
    { id: "olivia-wyatt", label: "Olivia Wyatt" },
    { id: "phoenix-baker", label: "Phoenix Baker" },
    { id: "lana-steiner", label: "Lana Steiner" },
    { id: "maya-dewitt", label: "Maya Dewitt" },
];

// A project can focus on more than one domain at once - Biological is the default (BDBSA is
// fundamentally a biodiversity repository, so almost every project touches it), pre-selected
// rather than left for the user to notice and pick themselves, per direct instruction. The rest
// are real environmental-data domains a project might also collect against alongside it.
export const FOCUS_AREA_OPTIONS = [
    { id: "biological", label: "Biological" },
    { id: "soil", label: "Soil" },
    { id: "water", label: "Water" },
    { id: "land", label: "Land" },
    { id: "marine", label: "Marine" },
    { id: "habitat-vegetation", label: "Habitat / Vegetation Mapping" },
    { id: "other", label: "Other" },
];

export const PERMIT_TYPE_OPTIONS = [
    { id: "scientific-research", label: "Scientific Research Permit" },
    { id: "wildlife-ethics", label: "Animal Ethics Approval" },
    { id: "native-vegetation", label: "Native Vegetation Clearance" },
    { id: "cultural-heritage", label: "Aboriginal Heritage Clearance" },
    { id: "none", label: "None required" },
];

export const COLLECTION_METHOD_OPTIONS: { id: "incidental" | "systematic" | "unknown" | "other"; label: string; description: string }[] = [
    { id: "incidental", label: "Incidental observations", description: "Data collected informally or opportunistically without a predefined sampling method." },
    { id: "systematic", label: "Systematic", description: "Data collected using a structured and repeatable method, often across set time intervals or locations." },
    { id: "unknown", label: "Unknown", description: "The method of data collection is not known or not recorded." },
    { id: "other", label: "Other", description: "Data will be collected using a method not listed here (e.g. media/images)." },
];

// `maxMonths` is this build's own system-provided ceiling per embargo type, not a fabricated real
// BDBSA policy figure - a project completion or cultural/Indigenous embargo genuinely warrants a
// longer maximum than a plain publication embargo, so the numbers differ by type rather than
// sharing one flat cap, but the exact values are this exploratory build's own reasonable default,
// logged here rather than presented as sourced policy.
export const EMBARGO_TYPE_OPTIONS: { id: "publication" | "completion" | "cultural" | "other"; label: string; description: string; maxMonths: number }[] = [
    { id: "publication", label: "Publication embargo", description: "Data is withheld until related research or reports are officially published.", maxMonths: 24 },
    { id: "completion", label: "Project completion embargo", description: "Data remains private until all fieldwork, analysis, and QA are completed.", maxMonths: 36 },
    { id: "cultural", label: "Cultural / Indigenous knowledge embargo", description: "Data involving Indigenous or cultural knowledge remains hidden until custodians approve release.", maxMonths: 120 },
    { id: "other", label: "Other", description: "A reason not listed here.", maxMonths: 12 },
];

/** The system-provided maximum embargo period for a (multi-select) set of embargo types - the
 *  longest of every selected type's own maximum, so combining a stricter reason with a laxer one
 *  never quietly shortens the stricter one's real ceiling. 0 when nothing is selected yet. */
export function maxEmbargoMonths(types: string[]): number {
    return types.reduce((max, id) => Math.max(max, EMBARGO_TYPE_OPTIONS.find((o) => o.id === id)?.maxMonths ?? 0), 0);
}

/** A short, human "X years"/"X months" rendering of a month count, for the "maximum embargo
 *  period" note next to the End Date field. */
export function formatEmbargoDuration(months: number): string {
    if (months <= 0) return "0 months";
    if (months % 12 === 0) {
        const years = months / 12;
        return `${years} year${years === 1 ? "" : "s"}`;
    }
    return `${months} month${months === 1 ? "" : "s"}`;
}

// ── Restrictable concepts. Each concept declares the value control it needs, matched to the
// field type Figma uses for that same field on the Occurrence/Observation "Edit" frames
// (YMproGZfrFB5jUqPHPxMhk nodes 1970:145957 / 1970:148058):
//   multi     - Figma's "3 Selected" multi-select (Observers, Determiners, Animal/Plant Life Stage)
//   select    - Figma's "Please Select" single dropdown (Sex, Activity, Habitat, Voucher Type, ...)
//   boolean   - Figma's Yes/No radio pair (Gravid?, Planted/Released)
//   dateRange - Figma's "Select dates" pickers (Start/End Date), as a From/To pair
//   text      - a free-text field (Permit number, storage location, Other)
//   none      - the whole field is withheld, no value to pick (comments, attached images)
// Option lists are illustrative where Figma leaves the dropdown unpopulated ("Please Select"),
// except where this build already has a real list (people, collection methods, institutions). ──

export type ConceptValueType = "text" | "select" | "multi" | "boolean" | "dateRange" | "none";

export interface ConceptOption {
    id: string;
    label: string;
    valueType: ConceptValueType;
    /** Options for `select` / `multi` concepts. */
    options?: { id: string; label: string }[];
    /** Placeholder for the value control. */
    placeholder?: string;
}

// The people a project's records are attributed to - this build's established placeholder persona
// set (the same observers `search-data.ts` already attributes real records to), not new names.
export const OBSERVER_OPTIONS = [
    { id: "olivia-wyatt", label: "Olivia Wyatt" },
    { id: "phoenix-baker", label: "Phoenix Baker" },
    { id: "lana-steiner", label: "Lana Steiner" },
    { id: "maya-dewitt", label: "Maya Dewitt" },
];

const LOCATION_PRECISION_OPTIONS = [
    { id: "hide", label: "Hide location completely" },
    { id: "1km", label: "Generalise to 1 km" },
    { id: "10km", label: "Generalise to 10 km" },
    { id: "25km", label: "Generalise to 25 km" },
];

const OBSERVER_CONCEPT: ConceptOption = { id: "observer", label: "Observer / Contributor", valueType: "multi", options: OBSERVER_OPTIONS, placeholder: "Select observers" };
const OTHER_CONCEPT: ConceptOption = { id: "other", label: "Other", valueType: "text", placeholder: "Describe what to restrict" };

// Concepts a project's own metadata could restrict - real, fill-once fields this build already
// models elsewhere on a project (permits, collection method, contributor identity).
export const PROJECT_METADATA_CONCEPTS: ConceptOption[] = [
    { id: "collection-method", label: "Data Collection Method", valueType: "select", options: COLLECTION_METHOD_OPTIONS.map((o) => ({ id: o.id, label: o.label })), placeholder: "Select method" },
    OBSERVER_CONCEPT,
    { id: "site-coordinates", label: "Site Coordinates Precision", valueType: "select", options: LOCATION_PRECISION_OPTIONS, placeholder: "Select precision" },
    { id: "permit-number", label: "Permit Number", valueType: "none" },
    { id: "raw-data-storage", label: "Raw Data Storage Location", valueType: "none" },
    OTHER_CONCEPT,
];

// Concepts recorded against a species - the fields on the Occurrence/Observation Details
// Containers in Figma, grouped the same way (Location, Observers, Temporal, Species traits,
// Voucher, comments/resources).
export const SPECIES_CONCEPTS: ConceptOption[] = [
    { id: "location", label: "Location (coordinates)", valueType: "select", options: LOCATION_PRECISION_OPTIONS, placeholder: "Select precision" },
    OBSERVER_CONCEPT,
    { id: "date-observed", label: "Date observed", valueType: "dateRange" },
    {
        id: "animal-life-stage",
        label: "Animal life stage",
        valueType: "multi",
        options: ["Egg", "Juvenile", "Sub-adult", "Adult"].map((l) => ({ id: l.toLowerCase(), label: l })),
        placeholder: "Select life stages",
    },
    {
        id: "plant-life-stage",
        label: "Plant life stage",
        valueType: "multi",
        options: ["Seedling", "Juvenile", "Mature", "Flowering", "Fruiting"].map((l) => ({ id: l.toLowerCase(), label: l })),
        placeholder: "Select life stages",
    },
    { id: "sex", label: "Sex", valueType: "select", options: ["Male", "Female", "Unknown"].map((l) => ({ id: l.toLowerCase(), label: l })), placeholder: "Select sex" },
    {
        id: "activity",
        label: "Activity",
        valueType: "select",
        options: ["Breeding", "Nesting", "Roosting", "Feeding", "Moving"].map((l) => ({ id: l.toLowerCase(), label: l })),
        placeholder: "Select activity",
    },
    {
        id: "micro-habitat",
        label: "Micro habitat",
        valueType: "select",
        options: ["Tree hollow", "Burrow", "Log", "Rock crevice", "Leaf litter", "Nest mound"].map((l) => ({ id: l.toLowerCase().replace(/ /g, "-"), label: l })),
        placeholder: "Select habitat",
    },
    { id: "gravid", label: "Gravid", valueType: "boolean" },
    { id: "planted-released", label: "Planted / released", valueType: "boolean" },
    { id: "determiners", label: "Determiners", valueType: "multi", options: OBSERVER_OPTIONS, placeholder: "Select determiners" },
    {
        id: "voucher-institution",
        label: "Voucher institution",
        valueType: "select",
        options: [
            { id: "sa-museum", label: "South Australian Museum" },
            { id: "sa-herbarium", label: "State Herbarium of South Australia" },
        ],
        placeholder: "Select institution",
    },
    { id: "comments", label: "Occurrence / observation comments", valueType: "none" },
    { id: "resources", label: "Attached images and files", valueType: "none" },
    OTHER_CONCEPT,
];

// ── Species picker: reuses the real, shared species dataset (app/pages/_shared/map-search/
// search-data.ts) instead of a second, disconnected list, deduped to one row per scientific name.
// The two Non-Biotic/Community placeholder rows (`species === "—"`) aren't real species, so they're
// excluded - a project can't nominate "Soil Profile" as a sensitive species. ──

export interface RegistrationSpecies {
    id: string;
    commonName: string;
    species: string;
    family: string;
    group: SpeciesGroup;
    /** True when this species is already flagged "Level 2" (sensitive) somewhere in the real
     *  dataset - the "already nominated as sensitive" alert this wizard's species step surfaces. */
    alreadySensitive: boolean;
}

function buildSpeciesList(): RegistrationSpecies[] {
    const seen = new Map<string, RegistrationSpecies>();
    for (const occ of searchOccurrences) {
        if (occ.species === "—" || !occ.family || !occ.group) continue;
        const existing = seen.get(occ.species);
        if (existing) {
            if (occ.licenceLevel === "Level 2") existing.alreadySensitive = true;
            continue;
        }
        seen.set(occ.species, {
            id: occ.species,
            commonName: occ.commonName,
            species: occ.species,
            family: occ.family,
            group: occ.group,
            alreadySensitive: occ.licenceLevel === "Level 2",
        });
    }
    return Array.from(seen.values()).sort((a, b) => a.commonName.localeCompare(b.commonName));
}

export const REGISTRATION_SPECIES: RegistrationSpecies[] = buildSpeciesList();

export const SPECIES_GROUP_OPTIONS: SpeciesGroup[] = ["Mammal", "Bird", "Reptile", "Amphibian", "Plant"];

/** Real project codes/names already carrying a Level 2 (sensitive) record for this species -
 *  backs the "View data restriction summary" alert, grounded in the same data every other real
 *  restriction check in this build reads from, not a fabricated list. */
export function existingRestrictionsForSpecies(speciesId: string): { code: string; name: string }[] {
    const seen = new Map<string, { code: string; name: string }>();
    for (const occ of searchOccurrences) {
        if (occ.species !== speciesId || occ.licenceLevel !== "Level 2") continue;
        const project = rootProjectForParentEventId(occ.parentEventId);
        if (project) seen.set(project.code, { code: project.code, name: project.name });
    }
    return Array.from(seen.values());
}

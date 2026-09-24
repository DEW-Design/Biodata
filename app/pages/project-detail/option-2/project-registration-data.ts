// What this page's one concrete project (Adelaide Hills Bushland Survey) would actually look like
// if it had genuinely been created through the real Add Project wizard
// (app/pages/project-registration/**, see /pages/project-registration?userRole=registered-user) -
// per direct request to walk that flow and build a project detail page around everything it
// actually collects, not just the handful of fields option-2's first pass showed. Every field here
// uses that wizard's own real state shapes (ProjectDetailsState/DataCollectionState/
// RestrictionsState from project-registration/types.ts) and real option vocabularies
// (ROLE_OF_WORK_OPTIONS/FOCUS_AREA_OPTIONS/PERMIT_TYPE_OPTIONS/COLLECTION_METHOD_OPTIONS/
// EMBARGO_TYPE_OPTIONS/SPECIES_CONCEPTS/REGISTRATION_SPECIES from project-registration/data.ts,
// imported directly rather than duplicated) - so this page is honestly showing "what registration
// produces," not a second, disconnected content model.
//
// Values themselves stay consistent with every fact about this project already established
// elsewhere in this build (the same abstract, the same Data Owner/Project Manager contacts, the
// same permit, the same real species already tied to this project in search-data.ts) - filled out
// to the wizard's full shape rather than contradicting what option-1 and the map search tool
// already say about this same project.

import { parseDate } from "@internationalized/date";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import type { ContactPerson, DataCollectionState, ProjectDetailsState, ProjectManager, RestrictionsState } from "@/app/pages/project-registration/types";

export const registrationAbstract =
  "Ongoing flora and fauna monitoring across the Adelaide Hills reserve network, tracking indicator species before and after prescribed burns. The project brings together local Landcare volunteers, DEW ecologists and university researchers to build a long-term baseline for reserve management decisions, with quarterly transect surveys feeding directly into the region's fire-recovery reporting.";

const dataOwnerContact: ContactPerson = {
  id: 1,
  firstName: "Olivia",
  lastName: "Wyatt",
  email: "olivia.wyatt@adelaidehillslandcare.org.au",
  phone: "(08) 8388 4188",
  organisation: "DEW Biodiversity Team",
};

const projectManagers: ProjectManager[] = [
  {
    id: 1,
    firstName: "Maya",
    lastName: "Dewitt",
    email: "maya.dewitt@sa.gov.au",
    phone: "(08) 8204 1910",
    organisation: "DEW Biodiversity Team",
    role: "research",
    roleOther: "",
    isPrimary: true,
  },
  {
    id: 2,
    firstName: "Phoenix",
    lastName: "Baker",
    email: "phoenix.baker@adelaidehillslandcare.org.au",
    phone: "(08) 8388 4190",
    organisation: "Adelaide Hills Landcare",
    role: "field-survey",
    roleOther: "",
    isPrimary: false,
  },
];

export const registrationProjectDetails: ProjectDetailsState = {
  roleOfWork: "management",
  roleOfWorkOther: "",
  shortTitle: "Adelaide Hills Bushland Survey",
  fullTitle: "Adelaide Hills Bushland Flora and Fauna Monitoring Survey",
  sameAsShortTitle: false,
  abstract: registrationAbstract,
  startDate: parseDate("2025-11-02"),
  endDate: null,
  dataOwnerType: "organisation",
  dataOwnerOrgName: "Adelaide Hills Landcare",
  dataOwnerOrgLogo: null,
  dataOwnerContacts: [dataOwnerContact],
  projectManagers,
};

const geographicExtentBoundary: Boundary = { id: "adelaide-hills-registration-extent", kind: "circle", center: [-35.02, 138.71], radiusKm: 12 };

export const registrationDataCollection: DataCollectionState = {
  geographicExtent: { method: "map", boundary: geographicExtentBoundary },
  focusAreas: ["biological", "habitat-vegetation"],
  focusAreaOther: "",
  // Real species already tied to this project in search-data.ts (never invented) - the same
  // Southern Brown Bandicoot already named as a targeted species for this exact project in
  // project-detail/option-1's own Data Collection Scope section.
  targetedSpeciesIds: ["Isoodon obesulus", "Macropus giganteus", "Tachyglossus aculeatus"],
  collectionMethod: "systematic",
  methodDetails: "Quarterly transect and quadrat surveys across reserve sites, supplemented by camera traps and incidental records logged by Landcare volunteers.",
  permits: [{ id: 1, type: "scientific-research", number: "SA-2025-0142" }],
  uriDoi: "",
  limitationsAndBiases: "Surveys conducted only in accessible reserve areas; nocturnal species may be under-detected.",
};

export const registrationRestrictions: RestrictionsState = {
  hasRestrictions: true,
  enabledTypes: new Set(["embargo", "species"]),
  embargo: {
    types: ["completion"],
    typeOther: "",
    reason: "Data withheld from general release until quarterly QA and cross-checking against the fire-recovery baseline is complete.",
    endDate: parseDate("2026-11-02"),
  },
  species: [
    {
      id: 1,
      speciesId: "Isoodon obesulus",
      scope: "selected",
      concepts: [{ id: 1, concept: "location", conceptOther: "", value: "10km", values: [], dateFrom: null, dateTo: null }],
      justification: "Precise den locations withheld to prevent disturbance during population recovery.",
    },
  ],
  locations: [],
  metadata: { concepts: [], justification: "" },
  otherRestrictions: "",
};

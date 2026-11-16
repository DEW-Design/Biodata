// Add Project's sample answers, loaded by the Pre-fill sample content switch on the Prototype tools bar
// (app/_prototype-tools/sample-content.ts) so the form can be walked through with stakeholders. Every section that needs
// an answer has one, so Create project works straight away.
//
// It answers the fullest branch of every question (the designer, 10 Nov 2026): a contact whose role is Other, with the
// access each can have; "Other" among the focus areas; a Systematic project that adds each methodology, one of them Other;
// and "Yes, apply restrictions" with every kind offered ticked (an embargo of every type, two species restricted one way
// each, cultural sensitivities, two locations, all records), so every section the form can add is there to see.
//
// Kept honest (CONTRACTS 0.3): the people are the placeholder set (Olivia Wyatt, Phoenix Baker, Lana Steiner, Maya Dewitt)
// with example.com addresses and no phone numbers; the organisation is Birds SA, a real BDBSA partner (ref-domain.md); the
// park, the methodologies and the species come from the build's own lists. No permit number or DOI is given, because one
// would be invented, and the Indigenous Information Authority is named as a placeholder, not as a real body.

import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { SA_NATIONAL_PARKS } from "@/app/pages/_shared/map-search/geo";
import { REGISTRATION_SPECIES } from "./data";
import { emptyConceptRow, emptyPermitRow, emptyProjectContact, initialDataCollection, initialProjectDetails, initialRestrictions, type ConceptValueRow, type RestrictionTypeKey } from "./types";
import { OTHER_METHODOLOGY } from "./methodology-fields";
import type { FormState } from "./option-2/sections";

export function sampleProjectForm(): FormState {
  const park = SA_NATIONAL_PARKS.find((p) => p.id === "coorong") ?? SA_NATIONAL_PARKS[0];
  const birds = REGISTRATION_SPECIES.filter((s) => s.group === "Bird")
    .slice(0, 2)
    .map((s) => s.id);
  const row = (id: number, patch: Partial<ConceptValueRow>): ConceptValueRow => ({ ...emptyConceptRow(id), ...patch });

  return {
    details: {
      ...initialProjectDetails(),
      shortTitle: "Coorong Wetlands Bird Monitoring",
      sameAsShortTitle: false,
      fullTitle: "Coorong National Park Waterbird and Shorebird Monitoring Program",
      abstract:
        "Seasonal counts of waterbirds and migratory shorebirds at fixed sites across the Coorong, to follow how their numbers and breeding respond to changes in water level and salinity. Volunteers survey each site in spring and autumn, and the results inform water management for the Coorong, Lower Lakes and Murray Mouth.",
      startDate: parseDate("2026-07-01"),
      endDate: parseDate("2029-06-30"),
      dataOwnerType: "organisation",
      dataOwnerOrgName: "Birds SA",
      projectContacts: [
        { ...emptyProjectContact(1), firstName: "Olivia", lastName: "Wyatt", email: "olivia.wyatt@example.com", role: "project-manager", isPrimary: true },
        { ...emptyProjectContact(2), firstName: "Phoenix", lastName: "Baker", email: "phoenix.baker@example.com", role: "field-survey", access: "records" },
        // A role that is not on the list asks what it is, and the card shows the access this person has.
        { ...emptyProjectContact(3), firstName: "Lana", lastName: "Steiner", email: "lana.steiner@example.com", role: "other", roleOther: "Volunteer survey coordinator", access: "view" },
      ],
    },
    collection: {
      ...initialDataCollection(),
      geographicExtent: {
        // Drawn on the map, the picker's first tab, so the form opens there with the area showing. The circle is the one the picker draws when a
        // park is chosen from the list (geo-extent-picker.tsx).
        method: "map",
        boundary: { id: `park-${park.id}`, kind: "circle", center: [park.lat, park.lon], radiusKm: 15, label: park.name },
      },
      focusAreas: ["biological", "water", "land", "other"],
      focusAreaOther: "Shorebird roost condition",
      targetedSpeciesIds: birds,
      collectionMethod: "systematic",
      methodologies: [
        { rid: 1, id: "Bird survey, 500 metre area search", note: "Counted at high tide only, so birds roosting off site at low tide are missed." },
        { rid: 2, id: "Bird survey, 20 minutes, 2 hectare", note: "" },
        // "Other" asks what the methodology is.
        { rid: 3, id: OTHER_METHODOLOGY, other: "Dusk roost count from the shoreline", note: "Weather and light limit how many birds can be counted." },
      ],
      // "None required" is a permit type of its own, so no permit number has to be made up.
      permits: [{ ...emptyPermitRow(1), type: "none" }],
    },
    restrictions: {
      ...initialRestrictions(),
      hasRestrictions: true,
      enabledTypes: new Set<RestrictionTypeKey>(["embargo", "species", "cultural", "locations", "all"]),
      // Every embargo type, so the maximum period and the "Other" reason both show. The end date is inside the longest maximum and the shortest.
      embargo: {
        types: ["publication", "completion", "cultural", "other"],
        typeOther: "Release waits on a partner agency's review",
        reason: "The counts are being written up for a report, and the roost positions need a partner agency's review before they are released.",
        endDate: today(getLocalTimeZone()).add({ months: 12 }),
        afterEmbargo: "Roost positions should stay generalised after release, because disturbance at a roost can cause birds to abandon it.",
      },
      species: [
        // One species restricted whole, with one justification.
        { id: 1, speciesId: birds[0], scope: "all", concepts: [emptyConceptRow(1)], justification: "Every record of this species is held back while the project's counts are checked.", expectation: "10km" },
        // One restricted by the details chosen, each with its own value and justification (one of every kind of value control: a menu, a date range, a list, a menu again, and a free description).
        {
          id: 2,
          speciesId: birds[1],
          scope: "selected",
          justification: "",
          expectation: "government",
          concepts: [
            row(1, { concept: "location", value: "10km", justification: "Roost positions are generalised so people are not drawn to them." }),
            row(2, { concept: "date-observed", dateFrom: parseDate("2026-09-01"), dateTo: parseDate("2027-03-31"), justification: "The breeding season is the most sensitive time." }),
            row(3, { concept: "observer", values: ["olivia-wyatt", "phoenix-baker"], justification: "Volunteers' names are not released." }),
            row(4, { concept: "other", conceptOther: "Roost descriptions", value: "Withhold the free-text roost descriptions", justification: "They describe how to reach a roost." }),
          ],
        },
      ],
      cultural: {
        authority: "Sample Indigenous Information Authority (placeholder)",
        contact: "Maya Dewitt, maya.dewitt@example.com",
        justification: "Some sites in this project are of cultural significance, and their positions are held back until the authority agrees to their release.",
        expectation: "government",
      },
      locations: [
        { id: 1, name: "Coorong shorebird roost", expectation: "1km", justification: "A roost used by migratory shorebirds, easily disturbed.", extent: { method: "map", boundary: { id: `park-${park.id}-roost`, kind: "circle", center: [park.lat, park.lon], radiusKm: 5, label: "Coorong shorebird roost" } } },
        { id: 2, name: "Coorong north lagoon roost", expectation: "10km", justification: "A second roost, on the north lagoon.", extent: { method: "map", boundary: { id: `park-${park.id}-north`, kind: "circle", center: [-35.7, 139.1], radiusKm: 3, label: "Coorong north lagoon roost" } } },
      ],
      allRecords: { justification: "The whole project is restricted while it is under review, and a BioData Admin decides what is released.", expectation: "10km" },
    },
  };
}

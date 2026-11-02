// Add Project's sample answers, loaded by the Pre-fill sample content switch on the Prototype tools bar
// (app/_prototype-tools/sample-content.ts) so the form can be walked through with stakeholders. Every section that needs
// an answer has one, so Create project works straight away.
//
// Kept honest (CONTRACTS 0.3): the people are the placeholder set (Olivia Wyatt, Phoenix Baker) with example.com
// addresses; the organisation is Birds SA, a real BDBSA partner (ref-domain.md); the park, the methodologies and the
// species come from the build's own lists. No permit number or DOI is given, because one would be invented.

import { parseDate } from "@internationalized/date";
import { SA_NATIONAL_PARKS } from "@/app/pages/_shared/map-search/geo";
import { REGISTRATION_SPECIES } from "./data";
import { emptyProjectContact, initialDataCollection, initialProjectDetails, initialRestrictions } from "./types";
import type { FormState } from "./option-2/sections";

export function sampleProjectForm(): FormState {
  const park = SA_NATIONAL_PARKS.find((p) => p.id === "coorong") ?? SA_NATIONAL_PARKS[0];
  const birds = REGISTRATION_SPECIES.filter((s) => s.group === "Bird")
    .slice(0, 2)
    .map((s) => s.id);

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
        { ...emptyProjectContact(2), firstName: "Phoenix", lastName: "Baker", email: "phoenix.baker@example.com", role: "field-survey" },
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
      focusAreas: ["biological", "water"],
      targetedSpeciesIds: birds,
      collectionMethod: "systematic",
      methodologies: [
        { rid: 1, id: "Bird survey, 500 metre area search", note: "Counted at high tide only, so birds roosting off site at low tide are missed." },
        { rid: 2, id: "Bird survey, 20 minutes, 2 hectare", note: "" },
      ],
    },
    restrictions: initialRestrictions(),
  };
}

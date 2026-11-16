import { SA_NATIONAL_PARKS, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { dlaLevel3Projects, emptyDlaDraft, todayIso, type DlaDraft, type DlaLocation } from "@/app/pages/_shared/dla/dla-data";

// The DLA request form's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// It answers the fullest branch of the form (the designer, 10 Nov 2026): two locations, one at Level 3 so its "Select Projects for Level 3 Access"
// checklist is asked and answered (two projects), one at Level 2; every field of the requestor, the optional contact number too; the terms agreed.
// Honest (CONTRACTS 0.3): the parks and the projects are the build's own lists, the organisation is a real BDBSA partner (ref-domain.md), the person is
// a placeholder with an example.com address, and the contact number is one the Australian Communications and Media Authority reserves for fiction.

export interface DlaSample {
  draft: DlaDraft;
  agreedToTerms: boolean;
}

const parkLocation = (parkId: string, level: DlaLocation["level"], projectIds: string[]): DlaLocation => {
  const park = SA_NATIONAL_PARKS.find((p) => p.id === parkId) ?? SA_NATIONAL_PARKS[0];
  const boundary: Boundary = { id: `list-${park.id}`, kind: "circle", center: [park.lat, park.lon], radiusKm: 15 };
  return { id: `sample-loc-${park.id}`, name: park.name, method: "list", boundary, level, projectIds };
};

/** The same day a year on, one day short of it (a 12 month agreement), as an ISO date. */
function yearOn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const end = new Date(Date.UTC(y + 1, m - 1, d - 1));
  return end.toISOString().slice(0, 10);
}

export function sampleDla(): DlaSample {
  const from = todayIso();
  return {
    draft: {
      ...emptyDlaDraft(),
      locations: [
        parkLocation("flinders-ranges", "level3", dlaLevel3Projects.slice(0, 2).map((p) => p.id)),
        parkLocation("belair", "level2", []),
      ],
      purpose: "Monitoring biodiversity health and assessing threatened species distribution across the Flinders Ranges, to inform a collaborative regional ecology study.",
      requestPeriodFrom: from,
      requestPeriodTo: yearOn(from),
      requestor: {
        firstName: "Olivia",
        lastName: "Wyatt",
        organisation: "South Australian Museum",
        email: "olivia.wyatt@example.com",
        phone: "0491 570 006",
      },
    },
    agreedToTerms: true,
  };
}

/** The Approve request modal's sample answers: the period the request asked for (or a year from today where it asked for none), a Custom DLA with its note. The
 *  signed agreement is a sample file, added through the modal's own file path. */
export function sampleApproval(requestPeriodFrom: string, requestPeriodTo: string) {
  const from = requestPeriodFrom || todayIso();
  return {
    validFrom: from,
    validTo: requestPeriodTo && requestPeriodTo >= from ? requestPeriodTo : yearOn(from),
    isCustom: true,
    customNote: "Access is limited to the locations named in the request, and the data is not to be passed on to a third party.",
  };
}

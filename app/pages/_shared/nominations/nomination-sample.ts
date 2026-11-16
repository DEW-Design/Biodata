import { emptyConceptRow, emptyGeoExtent, type ConceptValueRow, type GeoExtentValue } from "@/app/pages/project-registration/types";
import { REGISTRATION_SPECIES } from "@/app/pages/project-registration/data";
import { SA_NATIONAL_PARKS } from "@/app/pages/_shared/map-search/geo";
import { isOpenNomination, type Nomination, type NominationArea, type NominationKind, type ProtectionScope } from "@/app/pages/_shared/nominations/nomination-data";

// The nomination form's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// It answers the fullest branch of the form (the designer, 10 Nov 2026): a subset of occurrence records, so the attributes are asked; a Location with
// an area and an Evidence of presence value; and "Yes" to the public domain, so where it is public and the supporting files are asked too.
// Honest (CONTRACTS 0.3): the species is a real one that has no nomination, the place is a real national park from the build's own list, and the
// words are placeholders for a real nominator's.

export interface NominationSample {
  speciesId: string;
  locationName: string;
  extent: GeoExtentValue;
  scope: ProtectionScope;
  rows: ConceptValueRow[];
  areas: Record<number, NominationArea[]>;
  justification: string;
  risks: string;
  publicDomain: "yes" | "no" | undefined;
  publicWhere: string;
}

const park = () => SA_NATIONAL_PARKS.find((p) => p.id === "coorong") ?? SA_NATIONAL_PARKS[0];

export function sampleNomination(nominations: Nomination[], kind: NominationKind): NominationSample {
  const place = park();
  // A species with no nomination at all, so the form is not refused for a duplicate and no existing restriction crowds the step.
  const used = new Set(nominations.filter((n) => isOpenNomination(n) || n.status === "accepted").map((n) => n.speciesId));
  const species = REGISTRATION_SPECIES.find((s) => !used.has(s.id));
  const area: NominationArea = {
    id: `sample-${place.id}`,
    name: place.name,
    method: "list",
    boundary: { id: `park-${place.id}`, kind: "circle", center: [place.lat, place.lon], radiusKm: 15, label: place.name },
  };
  return {
    speciesId: kind === "species" ? (species?.id ?? "") : "",
    locationName: "Coorong nesting beaches",
    extent: { method: "list", parkId: place.id, listName: place.name },
    scope: "selected",
    rows: [
      { ...emptyConceptRow(1), concept: "location", values: [area.id] },
      { ...emptyConceptRow(2), concept: "evidence-of-presence", value: "Nests" },
    ],
    areas: { 1: [area] },
    justification: "Nest sites are few and known by local walkers. Published locations have led to people disturbing the nests during the breeding season.",
    risks: "Habitat could be cleared or damaged without the records to warn planners. Releasing locations to approved users under a licence would keep that risk low.",
    publicDomain: "yes",
    publicWhere: "A 2019 journal article names the colony, and cannot be redacted.",
  };
}

/** What the form falls back to when the sample is taken out and the form was empty. */
export const emptyNominationSample = (): Pick<NominationSample, "extent"> => ({ extent: emptyGeoExtent() });

import { methodologySummary } from "@/app/pages/project-registration/option-2/sections";
import { sampleProjectForm } from "@/app/pages/project-registration/sample-content";
import { OFFERED_RESTRICTION_TYPES } from "@/app/pages/project-registration/step-3-privacy-restrictions";
import { emptyConceptRow, emptyPermitRow, emptyProjectManager, type ConceptValueRow, type ContactPerson } from "@/app/pages/project-registration/types";
import type { ProjectState } from "./edit-store";
import type { ProjectCardId } from "./project-edit";

// The project edit forms' sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// A card's form edits one slice of the project, so the sample fills that card down its fullest branch (the designer, 10 Nov 2026) and leaves the rest of the
// project as it is; switching off puts back what the card held. The wording is Add Project's own sample (../project-registration/sample-content.ts), so a
// project edited with it reads as the one created with it.
// Honest (CONTRACTS 0.3): the people are the placeholder set with example.com addresses, the organisation is Birds SA (ref-domain.md), the places and species
// are the build's own lists. No permit number, DOI or phone number is given, because one would be invented.

const row = (id: number, p: Partial<ConceptValueRow>): ConceptValueRow => ({ ...emptyConceptRow(id), ...p });

export function sampleProjectCard(id: ProjectCardId, draft: ProjectState): ProjectState {
  const sample = sampleProjectForm();
  const d = draft.details;
  const c = draft.collection;
  const r = draft.restrictions;

  switch (id) {
    case "details":
      return {
        ...draft,
        status: "Active",
        details: {
          ...d,
          shortTitle: sample.details.shortTitle,
          sameAsShortTitle: false,
          fullTitle: sample.details.fullTitle,
          abstract: sample.details.abstract,
          startDate: sample.details.startDate,
          endDate: sample.details.endDate,
        },
      };

    case "owner": {
      // The data owner is an organisation (it asks for the name), with two contacts: the primary one, and one whose role is Other (it asks to specify).
      const contacts: ContactPerson[] = [
        { id: 1, firstName: "Olivia", lastName: "Wyatt", email: "olivia.wyatt@example.com", phone: "", organisation: "Birds SA", role: "research", roleOther: "" },
        { id: 2, firstName: "Phoenix", lastName: "Baker", email: "phoenix.baker@example.com", phone: "", organisation: "Birds SA", role: "other", roleOther: "Volunteer coordinator" },
      ];
      return {
        ...draft,
        details: { ...d, dataOwnerType: "organisation", dataOwnerOrgName: "Birds SA", dataOwnerContacts: contacts, roleOfWork: "research", roleOfWorkOther: "" },
      };
    }

    case "managers":
      return {
        ...draft,
        details: {
          ...d,
          projectManagers: [
            { ...emptyProjectManager(1), firstName: "Olivia", lastName: "Wyatt", email: "olivia.wyatt@example.com", organisation: "Birds SA", role: "project-manager", isPrimary: true },
            { ...emptyProjectManager(2), firstName: "Lana", lastName: "Steiner", email: "lana.steiner@example.com", organisation: "Birds SA", role: "other", roleOther: "Data steward" },
          ],
        },
      };

    case "extent":
      return { ...draft, collection: { ...c, geographicExtent: sample.collection.geographicExtent } };

    case "collection": {
      // Add Project's sample answers: Systematic, which lists its methodologies (one of them Other, which asks for a name), and the Other focus area, which asks to specify.
      const sc = sample.collection;
      const next = { ...c, focusAreas: sc.focusAreas, focusAreaOther: sc.focusAreaOther, targetedSpeciesIds: sc.targetedSpeciesIds, collectionMethod: sc.collectionMethod, methodologies: sc.methodologies };
      const { names, notes } = methodologySummary(next);
      return { ...draft, collection: { ...next, methodDetails: names, limitationsAndBiases: notes } };
    }

    case "permits":
      // Two permit rows. The number is left empty: a number would be invented. No URI or DOI, for the same reason.
      return {
        ...draft,
        collection: {
          ...c,
          permits: [
            { ...emptyPermitRow(1), type: "scientific-research" },
            { ...emptyPermitRow(2), type: "wildlife-ethics" },
          ],
          uriDoi: "",
        },
      };

    case "add-restriction": {
      // Every kind that can still be added, ticked.
      const enabledTypes = new Set(r.hasRestrictions ? r.enabledTypes : []);
      OFFERED_RESTRICTION_TYPES.forEach((m) => enabledTypes.add(m.key));
      return { ...draft, restrictions: { ...r, enabledTypes, hasRestrictions: true } };
    }

    // The kinds of restriction are answered as Add Project's sample answers them: every embargo type, one species restricted whole and one by chosen
    // details, cultural sensitivities with a placeholder authority, two locations, and all records.
    case "embargo":
      return { ...draft, restrictions: { ...r, embargo: sample.restrictions.embargo } };
    case "species":
      return { ...draft, restrictions: { ...r, species: sample.restrictions.species } };
    case "cultural":
      return { ...draft, restrictions: { ...r, cultural: sample.restrictions.cultural } };
    case "locations":
      return { ...draft, restrictions: { ...r, locations: sample.restrictions.locations } };
    case "all":
      return { ...draft, restrictions: { ...r, allRecords: sample.restrictions.allRecords } };

    case "metadata":
      return {
        ...draft,
        restrictions: {
          ...r,
          metadata: {
            concepts: [
              row(1, { concept: "collection-method", value: "systematic", justification: "The method shows how to find the sites." }),
              row(2, { concept: "observer", values: ["olivia-wyatt", "phoenix-baker"], justification: "Observers are volunteers who asked not to be named." }),
              row(3, { concept: "raw-data-storage", justification: "The storage location is internal." }),
            ],
          },
        },
      };

    case "other":
      return { ...draft, restrictions: { ...r, otherRestrictions: "Records from private land are shared only with the landholder's agreement." } };
  }
}

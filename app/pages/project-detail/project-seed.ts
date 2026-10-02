// What the project page template (project-detail-template.tsx) is fed: one project's registration,
// its survey records and its artefacts. Adelaide Hills Bushland Survey has a hand-written seed (the
// records in survey-data.ts); every other project is built from the dataset Explore searches
// (`seedFromExplore`), so this page and Explore can never disagree about a project.
//
// Only what Explore holds is filled in. There is no abstract for some projects, no contacts, permits
// or restrictions for any, and no per-record field detail beyond a name, a date, a place and a
// species, so those rows read "Not provided" rather than being invented (CONTRACTS 0.3).

import { parseDate } from "@internationalized/date";
import { initialDataCollection, initialProjectDetails, initialRestrictions } from "@/app/pages/project-registration/types";
import { generalisedKm, recordAccess } from "@/app/pages/_shared/map-search/record-access";
import {
  hasEndDate,
  searchEvents,
  searchObservations,
  type SearchEvent,
  type SearchObservation,
  type SearchOccurrence,
} from "@/app/pages/_shared/map-search/search-data";
import { projectEvents, projectObservations, projectOccurrences } from "@/app/pages/_shared/project-scope";
import { createdProjectForm, type CreatedProject } from "@/app/pages/_shared/created-projects-store";
import type { UserRole } from "@/lib/user-role";
import type { ProjectState, SurveyArtefact } from "./edit-store";
import { NSX_SPECIES } from "./field-schema";
import { registrationDataCollection, registrationProjectDetails, registrationRestrictions } from "./project-registration-data";
import {
  SURVEY_ARTEFACTS,
  SURVEY_RECORDS,
  eventSections,
  observationSections,
  occurrenceSections,
  siteSections,
  type SurveyEventType,
  type SurveyRecord,
} from "./survey-data";

export const ADELAIDE_HILLS_ID = "adelaide-hills";

export interface ProjectMeta {
  /** The route id (`/pages/project-list/<id>/project-details`). */
  id: string;
  /** The project's own ID, e.g. BD-5039. */
  code: string;
  /** Who publishes the project's artefacts. */
  publisher: string;
  /** Starts an artefact's object id, e.g. AHL:SU00501:PHOTO1. */
  objectPrefix: string;
}

export interface ProjectSeed {
  meta: ProjectMeta;
  project: ProjectState;
  records: SurveyRecord[];
  artefacts: SurveyArtefact[];
}

export const adelaideHillsSeed: ProjectSeed = {
  meta: { id: ADELAIDE_HILLS_ID, code: "BD-5039", publisher: "Adelaide Hills Landcare", objectPrefix: "AHL" },
  project: {
    details: registrationProjectDetails,
    collection: registrationDataCollection,
    restrictions: registrationRestrictions,
    status: "Active",
  },
  records: SURVEY_RECORDS,
  artefacts: SURVEY_ARTEFACTS,
};

const NP = "Not provided";
const NO_PHOTOPOINT = { present: "No", disc: NP, direction: NP };

function projectStatus(status: string): ProjectState["status"] {
  return status === "Draft" || status === "Under review" || status === "Completed" ? status : "Active";
}

function isoOrNull(date: string) {
  return hasEndDate(date) && /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseDate(date) : null;
}

/** Explore's "Non-Biotic" and "Community" occurrences are not a countable organism; in this page's
 *  model they are observations taken directly at a sampling event. */
function isSpeciesOccurrence(o: SearchOccurrence): o is SearchOccurrence & { type: "Individual" | "Population" } {
  return o.type === "Individual" || o.type === "Population";
}

/** The NSX code when the species is in the list, otherwise the scientific name itself: an NSX code is
 *  never invented for a species the list does not hold. */
function speciesValue(scientific: string): string {
  return NSX_SPECIES.find((s) => s.scientific === scientific)?.nsx ?? scientific;
}

function generalisationNote(km: number | null): string | undefined {
  return km ? `Location shown only as a ${km} km block: this is a restricted (Level 2) record.` : undefined;
}

function eventRecord(e: SearchEvent, projectId: string): SurveyRecord {
  const type = e.type as SurveyEventType;
  const base = {
    id: e.id,
    code: e.code,
    kind: "event" as const,
    type,
    name: e.name,
    parentId: !e.parentId || e.parentId === projectId ? null : e.parentId,
    date: e.startDate,
    lat: e.lat,
    lon: e.lon,
    summary: `${e.type} in ${e.region}`,
    location: { method: "map" as const, boundary: { id: `ev-${e.id}`, kind: "circle" as const, center: [e.lat, e.lon] as [number, number], radiusKm: 0.05 } },
  };
  if (type === "Site") {
    return {
      ...base,
      sections: siteSections({
        code: e.code,
        legacy: NP,
        name: e.name,
        lat: e.lat,
        lon: e.lon,
        description: NP,
        grouping: NP,
        property: NP,
        altitude: NP,
        mudMap: NP,
        paddock: NP,
        comment: NP,
        dimensions: NP,
        locationComment: NP,
        observers: [NP],
        photopoint: NO_PHOTOPOINT,
      }),
    };
  }
  return {
    ...base,
    sections: eventSections({
      type: type as Exclude<SurveyEventType, "Site">,
      code: e.code,
      name: e.name,
      description: NP,
      sourceId: NP,
      comment: NP,
      startDate: e.startDate,
      endDate: hasEndDate(e.endDate) ? e.endDate : NP,
      duration: NP,
      dateAccuracy: "D",
      observers: [NP],
      lat: e.lat,
      lon: e.lon,
      dimensions: NP,
      locationComment: NP,
      photopoint: NO_PHOTOPOINT,
      trapEffort: [],
    }),
  };
}

function occurrenceRecord(o: SearchOccurrence & { type: "Individual" | "Population" }, observer: string, note: string | undefined): SurveyRecord {
  return {
    id: `occurrence:${o.id}`,
    code: o.id,
    kind: "occurrence",
    type: o.type,
    name: o.commonName,
    scientificName: o.species,
    family: o.family,
    group: o.group,
    parentId: o.parentEventId,
    date: o.date,
    lat: o.lat,
    lon: o.lon,
    summary: `${o.status}${o.count !== null ? `, ${o.count} recorded` : ""}`,
    locationNote: note,
    location: note ? undefined : { method: "coordinates", boundary: { id: `pt-${o.id}`, kind: "circle", center: [o.lat, o.lon], radiusKm: 0.01 } },
    sections: occurrenceSections({
      type: o.type,
      code: o.id,
      name: o.commonName,
      description: NP,
      comment: NP,
      legacy: NP,
      seq: NP,
      taxonomicType: NP,
      nsx: speciesValue(o.species),
      status: o.status,
      startDate: o.date,
      endDate: NP,
      duration: NP,
      dateAccuracy: "D",
      observers: [observer],
      lat: o.lat,
      lon: o.lon,
      locationMethod: note ? "GEN" : "GPS",
      reliability: note ? "4" : "1",
      locationComment: note ?? NP,
    }),
  };
}

function observationRecord(ob: SearchObservation, type: "Individual" | "Population" | "Non-biotic" | "Community", parentId: string, note: string | undefined): SurveyRecord {
  const name = type === "Non-biotic" || type === "Community" ? ob.commonName : `${ob.commonName} observation`;
  return {
    id: `observation:${ob.id}`,
    code: ob.id,
    kind: "observation",
    type,
    name,
    scientificName: type === "Individual" || type === "Population" ? ob.species : undefined,
    parentId,
    date: ob.date,
    lat: ob.lat,
    lon: ob.lon,
    summary: `Observed by ${ob.observerName}`,
    locationNote: note,
    location: note ? undefined : { method: "coordinates", boundary: { id: `pt-${ob.id}`, kind: "circle", center: [ob.lat, ob.lon], radiusKm: 0.01 } },
    sections: observationSections({
      type,
      code: ob.id,
      name,
      description: NP,
      comment: NP,
      startDate: ob.date,
      endDate: NP,
      duration: NP,
      dateAccuracy: "D",
      observers: [ob.observerName],
      lat: ob.lat,
      lon: ob.lon,
      locationMethod: note ? "GEN" : "GPS",
      reliability: note ? "4" : "1",
      locationComment: note ?? NP,
    }),
  };
}

/** The template's seed for a project that has no hand-written records: its own events, occurrences
 *  and observations from Explore's dataset, in the page's record shape. A record the role may not
 *  see (a public user and a Level 2 record) is left out, and one shown generalised is marked so. */
export function seedFromExplore(project: SearchEvent, role: UserRole): ProjectSeed {
  const events = projectEvents(project.id).map((e) => eventRecord(e, project.id));
  const observationsByOccurrence = new Map(searchObservations.map((ob) => [ob.occurrenceId, ob]));
  const records: SurveyRecord[] = [...events];

  for (const o of projectOccurrences(project.id)) {
    if (recordAccess(o, role) === "hidden") continue;
    const km = generalisedKm(o, role);
    const note = generalisationNote(km);
    const blockKm = km ?? undefined;
    const ob = observationsByOccurrence.get(o.id);
    if (isSpeciesOccurrence(o)) {
      const occurrence = { ...occurrenceRecord(o, ob?.observerName ?? NP, note), blockKm };
      records.push(occurrence);
      if (ob) records.push({ ...observationRecord(ob, o.type, occurrence.id, note), blockKm });
    } else {
      // Non-biotic and Community: an observation directly under the sampling event.
      const stand = ob ?? projectObservations(project.id).find((x) => x.occurrenceId === o.id);
      if (stand) records.push({ ...observationRecord(stand, o.type === "Non-Biotic" ? "Non-biotic" : "Community", o.parentEventId, note), blockKm });
    }
  }

  return {
    meta: { id: project.id, code: project.code, publisher: project.org, objectPrefix: project.code },
    project: {
      details: {
        ...initialProjectDetails(),
        shortTitle: project.name,
        fullTitle: project.name,
        sameAsShortTitle: true,
        abstract: project.description ?? "",
        startDate: isoOrNull(project.startDate),
        endDate: isoOrNull(project.endDate),
        dataOwnerType: "organisation",
        dataOwnerOrgName: project.org,
        dataOwnerContacts: [],
        projectManagers: [],
      },
      collection: { ...initialDataCollection(), permits: [] },
      restrictions: initialRestrictions(),
      status: projectStatus(project.status),
    },
    records,
    artefacts: [],
  };
}

/** The template's seed for a project created through Add Project: exactly what was submitted, no records
 *  or artefacts yet (a new project has none; they arrive with its first upload). */
export function seedFromCreated(created: CreatedProject): ProjectSeed {
  const form = createdProjectForm(created);
  const { details } = form;
  const publisher = details.dataOwnerType === "organisation" ? details.dataOwnerOrgName : `${details.dataOwnerContacts[0]?.firstName ?? ""} ${details.dataOwnerContacts[0]?.lastName ?? ""}`.trim();
  return {
    meta: { id: created.id, code: created.code, publisher, objectPrefix: created.code },
    project: { details, collection: form.collection, restrictions: form.restrictions, status: "Active" },
    records: [],
    artefacts: [],
  };
}

/** The project event behind a route id, or undefined when there is no such project. */
export function exploreProject(id: string): SearchEvent | undefined {
  return searchEvents.find((e) => e.id === id && e.type === "Project");
}

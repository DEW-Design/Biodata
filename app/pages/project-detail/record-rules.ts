// What can be added where, and how a new record starts out.
//
// The hierarchy (decided by the designer, 28 Sept 2026):
//   Project > anything: every event type, occurrence and observation
//   Site > Visit, sampling events (Transect, Quadrat, Block, Ramble, Trap, Custom event),
//          Occurrences (Individual, Population) and Observations (Individual, Population,
//          Non-biotic, Community)
//   Visit > Occurrences and Observations only: no event is ever inside a Visit
//   sampling event > Occurrences and Observations (all four types)
//   Occurrence > exactly one Observation of the same type (Individual or Population)
//   Observation > nothing
// No event is ever added inside an Occurrence or an Observation.

import { TYPE_DESCRIPTIONS, eventLabels, eventSections, observationSections, occurrenceSections, siteSections, type EventFields, type RecordKind, type SurveyObservationType, type SurveyOccurrenceType, type SurveyRecord } from "./survey-data";

export const SAMPLING_TYPES = ["Transect", "Quadrat", "Block", "Ramble", "Trap", "Custom event"] as const;

export interface ChildOption {
  kind: RecordKind;
  type: string;
  label: string;
  description: string;
}

const option = (kind: RecordKind, type: string): ChildOption => ({
  kind,
  type,
  label: kind === "event" ? type : `${type} ${kind}`,
  description: TYPE_DESCRIPTIONS[kind === "event" ? type : `${kind === "occurrence" ? "Occurrence" : "Observation"}:${type}`] ?? "",
});

/** What may be added directly inside `parent` (`null` = the project). */
export function childOptions(parent: SurveyRecord | null, children: SurveyRecord[]): ChildOption[] {
  const records = [
    option("occurrence", "Individual"),
    option("occurrence", "Population"),
    option("observation", "Individual"),
    option("observation", "Population"),
    option("observation", "Non-biotic"),
    option("observation", "Community"),
  ];
  // Anything can be added directly under the project: every event type, occurrence and observation.
  if (!parent) return [option("event", "Site"), option("event", "Visit"), ...SAMPLING_TYPES.map((t) => option("event", t)), ...records];
  if (parent.kind === "event" && parent.type === "Site") return [option("event", "Visit"), ...SAMPLING_TYPES.map((t) => option("event", t)), ...records];
  if (parent.kind === "event") return records;
  if (parent.kind === "occurrence") {
    // An occurrence carries exactly one observation, of its own type.
    return children.some((c) => c.kind === "observation") ? [] : [option("observation", parent.type)];
  }
  return [];
}

const PREFIX: Record<string, string> = {
  Site: "SU",
  Visit: "VU",
  Transect: "TR",
  Quadrat: "QR",
  Block: "BK",
  Ramble: "RMB",
  Trap: "TRP",
  "Custom event": "CU",
  occurrence: "OC",
  observation: "OB",
};

export function nextCode(kind: RecordKind, type: string, records: SurveyRecord[]): string {
  const prefix = PREFIX[kind === "event" ? type : kind];
  const numbers = records.filter((r) => r.code.startsWith(prefix) && /^\d+$/.test(r.code.slice(prefix.length))).map((r) => Number(r.code.slice(prefix.length)));
  return `${prefix}${String(Math.max(500, ...numbers) + 1).padStart(5, "0")}`;
}

/** The metadata row that holds a record's display name, so renaming keeps the two in step. */
export function nameRow(r: Pick<SurveyRecord, "kind" | "type">): { section: string; label: string } | null {
  if (r.kind === "event") return { section: "details", label: r.type === "Site" ? "Site name" : eventLabels(r.type).name };
  if (r.kind === "occurrence") return { section: "details", label: "Occurrence name" };
  return { section: "details", label: "Observation name" };
}

const NP = "Not provided";
/** A new record with the same sections every record of its kind has, the essentials filled in. */
export function createRecord(opts: {
  kind: RecordKind;
  type: string;
  parent: SurveyRecord | null;
  name: string;
  date: string;
  scientificName?: string;
  recordedBy: string;
  records: SurveyRecord[];
}): SurveyRecord {
  const { kind, type, parent, name, date, recordedBy, records } = opts;
  const code = nextCode(kind, type, records);
  const lat = parent?.lat ?? -35.02;
  const lon = parent?.lon ?? 138.71;
  const base = { id: `new-${code.toLowerCase()}`, code, kind, type: type as SurveyRecord["type"], name, parentId: parent?.id ?? null, date, lat, lon, scientificName: opts.scientificName };

  if (kind === "event" && type === "Site") {
    return {
      ...base,
      summary: "New site",
      sections: siteSections({
        code,
        legacy: NP,
        name,
        lat,
        lon,
        description: NP,
        grouping: NP,
        property: NP,
        altitude: NP,
        mudMap: NP,
        paddock: NP,
        comment: NP,
        dimensions: NP,
        locationComment: NP,
        observers: recordedBy && recordedBy !== NP ? [recordedBy] : [],
        photopoint: { present: "No", disc: NP, direction: NP },
      }),
    };
  }
  if (kind === "event") {
    // A new visit is the next in its site's sequence.
    const siblings = records.filter((r) => r.kind === "event" && r.type === "Visit" && r.parentId === parent?.id).length;
    return {
      ...base,
      summary: `New ${type.toLowerCase()}`,
      location: type === "Visit" ? undefined : { method: "coordinates", boundary: { id: `pt-${code}`, kind: "circle", center: [lat, lon], radiusKm: 0.1 } },
      sections: eventSections({
        type: type as EventFields["type"],
        code,
        name,
        description: NP,
        sourceId: NP,
        comment: NP,
        seq: `${siblings + 1}/${siblings + 1}`,
        eventArray: NP,
        startDate: date,
        endDate: NP,
        duration: NP,
        dateAccuracy: NP,
        observers: recordedBy && recordedBy !== NP ? [recordedBy] : [],
        lat,
        lon,
        dimensions: NP,
        locationComment: NP,
        photopoint: { present: "No", disc: NP, direction: NP },
        trapEffort: [],
      }),
    };
  }
  const common = {
    code,
    name,
    description: NP,
    comment: NP,
    startDate: date,
    endDate: NP,
    duration: NP,
    dateAccuracy: NP,
    observers: recordedBy && recordedBy !== NP ? [recordedBy] : [],
    lat,
    lon,
    locationComment: NP,
  };
  const pointLocation = { method: "coordinates" as const, boundary: { id: `pt-${code}`, kind: "circle" as const, center: [lat, lon] as [number, number], radiusKm: 0.01 } };
  if (kind === "occurrence") {
    const siblings = records.filter((r) => r.kind === "occurrence" && r.parentId === parent?.id).length;
    return {
      ...base,
      summary: type === "Individual" ? "1 individual" : "Count not recorded",
      location: pointLocation,
      sections: occurrenceSections({ ...common, type: type as SurveyOccurrenceType, legacy: NP, seq: String(siblings + 1), taxonomicType: NP, nsx: NP, status: "Present" }),
    };
  }
  return {
    ...base,
    summary: `New ${type.toLowerCase()} observation`,
    location: pointLocation,
    sections: observationSections({ ...common, type: type as SurveyObservationType }),
  };
}

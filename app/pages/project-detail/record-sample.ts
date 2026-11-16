import { getLocalTimeZone, today, type CalendarDate } from "@internationalized/date";
import { CODE_TABLES, CODE_VOCABS, CANOPY_TYPES, MULTI_OPTIONS, NUMBER_UNITS, SELECT_OPTIONS } from "./field-options";
import { NSX_SPECIES, fieldTypeOf, newTrapEntry, toJsonList, vocabTerms, type TrapEntry } from "./field-schema";
import { SELECTS, type Draft, type TrapEntryDraft } from "./record-form";
import { nameRow } from "./record-rules";
import { noteDate, noteId, type FieldNotes } from "./field-notes-store";
import type { MetaRow, MetaSection } from "./survey-data";

// The add-a-record form's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// The form is one form for every kind of record (an event, an occurrence or an observation, each with its own sections), and which questions it asks is set
// by the record that is being added, so the sample is built from that record and answers every question it has (the designer, 10 Nov 2026): every field of
// every section in the form of its own control (a code from its list, a choice from its options, a number in its unit, a date in order), the observers, the
// measurements, the custom properties, a trap's trap types with their effort and specs, the landscape context and overstorey readings, a note with a file
// on a field, and every concept shown (the fields a new record starts with hidden are put on screen, the branch that shows more).
// Honest (CONTRACTS 0.3): the species is one from the build's own NSX list, the people are the placeholders, the dates are in the past and in order, and
// the one identifier the form asks for (a source ID) is plainly a sample, not a number that could be taken for a real one.

export interface RecordSample {
  draft: Draft;
  /** The concepts hidden on the form; none, so every field is on screen. */
  hidden: Set<string>;
  notes: Record<string, FieldNotes>;
}

const SPECIES = NSX_SPECIES.find((s) => s.nsx === "M01170") ?? NSX_SPECIES[0];
const PEOPLE = ["Olivia Wyatt", "Phoenix Baker"];

const NAMES: Record<string, string> = {
  Site: "Ridge top site",
  Visit: "Spring visit",
  Transect: "Fire break transect",
  Quadrat: "Vegetation quadrat A",
  Block: "Creekline block",
  Ramble: "Creek bank ramble",
  Trap: "Pitfall trap array",
  Opportune: "Road kill record",
  "Point intercept": "Point intercept line A",
  "Custom event": "Spotlighting route",
  "occurrence:Individual": SPECIES.common,
  "occurrence:Population": SPECIES.common,
  "observation:Individual": "Bandicoot sighting",
  "observation:Population": "Bandicoot group count",
  "observation:Non-biotic": "Site disturbance survey",
  "observation:Community": "Woodland community assessment",
};

const DESCRIPTIONS: Record<string, string> = {
  Site: "Open woodland on a gentle ridge, with a native grass understorey.",
  Visit: "Spring survey round in clear conditions.",
  Transect: "Fixed-width transect along the fire break.",
  Quadrat: "Vegetation quadrat, BDBSA standard.",
  Block: "Timed area search of the creekline.",
  Ramble: "Opportunistic search along the creek bank.",
  Trap: "Pitfall and Elliott traps along the fence line.",
  Opportune: "One-time visit to record an animal found on the road.",
  "Point intercept": "A single point recorded within its parent event.",
  "Custom event": "Spotlighting on foot along the track.",
  "occurrence:Individual": `${SPECIES.common} seen at dusk near the drift fence.`,
  "occurrence:Population": `A small group of ${SPECIES.common.toLowerCase()}s along the fence line.`,
  "observation:Individual": "One adult, observed from the track.",
  "observation:Population": "Group counted from the drift fence.",
  "observation:Non-biotic": "Ground conditions across the survey block.",
  "observation:Community": "Open woodland over a native grass understorey.",
};

/** Answers by field label, for the fields whose answer is a fact about this record and not a choice from a list. */
const TEXT: Record<string, string> = {
  "Site grouping": "Ridge sites",
  "Specific property details": "Public reserve, no grazing",
  Paddock: "North paddock",
  "Source ID": "SAMPLE-SRC-01",
  "Event array": "Nocturnal fauna",
  "Observation time": "06:30",
  "Location comment": "Access from the main track, near the northern gate.",
  "Landform comment": "Gentle slope with shallow soil over weathered rock.",
};
const COMMENT = "Clear and still, nothing unusual noted during the survey.";

const NUMBERS: Record<string, string> = {
  Altitude: "412",
  "Photopoint disc number": "12",
  "Photopoint direction": "180",
  "Number observed": "4",
  "Number of landform features within block": "2",
  "Site slope": "8",
  "Site aspect": "270",
  "Bare earth estimate": "9",
  "Litter estimate": "64",
  "Crown extent": "70",
  "Crown density": "55",
  DBH: "420",
  "Voucher number": "1",
};

const NO = new Set(["Gravid?", "Is annual herb?", "Planted/Released"]);
const PICK: Record<string, string> = { Sex: "F", "Taxonomic type": SPECIES.kingdom, "Institution rego #": "Mammals" };

const DATE_TERMS = new Set(["eventDate", "measurementDeterminedDate"]);

const iso = (d: CalendarDate) => d.toString();

/** One field's sample answer in the form its control keeps, or null where the field is the system's or is worked out. */
function answer(row: MetaRow, ctx: { key: string; start: CalendarDate }): string | null {
  const { label } = row;
  const type = fieldTypeOf(row);
  if (type === "system" || type === "derived" || type === "score" || type === "measurements") return null;
  const options = SELECTS[label];
  if (options) return options[0];
  if (PICK[label]) return PICK[label];
  if (TEXT[label]) return TEXT[label];
  switch (type) {
    case "species":
      return SPECIES.nsx;
    case "vocab": {
      const terms = vocabTerms(label);
      return terms.some((t) => t.code === row.value) ? row.value : (terms[0]?.code ?? row.value);
    }
    case "select":
      return SELECT_OPTIONS[label]?.[0] ?? row.value;
    case "multi":
      return (MULTI_OPTIONS[label] ?? []).slice(-2).join(" | ");
    case "people":
      return PEOPLE.join(" | ");
    case "codes": {
      const columns = CODE_TABLES[row.table ?? label] ?? [];
      return toJsonList([0, 1].map((i) => columns.map((c) => (c.vocab ? (CODE_VOCABS[c.vocab]?.[i]?.code ?? "") : (c.options?.[i] ?? "")))));
    }
    case "numberUnit": {
      const unit = NUMBER_UNITS[label]?.[0] ?? "";
      return label === "Air temperature (max)" ? "22 °C" : label === "Air temperature (min)" ? "14 °C" : `2 ${unit}`.trim();
    }
    case "unitNumber":
    case "number":
    case "voucher":
      return NUMBERS[label] ?? "2";
    case "dimensions":
      return "20 × 20 m";
    case "yesno":
      return NO.has(label) ? "No" : "Yes";
    case "date":
      return iso(ctx.start.add({ days: label === "End date" ? 1 : label === "Transfer date" ? 4 : label === "Start date" ? 0 : 2 }));
    case "duration":
      return "1d 0h 0m";
    case "images":
      return toJsonList(["sample-voucher-tube.jpg"]);
    case "textarea":
      return COMMENT;
    default:
      return label === "Description" ? (DESCRIPTIONS[ctx.key] ?? "Noted on site") : "Noted on site";
  }
}

/** A trap's trap types, with every effort field and every spec its type has. */
function sampleTraps(newId: () => number): TrapEntryDraft[] {
  const entry = (trapType: string, p: Partial<Omit<TrapEntry, "trapType">>): TrapEntryDraft => ({
    id: newId(),
    ...newTrapEntry(trapType),
    ...p,
    durations: (p.durations ?? []).map((d) => ({ ...d, rid: newId() })),
    specs: (p.specs ?? []).map((s) => ({ ...s, rid: newId() })),
  });
  return [
    entry("Elliott", {
      values: { count: { value: "20" } },
      durations: [{ value: "4", unit: "nights" }],
      specs: [
        { field: "length", value: "30" },
        { field: "width", value: "10" },
        { field: "height", value: "10" },
      ],
    }),
    entry("Pitfall", { values: { count: { value: "6" } }, durations: [{ value: "4", unit: "nights" }] }),
    entry("Seine net", { values: { hauls: { value: "3" } } }),
    entry("eFishing", {
      specs: [
        { field: "voltage", value: "300" },
        { field: "frequency", value: "60" },
        { field: "dutyCycle", value: "25" },
        { field: "waveForm", value: "Pulsed DC" },
      ],
    }),
  ];
}

/** The record being added, with every question it asks answered. `newId` hands out the form's own row ids. */
export function sampleRecord(current: RecordSample, newId: () => number): RecordSample {
  const { draft } = current;
  const { record } = draft;
  const key = record.kind === "event" ? record.type : `${record.kind}:${record.type}`;
  const start = today(getLocalTimeZone()).subtract({ days: 8 });
  const ctx = { key, start };
  const nr = nameRow(record);

  const fill = (section: MetaSection): MetaSection => {
    const next: MetaSection = {
      ...section,
      rows: section.rows?.map((row) => {
        if (section.id === "observers" || section.id === "custom" || row.term === "recordedBy") return row;
        if (nr && nr.section === section.id && nr.label === row.label) return row;
        if ((row.term && DATE_TERMS.has(row.term)) || row.label === "Established") return row;
        const value = answer(row, ctx);
        return value === null ? row : { ...row, value };
      }),
    };
    if (section.landscape) next.landscape = { ...section.landscape, inputs: { cover: "38", perimeter: "300", protectedPct: "15", riparian: "Yes", swamp: "Yes" } };
    if (section.overstorey) {
      next.overstorey = {
        canopyType: CANOPY_TYPES[0],
        foliageCover: "32",
        readings: [
          { height: "18", crownDepth: "7", canopyDiameter: "9", gaps: "4", valueType: "Measured" },
          { height: "21", crownDepth: "9", canopyDiameter: "11", gaps: "3", valueType: "Estimated" },
        ],
      };
    }
    return next;
  };

  const has = (id: string) => record.sections.some((s) => s.id === id);
  const sections = record.sections.map(fill);
  const description = sections.find((s) => s.id === "details")?.rows?.find((r) => r.label === "Description");
  const notes = { ...current.notes };
  if (description) {
    const field = `details:${description.label}`;
    notes[field] = {
      comments: [{ id: noteId("c"), author: PEOPLE[0], date: noteDate(), text: "Photographed from the northern gate." }],
      files: [{ id: noteId("f"), name: "sample-site-photo.png", size: "64 KB", kind: "image", addedBy: PEOPLE[0], date: noteDate() }],
    };
  }

  return {
    hidden: new Set(),
    notes,
    draft: {
      ...draft,
      record: { ...record, sections },
      name: NAMES[key] ?? "Sample record",
      scientificName: record.kind === "occurrence" ? SPECIES.scientific : draft.scientificName,
      date: start,
      observers: has("observers") || record.sections.some((x) => x.rows?.some((r) => r.term === "recordedBy")) ? PEOPLE.map((name) => ({ id: newId(), name })) : draft.observers,
      measurements: record.sections.some((s) => s.measurements)
        ? [
            { id: newId(), type: "Body mass", value: "1.2", unit: "kg", method: "" },
            { id: newId(), type: "Head-body length", value: "310", unit: "mm", method: "" },
          ]
        : draft.measurements,
      properties: has("custom")
        ? [
            { id: newId(), name: "Weather", value: "Clear, light wind" },
            { id: newId(), name: "Access", value: "Walking track from the northern gate" },
          ]
        : draft.properties,
      trapEffort: has("trapEffort") ? sampleTraps(newId) : draft.trapEffort,
    },
  };
}

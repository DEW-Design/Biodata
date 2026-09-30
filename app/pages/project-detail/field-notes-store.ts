"use client";

// VERSION 3: notes on individual fields (properties) of a record, persisted with zustand to
// localStorage (the same `persist` + `skipHydration` + `useRehydrate` pattern as the DSA, DLA and
// Explore stores, see _shared/zustand-persist.ts), so a flag, comment or file added in this browser
// survives a reload.
//
// Any field (a metadata row, or a measurement) can carry:
// - a flag: the value is questionable, with the reason, who raised it and when (one open flag at a
//   time; resolving it removes it);
// - one comment: the field's note, added once and then edited (never a growing thread);
// - files: artefacts and attachments. Artefacts and attachments belong to a property, not to the
//   record as a whole, so this store is also the source of the "Artefacts and attachments" tab.
//
// Seeded with example notes written for this prototype (the placeholder cast), and with the four
// existing artefacts re-attached to the property each one documents. The files are metadata only:
// there is no real upload in this preview. Key: `${sectionId}:${field label or measurement type}`.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  browserStorage,
  useRehydrate,
} from "@/app/pages/_shared/zustand-persist";
import { trapLabels } from "./field-schema";
import type { SurveyRecord } from "./survey-data";
import { FACTOR_TITLES } from "./landscape";

export type FieldFileKind = "image" | "pdf" | "spreadsheet" | "video" | "link";

export interface FieldFlag {
  reason: string;
  by: string;
  date: string;
}
export interface FieldComment {
  id: string;
  author: string;
  date: string;
  text: string;
}
export interface FieldFile {
  id: string;
  name: string;
  size: string;
  kind: FieldFileKind;
  addedBy: string;
  date: string;
  /** A reference link's address (kind "link"). */
  url?: string;
}
/** The last time a questionable value was resolved: why, by whom, and what had been questioned. */
export interface FieldResolution {
  reason: string;
  by: string;
  date: string;
  flagReason: string;
}
export interface FieldNotes {
  flag?: FieldFlag;
  resolved?: FieldResolution;
  comments: FieldComment[];
  files: FieldFile[];
}

type NotesMap = Record<string, Record<string, FieldNotes>>;

const c = (
  id: string,
  author: string,
  date: string,
  text: string,
): FieldComment => ({ id, author, date, text });
const f = (
  id: string,
  name: string,
  size: string,
  kind: FieldFileKind,
  addedBy: string,
  date: string,
): FieldFile => ({ id, name, size, kind, addedBy, date });

// More values marked questionable (and two already resolved), so the review queue on the
// "Questionable values" tab has a realistic spread across record types (added 29 Sept 2026).
const REVIEW_SEED: NotesMap = {
  ob2: {
    "species:Number observed": {
      flag: {
        reason: "Stems were counted before tagging; some resprouting clumps may have been counted twice.",
        by: "Lana Steiner",
        date: "21 Oct 2025",
      },
      comments: [],
      files: [],
    },
  },
  qr1: {
    "location:Location method": {
      flag: {
        reason: "The corner pickets were fixed with a phone, not the DGPS unit recorded here.",
        by: "Maya Dewitt",
        date: "22 Oct 2025",
      },
      comments: [],
      files: [],
    },
  },
  ob3: {
    "species:Cover/abundance & desc": {
      flag: {
        reason: "Cover class 3 looks high for 32 plants in a 20 × 20 m quadrat.",
        by: "Lana Steiner",
        date: "23 Oct 2025",
      },
      comments: [],
      files: [],
    },
  },
  cu1: {
    "temporal:Duration": {
      flag: {
        reason: "The GPS track shows the route took about 1.5 hours, not 2.",
        by: "Olivia Wyatt",
        date: "20 Mar 2026",
      },
      comments: [],
      files: [],
    },
  },
  vu1: {
    "temporal:Date accuracy": {
      resolved: {
        reason: "Dates confirmed against the field sheets.",
        by: "Jane Harlow",
        date: "20 Oct 2025",
        flagReason: "The visit may have run over two days.",
      },
      comments: [],
      files: [],
    },
  },
  oc5: {
    "details:Occurrence status": {
      resolved: {
        reason: "Calls confirmed on the audio recording.",
        by: "Jane Harlow",
        date: "25 Mar 2026",
        flagReason: "Heard only once; could be a different froglet.",
      },
      comments: [],
      files: [],
    },
  },
};

const SEED: NotesMap = {
  // Cleland Stringybark Woodland (Site)
  su1: {
    "details:Description": {
      comments: [],
      files: [
        f(
          "f-su1-burn",
          "Autumn 2024 burn extent.pdf",
          "1.1 MB",
          "pdf",
          "Olivia Wyatt",
          "2 Nov 2025",
        ),
      ],
    },
    "details:Site grouping": {
      comments: [
        c(
          "c-su1-1",
          "Maya Dewitt",
          "3 Nov 2025",
          "Grouped with the other fire-recovery sites so they report together.",
        ),
      ],
      files: [],
    },
    "location:Reliability": {
      flag: {
        reason:
          "GPS drift under dense canopy; the true error may be more than 5 m.",
        by: "Phoenix Baker",
        date: "14 Oct 2025",
      },
      comments: [
        c(
          "c-su1-2",
          "Olivia Wyatt",
          "15 Oct 2025",
          "Re-take the fix from the fire break on the next visit.",
        ),
      ],
      files: [],
    },
    "photopoint:Photopoint disc number": {
      comments: [],
      files: [
        f(
          "a1",
          "Photopoint PP-0192, Oct 2025.jpg",
          "4.2 MB",
          "image",
          "Olivia Wyatt",
          "14 Oct 2025",
        ),
      ],
    },
  },
  // Ridge-top bird transect
  tr1: {
    "temporal:Start date": {
      comments: [
        c(
          "c-tr1-1",
          "Maya Dewitt",
          "14 Oct 2025",
          "Started 10 minutes late because of fog.",
        ),
      ],
      files: [],
    },
  },
  // Pitfall and Elliott trap line A
  trp1: {
    "trapEffort:Elliott": {
      comments: [],
      files: [
        f(
          "a2",
          "Trap line A layout.pdf",
          "860 KB",
          "pdf",
          "Phoenix Baker",
          "13 Oct 2025",
        ),
      ],
    },
  },
  // Fairywren group composition (Population observation)
  ob1: {
    "species:Number observed": {
      comments: [
        c(
          "c-oc1-1",
          "Phoenix Baker",
          "14 Oct 2025",
          "Two more birds heard but not seen; not counted.",
        ),
      ],
      files: [
        f(
          "f-oc1-photo",
          "Fairywren group.jpg",
          "2.8 MB",
          "image",
          "Phoenix Baker",
          "14 Oct 2025",
        ),
      ],
    },
  },
  // Bandicoot capture measurements (Individual observation): all three on one field
  ob6: {
    "species:Sex": {
      flag: {
        reason:
          "Pouch check done in poor light; sex should be confirmed on recapture.",
        by: "Olivia Wyatt",
        date: "16 Oct 2025",
      },
      comments: [
        c(
          "c-oc4-1",
          "Phoenix Baker",
          "15 Oct 2025",
          "Pouch young seen, so recorded as female. Confirm on the next trapping round.",
        ),
      ],
      files: [
        f(
          "f-oc4-pouch",
          "Pouch check photo.jpg",
          "3.4 MB",
          "image",
          "Phoenix Baker",
          "15 Oct 2025",
        ),
      ],
    },
    "species:Body mass": {
      flag: {
        reason: "Spring balance was not calibrated that morning.",
        by: "Phoenix Baker",
        date: "15 Oct 2025",
      },
      comments: [],
      files: [
        f(
          "a3",
          "Bandicoot capture sheet.xlsx",
          "38 KB",
          "spreadsheet",
          "Phoenix Baker",
          "15 Oct 2025",
        ),
      ],
    },
  },
  // Southern Brown Bandicoot (Individual occurrence)
  oc4: {
    "voucher:Determiners": {
      comments: [
        c(
          "c-oc4-3",
          "Lana Steiner",
          "20 Oct 2025",
          "Hair sample sent to the museum to confirm.",
        ),
      ],
      files: [],
    },
  },
  // Froglet chorus count
  ob7: {
    "species:Number observed": {
      comments: [],
      files: [
        f(
          "a4",
          "Froglet chorus recording.mp4",
          "22 MB",
          "video",
          "Lana Steiner",
          "18 Mar 2026",
        ),
      ],
    },
  },
};

function withReviewSeed(base: NotesMap): NotesMap {
  const out: NotesMap = { ...base };
  for (const [recordId, fields] of Object.entries(REVIEW_SEED)) {
    const current = { ...(out[recordId] ?? {}) };
    for (const [key, n] of Object.entries(fields)) if (!current[key]) current[key] = n;
    out[recordId] = current;
  }
  return out;
}

const EMPTY_NOTES: FieldNotes = { comments: [], files: [] };

interface NotesState {
  notes: NotesMap;
}

const useNotesStore = create<NotesState>()(
  persist(() => ({ notes: withReviewSeed(SEED) }), {
    name: "biodata-project-field-notes",
    // Version 2: the example notes on the transect and the trap moved off fields the Figma rebuild
    // removed ("Sampling effort", "Sampling protocol") onto fields those records still have.
    // Version 3: occurrences and observations were rebuilt from Figma (29 Sept 2026). Sex, the
    // count and measurements now live on the observation's Species section, and "Identified by" is the
    // voucher's Determiners, so the example notes move with them.
    // Version 4: the review queue's extra example flags are added where a field has no notes yet.
    version: 4,
    migrate: (persisted, version) => {
      const state = persisted as NotesState;
      if (version < 4 && state?.notes) state.notes = withReviewSeed(state.notes);
      if (version < 3 && state?.notes) {
        const moveTo = (
          fromRecord: string,
          from: string,
          toRecord: string,
          to: string,
        ) => {
          const src = state.notes[fromRecord];
          if (!src?.[from]) return;
          const dst = (state.notes[toRecord] ??= {});
          if (!dst[to]) dst[to] = src[from];
          delete src[from];
        };
        moveTo("oc1", "occurrence:Quantity", "ob1", "species:Number observed");
        moveTo("oc4", "occurrence:Sex", "ob6", "species:Sex");
        moveTo(
          "oc4",
          "identification:Identified by",
          "oc4",
          "voucher:Determiners",
        );
        moveTo("ob6", "measurements:Body mass", "ob6", "species:Body mass");
        moveTo(
          "ob7",
          "measurements:Calling males",
          "ob7",
          "species:Number observed",
        );
      }
      if (version < 2 && state?.notes) {
        const move = (recordId: string, from: string, to: string) => {
          const r = state.notes[recordId];
          if (r?.[from] && !r[to]) {
            r[to] = r[from];
            delete r[from];
          }
        };
        move("tr1", "details:Sampling effort", "temporal:Start date");
        move("trp1", "details:Sampling protocol", "trapEffort:Elliott");
      }
      return state;
    },
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

function update(
  recordId: string,
  key: string,
  fn: (n: FieldNotes) => FieldNotes,
) {
  useNotesStore.setState((s) => {
    const forRecord = s.notes[recordId] ?? {};
    const next = fn(forRecord[key] ?? EMPTY_NOTES);
    return { notes: { ...s.notes, [recordId]: { ...forRecord, [key]: next } } };
  });
}

const today = () =>
  new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const fieldNotesActions = {
  flag(recordId: string, key: string, reason: string, by: string) {
    update(recordId, key, (n) => ({
      ...n,
      flag: { reason, by, date: today() },
    }));
  },
  /** Resolving needs a reason; the last resolution is kept with the field, so the history stays. */
  resolveFlag(recordId: string, key: string, reason: string, by: string) {
    update(recordId, key, (n) =>
      n.flag
        ? {
            ...n,
            flag: undefined,
            resolved: { reason, by, date: today(), flagReason: n.flag.reason },
          }
        : n,
    );
  },
  /** A field has one comment: this adds it, or replaces the existing one with the edited text. */
  comment(recordId: string, key: string, text: string, author: string) {
    update(recordId, key, (n) => ({
      ...n,
      comments: [
        { id: n.comments[0]?.id ?? newId("c"), author, date: today(), text },
      ],
    }));
  },
  removeComment(recordId: string, key: string, id: string) {
    update(recordId, key, (n) => ({
      ...n,
      comments: n.comments.filter((x) => x.id !== id),
    }));
  },
  attach(
    recordId: string,
    key: string,
    file: { name: string; sizeBytes: number; kind: FieldFileKind },
    by: string,
  ) {
    const size =
      file.sizeBytes >= 1_000_000
        ? `${(file.sizeBytes / 1_000_000).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.sizeBytes / 1000))} KB`;
    update(recordId, key, (n) => ({
      ...n,
      files: [
        ...n.files,
        {
          id: newId("f"),
          name: file.name,
          size,
          kind: file.kind,
          addedBy: by,
          date: today(),
        },
      ],
    }));
  },
  removeFile(recordId: string, key: string, id: string) {
    update(recordId, key, (n) => ({
      ...n,
      files: n.files.filter((x) => x.id !== id),
    }));
  },
  /** Replaces one field's notes (a note added, edited or removed from the record's view). */
  setFieldNotes(recordId: string, key: string, next: FieldNotes) {
    update(recordId, key, () => next);
  },
  /** Replaces every note on a record at once: how an edit session's notes are saved. */
  setRecordNotes(recordId: string, fields: Record<string, FieldNotes>) {
    useNotesStore.setState((s) => ({
      notes: { ...s.notes, [recordId]: fields },
    }));
  },
};

export { today as noteDate, newId as noteId, EMPTY_NOTES as EMPTY_NOTES_VALUE };

/** Every field note, kept in step with localStorage. */
export function useFieldNotes(): NotesMap {
  useRehydrate(useNotesStore);
  return useNotesStore((s) => s.notes);
}

export function hasNotes(n: FieldNotes | undefined): n is FieldNotes {
  return (
    !!n &&
    (!!n.flag || !!n.resolved || n.comments.length > 0 || n.files.length > 0)
  );
}

/**
 * The field keys a record has right now (`section:label`). Notes are only ever shown or counted for
 * these: a note left on a field the record no longer has must never show a marker.
 */
export function recordFieldKeys(record: SurveyRecord): Set<string> {
  const keys = new Set<string>();
  for (const s of record.sections) {
    (s.rows ?? [])
      .filter((r) => r.type !== "measurements")
      .forEach((r) => keys.add(`${s.id}:${r.label}`));
    if (s.landscape)
      s.landscape.factors.forEach((f) =>
        keys.add(`${s.id}:${FACTOR_TITLES[f].short}`),
      );
    if (s.overstorey)
      ["Canopy type", "Projected foliage cover", "Readings"].forEach((l) =>
        keys.add(`${s.id}:${l}`),
      );
    (s.measurements ?? []).forEach((m) => keys.add(`${s.id}:${m.type}`));
    if (s.trapEffort)
      trapLabels(s.trapEffort).forEach((l) => keys.add(`${s.id}:${l}`));
    if (s.withMap) keys.add(`${s.id}:Location details`);
  }
  return keys;
}

/** A section's totals, for its (closed) header. Only fields the record still has count. */
export function sectionSummary(
  notes: NotesMap,
  record: SurveyRecord,
  sectionId: string,
) {
  const keys = recordFieldKeys(record);
  const entries = Object.entries(notes[record.id] ?? {}).filter(
    ([k]) => k.startsWith(`${sectionId}:`) && keys.has(k),
  );
  return {
    flags: entries.filter(([, n]) => n.flag).length,
    comments: entries.reduce((sum, [, n]) => sum + n.comments.length, 0),
    files: entries.reduce((sum, [, n]) => sum + n.files.length, 0),
  };
}

/** Every attached file across the project, with where it is attached. */
export function allFiles(
  notes: NotesMap,
): { recordId: string; key: string; file: FieldFile }[] {
  return Object.entries(notes).flatMap(([recordId, fields]) =>
    Object.entries(fields).flatMap(([key, n]) =>
      n.files.map((file) => ({ recordId, key, file })),
    ),
  );
}

export function kindForFile(name: string): FieldFileKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (
    ["jpg", "jpeg", "png", "webp", "gif", "tif", "tiff", "heic"].includes(ext)
  )
    return "image";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["mp4", "mov", "mp3", "wav", "m4a"].includes(ext)) return "video";
  return null;
}

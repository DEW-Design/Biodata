"use client";

// VERSION 3: which fields of a record are shown. In edit mode the right-hand column becomes a
// checklist of every category (section) and its fields; unticked fields are hidden when the record is
// viewed (the details panel and the full view). A category with every field hidden disappears.
//
// Per record, persisted with zustand to localStorage (the same pattern as field-notes-store.ts), so a
// choice survives a reload. Identifiers (a field whose label ends in "ID") are always shown: they are
// how a record is found and cited (a legacy ID can be hidden).

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  browserStorage,
  useRehydrate,
} from "@/app/pages/_shared/zustand-persist";
import type { MetaSection, SurveyRecord } from "./survey-data";
import { rowHasValue, trapLabels } from "./field-schema";
import { FACTOR_TITLES } from "./landscape";

interface VisibilityState {
  /** recordId -> hidden field keys (`${sectionId}:${label}`). */
  hidden: Record<string, string[]>;
}

const useVisibilityStore = create<VisibilityState>()(
  persist(() => ({ hidden: {} }), {
    name: "biodata-project-field-visibility",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export const ALWAYS_SHOWN = /^(?!Legacy\b).*(^|\s)ID$/;
/** Fields a record needs (its name, start date, species): always shown and edited, never hidden. */
export const REQUIRED_FIELD = /( name|^Start date|^NSX code & species)$/;

export interface FieldEntry {
  key: string;
  label: string;
  locked: boolean;
}

/** Every field of a section, as a visibility entry. */
export function sectionFieldEntries(section: MetaSection): FieldEntry[] {
  const labels = section.trapEffort
    ? trapLabels(section.trapEffort)
    : [
        ...(section.landscape
          ? section.landscape.factors.map((f) => FACTOR_TITLES[f].short)
          : []),
        ...(section.overstorey
          ? ["Canopy type", "Projected foliage cover", "Readings"]
          : []),
        ...(section.rows ?? []).flatMap((r) =>
          r.type === "measurements"
            ? (section.measurements ?? []).map((m) => m.type)
            : [r.label],
        ),
        ...(!section.rows
          ? (section.measurements ?? []).map((m) => m.type)
          : []),
      ];
  return labels.map((label) => ({
    key: `${section.id}:${label}`,
    label,
    locked: ALWAYS_SHOWN.test(label) || REQUIRED_FIELD.test(label),
  }));
}

/**
 * The fields of a record that have no value. They are left out of the view, and out of edit mode too
 * until they are ticked in "Fields shown" (which is how an empty field is added).
 */
export function emptyFieldKeys(record: SurveyRecord): Set<string> {
  const out = new Set<string>();
  for (const s of record.sections) {
    for (const r of s.rows ?? []) {
      if (r.type === "measurements" || r.label === "Custom properties")
        continue;
      if (!rowHasValue(r, s.rows)) out.add(`${s.id}:${r.label}`);
    }
    if (s.landscape) {
      const entered = Object.values(s.landscape.inputs).some(
        (v) => v != null && String(v).trim() !== "",
      );
      for (const f of s.landscape.factors) {
        const input = {
          cover: s.landscape.inputs.cover,
          block: s.landscape.inputs.perimeter,
          protected: s.landscape.inputs.protectedPct,
          wetland: s.landscape.inputs.riparian ?? s.landscape.inputs.swamp,
          remaining: entered ? "x" : undefined,
        }[f];
        if (input == null || String(input).trim() === "")
          out.add(`${s.id}:${FACTOR_TITLES[f].short}`);
      }
    }
    if (s.overstorey) {
      if (
        !rowHasValue({ label: "Canopy type", value: s.overstorey.canopyType })
      )
        out.add(`${s.id}:Canopy type`);
      if (
        !rowHasValue({
          label: "Projected foliage cover",
          value: s.overstorey.foliageCover,
        })
      )
        out.add(`${s.id}:Projected foliage cover`);
      if (s.overstorey.readings.length === 0) out.add(`${s.id}:Readings`);
    }
  }
  return out;
}

/** Whether a card has anything to edit: a list (trap types, measurements, custom properties, location) or a field that isn't hidden. */
export function sectionShownInEdit(
  section: MetaSection,
  hidden: Set<string>,
): boolean {
  if (
    section.withMap ||
    section.trapEffort ||
    section.id === "custom" ||
    (section.measurements && !section.rows)
  )
    return true;
  return sectionFieldEntries(section).some(
    (f) => f.locked || !hidden.has(f.key),
  );
}

export function recordFieldEntries(record: SurveyRecord) {
  return record.sections.map((section) => ({
    section,
    fields: sectionFieldEntries(section),
  }));
}

export function useHiddenFields(recordId: string | undefined): Set<string> {
  useRehydrate(useVisibilityStore);
  const list = useVisibilityStore((s) =>
    recordId ? s.hidden[recordId] : undefined,
  );
  return new Set(list ?? []);
}

export function setHiddenFields(recordId: string, keys: Iterable<string>) {
  useVisibilityStore.setState((s) => ({
    hidden: { ...s.hidden, [recordId]: [...keys] },
  }));
}

/** A section is shown while at least one of its fields is (a section with no fields always shows). */
/**
 * Whether a section has anything to show when viewed. Fields with no value are left out of the view,
 * so a section whose fields are all empty is left out too (it still shows in edit mode). A field
 * carrying notes counts, so its notes stay reachable.
 */
export function sectionHasContent(
  section: MetaSection,
  noted: (key: string) => boolean = () => false,
): boolean {
  if (section.withMap) return true;
  if (section.trapEffort) return section.trapEffort.length > 0;
  if ((section.measurements ?? []).length > 0) return true;
  if (
    section.landscape &&
    Object.values(section.landscape.inputs).some(
      (v) => v != null && String(v).trim() !== "",
    )
  )
    return true;
  if (
    section.overstorey &&
    (section.overstorey.readings.length > 0 ||
      rowHasValue({
        label: "Canopy type",
        value: section.overstorey.canopyType,
      }) ||
      rowHasValue({
        label: "Projected foliage cover",
        value: section.overstorey.foliageCover,
      }))
  )
    return true;
  return (
    sectionFieldEntries(section).some((f) => noted(f.key)) ||
    (section.rows ?? []).some(
      (r) =>
        r.type !== "measurements" &&
        r.label !== "Custom properties" &&
        rowHasValue(r, section.rows),
    )
  );
}

export function isSectionShown(section: MetaSection, hidden: Set<string>) {
  // Custom properties show only once one has been added (they are added in edit mode).
  if (
    section.id === "custom" &&
    !(section.rows ?? []).some((r) => r.label !== "Custom properties")
  )
    return false;
  const fields = sectionFieldEntries(section);
  return fields.length === 0 || fields.some((f) => !hidden.has(f.key));
}

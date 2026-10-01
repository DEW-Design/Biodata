"use client";

// VERSION 3: one card of the full view, in edit mode. Only the card being edited turns into fields;
// every other card stays as it is. Label on the left, field on the right, the same rows the card
// shows when viewed (the name, dates and scientific name are edited on the rows that show them).
// Under each field, "Notes" opens its note editor (field-notes.tsx). A hidden field is marked, so it
// is clear it won't show once saved.
//
// Works on the full view's draft (a Draft from ../record-form.tsx, plus the notes and hidden-field
// drafts); nothing is saved until Save changes in the footer.

import { useEffect, useState, type ReactNode } from "react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { Lock01, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { EMPTY, SELECTS, localId, type Draft } from "./record-form";
import {
  boundaryCentre,
  derivedFrom,
  fieldTypeOf,
  ibraFor,
  newTrapEntry,
  nsxSpecies,
  trapLabels,
} from "./field-schema";
import { useEditStore } from "./edit-store";
import { flashElement } from "./flash";
import {
  CodesControl,
  DimensionsControl,
  DurationControl,
  ImagesControl,
  LocationField,
  MultiControl,
  NumberControl,
  NumberUnitControl,
  ObserversControl,
  PeopleControl,
  SelectControl,
  SpeciesControl,
  UnitNumberControl,
  VocabControl,
  VoucherControl,
  YesNoControl,
  type AllowedArea,
} from "./field-controls";
import {
  INSTITUTION_PREFIX,
  MEASUREMENT_TYPES,
  MEASUREMENT_UNITS,
  MULTI_OPTIONS,
  SELECT_OPTIONS,
} from "./field-options";
import { LandscapeEditor, OverstoreyEditor } from "./landscape-editor";
import { nameRow } from "./record-rules";
import type { MetaRow, MetaSection } from "./survey-data";
import type { FieldNotes } from "./field-notes-store";
import {
  EMPTY_FIELD_NOTES,
  FieldNoteMenu,
  FieldNotesArea,
  takesNotes,
} from "./field-notes";
import { hasNotes } from "./field-notes-store";
import { AddTrapType, TrapEntryEditor } from "./trap-effort";

const DATE_TERMS = new Set(["eventDate", "measurementDeterminedDate"]);

export interface CardEditState {
  draft: Draft;
  patch: (p: Partial<Draft>) => void;
  notes: Record<string, FieldNotes>;
  setNotes: (key: string, next: FieldNotes) => void;
  hidden: Set<string>;
  /** Show inline errors (after a failed save). */
  showErrors: boolean;
  /** The field whose edit icon was pressed: scrolled to and focused. */
  focusField?: string;
}

function EditRow({
  fieldKey,
  label,
  required,
  hidden,
  notesKey,
  state,
  children,
}: {
  fieldKey: string;
  label: string;
  required?: boolean;
  hidden?: boolean;
  /** When set, the field takes notes under this key. */
  notesKey?: string;
  state: CardEditState;
  children: ReactNode;
}) {
  const current = notesKey
    ? (state.notes[notesKey] ?? EMPTY_FIELD_NOTES)
    : EMPTY_FIELD_NOTES;
  const [composer, setComposer] = useState<"comment" | "flag" | "link" | null>(
    null,
  );
  const setNotes = (next: FieldNotes) =>
    notesKey && state.setNotes(notesKey, next);
  const open = !!notesKey && (composer !== null || hasNotes(current));
  // Notes belong to the whole row: the "..." menu sits at the row's right edge and shows when any part
  // of the row is hovered, and the notes span the row under both the label and the field.
  // A hidden field (unticked in "Fields shown", or empty and not yet added) is left out of edit mode.
  if (hidden && !required) return null;
  return (
    <div
      id={`edit-field-${fieldKey}`}
      className={cx(
        "group/editrow relative scroll-mt-24 border-b border-secondary px-3 py-3 last:border-b-0",
        open && "-mt-px border-transparent bg-secondary",
      )}
    >
      <div className="flex items-start gap-1">
        <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-1.5 @md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] @md:gap-x-4">
          <div className="@md:pt-2">
            <p className="text-sm text-tertiary">
              {label}
              {required && <span className="text-brand-tertiary"> *</span>}
            </p>
          </div>
          <div className="min-w-0">{children}</div>
        </div>
        {notesKey && (
          <FieldNoteMenu
            label={label}
            notes={current}
            className="mt-1.5 opacity-0 transition-opacity group-focus-within/editrow:opacity-100 group-hover/editrow:opacity-100 aria-expanded:opacity-100"
            onPick={setComposer}
            onFile={(file) =>
              setNotes({ ...current, files: [...current.files, file] })
            }
          />
        )}
      </div>
      {notesKey && (
        <div className={cx(open && "mt-3")}>
          <FieldNotesArea
            label={label}
            notes={current}
            onChange={setNotes}
            composer={composer}
            onComposerDone={() => setComposer(null)}
          />
        </div>
      )}
    </div>
  );
}

/** The fields of one section, in edit mode. */
export type EditRowComponent = typeof EditRow;

export function CardEditor({
  section,
  isFirst,
  state,
}: {
  section: MetaSection;
  isFirst: boolean;
  state: CardEditState;
}) {
  const { draft, patch, hidden, showErrors: err } = state;
  const record = draft.record;
  const nr = nameRow(record);
  const sectionRows = section.rows ?? [];
  const store = useEditStore();
  // A record's location must sit inside the project's area and its nearest ancestor's location.
  const allowed: AllowedArea[] = [];
  const projectArea = store.project.collection.geographicExtent.boundary;
  if (projectArea)
    allowed.push({
      label: `the project area (${store.project.details.shortTitle})`,
      boundary: projectArea,
    });
  for (
    let p = store.recordById(record.parentId);
    p;
    p = store.recordById(p.parentId)
  ) {
    if (p.location?.boundary) {
      allowed.push({
        label: `${p.name} (${p.type} ${p.code})`,
        boundary: p.location.boundary,
      });
      break;
    }
  }
  // A site has no date of its own to enter (the Figma site frame has none); every other record does.
  const hasDateField = !(record.kind === "event" && record.type === "Site");
  const dateInRows = record.sections.some((s) =>
    (s.rows ?? []).some(
      (r) => (r.term && DATE_TERMS.has(r.term)) || r.label === "Established",
    ),
  );

  // Scroll to, and focus, the field whose edit icon was pressed.
  useEffect(() => {
    if (!state.focusField) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`edit-field-${state.focusField}`);
      el?.scrollIntoView({ block: "center" });
      // Show where the field is, the same highlight as every other jump to a field.
      flashElement(el, { scroll: false });
      el?.querySelector<HTMLElement>(
        "input, textarea, button[aria-haspopup]",
      )?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [state.focusField]);

  const key = (label: string) => `${section.id}:${label}`;
  const setRow = (label: string, value: string) =>
    patch({
      record: {
        ...record,
        sections: record.sections.map((s) =>
          s.id === section.id
            ? {
                ...s,
                rows: s.rows?.map((r) =>
                  r.label === label ? { ...r, value } : r,
                ),
              }
            : s,
        ),
      },
    });

  const nameControl = (label: string) => (
    <Input
      aria-label={label}
      isRequired
      value={draft.name}
      onChange={(name) => patch({ name })}
      isInvalid={err && !draft.name.trim()}
      hint={err && !draft.name.trim() ? "This field is required" : undefined}
    />
  );
  const dateControl = (label: string) => (
    <InputDatePicker
      aria-label={label}
      value={draft.date}
      onChange={(date) => patch({ date: date as CalendarDate | null })}
      isInvalid={err && !draft.date}
      hint={err && !draft.date ? "Choose a date" : undefined}
    />
  );

  const rowControl = (
    row: MetaRow,
  ): { control: ReactNode; required?: boolean; locked?: boolean } => {
    if (nr && nr.section === section.id && nr.label === row.label)
      return { control: nameControl(row.label), required: true };
    if ((row.term && DATE_TERMS.has(row.term)) || row.label === "Established")
      return { control: dateControl(row.label), required: true };
    if (fieldTypeOf(row) === "species")
      return {
        required: true,
        control: (
          <SpeciesControl
            label={row.label}
            value={row.value}
            isInvalid={err && !nsxSpecies(row.value)}
            onChange={(nsx) => {
              const sp = nsxSpecies(nsx);
              patch({
                scientificName: sp?.scientific ?? draft.scientificName,
                record: {
                  ...record,
                  sections: record.sections.map((s) =>
                    s.id === section.id
                      ? {
                          ...s,
                          rows: s.rows?.map((r) =>
                            r.label === row.label
                              ? { ...r, value: nsx }
                              : r.label === "Taxonomic type" && sp
                                ? { ...r, value: sp.kingdom }
                                : r,
                          ),
                        }
                      : s,
                  ),
                },
              });
            }}
          />
        ),
      };
    if (record.kind === "occurrence" && row.label === "Scientific name")
      return {
        required: true,
        control: (
          <Input
            aria-label="Scientific name"
            isRequired
            value={draft.scientificName}
            onChange={(scientificName) => patch({ scientificName })}
            isInvalid={err && !draft.scientificName.trim()}
            hint={
              err && !draft.scientificName.trim()
                ? "This field is required"
                : undefined
            }
          />
        ),
      };
    const type = fieldTypeOf(row);
    const locked = (text: string, hint?: string) => (
      <p
        className="flex flex-col gap-0.5 pt-2 text-sm text-tertiary"
        title={hint ?? "Set by the system"}
      >
        <span className="flex items-center gap-1.5">
          <Lock01 className="size-3.5 shrink-0" />
          {text}
        </span>
        {hint && <span className="text-xs text-tertiary">{hint}</span>}
      </p>
    );
    if (type === "system") return { locked: true, control: locked(row.value) };
    if (type === "derived") {
      // IBRA region and subregion follow the location as it is picked.
      const ibra = ibraFor(Number(draft.lat), Number(draft.lon));
      return {
        locked: true,
        control: locked(
          row.label === "IBRA subregion" ? ibra.subregion : ibra.region,
          "Worked out from the location",
        ),
      };
    }
    const set = (v: string) => setRow(row.label, v);
    if (type === "duration")
      return {
        control: (
          <DurationControl label={row.label} value={row.value} onChange={set} />
        ),
      };
    if (type === "date") {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(row.value)
        ? parseDate(row.value)
        : null;
      const before = !!iso && !!draft.date && iso.compare(draft.date) < 0;
      return {
        control: (
          <InputDatePicker
            aria-label={row.label}
            value={iso}
            minValue={draft.date ?? undefined}
            onChange={(d) => set(d ? d.toString() : "Not provided")}
            isInvalid={before}
            hint={before ? "Can't be before the start date" : undefined}
          />
        ),
      };
    }
    if (type === "number")
      return {
        control: (
          <NumberControl label={row.label} value={row.value} onChange={set} />
        ),
      };
    if (type === "unitNumber")
      return {
        control: (
          <UnitNumberControl
            label={row.label}
            value={row.value}
            onChange={set}
          />
        ),
      };
    if (type === "dimensions")
      return {
        control: (
          <DimensionsControl
            label={row.label}
            value={row.value}
            onChange={set}
          />
        ),
      };
    if (type === "vocab")
      return {
        control: (
          <VocabControl label={row.label} value={row.value} onChange={set} />
        ),
      };
    if (type === "yesno")
      return {
        control: (
          <YesNoControl label={row.label} value={row.value} onChange={set} />
        ),
      };
    if (type === "select")
      return {
        control: (
          <SelectControl
            label={row.label}
            value={row.value}
            options={SELECT_OPTIONS[row.label] ?? []}
            onChange={set}
          />
        ),
      };
    if (type === "multi")
      return {
        control: (
          <MultiControl
            label={row.label}
            value={row.value}
            options={MULTI_OPTIONS[row.label] ?? []}
            onChange={set}
          />
        ),
      };
    if (type === "people")
      return {
        control: (
          <PeopleControl label={row.label} value={row.value} onChange={set} />
        ),
      };
    if (type === "numberUnit")
      return {
        control: (
          <NumberUnitControl
            label={row.label}
            value={row.value}
            onChange={set}
          />
        ),
      };
    if (type === "images")
      return {
        control: (
          <ImagesControl label={row.label} value={row.value} onChange={set} />
        ),
      };
    if (type === "codes")
      return {
        control: (
          <CodesControl
            label={row.label}
            table={row.table ?? row.label}
            value={row.value}
            onChange={set}
          />
        ),
      };
    if (type === "voucher") {
      const institution =
        sectionRows.find((r) => r.label === "Institution name")?.value ?? "";
      return {
        control: (
          <VoucherControl
            label={row.label}
            value={row.value}
            prefix={INSTITUTION_PREFIX[institution]}
            onChange={set}
          />
        ),
      };
    }
    if (type === "score")
      return {
        locked: true,
        control: locked(
          derivedFrom(row.label, sectionRows) ?? "Not provided",
          `Worked out from ${row.label.replace(" score", "").toLowerCase()}`,
        ),
      };
    const value = EMPTY.has(row.value) ? "" : row.value;
    const options = SELECTS[row.label];
    if (options)
      return {
        control: (
          <Select
            aria-label={row.label}
            items={options.map((o) => ({ id: o, label: o }))}
            selectedKey={options.includes(row.value) ? row.value : null}
            onSelectionChange={(k) => set(k ? String(k) : "Not provided")}
          >
            {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
          </Select>
        ),
      };
    if (type === "textarea")
      return {
        control: (
          <TextArea
            aria-label={row.label}
            rows={3}
            value={value}
            onChange={(v) => set(v || "Not provided")}
          />
        ),
      };
    return {
      control: (
        <Input
          aria-label={row.label}
          value={value}
          onChange={(v) => set(v || "Not provided")}
        />
      ),
    };
  };

  const measurementEditor = (
    <>
      {draft.measurements.length === 0 && (
        <p className="px-3 py-3 text-sm text-tertiary">No measurements yet.</p>
      )}
      {draft.measurements.map((m, i) => {
        const set = (p: Partial<typeof m>) =>
          patch({
            measurements: draft.measurements.map((x) =>
              x.id === m.id ? { ...x, ...p } : x,
            ),
          });
        const incomplete =
          err &&
          (m.type.trim() || m.value.trim()) &&
          !(m.type.trim() && m.value.trim());
        const mKey = m.type.trim() ? key(m.type.trim()) : undefined;
        return (
          <EditRow
            key={m.id}
            fieldKey={mKey ?? `${section.id}:__new-${m.id}`}
            label={m.type.trim() || `Measurement ${i + 1}`}
            hidden={!!mKey && hidden.has(mKey)}
            notesKey={mKey}
            state={state}
          >
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-2 @lg:grid-cols-[2fr_1fr_1fr_2rem]">
                <Select
                  aria-label={`Measurement ${i + 1}`}
                  placeholder="Measurement"
                  items={[
                    ...MEASUREMENT_TYPES,
                    ...(m.type && !MEASUREMENT_TYPES.includes(m.type)
                      ? [m.type]
                      : []),
                  ].map((t) => ({ id: t, label: t }))}
                  selectedKey={m.type || null}
                  onSelectionChange={(k) => k && set({ type: String(k) })}
                  isInvalid={!!incomplete && !m.type.trim()}
                >
                  {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
                <Input
                  aria-label={`Value ${i + 1}`}
                  placeholder="Value"
                  value={m.value}
                  onChange={(v) => set({ value: v })}
                  isInvalid={!!incomplete && !m.value.trim()}
                />
                <Select
                  aria-label={`Unit ${i + 1}`}
                  placeholder="Unit"
                  items={[
                    ...MEASUREMENT_UNITS,
                    ...(m.unit && !MEASUREMENT_UNITS.includes(m.unit)
                      ? [m.unit]
                      : []),
                  ].map((u) => ({ id: u, label: u }))}
                  selectedKey={m.unit || null}
                  onSelectionChange={(k) => k && set({ unit: String(k) })}
                >
                  {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
                <Button
                  color="tertiary"
                  size="sm"
                  iconLeading={Trash01}
                  aria-label={`Remove measurement ${i + 1}`}
                  className="opacity-0 transition-opacity group-focus-within/editrow:opacity-100 group-hover/editrow:opacity-100 focus-visible:opacity-100"
                  onClick={() =>
                    patch({
                      measurements: draft.measurements.filter(
                        (x) => x.id !== m.id,
                      ),
                    })
                  }
                />
              </div>
            </div>
          </EditRow>
        );
      })}
      <div className="border-b border-secondary px-3 pt-2 pb-3 last:border-b-0">
        <Button
          color="link-color"
          size="sm"
          iconLeading={Plus}
          onClick={() =>
            patch({
              measurements: [
                ...draft.measurements,
                { id: localId(), type: "", value: "", unit: "", method: "" },
              ],
            })
          }
        >
          Add measurement
        </Button>
      </div>
    </>
  );
  return (
    <div className="@container flex flex-col">
      {/* An observation has no name row, and a record may have no date row: edit them on the first card. */}
      {isFirst && !nr && (
        <EditRow fieldKey="__name" label="Name" required state={state}>
          {nameControl("Name")}
        </EditRow>
      )}
      {isFirst && hasDateField && !dateInRows && (
        <EditRow fieldKey="__date" label="Date" required state={state}>
          {dateControl("Date")}
        </EditRow>
      )}

      {section.withMap && (
        <EditRow
          fieldKey={key("__location")}
          label="Location details"
          required={!record.locationNote}
          notesKey={key("Location details")}
          state={state}
        >
          {record.locationNote ? (
            <p className="flex items-center gap-1.5 pt-2 text-sm text-tertiary">
              <Lock01 className="size-3.5 shrink-0" /> Generalised for this
              restricted species; not editable here.
            </p>
          ) : (
            <LocationField
              value={draft.location}
              allowed={allowed}
              onChange={(location) => {
                const c = location.boundary
                  ? boundaryCentre(location.boundary)
                  : null;
                patch(
                  c
                    ? { location, lat: String(c[0]), lon: String(c[1]) }
                    : { location },
                );
              }}
            />
          )}
        </EditRow>
      )}

      {section.id === "observers" ? (
        <EditRow
          fieldKey={key("Recorded by")}
          label="Recorded by"
          hidden={hidden.has(key("Recorded by"))}
          notesKey={key("Recorded by")}
          state={state}
        >
          <ObserversControl
            names={draft.observers.map((o) => o.name).filter(Boolean)}
            onChange={(names) =>
              patch({
                observers: names.map(
                  (name) =>
                    draft.observers.find((o) => o.name === name) ?? {
                      id: localId(),
                      name,
                    },
                ),
              })
            }
          />
        </EditRow>
      ) : section.id === "trapEffort" ? (
        <>
          {draft.trapEffort.length === 0 && (
            <p className="px-3 py-3 text-sm text-tertiary">
              No trap types yet. Add each trap type used; its effort and specs
              fields come with it.
            </p>
          )}
          {draft.trapEffort.map((e, i) => {
            // Each trap type is a field like any other: it takes a comment, a questionable flag and attachments.
            const name = trapLabels(draft.trapEffort)[i];
            return (
              <EditRow
                key={e.id}
                fieldKey={key(name)}
                label={name}
                hidden={hidden.has(key(name))}
                notesKey={key(name)}
                state={state}
              >
                <TrapEntryEditor
                  entry={e}
                  name={name}
                  showErrors={err}
                  onChange={(next) =>
                    patch({
                      trapEffort: draft.trapEffort.map((x) =>
                        x.id === e.id ? next : x,
                      ),
                    })
                  }
                  onRemove={() =>
                    patch({
                      trapEffort: draft.trapEffort.filter((x) => x.id !== e.id),
                    })
                  }
                />
              </EditRow>
            );
          })}
          <div className="px-3 pt-2">
            <AddTrapType
              onAdd={(trapType) =>
                patch({
                  trapEffort: [
                    ...draft.trapEffort,
                    { id: localId(), ...newTrapEntry(trapType) },
                  ],
                })
              }
            />
          </div>
        </>
      ) : section.id === "custom" ? (
        <>
          {draft.properties.length === 0 && (
            <p className="px-3 py-3 text-sm text-tertiary">
              No custom properties.
            </p>
          )}
          {draft.properties.map((p, i) => (
            // Each property is a field like any other: once named, it takes a comment, a questionable flag and attachments.
            <EditRow
              key={p.id}
              fieldKey={`${section.id}:__p${p.id}`}
              label={p.name.trim() || `Property ${i + 1}`}
              hidden={!!p.name.trim() && hidden.has(key(p.name.trim()))}
              notesKey={p.name.trim() ? key(p.name.trim()) : undefined}
              state={state}
            >
              <div className="grid grid-cols-1 items-center gap-2 @md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_2rem]">
                <Input
                  aria-label={`Property ${i + 1} name`}
                  placeholder="Property name"
                  value={p.name}
                  onChange={(v) =>
                    patch({
                      properties: draft.properties.map((x) =>
                        x.id === p.id ? { ...x, name: v } : x,
                      ),
                    })
                  }
                />
                <Input
                  aria-label={`Property ${i + 1} value`}
                  placeholder="Value"
                  value={p.value}
                  onChange={(v) =>
                    patch({
                      properties: draft.properties.map((x) =>
                        x.id === p.id ? { ...x, value: v } : x,
                      ),
                    })
                  }
                />
                <Button
                  color="tertiary"
                  size="sm"
                  iconLeading={Trash01}
                  aria-label={`Remove property ${i + 1}`}
                  className="opacity-0 transition-opacity group-focus-within/editrow:opacity-100 group-hover/editrow:opacity-100 focus-visible:opacity-100"
                  onClick={() =>
                    patch({
                      properties: draft.properties.filter((x) => x.id !== p.id),
                    })
                  }
                />
              </div>
            </EditRow>
          ))}
          <div className="px-3 pt-2">
            <Button
              color="link-color"
              size="sm"
              iconLeading={Plus}
              onClick={() =>
                patch({
                  properties: [
                    ...draft.properties,
                    { id: localId(), name: "", value: "" },
                  ],
                })
              }
            >
              Add property
            </Button>
          </div>
        </>
      ) : (
        <>
          {section.landscape && (
            <LandscapeEditor
              section={section}
              state={state}
              EditRow={EditRow}
            />
          )}
          {section.overstorey && (
            <OverstoreyEditor
              section={section}
              state={state}
              EditRow={EditRow}
            />
          )}
          {sectionRows.map((row) => {
            if (row.type === "measurements")
              return (
                <div key="__measurements" className="contents">
                  {measurementEditor}
                </div>
              );
            const { control, required, locked } = rowControl(row);
            const k = key(row.label);
            return (
              <EditRow
                key={row.label}
                fieldKey={k}
                label={row.label}
                required={required}
                hidden={hidden.has(k)}
                notesKey={!locked && takesNotes(row.label) ? k : undefined}
                state={state}
              >
                {control}
              </EditRow>
            );
          })}
          {!section.rows && section.measurements && measurementEditor}
        </>
      )}
    </div>
  );
}

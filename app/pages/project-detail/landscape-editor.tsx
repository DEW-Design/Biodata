"use client";

// Editing landscape context scores and overstorey measurements, inside a card in edit mode (card-editor.tsx).
//
// Landscape context scores (a Block's only) are edited in the scoresheet, as on the record's view (landscape-view.tsx): the
// card shows the summary and the score, and the score opens the sheet; what is saved there goes into this edit, kept with the
// card's Save changes. Overstorey: canopy type, projected foliage cover (its structural class worked out and locked), the
// readings, then the averages worked out from them as they are typed.

import { Lock01, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { Select } from "@/components/base/select/select";
import { CANOPY_TYPES, foliageCoverClass } from "./field-options";
import { boundaryAreaKm2 } from "./landscape";
import type {
  MetaSection,
  OverstoreyData,
  OverstoreyReading,
} from "./survey-data";
import type { CardEditState, EditRowComponent } from "./card-editor";
import { SelectControl } from "./field-controls";
import {
  LANDSCAPE_SCORE_LABEL,
  LandscapeScoreLink,
  LandscapeSummary,
  OverstoreyStats,
  READING_COLUMNS,
  VALUE_TYPES,
  scoreBlock,
} from "./landscape-view";

const NP = "Not provided";
const toNum = (v?: string) =>
  v == null || v.trim() === "" || v === NP ? NaN : Number(v);
const fromNum = (n: number) => (Number.isNaN(n) ? "" : String(n));

function Calculated({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
        <span className="text-tertiary">{label}</span>
        <span className="font-medium text-primary tabular-nums">{value}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary">
          <Lock01 className="size-3" />
          Calculated
        </span>
      </p>
      {hint && <p className="text-xs text-balance text-tertiary">{hint}</p>}
    </div>
  );
}

function PercentInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <InputNumber
      aria-label={label}
      placeholder="0%"
      className="w-32"
      minValue={0}
      maxValue={100}
      formatOptions={{ style: "unit", unit: "percent", unitDisplay: "narrow" }}
      value={toNum(value)}
      onChange={(n) => onChange(fromNum(n))}
    />
  );
}

/** The block's score in its card while the card is edited: the summary, and the score opening the scoresheet, saved into this edit. */
export function LandscapeEditor({
  section,
  state,
  EditRow,
}: {
  section: MetaSection;
  state: CardEditState;
  EditRow: EditRowComponent;
}) {
  const { draft, patch, hidden } = state;
  const landscape = section.landscape!;
  const ctx = {
    lat: Number(draft.lat),
    lon: Number(draft.lon),
    areaKm2: boundaryAreaKm2(draft.location.boundary),
  };
  const k = `${section.id}:${LANDSCAPE_SCORE_LABEL}`;
  return (
    <>
      {!hidden.has(k) && (
        <div className="@container border-b border-secondary px-3 py-3">
          <LandscapeSummary score={scoreBlock(landscape.inputs, ctx)} />
        </div>
      )}
      <EditRow fieldKey={k} label={LANDSCAPE_SCORE_LABEL} hidden={hidden.has(k)} notesKey={k} state={state}>
        <LandscapeScoreLink
          inputs={landscape.inputs}
          ctx={ctx}
          title={`${draft.record.name}, ${draft.record.code}`}
          onSave={(inputs) =>
            patch({
              record: {
                ...draft.record,
                sections: draft.record.sections.map((s) => (s.id === section.id ? { ...s, landscape: { inputs } } : s)),
              },
            })
          }
        />
      </EditRow>
    </>
  );
}

export function OverstoreyEditor({
  section,
  state,
  EditRow,
}: {
  section: MetaSection;
  state: CardEditState;
  EditRow: EditRowComponent;
}) {
  const { draft, patch, hidden } = state;
  const data = section.overstorey!;
  const set = (p: Partial<OverstoreyData>) =>
    patch({
      record: {
        ...draft.record,
        sections: draft.record.sections.map((s) =>
          s.id === section.id ? { ...s, overstorey: { ...data, ...p } } : s,
        ),
      },
    });
  const setReading = (i: number, p: Partial<OverstoreyReading>) =>
    set({
      readings: data.readings.map((r, j) => (j === i ? { ...r, ...p } : r)),
    });
  const k = (label: string) => `${section.id}:${label}`;
  const pfc = toNum(data.foliageCover);
  return (
    <>
      <EditRow
        fieldKey={k("Canopy type")}
        label="Canopy type"
        hidden={hidden.has(k("Canopy type"))}
        notesKey={k("Canopy type")}
        state={state}
      >
        <SelectControl
          label="Canopy type"
          value={data.canopyType}
          options={CANOPY_TYPES}
          onChange={(v) => set({ canopyType: v })}
        />
      </EditRow>
      <EditRow
        fieldKey={k("Projected foliage cover")}
        label="Projected foliage cover"
        hidden={hidden.has(k("Projected foliage cover"))}
        notesKey={k("Projected foliage cover")}
        state={state}
      >
        <div className="flex flex-col gap-2">
          <PercentInput
            label="Projected foliage cover"
            value={data.foliageCover}
            onChange={(v) => set({ foliageCover: v || NP })}
          />
          {Number.isFinite(pfc) ? (
            <Calculated
              label="Structural class"
              value={foliageCoverClass(pfc)}
            />
          ) : (
            <p className="text-xs text-tertiary">
              The structural class is worked out from the percentage.
            </p>
          )}
        </div>
      </EditRow>
      <EditRow
        fieldKey={k("Readings")}
        label="Readings"
        hidden={hidden.has(k("Readings"))}
        notesKey={k("Readings")}
        state={state}
      >
        <div className="flex flex-col gap-2">
          {data.readings.length > 0 && (
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-max grid-cols-[1.5rem_repeat(4,5rem)_8rem_2rem] items-center gap-x-2 gap-y-2">
                <span className="self-end text-xs font-semibold text-quaternary">
                  #
                </span>
                {READING_COLUMNS.map((c) => (
                  <span
                    key={c.key}
                    className="self-end text-xs leading-tight font-semibold text-balance text-quaternary"
                  >
                    {c.label}
                    {c.unit && <span className="font-normal"> ({c.unit})</span>}
                  </span>
                ))}
                <span />
                {data.readings.map((r, i) => (
                  <div key={i} className="group/reading contents">
                    <span className="text-sm text-tertiary tabular-nums">
                      {i + 1}
                    </span>
                    {READING_COLUMNS.filter((c) => c.key !== "valueType").map(
                      (c) => (
                        // A plain text field (decimal keyboard) keeps the columns narrow enough to sit side by side.
                        <Input
                          key={c.key}
                          aria-label={`Reading ${i + 1}, ${c.label.toLowerCase()}`}
                          placeholder="0"
                          inputMode="decimal"
                          value={r[c.key]}
                          isInvalid={
                            r[c.key] !== "" &&
                            !Number.isFinite(Number(r[c.key]))
                          }
                          onChange={(v) => setReading(i, { [c.key]: v.trim() })}
                        />
                      ),
                    )}
                    <Select
                      aria-label={`Reading ${i + 1}, value type`}
                      placeholder="Type"
                      items={VALUE_TYPES.map((v) => ({ id: v, label: v }))}
                      selectedKey={r.valueType || null}
                      onSelectionChange={(key) =>
                        key && setReading(i, { valueType: String(key) })
                      }
                    >
                      {(item) => (
                        <Select.Item {...item}>{item.label}</Select.Item>
                      )}
                    </Select>
                    <Button
                      color="tertiary"
                      size="sm"
                      iconLeading={Trash01}
                      aria-label={`Remove reading ${i + 1}`}
                      className="opacity-0 transition-opacity group-hover/editrow:opacity-100 group-focus-within/editrow:opacity-100 focus-visible:opacity-100"
                      onClick={() =>
                        set({
                          readings: data.readings.filter((_, j) => j !== i),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button
            color="link-color"
            size="sm"
            iconLeading={Plus}
            className="w-max"
            onClick={() =>
              set({
                readings: [
                  ...data.readings,
                  {
                    height: "",
                    crownDepth: "",
                    canopyDiameter: "",
                    gaps: "",
                    valueType: "Measured",
                  },
                ],
              })
            }
          >
            Add reading
          </Button>
        </div>
      </EditRow>
      {!hidden.has(k("Readings")) && (
        <div className="border-b border-secondary px-3 py-3">
          <OverstoreyStats data={data} live />
        </div>
      )}
    </>
  );
}

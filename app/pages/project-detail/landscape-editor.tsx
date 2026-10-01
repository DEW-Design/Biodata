"use client";

// VERSION 3: editing landscape context scores and overstorey measurements, inside a card in edit
// mode (card-editor.tsx). The scores update as values are typed: the total card at the top and each
// factor's band strip and points follow the entry, so the result is never a surprise on save.
//
// What is typed and what is worked out, per factor (landscape.ts):
//  - Vegetation cover: typed (%).
//  - Block shape: the cleared perimeter is typed (m); the block's area comes from the record's
//    location, and the ratio is worked out from the two.
//  - Native veg. remaining: nothing typed. The IBRA association and subregion come from the location,
//    and their % remaining from the IBRA figures; both are scored and summed.
//  - Native veg. protected: typed (%).
//  - Wetland or riparian: two Yes/No questions, each adding its points.
// Worked-out values are locked and tagged "Calculated", like IBRA elsewhere.

import type { ReactNode } from "react";
import { Lock01, Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { Select } from "@/components/base/select/select";
import { CANOPY_TYPES, foliageCoverClass } from "./field-options";
import {
  BLOCK_BANDS,
  FACTOR_TITLES,
  REMAINING_BANDS,
  RIPARIAN_POINTS,
  SWAMP_POINTS,
  boundaryAreaKm2,
  pts,
  scoreLandscape,
  type FactorId,
  type LandscapeInputs,
} from "./landscape";
import type {
  MetaSection,
  OverstoreyData,
  OverstoreyReading,
} from "./survey-data";
import type { CardEditState, EditRowComponent } from "./card-editor";
import { SelectControl, YesNoControl } from "./field-controls";
import {
  BandStrip,
  FACTOR_BANDS,
  LandscapeTotal,
  OverstoreyStats,
  PointsPill,
  READING_COLUMNS,
  VALUE_TYPES,
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

function FactorHead({
  id,
  points,
  max,
}: {
  id: FactorId;
  points: number;
  max: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-balance text-tertiary">
        {FACTOR_TITLES[id].subtitle}
      </p>
      <PointsPill points={points} max={max} />
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
  const inputs = landscape.inputs;
  const areaKm2 = boundaryAreaKm2(draft.location.boundary);
  const score = scoreLandscape(landscape.factors, inputs, {
    lat: Number(draft.lat),
    lon: Number(draft.lon),
    areaKm2,
  });
  const set = (p: Partial<LandscapeInputs>) =>
    patch({
      record: {
        ...draft.record,
        sections: draft.record.sections.map((s) =>
          s.id === section.id
            ? { ...s, landscape: { ...landscape, inputs: { ...inputs, ...p } } }
            : s,
        ),
      },
    });
  const clean = (v: string) => (v === "" ? undefined : v);

  const factorBody = (id: FactorId): ReactNode => {
    const r = score.results.find((x) => x.id === id)!;
    const head = <FactorHead id={id} points={r.points} max={r.max} />;
    if (id === "cover")
      return (
        <>
          {head}
          <PercentInput
            label="Percent vegetation cover"
            value={inputs.cover}
            onChange={(v) => set({ cover: clean(v) })}
          />
          <BandStrip bands={FACTOR_BANDS.cover!} match={r.band} />
        </>
      );
    if (id === "block")
      return (
        <>
          {head}
          <InputNumber
            aria-label="Cleared perimeter"
            placeholder="Perimeter"
            className="w-40"
            minValue={0}
            formatOptions={{
              style: "unit",
              unit: "meter",
              unitDisplay: "short",
            }}
            hint="The block's cleared perimeter, in metres"
            value={toNum(inputs.perimeter)}
            onChange={(n) => set({ perimeter: clean(fromNum(n)) })}
          />
          <Calculated
            label="Block area"
            value={areaKm2 ? `${areaKm2.toFixed(2)} km²` : NP}
            hint={
              areaKm2
                ? "From the record's location."
                : "Set the record's location to work this out."
            }
          />
          <Calculated
            label="Perimeter to area ratio"
            value={
              Number.isFinite(score.ratio)
                ? `${score.ratio.toFixed(2)} km/km²`
                : NP
            }
          />
          <BandStrip bands={BLOCK_BANDS} match={r.band} />
        </>
      );
    if (id === "remaining") {
      const assoc = REMAINING_BANDS.find(
        (b) =>
          score.ibra.associationPct != null &&
          b.test(score.ibra.associationPct),
      );
      const sub = REMAINING_BANDS.find(
        (b) =>
          score.ibra.subregionPct != null && b.test(score.ibra.subregionPct),
      );
      return (
        <>
          {head}
          <Calculated
            label={`${score.ibra.association} association`}
            value={
              score.ibra.associationPct != null
                ? `${score.ibra.associationPct}% remaining · ${pts(assoc?.points ?? 0)} pts`
                : NP
            }
          />
          <BandStrip bands={REMAINING_BANDS} match={assoc?.label} />
          <Calculated
            label={`${score.ibra.subregion} subregion`}
            value={
              score.ibra.subregionPct != null
                ? `${score.ibra.subregionPct}% remaining · ${pts(sub?.points ?? 0)} pts`
                : NP
            }
          />
          <BandStrip bands={REMAINING_BANDS} match={sub?.label} />
          <p className="text-xs text-tertiary">
            From the location. The two scores are added.
          </p>
        </>
      );
    }
    if (id === "protected")
      return (
        <>
          {head}
          <PercentInput
            label="Native vegetation protected"
            value={inputs.protectedPct}
            onChange={(v) => set({ protectedPct: clean(v) })}
          />
          <BandStrip bands={FACTOR_BANDS.protected!} match={r.band} />
        </>
      );
    return (
      <>
        {head}
        <div className="flex flex-col gap-1">
          <p className="text-sm text-secondary">
            Riparian zone present?{" "}
            <span className="text-tertiary">({pts(RIPARIAN_POINTS)} pts)</span>
          </p>
          <YesNoControl
            label="Riparian zone present"
            value={inputs.riparian ?? NP}
            onChange={(v) => set({ riparian: v as "Yes" | "No" })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-secondary">
            Swamp or wetland present?{" "}
            <span className="text-tertiary">({pts(SWAMP_POINTS)} pts)</span>
          </p>
          <YesNoControl
            label="Swamp or wetland present"
            value={inputs.swamp ?? NP}
            onChange={(v) => set({ swamp: v as "Yes" | "No" })}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <div className="border-b border-secondary px-3 py-3">
        <LandscapeTotal score={score} live />
      </div>
      {landscape.factors.map((id) => {
        const k = `${section.id}:${FACTOR_TITLES[id].short}`;
        return (
          <EditRow
            key={id}
            fieldKey={k}
            label={FACTOR_TITLES[id].title}
            hidden={hidden.has(k)}
            notesKey={k}
            state={state}
          >
            <div className="flex flex-col gap-3">{factorBody(id)}</div>
          </EditRow>
        );
      })}
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
      {!hidden.has(k("Readings")) && (
        <div className="border-b border-secondary px-3 py-3">
          <OverstoreyStats data={data} live />
        </div>
      )}
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
    </>
  );
}

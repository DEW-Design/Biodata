"use client";

// How landscape context scores and overstorey measurements read (landscape.ts).
//
// Landscape context scores are a Block event's only, and read as the site scores page reads its scores (designer, 9 Nov 2026:
// "we must match the landscape context scores like this", /pages/site-scores): a grey card with each factor's points and the
// sum that makes the score, then the score itself, which opens the scoresheet's own block, in its order and with its words
// (the Bushland Assessment workbook's "Landscape Context Scores"). The sheet's purple cells are the fields a person types there
// (vegetation cover, cleared perimeter, riparian zone, swamp or wetland); every other figure is worked out and shown as text.
// Saved from the record's view, the sheet saves the record; opened while the card is being edited, it goes into that edit.
//
// Overstorey: canopy type and projected foliage cover (with its structural class worked out), the readings, then the averages
// worked out from them (designer, 9 Nov 2026: "bring the reading above the summary").

import { useState } from "react";
import { Save01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { InputNumber } from "@/components/base/input/input-number";
import {
  Dialog,
  FormModal,
  Modal,
  ModalHeader,
  ModalOverlay,
} from "@/components/application/modals/modal";
import { Line, ScoreGroup } from "./site-scores/scoresheet";
import { foliageCoverClass } from "./field-options";
import { YesNoControl } from "./field-controls";
import {
  BLOCK_BANDS,
  BLOCK_FACTORS,
  COVER_BANDS,
  FACTOR_TITLES,
  LANDSCAPE_MAX,
  LANDSCAPE_MIN,
  LANDSCAPE_SCORE_LABEL,
  PROTECTED_BANDS,
  REMAINING_BANDS,
  RIPARIAN_POINTS,
  SWAMP_POINTS,
  pts,
  scoreLandscape,
  type Band,
  type LandscapeInputs,
} from "./landscape";
import type { OverstoreyData } from "./survey-data";
import { EMPTY_VALUES } from "./field-schema";

export { LANDSCAPE_SCORE_LABEL };

export type LandscapeScore = ReturnType<typeof scoreLandscape>;
export interface LandscapeContext {
  lat: number;
  lon: number;
  areaKm2?: number;
}

const NP = "Not provided";
const pointsText = (n: number) => (n === 0 ? "0 pts" : `${pts(n)} pts`);
/** A factor's bands as the sheet writes them: "0–5% = 0 pts; >5–10% = 0.02 pts". */
const bandsText = (bands: Band[]) =>
  bands.map((b) => `${b.label} = ${pointsText(b.points)}`).join("; ");
const toNum = (v?: string) => (v == null || v.trim() === "" ? NaN : Number(v));
const fromNum = (n: number) => (Number.isFinite(n) ? String(n) : undefined);

export const scoreBlock = (inputs: LandscapeInputs, ctx: LandscapeContext) =>
  scoreLandscape(BLOCK_FACTORS, inputs, ctx);

/** The grey card: each factor's points, then the sum that makes the score (site scores' figures and breakdown). */
export function LandscapeSummary({ score }: { score: LandscapeScore }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary p-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @2xl:grid-cols-5">
        {score.results.map((r) => (
          <div key={r.id} className="flex flex-col gap-0.5">
            <dt className="text-xs text-balance text-tertiary">
              {FACTOR_TITLES[r.id].short}
            </dt>
            <dd className="text-sm font-medium text-primary tabular-nums">
              {pts(r.points)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1 border-t border-secondary pt-3">
        <dl className="grid grid-cols-1 gap-0.5 text-sm @md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] @md:gap-x-4">
          <dt className="text-tertiary">{LANDSCAPE_SCORE_LABEL}</dt>
          <dd className="text-primary tabular-nums">
            {[
              String(LANDSCAPE_MIN),
              ...score.results.map((r) => pts(r.points)),
            ].join(" + ")}{" "}
            = {pts(score.total)}
          </dd>
        </dl>
        <p className="text-xs text-balance text-tertiary">
          Every block scores at least {LANDSCAPE_MIN}, and the points of each
          factor are added to it, to a maximum of {LANDSCAPE_MAX}. The IBRA
          association and subregion are worked out from the location.
        </p>
      </div>
    </div>
  );
}

/** The scoresheet's Landscape Context Scores block. With `set`, the sheet's purple cells are fields; without it, text. */
export function LandscapeScoresheet({
  inputs,
  ctx,
  set,
}: {
  inputs: LandscapeInputs;
  ctx: LandscapeContext;
  set?: (next: LandscapeInputs) => void;
}) {
  const score = scoreBlock(inputs, ctx);
  const result = (id: (typeof BLOCK_FACTORS)[number]) =>
    score.results.find((r) => r.id === id)!;
  const ibra = score.ibra;
  const pct = (n?: number) => (n != null ? String(n) : NP);
  const yesNo = (label: string, key: "riparian" | "swamp") =>
    set ? (
      <YesNoControl
        label={label}
        value={inputs[key] ?? NP}
        onChange={(v) => set({ ...inputs, [key]: v as "Yes" | "No" })}
      />
    ) : (
      (inputs[key] ?? NP)
    );
  return (
    <div className="flex flex-col gap-4">
      <ScoreGroup
        title="% native veg. remaining"
        sub="Score received for both IBRA assoc. and subregion then summed"
        score={
          <Line
            label="Score"
            hint={bandsText(REMAINING_BANDS)}
            value={pts(result("remaining").points)}
            strong
          />
        }
      >
        <Line
          label="% native veg. remaining in IBRA assoc."
          hint={`${ibra.association}, from the location`}
          value={pct(ibra.associationPct)}
        />
        <Line
          label="% native veg. remaining in IBRA subregion"
          hint={`${ibra.subregion}, from the location`}
          value={pct(ibra.subregionPct)}
        />
      </ScoreGroup>

      <ScoreGroup
        title="Percent vegetation cover (5 km radius) (%)"
        score={
          <Line
            label="Score"
            hint={bandsText(COVER_BANDS)}
            value={pts(result("cover").points)}
            strong
          />
        }
      >
        <Line
          label="Percent vegetation cover"
          value={
            set ? (
              <InputNumber
                aria-label="Percent vegetation cover (5 km radius)"
                size="sm"
                className="w-28"
                minValue={0}
                maxValue={100}
                formatOptions={{
                  style: "unit",
                  unit: "percent",
                  unitDisplay: "narrow",
                }}
                value={toNum(inputs.cover)}
                onChange={(n) => set({ ...inputs, cover: fromNum(n) })}
              />
            ) : (
              (inputs.cover ?? NP)
            )
          }
        />
      </ScoreGroup>

      <ScoreGroup
        title="% native veg. protected IBRA assoc."
        score={
          <Line
            label="Score"
            hint={bandsText(PROTECTED_BANDS)}
            value={pts(result("protected").points)}
            strong
          />
        }
      >
        <Line
          label="% native veg. protected"
          hint={`${ibra.association}, from the location`}
          value={pct(ibra.protectedPct)}
        />
      </ScoreGroup>

      <ScoreGroup
        title="Block shape"
        sub="Cleared perimeter:area (km/km²)"
        score={
          <Line
            label="Score"
            hint={bandsText(BLOCK_BANDS)}
            value={pts(result("block").points)}
            strong
          />
        }
      >
        <Line
          label="Cleared perimeter (m)"
          value={
            set ? (
              <InputNumber
                aria-label="Cleared perimeter (m)"
                size="sm"
                className="w-28"
                minValue={0}
                value={toNum(inputs.perimeter)}
                onChange={(n) => set({ ...inputs, perimeter: fromNum(n) })}
              />
            ) : (
              (inputs.perimeter ?? NP)
            )
          }
        />
        <Line
          label="Cleared perimeter to area ratio"
          hint={
            ctx.areaKm2
              ? "The perimeter over the block's area, from its location"
              : "Needs the block's location"
          }
          value={Number.isFinite(score.ratio) ? score.ratio.toFixed(2) : NP}
        />
      </ScoreGroup>

      <ScoreGroup
        title="Wetland or riparian habitat present"
        sub="Swamp or wetland may be with or without a riparian zone"
        score={
          <Line label="Score" value={pts(result("wetland").points)} strong />
        }
      >
        <Line
          label={`Riparian zone present (${pts(RIPARIAN_POINTS)} pts)`}
          value={yesNo("Riparian zone present", "riparian")}
        />
        <Line
          label={`Swamp or wetland present (${pts(SWAMP_POINTS)} pts)`}
          value={yesNo("Swamp or wetland present", "swamp")}
        />
      </ScoreGroup>

      <div className="mt-2 rounded-lg border border-secondary bg-secondary px-4">
        <Line
          label={`${LANDSCAPE_SCORE_LABEL} (max ${LANDSCAPE_MAX})`}
          hint={`Blocks will score a minimum landscape context score of ${LANDSCAPE_MIN}`}
          value={pts(score.total)}
          strong
        />
      </div>
    </div>
  );
}

/**
 * The score as a link that opens the scoresheet: editable where `onSave` is given, read only where it is not. `title` is
 * the record the sheet belongs to, for the modal's description.
 */
export function LandscapeScoreLink({
  inputs,
  ctx,
  title,
  onSave,
}: {
  inputs: LandscapeInputs;
  ctx: LandscapeContext;
  title: string;
  onSave?: (next: LandscapeInputs) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LandscapeInputs | null>(null);
  const total = pts(scoreBlock(inputs, ctx).total);
  return (
    <>
      <Button
        color="link-color"
        size="sm"
        className="tabular-nums"
        aria-label={`${LANDSCAPE_SCORE_LABEL} ${total}: open the scoresheet${onSave ? " to edit it" : ""}`}
        onClick={() => (onSave ? setDraft(inputs) : setOpen(true))}
      >
        {total}
      </Button>
      {onSave ? (
        <FormModal
          size="lg"
          isOpen={draft != null}
          onOpenChange={(o) => !o && setDraft(null)}
          title="Landscape context scores"
          description={title}
          submitLabel="Save changes"
          submitIcon={Save01}
          onSubmit={() => {
            if (draft) onSave(draft);
            setDraft(null);
          }}
        >
          {draft && (
            <LandscapeScoresheet inputs={draft} ctx={ctx} set={setDraft} />
          )}
        </FormModal>
      ) : (
        <ModalOverlay isDismissable isOpen={open} onOpenChange={setOpen}>
          <Modal className="w-full sm:max-w-160">
            <Dialog aria-label="Landscape context scores">
              <ModalHeader
                title="Landscape context scores"
                description={title}
              />
              <div className="px-4 pt-5 pb-6 sm:px-6">
                <LandscapeScoresheet inputs={inputs} ctx={ctx} />
              </div>
            </Dialog>
          </Modal>
        </ModalOverlay>
      )}
    </>
  );
}

// ── Overstorey ──

const num = (v: string) =>
  EMPTY_VALUES.has(v) || v.trim() === "" ? NaN : Number(v);
const mean = (values: number[]) => {
  const ok = values.filter(Number.isFinite);
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : NaN;
};
const metres = (n: number) =>
  Number.isFinite(n) ? `${n.toFixed(1)} m` : "Not provided";

/** The overstorey averages, worked out from the readings. Crown separation ratio = average gap / average canopy diameter. */
export function overstoreyStats(o: OverstoreyData) {
  const height = mean(o.readings.map((r) => num(r.height)));
  const crownDepth = mean(o.readings.map((r) => num(r.crownDepth)));
  const canopyDiameter = mean(o.readings.map((r) => num(r.canopyDiameter)));
  const gaps = mean(o.readings.map((r) => num(r.gaps)));
  const csr =
    Number.isFinite(gaps) &&
    Number.isFinite(canopyDiameter) &&
    canopyDiameter > 0
      ? gaps / canopyDiameter
      : NaN;
  return [
    { label: "Overstorey height average", value: metres(height) },
    { label: "Crown depth average", value: metres(crownDepth) },
    { label: "Canopy diameter average", value: metres(canopyDiameter) },
    { label: "Gaps average", value: metres(gaps) },
    {
      label: "Crown separation ratio",
      value: Number.isFinite(csr) ? csr.toFixed(2) : "Not provided",
    },
    { label: "Overstorey measurement count", value: String(o.readings.length) },
  ];
}

export function foliageCoverText(v: string): string {
  const n = num(v);
  return Number.isFinite(n) ? `${n}%, ${foliageCoverClass(n)}` : "Not provided";
}

/** The worked-out averages, as a small grid of figures, under the readings they are worked out from. */
export function OverstoreyStats({
  data,
  live,
}: {
  data: OverstoreyData;
  live?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-secondary bg-secondary p-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @md:grid-cols-3">
        {overstoreyStats(data).map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-tertiary">{s.label}</dt>
            <dd
              className={cx(
                "text-sm font-medium tabular-nums",
                s.value === "Not provided" ? "text-quaternary" : "text-primary",
              )}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-tertiary">
        {live
          ? "Worked out from the readings above as you enter them."
          : "Worked out from the readings."}
      </p>
    </div>
  );
}

export const READING_COLUMNS: {
  key: keyof OverstoreyData["readings"][number];
  label: string;
  unit?: string;
}[] = [
  { key: "height", label: "Height", unit: "m" },
  { key: "crownDepth", label: "Crown depth", unit: "m" },
  { key: "canopyDiameter", label: "Canopy diameter", unit: "m" },
  { key: "gaps", label: "Gaps", unit: "m" },
  { key: "valueType", label: "Value type" },
];
export const VALUE_TYPES = ["Measured", "Estimated"];

/** The readings, as a table. */
export function ReadingsTable({ data }: { data: OverstoreyData }) {
  if (data.readings.length === 0)
    return <p className="text-sm text-quaternary">No readings yet</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-secondary">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="px-3 py-2 text-xs font-semibold text-quaternary">
              #
            </th>
            {READING_COLUMNS.map((c) => (
              <th
                key={c.key}
                className="px-3 py-2 text-xs font-semibold whitespace-nowrap text-quaternary"
              >
                {c.label}
                {c.unit && <span className="font-normal"> ({c.unit})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.readings.map((r, i) => (
            <tr key={i} className="border-t border-secondary">
              <td className="px-3 py-2 text-quaternary tabular-nums">
                {i + 1}
              </td>
              {READING_COLUMNS.map((c) => (
                <td key={c.key} className="px-3 py-2 text-primary tabular-nums">
                  {r[c.key] || (
                    <span className="text-xs text-quaternary">
                      Not provided
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

// LAB: the vegetation condition score as the scoresheet lays it out (designer, 4 Nov 2026: "on click of the score we show the
// exact same things on excel"), from DEW's Bushland Assessment workbook, sheet "Site - Scores", the Vegetation Condition Scores
// block. The same parts in the same order, with the same words: the site's facts; Benchmarked attributes (species, regeneration,
// weeds, and the native plant life forms beside them); Non-benchmarked attributes; the calculation; then the chart of each
// attribute against its maximum. Read only: these scores are worked out from the site's other records, not typed here.
//
// Built from the design system, not drawn as a spreadsheet (CONTRACTS 2.5: a screenshot fixes content and flow, never styling):
// the facts are label and value rows, the two lists are basic tables (4.2h), and the purple "entered" cells have no meaning
// here, so they have no colour. The chart's attributes and its Low, Medium and High thirds are read from the workbook's chart
// as far as the screenshot shows it (Native Plant Species Diversity, Weed Score, then cut off); the rest are the attributes
// scored above, each as its share of its maximum.

import type { ReactNode } from "react";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@/components/base/table/table";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputNumber } from "@/components/base/input/input-number";
import { COMMUNITY_STATUSES, SPECIES_STATUSES, scoreConservation, type ConservationInputs, type SpeciesCountsByStatus } from "./conservation-significance";
import { LIFE_FORMS, fixed1, fixed2, scoreVegetation, type Part, type SpeciesCounts, type VegetationInputs } from "./vegetation-condition";

const NP = "Not provided";

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {sub && <p className="text-xs text-balance text-tertiary">{sub}</p>}
    </div>
  );
}

/** A label and its value, the value at the right: the scoresheet's row with its number in the cell beside it. */
function Line({ label, hint, value, strong }: { label: string; hint?: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-secondary py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={strong ? "text-sm font-medium text-primary" : "text-sm text-secondary"}>{label}</span>
        {hint && <span className="text-xs text-balance text-tertiary">{hint}</span>}
      </div>
      <span className={strong ? "shrink-0 text-sm font-medium text-primary tabular-nums" : "shrink-0 text-sm text-primary tabular-nums"}>{value}</span>
    </div>
  );
}

const box = "overflow-hidden rounded-lg border border-secondary bg-primary";

/** Each attribute's score as a share of its maximum, against the workbook's Low, Medium and High. */
function AttributeChart({ bars }: { bars: { label: string; part: Part }[] }) {
  return (
    <figure className="m-0 flex flex-col gap-2" aria-label="Attribute scores against their maximum">
      <div aria-hidden className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3.5rem] gap-3 text-xs text-tertiary">
        <span />
        <span className="grid grid-cols-3">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </span>
        <span />
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {bars.map(({ label, part }) => {
          const value = part.score === "SNB" ? 0 : part.score;
          const share = Math.max(0, Math.min(1, value / part.max));
          return (
            <li key={label} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3.5rem] items-center gap-3">
              <span className="truncate text-xs text-secondary" title={label}>
                {label}
              </span>
              <span className="relative grid h-3 grid-cols-3 overflow-hidden rounded-sm bg-secondary" title={`${fixed1(part)} of ${part.max}`}>
                <span className="border-r border-primary" />
                <span className="border-r border-primary" />
                <span />
                {share > 0 && <span className="absolute inset-y-0 left-0 rounded-r-sm bg-brand-solid" style={{ width: `${share * 100}%` }} />}
              </span>
              <span className="text-right text-xs text-primary tabular-nums">
                {part.score === "SNB" ? "SNB" : `${fixed1(part)} / ${part.max}`}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function VegetationScoresheet({ site, inputs, counts, region }: { site: string; inputs: VegetationInputs; counts: SpeciesCounts; region: string }) {
  const s = scoreVegetation(inputs, counts, region);
  const part = (score: number | undefined, max: number): Part => ({ score: score ?? 0, max, from: score ?? 0 });
  const trees = !s.treeless;
  const bars = [
    { label: "Native plant species diversity", part: s.diversity },
    { label: "Weed score", part: s.weeds },
    { label: "Regeneration", part: s.regeneration },
    { label: "Native plant life forms", part: s.lifeForms },
    { label: "Native:exotic understorey biomass", part: part(inputs.biomass, 5) },
    ...(trees
      ? [
          { label: "Fallen timber and debris", part: part(inputs.fallenTimber, 5) },
          { label: "Hollow-bearing trees", part: part(inputs.hollowTrees, 5) },
          { label: "Mature trees", part: part(inputs.matureTrees, 8) },
          { label: "Tree canopy cover", part: part(inputs.canopyCover, 5) },
        ]
      : []),
  ];
  return (
    <div className="@container flex flex-col gap-6">
      <dl className="m-0 flex flex-col">
        {[
          ["Site", site],
          ["BCM community", inputs.community ?? NP],
          ["Vegetation association description", inputs.associationDescription ?? NP],
          ["Size of site (ha)", inputs.sizeHa != null ? String(inputs.sizeHa) : NP],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-1 gap-0.5 border-b border-secondary py-2.5 text-sm @md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] @md:gap-x-4">
            <dt className="text-tertiary">{label}</dt>
            <dd className={value === NP ? "m-0 text-quaternary" : "m-0 text-balance text-primary"}>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3">
        <Heading title="Benchmarked attributes" sub="Scores determined by comparing to a benchmark community" />
        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Line label="Number of native species" hint="Minus herbaceous annuals for spring surveys" value={counts.native} />
              <Line label="Native plant species diversity score (max 30)" hint="From benchmark score, weighted by a factor of 2" value={fixed1(s.diversity)} strong />
              <Line label="Number of regenerating native species" value={counts.regenerating} />
              <Line label="Regeneration score (max 12)" hint="From benchmark community, weighted by a factor of 1.5" value={fixed1(s.regeneration)} strong />
            </div>
            <div className={box}>
              <Table aria-label="Weed species">
                <TableHeader>
                  <Column isRowHeader>Weed species (top 5 cover x invasiveness)</Column>
                  <Column className="text-right">Cover (max 6)</Column>
                  <Column className="text-right">Weed threat rating (max 5)</Column>
                  <Column className="text-right">C x I</Column>
                </TableHeader>
                <TableBody>
                  {s.weedRows.map((w, i) => (
                    <Row key={i} id={`weed-${i}`}>
                      <Cell className={w.species ? "text-primary italic" : "text-quaternary"}>{w.species ?? NP}</Cell>
                      <Cell className="text-right tabular-nums">{w.cover ?? ""}</Cell>
                      <Cell className="text-right tabular-nums">{w.species ? (w.threat ?? "Not rated") : ""}</Cell>
                      <Cell className="text-right text-primary tabular-nums">{w.cxi}</Cell>
                    </Row>
                  ))}
                  <Row id="weed-total" className="hover:bg-transparent">
                    <Cell colSpan={3} className="text-right font-medium text-primary">
                      Cover x threat
                    </Cell>
                    <Cell className="text-right font-medium text-primary tabular-nums">{s.weeds.from}</Cell>
                  </Row>
                </TableBody>
              </Table>
            </div>
            <Line label="Weed score (max 15)" hint="From benchmark community" value={fixed1(s.weeds)} strong />
          </div>

          <div className="flex flex-col gap-4">
            <div className={box}>
              <Table aria-label="Native plant life forms">
                <TableHeader>
                  <Column isRowHeader>Native plant life forms</Column>
                  <Column className="text-right">Cover rating</Column>
                </TableHeader>
                <TableBody>
                  {LIFE_FORMS.map((f) => (
                    <Row key={f} id={f}>
                      <Cell className="py-2">{f}</Cell>
                      <Cell className="py-2 text-right text-primary tabular-nums">{inputs.lifeForms[f] ?? ""}</Cell>
                    </Row>
                  ))}
                  <Row id="life-total" className="hover:bg-transparent">
                    <Cell className="py-2 font-medium text-primary">Total</Cell>
                    <Cell className="py-2 text-right font-medium text-primary tabular-nums">{s.lifeForms.from}</Cell>
                  </Row>
                </TableBody>
              </Table>
            </div>
            <Line label="Native plant life forms (max 20)" hint="From benchmark score, weighted by a factor of 2" value={fixed1(s.lifeForms)} strong />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Heading title="Non-benchmarked attributes" sub="Scores determined from direct field observations" />
        <div className="flex flex-col">
          <Line label="Native:exotic understorey biomass score (max 5)" value={inputs.biomass ?? NP} />
          <Line
            label="Is the community naturally treeless?"
            hint={s.treeless ? "Tree attributes not scored for treeless communities or communities with only emergent trees" : undefined}
            value={s.treeless ? "Yes" : "No"}
          />
          {trees && (
            <>
              <Line label="Fallen timber and debris score (max 5)" value={inputs.fallenTimber ?? NP} />
              <Line label="Hollow-bearing trees score (max 5)" value={inputs.hollowTrees ?? NP} />
              <Line label="Mature tree score (max 8)" value={inputs.matureTrees ?? NP} />
              <Line label="Tree canopy cover score (max 5)" value={inputs.canopyCover ?? NP} />
            </>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Heading title="Vegetation condition score calculation" />
        <div className="flex flex-col">
          <Line
            label="Positive vegetation attributes score"
            hint={[
              "Native species diversity + Regeneration + Native plant life forms + Fallen timber/debris + Hollow-bearing trees.",
              "If the community score is not benchmarked (SNB) for regeneration this score is multiplied by 1.24.",
              "If the community is naturally treeless this score is multiplied by 1.29.",
            ].join(" ")}
            value={fixed2(s.positive)}
          />
          <Line label="Negative vegetation attributes score" hint="(15 - Weeds) + ((10 - (Biomass score x 2))² / 2)" value={fixed2(s.negative)} />
          <Line
            label="Vegetation condition score"
            hint="Positive veg attributes x ((80 - Negative vegetation attributes) / 80)"
            value={s.community ? fixed2(s.score) : NP}
            strong
          />
        </div>
      </section>

      <AttributeChart bars={bars} />
    </div>
  );
}

// LAB: the conservation significance score as the scoresheet lays it out (designer, 4 Nov 2026: "lets work on the conservation
// score but this will be editable fields"), the workbook's "Conservation Significance Score" block, in its order and words: the
// threatened community question, then threatened flora, then the potential habitat for threatened fauna, then the score. The five
// community statuses are ticks, as in the workbook; the ten species counts are numbers, which the workbook works out from the
// species lists and the designer asked to be entered here. The workbook's note that every site scores at least 1 is left out, as
// the designer removed the same note from the breakdown (2 Nov 2026).

export interface ConservationSheet {
  inputs: ConservationInputs;
  flora: SpeciesCountsByStatus;
  fauna: SpeciesCountsByStatus;
}

const pts = (n: number) => `${n} ${n === 1 ? "pt" : "pts"}`;
const FLORA_BANDS = "0 = 0 pts; under 2 = 0.04 pts; 2 to under 5 = 0.08 pts; 5 to under 10 = 0.12 pts; 10 to under 20 = 0.16 pts; 20 or more = 0.2 pts";
const FAUNA_BANDS = "0 = 0 pts; under 2 = 0.02 pts; 2 to under 5 = 0.04 pts; 5 to under 10 = 0.06 pts; 10 to under 20 = 0.08 pts; 20 or more = 0.1 pts";
const NATIONAL_ONLY = "If a species has both a State (NP&W Act) and National (EPBC Act) rating, it's only recorded for its National rating.";

const COMMUNITY_LABELS: Record<string, string> = {
  stateRare: "State (Provisional List of Threatened Ecosystems of SA) rare community",
  stateVulnerable: "State (Provisional List of Threatened Ecosystems of SA) vulnerable community",
  stateEndangered: "State (Provisional List of Threatened Ecosystems of SA) endangered community",
  nationalVulnerable: "Nationally (EPBC Act) vulnerable community",
  nationalEndangered: "Nationally (EPBC Act) endangered or critically endangered community",
};

function CountRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-secondary py-2">
      <span className="min-w-0 text-sm text-balance text-secondary">{label}</span>
      <InputNumber aria-label={label} size="sm" className="w-24 shrink-0" minValue={0} step={1} value={value} onChange={(n) => onChange(Number.isFinite(n) ? n : 0)} />
    </div>
  );
}

export function ConservationScoresheet({ sheet, set }: { sheet: ConservationSheet; set: (next: ConservationSheet) => void }) {
  const s = scoreConservation(sheet.inputs, sheet.flora, sheet.fauna);
  const species = (kind: "flora" | "fauna") => {
    const counts = sheet[kind];
    const part = s[kind];
    const verb = kind === "flora" ? "recorded" : "observed or locally recorded";
    return (
      <>
        <div className="flex flex-col">
          {SPECIES_STATUSES.map((x) => (
            <CountRow
              key={x.id}
              label={`${x.label} species ${verb} (${pts(x.weight)} each)`}
              value={counts[x.id]}
              onChange={(n) => set({ ...sheet, [kind]: { ...counts, [x.id]: n } })}
            />
          ))}
          <Line label="Weighted total" hint={kind === "flora" ? FLORA_BANDS : FAUNA_BANDS} value={part.weighted} />
          <Line label={kind === "flora" ? "Threatened flora score" : "Threatened fauna score"} value={fixed2(part.points)} strong />
        </div>
      </>
    );
  };
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Heading title="Is the vegetation association considered a threatened ecological community or ecosystem?" sub="Only the highest status ticked counts" />
        <div className="flex flex-col">
          {COMMUNITY_STATUSES.map((c) => (
            <div key={c.id} className="border-b border-secondary py-2.5">
              <Checkbox
                label={COMMUNITY_LABELS[c.id]}
                hint={pts(c.points)}
                isSelected={!!sheet.inputs.community[c.id]}
                onChange={(on) => set({ ...sheet, inputs: { community: { ...sheet.inputs.community, [c.id]: on } } })}
              />
            </div>
          ))}
          <Line label="Threatened community score" value={fixed2(1 + s.community.points)} strong />
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <Heading title="Number of threatened flora species recorded for the site (within the site)" sub={NATIONAL_ONLY} />
        {species("flora")}
      </section>
      <section className="flex flex-col gap-3">
        <Heading title="Potential habitat for threatened fauna species (number observed or previously recorded)" sub={NATIONAL_ONLY} />
        {species("fauna")}
      </section>
      <div className="rounded-lg border border-secondary bg-secondary px-4">
        <Line label="Conservation significance score" hint="Threatened community + threatened flora + threatened fauna" value={fixed2(s.score)} strong />
      </div>
    </div>
  );
}

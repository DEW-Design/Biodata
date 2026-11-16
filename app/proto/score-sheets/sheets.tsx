"use client";

// The options of the score sheets lab (page.tsx). Each draws the same sheet, with the same words, numbers and scoring
// (landscape.ts, conservation-significance.ts), in a different arrangement. Lab only (CONTRACTS 5.4).

import type { ReactNode } from "react";
import { Accordion } from "@/components/base/accordion/accordion";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputNumber } from "@/components/base/input/input-number";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@/components/base/table/table";
import { YesNoControl } from "@/app/pages/project-detail/field-controls";
import {
  BLOCK_BANDS,
  COVER_BANDS,
  FACTOR_TITLES,
  LANDSCAPE_MAX,
  LANDSCAPE_MIN,
  PROTECTED_BANDS,
  REMAINING_BANDS,
  RIPARIAN_POINTS,
  SWAMP_POINTS,
  pts,
  type FactorId,
  type LandscapeInputs,
} from "@/app/pages/project-detail/landscape";
import { scoreBlock, type LandscapeContext } from "@/app/pages/project-detail/landscape-view";
import { Heading, Line, type ConservationSheet } from "@/app/pages/project-detail/site-scores/scoresheet";
import { COMMUNITY_STATUSES, SPECIES_STATUSES, THREATENED_BANDS, scoreConservation } from "@/app/pages/project-detail/site-scores/conservation-significance";
import { cx } from "@/utils/cx";

export type SheetOption = "b" | "c" | "d";

const NP = "Not provided";
const pointsText = (n: number) => (n === 0 ? "0 pts" : `${pts(n)} pts`);
const toNum = (v?: string) => (v == null || v.trim() === "" ? NaN : Number(v));
const fromNum = (n: number) => (Number.isFinite(n) ? String(n) : undefined);

interface LadderBand {
  label: string;
  points: number;
  test: (v: number) => boolean;
}

const COLS: Record<number, string> = { 4: "grid-cols-2 sm:grid-cols-4", 5: "grid-cols-3 sm:grid-cols-5", 6: "grid-cols-3 sm:grid-cols-6" };

/** A factor's bands as steps, the one the value falls in marked: the rule the sheet writes as a sentence, drawn. */
function Ladder({ caption, bands, value }: { caption?: string; bands: LadderBand[]; value: number }) {
  const active = Number.isFinite(value) ? bands.findIndex((b) => b.test(value)) : -1;
  return (
    <div className="flex flex-col gap-1.5">
      {caption && <p className="text-xs text-tertiary">{caption}</p>}
      <ol className={cx("m-0 grid list-none gap-1 p-0", COLS[bands.length])}>
        {bands.map((b, i) => (
          <li
            key={b.label}
            aria-current={i === active ? "true" : undefined}
            className={cx("flex flex-col gap-0.5 rounded-md border px-2 py-1.5", i === active ? "border-brand-300 bg-brand-50" : "border-secondary")}
          >
            <span className={cx("text-xs text-balance tabular-nums", i === active ? "font-medium text-brand-secondary" : "text-tertiary")}>{b.label}</span>
            <span className={cx("text-xs tabular-nums", i === active ? "text-brand-secondary" : "text-quaternary")}>{pointsText(b.points)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The total, first: the figure, what it is out of, and how far along it is. Value treatment from MetricTile. */
function TotalCard({ label, total, min, max, note }: { label: string; total: number; min: number; max: number; note: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-secondary bg-secondary p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="text-sm text-tertiary">{label}</span>
        <span className="text-lg font-medium whitespace-nowrap text-primary tabular-nums">
          {pts(total)} <span className="text-sm font-normal text-tertiary">of {pts(max)}</span>
        </span>
      </div>
      <ProgressBarBase value={total} min={min} max={max} />
      <p className="text-xs text-balance text-tertiary">{note}</p>
    </div>
  );
}

/** "0.03 of 0.06 pts", the factor's share, at the right of its heading. */
function Share({ points, max }: { points: number; max: number }) {
  return (
    <span className="shrink-0 text-sm font-medium text-primary tabular-nums">
      {pts(points)} <span className="font-normal text-tertiary">of {pts(max)} pts</span>
    </span>
  );
}

function FactorSection({ title, sub, share, children }: { title: string; sub?: string; share: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <Heading title={title} sub={sub} />
        {share}
      </div>
      {children}
    </section>
  );
}

// ── Landscape context scores ──

interface FactorView {
  id: FactorId;
  title: string;
  sub?: string;
  /** What is typed for this factor; empty where everything is worked out. */
  fields: ReactNode;
  /** What is worked out from the location, as lines. */
  derived: ReactNode;
  ladders: ReactNode;
  points: number;
  max: number;
  /** A factor with something to type opens first in option C. */
  typed: boolean;
}

function landscapeFactors(inputs: LandscapeInputs, ctx: LandscapeContext, set?: (next: LandscapeInputs) => void): { views: FactorView[]; total: number } {
  const score = scoreBlock(inputs, ctx);
  const ibra = score.ibra;
  const r = (id: FactorId) => score.results.find((x) => x.id === id)!;
  const pct = (n?: number) => (n != null ? `${n}%` : NP);
  const field = (label: string, control: ReactNode, text: string) => <Line label={label} value={set ? control : text} />;
  const yesNo = (label: string, key: "riparian" | "swamp", points: number) =>
    field(
      `${label} (${pts(points)} pts)`,
      <YesNoControl label={label} value={inputs[key] ?? NP} onChange={(v) => set?.({ ...inputs, [key]: v as "Yes" | "No" })} />,
      inputs[key] ?? NP,
    );
  const views: FactorView[] = [
    {
      id: "remaining",
      title: FACTOR_TITLES.remaining.title,
      sub: "Score received for both IBRA assoc. and subregion then summed",
      fields: null,
      derived: (
        <>
          <Line label="% native veg. remaining in IBRA assoc." hint={`${ibra.association}, from the location`} value={pct(ibra.associationPct)} />
          <Line label="% native veg. remaining in IBRA subregion" hint={`${ibra.subregion}, from the location`} value={pct(ibra.subregionPct)} />
        </>
      ),
      ladders: (
        <>
          <Ladder caption={`IBRA association, ${ibra.association}`} bands={REMAINING_BANDS} value={ibra.associationPct ?? NaN} />
          <Ladder caption={`IBRA subregion, ${ibra.subregion}`} bands={REMAINING_BANDS} value={ibra.subregionPct ?? NaN} />
        </>
      ),
      points: r("remaining").points,
      max: r("remaining").max,
      typed: false,
    },
    {
      id: "cover",
      title: "Percent vegetation cover",
      sub: "Within 5 km radius",
      fields: field(
        "Percent vegetation cover",
        <InputNumber
          aria-label="Percent vegetation cover (5 km radius)"
          size="sm"
          className="w-28"
          minValue={0}
          maxValue={100}
          formatOptions={{ style: "unit", unit: "percent", unitDisplay: "narrow" }}
          value={toNum(inputs.cover)}
          onChange={(n) => set?.({ ...inputs, cover: fromNum(n) })}
        />,
        inputs.cover != null ? `${inputs.cover}%` : NP,
      ),
      derived: null,
      ladders: <Ladder bands={COVER_BANDS} value={toNum(inputs.cover)} />,
      points: r("cover").points,
      max: r("cover").max,
      typed: true,
    },
    {
      id: "protected",
      title: "% native veg. protected IBRA assoc.",
      fields: null,
      derived: <Line label="% native veg. protected" hint={`${ibra.association}, from the location`} value={pct(ibra.protectedPct)} />,
      ladders: <Ladder bands={PROTECTED_BANDS} value={ibra.protectedPct ?? NaN} />,
      points: r("protected").points,
      max: r("protected").max,
      typed: false,
    },
    {
      id: "block",
      title: "Block shape",
      sub: "Cleared perimeter:area (km/km²)",
      fields: field(
        "Cleared perimeter (m)",
        <InputNumber aria-label="Cleared perimeter (m)" size="sm" className="w-28" minValue={0} value={toNum(inputs.perimeter)} onChange={(n) => set?.({ ...inputs, perimeter: fromNum(n) })} />,
        inputs.perimeter ?? NP,
      ),
      derived: (
        <Line
          label="Cleared perimeter to area ratio"
          hint={ctx.areaKm2 ? "The perimeter over the block's area, from its location" : "Needs the block's location"}
          value={Number.isFinite(score.ratio) ? score.ratio.toFixed(2) : NP}
        />
      ),
      ladders: <Ladder bands={BLOCK_BANDS} value={score.ratio} />,
      points: r("block").points,
      max: r("block").max,
      typed: true,
    },
    {
      id: "wetland",
      title: "Wetland or riparian habitat present",
      sub: "Swamp or wetland may be with or without a riparian zone",
      fields: (
        <>
          {yesNo("Riparian zone present", "riparian", RIPARIAN_POINTS)}
          {yesNo("Swamp or wetland present", "swamp", SWAMP_POINTS)}
        </>
      ),
      derived: null,
      ladders: null,
      points: r("wetland").points,
      max: r("wetland").max,
      typed: true,
    },
  ];
  return { views, total: score.total };
}

const LANDSCAPE_NOTE = `Blocks will score a minimum landscape context score of ${LANDSCAPE_MIN}; each factor's points are added to it.`;

export function LandscapeOption({ option, inputs, ctx, set }: { option: SheetOption; inputs: LandscapeInputs; ctx: LandscapeContext; set?: (next: LandscapeInputs) => void }) {
  const { views, total } = landscapeFactors(inputs, ctx, set);
  const totalCard = <TotalCard label="Landscape context score" total={total} min={LANDSCAPE_MIN} max={LANDSCAPE_MAX} note={LANDSCAPE_NOTE} />;
  const body = (v: FactorView) => (
    <div className="flex flex-col gap-3">
      {(v.fields || v.derived) && (
        <div className="flex flex-col">
          {v.fields}
          {v.derived}
        </div>
      )}
      {v.ladders}
    </div>
  );

  if (option === "b")
    return (
      <div className="flex flex-col gap-6">
        {totalCard}
        {views.map((v) => (
          <FactorSection key={v.id} title={v.title} sub={v.sub} share={<Share points={v.points} max={v.max} />}>
            {body(v)}
          </FactorSection>
        ))}
      </div>
    );

  if (option === "c")
    return (
      <div className="flex flex-col gap-4">
        {totalCard}
        <Accordion
          variant="compact"
          defaultOpenKeys={set ? views.filter((v) => v.typed).map((v) => v.id) : []}
          items={views.map((v) => ({
            id: v.id,
            title: <BreakdownTitle title={v.title} points={v.points} max={v.max} />,
            content: <div className="pb-4">{body(v)}</div>,
          }))}
        />
      </div>
    );

  // D: what is typed on the left, the score building up on the right.
  const typed = views.filter((v) => v.typed);
  const derived = views.filter((v) => v.derived);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <Heading title={set ? "What you enter" : "Entered"} />
          <div className="flex flex-col">
            {typed.map((v) => (
              <div key={v.id} className="flex flex-col">
                {v.fields}
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <Heading title="Worked out from the location" />
          <div className="flex flex-col">
            {derived.map((v) => (
              <div key={v.id} className="flex flex-col">
                {v.derived}
              </div>
            ))}
          </div>
        </section>
      </div>
      <ScoreAside
        total={totalCard}
        rows={views.map((v) => ({ id: v.id, label: FACTOR_TITLES[v.id].short, points: v.points, max: v.max }))}
      />
    </div>
  );
}

/** An accordion row's title: the factor, its share and a bar of it. */
function BreakdownTitle({ title, points, max }: { title: string; points: number; max: number }) {
  return (
    <span className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
      <span className="truncate text-sm font-semibold text-primary">{title}</span>
      <ProgressBarBase value={points} max={max} className="hidden sm:block" />
      <Share points={points} max={max} />
    </span>
  );
}

/** Option D's right column: the total, then each part as a bar of its maximum. */
function ScoreAside({ total, rows }: { total: ReactNode; rows: { id: string; label: string; points: number; max: number }[] }) {
  return (
    <aside className="flex flex-col gap-4 md:sticky md:top-0 md:self-start">
      {total}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-balance text-tertiary">{r.label}</span>
              <span className="text-xs text-primary tabular-nums">
                {pts(r.points)} / {pts(r.max)}
              </span>
            </span>
            <ProgressBarBase value={r.points} max={r.max} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ── Conservation significance score ──

const COMMUNITY_LABELS: Record<string, string> = {
  stateRare: "State (Provisional List of Threatened Ecosystems of SA) rare community",
  stateVulnerable: "State (Provisional List of Threatened Ecosystems of SA) vulnerable community",
  stateEndangered: "State (Provisional List of Threatened Ecosystems of SA) endangered community",
  nationalVulnerable: "Nationally (EPBC Act) vulnerable community",
  nationalEndangered: "Nationally (EPBC Act) endangered or critically endangered community",
};
const NATIONAL_ONLY = "If a species has both a State (NP&W Act) and National (EPBC Act) rating, it's only recorded for its National rating.";
const CONSERVATION_MAX = 1 + 0.4 + 0.2 + 0.1;
const floraBands: LadderBand[] = THREATENED_BANDS.map((b) => ({ label: b.label, points: b.flora, test: b.test }));
const faunaBands: LadderBand[] = THREATENED_BANDS.map((b) => ({ label: b.label, points: b.fauna, test: b.test }));

export function ConservationOption({ option, sheet, set }: { option: SheetOption; sheet: ConservationSheet; set?: (next: ConservationSheet) => void }) {
  const s = scoreConservation(sheet.inputs, sheet.flora, sheet.fauna);
  const totalCard = (
    <TotalCard
      label="Conservation significance score"
      total={s.score}
      min={1}
      max={CONSERVATION_MAX}
      note="Every site scores at least 1; threatened community, flora and fauna points are added to it."
    />
  );

  const community = (
    <div className="flex flex-col">
      {COMMUNITY_STATUSES.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-4 border-b border-secondary py-2.5">
          <Checkbox
            label={COMMUNITY_LABELS[c.id]}
            hint={`${c.points} pts`}
            isSelected={!!sheet.inputs.community[c.id]}
            isReadOnly={!set}
            onChange={(on) => set?.({ ...sheet, inputs: { community: { ...sheet.inputs.community, [c.id]: on } } })}
          />
        </div>
      ))}
    </div>
  );
  const communityCounts = s.community.status ? `Counts: ${s.community.status.label}` : "None ticked";

  // The ten counts as one matrix: a status per row, flora and fauna side by side, their weighted totals at the foot.
  const count = (kind: "flora" | "fauna", id: (typeof SPECIES_STATUSES)[number]["id"], label: string) =>
    set ? (
      <InputNumber
        aria-label={`${label}, ${kind}`}
        size="sm"
        className="ml-auto w-20"
        minValue={0}
        step={1}
        value={sheet[kind][id]}
        onChange={(n) => set({ ...sheet, [kind]: { ...sheet[kind], [id]: Number.isFinite(n) ? n : 0 } })}
      />
    ) : (
      sheet[kind][id]
    );
  const KIND_HEAD = { flora: "Flora recorded", fauna: "Fauna observed or locally recorded" };
  const matrixOf = (kinds: ("flora" | "fauna")[]) => (
    <div className="overflow-hidden rounded-lg border border-secondary bg-primary">
      <Table aria-label="Threatened species recorded at the site">
        <TableHeader>
          <Column isRowHeader className="w-2/5">
            Status
          </Column>
          <Column className="text-right">Pts each</Column>
          {kinds.map((k) => (
            <Column key={k} className="text-right">
              {KIND_HEAD[k]}
            </Column>
          ))}
        </TableHeader>
        <TableBody>
          {SPECIES_STATUSES.map((x) => (
            <Row key={x.id} id={x.id}>
              <Cell className="text-balance">{x.label}</Cell>
              <Cell className="text-right tabular-nums">{x.weight}</Cell>
              {kinds.map((k) => (
                <Cell key={k} className="text-right text-primary tabular-nums">
                  {count(k, x.id, x.label)}
                </Cell>
              ))}
            </Row>
          ))}
          <Row id="weighted" className="hover:bg-transparent">
            <Cell colSpan={2} className="font-medium text-primary">
              Weighted total
            </Cell>
            {kinds.map((k) => (
              <Cell key={k} className="text-right font-medium text-primary tabular-nums">
                {s[k].weighted}
              </Cell>
            ))}
          </Row>
        </TableBody>
      </Table>
    </div>
  );
  const matrix = matrixOf(["flora", "fauna"]);
  const ladders = (
    <div className="flex flex-col gap-3">
      <Ladder caption="Threatened flora, by weighted total" bands={floraBands} value={s.flora.weighted} />
      <Ladder caption="Threatened fauna, by weighted total" bands={faunaBands} value={s.fauna.weighted} />
    </div>
  );

  if (option === "b")
    return (
      <div className="flex flex-col gap-6">
        {totalCard}
        <FactorSection
          title="Is the vegetation association considered a threatened ecological community or ecosystem?"
          sub={`Only the highest status ticked counts. ${communityCounts}.`}
          share={<Share points={s.community.points} max={s.community.max} />}
        >
          {community}
        </FactorSection>
        <FactorSection
          title="Threatened flora and fauna species"
          sub={NATIONAL_ONLY}
          share={<Share points={s.flora.points + s.fauna.points} max={s.flora.max + s.fauna.max} />}
        >
          {matrix}
          {ladders}
        </FactorSection>
      </div>
    );

  if (option === "c")
    return (
      <div className="flex flex-col gap-4">
        {totalCard}
        <Accordion
          variant="compact"
          defaultOpenKeys={set ? ["community"] : []}
          items={[
            {
              id: "community",
              title: <BreakdownTitle title="Threatened community" points={s.community.points} max={s.community.max} />,
              content: (
                <div className="flex flex-col gap-2 pb-4">
                  <p className="text-xs text-balance text-tertiary">Only the highest status ticked counts. {communityCounts}.</p>
                  {community}
                </div>
              ),
            },
            {
              id: "flora",
              title: <BreakdownTitle title="Threatened flora" points={s.flora.points} max={s.flora.max} />,
              content: (
                <div className="flex flex-col gap-3 pb-4">
                  {matrixOf(["flora"])}
                  <Ladder caption="By weighted total" bands={floraBands} value={s.flora.weighted} />
                </div>
              ),
            },
            {
              id: "fauna",
              title: <BreakdownTitle title="Threatened fauna habitat" points={s.fauna.points} max={s.fauna.max} />,
              content: (
                <div className="flex flex-col gap-3 pb-4">
                  {matrixOf(["fauna"])}
                  <Ladder caption="By weighted total" bands={faunaBands} value={s.fauna.weighted} />
                </div>
              ),
            },
          ]}
        />
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <Heading title="Is the vegetation association considered a threatened ecological community or ecosystem?" sub="Only the highest status ticked counts" />
          {community}
        </section>
        <section className="flex flex-col gap-3">
          <Heading title="Threatened flora and fauna species" sub={NATIONAL_ONLY} />
          {matrix}
        </section>
      </div>
      <ScoreAside
        total={totalCard}
        rows={[
          { id: "community", label: "Threatened community", points: s.community.points, max: s.community.max },
          { id: "flora", label: `Threatened flora (${s.flora.band})`, points: s.flora.points, max: s.flora.max },
          { id: "fauna", label: `Threatened fauna (${s.fauna.band})`, points: s.fauna.points, max: s.fauna.max },
        ]}
      />
    </div>
  );
}

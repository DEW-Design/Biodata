"use client";

// The controls behind each survey record field type (../field-schema.ts). Built once and used for
// every event, occurrence and observation, so a field type looks and behaves the same everywhere.
// All are DEW components: InputNumber, Select, Input, RadioGroup, MultiSelect, and the project's
// own location picker (GeoExtentPicker from project registration).

import { useState } from "react";
import {
  AlertTriangle,
  Image01,
  Plus,
  Trash01,
  Upload01,
  XClose,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import {
  RadioButton,
  RadioGroup,
} from "@/components/base/radio-buttons/radio-buttons";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import { GeoExtentPicker } from "@/app/pages/project-registration/geo-extent-picker";
import type { GeoExtentValue } from "@/app/pages/project-registration/types";
import { OBSERVER_OPTIONS } from "@/app/pages/project-registration/data";
import {
  DIMENSION_UNITS,
  EMPTY_VALUES,
  NSX_SPECIES,
  UNIT_FIELDS,
  formatDimensions,
  formatDuration,
  isBoundaryInside,
  joinList,
  nsxSpecies,
  parseDimensions,
  parseDuration,
  parseJsonList,
  parseNumberUnit,
  splitList,
  toJsonList,
  vocabTerm,
  vocabTerms,
} from "./field-schema";
import { CODE_TABLES, CODE_VOCABS, NUMBER_UNITS } from "./field-options";

const NP = "Not provided";
const numberOf = (value: string): number =>
  EMPTY_VALUES.has(value) || !Number.isFinite(Number(value))
    ? NaN
    : Number(value);
const fromNumber = (n: number): string => (Number.isNaN(n) ? NP : String(n));

/** "Number Text Field": the DEW number input, sized to a number. */
export function NumberControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <InputNumber
      aria-label={label}
      className="w-40"
      value={numberOf(value)}
      onChange={(n) => onChange(fromNumber(n))}
    />
  );
}

/** A number with a fixed unit ("Degrees- Number Text Field"). The unit is written inside the field by the number formatter, so it reads as one value ("45°") and can't be typed wrong. */
export function UnitNumberControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const spec = UNIT_FIELDS[label];
  return (
    <InputNumber
      aria-label={`${label} (${spec?.label ?? ""})`}
      className="w-40"
      value={numberOf(value)}
      minValue={spec?.min}
      maxValue={spec?.max}
      formatOptions={
        spec
          ? {
              style: "unit",
              unit: spec.unit,
              unitDisplay: spec.unit === "degree" ? "narrow" : "short",
            }
          : undefined
      }
      hint={
        spec
          ? `In ${spec.label}${spec.max != null ? `, ${spec.min ?? 0} to ${spec.max}` : ""}`
          : undefined
      }
      onChange={(n) => onChange(fromNumber(n))}
    />
  );
}

/** "Two Values with unit": length by width, then the unit they're both in. */
export function DimensionsControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const d = parseDimensions(value);
  const set = (p: Partial<typeof d>) => {
    const next = { ...d, ...p };
    onChange(formatDimensions(next.a, next.b, next.unit));
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputNumber
        aria-label={`${label}, length`}
        placeholder="Length"
        className="w-28"
        minValue={0}
        value={d.a ?? NaN}
        onChange={(a) => set({ a: Number.isNaN(a) ? null : a })}
      />
      <span className="text-sm text-tertiary" aria-hidden>
        ×
      </span>
      <InputNumber
        aria-label={`${label}, width`}
        placeholder="Width"
        className="w-28"
        minValue={0}
        value={d.b ?? NaN}
        onChange={(b) => set({ b: Number.isNaN(b) ? null : b })}
      />
      <Select
        aria-label={`${label}, unit`}
        className="w-24"
        items={DIMENSION_UNITS.map((u) => ({ id: u, label: u }))}
        selectedKey={d.unit}
        onSelectionChange={(k) => k && set({ unit: String(k) })}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
    </div>
  );
}

/**
 * A long list is a searchable dropdown: the same control as Observers, with one choice. Used for
 * lists that are long or will grow (species, controlled vocabulary codes, and any plain list of more
 * than {@link LONG_LIST} options). Short fixed lists stay a plain dropdown.
 */
export const LONG_LIST = 7;
function SearchSelect({
  label,
  placeholder = "Please select",
  items,
  value,
  onChange,
  className,
  popoverClassName,
  isInvalid,
  hint,
  describe,
}: {
  label: string;
  placeholder?: string;
  items: { id: string; label: string; supportingText?: string }[];
  value: string | null;
  onChange: (id: string) => void;
  className?: string;
  popoverClassName?: string;
  isInvalid?: boolean;
  hint?: string;
  /** Text shown with each option in the list (and searched), but not in the field. */
  describe?: (id: string) => string | undefined;
}) {
  return (
    <MultiSelect
      aria-label={label}
      selectionMode="single"
      placeholder={placeholder}
      className={className}
      popoverClassName={popoverClassName}
      isInvalid={isInvalid}
      hint={hint}
      items={items}
      selectedKeys={new Set(value ? [value] : [])}
      onSelectionChange={(keys) => {
        const next =
          keys === "all" ? undefined : Array.from(keys as Set<string>)[0];
        if (next) onChange(String(next));
      }}
    >
      {(item) => (
        <MultiSelect.Item
          {...item}
          supportingText={
            describe ? describe(String(item.id)) : item.supportingText
          }
        />
      )}
    </MultiSelect>
  );
}

/** "Ctrl Vocab": the code from its list, with the chosen code's description beside it (read only). */
export function VocabControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const terms = vocabTerms(label);
  const term = vocabTerm(label, value);
  return (
    <div className="flex flex-wrap items-start gap-2 @md:flex-nowrap">
      <SearchSelect
        label={`${label} code`}
        placeholder="Code"
        className="w-32 shrink-0"
        popoverClassName="min-w-72"
        items={terms.map((t) => ({ id: t.code, label: t.code }))}
        value={term ? term.code : null}
        onChange={onChange}
        describe={(code) => vocabTerm(label, code)?.description}
      />
      <Input
        aria-label={`${label} description`}
        isDisabled
        value={term?.description ?? ""}
        placeholder="Description of the code"
        className="min-w-0 flex-1"
      />
    </div>
  );
}

/** Duration: days, hours and minutes, three small numbers (the Figma "Days / Hours / Mins" fields). */
export function DurationControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const d = parseDuration(value) ?? { d: 0, h: 0, m: 0 };
  const parts = [
    { key: "d" as const, unit: "Days", max: undefined },
    { key: "h" as const, unit: "Hours", max: 23 },
    { key: "m" as const, unit: "Mins", max: 59 },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {parts.map((p) => (
        <div key={p.key} className="flex items-center gap-2">
          <InputNumber
            aria-label={`${label}, ${p.unit.toLowerCase()}`}
            placeholder="00"
            className="w-20"
            minValue={0}
            maxValue={p.max}
            value={parseDuration(value) ? d[p.key] : NaN}
            onChange={(n) =>
              onChange(
                formatDuration({ ...d, [p.key]: Number.isNaN(n) ? 0 : n }),
              )
            }
          />
          <span className="text-sm text-tertiary">{p.unit}</span>
        </div>
      ))}
    </div>
  );
}

/** "Yes/No": two radio buttons, both visible, one click. */
export function YesNoControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <RadioGroup
      aria-label={label}
      orientation="horizontal"
      value={value === "Yes" || value === "No" ? value : null}
      onChange={onChange}
      className="gap-6 pt-2"
    >
      <RadioButton value="Yes" label="Yes" />
      <RadioButton value="No" label="No" />
    </RadioGroup>
  );
}

/** Observers: a multi-select of people. */
export function ObserversControl({
  names,
  onChange,
}: {
  names: string[];
  onChange: (names: string[]) => void;
}) {
  const known = new Set(OBSERVER_OPTIONS.map((o) => o.label));
  const items = [
    ...OBSERVER_OPTIONS.map((o) => ({ id: o.label, label: o.label })),
    ...names.filter((n) => !known.has(n)).map((n) => ({ id: n, label: n })),
  ];
  return (
    <MultiSelect
      aria-label="Observers"
      placeholder="Select observers"
      className="max-w-sm"
      items={items}
      selectedKeys={new Set(names)}
      onSelectionChange={(keys) =>
        onChange(
          keys === "all"
            ? items.map((i) => i.id)
            : Array.from(keys as Set<string>),
        )
      }
      onReset={() => onChange([])}
      onSelectAll={() => onChange(items.map((i) => i.id))}
    >
      {(item) => (
        <MultiSelect.Item
          {...item}
          selectionIndicator="checkbox"
          selectionIndicatorAlign="left"
        />
      )}
    </MultiSelect>
  );
}

export interface AllowedArea {
  /** How the area is named in the warning, e.g. "the project area (Adelaide Hills Bushland Survey)". */
  label: string;
  boundary: Boundary;
}

/**
 * The location picker from projects (shapefile, draw on the map, choose from a list, coordinates),
 * for a survey record. A location has to sit inside the project's area and inside its parent
 * record's location. One that doesn't is not taken: the previous location stays, and a warning says
 * which area it fell outside.
 */
export function LocationField({
  value,
  onChange,
  allowed,
}: {
  value: GeoExtentValue;
  onChange: (next: GeoExtentValue) => void;
  allowed: AllowedArea[];
}) {
  const [warning, setWarning] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <GeoExtentPicker
        value={value}
        defaultRadiusKm={0.1}
        compactTabs
        referenceBoundaries={allowed.map((a) => a.boundary)}
        onChange={(next) => {
          // Switching method keeps the current shape; only a new shape is checked.
          if (!next.boundary || next.boundary === value.boundary) {
            onChange(next);
            return;
          }
          const outside = allowed.find(
            (a) => !isBoundaryInside(next.boundary!, a.boundary),
          );
          if (outside) {
            setWarning(
              `That location is outside ${outside.label}, so it wasn't used. Choose a location inside it.`,
            );
            return;
          }
          setWarning(null);
          onChange(next);
        }}
      />
      {warning && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-warning-200 bg-warning-25 px-3 py-2.5 text-sm text-secondary"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
          {warning}
        </p>
      )}
      {allowed.length > 0 && (
        <p className="text-xs text-balance text-tertiary">
          Must be inside {allowed.map((a) => a.label).join(" and ")}. The dashed
          outline on the map shows the allowed area.
        </p>
      )}
    </div>
  );
}

// ── Occurrence and observation field types ──

/** "Please Select": a plain dropdown. */
export function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  if (options.length > LONG_LIST)
    return (
      <SearchSelect
        label={label}
        className="max-w-sm"
        items={options.map((o) => ({ id: o, label: o }))}
        value={options.includes(value) ? value : null}
        onChange={onChange}
      />
    );
  return (
    <Select
      aria-label={label}
      placeholder="Please select"
      className="max-w-sm"
      items={options.map((o) => ({ id: o, label: o }))}
      selectedKey={options.includes(value) ? value : null}
      onSelectionChange={(k) => onChange(k ? String(k) : NP)}
    >
      {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
    </Select>
  );
}

/** "3 Selected": a multi-select, stored as "a | b". */
export function MultiControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const chosen = splitList(value);
  const items = [...options, ...chosen.filter((c) => !options.includes(c))].map(
    (o) => ({ id: o, label: o }),
  );
  return (
    <MultiSelect
      aria-label={label}
      placeholder="Please select"
      className="max-w-sm"
      items={items}
      selectedKeys={new Set(chosen)}
      onSelectionChange={(keys) =>
        onChange(
          joinList(
            keys === "all"
              ? items.map((i) => i.id)
              : items
                  .map((i) => i.id)
                  .filter((id) => (keys as Set<string>).has(id)),
          ),
        )
      }
      onReset={() => onChange(NP)}
      onSelectAll={() => onChange(joinList(items.map((i) => i.id)))}
    >
      {(item) => (
        <MultiSelect.Item
          {...item}
          selectionIndicator="checkbox"
          selectionIndicatorAlign="left"
        />
      )}
    </MultiSelect>
  );
}

/** People (Recorded by, Determiners): the observer list as a multi-select. */
export function PeopleControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <MultiControl
      label={label}
      value={value}
      options={OBSERVER_OPTIONS.map((o) => o.label)}
      onChange={onChange}
    />
  );
}

/** A number with a unit picked from a short list ("24" and "°C"). */
export function NumberUnitControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const units = NUMBER_UNITS[label] ?? [];
  const parsed = parseNumberUnit(EMPTY_VALUES.has(value) ? "" : value);
  const unit = parsed.unit || units[0] || "";
  const set = (n: string, u: string) =>
    onChange(n === "" ? NP : `${n} ${u}`.trim());
  return (
    <div className="flex items-center gap-2">
      <InputNumber
        aria-label={`${label}, value`}
        placeholder="Value"
        className="w-28"
        value={parsed.value === "" ? NaN : Number(parsed.value)}
        onChange={(n) => set(Number.isNaN(n) ? "" : String(n), unit)}
      />
      <Select
        aria-label={`${label}, unit`}
        className="w-32"
        items={units.map((u) => ({ id: u, label: u }))}
        selectedKey={unit || null}
        onSelectionChange={(k) => k && set(parsed.value, String(k))}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
    </div>
  );
}

/** The NSX code and species: the species list, each with its common name. */
export function SpeciesControl({
  label,
  value,
  onChange,
  isInvalid,
}: {
  label: string;
  value: string;
  onChange: (nsx: string) => void;
  isInvalid?: boolean;
}) {
  return (
    <SearchSelect
      label={label}
      placeholder="Choose a species"
      className="max-w-md"
      isInvalid={isInvalid}
      hint={isInvalid ? "Choose a species" : undefined}
      items={NSX_SPECIES.map((s) => ({
        id: s.nsx,
        label: `${s.nsx} · ${s.scientific}`,
        supportingText: s.common,
      }))}
      value={nsxSpecies(value) ? value : null}
      onChange={onChange}
    />
  );
}

/** The voucher number, with its institution's prefix in front: "SAM" [24518]. */
export function VoucherControl({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string;
  value: string;
  prefix?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-10 min-w-12 items-center justify-center rounded-lg border border-secondary bg-secondary px-2.5 text-sm font-medium text-tertiary"
          title={
            prefix
              ? "The institution's prefix"
              : "Choose an institution to set the prefix"
          }
        >
          {prefix ?? "Prefix"}
        </span>
        <InputNumber
          aria-label={label}
          placeholder="Number"
          className="w-36"
          minValue={0}
          value={numberOf(value)}
          formatOptions={{ useGrouping: false }}
          onChange={(n) => onChange(fromNumber(n))}
        />
      </div>
      <p className="text-xs text-tertiary">
        {prefix
          ? `Shown as "${prefix} ${EMPTY_VALUES.has(value) ? "number" : value}". The prefix comes from the institution.`
          : "The prefix comes from the institution name, below."}
      </p>
    </div>
  );
}

/** Voucher images: file names, added from the file picker (no real upload in this preview). */
export function ImagesControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const files = parseJsonList<string>(value);
  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((f) => (
            <li
              key={f}
              className="group/img flex items-center gap-1.5 rounded-md border border-secondary py-1 pr-1 pl-2 text-sm text-secondary"
            >
              <Image01 className="size-3.5 text-fg-quaternary" />
              {f}
              <Button
                color="tertiary"
                size="sm"
                iconLeading={XClose}
                aria-label={`Remove ${f}`}
                className="size-6 p-0"
                onClick={() =>
                  onChange(toJsonList(files.filter((x) => x !== f)))
                }
              />
            </li>
          ))}
        </ul>
      )}
      <label className="w-max">
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label={`${label}, add images`}
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []).map((f) => f.name);
            if (picked.length)
              onChange(
                toJsonList([
                  ...files,
                  ...picked.filter((p) => !files.includes(p)),
                ]),
              );
            e.target.value = "";
          }}
        />
        <span className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover">
          <Upload01 className="size-4" />
          Add images
        </span>
      </label>
    </div>
  );
}

/**
 * Repeatable rows of codes ("Add another"): each column a code from its list with the description
 * beside it (read only), or a plain choice. Delete icons show on hover, as elsewhere.
 */
export function CodesControl({
  label,
  table,
  value,
  onChange,
}: {
  label: string;
  table: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const cols = CODE_TABLES[table] ?? [];
  const rows = parseJsonList<string[]>(value);
  const set = (next: string[][]) => onChange(toJsonList(next));
  const setCell = (i: number, c: number, v: string) =>
    set(
      rows.map((r, j) =>
        j === i ? cols.map((_, x) => (x === c ? v : (r[x] ?? ""))) : r,
      ),
    );
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="group/coderow flex items-start gap-2">
          <div className="grid min-w-0 flex-1 gap-2 @lg:grid-cols-2">
            {cols.map((col, c) => {
              const terms = col.vocab ? (CODE_VOCABS[col.vocab] ?? []) : [];
              const term = terms.find((t) => t.code === row[c]);
              return (
                <div
                  key={col.label}
                  className="flex min-w-0 items-center gap-2"
                >
                  {col.vocab ? (
                    <SearchSelect
                      label={`${label} ${i + 1}, ${col.label.toLowerCase()}`}
                      placeholder={col.label}
                      className="w-28 shrink-0"
                      popoverClassName="min-w-64"
                      items={terms.map((t) => ({ id: t.code, label: t.code }))}
                      value={row[c] || null}
                      onChange={(k) => setCell(i, c, k)}
                      describe={(code) =>
                        terms.find((t) => t.code === code)?.description
                      }
                    />
                  ) : (
                    <Select
                      aria-label={`${label} ${i + 1}, ${col.label.toLowerCase()}`}
                      placeholder={col.label}
                      className="w-36"
                      items={(col.options ?? []).map((o) => ({
                        id: o,
                        label: o,
                      }))}
                      selectedKey={row[c] || null}
                      onSelectionChange={(k) => k && setCell(i, c, String(k))}
                    >
                      {(item) => <Select.Item {...item} />}
                    </Select>
                  )}
                  {col.vocab && (
                    <Input
                      aria-label={`${label} ${i + 1}, ${col.label.toLowerCase()} description`}
                      isDisabled
                      value={term?.description ?? ""}
                      placeholder="Description"
                      className="min-w-0 flex-1"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Button
            color="tertiary"
            size="sm"
            iconLeading={Trash01}
            aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
            className="opacity-0 transition-opacity group-focus-within/coderow:opacity-100 group-hover/coderow:opacity-100 focus-visible:opacity-100"
            onClick={() => set(rows.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <Button
        color="link-color"
        size="sm"
        iconLeading={Plus}
        className="w-max"
        onClick={() => set([...rows, cols.map(() => "")])}
      >
        {rows.length ? "Add another" : `Add ${label.toLowerCase()}`}
      </Button>
    </div>
  );
}

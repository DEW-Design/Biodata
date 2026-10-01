"use client";

import { useCallback, useMemo, useState, type FC } from "react";
import { parseDate } from "@internationalized/date";
import { Button } from "@/components/base/buttons/button";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Tag, TagGroup, TagList } from "@/components/base/tags/tags";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import type { FilterOption } from "@/app/pages/_shared/list-filter";
import { SEARCH_FROM } from "@/app/pages/_shared/option-checklist";

// The attribute filter: the state of a table's filters and the rule that says which rows pass (`useAttributeFilter`), the
// "Filter" button and its contextual menu (`filter-menu.tsx`), and the filters that are on as removable chips under the toolbar
// (`AttributeFilterChips`). The one filter for every table that can be filtered (CONTRACTS 4.2d). A choice applies at once, and
// the table follows as you choose.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether an options attribute is a list that needs its search box. */
export const needsSearch = <T,>(attribute: OptionsAttribute<T>) => !!attribute.searchable && attribute.options.length >= SEARCH_FROM;

interface AttributeBase {
  id: string;
  label: string;
  /** The icon beside its name in the filter menu. One that is left out gets the icon for what its name says (`attributeIcon`). */
  icon?: FC<{ className?: string }>;
  /** Attributes with the same `group` sit together in the menu; a line is drawn where the group changes. */
  group?: string;
}

/** A fixed set of values (a status, a project, a person): pick any number of them. */
export interface OptionsAttribute<T> extends AttributeBase {
  kind: "options";
  options: FilterOption[];
  /** A list that grows with the data (projects, people) gets a search box once it has 4 or more options. */
  searchable?: boolean;
  /** The row's value, or values when it can have more than one. */
  get: (row: T) => string | string[];
}

/** A date: filter to rows whose date, or span of dates, falls in a range. */
export interface DateAttribute<T> extends AttributeBase {
  kind: "date";
  /** The row's span in milliseconds; `end` null means it is still open. A single moment has start = end. */
  get: (row: T) => { start: number; end: number | null } | null;
}

export type Attribute<T> = OptionsAttribute<T> | DateAttribute<T>;

export type DatePreset = "7d" | "30d" | "90d" | "custom";
export type FilterValue = { kind: "options"; ids: string[] } | { kind: "date"; preset: DatePreset; from: string; to: string };
export interface AppliedFilter {
  id: string;
  value: FilterValue;
}

export const DATE_PRESETS: { id: DatePreset; label: string; days?: number }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "custom", label: "Custom range" },
];

const dayFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDay = (iso: string) => dayFormat.format(Date.parse(iso));

/** A range as milliseconds, from a preset (counted back from now) or from two chosen days. */
function rangeOf(value: Extract<FilterValue, { kind: "date" }>, now: number): { from: number; to: number } | null {
  const preset = DATE_PRESETS.find((p) => p.id === value.preset);
  if (preset?.days) return { from: now - preset.days * DAY_MS, to: now };
  if (!value.from || !value.to || value.from > value.to) return null;
  return { from: Date.parse(`${value.from}T00:00:00`), to: Date.parse(`${value.to}T23:59:59`) };
}

export function summariseFilter<T>(attribute: Attribute<T>, value: FilterValue): string {
  if (value.kind === "options" && attribute.kind === "options") {
    const flat = attribute.options.flatMap((o) => o.children ?? [o]);
    const labels = value.ids.map((id) => flat.find((o) => o.id === id)?.label ?? id);
    return labels.length <= 2 ? labels.join(", ") : `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
  }
  if (value.kind === "date") {
    const preset = DATE_PRESETS.find((p) => p.id === value.preset);
    return preset?.days ? preset.label : `${formatDay(value.from)} to ${formatDay(value.to)}`;
  }
  return "";
}

export interface AttributeFilterApi<T> {
  attributes: Attribute<T>[];
  applied: AppliedFilter[];
  count: number;
  setValue: (id: string, value: FilterValue | null) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Whether a row passes every filter that is on. */
  matches: (row: T) => boolean;
}

/** The filter's state and its predicate. `onChange` runs whenever the filters change (to go back to page 1). */
export function useAttributeFilter<T>(attributes: Attribute<T>[], onChange?: () => void, initial: AppliedFilter[] = []): AttributeFilterApi<T> {
  const [applied, setApplied] = useState<AppliedFilter[]>(initial);

  const update = useCallback(
    (next: (current: AppliedFilter[]) => AppliedFilter[]) => {
      setApplied(next);
      onChange?.();
    },
    [onChange],
  );

  const setValue = useCallback(
    (id: string, value: FilterValue | null) =>
      update((current) => {
        const rest = current.filter((f) => f.id !== id);
        if (!value || (value.kind === "options" && value.ids.length === 0)) return rest;
        const at = current.findIndex((f) => f.id === id);
        // A filter already on keeps its place in the row of chips; a new one goes on the end.
        return at === -1 ? [...rest, { id, value }] : [...rest.slice(0, at), { id, value }, ...rest.slice(at)];
      }),
    [update],
  );

  const matches = useMemo(() => {
    // "Last 7 days" is counted back from the moment a row is checked, so it is read here, not while rendering.
    return (row: T) =>
      applied.every((filter) => {
        const attribute = attributes.find((a) => a.id === filter.id);
        if (!attribute) return true;
        if (attribute.kind === "options" && filter.value.kind === "options") {
          const value = attribute.get(row);
          const chosen = new Set(filter.value.ids);
          return (Array.isArray(value) ? value : [value]).some((v) => chosen.has(v));
        }
        if (attribute.kind === "date" && filter.value.kind === "date") {
          const range = rangeOf(filter.value, Date.now());
          if (!range) return true;
          const span = attribute.get(row);
          if (!span) return false;
          return span.start <= range.to && (span.end === null || span.end >= range.from);
        }
        return true;
      });
  }, [applied, attributes]);

  return {
    attributes,
    applied,
    count: applied.length,
    setValue,
    remove: (id) => setValue(id, null),
    clear: () => update(() => []),
    matches,
  };
}

export function DatePicker({ value, onChange }: { value: Extract<FilterValue, { kind: "date" }> | null; onChange: (value: FilterValue | null) => void }) {
  // The custom range is a draft until both days are chosen and in order; only then does it filter.
  const [preset, setPreset] = useState<DatePreset | null>(value?.preset ?? null);
  const [from, setFrom] = useState(value?.from ?? "");
  const [to, setTo] = useState(value?.to ?? "");
  const invalid = preset === "custom" && !!from && !!to && from > to;

  const commit = (nextPreset: DatePreset | null, nextFrom: string, nextTo: string) => {
    if (!nextPreset) return onChange(null);
    if (nextPreset === "custom" && (!nextFrom || !nextTo || nextFrom > nextTo)) return onChange(null);
    onChange({ kind: "date", preset: nextPreset, from: nextFrom, to: nextTo });
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <RadioGroup
        aria-label="Date range"
        value={preset ?? ""}
        onChange={(v) => {
          setPreset(v as DatePreset);
          commit(v as DatePreset, from, to);
        }}
        className="gap-2"
      >
        {DATE_PRESETS.map((p) => (
          <RadioButton key={p.id} value={p.id} label={p.label} />
        ))}
      </RadioGroup>
      {preset === "custom" && (
        <div className="flex flex-col gap-3 border-t border-secondary pt-3">
          <InputDatePicker
            label="From"
            value={from ? parseDate(from) : null}
            onChange={(d) => {
              const iso = d ? d.toString() : "";
              setFrom(iso);
              commit("custom", iso, to);
            }}
          />
          <InputDatePicker
            label="To"
            value={to ? parseDate(to) : null}
            isInvalid={invalid}
            onChange={(d) => {
              const iso = d ? d.toString() : "";
              setTo(iso);
              commit("custom", from, iso);
            }}
          />
          {invalid && <p className="text-sm text-error-primary">The start day must be on or before the end day.</p>}
        </div>
      )}
    </div>
  );
}

/** The filters that are on, as removable chips. Nothing is shown while none is. */
export function AttributeFilterChips<T>({ filter }: { filter: AttributeFilterApi<T> }) {
  if (filter.applied.length === 0) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <TagGroup label="Filters that are on" size="md" onRemove={(keys) => [...keys].forEach((k) => filter.remove(String(k)))}>
        <TagList className="flex flex-wrap gap-2">
          {filter.applied.map((f) => {
            const attribute = filter.attributes.find((a) => a.id === f.id);
            if (!attribute) return null;
            return (
              <Tag key={f.id} id={f.id} onClose={() => filter.remove(f.id)}>
                {attribute.label}: {summariseFilter(attribute, f.value)}
              </Tag>
            );
          })}
        </TagList>
      </TagGroup>
      <Button color="link-color" size="sm" onPress={filter.clear}>
        Clear all
      </Button>
    </div>
  );
}

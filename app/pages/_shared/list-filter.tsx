"use client";

import { useMemo, useState, type FC } from "react";
import { useAttributeFilter, type AppliedFilter, type Attribute, type AttributeFilterApi } from "@/app/pages/_shared/attribute-filter";

// What a collection list filters on is decided by the list, not here: each list passes its own sections, built from its own
// columns, so Projects filters on Status, Organisation, Contributor and Updated while a DSA filters on its partner,
// requester and how it is shared. The rule is the one Explore's filter menu uses: a column you would scan becomes a
// filter, an identifier (Project ID, Agreement ID) does not. The filter itself is the contextual menu every table has
// (`FilterMenu`, filter-menu.tsx; CONTRACTS 4.2d). Nothing selected in a section means every value in it; sections combine
// (a row must match every section that has a selection).

export interface FilterOption {
  id: string;
  label: string;
  /** Sub-options (two levels, e.g. Events > Site, Visit). The parent's checkbox selects or clears
   *  all of them and shows "some" when only part is selected; only the children's ids are stored. */
  children?: FilterOption[];
}

export interface FilterSection {
  id: string;
  label: string;
  options: FilterOption[];
  /** The icon beside its name in the filter menu. One that is left out gets the icon for what its name says (`attributeIcon`). */
  icon?: FC<{ className?: string }>;
  /** Sections with the same `group` sit together in the menu, a line where the group changes. */
  group?: string;
  /** A list of people, organisations or projects that grows with the data: gets a search box from 4 options up (and
   *  draws at most 50 at a time). Fixed vocabularies (status, access level, updated) never do. */
  searchable?: boolean;
}

/** Selected option ids per section id. A missing or empty set means "every value". */
export type FilterSelection = Record<string, Set<string>>;

/** How to read each section's value off a row (one value, or several when a row can match more than one). */
export type FilterGetters<T> = Record<string, (row: T) => string | string[]>;

/** The distinct values in a column as options, alphabetical, skipping empty ones. */
export function optionsFromValues(values: string[]): FilterOption[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => ({ id: v, label: v }));
}

/** Sections as the attributes the filter menu draws. */
const sectionAttributes = <T,>(sections: FilterSection[], getters: FilterGetters<T>): Attribute<T>[] =>
  sections.map((section) => ({
    kind: "options",
    id: section.id,
    label: section.label,
    icon: section.icon,
    group: section.group,
    options: section.options,
    searchable: section.searchable,
    get: (row: T) => getters[section.id]?.(row) ?? "",
  }));

/**
 * The same filter for a list whose selection lives outside it (the project page keeps its records filter in the page, so
 * a tile can set it). `selection` is the state and `onSelectionChange` is told the next one.
 */
export function useSelectionFilter<T>(sections: FilterSection[], getters: FilterGetters<T>, selection: FilterSelection, onSelectionChange: (next: FilterSelection) => void): AttributeFilterApi<T> {
  const attributes = useMemo(() => sectionAttributes(sections, getters), [sections, getters]);
  const applied = useMemo(
    (): AppliedFilter[] =>
      Object.entries(selection)
        .filter(([, chosen]) => chosen.size > 0)
        .map(([id, chosen]) => ({ id, value: { kind: "options", ids: [...chosen] } as const })),
    [selection],
  );
  const matches = useMemo(
    () => (row: T) =>
      applied.every((filter) => {
        const value = getters[filter.id]?.(row);
        if (value == null || filter.value.kind !== "options") return false;
        const chosen = new Set(filter.value.ids);
        return (Array.isArray(value) ? value : [value]).some((v) => chosen.has(v));
      }),
    [applied, getters],
  );
  const setValue = (id: string, value: AppliedFilter["value"] | null) => {
    const next = { ...selection };
    if (!value || value.kind !== "options" || value.ids.length === 0) delete next[id];
    else next[id] = new Set(value.ids);
    onSelectionChange(next);
  };
  return { attributes, applied, count: applied.length, setValue, remove: (id) => setValue(id, null), clear: () => onSelectionChange({}), matches };
}

/**
 * A list's filters, from the sections it describes and how to read each one off a row: the state, the rule that says
 * which rows pass (`matches`), and what `FilterMenu` and `AttributeFilterChips` draw. `onChange` runs whenever a filter
 * changes (to go back to page 1), and `initial` seeds filters from the URL (`?status=`).
 */
export function useListFilter<T>(sections: FilterSection[], getters: FilterGetters<T>, onChange?: () => void, initial?: FilterSelection): AttributeFilterApi<T> {
  const attributes = useMemo(() => sectionAttributes(sections, getters), [sections, getters]);
  const [seed] = useState<AppliedFilter[]>(() =>
    Object.entries(initial ?? {})
      .filter(([, chosen]) => chosen.size > 0)
      .map(([id, chosen]) => ({ id, value: { kind: "options", ids: [...chosen] } as const })),
  );
  return useAttributeFilter(attributes, onChange, seed);
}

// ── Updated ──

/** Recency buckets for a list whose "Updated" is a number of days ago (Projects). */
export const RECENCY_OPTIONS: FilterOption[] = [
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "Last 30 days" },
  { id: "older", label: "Older than 30 days" },
];

export const recencyBucket = (daysAgo: number | null): string => (daysAgo == null ? "" : daysAgo <= 7 ? "week" : daysAgo <= 30 ? "month" : "older");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-02-04" as "Feb 2026", hand-rolled so server and client render the same text. */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  const month = MONTHS[Number(m) - 1];
  return y && month ? `${month} ${y}` : "";
}

/** The months present in a list's dates, newest first ("Updated" for a list with real dates). */
export function monthOptions(isoDates: string[]): FilterOption[] {
  const ids = [...new Set(isoDates.map((d) => d.slice(0, 7)).filter((d) => /^\d{4}-\d{2}$/.test(d)))].sort().reverse();
  return ids.map((id) => ({ id, label: monthLabel(id) }));
}

"use client";

import { useState } from "react";
import { FilterLines, SearchMd } from "@untitledui/icons";
import { Dialog, DialogTrigger } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Popover } from "@/components/base/select/popover";

// The one Filter button for every collection list (Projects, DSA, DLA). What it filters on is
// decided by the list, not here: each list passes its own sections, built from its own columns, so
// Projects filters on Status, Organisation, Contributor and Updated while a DSA filters on its
// partner, requester and how it is shared. The rule is the one Explore's All Filters panel uses:
// a column you would scan becomes a filter, an identifier (Project ID, Agreement ID) does not.
//
// Nothing selected in a section means every value in it; sections combine (a row must match every
// section that has a selection). One button, tinted and counted while any filter is on.

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterSection {
  id: string;
  label: string;
  options: FilterOption[];
  /** A list of people or organisations that grows with the data: gets a search box once it is long
   *  enough to need one. Fixed vocabularies (status, access level, updated) never do. */
  searchable?: boolean;
}

/** Selected option ids per section id. A missing or empty set means "every value". */
export type FilterSelection = Record<string, Set<string>>;

/** How to read each section's value off a row (one value, or several when a row can match more than one). */
export type FilterGetters<T> = Record<string, (row: T) => string | string[]>;

/** A searchable section shows its search box once it has more options than this. */
const SEARCH_ABOVE = 6;

export const filterCount = (selection: FilterSelection) => Object.values(selection).reduce((n, set) => n + set.size, 0);

export function matchesFilters<T>(row: T, selection: FilterSelection, getters: FilterGetters<T>): boolean {
  return Object.entries(selection).every(([sectionId, chosen]) => {
    if (chosen.size === 0) return true;
    const value = getters[sectionId]?.(row);
    if (value == null) return false;
    return (Array.isArray(value) ? value : [value]).some((v) => chosen.has(v));
  });
}

/** The distinct values in a column as options, alphabetical, skipping empty ones. */
export function optionsFromValues(values: string[]): FilterOption[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => ({ id: v, label: v }));
}

function FilterSectionBlock({ section, selected, onChange }: { section: FilterSection; selected: Set<string>; onChange: (next: Set<string>) => void }) {
  const [search, setSearch] = useState("");
  const searchable = !!section.searchable && section.options.length > SEARCH_ABOVE;
  const q = search.trim().toLowerCase();
  const options = q ? section.options.filter((o) => o.label.toLowerCase().includes(q)) : section.options;
  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{section.label}</p>
      {searchable && <Input aria-label={`Search ${section.label.toLowerCase()}`} size="sm" icon={SearchMd} placeholder="Search" value={search} onChange={setSearch} />}
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <Checkbox key={o.id} label={o.label} isSelected={selected.has(o.id)} onChange={(checked) => toggle(o.id, checked)} />
        ))}
        {options.length === 0 && <p className="text-sm text-tertiary">No matches</p>}
      </div>
    </div>
  );
}

export function ListFilterButton({ sections, selection, onChange }: { sections: FilterSection[]; selection: FilterSelection; onChange: (next: FilterSelection) => void }) {
  const count = filterCount(selection);
  const active = count > 0;
  return (
    <DialogTrigger>
      <Button
        color="secondary"
        size="sm"
        iconLeading={FilterLines}
        aria-label={active ? `Filters, ${count} applied` : "Filters"}
        className={active ? "bg-brand-50! ring-brand-100!" : undefined}
      >
        {active ? `Filter (${count})` : "Filter"}
      </Button>
      <Popover size="auto" placement="bottom start" className="font-barlow w-72">
        <Dialog className="flex flex-col outline-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-sm font-semibold text-primary">Filters</p>
            {active && (
              <Button color="link-color" size="sm" onPress={() => onChange({})}>
                Clear all
              </Button>
            )}
          </div>
          <div className="flex flex-col [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">
            {sections.map((section) => (
              <div key={section.id} className="px-4 py-3">
                <FilterSectionBlock
                  section={section}
                  selected={selection[section.id] ?? new Set()}
                  onChange={(next) => onChange({ ...selection, [section.id]: next })}
                />
              </div>
            ))}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
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

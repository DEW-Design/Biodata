"use client";

import { useState } from "react";
import { SearchMd } from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";

// The list of checkboxes every filter shows for a set of values (a project, a person, an organisation), in one place so
// they all behave the same. A list that grows with the data gets a search box from 4 options up, because past a handful
// typing beats scrolling and a list can run to thousands (projects). What is ticked stays on top, searching or not, so a
// choice is never lost behind the search. At most 50 matches are drawn at once; a line says how many are waiting, and
// typing narrows them.

/** A searchable list shows its search box from this many options up. */
export const SEARCH_FROM = 4;
/** The most unticked options drawn at once. */
export const SHOW_AT_MOST = 50;

export interface ChecklistOption {
  id: string;
  label: string;
}

/** What a long list draws for a search: the ticked values first, then up to `SHOW_AT_MOST` matches, and how many wait. */
export function boundedOptions(options: ChecklistOption[], selected: Set<string>, query: string) {
  const q = query.trim().toLowerCase();
  const picked = options.filter((o) => selected.has(o.id));
  const matches = options.filter((o) => !selected.has(o.id) && (!q || o.label.toLowerCase().includes(q)));
  const shown = matches.slice(0, SHOW_AT_MOST);
  return { picked, matches, shown, visible: [...picked, ...shown], waiting: matches.length - shown.length, query: q };
}

export function OptionChecklist({
  label,
  options,
  selected,
  onToggle,
  searchable,
  autoFocus,
  className,
}: {
  /** What the values are ("project"), for the search box's accessible name. */
  label: string;
  options: ChecklistOption[];
  selected: Set<string>;
  onToggle: (id: string, on: boolean) => void;
  /** A list that grows with the data. It still has to reach `SEARCH_FROM` options to show the box. */
  searchable: boolean;
  autoFocus?: boolean;
  /** Classes for the scrolling list of checkboxes (its height cap). */
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const showSearch = searchable && options.length >= SEARCH_FROM;
  const { picked, matches, shown, visible, waiting, query: q } = boundedOptions(options, selected, search);

  return (
    <div className="flex flex-col gap-3">
      {showSearch && (
        <Input
          aria-label={`Search ${label.toLowerCase()}`}
          size="sm"
          icon={SearchMd}
          placeholder="Search"
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          clearLabel="Clear search"
          autoFocus={autoFocus}
        />
      )}
      <div className={className ?? "flex flex-col gap-2"}>
        {visible.map((o) => (
          <Checkbox key={o.id} label={o.label} isSelected={selected.has(o.id)} onChange={(on) => onToggle(o.id, on)} />
        ))}
        {matches.length === 0 && <p className="m-0 text-sm text-tertiary">{picked.length > 0 && q ? "No other matches" : "No matches"}</p>}
        {waiting > 0 && (
          <p className="m-0 text-xs text-tertiary tabular-nums">
            {q ? `${shown.length} of ${matches.length} matches shown. Type more to narrow them.` : `${shown.length} of ${matches.length} shown. Search to find the rest.`}
          </p>
        )}
      </div>
    </div>
  );
}

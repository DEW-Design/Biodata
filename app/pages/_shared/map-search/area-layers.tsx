"use client";

import { useId, useState } from "react";
import { Check, ChevronRight, Edit03, Eye, EyeOff, SearchLg, Sliders01, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CountBadge } from "@/components/base/badges/badges";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { cx } from "@/utils/cx";

// The search areas as a list of layers: one row per area you have added (a drawn shape, a point,
// a national park, a shapefile), each with a visibility toggle, a name, what it is, and how many
// records it holds. Unlike design-tool layers, order means nothing here: the search covers the
// union of every visible area, so rows are not stacked or reordered. Pointing at a row highlights
// its shape on the map, and clicking the name zooms to it.
//
// It sits inside the floating search card (Explore has no column 2), so it folds: one row that says
// "Search areas", how many, and which (the first name, "and 2 more"), and opens to the layers. It stays
// open by itself while every area is hidden, because then the results are empty and the way back is
// in this list. Open, the list scrolls inside its own height so the card keeps room for results.

export interface AreaLayerRow {
  id: string;
  name: string;
  /** What it is, in a few words: "15 km radius", "4 points". */
  detail: string;
  /** Records inside this area (with the keyword applied). */
  count: number;
  hidden: boolean;
  /** Rename and hide are offered. False for the implied "All of South Australia" from a keyword. */
  editable: boolean;
  /** Set when the area has an editable radius (a circle, a park, a shapefile's points). */
  radiusKm?: number;
}

export function AreaLayerList({
  rows,
  onToggleHidden,
  onRename,
  onRadius,
  onRemove,
  onHover,
  onZoom,
  onClearAll,
}: {
  rows: AreaLayerRow[];
  onToggleHidden: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRadius: (id: string, km: number) => void;
  onRemove: (id: string) => void;
  onHover: (id: string | null) => void;
  onZoom: (id: string) => void;
  onClearAll: () => void;
}) {
  const [editing, setEditing] = useState<{ id: string; field: "name" | "radius" } | null>(null);
  const [opened, setOpened] = useState(false);
  const listId = useId();
  const allHidden = rows.length > 0 && rows.every((row) => row.hidden);
  const open = opened || allHidden;
  const first = rows[0];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          // While every area is hidden the list stays open, so the control that closes it does nothing.
          disabled={allHidden}
          onClick={() => setOpened((v) => !v)}
          className="-ml-1 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1.5 pl-1 text-left outline-focus-ring focus-visible:outline-2 disabled:cursor-default"
        >
          <ChevronRight className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90")} aria-hidden />
          <span className="shrink-0 text-sm font-semibold text-primary">Search areas</span>
          {rows.length > 0 && <CountBadge count={rows.length} />}
          {!open && first && (
            <span className="min-w-0 flex-1 truncate text-sm text-tertiary">
              {first.name}
              {rows.length > 1 ? ` and ${rows.length - 1} more` : ""}
            </span>
          )}
        </button>
        {open && rows.length > 1 && (
          <button type="button" onClick={onClearAll} className="cursor-pointer rounded px-1 text-xs font-medium text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2">
            Clear all
          </button>
        )}
      </div>

      {open && rows.length > 0 && (
        <ul id={listId} className="m-0 flex max-h-56 list-none flex-col gap-1 overflow-y-auto p-0 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
          {rows.map((row) => (
            <li
              key={row.id}
              onPointerEnter={() => onHover(row.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(row.id)}
              onBlur={() => onHover(null)}
              className="rounded-lg border border-secondary bg-primary"
            >
              <div className="flex items-center gap-1 py-1.5 pr-1 pl-1">
                {row.editable ? (
                  <button
                    type="button"
                    aria-label={row.hidden ? `Show ${row.name}` : `Hide ${row.name}`}
                    aria-pressed={!row.hidden}
                    onClick={() => onToggleHidden(row.id)}
                    className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear before:absolute before:-inset-1 hover:bg-secondary hover:text-fg-quaternary_hover focus-visible:outline-2"
                  >
                    {row.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                ) : (
                  <span className="flex size-7 shrink-0 items-center justify-center text-fg-quaternary">
                    <SearchLg className="size-4" />
                  </span>
                )}
                {/* One line: the name, then what it is and how many records, the way a Select item sets a label
                    and its supporting text (same size; weight and colour carry the hierarchy). The name gives
                    way to a long one, the detail does not; the whole line is the tooltip. */}
                <button
                  type="button"
                  onClick={() => !row.hidden && onZoom(row.id)}
                  aria-label={row.hidden ? row.name : `Zoom to ${row.name}`}
                  title={`${row.name}, ${row.detail} \u00b7 ${row.count} ${row.count === 1 ? "record" : "records"}`}
                  className={cx(
                    "flex min-w-0 flex-1 cursor-pointer items-baseline gap-2 rounded-md px-1 py-0.5 text-left outline-focus-ring focus-visible:outline-2",
                    row.hidden && "cursor-default opacity-50",
                  )}
                >
                  <span className="min-w-0 truncate text-sm font-medium text-primary">{row.name}</span>
                  <span className="shrink-0 text-sm whitespace-nowrap text-tertiary tabular-nums">
                    {row.detail} · {row.count} {row.count === 1 ? "record" : "records"}
                  </span>
                </button>
                {row.editable ? (
                  <Dropdown.Root>
                    <Dropdown.DotsButton aria-label={`More for ${row.name}`} className="p-1" />
                    <Dropdown.Popover placement="bottom right">
                      <Dropdown.Menu
                        aria-label={`Actions for ${row.name}`}
                        onAction={(key) => {
                          if (key === "rename") setEditing({ id: row.id, field: "name" });
                          if (key === "radius") setEditing({ id: row.id, field: "radius" });
                          if (key === "remove") onRemove(row.id);
                        }}
                      >
                        <Dropdown.Item id="rename" label="Rename" icon={Edit03} />
                        {row.radiusKm !== undefined && <Dropdown.Item id="radius" label="Change radius" icon={Sliders01} />}
                        <Dropdown.Item id="remove" label="Remove" icon={Trash01} />
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown.Root>
                ) : (
                  <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${row.name}`} onPress={() => onRemove(row.id)} />
                )}
              </div>

              {editing?.id === row.id && editing.field === "name" && (
                <div className="border-t border-secondary p-2">
                  <RenameField initial={row.name} onCommit={(name) => { onRename(row.id, name); setEditing(null); }} onCancel={() => setEditing(null)} />
                </div>
              )}
              {editing?.id === row.id && editing.field === "radius" && row.radiusKm !== undefined && (
                <div className="flex items-end gap-2 border-t border-secondary p-2">
                  <InputNumber
                    size="sm"
                    label="Radius (km)"
                    value={row.radiusKm}
                    minValue={1}
                    maxValue={300}
                    step={1}
                    className="flex-1"
                    onChange={(km) => Number.isFinite(km) && km >= 1 && onRadius(row.id, km)}
                  />
                  <Button iconLeading={Check} color="secondary" size="sm" onPress={() => setEditing(null)}>
                    Done
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RenameField({ initial, onCommit, onCancel }: { initial: string; onCommit: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const commit = () => (value.trim() ? onCommit(value.trim()) : onCancel());
  return (
    <div
      onKeyDown={(e) => {
        // Enter saves, Escape leaves the name as it was (CONTRACTS 1.9).
        if (e.key === "Enter") commit();
        if (e.key === "Escape") onCancel();
      }}
    >
      <Input size="sm" aria-label="Area name" value={value} onChange={setValue} autoFocus />
    </div>
  );
}

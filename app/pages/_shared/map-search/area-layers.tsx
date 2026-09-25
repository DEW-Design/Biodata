"use client";

import { useState } from "react";
import { Edit03, Eye, EyeOff, SearchLg, Sliders01, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { cx } from "@/utils/cx";

// The search areas as a list of layers: one row per area you have added (a drawn shape, a point,
// a national park, a shapefile), each with a visibility toggle, a name, what it is, and how many
// records it holds. Unlike design-tool layers, order means nothing here: the search covers the
// union of every visible area, so rows are not stacked or reordered. Pointing at a row highlights
// its shape on the map, and clicking the name zooms to it.

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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">
          Search areas{rows.length > 0 && <span className="ml-1.5 font-normal text-tertiary">{rows.length}</span>}
        </p>
        {rows.length > 1 && (
          <button type="button" onClick={onClearAll} className="cursor-pointer rounded px-1 text-xs font-medium text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2">
            Clear all
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-tertiary">No areas yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
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
                <button
                  type="button"
                  onClick={() => !row.hidden && onZoom(row.id)}
                  aria-label={row.hidden ? row.name : `Zoom to ${row.name}`}
                  className={cx(
                    "flex min-w-0 flex-1 cursor-pointer flex-col rounded-md px-1 py-0.5 text-left outline-focus-ring focus-visible:outline-2",
                    row.hidden && "cursor-default opacity-50",
                  )}
                >
                  <span className="truncate text-sm font-medium text-primary" title={row.name}>
                    {row.name}
                  </span>
                  <span className="truncate text-xs text-tertiary">
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
                  <Button color="secondary" size="sm" onPress={() => setEditing(null)}>
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

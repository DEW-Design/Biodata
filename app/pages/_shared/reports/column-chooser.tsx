"use client";

import { useMemo, useState } from "react";
import { Columns03, Lock01, Menu01, SearchMd } from "@untitledui/icons";
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  Dialog,
  DialogTrigger,
  GridList,
  GridListItem,
  useDragAndDrop,
} from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Popover } from "@/components/base/select/popover";
import { cx } from "@/utils/cx";

// The Columns chooser the wireframes draw at the right end of every report table (an icon, and a "Columns" panel of
// checkboxes with drag handles). Fitted into the app: a button in the toolbar opening one popover, choices applying as they
// are made (CONTRACTS 1.9 item 2: no hidden Apply, so the wireframe's "Apply" is not a button), the list searchable (a
// report can have 93 columns), each column dragged by its handle or moved by keyboard (react-aria's own drag and drop), the
// first column pinned and always shown, and a Reset that puts every column back. The button says how many are hidden.

interface ChooserColumn {
  id: string;
  label: string;
  sticky?: boolean;
}

export interface ColumnChoice<C extends ChooserColumn> {
  /** The columns to draw, in the chosen order: the pinned one first, hidden ones left out. */
  visible: C[];
  /** Props for `ColumnChooser`. */
  chooser: {
    columns: C[];
    order: string[];
    hidden: Set<string>;
    setOrder: (order: string[]) => void;
    setHidden: (hidden: Set<string>) => void;
    reset: () => void;
  };
}

/** The chosen order and visibility of a report's columns. Starts with every column shown in its own order, and starts over
 *  when the set of columns changes (another tab of a report). */
export function useColumnChoice<C extends ChooserColumn>(columns: C[]): ColumnChoice<C> {
  const ids = useMemo(() => columns.map((c) => c.id), [columns]);
  const key = ids.join("|");
  const [order, setOrder] = useState<string[]>(ids);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    // Adjusting state while rendering for a changed input, the pattern React documents: one more render, no remount.
    setSeenKey(key);
    setOrder(ids);
    setHidden(new Set());
  }

  const visible = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]));
    const pinned = columns.filter((c) => c.sticky);
    const rest = order.map((id) => byId.get(id)).filter((c): c is C => !!c && !c.sticky && !hidden.has(c.id));
    return [...pinned, ...rest];
  }, [columns, order, hidden]);

  return {
    visible,
    chooser: {
      columns,
      order,
      hidden,
      setOrder,
      setHidden,
      reset: () => {
        setOrder(ids);
        setHidden(new Set());
      },
    },
  };
}

/** `moving` placed before or after `target` in `order`; the rest keep their places. */
function reordered(order: string[], moving: string[], target: string, position: "before" | "after" | "on"): string[] {
  const rest = order.filter((id) => !moving.includes(id));
  const at = rest.indexOf(target);
  if (at === -1) return order;
  const insertAt = position === "after" ? at + 1 : at;
  return [...rest.slice(0, insertAt), ...order.filter((id) => moving.includes(id)), ...rest.slice(insertAt)];
}

export function ColumnChooser<C extends ChooserColumn>({ chooser }: { chooser: ColumnChoice<C>["chooser"] }) {
  const { columns, order, hidden, setOrder, setHidden, reset } = chooser;
  const [query, setQuery] = useState("");

  const pinned = columns.filter((c) => c.sticky);
  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const movable = order.map((id) => byId.get(id)).filter((c): c is C => !!c && !c.sticky);
  const q = query.trim().toLowerCase();
  const listed = q ? movable.filter((c) => c.label.toLowerCase().includes(q)) : movable;
  const hiddenCount = movable.filter((c) => hidden.has(c.id)).length;

  // Dragging is by the handle (or the keyboard), and only while the whole list shows: moving a column within a filtered
  // list would not say where it lands among the ones that are out of sight.
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
    onReorder: (e) => setOrder(reordered(order, [...e.keys].map(String), String(e.target.key), e.target.dropPosition)),
    getAllowedDropOperations: () => ["move"],
  });

  const toggle = (id: string, shown: boolean) => {
    const next = new Set(hidden);
    if (shown) next.delete(id);
    else next.add(id);
    setHidden(next);
  };

  return (
    <DialogTrigger onOpenChange={(open) => open && setQuery("")}>
      <Button color="secondary" size="sm" iconLeading={Columns03}>
        {hiddenCount > 0 ? `Columns · ${hiddenCount} hidden` : "Columns"}
      </Button>
      <Popover size="auto" placement="bottom end" offset={12} className="w-80 py-0">
        <Dialog aria-label="Choose columns" className="flex flex-col outline-hidden">
          <div className="p-2">
            <Input aria-label="Search columns" size="sm" icon={SearchMd} placeholder="Search columns" value={query} onChange={setQuery} onClear={() => setQuery("")} clearLabel="Clear search" />
          </div>
          {pinned.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border-y border-secondary bg-secondary px-3 py-2">
              <Lock01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
              <CheckboxBase isSelected isDisabled />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-secondary">{c.label}</span>
              <span className="text-xs text-tertiary">Pinned</span>
            </div>
          ))}
          <div className="max-h-72 overflow-y-auto py-1">
            {listed.length === 0 ? (
              <p className="px-4 py-3 text-sm text-tertiary">No column matches.</p>
            ) : (
              <GridList
                // Drag and drop is on or off for a list's whole life (react-aria's hooks cannot switch), so a search starting or ending is a new list.
                key={q ? "filtered" : "all"}
                aria-label="Columns"
                items={listed}
                // A row's render is cached per item; the checkboxes read the hidden set, so it is a dependency.
                dependencies={[hidden]}
                // The checkboxes are plain controls, not the list's selection: react-aria drags every selected row together, and here
                // nearly every row is "selected" (shown), so a drag would move them all.
                dragAndDropHooks={q ? undefined : dragAndDropHooks}
                className="outline-hidden"
              >
                {(c) => (
                  <GridListItem
                    id={c.id}
                    textValue={c.label}
                    className={({ isFocusVisible, isHovered }) =>
                      cx("flex cursor-pointer items-center gap-3 px-3 py-2 outline-hidden", isHovered && "bg-primary_hover", isFocusVisible && "outline-2 -outline-offset-2 outline-focus-ring")
                    }
                  >
                    {q ? null : (
                      <AriaButton slot="drag" aria-label={`Move ${c.label}`} className="flex shrink-0 cursor-grab items-center text-fg-quaternary outline-focus-ring focus-visible:outline-2">
                        <Menu01 className="size-4" aria-hidden />
                      </AriaButton>
                    )}
                    <AriaCheckbox isSelected={!hidden.has(c.id)} onChange={(shown) => toggle(c.id, shown)} aria-label={c.label} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      {({ isSelected }) => (
                        <>
                          <CheckboxBase isSelected={isSelected} />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-secondary">{c.label}</span>
                        </>
                      )}
                    </AriaCheckbox>
                  </GridListItem>
                )}
              </GridList>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-secondary px-3 py-2">
            <span className="text-sm text-tertiary">
              {movable.length - hiddenCount + pinned.length} of {columns.length} shown
            </span>
            {/* Never disabled: a button that disables itself when pressed drops the keyboard's place. */}
            <Button color="link-color" size="sm" onPress={reset}>
              Reset
            </Button>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { MotionConfig, Reorder, useDragControls } from "motion/react";
import { ResizableTh, createColumnWidths, tableWidth } from "@/app/pages/_shared/resizable-columns";
import type { Key, Selection } from "react-aria-components";
import { ArrowDown, ArrowUp, Copy01, DotsGrid, Plus, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { ComboBox } from "@/components/base/select/combobox";
import { MultiSelect } from "@/components/base/select/multi-select";
import { SelectItem } from "@/components/base/select/select-item";
import { Toggle } from "@/components/base/toggle/toggle";
import {
  columnLabel,
  identifierLabel,
  mappedValue,
  resolveEntry,
  shownFields,
  sourceRow,
  sourceTable,
  withDerivedOrder,
  type CvDraft,
  type CvEntry,
  type CvErrors,
} from "@/app/pages/_shared/ctrl-vocab/cv-data";
import { cx } from "@/utils/cx";

// The Fields and values grids (Reference and Descriptive) and the column mapping table. They are
// composed, not a real component: DEW has no editable grid, so each is a semantic table in
// TableCard's tokens with real DEW controls in its cells (CONTRACTS 1.2, "composed, not a real
// component").
//
// Columns, left to right: the drag handle, Order, the values, "Available to users", the row menu.
//   - Order comes first, beside the handle, when the vocabulary shows it (an Extra column): the row's
//     place in the list. It is typed or picked (a position 1 to n moves the row there) as well as
//     dragged, and renumbers as rows move. Without it, rows still move by drag and the row menu.
//   - A numbered vocabulary's ID sits next to Order: filled in on a new row, editable, and it stays
//     with its row when the row moves (records keep it).
//   - The text columns (Code, Name, Title, Description, Value, custom) can be resized by the edge of
//     their header: drag it, or focus it and use the arrow keys; a double click resets the width.
//     The handle, Order, ID, the switch and the menu are fixed (the designer: "just the ones that
//     needs resizing"). Widths are remembered per vocabulary in this browser.
//
// Every row (the designer: "for all fields and values tables the rows could be re-ordered,
// duplicate rows"): the drag handle on the left, as the Figma draws it, and a "..." menu on the right
// with Duplicate (Reference), Move up, Move down, and Remove for a row not saved yet, so everything
// the handle does can be done by keyboard (1.9). A saved row is hidden with its switch instead of
// removed (REQ-18.6).
//
// "Available to users" is the entry's Status (REQ-18.5) as the admin decides it: a switch, on for
// offered in forms' dropdowns, off for hidden.

export type Upload = { fileName: string; handoutId?: string; added: Set<string>; updated: Set<string>; unchanged: number; ignored: string[] };

const thClass = "border-b border-secondary px-3 py-2 text-left align-top text-xs font-semibold whitespace-nowrap text-quaternary";

export function Th({ children, required, className }: { children: ReactNode; required?: boolean; className?: string }) {
  return (
    <th scope="col" className={cx(thClass, className)}>
      {children}
      {required && <span className="text-brand-tertiary"> *</span>}
    </th>
  );
}

export const td = "border-b border-secondary px-3 py-2 align-top";

export function GridCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

// ── Column widths ──

const MIN_WIDTH = 112;
const MAX_WIDTH = 640;
const STEP = 16;
const DEFAULT_WIDTHS: Record<string, number> = { code: 176, name: 256, title: 208, description: 288, value: 208 };
/** The fixed columns: handle, Order, ID, the switch, the menu. */
const FIXED = { handle: 40, order: 88, id: 88, available: 176, menu: 56 };

// Column widths are remembered per vocabulary (the designer, 30 Sept 2026), in this browser: a
// personal preference, not part of the vocabulary. A new vocabulary not saved yet uses "new". The
// resizing itself is shared (resizable-columns.tsx), so every resizable table behaves the same.
const useColumnWidths = createColumnWidths({ storageName: "biodata-ctrl-vocab-widths", defaults: DEFAULT_WIDTHS, fallback: 192, min: MIN_WIDTH, max: MAX_WIDTH, step: STEP });

// ── Reordering ──

export interface RowOps {
  move: (id: string, to: number) => void;
  /** The rows' ids in their new order, as a drag leaves them. */
  reorder: (ids: string[]) => void;
  duplicate?: (id: string) => void;
  remove: (id: string) => void;
}

/**
 * Rows move by their handle with motion's `Reorder` (already in the project, and used by the
 * Accordion): the picked-up row lifts with a shadow and follows the pointer while the other rows
 * slide out of its way, so it is always clear where it will land. Only the handle starts a drag, so
 * the inputs in the row keep working normally. Reduced motion is respected.
 */
function SortableBody({ ids, onReorder, children }: { ids: string[]; onReorder: (ids: string[]) => void; children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Reorder.Group as="tbody" axis="y" values={ids} onReorder={onReorder}>
        {children}
      </Reorder.Group>
    </MotionConfig>
  );
}

function SortableRow({ id, className, children }: { id: string; className?: string; children: (handle: ReactNode) => ReactNode }) {
  const controls = useDragControls();
  const [lifted, setLifted] = useState(false);
  const handle = (
    <span
      aria-hidden
      title="Drag to move"
      onPointerDown={(e) => {
        e.preventDefault();
        controls.start(e);
      }}
      className="flex cursor-grab touch-none items-center pt-2.5 text-fg-quaternary hover:text-fg-quaternary_hover active:cursor-grabbing"
    >
      <DotsGrid className="size-4" />
    </span>
  );
  return (
    <Reorder.Item
      as="tr"
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setLifted(true)}
      onDragEnd={() => setLifted(false)}
      className={cx("relative bg-primary", lifted && "z-10 shadow-lg ring-1 ring-secondary", className)}
    >
      {children(handle)}
    </Reorder.Item>
  );
}

/** An empty column that takes the spare width after the row's content, so the sized columns keep their widths and the content reads as one block, with only the row menu at the right edge. */
function Spacer({ head = false }: { head?: boolean }) {
  return head ? <th aria-hidden className="border-b border-secondary" /> : <td aria-hidden className="border-b border-secondary" />;
}

/**
 * Order is typed or picked (the designer, 30 Sept 2026: "order must be user input ... if i say 3 the
 * row must go to the third", combined with drag and drop). A ComboBox of the positions 1 to n, with no
 * icon (a number needs none): choose
 * one, or type a number and press Enter or leave the field, and the row moves there; every row's
 * Order then renumbers. Anything that isn't a position puts the row's own number back.
 */
/** The action column floats: it stays at the right edge while the grid scrolls sideways, over the columns passing under it. */
const STICKY = "sticky right-0 z-2 border-l border-secondary";

function OrderCell({ id, n, order, count, onMove }: { id: string; n: number; order: string; count: number; onMove: (to: number) => void }) {
  return (
    <td className={td}>
      {/* Keyed on the order, so a move (by any route) starts the field afresh at the new number. */}
      <OrderInput key={`${id}-${order}`} n={n} order={order} count={count} onMove={onMove} />
    </td>
  );
}

function OrderInput({ n, order, count, onMove }: { n: number; order: string; count: number; onMove: (to: number) => void }) {
  const [text, setText] = useState(order);
  const items = Array.from({ length: count }, (_, i) => ({ id: String(i + 1), label: String(i + 1) }));
  const commit = (value: string) => {
    const to = Number(value.trim());
    if (Number.isInteger(to) && to >= 1 && to <= count) {
      if (String(to) !== order) onMove(to - 1);
    } else setText(order);
  };
  return (
    <div
      onKeyDownCapture={(e) => {
        // Enter on a typed number commits it; Enter on a highlighted option is the ComboBox's own choice.
        const input = e.target as HTMLInputElement;
        if (e.key === "Enter" && input.tagName === "INPUT" && !input.getAttribute("aria-activedescendant")) commit(text);
      }}
      onBlur={() => commit(text)}
    >
      <ComboBox
        aria-label={`Order, row ${n}`}
        size="sm"
        hideIcon
        allowsCustomValue
        popoverMinWidth={80}
        items={items}
        inputValue={text}
        onInputChange={setText}
        selectedKey={order}
        onSelectionChange={(k) => k != null && commit(String(k))}
      >
        {(item) => <SelectItem id={item.id} label={item.label} />}
      </ComboBox>
    </div>
  );
}

function RowMenu({
  n,
  index,
  count,
  id,
  saved,
  ops,
}: {
  n: number;
  index: number;
  count: number;
  id: string;
  saved: boolean;
  ops: RowOps;
}) {
  const items = [
    ...(ops.duplicate
      ? [{ id: "duplicate", label: "Duplicate", icon: Copy01 }]
      : []),
    { id: "up", label: "Move up", icon: ArrowUp, isDisabled: index === 0 },
    {
      id: "down",
      label: "Move down",
      icon: ArrowDown,
      isDisabled: index === count - 1,
    },
  ];
  return (
    <Dropdown.Root>
      <Dropdown.DotsButton aria-label={`Row ${n} actions`} className="mt-2" />
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu
          aria-label={`Row ${n} actions`}
          onAction={(key) => {
            if (key === "duplicate") ops.duplicate?.(id);
            if (key === "up") ops.move(id, index - 1);
            if (key === "down") ops.move(id, index + 1);
            if (key === "remove") ops.remove(id);
          }}
        >
          {[
            ...items.map((item) => (
              <Dropdown.Item
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                isDisabled={item.isDisabled}
              />
            )),
            ...(saved
              ? []
              : [
                  <Dropdown.Separator key="sep" />,
                  <Dropdown.Item
                    key="remove"
                    id="remove"
                    label="Remove row"
                    icon={Trash01}
                    destructive
                  />,
                ]),
          ]}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

function AvailableSwitch({
  n,
  entry,
  onChange,
}: {
  n: number;
  entry: CvEntry;
  onChange: (patch: Partial<CvEntry>) => void;
}) {
  return (
    <div className="pt-2">
      <Toggle
        size="sm"
        aria-label={`Available to users, row ${n}`}
        label={entry.status === "active" ? "Available" : "Hidden"}
        isSelected={entry.status === "active"}
        onChange={(on) => onChange({ status: on ? "active" : "inactive" })}
      />
    </div>
  );
}

/** One line above a grid saying what the switch means. */
export function AvailabilityNote() {
  return (
    <p className="text-sm text-balance text-tertiary">
      Available to users: switch off to hide a value from forms&apos; dropdowns.
      Records that already hold it keep it.
    </p>
  );
}

// ── Reference ──

export function EntriesGrid({
  widthKey,
  draft,
  savedIds,
  errors,
  upload,
  ops,
  onChange,
  onAdd,
}: {
  /** Whose column widths to remember: the vocabulary's ID, or "new". */
  widthKey: string;
  draft: CvDraft;
  savedIds: Set<string>;
  errors: CvErrors;
  upload: Upload | null;
  ops: RowOps;
  onChange: (id: string, patch: Partial<CvEntry>) => void;
  onAdd: () => void;
}) {
  const widths = useColumnWidths(widthKey);
  const numbered = draft.idKind === "number";
  const showOrder = draft.fields.includes("order");
  // The typed columns, resizable. A typed Code leads them; a numbered ID has its own narrow column.
  const columns = [
    ...shownFields(draft)
      .filter((f) => f.id !== "order" && !(f.id === "code" && numbered))
      .map((f) => ({ id: f.id as string, label: f.label, required: !!f.required, custom: false })),
    ...draft.customColumns.map((c) => ({ id: c.id, label: c.label.trim() || "Custom column", required: false, custom: true })),
  ];
  const rows = withDerivedOrder(draft.entries);
  const total = tableWidth(
    columns.map((c) => widths.width(c.id)),
    [FIXED.handle, ...(showOrder ? [FIXED.order] : []), ...(numbered ? [FIXED.id] : []), FIXED.available, FIXED.menu],
  );

  return (
    <div className="flex flex-col gap-3">
      <GridCard>
        <table className="w-full table-fixed border-collapse" style={{ minWidth: total }}>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" style={{ width: FIXED.handle }} className="border-b border-secondary px-3 py-2">
                <span className="sr-only">Move</span>
              </th>
              {showOrder && <Th className="w-[88px]">Order</Th>}
              {numbered && <Th className="w-[88px]">{identifierLabel(draft.idKind)}</Th>}
              {columns.map((c) => (
                <ResizableTh key={c.id} id={c.id} label={c.label} required={c.required} widths={widths} className={thClass} />
              ))}
              <Th className="w-[176px]">Available to users</Th>
              <Spacer head />
              <th scope="col" style={{ width: FIXED.menu }} className={cx("border-b border-secondary px-3 py-2", STICKY, "bg-secondary")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <SortableBody ids={rows.map((e) => e.id)} onReorder={ops.reorder}>
            {rows.map((entry, i) => {
              const n = i + 1;
              const mark = upload?.added.has(entry.id) ? "New" : upload?.updated.has(entry.id) ? "Updated" : null;
              const idError = errors[`entry.${entry.id}.code`];
              return (
                <SortableRow key={entry.id} id={entry.id} className="[&:last-child>td]:border-b-0">
                  {(handle) => (
                    <>
                      <td className={td}>
                        <div className="flex flex-col items-start gap-1">
                          {handle}
                          {mark && (
                            <Badge size="sm" color={mark === "New" ? "success" : "brand"}>
                              {mark}
                            </Badge>
                          )}
                        </div>
                      </td>
                      {showOrder && <OrderCell id={entry.id} n={n} order={entry.order} count={rows.length} onMove={(to) => ops.move(entry.id, to)} />}
                      {numbered && (
                        <td className={td}>
                          <Input
                            aria-label={`ID, row ${n}`}
                            size="sm"
                            className="w-full"
                            inputMode="numeric"
                            inputClassName="tabular-nums"
                            value={entry.code}
                            onChange={(v) => onChange(entry.id, { code: v })}
                            isInvalid={!!idError}
                            hint={idError}
                          />
                        </td>
                      )}
                      {columns.map((c) => {
                        const error = c.custom ? undefined : errors[`entry.${entry.id}.${c.id}`];
                        return (
                          <td key={c.id} className={td}>
                            <Input
                              aria-label={`${c.label}, row ${n}`}
                              size="sm"
                              className="w-full"
                              placeholder="Value"
                              value={c.custom ? (entry.custom[c.id] ?? "") : entry[c.id as keyof CvEntry] as string}
                              onChange={(v) => onChange(entry.id, c.custom ? { custom: { ...entry.custom, [c.id]: v } } : { [c.id]: v })}
                              isInvalid={!!error}
                              hint={error}
                            />
                          </td>
                        );
                      })}
                      <td className={td}>
                        <AvailableSwitch n={n} entry={entry} onChange={(patch) => onChange(entry.id, patch)} />
                      </td>
                      <Spacer />
                      <td className={cx(td, STICKY, "bg-primary")}>
                        <RowMenu n={n} index={i} count={rows.length} id={entry.id} saved={savedIds.has(entry.id)} ops={ops} />
                      </td>
                    </>
                  )}
                </SortableRow>
              );
            })}
          </SortableBody>
        </table>
      </GridCard>
      <div>
        <Button color="link-color" size="md" iconLeading={Plus} onPress={onAdd}>
          Add row
        </Button>
      </div>
    </div>
  );
}

// ── Descriptive ──

/**
 * The Figma's Descriptive grid: the same rows as Reference, but every cell is a search and select
 * over that column's values in the source table. Picking in any cell picks that table row, and the
 * row's other cells show its other values: an entry is one row of the table, never a mix. Nothing is
 * typed or copied; the entry keeps only the row's key (REQ-18.4).
 */
export function DescriptiveGrid({
  widthKey,
  draft,
  savedIds,
  errors,
  ops,
  onChange,
  onAdd,
}: {
  /** Whose column widths to remember: the vocabulary's ID, or "new". */
  widthKey: string;
  draft: CvDraft;
  savedIds: Set<string>;
  errors: CvErrors;
  ops: RowOps;
  onChange: (id: string, patch: Partial<CvEntry>) => void;
  onAdd: () => void;
}) {
  const widths = useColumnWidths(widthKey);
  const table = sourceTable(draft.sourceTable);
  if (!table) return <p className="text-sm text-tertiary">Choose the source table in Details first.</p>;
  const showOrder = draft.fields.includes("order");
  const fields = [
    ...shownFields(draft)
      .filter((f) => f.id !== "order")
      .map((f) => ({ id: f.id as string, label: f.id === "code" ? identifierLabel(draft.idKind) : f.label, required: !!f.required })),
    ...draft.customColumns.map((c) => ({ id: c.id, label: c.label.trim() || "Custom column", required: false })),
  ];
  const rows = withDerivedOrder(draft.entries.map((e) => resolveEntry(draft, e)));
  const unmapped = fields.filter((f) => !draft.mapping[f.id]?.length);
  const total = tableWidth(
    fields.map((f) => widths.width(f.id)),
    [FIXED.handle, ...(showOrder ? [FIXED.order] : []), FIXED.available, FIXED.menu],
  );

  return (
    <div className="flex flex-col gap-3">
      {unmapped.length > 0 && <p className="text-sm text-balance text-tertiary">Not read from the table yet: {unmapped.map((f) => f.label).join(", ")}. Choose their columns in Columns.</p>}
      <GridCard>
        <table className="w-full table-fixed border-collapse" style={{ minWidth: total }}>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" style={{ width: FIXED.handle }} className="border-b border-secondary px-3 py-2">
                <span className="sr-only">Move</span>
              </th>
              {showOrder && <Th className="w-[88px]">Order</Th>}
              {fields.map((f) => (
                <ResizableTh key={f.id} id={f.id} label={f.label} required={f.required} widths={widths} className={thClass} />
              ))}
              <Th className="w-[176px]">Available to users</Th>
              <Spacer head />
              <th scope="col" style={{ width: FIXED.menu }} className={cx("border-b border-secondary px-3 py-2", STICKY, "bg-secondary")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <SortableBody ids={rows.map((e) => e.id)} onReorder={ops.reorder}>
            {rows.map((entry, i) => {
              const n = i + 1;
              const error = errors[`entry.${entry.id}.source`];
              const current = sourceRow(draft.sourceTable, entry.sourceKey);
              return (
                <SortableRow key={entry.id} id={entry.id} className="[&:last-child>td]:border-b-0">
                  {(handle) => (
                    <>
                      <td className={td}>{handle}</td>
                      {showOrder && <OrderCell id={entry.id} n={n} order={entry.order} count={rows.length} onMove={(to) => ops.move(entry.id, to)} />}
                      {fields.map((f, fi) => {
                        const columns = draft.mapping[f.id] ?? [];
                        // The other value shows beside each option in the list (a code beside a name), not in
                        // the cell, the same as the survey records' searchable fields (SearchSelect).
                        const items = columns.length ? table.rows.map((r) => ({ id: r[table.key], label: mappedValue(r, columns) })) : [];
                        const describe = (key: string) => {
                          const r = table.rows.find((x) => x[table.key] === key);
                          return r ? mappedValue(r, draft.mapping.name?.length && f.id !== "name" ? draft.mapping.name : draft.mapping.code) : undefined;
                        };
                        return (
                          <td key={f.id} className={td}>
                            <MultiSelect
                              aria-label={`${f.label}, row ${n}`}
                              selectionMode="single"
                              size="sm"
                              className="w-full"
                              placeholder={columns.length ? "Search and select" : "Not mapped"}
                              isDisabled={!columns.length}
                              items={items}
                              selectedKeys={new Set<Key>(current ? [current[table.key]] : [])}
                              onSelectionChange={(keys: Selection) => {
                                const next = keys === "all" ? undefined : Array.from(keys as Set<Key>)[0];
                                if (next != null) onChange(entry.id, { sourceKey: String(next) });
                              }}
                              isInvalid={!!error && fi === 0}
                              hint={fi === 0 ? error : undefined}
                            >
                              {(item) => <MultiSelect.Item {...item} supportingText={describe(String(item.id))} />}
                            </MultiSelect>
                          </td>
                        );
                      })}
                      <td className={td}>
                        <AvailableSwitch n={n} entry={entry} onChange={(patch) => onChange(entry.id, patch)} />
                      </td>
                      <Spacer />
                      <td className={cx(td, STICKY, "bg-primary")}>
                        <RowMenu n={n} index={i} count={rows.length} id={entry.id} saved={savedIds.has(entry.id)} ops={ops} />
                      </td>
                    </>
                  )}
                </SortableRow>
              );
            })}
          </SortableBody>
        </table>
      </GridCard>
      <div>
        <Button color="link-color" size="md" iconLeading={Plus} onPress={onAdd}>
          Add row
        </Button>
      </div>
    </div>
  );
}

// ── Column mapping (Descriptive, in the Columns step) ──

export function MappingTable({
  draft,
  errors,
  onMap,
}: {
  draft: CvDraft;
  errors: CvErrors;
  onMap: (fieldId: string, columns: string[]) => void;
}) {
  const table = sourceTable(draft.sourceTable);
  if (!table)
    return (
      <p className="text-sm text-tertiary">
        Choose the source table in Details first.
      </p>
    );
  const items = table.columns.map((c) => ({ id: c.id, label: c.label }));
  const rows = [
    ...shownFields(draft)
      .filter((f) => f.id !== "order")
      .map((f) => ({
        id: f.id as string,
        label: f.id === "code" ? identifierLabel(draft.idKind) : f.label,
        required: !!f.required,
      })),
    ...draft.customColumns.map((c) => ({
      id: c.id,
      label: c.label.trim() || "Custom column",
      required: false,
    })),
  ];
  const sample = table.rows[0];

  return (
    <GridCard>
      <table className="w-full min-w-max border-collapse">
        <thead className="bg-secondary">
          <tr>
            <Th>Column</Th>
            <Th>Read from</Th>
            <Th>First value</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = draft.mapping[row.id] ?? [];
            const error = errors[`map.${row.id}`];
            return (
              <tr key={row.id} className="[&:last-child>td]:border-b-0">
                <td
                  className={cx(
                    td,
                    "pt-4 text-sm font-medium whitespace-nowrap text-secondary",
                  )}
                >
                  {row.label}
                  {row.required && (
                    <span className="text-brand-tertiary"> *</span>
                  )}
                </td>
                <td className={td}>
                  <MultiSelect
                    aria-label={`${row.label} reads from`}
                    size="sm"
                    className="w-72"
                    placeholder="Search and select"
                    items={items}
                    selectedKeys={new Set<Key>(selected)}
                    onSelectionChange={(keys: Selection) =>
                      onMap(
                        row.id,
                        keys === "all"
                          ? items.map((i) => i.id)
                          : (Array.from(keys) as string[]),
                      )
                    }
                    onReset={() => onMap(row.id, [])}
                    selectedCountFormatter={() =>
                      selected
                        .map((c) => columnLabel(draft.sourceTable, c))
                        .join(" + ")
                    }
                    isInvalid={!!error}
                    hint={
                      error ??
                      (selected.length > 1
                        ? "Combined, in the order chosen"
                        : undefined)
                    }
                  >
                    {(item) => (
                      <MultiSelect.Item
                        {...item}
                        selectionIndicator="checkbox"
                        selectionIndicatorAlign="left"
                      />
                    )}
                  </MultiSelect>
                </td>
                <td
                  className={cx(
                    td,
                    "pt-4 text-sm whitespace-nowrap text-tertiary",
                  )}
                >
                  {sample && selected.length ? (
                    mappedValue(sample, selected)
                  ) : (
                    <span className="text-quaternary">Not mapped</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </GridCard>
  );
}

"use client";

// VERSION 3: a trap's trap effort, viewed and edited. Not from Figma (the designer's table, 28 Sept
// 2026). Each trap type brings its own fields (field-schema.ts):
//  - Number of traps and hauls are single values, shown as soon as the trap type is added.
//  - Durations are a list: a new trap type starts with one, and "Add duration" adds more, like
//    custom properties.
//  - Specs (Elliott and eFishing only) start empty and are picked one at a time from "Add spec",
//    which lists only that type's specs not added yet.
//
// Viewed, a trap type reads as two short lines: effort ("20 traps · 4 nights · 2 hours") and specs
// ("Length 30 cm · Width 8 cm").

import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { InputNumber } from "@/components/base/input/input-number";
import { Select } from "@/components/base/select/select";
import {
  TRAP_FIELDS,
  TRAP_TYPES,
  trapHas,
  trapSpecsFor,
  readTrapDuration,
  type TrapEntry,
  type TrapField,
  type TrapSpec,
  type TrapValue,
} from "./field-schema";
import { localId, type TrapEntryDraft } from "./record-form";

/**
 * A trap type's effort and specs, read: a small aligned list ("Number of traps 20", "Duration
 * 4 nights, 2 hours", then each spec), so values never break across lines.
 */
export function TrapEntryView({ entry }: { entry: TrapEntry }) {
  const rows: { label: string; value: string | string[]; muted?: boolean }[] =
    [];
  const count = entry.values.count?.value?.trim();
  if (count) rows.push({ label: "Number of traps", value: count });
  const seen = new Set<string>();
  const durations = (entry.durations ?? []).filter(
    (d) => d.value.trim() && !seen.has(d.unit ?? "") && seen.add(d.unit ?? ""),
  );
  if (durations.length)
    rows.push({
      label: "Duration",
      value: durations.map(readTrapDuration),
    });
  const hauls = entry.values.hauls?.value?.trim();
  if (hauls) rows.push({ label: "Hauls", value: hauls });
  (entry.specs ?? []).forEach((sp) => {
    const f = TRAP_FIELDS[sp.field];
    const v = sp.value.trim();
    rows.push({
      label: f.label,
      value: !v
        ? "Not provided"
        : f.unit === "%"
          ? `${v}%`
          : f.unit
            ? `${v} ${f.unit}`
            : v,
      muted: true,
    });
  });
  if (rows.length === 0)
    return <span className="text-quaternary">Not provided</span>;
  return (
    <span className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
      {rows.map((r) => (
        <span key={r.label} className="contents">
          <span className="whitespace-nowrap text-tertiary">{r.label}</span>
          {/* Several durations read one per line. */}
          <span className="flex flex-col">
            {(Array.isArray(r.value) ? r.value : [r.value]).map((v) => (
              <span key={v} className="whitespace-nowrap">
                {v}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/** "+ Add ..." that opens a menu of what can be added. */
function AddMenu({
  label,
  items,
  onAdd,
}: {
  label: string;
  items: { id: string; label: string; addon?: string }[];
  onAdd: (id: string) => void;
}) {
  return (
    <Dropdown.Root>
      <Button
        color="link-color"
        size="sm"
        iconLeading={Plus}
        isDisabled={items.length === 0}
        className="w-max"
      >
        {label}
      </Button>
      <Dropdown.Popover placement="bottom left" className="w-56">
        <Dropdown.Menu
          onAction={(key) => onAdd(String(key))}
          aria-label={label}
        >
          {items.map((item) => (
            <Dropdown.Item
              key={item.id}
              id={item.id}
              label={item.label}
              addon={item.addon}
            />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

const capitalise = (t: string) => t[0].toUpperCase() + t.slice(1);
const numberOf = (v: string) => (v.trim() === "" ? NaN : Number(v));
const fromNumber = (n: number) => (Number.isNaN(n) ? "" : String(n));

/** One trap type's fields, in edit mode. */
export function TrapEntryEditor({
  entry,
  name,
  showErrors,
  onChange,
  onRemove,
}: {
  entry: TrapEntryDraft;
  name: string;
  showErrors: boolean;
  onChange: (next: TrapEntryDraft) => void;
  onRemove: () => void;
}) {
  const singles = (["count", "hauls"] as const).filter((id) =>
    trapHas(entry.trapType, id),
  );
  const hasDuration = trapHas(entry.trapType, "duration");
  const specFields = trapSpecsFor(entry.trapType);
  const hasEffort = singles.length > 0 || hasDuration;
  const bad = (v: string) => showErrors && !v.trim();

  const setDuration = (rid: number | undefined, p: Partial<TrapValue>) =>
    onChange({
      ...entry,
      durations: entry.durations.map((d) =>
        d.rid === rid ? { ...d, ...p } : d,
      ),
    });
  const setSpec = (rid: number | undefined, p: Partial<TrapSpec>) =>
    onChange({
      ...entry,
      specs: entry.specs.map((s) => (s.rid === rid ? { ...s, ...p } : s)),
    });
  const unusedSpecs = specFields.filter(
    (f) => !entry.specs.some((s) => s.field === f.id),
  );

  const specControl = (s: TrapSpec, f: TrapField) =>
    f.options ? (
      <Select
        aria-label={`${name}, ${f.label.toLowerCase()}`}
        placeholder="Select"
        className="w-36"
        items={f.options.map((o) => ({ id: o, label: o }))}
        selectedKey={s.value || null}
        onSelectionChange={(k) => k && setSpec(s.rid, { value: String(k) })}
        isInvalid={bad(s.value)}
      >
        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
      </Select>
    ) : (
      <div className="flex items-center gap-2">
        <InputNumber
          aria-label={`${name}, ${f.label.toLowerCase()}`}
          placeholder="0"
          className="w-24"
          minValue={0}
          maxValue={f.max}
          value={numberOf(s.value)}
          onChange={(n) => setSpec(s.rid, { value: fromNumber(n) })}
          isInvalid={bad(s.value)}
        />
        {f.unit && <span className="text-sm text-tertiary">{f.unit}</span>}
      </div>
    );

  // One label-and-field grid for every row, so every input, "Add duration" and "Add spec" start on
  // the same edge, and every label sits in the same column.
  const label = (text: string) => (
    <span className="pt-2 text-sm text-tertiary">{text}</span>
  );
  const heading = (text: string, first: boolean) => (
    <p
      className={`col-span-2 text-xs font-semibold text-secondary ${first ? "" : "pt-2"}`}
    >
      {text}
    </p>
  );
  // Delete icons show on hover (or keyboard focus) only: a row's own icon with its row, the trap
  // type's icon with the whole trap type.
  const removeButton = (
    aria: string,
    onPress: () => void,
    scope: "row" | "entry" = "row",
  ) => (
    <Button
      color="tertiary"
      size="sm"
      iconLeading={Trash01}
      aria-label={aria}
      onClick={onPress}
      className={
        scope === "row"
          ? "opacity-0 transition-opacity group-focus-within/traprow:opacity-100 group-hover/traprow:opacity-100 focus-visible:opacity-100"
          : "opacity-0 transition-opacity group-focus-within/editrow:opacity-100 group-hover/editrow:opacity-100 focus-visible:opacity-100"
      }
    />
  );

  return (
    <div className="flex items-start gap-2">
      <div className="grid min-w-0 flex-1 grid-cols-[8rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3">
        {/* Three groups, each under its own heading: Effort (number of traps, hauls), Duration (one
            row per unit, the unit as its label), Specs (one row per spec). */}
        {singles.length > 0 && heading("Effort", true)}
        {singles.map((id) => (
          <div key={id} className="contents">
            {label(TRAP_FIELDS[id].label)}
            <InputNumber
              aria-label={`${name}, ${TRAP_FIELDS[id].label.toLowerCase()}`}
              placeholder="0"
              className="w-24"
              minValue={0}
              value={numberOf(entry.values[id]?.value ?? "")}
              onChange={(n) =>
                onChange({
                  ...entry,
                  values: { ...entry.values, [id]: { value: fromNumber(n) } },
                })
              }
              isInvalid={bad(entry.values[id]?.value ?? "")}
            />
          </div>
        ))}
        {hasDuration && (
          <>
            {heading("Duration", singles.length === 0)}
            {entry.durations.map((d, i) => (
              <div key={d.rid ?? i} className="group/traprow contents">
                {label(capitalise(d.unit ?? "Duration"))}
                <div className="flex items-center gap-2">
                  <div className="w-24 shrink-0">
                    <InputNumber
                      aria-label={`${name}, ${d.unit ?? "duration"}`}
                      placeholder="0"
                      className="w-full"
                      minValue={1}
                      value={numberOf(d.value)}
                      onChange={(n) =>
                        setDuration(d.rid, { value: fromNumber(n) })
                      }
                      isInvalid={bad(d.value)}
                    />
                  </div>
                  {removeButton(`Remove ${name} ${d.unit ?? "duration"}`, () =>
                    onChange({
                      ...entry,
                      durations: entry.durations.filter((x) => x.rid !== d.rid),
                    }),
                  )}
                </div>
              </div>
            ))}
            <div className="col-span-2 -mt-1">
              <AddMenu
                label="Add duration"
                items={TRAP_FIELDS.duration
                  .units!.filter(
                    (u) => !entry.durations.some((d) => d.unit === u),
                  )
                  .map((u) => ({ id: u, label: capitalise(u) }))}
                onAdd={(unit) =>
                  onChange({
                    ...entry,
                    durations: [
                      ...entry.durations,
                      { value: "", unit, rid: localId() },
                    ],
                  })
                }
              />
            </div>
          </>
        )}

        {specFields.length > 0 && (
          <>
            {heading("Specs", !hasEffort)}
            {entry.specs.map((s) => {
              const f = TRAP_FIELDS[s.field];
              return (
                <div key={s.rid ?? s.field} className="contents">
                  {label(f.label)}
                  <div className="group/traprow flex items-center gap-2">
                    {specControl(s, f)}
                    {removeButton(
                      `Remove ${name} ${f.label.toLowerCase()}`,
                      () =>
                        onChange({
                          ...entry,
                          specs: entry.specs.filter((x) => x.rid !== s.rid),
                        }),
                    )}
                  </div>
                </div>
              );
            })}
            <div className="col-span-2 -mt-1">
              <AddMenu
                label="Add spec"
                items={unusedSpecs.map((f) => ({
                  id: f.id,
                  label: f.label,
                  addon: f.unit,
                }))}
                onAdd={(id) =>
                  onChange({
                    ...entry,
                    specs: [
                      ...entry.specs,
                      {
                        field: id as TrapSpec["field"],
                        value: "",
                        rid: localId(),
                      },
                    ],
                  })
                }
              />
            </div>
          </>
        )}
      </div>
      {removeButton(`Remove ${name}`, onRemove, "entry")}
    </div>
  );
}

/** "Add trap type": every type, since a type can be listed more than once (two fishing-line sets). */
export function AddTrapType({ onAdd }: { onAdd: (trapType: string) => void }) {
  return (
    <AddMenu
      label="Add trap type"
      items={TRAP_TYPES.map((t) => ({
        id: t,
        label: t,
        addon: trapSpecsFor(t).length > 0 ? "with specs" : undefined,
      }))}
      onAdd={onAdd}
    />
  );
}

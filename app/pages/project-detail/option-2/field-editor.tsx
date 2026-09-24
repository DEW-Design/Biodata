"use client";

// Generic "view a field, edit a field" primitive - the piece project-detail/option-1 never had
// (that page's own DetailRow is permanently read-only; editing was explicitly logged as future
// work on observation-detail/option-1 - see that file's own header comment). Built directly off
// the Figma "Details Container" edit-mode frames (wer8CgO1UoCH3aQw2jQkdy, node 2526:58529) - every
// one of the 15 record-type frames there stacks a read-only view of a section directly above an
// editable version of the exact same fields: plain text inputs, "Please Select" dropdowns, an
// "N Selected" multi-select, a "Select dates" date-picker button, Yes/No radios, and a repeatable
// Property/Value/Description row editor for Custom Property. This file is the one shared
// implementation of that pattern - a field declares its own type once, and renders as either a
// plain label/value row or the matching real DEW input, controlled by whichever mode the section
// around it is in.
//
// No real backend exists anywhere in this build - Save doesn't persist to a server, it commits the
// section's draft values back into this page's own in-memory record store (see
// app/pages/project-detail/option-2/record-store.ts) so the edit is honestly visible for the rest
// of the session, and shows the same "not really persisted" toast this build already uses
// elsewhere (project-registration's own "Save Draft").

import { useState, type ReactNode } from "react";
import type { DateValue } from "react-aria-components";
import { Edit02, Check, X as XIcon, Plus, Trash01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { Textarea } from "@/components/custom/textarea/textarea";
import { Select } from "@/components/base/select/select";
import { MultiSelect } from "@/components/base/select/multi-select";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/application/toast/toast";
import { cx } from "@/utils/cx";

const DASH = "-";

export type FieldType = "text" | "textarea" | "select" | "multiselect" | "date" | "number" | "boolean" | "readonly";

export interface FieldOption {
  id: string;
  label: string;
}

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  unit?: string;
  placeholder?: string;
}

export type FieldValue = string | string[] | DateValue | null;

export type FieldValues = Record<string, FieldValue>;

function field(id: string, label: string, type: FieldType = "text", extra?: Partial<FieldSpec>): FieldSpec {
  return { id, label, type, ...extra };
}

/** Every helper below builds a `FieldSpec[]`, not raw JSX - one field model backs both the
 *  read-only display and the editable control, so the two can never show a different set of
 *  fields for the same section. */
export const specs = { field };

const MULTI_TEXT_JOIN = ", ";

export function displayValue(spec: FieldSpec, value: FieldValue): ReactNode {
  if (spec.type === "multiselect") {
    const values = Array.isArray(value) ? value : [];
    if (values.length === 0) return DASH;
    return values.map((id) => spec.options?.find((o) => o.id === id)?.label ?? id).join(MULTI_TEXT_JOIN);
  }
  if (spec.type === "select") {
    if (!value || typeof value !== "string") return DASH;
    return spec.options?.find((o) => o.id === value)?.label ?? value;
  }
  if (spec.type === "boolean") {
    return value === "yes" ? "Yes" : value === "no" ? "No" : DASH;
  }
  if (spec.type === "date") {
    return value && typeof value === "object" && "toString" in value ? formatDateValue(value as DateValue) : DASH;
  }
  if (spec.type === "number") {
    return value === null || value === undefined || value === "" ? DASH : `${value}${spec.unit ? ` ${spec.unit}` : ""}`;
  }
  return typeof value === "string" && value.trim() ? value : DASH;
}

function formatDateValue(value: DateValue): string {
  try {
    return `${String(value.day).padStart(2, "0")}/${String(value.month).padStart(2, "0")}/${value.year}`;
  } catch {
    return DASH;
  }
}

/** The one edit-mode control for a field, with no visible label of its own - `FieldRow` supplies
 *  the label as a separate column (see below), an `aria-label` carries it for accessibility. */
function FieldControl({ spec, value, onChange }: { spec: FieldSpec; value: FieldValue; onChange: (next: FieldValue) => void }) {
  switch (spec.type) {
    case "textarea":
      return (
        <Textarea
          aria-label={spec.label}
          placeholder={spec.placeholder ?? `Enter ${spec.label.toLowerCase()}…`}
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
        />
      );
    case "select":
      return (
        <Select
          aria-label={spec.label}
          placeholder="Please Select"
          items={spec.options ?? []}
          selectedKey={typeof value === "string" ? value : null}
          onSelectionChange={(key) => onChange(key ? String(key) : null)}
        >
          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
        </Select>
      );
    case "multiselect": {
      const items = spec.options ?? [];
      const values = Array.isArray(value) ? value : [];
      return (
        <MultiSelect
          aria-label={spec.label}
          placeholder={spec.placeholder ?? "Please Select"}
          items={items}
          selectedKeys={new Set(values)}
          onSelectionChange={(keys) => onChange(Array.from(keys as Set<string>))}
          onReset={() => onChange([])}
          onSelectAll={() => onChange(items.map((o) => o.id))}
        >
          {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
        </MultiSelect>
      );
    }
    case "date":
      return <InputDatePicker aria-label={spec.label} value={value && typeof value === "object" ? (value as DateValue) : null} onChange={(v) => onChange(v)} className="w-full" />;
    case "number":
      return (
        <InputNumber
          aria-label={spec.label}
          placeholder="00"
          value={typeof value === "string" && value !== "" ? Number(value) : undefined}
          onChange={(n) => onChange(n === undefined || n === null ? "" : String(n))}
        />
      );
    case "boolean":
      return (
        <RadioGroup aria-label={spec.label} orientation="horizontal" value={typeof value === "string" ? value : null} onChange={(v) => onChange(v)} className="gap-6 pt-2.5">
          <RadioButton value="yes" label="Yes" size="sm" />
          <RadioButton value="no" label="No" size="sm" />
        </RadioGroup>
      );
    default:
      return (
        <Input aria-label={spec.label} placeholder={spec.placeholder ?? `Enter ${spec.label.toLowerCase()}…`} value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v)} />
      );
  }
}

/** One field row - a plain label/value pair in view mode, the field name on the left and its real
 *  matching DEW control on the right in edit mode (Figma's own "Details Container" edit-mode
 *  frames, wer8CgO1UoCH3aQw2jQkdy node 2526:59792 - every field is its own row, a fixed-width
 *  label column with the control taking the rest of the row, never a control with its own label
 *  stacked above it). Both modes share the same label column width so a row doesn't shift
 *  horizontally when its section switches between them. */
export function FieldRow({ spec, value, editing, onChange }: { spec: FieldSpec; value: FieldValue; editing: boolean; onChange: (next: FieldValue) => void }) {
  if (!editing || spec.type === "readonly") {
    return (
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
        <span className="shrink-0 text-sm text-secondary sm:w-44">{spec.label}</span>
        <span className="min-w-0 flex-1 text-sm font-medium text-primary">{displayValue(spec, value)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-6">
      <span className="shrink-0 pt-2.5 text-sm text-secondary sm:w-44">{spec.label}</span>
      <div className="min-w-0 flex-1">
        <FieldControl spec={spec} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export interface CustomPropertyRow {
  id: number;
  name: string;
  value: string;
  description: string;
}

export function emptyCustomPropertyRow(id: number): CustomPropertyRow {
  return { id, name: "", value: "", description: "" };
}

/** The one section every record type shares that isn't a fixed field list - Figma's own "Property
 *  name / Value / Description" repeatable row editor with a trailing "+ Add Additional Property"
 *  action (node 2526:59727 and siblings, the Custom Property section of every edit-mode frame). */
export function CustomPropertyEditor({ rows, editing, onChange }: { rows: CustomPropertyRow[]; editing: boolean; onChange: (rows: CustomPropertyRow[]) => void }) {
  const update = (id: number, patch: Partial<CustomPropertyRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, emptyCustomPropertyRow(Math.max(0, ...rows.map((r) => r.id)) + 1)]);
  const remove = (id: number) => onChange(rows.filter((r) => r.id !== id));

  if (!editing) {
    const populated = rows.filter((r) => r.name.trim() || r.value.trim());
    if (populated.length === 0) {
      return <p className="text-sm text-tertiary">No custom properties added.</p>;
    }
    return (
      <div className="flex flex-col gap-4">
        {populated.map((row) => (
          <div key={row.id} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <span className="shrink-0 text-sm text-secondary sm:w-44">{row.name || DASH}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-primary">{row.value || DASH}</span>
              {row.description && <span className="text-xs text-tertiary">{row.description}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-tertiary">Add any extra information that isn&apos;t covered by the standard fields.</p>
      {rows.map((row) => (
        <div key={row.id} className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary/40 p-3">
          <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
            <Input label="Property name" aria-label="Property name" value={row.name} onChange={(v) => update(row.id, { name: v })} />
            <Input label="Value" aria-label="Value" value={row.value} onChange={(v) => update(row.id, { value: v })} />
            <Button color="secondary" size="md" iconLeading={Trash01} aria-label="Remove property" isDisabled={rows.length === 1} onClick={() => remove(row.id)} />
          </div>
          <Textarea label="Description" aria-label="Description" placeholder="Enter a description…" rows={2} value={row.description} onChange={(v) => update(row.id, { description: v })} />
        </div>
      ))}
      <Button color="secondary" size="md" iconLeading={Plus} className="w-full" onClick={add}>
        Add Additional Property
      </Button>
    </div>
  );
}

/** One accordion section's worth of fields, with its own Edit/Save/Cancel affordance - matches
 *  this file's own "edit one section at a time" scope, not one giant page-wide form. `values` is
 *  this section's committed values (from the page's own record store); Save commits `draft` back
 *  up via `onSave`, Cancel discards `draft` and reverts to `values`. */
export function FieldSection({
  fields,
  values,
  onSave,
  customProperty,
  startEditing = false,
  onDone,
}: {
  fields: FieldSpec[];
  values: FieldValues;
  onSave: (next: FieldValues) => void;
  /** When set, this section renders CustomPropertyEditor instead of a plain field list - Custom
   *  Property's own repeatable-row shape doesn't fit the fixed label/value FieldRow model. */
  customProperty?: { rows: CustomPropertyRow[]; onChange: (rows: CustomPropertyRow[]) => void };
  /** Mounts already in edit mode, with no separate "Edit" trigger of its own - for a caller that
   *  already gated entry into editing behind its own affordance (e.g. a side panel opened by a
   *  dedicated Edit icon), so this component doesn't show a second, redundant one. Additive -
   *  defaults to false, every existing caller keeps its own inline Edit button unchanged. */
  startEditing?: boolean;
  /** Called after Cancel or Save when `startEditing` is set, so the caller (the side panel) can
   *  close itself - there's no "view mode" to fall back into inside a dedicated edit panel. */
  onDone?: () => void;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState<FieldValues>(values);
  const [draftRows, setDraftRows] = useState<CustomPropertyRow[]>(customProperty?.rows ?? []);

  const beginEditing = () => {
    setDraft(values);
    if (customProperty) setDraftRows(customProperty.rows);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(values);
    if (customProperty) setDraftRows(customProperty.rows);
    setEditing(false);
    onDone?.();
  };

  const save = () => {
    onSave(draft);
    if (customProperty) customProperty.onChange(draftRows);
    setEditing(false);
    toast.brand("Changes saved", { description: "This is a demo build with no real backend - your edit is kept for this session only." });
    onDone?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        {editing ? (
          <>
            <Button color="secondary" size="sm" iconLeading={XIcon} onClick={cancel}>
              Cancel
            </Button>
            <Button color="primary" size="sm" iconLeading={Check} onClick={save}>
              Save
            </Button>
          </>
        ) : (
          <Button color="secondary" size="sm" iconLeading={Edit02} onClick={beginEditing}>
            Edit
          </Button>
        )}
      </div>
      {customProperty ? (
        <CustomPropertyEditor rows={editing ? draftRows : customProperty.rows} editing={editing} onChange={setDraftRows} />
      ) : (
        <div className={cx("flex flex-col gap-4", editing && "gap-4")}>
          {fields.map((spec) => (
            <FieldRow
              key={spec.id}
              spec={spec}
              value={editing ? draft[spec.id] : values[spec.id]}
              editing={editing}
              onChange={(next) => setDraft((d) => ({ ...d, [spec.id]: next }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

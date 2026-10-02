"use client";

import { Fragment, useState } from "react";
import { parseDate } from "@internationalized/date";
import { ArrowNarrowLeft, Plus, Bell01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { ATTRIBUTE_COLUMNS, ATTRIBUTE_FILTERS, NOTIFICATION_COLUMNS, type FieldDef, type GridSection, type Row, type TableDef } from "@/app/pages/_shared/taxonomy/tx-data";
import { cx } from "@/utils/cx";

// The controls every Taxonomy Management field is drawn with, from the field declarations in
// tx-data.ts. Real DEW components only (CONTRACTS 4.1 item 7): Select, Input, TextArea, Checkbox and
// the calendar date field (2.11). An empty value is left empty in a control and reads "Not provided"
// when shown as text (2.3); Figma's "-" placeholders are not reproduced.

export const NOT_PROVIDED = "Not provided";

/** A value change, and what it clears: a new Higher Taxa Level empties Higher Taxa Name, whose list depends on it. */
export function withValue(values: Record<string, string>, id: string, v: string): Record<string, string> {
  return id === "higherTaxaLevel" && v !== values.higherTaxaLevel ? { ...values, [id]: v, higherTaxaName: "" } : { ...values, [id]: v };
}

/**
 * How a row reads in view mode. The Higher Taxa pair is one fact: the chosen level is its label and the
 * name its value ("Order: Myrtales"), not two fields (the designer, Sept 30 2026).
 */
function viewRow(row: FieldDef[], values: Record<string, string>): FieldDef[] {
  const level = row.find((d) => d.id === "higherTaxaLevel");
  if (!level || !row.some((d) => d.id === "higherTaxaName")) return row;
  const merged: FieldDef = { id: "higherTaxaName", label: values.higherTaxaLevel || "Higher Taxa Name", kind: "select", span: 1 };
  return row.flatMap((d) => (d.id === "higherTaxaLevel" ? [merged] : d.id === "higherTaxaName" ? [] : [d]));
}

const toItems = (options: string[] | undefined, value: string) => {
  const list = options ?? [];
  const all = value && !list.includes(value) ? [value, ...list] : list;
  return all.map((o) => ({ id: o, label: o }));
};

function safeDate(v: string) {
  try {
    return v ? parseDate(v) : null;
  } catch {
    return null;
  }
}

/** One field as a control. `label` is off inside a table, where the column header names it. */
export function FieldControl({
  def,
  values,
  onChange,
  showLabel = true,
  idPrefix = "",
}: {
  def: FieldDef;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  showLabel?: boolean;
  idPrefix?: string;
}) {
  const value = values[def.id] ?? "";
  const label = showLabel ? def.label : undefined;
  const aria = showLabel ? undefined : `${idPrefix}${def.label}`;

  switch (def.kind) {
    case "readonly":
      return (
        <div className="flex flex-col gap-1.5">
          {label && <p className="text-sm font-medium text-secondary">{label}</p>}
          <p className={cx("text-sm", value ? "text-primary" : "text-quaternary")}>{value || NOT_PROVIDED}</p>
        </div>
      );
    case "text":
      return <Input size="sm" label={label} aria-label={aria} value={value} onChange={(v) => onChange(def.id, v)} />;
    case "textarea":
      return <TextArea label={label} aria-label={aria} rows={3} value={value} onChange={(v) => onChange(def.id, v)} />;
    case "date":
      return <InputDatePicker label={label} aria-label={aria ?? def.label} value={safeDate(value)} onChange={(v) => onChange(def.id, v ? v.toString() : "")} />;
    case "checkbox":
      return <Checkbox aria-label={aria ?? def.label} label={label} isSelected={value === "Yes"} onChange={(on) => onChange(def.id, on ? "Yes" : "")} />;
    case "textPair":
      return (
        <div className="flex flex-col gap-1.5">
          {label && <p className="text-sm font-medium text-secondary">{label}</p>}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
            <Input size="sm" aria-label={`${def.label}, first part`} value={value} onChange={(v) => onChange(def.id, v)} />
            <Input size="sm" aria-label={`${def.label}, second part`} value={values[`${def.id}__text`] ?? ""} onChange={(v) => onChange(`${def.id}__text`, v)} />
          </div>
        </div>
      );
    case "selectText":
      return (
        <div className="flex flex-col gap-1.5">
          {label && <p className="text-sm font-medium text-secondary">{label}</p>}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
            <Select size="sm" aria-label={`${def.label} code`} placeholder="Select" items={toItems(def.options, value)} selectedKey={value || null} onSelectionChange={(k) => onChange(def.id, String(k ?? ""))}>
              {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
            </Select>
            <Input
              size="sm"
              aria-label={`${def.label} description`}
              isDisabled={def.textReadOnly}
              value={def.textReadOnly ? value : (values[`${def.id}__text`] ?? "")}
              onChange={(v) => onChange(`${def.id}__text`, v)}
            />
          </div>
        </div>
      );
    default:
      return (
        <Select size="sm" label={label} aria-label={aria} placeholder="Select" items={toItems(def.options, value)} selectedKey={value || null} onSelectionChange={(k) => onChange(def.id, String(k ?? ""))}>
          {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
        </Select>
      );
  }
}

// Every row sits on one six-column grid, so rows line up the way the Figma draws them: three fields
// take a third each; two fields take half each, or a third each where the section is `aligned` (the
// Higher Taxa row over Family / Order / Major Group); a lone field takes half; a comment or a code
// with its description takes the row.
const SPAN6: Record<number, string> = { 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4", 6: "sm:col-span-6" };
function spanOf(def: FieldDef, row: FieldDef[], aligned?: boolean): string {
  if (row.length === 1) return SPAN6[def.kind === "textarea" ? 6 : def.kind === "selectText" && !def.span ? 4 : def.span ? def.span * 2 : 3];
  if (row.length === 3) return SPAN6[2];
  // In an aligned section a name and its Author ("Subspecific", "Author") keep the Author in the
  // Author column of the Genus / Species / Author row above: the name takes two thirds.
  if (aligned && row[1].label === "Author") return SPAN6[def === row[0] ? 4 : 2];
  return SPAN6[aligned ? (def.span ? def.span * 2 : 2) : 3];
}

/** Rows of fields in the Figma's grid, sections divided by a rule. */
export function FieldGrid({ sections, values, onChange }: { sections: GridSection[]; values: Record<string, string>; onChange: (id: string, value: string) => void }) {
  return (
    <div className="flex flex-col">
      {sections.map((section, i) => (
        <div key={section.title ?? i} className="flex flex-col gap-4 border-t border-secondary py-5 first:border-t-0 first:pt-0 last:pb-0">
          {section.title && <p className="text-sm font-semibold text-primary">{section.title}</p>}
          {section.rows.map((row, r) => (
            <div key={r} className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              {row.map((def) => (
                <div key={def.id} className={cx("min-w-0", spanOf(def, row, section.aligned))}>
                  <FieldControl def={def} values={values} onChange={onChange} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A field's value as text: a code with its description, or both halves of a pair. */
export function fieldText(def: FieldDef, values: Record<string, string>): string {
  const v = values[def.id] ?? "";
  if (def.kind === "selectText" && def.textReadOnly) return v;
  if (def.kind === "selectText" || def.kind === "textPair") return [v, values[`${def.id}__text`] ?? ""].filter(Boolean).join(" - ");
  if (def.kind === "checkbox") return v === "Yes" ? "Yes" : "";
  return v;
}

/**
 * The same grid as `FieldGrid`, read only: each label over its value, in the Figma's columns, so the
 * view and the edit of a card line up field for field.
 */
export function FieldGridView({ sections, values }: { sections: GridSection[]; values: Record<string, string> }) {
  return (
    <div className="flex flex-col">
      {sections.map((section, i) => (
        <div key={section.title ?? i} className="flex flex-col gap-4 border-t border-secondary py-5 first:border-t-0 first:pt-0 last:pb-0">
          {section.title && <p className="text-sm font-semibold text-primary">{section.title}</p>}
          {section.rows.map((raw, r) => {
            const row = viewRow(raw, values);
            return (
            <dl key={r} className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              {row.map((def) => {
                const v = fieldText(def, values);
                return (
                  <div key={def.id} className={cx("flex min-w-0 flex-col gap-1.5", spanOf(def, row, section.aligned))}>
                    <dt className="text-sm font-medium text-secondary">{def.label}</dt>
                    <dd className={cx("text-sm break-words whitespace-pre-line", v ? "text-primary" : "text-quaternary")}>{v || NOT_PROVIDED}</dd>
                  </div>
                );
              })}
            </dl>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const colWidth = (def: FieldDef) =>
  def.kind === "checkbox" ? "w-24" : def.kind === "date" ? "w-48" : def.id === "seq" || def.id === "num" ? "w-20" : def.id === "description" || def.id === "comment" || def.id === "adherbName" || def.id === "name" || def.id === "species" || def.id === "comments" || def.id === "criteria" || def.id === "source" ? "w-64" : def.kind === "select" ? "w-40" : "w-36";

/**
 * A repeating group of fields, as the Figma draws the table tabs: a header row of labels over rows of
 * controls, scrolling sideways when it is wider than the panel. Figma draws eight empty rows; here a
 * table shows its rows (at least three to fill in) and "Add row" adds one.
 */
export function FieldTable({ table, rows, onChange }: { table: TableDef; rows: Row[]; onChange: (rows: Row[]) => void }) {
  const shown = rows.length >= 3 ? rows : [...rows, ...Array.from({ length: 3 - rows.length }, () => ({}) as Row)];
  const update = (i: number, id: string, value: string) => onChange(shown.map((r, j) => (j === i ? { ...r, [id]: value } : r)));
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max gap-x-3 gap-y-2" style={{ gridTemplateColumns: `repeat(${table.columns.length}, auto)` }}>
          {table.sharedHeader ? (
            <p className="text-sm font-medium text-secondary" style={{ gridColumn: `span ${table.columns.length}` }}>
              {table.sharedHeader}
            </p>
          ) : (
            table.columns.map((c) => (
              <p key={c.id} className={cx("self-end text-sm font-medium text-balance text-secondary", colWidth(c))}>
                {c.label}
              </p>
            ))
          )}
          {shown.map((row, i) => (
            <Fragment key={i}>
              {table.columns.map((c) => (
                <div key={c.id} className={cx(colWidth(c), c.kind === "checkbox" && "flex items-center justify-center")}>
                  <FieldControl def={c} values={row} showLabel={false} idPrefix={`Row ${i + 1}, `} onChange={(id, v) => update(i, id, v)} />
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
      <div>
        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => onChange([...shown, {}])}>
          Add row
        </Button>
      </div>
    </div>
  );
}

/** Attributes: the filter bar and table, and the "Personal Notifications" list its button opens. */
export function AttributesPanel({
  rows,
  notifications,
  onRowsChange,
  onNotificationsChange,
  showHeading = true,
}: {
  /** Off where a card around the panel already says "Attributes". */
  showHeading?: boolean;
  rows: Row[];
  notifications: Row[];
  onRowsChange: (rows: Row[]) => void;
  onNotificationsChange: (rows: Row[]) => void;
}) {
  const [view, setView] = useState<"attributes" | "notifications">("attributes");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const matchIdx = rows.flatMap((r, i) => (ATTRIBUTE_FILTERS.every((f) => !filters[f.id] || r[f.id] === filters[f.id]) ? [i] : []));
  const filtered = matchIdx.map((i) => rows[i]);
  // Edits to a filtered view go back to the rows they came from; a new row is added at the end.
  const editFiltered = (next: Row[]) => {
    const all = [...rows];
    next.forEach((r, j) => (j < matchIdx.length ? (all[matchIdx[j]] = r) : all.push(r)));
    onRowsChange(all);
  };

  if (view === "notifications")
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button color="tertiary" size="sm" iconLeading={ArrowNarrowLeft} onClick={() => setView("attributes")}>
            Attributes
          </Button>
          <p className="text-sm font-semibold text-primary">Manage Personal Notifications</p>
        </div>
        <FieldTable table={{ id: "notifications", title: "Manage Personal Notifications", columns: NOTIFICATION_COLUMNS }} rows={notifications} onChange={onNotificationsChange} />
      </div>
    );

  const distinct = (id: string) => [...new Set(rows.map((r) => r[id]).filter(Boolean))];
  return (
    <div className="flex flex-col gap-4">
      <div className={cx("flex items-center gap-3", showHeading ? "justify-between" : "justify-end")}>
        {showHeading && <p className="text-sm font-semibold text-primary">Attributes</p>}
        <Button iconLeading={Bell01} color="secondary" size="sm" onClick={() => setView("notifications")}>
          Personal Notifications
        </Button>
      </div>
      <div className="grid gap-3 rounded-xl bg-secondary p-4 ring-1 ring-secondary ring-inset sm:grid-cols-2 xl:grid-cols-4">
        {ATTRIBUTE_FILTERS.map((def) => (
          <FieldControl key={def.id} def={{ ...def, options: distinct(def.id) }} values={filters} onChange={(id, v) => setFilters((s) => ({ ...s, [id]: v }))} />
        ))}
      </div>
      <FieldTable table={{ id: "attributes", title: "Attributes", columns: ATTRIBUTE_COLUMNS }} rows={filtered} onChange={editFiltered} />
    </div>
  );
}

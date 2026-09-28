"use client";

// Shared "Concept / Value" repeatable row editor - used by the Species restriction's "Selected
// concepts" mode and the Project Metadata restriction, so the two can't drift apart. Each caller
// passes its own concept list (SPECIES_CONCEPTS / PROJECT_METADATA_CONCEPTS in data.ts), and the
// value control follows the picked concept's own `valueType`, matched to the field type Figma
// uses for that field (see data.ts): a MultiSelect, a Select, a Yes/No radio pair, a From/To date
// pair, a text Input, or - for a concept that's withheld as a whole - no value at all. Until a
// concept is picked the value field is disabled; changing concept resets the value; a concept
// already used on another row isn't offered again (except "Other", which asks for a name).

import type { ReactNode } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { getLocalTimeZone } from "@internationalized/date";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { MultiSelect } from "@/components/base/select/multi-select";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { Button } from "@/components/base/buttons/button";
import type { ConceptOption } from "./data";
import { emptyConceptRow, type ConceptValueRow } from "./types";

function hasValue(row: ConceptValueRow, option: ConceptOption | undefined): boolean {
    switch (option?.valueType) {
        case "none":
            return true;
        case "multi":
        case "areas":
            return row.values.length > 0;
        case "dateRange":
            return !!row.dateFrom || !!row.dateTo;
        case "text":
        case "select":
        case "boolean":
            return row.value.trim().length > 0;
        default:
            return false;
    }
}

/** Every row needs a concept (plus a name, if "Other") and a value in that concept's own
 *  control - except `none` concepts, which are withheld whole and have no value to give. */
export function isConceptRowsValid(rows: ConceptValueRow[], options: ConceptOption[]): boolean {
    return (
        rows.length > 0 &&
        rows.every((r) => !!r.concept && (r.concept !== "other" || r.conceptOther.trim().length > 0) && hasValue(r, options.find((o) => o.id === r.concept)))
    );
}

export function conceptLabel(row: ConceptValueRow, options: ConceptOption[]): string {
    if (row.concept === "other") return row.conceptOther || "Other";
    return options.find((o) => o.id === row.concept)?.label ?? "-";
}

const formatDate = (d: ConceptValueRow["dateFrom"]) => (d ? d.toDate(getLocalTimeZone()).toLocaleDateString("en-AU") : "");

export function conceptValueLabel(row: ConceptValueRow, options: ConceptOption[]): string {
    const option = options.find((o) => o.id === row.concept);
    const labelFor = (id: string) => option?.options?.find((o) => o.id === id)?.label ?? id;
    switch (option?.valueType) {
        case "none":
            return "Withheld entirely";
        case "multi":
            return row.values.map(labelFor).join(", ");
        case "areas":
            return `${row.values.length} ${row.values.length === 1 ? "area" : "areas"}`;
        case "select":
            return labelFor(row.value);
        case "boolean":
            return row.value === "yes" ? "Yes" : row.value === "no" ? "No" : "";
        case "dateRange":
            return row.dateFrom && row.dateTo ? `${formatDate(row.dateFrom)} - ${formatDate(row.dateTo)}` : row.dateFrom ? `From ${formatDate(row.dateFrom)}` : `Until ${formatDate(row.dateTo)}`;
        default:
            return row.value;
    }
}

function ValueControl({ row, option, update }: { row: ConceptValueRow; option: ConceptOption | undefined; update: (patch: Partial<ConceptValueRow>) => void }) {
    if (!option) return null;
    switch (option.valueType) {
        case "multi": {
            const items = option.options ?? [];
            return (
                <MultiSelect
                    label="Value"
                    placeholder={option.placeholder}
                    items={items}
                    selectedKeys={new Set(row.values)}
                    onSelectionChange={(keys) => update({ values: Array.from(keys as Set<string>) })}
                    onReset={() => update({ values: [] })}
                    onSelectAll={() => update({ values: items.map((o) => o.id) })}
                >
                    {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
                </MultiSelect>
            );
        }
        case "select":
            return (
                <Select label="Value" placeholder={option.placeholder} items={option.options ?? []} selectedKey={row.value || null} onSelectionChange={(key) => update({ value: String(key) })}>
                    {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
            );
        case "boolean":
            return (
                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-secondary">Value</span>
                    <RadioGroup aria-label={option.label} orientation="horizontal" value={row.value || null} onChange={(v) => update({ value: v })} className="gap-6">
                        <RadioButton value="yes" label="Yes" size="sm" />
                        <RadioButton value="no" label="No" size="sm" />
                    </RadioGroup>
                </div>
            );
        case "dateRange":
            return (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InputDatePicker label="From" value={row.dateFrom} maxValue={row.dateTo ?? undefined} onChange={(v) => update({ dateFrom: v })} />
                    <InputDatePicker label="To" value={row.dateTo} minValue={row.dateFrom ?? undefined} onChange={(v) => update({ dateTo: v })} />
                </div>
            );
        case "none":
            return <p className="text-sm text-balance text-tertiary">Withheld entirely. There is no value to set.</p>;
        case "areas":
            // The areas editor is the caller's (`renderBelow`), placed here as this row's value.
            return null;
        default:
            return <Input label="Value" placeholder={option.placeholder} value={row.value} onChange={(v) => update({ value: v })} />;
    }
}

export function ConceptRows({
    rows,
    onChange,
    options,
    noun = "concept",
    renderBelow,
}: {
    rows: ConceptValueRow[];
    onChange: (rows: ConceptValueRow[]) => void;
    options: ConceptOption[];
    /** What a row is called in labels and buttons. Nominations say "attribute", as their lo-fi does. */
    noun?: "concept" | "attribute";
    /** The value for types this editor does not draw itself (areas), shown as that row's value. */
    renderBelow?: (row: ConceptValueRow, option: ConceptOption | undefined, update: (patch: Partial<ConceptValueRow>) => void) => ReactNode;
}) {
    const Noun = noun === "attribute" ? "Attribute" : "Concept";
    const article = noun === "attribute" ? "an" : "a";
    const update = (id: number, patch: Partial<ConceptValueRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const add = () => onChange([...rows, emptyConceptRow(Math.max(0, ...rows.map((r) => r.id)) + 1)]);
    const remove = (id: number) => onChange(rows.filter((r) => r.id !== id));
    const usedElsewhere = (id: number) => new Set(rows.filter((r) => r.id !== id && r.concept && r.concept !== "other").map((r) => r.concept));
    const allUsed = options.every((o) => o.id === "other" || rows.some((r) => r.concept === o.id));

    // Each row is its own card: a small numbered heading (with a quiet remove when there is more than
    // one), the attribute, then its value directly under it at full width, in whatever control that
    // attribute needs. A side-by-side "value" column could not hold the larger values (areas, a date
    // range) and was left pointing at content "below".
    return (
        <div className="flex flex-col gap-3">
            {rows.map((row, index) => {
                const option = options.find((o) => o.id === row.concept);
                const taken = usedElsewhere(row.id);
                const patch = (p: Partial<ConceptValueRow>) => update(row.id, p);
                return (
                    <div key={row.id} className="flex flex-col gap-4 rounded-lg border border-secondary bg-primary p-4">
                        <div className="flex min-h-9 items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-primary">
                                {Noun} {index + 1}
                            </p>
                            {rows.length > 1 && <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${noun} ${index + 1}`} onClick={() => remove(row.id)} />}
                        </div>
                        {/* The card's heading names the field, so the select carries it as its accessible name only. */}
                        <Select
                            aria-label={`${Noun} ${index + 1}`}
                            placeholder={`Select ${article} ${noun}`}
                            items={options.filter((o) => !taken.has(o.id))}
                            selectedKey={row.concept}
                            // Switching resets the value: each one has its own value control.
                            onSelectionChange={(key) => update(row.id, { ...emptyConceptRow(row.id), concept: key as string })}
                        >
                            {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                        </Select>
                        {row.concept === "other" && (
                            <Input label={`${Noun} name`} placeholder={`Name this ${noun}`} isRequired value={row.conceptOther} onChange={(v) => patch({ conceptOther: v })} />
                        )}
                        <ValueControl row={row} option={option} update={patch} />
                        {renderBelow?.(row, option, patch)}
                    </div>
                );
            })}
            {!allUsed && (
                <Button color="secondary" size="sm" iconLeading={Plus} className="w-max" onClick={add}>
                    Add {noun}
                </Button>
            )}
        </div>
    );
}

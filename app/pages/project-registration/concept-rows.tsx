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

function ValueControl({ row, option, label, update }: { row: ConceptValueRow; option: ConceptOption | undefined; label?: string; update: (patch: Partial<ConceptValueRow>) => void }) {
    // Fixed-height wrapper for the controls that aren't themselves 40px fields (radios, the
    // "withheld" note), so every row's trash button still lines up on the same baseline.
    const inline = (children: ReactNode) => (
        <div className="flex flex-col gap-1.5">
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
            <div className="flex h-10 items-center">{children}</div>
        </div>
    );

    if (!option) return <Input label={label} aria-label="Value" placeholder="Select a concept first" isDisabled value="" />;

    switch (option.valueType) {
        case "multi": {
            const items = option.options ?? [];
            return (
                <MultiSelect
                    label={label}
                    aria-label="Value"
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
                <Select label={label} aria-label="Value" placeholder={option.placeholder} items={option.options ?? []} selectedKey={row.value || null} onSelectionChange={(key) => update({ value: String(key) })}>
                    {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                </Select>
            );
        case "boolean":
            return inline(
                <RadioGroup aria-label={option.label} orientation="horizontal" value={row.value || null} onChange={(v) => update({ value: v })} className="gap-6">
                    <RadioButton value="yes" label="Yes" size="sm" />
                    <RadioButton value="no" label="No" size="sm" />
                </RadioGroup>,
            );
        case "dateRange":
            // Two date pickers don't fit legibly in one value column - the pair renders on its
            // own full-width line under the row instead (rendered by ConceptRows), and this cell just
            // points at it.
            return inline(<span className="text-sm text-tertiary">Set the date range below</span>);
        case "none":
            return inline(<span className="text-sm text-tertiary">Withheld entirely - no value needed</span>);
        default:
            return <Input label={label} aria-label="Value" placeholder={option.placeholder} value={row.value} onChange={(v) => update({ value: v })} />;
    }
}

export function ConceptRows({ rows, onChange, options }: { rows: ConceptValueRow[]; onChange: (rows: ConceptValueRow[]) => void; options: ConceptOption[] }) {
    const update = (id: number, patch: Partial<ConceptValueRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const add = () => onChange([...rows, emptyConceptRow(Math.max(0, ...rows.map((r) => r.id)) + 1)]);
    const remove = (id: number) => onChange(rows.filter((r) => r.id !== id));
    const usedElsewhere = (id: number) => new Set(rows.filter((r) => r.id !== id && r.concept && r.concept !== "other").map((r) => r.concept));
    const allUsed = options.every((o) => o.id === "other" || rows.some((r) => r.concept === o.id));

    return (
        <div className="flex flex-col gap-3">
            {rows.map((row, index) => {
                // Column labels on the first row only - repeating "Concept"/"Value" above every row
                // is noise once the pattern is established; later rows keep an aria-label instead.
                const first = index === 0;
                const option = options.find((o) => o.id === row.concept);
                const taken = usedElsewhere(row.id);
                return (
                    <div key={row.id} className="flex flex-col gap-3">
                        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                            <Select
                                label={first ? "Concept" : undefined}
                                aria-label="Concept"
                                placeholder="Select a concept"
                                items={options.filter((o) => !taken.has(o.id))}
                                selectedKey={row.concept}
                                // Switching concept resets the value - each concept has its own
                                // value control, so nothing carries over between them.
                                onSelectionChange={(key) => update(row.id, { ...emptyConceptRow(row.id), concept: key as string })}
                            >
                                {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                            </Select>
                            <ValueControl row={row} option={option} label={first ? "Value" : undefined} update={(patch) => update(row.id, patch)} />
                            <Button color="secondary" size="md" iconLeading={Trash01} aria-label="Remove concept" isDisabled={rows.length === 1} onClick={() => remove(row.id)} />
                        </div>
                        {option?.valueType === "dateRange" && (
                            <div className="grid grid-cols-2 gap-3">
                                <InputDatePicker label="From" value={row.dateFrom} maxValue={row.dateTo ?? undefined} onChange={(v) => update(row.id, { dateFrom: v })} />
                                <InputDatePicker label="To" value={row.dateTo} minValue={row.dateFrom ?? undefined} onChange={(v) => update(row.id, { dateTo: v })} />
                            </div>
                        )}
                        {row.concept === "other" && (
                            <Input label="Concept name" placeholder="Name this concept" isRequired value={row.conceptOther} onChange={(v) => update(row.id, { conceptOther: v })} />
                        )}
                    </div>
                );
            })}
            {!allUsed && (
                <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={add}>
                    Add concept
                </Button>
            )}
        </div>
    );
}

"use client";

// Fields more than one kind of restriction asks (species, cultural sensitivities, locations, all records), so each asks them the
// same way.

import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { EXPECTED_RESTRICTION_OPTIONS } from "./data";
import type { ExpectedRestriction } from "./types";

export const expectationLabel = (id: ExpectedRestriction | null | undefined) => EXPECTED_RESTRICTION_OPTIONS.find((o) => o.id === id)?.label ?? "";

/** "Expectations data restrictions": what the person expects. A BioData Admin decides the level after an internal review. */
export function ExpectationSelect({ value, onChange }: { value: ExpectedRestriction | null | undefined; onChange: (value: ExpectedRestriction) => void }) {
    return (
        <Select
            label="Expectations data restrictions"
            placeholder="Select what you expect"
            hint="This is an expectation only. A BioData Admin decides the restriction level after an internal review."
            items={EXPECTED_RESTRICTION_OPTIONS}
            selectedKey={value ?? null}
            onSelectionChange={(key) => onChange(key as ExpectedRestriction)}
        >
            {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
        </Select>
    );
}

export function JustificationField({ value, onChange, showErrors }: { value: string; onChange: (value: string) => void; showErrors?: boolean }) {
    const missing = !!showErrors && !value.trim();
    return (
        <TextArea
            label="Justification"
            placeholder="Enter a justification..."
            hint={missing ? "Enter a justification" : "Enter the reason for this restriction request."}
            isRequired
            isInvalid={missing}
            rows={3}
            value={value}
            onChange={onChange}
        />
    );
}

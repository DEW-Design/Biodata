"use client";

// The two answers that say what kind of survey a project runs: its survey type (Biological Survey or
// Native Vegetation Survey) and its methodology, picked from the Survey method controlled vocabulary
// (BIODATA-102) so the list is whatever the admins keep there. Shared by Add Project (both layouts' flow
// and the second layout's Method section) and the project page's edit form, so they cannot drift.
//
// The methodology a project stores is the chosen entry's name. A project holding older free text keeps
// showing it, as its own choice in the list.

import { Select } from "@/components/base/select/select";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { useCvs } from "@/app/pages/_shared/ctrl-vocab/cv-store";
import { SURVEY_TYPE_OPTIONS } from "./data";
import type { SurveyType } from "./types";

const SURVEY_METHOD_CV_ID = "BIODATA-102";
const SURVEY_METHODOLOGY_CV_ID = "BIODATA-117";

/** The entry that asks what the methodology is, when none in the list fits. */
export const OTHER_METHODOLOGY = "Other";

/** Version 2 of option 2's methodologies: the active entries of the Survey methodology vocabulary (BIODATA-117), in its
 *  order, plus any already chosen that has since been retired, so a saved choice never disappears from the list. */
export function useMethodologyOptions(chosen: string[]): string[] {
    const cvs = useCvs();
    const names = (cvs.find((cv) => cv.id === SURVEY_METHODOLOGY_CV_ID)?.entries ?? []).filter((e) => e.status === "active").map((e) => e.name);
    return [...names, ...chosen.filter((name) => !names.includes(name))];
}

export function SurveyTypeRadios({ value, onChange }: { value: SurveyType | null; onChange: (value: SurveyType) => void }) {
    return (
        <RadioGroup aria-label="Survey type" orientation="horizontal" className="gap-6" value={value ?? ""} onChange={(v) => onChange(v as SurveyType)}>
            {SURVEY_TYPE_OPTIONS.map((option) => (
                <RadioButton key={option.id} value={option.id} label={option.label} />
            ))}
        </RadioGroup>
    );
}

export function MethodologySelect({ value, onChange, isInvalid }: { value: string; onChange: (value: string) => void; isInvalid?: boolean }) {
    const cvs = useCvs();
    const names = (cvs.find((cv) => cv.id === SURVEY_METHOD_CV_ID)?.entries ?? []).filter((e) => e.status === "active").map((e) => e.name);
    const items = (value && !names.includes(value) ? [...names, value] : names).map((name) => ({ id: name, label: name }));
    return (
        <Select
            aria-label="Methodology"
            isRequired
            placeholder="Select a methodology"
            items={items}
            selectedKey={value || null}
            onSelectionChange={(key) => onChange(String(key))}
            isInvalid={isInvalid}
            hint={isInvalid ? "Select a methodology" : undefined}
        >
            {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
        </Select>
    );
}

"use client";

// Step 2, redesigned the same way as Step 1 - a one-question-at-a-time sequence instead of one
// long scrolling form, per the same direct request. Figma: node 2298:176237 ("Data Collection
// Submission") confirmed the real required/optional split (asterisks on Geographic Extent,
// Project Focus Areas, and Method of Data Collection only - Targeted Species, Permit, URI/DOI, and
// Limitations and biases all carry none), which sets the mandatory sequence below and the
// optional "+ Add..." review screen that follows it, the same shape as Step 1's own review card.
//
// "Project Focus Areas" was a disabled dropdown frozen to "Biological" plus a *separate* real
// multi-select underneath it - collapsed here into one real multi-select, since the user's own
// framing ("Biological is always a default selection and along with that there will be soil,
// water, land etc.") describes one combined choice, not two. Biological starts pre-selected
// (`initialDataCollection` in types.ts) rather than the user having to notice and pick it, and per
// direct follow-up feedback is now permanently locked selected - rendered as a real disabled
// `ChoiceTile` (selected, but not clickable) rather than a plain default the user could uncheck.
// Choosing "Other" reveals a required free-text field, same "Other" pattern as Step 1's own role
// question.
//
// Sequence: Geographic Extent -> Project Focus Areas -> Method of Data Collection -> Review
// (summary + optional add-ons: Targeted Species, Permit, URI/DOI, Limitations and biases).

import { useState } from "react";
import { Plus, Trash01, Edit05, Lock01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Select } from "@/components/base/select/select";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Button } from "@/components/base/buttons/button";
import { TypeformCard, ChoiceTile } from "./typeform-card";
import { GeoExtentPicker, geoExtentSummary } from "./geo-extent-picker";
import { FOCUS_AREA_OPTIONS, PERMIT_TYPE_OPTIONS, COLLECTION_METHOD_OPTIONS, REGISTRATION_SPECIES } from "./data";
import { emptyPermitRow, isGeoExtentComplete, type DataCollectionState } from "./types";

const SPECIES_ITEMS = REGISTRATION_SPECIES.map((s) => ({ id: s.id, label: `${s.commonName} (${s.species})` }));

export function isStep2Valid(collection: DataCollectionState): boolean {
    return (
        isGeoExtentComplete(collection.geographicExtent) &&
        collection.focusAreas.length > 0 &&
        (!collection.focusAreas.includes("other") || collection.focusAreaOther.trim().length > 0) &&
        !!collection.collectionMethod &&
        collection.methodDetails.trim().length > 0
    );
}

const TOTAL_QUESTIONS = 3;

export function Step2DataCollection({
    value,
    onChange,
    onComplete,
    startAtReview = false,
}: {
    value: DataCollectionState;
    onChange: (value: DataCollectionState) => void;
    /** Called from the review card's "Continue to Privacy and Restrictions" - advances the outer
     *  wizard to Step 3, same hand-off shape as Step 1's own `onComplete`. */
    onComplete: () => void;
    /** Same "land on Review, not Question 1" jump-back behaviour as Step1ProjectDetails' own
     *  `startAtReview` - see that component's doc comment for the full reasoning. */
    startAtReview?: boolean;
}) {
    const [cardIndex, setCardIndex] = useState(() => (startAtReview ? TOTAL_QUESTIONS : 0));
    const [showSpecies, setShowSpecies] = useState(value.targetedSpeciesIds.length > 0);
    const [showPermit, setShowPermit] = useState(value.permits.some((p) => p.type || p.number));
    const [showUriDoi, setShowUriDoi] = useState(!!value.uriDoi);
    const [showLimitations, setShowLimitations] = useState(!!value.limitationsAndBiases);

    const patch = (partial: Partial<DataCollectionState>) => onChange({ ...value, ...partial });
    const next = () => setCardIndex((i) => i + 1);
    const back = () => setCardIndex((i) => Math.max(0, i - 1));

    const toggleFocusArea = (id: string) => {
        // "Biological" is always included - every BDBSA project is fundamentally a biodiversity
        // one, per direct feedback - so its own tile is locked and never toggles.
        if (id === "biological") return;
        patch({
            focusAreas: value.focusAreas.includes(id) ? value.focusAreas.filter((f) => f !== id) : [...value.focusAreas, id],
            focusAreaOther: id === "other" && value.focusAreas.includes("other") ? "" : value.focusAreaOther,
        });
    };

    const updatePermit = (id: number, patchFields: Partial<(typeof value.permits)[number]>) =>
        patch({ permits: value.permits.map((p) => (p.id === id ? { ...p, ...patchFields } : p)) });
    const addPermit = () => patch({ permits: [...value.permits, emptyPermitRow(Math.max(0, ...value.permits.map((p) => p.id)) + 1)] });
    const removePermit = (id: number) => patch({ permits: value.permits.filter((p) => p.id !== id) });

    const targetedSpeciesKeys = new Set(value.targetedSpeciesIds);

    const cardValid = [
        isGeoExtentComplete(value.geographicExtent),
        value.focusAreas.length > 0 && (!value.focusAreas.includes("other") || value.focusAreaOther.trim().length > 0),
        !!value.collectionMethod && value.methodDetails.trim().length > 0,
    ];

    if (cardIndex === 0) {
        return (
            <TypeformCard cardKey={0} step={1} totalSteps={TOTAL_QUESTIONS} kicker="Data collection" title="Where does this data come from?" description="Define the geographic extent this project's data collection covers." showBack={false} nextDisabled={!cardValid[0]} onNext={next}>
                <GeoExtentPicker value={value.geographicExtent} onChange={(geographicExtent) => patch({ geographicExtent })} />
            </TypeformCard>
        );
    }

    if (cardIndex === 1) {
        return (
            <TypeformCard cardKey={1} step={2} totalSteps={TOTAL_QUESTIONS} kicker="Data collection" title="What kind of data does this project focus on?" description="Biological is always included - add any other domains this project also collects data on." nextDisabled={!cardValid[1]} onNext={next} onBack={back}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {FOCUS_AREA_OPTIONS.map((option) => (
                        <ChoiceTile
                            key={option.id}
                            icon={option.id === "biological" ? Lock01 : undefined}
                            label={option.label}
                            hint={option.id === "biological" ? "Always included" : undefined}
                            isSelected={value.focusAreas.includes(option.id)}
                            isDisabled={option.id === "biological"}
                            onClick={() => toggleFocusArea(option.id)}
                        />
                    ))}
                </div>
                {value.focusAreas.includes("other") && (
                    <Input label="Please specify" placeholder="Describe the other data domain" isRequired value={value.focusAreaOther} onChange={(v) => patch({ focusAreaOther: v })} autoFocus />
                )}
                <p className="text-sm text-tertiary">Selection values could change automatically when you submit different types of data.</p>
            </TypeformCard>
        );
    }

    if (cardIndex === 2) {
        return (
            <TypeformCard cardKey={2} step={3} totalSteps={TOTAL_QUESTIONS} kicker="Data collection" title="How was this data collected?" nextDisabled={!cardValid[2]} onNext={next} onBack={back}>
                <div className="flex flex-col gap-3">
                    {COLLECTION_METHOD_OPTIONS.map((option) => (
                        <ChoiceTile key={option.id} label={option.label} hint={option.description} isSelected={value.collectionMethod === option.id} onClick={() => patch({ collectionMethod: option.id })} />
                    ))}
                </div>
                {/* Required for every method, not just Systematic/Other, per direct feedback -
                    even an "Incidental"/"Unknown" method still has real survey-technique detail
                    worth capturing. */}
                {!!value.collectionMethod && (
                    <TextArea
                        label="Method details"
                        placeholder="Provide details of your survey methods such as qualitative or quantitative techniques."
                        isRequired
                        rows={3}
                        value={value.methodDetails}
                        onChange={(v) => patch({ methodDetails: v })}
                        autoFocus
                    />
                )}
            </TypeformCard>
        );
    }

    // Review - same shape as Step 1's own closing card: a summary of the mandatory answers with
    // edit-jump links, then every genuinely optional field surfaced as a "+ Add..." choice.
    const methodLabel = COLLECTION_METHOD_OPTIONS.find((o) => o.id === value.collectionMethod)?.label;
    const focusAreaLabels = value.focusAreas
        .map((id) => (id === "other" && value.focusAreaOther ? value.focusAreaOther : (FOCUS_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id)))
        .join(", ");

    return (
        <TypeformCard cardKey="review" step={TOTAL_QUESTIONS} totalSteps={TOTAL_QUESTIONS} kicker="Review" title="You're all set for Data Collection" description="Review your answers below, or add a few more optional details before continuing." showQuestionCount={false} nextLabel="Continue to Privacy and Restrictions" nextDisabled={!isStep2Valid(value)} onNext={onComplete} onBack={back}>
            <div className="flex flex-col rounded-xl border border-secondary [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">
                {[
                    { label: "Geographic extent", value: geoExtentSummary(value.geographicExtent), goToIndex: 0 },
                    { label: "Project focus areas", value: focusAreaLabels, goToIndex: 1 },
                    { label: "Method of data collection", value: methodLabel, goToIndex: 2 },
                ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                            <p className="text-xs font-semibold text-quaternary uppercase">{row.label}</p>
                            <p className="truncate text-sm text-secondary">{row.value || "-"}</p>
                        </div>
                        <Button color="link-gray" size="sm" iconLeading={Edit05} aria-label={`Edit ${row.label}`} onClick={() => setCardIndex(row.goToIndex)} />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-secondary pt-4">
                <p className="text-sm font-medium text-secondary">Optional details</p>
                <div className="flex flex-wrap gap-3">
                    {!showSpecies && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setShowSpecies(true)}>
                            Targeted species
                        </Button>
                    )}
                    {!showPermit && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setShowPermit(true)}>
                            Permit
                        </Button>
                    )}
                    {!showUriDoi && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setShowUriDoi(true)}>
                            URI / DOI number
                        </Button>
                    )}
                    {!showLimitations && (
                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={() => setShowLimitations(true)}>
                            Limitations and biases
                        </Button>
                    )}
                </div>

                {showSpecies && (
                    <MultiSelect
                        label="Targeted Species"
                        placeholder="Search and select species"
                        items={SPECIES_ITEMS}
                        selectedKeys={targetedSpeciesKeys}
                        onSelectionChange={(keys) => patch({ targetedSpeciesIds: Array.from(keys as Set<string>) })}
                        onReset={() => patch({ targetedSpeciesIds: [] })}
                        onSelectAll={() => patch({ targetedSpeciesIds: SPECIES_ITEMS.map((o) => o.id) })}
                    >
                        {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
                    </MultiSelect>
                )}

                {showPermit && (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-secondary">Permit</p>
                        {value.permits.map((permit, i) => (
                            <div key={permit.id} className="flex items-end gap-3">
                                <Select
                                    label="Permit Type"
                                    placeholder="Select permit type"
                                    items={PERMIT_TYPE_OPTIONS}
                                    selectedKey={permit.type}
                                    onSelectionChange={(key) => updatePermit(permit.id, { type: key as string })}
                                    className="flex-1"
                                >
                                    {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                                </Select>
                                <Input label="Permit No." placeholder="Enter permit number" value={permit.number} onChange={(v) => updatePermit(permit.id, { number: v })} className="flex-1" />
                                <Button color="secondary" size="md" iconLeading={Trash01} aria-label={`Remove permit ${i + 1}`} isDisabled={value.permits.length === 1} onClick={() => removePermit(permit.id)} />
                            </div>
                        ))}
                        <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={addPermit}>
                            Add another
                        </Button>
                    </div>
                )}

                {showUriDoi && (
                    <Input
                        label="URI / DOI Number"
                        placeholder="E.g., 10.5281/zenodo.1234567"
                        hint="Enter an existing identifier if known; otherwise, a unique ID will be generated."
                        value={value.uriDoi}
                        onChange={(v) => patch({ uriDoi: v })}
                    />
                )}

                {showLimitations && (
                    <TextArea
                        label="Limitations and biases"
                        placeholder="Only targeted native species and weeds were excluded"
                        hint="What biases were used with the methodology used."
                        rows={3}
                        value={value.limitationsAndBiases}
                        onChange={(v) => patch({ limitationsAndBiases: v })}
                    />
                )}
            </div>
        </TypeformCard>
    );
}

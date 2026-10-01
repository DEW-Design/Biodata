"use client";

// "Restrict data based on Species" - search and pick a species in a right-hand side panel; if it's
// already flagged sensitive elsewhere in the real system, show an honest alert naming which real
// projects already restrict it. Saving returns a summary card to the main screen.
//
// The one part redesigned per direct feedback is "What should be restricted?": the old "apply
// custom sensitivity restrictions" checkbox + All Data/Specific Attributes radio pair became two
// answer tiles (All concepts / Selected concepts). "Selected concepts" reveals the shared concept
// editor, whose value control per concept matches Figma's own field type (see concept-rows.tsx).

import { useState } from "react";
import { Plus, Save01, ShieldTick, Trash01, XClose } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { TextArea } from "@/components/base/textarea/textarea";
import { Button } from "@/components/base/buttons/button";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Badge } from "@/components/base/badges/badges";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { ChoiceTile } from "./typeform-card";
import { REGISTRATION_SPECIES, SPECIES_CONCEPTS, existingRestrictionsForSpecies, type RegistrationSpecies } from "./data";
import { SpeciesField } from "@/app/pages/_shared/species-picker";
import { emptyConceptRow, type SpeciesRestrictionEntry } from "./types";
import { ConceptRows, conceptLabel, conceptValueLabel, isConceptRowsValid } from "./concept-rows";

function emptyDraft(id: number): SpeciesRestrictionEntry {
    return { id, speciesId: "", scope: "all", concepts: [emptyConceptRow(1)], justification: "" };
}

export function isSpeciesEntryValid(entry: SpeciesRestrictionEntry): boolean {
    return entry.justification.trim().length > 0 && (entry.scope === "all" || isConceptRowsValid(entry.concepts, SPECIES_CONCEPTS));
}

function SpeciesPickerPanel({
    isOpen,
    onOpenChange,
    onSave,
    excludeIds,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (entry: SpeciesRestrictionEntry) => void;
    excludeIds: string[];
}) {
    const [selected, setSelected] = useState<RegistrationSpecies | null>(null);
    const [draft, setDraft] = useState<SpeciesRestrictionEntry>(emptyDraft(0));

    const reset = () => {
        setSelected(null);
        setDraft(emptyDraft(0));
    };

    const canSave = !!selected && isSpeciesEntryValid(draft);

    return (
        <SidePanel
            isOpen={isOpen}
            onOpenChange={(open) => {
                onOpenChange(open);
                if (!open) reset();
            }}
            title="Restrict a species"
            widthClassName="max-w-2xl"
        >
            {/* The shared species field (species-picker.tsx): a combo box grouped by species group,
                then a summary card with Change - the same picker as the nomination form. */}
            <div className="flex flex-col gap-5">
                <SpeciesField
                    value={selected ?? undefined}
                    onChange={(species) => {
                        setSelected(species);
                        if (species) setDraft(emptyDraft(Date.now()));
                    }}
                    excludeIds={excludeIds}
                    statusFor={(s) => (s.alreadySensitive ? "Restricted" : undefined)}
                    notes={(species) => {
                        if (!species.alreadySensitive) return null;
                        const restrictions = existingRestrictionsForSpecies(species.id);
                        return (
                            <AlertFullWidth
                                color="warning"
                                title="Already restricted in some projects"
                                description={
                                    restrictions.length
                                        ? `Records in ${restrictions.map((r) => `${r.code} ${r.name}`).join(", ")} are licence-only.`
                                        : "Some records of this species are already licence-only."
                                }
                                confirmLabel=""
                                contained
                                wrap
                            />
                        );
                    }}
                />
            {selected && (
                <>
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-secondary">What should be restricted?</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <ChoiceTile label="All concepts" hint="Every record of this species is protected" isSelected={draft.scope === "all"} onClick={() => setDraft({ ...draft, scope: "all" })} />
                            <ChoiceTile label="Selected concepts" hint="Protect only the details you choose" isSelected={draft.scope === "selected"} onClick={() => setDraft({ ...draft, scope: "selected" })} />
                        </div>
                    </div>

                    {draft.scope === "selected" && <ConceptRows rows={draft.concepts} onChange={(concepts) => setDraft({ ...draft, concepts })} options={SPECIES_CONCEPTS} />}

                    <TextArea
                        label="Justification"
                        placeholder="Enter a justification..."
                        hint="Enter the reason for this restriction request."
                        isRequired
                        rows={3}
                        value={draft.justification}
                        onChange={(v) => setDraft({ ...draft, justification: v })}
                    />

                    <div className="flex justify-end gap-3 border-t border-secondary pt-4">
                        <Button iconLeading={XClose} color="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button iconLeading={Save01}
                            color="primary"
                            isDisabled={!canSave}
                            onClick={() => {
                                onSave({ ...draft, id: Date.now(), speciesId: selected.id });
                                onOpenChange(false);
                                reset();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </>
            )}
            </div>
        </SidePanel>
    );
}

export function SpeciesRestrictionSection({ entries, onChange }: { entries: SpeciesRestrictionEntry[]; onChange: (entries: SpeciesRestrictionEntry[]) => void }) {
    const [pickerOpen, setPickerOpen] = useState(false);

    const speciesById = (id: string) => REGISTRATION_SPECIES.find((s) => s.id === id);

    return (
        <div className="flex flex-col gap-4">
            {entries.length === 0 ? (
                <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-tertiary">No sensitive species added yet. Select species and the concepts that should be treated as sensitive.</p>
                    <Button color="primary" size="sm" iconLeading={Plus} onClick={() => setPickerOpen(true)}>
                        Select Species
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {entries.map((entry) => {
                        const species = speciesById(entry.speciesId);
                        if (!species) return null;
                        return (
                            <BentoCard key={entry.id} className="gap-0 p-0 [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">
                                <div className="flex items-center justify-between gap-3 p-4">
                                    <p className="flex flex-wrap items-center gap-2 text-base font-medium text-primary">
                                        {species.commonName} <span className="font-normal text-tertiary italic">{species.species}</span>
                                        {species.alreadySensitive && (
                                            <Badge color="warning" size="sm">
                                                Restricted
                                            </Badge>
                                        )}
                                    </p>
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        iconLeading={Trash01}
                                        aria-label={`Remove ${species.commonName}`}
                                        onClick={() => onChange(entries.filter((e) => e.id !== entry.id))}
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-[var(--color-warning-50)] px-4 py-2">
                                    <FeaturedIcon icon={ShieldTick} color="warning" theme="light" size="sm" />
                                    <p className="text-sm text-secondary">
                                        Restricted: <span className="font-semibold">{entry.scope === "all" ? "All concepts" : "Selected concepts"}</span>
                                    </p>
                                </div>
                                {entry.scope === "selected" && (
                                    <div className="flex flex-col gap-1 p-4">
                                        <div className="grid grid-cols-2 gap-12 text-sm font-semibold text-primary">
                                            <p>Concept</p>
                                            <p>Value</p>
                                        </div>
                                        {entry.concepts.map((row) => (
                                            <div key={row.id} className="grid grid-cols-2 gap-12 text-sm text-tertiary">
                                                <p>{conceptLabel(row, SPECIES_CONCEPTS)}</p>
                                                <p>{conceptValueLabel(row, SPECIES_CONCEPTS) || "Whole concept"}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {entry.justification && <p className="p-4 text-sm text-tertiary">{entry.justification}</p>}
                            </BentoCard>
                        );
                    })}
                    <Button color="primary" size="sm" iconLeading={Plus} className="w-max" onClick={() => setPickerOpen(true)}>
                        Add another species
                    </Button>
                </div>
            )}

            <SpeciesPickerPanel
                isOpen={pickerOpen}
                onOpenChange={setPickerOpen}
                onSave={(entry) => onChange([...entries, entry])}
                excludeIds={entries.map((e) => e.speciesId)}
            />
        </div>
    );
}

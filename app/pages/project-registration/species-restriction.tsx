"use client";

// "Restrict data based on Species" - search and pick a species in a right-hand side panel; if it's
// already flagged sensitive elsewhere in the real system, show an honest alert naming which real
// projects already restrict it. Saving returns a summary card to the main screen.
//
// The one part redesigned per direct feedback is "What should be restricted?": the old "apply
// custom sensitivity restrictions" checkbox + All Data/Specific Attributes radio pair became two
// answer tiles (All concepts / Selected concepts). "Selected concepts" reveals the shared concept
// editor, whose value control per concept matches Figma's own field type (see concept-rows.tsx).

import { useMemo, useState } from "react";
import { SearchLg, Plus, Trash01, ShieldTick, ChevronRight } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Button } from "@/components/base/buttons/button";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Badge } from "@/components/base/badges/badges";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { ChoiceTile } from "./typeform-card";
import { REGISTRATION_SPECIES, SPECIES_CONCEPTS, SPECIES_GROUP_OPTIONS, existingRestrictionsForSpecies, type RegistrationSpecies } from "./data";
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
    const [query, setQuery] = useState("");
    const [groupFilter, setGroupFilter] = useState<string | null>(null);
    const [selected, setSelected] = useState<RegistrationSpecies | null>(null);
    const [draft, setDraft] = useState<SpeciesRestrictionEntry>(emptyDraft(0));
    const [summaryOpen, setSummaryOpen] = useState(false);

    const results = useMemo(() => {
        return REGISTRATION_SPECIES.filter((s) => {
            if (excludeIds.includes(s.id)) return false;
            if (groupFilter && s.group !== groupFilter) return false;
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return s.commonName.toLowerCase().includes(q) || s.species.toLowerCase().includes(q);
        });
    }, [query, groupFilter, excludeIds]);

    const reset = () => {
        setSelected(null);
        setDraft(emptyDraft(0));
        setSummaryOpen(false);
        setQuery("");
        setGroupFilter(null);
    };

    const existingRestrictions = selected ? existingRestrictionsForSpecies(selected.id) : [];
    const canSave = !!selected && isSpeciesEntryValid(draft);

    return (
        <SidePanel
            isOpen={isOpen}
            onOpenChange={(open) => {
                onOpenChange(open);
                if (!open) reset();
            }}
            title="Nominate Sensitive Species"
            widthClassName="max-w-2xl"
        >
            {!selected ? (
                <div className="flex flex-col gap-4">
                    <Input icon={SearchLg} placeholder="Search" value={query} onChange={setQuery} aria-label="Search species" />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-tertiary">Show only:</span>
                        {SPECIES_GROUP_OPTIONS.map((group) => (
                            <button
                                key={group}
                                type="button"
                                onClick={() => setGroupFilter(groupFilter === group ? null : group)}
                                className={
                                    groupFilter === group
                                        ? "rounded-md border border-[var(--color-brand-500)] bg-brand-secondary px-2.5 py-1 text-xs font-medium text-brand-secondary"
                                        : "rounded-md border border-secondary px-2.5 py-1 text-xs font-medium text-tertiary hover:bg-secondary"
                                }
                            >
                                {group === "Mammal" ? "Mammals" : group === "Bird" ? "Birds" : group === "Reptile" ? "Reptiles" : group === "Amphibian" ? "Amphibians" : "Plants"}
                            </button>
                        ))}
                    </div>
                    {/* `divide-secondary` isn't a real utility in this repo's hand-curated layer (no
                        `divide-*` color utility is defined at all, confirmed via grep against
                        app/globals.css) - the divider colour is set directly via the real
                        `--ui-border-secondary` CSS variable instead. */}
                    <div className="flex flex-col rounded-lg border border-secondary [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">
                        {results.length === 0 && <p className="p-4 text-sm text-tertiary">No species match this search.</p>}
                        {results.map((species) => (
                            <button
                                key={species.id}
                                type="button"
                                onClick={() => {
                                    setSelected(species);
                                    setDraft(emptyDraft(Date.now()));
                                }}
                                className="flex items-center justify-between gap-3 p-3 text-left hover:bg-secondary"
                            >
                                <span className="flex flex-col">
                                    <span className="text-sm font-medium text-primary">
                                        {species.commonName} <span className="font-normal text-tertiary italic">{species.species}</span>
                                    </span>
                                    <span className="text-xs text-tertiary">{species.family}</span>
                                </span>
                                {species.alreadySensitive && <Badge color="warning" size="sm">Sensitive</Badge>}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col">
                            <p className="text-base font-semibold text-primary">
                                {selected.commonName} <span className="font-normal text-tertiary italic">{selected.species}</span>
                            </p>
                            {/* NSX Code is a real Figma field but not a real one in this dataset's schema -
                                honest "-" rather than a fabricated-looking code. */}
                            <p className="text-sm text-tertiary">NSX Code: - · {selected.family}</p>
                        </div>
                        <Button color="link-gray" size="sm" onClick={() => setSelected(null)}>
                            Change species
                        </Button>
                    </div>

                    {selected.alreadySensitive && (
                        <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-warning-300)] bg-[var(--color-warning-50)] p-3">
                            <div className="flex items-start gap-2">
                                <FeaturedIcon icon={ShieldTick} color="warning" theme="light" size="sm" />
                                <p className="text-sm font-medium text-secondary">This species is identified as sensitive in our records</p>
                            </div>
                            <button type="button" className="flex items-center gap-1 text-sm font-semibold text-brand-secondary" onClick={() => setSummaryOpen((v) => !v)}>
                                View data restriction summary
                                <ChevronRight className={summaryOpen ? "size-4 rotate-90 transition-transform" : "size-4 transition-transform"} />
                            </button>
                            {summaryOpen && (
                                <ul className="flex flex-col gap-1 rounded-md bg-primary p-3 text-sm text-tertiary">
                                    {existingRestrictions.length === 0 ? (
                                        <li>No other project currently restricts this species.</li>
                                    ) : (
                                        existingRestrictions.map((r) => (
                                            <li key={r.code}>
                                                <span className="font-medium text-secondary">{r.code}</span> - {r.name}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>
                    )}

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
                        <Button color="secondary" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
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
                </div>
            )}
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
                                                Sensitive
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
                                                <p>{conceptValueLabel(row, SPECIES_CONCEPTS) || "-"}</p>
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

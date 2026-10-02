"use client";

// "Restrict data based on Species" - every species is listed, with a Restrict button on each row (the
// designer, 2 Oct 2026: "show all species as opposed to choosing on a dropdown"). Restrict opens a
// right-hand side panel for that species; if it's already flagged sensitive elsewhere in the real system,
// the panel shows an honest alert naming which real projects already restrict it. Saving marks the row
// as restricted, and Edit reopens the same panel.
//
// "What should be restricted?" is two answer tiles (All concepts / Selected concepts). "Selected
// concepts" reveals the shared concept editor, whose value control per concept matches Figma's own field
// type (see concept-rows.tsx) and where every concept gives its own justification. "All concepts" has one
// justification for the lot. Save is never disabled: pressing it with something missing shows what, on
// the field.

import { useMemo, useState } from "react";
import { Edit05, Feather, Plus, Save01, SearchMd, Trash01, XClose } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { TextArea } from "@/components/base/textarea/textarea";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SPECIES_GROUP_PLURAL } from "@/app/pages/_shared/species-picker";
import { ChoiceTile } from "./typeform-card";
import { REGISTRATION_SPECIES, SPECIES_CONCEPTS, existingRestrictionsForSpecies, type RegistrationSpecies } from "./data";
import { emptyConceptRow, type SpeciesRestrictionEntry } from "./types";
import { ConceptRows, isConceptRowsValid } from "./concept-rows";

function emptyDraft(id: number, speciesId: string): SpeciesRestrictionEntry {
    return { id, speciesId, scope: "all", concepts: [emptyConceptRow(1)], justification: "" };
}

export function isSpeciesEntryValid(entry: SpeciesRestrictionEntry): boolean {
    return entry.scope === "all" ? entry.justification.trim().length > 0 : isConceptRowsValid(entry.concepts, SPECIES_CONCEPTS, true);
}

const matches = (s: RegistrationSpecies, q: string) => !q || [s.commonName, s.species, s.family, s.group, SPECIES_GROUP_PLURAL[s.group]].some((v) => v.toLowerCase().includes(q));

function SpeciesRestrictPanel({
    species,
    initial,
    onOpenChange,
    onSave,
}: {
    species: RegistrationSpecies | null;
    initial: SpeciesRestrictionEntry | undefined;
    onOpenChange: (open: boolean) => void;
    onSave: (entry: SpeciesRestrictionEntry) => void;
}) {
    return (
        <SidePanel isOpen={!!species} onOpenChange={onOpenChange} title="Restrict a species" widthClassName="max-w-2xl">
            {/* Keyed on the species so each opening starts from its own entry, not the last one's draft. */}
            {species && <RestrictForm key={species.id} species={species} initial={initial} onCancel={() => onOpenChange(false)} onSave={onSave} />}
        </SidePanel>
    );
}

function RestrictForm({ species, initial, onCancel, onSave }: { species: RegistrationSpecies; initial: SpeciesRestrictionEntry | undefined; onCancel: () => void; onSave: (entry: SpeciesRestrictionEntry) => void }) {
    const [draft, setDraft] = useState<SpeciesRestrictionEntry>(() => initial ?? emptyDraft(Date.now(), species.id));
    const [showErrors, setShowErrors] = useState(false);
    const restrictions = species.alreadySensitive ? existingRestrictionsForSpecies(species.id) : [];

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4 rounded-lg border border-secondary bg-primary p-4">
                <SpeciesPhoto scientificName={species.species} alt={species.commonName} fallbackIcon={SPECIES_GROUP_ICON[species.group]} className="size-14" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-base font-semibold text-primary">{species.commonName}</span>
                    <span className="text-sm text-tertiary italic">{species.species}</span>
                    <span className="text-xs text-quaternary">
                        {species.family} · {species.group}
                    </span>
                </div>
            </div>
            {species.alreadySensitive && (
                <AlertFullWidth
                    color="warning"
                    title="Already restricted in some projects"
                    description={
                        restrictions.length ? `Records in ${restrictions.map((r) => `${r.code} ${r.name}`).join(", ")} are licence-only.` : "Some records of this species are already licence-only."
                    }
                    confirmLabel=""
                    contained
                    wrap
                />
            )}

            <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-secondary">What should be restricted?</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ChoiceTile label="All concepts" hint="Every record of this species is protected" isSelected={draft.scope === "all"} onClick={() => setDraft({ ...draft, scope: "all" })} />
                    <ChoiceTile label="Selected concepts" hint="Protect only the details you choose" isSelected={draft.scope === "selected"} onClick={() => setDraft({ ...draft, scope: "selected" })} />
                </div>
            </div>

            {draft.scope === "selected" ? (
                <ConceptRows rows={draft.concepts} onChange={(concepts) => setDraft({ ...draft, concepts })} options={SPECIES_CONCEPTS} justifyEach showErrors={showErrors} />
            ) : (
                <TextArea
                    label="Justification"
                    placeholder="Enter a justification..."
                    hint={showErrors && !draft.justification.trim() ? "Enter a justification" : "Enter the reason for this restriction request."}
                    isRequired
                    isInvalid={showErrors && !draft.justification.trim()}
                    rows={3}
                    value={draft.justification}
                    onChange={(v) => setDraft({ ...draft, justification: v })}
                />
            )}

            <div className="flex justify-end gap-3 border-t border-secondary pt-4">
                <Button iconLeading={XClose} color="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    iconLeading={Save01}
                    color="primary"
                    onClick={() => {
                        if (!isSpeciesEntryValid(draft)) {
                            setShowErrors(true);
                            return;
                        }
                        onSave({ ...draft, speciesId: species.id });
                    }}
                >
                    Save
                </Button>
            </div>
        </div>
    );
}

export function SpeciesRestrictionSection({ entries, onChange }: { entries: SpeciesRestrictionEntry[]; onChange: (entries: SpeciesRestrictionEntry[]) => void }) {
    const [query, setQuery] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);

    const q = query.trim().toLowerCase();
    const results = useMemo(() => REGISTRATION_SPECIES.filter((s) => matches(s, q)), [q]);
    const entryFor = (speciesId: string) => entries.find((e) => e.speciesId === speciesId);
    const opened = REGISTRATION_SPECIES.find((s) => s.id === openId) ?? null;

    const scopeLabel = (entry: SpeciesRestrictionEntry) => (entry.scope === "all" ? "All concepts" : `${entry.concepts.filter((c) => c.concept).length} ${entry.concepts.filter((c) => c.concept).length === 1 ? "concept" : "concepts"}`);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ToolbarSearch label="Search species" placeholder="Search species" value={query} onChange={setQuery} />
                <p className="m-0 text-sm text-tertiary tabular-nums">
                    {entries.length === 0 ? "No species restricted yet" : `${entries.length} of ${REGISTRATION_SPECIES.length} species restricted`}
                </p>
            </div>

            {results.length === 0 ? (
                <div className="rounded-lg border border-secondary">
                    <ListEmptyState icon={SearchMd} title="No species found" description={`Nothing matches "${query.trim()}". Try a common name, a scientific name, a family or a group.`} action={{ label: "Show all species", onPress: () => setQuery("") }} />
                </div>
            ) : (
                <ul className="m-0 flex max-h-[28rem] list-none flex-col overflow-y-auto rounded-lg border border-secondary p-0 [&>*+*]:border-t [&>*+*]:border-secondary">
                    {results.map((species) => {
                        const entry = entryFor(species.id);
                        return (
                            <li key={species.id} className="flex items-center gap-3 px-4 py-3">
                                <SpeciesPhoto scientificName={species.species} alt="" fallbackIcon={SPECIES_GROUP_ICON[species.group] ?? Feather} className="size-10" />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-medium text-primary">
                                        {species.commonName} <span className="font-normal text-tertiary italic">{species.species}</span>
                                    </span>
                                    <span className="truncate text-sm text-tertiary">
                                        {species.family} · {species.group}
                                    </span>
                                </div>
                                {species.alreadySensitive && (
                                    <Badge color="warning" size="sm">
                                        Already restricted
                                    </Badge>
                                )}
                                {entry ? (
                                    <>
                                        <Badge color="brand" size="sm">
                                            {scopeLabel(entry)}
                                        </Badge>
                                        <Button color="secondary" size="sm" iconLeading={Edit05} onClick={() => setOpenId(species.id)}>
                                            Edit
                                        </Button>
                                        <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove the restriction on ${species.commonName}`} onClick={() => onChange(entries.filter((e) => e.id !== entry.id))} />
                                    </>
                                ) : (
                                    <Button color="secondary" size="sm" iconLeading={Plus} aria-label={`Restrict ${species.commonName}`} onClick={() => setOpenId(species.id)}>
                                        Restrict
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <SpeciesRestrictPanel
                species={opened}
                initial={opened ? entryFor(opened.id) : undefined}
                onOpenChange={(open) => !open && setOpenId(null)}
                onSave={(entry) => {
                    onChange(entryFor(entry.speciesId) ? entries.map((e) => (e.speciesId === entry.speciesId ? entry : e)) : [...entries, entry]);
                    setOpenId(null);
                }}
            />
        </div>
    );
}

"use client";

// "Restrict data based on Species" - every species is listed in the table every list uses (CONTRACTS 4.2; it was a hand-built
// list until 11 Nov 2026), with a Restrict button on each row (the
// designer, 2 Oct 2026: "show all species as opposed to choosing on a dropdown"). Restrict opens a
// right-hand side panel for that species; if it's already flagged sensitive elsewhere in the real system,
// the panel shows an honest alert naming which real projects already restrict it. Saving marks the row
// as restricted, and Edit reopens the same panel.
//
// "What should be restricted?" is a radio group (All concepts / Selected concepts; it was two bespoke tiles until 11 Nov 2026,
// which the form pattern does not allow, CONTRACTS 4.1 item 7). "Selected
// concepts" reveals the shared concept editor, whose value control per concept matches Figma's own field
// type (see concept-rows.tsx) and where every concept gives its own justification. "All concepts" has one
// justification for the lot. Above the justification, "Expectations data restrictions" says what the person expects
// (the designer, 25 Oct 2026); a BioData Admin decides the level. Save is never disabled: pressing it with something missing shows what, on
// the field.

import { useMemo, useState } from "react";
import { Edit05, Feather, Plus, Save01, SearchMd, Trash01, XClose } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { Table, TableCard } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Label } from "@/components/base/input/label";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { SpeciesPhoto } from "@/app/pages/_shared/map-search/species-photo";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { SPECIES_GROUP_PLURAL } from "@/app/pages/_shared/species-picker";
import { useEmbeddedPaging } from "@/app/pages/_shared/user-management/um-detail";
import { REGISTRATION_SPECIES, SPECIES_CONCEPTS, existingRestrictionsForSpecies, type RegistrationSpecies } from "./data";
import { emptyConceptRow, type SpeciesRestrictionEntry } from "./types";
import { ConceptRows, isConceptRowsValid } from "./concept-rows";
import { ExpectationSelect, JustificationField } from "./restriction-fields";

function emptyDraft(id: number, speciesId: string): SpeciesRestrictionEntry {
    return { id, speciesId, scope: "all", concepts: [emptyConceptRow(1)], justification: "", expectation: null };
}

export function isSpeciesEntryValid(entry: SpeciesRestrictionEntry): boolean {
    return entry.scope === "all" ? entry.justification.trim().length > 0 : isConceptRowsValid(entry.concepts, SPECIES_CONCEPTS, true);
}

const matches = (s: RegistrationSpecies, q: string) => !q || [s.commonName, s.species, s.family, s.group, SPECIES_GROUP_PLURAL[s.group]].some((v) => v.toLowerCase().includes(q));

// The panel holds the draft, so its Cancel and Save can sit in the panel's fixed footer (`SidePanel footer`), as a form page's actions do, and not
// at the end of the scrolling body. Each opening starts from that species' own entry: the draft is reset when the species changes.
function SpeciesRestrictPanel({
    species,
    initial,
    nextId,
    onOpenChange,
    onSave,
}: {
    species: RegistrationSpecies | null;
    initial: SpeciesRestrictionEntry | undefined;
    /** The id a new entry takes. */
    nextId: number;
    onOpenChange: (open: boolean) => void;
    onSave: (entry: SpeciesRestrictionEntry) => void;
}) {
    const [forId, setForId] = useState<string | null>(null);
    const [draft, setDraft] = useState<SpeciesRestrictionEntry | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const openId = species?.id ?? null;
    if (forId !== openId) {
        setForId(openId);
        if (species) {
            setDraft(initial ?? emptyDraft(nextId, species.id));
            setShowErrors(false);
        }
    }
    const restrictions = species?.alreadySensitive ? existingRestrictionsForSpecies(species.id) : [];

    return (
        <SidePanel
            isOpen={!!species}
            onOpenChange={onOpenChange}
            title="Restrict a species"
            widthClassName="max-w-2xl"
            footer={
                species && draft ? (
                    <>
                        <Button iconLeading={XClose} color="secondary" onClick={() => onOpenChange(false)}>
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
                    </>
                ) : undefined
            }
        >
            {species && draft && (
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-4">
                        <SpeciesPhoto scientificName={species.species} alt={species.commonName} fallbackIcon={SPECIES_GROUP_ICON[species.group]} className="size-14" />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-base font-semibold text-primary">{species.commonName}</span>
                            <span className="text-sm text-tertiary italic">{species.species}</span>
                            <span className="text-xs text-quaternary">
                                {species.family}, {species.group}
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

                    <div className="flex flex-col gap-1.5">
                        <Label id="species-restriction-scope">What should be restricted?</Label>
                        <RadioGroup aria-labelledby="species-restriction-scope" value={draft.scope} onChange={(scope) => setDraft({ ...draft, scope: scope as SpeciesRestrictionEntry["scope"] })}>
                            <RadioButton value="all" label="All concepts" hint="Every record of this species is protected" />
                            <RadioButton value="selected" label="Selected concepts" hint="Protect only the details you choose" />
                        </RadioGroup>
                    </div>

                    <ExpectationSelect value={draft.expectation} onChange={(expectation) => setDraft({ ...draft, expectation })} />

                    {draft.scope === "selected" ? (
                        <ConceptRows rows={draft.concepts} onChange={(concepts) => setDraft({ ...draft, concepts })} options={SPECIES_CONCEPTS} justifyEach showErrors={showErrors} />
                    ) : (
                        <JustificationField value={draft.justification} onChange={(justification) => setDraft({ ...draft, justification })} showErrors={showErrors} />
                    )}
                </div>
            )}
        </SidePanel>
    );
}

export function SpeciesRestrictionSection({ entries, onChange }: { entries: SpeciesRestrictionEntry[]; onChange: (entries: SpeciesRestrictionEntry[]) => void }) {
    const [query, setQuery] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);

    const q = query.trim().toLowerCase();
    const results = useMemo(() => REGISTRATION_SPECIES.filter((s) => matches(s, q)), [q]);
    const { paged, reset, footer } = useEmbeddedPaging(results);
    const entryFor = (speciesId: string) => entries.find((e) => e.speciesId === speciesId);
    const opened = REGISTRATION_SPECIES.find((s) => s.id === openId) ?? null;

    const scopeLabel = (entry: SpeciesRestrictionEntry) => (entry.scope === "all" ? "All concepts" : `${entry.concepts.filter((c) => c.concept).length} ${entry.concepts.filter((c) => c.concept).length === 1 ? "concept" : "concepts"}`);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ToolbarSearch
                    label="Search species"
                    placeholder="Search species"
                    value={query}
                    onChange={(v) => {
                        setQuery(v);
                        reset();
                    }}
                />
                <div className="flex items-center gap-2">
                    <p className="m-0 text-sm text-tertiary">Species restricted</p>
                    <CountBadge count={entries.length} color={entries.length > 0 ? "brand" : "gray"} />
                </div>
            </div>

            {results.length === 0 ? (
                <div className="rounded-xl border border-secondary">
                    <ListEmptyState icon={SearchMd} title="No species found" description={`Nothing matches "${query.trim()}". Try a common name, a scientific name, a family or a group.`} action={{ label: "Show all species", onPress: () => setQuery("") }} />
                </div>
            ) : (
                <TableCard.Root size="sm">
                    <Table aria-label="Species">
                        <Table.Header>
                            <Table.Head id="species" label="Species" isRowHeader />
                            <Table.Head id="family" label="Family and group" />
                            <Table.Head id="restriction" label="Restriction" />
                            <Table.Head id="actions" label="" />
                        </Table.Header>
                        <Table.Body items={paged} dependencies={[entries]}>
                            {(species) => {
                                const entry = entryFor(species.id);
                                return (
                                    <Table.Row id={species.id} textValue={species.commonName}>
                                        <Table.Cell>
                                            <div className="flex items-center gap-3">
                                                <SpeciesPhoto scientificName={species.species} alt="" fallbackIcon={SPECIES_GROUP_ICON[species.group] ?? Feather} className="size-10" />
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="text-sm font-medium text-primary">{species.commonName}</span>
                                                    <span className="text-sm text-tertiary italic">{species.species}</span>
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-tertiary">
                                                {species.family}, {species.group}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {species.alreadySensitive && (
                                                    <Badge color="warning" size="sm">
                                                        Already restricted
                                                    </Badge>
                                                )}
                                                {entry && (
                                                    <Badge color="brand" size="sm">
                                                        {scopeLabel(entry)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center justify-end gap-1">
                                                {entry ? (
                                                    // A restricted row's two actions are a matching pair: the quiet icon button with its tooltip, as the artefacts
                                                    // table's row actions are (they were an outlined "Edit" button beside a bare bin). The pair is pulled 6px to
                                                    // the right so the bin's glyph, not its invisible box, lines up with the edge of the Restrict buttons.
                                                    <div className="-mr-1.5 flex items-center gap-1">
                                                        <ButtonUtility color="tertiary" size="xs" icon={Edit05} tooltip="Edit restriction" aria-label={`Edit the restriction on ${species.commonName}`} onClick={() => setOpenId(species.id)} />
                                                        <ButtonUtility color="tertiary" size="xs" icon={Trash01} tooltip="Remove restriction" aria-label={`Remove the restriction on ${species.commonName}`} onClick={() => onChange(entries.filter((e) => e.id !== entry.id))} />
                                                    </div>
                                                ) : (
                                                    <Button color="secondary" size="sm" iconLeading={Plus} aria-label={`Restrict ${species.commonName}`} onClick={() => setOpenId(species.id)}>
                                                        Restrict
                                                    </Button>
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            }}
                        </Table.Body>
                    </Table>
                    {footer}
                </TableCard.Root>
            )}

            <SpeciesRestrictPanel
                species={opened}
                initial={opened ? entryFor(opened.id) : undefined}
                nextId={Math.max(0, ...entries.map((e) => e.id)) + 1}
                onOpenChange={(open) => !open && setOpenId(null)}
                onSave={(entry) => {
                    onChange(entryFor(entry.speciesId) ? entries.map((e) => (e.speciesId === entry.speciesId ? entry : e)) : [...entries, entry]);
                    setOpenId(null);
                }}
            />
        </div>
    );
}

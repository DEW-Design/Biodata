"use client";

// Step 3, redesigned the same way as Steps 1 and 2 - a one-question-at-a-time sequence built on
// the shared `TypeformCard`/`ChoiceTile` shell, per direct feedback that the original single
// Yes/No radio + boxed-Accordion screen didn't match the other two steps' experience. The 5 real
// restriction types (Figma node 2298:179004) are unchanged - only how they're asked changed:
//
// Sequence: "Any restrictions?" (No / Yes tiles) -> [Yes only] "Which kinds?" (multi-select tiles)
// -> one focused card per selected type, in fixed order (Embargo, Species, Locations, Project
// Metadata, Other) -> Review (summary + edit-jump links, "Create Project").
//
// The card list is derived from state every render, so each card is tracked by id rather than by
// index - toggling a type on/off on the "Which kinds?" card changes how many cards follow it, and
// an index would silently point at the wrong card afterwards. Deselecting a type never clears its
// own form state (same as the accordion version), so re-selecting it brings the answers back.

import { useState, type ReactNode } from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Database01, DotsHorizontal, Edit05, Feather, Globe01, Hourglass03, Lock01, LockKeyholeCircle, MarkerPin04, Users03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { MultiSelect } from "@/components/base/select/multi-select";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { Input } from "@/components/base/input/input";
import { HintText } from "@/components/base/input/hint-text";
import { TextArea } from "@/components/base/textarea/textarea";
import { RecordRow } from "@/app/pages/_shared/record-hero";
import { TypeformCard, ChoiceTile } from "./typeform-card";
import { EMBARGO_TYPE_OPTIONS, PROJECT_METADATA_CONCEPTS, REGISTRATION_SPECIES, SPECIES_CONCEPTS, maxEmbargoMonths, formatEmbargoDuration } from "./data";
import { SpeciesRestrictionSection, isSpeciesEntryValid } from "./species-restriction";
import { LocationRestrictionSection, isLocationEntryValid } from "./location-restriction";
import { ExpectationSelect, JustificationField, expectationLabel } from "./restriction-fields";
import { ConceptRows, isConceptRowsValid, conceptLabel } from "./concept-rows";
import { allRecordsOf, culturalOf, type EmbargoType, type RestrictionTypeKey, type RestrictionsState } from "./types";

const EMBARGO_TYPE_ITEMS = EMBARGO_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }));

export const RESTRICTION_TYPE_META: { key: RestrictionTypeKey; title: string; description: string; icon: typeof Lock01 }[] = [
    { key: "embargo", title: "Embargo", description: "Temporarily hide this project from all users until a specified date", icon: Hourglass03 },
    { key: "species", title: "Restrict data based on Species", description: "Select any species that you want restricted for your project", icon: Feather },
    { key: "cultural", title: "Restrict data based on Cultural Sensitivities", description: "Name the Indigenous Information Authority for this project's culturally sensitive data", icon: Users03 },
    { key: "locations", title: "Restrict data based on Locations", description: "Manage protection rules for sensitive locations recorded in this project", icon: MarkerPin04 },
    { key: "all", title: "Restrict all records within this Project", description: "Every record in this project is restricted", icon: LockKeyholeCircle },
    { key: "metadata", title: "Restrict data based on Project Metadata", description: "Set protection rules for project data such as collection methods and observer details", icon: Database01 },
    { key: "other", title: "Other Restrictions", description: "Request protection rules for any other restrictions associated with this project", icon: DotsHorizontal },
];

/** The kinds of restriction a person can switch on (the designer, 25 Oct 2026): Embargo, Species, Cultural Sensitivities,
 *  Locations and All records. "Other restrictions" (hidden 2 Oct 2026) and Project Metadata (replaced by All records, 25 Oct
 *  2026) are no longer offered: a project that already has one still shows and edits it, nothing new can add one. */
export const OFFERED_RESTRICTION_TYPES = RESTRICTION_TYPE_META.filter((m) => m.key !== "other" && m.key !== "metadata");

export function isEmbargoValid(embargo: RestrictionsState["embargo"]): boolean {
    return (
        embargo.types.length > 0 &&
        (!embargo.types.includes("other") || embargo.typeOther.trim().length > 0) &&
        embargo.reason.trim().length > 0 &&
        !!embargo.endDate
    );
}

export function isTypeValid(key: RestrictionTypeKey, r: RestrictionsState): boolean {
    if (key === "embargo") return isEmbargoValid(r.embargo);
    // A "restrict by species/location" choice with nothing nominated restricts nothing - the
    // accordion version let this through silently; each now needs at least one real entry.
    if (key === "species") return r.species.length > 0 && r.species.every(isSpeciesEntryValid);
    if (key === "locations") return r.locations.length > 0 && r.locations.every(isLocationEntryValid);
    if (key === "cultural") {
        const c = culturalOf(r);
        return !!c.authority.trim() && !!c.contact.trim() && !!c.justification.trim();
    }
    if (key === "all") return !!allRecordsOf(r).justification.trim();
    if (key === "metadata") return isConceptRowsValid(r.metadata.concepts, PROJECT_METADATA_CONCEPTS, true);
    return r.otherRestrictions.trim().length > 0;
}

export function isStep3Valid(restrictions: RestrictionsState): boolean {
    if (!restrictions.hasRestrictions) return true;
    if (restrictions.enabledTypes.size === 0) return false;
    return Array.from(restrictions.enabledTypes).every((key) => isTypeValid(key, restrictions));
}

type CardId = "any" | "types" | RestrictionTypeKey | "review";

export const TYPE_CARD_TITLES: Record<RestrictionTypeKey, { title: string; description: string }> = {
    embargo: { title: "Tell us about the embargo", description: "Choose why this project is embargoed and when it should become available." },
    species: { title: "Which species need protecting?", description: "Nominate every species whose records in this project should be treated as sensitive." },
    cultural: { title: "Which cultural sensitivities apply?", description: "Name the Indigenous Information Authority and tell us why the data is restricted." },
    locations: { title: "Which locations are sensitive?", description: "Nominate every location whose records in this project should be protected." },
    all: { title: "Restrict every record", description: "Every record in this project is restricted. Tell us why." },
    metadata: { title: "Which project details should be restricted?", description: "Pick the concepts to protect, and tell us why." },
    other: { title: "Describe any other restriction", description: "Anything not covered by the other restriction types." },
};

/** One enabled restriction type's own summary line - shared by the review card below and by any
 *  external read-only display of a `RestrictionsState` (e.g. project-detail/option-3's own
 *  Overview stage, which shows this same summary before the user opens the real editor). */
export function restrictionSummaryFor(key: RestrictionTypeKey, value: RestrictionsState): string {
    if (key === "embargo") {
        const labels = value.embargo.types.map((t) => (t === "other" && value.embargo.typeOther ? value.embargo.typeOther : EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.label)).join(", ");
        const until = value.embargo.endDate ? ` - until ${value.embargo.endDate.toDate(getLocalTimeZone()).toLocaleDateString("en-AU")}` : "";
        return `${labels}${until}`;
    }
    if (key === "species")
        return value.species
            .map((s) => {
                const name = REGISTRATION_SPECIES.find((r) => r.id === s.speciesId)?.commonName ?? s.speciesId;
                const scope = s.scope === "all" ? "all concepts" : s.concepts.map((c) => conceptLabel(c, SPECIES_CONCEPTS)).join(", ");
                return `${name} (${scope})`;
            })
            .join("; ");
    if (key === "locations") return value.locations.map((l) => l.name).join(", ");
    if (key === "cultural") {
        const c = culturalOf(value);
        return [c.authority, expectationLabel(c.expectation)].filter(Boolean).join(", ");
    }
    if (key === "all") return expectationLabel(allRecordsOf(value).expectation) || "All records";
    if (key === "metadata") return value.metadata.concepts.filter((c) => c.concept).map((c) => conceptLabel(c, PROJECT_METADATA_CONCEPTS)).join(", ");
    return value.otherRestrictions;
}

/** Every enabled restriction type's own row (title/icon/summary), in the same fixed order the
 *  wizard itself uses - the one shared source both the wizard's own review card and an external
 *  read-only display build their rows from, so the two can never list restrictions differently. */
export function restrictionsSummaryRows(value: RestrictionsState): { key: RestrictionTypeKey; title: string; icon: typeof Lock01; summary: string }[] {
    return RESTRICTION_TYPE_META.filter((m) => value.enabledTypes.has(m.key)).map((m) => ({ key: m.key, title: m.title, icon: m.icon, summary: restrictionSummaryFor(m.key, value) }));
}

/** One restriction type's own field set, extracted out of the wizard sequence below so it can be
 *  reused standalone - `project-detail/option-3`'s own per-type editable cards render exactly this,
 *  the same fields the wizard itself asks, rather than a second, hand-rolled copy of the same form.
 *  Owns its own local "has the user touched the embargo end date" tracking (reset per mount, which
 *  is correct here - each standalone edit session starts fresh) rather than depending on the
 *  wizard's own step-level state, since a standalone caller never has that state to hand down. */
/** How a caller lays one field group out. Add Project passes its form row (label and help on the left, the field on the right, CONTRACTS 4.1
 *  item 3); without it the fields stack under their own labels, as the project page's cards show them. */
export type RestrictionRow = (row: { title: string; required?: boolean; children: ReactNode }) => ReactNode;

export function RestrictionTypeFields({
    typeKey,
    value,
    onChange,
    showErrors = false,
    row,
}: {
    typeKey: RestrictionTypeKey;
    value: RestrictionsState;
    onChange: (value: RestrictionsState) => void;
    /** True once the person tried to move on with something missing: the newer kinds mark their empty fields. */
    showErrors?: boolean;
    /** Opt-in: lay each field group out as a row of the caller's form. The row's title is then the field's label, so the field carries it as its
     *  accessible name only. */
    row?: RestrictionRow;
}) {
    const patch = (partial: Partial<RestrictionsState>) => onChange({ ...value, ...partial });
    const inRows = !!row;
    // One field group: the caller's row, or the group as it is.
    const group = (title: string, required: boolean, children: ReactNode) => (row ? row({ title, required, children }) : children);
    // A field's label: its own when stacked, the row's title (so only an accessible name here) in a row.
    const named = (label: string) => (inRows ? { "aria-label": label } : { label });
    const stack = (children: ReactNode) => (inRows ? <>{children}</> : <div className="flex flex-col gap-4">{children}</div>);

    const [embargoEndDateTouched, setEmbargoEndDateTouched] = useState(false);
    const embargoMaxMonths = maxEmbargoMonths(value.embargo.types);
    const embargoMaxDate = value.embargo.types.length > 0 ? today(getLocalTimeZone()).add({ months: embargoMaxMonths }) : null;

    const handleEmbargoTypesChange = (keys: Set<string>) => {
        const types = Array.from(keys) as EmbargoType[];
        const newMax = maxEmbargoMonths(types);
        const newMaxDate = types.length > 0 ? today(getLocalTimeZone()).add({ months: newMax }) : null;
        const endDate = !newMaxDate
            ? value.embargo.endDate
            : !embargoEndDateTouched
              ? newMaxDate
              : value.embargo.endDate && value.embargo.endDate.compare(newMaxDate) > 0
                ? newMaxDate
                : value.embargo.endDate;
        patch({ embargo: { ...value.embargo, types, typeOther: types.includes("other") ? value.embargo.typeOther : "", endDate } });
    };

    if (typeKey === "embargo")
        return stack(
            <>
                {group(
                    "Type of embargo",
                    true,
                    <>
                        <MultiSelect
                            {...named("Type of embargo")}
                            placeholder="Select embargo type(s)"
                            isRequired
                            items={EMBARGO_TYPE_ITEMS}
                            selectedKeys={new Set(value.embargo.types)}
                            onSelectionChange={(keys) => handleEmbargoTypesChange(keys as Set<string>)}
                            onReset={() => handleEmbargoTypesChange(new Set())}
                            onSelectAll={() => handleEmbargoTypesChange(new Set(EMBARGO_TYPE_ITEMS.map((o) => o.id)))}
                        >
                            {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
                        </MultiSelect>
                        {value.embargo.types.length > 0 && (
                            // What each chosen type means: one row per type in a bordered card, the type on the left and its meaning on the right (the
                            // record pages' own label and value row, as the review uses), in the order they were chosen. They were four loose sentences
                            // with nothing saying which type each was about.
                            <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                                {value.embargo.types.map((t) => {
                                    const option = EMBARGO_TYPE_OPTIONS.find((o) => o.id === t);
                                    return (
                                        <RecordRow key={t} label={option?.label ?? t}>
                                            <span className="text-balance">{option?.description}</span>
                                        </RecordRow>
                                    );
                                })}
                            </div>
                        )}
                        {value.embargo.types.includes("other") && (
                            <Input label="Please specify" isRequired value={value.embargo.typeOther} onChange={(v) => patch({ embargo: { ...value.embargo, typeOther: v } })} />
                        )}
                    </>,
                )}
                {/* "Justification", as every other kind of restriction asks it (the designer, 25 Oct 2026; it was "Reason"). */}
                {group("Justification", true, <JustificationField value={value.embargo.reason} onChange={(v) => patch({ embargo: { ...value.embargo, reason: v } })} showErrors={showErrors} hideLabel={inRows} />)}
                {group(
                    "Embargo end date",
                    true,
                    <div className="flex w-full max-w-xs flex-col gap-1.5">
                        <InputDatePicker
                            {...named("Embargo end date")}
                            isRequired
                            value={value.embargo.endDate}
                            onChange={(v) => {
                                setEmbargoEndDateTouched(true);
                                patch({ embargo: { ...value.embargo, endDate: v } });
                            }}
                            minValue={today(getLocalTimeZone())}
                            maxValue={embargoMaxDate ?? undefined}
                        />
                        {embargoMaxDate && (
                            <HintText>
                                Maximum embargo period for the selected type{value.embargo.types.length > 1 ? "s" : ""}: {formatEmbargoDuration(embargoMaxMonths)}
                            </HintText>
                        )}
                    </div>,
                )}
                {/* The designer, 25 Oct 2026: what still needs care once the embargo has ended is asked here, with the embargo. */}
                {group(
                    "Data sensitivities after the embargo ends",
                    false,
                    <TextArea
                        {...named("Data sensitivities after the embargo ends")}
                        placeholder="Please outline below any additional data sensitivities of the project to consider once the embargo has ended"
                        hint="Optional. A BioData Admin reviews these before the data is released."
                        rows={3}
                        value={value.embargo.afterEmbargo ?? ""}
                        onChange={(v) => patch({ embargo: { ...value.embargo, afterEmbargo: v } })}
                    />,
                )}
            </>,
        );

    if (typeKey === "cultural") {
        // The designer's four fields (25 Oct 2026): who speaks for the data and how to reach them, then the restriction itself.
        const c = culturalOf(value);
        const set = (p: Partial<typeof c>) => patch({ cultural: { ...c, ...p } });
        const missing = (v: string) => showErrors && !v.trim();
        return stack(
            <>
                {group(
                    "Indigenous Information Authority",
                    true,
                    <Input
                        {...named("Indigenous Information Authority")}
                        isRequired
                        placeholder="The community, organisation or person who speaks for this information"
                        value={c.authority}
                        onChange={(authority) => set({ authority })}
                        isInvalid={missing(c.authority)}
                        hint={missing(c.authority) ? "Enter the Indigenous Information Authority" : undefined}
                    />,
                )}
                {group(
                    "IIA contact details",
                    true,
                    <TextArea
                        {...named("IIA contact details")}
                        isRequired
                        rows={2}
                        placeholder="Name, email and phone number"
                        hint={missing(c.contact) ? "Enter the contact details" : "How a BioData Admin can reach the Indigenous Information Authority."}
                        value={c.contact}
                        onChange={(contact) => set({ contact })}
                        isInvalid={missing(c.contact)}
                    />,
                )}
                {group("Expectations data restrictions", false, <ExpectationSelect value={c.expectation} onChange={(expectation) => set({ expectation })} hideLabel={inRows} />)}
                {group("Justification", true, <JustificationField value={c.justification} onChange={(justification) => set({ justification })} showErrors={showErrors} hideLabel={inRows} />)}
            </>,
        );
    }

    if (typeKey === "all") {
        const a = allRecordsOf(value);
        const set = (p: Partial<typeof a>) => patch({ allRecords: { ...a, ...p } });
        return stack(
            <>
                {group("Expectations data restrictions", false, <ExpectationSelect value={a.expectation} onChange={(expectation) => set({ expectation })} hideLabel={inRows} />)}
                {group("Justification", true, <JustificationField value={a.justification} onChange={(justification) => set({ justification })} showErrors={showErrors} hideLabel={inRows} />)}
            </>,
        );
    }

    if (typeKey === "species") return group("Species", true, <SpeciesRestrictionSection entries={value.species} onChange={(species) => patch({ species })} />);
    if (typeKey === "locations") return group("Locations", true, <LocationRestrictionSection entries={value.locations} onChange={(locations) => patch({ locations })} showErrors={showErrors} />);

    if (typeKey === "metadata")
        return group(
            "Concepts",
            true,
            <div className="flex flex-col gap-4">
                <ConceptRows rows={value.metadata.concepts} onChange={(concepts) => patch({ metadata: { ...value.metadata, concepts } })} options={PROJECT_METADATA_CONCEPTS} justifyEach />
            </div>,
        );

    return group(
        "Other restrictions",
        true,
        <TextArea
            {...named("Other restrictions")}
            placeholder="Provide reasons why this restriction is needed to this project..."
            isRequired
            rows={4}
            value={value.otherRestrictions}
            onChange={(v) => patch({ otherRestrictions: v })}
            autoFocus
        />,
    );
}

export function Step3PrivacyRestrictions({
    value,
    onChange,
    onBackToPreviousStep,
    onComplete,
    reviewNextLabel = "Create Project",
    reviewTitle = "Ready to create your project",
}: {
    value: RestrictionsState;
    onChange: (value: RestrictionsState) => void;
    /** Back from the first card - returns to Step 2 (its own review card). */
    onBackToPreviousStep: () => void;
    /** Called from the review card's own primary action. */
    onComplete: () => void;
    /** The review card's own primary-action label and heading - both default to the real wizard's
     *  own "Create Project" copy, but a caller reusing this flow to *edit* an existing project's
     *  restrictions (rather than create a new one) passes something honest for that context
     *  instead, e.g. `reviewNextLabel="Save changes"` / `reviewTitle="Review restrictions"`. */
    reviewNextLabel?: string;
    reviewTitle?: string;
}) {
    const patch = (partial: Partial<RestrictionsState>) => onChange({ ...value, ...partial });
    const [cardId, setCardId] = useState<CardId>("any");

    const enabledOrdered = RESTRICTION_TYPE_META.map((m) => m.key).filter((k) => value.enabledTypes.has(k));
    const cards: CardId[] = value.hasRestrictions ? ["any", "types", ...enabledOrdered, "review"] : ["any", "review"];
    // A type deselected on its own card's "Which kinds?" jump-back can leave `cardId` pointing at a
    // card no longer in the list - fall back to the review card rather than rendering nothing.
    const currentId: CardId = cards.includes(cardId) ? cardId : "review";
    const position = cards.indexOf(currentId);
    const totalQuestions = cards.length - 1;
    const next = () => setCardId(cards[Math.min(cards.length - 1, position + 1)]);
    const back = () => (position === 0 ? onBackToPreviousStep() : setCardId(cards[position - 1]));

    const toggleType = (key: RestrictionTypeKey) => {
        const enabledTypes = new Set(value.enabledTypes);
        if (enabledTypes.has(key)) enabledTypes.delete(key);
        else enabledTypes.add(key);
        patch({ enabledTypes });
    };

    const kicker = "Privacy and restrictions";

    if (currentId === "any") {
        return (
            <TypeformCard
                cardKey="any"
                step={1}
                totalSteps={totalQuestions}
                kicker={kicker}
                title="Does your project have any restrictions on its distribution to users?"
                description="BDBSA data is open access by default. Choose Yes if some or all of this project's data needs protecting."
                onNext={next}
                onBack={back}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ChoiceTile icon={Globe01} label="No restrictions" hint="Everything in this project is openly available" isSelected={!value.hasRestrictions} onClick={() => patch({ hasRestrictions: false })} />
                    <ChoiceTile icon={Lock01} label="Yes, apply restrictions" hint="Embargo, or restricting species, cultural sensitivities, locations or all records" isSelected={value.hasRestrictions} onClick={() => patch({ hasRestrictions: true })} />
                </div>
            </TypeformCard>
        );
    }

    if (currentId === "types") {
        return (
            <TypeformCard
                cardKey="types"
                step={position + 1}
                totalSteps={totalQuestions}
                kicker={kicker}
                title="Which kinds of restriction apply?"
                description="Select all that apply - you'll set each one up next."
                nextDisabled={value.enabledTypes.size === 0}
                onNext={next}
                onBack={back}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {OFFERED_RESTRICTION_TYPES.map(({ key, title, description, icon }) => (
                        <ChoiceTile key={key} icon={icon} label={title} hint={description} isSelected={value.enabledTypes.has(key)} onClick={() => toggleType(key)} />
                    ))}
                </div>
            </TypeformCard>
        );
    }

    if (currentId !== "review") {
        const key = currentId;
        const meta = RESTRICTION_TYPE_META.find((m) => m.key === key)!;
        return (
            <TypeformCard
                cardKey={key}
                step={position + 1}
                totalSteps={totalQuestions}
                kicker={`${kicker}, ${meta.title}`}
                title={TYPE_CARD_TITLES[key].title}
                description={TYPE_CARD_TITLES[key].description}
                nextDisabled={!isTypeValid(key, value)}
                onNext={next}
                onBack={back}
            >
                <RestrictionTypeFields typeKey={key} value={value} onChange={onChange} />
            </TypeformCard>
        );
    }

    // Review - same shape as Steps 1 and 2's own closing card: one summary row per answer with an
    // edit-jump link, then the review card's own primary action (real wizard's own "Create
    // Project", or a caller-supplied label when this flow is reused to edit an existing project).
    const rows: { label: string; value: string; goTo: CardId }[] = [
        { label: "Restrictions", value: value.hasRestrictions ? "Yes, apply restrictions" : "No restrictions", goTo: "any" },
        ...enabledOrdered.map((key) => ({ label: RESTRICTION_TYPE_META.find((m) => m.key === key)!.title, value: restrictionSummaryFor(key, value), goTo: key as CardId })),
    ];

    return (
        <TypeformCard
            cardKey="review"
            step={totalQuestions}
            totalSteps={totalQuestions}
            kicker="Review"
            title={reviewTitle}
            description={
                value.hasRestrictions
                    ? "Review the restrictions below before saving."
                    : "This project's data will be openly available to every BioData SA user."
            }
            showQuestionCount={false}
            nextLabel={reviewNextLabel}
            nextDisabled={!isStep3Valid(value)}
            onNext={onComplete}
            onBack={back}
        >
            <div className="flex flex-col rounded-xl border border-secondary [&>*+*]:border-t [&>*+*]:border-[var(--ui-border-secondary)]">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="flex min-w-0 flex-col">
                            <p className="text-xs font-semibold text-quaternary uppercase">{row.label}</p>
                            <p className="truncate text-sm text-secondary">{row.value || "-"}</p>
                        </div>
                        <Button color="link-gray" size="sm" iconLeading={Edit05} aria-label={`Edit ${row.label}`} onClick={() => setCardId(row.goTo)} />
                    </div>
                ))}
            </div>
        </TypeformCard>
    );
}

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

import { useState } from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Database01, DotsHorizontal, Edit05, Feather, Globe01, Hourglass03, Lock01, MarkerPin04 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { MultiSelect } from "@/components/base/select/multi-select";
import { InputDatePicker } from "@/components/custom/date-picker/input-date-picker";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { TypeformCard, ChoiceTile } from "./typeform-card";
import { EMBARGO_TYPE_OPTIONS, PROJECT_METADATA_CONCEPTS, REGISTRATION_SPECIES, SPECIES_CONCEPTS, maxEmbargoMonths, formatEmbargoDuration } from "./data";
import { SpeciesRestrictionSection, isSpeciesEntryValid } from "./species-restriction";
import { LocationRestrictionSection } from "./location-restriction";
import { ConceptRows, isConceptRowsValid, conceptLabel } from "./concept-rows";
import type { EmbargoType, RestrictionTypeKey, RestrictionsState } from "./types";

const EMBARGO_TYPE_ITEMS = EMBARGO_TYPE_OPTIONS.map((o) => ({ id: o.id, label: o.label }));

export const RESTRICTION_TYPE_META: { key: RestrictionTypeKey; title: string; description: string; icon: typeof Lock01 }[] = [
    { key: "embargo", title: "Embargo", description: "Temporarily hide this project from all users until a specified date", icon: Hourglass03 },
    { key: "species", title: "Restrict data based on Species", description: "Manage protection rules for species recorded in this project", icon: Feather },
    { key: "locations", title: "Restrict data based on Locations", description: "Manage protection rules for sensitive locations recorded in this project", icon: MarkerPin04 },
    { key: "metadata", title: "Restrict data based on Project Metadata", description: "Set protection rules for project data such as collection methods and observer details", icon: Database01 },
    { key: "other", title: "Other Restrictions", description: "Request protection rules for any other restrictions associated with this project", icon: DotsHorizontal },
];

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
    if (key === "locations") return r.locations.length > 0;
    if (key === "metadata") return r.metadata.justification.trim().length > 0 && isConceptRowsValid(r.metadata.concepts, PROJECT_METADATA_CONCEPTS);
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
    locations: { title: "Which locations are sensitive?", description: "Nominate every location whose records in this project should be protected." },
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
export function RestrictionTypeFields({ typeKey, value, onChange }: { typeKey: RestrictionTypeKey; value: RestrictionsState; onChange: (value: RestrictionsState) => void }) {
    const patch = (partial: Partial<RestrictionsState>) => onChange({ ...value, ...partial });

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
        return (
            <div className="flex flex-col gap-4">
                <MultiSelect
                    label="Select type of Embargo"
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
                    <ul className="-mt-2 flex flex-col gap-1 text-sm text-tertiary">
                        {value.embargo.types.map((t) => (
                            <li key={t}>{EMBARGO_TYPE_OPTIONS.find((o) => o.id === t)?.description}</li>
                        ))}
                    </ul>
                )}
                {value.embargo.types.includes("other") && (
                    <Input label="Please specify" isRequired value={value.embargo.typeOther} onChange={(v) => patch({ embargo: { ...value.embargo, typeOther: v } })} />
                )}
                <TextArea
                    label="Reason"
                    placeholder="Provide justification for embargo"
                    isRequired
                    rows={3}
                    value={value.embargo.reason}
                    onChange={(v) => patch({ embargo: { ...value.embargo, reason: v } })}
                />
                <div className="flex w-full max-w-xs flex-col gap-1.5">
                    <InputDatePicker
                        label="Embargo End Date"
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
                        <p className="text-xs text-tertiary">
                            Maximum embargo period for the selected type{value.embargo.types.length > 1 ? "s" : ""}: {formatEmbargoDuration(embargoMaxMonths)}
                        </p>
                    )}
                </div>
            </div>
        );

    if (typeKey === "species") return <SpeciesRestrictionSection entries={value.species} onChange={(species) => patch({ species })} />;
    if (typeKey === "locations") return <LocationRestrictionSection entries={value.locations} onChange={(locations) => patch({ locations })} />;

    if (typeKey === "metadata")
        return (
            <div className="flex flex-col gap-4">
                <ConceptRows rows={value.metadata.concepts} onChange={(concepts) => patch({ metadata: { ...value.metadata, concepts } })} options={PROJECT_METADATA_CONCEPTS} />
                <TextArea
                    label="Justification"
                    placeholder="Reasons for restrictions"
                    isRequired
                    rows={3}
                    value={value.metadata.justification}
                    onChange={(v) => patch({ metadata: { ...value.metadata, justification: v } })}
                />
            </div>
        );

    return (
        <TextArea
            label="Other Restrictions"
            placeholder="Provide reasons why this restriction is needed to this project..."
            isRequired
            rows={4}
            value={value.otherRestrictions}
            onChange={(v) => patch({ otherRestrictions: v })}
            autoFocus
        />
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
                    <ChoiceTile icon={Lock01} label="Yes, apply restrictions" hint="Embargo, sensitive species or locations, or other rules" isSelected={value.hasRestrictions} onClick={() => patch({ hasRestrictions: true })} />
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
                    {RESTRICTION_TYPE_META.map(({ key, title, description, icon }) => (
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
                kicker={`${kicker} · ${meta.title}`}
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

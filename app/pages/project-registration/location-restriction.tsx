"use client";

// "Restrict data based on Locations". The section is the location form itself, on the page (the designer, 25 Oct 2026: "instead
// of doing the location in the side bar we will do it in the same page"): each location is a card with its name, its expected
// restriction and its justification, then "Add location", which opens the location selector inline, in the card, only when it
// is pressed. The place is optional (the designer, 25 Oct 2026: "allow the user to not provide location as well"): "Remove location"
// closes the selector and clears what was chosen. A place chosen from the list names the card when the name is still empty. "Add another location" adds a card, as
// Project contacts adds a person. With nothing stored yet, one empty card is shown, so the form is there from the start.

import { useState } from "react";
import { Plus, Trash01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Button } from "@/components/base/buttons/button";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { GeoExtentPicker } from "./geo-extent-picker";
import { ExpectationSelect, JustificationField } from "./restriction-fields";
import { emptyGeoExtent, isGeoExtentComplete, type LocationRestrictionEntry } from "./types";

export function isLocationEntryValid(entry: LocationRestrictionEntry): boolean {
    return entry.name.trim().length > 0 && entry.justification.trim().length > 0;
}

const blankEntry = (id: number): LocationRestrictionEntry => ({ id, name: "", extent: emptyGeoExtent(), justification: "", expectation: null });

function LocationCard({
    entry,
    index,
    canRemove,
    showErrors,
    onChange,
    onRemove,
}: {
    entry: LocationRestrictionEntry;
    index: number;
    canRemove: boolean;
    showErrors: boolean;
    onChange: (patch: Partial<LocationRestrictionEntry>) => void;
    onRemove: () => void;
}) {
    // The selector stays open once a location is chosen, so it can be changed where it was set.
    const [pickerOpen, setPickerOpen] = useState(() => isGeoExtentComplete(entry.extent));
    const nameMissing = showErrors && !entry.name.trim();

    return (
        <BentoCard className="gap-4">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-primary">Location {index + 1}</p>
                {canRemove && <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove ${entry.name.trim() || `location ${index + 1}`}`} onClick={onRemove} />}
            </div>
            <Input
                label="Location name"
                isRequired
                placeholder="E.g., Pygmy Bluetongue Lizard nesting site"
                value={entry.name}
                onChange={(name) => onChange({ name })}
                isInvalid={nameMissing}
                hint={nameMissing ? "Enter a location name" : undefined}
            />
            <ExpectationSelect value={entry.expectation} onChange={(expectation) => onChange({ expectation })} />
            <JustificationField value={entry.justification} onChange={(justification) => onChange({ justification })} showErrors={showErrors} />
            {pickerOpen ? (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                        <Label>Location</Label>
                        <Button
                            color="link-gray"
                            size="sm"
                            iconLeading={Trash01}
                            onClick={() => {
                                onChange({ extent: emptyGeoExtent() });
                                setPickerOpen(false);
                            }}
                        >
                            Remove location
                        </Button>
                    </div>
                    <GeoExtentPicker
                        value={entry.extent}
                        onChange={(extent) => onChange({ extent, ...(extent.method === "list" && !entry.name.trim() && extent.listName ? { name: extent.listName } : {}) })}
                    />
                </div>
            ) : (
                <Button color="secondary" size="md" iconLeading={Plus} className="w-max" onClick={() => setPickerOpen(true)}>
                    Add location
                </Button>
            )}
        </BentoCard>
    );
}

export function LocationRestrictionSection({
    entries,
    onChange,
    showErrors = false,
}: {
    entries: LocationRestrictionEntry[];
    onChange: (entries: LocationRestrictionEntry[]) => void;
    showErrors?: boolean;
}) {
    const shown = entries.length > 0 ? entries : [blankEntry(1)];
    const update = (id: number, patch: Partial<LocationRestrictionEntry>) => onChange(shown.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    return (
        <div className="flex flex-col gap-4">
            {shown.map((entry, i) => (
                <LocationCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    canRemove={shown.length > 1}
                    showErrors={showErrors}
                    onChange={(patch) => update(entry.id, patch)}
                    onRemove={() => onChange(shown.filter((e) => e.id !== entry.id))}
                />
            ))}
            <Button color="link-color" size="sm" iconLeading={Plus} className="w-max" onClick={() => onChange([...shown, blankEntry(Math.max(0, ...shown.map((e) => e.id)) + 1)])}>
                Add another location
            </Button>
        </div>
    );
}

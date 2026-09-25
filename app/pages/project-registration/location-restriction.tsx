"use client";

// "Restrict data based on Locations" - same shape as the species sub-flow (empty state -> a panel
// to define one entry -> a running list of cards, each removable), but simpler: no "already
// nominated" check exists for a location the way it does for a species in this dataset.

import { useState } from "react";
import { Plus, Trash01, MarkerPin01 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Button } from "@/components/base/buttons/button";
import { BentoCard } from "@/app/pages/_shared/bento-card";
import { SidePanel } from "@/app/pages/_shared/map-search/side-panel";
import { GeoExtentPicker, geoExtentSummary } from "./geo-extent-picker";
import { emptyGeoExtent, isGeoExtentComplete, type LocationRestrictionEntry } from "./types";

function LocationPickerPanel({
    isOpen,
    onOpenChange,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (entry: LocationRestrictionEntry) => void;
}) {
    const [name, setName] = useState("");
    const [extent, setExtent] = useState(emptyGeoExtent());
    const [justification, setJustification] = useState("");

    const reset = () => {
        setName("");
        setExtent(emptyGeoExtent());
        setJustification("");
    };

    const canSave = name.trim().length > 0 && isGeoExtentComplete(extent) && justification.trim().length > 0;

    return (
        <SidePanel
            isOpen={isOpen}
            onOpenChange={(open) => {
                onOpenChange(open);
                if (!open) reset();
            }}
            title="Nominate Sensitive Location"
            widthClassName="max-w-2xl"
        >
            <div className="flex flex-col gap-5">
                <Input label="Specify a Location Name" placeholder="E.g., Pygmy Bluetongue Lizard nesting site" isRequired value={name} onChange={setName} />
                <GeoExtentPicker value={extent} onChange={setExtent} />
                <TextArea
                    label="Justification"
                    placeholder="Enter a justification..."
                    hint="Enter the reason for this restriction request."
                    isRequired
                    rows={3}
                    value={justification}
                    onChange={setJustification}
                />
                <div className="flex justify-end gap-3 border-t border-secondary pt-4">
                    <Button color="secondary" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        isDisabled={!canSave}
                        onClick={() => {
                            onSave({ id: Date.now(), name, extent, justification });
                            onOpenChange(false);
                        }}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </SidePanel>
    );
}

export function LocationRestrictionSection({ entries, onChange }: { entries: LocationRestrictionEntry[]; onChange: (entries: LocationRestrictionEntry[]) => void }) {
    const [pickerOpen, setPickerOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            {entries.length === 0 ? (
                <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-tertiary">No sensitive locations added yet. Select locations and related metadata that should be treated as sensitive.</p>
                    <Button color="primary" size="sm" iconLeading={Plus} onClick={() => setPickerOpen(true)}>
                        Select Location
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {entries.map((entry) => (
                        <BentoCard key={entry.id} className="gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2">
                                    <MarkerPin01 className="mt-0.5 size-4 text-fg-quaternary" />
                                    <div className="flex flex-col">
                                        <p className="text-base font-medium text-primary">{entry.name}</p>
                                        <p className="text-sm text-tertiary">{geoExtentSummary(entry.extent)}</p>
                                    </div>
                                </div>
                                <Button color="secondary" size="sm" iconLeading={Trash01} aria-label={`Remove ${entry.name}`} onClick={() => onChange(entries.filter((e) => e.id !== entry.id))} />
                            </div>
                            {entry.justification && <p className="border-t border-secondary pt-3 text-sm text-tertiary">{entry.justification}</p>}
                        </BentoCard>
                    ))}
                    <Button color="primary" size="sm" iconLeading={Plus} className="w-max" onClick={() => setPickerOpen(true)}>
                        Add another Location
                    </Button>
                </div>
            )}

            <LocationPickerPanel isOpen={pickerOpen} onOpenChange={setPickerOpen} onSave={(entry) => onChange([...entries, entry])} />
        </div>
    );
}

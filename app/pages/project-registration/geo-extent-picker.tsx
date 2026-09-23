"use client";

// Shared 4-method geographic extent chooser - Step 2's own "Geographic Extent" and every location
// restriction entry in Step 3 both need "upload a shapefile / draw on the map / pick from a list of
// SA national parks / enter coordinates", so it's built once here rather than twice. Reuses the
// real map (app/pages/_shared/map-search/sa-map.tsx) and the real SA national park list
// (app/pages/_shared/map-search/geo.ts) already built for the Explore map-search screen, instead of
// a second, disconnected geography.

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { UploadCloud02, Map01, List as ListIcon, Target04, Circle, Pentagon, Maximize02, Minimize02 } from "@untitledui/icons";
import { Tabs, TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { InputFile } from "@/components/base/input/input-file";
import { InputNumber } from "@/components/base/input/input-number";
import { Select } from "@/components/base/select/select";
import { SA_NATIONAL_PARKS, boundarySummary, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import type { GeoExtentValue, GeoMethod } from "./types";

/** A short, human-readable summary of a geographic extent - shared by Step 2's own review screen
 *  and every location restriction entry in Step 3, so the two can't describe the same shape of
 *  data two different ways. */
export function geoExtentSummary(extent: GeoExtentValue): string {
    if (extent.method === "list" && extent.parkId) {
        const park = SA_NATIONAL_PARKS.find((p) => p.id === extent.parkId);
        return park ? park.name : "Selected park";
    }
    if (extent.method === "shapefile") return extent.shapefileName ?? "Uploaded shapefile";
    if (extent.boundary) return boundarySummary(extent.boundary);
    return "Not yet defined";
}

const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
    ssr: false,
    loading: () => (
        <div className="flex size-full items-center justify-center bg-secondary">
            <p className="text-sm text-tertiary">Loading map…</p>
        </div>
    ),
});

const METHOD_TABS: { id: GeoMethod; label: string; icon: typeof UploadCloud02 }[] = [
    { id: "shapefile", label: "Upload Shapefile", icon: UploadCloud02 },
    { id: "map", label: "Draw on the Map", icon: Map01 },
    { id: "list", label: "Choose from a List", icon: ListIcon },
    { id: "coordinates", label: "Coordinates", icon: Target04 },
];

const PARK_OPTIONS = SA_NATIONAL_PARKS.map((p) => ({ id: p.id, label: p.name }));

/** The Draw circle/Draw polygon toggle pair - shared between the compact inline map and the
 *  full-screen overlay below, so a user can pick either tool from either view without the two
 *  ever presenting different options. */
function DrawToolButtons({
    activeDrawTool,
    onDrawToolChange,
}: {
    activeDrawTool: "circle" | "polygon" | null;
    onDrawToolChange: (tool: "circle" | "polygon" | null) => void;
}) {
    return (
        <div className="flex gap-2">
            <Button
                color={activeDrawTool === "circle" ? "primary" : "secondary"}
                size="sm"
                iconLeading={Circle}
                className="flex-1"
                onClick={() => onDrawToolChange(activeDrawTool === "circle" ? null : "circle")}
            >
                {activeDrawTool === "circle" ? "Drawing…" : "Draw circle"}
            </Button>
            <Button
                color={activeDrawTool === "polygon" ? "primary" : "secondary"}
                size="sm"
                iconLeading={Pentagon}
                className="flex-1"
                onClick={() => onDrawToolChange(activeDrawTool === "polygon" ? null : "polygon")}
            >
                {activeDrawTool === "polygon" ? "Drawing…" : "Draw polygon"}
            </Button>
        </div>
    );
}

/** A real full-screen view of the same map, opened via the expand icon on the compact map - per
 *  direct feedback that the inline map ("a very small window") makes drawing an accurate boundary
 *  hard. Built directly on react-aria's `ModalOverlay`/`Modal`/`Dialog` (the same real primitives
 *  `app/pages/_shared/map-search/side-panel.tsx` uses for its own slide-over) rather than the
 *  centred `components/application/modals/modal.tsx` pair, which hardcodes a constrained width -
 *  wrong for a map that should fill the viewport. Shares the exact same `boundary`/`onBoundaryAdd`/
 *  `activeDrawTool` state as the compact map (lifted to `GeoExtentPicker`), so a shape drawn here is
 *  the same real boundary the compact view and the rest of the wizard already read from - never a
 *  second, disconnected map. Draw circle/polygon stay available here too, per direct request. */
function MapFullscreenOverlay({
    isOpen,
    onOpenChange,
    boundary,
    onBoundaryAdd,
    activeDrawTool,
    onDrawToolChange,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    boundary: Boundary | null | undefined;
    onBoundaryAdd: (boundary: Boundary) => void;
    activeDrawTool: "circle" | "polygon" | null;
    onDrawToolChange: (tool: "circle" | "polygon" | null) => void;
}) {
    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    // z-[9999], not the usual z-50 - the compact map still mounted behind this
                    // overlay is a real Leaflet instance whose own internal panes (tile/overlay/
                    // marker/popup) use z-index values up to ~700, comfortably above a plain z-50
                    // and bleeding straight through it (confirmed live: the small map rendered on
                    // top of the "full screen" one). This overlay needs to sit above every Leaflet
                    // pane on the page, not just above ordinary page content.
                    "fixed inset-0 z-[9999] bg-overlay/70",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                )
            }
        >
            <Modal className="fixed inset-0 z-[9999] flex flex-col bg-primary outline-hidden">
                {/* font-barlow - ModalOverlay/Modal portal straight to <body>, outside any
                    font-scoping wrapper around the trigger, same reason side-panel.tsx's own
                    Dialog carries it explicitly. */}
                <Dialog className="font-barlow flex h-full flex-col outline-hidden">
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-secondary p-4">
                        <DrawToolButtons activeDrawTool={activeDrawTool} onDrawToolChange={onDrawToolChange} />
                        <Button color="secondary" size="sm" iconLeading={Minimize02} onClick={() => onOpenChange(false)}>
                            Exit full screen
                        </Button>
                    </div>
                    <div className="min-h-0 flex-1">
                        <SAMap
                            boundaries={boundary ? [boundary] : []}
                            onBoundaryAdd={onBoundaryAdd}
                            activeDrawTool={activeDrawTool}
                            onDrawToolChange={onDrawToolChange}
                            className="size-full"
                        />
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

export function GeoExtentPicker({ value, onChange }: { value: GeoExtentValue; onChange: (value: GeoExtentValue) => void }) {
    const [activeDrawTool, setActiveDrawTool] = useState<"circle" | "polygon" | null>(null);
    const [coordRadius, setCoordRadius] = useState(25);
    const [isMapExpanded, setIsMapExpanded] = useState(false);

    return (
        <div className="flex w-full flex-col gap-4">
            <Tabs selectedKey={value.method ?? "shapefile"} onSelectionChange={(key) => onChange({ ...value, method: key as GeoMethod })} className="flex flex-col gap-3">
                <TabList aria-label="Geographic extent method" type="button-border" size="sm" fullWidth>
                    {METHOD_TABS.map((m) => (
                        <Tab key={m.id} id={m.id} label={m.label} icon={m.icon} />
                    ))}
                </TabList>

                <TabPanel id="shapefile" className="flex flex-col gap-3 pt-2">
                    <InputFile
                        label="Upload a shapefile"
                        placeholder="Choose a file"
                        acceptedFileTypes={[".geojson", ".shp"]}
                        onChange={(files) => onChange({ ...value, shapefileName: files?.[0]?.name })}
                        hint="File formats: .geojson or a .shp file. Please ensure your shapefile is in WGS84 EPSG:4326 (latitude, longitude) projection. The area must be less than 25,000km²."
                    />
                </TabPanel>

                <TabPanel id="map" className="flex flex-col gap-3 pt-2">
                    <p className="text-sm text-tertiary">Draw a circle or polygon on the map to define this area.</p>
                    <DrawToolButtons activeDrawTool={activeDrawTool} onDrawToolChange={setActiveDrawTool} />
                    <div className="relative h-64 w-full overflow-hidden rounded-lg border border-secondary">
                        <SAMap
                            boundaries={value.boundary ? [value.boundary] : []}
                            onBoundaryAdd={(boundary) => {
                                onChange({ ...value, boundary });
                                setActiveDrawTool(null);
                            }}
                            activeDrawTool={activeDrawTool}
                            onDrawToolChange={setActiveDrawTool}
                            className="size-full"
                        />
                        {/* Positioned top-left, clear of the map's own top-right zoom controls
                            (app/pages/_shared/map-search/sa-map.tsx's `ZoomControls`, z-[1000]) -
                            a real, working expand affordance per direct feedback that this inline
                            view is "a very small window" to draw an accurate boundary in. */}
                        <Button
                            color="secondary"
                            size="sm"
                            iconLeading={Maximize02}
                            className="absolute top-3 left-3 z-[1001] shadow-md"
                            onClick={() => setIsMapExpanded(true)}
                        >
                            Full screen
                        </Button>
                    </div>
                    <MapFullscreenOverlay
                        isOpen={isMapExpanded}
                        onOpenChange={setIsMapExpanded}
                        boundary={value.boundary}
                        onBoundaryAdd={(boundary) => {
                            onChange({ ...value, boundary });
                            setActiveDrawTool(null);
                        }}
                        activeDrawTool={activeDrawTool}
                        onDrawToolChange={setActiveDrawTool}
                    />
                </TabPanel>

                <TabPanel id="list" className="flex flex-col gap-3 pt-2">
                    <Select
                        label="Select a national park"
                        placeholder="Search and select from the list"
                        items={PARK_OPTIONS}
                        selectedKey={value.parkId ?? null}
                        onSelectionChange={(key) => {
                            const park = SA_NATIONAL_PARKS.find((p) => p.id === key);
                            if (!park) return;
                            onChange({
                                ...value,
                                parkId: park.id,
                                boundary: { id: `park-${park.id}`, kind: "circle", center: [park.lat, park.lon], radiusKm: 15, label: park.name },
                            });
                        }}
                        className="w-full"
                    >
                        {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                    </Select>
                </TabPanel>

                <TabPanel id="coordinates" className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <InputNumber
                            label="Latitude"
                            placeholder="-34.93"
                            step={0.01}
                            minValue={-38}
                            maxValue={-25}
                            onChange={(lat) => {
                                const [, lon] = value.boundary?.kind === "circle" ? value.boundary.center : [0, 138];
                                onChange({ ...value, boundary: { id: "coordinates", kind: "circle", center: [lat, lon], radiusKm: coordRadius } });
                            }}
                        />
                        <InputNumber
                            label="Longitude"
                            placeholder="138.60"
                            step={0.01}
                            minValue={129}
                            maxValue={141}
                            onChange={(lon) => {
                                const [lat] = value.boundary?.kind === "circle" ? value.boundary.center : [-34.93, 0];
                                onChange({ ...value, boundary: { id: "coordinates", kind: "circle", center: [lat, lon], radiusKm: coordRadius } });
                            }}
                        />
                    </div>
                    <InputNumber
                        label="Radius (km)"
                        defaultValue={25}
                        minValue={1}
                        maxValue={300}
                        step={5}
                        onChange={(radiusKm) => {
                            setCoordRadius(radiusKm);
                            if (value.boundary?.kind === "circle") onChange({ ...value, boundary: { ...value.boundary, radiusKm } });
                        }}
                    />
                </TabPanel>
            </Tabs>
        </div>
    );
}

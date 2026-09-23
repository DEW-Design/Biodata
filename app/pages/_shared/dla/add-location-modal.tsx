"use client";

import { useState, type FC } from "react";
import dynamic from "next/dynamic";
import { Heading } from "react-aria-components";
import { Circle, MarkerPin02, Pentagon, UploadCloud02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputFile } from "@/components/base/input/input-file";
import { InputNumber } from "@/components/base/input/input-number";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { SA_NATIONAL_PARKS, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { eastingNorthingToLatLon, parseLocationFile } from "@/app/pages/_shared/dla/dla-geo";
import { newLocationId, type DlaLocation, type DlaLocationMethod } from "@/app/pages/_shared/dla/dla-data";

// The wireframe's "Add a Location" popup (Figma YMproGZfrFB5jUqPHPxMhk, node 33:43259), re-fitted
// to real components rather than its own drag-and-drop chrome - see CONTEXT.md, "Data Licencing
// Agreement (DLA)". 3 of its 4 methods reuse exactly what Explore's own map search already built
// for the same job (draw on the map, enter coordinates, pick a real South Australian national
// park) - a location added here becomes the same `Boundary` (circle/polygon) type Explore uses, so
// `SAMap` needs no new rendering path. Upload Shapefile is the one genuinely new piece: a real
// shpjs parse (see dla-geo.ts), not a fake progress bar.
//
// The License Category (Level 2/3) radio and, for Level 3, the project checklist are NOT part of
// this modal - the wireframe places them on each already-added location row in the parent step,
// not inside "Add a Location" itself, so this modal only ever produces a location's name/method/
// geometry; the caller assigns a default level and lets the requester change it afterward.

const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
    ssr: false,
    loading: () => (
        <div className="flex size-full items-center justify-center bg-secondary">
            <p className="text-sm text-tertiary">Loading map…</p>
        </div>
    ),
});

const methodTabs: { id: DlaLocationMethod; label: string; icon: FC<{ className?: string }> }[] = [
    { id: "shapefile", label: "Upload Shapefile", icon: UploadCloud02 },
    { id: "map", label: "Draw on the Map", icon: Pentagon },
    { id: "list", label: "Choose from a List", icon: MarkerPin02 },
    { id: "coordinates", label: "Coordinates", icon: Circle },
];

const parkItems = SA_NATIONAL_PARKS.map((park) => ({ id: park.id, label: park.name }));

// A single point (entered coordinates, or a park's own centroid) becomes a small fixed-radius
// circle boundary, same shape as every other boundary this tool produces - there's nothing in the
// wireframe's Coordinates/Choose-from-a-list panels to size a radius from, unlike Explore's own
// coordinate entry (which asks for one).
const PARK_RADIUS_KM = 15;
const POINT_RADIUS_KM = 1;

export function AddLocationModal({ isOpen, onOpenChange, onAdd }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onAdd: (location: DlaLocation) => void }) {
    const [method, setMethod] = useState<DlaLocationMethod>("map");
    const [name, setName] = useState("");

    const [drawnBoundary, setDrawnBoundary] = useState<Boundary | null>(null);
    const [activeDrawTool, setActiveDrawTool] = useState<"circle" | "polygon" | null>(null);

    const [selectedParkId, setSelectedParkId] = useState<string | null>(null);

    const [coordSystem, setCoordSystem] = useState<"latlong" | "eastingnorthing">("latlong");
    const [lat, setLat] = useState<number | null>(null);
    const [lon, setLon] = useState<number | null>(null);
    const [easting, setEasting] = useState<number | null>(null);
    const [northing, setNorthing] = useState<number | null>(null);

    const [shapefileName, setShapefileName] = useState("");
    const [shapefilePoints, setShapefilePoints] = useState<[number, number][] | null>(null);
    const [shapefileError, setShapefileError] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    const selectedPark = SA_NATIONAL_PARKS.find((park) => park.id === selectedParkId);

    const boundary: Boundary | null =
        method === "map"
            ? drawnBoundary
            : method === "list" && selectedPark
              ? { id: `list-${selectedPark.id}`, kind: "circle", center: [selectedPark.lat, selectedPark.lon], radiusKm: PARK_RADIUS_KM }
              : method === "coordinates"
                ? coordinatesBoundary(coordSystem, lat, lon, easting, northing)
                : method === "shapefile" && shapefilePoints
                  ? { id: "shapefile", kind: "polygon", points: shapefilePoints }
                  : null;

    const resolvedName = method === "list" ? (selectedPark?.name ?? "") : name.trim();
    const canAdd = !!boundary && resolvedName.length > 0;

    const reset = () => {
        setMethod("map");
        setName("");
        setDrawnBoundary(null);
        setActiveDrawTool(null);
        setSelectedParkId(null);
        setCoordSystem("latlong");
        setLat(null);
        setLon(null);
        setEasting(null);
        setNorthing(null);
        setShapefileName("");
        setShapefilePoints(null);
        setShapefileError("");
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) reset();
        onOpenChange(open);
    };

    const handleAdd = () => {
        if (!boundary) return;
        onAdd({ id: newLocationId(), name: resolvedName, method, boundary, level: "level2", projectIds: [] });
        handleOpenChange(false);
    };

    const handleFileChange = async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        setShapefileError("");
        setShapefileName(file.name);
        setShapefilePoints(null);
        setIsParsing(true);
        try {
            const points = await parseLocationFile(file);
            setShapefilePoints(points);
        } catch (error) {
            setShapefileError(error instanceof Error ? error.message : "Couldn't read this file");
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={handleOpenChange}>
            <Modal className="w-full max-w-2xl">
                <Dialog>
                    <div className="flex flex-col gap-5 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <Heading slot="title" className="text-lg font-semibold text-balance text-primary">
                                Add a Location
                            </Heading>
                            <CloseButton size="sm" />
                        </div>

                        <Tabs selectedKey={method} onSelectionChange={(key) => setMethod(key as DlaLocationMethod)} className="flex flex-col gap-4">
                            <TabList aria-label="Location method" type="button-border" size="sm" fullWidth>
                                {methodTabs.map((m) => (
                                    <Tab key={m.id} id={m.id} label={m.label} icon={m.icon} />
                                ))}
                            </TabList>

                            <TabPanel id="shapefile" className="flex flex-col gap-4">
                                <Input label="Specify a Location Name" isRequired value={name} onChange={setName} />
                                <InputFile
                                    label="Upload a shapefile"
                                    placeholder={shapefileName || "Choose a file"}
                                    buttonText="Browse"
                                    acceptedFileTypes={[".geojson", ".shp", ".zip"]}
                                    isLoading={isParsing}
                                    isInvalid={!!shapefileError}
                                    hint={
                                        shapefileError ||
                                        "File formats: .geojson, .shp, or a zipped shapefile (.zip). Ensure your shapefile is in WGS84 (latitude, longitude) projection."
                                    }
                                    onChange={handleFileChange}
                                />
                                {shapefilePoints && !shapefileError && <p className="text-xs text-tertiary">Parsed {shapefilePoints.length} boundary points from {shapefileName}.</p>}
                            </TabPanel>

                            <TabPanel id="map" className="flex flex-col gap-4">
                                <Input label="Specify a Location Name" isRequired value={name} onChange={setName} />
                                <div className="flex gap-2">
                                    <Button
                                        color={activeDrawTool === "circle" ? "primary" : "secondary"}
                                        size="sm"
                                        iconLeading={Circle}
                                        className="flex-1"
                                        onPress={() => setActiveDrawTool(activeDrawTool === "circle" ? null : "circle")}
                                    >
                                        {activeDrawTool === "circle" ? "Drawing…" : "Draw circle"}
                                    </Button>
                                    <Button
                                        color={activeDrawTool === "polygon" ? "primary" : "secondary"}
                                        size="sm"
                                        iconLeading={Pentagon}
                                        className="flex-1"
                                        onPress={() => setActiveDrawTool(activeDrawTool === "polygon" ? null : "polygon")}
                                    >
                                        {activeDrawTool === "polygon" ? "Drawing…" : "Draw polygon"}
                                    </Button>
                                </div>
                                <div className="h-72 overflow-hidden rounded-lg border border-secondary">
                                    <SAMap
                                        boundaries={drawnBoundary ? [drawnBoundary] : []}
                                        onBoundaryAdd={(b) => {
                                            setDrawnBoundary(b);
                                            setActiveDrawTool(null);
                                        }}
                                        activeDrawTool={activeDrawTool}
                                        onDrawToolChange={setActiveDrawTool}
                                        className="size-full"
                                    />
                                </div>
                                {drawnBoundary && (
                                    <Button color="link-gray" size="sm" className="self-start" onPress={() => setDrawnBoundary(null)}>
                                        Clear shape
                                    </Button>
                                )}
                            </TabPanel>

                            <TabPanel id="list" className="flex flex-col gap-4">
                                <Select.ComboBox
                                    label="Select Location"
                                    placeholder="Search and select from the list"
                                    items={parkItems}
                                    selectedKey={selectedParkId}
                                    onSelectionChange={(key) => setSelectedParkId(key as string | null)}
                                >
                                    {(item) => <Select.Item {...item}>{item.label}</Select.Item>}
                                </Select.ComboBox>
                            </TabPanel>

                            <TabPanel id="coordinates" className="flex flex-col gap-4">
                                <Input label="Specify a Location Name" isRequired value={name} onChange={setName} />
                                <RadioGroup size="sm" orientation="horizontal" value={coordSystem} onChange={(v) => setCoordSystem(v as typeof coordSystem)} aria-label="Coordinate system">
                                    <RadioButton value="eastingnorthing" label="Easting & Northing" />
                                    <RadioButton value="latlong" label="Latitude & Longitude" />
                                </RadioGroup>
                                {coordSystem === "eastingnorthing" ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputNumber label="Easting" placeholder="270000" onChange={setEasting} />
                                        <InputNumber label="Northing" placeholder="6130000" onChange={setNorthing} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputNumber label="Latitude" placeholder="-34.93" step={0.01} minValue={-38} maxValue={-25} onChange={setLat} />
                                        <InputNumber label="Longitude" placeholder="138.60" step={0.01} minValue={129} maxValue={141} onChange={setLon} />
                                    </div>
                                )}
                            </TabPanel>
                        </Tabs>

                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <Button color="secondary" size="lg" slot="close">
                                Cancel
                            </Button>
                            <Button color="primary" size="lg" isDisabled={!canAdd} onPress={handleAdd}>
                                Add Location
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function coordinatesBoundary(system: "latlong" | "eastingnorthing", lat: number | null, lon: number | null, easting: number | null, northing: number | null): Boundary | null {
    if (system === "latlong") {
        if (lat == null || lon == null) return null;
        return { id: "coords", kind: "circle", center: [lat, lon], radiusKm: POINT_RADIUS_KM };
    }
    if (easting == null || northing == null) return null;
    return { id: "coords", kind: "circle", center: eastingNorthingToLatLon(easting, northing), radiusKm: POINT_RADIUS_KM };
}

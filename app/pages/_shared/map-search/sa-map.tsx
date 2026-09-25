"use client";

import { Fragment, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, ScaleControl, Tooltip, TileLayer, useMap } from "react-leaflet";
import { ZoomIn, ZoomOut } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { Boundary } from "./geo";
import { assetPath } from "@/lib/base-path";

// A real, working map of South Australia - OpenStreetMap tiles via Leaflet, not a fabricated grid
// or a static image. Kept in app/pages/_shared (not components/custom) to match the precedent
// already set by this build's other real map widget, app/pages/_shared/map-view.tsx (a Highcharts
// map) - a page-shared, working component rather than a fully productised design-system entry,
// since neither has a stakeholder-decided home yet. Always loaded via next/dynamic with
// `ssr: false` from the page that uses it - Leaflet touches `window` on import, which breaks
// server rendering otherwise.

// Next.js bundles (both webpack and Turbopack) resolve Leaflet's default marker icon URLs
// relative to the bundled JS file, not a real static path - the classic broken-marker-icon issue.
// Fixed the standard way: point at the same 3 PNGs, copied verbatim from
// node_modules/leaflet/dist/images/ into public/leaflet/, instead of leaflet's own asset path.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: assetPath("/leaflet/marker-icon-2x.png"),
    iconUrl: assetPath("/leaflet/marker-icon.png"),
    shadowUrl: assetPath("/leaflet/marker-shadow.png"),
});

const SA_CENTER: [number, number] = [-30.5, 135.8];
// The east edge is 152, not South Australia's own 141: fitting an area into the left of the map
// while a panel covers the right (the second Explore layout) moves the map's centre east, and a
// tighter bound would pull the view back and slide the fitted areas under the panel.
const SA_MAX_BOUNDS: L.LatLngBoundsExpression = [
    [-40, 124],
    [-23, 152],
];

// The same brand teal token app/pages/_shared/map-view.tsx uses for its own "this is the
// highlighted area" state, reused here for the same semantic (the current search boundary) so the
// two map widgets read consistently if a user sees both.
const BOUNDARY_COLOR = "var(--color-brand-600)";

/** Real DEW-styled zoom controls, replacing Leaflet's own default control chrome (which doesn't
 *  follow this design system's tokens) - same real zoom behaviour, `map.zoomIn()`/`zoomOut()`. */
function ZoomControls({ position }: { position: "top-right" | "top-left" }) {
    const map = useMap();
    return (
        <div className={position === "top-left" ? "absolute top-3 left-3 z-[1000] flex flex-col gap-2" : "absolute top-3 right-3 z-[1000] flex flex-col gap-2"}>
            <Button color="secondary" size="md" iconLeading={ZoomIn} aria-label="Zoom in" onPress={() => map.zoomIn()} className="shadow-md" />
            <Button color="secondary" size="md" iconLeading={ZoomOut} aria-label="Zoom out" onPress={() => map.zoomOut()} className="shadow-md" />
        </div>
    );
}

/** Pans/zooms to fit every currently-active boundary at once, however each one was defined (drawn,
 *  entered as coordinates, or picked from the national park list) - one consistent "show me
 *  everything I've defined so far" behaviour regardless of source or count. */
function FlyToBoundaries({
    boundaries,
    paddingTopLeft = [48, 48],
    paddingBottomRight = [48, 48],
}: {
    boundaries: Boundary[];
    paddingTopLeft?: [number, number];
    paddingBottomRight?: [number, number];
}) {
    const map = useMap();
    const boundariesKey = JSON.stringify(boundaries);

    useEffect(() => {
        if (boundaries.length === 0) return;
        // `L.circle(...).getBounds()`/`L.polygon(...).getBounds()` both need the layer to already
        // be attached to a map (they read `_map` internally) - a detached layer created just to
        // measure its bounds throws "Cannot read properties of undefined (reading
        // 'layerPointToLatLng')". `LatLng.toBounds()` and `L.latLngBounds()` compute bounds from
        // raw coordinates directly, with no map attachment needed - extended across every active
        // boundary so newly added areas (not just the very latest one) all stay in view.
        const bounds = L.latLngBounds([]);
        for (const boundary of boundaries) {
            if (boundary.kind === "circle") {
                bounds.extend(L.latLng(boundary.center).toBounds(boundary.radiusKm * 2000));
            } else {
                bounds.extend(L.latLngBounds(boundary.points));
            }
        }
        // paddingTopLeft keeps fitted areas clear of anything floating over the map's top-left
        // (e.g. the map search's floating panel).
        // Padding describes what floats over the map (a card, a sheet). Cap each side at 78% of the
        // map so an oversized panel on a small window still leaves a visible middle to fit into.
        const size = map.getSize();
        const capX = size.x * 0.78;
        const capY = size.y * 0.78;
        const tl = L.point(Math.min(paddingTopLeft[0], capX), Math.min(paddingTopLeft[1], capY));
        const br = L.point(Math.min(paddingBottomRight[0], capX), Math.min(paddingBottomRight[1], capY));
        map.flyToBounds(bounds, { paddingTopLeft: tl, paddingBottomRight: br, duration: 0.6 });
        // Re-fit when the covered area changes (the card widens for Table, the sheet snaps), so the
        // areas always land in the part of the map the user can actually see.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boundariesKey, map, paddingTopLeft[0], paddingTopLeft[1], paddingBottomRight[0], paddingBottomRight[1]]);

    return null;
}

/** Flies to one specific set of boundaries when `request.key` changes: "zoom to this area" from the
 *  areas list. Same padding rules as `FlyToBoundaries`, so the area lands in the visible part of
 *  the map. */
function FlyToRequest({
    request,
    paddingTopLeft = [48, 48],
    paddingBottomRight = [48, 48],
}: {
    request?: { key: number; boundaries: Boundary[] };
    paddingTopLeft?: [number, number];
    paddingBottomRight?: [number, number];
}) {
    const map = useMap();
    const key = request?.key;

    useEffect(() => {
        if (!request || request.boundaries.length === 0) return;
        const bounds = L.latLngBounds([]);
        for (const boundary of request.boundaries) {
            if (boundary.kind === "circle") bounds.extend(L.latLng(boundary.center).toBounds(boundary.radiusKm * 2000));
            else bounds.extend(L.latLngBounds(boundary.points));
        }
        const size = map.getSize();
        const tl = L.point(Math.min(paddingTopLeft[0], size.x * 0.78), Math.min(paddingTopLeft[1], size.y * 0.78));
        const br = L.point(Math.min(paddingBottomRight[0], size.x * 0.78), Math.min(paddingBottomRight[1], size.y * 0.78));
        map.flyToBounds(bounds, { paddingTopLeft: tl, paddingBottomRight: br, duration: 0.6 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, map]);

    return null;
}

/** Bridges leaflet-draw's imperative Circle/Polygon handlers (triggered by real DEW buttons in the
 *  search panel, not leaflet-draw's own dated toolbar UI) into the declarative boundary list -
 *  each created shape is added as a new boundary (never replacing an earlier one, per direct
 *  feedback allowing multiple location selections) and the created layer is removed immediately
 *  after capture since the boundary is re-rendered declaratively via the `<Circle>`/`<Polygon>`
 *  below, so there's never a duplicate layer. */
function DrawBridge({
    activeDrawTool,
    onDrawToolChange,
    onBoundaryAdd,
}: {
    activeDrawTool: "circle" | "polygon" | null;
    onDrawToolChange: (tool: "circle" | "polygon" | null) => void;
    onBoundaryAdd: (boundary: Boundary) => void;
}) {
    const map = useMap();
    const handlerRef = useRef<L.Draw.Circle | L.Draw.Polygon | null>(null);

    useEffect(() => {
        handlerRef.current?.disable();
        handlerRef.current = null;

        const shapeOptions = { color: BOUNDARY_COLOR, weight: 2, fillOpacity: 0.15 };
        if (activeDrawTool === "circle") {
            handlerRef.current = new L.Draw.Circle(map as unknown as L.DrawMap, { shapeOptions });
            handlerRef.current.enable();
        } else if (activeDrawTool === "polygon") {
            handlerRef.current = new L.Draw.Polygon(map as unknown as L.DrawMap, { shapeOptions, allowIntersection: false, showArea: false });
            handlerRef.current.enable();
        }

        return () => {
            handlerRef.current?.disable();
        };
    }, [activeDrawTool, map]);

    useEffect(() => {
        const handleCreated = (event: L.LeafletEvent) => {
            const created = event as unknown as L.DrawEvents.Created;
            map.removeLayer(created.layer);
            const id = `drawn-${Date.now()}`;

            if (created.layerType === "circle") {
                const layer = created.layer as L.Circle;
                const center = layer.getLatLng();
                onBoundaryAdd({ id, kind: "circle", center: [center.lat, center.lng], radiusKm: Math.round(layer.getRadius() / 100) / 10 });
            } else if (created.layerType === "polygon") {
                const layer = created.layer as L.Polygon;
                const latLngs = (layer.getLatLngs()[0] as L.LatLng[]).map((point): [number, number] => [point.lat, point.lng]);
                onBoundaryAdd({ id, kind: "polygon", points: latLngs });
            }
            onDrawToolChange(null);
        };

        map.on(L.Draw.Event.CREATED, handleCreated);
        return () => {
            map.off(L.Draw.Event.CREATED, handleCreated);
        };
    }, [map, onBoundaryAdd, onDrawToolChange]);

    return null;
}

/** The area being pointed at in the areas list is drawn heavier, so a row and its shape read as one. */
function boundaryStyle(id: string, highlighted?: Set<string>) {
    const on = highlighted?.has(id) ?? false;
    return { color: BOUNDARY_COLOR, fillColor: BOUNDARY_COLOR, fillOpacity: on ? 0.32 : 0.15, weight: on ? 4 : 2 };
}

export interface SAMapProps {
    boundaries: Boundary[];
    onBoundaryAdd: (boundary: Boundary) => void;
    activeDrawTool: "circle" | "polygon" | null;
    onDrawToolChange: (tool: "circle" | "polygon" | null) => void;
    /** Extra fit-to-bounds padding at the top-left, for UI floating over the map. */
    fitPaddingTopLeft?: [number, number];
    /** Extra fit-to-bounds padding at the bottom-right, for UI floating over the map's right side
     *  (the results panel in the second Explore layout). */
    fitPaddingBottomRight?: [number, number];
    /** Where the zoom buttons sit. Default top-right; the second Explore layout moves them to the
     *  top-left because the results panel floats over the right. */
    zoomPosition?: "top-right" | "top-left";
    /** Draw the search areas (default true). They still steer the fit when hidden. */
    showBoundaries?: boolean;
    /** Result points to plot over the search areas (one dot per record). Optional. */
    markers?: SAMapMarker[];
    /** Called with a marker's id when its dot is clicked. */
    onMarkerClick?: (id: string) => void;
    /** The marker to draw larger and darker (the result card being hovered). */
    highlightedMarkerId?: string | null;
    /** Boundary ids to draw heavier (the area row being hovered in the areas list). */
    highlightedBoundaryIds?: Set<string>;
    /** Fly to these boundaries whenever `key` changes ("zoom to this area"). */
    fitRequest?: { key: number; boundaries: Boundary[] };
    className?: string;
}

export interface SAMapMarker {
    id: string;
    position: [number, number];
    label: string;
}

export default function SAMap({ boundaries, onBoundaryAdd, activeDrawTool, onDrawToolChange, fitPaddingTopLeft, fitPaddingBottomRight, zoomPosition = "top-right", showBoundaries = true, markers, onMarkerClick, highlightedMarkerId, highlightedBoundaryIds, fitRequest, className }: SAMapProps) {
    return (
        <div className={className}>
            <MapContainer
                center={SA_CENTER}
                zoom={6}
                minZoom={5}
                maxZoom={16}
                maxBounds={SA_MAX_BOUNDS}
                maxBoundsViscosity={1}
                zoomControl={false}
                className="size-full"
                // leaflet-draw needs its own cursor styling to apply while a tool is active -
                // real, working cursor feedback, not decorative.
                style={{ cursor: activeDrawTool ? "crosshair" : undefined }}
            >
                {/* Real OpenStreetMap tiles, with the attribution its usage policy requires - not
                    a fabricated basemap. A production deployment would sit this behind a properly
                    provisioned tile provider; the public OSM tile server is the right choice for
                    this exploratory build. */}
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <ScaleControl position="bottomleft" imperial={false} />
                <ZoomControls position={zoomPosition} />
                <DrawBridge activeDrawTool={activeDrawTool} onDrawToolChange={onDrawToolChange} onBoundaryAdd={onBoundaryAdd} />
                <FlyToBoundaries boundaries={boundaries} paddingTopLeft={fitPaddingTopLeft} paddingBottomRight={fitPaddingBottomRight} />
                <FlyToRequest request={fitRequest} paddingTopLeft={fitPaddingTopLeft} paddingBottomRight={fitPaddingBottomRight} />

                {showBoundaries && boundaries.map((boundary) =>
                    boundary.kind === "circle" ? (
                        <Fragment key={boundary.id}>
                            <Circle center={boundary.center} radius={boundary.radiusKm * 1000} pathOptions={boundaryStyle(boundary.id, highlightedBoundaryIds)} />
                            <Marker position={boundary.center} />
                        </Fragment>
                    ) : (
                        <Fragment key={boundary.id}>
                            <Polygon positions={boundary.points} pathOptions={boundaryStyle(boundary.id, highlightedBoundaryIds)} />
                            {/* Uploaded-shapefile polygons also get a marker (at their vertex average) so
                                every location a shapefile added is pinned, not just its point features. */}
                            {boundary.source?.startsWith("shapefile:") && (
                                <Marker
                                    position={[
                                        boundary.points.reduce((sum, [lat]) => sum + lat, 0) / boundary.points.length,
                                        boundary.points.reduce((sum, [, lon]) => sum + lon, 0) / boundary.points.length,
                                    ]}
                                />
                            )}
                        </Fragment>
                    ),
                )}

                {markers?.map((marker) => (
                    <CircleMarker
                        key={marker.id}
                        center={marker.position}
                        radius={marker.id === highlightedMarkerId ? 10 : 6}
                        pathOptions={{
                            color: "var(--ui-bg-primary)",
                            weight: 2,
                            fillColor: marker.id === highlightedMarkerId ? "var(--color-brand-900)" : BOUNDARY_COLOR,
                            fillOpacity: 1,
                        }}
                        eventHandlers={{ click: () => onMarkerClick?.(marker.id) }}
                    >
                        <Tooltip direction="top" offset={[0, -6]}>
                            {marker.label}
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}

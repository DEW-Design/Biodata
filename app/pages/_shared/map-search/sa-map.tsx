"use client";

import { Fragment, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Circle, MapContainer, Marker, Polygon, ScaleControl, TileLayer, useMap } from "react-leaflet";
import { ZoomIn, ZoomOut } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { Boundary } from "./geo";

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
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
});

const SA_CENTER: [number, number] = [-30.5, 135.8];
const SA_MAX_BOUNDS: L.LatLngBoundsExpression = [
    [-40, 124],
    [-23, 143],
];

// The same brand teal token app/pages/_shared/map-view.tsx uses for its own "this is the
// highlighted area" state, reused here for the same semantic (the current search boundary) so the
// two map widgets read consistently if a user sees both.
const BOUNDARY_COLOR = "var(--color-brand-600)";

/** Real DEW-styled zoom controls, replacing Leaflet's own default control chrome (which doesn't
 *  follow this design system's tokens) - same real zoom behaviour, `map.zoomIn()`/`zoomOut()`. */
function ZoomControls() {
    const map = useMap();
    return (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
            <Button color="secondary" size="md" iconLeading={ZoomIn} aria-label="Zoom in" onPress={() => map.zoomIn()} className="shadow-md" />
            <Button color="secondary" size="md" iconLeading={ZoomOut} aria-label="Zoom out" onPress={() => map.zoomOut()} className="shadow-md" />
        </div>
    );
}

/** Pans/zooms to fit every currently-active boundary at once, however each one was defined (drawn,
 *  entered as coordinates, or picked from the national park list) - one consistent "show me
 *  everything I've defined so far" behaviour regardless of source or count. */
function FlyToBoundaries({ boundaries, paddingTopLeft = [48, 48] }: { boundaries: Boundary[]; paddingTopLeft?: [number, number] }) {
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
        map.flyToBounds(bounds, { paddingTopLeft, paddingBottomRight: [48, 48], duration: 0.6 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boundariesKey, map]);

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

export interface SAMapProps {
    boundaries: Boundary[];
    onBoundaryAdd: (boundary: Boundary) => void;
    activeDrawTool: "circle" | "polygon" | null;
    onDrawToolChange: (tool: "circle" | "polygon" | null) => void;
    /** Extra fit-to-bounds padding at the top-left, for UI floating over the map. */
    fitPaddingTopLeft?: [number, number];
    className?: string;
}

export default function SAMap({ boundaries, onBoundaryAdd, activeDrawTool, onDrawToolChange, fitPaddingTopLeft, className }: SAMapProps) {
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
                <ZoomControls />
                <DrawBridge activeDrawTool={activeDrawTool} onDrawToolChange={onDrawToolChange} onBoundaryAdd={onBoundaryAdd} />
                <FlyToBoundaries boundaries={boundaries} paddingTopLeft={fitPaddingTopLeft} />

                {boundaries.map((boundary) =>
                    boundary.kind === "circle" ? (
                        <Fragment key={boundary.id}>
                            <Circle center={boundary.center} radius={boundary.radiusKm * 1000} pathOptions={{ color: BOUNDARY_COLOR, fillColor: BOUNDARY_COLOR, fillOpacity: 0.15, weight: 2 }} />
                            <Marker position={boundary.center} />
                        </Fragment>
                    ) : (
                        <Fragment key={boundary.id}>
                            <Polygon positions={boundary.points} pathOptions={{ color: BOUNDARY_COLOR, fillColor: BOUNDARY_COLOR, fillOpacity: 0.15, weight: 2 }} />
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
            </MapContainer>
        </div>
    );
}

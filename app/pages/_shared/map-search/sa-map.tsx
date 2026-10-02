"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Rectangle, ScaleControl, Tooltip, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Boundary, GeoBlock } from "./geo";
import { assetPath } from "@/lib/base-path";
import { cx } from "@/utils/cx";
import { MapZoomButtons } from "./map-zoom-buttons";

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
// Leaflet's own fit-to-bounds zoom (`getBoundsZoom`) is clamped to `[minZoom, maxZoom]` *before* the
// pan offset for a lopsided panel is computed - if a wide search area needs to zoom out further than
// `minZoom` allows to actually fit next to a wide panel, the offset gets computed at too-tight a zoom
// and overshoots by hundreds of real kilometres, which `maxBounds` then clamps to its own edge -
// "locked to Australia" with the area nowhere near where it landed. A low floor here just gives the
// fit its own room to work; `maxBounds` is still what stops the map wandering off South Australia.
const MIN_ZOOM = 3;

// The same brand teal token app/pages/_shared/map-view.tsx uses for its own "this is the
// highlighted area" state, reused here for the same semantic (the current search boundary) so the
// two map widgets read consistently if a user sees both.
const BOUNDARY_COLOR = "var(--color-brand-600)";

/** A single compact zoom pill (+ over -, one shared border and a thin divider) rather than two
 *  separate floating buttons - real DEW tokens, not the full `Button` component, since nothing in
 *  `components/base/**` draws a merged two-cell pill like this (same "compose from tokens when no
 *  real component matches" precedent as this file's own boundary chips elsewhere in the search
 *  UI). Replaces Leaflet's own default zoom chrome, which never carried this design system's
 *  tokens to begin with. Both docking corners sit at a 16px inset (`top-4`/`right-4`/`left-4`),
 *  the same inset as the floating cards over the map. The focus ring is drawn inset (`ring-inset`), the same technique `Table.Head` already
 *  uses for adjacent cells, so it never bleeds into the neighbouring button. */
/** Hands the real Leaflet map instance up to a parent rendered outside the `<MapContainer>` tree
 *  (e.g. zoom buttons living inside a floating results panel instead of on the map itself) -
 *  `useMap()` only works for a `MapContainer` descendant, so this is the one place that reads it
 *  and forwards it out via a plain callback. */
// The latest keyboard set-up for each dot layer, re-run whenever Leaflet (re)creates the dot's
// element: a layer can be removed and added again (React runs effects twice in development, and a
// dot is re-added when the map redraws), and each add makes a new SVG element.
const dotSetup = new WeakMap<L.Path, () => void>();
const dotBound = new WeakSet<L.Path>();

/** Makes a dot a real control for keyboard and screen-reader users: focusable in tab order, named
 *  by its label, opened with Enter or Space (the same as a click). Leaflet draws dots as bare SVG
 *  paths, which are neither. Runs again on every (re)add, and the ref callback is new on every
 *  render, so the key handler is always the latest one. */
function keyboardDot(label: string, activate: () => void) {
    return (layer: L.Path | null) => {
        if (!layer) return;
        const attach = () => {
            const el = layer.getElement();
            if (!el) return;
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", label);
            (el as SVGElement).onkeydown = (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                }
            };
        };
        dotSetup.set(layer, attach);
        if (!dotBound.has(layer)) {
            dotBound.add(layer);
            layer.on("add", () => dotSetup.get(layer)?.());
        }
        attach();
    };
}

/** The smallest a restricted block is drawn, across, in pixels: at state-wide zoom a 10 km block is a speck, so it is
 *  drawn this big around the same centre instead of disappearing. It only ever grows, so the drawn block is never
 *  smaller than the area the record could be in. */
const MIN_BLOCK_PX = 14;

/** Keeps the map true to the box it is in. Leaflet measures its container once and again only when the window resizes, so a
 *  map in a dialog that reaches its size after the map mounted drew its shapes for the old size (a circle cut off along a
 *  straight edge). This re-measures whenever the container itself changes size. */
function ResizeSync() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
        observer.observe(container);
        return () => observer.disconnect();
    }, [map]);
    return null;
}

/** A restricted record's block: the square cell of the generalisation grid that contains it, drawn flat with a thin
 *  edge and no centre mark (a blur or a dot would point at a place inside it). Pixel-aware, so it re-sizes itself on
 *  every zoom. */
function FuzzyArea({ marker, highlighted, onClick }: { marker: SAMapMarker; highlighted: boolean; onClick?: () => void }) {
    const map = useMap();
    const [zoom, setZoom] = useState(() => map.getZoom());
    useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
    const block = marker.fuzzyBlock as GeoBlock;
    const [centreLat, centreLon] = [(block.south + block.north) / 2, (block.west + block.east) / 2];
    const metersPerPixel = (40075016.686 * Math.cos((centreLat * Math.PI) / 180)) / 2 ** (zoom + 8);
    const minHalfLat = (MIN_BLOCK_PX / 2) * metersPerPixel / 111000;
    const halfLat = Math.max((block.north - block.south) / 2, minHalfLat);
    const halfLon = Math.max((block.east - block.west) / 2, minHalfLat / Math.cos((centreLat * Math.PI) / 180));
    const fill = markerFill(marker, highlighted);
    return (
        <Rectangle
            ref={onClick ? keyboardDot(marker.label, onClick) : undefined}
            bounds={[
                [centreLat - halfLat, centreLon - halfLon],
                [centreLat + halfLat, centreLon + halfLon],
            ]}
            pathOptions={{
                className: "map-fuzzy-area",
                stroke: true,
                color: fill,
                weight: highlighted ? 2 : 1,
                opacity: 0.8,
                fillColor: fill,
                fillOpacity: highlighted ? 0.45 : 0.25,
            }}
            eventHandlers={{ click: () => onClick?.() }}
        >
            <Tooltip direction="top" sticky>
                {marker.label}
            </Tooltip>
        </Rectangle>
    );
}

function MapReady({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
    const map = useMap();
    useEffect(() => {
        onMapReady?.(map);
    }, [map, onMapReady]);
    return null;
}

function ZoomControls({ position }: { position: "top-right" | "top-left" }) {
    const map = useMap();
    return <MapZoomButtons map={map} className={cx("absolute top-4 z-[1000]", position === "top-left" ? "left-4" : "right-4")} />;
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
        // Padding describes what floats over the map (a card, a sheet). Leaflet's own fit-to-bounds
        // math (`_getBoundsCenterZoom`) turns a lopsided padding straight into a pixel offset applied
        // at whatever zoom it lands on - when that offset is large and the zoom got floored at
        // `minZoom` (too little room left to actually fit the area), the offset overshoots into real
        // distances of hundreds of kilometres, and `maxBounds` then clamps the view to its own edge
        // instead of the area itself - the exact "point ends up on the wrong side of the state" bug
        // this was flagged for. Capped at 50% of the map (not 78%) so a wide panel never eats more
        // than half the room to fit into, keeping the offset - and the risk of hitting maxBounds -
        // small regardless of how the panel is sized.
        const size = map.getSize();
        const capX = size.x * 0.5;
        const capY = size.y * 0.5;
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
        // Same 50% cap as FlyToBoundaries above, same reason.
        const tl = L.point(Math.min(paddingTopLeft[0], size.x * 0.5), Math.min(paddingTopLeft[1], size.y * 0.5));
        const br = L.point(Math.min(paddingBottomRight[0], size.x * 0.5), Math.min(paddingBottomRight[1], size.y * 0.5));
        map.flyToBounds(bounds, { paddingTopLeft: tl, paddingBottomRight: br, duration: 0.6 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, map]);

    return null;
}

/** Centres one point - a clicked record's own dot - in the map's currently *visible* area whenever
 *  `request.key` changes, per direct feedback ("if I click on a species or a record, the dot needs
 *  to be centred always"): a dot sitting under the results panel, or crammed at the map's raw edge
 *  next to the peek card, isn't actually visible even though it's technically "on screen". Deliberately
 *  pan-only, not `flyToBounds` - the zoom level is left exactly as the user set it; only the centre
 *  moves. Uses the same padding-offset maths Leaflet's own `_getBoundsCenterZoom` uses internally
 *  (see `FlyToBoundaries` above) but applies it directly at the map's *current* zoom instead of
 *  computing a new one, so a record click can never itself trigger a zoom change. */
function PanToRecord({
    request,
    paddingTopLeft = [48, 48],
    paddingBottomRight = [48, 48],
}: {
    request?: { key: number; point: [number, number] };
    paddingTopLeft?: [number, number];
    paddingBottomRight?: [number, number];
}) {
    const map = useMap();
    const key = request?.key;

    useEffect(() => {
        if (!request) return;
        const zoom = map.getZoom();
        const size = map.getSize();
        const tl = L.point(Math.min(paddingTopLeft[0], size.x * 0.5), Math.min(paddingTopLeft[1], size.y * 0.5));
        const br = L.point(Math.min(paddingBottomRight[0], size.x * 0.5), Math.min(paddingBottomRight[1], size.y * 0.5));
        const paddingOffset = br.subtract(tl).divideBy(2);
        const center = map.unproject(map.project(request.point, zoom).add(paddingOffset), zoom);
        map.flyTo(center, zoom, { duration: 0.5 });
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

const OUTLINE_STYLE = { color: BOUNDARY_COLOR, weight: 2, dashArray: "6 6", fill: false } as const;

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
    /** Draw the on-map zoom pill (default true). The floating Explore layout turns this off and
     *  drives the same map instance from its own zoom buttons inside the results panel instead
     *  (via `onMapReady`), per direct feedback that on-map buttons weren't earning their corner. */
    showZoomControls?: boolean;
    /** Called once with the real Leaflet map instance, so a parent rendered outside this
     *  component's own `<MapContainer>` tree can drive it directly (zoom, pan, ...). */
    onMapReady?: (map: L.Map) => void;
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
    /** Centre this point whenever `key` changes ("a record was selected") - pans only, never
     *  changes zoom, so the same click that opens a record's summary card also brings its dot
     *  into the visible area instead of leaving it wherever it happened to already be. */
    panRequest?: { key: number; point: [number, number] };
    /** Reference areas drawn as a dashed outline with no fill or pin (for example, the area a
     *  location must sit inside). The map fits them too, so the whole allowed area is in view. */
    outlines?: Boundary[];
    className?: string;
}

export interface SAMapMarker {
    id: string;
    position: [number, number];
    label: string;
    /** A restricted (Level 2) record: drawn as this block of the generalisation grid instead of a
     *  dot, so the map never pins a sensitive species. `position` is the block's centre, for fitting
     *  and panning only; it is not drawn. */
    fuzzyBlock?: GeoBlock;
    /** Fill colour (a token var), e.g. the record's species group; brand when omitted. */
    color?: string;
}

/** A dot's fill: its own colour, or brand. A highlighted dot keeps its colour (so the group still
 *  reads) and gets a dark ring instead; a plain brand dot darkens as before. */
function markerFill(marker: SAMapMarker, highlighted: boolean): string {
    if (marker.color) return marker.color;
    return highlighted ? "var(--color-brand-900)" : BOUNDARY_COLOR;
}

export default function SAMap({
    boundaries,
    onBoundaryAdd,
    activeDrawTool,
    onDrawToolChange,
    fitPaddingTopLeft,
    fitPaddingBottomRight,
    zoomPosition = "top-right",
    showZoomControls = true,
    onMapReady,
    showBoundaries = true,
    markers,
    onMarkerClick,
    highlightedMarkerId,
    highlightedBoundaryIds,
    fitRequest,
    panRequest,
    outlines = [],
    className,
}: SAMapProps) {
    return (
        <div className={className}>
            <MapContainer
                center={SA_CENTER}
                zoom={6}
                minZoom={MIN_ZOOM}
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
                {showZoomControls && <ZoomControls position={zoomPosition} />}
                <MapReady onMapReady={onMapReady} />
                <DrawBridge activeDrawTool={activeDrawTool} onDrawToolChange={onDrawToolChange} onBoundaryAdd={onBoundaryAdd} />
                <FlyToBoundaries boundaries={outlines.length ? [...boundaries, ...outlines] : boundaries} paddingTopLeft={fitPaddingTopLeft} paddingBottomRight={fitPaddingBottomRight} />
                <FlyToRequest request={fitRequest} paddingTopLeft={fitPaddingTopLeft} paddingBottomRight={fitPaddingBottomRight} />
                <PanToRecord request={panRequest} paddingTopLeft={fitPaddingTopLeft} paddingBottomRight={fitPaddingBottomRight} />

                {outlines.map((o) =>
                    o.kind === "circle" ? (
                        <Circle key={`outline-${o.id}`} center={o.center} radius={o.radiusKm * 1000} pathOptions={OUTLINE_STYLE} interactive={false} />
                    ) : (
                        <Polygon key={`outline-${o.id}`} positions={o.points} pathOptions={OUTLINE_STYLE} interactive={false} />
                    ),
                )}
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

                {markers?.map((marker) =>
                    marker.fuzzyBlock ? (
                        <FuzzyArea
                            key={marker.id}
                            marker={marker}
                            highlighted={marker.id === highlightedMarkerId}
                            onClick={onMarkerClick ? () => onMarkerClick(marker.id) : undefined}
                        />
                    ) : (
                    <CircleMarker
                        key={marker.id}
                        ref={onMarkerClick ? keyboardDot(marker.label, () => onMarkerClick(marker.id)) : undefined}
                        center={marker.position}
                        radius={marker.id === highlightedMarkerId ? 10 : 6}
                        pathOptions={{
                            color: marker.color && marker.id === highlightedMarkerId ? "var(--ui-text-primary)" : "var(--ui-bg-primary)",
                            weight: 2,
                            fillColor: markerFill(marker, marker.id === highlightedMarkerId),
                            fillOpacity: 1,
                        }}
                        eventHandlers={{ click: () => onMarkerClick?.(marker.id) }}
                    >
                        <Tooltip direction="top" offset={[0, -6]}>
                            {marker.label}
                        </Tooltip>
                    </CircleMarker>
                    ),
                )}
                <ResizeSync />
            </MapContainer>
        </div>
    );
}

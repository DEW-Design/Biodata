// Shared geo primitives for the map search tool (app/pages/observations) - kept separate
// from the map component itself so the pure math/data has no dependency on Leaflet or React and
// can be unit-reasoned about (and reused by any future search entry point) on its own.

/** A single search boundary - either a circle (drawn, or derived from coordinates/a location
 *  picker) or a hand-drawn polygon. `label` is set when the boundary has a human-readable name
 *  (a selected national park) rather than just raw coordinates.
 *
 *  Multiple boundaries can be active at once (per direct feedback: "allow to add multiple
 *  location selections") - `id` gives each one a stable identity for list rendering/removal, and
 *  `source` marks the ones derived from a live-selected national park (`park:<id>`) so that
 *  selection can recompute/remove its own boundary without touching independently drawn or
 *  entered ones. Boundaries with no `source` (drawn shapes, entered coordinates) are only ever
 *  added or removed by an explicit user action, never recomputed. */
export type Boundary = { id: string; source?: string } & (
    | { kind: "circle"; center: [number, number]; radiusKm: number; label?: string }
    | { kind: "polygon"; points: [number, number][]; label?: string }
);

export interface NationalPark {
    id: string;
    name: string;
    /** Approximate centroid, not a surveyed boundary - good enough for "centre the search here",
     *  the same honestly-approximate convention as this codebase's other real-but-approximate
     *  geographic content (see app/pages/_shared/map-view.tsx's own comment on Highcharts' map
     *  data). */
    lat: number;
    lon: number;
}

// Real South Australian national parks (a Conservation Park/Regional Reserve is a distinct,
// lower protection tier in SA's own system, so this list is scoped to the state's actual
// National Parks only, per the user's direct request for "national parks in South Australia").
export const SA_NATIONAL_PARKS: NationalPark[] = [
    { id: "belair", name: "Belair National Park", lat: -35.02, lon: 138.65 },
    { id: "canunda", name: "Canunda National Park", lat: -37.48, lon: 140.1 },
    { id: "coffin-bay", name: "Coffin Bay National Park", lat: -34.62, lon: 135.45 },
    { id: "coorong", name: "Coorong National Park", lat: -35.79, lon: 139.29 },
    { id: "deep-creek", name: "Deep Creek National Park", lat: -35.65, lon: 138.3 },
    { id: "flinders-chase", name: "Flinders Chase National Park", lat: -35.95, lon: 136.71 },
    { id: "flinders-ranges", name: "Flinders Ranges National Park", lat: -31.49, lon: 138.6 },
    { id: "gammon-ranges", name: "Vulkathunha-Gammon Ranges National Park", lat: -30.49, lon: 139.23 },
    { id: "innes", name: "Innes National Park", lat: -35.36, lon: 136.99 },
    { id: "lake-eyre", name: "Lake Eyre National Park", lat: -28.9, lon: 137.3 },
    { id: "lincoln", name: "Lincoln National Park", lat: -34.9, lon: 135.87 },
    { id: "mount-remarkable", name: "Mount Remarkable National Park", lat: -32.8, lon: 138.14 },
    { id: "murray-river", name: "Murray River National Park", lat: -34.18, lon: 140.63 },
    { id: "naracoorte-caves", name: "Naracoorte Caves National Park", lat: -36.97, lon: 140.8 },
    { id: "nullarbor", name: "Nullarbor National Park", lat: -31.43, lon: 130.9 },
    { id: "onkaparinga-river", name: "Onkaparinga River National Park", lat: -35.19, lon: 138.46 },
    { id: "witjira", name: "Witjira National Park", lat: -26.06, lon: 135.72 },
];

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Standard ray-casting point-in-polygon test (the PNPOLY algorithm) - more than sufficient for the
// small, hand-drawn polygons this tool produces; no need for a full geospatial library.
export function isPointInPolygon([pLat, pLon]: [number, number], polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [latI, lonI] = polygon[i];
        const [latJ, lonJ] = polygon[j];
        const crosses = lonI > pLon !== lonJ > pLon && pLat < ((latJ - latI) * (pLon - lonI)) / (lonJ - lonI) + latI;
        if (crosses) inside = !inside;
    }
    return inside;
}

export function isPointInBoundary(point: [number, number], boundary: Boundary | null): boolean {
    if (!boundary) return false;
    return boundary.kind === "circle" ? haversineDistanceKm(point, boundary.center) <= boundary.radiusKm : isPointInPolygon(point, boundary.points);
}

/** A record matches the search if it falls inside ANY of the active boundaries - the union of
 *  every circle/polygon the user has added, not just the most recent one. */
export function isPointInAnyBoundary(point: [number, number], boundaries: Boundary[]): boolean {
    return boundaries.some((boundary) => isPointInBoundary(point, boundary));
}

function formatPoint([lat, lon]: [number, number]): string {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

/** Deliberately reduces a coordinate's precision for a sensitive/`"Level 2"` species record (see
 *  `LicenceLevel` in search-data.ts) - snaps both lat and lon to the centre of a grid cell sized to
 *  the requested radius (≈111km per degree of latitude, close enough for this illustrative build's
 *  own already-approximate coordinates - see `NationalPark`'s own doc comment on that convention),
 *  rather than adding random jitter. Deterministic and honestly reproducible: the same input always
 *  obfuscates to the same output, unlike a random offset that would silently "wander" a sensitive
 *  species' displayed location on every render. This is the same real BDBSA mechanic already
 *  documented in .claude/rules/ref-domain.md, "BDBSA domain research" - a sensitive species' precise location is
 *  withheld even when the rest of its project is public. */
export function obfuscateCoordinate(lat: number, lon: number, radiusKm: number): { lat: number; lon: number; radiusKm: number } {
    // The centre of the block (`generalisedBlock`) a record is shown as. It is still a point that is within
    // half a block of the real one, so it is never shown: the map draws the block, search matches the block,
    // and tables say "withheld". It stays exported for the reports that already use it.
    const gridDeg = radiusKm / 111;
    const snap = (value: number) => Math.round(value / gridDeg) * gridDeg;
    return { lat: Number(snap(lat).toFixed(2)), lon: Number(snap(lon).toFixed(2)), radiusKm };
}

/** `source` of the whole-state search area (see `wholeStateBoundary`). */
export const WHOLE_STATE_SOURCE = "region:sa";

/**
 * "All of South Australia" as a search area, for a keyword-only search (the header search sends a
 * species or record term to Explore with no drawn area). A circle centred on the state that covers
 * every record in the dataset, so it goes through the same spatial filter as any other area - no
 * separate "no area" code path. Marked with `source` so it can be summarised by name.
 */
export function wholeStateBoundary(): Boundary {
    return { id: "whole-state", source: WHOLE_STATE_SOURCE, kind: "circle", center: [-32, 135], radiusKm: 1000, label: "All of South Australia" };
}

export function boundarySummary(boundary: Boundary): string {
    if (boundary.source === WHOLE_STATE_SOURCE) return "All of South Australia";
    if (boundary.kind === "circle") {
        const place = boundary.label ?? formatPoint(boundary.center);
        return `${boundary.radiusKm} km radius around ${place}`;
    }
    // Per direct feedback: list every vertex's own lat/long rather than just a point count -
    // each point is a "lat, lon" pair, points themselves separated by " | " so the pair's own
    // comma can't be confused with the separator between points.
    return `Polygon: ${boundary.points.map(formatPoint).join(" | ")}`;
}

// ── Generalised blocks (restricted records) ──
// A restricted (Level 2) record is never located by a point, a circle or its coordinates. It is shown, and
// searched, as a square block of a fixed grid: the cell that contains it, `blockKm` wide (restrictedRadiusKm in
// search-data.ts is the one place the size is set). The block tells you the record is somewhere in it and nothing
// more, so it has no centre to read: the map draws it flat, the tables withhold the coordinates, and a search area
// finds the record when it overlaps the block, never by testing the real point (testing the real point lets anyone
// narrow a small search area down to where the record is).

/** A block of the generalisation grid, in degrees. */
export interface GeoBlock {
    south: number;
    west: number;
    north: number;
    east: number;
}

/** The block of the `blockKm` grid that contains this point (the grid is in degrees, about 111 km to a degree). */
export function generalisedBlock(lat: number, lon: number, blockKm: number): GeoBlock {
    const step = blockKm / 111;
    const snap = (value: number) => Math.round(value / step) * step;
    const centreLat = snap(lat);
    const centreLon = snap(lon);
    return { south: centreLat - step / 2, north: centreLat + step / 2, west: centreLon - step / 2, east: centreLon + step / 2 };
}

export function blockCentre(block: GeoBlock): [number, number] {
    return [(block.south + block.north) / 2, (block.west + block.east) / 2];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function segmentsCross(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): boolean {
    const side = (p: [number, number], q: [number, number], r: [number, number]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b);
}

/** Whether a search area overlaps a block: a circle when the block's nearest point is within its radius, a polygon
 *  when a corner of either is inside the other or their edges cross. */
export function blockTouchesBoundary(block: GeoBlock, boundary: Boundary): boolean {
    if (boundary.kind === "circle") {
        const nearest: [number, number] = [clamp(boundary.center[0], block.south, block.north), clamp(boundary.center[1], block.west, block.east)];
        return haversineDistanceKm(nearest, boundary.center) <= boundary.radiusKm;
    }
    const corners: [number, number][] = [
        [block.south, block.west],
        [block.south, block.east],
        [block.north, block.east],
        [block.north, block.west],
    ];
    if (corners.some((corner) => isPointInPolygon(corner, boundary.points))) return true;
    if (boundary.points.some(([lat, lon]) => lat >= block.south && lat <= block.north && lon >= block.west && lon <= block.east)) return true;
    return boundary.points.some((point, i) => {
        const next = boundary.points[(i + 1) % boundary.points.length];
        return corners.some((corner, j) => segmentsCross(point, next, corner, corners[(j + 1) % 4]));
    });
}

/** Whether a record is inside any active search area: a record shown as a block by the block, every other record by
 *  its point. `blockKm` is null for a record shown as recorded. */
export function isRecordInAnyBoundary(lat: number, lon: number, blockKm: number | null, boundaries: Boundary[]): boolean {
    if (!blockKm) return isPointInAnyBoundary([lat, lon], boundaries);
    const block = generalisedBlock(lat, lon, blockKm);
    return boundaries.some((boundary) => blockTouchesBoundary(block, boundary));
}

// Parses a user-uploaded shapefile into search areas for the map search tool
// (app/pages/observations/option-1). Real parsing via `shpjs`, entirely client-side, no backend:
//  - a .zip of the whole shapefile (the usual way shapefiles are shared), or
//  - the component files picked together (.shp required; .dbf/.prj/.cpg optional), or
//  - a .geojson / .json file.
// When a .prj is included, `shpjs` reprojects to WGS84 (lat/long) itself, so a GDA94/GDA2020 MGA
// shapefile works as long as its .prj comes with it.
import type { Geometry, Position } from "geojson";

export interface ShapefileLayer {
    id: string;
    /** File name as uploaded - shown in the search-areas list. */
    name: string;
    /** Point features, as [lat, lon]. Searched with a radius around each point. */
    points: [number, number][];
    /** Polygon features (outer ring only), as [lat, lon][]. Searched by point-in-polygon. */
    polygons: [number, number][][];
    /** Line features, which don't define an area, so they're skipped (and reported as such). */
    skipped: number;
}

const MAX_FEATURES = 500;

const toLatLon = ([lon, lat]: Position): [number, number] => [lat, lon];

function collect(geometry: Geometry | null, layer: ShapefileLayer) {
    if (!geometry) return;
    switch (geometry.type) {
        case "Point":
            layer.points.push(toLatLon(geometry.coordinates));
            break;
        case "MultiPoint":
            geometry.coordinates.forEach((c) => layer.points.push(toLatLon(c)));
            break;
        case "Polygon":
            layer.polygons.push(geometry.coordinates[0].map(toLatLon));
            break;
        case "MultiPolygon":
            geometry.coordinates.forEach((poly) => layer.polygons.push(poly[0].map(toLatLon)));
            break;
        case "GeometryCollection":
            geometry.geometries.forEach((g) => collect(g, layer));
            break;
        default:
            layer.skipped += 1;
    }
}

function extensionOf(file: File) {
    return file.name.toLowerCase().split(".").pop() ?? "";
}

async function readGeometries(files: File[]): Promise<{ name: string; geometries: (Geometry | null)[] }> {
    const byExt = new Map(files.map((f) => [extensionOf(f), f]));

    const geojson = byExt.get("geojson") ?? byExt.get("json");
    if (geojson) {
        const data = JSON.parse(await geojson.text());
        const features = data.type === "FeatureCollection" ? data.features : data.type === "Feature" ? [data] : [{ geometry: data }];
        return { name: geojson.name, geometries: features.map((f: { geometry: Geometry | null }) => f.geometry) };
    }

    const { default: shp } = await import("shpjs");
    const zip = byExt.get("zip");
    const shpFile = byExt.get("shp");
    let result;
    let name: string;
    if (zip) {
        result = await shp(await zip.arrayBuffer());
        name = zip.name;
    } else if (shpFile) {
        result = await shp({
            shp: await shpFile.arrayBuffer(),
            dbf: await byExt.get("dbf")?.arrayBuffer(),
            prj: await byExt.get("prj")?.text(),
            cpg: await byExt.get("cpg")?.text(),
        });
        name = shpFile.name;
    } else {
        throw new Error("Choose a .zip shapefile, a .shp file (with its .dbf/.prj if you have them), or a .geojson file.");
    }
    const collections = Array.isArray(result) ? result : [result];
    return { name, geometries: collections.flatMap((c) => c.features.map((f) => f.geometry)) };
}

export async function parseShapefileUpload(files: File[]): Promise<ShapefileLayer> {
    let parsed;
    try {
        parsed = await readGeometries(files);
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("Choose")) throw error;
        throw new Error("We couldn't read that file. Check it's a valid shapefile or GeoJSON.");
    }

    const layer: ShapefileLayer = { id: `shp-${Date.now()}`, name: parsed.name, points: [], polygons: [], skipped: 0 };
    parsed.geometries.forEach((g) => collect(g, layer));

    const count = layer.points.length + layer.polygons.length;
    if (count === 0) {
        throw new Error(
            layer.skipped > 0
                ? "This file only contains lines. Upload points or polygons to define a search area."
                : "No locations were found in this file.",
        );
    }
    if (count > MAX_FEATURES) {
        throw new Error(`This file has ${count} locations - the limit is ${MAX_FEATURES}.`);
    }
    const allCoords = [...layer.points, ...layer.polygons.flat()];
    if (allCoords.some(([lat, lon]) => Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
        throw new Error("The coordinates aren't latitude/longitude. Include the .prj file (or upload the whole shapefile as a .zip) so it can be converted.");
    }
    return layer;
}

export function shapefileLayerSummary(layer: ShapefileLayer): string {
    const parts: string[] = [];
    if (layer.points.length) parts.push(`${layer.points.length} point${layer.points.length === 1 ? "" : "s"}`);
    if (layer.polygons.length) parts.push(`${layer.polygons.length} polygon${layer.polygons.length === 1 ? "" : "s"}`);
    return `${layer.name} · ${parts.join(", ")}`;
}

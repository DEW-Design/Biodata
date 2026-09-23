// Minimal typing for the untyped `shpjs` package (shapefile -> GeoJSON), covering only what
// shapefile.ts uses: a zipped shapefile buffer, or its component files passed individually.
declare module "shpjs" {
    import type { FeatureCollection } from "geojson";

    type ShpResult = FeatureCollection & { fileName?: string };
    type Input = ArrayBuffer | { shp: ArrayBuffer; dbf?: ArrayBuffer; prj?: string | ArrayBuffer; cpg?: string | ArrayBuffer };

    export default function getShapefile(input: Input): Promise<ShpResult | ShpResult[]>;
}

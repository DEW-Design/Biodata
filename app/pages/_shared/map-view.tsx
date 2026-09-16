"use client";

// The plain `"highcharts"`/`"highcharts/modules/map"` entry points resolve to Highcharts' classic
// UMD build, whose modules expect a real global `window.Highcharts` (with `.Axis`/`.Color`/etc.
// already attached) to exist before they load - true when Highcharts is loaded via a `<script>`
// tag, not true for a plain ESM `import` under Turbopack, which crashed with "Cannot read
// properties of undefined (reading 'Axis')" the moment a map chart tried to construct. The
// `esm/` subpath is Highcharts' own real ESM build (`import * as from "../highcharts.js"`
// internally) built for exactly this - bundler-native, no global required.
import Highcharts from "highcharts/esm/highcharts";
import "highcharts/esm/modules/map";
import HighchartsReact from "highcharts-react-official";
import auTopology from "@highcharts/map-collection/countries/au/au-all.topo.json";

// A real map, built on Highcharts Maps (the `highcharts/modules/map` plugin) plus Highcharts'
// own official map data package (`@highcharts/map-collection`) - not a fabricated grid or an
// invented boundary. Replaces the "Map view" placeholder box on the Flora and Fauna Dashboard's
// Overview and Flora tabs, per the user directly ("bring in map view from Highcharts"), option-1
// only.
//
// Highcharts' public map collection only goes down to state/territory level for Australia - no
// South Australian mapsheet or LGA boundaries are bundled with it - so this shows real Australian
// state geometry with South Australia highlighted, honestly, rather than faking a per-mapsheet
// heatmap grid the underlying data doesn't support. `hc-key: "au-sa"` is the real join key
// Highcharts' own topology uses for South Australia (confirmed by inspecting the bundled
// `au-all.geo.json`), not a guess.
const SA_KEY = "au-sa";

const mapData = (auTopology as { objects: { default: { geometries: Array<{ properties?: { "hc-key"?: string } }> } } }).objects.default.geometries.map(
  (geometry) => ({
    "hc-key": geometry.properties?.["hc-key"],
    color: geometry.properties?.["hc-key"] === SA_KEY ? "var(--color-brand-600)" : "var(--color-gray-200)",
    enableMouseTracking: geometry.properties?.["hc-key"] === SA_KEY,
  }),
);

export function MapView() {
  const options: Highcharts.Options = {
    chart: {
      map: auTopology as unknown as Highcharts.TopoJSON,
      backgroundColor: "transparent",
      height: 380,
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { enabled: false },
    mapNavigation: { enabled: false },
    legend: { enabled: false },
    tooltip: { headerFormat: "", pointFormat: "{point.name}" },
    series: [
      {
        type: "map",
        data: mapData,
        joinBy: "hc-key",
        borderColor: "var(--color-bg-primary)",
        borderWidth: 1,
        states: { hover: { color: "var(--color-brand-700)" } },
        dataLabels: { enabled: false },
      },
    ],
  };

  return (
    <div className="min-h-[380px] flex-1 overflow-hidden rounded-md">
      <HighchartsReact highcharts={Highcharts} constructorType="mapChart" options={options} />
    </div>
  );
}

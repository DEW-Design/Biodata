"use client";

// The post-6-oct lab's map: Mapbox GL in place of the Leaflet map (sa-map.tsx), for every read-only map in this page (a record's location, a project's
// extent), put in by MapEngineProvider (the designer, 20 Oct 2026: "only in the /proto/post-6-oct page, can we replace leaflet map viewer with mapbox?").
// It takes the same props as the Leaflet map and draws the same things: the areas (circles and polygons), the dashed reference outlines, one dot per
// marker, a restricted record's flat block (never a pin), the zoom pill, a metric scale bar, fit-to-areas, "zoom to this area" and "centre this record".
// What it does not do: draw. The draw tools (`activeDrawTool`, `onBoundaryAdd`) belong to the location picker, which is not routed through the map engine
// and keeps Leaflet; `onMapReady` hands out a Leaflet map and is not called.
// It needs a Mapbox public token in NEXT_PUBLIC_MAPBOX_TOKEN (.env.local, not committed; restart the dev server after setting it). Without one it says so
// instead of showing an empty box.
// Dots are real buttons (DOM markers), so they are in the tab order, named by their label and opened with Enter or Space, as the Leaflet map's dots are.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file; the shared side only knows the engine slot (map-engine.tsx).

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapZoomButtons } from "@/app/pages/_shared/map-search/map-zoom-buttons";
import type { Boundary, GeoBlock } from "@/app/pages/_shared/map-search/geo";
import type { SAMapMarker, SAMapProps } from "@/app/pages/_shared/map-search/sa-map";
import { cx } from "@/utils/cx";
import { applyBrandPalette } from "./map-palette";

const STYLE ="mapbox://styles/mapbox/light-v11";
const SA_CENTER: [number, number] = [135.8, -30.5];
// Same box as the Leaflet map: the east edge is past South Australia's own so a fit with a panel over the right does not slide under it.
const SA_MAX_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [124, -40],
  [152, -23],
];
// Mapbox zoom is one below Leaflet's for the same view (512px tiles): Leaflet's 3 to 16 is 2 to 15.
const MIN_ZOOM = 2;
const MAX_ZOOM = 15;
const BRAND = "var(--color-brand-600)";
const BRAND_DARK = "var(--color-brand-900)";
/** The smallest a restricted block is drawn, across, in pixels, as on the Leaflet map: at state-wide zoom a 10 km block would be a speck. */
const MIN_BLOCK_PX = 14;
const CIRCLE_STEPS = 72;

/** Turns any CSS colour (a token as `var(--color-brand-600)`, a name) into the `rgb()` string Mapbox paint needs. */
function cssColor(probe: HTMLElement, value: string) {
  probe.style.color = "";
  probe.style.color = value;
  return getComputedStyle(probe).color;
}

const circleRing = ([lat, lon]: [number, number], radiusKm: number): [number, number][] => {
  const dLat = radiusKm / 111.32;
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= CIRCLE_STEPS; i++) {
    const a = (i / CIRCLE_STEPS) * 2 * Math.PI;
    ring.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return ring;
};

const boundaryRing = (b: Boundary): [number, number][] => {
  if (b.kind === "circle") return circleRing(b.center, b.radiusKm);
  const ring = b.points.map(([lat, lon]): [number, number] => [lon, lat]);
  return ring.length > 0 ? [...ring, ring[0]] : ring;
};

const polygon = (ring: [number, number][], properties: Record<string, unknown>): GeoJSON.Feature<GeoJSON.Polygon> => ({
  type: "Feature",
  properties,
  geometry: { type: "Polygon", coordinates: [ring] },
});

const collection = (features: GeoJSON.Feature[]): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });

function boundsOf(boundaries: Boundary[]) {
  const bounds = new mapboxgl.LngLatBounds();
  for (const b of boundaries) for (const point of boundaryRing(b)) bounds.extend(point);
  return bounds;
}

/** Fit padding, capped at half the map so a wide panel never eats the room the area has to fit into (the Leaflet map's rule). */
function cappedPadding(map: mapboxgl.Map, tl: [number, number], br: [number, number]) {
  const { clientWidth: w, clientHeight: h } = map.getContainer();
  return {
    left: Math.min(tl[0], w * 0.5),
    top: Math.min(tl[1], h * 0.5),
    right: Math.min(br[0], w * 0.5),
    bottom: Math.min(br[1], h * 0.5),
  };
}

/** A restricted record's block as a polygon, grown around its centre to at least MIN_BLOCK_PX across at this zoom. */
function blockRing(block: GeoBlock, zoom: number): [number, number][] {
  const centreLat = (block.south + block.north) / 2;
  const centreLon = (block.west + block.east) / 2;
  const cos = Math.cos((centreLat * Math.PI) / 180);
  const metresPerPixel = (40075016.686 * cos) / 2 ** (zoom + 9);
  const minHalfLat = ((MIN_BLOCK_PX / 2) * metresPerPixel) / 111000;
  const halfLat = Math.max((block.north - block.south) / 2, minHalfLat);
  const halfLon = Math.max((block.east - block.west) / 2, minHalfLat / cos);
  return [
    [centreLon - halfLon, centreLat - halfLat],
    [centreLon + halfLon, centreLat - halfLat],
    [centreLon + halfLon, centreLat + halfLat],
    [centreLon - halfLon, centreLat + halfLat],
    [centreLon - halfLon, centreLat - halfLat],
  ];
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapboxMap(props: SAMapProps) {
  if (!TOKEN) {
    return (
      <div className={cx("grid place-items-center bg-secondary p-6 text-center", props.className)}>
        <p className="m-0 max-w-sm text-sm text-tertiary text-balance">
          The Mapbox map needs a public token. Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local and restart the dev server.
        </p>
      </div>
    );
  }
  return <Viewer {...props} token={TOKEN} />;
}

function Viewer({
  boundaries,
  fitPaddingTopLeft = [48, 48],
  fitPaddingBottomRight = [48, 48],
  zoomPosition = "top-right",
  showZoomControls = true,
  showBoundaries = true,
  markers,
  onMarkerClick,
  highlightedMarkerId,
  highlightedBoundaryIds,
  fitRequest,
  panRequest,
  outlines = [],
  className,
  token,
}: SAMapProps & { token: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const probe = useRef<HTMLSpanElement>(null);
  const fitted = useRef(false);
  const dots = useRef(new Map<string, { marker: mapboxgl.Marker; el: HTMLButtonElement }>());
  // The latest click handler and tooltip, read by listeners made once.
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  });
  const padTl = fitPaddingTopLeft;
  const padBr = fitPaddingBottomRight;

  // The map, made once.
  useEffect(() => {
    if (!box.current) return;
    mapboxgl.accessToken = token;
    const m = new mapboxgl.Map({
      container: box.current,
      style: STYLE,
      center: SA_CENTER,
      zoom: 5,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: SA_MAX_BOUNDS,
      attributionControl: false,
      // Nothing here has ever rotated: the Leaflet map does not, so neither does this one.
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    m.touchZoomRotate.disableRotation();
    m.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    m.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
    // A map in a dialog reaches its size after it mounted: keep it true to its box.
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(box.current);
    // The style's own greys become the design system's colours as soon as it is parsed, before the first frame, so the stock look is never seen (map-palette.ts).
    m.on("style.load", () => applyBrandPalette(m, (token) => cssColor(probe.current!, token)));
    m.on("load", () => {
      const brand = cssColor(probe.current!, BRAND);
      m.addSource("outlines", { type: "geojson", data: collection([]) });
      m.addLayer({ id: "outlines", type: "line", source: "outlines", paint: { "line-color": brand, "line-width": 2, "line-dasharray": [3, 3] } });
      m.addSource("areas", { type: "geojson", data: collection([]) });
      m.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        paint: { "fill-color": brand, "fill-opacity": ["case", ["==", ["get", "on"], 1], 0.32, 0.15] },
      });
      m.addLayer({
        id: "areas-line",
        type: "line",
        source: "areas",
        paint: { "line-color": brand, "line-width": ["case", ["==", ["get", "on"], 1], 4, 2] },
      });
      m.addSource("blocks", { type: "geojson", data: collection([]) });
      m.addLayer({
        id: "blocks-fill",
        type: "fill",
        source: "blocks",
        paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", ["==", ["get", "on"], 1], 0.45, 0.25] },
      });
      m.addLayer({
        id: "blocks-line",
        type: "line",
        source: "blocks",
        paint: { "line-color": ["get", "color"], "line-opacity": 0.8, "line-width": ["case", ["==", ["get", "on"], 1], 2, 1] },
      });
      // A block is pointed at and opened like a dot: its label on hover, its id on click.
      const tip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "font-barlow text-xs" });
      m.on("mousemove", "blocks-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        m.getCanvas().style.cursor = onMarkerClickRef.current ? "pointer" : "";
        tip
          .setLngLat(e.lngLat)
          .setText(String(f.properties?.label ?? ""))
          .addTo(m);
      });
      m.on("mouseleave", "blocks-fill", () => {
        m.getCanvas().style.cursor = "";
        tip.remove();
      });
      m.on("click", "blocks-fill", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onMarkerClickRef.current?.(String(id));
      });
      setReady(true);
    });
    const dotMap = dots.current;
    setMap(m);
    return () => {
      observer.disconnect();
      dotMap.forEach(({ marker }) => marker.remove());
      dotMap.clear();
      m.remove();
      setMap(null);
      setReady(false);
      fitted.current = false;
    };
  }, [token]);

  // The areas, the reference outlines and the restricted blocks, redrawn when they change and as the zoom changes (a block has a smallest size).
  const areasKey = JSON.stringify([
    boundaries,
    outlines,
    showBoundaries,
    markers?.map((x) => [x.id, x.fuzzyBlock, x.color]),
    highlightedMarkerId,
    highlightedBoundaryIds ? [...highlightedBoundaryIds] : null,
  ]);
  useEffect(() => {
    if (!map || !ready || !probe.current) return;
    const colour = (value: string) => cssColor(probe.current!, value);
    const draw = () => {
      (map.getSource("areas") as mapboxgl.GeoJSONSource).setData(
        collection(showBoundaries ? boundaries.map((b) => polygon(boundaryRing(b), { id: b.id, on: highlightedBoundaryIds?.has(b.id) ? 1 : 0 })) : []),
      );
      (map.getSource("outlines") as mapboxgl.GeoJSONSource).setData(collection(outlines.map((b) => polygon(boundaryRing(b), { id: b.id }))));
      const zoom = map.getZoom();
      (map.getSource("blocks") as mapboxgl.GeoJSONSource).setData(
        collection(
          (markers ?? [])
            .filter((x) => x.fuzzyBlock)
            .map((x) =>
              polygon(blockRing(x.fuzzyBlock as GeoBlock, zoom), {
                id: x.id,
                label: x.label,
                on: x.id === highlightedMarkerId ? 1 : 0,
                color: colour(x.color ?? (x.id === highlightedMarkerId ? BRAND_DARK : BRAND)),
              }),
            ),
        ),
      );
    };
    draw();
    map.on("zoomend", draw);
    return () => {
      map.off("zoomend", draw);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, areasKey]);

  // One dot per marker, as a real button.
  const dotsKey = JSON.stringify([
    markers?.filter((x) => !x.fuzzyBlock).map((x) => [x.id, x.position, x.label, x.color]),
    markers?.filter((x) => x.fuzzyBlock).map((x) => [x.id, x.position, x.label]),
    highlightedMarkerId,
  ]);
  useEffect(() => {
    if (!map) return;
    const wanted = new Map<string, SAMapMarker>((markers ?? []).map((x) => [x.id, x]));
    for (const [id, entry] of dots.current) {
      if (!wanted.has(id)) {
        entry.marker.remove();
        dots.current.delete(id);
      }
    }
    for (const x of wanted.values()) {
      const on = x.id === highlightedMarkerId;
      // A restricted block has no dot to see, but it is still reached by keyboard: a transparent button over its centre.
      const size = x.fuzzyBlock ? 24 : on ? 20 : 12;
      let entry = dots.current.get(x.id);
      if (!entry) {
        const el = document.createElement("button");
        el.type = "button";
        const tip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "font-barlow text-xs" });
        el.addEventListener("mouseenter", () => tip.setLngLat([x.position[1], x.position[0]]).setText(x.label).addTo(map));
        el.addEventListener("mouseleave", () => tip.remove());
        el.addEventListener("click", () => onMarkerClickRef.current?.(x.id));
        entry = { marker: new mapboxgl.Marker({ element: el }).setLngLat([x.position[1], x.position[0]]).addTo(map), el };
        dots.current.set(x.id, entry);
      }
      const { el, marker } = entry;
      marker.setLngLat([x.position[1], x.position[0]]);
      el.setAttribute("aria-label", x.label);
      el.style.cssText = x.fuzzyBlock
        ? `width:${size}px;height:${size}px;border-radius:50%;background:transparent;border:0;padding:0;cursor:${onMarkerClickRef.current ? "pointer" : "default"}`
        : [
            `width:${size}px`,
            `height:${size}px`,
            "border-radius:50%",
            "padding:0",
            "border:2px solid " + (x.color && on ? "var(--ui-text-primary)" : "var(--ui-bg-primary)"),
            "background:" + (x.color ?? (on ? BRAND_DARK : BRAND)),
            `cursor:${onMarkerClickRef.current ? "pointer" : "default"}`,
          ].join(";");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, dotsKey]);

  // Fit every area (and reference outline) in view: the first fit is a jump, later ones fly.
  const fitKey = JSON.stringify([boundaries, outlines, padTl, padBr]);
  useEffect(() => {
    if (!map) return;
    const all = [...boundaries, ...outlines];
    if (all.length === 0) return;
    const options = { padding: cappedPadding(map, padTl, padBr), maxZoom: MAX_ZOOM - 1 };
    if (!fitted.current) {
      fitted.current = true;
      map.fitBounds(boundsOf(all), { ...options, animate: false });
    } else {
      map.fitBounds(boundsOf(all), { ...options, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);

  // "Zoom to this area".
  useEffect(() => {
    if (!map || !fitRequest || fitRequest.boundaries.length === 0) return;
    map.fitBounds(boundsOf(fitRequest.boundaries), { padding: cappedPadding(map, padTl, padBr), maxZoom: MAX_ZOOM - 1, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitRequest?.key]);

  // "Centre this record": pan only, the zoom is left as the person set it, with the point centred in the part of the map that is visible.
  useEffect(() => {
    if (!map || !panRequest) return;
    const [lat, lon] = panRequest.point;
    const pad = cappedPadding(map, padTl, padBr);
    map.easeTo({ center: [lon, lat], offset: [(pad.left - pad.right) / 2, (pad.top - pad.bottom) / 2], duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, panRequest?.key]);

  return (
    // The scale bar is Mapbox's own control: its near-black frame and text are brought into the palette (a warm neutral frame, the neutral text colour, Barlow). The `!` is needed because
    // mapbox-gl.css is not in a cascade layer and so beats every utility, whatever its specificity.
    <div className={cx("relative [&_.mapboxgl-ctrl-scale]:border-gray-500! [&_.mapboxgl-ctrl-scale]:font-barlow [&_.mapboxgl-ctrl-scale]:text-gray-700!", className)}>
      <div ref={box} className="size-full" />
      {/* Used to turn a colour token into the rgb() Mapbox paint takes. */}
      <span ref={probe} aria-hidden className="hidden" />
      {showZoomControls && <MapZoomButtons map={map} className={cx("absolute top-4 z-10", zoomPosition === "top-left" ? "left-4" : "right-4")} />}
    </div>
  );
}

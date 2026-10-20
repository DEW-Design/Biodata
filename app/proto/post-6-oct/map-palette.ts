// The lab map's colours: Mapbox's `light-v11` style recoloured with the design system's tokens (the designer, 20 Oct 2026: "maps looks black and white, anyway to use dew branding to
// make it look nicer and more cohesive with the ui?"). The stock style is entirely grey (every colour in it is `hsl(220, 5% or less, ...)`), so the map read as a screenshot dropped into a
// branded page. Every colour here is a `--color-*` token from app/globals.css, resolved to the rgb() Mapbox paint takes by the caller, so the map changes with the tokens and no hex is
// written down (CONTRACTS 2.1); a layer that is not named here keeps Mapbox's own paint.
// What the colours say, in order of weight: the project's areas are the one thing in brand teal and the only saturated mark (`areas-*` in mapbox-map.tsx), so everything under them is
// quiet. Water is a pale brand tint, a step darker than the areas' own wash so the two do not read as one at a coast; green space is the accent (sage) tint of about the same lightness, told
// apart from water by hue (greyer, greener) and by shape; land is the lightest warm neutral, the page's own surface; roads are left white, which on warm land now reads as a line, where on stock grey it read as a gap. Labels go from Mapbox's mid greys (2 to 3.9:1 on the land) to
// the neutral text steps, darker for larger places: suburb and road names 7:1 on the land (5.6:1 over a project's wash), the softest (small places, points of interest) 4.95:1 on the land
// and 3.9:1 over the wash, and water labels (brand-600 on the water tint, 4.95:1) and green-space labels (accent-900, 5.8:1) take the brand and accent text colours. Ratios by the WCAG formula.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import type mapboxgl from "mapbox-gl";

const LAND = "var(--color-gray-50)";
const BUILT = "var(--color-gray-100)";
const WATER = "var(--color-brand-200)";
const GREEN = "var(--color-accent-200)";
const GLACIER = "var(--color-brand-50)";

const BOUNDARY_FAINT = "var(--color-gray-200)";
const BOUNDARY = "var(--color-gray-400)";
const PATH_UNDER = "var(--color-gray-200)";
const EDGE = "var(--color-gray-300)";

const TEXT_STRONG = "var(--color-gray-800)";
const TEXT = "var(--color-gray-700)";
const TEXT_SOFT = "var(--color-gray-600)";
const TEXT_WATER = "var(--color-brand-600)";
const TEXT_GREEN = "var(--color-accent-900)";

/** Recolours the style's own layers. Call it once the style has loaded (`style.load`), before the first frame is drawn, so the grey is never seen. */
export function applyBrandPalette(map: mapboxgl.Map, colour: (token: string) => string) {
  const set = (ids: string[], property: Parameters<mapboxgl.Map["setPaintProperty"]>[1], value: Parameters<mapboxgl.Map["setPaintProperty"]>[2]) => {
    for (const id of ids) if (map.getLayer(id)) map.setPaintProperty(id, property, value);
  };

  // Land and what sits on it.
  set(["land"], "background-color", colour(LAND));
  set(["land-structure-polygon"], "fill-color", colour(LAND));
  set(["land-structure-line"], "line-color", colour(LAND));
  set(["national-park"], "fill-color", colour(GREEN));
  set(
    ["landuse"],
    "fill-color",
    ["match", ["get", "class"], ["park", "grass", "wood", "scrub", "pitch", "agriculture"], colour(GREEN), "glacier", colour(GLACIER), colour(BUILT)],
  );
  set(["building"], "fill-color", colour(BUILT));
  set(["building"], "fill-outline-color", colour(EDGE));

  // Water.
  set(["water"], "fill-color", colour(WATER));
  set(["waterway"], "line-color", colour(WATER));

  // Under-the-road lines and rail, in warm greys; the roads themselves stay white.
  set(["tunnel-path-trail", "tunnel-path-cycleway-piste", "tunnel-path", "tunnel-steps", "tunnel-pedestrian", "bridge-case-simple", "bridge-rail"], "line-color", colour(PATH_UNDER));
  set(["road-rail"], "line-color", colour(EDGE));

  // Boundaries.
  set(["admin-1-boundary-bg", "admin-0-boundary-bg"], "line-color", colour(BOUNDARY_FAINT));
  set(["admin-1-boundary", "admin-0-boundary", "admin-0-boundary-disputed"], "line-color", colour(BOUNDARY));

  // Labels: the larger the place, the darker the text.
  set(["settlement-major-label"], "text-color", ["step", ["get", "symbolrank"], colour(TEXT_STRONG), 11, colour(TEXT), 16, colour(TEXT_SOFT)]);
  set(["settlement-minor-label"], "text-color", ["step", ["get", "symbolrank"], colour(TEXT), 11, colour(TEXT_SOFT)]);
  set(["settlement-subdivision-label", "road-label-simple"], "text-color", colour(TEXT));
  set(["airport-label", "state-label", "country-label", "continent-label", "poi-label"], "text-color", colour(TEXT_SOFT));
  set(["waterway-label", "water-line-label", "water-point-label"], "text-color", colour(TEXT_WATER));
  set(["natural-line-label", "natural-point-label"], "text-color", colour(TEXT_GREEN));
}

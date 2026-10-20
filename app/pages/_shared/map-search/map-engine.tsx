"use client";

// Which map draws a read-only map. Every map that sits inside a page goes through ExpandableMap, which draws the Leaflet map (sa-map.tsx) unless a
// screen puts a different one in this context. Nothing does by default, so every screen draws Leaflet exactly as before; the post-6-oct lab provides
// a Mapbox one (app/proto/post-6-oct/mapbox-map.tsx), so only that page changes (the designer, 20 Oct 2026: "only in the /proto/post-6-oct page").
// A map you draw on (the location picker, project registration) is not routed through this: it keeps Leaflet's draw tools.

import { createContext, useContext, type ReactNode } from "react";
import type { SAMapProps } from "./sa-map";

/** Draws a map for these props. A function, not a component, so choosing it at render is not a component made during render. */
export type MapRenderer = (props: SAMapProps) => ReactNode;

const MapEngineContext = createContext<MapRenderer | null>(null);

/** Draws every read-only map below it with `render` instead of the default Leaflet map. */
export function MapEngineProvider({ render, children }: { render: MapRenderer; children: ReactNode }) {
  return <MapEngineContext.Provider value={render}>{children}</MapEngineContext.Provider>;
}

/** The map a screen has asked for, or null for the default. */
export const useMapEngine = () => useContext(MapEngineContext);

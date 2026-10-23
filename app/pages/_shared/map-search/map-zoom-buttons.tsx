"use client";

import { ZoomIn, ZoomOut } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { MAP_SURFACE_EDGE, MAP_SURFACE_RULE } from "@/app/pages/_shared/map-search/map-surface";

// The zoom in/out pair. Two 44px buttons (they were 36px; 44px is the touch minimum): they are stacked edge to edge, so there is no room to extend a smaller button without the two targets touching,
// and the group's `overflow-hidden` (for its rounded corners) would clip an extension anyway; so the buttons themselves are the target. SAMap renders it on the map by default; a screen that lays out its own
// floating map chrome renders it in that layout instead (SAMap `showZoomControls={false}`, the map
// from `onMapReady`), so it stacks with the other floating panels and can never sit on top of one.
// Takes anything that can zoom (a Leaflet or a Mapbox map), so this file imports neither and is safe outside the ssr:false map bundle.
type Zoomable = { zoomIn: () => unknown; zoomOut: () => unknown };
export function MapZoomButtons({ map, className }: { map: Zoomable | null; className?: string }) {
  const buttonClass =
    "flex size-11 items-center justify-center text-tertiary outline-hidden transition-colors duration-100 ease-linear hover:bg-primary_hover hover:text-secondary active:bg-secondary focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset";
  return (
    <div className={cx("flex flex-col overflow-hidden rounded-lg bg-primary shadow-md", MAP_SURFACE_EDGE, className)}>
      <button type="button" aria-label="Zoom in" onClick={() => map?.zoomIn()} className={cx(buttonClass, "border-b", MAP_SURFACE_RULE)}>
        <ZoomIn className="size-5" />
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => map?.zoomOut()} className={buttonClass}>
        <ZoomOut className="size-5" />
      </button>
    </div>
  );
}

"use client";

import type { Map as LeafletMap } from "leaflet";
import { ZoomIn, ZoomOut } from "@untitledui/icons";
import { cx } from "@/utils/cx";

// The zoom in/out pair. SAMap renders it on the map by default; a screen that lays out its own
// floating map chrome renders it in that layout instead (SAMap `showZoomControls={false}`, the map
// from `onMapReady`), so it stacks with the other floating panels and can never sit on top of one.
// Type-only Leaflet import: this file is safe to import outside the ssr:false map bundle.
export function MapZoomButtons({ map, className }: { map: LeafletMap | null; className?: string }) {
  const buttonClass =
    "flex size-9 items-center justify-center text-tertiary outline-hidden transition-colors duration-100 ease-linear hover:bg-primary_hover hover:text-secondary active:bg-secondary focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset";
  return (
    <div className={cx("flex flex-col overflow-hidden rounded-lg border border-secondary bg-primary shadow-md", className)}>
      <button type="button" aria-label="Zoom in" onClick={() => map?.zoomIn()} className={cx(buttonClass, "border-b border-secondary")}>
        <ZoomIn className="size-4" />
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => map?.zoomOut()} className={buttonClass}>
        <ZoomOut className="size-4" />
      </button>
    </div>
  );
}

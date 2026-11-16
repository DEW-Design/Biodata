"use client";

import { ZoomIn, ZoomOut } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { MAP_SURFACE_EDGE, MAP_SURFACE_RULE } from "@/app/pages/_shared/map-search/map-surface";

// The zoom in/out pair. Two 44px buttons (they were 36px; 44px is the touch minimum): they are stacked edge to edge, so there is no room to extend a smaller button without the two targets touching,
// and the group's `overflow-hidden` (for its rounded corners) would clip an extension anyway; so the buttons themselves are the target. SAMap renders it on the map by default; a screen that lays out its own
// floating map chrome renders it in that layout instead (SAMap `showZoomControls={false}`, the map
// from `onMapReady`), so it stacks with the other floating panels and can never sit on top of one.
// Takes anything that can zoom (a Leaflet or a Mapbox map), so this file imports neither and is safe outside the ssr:false map bundle.
type Zoomable = { zoomIn: () => unknown; zoomOut: () => unknown };
export function MapZoomButtons({ map, className }: { map: Zoomable | null; className?: string }) {
  // The design system's icon button (`ButtonUtility`: its press, focus ring and tooltip), drawn 44px and square so the pair fills the joined box; they were raw buttons
  // until 11 Nov 2026. The two touch, so the hit-area extension is off (`after:content-none`, CONTRACTS 2.16): the buttons themselves are the 44px target.
  const buttonClass = "size-11 rounded-none text-tertiary after:content-none hover:text-secondary focus-visible:z-10 focus-visible:-outline-offset-2";
  return (
    <div className={cx("flex flex-col overflow-hidden rounded-lg bg-primary shadow-md", MAP_SURFACE_EDGE, className)}>
      <ButtonUtility color="tertiary" size="sm" icon={ZoomIn} tooltip="Zoom in" tooltipPlacement="left" onPress={() => map?.zoomIn()} className={cx(buttonClass, "border-b", MAP_SURFACE_RULE)} />
      <ButtonUtility color="tertiary" size="sm" icon={ZoomOut} tooltip="Zoom out" tooltipPlacement="left" onPress={() => map?.zoomOut()} className={buttonClass} />
    </div>
  );
}

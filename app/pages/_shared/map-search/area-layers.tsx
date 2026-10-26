"use client";

import type { FC } from "react";
import { Circle, Map02, MarkerPin02, Pentagon, UploadCloud02 } from "@untitledui/icons";
import { Tag, TagGroup, TagList } from "@/components/base/tags/tags";
import { ScrollFade } from "@/app/pages/_shared/map-search/scroll-fade";

// The search areas, as chips: one removable chip per area you have added (a drawn shape, an entered point, a national park, a shapefile), each with the icon of what it is and its name. Pointing at a chip outlines its
// shape on the map, and pointing at a shape on the map draws its chip as pointed at; pressing either takes the map to the area (a pointer and a fill say it can be pressed). That is all it does (designer, 23 Oct 2026: "keep search layers nice and tidy ... remove all the bs controls for now"): a row used to carry an eye to hide the area from the search, its radius and record
// count, a menu to rename it or change its radius, and a click to zoom to it, with a "Clear all" above; those are gone for now, and an area is removed by its X (New search clears them all).
//
// It sits inside the floating search card (Explore has no column 2), under the card's "Search results" heading. The chips are the design system's large Tag (28px high) with its label at 12px, the size of the "Search results" heading above them (12/600, uppercase), and wrap, and where there are more than three lines of them the list scrolls inside its own height
// (`ScrollFade`: a fade, and the product's drawn thumb), so the results below keep their room.

export type AreaKind = "circle" | "polygon" | "point" | "park" | "shapefile";

export interface AreaChip {
  id: string;
  name: string;
  kind: AreaKind;
}

// The icons the "Add area" menu already uses for the same methods (one icon per concept, 2.4).
const KIND_ICON: Record<AreaKind, FC<{ className?: string }>> = {
  circle: Circle,
  polygon: Pentagon,
  point: MarkerPin02,
  park: Map02,
  shapefile: UploadCloud02,
};

export function AreaLayerChips({
  areas,
  highlightedId,
  onRemove,
  onHover,
  onZoom,
}: {
  areas: AreaChip[];
  /** The area whose shape is under the pointer on the map: its chip is drawn as pointed at. */
  highlightedId: string | null;
  onRemove: (id: string) => void;
  /** Told which area the pointer is over (a chip), or none. */
  onHover: (id: string | null) => void;
  /** Press a chip: the map goes to that area. */
  onZoom: (id: string) => void;
}) {
  if (areas.length === 0) return null;
  return (
    <div>
      {/* Room for a chip's focus ring (2px, 2px out) so the list's own scroll does not cut it. */}
      <ScrollFade axis="y" fade={24} className="-m-1 max-h-28 overscroll-contain p-1">
        <TagGroup label="Search areas" size="lg" textSize="xs" onAction={(key) => onZoom(String(key))} onRemove={(keys) => [...keys].forEach((key) => onRemove(String(key)))}>
          <TagList className="flex flex-wrap gap-2">
            {areas.map((area) => (
              <Tag key={area.id} id={area.id} icon={KIND_ICON[area.kind]} highlighted={highlightedId === area.id} onHoverChange={(hovered) => onHover(hovered ? area.id : null)}>
                {area.name}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      </ScrollFade>
    </div>
  );
}

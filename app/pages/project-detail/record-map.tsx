"use client";

// A record's location on a map, read only, with the shared "Full screen" button (ExpandableMap), so every map
// on the record page can be opened large the same way as the location picker's.

import { blockCentre, generalisedBlock, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { ExpandableMap } from "@/app/pages/_shared/map-search/expandable-map";
import type { SAMapMarker } from "@/app/pages/_shared/map-search/sa-map";
import type { SurveyRecord } from "./survey-data";

const noop = () => {};

/** The block size a generalised record without its own `blockKm` is shown at: the 0.1 degree grid its position has
 *  always been rounded to (about 11 km). Records from the survey seed carry their own size, the same one Explore
 *  uses (`restrictedRadiusKm` in search-data.ts). */
export const RESTRICTED_BLOCK_KM = 11.1;

/** What a record's map shows: the picked location, or, for a restricted record, only the square block it is in (flat,
 *  no centre mark, never a circle or a coordinate). The block comes from the record's own position, never the
 *  rounded one the page shows elsewhere, so it is the same block Explore draws. */
export function recordMapShape(record: SurveyRecord, lat: number, lon: number): { boundaries: Boundary[]; markers?: SAMapMarker[]; showBoundaries?: boolean } {
  if (!record.locationNote) {
    return {
      boundaries: [record.location?.boundary ?? { id: `pt-${record.id}`, kind: "circle", center: [lat, lon], radiusKm: 0.2 }],
    };
  }
  const blockKm = record.blockKm ?? RESTRICTED_BLOCK_KM;
  const block = generalisedBlock(record.lat, record.lon, blockKm);
  const centre = blockCentre(block);
  return {
    // A hidden circle a little larger than the block, so the whole block is in view.
    boundaries: [{ id: `pt-${record.id}`, kind: "circle", center: centre, radiusKm: blockKm * 1.5 }],
    showBoundaries: false,
    markers: [{ id: `block-${record.id}`, position: centre, label: `Somewhere in this ${Math.round(blockKm)} km block`, fuzzyBlock: block }],
  };
}

export function RecordMap({
  record,
  lat,
  lon,
  className,
}: {
  record: SurveyRecord;
  lat: number;
  lon: number;
  className?: string;
}) {
  return (
    <ExpandableMap
      title={`${record.name} · location`}
      {...recordMapShape(record, lat, lon)}
      onBoundaryAdd={noop}
      activeDrawTool={null}
      onDrawToolChange={noop}
      className={className}
    />
  );
}

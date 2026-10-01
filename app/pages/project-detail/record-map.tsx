"use client";

// A record's location on a map, read only, with the shared "Full screen" button (ExpandableMap).

import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import { ExpandableMap } from "@/app/pages/_shared/map-search/expandable-map";
import type { SurveyRecord } from "./survey-data";

const noop = () => {};

/** The shape a record's map shows: the picked location, or a generalised circle for a restricted record. */
export function recordBoundary(
  record: SurveyRecord,
  lat: number,
  lon: number,
): Boundary {
  if (!record.locationNote && record.location?.boundary)
    return record.location.boundary;
  return {
    id: `pt-${record.id}`,
    kind: "circle",
    center: [lat, lon],
    radiusKm: record.locationNote ? 10 : 0.2,
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
      boundaries={[recordBoundary(record, lat, lon)]}
      onBoundaryAdd={noop}
      activeDrawTool={null}
      onDrawToolChange={noop}
      className={className}
    />
  );
}

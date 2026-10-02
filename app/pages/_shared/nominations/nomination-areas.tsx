"use client";

import { useState } from "react";
import { Map01, Plus, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { AddLocationModal } from "@/app/pages/_shared/dla/add-location-modal";
import { boundarySummary } from "@/app/pages/_shared/map-search/geo";
import { ExpandableMap } from "@/app/pages/_shared/map-search/expandable-map";
import { areaMethodLabel, type NominationArea } from "@/app/pages/_shared/nominations/nomination-data";

// The Location attribute's areas: the places whose records of this species are obscured. Adding
// one reuses DLA's "Add a Location" modal (shapefile, draw on the map, national park, coordinates),
// which is the same four methods the lo-fi draws; the map preview reuses Explore's SAMap, with the shared Full screen button (ExpandableMap). Nothing
// here is a new component - it composes existing ones for this attribute.

/** A read-only map of the areas, fitted to them. */
export function AreasMap({ areas, className = "h-72" }: { areas: NominationArea[]; className?: string }) {
  return (
    <ExpandableMap
      title="Obscured areas"
      boundaries={areas.map((a) => a.boundary)}
      onBoundaryAdd={() => {}}
      activeDrawTool={null}
      onDrawToolChange={() => {}}
      fitRequest={{ key: areas.length, boundaries: areas.map((a) => a.boundary) }}
      className={className}
    />
  );
}

function AreaRow({ area, index, onRemove }: { area: NominationArea; index: number; onRemove?: () => void }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-secondary bg-primary p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-quaternary">Area {index + 1}</span>
          <Badge size="sm" color="gray">
            {areaMethodLabel(area)}
          </Badge>
        </div>
        <span className="text-sm font-medium text-primary">{area.name}</span>
        <span className="truncate text-xs text-tertiary" title={boundarySummary(area.boundary)}>
          {boundarySummary(area.boundary)}
        </span>
      </div>
      {onRemove && <Button color="tertiary" size="sm" iconLeading={Trash01} aria-label={`Remove ${area.name}`} onPress={onRemove} />}
    </li>
  );
}

/** The read-only list, for the record page and the review step. */
export function AreaList({ areas }: { areas: NominationArea[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {areas.map((area, i) => (
        <AreaRow key={area.id} area={area} index={i} />
      ))}
    </ul>
  );
}

/** The editable list under the Location attribute row. */
export function AreasEditor({ areas, onChange, invalid }: { areas: NominationArea[]; onChange: (areas: NominationArea[]) => void; invalid?: boolean }) {
  const [adding, setAdding] = useState(false);
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-secondary p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-secondary">
          Areas to obscure <span className="font-normal text-tertiary">({areas.length})</span>
        </p>
        {areas.length > 0 && (
          <Button color="link-gray" size="sm" iconLeading={Map01} onPress={() => setShowMap((v) => !v)}>
            {showMap ? "Hide map" : "View on map"}
          </Button>
        )}
      </div>
      {areas.length === 0 ? (
        <p className={invalid ? "text-sm text-error-primary" : "text-sm text-tertiary"}>
          Add the places where records of this species should be obscured: draw them, upload a shapefile, pick a national park or enter coordinates.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {areas.map((area, i) => (
            <AreaRow key={area.id} area={area} index={i} onRemove={() => onChange(areas.filter((a) => a.id !== area.id))} />
          ))}
        </ul>
      )}
      {showMap && areas.length > 0 && <AreasMap areas={areas} />}
      <div>
        <Button color="secondary" size="sm" iconLeading={Plus} onPress={() => setAdding(true)}>
          Add area
        </Button>
      </div>
      <AddLocationModal
        isOpen={adding}
        onOpenChange={setAdding}
        onAdd={(location) => onChange([...areas, { id: location.id, name: location.name, method: location.method, boundary: location.boundary }])}
      />
    </div>
  );
}

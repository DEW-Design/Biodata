"use client";

// A record's location on a map, read only, with the same "Full screen" button the location picker
// has (top left, clear of the zoom buttons), so every map on the record page can be opened large.

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Maximize02, Minimize02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { blockCentre, generalisedBlock, type Boundary } from "@/app/pages/_shared/map-search/geo";
import { cx } from "@/utils/cx";
import type { SAMapMarker } from "@/app/pages/_shared/map-search/sa-map";
import type { SurveyRecord } from "./survey-data";

const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-secondary" />,
});

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
  const [full, setFull] = useState(false);
  const shape = recordMapShape(record, lat, lon);
  return (
    <>
      <div
        className={cx(
          "relative isolate overflow-hidden rounded-lg border border-secondary",
          className,
        )}
      >
        <SAMap
          {...shape}
          onBoundaryAdd={noop}
          activeDrawTool={null}
          onDrawToolChange={noop}
          className="size-full"
        />
        <Button
          color="secondary"
          size="sm"
          iconLeading={Maximize02}
          className="absolute top-3 left-3 z-[1001] shadow-md"
          onClick={() => setFull(true)}
        >
          Full screen
        </Button>
      </div>
      <ModalOverlay
        isOpen={full}
        onOpenChange={setFull}
        isDismissable
        className="fixed inset-0 z-[9999] bg-overlay/70"
      >
        <Modal className="fixed inset-0 z-[9999] flex flex-col bg-primary outline-hidden">
          <Dialog
            aria-label={`${record.name} location`}
            className="font-barlow flex h-full flex-col outline-hidden"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary p-4">
              <p className="text-sm font-semibold text-primary">
                {record.name}{" "}
                <span className="font-normal text-tertiary">· location</span>
              </p>
              <Button
                color="secondary"
                size="sm"
                iconLeading={Minimize02}
                onClick={() => setFull(false)}
              >
                Exit full screen
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <SAMap
                {...shape}
                onBoundaryAdd={noop}
                activeDrawTool={null}
                onDrawToolChange={noop}
                className="size-full"
              />
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

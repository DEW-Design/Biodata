"use client";

// A record's location on a map, read only, with the same "Full screen" button the location picker
// has (top left, clear of the zoom buttons), so every map on the record page can be opened large.

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Maximize02, Minimize02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { Boundary } from "@/app/pages/_shared/map-search/geo";
import { cx } from "@/utils/cx";
import type { SurveyRecord } from "./survey-data";

const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-secondary" />,
});

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
  const [full, setFull] = useState(false);
  const boundaries = [recordBoundary(record, lat, lon)];
  return (
    <>
      <div
        className={cx(
          "relative isolate overflow-hidden rounded-lg border border-secondary",
          className,
        )}
      >
        <SAMap
          boundaries={boundaries}
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
                boundaries={boundaries}
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

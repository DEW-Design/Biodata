"use client";

// Every map that sits inside a page (a project's extent, a record's location, a nomination's areas,
// a location being drawn) gets the same "Full screen" button: top left, clear of the zoom buttons
// at the top right, opening the same map at full size with an "Exit full screen" bar above it.
// It is the record map's button (record-map.tsx), made shared so every map has it the same way.
// The location picker in project registration keeps its own expand, which carries its draw tools.
//
// The full-screen map is the same SAMap with the same props, so drawing, markers and fitting work
// there too. `toolbar` adds controls to the full-screen bar (a map you draw on passes its draw
// buttons). Inside a modal, pass `overModal` so the full-screen map opens above that modal.

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Maximize02, Minimize02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { SAMapProps } from "@/app/pages/_shared/map-search/sa-map";
import { MODAL_Z_INDEX } from "@/lib/layers";
import { cx } from "@/utils/cx";

const SAMap = dynamic(() => import("@/app/pages/_shared/map-search/sa-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-secondary" />,
});

export function ExpandableMap({
  title,
  toolbar,
  overModal = false,
  className,
  ...map
}: Omit<SAMapProps, "className"> & {
  /** What the map shows, named in the full-screen bar and as the dialog's label. */
  title: string;
  /** Extra controls for the full-screen bar, before "Exit full screen". */
  toolbar?: ReactNode;
  /** The map sits inside a modal: open the full-screen map above it. */
  overModal?: boolean;
  /** The inline map's box (its height). */
  className?: string;
}) {
  const [full, setFull] = useState(false);
  const layer = overModal ? MODAL_Z_INDEX : "z-[9999]";
  return (
    <>
      <div className={cx("relative isolate overflow-hidden rounded-lg border border-secondary", className)}>
        <SAMap {...map} className="size-full" />
        <Button color="secondary" size="sm" iconLeading={Maximize02} className="absolute top-3 left-3 z-[1001] shadow-md" onClick={() => setFull(true)}>
          Full screen
        </Button>
      </div>
      <ModalOverlay isOpen={full} onOpenChange={setFull} isDismissable className={cx("fixed inset-0 bg-overlay/70", layer)}>
        <Modal className={cx("fixed inset-0 flex flex-col bg-primary outline-hidden", layer)}>
          <Dialog aria-label={title} className="font-barlow flex h-full flex-col outline-hidden">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-secondary p-4">
              <p className="text-sm font-semibold text-primary">{title}</p>
              <div className="flex flex-wrap items-center gap-3">
                {toolbar}
                <Button color="secondary" size="sm" iconLeading={Minimize02} onClick={() => setFull(false)}>
                  Exit full screen
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <SAMap {...map} className="size-full" />
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

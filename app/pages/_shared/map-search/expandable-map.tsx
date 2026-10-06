"use client";

// Every map that sits inside a page (a project's extent, a record's location, a nomination's areas,
// a location being drawn) gets the same "Expand" button: top left, clear of the zoom buttons at the top
// right. It opens the same map larger, and closes the same way every dialog in the app does: the X at
// the top right (or Escape, or a click outside). It is the record map's button (record-map.tsx), made
// shared so every map has it the same way. The location picker in project registration keeps its own
// expand, which carries its draw tools.
//
// Two ways to open, chosen per map (the designer, 2 Oct 2026):
//   "modal" (the default): a large dialog from the design system's Modal, the page dimmed behind it. For
//     the maps that are looked at: the project's extent, a record's location, a nomination's areas.
//   "takeover": the map across the whole window, for a map drawn on inside a modal (the DLA "Add a
//     location" map), where a modal on a modal would not do. Its bar carries the draw tools and the same X.
//
// The expanded map is the same SAMap with the same props, so drawing, markers and fitting work there
// too. `toolbar` adds controls to the title bar (a map you draw on passes its draw buttons). Inside a
// modal, pass `overModal` so a takeover opens above that modal.

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Maximize02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
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
  presentation = "modal",
  overModal = false,
  className,
  ...map
}: Omit<SAMapProps, "className"> & {
  /** What the map shows, named in the expanded map's title bar and as the dialog's label. */
  title: string;
  /** Extra controls for the title bar (a map you draw on passes its draw buttons), at its right. */
  toolbar?: ReactNode;
  /** A large dialog, or the map across the whole window (for a map drawn on inside a modal). */
  presentation?: "modal" | "takeover";
  /** The map sits inside a modal: open a takeover above it. */
  overModal?: boolean;
  /** The inline map's box (its height). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const layer = overModal ? MODAL_Z_INDEX : "z-[9999]";

  const bar = (
    <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-secondary py-2 pr-14 pl-4 sm:pl-6">
      <p className="m-0 min-w-0 truncate text-sm font-semibold text-primary">{title}</p>
      {toolbar && <div className="flex shrink-0 flex-wrap items-center gap-3">{toolbar}</div>}
    </div>
  );
  // The close X is in the corner of every dialog in the app (modal.tsx). Here it sits inside the title bar: the bar is at least
  // 56px tall and the X (36px) is 10px from the top, so it is centred in the bar and never reaches the divider under it.
  const close = <CloseButton theme="light" size="sm" label="Close map" className="absolute top-2.5 right-3 z-20 sm:right-4" />;

  return (
    <>
      <div className={cx("relative isolate overflow-hidden rounded-lg border border-secondary", className)}>
        <SAMap {...map} className="size-full" />
        <Button color="secondary" size="sm" iconLeading={Maximize02} aria-label={`Expand map: ${title}`} className="absolute top-3 left-3 z-[1001] shadow-md" onClick={() => setOpen(true)}>
          Expand
        </Button>
      </div>

      {presentation === "modal" ? (
        <ModalOverlay isOpen={open} onOpenChange={setOpen} isDismissable>
          <Modal className="h-[calc(var(--visual-viewport-height)-var(--modal-pt)-var(--modal-pb))] w-full max-w-[1600px] overflow-hidden">
            <Dialog aria-label={title} className="flex h-full max-h-full flex-col overflow-hidden">
              {bar}
              {close}
              <div className="min-h-0 flex-1">
                <SAMap {...map} className="size-full" />
              </div>
            </Dialog>
          </Modal>
        </ModalOverlay>
      ) : (
        <AriaModalOverlay isOpen={open} onOpenChange={setOpen} isDismissable className={cx("fixed inset-0 bg-overlay/70", layer)}>
          <AriaModal className={cx("fixed inset-0 flex flex-col bg-primary outline-hidden", layer)}>
            <AriaDialog aria-label={title} className="font-barlow relative flex h-full flex-col outline-hidden">
              {bar}
              {close}
              <div className="min-h-0 flex-1">
                <SAMap {...map} className="size-full" />
              </div>
            </AriaDialog>
          </AriaModal>
        </AriaModalOverlay>
      )}
    </>
  );
}

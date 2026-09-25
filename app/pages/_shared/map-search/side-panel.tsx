"use client";

import type { ReactNode } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { CloseButton } from "@/components/base/buttons/close-button";
import { MODAL_Z_INDEX } from "@/lib/layers";
import { cx } from "@/utils/cx";

// A real right-anchored slide-over, not the centred `Modal`/`ModalOverlay` pair in
// components/application/modals/modal.tsx - that pair hardcodes centre placement in its own
// className, so a right-side panel needed its own thin wrapper around the same real react-aria
// primitives (`ModalOverlay`/`Modal`/`Dialog`) rather than a prop bolted onto the centred one.
// Two real consumers on the map search results page: "Customise columns" and the record-detail
// panel opened by clicking a row - kept here (not components/custom) since neither has a
// stakeholder-decided home yet, matching this page's other page-shared pieces (sa-map.tsx).
export function SidePanel({
  isOpen,
  onOpenChange,
  title,
  headerActions,
  widthClassName = "max-w-md",
  side = "right",
  children,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  /** Extra controls rendered in the header, between the title and the close button - e.g. the
   *  record-detail sidebar's "expand/collapse all sections" toggle. Omit for a plain title-only
   *  header (every other consumer of this panel). */
  headerActions?: ReactNode;
  /** Tailwind max-width class for the panel - defaults to the original `max-w-md` (a plain
   *  label/value list). The record-detail sidebar passes a wider one to comfortably fit its
   *  Figma-matched accordion sections (label + value side by side, per row). */
  widthClassName?: string;
  /** Which viewport edge the panel slides in from - defaults to `"right"` (every pre-existing
   *  consumer: Customise columns, the generic column-detail panel, the record-detail sidebar).
   *  Species mode's own "All Filters" panel is the first `"left"` consumer, matching its Figma
   *  reference (node 2266:167054) exactly. */
  side?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={({ isEntering, isExiting }) =>
        cx(
          MODAL_Z_INDEX,
          "fixed inset-0 bg-overlay/70 backdrop-blur-[2px]",
          isEntering && "duration-300 ease-out animate-in fade-in",
          isExiting && "duration-200 ease-in animate-out fade-out",
        )
      }
    >
      <Modal
        className={({ isEntering, isExiting }) =>
          cx(
            "fixed inset-y-0 flex h-full w-full flex-col bg-primary shadow-xl outline-hidden",
            side === "right" ? "right-0" : "left-0",
            widthClassName,
            side === "right" &&
              (isEntering
                ? "duration-300 ease-out animate-in slide-in-from-right-[100%]"
                : isExiting
                  ? "duration-200 ease-in animate-out slide-out-to-right-[100%]"
                  : ""),
            side === "left" &&
              (isEntering
                ? "duration-300 ease-out animate-in slide-in-from-left-[100%]"
                : isExiting
                  ? "duration-200 ease-in animate-out slide-out-to-left-[100%]"
                  : ""),
          )
        }
      >
        {/* font-barlow - ModalOverlay/Modal portal straight to <body>, outside any font-scoping
            wrapper around the trigger, same reason components/application/modals/modal.tsx's own
            Dialog carries it explicitly. */}
        <Dialog className="font-barlow flex h-full flex-col outline-hidden">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary p-4">
            <Heading slot="title" className="flex-1 truncate text-base font-semibold text-primary">
              {title}
            </Heading>
            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
              <CloseButton size="sm" />
            </div>
          </div>
          {/* h-full min-h-0 - the sidebar itself is already pinned to the viewport height
              (inset-y-0 above), and this region takes exactly what's left under the header,
              scrolling its own content internally - the sidebar's own frame never grows past the
              viewport regardless of how much a record's accordion content expands to. */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

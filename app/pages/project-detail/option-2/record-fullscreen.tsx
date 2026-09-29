"use client";

// VERSION 3: the full-window view for one record. Viewing shows the details panel with its own
// toolbar (Exit full screen is in it); editing shows the inline editor. While editing, Escape and
// clicks outside do nothing, so a half-finished edit is never lost; Cancel asks first.

import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { MODAL_Z_INDEX } from "@/lib/layers";
import { cx } from "@/utils/cx";

export function RecordFullscreenV3({
  isOpen,
  isEditing,
  onClose,
  label,
  children,
}: {
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable={!isEditing}
      isKeyboardDismissDisabled={isEditing}
      className={cx(MODAL_Z_INDEX, "fixed inset-0 bg-primary")}
    >
      <Modal className="fixed inset-0 flex flex-col bg-primary outline-hidden">
        <Dialog
          aria-label={label}
          className="font-barlow h-full overflow-y-auto outline-hidden"
        >
          <div className="flex min-h-full w-full flex-col">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

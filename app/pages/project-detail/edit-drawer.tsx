"use client";

// The one edit surface for project detail Option 3: a wide panel from the right that holds a real
// `FormPage` (the same header, "Details missing" alert and footer the Add Project form uses), so
// editing a project section, a record, or adding a record all look and behave the same way.
//
// Why a drawer rather than inline editing: several edits here are too big for a card (the map
// picker, repeatable managers and permits, species and location pickers, measurement tables), and
// a drawer gives every one of them the same room, the same Save and Cancel, and the same "Details
// missing" validation, while the page behind stays in view for context. It can be widened to full
// screen for the map. Closing with unsaved changes asks first. The pattern is the side peek of
// Notion and Airtable's expanded record, with GOV.UK's "check your answers, then change" flow for
// getting from a summary to the right form.

import { useState, type ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { ArrowLeft, Maximize02, Minimize02, Trash01 } from "@untitledui/icons";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { MODAL_Z_INDEX } from "@/lib/layers";
import { cx } from "@/utils/cx";

export function EditDrawer({
  isOpen,
  title,
  context,
  isDirty,
  onClose,
  children,
}: {
  isOpen: boolean;
  /** For the dialog's accessible name; the visible title is the FormPage's own. */
  title: string;
  /** What is being edited, shown in the drawer's top bar ("Project BD-5039", "Site SU00501"). */
  context: string;
  isDirty: boolean;
  onClose: () => void;
  /** Given `requestClose`, which asks before discarding unsaved changes (wire it to Cancel). */
  children: (requestClose: () => void) => ReactNode;
}) {
  const [wide, setWide] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const requestClose = () => (isDirty ? setConfirm(true) : onClose());

  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => !open && requestClose()}
        isDismissable
        className={({ isEntering, isExiting }) =>
          cx(MODAL_Z_INDEX, "fixed inset-0 bg-overlay/70 backdrop-blur-[2px]", isEntering && "duration-300 ease-out animate-in fade-in", isExiting && "duration-200 ease-in animate-out fade-out")
        }
      >
        <Modal
          className={({ isEntering, isExiting }) =>
            cx(
              "fixed inset-y-0 right-0 flex h-full w-full flex-col bg-primary shadow-xl outline-hidden transition-[max-width] duration-200",
              wide ? "max-w-none" : "max-w-3xl",
              isEntering && "duration-300 ease-out animate-in slide-in-from-right-[100%]",
              isExiting && "duration-200 ease-in animate-out slide-out-to-right-[100%]",
            )
          }
        >
          <Dialog aria-label={title} className="font-barlow flex h-full flex-col outline-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary px-6 py-2">
              <p className="truncate text-xs font-medium text-tertiary">{context}</p>
              <Button
                color="tertiary"
                size="sm"
                iconLeading={wide ? Minimize02 : Maximize02}
                aria-label={wide ? "Exit full screen" : "Full screen"}
                onClick={() => setWide((w) => !w)}
              />
            </div>
            {children(requestClose)}
          </Dialog>
        </Modal>
      </ModalOverlay>
      <ConfirmationModal confirmIcon={Trash01} cancelIcon={ArrowLeft}
        isOpen={confirm}
        onOpenChange={setConfirm}
        title="Discard your changes?"
        description="You have changes that haven't been saved. Closing now will lose them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirm(false);
          onClose();
        }}
      />
    </>
  );
}

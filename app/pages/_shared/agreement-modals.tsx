"use client";

import { useState, type FC } from "react";
import { XCircle } from "@untitledui/icons";
import { TextArea } from "@/components/base/textarea/textarea";
import { FormModal } from "@/components/application/modals/modal";

// Shared between DSA and DLA's deep dives - both now go through the same Under Review -> Rejected
// step (see agreement-status.ts), and the reject reason is the same shape either way: a required
// free-text explanation. Previously duplicated as DLA's own `RejectModal`; DSA needed the identical
// thing once it gained the same review step, so this is the one shared version both import.
export function RejectModal({
  id,
  isOpen,
  onOpenChange,
  onReject,
  title = "Reject Request",
  description,
  submitLabel = "Confirm Rejection",
  fieldLabel = "Rejection Reason",
  placeholder = "Enter a description…",
  icon = XCircle,
  iconColor = "error",
}: {
  id: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
  /** The copy below is optional so the same "a reason is required" modal serves other decisions (a nomination returned for more information). */
  title?: string;
  description?: string;
  submitLabel?: string;
  fieldLabel?: string;
  placeholder?: string;
  /** The featured icon above the title (Untitled UI's form modals always carry one). */
  icon?: FC<{ className?: string }>;
  iconColor?: "error" | "gray" | "warning";
}) {
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setReason("");
          setAttempted(false);
        }
        onOpenChange(open);
      }}
      icon={icon}
      iconColor={iconColor}
      title={title}
      description={description ?? `Provide a reason for rejecting ${id}`}
      submitLabel={submitLabel}
      size="sm"
      onSubmit={() => {
        setAttempted(true);
        if (!reason.trim()) return;
        onReject(reason.trim());
      }}
    >
      <TextArea
        label={fieldLabel}
        isRequired
        rows={3}
        placeholder={placeholder}
        value={reason}
        onChange={setReason}
        isInvalid={attempted && !reason.trim()}
        hint={attempted && !reason.trim() ? "A reason is required." : undefined}
      />
    </FormModal>
  );
}

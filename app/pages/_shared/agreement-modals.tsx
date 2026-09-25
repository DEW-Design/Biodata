"use client";

import { useState } from "react";
import { TextArea } from "@/components/base/textarea/textarea";
import { FormModal } from "@/components/application/modals/modal";

// Shared between DSA and DLA's deep dives - both now go through the same Under Review -> Rejected
// step (see agreement-status.ts), and the reject reason is the same shape either way: a required
// free-text explanation. Previously duplicated as DLA's own `RejectModal`; DSA needed the identical
// thing once it gained the same review step, so this is the one shared version both import.
export function RejectModal({ id, isOpen, onOpenChange, onReject }: { id: string; isOpen: boolean; onOpenChange: (open: boolean) => void; onReject: (reason: string) => void }) {
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
      title="Reject Request"
      description={`Provide a reason for rejecting ${id}`}
      submitLabel="Confirm Rejection"
      size="sm"
      onSubmit={() => {
        setAttempted(true);
        if (!reason.trim()) return;
        onReject(reason.trim());
      }}
    >
      <TextArea
        label="Rejection Reason"
        isRequired
        rows={3}
        placeholder="Enter a description…"
        value={reason}
        onChange={setReason}
        isInvalid={attempted && !reason.trim()}
        hint={attempted && !reason.trim() ? "A reason is required." : undefined}
      />
    </FormModal>
  );
}

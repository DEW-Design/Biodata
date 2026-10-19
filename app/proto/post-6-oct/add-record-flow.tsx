"use client";

// Starting a new record from the project bar's "+" menu on the post-6-oct lab (the designer, 19 Oct 2026): the menu names a type (a Visit, a Transect, an Individual occurrence ...), and this opens the
// product's own full screen new-record form for it, directly under the project, every card in edit mode, as the Project records tab's "Add record" does. It uses the product's exported parts
// (`RecordFullscreenV3`, `RecordFullView`, `createRecord`) and keeps its own small state, so that `RecordsExplorer` carries nothing of this lab (the designer: "post-6-oct stuff should sit only on the
// /proto route without being rolled into production"). When the record is created it is told to the page, which opens Project records with it selected; cancelling closes the form.
// A copy of a few lines of product code, by the designer's instruction: CONTRACTS 1.6 and 0.9 are overridden for this lab only (logged in context/decisions, 19 Oct 2026).
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.

import { useState } from "react";
import { useEditStore } from "@/app/pages/project-detail/edit-store";
import { RecordFullView } from "@/app/pages/project-detail/record-full-view";
import { RecordFullscreenV3 } from "@/app/pages/project-detail/record-fullscreen";
import { createRecord, type ChildOption } from "@/app/pages/project-detail/record-rules";
import type { SurveyRecord } from "@/app/pages/project-detail/survey-data";

export function AddRecordFlow({ request, onClose, onCreated }: { request: { option: ChildOption; id: number } | null; onClose: () => void; onCreated: (id: string) => void }) {
  const { records } = useEditStore();
  const [draft, setDraft] = useState<{ id: number; record: SurveyRecord } | null>(null);
  const [editing, setEditing] = useState(false);

  // A new request makes a new draft, once (its `id` is the time it was asked for, which is also the new record's date).
  if (request && draft?.id !== request.id) {
    setDraft({
      id: request.id,
      record: createRecord({
        kind: request.option.kind,
        type: request.option.type,
        parent: null,
        name: "",
        date: new Date(request.id).toISOString().slice(0, 10),
        recordedBy: "Olivia Wyatt",
        records,
      }),
    });
  }
  if (!request || !draft || draft.id !== request.id) return null;

  return (
    <RecordFullscreenV3 isOpen isEditing={editing} onClose={onClose} label="New record, full screen">
      <RecordFullView
        key={draft.record.id}
        record={draft.record}
        isNew
        onSelect={() => {}}
        onAdd={() => {}}
        onExit={onClose}
        onEditingChange={setEditing}
        onCreated={(r) => {
          onCreated(r.id);
          onClose();
        }}
        onDiscardNew={onClose}
      />
    </RecordFullscreenV3>
  );
}

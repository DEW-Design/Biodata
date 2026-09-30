"use client";

import type { ReactNode } from "react";
import { MarkerPin04, Send01, Target05 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { TreeView } from "@/components/application/tree-view/tree-view";
import type { RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { NEW_SITE } from "@/app/proto/dataset-ingestion/ingestion-sim";

// ── The new records, in the tree ──
// One site, its visits, and the occurrences under each, revealed in order as the last stage runs, so
// the tree visibly fills in. Each is marked "New".
const NEW_KEYS = ["new:site", ...NEW_SITE.visits.map((_, i) => `new:visit-${i}`)];
export const NEW_EXPANDED_KEYS = NEW_KEYS;

function NewLabel({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate">{children}</span>
      <Badge size="sm" color="brand">
        New
      </Badge>
    </span>
  );
}

export function NewRecordItems({ view }: { view: RunView }) {
  // A failed ingestion adds nothing: whatever was shown while it ran is taken away again.
  if (view.failed) return null;
  const total = 1 + NEW_SITE.visits.length * 2;
  const shown = Math.ceil(view.treeProgress * total);
  if (shown < 1) return null;
  // The visits that could not be fully placed lose the unmapped rows, taken from the last visit.
  const rowsFor = (i: number) => (i === NEW_SITE.visits.length - 1 ? NEW_SITE.visits[i].rows - view.unmapped : NEW_SITE.visits[i].rows);
  return (
    <TreeView.Item id="new:site" textValue={`Site ${NEW_SITE.code}`}>
      <TreeView.ItemContent icon={MarkerPin04}>
        <NewLabel>Site {NEW_SITE.code}</NewLabel>
      </TreeView.ItemContent>
      {NEW_SITE.visits.map((visit, i) =>
        shown >= 2 + i * 2 ? (
          <TreeView.Item key={visit.code} id={`new:visit-${i}`} textValue={`Visit ${visit.code}`}>
            <TreeView.ItemContent icon={Send01}>
              <NewLabel>Visit {visit.code}</NewLabel>
            </TreeView.ItemContent>
            {shown >= 3 + i * 2 && (
              <TreeView.Item id={`new:occurrences-${i}`} textValue={`${rowsFor(i)} occurrences`}>
                <TreeView.ItemContent icon={Target05}>{rowsFor(i)} occurrences</TreeView.ItemContent>
              </TreeView.Item>
            )}
          </TreeView.Item>
        ) : null,
      )}
    </TreeView.Item>
  );
}


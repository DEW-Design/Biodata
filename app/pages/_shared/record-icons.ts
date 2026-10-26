import type { FC } from "react";
import { kindShape, type RecordKind } from "./record-shapes";

// A record is marked by its kind's shape, not an icon per type (designer, 23 Oct 2026; record-shapes.tsx). This keeps
// the one entry point every screen already calls, so the records tree, the record pages and the reports agree.
export function recordIcon(r: { kind: RecordKind; type: string }): FC<{ className?: string }> {
  return kindShape(r.kind);
}

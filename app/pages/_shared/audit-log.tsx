"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { formatShortDate } from "@/app/pages/_shared/dsa/dsa-data";

// The audit log every record's History (or Audit Log) tab opens with, from the Figma "Notification
// Management" audit log (YMproGZfrFB5jUqPHPxMhk, node 1584:22819): who created the record and when, who
// made it live and when, and who changed it last and when, as "on" and "by" pairs side by side. The
// designer, 1 Oct 2026: "do the same everywhere we show the history tab", with the full list of
// changes kept behind "Show all changes" (the Figma's "Hide Logs").
//
// Each record says which of its own events is the middle milestone (a DLA becoming Active, a
// nomination being decided, a dataset being approved) and passes its full event list as children.
// A milestone that hasn't happened yet reads "Not yet". Type: the label is RecordRow's, the value the
// list name cell's.

export interface AuditEvent {
  /** ISO date or date and time. */
  at: string;
  by: string;
}

export interface AuditMilestone {
  /** "Created", "Activated", "Decided", "Last modified". */
  label: string;
  event?: AuditEvent;
}

const dateOf = (at: string) => formatShortDate(at.slice(0, 10));

function Pair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="m-0 text-sm text-secondary">{label}</p>
      <p className="m-0 text-sm font-medium text-primary">{value}</p>
    </div>
  );
}

/**
 * The created, middle and last-modified milestones of a chronological event list. `dates` is the
 * record's own created and updated dates: a record kept from before its events were logged still
 * says when it was created and last changed, by "Not recorded", never "Not yet".
 */
export function milestones<E extends AuditEvent>(events: E[], middle: { label: string; is: (e: E) => boolean }, dates?: { created?: string; updated?: string }): AuditMilestone[] {
  const known = (at?: string) => (at ? { at, by: "Not recorded" } : undefined);
  return [
    { label: "Created", event: events[0] ?? known(dates?.created) },
    { label: middle.label, event: events.find(middle.is) },
    { label: "Last modified", event: events[events.length - 1] ?? known(dates?.updated ?? dates?.created) },
  ];
}

export function AuditLog({ id, idLabel = "ID", items, changeCount, children }: { id?: string; idLabel?: string; items: AuditMilestone[]; changeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {id && (
        <p className="m-0 text-sm text-secondary">
          {idLabel}: <span className="font-medium text-primary tabular-nums">{id}</span>
        </p>
      )}
      <div className="rounded-lg border border-secondary">
        {items.map((m) => (
          <div key={m.label} className="grid grid-cols-2 gap-6 border-b border-secondary px-4 py-3 last:border-b-0">
            <Pair label={`${m.label} on`} value={m.event ? dateOf(m.event.at) : "Not yet"} />
            <Pair label={`${m.label} by`} value={m.event ? m.event.by : "Not yet"} />
          </div>
        ))}
      </div>
      {changeCount > 0 && (
        <div className="flex justify-end">
          <Button color="link-color" size="sm" onPress={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Hide all changes" : `Show all changes (${changeCount})`}
          </Button>
        </div>
      )}
      {open && children}
    </div>
  );
}

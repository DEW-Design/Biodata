"use client";

import { AlertTriangle, CheckCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { DLA_GAPS, DLA_MOVES, type WorkflowGap } from "@/config/workflows/dla-workflow";
import { emailsFor } from "./sandbox";

// The gaps found so far, one card each, in the shape of the data model page's known gaps. A gap is a finding with a proposed fix, not a
// decision: each waits for the designer. One of them can close itself: it is checked live against Notification Management.

const moveLabel = (id: string) => DLA_MOVES.find((m) => m.id === id)?.label ?? id;

export function GapsView() {
  const notifications = useNotifications();
  const isOpen = (gap: WorkflowGap) => (gap.live === "no-email-for-active" ? emailsFor(notifications, "active").length === 0 : true);
  const open = DLA_GAPS.filter(isOpen).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
        {open} of {DLA_GAPS.length} open. Each is a finding with a proposed fix, for you to decide. Where the finding can be checked against the product, the card says whether it
        still holds.
      </p>
      <div className="flex flex-col gap-3">
        {DLA_GAPS.map((gap) => {
          const stillOpen = isOpen(gap);
          return (
            <div
              key={gap.id}
              className={stillOpen ? "flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-25 p-4" : "flex items-start gap-3 rounded-xl border border-secondary bg-secondary p-4"}
            >
              {stillOpen ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-warning-primary" /> : <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" />}
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="m-0 text-sm font-semibold text-primary">{gap.title}</p>
                  <Badge size="sm" color={stillOpen ? "warning" : "success"}>
                    {stillOpen ? "Open" : "Closed in Notification Management"}
                  </Badge>
                </div>
                <p className="m-0 text-sm text-balance text-tertiary">{gap.finding}</p>
                <p className="m-0 text-sm text-balance text-tertiary">
                  <span className="font-medium text-secondary">Why it matters: </span>
                  {gap.why}
                </p>
                <p className="m-0 text-sm text-balance text-tertiary">
                  <span className="font-medium text-secondary">Proposed fix: </span>
                  {gap.fix}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-quaternary">
                  <span>{gap.id}</span>
                  <span>{gap.found}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {gap.moves.map((id) => (
                      <Badge key={id} size="sm" color="gray">
                        {moveLabel(id)}
                      </Badge>
                    ))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

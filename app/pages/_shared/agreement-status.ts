import type { BadgeColors } from "@/components/base/badges/badge-types";

// Shared status model for both DSA and DLA, sourced directly from the business's "DLA/DSA Users
// Workflow Status" reference sheet and the follow-up Slack thread that resolved every open
// question against it (see context/decisions/2026-09-24-04-unified-dsa-dla-status-model-rolled-straight-into.md, "Unified DSA/DLA status model" for the source and the
// reasoning behind each answer below). DSA and DLA used to run two independently-invented status
// sets (DSA: active/inactive/revoked/draft; DLA: active/under_review/rejected/expired/withdrawn) -
// this file is the one shared vocabulary both now use.
//
// The sequence, per the sheet (its own numbering - #7 confirmed removed on purpose, nothing to
// model there): 1 Draft -> 2 Submitted -> 3 Under Review -> (4A Approved / Auto Approve -> 5
// Active) or (4B Rejected, terminal). Under Review can move to 6 On Hold and back - a reviewer
// holding the review pending information from the requester, confirmed as never applying once a
// request is Active, which only ever allows Cancel per the business's own answer ("For active
// requests only cancel option can be used"). Active -> 8 Closed (automatically on expiry, or
// manually) is the completed path; 9 Cancelled is reachable from anywhere before Closed - a
// requester or an admin can both cancel, same resulting status either way (who did it is an audit
// detail, not a separate status, per "I can cancel my own DSA, Admin can also cancel my DSA").
// "Revoke" is not a real status here - the business confirmed it was legacy terminology from
// before the workflow stages were finalised, and is now just Cancelled.
export type AgreementStatus = "draft" | "submitted" | "under_review" | "on_hold" | "approved" | "rejected" | "active" | "closed" | "cancelled";

// List-bucket order follows the sheet's own sequence numbering (draft through cancelled) rather
// than an invented "healthiest first" ordering - the same "don't invent a rule beyond what the
// source says" convention this build already applies to the transitions themselves.
export const agreementStatusOrder: AgreementStatus[] = ["draft", "submitted", "under_review", "approved", "rejected", "active", "on_hold", "closed", "cancelled"];

/**
 * A recorded status change - who moved a DSA or DLA to this status, when, and why (a rejection
 * reason, an on-hold/return note). The one shared shape both `Dsa.history` and `Dla.history` use
 * for their "Audit Log" tab, the same `{status, at, by, note?}` shape nominations' own "Audit
 * history" tab already established. `by` is the acting person's name for a real decision, or
 * `"System"` for the two transitions nobody actually makes - Approved auto-becoming Active and
 * Active auto-closing once a date passes (see `effectiveStatus` below) - the same `"System"`
 * convention already used for the dataset-ingestion status trail.
 */
export interface AgreementEvent {
  status: AgreementStatus;
  at: string;
  by: string;
  note?: string;
}

export const agreementStatusMeta: Record<AgreementStatus, { label: string; tabLabel: string; badgeColor: BadgeColors }> = {
  draft: { label: "Draft", tabLabel: "Drafts", badgeColor: "gray" },
  submitted: { label: "Submitted", tabLabel: "Submitted", badgeColor: "brand" },
  under_review: { label: "Under review", tabLabel: "Under review", badgeColor: "warning" },
  on_hold: { label: "On hold", tabLabel: "On hold", badgeColor: "warning" },
  approved: { label: "Approved", tabLabel: "Approved", badgeColor: "brand" },
  rejected: { label: "Rejected", tabLabel: "Rejected", badgeColor: "error" },
  active: { label: "Active", tabLabel: "Active", badgeColor: "success" },
  closed: { label: "Closed", tabLabel: "Closed", badgeColor: "gray" },
  cancelled: { label: "Cancelled", tabLabel: "Cancelled", badgeColor: "gray" },
};

/**
 * Approved -> Active and Active -> Closed both happen automatically once a real date passes ("the
 * status shall remain as Approved... until the date before it becomes active"; Closed "may be
 * closed automatically upon expiry"). There's no background job in this build, so this is computed
 * at read time instead of stored - every list/detail read goes through this, never the raw
 * `status` field directly, so the two can never drift. `validFrom`/`validTo` are each record's own
 * granted period (both `Dsa` and `Dla` already carry these under the same field names).
 */
export function effectiveStatus(status: AgreementStatus, validFrom: string, validTo: string, today: string): AgreementStatus {
  const steps = autoTransitions(status, validFrom, validTo, today);
  return steps.length ? steps[steps.length - 1].status : status;
}

/** Today's date in the browser's own time zone as `YYYY-MM-DD`. `toISOString()` is UTC, which is a day behind in
 *  Adelaide until 9:30am (10:30 in summer), so a move made that morning was logged with yesterday's date. */
export function localIsoDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return localIsoDate(new Date(y, m - 1, d + 1));
}

/**
 * The moves nobody makes, as audit events: Approved becomes Active on the grant's start date and Active becomes Closed the
 * day after its end date, both by `"System"`. `effectiveStatus` is the last of these, so the status a record shows and the
 * trail in its Audit Log can never disagree (the log used to stop at Approved while the record said Active).
 */
export function autoTransitions(status: AgreementStatus, validFrom: string, validTo: string, today: string): AgreementEvent[] {
  const events: AgreementEvent[] = [];
  let current = status;
  if (current === "approved" && validFrom && validFrom <= today) {
    events.push({ status: "active", at: validFrom, by: "System" });
    current = "active";
  }
  if (current === "active" && validTo && validTo < today) {
    events.push({ status: "closed", at: nextDay(validTo), by: "System" });
  }
  return events;
}

const REBUILT_NOTE = "Earlier steps were not recorded for this record.";

/**
 * The Audit Log of a record saved in this browser before logs existed. It is rebuilt from what the record does know
 * (never from a guess): the seed's own trail where the record is one of the seeded ones, otherwise when it was
 * submitted and where it stands now, with a note saying the steps in between were not recorded.
 */
export function rebuildHistory(input: {
  status: AgreementStatus;
  submittedAt: string;
  updatedAt: string;
  /** Who created the record, and who a status move is attributed to (the reviewer; the requester for a cancellation). */
  creator: string;
  reviewer: string;
  canceller: string;
  seed?: AgreementEvent[];
}): AgreementEvent[] {
  const { status, submittedAt, updatedAt, creator, reviewer, canceller, seed } = input;
  const standing: AgreementEvent = { status, at: updatedAt, by: status === "cancelled" ? canceller : reviewer, note: REBUILT_NOTE };
  if (seed?.length) return seed[seed.length - 1].status === status ? [...seed] : [...seed, standing];
  if (status === "draft") return [{ status, at: updatedAt, by: creator }];
  const submitted: AgreementEvent = { status: "submitted", at: submittedAt, by: creator };
  return status === "submitted" ? [submitted] : [submitted, standing];
}

// Real urgency, not just "whichever active record's `validTo` sorts first" - a record expiring
// two years out doesn't belong flagged as urgent. First built in /proto/collection-sidebar's own
// "Actions" exploration, promoted here once that banner was folded into the real DSA/DLA shells.
const EXPIRY_WARNING_WINDOW_DAYS = 60;

export function nearestToExpiry<T extends { status: string; validTo: string }>(records: T[]): T | undefined {
  const now = Date.now();
  return records
    .filter((r) => r.status === "active" && r.validTo)
    .map((r) => ({ record: r, daysLeft: Math.round((new Date(r.validTo).getTime() - now) / (1000 * 60 * 60 * 24)) }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= EXPIRY_WARNING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0]?.record;
}

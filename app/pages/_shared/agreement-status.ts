import type { BadgeColors } from "@/components/base/badges/badge-types";

// Shared status model for both DSA and DLA, sourced directly from the business's "DLA/DSA Users
// Workflow Status" reference sheet and the follow-up Slack thread that resolved every open
// question against it (see CONTEXT.md, "Unified DSA/DLA status model" for the source and the
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

export const agreementStatusMeta: Record<AgreementStatus, { label: string; tabLabel: string; badgeColor: BadgeColors }> = {
  draft: { label: "Draft", tabLabel: "Drafts", badgeColor: "gray" },
  submitted: { label: "Submitted", tabLabel: "Submitted", badgeColor: "brand" },
  under_review: { label: "Under Review", tabLabel: "Under Review", badgeColor: "warning" },
  on_hold: { label: "On Hold", tabLabel: "On Hold", badgeColor: "warning" },
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
  if (status === "approved" && validFrom && validFrom <= today) return "active";
  if (status === "active" && validTo && validTo < today) return "closed";
  return status;
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

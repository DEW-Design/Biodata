import { agreementStatusMeta, agreementStatusOrder, autoTransitions, type AgreementStatus } from "@/app/pages/_shared/agreement-status";
import { isDlaEditable } from "@/app/pages/_shared/dla/dla-data";
import type { Notification } from "@/app/pages/_shared/notifications/nt-data";
import { hasFeatureAccess } from "@/config/role-access.config";
import { DLA_MOVES } from "@/config/workflows/dla-workflow";
import type { UserRole } from "@/lib/user-role";
import { advance, availability, initialState, perform, type SandboxState } from "./sandbox";

// What the page can check about each business rule by running it, instead of reading it. A check names its basis, because they differ in
// what they prove: "Product" runs a function the product itself uses (`isDlaEditable`, `hasFeatureAccess`, `autoTransitions`), so a pass is a fact
// about the product; "This page" runs the rules written in `dla-workflow.ts` through the sandbox, so a pass says the page's rules agree with the
// rule, and the product agrees only as far as the two have been read to match. A rule with no check was read from the decision and nothing more.

export interface RuleCheck {
  ok: boolean;
  text: string;
  basis: "Product" | "This page";
}

const at = (status: AgreementStatus, patch: Partial<SandboxState> = {}): SandboxState => ({ ...initialState(), status, ...patch });
const label = (s: AgreementStatus) => agreementStatusMeta[s].label;
const labels = (list: AgreementStatus[]) => list.map(label).join(", ");
const can = (state: SandboxState, role: UserRole, moveId: string) => availability(state, role).find((a) => a.move.id === moveId)?.ok === true;

const REQUESTER: UserRole = "registered-user";
const REVIEWER: UserRole = "biodata-admin";

export function runRuleChecks(notifications: Notification[]): Record<string, RuleCheck[]> {
  const out: Record<string, RuleCheck[]> = {};

  // BR-1: the statuses, and cancel from anywhere before Closed.
  const beforeClosed: AgreementStatus[] = ["draft", "submitted", "under_review", "on_hold", "approved", "active"];
  const cannotCancel = beforeClosed.filter((s) => !can(at(s), REVIEWER, "cancel"));
  const inMoves = new Set(DLA_MOVES.flatMap((m) => [...m.from, ...(m.to && m.to !== "approved-or-active" ? [m.to] : [])]));
  const missing = agreementStatusOrder.filter((s) => !inMoves.has(s));
  out["BR-1"] = [
    { ok: missing.length === 0, text: missing.length === 0 ? "Every status appears in a move." : `Not in any move: ${labels(missing)}.`, basis: "This page" },
    {
      ok: cannotCancel.length === 0,
      text: cannotCancel.length === 0 ? "Cancel is offered in every status before Closed." : `Cancel is not offered in: ${labels(cannotCancel)}.`,
      basis: "This page",
    },
  ];

  // BR-2: a start date in the future stays Approved until it arrives, and one that has arrived is Active at once.
  const submitted = perform(initialState(), "submit", REQUESTER, {}, notifications);
  const underReview = perform(submitted, "start-review", REVIEWER, {}, notifications);
  const later = perform(underReview, "approve", REVIEWER, { startsInDays: 14 }, notifications);
  const stays = later.status === "approved";
  const becomes = advance(later, 14, notifications).status === "active";
  const today = perform(underReview, "approve", REVIEWER, { startsInDays: 0 }, notifications).status === "active";
  const clock = autoTransitions("approved", "2026-01-10", "2026-04-10", "2026-01-10").at(-1)?.status === "active";
  out["BR-2"] = [
    { ok: stays, text: stays ? "Approved with a start date 14 days out stays Approved." : "Approved with a future start date did not stay Approved.", basis: "This page" },
    { ok: becomes, text: becomes ? "It becomes Active when the start date arrives." : "It did not become Active on the start date.", basis: "This page" },
    { ok: today, text: today ? "Approved with a start date of today is Active at once." : "Approved with a start date of today was not Active.", basis: "This page" },
    { ok: clock, text: clock ? "The product's own clock makes Approved Active on the start date." : "The product's clock did not make Approved Active.", basis: "Product" },
  ];

  // BR-3: the manual move is the reviewer's; the notification to reviewers is only proposed.
  const onlyReviewer = can(at("submitted"), REVIEWER, "start-review") && !can(at("submitted"), REQUESTER, "start-review");
  out["BR-3"] = [
    { ok: onlyReviewer, text: onlyReviewer ? "Only a reviewer can start a review of a Submitted request." : "A role other than a reviewer can start a review.", basis: "This page" },
    { ok: false, text: "No notification to reviewers exists in the product. The Activity for it is proposed only.", basis: "This page" },
  ];

  // BR-4: hold and resume are the reviewer's, during review, never on an Active request.
  const holdOnlyInReview = agreementStatusOrder.every((s) => can(at(s), REVIEWER, "hold") === (s === "under_review"));
  const requesterCannotHold = !can(at("under_review"), REQUESTER, "hold");
  const nothingOnActive = !["hold", "resume", "start-review", "approve", "reject"].some((id) => can(at("active"), REVIEWER, id));
  out["BR-4"] = [
    { ok: holdOnlyInReview, text: holdOnlyInReview ? "A reviewer can hold only from Under review." : "Hold is offered in a status other than Under review.", basis: "This page" },
    { ok: requesterCannotHold, text: requesterCannotHold ? "A requester cannot hold." : "A requester can hold.", basis: "This page" },
    { ok: nothingOnActive, text: nothingOnActive ? "An Active request offers a reviewer none of hold, resume, start, approve or reject." : "An Active request offers a reviewer a review move.", basis: "This page" },
  ];

  // BR-5: both can cancel, in every status that can be cancelled.
  const cancellable: AgreementStatus[] = ["submitted", "under_review", "on_hold", "approved", "active"];
  const bothCancel = cancellable.every((s) => can(at(s), REQUESTER, "cancel") && can(at(s), REVIEWER, "cancel"));
  const cancelled = perform(underReview, "cancel", REVIEWER, {}, notifications);
  out["BR-5"] = [
    { ok: bothCancel, text: bothCancel ? "A requester and an admin can both cancel in every status from Submitted to Active." : "One of them cannot cancel in a status where the other can.", basis: "This page" },
    { ok: cancelled.status === "cancelled", text: "Either way the status is the one Cancelled.", basis: "This page" },
  ];

  // BR-6: no Revoke.
  const revoke = agreementStatusOrder.filter((s) => /revok/i.test(label(s)));
  out["BR-6"] = [{ ok: revoke.length === 0, text: revoke.length === 0 ? "No status is called Revoke." : `A status is called Revoke: ${labels(revoke)}.`, basis: "Product" }];

  // BR-7: the clock closes it; no one can close it by hand.
  const closes = autoTransitions("active", "2026-01-10", "2026-04-10", "2026-04-11").at(-1)?.status === "closed";
  const byHand = DLA_MOVES.some((m) => m.to === "closed" && m.by !== "system");
  out["BR-7"] = [
    { ok: closes, text: closes ? "The product's clock closes an Active agreement the day after its end date." : "The product's clock did not close it.", basis: "Product" },
    { ok: byHand, text: byHand ? "A person can close it by hand." : "No move lets a person close it by hand.", basis: "This page" },
  ];

  // BR-8: nothing approves without a reviewer.
  const withoutReviewer = DLA_MOVES.some((m) => (m.to === "approved" || m.to === "approved-or-active") && m.by !== "reviewer");
  out["BR-8"] = [{ ok: withoutReviewer, text: withoutReviewer ? "A move approves a request without a reviewer." : "No move approves a request without a reviewer, so there is no Auto Approve.", basis: "This page" }];

  // BR-9: terminal.
  const fromRejected = (["registered-user", "biodata-admin"] as UserRole[]).flatMap((r) => availability(at("rejected"), r).filter((a) => a.ok));
  out["BR-9"] = [{ ok: fromRejected.length === 0, text: fromRejected.length === 0 ? "No role has a move on a Rejected request." : `A Rejected request still offers: ${fromRejected.map((a) => a.move.label).join(", ")}.`, basis: "This page" }];

  // BR-11: editing stops once Approved.
  out["BR-11"] = [
    {
      ok: !isDlaEditable("approved") && !isDlaEditable("active") && !isDlaEditable("closed"),
      text: !isDlaEditable("approved") && !isDlaEditable("active") ? "The product does not allow editing once a request is Approved." : "The product allows editing after Approval.",
      basis: "Product",
    },
  ];

  // BR-13: who can request, who can approve.
  const requesters: UserRole[] = ["registered-user", "privileged-user", "privileged-admin", "biodata-user", "biodata-admin", "biodata-super-admin"];
  const everyRequester = requesters.every((r) => hasFeatureAccess("dlaAccess", r)) && !hasFeatureAccess("dlaAccess", "public-user");
  const onlyAdmins = (["biodata-admin", "biodata-super-admin"] as UserRole[]).every((r) => hasFeatureAccess("dlaApproval", r)) && (["registered-user", "privileged-user", "privileged-admin", "biodata-user", "public-user"] as UserRole[]).every((r) => !hasFeatureAccess("dlaApproval", r));
  out["BR-13"] = [
    { ok: everyRequester, text: everyRequester ? "Every signed-in role has DLA access and the public user has none." : "DLA access differs from every signed-in role except the public user.", basis: "Product" },
    { ok: onlyAdmins, text: onlyAdmins ? "Only the two admin roles can approve." : "Roles other than the two admin roles can approve, or an admin cannot.", basis: "Product" },
  ];

  // BR-14: renewing is a requester's move on a Closed request.
  out["BR-14"] = [{ ok: can(at("closed"), REQUESTER, "renew"), text: can(at("closed"), REQUESTER, "renew") ? "A requester can renew a Closed agreement, which starts a new request." : "A requester cannot renew a Closed agreement.", basis: "This page" }];

  // BR-15: only an admin sees everyone's.
  const allView = (["registered-user", "privileged-user", "privileged-admin", "biodata-user"] as UserRole[]).every((r) => !hasFeatureAccess("dlaAllView", r)) && hasFeatureAccess("dlaAllView", "biodata-admin");
  out["BR-15"] = [{ ok: allView, text: allView ? "Only a BioData Admin sees every request; the other roles see their own." : "A role other than an admin sees every request.", basis: "Product" }];

  // BR-10 and BR-12 have no run: the field lock and the file upload are in forms and modals, and were read from the decisions that record them.
  return out;
}

import type { AgreementStatus } from "@/app/pages/_shared/agreement-status";
import type { FeatureKey } from "@/config/role-access.config";

// The Data Licence Agreement (DLA) workflow, written out as data: the moves a request can make, who can make each, what it needs, and who is
// told. It is the one thing the Workflows page (`/config/workflows`) draws, tabulates and runs in its sandbox, so what is shown is one set of
// rules, not a drawing beside the code.
//
// What is real and what is proposed:
//   - The statuses, the automatic moves, who may edit (`isDlaEditable`), who holds which access (`hasFeatureAccess`) and which emails
//     Notification Management would send are read from the product by the page, not copied here.
//   - The moves themselves (which status leads to which, and who may make them) are written here from `dla-detail.tsx` (the buttons each status
//     shows), `dla-store.ts` (what each move does) and `agreement-status.ts` (the statuses, from the business's "DLA/DSA Users Workflow Status"
//     sheet). They are the product's rules as the code has them today. The page checks the two it can (the statuses, and where a request can be
//     edited) against the product; the rest are read by eye and are not checked against the sheet.
//   - Activity (what a person sees in the product when something needs them or has happened to their request) does not exist yet. Every Activity
//     line here is PROPOSED, for the designer to keep, change or drop.
//
// The product does not read this file yet. Moving `dla-detail.tsx` and `dla-store.ts` onto it is the second slice, so the two cannot drift.

export type Seat = "requester" | "reviewer";
export type Audience = "requester" | "reviewers";

/** What a move needs to say about itself when it tells someone. */
export interface TellContext {
  /** The request's ID. */
  id: string;
  /** The reviewer's reason, for a rejection. */
  reason?: string;
  /** The grant period, once approved. ISO dates. */
  validFrom?: string;
  validTo?: string;
  /** Days left, for the reminder. */
  daysLeft?: number;
  /** Who made the move. */
  actor: string;
  /** A date, in words. */
  startsOn?: string;
}

/** A proposed Activity line: who sees it, and what it says. */
export interface Tell {
  audience: Audience;
  activity: (c: TellContext) => string;
  /** Do not tell this audience when the person making the move holds this seat (a requester is not told they cancelled their own request). */
  unlessActorIs?: Seat;
}

export type MoveKind = "move" | "edit" | "automatic" | "reminder";

export interface WorkflowMove {
  id: string;
  /** The words on the button. */
  label: string;
  kind: MoveKind;
  /** The statuses it can be made from. */
  from: AgreementStatus[];
  /** Where it leads. Null when the status stays the same, or when it starts a new request. "approved-or-active": Active if the start date has arrived. */
  to: AgreementStatus | "approved-or-active" | null;
  /** Who makes it. "either": the requester or an admin. */
  by: "requester" | "reviewer" | "either" | "system";
  /** The access a person needs to make it. Null for the clock. */
  gate: FeatureKey | null;
  /** What the person must give, in words. Null when it asks for nothing. */
  needs: string | null;
  /** What happens when `to` is null and the status simply stays. Defaults to "The status stays the same". */
  outcome?: string;
  /** The rule, in plain words. */
  rule: string;
  /** Where the product builds it. */
  code: string;
  /** Proposed Activity lines. */
  tells: Tell[];
}

export const DLA_MOVES: WorkflowMove[] = [
  {
    id: "submit",
    label: "Submit",
    kind: "move",
    from: ["draft"],
    to: "submitted",
    by: "requester",
    gate: "dlaAccess",
    needs: "Every mandatory detail of the form",
    rule: "A requester sends a draft, or a new request, for review.",
    code: "dla-store.ts, saveDla",
    tells: [{ audience: "reviewers", activity: (c) => `${c.id} is waiting for review.` }],
  },
  {
    id: "start-review",
    label: "Start review",
    kind: "move",
    from: ["submitted"],
    to: "under_review",
    by: "reviewer",
    gate: "dlaApproval",
    needs: null,
    rule: "A reviewer opening a Submitted request claims it for review.",
    code: "dla-store.ts, startDlaReview",
    tells: [{ audience: "requester", activity: (c) => `${c.id} is under review.` }],
  },
  {
    id: "hold",
    label: "Put on hold",
    kind: "move",
    from: ["under_review"],
    to: "on_hold",
    by: "reviewer",
    gate: "dlaApproval",
    needs: null,
    rule: "The reviewer pauses the review until the requester gives more information. It never applies once a request is Active.",
    code: "dla-store.ts, holdDlaReview",
    tells: [{ audience: "requester", activity: (c) => `${c.id} is on hold. More information is needed from you.` }],
  },
  {
    id: "resume",
    label: "Resume review",
    kind: "move",
    from: ["on_hold"],
    to: "under_review",
    by: "reviewer",
    gate: "dlaApproval",
    needs: null,
    rule: "The reviewer picks the review up again.",
    code: "dla-store.ts, resumeDlaReview",
    tells: [{ audience: "requester", activity: (c) => `The review of ${c.id} has resumed.` }],
  },
  {
    id: "approve",
    label: "Approve",
    kind: "move",
    from: ["under_review"],
    to: "approved-or-active",
    by: "reviewer",
    gate: "dlaApproval",
    needs: "A grant period, and optionally a signed agreement",
    rule: "The reviewer sets the grant period, which can differ from the one asked for. Active at once if its start date has arrived, otherwise Approved until it does.",
    code: "dla-store.ts, approveDla",
    tells: [{ audience: "requester", activity: (c) => `${c.id} was approved. ${c.startsOn ? `It starts on ${c.startsOn}.` : ""}`.trim() }],
  },
  {
    id: "reject",
    label: "Reject",
    kind: "move",
    from: ["under_review"],
    to: "rejected",
    by: "reviewer",
    gate: "dlaApproval",
    needs: "A reason",
    rule: "The reviewer turns the request down, with a reason. Rejected is final: the requester starts a new request.",
    code: "dla-store.ts, rejectDla",
    tells: [{ audience: "requester", activity: (c) => `${c.id} was rejected.${c.reason ? ` Reason: ${c.reason}` : ""}` }],
  },
  {
    id: "cancel",
    label: "Cancel request",
    kind: "move",
    from: ["submitted", "under_review", "on_hold", "approved", "active"],
    to: "cancelled",
    by: "either",
    gate: "dlaAccess",
    needs: null,
    rule: "The requester or an admin can cancel at any point before the agreement closes. A draft is deleted, not cancelled.",
    code: "dla-store.ts, cancelDla",
    tells: [
      { audience: "reviewers", unlessActorIs: "reviewer", activity: (c) => `${c.id} was cancelled by the requester.` },
      { audience: "requester", unlessActorIs: "requester", activity: (c) => `${c.id} was cancelled.` },
    ],
  },
  {
    id: "edit",
    label: "Edit request",
    kind: "edit",
    from: ["draft", "submitted", "under_review", "on_hold"],
    to: null,
    by: "either",
    gate: "dlaAccess",
    needs: null,
    rule: "A request can be changed while it is open: a Draft, Submitted, Under review or On hold. Once it is Approved its level is a decision, so it cannot be reopened.",
    code: "dla-data.ts, isDlaEditable",
    tells: [],
  },
  {
    id: "add-location",
    label: "Add location",
    kind: "edit",
    from: ["active"],
    to: null,
    by: "requester",
    gate: "dlaAccess",
    needs: "A location",
    rule: "A location is added straight to an Active agreement, with no review of the new place.",
    code: "dla-store.ts, addDlaLocation",
    tells: [],
  },
  {
    id: "auto-activate",
    label: "Start date arrives",
    kind: "automatic",
    from: ["approved"],
    to: "active",
    by: "system",
    gate: null,
    needs: null,
    rule: "Approved becomes Active on the grant's start date.",
    code: "agreement-status.ts, autoTransitions",
    tells: [{ audience: "requester", activity: (c) => `${c.id} is now active.` }],
  },
  {
    id: "auto-close",
    label: "End date passes",
    kind: "automatic",
    from: ["active"],
    to: "closed",
    by: "system",
    gate: null,
    needs: null,
    rule: "Active becomes Closed the day after its end date.",
    code: "agreement-status.ts, autoTransitions",
    tells: [{ audience: "requester", activity: (c) => `${c.id} has closed. Renew it to keep access.` }],
  },
  {
    id: "expiry-reminder",
    label: "60 days before the end",
    kind: "reminder",
    from: ["active"],
    to: null,
    by: "system",
    gate: null,
    needs: null,
    rule: "A banner shows on an Active agreement within 60 days of its end date. Nothing is sent.",
    code: "agreement-status.ts, nearestToExpiry",
    tells: [{ audience: "requester", activity: (c) => `${c.id} ends in ${c.daysLeft ?? 60} days.` }],
  },
  {
    id: "renew",
    label: "Renew licence",
    kind: "move",
    from: ["closed"],
    to: null,
    by: "requester",
    gate: "dlaAccess",
    needs: null,
    outcome: "A new request starts",
    rule: "Renewing starts a new request, so the closed record's own trail stays whole.",
    code: "dla-detail.tsx, the Closed banner",
    tells: [],
  },
];

export interface WorkflowGap {
  id: string;
  title: string;
  /** The ids of the moves it concerns. */
  moves: string[];
  /** What is wrong, in plain words. */
  finding: string;
  /** What it costs. */
  why: string;
  /** What to do about it: a proposal, for the designer to decide. */
  fix: string;
  found: "Read from the code" | "Seen in the sandbox";
  /** A check the page runs against the live product: true while the gap is still there. */
  live?: "no-email-for-active";
}

export const DLA_GAPS: WorkflowGap[] = [
  {
    id: "DLA-1",
    title: "Nobody is told in the product when a request needs them",
    moves: ["submit", "start-review", "hold", "approve", "reject"],
    finding: "A request is submitted, picked up, put on hold, approved or rejected and nothing appears for the person who must act or who is waiting. Home's task list is seeded text, not built from what happens to a request. Activity does not exist yet.",
    why: "A reviewer finds out a request is waiting only by opening the list. A requester on hold finds out only by opening their request.",
    fix: "Add Activity: each move says who is told. The proposed lines are in the Rules tab and the sandbox shows them as they would arrive.",
    found: "Read from the code",
  },
  {
    id: "DLA-2",
    title: "Put on hold asks for no reason",
    moves: ["hold"],
    finding: "The reviewer holds a review and the move takes no note, although the status exists so the requester can supply information. The requester sees that the request is on hold but not what is missing.",
    why: "The requester has to guess, or ask somewhere else.",
    fix: "Make a reason required when a request is put on hold, show it to the requester, and keep it in the Audit Log like a rejection's reason.",
    found: "Read from the code",
  },
  {
    id: "DLA-3",
    title: "A requester cannot answer a hold",
    moves: ["hold", "edit", "resume"],
    finding: "While a request is On hold the requester can edit it, but editing changes neither the status nor anyone's Activity. Only a reviewer can resume the review, and no one is told that the requester has done what was asked.",
    why: "The request can sit On hold after the requester has already replied.",
    fix: "Give the requester a move, such as Send back for review, that returns the request to Under review and tells the reviewer.",
    found: "Seen in the sandbox",
  },
  {
    id: "DLA-4",
    title: "An approval that starts today is not emailed",
    moves: ["approve", "auto-activate"],
    finding: "The one DLA email (NTF-011, DLA request decided) is set to fire when a request becomes Approved or Rejected. An approval whose start date has arrived goes straight to Active, and Approved becomes Active by the clock, so neither matches the email.",
    why: "The requester may never be emailed that their licence is in force.",
    fix: "Add Active to that email's statuses in Notification Management, or add a second email for it.",
    found: "Seen in the sandbox",
    live: "no-email-for-active",
  },
  {
    id: "DLA-5",
    title: "Edits during review are not told and not logged",
    moves: ["edit"],
    finding: "A request can be edited while it is Under review, by the requester or by a reviewer. No one is told, and the Audit Log lists status moves only, so who changed what is not recorded.",
    why: "A reviewer can approve a request that has changed since they read it.",
    fix: "Decide whether editing is allowed during review. If it is, tell the reviewer, and log the edit with who made it.",
    found: "Read from the code",
  },
  {
    id: "DLA-6",
    title: "An admin's cancellation is logged as the requester's",
    moves: ["cancel"],
    finding: "Cancel is attributed to the requester whoever pressed it. The same status results, and the trail does not say an admin did it.",
    why: "A requester sees that they cancelled a request they did not.",
    fix: "Log who pressed it. The status stays Cancelled either way.",
    found: "Read from the code",
  },
  {
    id: "DLA-7",
    title: "Every review move is logged under one fixed reviewer",
    moves: ["start-review", "hold", "resume", "approve", "reject"],
    finding: "Starting, holding, resuming, approving and rejecting are all attributed to one fixed name, not to the admin who did them.",
    why: "With more than one reviewer the Audit Log cannot say who decided.",
    fix: "Attribute each move to the signed-in admin.",
    found: "Read from the code",
  },
  {
    id: "DLA-8",
    title: "A location can be added to an Active agreement with no review",
    moves: ["add-location"],
    finding: "Add location appends straight to an Active agreement, with no separate approval for the new place. The code records it as a simplification, not a decision.",
    why: "A restricted location can be added to a licence that was approved without it.",
    fix: "Decide whether a new location needs its own review, and if so give it a status and a reviewer, as a request has.",
    found: "Read from the code",
  },
  {
    id: "DLA-9",
    title: "The expiry warning is a banner only",
    moves: ["expiry-reminder"],
    finding: "Within 60 days of the end date a banner shows in the DLA section. Nothing is sent, so a requester who does not open the section is not warned.",
    why: "A licence can close with the requester unaware.",
    fix: "Tell the requester through Activity, and by email, at 60 days and at close.",
    found: "Read from the code",
  },
];

// ── The business rules, and which parts of the flow they govern ──
// The rules the designer and the business have given, kept as they were recorded (the sheet and the Slack answers in
// `context/decisions/2026-09-24-04-*`, the designer's own instructions in the decisions named on each). The BR numbers are this page's, not the sheet's.
// `given` is the wording as recorded, never a paraphrase presented as a quote. `verdict` is the reading of how the prototype treats it:
// "met", "partly" (a part is not built) or "open" (the rule leaves a question the business has to answer). A check the page can run is named in
// `check` and lives in `app/(docs)/config/workflows/rule-checks.ts`.

export type RuleVerdict = "met" | "partly" | "open";

export interface BusinessRule {
  id: string;
  title: string;
  /** The wording as recorded. */
  given: string;
  /** Who gave it, and when. */
  source: string;
  /** The decision file that records it. */
  decision: string;
  governs: { moves: string[]; states: AgreementStatus[] };
  verdict: RuleVerdict;
  /** How the prototype treats it, and what differs. */
  note: string;
  /** Gaps on the Gaps tab that concern this rule. */
  gaps?: string[];
}

const SHEET = 'The business\'s "DLA/DSA - users Workflow Status" sheet, 24 Sep 2026';
const SLACK = "The Slack answers to the sheet's open questions, 24 Sep 2026";

export const DLA_RULES: BusinessRule[] = [
  {
    id: "BR-1",
    title: "The sequence",
    given: "1 Draft, 2 Submitted, 3 Under Review, then (4A Approved / Auto Approve, 5 Active) or (4B Rejected, terminal). Under Review can move to 6 On Hold and back. Active becomes 8 Closed. 9 Cancelled is reachable from anywhere before Closed.",
    source: `${SHEET} (the arrows written as words)`,
    decision: "2026-09-24-04",
    governs: { moves: ["submit", "start-review", "hold", "resume", "approve", "reject", "cancel", "auto-activate", "auto-close"], states: ["draft", "submitted", "under_review", "on_hold", "approved", "rejected", "active", "closed", "cancelled"] },
    verdict: "partly",
    note: "Every status and every move in the sequence is built. A Draft cannot be cancelled: it is deleted instead, which the rule's \"anywhere before Closed\" does not say.",
  },
  {
    id: "BR-2",
    title: "Approved stays Approved until the start date",
    given: "If the Start Date of the DSA is in the future, the status shall remain as 'Approved'/'Auto Approved' until the date before it becomes active.",
    source: SLACK,
    decision: "2026-09-24-04",
    governs: { moves: ["approve", "auto-activate"], states: ["approved", "active"] },
    verdict: "met",
    note: "Approving a request whose start date is in the future leaves it Approved, and the clock makes it Active on the start date. If the start date has arrived it is Active at once. The email for this (DLA-4) does not cover Active.",
    gaps: ["DLA-4"],
  },
  {
    id: "BR-3",
    title: "Starting a review is a reviewer's action, and reviewers are told",
    given: "Once a reviewer clicks on a submitted request it changes to Under Review... shall assist reporting and notifications to reviewers for action.",
    source: SLACK,
    decision: "2026-09-24-04",
    governs: { moves: ["submit", "start-review"], states: ["submitted", "under_review"] },
    verdict: "partly",
    note: "The manual move is built: only a reviewer can start the review, and a request stays Submitted until they do. The notifications to reviewers are not: nothing tells a reviewer a request is waiting. This is the rule Activity would answer.",
    gaps: ["DLA-1"],
  },
  {
    id: "BR-4",
    title: "On hold is for the reviewer, during review, and never once Active",
    given: "On Hold will be used by reviewer to hold the review in cases where there is pending info from requestor... for active requests only cancel option can be used.",
    source: SLACK,
    decision: "2026-09-24-04",
    governs: { moves: ["hold", "resume"], states: ["under_review", "on_hold", "active"] },
    verdict: "met",
    note: "Only a reviewer can hold, only from Under review, and nothing offers it on an Active request. What the rule is for, getting the information from the requester, has no move behind it yet: there is no reason on the hold and no way for the requester to answer.",
    gaps: ["DLA-2", "DLA-3"],
  },
  {
    id: "BR-5",
    title: "The requester or an admin can cancel, and it is one status",
    given: "I can cancel my own DSA, Admin can also cancel my DSA.",
    source: SLACK,
    decision: "2026-09-24-04",
    governs: { moves: ["cancel"], states: ["cancelled"] },
    verdict: "met",
    note: "Both can cancel, to one Cancelled status. The rule treats who did it as an audit detail, and the prototype does not record it: an admin's cancellation is logged as the requester's.",
    gaps: ["DLA-6"],
  },
  {
    id: "BR-6",
    title: "Revoke is called Cancelled",
    given: "Revoke will be called cancelled. That term was used before WF stages were finalised.",
    source: SLACK,
    decision: "2026-09-24-04",
    governs: { moves: ["cancel"], states: ["cancelled"] },
    verdict: "met",
    note: "There is no Revoke status or button; the word is Cancelled everywhere.",
  },
  {
    id: "BR-7",
    title: "Closed: automatically on expiry, or manually",
    given: "8 Closed: may be closed automatically upon expiry. (Recorded in the decision as: Active to Closed, automatically on expiry, or manually.)",
    source: SHEET,
    decision: "2026-09-24-04",
    governs: { moves: ["auto-close"], states: ["active", "closed"] },
    verdict: "partly",
    note: "The clock closes an agreement the day after its end date. No one can close it by hand. The sheet's own words only say automatically; \"or manually\" is how the decision recorded it. It also sits against BR-4, which says an Active request offers only Cancel. Is there a manual close, and how does it differ from Cancel?",
  },
  {
    id: "BR-8",
    title: "Auto Approve",
    given: "(4A Approved / Auto Approve, 5 Active)",
    source: SHEET,
    decision: "2026-09-24-04",
    governs: { moves: ["approve"], states: ["under_review", "approved"] },
    verdict: "open",
    note: "The sheet names an Auto Approve path beside Approved. Nothing in the recorded answers says which requests it applies to or what triggers it, so the prototype has none: every approval is a reviewer's. The question for the business: what is auto-approved, and does it still pass through Under Review?",
  },
  {
    id: "BR-9",
    title: "Rejected is final, and needs a reason",
    given: "4B Rejected, terminal.",
    source: SHEET,
    decision: "2026-09-24-04",
    governs: { moves: ["reject"], states: ["rejected"] },
    verdict: "met",
    note: "Nothing moves a Rejected request on, so the requester starts a new one. The reason the prototype asks for with a rejection is the build's own choice, not recorded as a rule.",
  },
  {
    id: "BR-10",
    title: "The requested dates cannot change once submitted",
    given: "DLA/DSA - cannot update start and end date once created. (Confirmed to mean from Submitted onward: a saved Draft's dates stay editable.)",
    source: "The designer, 29 Sep 2026",
    decision: "2026-09-29-38",
    governs: { moves: ["edit"], states: ["submitted", "under_review", "on_hold"] },
    verdict: "met",
    note: "From Submitted the two requested-period fields are locked on the edit form, with a note pointing to a new request. Everything else on the form stays editable until the request is Approved, with no one told (DLA-5).",
    gaps: ["DLA-5"],
  },
  {
    id: "BR-11",
    title: "A granted access level cannot be changed",
    given: "User cannot change the type of access - if L2 is granted, L3 can't be asked - that has to be a new request.",
    source: "The designer, 29 Sep 2026",
    decision: "2026-09-29-37",
    governs: { moves: ["edit", "add-location"], states: ["approved", "active"] },
    verdict: "met",
    note: "A request cannot be edited once Approved, in the page and by address, so a granted level cannot be swapped. A location added to an Active agreement starts at Level 2 and its level is locked like the others, with no review of the new place (DLA-8).",
    gaps: ["DLA-8"],
  },
  {
    id: "BR-12",
    title: "The admin uploads the agreement, then the requester downloads it",
    given: "Phase 1: Admin manually uploads the DLA agreement to the tool. Once that's done, user is able to download it on their end.",
    source: "The designer, 29 Sep 2026",
    decision: "2026-09-29-43",
    governs: { moves: ["approve"], states: ["active", "closed"] },
    verdict: "met",
    note: "The Approve step takes the signed agreement (a file up to 2 MB) and an Active or Closed agreement offers it for download, to the requester too. The requester is not told when it is there (DLA-1).",
    gaps: ["DLA-1"],
  },
  {
    id: "BR-13",
    title: "Who can request, and who can approve",
    given: "Confirmed with the designer: DLA is for every signed-in role except public-user. The Master Flows wireframe's section: \"Approve/Reject - DEW Admin\".",
    source: "The designer, 23 Sep 2026",
    decision: "2026-09-23-03",
    governs: { moves: ["submit", "start-review", "hold", "resume", "approve", "reject", "cancel", "edit"], states: [] },
    verdict: "met",
    note: "Every signed-in role has DLA access and only the two admin roles can review. The rule says Approve and Reject; the prototype also gives Start review, Hold and Resume to reviewers only.",
  },
  {
    id: "BR-14",
    title: "Renewing starts a new request",
    given: "The Master Flows wireframe's section: \"Request/Renew - All Users\". The workflow's precedent for a Closed agreement: \"Renew creates a new record\".",
    source: "The designer, 23 and 29 Sep 2026",
    decision: "2026-09-29-37",
    governs: { moves: ["renew"], states: ["closed"] },
    verdict: "met",
    note: "A Closed agreement's banner starts a new request and the closed record's own trail stays whole.",
  },
  {
    id: "BR-15",
    title: "A requester sees their own requests, a reviewer sees all",
    given: "My requests / All requests: a DLA reviewer opens on All, everyone else on My.",
    source: "The designer's page feedback, 25 Sep 2026",
    decision: "2026-09-25-18",
    governs: { moves: ["cancel", "edit"], states: [] },
    verdict: "met",
    note: "Only a BioData Admin can see everyone's requests, so only they can cancel or edit someone else's. The rule is about what is listed; it does not say an admin may edit a requester's request, which the prototype allows.",
    gaps: ["DLA-5"],
  },
];

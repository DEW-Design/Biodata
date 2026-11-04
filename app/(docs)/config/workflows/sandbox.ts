import { agreementStatusMeta, autoTransitions, localIsoDate, type AgreementEvent, type AgreementStatus } from "@/app/pages/_shared/agreement-status";
import { REVIEWING_ADMIN_NAME } from "@/app/pages/_shared/agreement-scope";
import { ABOUT, type Notification } from "@/app/pages/_shared/notifications/nt-data";
import { hasFeatureAccess } from "@/config/role-access.config";
import { DLA_MOVES, type Audience, type Seat, type TellContext, type WorkflowMove } from "@/config/workflows/dla-workflow";
import type { UserRole } from "@/lib/user-role";

// The sandbox's engine: one DLA request, walked through its life by a chosen role. It holds nothing in the product's stores, so nothing
// here changes a real request. What it does not make up: the statuses and their automatic moves are `autoTransitions` from
// `agreement-status.ts`, a role's access is `hasFeatureAccess`, and an email is sent only if a notification in Notification Management says
// so. What it copies by hand, and says so: the 60-day reminder window.

export const SANDBOX_ID = "DLA-SANDBOX";
export const REQUESTER_NAME = "Olivia Wyatt";
const REMINDER_WINDOW_DAYS = 60;
export const GRANT_DAYS = 90;

export interface FeedItem {
  id: number;
  at: string;
  audience: Audience;
  text: string;
  moveId: string;
}

export interface EmailItem {
  id: number;
  at: string;
  notificationId: string;
  name: string;
  to: string;
  subject: string;
  delayed: string | null;
  moveId: string;
}

export interface SandboxState {
  status: AgreementStatus;
  validFrom: string;
  validTo: string;
  today: string;
  history: AgreementEvent[];
  feed: FeedItem[];
  emails: EmailItem[];
  /** Edits made. The product's Audit Log lists status moves only, so these are not in `history`. */
  edits: number;
  locations: number;
  reminded: boolean;
  counter: number;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return localIsoDate(new Date(y, m - 1, d + days));
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86_400_000);
}

export function initialState(): SandboxState {
  const today = localIsoDate();
  return {
    status: "draft",
    validFrom: "",
    validTo: "",
    today,
    history: [{ status: "draft", at: today, by: REQUESTER_NAME }],
    feed: [],
    emails: [],
    edits: 0,
    locations: 0,
    reminded: false,
    counter: 0,
  };
}

const move = (id: string): WorkflowMove => {
  const found = DLA_MOVES.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown move: ${id}`);
  return found;
};

/** The seat a role holds when it makes a move: a reviewer if the move is the reviewer's, the requester otherwise. */
const seatFor = (m: WorkflowMove, role: UserRole): Seat => (m.by === "reviewer" || (m.by === "either" && hasFeatureAccess("dlaApproval", role)) ? "reviewer" : "requester");

export interface Availability {
  move: WorkflowMove;
  ok: boolean;
  /** Why not, in words, when it is not available. */
  reason?: string;
}

/** Every move a person can make by hand, and whether this role can make it now. Automatic moves are not here: the clock makes them. */
export function availability(state: SandboxState, role: UserRole): Availability[] {
  return DLA_MOVES.filter((m) => m.by !== "system").map((m) => {
    // The role's own blocker first: it is what no amount of waiting changes.
    if (m.gate && !hasFeatureAccess(m.gate, role)) return { move: m, ok: false, reason: m.gate === "dlaApproval" ? "Only a BioData Admin can." : "This role has no access to DLA." };
    if (!m.from.includes(state.status)) return { move: m, ok: false, reason: `Not offered when a request is ${agreementStatusMeta[state.status].label}.` };
    return { move: m, ok: true };
  });
}

const recipientWords = (keys: string[]) => {
  const parts = [keys.includes(ABOUT) ? "The requester" : "", keys.some((k) => k !== ABOUT) ? "Others chosen in Notification Management" : ""].filter(Boolean);
  return parts.join(" and ") || "No one";
};

const delayWords: Record<string, string> = { "15m": "15 minutes later", "1h": "1 hour later", "1d": "1 day later" };

/** The emails Notification Management would send for a request that has just become `status`. */
export function emailsFor(notifications: Notification[], status: AgreementStatus): Notification[] {
  return notifications.filter(
    (n) => n.state === "active" && n.trigger.kind === "event" && n.trigger.event === "dla.status_changed" && (n.trigger.statuses.length === 0 || n.trigger.statuses.includes(status)),
  );
}

const render = (template: string, id: string, status: AgreementStatus) => template.replaceAll("{{dla.id}}", id).replaceAll("{{dla.status}}", agreementStatusMeta[status].label);

function announce(state: SandboxState, m: WorkflowMove, status: AgreementStatus, at: string, ctx: TellContext, actorSeat: Seat | null, notifications: Notification[]): SandboxState {
  let counter = state.counter;
  const feed = [...state.feed];
  for (const tell of m.tells) {
    if (tell.unlessActorIs && tell.unlessActorIs === actorSeat) continue;
    feed.push({ id: (counter += 1), at, audience: tell.audience, text: tell.activity(ctx), moveId: m.id });
  }
  const emails = [...state.emails];
  for (const n of emailsFor(notifications, status)) {
    emails.push({
      id: (counter += 1),
      at,
      notificationId: n.id,
      name: n.name,
      to: recipientWords(n.to),
      subject: render(n.subject, SANDBOX_ID, status),
      delayed: n.trigger.kind === "event" ? (delayWords[n.trigger.delay] ?? null) : null,
      moveId: m.id,
    });
  }
  return { ...state, feed, emails, counter };
}

/** Lets the clock do what it does: Approved becomes Active on the start date, Active becomes Closed after the end date, and a reminder at 60 days. */
export function settle(state: SandboxState, notifications: Notification[]): SandboxState {
  let next = state;
  const events = autoTransitions(next.status, next.validFrom, next.validTo, next.today);
  for (const e of events) {
    next = { ...next, status: e.status, history: [...next.history, e] };
    next = announce(next, move(e.status === "active" ? "auto-activate" : "auto-close"), e.status, e.at, { id: SANDBOX_ID, actor: e.by, validFrom: next.validFrom, validTo: next.validTo }, null, notifications);
  }
  if (next.status === "active" && !next.reminded && next.validTo) {
    const left = daysBetween(next.today, next.validTo);
    if (left >= 0 && left <= REMINDER_WINDOW_DAYS) {
      next = { ...next, reminded: true };
      next = announce(next, move("expiry-reminder"), "active", next.today, { id: SANDBOX_ID, actor: "System", daysLeft: left }, null, notifications);
    }
  }
  return next;
}

export interface MoveInput {
  /** Approve: the grant starts this many days from today. */
  startsInDays?: number;
  /** Reject: the reason. */
  reason?: string;
}

/** Makes a move as a role. Returns the state unchanged if the role cannot make it now. */
export function perform(state: SandboxState, moveId: string, role: UserRole, input: MoveInput, notifications: Notification[]): SandboxState {
  const m = move(moveId);
  if (!availability(state, role).find((a) => a.move.id === moveId)?.ok) return state;
  const seat = seatFor(m, role);
  const reviewer = REVIEWING_ADMIN_NAME;
  const today = state.today;
  let next = state;
  const go = (status: AgreementStatus, by: string, note?: string, patch: Partial<SandboxState> = {}, ctx: Partial<TellContext> = {}) => {
    next = { ...next, ...patch, status, history: [...next.history, { status, at: today, by, ...(note ? { note } : {}) }] };
    next = announce(next, m, status, today, { id: SANDBOX_ID, actor: by, reason: note, ...ctx }, seat, notifications);
  };

  switch (m.id) {
    case "submit":
      go("submitted", REQUESTER_NAME);
      break;
    case "start-review":
    case "resume":
      go("under_review", reviewer);
      break;
    case "hold":
      go("on_hold", reviewer);
      break;
    case "approve": {
      const validFrom = addDays(today, input.startsInDays ?? 0);
      // As the store does: Active at once if the start date has arrived, otherwise Approved until it does.
      go(validFrom <= today ? "active" : "approved", reviewer, undefined, { validFrom, validTo: addDays(validFrom, GRANT_DAYS), reminded: false }, { startsOn: validFrom <= today ? undefined : formatDate(validFrom) });
      break;
    }
    case "reject":
      go("rejected", reviewer, input.reason?.trim() || undefined);
      break;
    case "cancel":
      // As the store does: logged as the requester, whoever pressed it.
      go("cancelled", REQUESTER_NAME);
      break;
    case "edit":
      next = { ...next, edits: next.edits + 1 };
      break;
    case "add-location":
      next = { ...next, locations: next.locations + 1 };
      break;
    case "renew":
      // A new request, so the closed one stays as it is; the sandbox starts a new Draft and keeps what it has shown.
      next = { ...next, status: "draft", validFrom: "", validTo: "", reminded: false, edits: 0, locations: 0, history: [{ status: "draft", at: today, by: REQUESTER_NAME }] };
      break;
  }
  return settle(next, notifications);
}

/** Moves the clock on, then lets it do what it does. */
export function advance(state: SandboxState, days: number, notifications: Notification[]): SandboxState {
  return settle({ ...state, today: addDays(state.today, days) }, notifications);
}

/** To the day after the grant ends. */
export function jumpPastEnd(state: SandboxState, notifications: Notification[]): SandboxState {
  if (!state.validTo) return state;
  return settle({ ...state, today: addDays(state.validTo, 1) }, notifications);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

import type { BadgeColors } from "@/components/base/badges/badge-types";
import { formatShortDate, todayIso } from "@/app/pages/_shared/dsa/dsa-data";
import { agreementStatusMeta, agreementStatusOrder } from "@/app/pages/_shared/agreement-status";

// Notification management: the automated emails BioData SA sends (BioData Admin and above). Source:
// the Figma wireframe "Notification Management" (YMproGZfrFB5jUqPHPxMhk, node 1584:22382): the list,
// and Add Notification as four tabs (Message, Templates, Settings, Sender & Recipients). There is no
// BRD for this module; the Figma is the only source for the fields, categories, templates and
// variables. Re-fitted, and each departure named:
//
//   - Trigger: the Figma's Trigger Type (Event, Time, Condition) and Scheduling Type (Time,
//     Workflow) overlap: Time is in both, and Condition and Workflow both mean "a status changed".
//     They become one question with two answers: when something happens (an event, optionally only
//     for some statuses, the Figma's condition) or on a schedule.
//   - Delivery: Sender "Current User" is gone. An automated email is not sent by whoever set it up;
//     it is sent by BioData SA, with an editable display name and an optional reply-to address. The
//     sending mailbox itself is not defined anywhere, so it is not shown (open question).
//   - Record keeping: "Retention Period" was a start and end date; it is a duration here.
//   - Message: the template owns the look (the designer, 1 Oct 2026); the Figma's font, size and
//     colour toolbar is not built. Bold and lists come from two plain-text marks.
//   - Attachments: not built (open question).
//
// Every variable the Figma names is kept with its Figma name (user.name, user.email,
// submission_date, observation_id, support_email, help_center_link, year). The others are named
// in the same style for the events this build already models; the real event payloads are not
// defined yet (open question).

export const NT_ROOT = "/pages/notifications";

// ── Categories (the Figma's list, verbatim) ──

export const NT_CATEGORIES = [
  "Account & Access",
  "Data Submission & Ingestion",
  "Data Review & Quality",
  "Projects & Collections",
  "Subscription",
  "Alerts",
  "External Tools",
  "Dashboards",
] as const;

// ── Variables ──

export interface NtVariable {
  key: string;
  label: string;
  /** What the preview shows in its place. Placeholder people only (CONTRACTS 0.3). */
  sample: string;
}

const v = (key: string, label: string, sample: string): NtVariable => ({ key, label, sample });

/** Available to every notification: the person receiving it, and the platform. */
export const RECIPIENT_VARIABLES: NtVariable[] = [v("user.name", "Name", "Olivia Wyatt"), v("user.email", "Email", "olivia.wyatt@example.com")];

export const PLATFORM_VARIABLES: NtVariable[] = [
  // The BDBSA support address, from DEW's own BDBSA material (.claude/rules/ref-domain.md).
  v("support_email", "Support email", "DEWBioDataSupport@sa.gov.au"),
  v("help_center_link", "Help centre link", "the BioData SA help centre"),
  v("year", "Year", String(new Date().getFullYear())),
];

const OBSERVATION_VARS = [v("observation_id", "Observation ID", "OBS00125"), v("observation.species", "Species", "Fairy Tern"), v("submission_date", "Submitted on", "2 Aug 2026, 10:12")];
const PROJECT_VARS = [v("project.name", "Project name", "Coorong Wetlands Bird Count")];
const UPLOAD_VARS = [...PROJECT_VARS, v("upload.file_name", "File name", "coorong-aug-2026.csv"), v("upload.record_count", "Records uploaded", "214")];
const REVIEW_VARS = [v("review.comment", "Reviewer's comment", "The location is outside the survey area.")];

// ── Events (what can trigger a notification) ──

export interface NtEvent {
  id: string;
  /** The event, as a list item: "Observation submitted". */
  label: string;
  /** The event, after "When": "an observation is submitted". */
  phrase: string;
  /** Groups the event picker. */
  group: string;
  /** Suggested when the event is picked; the admin can change it. */
  category: (typeof NT_CATEGORIES)[number];
  /** The person the event is about, who can be sent the email: "the submitter". */
  about: string;
  variables: NtVariable[];
  /** For a status change: the statuses it can be limited to (the Figma's Condition-based trigger). */
  statuses?: { id: string; label: string }[];
}

export const NT_EVENTS: NtEvent[] = [
  // The Figma's own trigger examples: "User Created", "Password Reset".
  { id: "account.created", label: "Account created", phrase: "an account is created", group: "Accounts", category: "Account & Access", about: "the new user", variables: [] },
  { id: "account.password_reset", label: "Password reset requested", phrase: "a password reset is requested", group: "Accounts", category: "Account & Access", about: "the user", variables: [v("reset_link", "Reset link", "Reset your password")] },
  // The Figma's notification names, as events.
  { id: "observation.submitted", label: "Observation submitted", phrase: "an observation is submitted", group: "Observations", category: "Data Submission & Ingestion", about: "the submitter", variables: OBSERVATION_VARS },
  { id: "observation.submission_failed", label: "Observation submission failed", phrase: "an observation can't be submitted", group: "Observations", category: "Data Submission & Ingestion", about: "the submitter", variables: [...OBSERVATION_VARS, v("failure_reason", "Reason it failed", "The date is in the future.")] },
  { id: "observation.pending_review", label: "Observation waiting for review", phrase: "an observation is waiting for review", group: "Observations", category: "Data Review & Quality", about: "the submitter", variables: OBSERVATION_VARS },
  { id: "observation.approved", label: "Observation approved", phrase: "an observation is approved", group: "Observations", category: "Data Review & Quality", about: "the submitter", variables: OBSERVATION_VARS },
  { id: "observation.rejected", label: "Observation rejected", phrase: "an observation is rejected", group: "Observations", category: "Data Review & Quality", about: "the submitter", variables: [...OBSERVATION_VARS, ...REVIEW_VARS] },
  { id: "observation.changes_requested", label: "Observation needs changes", phrase: "a reviewer asks for changes to an observation", group: "Observations", category: "Data Review & Quality", about: "the submitter", variables: [...OBSERVATION_VARS, ...REVIEW_VARS] },
  { id: "upload.completed", label: "Bulk upload completed", phrase: "a bulk upload finishes", group: "Uploads", category: "Data Submission & Ingestion", about: "the uploader", variables: UPLOAD_VARS },
  { id: "upload.partially_failed", label: "Bulk upload partly failed", phrase: "some records in a bulk upload fail", group: "Uploads", category: "Data Submission & Ingestion", about: "the uploader", variables: [...UPLOAD_VARS, v("upload.failed_count", "Records that failed", "12")] },
  // The Figma's workflow example: "when a project moves to In Progress". The statuses are the ones
  // the project list uses.
  {
    id: "project.status_changed",
    label: "Project status changed",
    phrase: "a project's status changes",
    group: "Projects",
    category: "Projects & Collections",
    about: "the project's contacts",
    variables: [...PROJECT_VARS, v("project.status", "New status", "Active")],
    statuses: ["Draft", "Under review", "Active", "Completed"].map((s) => ({ id: s, label: s })),
  },
  // The DLA workflow this build already has, with its real statuses (agreement-status.ts).
  {
    id: "dla.status_changed",
    label: "DLA request status changed",
    phrase: "a DLA request's status changes",
    group: "Data access",
    category: "Account & Access",
    about: "the requester",
    variables: [v("dla.id", "Request ID", "DLA-2026-00042"), v("dla.status", "New status", "Approved")],
    statuses: agreementStatusOrder.filter((s) => s !== "draft").map((s) => ({ id: s, label: agreementStatusMeta[s].label })),
  },
];

export function ntEvent(id: string | undefined): NtEvent | undefined {
  return NT_EVENTS.find((e) => e.id === id);
}

const SCHEDULE_VARS = [v("period.start", "Period start", "1 Sep 2026"), v("period.end", "Period end", "7 Sep 2026")];

/** Every variable a notification can use, given its trigger, grouped for the Insert variable menu. */
export function variablesFor(trigger: NtTrigger): { group: string; items: NtVariable[] }[] {
  const event = trigger.kind === "event" ? ntEvent(trigger.event) : undefined;
  return [
    { group: "Recipient", items: RECIPIENT_VARIABLES },
    ...(event && event.variables.length ? [{ group: event.label, items: event.variables }] : []),
    ...(trigger.kind === "schedule" ? [{ group: "Schedule", items: SCHEDULE_VARS }] : []),
    { group: "BioData SA", items: PLATFORM_VARIABLES },
  ];
}

// ── Templates (the Figma's four) ──

export type TemplateId = "basic" | "urgent" | "informational" | "maintenance";

export const NT_TEMPLATES: { id: TemplateId; name: string; brand: "DEW" | "GOSA"; description: string }[] = [
  { id: "basic", name: "Basic", brand: "DEW", description: "A basic template with DEW branding." },
  { id: "urgent", name: "Urgent", brand: "DEW", description: "A critical update that needs immediate attention." },
  { id: "informational", name: "Informational", brand: "GOSA", description: "A general announcement for all users." },
  // The Figma names Maintenance but its description is cut off in the frame; this one is ours.
  { id: "maintenance", name: "Maintenance", brand: "GOSA", description: "Planned outages and changes to the service." },
];

export const ntTemplate = (id: TemplateId) => NT_TEMPLATES.find((t) => t.id === id) ?? NT_TEMPLATES[0];

// ── Security classification (the Figma's "Label" and "Sensitivity": OFFICIAL Sensitive, Official) ──
// Written as the Protective Security Policy Framework writes them, which is what the Figma labels are.

export type Sensitivity = "official" | "official-sensitive";

export const SENSITIVITY: Record<Sensitivity, { label: string }> = {
  official: { label: "OFFICIAL" },
  "official-sensitive": { label: "OFFICIAL: Sensitive" },
};

// ── Recipients ──
// A recipient is a key: "about" (the person the event is about), "role:<ROLE-id>" (everyone with a
// User Management role) or "person:<USR-id>" (one user). Roles and people are read from User
// Management (nt-directory.ts), so the picker always offers whoever an admin has set up there. The
// four placeholder people (CONTRACTS 0.3) are users there too.

export const ABOUT = "about";

/** Turns a recipient key into words. `about` is the event's own phrase ("the submitter"). */
export type RecipientLabel = (key: string) => string;

// ── The notification ──

export type NtState = "draft" | "active" | "disabled";

export const ntStateMeta: Record<NtState, { label: string; badgeColor: BadgeColors }> = {
  active: { label: "Active", badgeColor: "success" },
  draft: { label: "Draft", badgeColor: "gray" },
  disabled: { label: "Disabled", badgeColor: "warning" },
};

export const ntStateOrder: NtState[] = ["active", "draft", "disabled"];

export type Delay = "none" | "15m" | "1h" | "1d";
export const DELAYS: { id: Delay; label: string }[] = [
  { id: "none", label: "Straight away" },
  { id: "15m", label: "15 minutes later" },
  { id: "1h", label: "1 hour later" },
  { id: "1d", label: "1 day later" },
];

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";
export const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Every week" },
  { id: "monthly", label: "Every month" },
  { id: "yearly", label: "Every year" },
];

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => ({ id: d, label: d }));
export const MONTH_DAYS = [...Array.from({ length: 28 }, (_, i) => ({ id: String(i + 1), label: ordinal(i + 1) })), { id: "last", label: "Last day" }];

/** Every half hour, "12:00 AM" to "11:30 PM" (the Figma's Delivery Time defaults to 12:00 AM). */
export const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 ? "30" : "00";
  return { id: `${String(h).padStart(2, "0")}:${m}`, label: `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}` };
});

export const TIME_ZONES = [
  // The Figma's default zone. South Australia moves to ACDT in summer, so the zone is a place, not an offset.
  { id: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
  { id: "Australia/Darwin", label: "Darwin (ACST)" },
  { id: "Australia/Brisbane", label: "Brisbane (AEST)" },
  { id: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { id: "Australia/Perth", label: "Perth (AWST)" },
];

// How long a copy of each sent email is kept: a period, a fixed date, forever, or not at all. The
// Figma asked for a retention start and end date; a period covers most needs in one pick, and
// "Until a date" covers the rest.
export type Retention = "none" | "6m" | "1y" | "2y" | "7y" | "until" | "forever";
export const RETENTIONS: { id: Retention; label: string }[] = [
  { id: "6m", label: "6 months" },
  { id: "1y", label: "1 year" },
  { id: "2y", label: "2 years" },
  { id: "7y", label: "7 years" },
  { id: "until", label: "Until a date" },
  { id: "forever", label: "Indefinitely" },
  { id: "none", label: "Don't keep a log" },
];

export interface NtAttachment {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
}

export const newAttachmentId = () => `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type NtTrigger =
  | { kind: "event"; event: string; statuses: string[]; delay: Delay }
  | { kind: "schedule"; frequency: Frequency; weekday: string; monthDay: string; time: string; timeZone: string; startDate: string; endDate: string };

export interface NtAuditEvent {
  at: string;
  by: string;
  action: string;
  changes?: { field: string; from: string; to: string }[];
}

export interface NtDraft {
  name: string;
  category: string;
  description: string;
  trigger: NtTrigger;
  /** Recipient keys (see Recipients above). */
  to: string[];
  cc: string[];
  bcc: string[];
  fromName: string;
  replyTo: string;
  retention: Retention;
  /** With `retention: "until"`. */
  retainUntil: string;
  template: TemplateId;
  sensitivity: Sensitivity;
  subject: string;
  heading: string;
  body: string;
  signOff: string;
  /** Files sent with every email. Only their names and sizes are kept in this preview build. */
  attachments: NtAttachment[];
}

export interface Notification extends NtDraft {
  id: string;
  state: NtState;
  createdAt: string;
  updatedAt: string;
  history: NtAuditEvent[];
}

export const eventTrigger = (event = ""): NtTrigger => ({ kind: "event", event, statuses: [], delay: "none" });
export const scheduleTrigger = (): NtTrigger => ({ kind: "schedule", frequency: "weekly", weekday: "Monday", monthDay: "1", time: "09:00", timeZone: "Australia/Adelaide", startDate: todayIso(), endDate: "" });

export function emptyNtDraft(): NtDraft {
  return {
    name: "",
    category: "",
    description: "",
    trigger: eventTrigger(),
    to: [ABOUT],
    cc: [],
    bcc: [],
    fromName: "BioData SA",
    replyTo: "",
    retention: "2y",
    retainUntil: "",
    template: "basic",
    sensitivity: "official",
    subject: "",
    heading: "",
    body: "Hello {{user.name}},\n\n",
    signOff: "Kind regards,\nThe BioData SA team",
    attachments: [],
  };
}

export function draftOf(n: Notification): NtDraft {
  const { id: _id, state: _state, createdAt: _created, updatedAt: _updated, history: _history, ...draft } = n;
  void [_id, _state, _created, _updated, _history];
  return structuredClone(draft);
}

// ── Reading a notification as sentences ──

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
}

const timeLabel = (id: string) => TIMES.find((t) => t.id === id)?.label ?? id;
const zoneLabel = (id: string) => TIME_ZONES.find((z) => z.id === id)?.label.split(" (")[0] ?? id;

/** "When an observation is approved" / "Every Monday at 9:00 AM, Adelaide time". */
export function triggerSummary(trigger: NtTrigger): string {
  if (trigger.kind === "event") {
    const event = ntEvent(trigger.event);
    if (!event) return "No trigger chosen";
    const statuses = event.statuses?.filter((s) => trigger.statuses.includes(s.id)).map((s) => s.label) ?? [];
    const when = statuses.length ? `When ${event.phrase} to ${joinOr(statuses)}` : `When ${event.phrase}`;
    const delay = trigger.delay === "none" ? "" : `, ${DELAYS.find((d) => d.id === trigger.delay)!.label}`;
    return when + delay;
  }
  const at = `at ${timeLabel(trigger.time)}, ${zoneLabel(trigger.timeZone)} time`;
  if (trigger.frequency === "daily") return `Every day ${at}`;
  if (trigger.frequency === "weekly") return `Every ${trigger.weekday} ${at}`;
  if (trigger.frequency === "monthly") return `On the ${trigger.monthDay === "last" ? "last day" : ordinal(Number(trigger.monthDay))} of every month ${at}`;
  return `Every year on ${trigger.startDate ? formatShortDate(trigger.startDate).replace(/ \d{4}$/, "") : "the start date"} ${at}`;
}

/** The short form for a list row: "Observation approved" / "Weekly, Monday". */
export function triggerShort(trigger: NtTrigger): string {
  if (trigger.kind === "event") return ntEvent(trigger.event)?.label ?? "No trigger chosen";
  return { daily: "Daily", weekly: `Weekly, ${trigger.weekday}`, monthly: "Monthly", yearly: "Yearly" }[trigger.frequency];
}

function joinOr(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

function joinAnd(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Recipient keys in words: "The submitter, BioData Admin and Jarrah Mitchell"; past three, "and 4 more". */
export function recipientsSummary(keys: string[], label: RecipientLabel, empty = "No one yet"): string {
  const parts = keys.map(label);
  if (!parts.length) return empty;
  const shown = parts.length > 3 ? [...parts.slice(0, 2), `${parts.length - 2} more`] : parts;
  const text = joinAnd(shown);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The event's "the submitter", when a notification can send to the person its event is about. */
export function aboutOf(trigger: NtTrigger): string | undefined {
  return trigger.kind === "event" ? ntEvent(trigger.event)?.about : undefined;
}

/** Keys that can't apply to this trigger are dropped: a schedule has no "person it's about". */
export const effectiveTo = (d: Pick<NtDraft, "to" | "trigger">) => d.to.filter((k) => k !== ABOUT || !!aboutOf(d.trigger));

// ── Variables in text ──

const VARIABLE = /\{\{\s*([\w.]+)\s*\}\}/g;

export function variablesIn(text: string): string[] {
  return [...text.matchAll(VARIABLE)].map((m) => m[1]);
}

/** Variables a notification uses that its trigger doesn't provide, by field. */
export function unknownVariables(draft: NtDraft): { field: "subject" | "heading" | "body" | "signOff"; keys: string[] }[] {
  const known = new Set(variablesFor(draft.trigger).flatMap((g) => g.items.map((i) => i.key)));
  return (["subject", "heading", "body", "signOff"] as const)
    .map((field) => ({ field, keys: [...new Set(variablesIn(draft[field]).filter((k) => !known.has(k)))] }))
    .filter((f) => f.keys.length > 0);
}

export function sampleValues(trigger: NtTrigger): Map<string, string> {
  return new Map(variablesFor(trigger).flatMap((g) => g.items.map((i) => [i.key, i.sample] as const)));
}

// ── Validation ──

export type NtSection = "trigger" | "recipients" | "message";
export type NtErrors = Partial<Record<string, string>>;

/** Which section a validation path belongs to. */
export function errorSection(path: string): NtSection {
  if (["to", "replyTo", "retainUntil"].includes(path)) return "recipients";
  if (["subject", "heading", "body", "signOff"].includes(path)) return "message";
  return "trigger";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Path -> what is wrong. The message is what "Details missing" names. A draft needs only a name. */
export function validateNt(d: NtDraft, intent: "draft" | "publish", all: Notification[], selfId?: string): NtErrors {
  // In the order the fields appear, so "Details missing" reads top to bottom.
  const e: NtErrors = {};
  const name = d.name.trim().toLowerCase();
  const nameError = !name ? "Notification name" : all.some((n) => n.id !== selfId && n.name.trim().toLowerCase() === name) ? "A notification with this name already exists" : undefined;
  if (intent === "draft") return nameError ? { name: nameError } : e;

  if (d.trigger.kind === "event") {
    if (!ntEvent(d.trigger.event)) e.event = "What triggers it";
  } else {
    if (!d.trigger.startDate) e.startDate = "Start date";
    else if (d.trigger.endDate && d.trigger.endDate < d.trigger.startDate) e.endDate = "The end date must be on or after the start date";
  }
  if (nameError) e.name = nameError;
  if (!d.category) e.category = "Category";

  if (effectiveTo(d).length === 0) e.to = "Who it goes to";
  if (d.replyTo.trim() && !EMAIL.test(d.replyTo.trim())) e.replyTo = "Reply-to must be an email address";
  if (d.retention === "until") {
    if (!d.retainUntil) e.retainUntil = "Keep until";
    else if (d.retainUntil <= todayIso()) e.retainUntil = "The date must be after today";
  }

  if (!d.subject.trim()) e.subject = "Subject";
  if (!d.body.trim() || /^Hello \{\{user\.name\}\},?$/.test(d.body.trim())) e.body = "Message";
  for (const { field, keys } of unknownVariables(d)) {
    if (!e[field]) e[field] = `${keys.map((k) => `{{${k}}}`).join(", ")} ${keys.length === 1 ? "isn't" : "aren't"} available for this trigger`;
  }
  return e;
}

/** Another live notification that already sends on the same event to the person it's about. */
export function overlapping(d: NtDraft, all: Notification[], selfId?: string): Notification | undefined {
  if (d.trigger.kind !== "event" || !d.trigger.event || !d.to.includes(ABOUT)) return undefined;
  const mine = d.trigger;
  return all.find((n) => {
    if (n.id === selfId || n.state !== "active" || n.trigger.kind !== "event" || n.trigger.event !== mine.event || !n.to.includes(ABOUT)) return false;
    // Two notifications limited to different statuses don't overlap.
    const a = n.trigger.statuses;
    const b = mine.statuses;
    return a.length === 0 || b.length === 0 || a.some((s) => b.includes(s));
  });
}

// ── History ──

/** The fields History reports, with how each reads. */
export function diffNt(before: NtDraft, after: NtDraft, label: RecipientLabel): { field: string; from: string; to: string }[] {
  const people = (keys: string[]) => recipientsSummary(keys, label, "No one");
  const files = (d: NtDraft) => d.attachments.map((a) => a.name).join(", ");
  const show = (x: string) => x.trim() || "Not provided";
  const pairs: [string, string, string][] = [
    ["Name", before.name, after.name],
    ["Category", before.category, after.category],
    ["Description", before.description, after.description],
    ["Trigger", triggerSummary(before.trigger), triggerSummary(after.trigger)],
    ["To", people(before.to), people(after.to)],
    ["CC", people(before.cc), people(after.cc)],
    ["BCC", people(before.bcc), people(after.bcc)],
    ["From", before.fromName, after.fromName],
    ["Reply-to", before.replyTo, after.replyTo],
    ["Sent email log", logSummary(before), logSummary(after)],
    ["Template", ntTemplate(before.template).name, ntTemplate(after.template).name],
    ["Classification", SENSITIVITY[before.sensitivity].label, SENSITIVITY[after.sensitivity].label],
    ["Subject", before.subject, after.subject],
    ["Heading", before.heading, after.heading],
    ["Message", before.body, after.body],
    ["Sign-off", before.signOff, after.signOff],
    ["Attachments", files(before), files(after)],
  ];
  return pairs.filter(([, a, b]) => a !== b).map(([field, a, b]) => ({ field, from: show(field === "Message" ? clip(a) : a), to: show(field === "Message" ? clip(b) : b) }));
}

const clip = (s: string) => (s.length > 80 ? `${s.slice(0, 80).trim()}…` : s);

export function logSummary(d: Pick<NtDraft, "retention" | "retainUntil">): string {
  if (d.retention === "none") return "Not kept";
  if (d.retention === "forever") return "Kept indefinitely";
  if (d.retention === "until") return d.retainUntil ? `Kept until ${formatShortDate(d.retainUntil)}` : "Kept until a date not chosen yet";
  return `Kept for ${RETENTIONS.find((r) => r.id === d.retention)!.label}`;
}

// ── IDs ──

export function nextNtId(existing: { id: string }[]): string {
  const highest = existing.reduce((max, n) => Math.max(max, Number(n.id.split("-")[1]) || 0), 0);
  return `NTF-${String(highest + 1).padStart(3, "0")}`;
}

/** For the static export: every seed id plus the next ones a new notification would get. */
export function staticNtIds(count = 50): string[] {
  const highest = seedNotifications.reduce((max, n) => Math.max(max, Number(n.id.split("-")[1]) || 0), 0);
  return [...seedNotifications.map((n) => n.id), ...Array.from({ length: count }, (_, i) => `NTF-${String(highest + 1 + i).padStart(3, "0")}`)];
}

export function nowIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "19 Aug 2026, 10:12". */
export function formatDateTime(iso: string): string {
  const [date, time] = iso.split("T");
  return time ? `${formatShortDate(date)}, ${time.slice(0, 5)}` : formatShortDate(date);
}

export { formatShortDate, todayIso };

// ── Seeds ──
// The names and descriptions are the Figma's, except where marked. "Observation submitted
// successfully" carries the Figma's own email, word for word. Every other message is placeholder copy
// written for this build, for the admin to replace: the real wording isn't defined anywhere yet.

function seed(id: string, state: NtState, updatedAt: string, d: Partial<NtDraft> & Pick<NtDraft, "name" | "category" | "trigger">): Notification {
  return {
    ...emptyNtDraft(),
    ...d,
    id,
    state,
    createdAt: "2026-08-04",
    updatedAt,
    history: [
      { at: "2026-08-04T09:30", by: "Olivia Wyatt", action: state === "draft" ? "Saved as draft" : "Created" },
      ...(state === "disabled" ? [{ at: `${updatedAt}T14:05`, by: "Phoenix Baker", action: "Disabled" }] : []),
    ],
  };
}

const ev = (event: string, statuses: string[] = [], delay: Delay = "none"): NtTrigger => ({ kind: "event", event, statuses, delay });

export const seedNotifications: Notification[] = [
  seed("NTF-001", "active", "2026-09-12", {
    name: "Observation submitted successfully",
    category: "Data Submission & Ingestion",
    description: "Confirms that an observation has been submitted to the platform.",
    trigger: ev("observation.submitted"),
    subject: "Your observation submission in BioData SA",
    heading: "Observation received",
    body: "Hello {{user.name}},\n\nYour observation has been successfully submitted to the BioData Platform. Thank you for contributing valuable information that helps support research, conservation, and data-driven insights.\n\n**Submission details:**\n- Status: Successfully submitted\n- Date and time: {{submission_date}}\n- Reference ID: {{observation_id}}\n\nYou can view, edit, or track the status of your observation by logging into your account. If any additional information is required, our team will notify you.\n\nWe appreciate your contribution and continued support.",
    signOff: "Best regards,\nThe BioData Platform Team",
  }),
  seed("NTF-002", "active", "2026-09-12", {
    name: "Observation submission failed",
    category: "Data Submission & Ingestion",
    description: "Alerts the user that an observation could not be submitted and requires attention.",
    trigger: ev("observation.submission_failed"),
    template: "urgent",
    subject: "We couldn't submit your observation",
    heading: "Your observation wasn't submitted",
    body: "Hello {{user.name}},\n\nYour observation of {{observation.species}} couldn't be submitted.\n\n**Reason:** {{failure_reason}}\n\nYour details are saved. Sign in to fix the problem and submit it again.",
  }),
  seed("NTF-003", "active", "2026-09-03", {
    name: "Bulk upload completed",
    category: "Data Submission & Ingestion",
    description: "Confirms that a bulk data upload has finished successfully.",
    trigger: ev("upload.completed"),
    subject: "Your upload to {{project.name}} is complete",
    heading: "Upload complete",
    body: "Hello {{user.name}},\n\n{{upload.record_count}} records from {{upload.file_name}} were added to {{project.name}}.",
  }),
  seed("NTF-004", "active", "2026-09-03", {
    name: "Bulk upload partially failed",
    category: "Data Submission & Ingestion",
    description: "Indicates that some records in a bulk upload failed validation or processing.",
    trigger: ev("upload.partially_failed"),
    template: "urgent",
    subject: "Some records in {{upload.file_name}} weren't added",
    heading: "Some records need attention",
    body: "Hello {{user.name}},\n\n{{upload.failed_count}} records in {{upload.file_name}} failed validation and weren't added to {{project.name}}. The rest were added.\n\nSign in to see which records failed and why.",
  }),
  seed("NTF-005", "active", "2026-08-21", {
    name: "Observation pending review",
    category: "Data Review & Quality",
    description: "Informs that a submitted observation is awaiting review or validation.",
    trigger: ev("observation.pending_review", [], "1h"),
    subject: "Your observation is waiting for review",
    heading: "Waiting for review",
    body: "Hello {{user.name}},\n\nYour observation {{observation_id}} is in the review queue. We'll email you when a reviewer has looked at it.",
  }),
  seed("NTF-006", "active", "2026-08-21", {
    name: "Observation approved",
    category: "Data Review & Quality",
    description: "Confirms that an observation has passed review and is now published.",
    trigger: ev("observation.approved"),
    subject: "Your observation has been approved",
    heading: "Observation approved",
    body: "Hello {{user.name}},\n\nYour observation of {{observation.species}} ({{observation_id}}) has passed review and is now published.",
  }),
  seed("NTF-007", "active", "2026-08-21", {
    name: "Observation rejected",
    category: "Data Review & Quality",
    description: "Notifies that an observation was rejected during review.",
    trigger: ev("observation.rejected"),
    sensitivity: "official-sensitive",
    subject: "Your observation wasn't accepted",
    heading: "Observation not accepted",
    body: "Hello {{user.name}},\n\nYour observation {{observation_id}} wasn't accepted.\n\n**Reviewer's comment:** {{review.comment}}",
  }),
  seed("NTF-008", "draft", "2026-09-28", {
    name: "Observation requires changes",
    category: "Data Review & Quality",
    // The Figma's description for this one is a stray placeholder ("Automate data processing and analysis"); this one is ours.
    description: "Asks the submitter to change an observation before it can be reviewed.",
    trigger: ev("observation.changes_requested"),
    subject: "Changes needed to your observation",
  }),
  seed("NTF-009", "active", "2026-09-01", {
    name: "Welcome to BioData SA",
    category: "Account & Access",
    description: "Welcomes a new user when their account is created.",
    trigger: ev("account.created"),
    subject: "{{user.name}}, welcome to BioData SA",
    heading: "We're excited to have you on board!",
    body: "Hello {{user.name}},\n\nTo get started, please verify your email address and complete your profile setup. Our team is here to help if you need any assistance.\n\nNeed help? Visit {{help_center_link}} or contact us at {{support_email}}.",
    signOff: "Cheers,\nBioData SA Team",
  }),
  seed("NTF-010", "active", "2026-09-01", {
    name: "Password reset",
    category: "Account & Access",
    description: "Sends the link to reset a forgotten password.",
    trigger: ev("account.password_reset"),
    sensitivity: "official-sensitive",
    retention: "none",
    subject: "Reset your BioData SA password",
    heading: "Reset your password",
    body: "Hello {{user.name}},\n\nWe received a request to reset your password. Use this link to choose a new one: {{reset_link}}\n\nIf you didn't ask for this, you can ignore this email.",
  }),
  seed("NTF-011", "active", "2026-09-18", {
    name: "DLA request decided",
    category: "Account & Access",
    description: "Tells the requester their data licence request was approved or rejected.",
    trigger: ev("dla.status_changed", ["approved", "rejected"]),
    sensitivity: "official-sensitive",
    subject: "Your data licence request {{dla.id}}: {{dla.status}}",
    heading: "Your DLA request has been decided",
    body: "Hello {{user.name}},\n\nYour data licence request {{dla.id}} is now **{{dla.status}}**. Sign in to see the details.",
  }),
  seed("NTF-012", "disabled", "2026-09-22", {
    name: "Project moved to Active",
    category: "Projects & Collections",
    description: "Tells a project's contacts that it is now active and open for records.",
    trigger: ev("project.status_changed", ["Active"]),
    subject: "{{project.name}} is now active",
    heading: "Your project is active",
    body: "Hello {{user.name}},\n\n{{project.name}} is now active. You can start adding records to it.",
  }),
  seed("NTF-013", "active", "2026-09-15", {
    name: "Weekly review summary",
    category: "Data Review & Quality",
    description: "A Monday morning reminder for reviewers of what is waiting in the queue.",
    trigger: { kind: "schedule", frequency: "weekly", weekday: "Monday", monthDay: "1", time: "09:00", timeZone: "Australia/Adelaide", startDate: "2026-09-01", endDate: "" },
    // ROLE-101 is User Management's BioData Admin role.
    to: ["role:ROLE-101"],
    template: "informational",
    subject: "Observations waiting for review, {{period.start}} to {{period.end}}",
    heading: "This week's review queue",
    body: "Hello {{user.name}},\n\nHere is what arrived for review between {{period.start}} and {{period.end}}. Sign in to work through the queue.",
  }),
];

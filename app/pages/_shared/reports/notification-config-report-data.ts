import {
  ABOUT,
  DELAYS,
  TIMES,
  TIME_ZONES,
  bodyText,
  effectiveTo,
  ntEvent,
  ntStateMeta,
  ntTemplate,
  triggerShort,
  type Notification,
  type NtTrigger,
  type RecipientLabel,
} from "@/app/pages/_shared/notifications/nt-data";

// The rows of the Notification Config Detail Report: one row per notification Notification Management holds (a draft, an active or a disabled one),
// with the columns of the designer's wireframe (Figma YMproGZfrFB5jUqPHPxMhk, 165:14336 and its Columns panel, 165:15084). A notification is read as
// Notification Management writes it, so the report and the notification's own page cannot disagree. Where the wireframe's word is not the build's:
//   - the wireframe's Trigger Type (Event, Time, Condition) and Scheduling Type (Time, Workflow) are one question in the build, "when something
//     happens or on a schedule" (nt-data.ts), so Trigger type is Event or Schedule;
//   - Trigger condition is the event ("When an observation is approved"); Workflow is the event when it is a change of status (a project's or a DLA
//     request's) and Stage the status or statuses it is limited to ("Any status" when it is not), which is how the wireframe words "when a project
//     moves to In Progress";
//   - Date and time, Frequency, Valid from and Valid until are a schedule's and are empty for an event; Delay is an event's and is empty for a schedule;
//   - Created by and Modified by are the first and the last person in the notification's own history, Created on and Modified on its days;
//   - Comments is empty: a notification keeps no comment.

export interface NotificationRow {
  id: string;
  seq: number;
  notificationId: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  from: string;
  toType: string;
  to: string;
  cc: string;
  bcc: string;
  message: string;
  triggerType: string;
  condition: string;
  dateTime: string;
  delay: string;
  frequency: string;
  workflow: string;
  stage: string;
  /** Each status the notification is limited to, for the Filter. */
  stages: string[];
  template: string;
  status: string;
  /** Everyone it is sent to, by role or name, for the Filter. */
  recipients: string[];
  start: string;
  end: string;
  createdBy: string;
  created: string;
  modifiedBy: string;
  updated: string;
}

const typeOf = (key: string) => (key === ABOUT ? "Person it's about" : key.startsWith("role:") ? "Role" : "User");

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Recipients as a list; a recipient that is a phrase ("the submitter") starts with a capital like the names beside it. */
const list = (items: string[]) => items.map(capital).join("; ");

function triggerFacts(trigger: NtTrigger) {
  if (trigger.kind === "schedule") {
    const time = TIMES.find((t) => t.id === trigger.time)?.label ?? trigger.time;
    const zone = TIME_ZONES.find((z) => z.id === trigger.timeZone)?.label.split(" (")[0] ?? trigger.timeZone;
    return { triggerType: "Schedule", condition: "", dateTime: `${time}, ${zone} time`, delay: "", frequency: triggerShort(trigger), workflow: "", stages: [] as string[], start: trigger.startDate, end: trigger.endDate };
  }
  const event = ntEvent(trigger.event);
  const statuses = event?.statuses?.filter((s) => trigger.statuses.includes(s.id)).map((s) => s.label) ?? [];
  return {
    triggerType: "Event",
    condition: event ? `When ${event.phrase}` : "",
    dateTime: "",
    delay: DELAYS.find((d) => d.id === trigger.delay)?.label ?? "",
    frequency: "",
    workflow: event?.statuses ? event.label : "",
    stages: event?.statuses ? (statuses.length > 0 ? statuses : ["Any status"]) : [],
    start: "",
    end: "",
  };
}

export function notificationRowsFor(notifications: Notification[], labelFor: (trigger: NtTrigger) => RecipientLabel): NotificationRow[] {
  return notifications.map((n, i) => {
    const label = labelFor(n.trigger);
    const to = effectiveTo(n);
    const facts = triggerFacts(n.trigger);
    return {
      id: n.id,
      seq: i + 1,
      notificationId: n.id,
      name: n.name,
      description: n.description,
      category: n.category,
      subject: n.subject,
      from: n.fromName,
      toType: [...new Set(to.map(typeOf))].join(", "),
      to: list(to.map(label)),
      cc: list(n.cc.map(label)),
      bcc: list(n.bcc.map(label)),
      message: bodyText(n.body),
      triggerType: facts.triggerType,
      condition: facts.condition,
      dateTime: facts.dateTime,
      delay: facts.delay,
      frequency: facts.frequency,
      workflow: facts.workflow,
      stage: list(facts.stages),
      stages: facts.stages,
      template: ntTemplate(n.template).name,
      status: ntStateMeta[n.state].label,
      recipients: [...new Set([...to, ...n.cc, ...n.bcc].map(label).map(capital))],
      start: facts.start,
      end: facts.end,
      createdBy: n.history[0]?.by ?? "",
      created: n.createdAt,
      modifiedBy: n.history[n.history.length - 1]?.by ?? "",
      updated: n.updatedAt,
    };
  });
}

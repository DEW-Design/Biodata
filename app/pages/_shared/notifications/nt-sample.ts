import { parseDate } from "@internationalized/date";
import { sampleFile } from "@/app/_prototype-tools/sample-files";
import { emptyNtDraft, todayIso, type Notification, type NtDraft } from "@/app/pages/_shared/notifications/nt-data";

// The notification form's sample answers, for the Pre-fill sample content switch on the Prototype tools bar (app/_prototype-tools/sample-content.ts).
// It answers the fullest branch of the form (the designer, 10 Nov 2026):
//   - A schedule, not an event: it asks six things (how often, the weekday, the time, the time zone, a start and an end date) where an event asks
//     three (the event, the statuses, the delay), and the message can use the schedule's own variables (the period it covers).
//   - Recipients in all three lines (To, CC and BCC, which are offered on request), roles and a person.
//   - The sending options opened up: a sender name, a reply-to address and a copy of each sent email kept "until a date", which asks for the date.
//   - A message with a template, a classification, a subject, a heading, a body with bold and a list, a sign-off and two attachments (the files are added
//     by the form's own file wiring, so switching off takes them out again and leaves the person's own).
// Honest (CONTRACTS 0.3): the people are a placeholder person (Olivia Wyatt, a user in User Management) and roles that exist there; the address is a
// placeholder at example.com; every variable is one the schedule provides, so the filled form is not refused.

/** Everything the form keeps in state for this screen, so one snapshot puts it all back. */
export interface NtFormState {
  draft: NtDraft;
  /** The name and category follow the event until the admin sets their own; a sample sets its own. */
  autoName: boolean;
  autoCategory: boolean;
  /** CC and BCC are offered on request, so a filled one has to be showing. */
  showCc: boolean;
  showBcc: boolean;
}

const BODY =
  "<p>Hello {{user.name}},</p>" +
  "<p>Here is what happened on BioData SA between {{period.start}} and {{period.end}}.</p>" +
  "<ul><li><p>New observations that were submitted</p></li><li><p>Uploads that finished, or need attention</p></li><li><p>Data licence requests waiting for a decision</p></li></ul>" +
  "<p><strong>Need a hand?</strong> Write to {{support_email}}.</p>";

const NAME = "Weekly activity digest";

/** The name, numbered when another notification already has it, so a sample saved once does not refuse the next. */
function freeName(all: Notification[]): string {
  const taken = new Set(all.map((n) => n.name.trim().toLowerCase()));
  let name = NAME;
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${NAME} ${i}`;
  return name;
}

const inDays = (days: number) => parseDate(todayIso()).add({ days }).toString();

/** The people it goes to, as the recipient picker keys them: ROLE-101 to ROLE-103 and USR-1014 are User Management's BioData Admin, BioData User and Privileged Admin roles and Olivia Wyatt. */
export function sampleNotification(all: Notification[], current: NtDraft): NtFormState {
  const base = emptyNtDraft();
  return {
    draft: {
      ...base,
      name: freeName(all),
      category: "Data Review & Quality",
      description: "A Friday afternoon summary, for administrators, of what happened on the platform that week.",
      trigger: { kind: "schedule", frequency: "weekly", weekday: "Friday", monthDay: "1", time: "16:00", timeZone: "Australia/Adelaide", startDate: todayIso(), endDate: inDays(180) },
      to: ["role:ROLE-101"],
      cc: ["role:ROLE-102", "person:USR-1014"],
      bcc: ["role:ROLE-103"],
      fromName: "BioData SA data team",
      replyTo: "olivia.wyatt@example.com",
      retention: "until",
      retainUntil: inDays(730),
      template: "informational",
      sensitivity: "official",
      subject: "Your week in BioData SA, {{period.start}} to {{period.end}}",
      heading: "This week in BioData SA",
      body: BODY,
      signOff: "Cheers,\nThe BioData SA team",
      // The sample's files are added by the form's file wiring; what the person attached stays.
      attachments: current.attachments,
    },
    autoName: false,
    autoCategory: false,
    showCc: true,
    showBcc: true,
  };
}

/** The attachments: a guide and a checklist, each a believable size. */
export const sampleNotificationFiles = (): File[] => [sampleFile("sample-weekly-digest-guide.pdf", 120), sampleFile("sample-review-checklist.docx", 48)];

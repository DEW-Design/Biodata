"use client";

import { useMemo } from "react";
import { Bell01 } from "@untitledui/icons";
import { useRecipientLabels } from "@/app/pages/_shared/notifications/nt-directory";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { dayAttribute, dayColumn, distinct, optionsAttribute, periodAttribute, seqColumn, stampColumns } from "@/app/pages/_shared/reports/admin-report-helpers";
import { notificationRowsFor, type NotificationRow } from "@/app/pages/_shared/reports/notification-config-report-data";
import { REPORT_WIDTH as W, emptyColumn, idColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { DataReport } from "@/app/pages/_shared/reports/report-table";

// The Notification Config Detail Report (the designer, 16 Oct 2026, Figma YMproGZfrFB5jUqPHPxMhk frame 165:14336 and its Columns panel 165:15084):
// one row per notification, every column of the wireframe in its order, in a table that scrolls sideways. BioData Admin and above only
// (`notificationManagement`, as Notification Management itself). notification-config-report-data.ts says how each column is read. Fitted into the
// shared report pattern (report-table.tsx) with these departures from the wireframe, on purpose:
//   - the wireframe's Filters card is the table's own controls (CONTRACTS 4.6 item 4): Notification ID and Notification Name are the search;
//     Workflow, Stage and Role / User are attributes of the one Filter menu, which also offers the Category, Trigger type, Template and Status the
//     columns hold, and Date is the three days a notification has (when it was created, when it was last modified, and the period a scheduled one
//     runs); the report is not run on anything, so it has no Parameters;
//   - labels are sentence case ("Subject Line" is "Subject line", "Date Time" is "Date and time").
// The first column, Seq#, is pinned when the table scrolls sideways.

const columns: ViewColumn<NotificationRow>[] = [
  seqColumn<NotificationRow>(),
  idColumn("notificationId", "Notification ID", W.md, (r) => r.notificationId),
  textColumn("name", "Notification name", W.xl, (r) => r.name, { strong: true }),
  textColumn("description", "Description", W.xl, (r) => r.description, { clamp: true }),
  textColumn("category", "Category", W.lg, (r) => r.category),
  textColumn("subject", "Subject line", W.xl, (r) => r.subject, { clamp: true }),
  textColumn("from", "From", W.md, (r) => r.from),
  textColumn("toType", "To recipient type", W.lg, (r) => r.toType),
  textColumn("to", "To recipient", W.xl, (r) => r.to, { clamp: true }),
  textColumn("cc", "CC recipient", W.xl, (r) => r.cc, { clamp: true }),
  textColumn("bcc", "BCC recipient", W.xl, (r) => r.bcc, { clamp: true }),
  textColumn("message", "Message", W.xl, (r) => r.message, { clamp: true }),
  textColumn("triggerType", "Trigger type", W.md, (r) => r.triggerType),
  textColumn("condition", "Trigger condition", W.xl, (r) => r.condition, { clamp: true }),
  textColumn("dateTime", "Date and time", W.lg, (r) => r.dateTime),
  textColumn("delay", "Delay", W.lg, (r) => r.delay),
  textColumn("frequency", "Frequency", W.md, (r) => r.frequency),
  textColumn("workflow", "Workflow", W.lg, (r) => r.workflow),
  textColumn("stage", "Stage", W.lg, (r) => r.stage, { clamp: true }),
  textColumn("template", "Template", W.md, (r) => r.template),
  textColumn("status", "Status", W.sm, (r) => r.status),
  emptyColumn("comments", "Comments", W.xl),
  dayColumn<NotificationRow>("start", "Valid from", W.md, (r) => r.start),
  dayColumn<NotificationRow>("end", "Valid until", W.md, (r) => r.end),
  ...stampColumns<NotificationRow>({ createdBy: (r) => r.createdBy, createdOn: (r) => r.created, modifiedBy: (r) => r.modifiedBy, modifiedOn: (r) => r.updated }),
];

export function NotificationConfigReport() {
  const notifications = useNotifications();
  const labelFor = useRecipientLabels();
  const rows = useMemo(() => notificationRowsFor(notifications, labelFor), [notifications, labelFor]);
  const attributes = useMemo(
    () => [
      ...optionsAttribute("workflow", "Workflow", rows, (r) => r.workflow),
      ...optionsAttribute("stage", "Stage", rows, (r) => r.stages),
      ...optionsAttribute("recipient", "Role or user", rows, (r) => r.recipients, { searchable: true }),
      ...optionsAttribute("category", "Category", rows, (r) => r.category, { searchable: true }),
      ...optionsAttribute("triggerType", "Trigger type", rows, (r) => r.triggerType),
      ...optionsAttribute("template", "Template", rows, (r) => r.template),
      ...optionsAttribute("status", "Status", rows, (r) => r.status),
      dayAttribute<NotificationRow>("created", "Created on", (r) => r.created),
      dayAttribute<NotificationRow>("modified", "Modified on", (r) => r.updated),
      periodAttribute<NotificationRow>("period", "Scheduled period", (r) => r.start, (r) => r.end),
    ],
    [rows],
  );
  return (
    <DataReport
      title="Notification Config Detail Report"
      subtitle="Every automated email BioData SA sends: what triggers it, who receives it, what it says and when it runs."
      icon={Bell01}
      rows={rows}
      rowId={(r) => r.id}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.notificationId, r.name, r.description, r.subject, r.category, r.to]}
      searchLabel="Search the report"
      searchPlaceholder="Search by notification ID, name or subject"
      tableLabel="Notifications, one row each"
      noun="notifications"
      emptyDescription="Notifications appear here once they are added in Notification Management."
      initialSort={{ column: "seq", direction: "ascending" }}
      latest={(r) => r.updated}
      facts={(inView) => [
        { label: "Active", value: inView.filter((r) => r.status === "Active").length.toLocaleString("en-AU") },
        { label: "Categories", value: distinct(inView, (r) => r.category) },
      ]}
      exportName="notification-config-detail-report"
    />
  );
}

"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { agreementStatusMeta, localIsoDate } from "@/app/pages/_shared/agreement-status";
import { AuditLog, type AuditEvent } from "@/app/pages/_shared/audit-log";

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="not-prose my-6 flex flex-col gap-3">
    <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
    <div className="font-barlow rounded-xl border border-secondary bg-secondary p-6">{children}</div>
  </div>
);

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localIsoDate(d);
};

// Placeholder people only (CONTRACTS 0.3).
const typical: AuditEvent[] = [
  { status: "draft", at: "2026-09-08", by: "Olivia Wyatt" },
  { status: "submitted", at: "2026-09-09", by: "Olivia Wyatt" },
  { status: "under_review", at: "2026-09-14", by: "Phoenix Baker" },
  { status: "approved", at: "2026-09-23", by: "Phoenix Baker" },
];

const withNoteAndSystem: AuditEvent[] = [
  { status: "draft", at: "2026-08-28", by: "Olivia Wyatt" },
  { status: "submitted", at: "2026-08-29", by: "Olivia Wyatt" },
  { status: "under_review", at: "2026-09-01", by: "Phoenix Baker" },
  { status: "on_hold", at: "2026-09-03", by: "Phoenix Baker", note: "Waiting on the signed letter of support from the requesting organisation." },
  { status: "under_review", at: "2026-09-10", by: "Phoenix Baker" },
  { status: "approved", at: "2026-09-12", by: "Phoenix Baker" },
  { status: "active", at: "2026-09-15", by: "System" },
];

const recent: AuditEvent[] = [
  { status: "draft", at: daysAgo(3), by: "Lana Steiner" },
  { status: "submitted", at: daysAgo(1), by: "Lana Steiner" },
  { status: "under_review", at: daysAgo(0), by: "Maya Dewitt" },
];

export default function AuditLogPatternPage() {
  return (
    <div className="prose-doc">
      <PageHeader
        section="Patterns"
        title="Audit log"
        description="The Audit Log tab of a record page (DLA, DSA, nominations): who moved the record to which status, and when. One sentence per move, newest first. Taken from the activity feed in Vercel's team settings."
      />

      <h2 className="text-balance">Anatomy</h2>
      <p className="text-balance">
        An audit log is an <code>AuditLog</code> (<code>app/pages/_shared/audit-log.tsx</code>) inside the record page&apos;s Audit Log tab, which is the
        last underline tab. It takes the record&apos;s events in the order they happened, the status meta of the collection (label and badge colour) and
        a noun for the empty state. Nothing else is chosen by the screen, so the three record pages read the same.
      </p>
      <ul className="text-balance">
        <li>
          <strong>One sentence per move.</strong> The person is the subject, then &quot;moved this to&quot; (&quot;created this as&quot; for a draft) and the
          status as its <code>Badge</code>. The date sits at the right: Today, Yesterday, then 23 Sep 2026. Only dates are stored, not times.
        </li>
        <li>
          <strong>Newest first,</strong> with a <strong>Current</strong> chip on the newest move.
        </li>
        <li>
          <strong>A run by the same person shares one header.</strong> The lines under it drop the name, so a person who made four moves in a row
          appears once.
        </li>
        <li>
          <strong>A note sits under its move</strong>: a rejection reason, an on-hold note.
        </li>
        <li>
          <strong>System</strong> is the clock moving a record (Approved to Active on the start date, Active to Closed the day after the end date). It
          has a bolt in place of initials.
        </li>
      </ul>

      <h2 className="text-balance">A typical trail</h2>
      <Section label="Two people, newest first">
        <AuditLog events={typical} statusMeta={agreementStatusMeta} noun="request" />
      </Section>

      <h2 className="text-balance">A note and a system move</h2>
      <Section label="On hold with a note, then Active by the clock">
        <AuditLog events={withNoteAndSystem} statusMeta={agreementStatusMeta} noun="request" />
      </Section>

      <h2 className="text-balance">Recent moves</h2>
      <Section label="Today and Yesterday">
        <AuditLog events={recent} statusMeta={agreementStatusMeta} noun="request" />
      </Section>

      <h2 className="text-balance">Empty</h2>
      <Section label="A log with no moves">
        <AuditLog events={[]} statusMeta={agreementStatusMeta} noun="request" />
      </Section>

      <h2 className="text-balance">Rules</h2>
      <ul className="text-balance">
        <li>It lists status moves only. A field edit or an added location is not an event.</li>
        <li>
          It never shows an invented step. A record saved before logs existed is rebuilt from its own dates, with the note &quot;Earlier steps were not
          recorded for this record.&quot;
        </li>
        <li>A record page reuses <code>AuditLog</code>; it does not build its own list of rows.</li>
      </ul>

      <h2 className="text-balance">Held back</h2>
      <p className="text-balance">
        The research also showed filters and export (Customer.io, Toggl, Discord), expandable rows (Discord, 7shifts), before and after values (Toggl,
        Deputy), and from and to status chips (incident.io). None is built: a record has a handful of moves, and only status is recorded. They belong to
        a cross-record audit report, if one is added.
      </p>

      <h2 className="text-balance">Figma</h2>
      <p className="text-balance">No linked Figma file yet - chosen from Mobbin research (Vercel&apos;s activity feed), not designed in Figma first.</p>
    </div>
  );
}

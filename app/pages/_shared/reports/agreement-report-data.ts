// The rows of the Data Licence Agreement Report and the Data Sharing Agreement Report (Figma YMproGZfrFB5jUqPHPxMhk node
// 2645:176998): one row per request or agreement, read from the same stores the DLA and DSA screens use, so a status moved on
// those screens is moved here. A row is never stored.
//
// What the wireframe asks for and the app holds, field by field (the departures are named in each report's header comment):
//   Seq#            the number in the ID (DLA-2026-00502 is 502), the sequence the ID itself carries;
//   Requested date  when it was submitted (a DLA) or created (a DSA);
//   Start and end   the granted period the reviewer set; empty until there is one;
//   DEW owner       who started the review (the first "Under review" move in the Audit Log);
//   DEW approver    who approved it, and Approved on is the date of that move; a move the clock made ("System") has no approver;
//   DEW comments    the newest note on a move (a rejection reason, an on-hold note), else a DLA's custom-agreement note;
//   Agreement copy  the file name of the agreement a reviewer attached.
// Drafts are left out: a draft is not yet a request or an agreement.

import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { agreementStatusMeta, type AgreementEvent, type AgreementStatus } from "@/app/pages/_shared/agreement-status";
import { requestorName, type Dla } from "@/app/pages/_shared/dla/dla-data";
import { contactName, dsaScopeOptions, type Dsa } from "@/app/pages/_shared/dsa/dsa-data";
import { hasFeatureAccess } from "@/config/role-access.config";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import type { UserRole } from "@/lib/user-role";

/** What both reports' rows carry: the columns and filters they share read these. */
export interface AgreementRowBase {
  id: string;
  seq: number;
  requestedAt: string;
  purpose: string;
  requestor: string;
  email: string;
  organisation: string;
  /** ISO days, "" until the reviewer has set a period. */
  startIso: string;
  endIso: string;
  statusLabel: string;
  statusColor: BadgeColors;
  owner: string;
  approver: string;
  approvedOn: string;
  comments: string;
  agreementCopy: string;
}

export interface DlaReportRow extends AgreementRowBase {
  dataRequested: string;
}

export interface DsaReportRow extends AgreementRowBase {
  integration: string;
}

const seqOf = (id: string) => Number(id.split("-")[2]) || 0;
const byPerson = (by: string | undefined) => (by && by !== "System" ? by : "");

function fromEvents(history: AgreementEvent[]) {
  const reviewed = history.find((e) => e.status === "under_review");
  const approved = history.find((e) => e.status === "approved");
  const note = [...history].reverse().find((e) => e.note)?.note ?? "";
  return { owner: byPerson(reviewed?.by), approver: byPerson(approved?.by), approvedOn: approved?.at ?? "", note };
}

const status = (s: AgreementStatus) => agreementStatusMeta[s];

export function dlaRow(d: Dla): DlaReportRow {
  const events = fromEvents(d.history);
  return {
    id: d.id,
    seq: seqOf(d.id),
    requestedAt: d.submittedAt,
    purpose: d.purpose,
    requestor: requestorName(d.requestor),
    email: d.requestor.email,
    organisation: d.requestor.organisation,
    startIso: d.validFrom,
    endIso: d.validTo,
    statusLabel: status(d.status).label,
    statusColor: status(d.status).badgeColor,
    owner: events.owner,
    approver: events.approver,
    approvedOn: events.approvedOn,
    comments: events.note || d.rejectionReason || d.customNote,
    agreementCopy: d.agreementFile?.name ?? "",
    dataRequested: d.locations.map((l) => `${l.name} (${l.level === "level3" ? "Level 3" : "Level 2"})`).join("; "),
  };
}

export function dsaRow(d: Dsa): DsaReportRow {
  const events = fromEvents(d.history);
  const scopeLabel = (id: string) => dsaScopeOptions.find((s) => s.id === id)?.label ?? id;
  const access = (s: Dsa["systems"][number]) => (s.canRead && s.canWrite ? "read and write" : s.canWrite ? "write" : s.canRead ? "read" : "no access");
  const systems = d.systems.map((s) => `${s.name} - ${access(s)} - ${s.scopes.map(scopeLabel).join(", ")}`).join("; ");
  return {
    id: d.id,
    seq: seqOf(d.id),
    requestedAt: d.createdAt,
    purpose: d.purpose,
    requestor: contactName(d.requestedBy),
    email: d.requestedBy.email,
    organisation: d.partner,
    startIso: d.validFrom,
    endIso: d.validTo,
    statusLabel: status(d.status).label,
    statusColor: status(d.status).badgeColor,
    owner: events.owner,
    approver: events.approver,
    approvedOn: events.approvedOn,
    comments: events.note || d.rejectionReason,
    agreementCopy: d.agreementFile?.name ?? "",
    integration: systems || (d.sharedOffline ? "Shared offline" : ""),
  };
}

// ── Who sees what ──
/** Everyone who can use DLAs sees their own requests; the roles that approve them (BioData Admin) see every one. */
export function dlaRowsFor(dlas: Dla[], role: UserRole): DlaReportRow[] {
  const sent = dlas.filter((d) => d.status !== "draft");
  const mine = hasFeatureAccess("dlaApproval", role) ? sent : sent.filter((d) => requestorName(d.requestor) === CURRENT_USER_NAME);
  return mine.map(dlaRow);
}

/** Data sharing agreements are managed by BioData Admin alone (`dsaManagement`); no other role has rows. */
export function dsaRowsFor(dsas: Dsa[], role: UserRole): DsaReportRow[] {
  return hasFeatureAccess("dsaManagement", role) ? dsas.filter((d) => d.status !== "draft").map(dsaRow) : [];
}

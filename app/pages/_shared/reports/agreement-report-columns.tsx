"use client";

import { Badge } from "@/components/base/badges/badges";
import { formatShortDate } from "@/app/pages/_shared/dsa/dsa-data";
import type { AgreementRowBase } from "@/app/pages/_shared/reports/agreement-report-data";
import { REPORT_WIDTH as W, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";

// The columns the two agreement reports share, in the wireframe's order (the Columns list on the frame: Seq#, ID, what was
// asked for or the partner, Requested date, Purpose, Requestor, Organisation, Email, Agreement start and end, Status, DEW
// owner, approver, Approved on, DEW comments, Agreement copy). Each report slots its own columns in between.
// `dateColumn` shows a day as "12 Jul 2025" and sorts by the ISO day; a day that is not set yet is left empty.

type Row = AgreementRowBase;

export function dateColumn<R>(id: string, label: string, iso: (row: R) => string, options: { sticky?: boolean } = {}): ViewColumn<R> {
  return { ...numberColumn<R>(id, label, W.md, (r) => (iso(r) ? formatShortDate(iso(r)) : ""), options), sort: (r) => iso(r) || null };
}

export function statusColumn<R extends Row>(label: string): ViewColumn<R> {
  return {
    id: "status",
    label,
    width: W.md,
    sort: (r) => r.statusLabel,
    cell: (r) => (
      <Badge size="sm" color={r.statusColor}>
        {r.statusLabel}
      </Badge>
    ),
    text: (r) => r.statusLabel,
  };
}

export const purposeColumn = <R extends Row>() => textColumn<R>("purpose", "Purpose", W.xl, (r) => r.purpose, { clamp: true });
export const requestorColumn = <R extends Row>() => textColumn<R>("requestor", "Requestor full name", W.lg, (r) => r.requestor);
export const emailColumn = <R extends Row>() => textColumn<R>("email", "Email", W.xl, (r) => r.email, { clamp: true });

/** From the agreement period to the end of the report: who owns and approved it, the comments and the file. */
export function reviewColumns<R extends Row>(): ViewColumn<R>[] {
  return [
    textColumn<R>("owner", "DEW owner", W.md, (r) => r.owner),
    textColumn<R>("approver", "DEW approver", W.md, (r) => r.approver),
    dateColumn<R>("approvedOn", "Approved on", (r) => r.approvedOn),
    textColumn<R>("comments", "DEW comments", W.xl, (r) => r.comments, { clamp: true }),
    textColumn<R>("agreementCopy", "Agreement copy", W.lg, (r) => r.agreementCopy),
  ];
}

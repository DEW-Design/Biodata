import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import type { AgreementRowBase } from "@/app/pages/_shared/reports/agreement-report-data";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";

// The filters the two agreement reports share (the wireframe's Filters card: organisation, requestor, approver, agreement
// period, and the Status chip). The ID is the search box's job, not a filter (CONTRACTS 4.2d).

export function agreementAttributes<R extends AgreementRowBase>(rows: R[], organisationLabel: string): Attribute<R>[] {
  const values = (pick: (r: R) => string) => optionsFromValues(rows.map(pick).filter(Boolean));
  const approvers = values((r) => r.approver);
  return [
    { id: "status", kind: "options", label: "Status", options: values((r) => r.statusLabel), get: (r) => r.statusLabel },
    { id: "organisation", kind: "options", label: organisationLabel, searchable: true, options: values((r) => r.organisation), get: (r) => r.organisation },
    { id: "requestor", kind: "options", label: "Requestor", searchable: true, options: values((r) => r.requestor), get: (r) => r.requestor },
    ...(approvers.length > 0 ? [{ id: "approver", kind: "options" as const, label: "DEW approver", options: approvers, get: (r: R) => r.approver }] : []),
    // The agreement period the reviewer set; a request with none yet is not in any range.
    { id: "period", kind: "date", label: "Agreement period", get: (r) => (r.startIso ? { start: Date.parse(r.startIso), end: r.endIso ? Date.parse(r.endIso) : null } : null) },
  ];
}

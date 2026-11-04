"use client";

import { useState } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Table, TableHeader, Column, TableBody, Row, Cell } from "@/components/base/table/table";
import { roleLabel } from "@/app/_prototype-tools/role-options";
import { agreementStatusMeta, agreementStatusOrder, type AgreementStatus } from "@/app/pages/_shared/agreement-status";
import { isDlaEditable } from "@/app/pages/_shared/dla/dla-data";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { hasFeatureAccess } from "@/config/role-access.config";
import { DLA_MOVES, DLA_RULES, type WorkflowMove } from "@/config/workflows/dla-workflow";
import { USER_ROLES } from "@/lib/user-role";
import { XClose, CheckCircle, AlertTriangle } from "@untitledui/icons";
import { emailsFor } from "./sandbox";
import { FlowDiagram } from "./flow-diagram";

const WHO: Record<WorkflowMove["by"], string> = {
  requester: "The requester",
  reviewer: "A reviewer",
  either: "The requester or an admin",
  system: "The clock",
};

const statusWord = (s: AgreementStatus | "approved-or-active") => (s === "approved-or-active" ? "Approved, or Active if the start date has arrived" : agreementStatusMeta[s].label);

const fromWords = (m: WorkflowMove) => m.from.map((s) => agreementStatusMeta[s].label).join(", ");

// What the page can check against the product rather than take on trust: the statuses, and where a request can be edited.
function useChecks() {
  const statuses = DLA_MOVES.flatMap((m) => [...m.from, ...(m.to && m.to !== "approved-or-active" ? [m.to] : [])]);
  const missing = agreementStatusOrder.filter((s) => !statuses.includes(s));
  const edit = DLA_MOVES.find((m) => m.id === "edit");
  const editable = agreementStatusOrder.filter(isDlaEditable);
  const sameEdit = !!edit && editable.length === edit.from.length && editable.every((s) => edit.from.includes(s));
  return [
    { ok: missing.length === 0, text: missing.length === 0 ? "Every status the product has appears in a move." : `Not in any move: ${missing.map((s) => agreementStatusMeta[s].label).join(", ")}.` },
    {
      ok: sameEdit,
      text: sameEdit
        ? "Editing is offered in the same statuses as the product's own rule (isDlaEditable)."
        : `The product allows editing in ${editable.map((s) => agreementStatusMeta[s].label).join(", ")}; this page says ${edit?.from.map((s) => agreementStatusMeta[s].label).join(", ")}.`,
    },
  ];
}

export function RulesView() {
  const [selected, setSelected] = useState<AgreementStatus | null>(null);
  const notifications = useNotifications();
  const checks = useChecks();
  const moves = selected ? DLA_MOVES.filter((m) => m.from.includes(selected) || m.to === selected || (selected === "active" && m.to === "approved-or-active")) : DLA_MOVES;
  const emailLine = (m: WorkflowMove) => {
    const targets: AgreementStatus[] = m.to === null ? [] : m.to === "approved-or-active" ? ["approved", "active"] : [m.to];
    const found = targets.flatMap((s) => emailsFor(notifications, s).map((n) => ({ n, s })));
    return found;
  };
  const manualMoves = DLA_MOVES.filter((m) => m.by !== "system");

  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-3">
        <h2 className="mt-0!">The flow</h2>
        <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
          How a data licence request moves from Draft to Closed. Press a status to see only the moves into and out of it.
        </p>
        <FlowDiagram selected={selected} onSelect={setSelected} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2>{selected ? `Moves into and out of ${agreementStatusMeta[selected].label}` : "Every move"}</h2>
          {selected && (
            <Button size="sm" color="secondary" iconLeading={XClose} onClick={() => setSelected(null)}>
              Show every move
            </Button>
          )}
        </div>
        <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
          Who can make each move, what it needs, and who is told. The BR badges are the business rules that govern it (the Business rules tab). Activity is proposed: it is not in the product yet. An email is shown only where a notification in
          Notification Management would send it.
        </p>
        <div className="overflow-x-auto rounded-lg border border-secondary bg-primary">
          <Table aria-label="Moves of a data licence request" className="min-w-[820px]">
            <TableHeader>
              <Column id="move" isRowHeader className="px-4">
                Move
              </Column>
              <Column id="status" className="px-4">
                Status
              </Column>
              <Column id="who" className="px-4">
                Who, and what it needs
              </Column>
              <Column id="activity" className="px-4">
                Activity (proposed)
              </Column>
              <Column id="email" className="px-4">
                Email
              </Column>
            </TableHeader>
            <TableBody items={moves}>
              {(m) => {
                const emails = emailLine(m);
                return (
                  <Row id={m.id} textValue={m.label}>
                    <Cell className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-primary">{m.label}</span>
                        <span className="max-w-[16rem] text-xs text-balance text-tertiary">{m.rule}</span>
                        <span className="text-xs text-quaternary">{m.code}</span>
                        <span className="flex flex-wrap items-center gap-1">
                          {DLA_RULES.filter((r) => r.governs.moves.includes(m.id)).map((r) => (
                            <Badge key={r.id} size="sm" color="gray">
                              {r.id}
                            </Badge>
                          ))}
                        </span>
                      </div>
                    </Cell>
                    <Cell className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 text-sm">
                        <span>
                          <span className="text-tertiary">From </span>
                          {fromWords(m)}
                        </span>
                        {m.to === null ? (
                          <span>{m.outcome ?? "The status stays the same"}</span>
                        ) : (
                          <span>
                            <span className="text-tertiary">To </span>
                            {statusWord(m.to)}
                          </span>
                        )}
                      </div>
                    </Cell>
                    <Cell className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 text-sm">
                        <span>{WHO[m.by]}</span>
                        <span className="text-xs text-tertiary">{m.needs ? `Needs: ${m.needs}` : "Needs nothing"}</span>
                      </div>
                    </Cell>
                    <Cell className="px-4 py-3 align-top">
                      {m.tells.length === 0 ? (
                        <span className="text-quaternary">No one</span>
                      ) : (
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                          {m.tells.map((t, i) => (
                            <li key={i} className="text-xs text-balance text-tertiary">
                              <span className="font-medium text-secondary">{t.audience === "requester" ? "The requester" : "BioData Admins"}: </span>
                              {t.activity({ id: "DLA-SANDBOX", actor: "Someone", daysLeft: 60 })}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Cell>
                    <Cell className="px-4 py-3 align-top">
                      {m.to === null ? (
                        <span className="text-quaternary">Not a status change</span>
                      ) : emails.length === 0 ? (
                        <span className="text-quaternary">No one</span>
                      ) : (
                        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                          {emails.map(({ n, s }) => (
                            <li key={n.id + s} className="text-xs text-balance text-tertiary">
                              <span className="font-medium text-secondary">{n.id}</span>, {n.name}
                              {m.to === "approved-or-active" ? ` (when it becomes ${agreementStatusMeta[s].label})` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Cell>
                  </Row>
                );
              }}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Who can make each move</h2>
        <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
          From the product&apos;s own access rules (<code>dlaAccess</code> to request, <code>dlaApproval</code> to review). A Super Admin passes every check, and a BioData Admin passes
          these.
        </p>
        <div className="overflow-x-auto rounded-lg border border-secondary bg-primary">
          <Table aria-label="Who can make each move" className="min-w-[760px]">
            <TableHeader>
              <Column id="move" isRowHeader className="px-4">
                Move
              </Column>
              {USER_ROLES.map((r) => (
                <Column key={r} id={r} className="px-3">
                  {roleLabel(r)}
                </Column>
              ))}
            </TableHeader>
            <TableBody items={manualMoves}>
              {(m) => (
                <Row id={m.id} textValue={m.label}>
                  <Cell className="px-4 py-3 font-medium whitespace-nowrap text-primary">{m.label}</Cell>
                  {USER_ROLES.map((r) => {
                    const can = m.gate ? hasFeatureAccess(m.gate, r) : false;
                    return (
                      <Cell key={r} className={can ? "px-3 py-3 text-success-primary" : "px-3 py-3 text-quaternary"}>
                        {can ? "Yes" : "No"}
                      </Cell>
                    );
                  })}
                </Row>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="m-0 max-w-3xl text-xs text-balance text-quaternary">
          A requester sees only their own requests. Only a BioData Admin sees everyone&apos;s (<code>dlaAllView</code>), and so can cancel or edit someone else&apos;s.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Checked against the product</h2>
        <p className="m-0 max-w-3xl text-sm text-balance text-tertiary">
          This page is not yet read by the product, so these are the two rules it can check against it. The rest of the moves are read from the code by eye and are not
          checked against the business&apos;s workflow sheet.
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {checks.map((c) => (
            <li key={c.text} className="flex items-start gap-2 text-sm text-secondary">
              {c.ok ? <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-success-primary" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />}
              <span className="text-balance">{c.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

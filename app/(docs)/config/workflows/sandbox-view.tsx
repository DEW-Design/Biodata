"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";
import { ScaffoldButton, ScaffoldLabel, ScaffoldTextInput, SegmentedControl } from "@/components/scaffold/controls";
import { roleLabel } from "@/app/_prototype-tools/role-options";
import { agreementStatusMeta } from "@/app/pages/_shared/agreement-status";
import { useNotifications } from "@/app/pages/_shared/notifications/nt-store";
import { USER_ROLES, type UserRole } from "@/lib/user-role";
import { RefreshCcw01 } from "@untitledui/icons";
import { GRANT_DAYS, REQUESTER_NAME, SANDBOX_ID, advance, availability, formatDate, initialState, jumpPastEnd, perform, type SandboxState } from "./sandbox";

// The sandbox: one request, walked through its life by a chosen role, with a clock. It touches nothing in the product. It shows what the
// role can do now (and, for what it cannot, why), what each person would see as Activity (proposed), which emails Notification Management
// would send, and the Audit Log the product would keep. Where a move leaves nobody told, that is what the Gaps tab is for.

type Start = "today" | "later";

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-5">
      <div className="flex flex-col gap-0.5">
        <p className="m-0 text-sm font-semibold text-primary">{title}</p>
        {note && <p className="m-0 text-xs text-balance text-tertiary">{note}</p>}
      </div>
      {children}
    </div>
  );
}

const roleOptions = USER_ROLES.map((r) => ({ key: r, label: roleLabel(r) }));

export function SandboxView() {
  const notifications = useNotifications();
  const [state, setState] = useState<SandboxState>(() => initialState());
  const [role, setRole] = useState<UserRole>("registered-user");
  const [start, setStart] = useState<Start>("today");
  const [reason, setReason] = useState("");
  const meta = agreementStatusMeta[state.status];
  const moves = availability(state, role);
  const can = moves.filter((m) => m.ok);
  const cannot = moves.filter((m) => !m.ok);
  const run = (id: string) => setState((s) => perform(s, id, role, { startsInDays: start === "later" ? 14 : 0, reason }, notifications));
  const hasInput = (id: string) => id === "approve" || id === "reject";
  const feedFor = (audience: "requester" | "reviewers") => state.feed.filter((f) => f.audience === audience);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-secondary p-5">
        <div className="flex flex-col gap-2">
          <ScaffoldLabel>Acting as</ScaffoldLabel>
          <SegmentedControl options={roleOptions} value={role} onChange={setRole} />
          <p className="m-0 text-xs text-balance text-tertiary">
            The request is {REQUESTER_NAME}&apos;s. A role with DLA access can make the requester&apos;s moves; only a BioData Admin can review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScaffoldLabel>Today is {formatDate(state.today)}</ScaffoldLabel>
          <ScaffoldButton onClick={() => setState((s) => advance(s, 1, notifications))}>1 day on</ScaffoldButton>
          <ScaffoldButton onClick={() => setState((s) => advance(s, 14, notifications))}>14 days on</ScaffoldButton>
          <ScaffoldButton onClick={() => setState((s) => advance(s, 60, notifications))}>60 days on</ScaffoldButton>
          <ScaffoldButton disabled={!state.validTo} onClick={() => setState((s) => jumpPastEnd(s, notifications))}>
            To the day after the end date
          </ScaffoldButton>
          <ScaffoldButton iconLeading={RefreshCcw01} onClick={() => setState(initialState())}>
            Start again
          </ScaffoldButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Panel title={SANDBOX_ID}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Badge type="pill-color" size="md" color={meta.badgeColor}>
                {meta.label}
              </Badge>
              <span className="text-tertiary">
                Grant period:{" "}
                <span className="text-secondary">{state.validFrom ? `${formatDate(state.validFrom)} to ${formatDate(state.validTo)}` : "Not set"}</span>
              </span>
              <span className="text-tertiary">
                Edits: <span className="tabular-nums text-secondary">{state.edits}</span>
              </span>
              <span className="text-tertiary">
                Locations added: <span className="tabular-nums text-secondary">{state.locations}</span>
              </span>
            </div>
          </Panel>

          <Panel title={`What ${roleLabel(role)} can do now`}>
            {can.length === 0 ? (
              <p className="m-0 text-sm text-tertiary">Nothing. {role === "public-user" ? "A signed-out visitor has no DLA section." : "Wait for the clock, or act as another role."}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {can.map(({ move }) => (
                  <li key={move.id} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScaffoldButton disabled={move.id === "reject" && !reason.trim()} onClick={() => run(move.id)}>
                        {move.label}
                      </ScaffoldButton>
                      {move.needs && <span className="text-xs text-tertiary">Needs: {move.needs}</span>}
                    </div>
                    {hasInput(move.id) && move.id === "approve" && (
                      <div className="flex flex-col gap-1">
                        <ScaffoldLabel>Grant period, {GRANT_DAYS} days</ScaffoldLabel>
                        <SegmentedControl
                          options={[
                            { key: "today" as const, label: "Starts today" },
                            { key: "later" as const, label: "Starts in 14 days" },
                          ]}
                          value={start}
                          onChange={setStart}
                        />
                      </div>
                    )}
                    {hasInput(move.id) && move.id === "reject" && (
                      <ScaffoldTextInput label="Reason" value={reason} onChange={setReason} />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {cannot.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-secondary pt-3">
                <p className="m-0 text-xs font-semibold text-quaternary uppercase tracking-wider">Not available</p>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {cannot.map(({ move, reason: why }) => (
                    <li key={move.id} className="text-xs text-balance text-tertiary">
                      <span className="font-medium text-secondary">{move.label}.</span> {why}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Audit Log" note="What the product keeps. It lists status moves only: an edit or a new location is not in it.">
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {[...state.history].reverse().map((e, i) => (
                <li key={`${e.status}-${e.at}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
                  <Badge type="pill-color" size="sm" color={agreementStatusMeta[e.status].badgeColor}>
                    {agreementStatusMeta[e.status].label}
                  </Badge>
                  <span>{e.by}</span>
                  <span className="text-tertiary">{formatDate(e.at)}</span>
                  {e.note && <span className="text-xs text-tertiary">{e.note}</span>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Activity" note="Proposed: the product has no Activity yet. This is what each person would see, newest first.">
            {(["requester", "reviewers"] as const).map((audience) => (
              <div key={audience} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="m-0 text-sm font-medium text-secondary">{audience === "requester" ? `${REQUESTER_NAME} sees` : "BioData Admins see"}</p>
                  <Badge size="sm" color="gray">
                    Proposed
                  </Badge>
                </div>
                {feedFor(audience).length === 0 ? (
                  <p className="m-0 text-sm text-tertiary">Nothing yet.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {[...feedFor(audience)].reverse().map((f) => (
                      <li key={f.id} className="flex flex-col rounded-lg border border-secondary bg-secondary px-3 py-2">
                        <span className="text-sm text-secondary">{f.text}</span>
                        <span className="text-xs text-tertiary">{formatDate(f.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Panel>

          <Panel title="Emails" note="Only what an active notification in Notification Management is set to send for a status change.">
            {state.emails.length === 0 ? (
              <p className="m-0 text-sm text-tertiary">No email yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {[...state.emails].reverse().map((e) => (
                  <li key={e.id} className="flex flex-col rounded-lg border border-secondary bg-secondary px-3 py-2">
                    <span className="text-sm text-secondary">{e.subject}</span>
                    <span className="text-xs text-tertiary">
                      To {e.to.toLowerCase()}, {e.notificationId}, {e.name}. {formatDate(e.at)}
                      {e.delayed ? `, ${e.delayed}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

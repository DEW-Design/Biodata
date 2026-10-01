"use client";

import { useState } from "react";
import type { Key } from "react-aria-components";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { toast } from "@/components/application/toast/toast";
import { Button } from "@/components/base/buttons/button";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { AuditLog } from "@/app/pages/_shared/audit-log";
import {
  BATCHES,
  FIELDS,
  MATCH_LABEL,
  RESULT_META,
  SOURCE_LABEL,
  decisionKey,
  sameValue,
  formatDateTime,
  readDate,
  valueText,
  type FieldKey,
  type VmBatch,
  type VmRecord,
} from "@/app/pages/_shared/vouchers/vm-data";
import { VM_OPTION_2, useVmRoot } from "@/app/pages/_shared/vouchers/vm-root";
import { IgnoreModal, PushModal, useProposal } from "@/app/pages/_shared/vouchers/vm-parts";
import { CompareTable } from "@/app/pages/_shared/vouchers/vm-compare";
import { fieldStatus, ignoreFields, pushFields, recordResult, restoreDecisions, setEdit, snapshotDecisions, useDecisions, useEdits } from "@/app/pages/_shared/vouchers/vm-store";
import { useRoleHref } from "@/lib/use-role-href";

// One record as a batch compared it (the "current records comparison"): laid out like the project page
// (CONTRACTS 4.6). Comparison is the batch's own comparison table (vm-compare.tsx) for this one record,
// with the same Your update; History is the shared audit summary, then every
// decision on this record across scans. Reached from any record in a batch, at
// /pages/vouchers/<batch>?record=<id> (one static route per batch; a batch's records are not each
// their own page in the static export).

export function VmRecordPage({ batch, record }: { batch: VmBatch; record: VmRecord }) {
  const roleHref = useRoleHref();
  const root = useVmRoot();
  const decisions = useDecisions();
  const edits = useEdits();
  const proposal = useProposal();
  const [tab, setTab] = useState<"comparison" | "history">("comparison");
  const [pushing, setPushing] = useState(false);
  const [ignoring, setIgnoring] = useState(false);

  const statusOf = (f: FieldKey) => fieldStatus(batch, record, f, decisions, edits);
  const result = recordResult(batch, record, decisions, edits);
  // BioData's name now: the scanned one, or the one it was updated to.
  const nameNow = statusOf("name").now;
  const pending = FIELDS.map((f) => f.key).filter((k) => statusOf(k).state === "pending");
  const source = SOURCE_LABEL[record.source];

  const changes = pending.flatMap((field) => {
    const value = proposal(batch, record, field);
    const from = statusOf(field).now;
    return value && value.text.trim() && !sameValue(value, from) ? [{ field, value, from }] : [];
  });
  const skipped = pending.filter((f) => !changes.some((c) => c.field === f)).map((field) => ({ record, field }));

  const ignoreRefs = pending.filter((f) => statusOf(f).differs).map((field) => ({ recordId: record.id, field }));
  const ignoreAll = (reason: string) => {
    const refs = ignoreRefs;
    const before = snapshotDecisions(batch.id, refs);
    ignoreFields(batch.id, refs, reason);
    setIgnoring(false);
    for (const ref of refs) setEdit(batch.id, ref, null);
    toast.success(`${refs.length} ${refs.length === 1 ? "difference" : "differences"} ignored`, { actionLabel: "Undo", onAction: () => restoreDecisions(before) });
  };

  // Every scan that flagged this record, and what was decided in each.
  const history = BATCHES.filter((b) => b.records.some((r) => r.id === record.id))
    .slice()
    .reverse()
    .flatMap((b) =>
      FIELDS.flatMap((f) => {
        const d = decisions[decisionKey(b.id, record.id, f.key)];
        if (!d || d.kind === "reopened") return [];
        const prior = b.records.find((r) => r.id === record.id)!;
        const what = d.kind === "pushed" ? `${f.label} updated from ${valueText(prior.bio[f.key])} to ${valueText(d.value)}` : `${f.label} difference ignored`;
        return [{ at: d.at, by: d.by, batchId: b.id, what }];
      }),
    )
    .sort((a, b) => a.at.localeCompare(b.at));
  const scans = BATCHES.filter((b) => b.records.some((r) => r.id === record.id)).map((b) => b.ranOn);
  const firstFlagged = scans.length ? scans[scans.length - 1] : undefined;
  const last = history[history.length - 1];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <RecordBackLink href={roleHref(`${root}/${batch.id}`)}>Batch {batch.id}</RecordBackLink>
        <RecordHero eyebrow={`Voucher record · ${source}`} title={record.id} subtitle={
            nameNow ? (
              <span>
                <span className="italic">{nameNow.text}</span>
                {nameNow.taxonId && nameNow.note && <span className="text-white/70"> {nameNow.note}</span>}
              </span>
            ) : (
              "Scientific name not recorded"
            )
          }>
          <HeroMeta label="Result">{RESULT_META[result].label}</HeroMeta>
          <HeroMeta label="Key match">{MATCH_LABEL[record.matchedOn]}</HeroMeta>
          <HeroMeta label="Scan batch">
            {batch.id}, ran {readDate(batch.ranOn)}
          </HeroMeta>
        </RecordHero>

        <Tabs className="flex flex-col gap-4 px-6 py-6" selectedKey={tab} onSelectionChange={(k: Key) => setTab(k as "comparison" | "history")}>
          <TabList aria-label="Record" type="underline" size="sm">
            <Tab id="comparison" label="Comparison" />
            <Tab id="history" label="History" />
          </TabList>
          <TabPanel id="comparison">
            {/* The batch's own comparison, for this one record, so it reads the same in both places. */}
            <CompareTable showMatching layout={root === VM_OPTION_2 ? "rows" : "lines"} batch={batch} records={[record]} label={`${record.id} compared with the ${source}`} />
          </TabPanel>
          <TabPanel id="history">
            <AuditLog
              id={record.id}
              idLabel="Record"
              items={[
                {
                  label: "First flagged",
                  event: firstFlagged ? { at: firstFlagged, by: "Scheduled scan" } : undefined,
                },
                { label: "Last decided", event: last },
                {
                  label: "Last scanned",
                  event: { at: batch.ranOn, by: "Scheduled scan" },
                },
              ]}
              changeCount={history.length}
            >
              <div className="rounded-lg border border-secondary">
                {history.map((h) => (
                  <div key={`${h.batchId}-${h.at}-${h.what}`} className="flex flex-col gap-1 border-b border-secondary px-4 py-3 last:border-b-0 sm:flex-row sm:gap-6">
                    <p className="m-0 shrink-0 text-sm text-secondary sm:w-44">{formatDateTime(h.at)}</p>
                    <div className="min-w-0 flex-1 text-sm text-primary">
                      {h.what}
                      <span className="text-tertiary">
                        {" "}
                        · {h.by}, batch {h.batchId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </AuditLog>
          </TabPanel>
        </Tabs>
      </div>

      {/* Push and Ignore sit in the same bottom bar as on the batch (the designer: the action must not
          move between the batch and the record). An override of CONTRACTS 4.6, which puts a record's
          actions in its identity card. */}
      {pending.length > 0 && (
        <div className="shrink-0 border-t border-secondary bg-primary">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <p className="text-sm text-tertiary">
              <span className="font-semibold text-primary">
                {pending.length} {pending.length === 1 ? "difference" : "differences"} to push
              </span>
              <span className="text-quaternary"> on this record</span>
            </p>
            <div className="flex items-center gap-3">
              <Button color="secondary" isDisabled={ignoreRefs.length === 0} onPress={() => setIgnoring(true)}>
                Ignore
              </Button>
              <Button color="primary" onPress={() => setPushing(true)}>
                Review and push
              </Button>
            </div>
          </div>
        </div>
      )}

      {ignoring && <IgnoreModal what={`${record.id}: every difference not decided yet`} count={ignoreRefs.length} onClose={() => setIgnoring(false)} onConfirm={ignoreAll} />}
      {pushing && (
        <PushModal
          groups={changes.length ? [{ record, changes }] : []}
          skipped={skipped}
          onClose={() => setPushing(false)}
          onConfirm={() => {
            pushFields(
              batch.id,
              changes.map((c) => ({
                recordId: record.id,
                field: c.field,
                value: c.value,
              })),
            );
            setPushing(false);
            toast.success(`${changes.length} ${changes.length === 1 ? "update" : "updates"} pushed to BioData`, { description: record.id });
          }}
        />
      )}
    </div>
  );
}

export function VmRecordNotFound({ batch, id }: { batch: VmBatch; id: string }) {
  const roleHref = useRoleHref();
  const root = useVmRoot();
  return (
    <div className="flex flex-1 flex-col">
      <RecordBackLink href={roleHref(`${root}/${batch.id}`)}>Batch {batch.id}</RecordBackLink>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">Record not found</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">
          Batch {batch.id} didn&apos;t compare a record with the ID {id}.
        </p>
      </div>
    </div>
  );
}

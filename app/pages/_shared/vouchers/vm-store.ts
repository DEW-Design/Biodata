"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import {
  BATCHES,
  FIELDS,
  UPDATABLE,
  SEED_DECISIONS,
  decisionKey,
  matchedRecords,
  sameValue,
  type BatchStatus,
  type Decision,
  type FieldKey,
  type FieldState,
  type FieldValue,
  type RecordResult,
  type VmBatch,
  type VmRecord,
} from "@/app/pages/_shared/vouchers/vm-data";

// What admins decided, persisted to localStorage like every collection here (there is no backend).
// The scans themselves are fixed sample data (vm-data.ts); only the decisions and the values an admin
// typed in change. The acting admin is CURRENT_USER_NAME (a placeholder person).

interface VmStoreState {
  decisions: Record<string, Decision>;
  /** A value an admin chose in place of the source's, for a difference not yet pushed. */
  edits: Record<string, FieldValue>;
}

const useVmStore = create<VmStoreState>()(
  persist(() => ({ decisions: SEED_DECISIONS, edits: {} as Record<string, FieldValue> }), {
    name: "biodata-vouchers",
    // Version 2: an ignore carries its reason. Ignores saved before reasons existed say so.
    version: 2,
    migrate: (persisted) => {
      const state = persisted as VmStoreState;
      const decisions = Object.fromEntries(Object.entries(state.decisions ?? {}).map(([k, d]) => [k, d.kind === "ignored" && !d.reason ? { ...d, reason: "No reason recorded" } : d]));
      return { decisions: { ...SEED_DECISIONS, ...decisions }, edits: state.edits ?? {} };
    },
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function useDecisions() {
  useRehydrate(useVmStore);
  return useVmStore((s) => s.decisions);
}

export function useEdits() {
  useRehydrate(useVmStore);
  return useVmStore((s) => s.edits);
}

export const useVouchersHydrated = () => useHydrated(useVmStore);

/** Local date and time, as "2026-10-01T15:42:07": decisions are shown in the admin's own time. */
const nowIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
};

export interface FieldStatus {
  state: FieldState;
  decision?: Decision;
  /** The earlier batch an ignored difference was carried from, who ignored it, when and why. */
  carriedFrom?: { batchId: string; by: string; at: string; reason: string };
  /** What BioData holds now: the scanned value, or the value it was updated to. */
  now: FieldValue | null;
  /** The scan found the source and BioData different (missing values included). */
  differs: boolean;
  /** Pending because an admin set a value BioData doesn't hold, not because the scan found a difference. */
  manual?: boolean;
}

/**
 * Where one field of one record stands in a batch. A difference ignored in an earlier batch stays
 * ignored in later ones while both values are unchanged, so an admin decides it once; it is raised
 * again as soon as either side changes, or when an admin reopens it.
 *
 * Any field can be updated, whatever the scan found (the Figma's edit icon on a matching line, and the
 * designer, 1 Oct 2026: an updated field "must still be available to be updated"): a value set in Your
 * update that BioData doesn't hold makes the field pending again, until it is pushed or cleared.
 */
export function fieldStatus(batch: VmBatch, record: VmRecord, field: FieldKey, decisions: Record<string, Decision>, edits: Record<string, FieldValue> = {}): FieldStatus {
  const differsAtAll = !sameValue(record.src[field], record.bio[field]);
  if (!UPDATABLE.has(field)) return { state: differsAtAll ? "noted" : "match", now: record.bio[field], differs: differsAtAll };
  const key = decisionKey(batch.id, record.id, field);
  const own = decisions[key];
  const now = own?.kind === "pushed" ? own.value : record.bio[field];
  const differs = differsAtAll;
  const edit = edits[key];
  if (edit && !sameValue(edit, now)) return { state: "pending", decision: own, now, differs, manual: !differs || own?.kind === "pushed" };
  if (own?.kind === "pushed") return { state: "pushed", decision: own, now, differs };
  if (!differs) return { state: "match", now, differs };
  if (own?.kind === "ignored") return { state: "ignored", decision: own, now, differs };
  if (own?.kind === "reopened") return { state: "pending", decision: own, now, differs };
  for (const earlier of BATCHES.filter((b) => b.id < batch.id)) {
    const prior = earlier.records.find((r) => r.id === record.id);
    const d = decisions[decisionKey(earlier.id, record.id, field)];
    if (prior && d?.kind === "ignored" && sameValue(prior.src[field], record.src[field]) && sameValue(prior.bio[field], record.bio[field]))
      return { state: "ignored", carriedFrom: { batchId: earlier.id, by: d.by, at: d.at, reason: d.reason }, now, differs };
  }
  return { state: "pending", now, differs };
}

export function recordResult(batch: VmBatch, record: VmRecord, decisions: Record<string, Decision>, edits: Record<string, FieldValue> = {}): RecordResult {
  const states = FIELDS.map((f) => fieldStatus(batch, record, f.key, decisions, edits).state);
  if (states.includes("pending")) return "review";
  if (states.includes("pushed")) return "updated";
  if (states.includes("ignored")) return "ignored";
  return "matched";
}

export interface BatchSummary {
  status: BatchStatus;
  /** Records with a field still to decide. */
  toReview: number;
  /** Fields whose values differ, missing ones included. */
  different: number;
  /** Of those, fields BioData has no value for. */
  missing: number;
  updated: number;
  ignored: number;
}

export function summarise(batch: VmBatch, decisions: Record<string, Decision>, edits: Record<string, FieldValue> = {}): BatchSummary {
  let toReview = 0;
  let different = 0;
  let missing = 0;
  let updated = 0;
  let ignored = 0;
  for (const r of batch.records) {
    let pending = false;
    for (const f of FIELDS) {
      const st = fieldStatus(batch, r, f.key, decisions, edits);
      const s = st.state;
      if (s === "pending") pending = true;
      if (s === "pushed") updated++;
      if (!st.differs) continue;
      different++;
      if (!r.bio[f.key]) missing++;
      if (s === "ignored") ignored++;
    }
    if (pending) toReview++;
  }
  const status: BatchStatus = toReview > 0 ? "review" : different > 0 ? "reviewed" : "clean";
  return { status, toReview, different, missing, updated, ignored };
}

export function useBatchSummaries(): Map<string, BatchSummary> {
  const decisions = useDecisions();
  const edits = useEdits();
  return useMemo(() => new Map(BATCHES.map((b) => [b.id, summarise(b, decisions, edits)])), [decisions, edits]);
}

/** Every record the batch compared: the ones with a difference first, then the ones that matched. */
export function useAllRecords(batch: VmBatch | undefined): VmRecord[] {
  return useMemo(() => (batch ? [...batch.records, ...matchedRecords(batch)] : []), [batch]);
}

// ── Writes ──

export interface FieldRef {
  recordId: string;
  field: FieldKey;
}

export function pushFields(batchId: string, items: (FieldRef & { value: FieldValue })[]) {
  const at = nowIso();
  useVmStore.setState((s) => {
    const decisions = { ...s.decisions };
    const edits = { ...s.edits };
    for (const it of items) {
      const key = decisionKey(batchId, it.recordId, it.field);
      decisions[key] = { kind: "pushed", value: it.value, by: CURRENT_USER_NAME, at };
      delete edits[key];
    }
    return { decisions, edits };
  });
}

export function ignoreFields(batchId: string, items: FieldRef[], reason: string) {
  const at = nowIso();
  useVmStore.setState((s) => {
    const decisions = { ...s.decisions };
    for (const it of items) decisions[decisionKey(batchId, it.recordId, it.field)] = { kind: "ignored", by: CURRENT_USER_NAME, at, reason };
    return { decisions };
  });
}

/** Undo: the fields go back to how they stood before (an Undo on the toast). */
export function restoreDecisions(snapshot: Record<string, Decision | undefined>) {
  useVmStore.setState((s) => {
    const decisions = { ...s.decisions };
    for (const [key, d] of Object.entries(snapshot)) {
      if (d) decisions[key] = d;
      else delete decisions[key];
    }
    return { decisions };
  });
}

export function snapshotDecisions(batchId: string, items: FieldRef[]): Record<string, Decision | undefined> {
  const { decisions } = useVmStore.getState();
  return Object.fromEntries(items.map((it) => [decisionKey(batchId, it.recordId, it.field), decisions[decisionKey(batchId, it.recordId, it.field)]]));
}

/** Put an ignored difference back to review: this batch's own ignore is removed; one carried from an earlier batch is reopened here. */
export function reopenField(batchId: string, ref: FieldRef, carried: boolean) {
  const key = decisionKey(batchId, ref.recordId, ref.field);
  useVmStore.setState((s) => {
    const decisions = { ...s.decisions };
    if (carried) decisions[key] = { kind: "reopened", by: CURRENT_USER_NAME, at: nowIso() };
    else delete decisions[key];
    return { decisions };
  });
}

export function setEdit(batchId: string, ref: FieldRef, value: FieldValue | null) {
  const key = decisionKey(batchId, ref.recordId, ref.field);
  useVmStore.setState((s) => {
    const edits = { ...s.edits };
    if (value) edits[key] = value;
    else delete edits[key];
    return { edits };
  });
}

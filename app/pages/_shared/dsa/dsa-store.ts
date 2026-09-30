"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { effectiveStatus } from "@/app/pages/_shared/agreement-status";
import { REVIEWING_ADMIN_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { nextDsaId, seedDsas, todayIso, type Dsa, type DsaDraft, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";

// The DSA list, kept in a zustand store (persisted to localStorage) so the list page, the deep
// dive and the form - separate routes - all read and write the same agreements, and a real page
// reload no longer resets them to the seed. There is still no backend in this build: this is a
// client-only persistence layer, not a server, so agreements only survive on the device/browser
// that created them. See zustand-persist.ts for the SSR-safe storage and hydration plumbing this
// store (and dla-store.ts) both share.
//
// Transitions follow the shared DSA/DLA workflow (agreement-status.ts): Save Draft -> Draft, Submit
// -> Submitted, Start Review -> Under Review, Put On Hold / Resume -> On Hold / Under Review back
// and forth, Approve -> Approved or straight to Active (if the agreement's own start date has
// already arrived), Reject -> Rejected, Cancel -> Cancelled from anywhere before Closed. Approved ->
// Active and Active -> Closed both happen automatically once a real date passes - `resolve` is
// applied at read time (`useDsas`), from today's real date, rather than baked into the persisted
// state itself, so a record correctly advances a status even after sitting in localStorage for
// days between visits.

function resolve(list: Dsa[]): Dsa[] {
  const today = todayIso();
  return list.map((d) => {
    const status = effectiveStatus(d.status, d.validFrom, d.validTo, today);
    return status === d.status ? d : { ...d, status };
  });
}

interface DsaStoreState {
  dsas: Dsa[];
}

const useDsaStore = create<DsaStoreState>()(
  persist(() => ({ dsas: seedDsas }), {
    name: "biodata-dsa",
    // Bumped when `history` (the Audit tab's log) was added to `Dsa` - a browser with agreements
    // already persisted under version 0 has records with no `history` at all, and `transition`/
    // `saveDsa`/the Audit tab's own `[...dsa.history]` all assume it's a real array. `migrate`
    // backfills an empty log rather than fabricating one (CONTRACTS 0.3 - there's no real history
    // to recover for those records, so an honest empty log, not an invented one).
    version: 1,
    migrate: (persisted) => {
      const state = persisted as { dsas: (Omit<Dsa, "history"> & { history?: Dsa["history"] })[] };
      return { dsas: state.dsas.map((d) => ({ ...d, history: d.history ?? [] })) };
    },
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** False until localStorage has been read: a deep dive waits for this before saying "not found". */
export function useDsasHydrated(): boolean {
  useRehydrate(useDsaStore);
  return useHydrated(useDsaStore);
}

function commit(next: Dsa[]) {
  useDsaStore.setState({ dsas: next });
}

/** Moves one agreement to a new status and appends the move to its own Audit Log, all in one write
 *  (the same shape nomination-store.ts's own `transition` already uses). */
function transition(id: string, status: DsaStatus, by: string, patch: Partial<Dsa> = {}, note?: string) {
  const now = todayIso();
  commit(
    useDsaStore
      .getState()
      .dsas.map((d) => (d.id === id ? { ...d, ...patch, status, updatedAt: now, history: [...d.history, { status, at: now, by, ...(note ? { note } : {}) }] } : d)),
  );
}

export function useDsas(): Dsa[] {
  useRehydrate(useDsaStore);
  const dsas = useDsaStore((s) => s.dsas);
  return useMemo(() => resolve(dsas), [dsas]);
}

export function useDsa(id: string | undefined): Dsa | undefined {
  const all = useDsas();
  return id ? all.find((d) => d.id === id) : undefined;
}

/**
 * Save Draft -> Draft. Submit -> Submitted for a new agreement or a draft being submitted for the
 * first time; an agreement that's already past Draft keeps its current status when edited (editing
 * a live agreement doesn't restart its review).
 */
export function saveDsa(draft: DsaDraft, intent: "draft" | "submit", existingId?: string): Dsa {
  const dsas = useDsaStore.getState().dsas;
  const now = todayIso();
  const existing = existingId ? dsas.find((d) => d.id === existingId) : undefined;
  const status: DsaStatus = intent === "draft" ? "draft" : existing && existing.status !== "draft" ? existing.status : "submitted";
  const changed = !existing || existing.status !== status;
  const history = [...(existing?.history ?? []), ...(changed ? [{ status, at: now, by: REVIEWING_ADMIN_NAME }] : [])];
  const record: Dsa = existing
    ? { ...existing, ...draft, status, updatedAt: now, history }
    : { ...draft, id: nextDsaId(dsas), status, createdAt: now, updatedAt: now, history };
  commit(existing ? dsas.map((d) => (d.id === record.id ? record : d)) : [...dsas, record]);
  return record;
}

/** A reviewer opening a Submitted agreement claims it for review. */
export function startDsaReview(id: string) {
  transition(id, "under_review", REVIEWING_ADMIN_NAME);
}

/** The reviewer holds the review pending information from the requester. */
export function holdDsaReview(id: string) {
  transition(id, "on_hold", REVIEWING_ADMIN_NAME);
}

export function resumeDsaReview(id: string) {
  transition(id, "under_review", REVIEWING_ADMIN_NAME);
}

/** Approve moves straight to Active if the agreement's own start date has already arrived,
 *  otherwise Approved / Auto Approved until that date - the dates are already fixed from the
 *  agreement's own form, so approving needs no further input. */
export function approveDsa(id: string) {
  const dsa = useDsaStore.getState().dsas.find((d) => d.id === id);
  const today = todayIso();
  transition(id, dsa?.validFrom && dsa.validFrom <= today ? "active" : "approved", REVIEWING_ADMIN_NAME);
}

export function rejectDsa(id: string, rejectionReason: string) {
  transition(id, "rejected", REVIEWING_ADMIN_NAME, { rejectionReason }, rejectionReason);
}

/** Cancel is available to the requester or an admin, at any point before Closed - "Revoke" was the
 *  pre-workflow term for this same action, confirmed by the business as legacy. */
export function cancelDsa(id: string) {
  transition(id, "cancelled", REVIEWING_ADMIN_NAME);
}

export function deleteDsa(id: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.filter((d) => d.id !== id));
}

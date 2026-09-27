"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { effectiveStatus } from "@/app/pages/_shared/agreement-status";
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
  const record: Dsa = existing
    ? { ...existing, ...draft, status, updatedAt: now }
    : { ...draft, id: nextDsaId(dsas), status, createdAt: now, updatedAt: now };
  commit(existing ? dsas.map((d) => (d.id === record.id ? record : d)) : [...dsas, record]);
  return record;
}

/** A reviewer opening a Submitted agreement claims it for review. */
export function startDsaReview(id: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** The reviewer holds the review pending information from the requester. */
export function holdDsaReview(id: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "on_hold", updatedAt: todayIso() } : d)));
}

export function resumeDsaReview(id: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** Approve moves straight to Active if the agreement's own start date has already arrived,
 *  otherwise Approved / Auto Approved until that date - the dates are already fixed from the
 *  agreement's own form, so approving needs no further input. */
export function approveDsa(id: string) {
  const dsas = useDsaStore.getState().dsas;
  const today = todayIso();
  commit(dsas.map((d) => (d.id === id ? { ...d, status: d.validFrom && d.validFrom <= today ? "active" : "approved", updatedAt: today } : d)));
}

export function rejectDsa(id: string, rejectionReason: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "rejected", rejectionReason, updatedAt: todayIso() } : d)));
}

/** Cancel is available to the requester or an admin, at any point before Closed - "Revoke" was the
 *  pre-workflow term for this same action, confirmed by the business as legacy. */
export function cancelDsa(id: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "cancelled", updatedAt: todayIso() } : d)));
}

export function deleteDsa(id: string) {
  const dsas = useDsaStore.getState().dsas;
  commit(dsas.filter((d) => d.id !== id));
}

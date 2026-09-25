"use client";

import { useSyncExternalStore } from "react";
import { effectiveStatus } from "@/app/pages/_shared/agreement-status";
import { nextDsaId, seedDsas, todayIso, type Dsa, type DsaDraft, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";

// The DSA list, kept in module state so the list page, the deep dive and the form - separate
// routes now - all read and write the same agreements. There is no backend in this build: a client
// navigation keeps the state, a full reload resets it to `seedDsas`. The server snapshot is always
// the seed, so a direct load hydrates cleanly.
//
// Transitions follow the shared DSA/DLA workflow (agreement-status.ts): Save Draft -> Draft, Submit
// -> Submitted, Start Review -> Under Review, Put On Hold / Resume -> On Hold / Under Review back
// and forth, Approve -> Approved or straight to Active (if the agreement's own start date has
// already arrived), Reject -> Rejected, Cancel -> Cancelled from anywhere before Closed. Approved ->
// Active and Active -> Closed both happen automatically once a real date passes - `resolve` applies
// that whenever the store actually changes (`commit`), never inside `getSnapshot` itself:
// `useSyncExternalStore` requires a referentially stable snapshot between renders when nothing has
// changed, and mapping over the array on every read would return a new reference every time,
// which is exactly the "getSnapshot should be cached" infinite-loop React warns about.

function resolve(list: Dsa[]): Dsa[] {
  const today = todayIso();
  return list.map((d) => {
    const status = effectiveStatus(d.status, d.validFrom, d.validTo, today);
    return status === d.status ? d : { ...d, status };
  });
}

let dsas: Dsa[] = seedDsas;
let resolved: Dsa[] = resolve(seedDsas);
const seedResolved: Dsa[] = resolved;
const listeners = new Set<() => void>();

function commit(next: Dsa[]) {
  dsas = next;
  resolved = resolve(dsas);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDsas(): Dsa[] {
  return useSyncExternalStore(
    subscribe,
    () => resolved,
    () => seedResolved,
  );
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
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** The reviewer holds the review pending information from the requester. */
export function holdDsaReview(id: string) {
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "on_hold", updatedAt: todayIso() } : d)));
}

export function resumeDsaReview(id: string) {
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** Approve moves straight to Active if the agreement's own start date has already arrived,
 *  otherwise Approved / Auto Approved until that date - the dates are already fixed from the
 *  agreement's own form, so approving needs no further input. */
export function approveDsa(id: string) {
  const today = todayIso();
  commit(dsas.map((d) => (d.id === id ? { ...d, status: d.validFrom && d.validFrom <= today ? "active" : "approved", updatedAt: today } : d)));
}

export function rejectDsa(id: string, rejectionReason: string) {
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "rejected", rejectionReason, updatedAt: todayIso() } : d)));
}

/** Cancel is available to the requester or an admin, at any point before Closed - "Revoke" was the
 *  pre-workflow term for this same action, confirmed by the business as legacy. */
export function cancelDsa(id: string) {
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "cancelled", updatedAt: todayIso() } : d)));
}

export function deleteDsa(id: string) {
  commit(dsas.filter((d) => d.id !== id));
}

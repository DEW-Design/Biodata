"use client";

import { useSyncExternalStore } from "react";
import { effectiveStatus } from "@/app/pages/_shared/agreement-status";
import { nextDlaId, seedDlas, todayIso, type Dla, type DlaApproveInput, type DlaDraft, type DlaLocation, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";

// The DLA list, kept in module state so the list page, the deep dive and the form - separate
// routes - all read and write the same requests. Same "no backend, a client navigation keeps
// state, a full reload resets to the seed" convention as app/pages/_shared/dsa/dsa-store.ts.
//
// Transitions follow the shared DSA/DLA workflow (agreement-status.ts): Save Draft -> Draft, Submit
// -> Submitted, Start Review -> Under Review, Put On Hold / Resume -> On Hold / Under Review back
// and forth, Approve -> Approved or straight to Active (if the chosen grant start date has already
// arrived), Reject -> Rejected, Cancel -> Cancelled from anywhere before Closed. Approved -> Active
// and Active -> Closed both happen automatically once a real date passes - `resolve` applies that
// whenever the store actually changes (`commit`), never inside `getSnapshot` itself:
// `useSyncExternalStore` requires a referentially stable snapshot between renders when nothing has
// changed, and mapping over the array on every read would return a new reference every time, which
// is exactly the "getSnapshot should be cached" infinite-loop React warns about.

function resolve(list: Dla[]): Dla[] {
  const today = todayIso();
  return list.map((d) => {
    const status = effectiveStatus(d.status, d.validFrom, d.validTo, today);
    return status === d.status ? d : { ...d, status };
  });
}

let dlas: Dla[] = seedDlas;
let resolved: Dla[] = resolve(seedDlas);
const seedResolved: Dla[] = resolved;
const listeners = new Set<() => void>();

function commit(next: Dla[]) {
  dlas = next;
  resolved = resolve(dlas);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDlas(): Dla[] {
  return useSyncExternalStore(
    subscribe,
    () => resolved,
    () => seedResolved,
  );
}

export function useDla(id: string | undefined): Dla | undefined {
  const all = useDlas();
  return id ? all.find((d) => d.id === id) : undefined;
}

/**
 * Save Draft -> Draft. Submit -> Submitted for a new request or a draft being submitted for the
 * first time; a request that's already past Draft keeps its current status when edited. Renewing a
 * closed agreement creates a new record rather than editing the old one, so the closed record's
 * own history stays intact.
 */
export function saveDla(draft: DlaDraft, intent: "draft" | "submit", existingId?: string): Dla {
  const now = todayIso();
  const existing = existingId ? dlas.find((d) => d.id === existingId) : undefined;
  const status: DlaStatus = intent === "draft" ? "draft" : existing && existing.status !== "draft" ? existing.status : "submitted";
  const record: Dla = existing
    ? { ...existing, ...draft, status, updatedAt: now }
    : { ...draft, id: nextDlaId(dlas), status, submittedAt: now, updatedAt: now };
  commit(existing ? dlas.map((d) => (d.id === record.id ? record : d)) : [...dlas, record]);
  return record;
}

/** A reviewer opening a Submitted request claims it for review. */
export function startDlaReview(id: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** The reviewer holds the review pending information from the requester. */
export function holdDlaReview(id: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "on_hold", updatedAt: todayIso() } : d)));
}

export function resumeDlaReview(id: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** Approve Request modal - sets the actual grant period (distinct from what the requester asked
 *  for), optionally attaches a signed agreement, and records the "Custom DLA" note. Moves straight
 *  to Active if the chosen start date has already arrived, otherwise Approved / Auto Approved
 *  until that date. */
export function approveDla(id: string, input: DlaApproveInput) {
  const today = todayIso();
  commit(dlas.map((d) => (d.id === id ? { ...d, ...input, status: input.validFrom && input.validFrom <= today ? "active" : "approved", updatedAt: today } : d)));
}

export function rejectDla(id: string, rejectionReason: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "rejected", rejectionReason, updatedAt: todayIso() } : d)));
}

/** Cancel is available to the requester or an admin, at any point before Closed - "Withdraw" was
 *  the pre-workflow term for this same action (see CONTEXT.md, "Unified DSA/DLA status model"). */
export function cancelDla(id: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "cancelled", updatedAt: todayIso() } : d)));
}

export function deleteDla(id: string) {
  commit(dlas.filter((d) => d.id !== id));
}

/** The deep dive's own "+ Add Location" on an active agreement - appends directly, no separate
 *  per-location approval sub-flow (a documented simplification, see CONTEXT.md). */
export function addDlaLocation(id: string, location: DlaLocation) {
  commit(dlas.map((d) => (d.id === id ? { ...d, locations: [...d.locations, location], updatedAt: todayIso() } : d)));
}

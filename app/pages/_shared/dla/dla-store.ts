"use client";

import { useSyncExternalStore } from "react";
import { nextDlaId, seedDlas, todayIso, type Dla, type DlaApproveInput, type DlaDraft, type DlaLocation } from "@/app/pages/_shared/dla/dla-data";

// The DLA list, kept in module state so the list page, the deep dive and the form - separate
// routes - all read and write the same requests. Same "no backend, a client navigation keeps
// state, a full reload resets to the seed" convention as app/pages/_shared/dsa/dsa-store.ts.

let dlas: Dla[] = seedDlas;
const listeners = new Set<() => void>();

function commit(next: Dla[]) {
  dlas = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDlas(): Dla[] {
  return useSyncExternalStore(
    subscribe,
    () => dlas,
    () => seedDlas,
  );
}

export function useDla(id: string | undefined): Dla | undefined {
  const all = useDlas();
  return id ? all.find((d) => d.id === id) : undefined;
}

/** A new request always starts Under Review - the wireframe's form has no "save draft" action, it
 *  goes straight from Review & Submit to a submitted request (see the "No draft status" note in
 *  CONTEXT.md). Renewing an expired agreement creates a new record rather than editing the old
 *  one, so the expired record's own history stays intact. */
export function submitDla(draft: DlaDraft): Dla {
  const now = todayIso();
  const record: Dla = { ...draft, id: nextDlaId(dlas), status: "under_review", submittedAt: now, updatedAt: now };
  commit([...dlas, record]);
  return record;
}

/** Approve Request modal - sets the actual grant period (distinct from what the requester asked
 *  for), optionally attaches a signed agreement, and records the "Custom DLA" note. */
export function approveDla(id: string, input: DlaApproveInput) {
  commit(dlas.map((d) => (d.id === id ? { ...d, ...input, status: "active", updatedAt: todayIso() } : d)));
}

export function rejectDla(id: string, rejectionReason: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "rejected", rejectionReason, updatedAt: todayIso() } : d)));
}

/** Withdraw is the one action both a requester (their own pending/active request) and an admin
 *  (anyone's active agreement) can take - see CONTEXT.md for why this isn't split into two
 *  differently-labelled actions. */
export function withdrawDla(id: string) {
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "withdrawn", updatedAt: todayIso() } : d)));
}

/** The deep dive's own "+ Add Location" on an active agreement - appends directly, no separate
 *  per-location approval sub-flow (a documented simplification, see CONTEXT.md). */
export function addDlaLocation(id: string, location: DlaLocation) {
  commit(dlas.map((d) => (d.id === id ? { ...d, locations: [...d.locations, location], updatedAt: todayIso() } : d)));
}

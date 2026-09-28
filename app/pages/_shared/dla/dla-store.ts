"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { effectiveStatus } from "@/app/pages/_shared/agreement-status";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { nextDlaId, seedDlas, todayIso, type Dla, type DlaApproveInput, type DlaDraft, type DlaLocation, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";

// The DLA list, kept in a zustand store (persisted to localStorage) so the list page, the deep
// dive and the form - separate routes - all read and write the same requests, and a real page
// reload no longer resets them to the seed. Same "client-only persistence, no real backend"
// convention as app/pages/_shared/dsa/dsa-store.ts - see that file and zustand-persist.ts for the
// full reasoning behind the shared SSR-safe storage and hydration plumbing.
//
// Transitions follow the shared DSA/DLA workflow (agreement-status.ts): Save Draft -> Draft, Submit
// -> Submitted, Start Review -> Under Review, Put On Hold / Resume -> On Hold / Under Review back
// and forth, Approve -> Approved or straight to Active (if the chosen grant start date has already
// arrived), Reject -> Rejected, Cancel -> Cancelled from anywhere before Closed. Approved -> Active
// and Active -> Closed both happen automatically once a real date passes - `resolve` is applied at
// read time (`useDlas`), from today's real date, so a record correctly advances a status even after
// sitting in localStorage for days between visits.

function resolve(list: Dla[]): Dla[] {
  const today = todayIso();
  return list.map((d) => {
    const status = effectiveStatus(d.status, d.validFrom, d.validTo, today);
    return status === d.status ? d : { ...d, status };
  });
}

interface DlaStoreState {
  dlas: Dla[];
}

const useDlaStore = create<DlaStoreState>()(
  persist(() => ({ dlas: seedDlas }), {
    name: "biodata-dla",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** False until localStorage has been read: a deep dive waits for this before saying "not found". */
export function useDlasHydrated(): boolean {
  useRehydrate(useDlaStore);
  return useHydrated(useDlaStore);
}

function commit(next: Dla[]) {
  useDlaStore.setState({ dlas: next });
}

export function useDlas(): Dla[] {
  useRehydrate(useDlaStore);
  const dlas = useDlaStore((s) => s.dlas);
  return useMemo(() => resolve(dlas), [dlas]);
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
  const dlas = useDlaStore.getState().dlas;
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
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** The reviewer holds the review pending information from the requester. */
export function holdDlaReview(id: string) {
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "on_hold", updatedAt: todayIso() } : d)));
}

export function resumeDlaReview(id: string) {
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "under_review", updatedAt: todayIso() } : d)));
}

/** Approve Request modal - sets the actual grant period (distinct from what the requester asked
 *  for), optionally attaches a signed agreement, and records the "Custom DLA" note. Moves straight
 *  to Active if the chosen start date has already arrived, otherwise Approved / Auto Approved
 *  until that date. */
export function approveDla(id: string, input: DlaApproveInput) {
  const dlas = useDlaStore.getState().dlas;
  const today = todayIso();
  commit(dlas.map((d) => (d.id === id ? { ...d, ...input, status: input.validFrom && input.validFrom <= today ? "active" : "approved", updatedAt: today } : d)));
}

export function rejectDla(id: string, rejectionReason: string) {
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "rejected", rejectionReason, updatedAt: todayIso() } : d)));
}

/** Cancel is available to the requester or an admin, at any point before Closed - "Withdraw" was
 *  the pre-workflow term for this same action (see context/decisions/2026-09-24-04-unified-dsa-dla-status-model-rolled-straight-into.md, "Unified DSA/DLA status model"). */
export function cancelDla(id: string) {
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.map((d) => (d.id === id ? { ...d, status: "cancelled", updatedAt: todayIso() } : d)));
}

export function deleteDla(id: string) {
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.filter((d) => d.id !== id));
}

/** The deep dive's own "+ Add Location" on an active agreement - appends directly, no separate
 *  per-location approval sub-flow (a documented simplification, see context/decisions/2026-09-23-03-data-licencing-agreement-dla-workflow-built-at-pages.md). */
export function addDlaLocation(id: string, location: DlaLocation) {
  const dlas = useDlaStore.getState().dlas;
  commit(dlas.map((d) => (d.id === id ? { ...d, locations: [...d.locations, location], updatedAt: todayIso() } : d)));
}

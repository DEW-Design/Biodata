"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { autoTransitions, rebuildHistory } from "@/app/pages/_shared/agreement-status";
import { CURRENT_USER_NAME, REVIEWING_ADMIN_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import {
  nextDlaId,
  requestorName,
  seedDlas,
  todayIso,
  type Dla,
  type DlaApproveInput,
  type DlaDraft,
  type DlaLocation,
  type DlaRequestor,
  type DlaStatus,
} from "@/app/pages/_shared/dla/dla-data";

/** The requester's own name, falling back to the placeholder signed-in user when a draft hasn't
 *  had a name entered yet (a draft only requires the organisation, see `validateDla`). */
function actorName(r: DlaRequestor): string {
  return requestorName(r) || CURRENT_USER_NAME;
}

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
    const system = autoTransitions(d.status, d.validFrom, d.validTo, today);
    return system.length ? { ...d, status: system[system.length - 1].status, history: [...d.history, ...system] } : d;
  });
}

interface DlaStoreState {
  dlas: Dla[];
}

const useDlaStore = create<DlaStoreState>()(
  persist(() => ({ dlas: seedDlas }), {
    name: "biodata-dla",
    // Version 1 added `history` (the Audit Log tab). A browser holding requests saved before that has
    // records with no `history`, which migrate backfilled with an empty log: a blank Audit Log tab.
    // Version 2 rebuilds those logs from what each record does know (`rebuildHistory`), never from a guess.
    version: 2,
    migrate: (persisted) => {
      const state = persisted as { dlas: (Omit<Dla, "history"> & { history?: Dla["history"] })[] };
      return {
        dlas: state.dlas.map((d) => ({
          ...d,
          history: d.history?.length
            ? d.history
            : rebuildHistory({
                status: d.status,
                submittedAt: d.submittedAt,
                updatedAt: d.updatedAt,
                creator: actorName(d.requestor),
                reviewer: REVIEWING_ADMIN_NAME,
                canceller: actorName(d.requestor),
                seed: seedDlas.find((x) => x.id === d.id)?.history,
              }),
        })),
      };
    },
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

/** Moves one request to a new status and appends the move to its own Audit Log, all in one write
 *  (the same shape dsa-store.ts's own `transition` and nomination-store.ts's both already use). */
function transition(id: string, status: DlaStatus, by: string, patch: Partial<Dla> = {}, note?: string) {
  const now = todayIso();
  // Start from the resolved record, so a move the clock already made (Approved to Active) is in the log before this one.
  commit(
    useDlaStore
      .getState()
      .dlas.map((d) => {
        if (d.id !== id) return d;
        const base = resolve([d])[0];
        return { ...base, ...patch, status, updatedAt: now, history: [...base.history, { status, at: now, by, ...(note ? { note } : {}) }] };
      }),
  );
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
  const existing = existingId ? resolve(dlas).find((d) => d.id === existingId) : undefined;
  const status: DlaStatus = intent === "draft" ? "draft" : existing && existing.status !== "draft" ? existing.status : "submitted";
  const changed = !existing || existing.status !== status;
  const history = [...(existing?.history ?? []), ...(changed ? [{ status, at: now, by: actorName(draft.requestor) }] : [])];
  const record: Dla = existing
    ? { ...existing, ...draft, status, updatedAt: now, history }
    : { ...draft, id: nextDlaId(dlas), status, submittedAt: now, updatedAt: now, history };
  commit(existing ? dlas.map((d) => (d.id === record.id ? record : d)) : [...dlas, record]);
  return record;
}

/** A reviewer opening a Submitted request claims it for review. */
export function startDlaReview(id: string) {
  transition(id, "under_review", REVIEWING_ADMIN_NAME);
}

/** The reviewer holds the review pending information from the requester. */
export function holdDlaReview(id: string) {
  transition(id, "on_hold", REVIEWING_ADMIN_NAME);
}

export function resumeDlaReview(id: string) {
  transition(id, "under_review", REVIEWING_ADMIN_NAME);
}

/** Approve Request modal - sets the actual grant period (distinct from what the requester asked
 *  for), optionally attaches a signed agreement, and records the "Custom DLA" note. Moves straight
 *  to Active if the chosen start date has already arrived, otherwise Approved / Auto Approved
 *  until that date. */
export function approveDla(id: string, input: DlaApproveInput) {
  const today = todayIso();
  transition(id, input.validFrom && input.validFrom <= today ? "active" : "approved", REVIEWING_ADMIN_NAME, input);
}

export function rejectDla(id: string, rejectionReason: string) {
  transition(id, "rejected", REVIEWING_ADMIN_NAME, { rejectionReason }, rejectionReason);
}

/** Cancel is available to the requester or an admin, at any point before Closed - "Withdraw" was
 *  the pre-workflow term for this same action (see context/decisions/2026-09-24-04-unified-dsa-dla-status-model-rolled-straight-into.md, "Unified DSA/DLA status model").
 *  Attributed to the requester - who exactly clicked it (them, or an admin on their behalf) isn't
 *  tracked separately, the same "who did it is an audit detail, not a separate status" call
 *  dsa-store.ts's own `cancelDsa` already makes. */
export function cancelDla(id: string) {
  const dla = useDlaStore.getState().dlas.find((d) => d.id === id);
  transition(id, "cancelled", dla ? actorName(dla.requestor) : REVIEWING_ADMIN_NAME);
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

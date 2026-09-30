"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { REVIEW_PANEL, nextNominationId, seedNominations, todayIso, type Nomination, type NominationDraft, type NominationStatus } from "@/app/pages/_shared/nominations/nomination-data";

// Nominations in a zustand store persisted to localStorage, so the list, the record page and the
// form (separate routes) read the same records and a reload keeps them. Same client-only
// persistence as the DSA and DLA stores (see zustand-persist.ts).
//
// Workflow: Save draft -> Draft. Submit -> Submitted. The panel starts a review -> Under Review, then
// Accepts, Rejects (with a reason) or Returns it for more information (with a note). A returned
// nomination is edited by the nominator and resubmitted -> Submitted again.

interface NominationStoreState {
  nominations: Nomination[];
}

const useNominationStore = create<NominationStoreState>()(
  persist(() => ({ nominations: seedNominations }), {
    name: "biodata-nominations",
    // Same `history` backfill as dsa-store.ts/dla-store.ts - bumped when `history` was added to
    // `Nomination`, so a browser with nominations already persisted under version 0 gets an honest
    // empty log instead of `transition`/`saveNomination`/the record page's own `[...n.history]`
    // crashing on `undefined` (CONTRACTS 0.3 - no fabricated history for those records).
    version: 1,
    migrate: (persisted) => {
      const state = persisted as { nominations: (Omit<Nomination, "history"> & { history?: Nomination["history"] })[] };
      return { nominations: state.nominations.map((n) => ({ ...n, history: n.history ?? [] })) };
    },
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function useNominationsHydrated(): boolean {
  useRehydrate(useNominationStore);
  return useHydrated(useNominationStore);
}

export function useNominations(): Nomination[] {
  useRehydrate(useNominationStore);
  return useNominationStore((s) => s.nominations);
}

export function useNomination(id: string | undefined): Nomination | undefined {
  const all = useNominations();
  return id ? all.find((n) => n.id === id) : undefined;
}

function commit(next: Nomination[]) {
  useNominationStore.setState({ nominations: next });
}

function transition(id: string, status: NominationStatus, by: string, note?: string, patch: Partial<Nomination> = {}) {
  const now = todayIso();
  commit(
    useNominationStore.getState().nominations.map((n) =>
      n.id === id ? { ...n, ...patch, status, updatedAt: now, history: [...n.history, { status, at: now, by, ...(note ? { note } : {}) }] } : n,
    ),
  );
}

/**
 * Save draft keeps (or makes) a Draft. Submit sends a draft, or a nomination returned for more
 * information, to Submitted; editing an already-submitted nomination keeps its status.
 */
export function saveNomination(draft: NominationDraft, intent: "draft" | "submit", existingId?: string): Nomination {
  const all = useNominationStore.getState().nominations;
  const now = todayIso();
  const existing = existingId ? all.find((n) => n.id === existingId) : undefined;
  const status: NominationStatus =
    intent === "draft" ? "draft" : !existing || existing.status === "draft" || existing.status === "returned" ? "submitted" : existing.status;
  const changed = !existing || existing.status !== status;
  const history = [...(existing?.history ?? []), ...(changed ? [{ status, at: now, by: CURRENT_USER_NAME }] : [])];
  const record: Nomination = existing
    ? { ...existing, ...draft, status, updatedAt: now, history }
    : {
        ...draft,
        id: nextNominationId(all),
        nominator: { name: CURRENT_USER_NAME, organisation: "", email: "olivia.wyatt@example.org" },
        status,
        createdAt: now,
        updatedAt: now,
        history,
      };
  commit(existing ? all.map((n) => (n.id === record.id ? record : n)) : [...all, record]);
  return record;
}

export function startNominationReview(id: string) {
  transition(id, "under_review", REVIEW_PANEL);
}

export function acceptNomination(id: string, note?: string) {
  transition(id, "accepted", REVIEW_PANEL, note, { decisionNote: note });
}

export function rejectNomination(id: string, reason: string) {
  transition(id, "rejected", REVIEW_PANEL, reason, { decisionNote: reason });
}

export function returnNomination(id: string, note: string) {
  transition(id, "returned", REVIEW_PANEL, note, { decisionNote: note });
}

export function deleteNomination(id: string) {
  commit(useNominationStore.getState().nominations.filter((n) => n.id !== id));
}

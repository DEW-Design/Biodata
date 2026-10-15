"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { ratingsPerArea, type Rating } from "@/app/pages/_shared/nominations/nomination-rating";
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
    // 2: the seeded accepted nominations carry their ratings. 3: location nominations (version 2): an earlier, reverted preview
    // of them is dropped and the seeded ones are added. 4: more seeded location nominations (NSS-2026-00010 to 00013); a
    // nomination made in this browser that already took one of those IDs keeps everything but its ID, which moves to the next
    // free one. 5: NSS-2026-00014, a twelve-attribute nomination for stress-testing what a nomination protects. 6: a Location is
    // rated per area: a rating kept under a Location attribute's id moves to each of its areas (`ratingsPerArea`).
    version: 6,
    migrate: (persisted, from) => {
      const state = persisted as { nominations: (Omit<Nomination, "history"> & { history?: Nomination["history"] })[] };
      const seedRatings = (id: string) => seedNominations.find((s) => s.id === id)?.ratings;
      let kept: Nomination[] = state.nominations.map((n) => ratingsPerArea({ ...n, history: n.history ?? [], ratings: n.ratings ?? seedRatings(n.id) }));
      if (from < 3) kept = kept.filter((n) => n.kind !== "location");
      const seededIds = new Set(seedNominations.map((s) => s.id));
      const isSeed = (n: Nomination) => seedNominations.some((s) => s.id === n.id && s.createdAt === n.createdAt && s.nominator.name === n.nominator.name);
      // A record of this browser's on a seeded ID moves to the next free ID, counted past the seeds.
      let next = Math.max(0, ...[...kept, ...seedNominations].map((n) => Number(n.id.split("-")[2]) || 0)) + 1;
      kept = kept.map((n) => (seededIds.has(n.id) && !isSeed(n) ? { ...n, id: `NSS-${n.id.split("-")[1]}-${String(next++).padStart(5, "0")}` } : n));
      const held = new Set(kept.map((n) => n.id));
      const added = (s: Nomination) => (s.kind === "location" || (from < 5 && s.id === "NSS-2026-00014")) && !held.has(s.id);
      return { nominations: [...kept, ...seedNominations.filter(added)] };
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

/**
 * Version 2: a BioData Admin or Super Admin who nominates can approve it at once (the designer, 12 Oct 2026). It is saved as
 * submitted, carries the ratings the Super Admin set (none for a BioData Admin), and is accepted by them.
 */
export function approveNomination(draft: NominationDraft, ratings: Record<string, Rating>, existingId?: string): Nomination {
  const saved = saveNomination(draft, "submit", existingId);
  const now = todayIso();
  const accepted: Nomination = {
    ...saved,
    ...(Object.keys(ratings).length ? { ratings } : {}),
    status: "accepted",
    updatedAt: now,
    history: [...saved.history, { status: "accepted", at: now, by: CURRENT_USER_NAME }],
  };
  commit(useNominationStore.getState().nominations.map((n) => (n.id === accepted.id ? accepted : n)));
  return accepted;
}

/**
 * Version 2: a BioData Admin or Super Admin edits a nomination past its draft (the designer, 12 Oct 2026). Its status stays as it
 * is, so the audit log (status moves only) gains nothing; the ratings are the Super Admin's (a BioData Admin's edit keeps them).
 */
export function updateNomination(id: string, draft: NominationDraft, ratings?: Record<string, Rating>) {
  const now = todayIso();
  commit(useNominationStore.getState().nominations.map((n) => (n.id === id ? { ...n, ...draft, ...(ratings ? { ratings } : {}), updatedAt: now } : n)));
}

export function startNominationReview(id: string) {
  transition(id, "under_review", REVIEW_PANEL);
}

/** Version 2: the Super Admin's rating for one thing the nomination protects, kept on the nomination while it is reviewed. */
export function setNominationRating(id: string, key: string, rating: Rating) {
  commit(useNominationStore.getState().nominations.map((n) => (n.id === id ? { ...n, ratings: { ...n.ratings, [key]: rating } } : n)));
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

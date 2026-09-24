"use client";

import { useSyncExternalStore } from "react";
import { nextDsaId, seedDsas, todayIso, type Dsa, type DsaDraft, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";

// The DSA list, kept in module state so the list page, the deep dive and the form - separate
// routes now - all read and write the same agreements. There is no backend in this build: a client
// navigation keeps the state, a full reload resets it to `seedDsas`. The server snapshot is always
// the seed, so a direct load hydrates cleanly.

let dsas: Dsa[] = seedDsas;
const listeners = new Set<() => void>();

function commit(next: Dsa[]) {
  dsas = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDsas(): Dsa[] {
  return useSyncExternalStore(
    subscribe,
    () => dsas,
    () => seedDsas,
  );
}

export function useDsa(id: string | undefined): Dsa | undefined {
  const all = useDsas();
  return id ? all.find((d) => d.id === id) : undefined;
}

/**
 * Save Draft -> Draft. Submit -> Active for a new agreement or a draft being submitted; an
 * agreement that is already live keeps its status when edited. The lo-fi doesn't define an approval
 * step, so none is invented: an admin submitting an agreement makes it Active.
 */
export function saveDsa(draft: DsaDraft, intent: "draft" | "submit", existingId?: string): Dsa {
  const now = todayIso();
  const existing = existingId ? dsas.find((d) => d.id === existingId) : undefined;
  const status: DsaStatus = intent === "draft" ? "draft" : existing && existing.status !== "draft" ? existing.status : "active";
  const record: Dsa = existing
    ? { ...existing, ...draft, status, updatedAt: now }
    : { ...draft, id: nextDsaId(dsas), status, createdAt: now, updatedAt: now };
  commit(existing ? dsas.map((d) => (d.id === record.id ? record : d)) : [...dsas, record]);
  return record;
}

export function revokeDsa(id: string) {
  commit(dsas.map((d) => (d.id === id ? { ...d, status: "revoked", updatedAt: todayIso() } : d)));
}

export function deleteDsa(id: string) {
  commit(dsas.filter((d) => d.id !== id));
}

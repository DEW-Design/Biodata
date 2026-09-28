"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createJSONStorage, type PersistStorage, type StateStorage } from "zustand/middleware";

// Shared plumbing for every zustand `persist` store in this build (DSA, DLA, the Explore Species
// filters): a localStorage-backed store that survives a real page reload, instead of the earlier
// "no backend, a full reload resets to the seed" convention documented on dsa-store.ts/dla-store.ts.
//
// Two things every one of those stores needs, so they live here once instead of three times:
//
// 1. `browserStorage()` - a real `localStorage` on the client, a no-op on the server. This build
//    does a GitHub Pages static export (`next build`, `output: "export"`), so every "use client"
//    page under app/pages/** is still rendered once in Node to produce its static HTML - and
//    `localStorage` isn't a global there at all (not just empty, undefined as an identifier), so
//    a bare `createJSONStorage(() => localStorage)` would throw and fail that build.
// 2. `useRehydrate()` - every store below is created with `skipHydration: true`, so its very first
//    client render matches the seed data the server already rendered, then this hook fires the
//    real `persist.rehydrate()` once, in a `useEffect`, after that first render has already
//    committed. Rehydrating synchronously at store-creation time instead would mean the client's
//    first paint shows whatever's in localStorage while the server-rendered HTML shows the seed -
//    a real React hydration mismatch (visible content, not just a warning) the moment a DSA/DLA
//    record or a saved Explore filter differs from the seed.

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export function browserStorage(): StateStorage {
  return typeof window === "undefined" ? noopStorage : window.localStorage;
}

export function useRehydrate(store: { persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean } }) {
  useEffect(() => {
    if (!store.persist.hasHydrated()) store.persist.rehydrate();
  }, [store]);
}

type HydratingStore = { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };

/**
 * Whether the store has read localStorage yet. Before that it holds only the seed, so a record
 * created in this browser looks missing for one frame: a deep dive must wait for this before it
 * says "not found", or it flashes "not found" and then the record. False on the server.
 */
export function useHydrated(store: HydratingStore): boolean {
  return useSyncExternalStore(
    (onChange) => store.persist.onFinishHydration(onChange),
    () => store.persist.hasHydrated(),
    () => false,
  );
}

const SET_TAG = "__set" as const;

/** A `createJSONStorage` for state that holds real `Set` instances (the Explore Species filters:
 *  `selectedFamilies`/`selectedSpecies`/etc.) - `JSON.stringify(new Set(["a"]))` is `"{}"`, so a
 *  bare `createJSONStorage` would silently persist every Set as empty. The replacer/reviver pair
 *  tags a Set as `{ __set: [...values] }` on the way out and rebuilds the real `Set` on the way
 *  back in, so the rest of the store (and every component reading it) can keep using `Set` exactly
 *  as it already does - `toggleInSet`, `.has()`, `.size` - with no change to that code. */
export function setAwareJsonStorage<T>(): PersistStorage<T> | undefined {
  return createJSONStorage<T>(browserStorage, {
    replacer: (_key, value) => (value instanceof Set ? { [SET_TAG]: [...value] } : value),
    reviver: (_key, value) =>
      value && typeof value === "object" && Array.isArray((value as Record<string, unknown>)[SET_TAG])
        ? new Set((value as Record<string, unknown[]>)[SET_TAG])
        : value,
  });
}

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { todayIso } from "@/app/pages/_shared/nominations/nomination-data";
import { DEFAULT_RATING, seedRatingChanges, type RatingChange, type SpeciesRating } from "@/app/pages/_shared/nominations/species-sensitivity";

// Species sensitivity changes in a zustand store persisted to localStorage, like the nominations store, so the list and a
// species' page read the same ratings and a reload keeps them. Only changes are kept, newest last: a species with none is at
// the default (Negligible, Level 1), which is what nearly all of BioData's 15,000 species would be. The changes are the
// species' audit log.

interface SensitivityStoreState {
  changes: RatingChange[];
}

const useSensitivityStore = create<SensitivityStoreState>()(
  persist(() => ({ changes: seedRatingChanges }), {
    name: "biodata-species-sensitivity",
    // 1: a rating covers the whole species or some attributes (version 0 stored a bare risk and level). 2: each attribute
    // carries its value (areas for Location). Earlier versions are replaced by the seeds: they were preview data.
    version: 2,
    migrate: () => ({ changes: seedRatingChanges }),
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function useSensitivityHydrated(): boolean {
  useRehydrate(useSensitivityStore);
  return useHydrated(useSensitivityStore);
}

export function useRatingChanges(): RatingChange[] {
  useRehydrate(useSensitivityStore);
  return useSensitivityStore((s) => s.changes);
}

/** Each species' latest change, by species id. A species not in the map is at the default. */
export function latestChanges(changes: RatingChange[]): Map<string, RatingChange> {
  const latest = new Map<string, RatingChange>();
  for (const c of changes) latest.set(c.speciesId, c);
  return latest;
}

export function ratingOf(latest: Map<string, RatingChange>, speciesId: string): SpeciesRating {
  return latest.get(speciesId)?.rating ?? DEFAULT_RATING;
}

export function saveSpeciesRating(speciesId: string, rating: SpeciesRating) {
  const change: RatingChange = { speciesId, rating, at: todayIso(), by: CURRENT_USER_NAME };
  useSensitivityStore.setState({ changes: [...useSensitivityStore.getState().changes, change] });
}

/** Bulk change: the same rating for each species, whole or by attribute. Replaces the rating each one had. */
export function saveBulkRating(speciesIds: string[], rating: SpeciesRating) {
  const at = todayIso();
  const added = speciesIds.map((speciesId) => ({ speciesId, rating, at, by: CURRENT_USER_NAME, note: `Bulk change of ${speciesIds.length} species` }));
  useSensitivityStore.setState({ changes: [...useSensitivityStore.getState().changes, ...added] });
}

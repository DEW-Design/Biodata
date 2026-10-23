"use client";

import type { Selection } from "react-aria-components";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAwareJsonStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import type { Boundary } from "./geo";
import type { ShapefileLayer } from "./shapefile";

// Explore's search (the areas, the keyword and which tab is open), saved to localStorage so a
// reload and "Back to results" from a record page land on the same search. The page keeps its own
// React state and writes it here whenever it changes; this store is only read once, when the page
// opens (see observations-search.tsx). A header search (`?q=`) always starts a new search:
// what is saved is only restored when the page opens with no term, or with the term it was saved
// under (`query`). "Clear all" empties the areas; the keyword and tab stay until changed.
//
// Transient state is not saved: an open "Add area" flow, the active draw tool, half-typed
// coordinates, hover, the artefact viewer. The Species view's own filters have their own store
// (species-filter-store.ts).

export interface ExploreSearch {
  /** The header-search term this was saved under, or null. */
  query: string | null;
  manualBoundaries: Boundary[];
  selectedParkIds: Selection;
  parkRadius: number;
  shapefileLayers: ShapefileLayer[];
  shapefileRadius: number;
  keyword: string;
  layerNames: Record<string, string>;
  layerCounters: Record<string, number>;
  entityTab: string;
}

interface ExploreSearchState {
  saved: ExploreSearch | null;
}

const useExploreSearchStore = create<ExploreSearchState>()(
  persist(() => ({ saved: null }) as ExploreSearchState, {
    name: "biodata-explore-search",
    version: 1,
    storage: setAwareJsonStorage<ExploreSearchState>(),
    skipHydration: true,
  }),
);

/** Loads the saved search, and reports once it has been read (the page waits for this, so it
 *  never opens on an empty search and then jumps to the saved one). */
export function useExploreSearchHydrated(): boolean {
  useRehydrate(useExploreSearchStore);
  return useHydrated(useExploreSearchStore);
}

/** The saved search, or null. Read once when the page opens. */
export function readExploreSearch(): ExploreSearch | null {
  return useExploreSearchStore.getState().saved;
}

export function saveExploreSearch(search: ExploreSearch) {
  useExploreSearchStore.setState({ saved: search });
}

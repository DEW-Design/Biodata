"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAwareJsonStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import type { LicenceLevel } from "./search-data";

// Explore's Species view (species-results.tsx) filter selections - Family/Genus/Species/
// Information Authority/Licence - persisted to localStorage via zustand so re-opening Explore
// keeps the taxonomy you were narrowing to, per direct request to bring zustand persistence to
// "DLA/DSA, Map search for species".
//
// Deliberately scoped to just these 5 facets, not the whole of species-results.tsx's local state:
// - `dateFilterOn`/`dateRange` stay local. A `DateRange`'s `start`/`end` are real `CalendarDate`
//   instances (methods like `.compare()`/`.add()`, not just plain data) - round-tripping them
//   through JSON and rebuilding real instances on read is a second, separate problem from the
//   plain-string Sets below, and this feature doesn't need it to be useful.
// - The search areas themselves (drawn shapes, park picks, uploaded shapefiles -
//   `manualBoundaries`/`selectedParkIds`/`shapefileLayers` in observations-search.tsx) are NOT
//   persisted here either, on purpose. That state is tightly wound around this page's own
//   `?q=`-from-the-header-search reset logic (see that file's "A new `?q=` ... replaces the
//   current search" block) and Leaflet's own map lifecycle - after 25+ rounds of hard-won fixes to
//   that exact file (see CONTEXT.md), reworking it to rehydrate from localStorage on top of that
//   existing render-time reset logic is real, separate work, not a drop-in. Without it, a filter
//   restored here has nothing to apply to until the user re-runs a search - an honest limitation,
//   not a bug, until that follow-up is asked for.
// - `activeGroup`/`tableSearch`/`panelOpen`/`openSections`/`familySearch`/`speciesSearch` are
//   transient UI state (which tile is active, what's mid-typing, whether a panel happens to be
//   open) - the same "persist the real selections, not incidental UI state" call dsa-store.ts and
//   dla-store.ts already make by only persisting the agreements themselves.

interface SpeciesFilterState {
  selectedFamilies: Set<string>;
  selectedGenera: Set<string>;
  selectedSpecies: Set<string>;
  selectedAuthorities: Set<string>;
  selectedLicences: Set<LicenceLevel>;
}

function emptyFilters(): SpeciesFilterState {
  return {
    selectedFamilies: new Set(),
    selectedGenera: new Set(),
    selectedSpecies: new Set(),
    selectedAuthorities: new Set(),
    selectedLicences: new Set(),
  };
}

const useSpeciesFilterStore = create<SpeciesFilterState>()(
  persist(() => emptyFilters(), {
    name: "biodata-explore-species-filters",
    storage: setAwareJsonStorage<SpeciesFilterState>(),
    skipHydration: true,
  }),
);

function setterFor<K extends keyof SpeciesFilterState>(key: K) {
  return (value: SpeciesFilterState[K] | ((prev: SpeciesFilterState[K]) => SpeciesFilterState[K])) => {
    useSpeciesFilterStore.setState((state) => ({
      [key]: typeof value === "function" ? (value as (prev: SpeciesFilterState[K]) => SpeciesFilterState[K])(state[key]) : value,
    }));
  };
}

// Same signature as the `useState` setters this replaces (a value, or a `(prev) => next` updater),
// so every existing call site in species-results.tsx (e.g. `setSelectedFamilies((prev) =>
// toggleInSet(prev, f, false))`) keeps working unchanged.
export const setSelectedFamilies = setterFor("selectedFamilies");
export const setSelectedGenera = setterFor("selectedGenera");
export const setSelectedSpecies = setterFor("selectedSpecies");
export const setSelectedAuthorities = setterFor("selectedAuthorities");
export const setSelectedLicences = setterFor("selectedLicences");

export function clearSpeciesFilters() {
  useSpeciesFilterStore.setState(emptyFilters());
}

export function useSpeciesFilters(): SpeciesFilterState {
  useRehydrate(useSpeciesFilterStore);
  return useSpeciesFilterStore();
}

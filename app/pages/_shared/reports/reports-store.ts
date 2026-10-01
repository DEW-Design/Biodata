"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";

// What a person keeps on the reports, in this browser: which ones they starred and when they last opened each (designer,
// 1 Oct 2026: "Favourites... Last opened would be nice as well"). Persisted like the other small stores (zustand-persist.ts):
// there is no backend, so it is per browser, not per account.
interface ReportsState {
  favourites: string[];
  /** Report id to the time it was last opened, in milliseconds. */
  opened: Record<string, number>;
}

const useReportsStore = create<ReportsState>()(
  persist<ReportsState>(() => ({ favourites: [], opened: {} }), {
    name: "biodata-reports",
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

/** The starred reports and the last-opened times, reading the saved ones after the first render. */
export function useReportPrefs() {
  useRehydrate(useReportsStore);
  const favourites = useReportsStore((s) => s.favourites);
  const opened = useReportsStore((s) => s.opened);
  return { favourites, opened };
}

export function toggleFavourite(id: string) {
  useReportsStore.setState((s) => ({ favourites: s.favourites.includes(id) ? s.favourites.filter((f) => f !== id) : [...s.favourites, id] }));
}

/** Records that a report was opened, once the saved state has been read (writing before that would replace it). */
export function useMarkOpened(id: string | undefined) {
  useRehydrate(useReportsStore);
  const hydrated = useHydrated(useReportsStore);
  useEffect(() => {
    if (hydrated && id) useReportsStore.setState((s) => ({ opened: { ...s.opened, [id]: Date.now() } }));
  }, [hydrated, id]);
}

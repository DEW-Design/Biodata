"use client";

import { useMemo } from "react";
import { useChanges, useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";

// The Flora Taxonomy Report is about Flora (the designer, 15 Oct 2026: "there needs to be no fauna records on the flora taxonomy report"): its columns are
// Flora's, and its rows are the Flora taxa Taxonomy Management holds and what was done to them. Every tab reads through these two hooks and never
// through `useTaxa` and `useChanges`, so a Fauna taxon is in no tab. The Fauna fields of the row builders (taxonomy-report-data.ts and the other
// `*-data.ts` files) are kept for the Fauna report that is to follow this one.

/** The Flora taxa. */
export function useFloraTaxa() {
  const taxa = useTaxa();
  return useMemo(() => taxa.filter((t) => t.kingdom === "Flora"), [taxa]);
}

/** The changes made to Flora taxa: a change that produced a Fauna taxon is left out. A change whose result is no longer held is kept, as it said what was done. */
export function useFloraChanges() {
  const taxa = useTaxa();
  const changes = useChanges();
  return useMemo(() => {
    const fauna = new Set(taxa.filter((t) => t.kingdom !== "Flora").map((t) => t.id));
    return changes.filter((c) => ![...c.inputs, ...c.outputs].some((t) => fauna.has(t.id)));
  }, [taxa, changes]);
}

"use client";

import { useMemo } from "react";
import { useChanges, useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";

// The Fauna Taxonomy Report is about Fauna, as the Flora Taxonomy Report is about Flora (taxonomy-flora.ts): its rows are the Fauna taxa Taxonomy Management holds,
// and every tab reads them through this hook and never through `useTaxa`, so a Flora taxon is in no tab.

/** The Fauna taxa. */
export function useFaunaTaxa() {
  const taxa = useTaxa();
  return useMemo(() => taxa.filter((t) => t.kingdom === "Fauna"), [taxa]);
}

/** The changes made to Fauna taxa (Rename, Combine, Split, Append): a change that touched no Fauna taxon is left out, so it is in the Flora report's audit log and not here. */
export function useFaunaChanges() {
  const taxa = useTaxa();
  const changes = useChanges();
  return useMemo(() => {
    const fauna = new Set(taxa.filter((t) => t.kingdom === "Fauna").map((t) => t.id));
    return changes.filter((c) => [...c.inputs, ...c.outputs].some((t) => fauna.has(t.id)));
  }, [taxa, changes]);
}

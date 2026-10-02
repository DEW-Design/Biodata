"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { browserStorage, useHydrated, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { NEW_TAXON_IDS, epithetOf, nameFromParts, seedTaxa, type Kingdom, type NameParts, type Synonym, type Taxon, type TaxonChange } from "@/app/pages/_shared/taxonomy/tx-data";

// Every taxon and every committed taxon change, in a zustand store persisted to localStorage (the
// same plumbing as the Controlled Vocabulary store), so the finder, a species record and the change
// screens - separate routes and three layout options - read and write the same taxa. No backend.
//
// A change is what the four actions do to the taxa:
//   Rename   the taxon keeps its id and concept; its old name becomes a synonym.
//   Combine  a new taxon; the inputs stop being current, their names become its synonyms, and each
//            is linked as its parent (Linked Species).
//   Split    new taxa; the input stops being current and is linked as the parent of each.
//   Append   a new taxon.
// A taxon made here takes the NSX code the admin typed; nothing is assigned on commit.

interface TxState {
  taxa: Taxon[];
  changes: TaxonChange[];
}

const useTxStore = create<TxState>()(
  persist(() => ({ taxa: seedTaxa, changes: [] as TaxonChange[] }), {
    name: "biodata-taxonomy",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function useTaxa() {
  useRehydrate(useTxStore);
  return useTxStore((s) => s.taxa);
}

export function useTaxon(id: string | null | undefined) {
  useRehydrate(useTxStore);
  return useTxStore((s) => (id ? s.taxa.find((t) => t.id === id) : undefined));
}

export function useChanges() {
  useRehydrate(useTxStore);
  return useTxStore((s) => s.changes);
}

export const useTaxaHydrated = () => useHydrated(useTxStore);

const nowIso = () => new Date().toISOString();
const today = () => new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export function saveTaxon(next: Taxon) {
  useTxStore.setState((s) => ({ taxa: s.taxa.map((t) => (t.id === next.id ? next : t)) }));
}

export function saveSynonym(taxonId: string, synonym: Synonym) {
  useTxStore.setState((s) => ({
    taxa: s.taxa.map((t) => (t.id === taxonId ? { ...t, synonyms: t.synonyms.some((x) => x.id === synonym.id) ? t.synonyms.map((x) => (x.id === synonym.id ? synonym : x)) : [...t.synonyms, synonym] } : t)),
  }));
}

export function deleteSynonym(taxonId: string, synonymId: string) {
  useTxStore.setState((s) => ({ taxa: s.taxa.map((t) => (t.id === taxonId ? { ...t, synonyms: t.synonyms.filter((x) => x.id !== synonymId) } : t)) }));
}

function nextIds(taxa: Taxon[], n: number): string[] {
  const free = NEW_TAXON_IDS.filter((id) => !taxa.some((t) => t.id === id));
  return free.slice(0, n);
}

/** How many more taxa the preview can make (its routes are listed up front for the static export). */
export const newTaxaLeft = (taxa: Taxon[]) => nextIds(taxa, NEW_TAXON_IDS.length).length;

function asSynonym(t: Taxon, name: string): Synonym {
  return { id: `${t.id}-syn-${Date.now()}-${Math.round(Math.random() * 1e4)}`, name, values: { genus: name.split(" ")[0], species: epithetOf(name) } };
}

function newTaxon(id: string, kingdom: Kingdom, parts: NameParts, like?: Taxon): Taxon {
  const scientific = nameFromParts(parts);
  const genus = parts.genus.trim();
  return {
    id,
    nsx: parts.nsx.trim() || null,
    kingdom,
    group: like?.group ?? (kingdom === "Flora" ? "Plant" : "Mammal"),
    common: like?.common ?? "",
    scientific,
    ranks: {
      phylum: like?.ranks.phylum ?? (kingdom === "Flora" ? "Tracheophyta" : "Chordata"),
      cls: like?.ranks.cls ?? "",
      order: parts.order.trim() || (parts.higherTaxaLevel === "Order" ? parts.higherTaxaName : like?.ranks.order ?? ""),
      family: parts.family.trim() || (parts.higherTaxaLevel === "Family" ? parts.higherTaxaName : like?.ranks.family ?? ""),
      genus,
    },
    author: parts.speciesAuthor.trim(),
    current: true,
    values: {
      higherTaxaLevel: parts.higherTaxaLevel,
      higherTaxaName: parts.higherTaxaName,
      genus,
      species: parts.species.trim(),
      author: parts.speciesAuthor.trim(),
      current: "Yes",
      createdOn: today(),
      createdBy: CURRENT_USER_NAME,
    },
    tables: {},
    synonyms: [],
    parents: [],
    children: [],
  };
}

function log(type: TaxonChange["type"], inputs: Taxon[], outputs: Taxon[]): TaxonChange {
  return {
    id: `chg-${Date.now()}`,
    type,
    at: nowIso(),
    by: CURRENT_USER_NAME,
    inputs: inputs.map((t) => ({ id: t.id, name: t.scientific })),
    outputs: outputs.map((t) => ({ id: t.id, name: t.scientific })),
  };
}

export function commitRename(taxonId: string, parts: NameParts): TaxonChange | null {
  const t = useTxStore.getState().taxa.find((x) => x.id === taxonId);
  if (!t) return null;
  const scientific = nameFromParts(parts);
  const renamed: Taxon = {
    ...t,
    scientific,
    ranks: { ...t.ranks, genus: parts.genus.trim() || t.ranks.genus },
    author: parts.speciesAuthor.trim() || t.author,
    values: {
      ...t.values,
      genus: parts.genus.trim(),
      species: parts.species.trim(),
      higherTaxaLevel: parts.higherTaxaLevel || t.values.higherTaxaLevel,
      higherTaxaName: parts.higherTaxaName || t.values.higherTaxaName,
      // Flora's Main records who renamed it and when (Renamed On / By); Fauna's has Modified On / By.
      ...(t.kingdom === "Flora" ? { renamedOn: today(), renamedBy: CURRENT_USER_NAME } : { modifiedOn: today(), modifiedBy: CURRENT_USER_NAME }),
    },
    synonyms: [asSynonym(t, t.scientific), ...t.synonyms],
  };
  const change = log("rename", [t], [renamed]);
  useTxStore.setState((s) => ({ taxa: s.taxa.map((x) => (x.id === t.id ? renamed : x)), changes: [change, ...s.changes] }));
  return change;
}

export function commitCombine(inputIds: string[], parts: NameParts): TaxonChange | null {
  const { taxa } = useTxStore.getState();
  const inputs = inputIds.map((id) => taxa.find((t) => t.id === id)).filter((t): t is Taxon => !!t);
  const [id] = nextIds(taxa, 1);
  if (inputs.length < 2 || !id) return null;
  const out = newTaxon(id, inputs[0].kingdom, parts, inputs[0]);
  out.synonyms = inputs.map((t) => asSynonym(out, t.scientific));
  out.parents = inputs.map((t) => t.id);
  const change = log("combine", inputs, [out]);
  useTxStore.setState((s) => ({
    taxa: [...s.taxa.map((t) => (inputIds.includes(t.id) ? { ...t, current: false, values: { ...t.values, current: "No" }, children: [...t.children, out.id] } : t)), out],
    changes: [change, ...s.changes],
  }));
  return change;
}

export function commitSplit(inputId: string, outputs: NameParts[]): TaxonChange | null {
  const { taxa } = useTxStore.getState();
  const input = taxa.find((t) => t.id === inputId);
  const ids = nextIds(taxa, outputs.length);
  if (!input || ids.length < outputs.length) return null;
  const made = outputs.map((p, i) => ({ ...newTaxon(ids[i], input.kingdom, p, input), parents: [input.id] }));
  const change = log("split", [input], made);
  useTxStore.setState((s) => ({
    taxa: [...s.taxa.map((t) => (t.id === inputId ? { ...t, current: false, values: { ...t.values, current: "No" }, children: [...t.children, ...made.map((m) => m.id)] } : t)), ...made],
    changes: [change, ...s.changes],
  }));
  return change;
}

export function commitAppend(kingdom: Kingdom, parts: NameParts): TaxonChange | null {
  const { taxa } = useTxStore.getState();
  const [id] = nextIds(taxa, 1);
  if (!id) return null;
  const out = newTaxon(id, kingdom, parts);
  const change = log("append", [], [out]);
  useTxStore.setState((s) => ({ taxa: [...s.taxa, out], changes: [change, ...s.changes] }));
  return change;
}

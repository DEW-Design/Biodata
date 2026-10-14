"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, useRehydrate } from "@/app/pages/_shared/zustand-persist";
import { INFRASPECIFIC_RANKS, type Kingdom, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";

// Taxonomy Management version 2: the whole hierarchy, not just species (the designer, 14 Oct 2026). Every rank from
// Kingdom down to Infraspecies is a node, so the list holds orders, families and genera beside species, and Append can
// add a taxon at any of Order, Family, Genus, Species or Infraspecies.
//
// The nodes are built, not stored twice:
// - from the species in the taxonomy store (tx-store.ts), which version 1 shares: each species brings its Kingdom,
//   Phylum, Class, Order, Family and Genus, and a name of more than two words is an infraspecies under its species;
// - plus the higher taxa appended in version 2 that have no species under them yet, kept in their own small store.
// A node's id is its path of names ("Animalia/Chordata/Aves/Passeriformes/Maluridae/Malurus"), so the two sources meet
// on the same id and never duplicate.

export const TX_V2_ROOT = "/pages/taxonomy/version-2";

export const RANKS = ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species", "Infraspecies"] as const;
export type Rank = (typeof RANKS)[number];

/** The ranks a taxon can be appended at, highest first. */
export const APPEND_RANKS: Rank[] = ["Order", "Family", "Genus", "Species", "Infraspecies"];

/** Infraspecific ranks: fauna names subspecies only; flora also varieties and forms (the designer, 14 Oct 2026: "right for now"). */
export const infraRanksFor = (kingdom: Kingdom) => (kingdom === "Flora" ? INFRASPECIFIC_RANKS : ["subsp."]);

export const KINGDOM_NAME: Record<Kingdom, string> = { Fauna: "Animalia", Flora: "Plantae" };

export const rankIndex = (r: Rank) => RANKS.indexOf(r);

export interface TaxonNode {
  id: string;
  rank: Rank;
  /** A species' and an infraspecies' name is the full name ("Malurus cyaneus"); a higher taxon's is one word. */
  name: string;
  parentId: string | null;
  kingdom: Kingdom;
  current: boolean;
  /** The species record behind a species or infraspecies node (tx-store), with its NSX code and common name. */
  taxon?: Taxon;
  /** A higher taxon's NSX code: generated when it was appended in version 2. Null for the taxa already here (the designer, 14 Oct 2026). */
  nsx?: string | null;
  createdOn?: string;
  createdBy?: string;
  /** A split taxon: the taxa it became. */
  became?: string[];
  /** A taxon made by a split: the taxon it came from. */
  cameFrom?: string[];
}

/** A node's NSX code, wherever it is kept. */
export const nsxOf = (n: TaxonNode) => n.taxon?.nsx ?? n.nsx ?? null;

export const childId = (parentId: string | null, name: string) => (parentId ? `${parentId}/${name}` : name);

// ── Higher taxa appended in version 2 ──

export interface AddedNode {
  id: string;
  rank: Rank;
  name: string;
  parentId: string;
  kingdom: Kingdom;
  nsx?: string | null;
  createdOn?: string;
  createdBy?: string;
  /** False for a taxon kept only as the record of what it was (a split taxon). */
  current?: boolean;
  became?: string[];
  cameFrom?: string[];
}

/** A taxon (and everything under it) moved under another parent, renamed when its name starts with its old parent's. */
export interface NodeMove {
  fromId: string;
  toParentId: string;
  name: string;
}

// ── Published higher taxa, so each rank shows the taxa beside it (the designer, 14 Oct 2026: "a realistic hierarchy ...
// with the parallel concepts of each rank"). Names and placement are as published for South Australian fauna by the
// Australian Faunal Directory (biodiversity.org.au/afd) and for flora by the Australian Plant Census (biodiversity.org.au/
// nsl/services/APC), on the same Phylum and Class the species above already use. No NSX code is invented for them.
// Each line: kingdom, the path down to the parent, then the taxa at the next rank under it.
const PUBLISHED: [Kingdom, string[], string[]][] = [
  ["Fauna", ["Chordata"], ["Reptilia"]],
  ["Fauna", ["Chordata", "Mammalia"], ["Dasyuromorphia", "Rodentia", "Chiroptera"]],
  ["Fauna", ["Chordata", "Mammalia", "Diprotodontia"], ["Macropodidae", "Vombatidae", "Phascolarctidae", "Pseudocheiridae"]],
  ["Fauna", ["Chordata", "Mammalia", "Diprotodontia", "Macropodidae"], ["Macropus", "Osphranter", "Notamacropus"]],
  ["Fauna", ["Chordata", "Mammalia", "Diprotodontia", "Vombatidae"], ["Lasiorhinus", "Vombatus"]],
  ["Fauna", ["Chordata", "Mammalia", "Diprotodontia", "Phascolarctidae"], ["Phascolarctos"]],
  ["Fauna", ["Chordata", "Mammalia", "Diprotodontia", "Pseudocheiridae"], ["Pseudocheirus"]],
  ["Fauna", ["Chordata", "Mammalia", "Dasyuromorphia"], ["Dasyuridae"]],
  ["Fauna", ["Chordata", "Mammalia", "Dasyuromorphia", "Dasyuridae"], ["Antechinus", "Sminthopsis", "Dasyurus"]],
  ["Fauna", ["Chordata", "Mammalia", "Peramelemorphia"], ["Thylacomyidae"]],
  ["Fauna", ["Chordata", "Mammalia", "Peramelemorphia", "Peramelidae"], ["Perameles"]],
  ["Fauna", ["Chordata", "Mammalia", "Peramelemorphia", "Thylacomyidae"], ["Macrotis"]],
  ["Fauna", ["Chordata", "Mammalia", "Rodentia"], ["Muridae"]],
  ["Fauna", ["Chordata", "Mammalia", "Rodentia", "Muridae"], ["Pseudomys", "Notomys", "Rattus"]],
  ["Fauna", ["Chordata", "Mammalia", "Chiroptera"], ["Vespertilionidae"]],
  ["Fauna", ["Chordata", "Mammalia", "Chiroptera", "Vespertilionidae"], ["Chalinolobus", "Nyctophilus"]],
  ["Fauna", ["Chordata", "Aves"], ["Psittaciformes", "Accipitriformes", "Anseriformes"]],
  ["Fauna", ["Chordata", "Aves", "Passeriformes"], ["Meliphagidae", "Acanthizidae", "Pardalotidae"]],
  ["Fauna", ["Chordata", "Aves", "Passeriformes", "Maluridae"], ["Stipiturus", "Amytornis"]],
  ["Fauna", ["Chordata", "Aves", "Passeriformes", "Meliphagidae"], ["Manorina", "Anthochaera"]],
  ["Fauna", ["Chordata", "Aves", "Passeriformes", "Acanthizidae"], ["Acanthiza"]],
  ["Fauna", ["Chordata", "Aves", "Passeriformes", "Pardalotidae"], ["Pardalotus"]],
  ["Fauna", ["Chordata", "Aves", "Psittaciformes"], ["Cacatuidae", "Psittaculidae"]],
  ["Fauna", ["Chordata", "Aves", "Psittaciformes", "Cacatuidae"], ["Eolophus", "Cacatua"]],
  ["Fauna", ["Chordata", "Aves", "Psittaciformes", "Psittaculidae"], ["Platycercus"]],
  ["Fauna", ["Chordata", "Aves", "Accipitriformes"], ["Accipitridae"]],
  ["Fauna", ["Chordata", "Aves", "Accipitriformes", "Accipitridae"], ["Aquila", "Haliaeetus"]],
  ["Fauna", ["Chordata", "Aves", "Anseriformes"], ["Anatidae"]],
  ["Fauna", ["Chordata", "Aves", "Anseriformes", "Anatidae"], ["Cygnus", "Anas"]],
  ["Fauna", ["Chordata", "Amphibia", "Anura"], ["Limnodynastidae", "Pelodryadidae"]],
  ["Fauna", ["Chordata", "Amphibia", "Anura", "Myobatrachidae"], ["Pseudophryne", "Uperoleia"]],
  ["Fauna", ["Chordata", "Amphibia", "Anura", "Limnodynastidae"], ["Limnodynastes", "Neobatrachus"]],
  ["Fauna", ["Chordata", "Amphibia", "Anura", "Pelodryadidae"], ["Litoria"]],
  ["Fauna", ["Chordata", "Reptilia"], ["Squamata"]],
  ["Fauna", ["Chordata", "Reptilia", "Squamata"], ["Scincidae", "Agamidae", "Varanidae"]],
  ["Fauna", ["Chordata", "Reptilia", "Squamata", "Scincidae"], ["Tiliqua", "Egernia", "Ctenotus"]],
  ["Fauna", ["Chordata", "Reptilia", "Squamata", "Agamidae"], ["Pogona", "Ctenophorus"]],
  ["Fauna", ["Chordata", "Reptilia", "Squamata", "Varanidae"], ["Varanus"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida"], ["Fabales", "Proteales", "Asterales"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Myrtales", "Myrtaceae"], ["Melaleuca", "Leptospermum", "Corymbia"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Fabales"], ["Fabaceae"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Fabales", "Fabaceae"], ["Acacia", "Senna", "Swainsona"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Proteales"], ["Proteaceae"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Proteales", "Proteaceae"], ["Banksia", "Hakea", "Grevillea"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Asterales"], ["Asteraceae"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Asterales", "Asteraceae"], ["Olearia", "Xerochrysum", "Brachyscome"]],
  ["Flora", ["Tracheophyta", "Liliopsida"], ["Poales"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Asparagales"], ["Orchidaceae"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Asparagales", "Asphodelaceae"], ["Dianella"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Asparagales", "Orchidaceae"], ["Caladenia", "Pterostylis", "Thelymitra"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Poales"], ["Poaceae", "Cyperaceae"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Poales", "Poaceae"], ["Austrostipa", "Rytidosperma", "Themeda"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Poales", "Cyperaceae"], ["Gahnia", "Lepidosperma"]],
  // Infraspecies of the species above: zoological subspecies are trinomials (AFD), botanical ones carry their rank (APC).
  ["Fauna", ["Chordata", "Mammalia", "Peramelemorphia", "Peramelidae", "Isoodon", "Isoodon obesulus"], ["Isoodon obesulus obesulus"]],
  ["Fauna", ["Chordata", "Mammalia", "Monotremata", "Tachyglossidae", "Tachyglossus", "Tachyglossus aculeatus"], ["Tachyglossus aculeatus multiaculeatus"]],
  ["Fauna", ["Chordata", "Mammalia", "Diprotodontia", "Phalangeridae", "Trichosurus", "Trichosurus vulpecula"], ["Trichosurus vulpecula vulpecula"]],
  ["Fauna", ["Chordata", "Aves", "Passeriformes", "Maluridae", "Malurus", "Malurus cyaneus"], ["Malurus cyaneus leggei", "Malurus cyaneus ashbyi"]],
  ["Flora", ["Tracheophyta", "Magnoliopsida", "Myrtales", "Myrtaceae", "Eucalyptus", "Eucalyptus leucoxylon"], ["Eucalyptus leucoxylon subsp. leucoxylon", "Eucalyptus leucoxylon subsp. megalocarpa", "Eucalyptus leucoxylon subsp. pruinosa"]],
  ["Flora", ["Tracheophyta", "Liliopsida", "Asparagales", "Asphodelaceae", "Xanthorrhoea", "Xanthorrhoea semiplana"], ["Xanthorrhoea semiplana subsp. tateana"]],
];

const PUBLISHED_NODES: AddedNode[] = PUBLISHED.flatMap(([kingdom, path, names]) => {
  const parentId = [KINGDOM_NAME[kingdom], ...path].join("/");
  const rank = RANKS[path.length + 1];
  const nodes: AddedNode[] = path.map((name, i) => ({ id: [KINGDOM_NAME[kingdom], ...path.slice(0, i + 1)].join("/"), rank: RANKS[i + 1], name, parentId: [KINGDOM_NAME[kingdom], ...path.slice(0, i)].join("/"), kingdom }));
  return [...nodes, ...names.map((name) => ({ id: `${parentId}/${name}`, rank, name, parentId, kingdom }))];
});

interface RankState {
  added: AddedNode[];
  /** Taxa other than species records moved by a split. Species records are renamed in the taxonomy store instead. */
  moves: NodeMove[];
  /** Taxa replaced by a split: the published or built node is taken out, and its record lives on as an added node. */
  retired: string[];
}

const useRankStore = create<RankState>()(
  persist((): RankState => ({ added: [], moves: [], retired: [] }), {
    name: "biodata-taxonomy-ranks",
    version: 1,
    storage: createJSONStorage(browserStorage),
    skipHydration: true,
  }),
);

export function addHigherTaxa(nodes: AddedNode[]) {
  useRankStore.setState((s) => ({ added: [...s.added, ...nodes.filter((n) => !s.added.some((a) => a.id === n.id))] }));
}

/** A split of a higher taxon: the old one kept as a record, the new ones added, what it held moved, its old node retired. */
export function commitHigherSplit(input: { record: AddedNode; made: AddedNode[]; moves: NodeMove[]; retire: string }) {
  useRankStore.setState((s) => ({
    added: [...s.added.filter((a) => a.id !== input.retire), input.record, ...input.made],
    moves: [...s.moves, ...input.moves],
    retired: [...s.retired, input.retire],
  }));
}

/** A combine of higher taxa: each kept as a record, their old nodes retired, the combined one added, what they held moved. */
export function commitHigherCombine(input: { records: AddedNode[]; made: AddedNode; moves: NodeMove[]; retire: string[] }) {
  useRankStore.setState((s) => ({
    added: [...s.added.filter((a) => !input.retire.includes(a.id)), ...input.records, input.made],
    moves: [...s.moves, ...input.moves],
    retired: [...s.retired, ...input.retire],
  }));
}

/** Moves taxa that are not species records (published, appended), as a split of a species or infraspecies does. */
export function addMoves(moves: NodeMove[]) {
  useRankStore.setState((s) => ({ moves: [...s.moves, ...moves] }));
}

// ── Building the nodes ──

export function buildNodes(taxa: Taxon[], added: AddedNode[], moves: NodeMove[] = [], retired: string[] = []): TaxonNode[] {
  const byId = new Map<string, TaxonNode>();
  const put = (n: TaxonNode) => {
    const had = byId.get(n.id);
    // A higher taxon is current while anything under it is.
    if (had) had.current = had.current || n.current;
    else byId.set(n.id, n);
    return byId.get(n.id)!;
  };
  // Current records first, so a split taxon that kept its name holds the name's place and the superseded one sits beside it.
  for (const t of [...taxa].sort((a, b) => Number(b.current) - Number(a.current))) {
    const words = t.scientific.trim().split(/\s+/);
    const path: [Rank, string][] = [
      ["Kingdom", KINGDOM_NAME[t.kingdom]],
      ["Phylum", t.ranks.phylum],
      ["Class", t.ranks.cls],
      ["Order", t.ranks.order],
      ["Family", t.ranks.family],
      ["Genus", t.ranks.genus || words[0]],
      ["Species", words.slice(0, 2).join(" ")],
    ];
    if (words.length > 2) path.push(["Infraspecies", t.scientific.trim()]);
    let parentId: string | null = null;
    for (const [i, [rank, name]] of path.entries()) {
      // A rank left empty on an older record is skipped rather than drawn as a blank.
      if (!name) continue;
      const leaf = i === path.length - 1;
      const id = childId(parentId, name);
      const taken = leaf && byId.get(id)?.taxon && byId.get(id)!.taxon!.id !== t.id;
      const node = put({ id: taken ? `${id}#${t.id}` : id, rank, name, parentId, kingdom: t.kingdom, current: t.current, taxon: leaf ? t : undefined });
      if (leaf && !node.taxon) node.taxon = t;
      parentId = node.id;
    }
  }
  // Appended and split taxa first: one that took a published taxon's name and place is the one kept.
  const fromAdded = new Set<string>();
  for (const a of added) {
    fromAdded.add(a.id);
    const had = byId.get(a.id);
    // A taxon a split or combine made can share its id with one the species records build (its renamed species are
    // already under it): the record's own facts are laid on that node, so it is the one kept.
    if (had) Object.assign(had, { nsx: a.nsx ?? had.nsx, createdOn: a.createdOn ?? had.createdOn, createdBy: a.createdBy ?? had.createdBy, became: a.became ?? had.became, cameFrom: a.cameFrom ?? had.cameFrom });
    else put({ ...a, current: a.current ?? true });
  }
  for (const a of PUBLISHED_NODES) if (!byId.has(a.id)) put({ ...a, current: true });

  for (const m of moves) {
    const root = byId.get(m.fromId);
    if (!root) continue;
    const subtree = [...byId.values()].filter((n) => n.id === m.fromId || n.id.startsWith(`${m.fromId}/`)).sort((a, b) => a.id.length - b.id.length);
    const newIds = new Map<string, string>();
    for (const n of subtree) {
      const name = n === root ? m.name : n.name.startsWith(`${root.name} `) ? `${m.name}${n.name.slice(root.name.length)}` : n.name;
      const parentId = n === root ? m.toParentId : (newIds.get(n.parentId ?? "") ?? n.parentId);
      const id = childId(parentId, name);
      newIds.set(n.id, id);
      byId.delete(n.id);
      if (!byId.has(id)) byId.set(id, { ...n, id, name, parentId });
    }
  }
  for (const id of retired) if (!fromAdded.has(id)) byId.delete(id);
  return [...byId.values()];
}

export function useTaxonNodes(): TaxonNode[] {
  useRehydrate(useRankStore);
  const taxa = useTaxa();
  const added = useRankStore((s) => s.added);
  const moves = useRankStore((s) => s.moves);
  const retired = useRankStore((s) => s.retired);
  return useMemo(() => buildNodes(taxa, added, moves, retired), [taxa, added, moves, retired]);
}

/** A node and every taxon above it, highest first. */
export function lineage(nodes: TaxonNode[], id: string | null): TaxonNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: TaxonNode[] = [];
  let at = id ? byId.get(id) : undefined;
  while (at) {
    out.unshift(at);
    at = at.parentId ? byId.get(at.parentId) : undefined;
  }
  return out;
}

/** The node at a rank above (or at) this one, if the lineage has it. */
export const ancestorAt = (nodes: TaxonNode[], id: string | null, rank: Rank) => lineage(nodes, id).find((n) => n.rank === rank);

/**
 * The NSX code every appended taxon is given, at any rank (the designer, 14 Oct 2026: "we must generate a new nsx code for all
 * new appends").
 * How BDBSA allocates codes is not known to this build, so this follows what the codes already show: a letter and five
 * digits, the letter its nearest relative's (the same genus, else family, and on up), and the next number free under
 * that letter. Open: replace with the real allocation rule.
 */
export function nextNsx(nodes: TaxonNode[], parentId: string | null, kingdom: Kingdom): string {
  return nextNsxCodes(nodes, parentId, kingdom, 1)[0];
}

/** `count` codes in a row, for the taxa a split makes. */
export function nextNsxCodes(nodes: TaxonNode[], parentId: string | null, kingdom: Kingdom, count: number): string[] {
  const coded = nodes.filter((n) => nsxOf(n)).map((n) => ({ id: n.id, code: nsxOf(n)!.toUpperCase(), kingdom: n.kingdom }));
  const up = lineage(nodes, parentId).reverse();
  const relative = up.map((a) => coded.find((c) => c.id.startsWith(`${a.id}/`))).find(Boolean) ?? coded.find((c) => c.kingdom === kingdom);
  const letter = relative?.code.match(/^[A-Z]+/)?.[0] ?? (kingdom === "Flora" ? "P" : "M");
  const used = coded.filter((c) => c.code.startsWith(letter)).map((c) => Number(c.code.slice(letter.length)) || 0);
  const next = Math.max(0, ...used) + 1;
  return Array.from({ length: count }, (_, i) => `${letter}${String(next + i).padStart(5, "0")}`);
}

const CLASS_GROUP: Record<string, Taxon["group"]> = { Aves: "Bird", Mammalia: "Mammal", Amphibia: "Amphibian", Reptilia: "Reptile" };

/** A taxon's species group (Birds, Mammals ... Plants): a species' own, else its class's. Above Class there is none. */
export function groupOf(nodes: TaxonNode[], n: TaxonNode): Taxon["group"] | null {
  if (n.taxon) return n.taxon.group;
  if (rankIndex(n.rank) < rankIndex("Class")) return null;
  if (n.kingdom === "Flora") return "Plant";
  return CLASS_GROUP[ancestorAt(nodes, n.id, "Class")?.name ?? ""] ?? null;
}

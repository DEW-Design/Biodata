import type { Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import { childId, type Rank, type TaxonNode } from "@/app/pages/_shared/taxonomy/tx-hierarchy";

// The sample answers of the four Taxonomy Management change forms (Append, Split, Combine, Rename), for the Pre-fill sample content switch on the
// Prototype tools bar (app/_prototype-tools/sample-content.ts, the designer, 10 Nov 2026: "if there's a form, let's have a fill sample content
// toggle ... let it cover branching questions as well"). Each answers the fullest branch its form has, and each is built from the taxa the build
// really holds (`nodes`, the published hierarchy and the seed species), so the change is one the form's own checks accept.
//
// - Append: Flora, Infraspecies. That rank asks for a species to sit under and two infraspecific ranks and names (the form allows up to three),
//   the most fields any rank shows. Flora, not Fauna, because only Flora offers more than "subsp.".
// - Split: a genus with a species under it, into two new genera, the species moved to the first and renamed to match ("Malurus cyaneus" becomes
//   "<new genus> cyaneus"). Rank Genus rather than Species because a species' infraspecies are not renamed in the form's list, and Genus is
//   where "What it holds" shows a renaming.
// - Combine: three genera side by side under one family (the form takes any number from two), given a new name, so what they hold is moved and
//   renamed. A new name rather than keeping one: it is the branch that opens a name field and renames what moves.
// - Rename: a species moved to another genus of its family and given a new epithet, so both parts of its name change and "What changes too" lists
//   the infraspecies that follow it.
//
// Honest (CONTRACTS 0.3): a taxon is always one the build already has. A name that has to be new (a new epithet, a new genus) is a plainly
// placeholder word, not a claim about real taxonomy, and it is chosen so that it is not already in the taxonomy: after a change is saved, the next
// time the switch is turned on the words are different, so the form is never refused for a clash.

const GENUS_WORDS = ["Exemplaria", "Specimenia", "Demonstraria", "Illustraria", "Prototypia"];
const EPITHET_WORDS = ["exemplaris", "exempli", "demonstrans", "illustratus", "prototypus"];
const LETTERS = "bcdefghijklmnopqrstuvwxyz";

/** The first of `words` that is free, then each with a letter after it, so a placeholder name never repeats one already used. */
function firstFree(words: string[], free: (word: string) => boolean): string {
  for (const w of words) if (free(w)) return w;
  for (const letter of LETTERS) for (const w of words) if (free(`${w}${letter}`)) return `${w}${letter}`;
  return `${words[0]}${Date.now().toString(36)}`;
}

const byName = (a: TaxonNode, b: TaxonNode) => a.name.localeCompare(b.name);
const heldBy = (nodes: TaxonNode[], id: string) => nodes.filter((n) => n.parentId === id && n.current);
const idTaken = (nodes: TaxonNode[], parentId: string | null, name: string) => nodes.some((n) => n.id === childId(parentId, name));
/** A higher taxon's name is free when no taxon at its rank in the kingdom has it, and its place is not taken. */
const nameFree = (nodes: TaxonNode[], kingdom: Kingdom, rank: Rank, parentId: string | null, name: string) =>
  !nodes.some((n) => n.kingdom === kingdom && n.rank === rank && n.name === name) && !idTaken(nodes, parentId, name);

type Infra = { rank: string; name: string };

// ── Append ──

export interface AppendSample {
  kingdom: Kingdom;
  rank: Rank;
  parentId: string | null;
  name: string;
  infra: Infra[];
}

export function sampleAppend(nodes: TaxonNode[]): AppendSample {
  const kingdom: Kingdom = "Flora";
  const species = nodes.filter((n) => n.kingdom === kingdom && n.rank === "Species" && n.current).sort(byName);
  const parent = species.find((n) => n.name === "Eucalyptus leucoxylon") ?? species[0];
  const second = EPITHET_WORDS[2];
  const first = firstFree(EPITHET_WORDS, (w) => !parent || !idTaken(nodes, parent.id, `${parent.name} subsp. ${w} var. ${second}`));
  return {
    kingdom,
    rank: "Infraspecies",
    parentId: parent?.id ?? null,
    name: "",
    infra: [
      { rank: "subsp.", name: first },
      { rank: "var.", name: second },
    ],
  };
}

// ── Split ──

export interface SplitSample {
  kingdom: Kingdom;
  rank: Rank;
  oldId: string | null;
  parts: Infra[];
  moves: Record<string, number>;
}

export function sampleSplit(nodes: TaxonNode[]): SplitSample {
  const candidates = nodes
    .filter((n) => n.rank === "Genus" && n.current && heldBy(nodes, n.id).length > 0)
    .sort((a, b) => Number(b.name === "Malurus") - Number(a.name === "Malurus") || Number(b.kingdom === "Fauna") - Number(a.kingdom === "Fauna") || heldBy(nodes, b.id).length - heldBy(nodes, a.id).length || byName(a, b));
  const old = candidates[0];
  const kingdom: Kingdom = old?.kingdom ?? "Fauna";
  const free = (w: string) => nameFree(nodes, kingdom, "Genus", old?.parentId ?? null, w);
  const one = firstFree(GENUS_WORDS, free);
  const two = firstFree(GENUS_WORDS, (w) => free(w) && w !== one);
  const held = old ? heldBy(nodes, old.id).sort(byName) : [];
  return {
    kingdom,
    rank: "Genus",
    oldId: old?.id ?? null,
    parts: [
      { rank: "", name: one },
      { rank: "", name: two },
    ],
    // The first holds the species, so the renaming shows; with more than one, they are shared between the two.
    moves: Object.fromEntries(held.map((c, i) => [c.id, i % 2])),
  };
}

// ── Combine ──

export interface CombineSample {
  kingdom: Kingdom;
  rank: Rank;
  picked: (string | null)[];
  naming: "keep" | "new";
  kept: string | null;
  fresh: Infra;
}

export function sampleCombine(nodes: TaxonNode[]): CombineSample {
  const families = nodes
    .filter((n) => n.rank === "Family" && n.current && heldBy(nodes, n.id).length >= 2)
    .sort((a, b) => Number(b.name === "Maluridae") - Number(a.name === "Maluridae") || Number(b.kingdom === "Fauna") - Number(a.kingdom === "Fauna") || byName(a, b));
  const family = families[0];
  const genera = family
    ? heldBy(nodes, family.id)
        .sort((a, b) => heldBy(nodes, b.id).length - heldBy(nodes, a.id).length || byName(a, b))
        .slice(0, 3)
    : [];
  const kingdom: Kingdom = family?.kingdom ?? "Fauna";
  const name = firstFree(GENUS_WORDS, (w) => nameFree(nodes, kingdom, "Genus", family?.id ?? null, w));
  return {
    kingdom,
    rank: "Genus",
    picked: genera.length >= 2 ? genera.map((g) => g.id) : [null, null],
    naming: "new",
    kept: null,
    fresh: { rank: "", name },
  };
}

// ── Rename ──

export interface RenameSample {
  kingdom: Kingdom;
  rank: Rank;
  targetId: string | null;
  fields: { parentId: string | null; name: string; infraRank: string };
}

export function sampleRename(nodes: TaxonNode[]): RenameSample {
  const candidates = nodes
    .filter((n) => n.rank === "Species" && n.kingdom === "Fauna" && n.current)
    .sort((a, b) => Number(b.name === "Malurus cyaneus") - Number(a.name === "Malurus cyaneus") || heldBy(nodes, b.id).length - heldBy(nodes, a.id).length || byName(a, b));
  const target = candidates[0];
  const genus = target ? nodes.find((n) => n.id === target.parentId) : undefined;
  // Another genus of the same family, so the species moves as well as being renamed; the same genus if it is the only one.
  const other = genus ? nodes.filter((n) => n.rank === "Genus" && n.current && n.parentId === genus.parentId && n.id !== genus.id).sort(byName)[0] : undefined;
  const parent = other ?? genus;
  const epithet = firstFree(EPITHET_WORDS, (w) => !parent || !idTaken(nodes, parent.id, `${parent.name} ${w}`));
  return {
    kingdom: "Fauna",
    rank: "Species",
    targetId: target?.id ?? null,
    fields: { parentId: parent?.id ?? null, name: epithet, infraRank: "" },
  };
}

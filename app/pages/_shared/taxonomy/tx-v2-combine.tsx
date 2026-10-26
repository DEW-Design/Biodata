"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitMerge, Plus, Trash01 } from "@untitledui/icons";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import {
  RadioButton,
  RadioGroup,
} from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import {
  FieldCard,
  SpeciesTypeField,
} from "@/app/pages/_shared/taxonomy/tx-actions";
import {
  TX_ROOT,
  emptyNameParts,
  type Kingdom,
  type Taxon,
} from "@/app/pages/_shared/taxonomy/tx-data";
import {
  nodeHref,
  APPEND_RANKS,
  KINGDOM_NAME,
  RANKS,
  addMoves,
  childId,
  commitHigherCombine,
  infraRanksFor,
  lineage,
  nextNsx,
  nsxOf,
  rankIndex,
  useTaxonNodes,
  type NodeMove,
  type Rank,
  type TaxonNode,
} from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import {
  commitCombine,
  retargetTaxa,
} from "@/app/pages/_shared/taxonomy/tx-store";
import {
  TaxonPicker,
  tidy,
  today,
} from "@/app/pages/_shared/taxonomy/tx-v2-append";
import {
  NodeTree,
  WithHierarchy,
  italicRank,
} from "@/app/pages/_shared/taxonomy/tx-v2-list";
import { ValueGrid } from "@/app/pages/_shared/taxonomy/tx-v2-record";
import { useRoleHref } from "@/lib/use-role-href";

// Version 2's Combine Taxon (the designer, 14 Oct 2026), agreed in wireframes: Split Taxon in reverse (tx-v2-split.tsx), and
// built the same way as it and Append Taxon (0.9): one page, Taxa Type then Rank, the taxa picked from searches at that
// rank with the ranks above them read as label and value, the tree beside the fields, a generated NSX code, and a
// confirmation naming everything before it is saved.
//
// Decided with the designer:
// - Only taxa side by side can be combined (the same parent): once the first is picked, the others are searched among the
//   taxa beside it.
// - The combined taxon keeps one of their names or takes a new one; either way it is a new taxon with a new NSX code, as
//   every part of a split is. The combined taxa stop being current and record what they became.
// - Everything they held moves under the combined taxon, whole branches at a time. Only species and infraspecies names
//   change (their first word is the genus): a species moved to another genus is renamed and keeps its old name as a synonym.
// - Two taxa that would end up with the same name block the combine until one is renamed.

/** "Genus" to "genera": the taxa of a rank, counted. */
const plural = (r: Rank, n: number) =>
  n === 1
    ? r.toLowerCase()
    : {
        Order: "orders",
        Family: "families",
        Genus: "genera",
        Species: "species",
        Infraspecies: "infraspecies",
        Kingdom: "kingdoms",
        Phylum: "phyla",
        Class: "classes",
      }[r];

/** Tells one combine's records of the old taxa from another's. */
const combineStamp = () => Date.now().toString(36);

export function CombineTaxonForm({
  initialKingdom,
}: {
  initialKingdom: Kingdom | null;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nodes = useTaxonNodes();
  const [kingdom, setKingdom] = useState<Kingdom | null>(initialKingdom);
  const [rank, setRank] = useState<Rank | null>(null);
  const [picked, setPicked] = useState<(string | null)[]>([null, null]);
  const [naming, setNaming] = useState<"keep" | "new">("keep");
  const [kept, setKept] = useState<string | null>(null);
  const [fresh, setFresh] = useState({ rank: "", name: "" });
  const [attempted, setAttempted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const reset = () => {
    setPicked([null, null]);
    setNaming("keep");
    setKept(null);
    setFresh({ rank: "", name: "" });
    setAttempted(false);
  };

  const kingdomId = kingdom ? KINGDOM_NAME[kingdom] : null;
  const inputs = picked
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is TaxonNode => !!n);
  const first = inputs[0];
  const path = lineage(nodes, first?.parentId ?? null);
  const parent = path[path.length - 1];
  const nameAt = (r: Rank) =>
    r === "Kingdom" && kingdom
      ? KINGDOM_NAME[kingdom]
      : (path.find((a) => a.rank === r)?.name ?? "");
  const floraInfra = rank === "Infraspecies" && kingdom === "Flora";

  // ── The combined taxon ──
  const keptNode = inputs.find((n) => n.id === kept);
  const combinedName = (() => {
    if (!rank || !parent) return "";
    if (naming === "keep") return keptNode?.name ?? "";
    if (!fresh.name.trim()) return "";
    if (rank === "Species")
      return `${parent.name} ${tidy("Species", fresh.name)}`;
    if (rank === "Infraspecies")
      return floraInfra
        ? fresh.rank
          ? `${parent.name} ${fresh.rank} ${tidy("Infraspecies", fresh.name)}`
          : ""
        : `${parent.name} ${tidy("Infraspecies", fresh.name)}`;
    return tidy(rank, fresh.name);
  })();
  const combined =
    rank && parent && kingdom && combinedName
      ? {
          id: childId(parent.id, combinedName),
          rank,
          name: combinedName,
          parentId: parent.id,
          kingdom,
        }
      : null;
  const nsx = combined
    ? nextNsx(nodes, combined.parentId, combined.kingdom)
    : null;

  // ── What moves: everything one rank down, renamed when its name starts with its old parent's ──
  const held = inputs.flatMap((input) =>
    nodes
      .filter((n) => n.parentId === input.id && n.current)
      .map((c) => ({ c, from: input })),
  );
  const becomes = (c: TaxonNode, from: TaxonNode) =>
    combined && c.name.startsWith(`${from.name} `)
      ? `${combined.name}${c.name.slice(from.name.length)}`
      : c.name;
  const moving = held
    .map(({ c, from }) => ({ c, from, next: becomes(c, from) }))
    .sort((a, b) => a.next.localeCompare(b.next));
  const clashes = combined
    ? [
        ...new Set(
          moving.map((m) => m.next).filter((n, i, all) => all.indexOf(n) !== i),
        ),
      ]
    : [];
  const childRank =
    rank && rank !== "Infraspecies" ? RANKS[rankIndex(rank) + 1] : null;

  // ── What is missing or wrong ──
  const missing: string[] = [];
  if (!kingdom) missing.push("Taxa Type");
  if (!rank) missing.push("Rank");
  if (rank && inputs.length < 2)
    missing.push(`At least two ${plural(rank, 2)} to combine`);
  if (inputs.length >= 2 && !combinedName)
    missing.push(naming === "keep" ? "The name to keep" : "The new name");
  const wrong = (() => {
    if (clashes.length)
      return `${clashes.join(", ")} would be two taxa with one name: rename one first`;
    if (!combined || naming === "keep") return undefined;
    if (nodes.some((n) => n.id === combined.id))
      return `${combined.name} is already in the taxonomy`;
    if (
      rankIndex(combined.rank) < rankIndex("Species") &&
      nodes.some(
        (n) =>
          n.kingdom === kingdom &&
          n.rank === combined.rank &&
          n.name === combined.name,
      )
    )
      return `${combined.name} is already a ${combined.rank.toLowerCase()}`;
    return undefined;
  })();
  const problems =
    attempted && (missing.length || wrong)
      ? { items: missing.length ? missing : [wrong!] }
      : undefined;

  const commit = () => {
    if (!combined || !nsx || !kingdom || !rank) return;
    const nodeMoves: NodeMove[] = moving.map(({ c, next }) => ({
      fromId: c.id,
      toParentId: combined.id,
      name: next,
    }));
    const field = { Order: "order", Family: "family", Genus: "genus" }[
      rank as "Order" | "Family" | "Genus"
    ];
    const retarget: {
      id: string;
      scientific: string;
      ranks: Taxon["ranks"];
    }[] = [];
    for (const { c, from } of moving) {
      for (const n of nodes.filter(
        (x) => x.taxon && (x.id === c.id || x.id.startsWith(`${c.id}/`)),
      )) {
        const t = n.taxon!;
        retarget.push({
          id: t.id,
          scientific: t.scientific.startsWith(`${from.name} `)
            ? `${combined.name}${t.scientific.slice(from.name.length)}`
            : t.scientific,
          ranks: field ? { ...t.ranks, [field]: combined.name } : t.ranks,
        });
      }
    }

    if (inputs.every((n) => n.taxon)) {
      // Species or infraspecies records: version 1's combine makes the new record, its inputs' names its synonyms.
      const t = inputs[0].taxon!;
      const words = combined.name.split(" ");
      const parts = {
        ...emptyNameParts(),
        nsx,
        genus: t.ranks.genus,
        species: words[1],
        order: t.ranks.order,
        family: t.ranks.family,
      };
      const withInfra =
        rank === "Infraspecies"
          ? {
              ...parts,
              infra: [
                {
                  rank: floraInfra ? (words[2] ?? "") : "",
                  name: words[words.length - 1],
                },
                { rank: "", name: "" },
                { rank: "", name: "" },
              ],
            }
          : parts;
      if (
        !commitCombine(
          inputs.map((n) => n.taxon!.id),
          withInfra,
        )
      ) {
        toast.error("That combine could not be made", {
          description: "The preview has run out of room for new taxa.",
        });
        return;
      }
      addMoves(nodeMoves);
    } else {
      const stamp = combineStamp();
      const records = inputs.map((n) => ({
        id: `${n.id}#combine-${stamp}`,
        rank,
        name: n.name,
        parentId: n.parentId!,
        kingdom,
        nsx: nsxOf(n),
        createdOn: n.createdOn,
        createdBy: n.createdBy,
        current: false,
        became: [combined.id],
      }));
      commitHigherCombine({
        records,
        made: {
          ...combined,
          nsx,
          createdOn: today(),
          createdBy: CURRENT_USER_NAME,
          cameFrom: records.map((r) => r.id),
        },
        moves: nodeMoves,
        retire: inputs.map((n) => n.id),
      });
    }
    retargetTaxa(retarget);
    toast.success(`${rank === "Genus" ? "Genera" : `${rank}`} combined`, {
      description: `${inputs.map((n) => n.name).join(", ")} into ${combined.name}`,
    });
    router.push(roleHref(nodeHref(combined.id)));
  };

  const onCombine = () => {
    if (missing.length || wrong) return setAttempted(true);
    setConfirming(true);
  };

  const touched = !!(kingdom !== initialKingdom || rank || inputs.length);
  const leave = () =>
    router.push(
      roleHref(kingdom ? `${TX_ROOT}?kingdom=${kingdom}` : TX_ROOT),
    );

  // ── The tree: the path to the parent, the taxa side by side under it (those picked highlighted), and the combined one ──
  const tree = (() => {
    if (!kingdom || !kingdomId) return null;
    const route = parent ? path : nodes.filter((n) => n.id === kingdomId);
    const routeIds = new Set(route.map((n) => n.id));
    const list = nodes.filter(
      (n) => routeIds.has(n.id) || (n.parentId && routeIds.has(n.parentId)),
    );
    const isNew = combined && !list.some((n) => n.id === combined.id);
    if (combined && isNew) list.push({ ...combined, current: true });
    return {
      list,
      expanded: [...routeIds],
      newIds: new Set(combined && isNew ? [combined.id] : []),
    };
  })();

  const rankLabel = rank ? rank.toLowerCase() : "taxon";
  const renamedCount = moving.filter((m) => m.next !== m.c.name).length;

  return (
    <>
      <FormPage
        title="Combine Taxon"
        subtitle={
          rank
            ? `Merge two or more ${plural(rank, 2)} into one.`
            : "Merge two or more taxa into one."
        }
        onCancel={() => (touched ? setConfirmLeave(true) : leave())}
        problems={problems}
        primaryLabel="Combine"
        primaryIcon={GitMerge}
        onPrimary={onCombine}
      >
        <WithHierarchy
          panel={
            tree ? (
              <FieldCard title="Hierarchy">
                {tree && (
                  <NodeTree
                    key={`${picked.join("|")}:${[...tree.newIds].join("|")}`}
                    label={`The ${rank ? plural(rank, 2) : "taxa"} being combined`}
                    nodes={tree.list}
                    expanded={tree.expanded}
                    highlightIds={new Set(inputs.map((n) => n.id))}
                    newIds={tree.newIds}
                  />
                )}
              </FieldCard>
            ) : null
          }
        >
          <FormRow title="Taxa Type" required>
            <SpeciesTypeField
              label="Taxa Type"
              value={kingdom}
              onChange={(k) => {
                setKingdom(k);
                setRank(null);
                reset();
              }}
              showError={attempted}
            />
          </FormRow>

          {kingdom && (
            <FormRow
              title="Rank"
              required
              description="The rank of the taxa to combine."
            >
              <RadioGroup
                aria-label="Rank"
                orientation="horizontal"
                value={rank ?? ""}
                onChange={(v) => {
                  setRank(v as Rank);
                  reset();
                }}
                isInvalid={attempted && !rank}
                className="flex-wrap gap-x-8 gap-y-3"
              >
                {APPEND_RANKS.map((r) => (
                  <RadioButton key={r} value={r} label={r} />
                ))}
              </RadioGroup>
              {attempted && !rank && (
                <p className="text-sm text-error-primary">Choose a rank</p>
              )}
            </FormRow>
          )}

          {kingdom && rank && (
            <FormRow
              title="Taxa to combine"
              required
              description={`Choose the ${plural(rank, 2)}. They must sit side by side, under the same ${RANKS[rankIndex(rank) - 1].toLowerCase()}.`}
            >
              <div className="flex max-w-[560px] flex-col gap-5">
                <ValueGrid
                  className="sm:grid-cols-2"
                  items={RANKS.slice(0, rankIndex(rank)).map((r) => ({
                    label: r,
                    value: nameAt(r),
                    italic: italicRank(r),
                  }))}
                />
                {picked.map((id, i) => (
                  <div
                    key={`${i}:${picked.length}`}
                    className={
                      i >= 2
                        ? "grid grid-cols-[minmax(0,1fr)_36px] items-end gap-2"
                        : undefined
                    }
                  >
                    <TaxonPicker
                      key={`${kingdom}:${rank}:${i}:${first?.parentId ?? ""}`}
                      rank={rank}
                      kingdom={kingdom}
                      nodes={nodes}
                      label={`${rank} ${i + 1}`}
                      value={id}
                      within={i === 0 ? undefined : (first?.parentId ?? "")}
                      exclude={
                        picked.filter((x, j) => x && j !== i) as string[]
                      }
                      onChange={(next) => {
                        // Changing the first one can move the parent: the others are chosen again beside it.
                        const nextNode = nodes.find((n) => n.id === next);
                        setPicked(
                          i === 0 && nextNode?.parentId !== first?.parentId
                            ? [next, ...picked.slice(1).map(() => null)]
                            : picked.map((x, j) => (j === i ? next : x)),
                        );
                        setKept(null);
                      }}
                      showError={attempted && i < 2}
                      missingHint={`Choose the ${i === 0 ? "first" : "next"} ${rankLabel} to combine`}
                      emptyHint={
                        i === 0
                          ? "Only a current taxon can be combined."
                          : first
                            ? `No other current ${rankLabel} sits beside the first one.`
                            : `Choose ${rankLabel} 1 first.`
                      }
                    />
                    {i >= 2 && (
                      <Button
                        color="tertiary"
                        size="sm"
                        iconLeading={Trash01}
                        aria-label={`Remove ${rankLabel} ${i + 1}`}
                        onClick={() => {
                          setPicked(picked.filter((_, j) => j !== i));
                          if (kept === id) setKept(null);
                        }}
                      />
                    )}
                  </div>
                ))}
                <div>
                  <Button
                    color="link-color"
                    size="sm"
                    iconLeading={Plus}
                    onClick={() => setPicked([...picked, null])}
                  >
                    Add another {rankLabel}
                  </Button>
                </div>
              </div>
            </FormRow>
          )}

          {rank && inputs.length >= 2 && (
            <FormRow
              title="Combined taxon"
              required
              description="Keep one of their names or give it a new one. Either way it gets a new NSX code."
            >
              <div className="flex max-w-[560px] flex-col gap-4">
                <RadioGroup
                  aria-label="Name of the combined taxon"
                  value={naming}
                  onChange={(v) => setNaming(v as "keep" | "new")}
                  className="gap-3"
                >
                  <RadioButton value="keep" label="Keep a name" />
                  <RadioButton value="new" label="A new name" />
                </RadioGroup>
                {naming === "keep" ? (
                  <Select
                    size="sm"
                    aria-label="Name to keep"
                    placeholder={`Choose a ${rankLabel}`}
                    items={inputs.map((n) => ({ id: n.id, label: n.name }))}
                    selectedKey={kept}
                    onSelectionChange={(k) => setKept(String(k ?? ""))}
                    isInvalid={attempted && !kept}
                  >
                    {(item) => (
                      <Select.Item {...item}>{item.label}</Select.Item>
                    )}
                  </Select>
                ) : (
                  <div
                    className={
                      floraInfra
                        ? "grid grid-cols-[104px_minmax(0,1fr)] gap-2"
                        : undefined
                    }
                  >
                    {floraInfra && (
                      <Select
                        size="sm"
                        aria-label="Infraspecific rank"
                        placeholder="Rank"
                        items={infraRanksFor(kingdom!).map((o) => ({
                          id: o,
                          label: o,
                        }))}
                        selectedKey={fresh.rank || null}
                        onSelectionChange={(k) =>
                          setFresh({ ...fresh, rank: String(k ?? "") })
                        }
                        isInvalid={attempted && !fresh.rank}
                      >
                        {(item) => (
                          <Select.Item {...item}>{item.label}</Select.Item>
                        )}
                      </Select>
                    )}
                    <Input
                      size="sm"
                      aria-label="New name"
                      placeholder={
                        rank === "Species"
                          ? "Species epithet"
                          : rank === "Infraspecies"
                            ? "Infraspecific name"
                            : `${rank} name`
                      }
                      value={fresh.name}
                      onChange={(v) => setFresh({ ...fresh, name: v })}
                      isInvalid={attempted && !fresh.name.trim()}
                    />
                  </div>
                )}
                {nsx && (
                  <p className="text-sm text-tertiary">
                    {combined?.name && (
                      <span className={italicRank(rank) ? "italic" : undefined}>
                        {combined.name}
                      </span>
                    )}{" "}
                    gets the new NSX code{" "}
                    <span className="tabular-nums">{nsx}</span>.
                  </p>
                )}
                {wrong && !clashes.length && (
                  <p className="text-sm text-error-primary">{wrong}</p>
                )}
              </div>
            </FormRow>
          )}

          {rank && childRank && inputs.length >= 2 && moving.length > 0 && (
            <FormRow
              title="What moves"
              description={`${moving.length} ${plural(childRank, moving.length)} go to the combined ${rankLabel}, with everything under them.`}
            >
              <div className="flex max-w-[560px] flex-col gap-2">
                {moving.map(({ c, next }) => {
                  const clash = clashes.includes(next);
                  return (
                    <div
                      key={c.id}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3"
                    >
                      <span
                        className={
                          italicRank(c.rank)
                            ? "text-sm text-primary italic"
                            : "text-sm text-primary"
                        }
                      >
                        {c.name}
                      </span>
                      <span
                        className={
                          clash
                            ? "text-sm text-error-primary"
                            : "text-sm text-tertiary"
                        }
                      >
                        {!combined ? (
                          "Moves"
                        ) : next === c.name ? (
                          "Stays the same"
                        ) : (
                          <>
                            Becomes <span className="italic">{next}</span>
                          </>
                        )}
                        {clash && ": same name as another"}
                      </span>
                    </div>
                  );
                })}
                {clashes.length > 0 && (
                  <p className="pt-2 text-sm text-balance text-error-primary">{`${clashes.join(", ")} would be two taxa with one name. Rename one of them first, then combine.`}</p>
                )}
              </div>
            </FormRow>
          )}
        </WithHierarchy>
      </FormPage>

      <ConfirmationModal
        icon={GitMerge}
        confirmIcon={GitMerge}
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={`Combine these ${rank ? plural(rank, 2) : "taxa"}?`}
        description={
          combined && rank ? (
            <span className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-left">
              {inputs.map((n, i) => (
                <span key={n.id} className="contents">
                  <span className="font-medium text-secondary">
                    {i === 0 ? cap(plural(rank, inputs.length)) : ""}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        italicRank(rank)
                          ? "text-primary italic"
                          : "text-primary"
                      }
                    >
                      {n.name}
                    </span>
                    {nsxOf(n) && (
                      <span className="text-tertiary tabular-nums">
                        {nsxOf(n)}
                      </span>
                    )}
                    <Badge size="sm" color="gray">
                      Superseded
                    </Badge>
                  </span>
                </span>
              ))}
              <span className="col-span-2 my-1 border-t border-secondary" />
              <span className="font-medium text-secondary">Into</span>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    italicRank(rank)
                      ? "font-medium text-primary italic"
                      : "font-medium text-primary"
                  }
                >
                  {combined.name}
                </span>
                <Badge size="sm" color="brand">
                  New
                </Badge>
                <span className="text-tertiary tabular-nums">{nsx}</span>
              </span>
              {childRank && moving.length > 0 && (
                <>
                  <span className="font-medium text-secondary">Moves</span>
                  <span className="text-primary">
                    {moving.length} {plural(childRank, moving.length)}
                    {renamedCount ? ` (${renamedCount} renamed)` : ""}
                  </span>
                </>
              )}
              <span className="col-span-2 my-1 border-t border-secondary" />
              {path
                .slice()
                .reverse()
                .map((a) => (
                  <span key={a.id} className="contents">
                    <span className="text-tertiary">{a.rank}</span>
                    <span
                      className={
                        italicRank(a.rank)
                          ? "text-primary italic"
                          : "text-primary"
                      }
                    >
                      {a.name}
                    </span>
                  </span>
                ))}
            </span>
          ) : undefined
        }
        confirmLabel="Combine"
        onConfirm={() => {
          setConfirming(false);
          commit();
        }}
      />
      <ConfirmationModal
        confirmIcon={Trash01}
        cancelIcon={ArrowLeft}
        isOpen={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Leave this combine?"
        description="What you have filled in will be lost. Nothing has been changed yet."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onConfirm={leave}
      />
    </>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

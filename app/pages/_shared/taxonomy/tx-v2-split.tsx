"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch01, Plus, Trash01 } from "@untitledui/icons";
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
  emptyNameParts,
  type Kingdom,
  type Taxon,
} from "@/app/pages/_shared/taxonomy/tx-data";
import {
  APPEND_RANKS,
  KINGDOM_NAME,
  RANKS,
  TX_V2_ROOT,
  addMoves,
  childId,
  commitHigherSplit,
  infraRanksFor,
  lineage,
  nextNsxCodes,
  nsxOf,
  rankIndex,
  useTaxonNodes,
  type NodeMove,
  type Rank,
  type TaxonNode,
} from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import {
  commitSplit,
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
  nodeHref,
} from "@/app/pages/_shared/taxonomy/tx-v2-list";
import { ValueGrid } from "@/app/pages/_shared/taxonomy/tx-v2-record";
import { useRoleHref } from "@/lib/use-role-href";

// Version 2's Split Taxon (the designer, 14 Oct 2026: "the idea is the same as append"), agreed in wireframes. Borrowed from
// Append Taxon (tx-v2-append.tsx): one page, Taxa Type then Rank, the taxon picked from a search at its rank with every
// rank above it read as label and value, the tree beside the fields, a generated NSX code for each new taxon, and a
// confirmation naming everything before it is saved (0.9).
//
// - One taxon is split into two or more new taxa at the same rank, under the same parent. Every part is a new taxon with a
//   new NSX code, the one that keeps the original name included; the old taxon stops being current and records what it
//   became (version 1's Split does the same: the input is superseded, the outputs are linked to it).
// - What the old taxon holds (the taxa one rank down) must each be moved to one of the new taxa, everything under them
//   going with them. A species moved to a new genus is renamed ("Macropus rufus" becomes "Osphranter rufus") and keeps
//   its old name as a synonym.

type Part = { rank: string; name: string };

/** Tells one split's record of the old taxon from another's. */
const splitStamp = () => Date.now().toString(36);

/** "Species" to "species", "Genus" to "genera": the taxa a rank holds, counted. */
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

export function SplitTaxonForm({
  initialKingdom,
}: {
  initialKingdom: Kingdom | null;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nodes = useTaxonNodes();
  const [kingdom, setKingdom] = useState<Kingdom | null>(initialKingdom);
  const [rank, setRank] = useState<Rank | null>(null);
  const [oldId, setOldId] = useState<string | null>(null);
  const [parts, setParts] = useState<Part[]>([
    { rank: "", name: "" },
    { rank: "", name: "" },
  ]);
  const [moves, setMoves] = useState<Record<string, number>>({});
  const [attempted, setAttempted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const reset = () => {
    setOldId(null);
    setParts([
      { rank: "", name: "" },
      { rank: "", name: "" },
    ]);
    setMoves({});
    setAttempted(false);
  };

  const kingdomId = kingdom ? KINGDOM_NAME[kingdom] : null;
  const path = lineage(nodes, oldId);
  const old = path[path.length - 1];
  const parent = path[path.length - 2];
  const nameAt = (r: Rank) =>
    r === "Kingdom" && kingdom
      ? KINGDOM_NAME[kingdom]
      : (path.find((a) => a.rank === r)?.name ?? "");
  const children = old
    ? nodes
        .filter((n) => n.parentId === old.id && n.current)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const childRank =
    rank && rank !== "Infraspecies" ? RANKS[rankIndex(rank) + 1] : null;
  const floraInfra = rank === "Infraspecies" && kingdom === "Flora";

  // ── The new taxa ──
  const fullName = (p: Part) => {
    if (!rank || !parent || !p.name.trim()) return "";
    if (rank === "Species") return `${parent.name} ${tidy("Species", p.name)}`;
    if (rank === "Infraspecies")
      return floraInfra
        ? p.rank
          ? `${parent.name} ${p.rank} ${tidy("Infraspecies", p.name)}`
          : ""
        : `${parent.name} ${tidy("Infraspecies", p.name)}`;
    return tidy(rank, p.name);
  };
  const names = parts.map(fullName);
  const codes =
    old && kingdom
      ? nextNsxCodes(nodes, old.parentId, kingdom, parts.length)
      : [];
  const made =
    old && kingdom && rank
      ? names.map((name, i) => ({
          id: childId(old.parentId, name),
          rank,
          name,
          parentId: old.parentId!,
          kingdom,
          nsx: codes[i],
        }))
      : [];

  /** What a held taxon is called once moved under a new taxon: a species under a new genus takes the genus' name. */
  const renamed = (c: TaxonNode, to: string) =>
    old && c.name.startsWith(`${old.name} `)
      ? `${to}${c.name.slice(old.name.length)}`
      : c.name;

  // ── What is missing or wrong ──
  const missing: string[] = [];
  if (!kingdom) missing.push("Taxa Type");
  if (!rank) missing.push("Rank");
  if (rank && !old) missing.push(`The ${rank.toLowerCase()} to split`);
  if (old && names.some((n) => !n))
    missing.push(
      floraInfra
        ? "A rank and name for every new taxon"
        : "A name for every new taxon",
    );
  if (
    old &&
    children.some((c) => moves[c.id] === undefined || !names[moves[c.id]])
  )
    missing.push(`Where each ${childRank?.toLowerCase()} goes`);
  const clash = (() => {
    if (!old || !rank) return undefined;
    const filled = names.filter(Boolean);
    const twice = filled.find((n, i) => filled.indexOf(n) !== i);
    if (twice) return `${twice} is named twice`;
    for (const m of made.filter((x) => x.name)) {
      if (m.id === old.id) continue;
      if (nodes.some((n) => n.id === m.id))
        return `${m.name} is already in the taxonomy`;
      if (
        rankIndex(rank) < rankIndex("Species") &&
        nodes.some(
          (n) =>
            n.kingdom === kingdom &&
            n.rank === rank &&
            n.name === m.name &&
            n.id !== old.id,
        )
      )
        return `${m.name} is already a ${rank.toLowerCase()}`;
    }
    return undefined;
  })();
  const problems =
    attempted && (missing.length || clash)
      ? { items: missing.length ? missing : [clash!] }
      : undefined;

  const commit = () => {
    if (!old || !kingdom || !rank || !parent) return;
    const stamp = splitStamp();
    const targets = made;
    // Species records under what moves are renamed in the taxonomy store; everything else is moved in the hierarchy.
    const nodeMoves: NodeMove[] = children.map((c) => ({
      fromId: c.id,
      toParentId: targets[moves[c.id]].id,
      name: renamed(c, targets[moves[c.id]].name),
    }));
    const retarget: {
      id: string;
      scientific: string;
      ranks: Taxon["ranks"];
    }[] = [];
    for (const c of children) {
      const to = targets[moves[c.id]];
      for (const n of nodes.filter(
        (x) => x.taxon && (x.id === c.id || x.id.startsWith(`${c.id}/`)),
      )) {
        const t = n.taxon!;
        const field = { Order: "order", Family: "family", Genus: "genus" }[
          rank as "Order" | "Family" | "Genus"
        ];
        retarget.push({
          id: t.id,
          scientific: t.scientific.startsWith(`${old.name} `)
            ? `${to.name}${t.scientific.slice(old.name.length)}`
            : t.scientific,
          ranks: field ? { ...t.ranks, [field]: to.name } : t.ranks,
        });
      }
    }

    if (old.taxon) {
      // A species or infraspecies record: version 1's split makes the new records, linked to the old one.
      const t = old.taxon;
      const outputs = parts.map((p, i) => {
        const words = names[i].split(" ");
        const base = {
          ...emptyNameParts(),
          nsx: codes[i],
          genus: t.ranks.genus,
          order: t.ranks.order,
          family: t.ranks.family,
        };
        return rank === "Species"
          ? { ...base, species: words[1] }
          : {
              ...base,
              species: words[1],
              infra: [
                {
                  rank: floraInfra ? p.rank : "",
                  name: words[words.length - 1],
                },
                { rank: "", name: "" },
                { rank: "", name: "" },
              ],
            };
      });
      if (!commitSplit(t.id, outputs)) {
        toast.error("That split could not be made", {
          description: "The preview has run out of room for new taxa.",
        });
        return;
      }
      addMoves(nodeMoves);
    } else {
      const recordId = `${old.id}#split-${stamp}`;
      commitHigherSplit({
        record: {
          id: recordId,
          rank,
          name: old.name,
          parentId: old.parentId!,
          kingdom,
          nsx: nsxOf(old),
          createdOn: old.createdOn,
          createdBy: old.createdBy,
          current: false,
          became: targets.map((m) => m.id),
        },
        made: targets.map((m) => ({
          ...m,
          createdOn: today(),
          createdBy: CURRENT_USER_NAME,
          cameFrom: [recordId],
        })),
        moves: nodeMoves,
        retire: old.id,
      });
    }
    retargetTaxa(retarget);
    toast.success(`${rank} split`, {
      description: `${old.name} into ${targets.map((m) => m.name).join(", ")}`,
    });
    router.push(roleHref(nodeHref(targets[0].id)));
  };

  const onSplit = () => {
    if (missing.length || clash) return setAttempted(true);
    setConfirming(true);
  };

  const touched = !!(kingdom !== initialKingdom || rank || oldId);
  const leave = () =>
    router.push(
      roleHref(kingdom ? `${TX_V2_ROOT}?kingdom=${kingdom}` : TX_V2_ROOT),
    );

  // ── The tree: the path to the taxon being split, the taxa beside it at each rank, and the new taxa among them ──
  const tree = (() => {
    if (!kingdom || !kingdomId) return null;
    const route = oldId ? path : nodes.filter((n) => n.id === kingdomId);
    const routeIds = new Set(route.map((n) => n.id));
    const list = nodes.filter(
      (n) => routeIds.has(n.id) || (n.parentId && routeIds.has(n.parentId)),
    );
    const fresh = made.filter(
      (m) => m.name && !list.some((n) => n.id === m.id),
    );
    for (const m of fresh) list.push({ ...m, current: true });
    return {
      list,
      expanded: [...routeIds].filter((id) => id !== oldId),
      newIds: new Set(fresh.map((m) => m.id)),
    };
  })();

  const rankLabel = rank ? rank.toLowerCase() : "taxon";
  const above = path.slice(0, -1).reverse();
  const moveSummary = made
    .map((m, i) => ({ m, held: children.filter((c) => moves[c.id] === i) }))
    .filter((x) => x.held.length && x.m.name)
    .map(
      ({ m, held }) =>
        `${held.length} ${plural(childRank!, held.length)} to ${m.name}${held.some((c) => renamed(c, m.name) !== c.name) ? " (renamed)" : ""}`,
    );

  return (
    <>
      <FormPage
        title="Split Taxon"
        subtitle={`Divide one ${rankLabel} into two or more.`}
        onCancel={() => (touched ? setConfirmLeave(true) : leave())}
        problems={problems}
        primaryLabel="Split"
        primaryIcon={GitBranch01}
        onPrimary={onSplit}
      >
        <WithHierarchy
          panel={
            tree ? (
              <FieldCard title="Hierarchy">
                {tree && (
                  <NodeTree
                    key={`${oldId}:${[...tree.newIds].join("|")}`}
                    label={`The ${rankLabel} being split`}
                    nodes={tree.list}
                    expanded={tree.expanded}
                    highlightId={oldId}
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
              description="The rank of the taxon to split."
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
              title="Taxon to split"
              required
              description={`Choose the ${rankLabel}: every rank above it fills in.`}
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
                <TaxonPicker
                  key={`${kingdom}:${rank}`}
                  rank={rank}
                  kingdom={kingdom}
                  nodes={nodes}
                  value={oldId}
                  onChange={(id) => {
                    setOldId(id);
                    setMoves({});
                  }}
                  showError={attempted}
                  missingHint={`Choose the ${rankLabel} to split`}
                  emptyHint="Only a current taxon can be split."
                />
              </div>
            </FormRow>
          )}

          {old && rank && (
            <FormRow
              title="New taxa"
              required
              description={`Each new ${rankLabel} gets its own NSX code.`}
            >
              <div className="flex max-w-[560px] flex-col gap-3">
                {parts.map((p, i) => (
                  <div
                    key={i}
                    className={
                      floraInfra
                        ? "grid grid-cols-[104px_minmax(0,1fr)_auto_36px] items-start gap-2"
                        : "grid grid-cols-[minmax(0,1fr)_auto_36px] items-start gap-2"
                    }
                  >
                    {floraInfra && (
                      <Select
                        size="sm"
                        aria-label={`New taxon ${i + 1} rank`}
                        placeholder="Rank"
                        items={infraRanksFor(kingdom!).map((o) => ({
                          id: o,
                          label: o,
                        }))}
                        selectedKey={p.rank || null}
                        onSelectionChange={(k) =>
                          setParts(
                            parts.map((x, j) =>
                              j === i ? { ...x, rank: String(k ?? "") } : x,
                            ),
                          )
                        }
                        isInvalid={attempted && !p.rank}
                      >
                        {(item) => (
                          <Select.Item {...item}>{item.label}</Select.Item>
                        )}
                      </Select>
                    )}
                    <Input
                      size="sm"
                      aria-label={`New taxon ${i + 1} name`}
                      placeholder={
                        rank === "Species"
                          ? "Species epithet"
                          : rank === "Infraspecies"
                            ? "Infraspecific name"
                            : `${rank} name`
                      }
                      value={p.name}
                      onChange={(v) =>
                        setParts(
                          parts.map((x, j) =>
                            j === i ? { ...x, name: v } : x,
                          ),
                        )
                      }
                      isInvalid={attempted && !p.name.trim()}
                    />
                    <span className="pt-2 text-sm text-tertiary tabular-nums">
                      {codes[i]}
                    </span>
                    {parts.length > 2 ? (
                      <Button
                        color="tertiary"
                        size="sm"
                        iconLeading={Trash01}
                        aria-label={`Remove new taxon ${i + 1}`}
                        onClick={() => {
                          setParts(parts.filter((_, j) => j !== i));
                          setMoves(
                            Object.fromEntries(
                              Object.entries(moves)
                                .filter(([, v]) => v !== i)
                                .map(([k, v]) => [k, v > i ? v - 1 : v]),
                            ),
                          );
                        }}
                      />
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
                <div>
                  <Button
                    color="link-color"
                    size="sm"
                    iconLeading={Plus}
                    onClick={() => setParts([...parts, { rank: "", name: "" }])}
                  >
                    Add another {rankLabel}
                  </Button>
                </div>
                {clash && <p className="text-sm text-error-primary">{clash}</p>}
              </div>
            </FormRow>
          )}

          {old && rank && childRank && children.length > 0 && (
            <FormRow
              title="What it holds"
              required
              description={`${children.length} ${plural(childRank, children.length)}: choose where each goes. Everything under it goes with it.`}
            >
              <div className="flex max-w-[560px] flex-col gap-3">
                {children.map((c) => {
                  const to =
                    moves[c.id] !== undefined ? made[moves[c.id]] : undefined;
                  const next = to?.name ? renamed(c, to.name) : "";
                  return (
                    <div
                      key={c.id}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3"
                    >
                      <div className="flex min-w-0 flex-col gap-0.5 pt-2">
                        <span
                          className={
                            italicRank(c.rank)
                              ? "text-sm text-primary italic"
                              : "text-sm text-primary"
                          }
                        >
                          {c.name}
                        </span>
                        {next && next !== c.name && (
                          <span className="text-xs text-tertiary">
                            Becomes <span className="italic">{next}</span>
                          </span>
                        )}
                      </div>
                      <Select
                        size="sm"
                        aria-label={`Where ${c.name} goes`}
                        placeholder="Choose"
                        items={made.map((m, i) => ({
                          id: String(i),
                          label: m.name || `New ${rankLabel} ${i + 1}`,
                          isDisabled: !m.name,
                        }))}
                        selectedKey={
                          moves[c.id] !== undefined ? String(moves[c.id]) : null
                        }
                        onSelectionChange={(k) =>
                          setMoves({ ...moves, [c.id]: Number(k) })
                        }
                        isInvalid={attempted && moves[c.id] === undefined}
                      >
                        {(item) => (
                          <Select.Item {...item}>{item.label}</Select.Item>
                        )}
                      </Select>
                    </div>
                  );
                })}
              </div>
            </FormRow>
          )}
        </WithHierarchy>
      </FormPage>

      <ConfirmationModal
        icon={GitBranch01}
        confirmIcon={GitBranch01}
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={`Split this ${rankLabel}?`}
        description={
          old && rank ? (
            <span className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-left">
              <span className="font-medium text-secondary">{rank}</span>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    italicRank(rank)
                      ? "font-medium text-primary italic"
                      : "font-medium text-primary"
                  }
                >
                  {old.name}
                </span>
                {nsxOf(old) && (
                  <span className="text-tertiary tabular-nums">
                    {nsxOf(old)}
                  </span>
                )}
                <Badge size="sm" color="gray">
                  Superseded
                </Badge>
              </span>
              <span className="col-span-2 my-1 border-t border-secondary" />
              {made.map((m, i) => (
                <span key={m.id} className="contents">
                  <span className="font-medium text-secondary">
                    {i === 0 ? "Into" : ""}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        italicRank(rank)
                          ? "text-primary italic"
                          : "text-primary"
                      }
                    >
                      {m.name}
                    </span>
                    <Badge size="sm" color="brand">
                      New
                    </Badge>
                    <span className="text-tertiary tabular-nums">{m.nsx}</span>
                  </span>
                </span>
              ))}
              {moveSummary.map((line, i) => (
                <span key={line} className="contents">
                  <span className="font-medium text-secondary">
                    {i === 0 ? "Moves" : ""}
                  </span>
                  <span className="text-primary">{line}</span>
                </span>
              ))}
              <span className="col-span-2 my-1 border-t border-secondary" />
              {above.map((a) => (
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
        confirmLabel="Split"
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
        title="Leave this split?"
        description="What you have filled in will be lost. Nothing has been changed yet."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onConfirm={leave}
      />
    </>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash01 } from "@untitledui/icons";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import {
  RadioButton,
  RadioGroup,
} from "@/components/base/radio-buttons/radio-buttons";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { CURRENT_USER_NAME } from "@/app/pages/_shared/agreement-scope";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import {
  FieldCard,
  SpeciesTypeField,
} from "@/app/pages/_shared/taxonomy/tx-actions";
import { TX_ROOT, type Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import {
  nodeHref,
  APPEND_RANKS,
  KINGDOM_NAME,
  RANKS,
  addHigherTaxa,
  ancestorAt,
  childId,
  groupOf,
  infraRanksFor,
  lineage,
  nextNsx,
  rankIndex,
  useTaxonNodes,
  type Rank,
  type TaxonNode,
} from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { commitAppendTaxon } from "@/app/pages/_shared/taxonomy/tx-store";
import {
  NodeTree,
  WithHierarchy,
  italicRank,
} from "@/app/pages/_shared/taxonomy/tx-v2-list";
import { ValueGrid } from "@/app/pages/_shared/taxonomy/tx-v2-record";
import { useRoleHref } from "@/lib/use-role-href";

// Version 2's Append (the designer, 14 Oct 2026): version 1's three steps on one page, and a taxon of any of Order, Family,
// Genus, Species or Infraspecies. Borrowed from version 1's Append (tx-flows.tsx, retired on 26 Oct 2026): FormPage, FormRow, the Taxa Type
// field, the FieldCard around a group, and the Taxonomy View's tree (0.9).
//
// One append adds one taxon (the designer: "the higher rank is used just to map the newly added under the selected rank"):
// - The rank just above the new taxon is the one choice: a search of the taxa already at that rank. Picking one fills in
//   every rank above it, read as label and value like a record (not as disabled fields), and the tree beside the fields
//   opens to it, highlighted, with the taxa beside it at each rank and the new one marked New among its siblings.
// - The new taxon's name is a text box, checked against the taxa already there.
// - Searching species can mean thousands of names, so that search is looked up as you type, with a "Searching species" row
//   while it runs (simulated here: there is no backend), and shows at most 20 matches.
// - Every append is given a new NSX code (tx-hierarchy.ts nextNsx), and is always confirmed first: the new taxon, its
//   rank and code, and every rank above it, named.

const LOOKUP_DELAY = 350;
const LOOKUP_LIMIT = 20;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A higher taxon's name is one word with a capital; a species' or infraspecies' epithet is one word, lower case. */
export const tidy = (rank: Rank, value: string) => {
  const v = value.trim().split(/\s+/).pop() ?? "";
  return rankIndex(rank) >= rankIndex("Species")
    ? v.toLowerCase()
    : cap(v.toLowerCase());
};

export const today = () =>
  new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** A search of the current taxa at one rank: Append's parent, Split's taxon to split. */
export function TaxonPicker({
  rank,
  kingdom,
  nodes,
  value,
  onChange,
  showError,
  missingHint,
  emptyHint,
  label,
  within,
  exclude = [],
}: {
  rank: Rank;
  kingdom: Kingdom;
  nodes: TaxonNode[];
  value: string | null;
  onChange: (id: string) => void;
  showError: boolean;
  missingHint?: string;
  emptyHint?: string;
  /** The field's label; the rank by default. */
  label?: string;
  /** Only the taxa under this parent (Combine: the taxa beside the first one picked). */
  within?: string | null;
  /** Taxa already chosen elsewhere. */
  exclude?: string[];
}) {
  const pool = useMemo(
    () =>
      nodes
        .filter(
          (n) =>
            n.kingdom === kingdom &&
            n.rank === rank &&
            n.current &&
            (within === undefined || n.parentId === within) &&
            (n.id === value || !exclude.includes(n.id)),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [nodes, kingdom, rank, within, exclude, value],
  );
  const looksUp = rank === "Species";
  const [query, setQuery] = useState("");
  const [settled, setSettled] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loading = looksUp && query.trim() !== settled.trim();
  const q = settled.trim().toLowerCase();
  const found = looksUp
    ? pool
        .filter(
          (n) =>
            !q ||
            n.name.toLowerCase().includes(q) ||
            (n.taxon?.common ?? "").toLowerCase().includes(q),
        )
        .slice(0, LOOKUP_LIMIT)
    : pool;
  const picked = pool.find((n) => n.id === value);
  const above = RANKS[rankIndex(rank) - 1];
  const context = (n: TaxonNode) =>
    (rank === "Species"
      ? n.taxon?.common || ancestorAt(nodes, n.id, "Family")?.name
      : ancestorAt(nodes, n.parentId, above)?.name) ?? "";
  const items = [
    ...(picked && !found.includes(picked) ? [picked] : []),
    ...found,
  ].map((n) => ({ id: n.id, label: n.name, supportingText: context(n) }));
  const missing = showError && !value;

  return (
    <MultiSelect
      label={label ?? rank}
      isRequired
      selectionMode="single"
      size="sm"
      placeholder={`Search ${rank === "Species" ? "species" : `${rank.toLowerCase()} names`}`}
      items={items}
      selectedKeys={new Set(value ? [value] : [])}
      onSelectionChange={(keys) => {
        const id =
          keys === "all" ? undefined : String(Array.from(keys)[0] ?? "");
        if (id) onChange(id);
      }}
      filterItems={!looksUp}
      onSearchChange={
        looksUp
          ? (v) => {
              setQuery(v);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setSettled(v), LOOKUP_DELAY);
            }
          : undefined
      }
      isLoading={loading}
      loadingLabel="Searching species"
      emptyStateTitle={`No ${rank.toLowerCase()} matches`}
      emptyStateDescription={
        emptyHint ??
        `Append the ${rank.toLowerCase()} first if it is not in the taxonomy yet.`
      }
      isInvalid={missing}
      hint={
        missing
          ? (missingHint ??
            `Choose the ${rank.toLowerCase()} the new taxon belongs to`)
          : undefined
      }
    >
      {(item) => <MultiSelect.Item {...item} />}
    </MultiSelect>
  );
}

export function AppendTaxonForm({
  initialKingdom,
}: {
  initialKingdom: Kingdom | null;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nodes = useTaxonNodes();
  const [kingdom, setKingdom] = useState<Kingdom | null>(initialKingdom);
  const [rank, setRank] = useState<Rank | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [infra, setInfra] = useState<{ rank: string; name: string }[]>([
    { rank: "", name: "" },
  ]);
  const [attempted, setAttempted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const reset = () => {
    setParentId(null);
    setName("");
    setInfra([{ rank: "", name: "" }]);
    setAttempted(false);
  };

  const parentRank = rank ? RANKS[rankIndex(rank) - 1] : null;
  const kingdomId = kingdom ? KINGDOM_NAME[kingdom] : null;
  const path = lineage(nodes, parentId);
  const parent = path[path.length - 1];
  const nameAt = (r: Rank) =>
    r === "Kingdom" && kingdom
      ? KINGDOM_NAME[kingdom]
      : (path.find((a) => a.rank === r)?.name ?? "");

  // ── The new taxon ──
  const infraFilled = infra.filter((x) => x.name.trim());
  const targetName =
    !rank || !parent
      ? ""
      : rank === "Species"
        ? name.trim() && `${parent.name} ${tidy("Species", name)}`
        : rank === "Infraspecies"
          ? infraFilled.length && infraFilled.every((x) => x.rank)
            ? [
                parent.name,
                ...infraFilled.map(
                  (x) => `${x.rank} ${tidy("Infraspecies", x.name)}`,
                ),
              ].join(" ")
            : ""
          : name.trim() && tidy(rank, name);
  const target =
    rank && parent && kingdom && targetName
      ? {
          rank,
          name: targetName,
          id: childId(parent.id, targetName),
          parentId: parent.id,
          kingdom,
        }
      : null;
  const nsx = target ? nextNsx(nodes, target.parentId, target.kingdom) : null;

  // ── What is missing or wrong ──
  const clash = (() => {
    if (!target) return undefined;
    if (nodes.some((n) => n.id === target.id))
      return `${target.name} is already in the taxonomy`;
    if (rankIndex(target.rank) < rankIndex("Species")) {
      const same = nodes.find(
        (n) =>
          n.kingdom === target.kingdom &&
          n.rank === target.rank &&
          n.name === target.name,
      );
      if (same)
        return `${target.name} is already a ${target.rank.toLowerCase()}, under ${ancestorAt(nodes, same.parentId, RANKS[rankIndex(target.rank) - 1])?.name ?? KINGDOM_NAME[same.kingdom]}`;
    }
    return undefined;
  })();
  const missing: string[] = [];
  if (!kingdom) missing.push("Taxa Type");
  if (!rank) missing.push("Rank");
  if (rank && parentRank && !parent) missing.push(parentRank);
  if (
    rank === "Infraspecies" &&
    (!infraFilled.length || infraFilled.some((x) => !x.rank))
  )
    missing.push("Infraspecific rank and name");
  else if (rank && rank !== "Infraspecies" && !name.trim())
    missing.push(`New ${rank.toLowerCase()} name`);
  const problems =
    attempted && (missing.length || clash)
      ? { items: missing.length ? missing : [clash!] }
      : undefined;

  const commit = () => {
    if (!target || !nsx) return;
    if (rankIndex(target.rank) < rankIndex("Species")) {
      addHigherTaxa([
        { ...target, nsx, createdOn: today(), createdBy: CURRENT_USER_NAME },
      ]);
    } else {
      const change = commitAppendTaxon({
        kingdom: target.kingdom,
        group:
          groupOf(nodes, parent!) ??
          (target.kingdom === "Flora" ? "Plant" : "Mammal"),
        scientific: target.name,
        ranks: {
          phylum: nameAt("Phylum"),
          cls: nameAt("Class"),
          order: nameAt("Order"),
          family: nameAt("Family"),
          genus: nameAt("Genus"),
        },
        nsx,
        infra:
          target.rank === "Infraspecies"
            ? infraFilled.map((x) => ({
                rank: x.rank,
                name: tidy("Infraspecies", x.name),
              }))
            : [],
      });
      if (!change) {
        toast.error("That taxon could not be appended", {
          description: "The preview has run out of room for new taxa.",
        });
        return;
      }
    }
    toast.success(`${target.rank} appended`, {
      description: `${target.name}, ${nsx}`,
    });
    router.push(roleHref(nodeHref(target.id)));
  };

  const onAppend = () => {
    if (missing.length || clash) return setAttempted(true);
    setConfirming(true);
  };

  const touched = !!(kingdom !== initialKingdom || rank || name || parentId);
  const leave = () =>
    router.push(
      roleHref(kingdom ? `${TX_ROOT}?kingdom=${kingdom}` : TX_ROOT),
    );

  // ── The tree beside the fields: the path to the chosen taxon, the taxa beside it at each rank, the new one among them ──
  const tree = (() => {
    if (!kingdom || !kingdomId) return null;
    const route = parentId ? path : nodes.filter((n) => n.id === kingdomId);
    const routeIds = new Set(route.map((n) => n.id));
    const list = nodes.filter(
      (n) => routeIds.has(n.id) || (n.parentId && routeIds.has(n.parentId)),
    );
    // Once appended, the taxon is in the data itself; drawing it twice would give the tree two items with one id.
    if (target && !list.some((n) => n.id === target.id))
      list.push({
        id: target.id,
        rank: target.rank,
        name: target.name,
        parentId: target.parentId,
        kingdom,
        current: true,
      });
    return { list, expanded: [...routeIds] };
  })();

  const rankLabel = rank ? rank.toLowerCase() : "taxon";
  const above = path.slice().reverse();

  return (
    <>
      <FormPage
        title="Append Taxon"
        subtitle={`Add a new ${rankLabel} to the hierarchy.`}
        onCancel={() => (touched ? setConfirmLeave(true) : leave())}
        problems={problems}
        primaryLabel="Append"
        primaryIcon={Plus}
        onPrimary={onAppend}
      >
        <WithHierarchy
          panel={
            tree ? (
              <FieldCard title="Hierarchy">
                {tree && (
                  <NodeTree
                    key={`${parentId}:${target?.id ?? ""}`}
                    label={`Where the new ${rankLabel} sits`}
                    nodes={tree.list}
                    expanded={tree.expanded}
                    highlightId={parentId}
                    newIds={target ? new Set([target.id]) : undefined}
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
                reset();
              }}
              showError={attempted}
            />
          </FormRow>

          {kingdom && (
            <FormRow
              title="Rank"
              required
              description="The rank of the new taxon."
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

          {kingdom && rank && parentRank && (
            <FormRow
              title="Hierarchy"
              required
              description={`Choose the ${parentRank.toLowerCase()} it belongs to: every rank above it fills in.`}
            >
              <div className="flex max-w-[560px] flex-col gap-5">
                <ValueGrid
                  className="sm:grid-cols-2"
                  items={RANKS.slice(0, rankIndex(parentRank)).map((r) => ({
                    label: r,
                    value: nameAt(r),
                    italic: italicRank(r),
                  }))}
                />
                <TaxonPicker
                  key={`${kingdom}:${parentRank}`}
                  rank={parentRank}
                  kingdom={kingdom}
                  nodes={nodes}
                  value={parentId}
                  onChange={setParentId}
                  showError={attempted}
                />

                {rank === "Infraspecies" ? (
                  <>
                    {infra.map((x, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <Label
                          isRequired={i === 0}
                          isInvalid={
                            attempted && i === 0 && (!x.rank || !x.name.trim())
                          }
                        >
                          Infraspecific {i + 1}
                        </Label>
                        <div
                          className={
                            i > 0
                              ? "grid grid-cols-[104px_minmax(0,1fr)_auto] items-start gap-2"
                              : "grid grid-cols-[104px_minmax(0,1fr)] items-start gap-2"
                          }
                        >
                          <Select
                            size="sm"
                            aria-label={`Infraspecific ${i + 1} rank`}
                            placeholder="Rank"
                            items={infraRanksFor(kingdom).map((o) => ({
                              id: o,
                              label: o,
                            }))}
                            selectedKey={x.rank || null}
                            onSelectionChange={(k) =>
                              setInfra(
                                infra.map((y, j) =>
                                  j === i ? { ...y, rank: String(k ?? "") } : y,
                                ),
                              )
                            }
                            isInvalid={attempted && i === 0 && !x.rank}
                          >
                            {(item) => (
                              <Select.Item {...item}>{item.label}</Select.Item>
                            )}
                          </Select>
                          <Input
                            size="sm"
                            aria-label={`Infraspecific ${i + 1} name`}
                            placeholder="New name"
                            value={x.name}
                            onChange={(v) =>
                              setInfra(
                                infra.map((y, j) =>
                                  j === i ? { ...y, name: v } : y,
                                ),
                              )
                            }
                            isInvalid={attempted && i === 0 && !x.name.trim()}
                          />
                          {i > 0 && (
                            <Button
                              color="tertiary"
                              size="sm"
                              iconLeading={Trash01}
                              aria-label={`Remove infraspecific ${i + 1}`}
                              onClick={() =>
                                setInfra(infra.filter((_, j) => j !== i))
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    {infra.length < 3 && (
                      <div>
                        <Button
                          color="link-color"
                          size="sm"
                          iconLeading={Plus}
                          onClick={() =>
                            setInfra([...infra, { rank: "", name: "" }])
                          }
                        >
                          Add infraspecific {infra.length + 1}
                        </Button>
                      </div>
                    )}
                    {clash && (
                      <p className="text-sm text-error-primary">{clash}</p>
                    )}
                  </>
                ) : (
                  <Input
                    size="sm"
                    label={`New ${rankLabel}`}
                    isRequired
                    placeholder={
                      rank === "Species" ? "Species epithet" : `${rank} name`
                    }
                    value={name}
                    onChange={setName}
                    isInvalid={(attempted && !name.trim()) || !!clash}
                    hint={
                      clash ??
                      (attempted && !name.trim()
                        ? `Enter the new ${rankLabel}'s name`
                        : undefined)
                    }
                  />
                )}
              </div>
            </FormRow>
          )}
        </WithHierarchy>
      </FormPage>

      <ConfirmationModal
        confirmIcon={Plus}
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={`Append this ${rankLabel}?`}
        description={
          target && nsx ? (
            <span className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-left">
              <span className="font-medium text-secondary">{target.rank}</span>
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    italicRank(target.rank)
                      ? "font-medium text-primary italic"
                      : "font-medium text-primary"
                  }
                >
                  {target.name}
                </span>
                <Badge size="sm" color="brand">
                  New
                </Badge>
              </span>
              <span className="font-medium text-secondary">New NSX code</span>
              <span className="text-primary tabular-nums">{nsx}</span>
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
        confirmLabel="Append"
        onConfirm={() => {
          setConfirming(false);
          commit();
        }}
      />
      <DestructiveModal
        confirmIcon={Trash01}
        cancelIcon={ArrowLeft}
        isOpen={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Leave this append?"
        description="What you have filled in will be lost. Nothing has been changed yet."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onConfirm={leave}
      />
    </>
  );
}

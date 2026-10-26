"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit05, Trash01 } from "@untitledui/icons";
import { ConfirmationModal } from "@/components/application/modals/modal";
import { toast } from "@/components/application/toast/toast";
import { Input } from "@/components/base/input/input";
import {
  RadioButton,
  RadioGroup,
} from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { FormPage } from "@/app/pages/_shared/form-page";
import { FormRow } from "@/app/pages/_shared/form-row";
import {
  FieldCard,
  SpeciesTypeField,
} from "@/app/pages/_shared/taxonomy/tx-actions";
import { TX_ROOT, type Kingdom, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { NOT_PROVIDED } from "@/app/pages/_shared/taxonomy/tx-fields";
import {
  nodeHref,
  APPEND_RANKS,
  KINGDOM_NAME,
  RANKS,
  addMoves,
  childId,
  infraRanksFor,
  lineage,
  nsxOf,
  rankIndex,
  useTaxonNodes,
  type Rank,
  type TaxonNode,
} from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { retargetTaxa } from "@/app/pages/_shared/taxonomy/tx-store";
import { TaxonPicker, tidy } from "@/app/pages/_shared/taxonomy/tx-v2-append";
import {
  NodeTree,
  WithHierarchy,
  italicRank,
} from "@/app/pages/_shared/taxonomy/tx-v2-list";
import { ValueGrid } from "@/app/pages/_shared/taxonomy/tx-v2-record";
import { useRoleHref } from "@/lib/use-role-href";

// Version 2's Rename Taxon (the designer, 14 Oct 2026), agreed in wireframes, built as Append, Split and Combine are (0.9):
// one page, Taxa Type then Rank, the taxon picked from a search at its rank with the ranks above it as label and value,
// the tree beside the fields, and a confirmation naming everything before it is saved.
//
// - Unlike Split and Combine it is the same taxon under a new name: it keeps its NSX code and its records, and a species
//   record keeps its old name as a synonym (version 1's Rename does the same).
// - Rename changes the name only (the designer, 15 Oct 2026: moving was not asked for). The one exception is a species or an
//   infraspecies, whose name holds its genus or species: changing that part ("Macropus rufus" to "Osphranter rufus") is a
//   name change, as version 1's Rename (Figma: New Genus, New Species) allows. So for those two ranks the genus or species is
//   offered beside the last word, starting as the current one; an order, family or genus keeps its parent.
// - Only species and infraspecies names hold another name (the genus, the species), so renaming or moving a genus renames
//   the species and infraspecies under it, and a species its infraspecies. These are listed before anything is saved.
// - A new name that is already in the taxonomy, there or anywhere a moved taxon would land, blocks the rename.

type Fields = { parentId: string | null; name: string; infraRank: string };

/** The part of a taxon's name that Rename edits: a higher taxon's whole name, a species' or infraspecies' last word. */
const ownPart = (n: TaxonNode) =>
  rankIndex(n.rank) >= rankIndex("Species")
    ? (n.name.split(" ").pop() ?? "")
    : n.name;
/** A flora infraspecies' rank word ("subsp."), the second last word of its name. */
const infraRankOf = (n: TaxonNode) =>
  n.rank === "Infraspecies" ? (n.name.split(" ").slice(-2, -1)[0] ?? "") : "";

export function RenameTaxonForm({
  initialKingdom,
}: {
  initialKingdom: Kingdom | null;
}) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const nodes = useTaxonNodes();
  const [kingdom, setKingdom] = useState<Kingdom | null>(initialKingdom);
  const [rank, setRank] = useState<Rank | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [fields, setFields] = useState<Fields>({
    parentId: null,
    name: "",
    infraRank: "",
  });
  const [attempted, setAttempted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const reset = () => {
    setTargetId(null);
    setFields({ parentId: null, name: "", infraRank: "" });
    setAttempted(false);
  };

  const kingdomId = kingdom ? KINGDOM_NAME[kingdom] : null;
  const path = lineage(nodes, targetId);
  const target = path[path.length - 1];
  const nameAt = (r: Rank) =>
    r === "Kingdom" && kingdom
      ? KINGDOM_NAME[kingdom]
      : (path.find((a) => a.rank === r)?.name ?? "");
  const parentRank = rank ? RANKS[rankIndex(rank) - 1] : null;
  const floraInfra = rank === "Infraspecies" && kingdom === "Flora";
  /** Only a species' or an infraspecies' name holds its parent's, so only there can the parent be changed. */
  const nameHoldsParent = rank === "Species" || rank === "Infraspecies";
  const newParentPath = lineage(nodes, fields.parentId);
  const newParent = newParentPath[newParentPath.length - 1];

  // ── The new name, and where it lands ──
  const newName = (() => {
    if (!rank || !newParent || !fields.name.trim()) return "";
    if (rank === "Species")
      return `${newParent.name} ${tidy("Species", fields.name)}`;
    if (rank === "Infraspecies")
      return floraInfra
        ? fields.infraRank
          ? `${newParent.name} ${fields.infraRank} ${tidy("Infraspecies", fields.name)}`
          : ""
        : `${newParent.name} ${tidy("Infraspecies", fields.name)}`;
    return tidy(rank, fields.name);
  })();
  const newId = newParent && newName ? childId(newParent.id, newName) : null;
  const moved = !!target && !!newParent && newParent.id !== target.parentId;
  const changed = !!target && !!newId && newId !== target.id;

  // ── Everything under it moves with it; the names that start with its name change ──
  const subtree = target
    ? nodes.filter((n) => n.id.startsWith(`${target.id}/`))
    : [];
  const after = (n: TaxonNode) =>
    target && newName && n.name.startsWith(`${target.name} `)
      ? `${newName}${n.name.slice(target.name.length)}`
      : n.name;
  const renamedBelow = subtree.filter((n) => after(n) !== n.name);

  // ── What is missing or wrong ──
  const missing: string[] = [];
  if (!kingdom) missing.push("Taxa Type");
  if (!rank) missing.push("Rank");
  if (rank && !target) missing.push(`The ${rank.toLowerCase()} to rename`);
  if (target && !newName)
    missing.push(floraInfra ? "The new rank and name" : "The new name");
  if (target && newName && !changed)
    missing.push(
      `A new name${parentRank ? ` or another ${parentRank.toLowerCase()}` : ""}`,
    );
  const wrong = (() => {
    if (!target || !newId || !changed || !rank) return undefined;
    if (nodes.some((n) => n.id === newId))
      return `${newName} is already in the taxonomy`;
    if (
      rankIndex(rank) < rankIndex("Species") &&
      newName !== target.name &&
      nodes.some(
        (n) => n.kingdom === kingdom && n.rank === rank && n.name === newName,
      )
    )
      return `${newName} is already a ${rank.toLowerCase()}`;
    const taken = renamedBelow.find((n) =>
      nodes.some(
        (x) =>
          x.rank === n.rank &&
          x.name === after(n) &&
          !x.id.startsWith(`${target.id}/`),
      ),
    );
    if (taken)
      return `${after(taken)} is already in the taxonomy: rename it first`;
    return undefined;
  })();
  const problems =
    attempted && (missing.length || wrong)
      ? { items: missing.length ? missing : [wrong!] }
      : undefined;

  const commit = () => {
    if (!target || !newParent || !newId || !rank) return;
    // The ranks a species record holds, from its new place: the new parent's line, this taxon renamed, then its own below.
    const newLine = [...newParentPath, { rank, name: newName }];
    const at = (r: Rank, t: Taxon) =>
      newLine.find((a) => a.rank === r)?.name ??
      (r === "Order"
        ? t.ranks.order
        : r === "Family"
          ? t.ranks.family
          : r === "Genus"
            ? t.ranks.genus
            : r === "Class"
              ? t.ranks.cls
              : t.ranks.phylum);
    const retarget = [target, ...subtree]
      .filter((n) => n.taxon)
      .map((n) => {
        const t = n.taxon!;
        const scientific =
          n === target
            ? newName
            : t.scientific.startsWith(`${target.name} `)
              ? `${newName}${t.scientific.slice(target.name.length)}`
              : t.scientific;
        return {
          id: t.id,
          scientific,
          ranks: {
            phylum: at("Phylum", t),
            cls: at("Class", t),
            order: at("Order", t),
            family: at("Family", t),
            genus: at("Genus", t),
          },
        };
      });
    retargetTaxa(retarget);
    // Taxa that are not species records (published, appended) move with it.
    addMoves([{ fromId: target.id, toParentId: newParent.id, name: newName }]);
    toast.success(`${rank} renamed`, {
      description: `${target.name} is now ${newName}`,
    });
    router.push(roleHref(nodeHref(newId)));
  };

  const onRename = () => {
    if (missing.length || wrong) return setAttempted(true);
    setConfirming(true);
  };

  const touched = !!(kingdom !== initialKingdom || rank || targetId);
  const leave = () =>
    router.push(
      roleHref(kingdom ? `${TX_ROOT}?kingdom=${kingdom}` : TX_ROOT),
    );

  // ── The tree: the taxon renamed in place as the name is typed (the designer, 15 Oct 2026: "the existing ones must be
  // updated as the user types"), moved under its new parent when one is chosen, the names under it following, and the taxa
  // beside it at each rank ──
  const tree = (() => {
    if (!kingdom || !kingdomId) return null;
    const route = target
      ? [...path, ...newParentPath]
      : nodes.filter((n) => n.id === kingdomId);
    const routeIds = new Set(route.map((n) => n.id));
    const list = nodes
      .filter(
        (n) => routeIds.has(n.id) || (n.parentId && routeIds.has(n.parentId)),
      )
      .map((n) => {
        if (!target || !changed) return n;
        if (n.id === target.id)
          return { ...n, name: newName, parentId: newParent?.id ?? n.parentId };
        return n.parentId === target.id ? { ...n, name: after(n) } : n;
      });
    return { list, expanded: [...routeIds].filter((id) => id !== targetId) };
  })();

  const rankLabel = rank ? rank.toLowerCase() : "taxon";

  return (
    <>
      <FormPage
        title="Rename Taxon"
        subtitle="Give a taxon a new name."
        onCancel={() => (touched ? setConfirmLeave(true) : leave())}
        problems={problems}
        primaryLabel="Rename"
        primaryIcon={Edit05}
        onPrimary={onRename}
      >
        <WithHierarchy
          panel={
            tree ? (
              <FieldCard title="Hierarchy">
                {tree && (
                  <NodeTree
                    key={`${targetId}:${newParent?.id ?? ""}`}
                    label={`The ${rankLabel} being renamed`}
                    nodes={tree.list}
                    expanded={tree.expanded}
                    highlightId={targetId}
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
              description="The rank of the taxon to rename."
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
              title="Taxon to rename"
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
                  value={targetId}
                  onChange={(id) => {
                    const n = nodes.find((x) => x.id === id);
                    setTargetId(id);
                    setFields({
                      parentId: n?.parentId ?? null,
                      name: n ? ownPart(n) : "",
                      infraRank: n ? infraRankOf(n) : "",
                    });
                  }}
                  showError={attempted}
                  missingHint={`Choose the ${rankLabel} to rename`}
                  emptyHint="Only a current taxon can be renamed."
                />
                {target && (
                  <ValueGrid
                    className="sm:grid-cols-1"
                    items={[
                      {
                        label: "NSX Code",
                        value: nsxOf(target)
                          ? `${nsxOf(target)} (stays the same)`
                          : "",
                      },
                    ]}
                  />
                )}
              </div>
            </FormRow>
          )}

          {target && rank && parentRank && kingdom && (
            <FormRow
              title="New name"
              required
              description={
                nameHoldsParent
                  ? `A ${rankLabel}'s name starts with its ${parentRank.toLowerCase()}: change either part.`
                  : "Type the new name. It stays where it is in the hierarchy."
              }
            >
              <div className="flex max-w-[560px] flex-col gap-4">
                {nameHoldsParent && (
                  <TaxonPicker
                    key={`parent:${targetId}`}
                    rank={parentRank}
                    kingdom={kingdom}
                    nodes={nodes}
                    value={fields.parentId}
                    onChange={(id) => setFields({ ...fields, parentId: id })}
                    showError={attempted}
                    missingHint={`Choose the ${parentRank.toLowerCase()} it belongs to`}
                  />
                )}
                <div
                  className={
                    floraInfra
                      ? "grid grid-cols-[104px_minmax(0,1fr)] items-end gap-2"
                      : undefined
                  }
                >
                  {floraInfra && (
                    <Select
                      size="sm"
                      label="Rank"
                      placeholder="Rank"
                      items={infraRanksFor(kingdom).map((o) => ({
                        id: o,
                        label: o,
                      }))}
                      selectedKey={fields.infraRank || null}
                      onSelectionChange={(k) =>
                        setFields({ ...fields, infraRank: String(k ?? "") })
                      }
                      isInvalid={attempted && !fields.infraRank}
                    >
                      {(item) => (
                        <Select.Item {...item}>{item.label}</Select.Item>
                      )}
                    </Select>
                  )}
                  <Input
                    size="sm"
                    label={
                      rank === "Species"
                        ? "Species epithet"
                        : rank === "Infraspecies"
                          ? "Infraspecific name"
                          : `${rank} name`
                    }
                    isRequired
                    value={fields.name}
                    onChange={(v) => setFields({ ...fields, name: v })}
                    isInvalid={(attempted && !fields.name.trim()) || !!wrong}
                    hint={wrong}
                  />
                </div>
                {newName && changed && (
                  <p className="text-sm text-tertiary">
                    Becomes{" "}
                    <span
                      className={
                        italicRank(rank)
                          ? "font-medium text-primary italic"
                          : "font-medium text-primary"
                      }
                    >
                      {newName}
                    </span>
                    {moved && newParent ? ` under ${newParent.name}` : ""}.
                  </p>
                )}
              </div>
            </FormRow>
          )}

          {target && rank && changed && subtree.length > 0 && (
            <FormRow
              title="What changes too"
              description={
                renamedBelow.length
                  ? `${renamedBelow.length} ${renamedBelow.length === 1 ? "name" : "names"} under it change with it.`
                  : `${subtree.length} ${subtree.length === 1 ? "taxon" : "taxa"} under it move with it; their names stay the same.`
              }
            >
              {renamedBelow.length > 0 && (
                <div className="flex max-w-[560px] flex-col gap-2">
                  {renamedBelow.map((n) => (
                    <div
                      key={n.id}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3"
                    >
                      <span
                        className={
                          italicRank(n.rank)
                            ? "text-sm text-primary italic"
                            : "text-sm text-primary"
                        }
                      >
                        {n.name}
                      </span>
                      <span className="text-sm text-tertiary">
                        Becomes <span className="italic">{after(n)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </FormRow>
          )}
        </WithHierarchy>
      </FormPage>

      <ConfirmationModal
        icon={Edit05}
        confirmIcon={Edit05}
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={`Rename this ${rankLabel}?`}
        description={
          target && rank && newParent ? (
            <span className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-left">
              <span className="font-medium text-secondary">{rank}</span>
              <span className="text-primary">
                <span className={italicRank(rank) ? "italic" : undefined}>
                  {target.name}
                </span>{" "}
                to{" "}
                <span
                  className={
                    italicRank(rank) ? "font-medium italic" : "font-medium"
                  }
                >
                  {newName}
                </span>
              </span>
              <span className="font-medium text-secondary">NSX code</span>
              <span className="text-primary tabular-nums">
                {nsxOf(target) ? `${nsxOf(target)} (unchanged)` : NOT_PROVIDED}
              </span>
              {moved && (
                <>
                  <span className="font-medium text-secondary">New {newParent.rank.toLowerCase()}</span>
                  <span className="text-primary">
                    <span
                      className={
                        italicRank(newParent.rank) ? "italic" : undefined
                      }
                    >
                      {newParent.name}
                    </span>
                  </span>
                </>
              )}
              {renamedBelow.length > 0 && (
                <>
                  <span className="font-medium text-secondary">
                    Also renamed
                  </span>
                  <span className="text-primary">
                    {renamedBelow.length}{" "}
                    {renamedBelow.length === 1 ? "taxon" : "taxa"} under it
                  </span>
                </>
              )}
              {target.taxon && (
                <>
                  <span className="font-medium text-secondary">Old name</span>
                  <span className="text-primary">Kept as a synonym</span>
                </>
              )}
              <span className="col-span-2 my-1 border-t border-secondary" />
              {newParentPath
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
        confirmLabel="Rename"
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
        title="Leave this rename?"
        description="What you have filled in will be lost. Nothing has been changed yet."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        onConfirm={leave}
      />
    </>
  );
}

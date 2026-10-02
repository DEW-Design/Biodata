"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/base/badges/badges";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { buildTree, pathTo, type Taxon, type TreeNode } from "@/app/pages/_shared/taxonomy/tx-data";
import { cx } from "@/utils/cx";

// Finding a species: the search match, and the Figma's Taxonomy View (the hierarchy), which the
// species list offers as its secondary view (the designer, Sept 30 2026).

export const matchesQuery = (t: Taxon, q: string) => !q || [t.common, t.scientific, t.nsx ?? "", t.ranks.family, ...t.synonyms.map((s) => s.name)].some((v) => v.toLowerCase().includes(q));

/** Taxonomy View: Domain down to species, each rank named beside it. Picking a species opens it. */
export function TaxonomyTree({ taxa, selectedId, onSelect, openAll = false }: { taxa: Taxon[]; selectedId: string | null; onSelect: (id: string) => void; openAll?: boolean }) {
  const root = useMemo(() => buildTree(taxa), [taxa]);
  const allIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: TreeNode) => {
      if (n.children.length) ids.push(n.id);
      n.children.forEach(walk);
    };
    walk(root);
    return ids;
  }, [root]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(openAll ? allIds : selectedId ? [root.id, ...pathTo(root, selectedId)] : [root.id, ...root.children.map((c) => c.id)]));

  const render = (n: TreeNode) => {
    const isSelected = !!n.taxonId && n.taxonId === selectedId;
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.name}>
        <TreeView.ItemContent className={cx(isSelected && "bg-brand-50 hover:bg-brand-50", !n.taxonId && "cursor-default")}>
          <span className="flex min-w-0 items-center gap-2">
            <span className={cx("truncate", n.taxonId && "italic", isSelected ? "text-brand-secondary" : "text-secondary")}>{n.name}</span>
            <Badge size="sm" color="gray">
              {n.rank}
            </Badge>
          </span>
        </TreeView.ItemContent>
        {n.children.map(render)}
      </TreeView.Item>
    );
  };

  return (
    <TreeView
      aria-label="Taxonomy"
      size="sm"
      showConnectors
      selectionMode="none"
      expandedKeys={expanded}
      onExpandedChange={(keys) => setExpanded(new Set([...keys].map(String)))}
      onAction={(key) => {
        const id = String(key);
        if (id.startsWith("taxon:")) onSelect(id.slice("taxon:".length));
      }}
    >
      {render(root)}
    </TreeView>
  );
}

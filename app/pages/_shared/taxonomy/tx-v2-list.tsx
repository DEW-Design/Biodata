"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dataflow03, Feather, Flag01, LayersThree01, SearchLg, Table as TableIcon } from "@untitledui/icons";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { AttributeFilterChips } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { type FilterGetters, type FilterSection, type FilterSelection, useSelectionFilter } from "@/app/pages/_shared/list-filter";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { CHANGE_META, GROUP_PLURAL, TX_ROOT, type Kingdom } from "@/app/pages/_shared/taxonomy/tx-data";
import { NOT_PROVIDED } from "@/app/pages/_shared/taxonomy/tx-fields";
import { RANKS, groupOf as nodeGroup, lineage, nodeHref, nsxOf, rankIndex, useTaxonNodes, type Rank, type TaxonNode } from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { NewChangeMenu, ViewSwitch, statusBadge } from "@/app/pages/_shared/taxonomy/tx-records";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// Taxonomy Management's list (the designer's version 2, 14 Oct 2026; the species-only version 1 was retired on 26 Oct 2026):
// the list holds every rank, not only species. Built from version 1's species list (0.9): the same header, toolbar, filter,
// List / Hierarchy switch and table, with Rank added as a column and as a filter in the Filter menu ("retain the rank within
// filter to maintain consistency"). Wording is version 1's, unchanged (the designer: "dont change any wording").
//
// Every row opens its taxon's page (tx-v2-record.tsx): a species or infraspecies its species record, a higher taxon the same
// page cut to its own rank. The heading is Taxa, not Species: the list manages every rank (the designer, 14 Oct 2026);
// column 2 stays Flora and Fauna, the two teams. The columns are the designer's: Name, Rank, NSX Code, Group, Synonyms,
// Status. Update taxonomy opens Append, Rename, Combine and Split, each on one page.

/** Genus and the ranks under it are written in italics (the botanical and zoological codes). */
export const italicRank = (r: Rank) => rankIndex(r) >= rankIndex("Genus");

/** Kingdom down to the taxa given, each rank named beside it, with the taxa of `newIds` marked New and `highlightId` highlighted. */
export function NodeTree({
  nodes,
  highlightId,
  highlightIds,
  newIds,
  expanded: initiallyExpanded,
  onOpen,
  matchIds,
  label = "Taxonomy",
}: {
  nodes: TaxonNode[];
  highlightId?: string | null;
  /** More than one taxon highlighted (Combine). */
  highlightIds?: Set<string>;
  newIds?: Set<string>;
  /** Open at first; the person can open and close the rest. Defaults to the kingdoms. */
  expanded?: string[];
  /** Opens a taxon's page; any rank can be opened. */
  onOpen?: (node: TaxonNode) => void;
  /** The taxa the search and filters matched. The others are only there to place them, and are drawn muted. */
  matchIds?: Set<string>;
  label?: string;
}) {
  const children = useMemo(() => {
    const map = new Map<string | null, TaxonNode[]>();
    for (const n of nodes) map.set(n.parentId, [...(map.get(n.parentId) ?? []), n]);
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [nodes]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initiallyExpanded ?? (children.get(null) ?? []).map((n) => n.id)));

  const render = (n: TaxonNode) => {
    const isHighlighted = n.id === highlightId || !!highlightIds?.has(n.id);
    const isNew = newIds?.has(n.id);
    const isContext = !!matchIds && !matchIds.has(n.id);
    return (
      <TreeView.Item key={n.id} id={n.id} textValue={n.name}>
        <TreeView.ItemContent className={cx(isHighlighted && "bg-brand-50 hover:bg-brand-50", !onOpen && "cursor-default")}>
          <span className="flex min-w-0 items-center gap-2">
            <span className={cx("truncate", italicRank(n.rank) && "italic", isHighlighted ? "font-medium text-brand-secondary" : isContext ? "text-quaternary" : "text-secondary")}>{n.name}</span>
            <Badge size="sm" color="gray">
              {n.rank}
            </Badge>
            {isNew && (
              <Badge size="sm" color="brand">
                New
              </Badge>
            )}
          </span>
        </TreeView.ItemContent>
        {(children.get(n.id) ?? []).map(render)}
      </TreeView.Item>
    );
  };

  return (
    <TreeView
      aria-label={label}
      size="sm"
      showConnectors
      selectionMode="none"
      expandedKeys={expanded}
      onExpandedChange={(keys) => setExpanded(new Set([...keys].map(String)))}
      onAction={(key) => {
        const node = nodes.find((n) => n.id === String(key));
        if (node && onOpen) onOpen(node);
      }}
    >
      {(children.get(null) ?? []).map(render)}
    </TreeView>
  );
}

const PAGE_SIZE = 10;

const matches = (n: TaxonNode, q: string) => !q || [n.name, n.taxon?.common ?? "", nsxOf(n) ?? "", ...(n.taxon?.synonyms.map((s) => s.name) ?? [])].some((v) => v.toLowerCase().includes(q));

export function HierarchyList({ kingdom, initialSearch = "" }: { kingdom: Kingdom | null; initialSearch?: string }) {
  const roleHref = useRoleHref();
  const router = useRouter();
  const all = useTaxonNodes();
  const [search, setSearch] = useState(initialSearch);
  const [view, setView] = useState<"list" | "hierarchy">("list");
  const [filters, setFilters] = useState<FilterSelection>({ status: new Set(["current"]) });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // The list starts at Order: Kingdom, Phylum and Class are the few fixed taxa every row sits under.
  const listed = all.filter((n) => (!kingdom || n.kingdom === kingdom) && rankIndex(n.rank) >= rankIndex("Order"));
  const groupOf = (n: TaxonNode) => {
    const g = nodeGroup(all, n);
    return g ? GROUP_PLURAL[g] : "";
  };
  const q = search.trim().toLowerCase();
  const sections: FilterSection[] = [
    { id: "rank", label: "Rank", icon: LayersThree01, options: RANKS.filter((r) => listed.some((n) => n.rank === r)).map((r) => ({ id: r, label: r })) },
    { id: "group", label: "Group", icon: Feather, options: [...new Set(listed.map(groupOf).filter(Boolean))].sort().map((g) => ({ id: g, label: g })) },
    { id: "status", label: "Status", icon: Flag01, options: [{ id: "current", label: "Current" }, { id: "superseded", label: "Superseded" }] },
  ];
  const getters: FilterGetters<TaxonNode> = { rank: (n) => n.rank, group: groupOf, status: (n) => (n.current ? "current" : "superseded") };
  const filter = useSelectionFilter(sections, getters, filters, (next) => {
    setFilters(next);
    setPage(1);
  });
  const rows = listed.filter((n) => matches(n, q) && filter.matches(n)).sort((a, b) => (a.taxon?.common || a.name).localeCompare(b.taxon?.common || b.name));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const title = kingdom ? `${kingdom} taxa` : "Taxa";

  // The hierarchy view draws the rows that match with every taxon above them, so each sits where it belongs.
  const treeNodes = useMemo(() => {
    const ids = new Set(rows.flatMap((n) => lineage(all, n.id).map((a) => a.id)));
    return all.filter((n) => ids.has(n.id));
  }, [rows, all]);

  const open = (n: TaxonNode) => router.push(roleHref(nodeHref(n.id)));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{title}</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Open a taxon to view and edit it, or to rename, combine or split it.</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <NewChangeMenu hrefFor={(t) => `${TX_ROOT}/${t}`} labelFor={(t) => (t === "append" ? "Append Taxon" : CHANGE_META[t].title)} />
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search taxa"
            placeholder="Search by name, NSX code or synonym"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <FilterMenu filter={filter} />
          <div className="ml-auto">
            <ViewSwitch
              label="Show taxa as"
              value={view}
              onChange={setView}
              items={[
                { id: "list", label: "List", icon: TableIcon },
                { id: "hierarchy", label: "Hierarchy", icon: Dataflow03 },
              ]}
            />
          </div>
        </div>
        <AttributeFilterChips filter={filter} />

        {rows.length === 0 ? (
          <ListEmptyState
            icon={SearchLg}
            title={q ? "No taxa match your search" : "No taxa match your filters"}
            description={q ? `Nothing in the taxonomy matches "${search.trim()}" with the filters on.` : "Turn a filter off to see more of the taxonomy."}
            action={{
              label: "Show all taxa",
              onPress: () => {
                setSearch("");
                setFilters({});
                setPage(1);
              },
            }}
          />
        ) : view === "hierarchy" ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <NodeTree
              key={`${q}:${rows.length}`}
              nodes={treeNodes}
              matchIds={new Set(rows.map((n) => n.id))}
              expanded={q || filters.rank?.size || filters.group?.size ? treeNodes.map((n) => n.id) : undefined}
              onOpen={open}
            />
          </div>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table layout="fixed" className="min-w-[1000px]" bodyScrollable aria-label={title}>
              <Table.Header sticky>
                <Table.Head id="name" label="Name" isRowHeader className="w-[32%]" />
                <Table.Head id="rank" label="Rank" className="w-[13%]" />
                <Table.Head id="nsx" label="NSX Code" className="w-[13%]" />
                <Table.Head id="group" label="Group" className="w-[16%]" />
                <Table.Head id="synonyms" label="Synonyms" className="w-[12%]" />
                <Table.Head id="status" label="Status" className="w-[14%]" />
              </Table.Header>
              <Table.Body items={paged}>
                {(n) => (
                  <Table.Row id={n.id} href={roleHref(nodeHref(n.id))} textValue={n.name} className="group cursor-pointer">
                    <Table.Cell>
                      {n.taxon?.common ? (
                        <div className="flex flex-col">
                          <p className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{n.taxon.common}</p>
                          <p className="text-sm text-tertiary italic">{n.name}</p>
                        </div>
                      ) : (
                        <p className={cx("text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline", italicRank(n.rank) && "italic")}>{n.name}</p>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{n.rank}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={nsxOf(n) ? "text-sm text-tertiary tabular-nums" : "text-sm text-quaternary"}>{nsxOf(n) ?? NOT_PROVIDED}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{groupOf(n)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary tabular-nums">{n.taxon?.synonyms.length ?? 0}</span>
                    </Table.Cell>
                    <Table.Cell>{statusBadge(n)}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <TableCard.PaginationNumbered
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              totalCount={rows.length}
            />
          </TableCard.Root>
        )}
      </div>
    </div>
  );
}

/** Column 2's counts for version 2: every current taxon from Order down, by kingdom. */
export function useNodeCounts() {
  const nodes = useTaxonNodes().filter((n) => n.current && rankIndex(n.rank) >= rankIndex("Order"));
  return { all: nodes.length, Flora: nodes.filter((n) => n.kingdom === "Flora").length, Fauna: nodes.filter((n) => n.kingdom === "Fauna").length };
}

/**
 * The version 2 change forms (Append, Split, Combine, Rename): the fields in a column on the left, the hierarchy on the right,
 * held in view while the fields scroll (the designer, 15 Oct 2026: "the editable sections stays nicely together"). Below xl
 * the panel follows the fields.
 */
export function WithHierarchy({ panel, children }: { panel: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="min-w-0">{children}</div>
      {panel && <div className="xl:sticky xl:top-0 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto">{panel}</div>}
    </div>
  );
}

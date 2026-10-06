"use client";

// VERSION 3 of the Project records explorer (on the project page), once compared through
// the Version floating button. Same list, filter and search as the current version, plus:
// - the list and the details panel are split by a handle you can drag (or move with the arrow keys),
//   so either side can be widened;
// - the details panel is the cleaner v3 panel (record-panel.tsx) with every action in one toolbar;
// - full screen shows the record wide (record-full-view.tsx). Edit, a section's edit icon or a
//   field's opens it there with that one card in edit mode; Add inside opens a new record full
//   screen with every card in edit mode and the Fields shown panel, as editing does.
// - the tree has one Expand all / Collapse all toggle in its own header, beside the record count
//   (the VS Code explorer and GitHub file tree pattern), instead of two links in the toolbar.
// - the search is the shared ToolbarSearch, the same 384px as every list (CONTRACTS 4.2c).

// Project records explorer: one toolbar, then the records (tree or table) beside the record inspector.
// Tree and table show the same filtered set and share one selection, so switching view never loses
// your place. The tree keeps a record's parents visible when a filter or search hides its siblings,
// so a match is always read in context (Site > Quadrat > Occurrence).
//
// Record types are filtered with the same Filter button the other lists use, in two levels: Events,
// Occurrences and Observations, each with its own types. The inspector can go full screen (its own
// button, or a double-click on a tree item or a table row).

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  type Key,
  type SortDescriptor,
} from "react-aria-components";
import {
  Dataflow03,
  Flag01,
  Table as TableIcon,
  Folder,
  Tag01,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { Table, TableCard } from "@/components/application/table/table";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { cx } from "@/utils/cx";
import { segmentClass, segmentTrayClass } from "./segmented";
import {
  KIND_COLOR,
  KIND_LABEL,
  KIND_PLURAL,
  recordIcon,
} from "./record-inspector";
import { ExpandAllToggle, RecordPanel } from "./record-panel";
import { hasDateField } from "./field-schema";
import { RecordFullView, type EditTarget } from "./record-full-view";
import { RecordFullscreenV3 } from "./record-fullscreen";
import { formatDate, type RecordKind, type SurveyRecord } from "./survey-data";
import { useEditStore } from "./edit-store";
import { useFlagCounts } from "./review-view";
import { type FilterSection, type FilterSelection, useSelectionFilter } from "@/app/pages/_shared/list-filter";
import { AttributeFilterChips } from "@/app/pages/_shared/attribute-filter";
import { FilterMenu } from "@/app/pages/_shared/filter-menu";
import { SAMPLING_TYPES, createRecord, type ChildOption } from "./record-rules";

export type KindFilter = "all" | RecordKind;

// Two levels: kind, then its types. A child's id is "kind:type".
const TYPES: Record<RecordKind, string[]> = {
  event: ["Project", "Site", "Visit", ...SAMPLING_TYPES],
  occurrence: ["Individual", "Population"],
  observation: ["Individual", "Population", "Non-biotic", "Community"],
};
const TYPE_FILTER: FilterSection = {
  id: "type",
  label: "Record type",
  icon: Tag01,
  options: (["event", "occurrence", "observation"] as RecordKind[]).map(
    (kind) => ({
      id: kind,
      label: KIND_PLURAL[kind],
      children: TYPES[kind].map((t) => ({ id: `${kind}:${t}`, label: t })),
    }),
  ),
};
const typeKey = (r: SurveyRecord) => `${r.kind}:${r.type}`;
// Records with a value flagged for review (an open questionable value on any field).
const REVIEW_FILTER: FilterSection = {
  id: "review",
  label: "Review",
  icon: Flag01,
  options: [{ id: "flagged", label: "Has flagged concepts" }],
};

// The sections the records filter offers: what kind of record, and whether it has flagged values.
const RECORD_FILTERS: FilterSection[] = [TYPE_FILTER, REVIEW_FILTER];

/** The filter that shows only one kind of record (every one of its types), or nothing for "all". */
export function filterForKind(kind: KindFilter): FilterSelection {
  return kind === "all"
    ? {}
    : { type: new Set(TYPES[kind].map((t) => `${kind}:${t}`)) };
}
export type RecordsView = "tree" | "table";

const PROJECT_NODE = "project";

function matchesSearch(r: SurveyRecord, q: string, name: string) {
  if (!q) return true;
  const hay =
    `${name} ${r.name} ${r.code} ${r.type} ${r.scientificName ?? ""} ${r.summary}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

/** A quiet flag and count on a record row with values flagged for review. */
function FlagMarker({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} flagged concept${count === 1 ? "" : "s"}`}
      title={`${count} flagged concept${count === 1 ? "" : "s"}`}
      className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-warning-700 tabular-nums"
    >
      <Flag01 className="size-3.5 text-fg-warning-primary" />
      {count}
    </span>
  );
}

export function RecordsExplorer({
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  view,
  onViewChange,
  focusField,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filter: FilterSelection;
  onFilterChange: (next: FilterSelection) => void;
  view: RecordsView;
  onViewChange: (next: RecordsView) => void;
  /** A field to scroll to and highlight in the details panel (from an artefact's "Open record"). */
  focusField?: { recordId: string; key: string; nonce: number } | null;
}) {
  // Records come from the session store, so added, edited and deleted records show here at once.
  const { records, recordById, ancestorsOf, project, meta } = useEditStore();
  const projectTitle = project.details.shortTitle;
  const ALL_PARENT_IDS = records
    .filter((r) => records.some((c) => c.parentId === r.id))
    .map((r) => r.id);
  const [query, setQuery] = useState("");
  // Full screen: null = closed; "view" shows the record wide, where a card can go into edit mode
  // (`editTarget` opens it that way); "edit" is only for a new record being added (`creating`), which
  // is filled in on every card at once and joins the list on save.
  const [fullscreen, setFullscreen] = useState<null | "view" | "edit">(null);
  const [editTarget, setEditTarget] = useState<EditTarget | undefined>(
    undefined,
  );
  const [cardEditing, setCardEditing] = useState(false);
  // Edit opened from the side panel goes full screen to edit, then comes back to the panel when the
  // edit is saved or cancelled. An edit started inside the full view stays there.
  const openEdit = (sectionId?: string, fieldKey?: string) => {
    if (!recordById(selectedId)) return;
    setEditTarget({ sectionId: sectionId ?? "*", fieldKey });
    fromPanel.current = true;
    setFullscreen("view");
  };
  const fromPanel = useRef(false);
  const wasEditing = useRef(false);
  const onCardEditingChange = (editing: boolean) => {
    setCardEditing(editing);
    if (wasEditing.current && !editing && fromPanel.current) closeFullscreen();
    wasEditing.current = editing;
  };
  const [creating, setCreating] = useState<SurveyRecord | null>(null);
  // Adding opens the new record full screen, every card in edit mode (the same look as editing),
  // and like edit it returns to where it started: the side panel, or the full view.
  const startAdd = (
    parent: SurveyRecord | null,
    option: ChildOption,
    origin: "panel" | "full" = "panel",
  ) => {
    setCreating(
      createRecord({
        kind: option.kind,
        type: option.type,
        parent,
        name: "",
        date: new Date().toISOString().slice(0, 10),
        recordedBy: "Olivia Wyatt",
        records,
      }),
    );
    fromPanel.current = origin === "panel";
    setFullscreen("edit");
  };
  const closeFullscreen = () => {
    fromPanel.current = false;
    wasEditing.current = false;
    setFullscreen(null);
    setCreating(null);
    setEditTarget(undefined);
    setCardEditing(false);
  };

  // The list and the panel share the row; the panel's width is dragged from the handle between them.
  const [panelWidth, setPanelWidth] = useState(440);
  const rowRef = useRef<HTMLDivElement>(null);
  const clampWidth = (w: number) => {
    const total = rowRef.current?.getBoundingClientRect().width ?? 1200;
    return Math.round(Math.min(Math.max(w, 340), total - 360));
  };
  const onHandleDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const right =
      rowRef.current?.getBoundingClientRect().right ?? window.innerWidth;
    const move = (ev: globalThis.PointerEvent) =>
      setPanelWidth(clampWidth(right - ev.clientX - 8));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const onHandleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") setPanelWidth((w) => clampWidth(w + 24));
    if (e.key === "ArrowRight") setPanelWidth((w) => clampWidth(w - 24));
  };
  const [expanded, setExpanded] = useState<Set<Key>>(
    () => new Set([PROJECT_NODE, ...ALL_PARENT_IDS]),
  );
  const [sort, setSort] = useState<SortDescriptor>({
    column: "code",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const flagCounts = useFlagCounts();
  const getters = useMemo(
    () => ({
      type: typeKey,
      review: (r: SurveyRecord) =>
        (flagCounts.get(r.id) ?? 0) > 0 ? "flagged" : "",
    }),
    [flagCounts],
  );
  const filterApi = useSelectionFilter(RECORD_FILTERS, getters, filter, (next) => {
    onFilterChange(next);
    setPage(1);
  });
  const filterOn = filterApi.count > 0 || query.trim() !== "";
  const matches = useMemo(
    () =>
      records.filter(
        (r) =>
          filterApi.matches(r) &&
          matchesSearch(r, query.trim(), r.name),
      ),
    [records, filterApi, query],
  );
  // The project is a record too (an event of type Project): the table lists it first, like the tree's root.
  const projectRow = useMemo(
    () =>
      ({
        ...records[0],
        id: PROJECT_NODE,
        code: meta.code,
        kind: "event",
        type: "Project",
        name: projectTitle,
        parentId: null,
        date: project.details.startDate?.toString() ?? "",
        scientificName: undefined,
        sections: [],
      }) as unknown as SurveyRecord,
    [records, projectTitle, project.details.startDate, meta.code],
  );
  const projectMatches =
    filterApi.matches(projectRow) &&
    matchesSearch(projectRow, query.trim(), projectRow.name);

  // Double-click a tree item or a table row: select it and open its details full screen.
  const openFullscreenFrom = (e: MouseEvent) => {
    const key = (e.target as HTMLElement)
      .closest('[role="row"][data-key]')
      ?.getAttribute("data-key");
    if (!key) return;
    onSelect(key === PROJECT_NODE ? null : key);
    setEditTarget(undefined);
    setFullscreen("view");
  };

  // Tree: matches plus every ancestor, so a match is shown where it lives.
  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);
  const treeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of matches) {
      ids.add(m.id);
      for (const a of ancestorsOf(m)) ids.add(a.id);
    }
    return ids;
  }, [matches, ancestorsOf]);

  // When the selection changes (a record added, or picked from a link elsewhere), open its parents so
  // it is visible. Adjusted during render, not in an effect, so there is no extra paint.
  const selectedRecord = recordById(selectedId);
  const [openedFor, setOpenedFor] = useState<string | null>(selectedId);
  if (openedFor !== selectedId) {
    setOpenedFor(selectedId);
    if (selectedRecord)
      setExpanded(
        (e) => new Set([...e, ...ancestorsOf(selectedRecord).map((a) => a.id)]),
      );
  }
  const openKeys = expanded;
  // One toggle, not two links: it collapses when everything is open, and expands otherwise.
  const allOpen = ALL_PARENT_IDS.every((id) => expanded.has(id));

  const sorted = useMemo(() => {
    const key = sort.column as keyof SurveyRecord | "kind";
    const rows = projectMatches ? [projectRow, ...matches] : [...matches];
    rows.sort((a, b) => {
      const av = String(a[key as keyof SurveyRecord] ?? "");
      const bv = String(b[key as keyof SurveyRecord] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sort.direction === "ascending" ? cmp : -cmp;
    });
    return rows;
  }, [matches, sort, projectMatches, projectRow]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selected = selectedRecord;
  const treeSelectedKey = selectedId ?? PROJECT_NODE;

  const renderNode = (r: SurveyRecord) => {
    const kids = records.filter(
      (c) => c.parentId === r.id && treeIds.has(c.id),
    );
    const isMatch = !filterOn || matchIds.has(r.id);
    return (
      <TreeView.Item key={r.id} id={r.id} textValue={r.name}>
        <TreeView.ItemContent
          icon={recordIcon(r)}
          className={cx(
            r.id === treeSelectedKey && "bg-brand-50 hover:bg-brand-50",
            !isMatch && "cursor-default! hover:bg-transparent!",
          )}
          action={
            <span className="flex shrink-0 items-center gap-2">
              <FlagMarker count={flagCounts.get(r.id) ?? 0} />
              <span className="text-xs font-normal text-tertiary tabular-nums">
                {r.code}
              </span>
            </span>
          }
        >
          <span
            className={cx(
              r.id === treeSelectedKey
                ? "text-brand-secondary"
                : "text-secondary",
            )}
          >
            {r.name}
          </span>
          <span className="ml-2 text-xs font-normal text-tertiary">
            {r.type}
          </span>
        </TreeView.ItemContent>
        {kids.map(renderNode)}
      </TreeView.Item>
    );
  };

  const roots = records.filter((r) => r.parentId === null && treeIds.has(r.id));

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <ToolbarSearch
          label="Search records"
          placeholder="Search by name, ID, species or type"
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
        />

        <FilterMenu filter={filterApi} />

        <ToggleButtonGroup
          aria-label="Records view"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[view]}
          onSelectionChange={(keys) => {
            const next = Array.from(keys)[0];
            if (next === "tree" || next === "table") onViewChange(next);
          }}
          className={cx(segmentTrayClass, "ml-auto")}
        >
          <ToggleButton id="tree" className={segmentClass}>
            <Dataflow03 className="size-4" />
            Tree
          </ToggleButton>
          <ToggleButton id="table" className={segmentClass}>
            <TableIcon className="size-4" />
            Table
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <AttributeFilterChips filter={filterApi} />

      {/* ── Records + inspector ── */}
      <div ref={rowRef} className="flex h-[calc(100dvh-9rem)] min-h-[560px]">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-secondary bg-primary">
          {matches.length === 0 && !(view === "table" && projectMatches) ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
              <p className="text-sm font-medium text-primary">
                No records match
              </p>
              <p className="text-sm text-tertiary">
                Try another search or record type.
              </p>
            </div>
          ) : view === "tree" ? (
            <>
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary py-1.5 pr-2 pl-4">
                <p className="text-xs font-medium text-tertiary tabular-nums">
                  {filterOn
                    ? `${matches.length} of ${records.length} records match`
                    : `${records.length} records`}
                </p>
                {!filterOn && (
                  <ExpandAllToggle
                    allOpen={allOpen}
                    onToggle={() =>
                      setExpanded(
                        allOpen
                          ? new Set([PROJECT_NODE])
                          : new Set([PROJECT_NODE, ...ALL_PARENT_IDS]),
                      )
                    }
                  />
                )}
              </div>
              <div
                className="min-h-0 flex-1 overflow-y-auto p-2"
                onDoubleClick={openFullscreenFrom}
              >
                <TreeView
                  aria-label="Project records"
                  showConnectors
                  size="md"
                  selectionMode="none"
                  expandedKeys={
                    filterOn ? new Set([PROJECT_NODE, ...treeIds]) : openKeys
                  }
                  // While a filter or search is on, rows shown only as context (parents of a match)
                  // are disabled: they read as context, and only the matches can be picked.
                  disabledKeys={
                    filterOn
                      ? [
                          PROJECT_NODE,
                          ...[...treeIds].filter((id) => !matchIds.has(id)),
                        ]
                      : []
                  }
                  onExpandedChange={(keys) => setExpanded(new Set(keys))}
                  onAction={(key) =>
                    onSelect(key === PROJECT_NODE ? null : String(key))
                  }
                >
                  <TreeView.Item id={PROJECT_NODE} textValue={projectTitle}>
                    <TreeView.ItemContent
                      icon={Folder}
                      className={cx(
                        treeSelectedKey === PROJECT_NODE &&
                          "bg-brand-50 hover:bg-brand-50",
                      )}
                      action={
                        <span className="shrink-0 text-xs font-normal text-tertiary">
                          {meta.code}
                        </span>
                      }
                    >
                      <span
                        className={
                          treeSelectedKey === PROJECT_NODE
                            ? "text-brand-secondary"
                            : "text-secondary"
                        }
                      >
                        {projectTitle}
                      </span>
                      <span className="ml-2 text-xs font-normal text-tertiary">
                        Project
                      </span>
                    </TreeView.ItemContent>
                    {roots.map(renderNode)}
                  </TreeView.Item>
                </TreeView>
              </div>
            </>
          ) : (
            <TableCard.Root
              className="flex min-h-0 flex-1 flex-col rounded-none shadow-none ring-0"
              onDoubleClick={openFullscreenFrom}
            >
              <Table layout="fixed" className="min-w-[1100px]"
                aria-label="Project records"
                bodyScrollable
                sortDescriptor={sort}
                onSortChange={(next) => {
                  setSort(next);
                  setPage(1);
                }}
              >
                <Table.Header sticky>
                  <Table.Head id="code" label="ID" isRowHeader allowsSorting className="w-[12%]" />
                  <Table.Head id="name" label="Name" allowsSorting className="w-[30%]" />
                  <Table.Head id="kind" label="Record" allowsSorting className="w-[12%]" />
                  <Table.Head id="type" label="Type" allowsSorting className="w-[14%]" />
                  <Table.Head id="date" label="Date" allowsSorting className="w-[12%]" />
                  <Table.Head id="parentId" label="Within" className="w-[20%]" />
                </Table.Header>
                <Table.Body items={paged}>
                  {(r) => {
                    const Icon = recordIcon(r);
                    const parent = recordById(r.parentId);
                    return (
                      <Table.Row
                        id={r.id}
                        textValue={r.name}
                        onAction={() =>
                          onSelect(r.id === PROJECT_NODE ? null : r.id)
                        }
                        className={cx(
                          "cursor-pointer",
                          (r.id === PROJECT_NODE
                            ? selectedId === null
                            : r.id === selectedId) && "bg-brand-50",
                        )}
                      >
                        <Table.Cell>
                          <span className="text-sm whitespace-nowrap text-tertiary">
                            {r.code}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 text-sm font-medium text-primary">
                              {r.name}
                              <FlagMarker count={flagCounts.get(r.id) ?? 0} />
                            </span>
                            {r.scientificName && (
                              <span className="text-xs text-tertiary italic">
                                {r.scientificName}
                              </span>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge size="sm" color={KIND_COLOR[r.kind]}>
                            {KIND_LABEL[r.kind]}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="flex items-center gap-1.5 text-sm whitespace-nowrap text-tertiary">
                            <Icon className="size-4 text-fg-quaternary" />
                            {r.type}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm whitespace-nowrap text-tertiary">
                            {hasDateField(r) ? formatDate(r.date) : ""}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span
                            className="text-sm whitespace-nowrap text-tertiary"
                            title={parent ? parent.name : undefined}
                          >
                            {r.id === PROJECT_NODE
                              ? ""
                              : parent
                                ? parent.code
                                : meta.code}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    );
                  }}
                </Table.Body>
              </Table>
              <TableCard.PaginationNumbered
                page={currentPage}
                pageCount={pageCount}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
                pageSizeOptions={[10, 25, 50]}
                totalCount={sorted.length}
              />
            </TableCard.Root>
          )}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the list and the details panel"
          aria-valuenow={panelWidth}
          tabIndex={0}
          onPointerDown={onHandleDown}
          onKeyDown={onHandleKey}
          onDoubleClick={() => setPanelWidth(440)}
          title="Drag to resize. Double-click to reset."
          className="group flex w-[16px] shrink-0 cursor-col-resize touch-none items-center justify-center outline-focus-ring focus-visible:outline-2"
        >
          <span className="h-12 w-1 rounded-full bg-[var(--ui-border-primary)] transition-colors group-hover:bg-[var(--color-brand-500)] group-focus-visible:bg-[var(--color-brand-500)]" />
        </div>

        <aside
          key={selectedId ?? "project"}
          aria-label="Record details"
          style={{ width: panelWidth }}
          className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-secondary bg-primary"
        >
          <RecordPanel
            record={selected}
            focusField={
              focusField && focusField.recordId === selected?.id
                ? focusField
                : null
            }
            onSelect={onSelect}
            onEdit={openEdit}
            onAdd={startAdd}
            onFullscreen={() => {
              setEditTarget(undefined);
              setFullscreen("view");
            }}
          />
        </aside>
        <RecordFullscreenV3
          isOpen={fullscreen !== null}
          isEditing={fullscreen === "edit" || cardEditing}
          onClose={closeFullscreen}
          label={`${creating ? "New record" : (selected?.name ?? projectTitle)}, full screen`}
        >
          {fullscreen === "edit" && creating ? (
            <RecordFullView
              key={creating.id}
              record={creating}
              isNew
              onSelect={() => {}}
              onAdd={() => {}}
              onExit={closeFullscreen}
              onEditingChange={setCardEditing}
              onCreated={(r) => {
                setCreating(null);
                onSelect(r.id);
                setEditTarget(undefined);
                if (fromPanel.current) closeFullscreen();
                else setFullscreen("view");
              }}
              onDiscardNew={() => {
                setCreating(null);
                if (fromPanel.current) closeFullscreen();
                else setFullscreen("view");
              }}
            />
          ) : selected ? (
            <RecordFullView
              key={`${selected.id}-${editTarget ? `${editTarget.sectionId}-${editTarget.fieldKey ?? ""}` : "view"}`}
              record={selected}
              onSelect={(id) => {
                setEditTarget(undefined);
                onSelect(id);
              }}
              onAdd={(parent, o) => startAdd(parent, o, "full")}
              onExit={closeFullscreen}
              initialEdit={editTarget}
              onEditingChange={onCardEditingChange}
            />
          ) : (
            <div className="mx-auto w-full max-w-3xl py-8">
              <RecordPanel
                record={undefined}
                onSelect={onSelect}
                onEdit={openEdit}
                onAdd={startAdd}
                onFullscreen={closeFullscreen}
              />
            </div>
          )}
        </RecordFullscreenV3>
      </div>
    </div>
  );
}

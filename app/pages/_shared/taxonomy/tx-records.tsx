"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import { ListBox, ListBoxItem, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { ChevronDown, Dataflow03, Edit02, GitBranch01, GitMerge, PencilLine, Plus, Table as TableIcon, Trash01 } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { ConfirmationModal, DestructiveModal } from "@/components/application/modals/modal";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { toast } from "@/components/application/toast/toast";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { ListFilterButton, matchesFilters, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { segmentClass, segmentTrayClass } from "@/app/pages/project-detail/segmented";
import { FieldGrid, FieldGridView, NOT_PROVIDED, withValue } from "@/app/pages/_shared/taxonomy/tx-fields";
import { TaxonTabContent, TaxonTableEditor, linkedRows, useDynamicOptions } from "@/app/pages/_shared/taxonomy/tx-editor";
import { TaxonomyTree, matchesQuery } from "@/app/pages/_shared/taxonomy/tx-finder";
import { deleteSynonym, saveSynonym, saveTaxon, useTaxa, useTaxaHydrated, useTaxon } from "@/app/pages/_shared/taxonomy/tx-store";
import { ATTRIBUTE_COLUMNS, CHANGE_META, TX_ROOT, CHANGE_TYPES, GROUP_PLURAL, synonymFieldsFor, tabsFor, type ChangeType, type FieldDef, type Kingdom, type Synonym, type TabDef, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// Taxonomy Management finds and shows a species the way every collection in the app does ("List ->
// deep dive", ref-shell.md): a species table (4.2) with the hierarchy as a secondary view, and a
// species record laid out like the project page (4.6), edited in place (4.8). A species' Rename,
// Combine and Split, and "Update taxonomy" on the list, open the guided taxon change (tx-flows.tsx).
//
// Designer review, Sept 30 2026 (Option 3 chosen; Options 1 and 2 retired Oct 1 2026):
// - the toolbar is search, then Filter on the left, and the List / Hierarchy switch on the right, drawn
//   like the project page's Tree / Table switch (the same segmented classes and icons), spaced like
//   User Management's lists;
// - "Update taxonomy" is a menu of the four changes, each opening its guided change directly;
// - a record's cards read in the Figma's grid, label over value, the same columns as when edited;
// - Synonyms is its own view of the record (the team's Figma comment: see them all, add one with "+",
//   remove the one shown with "-"), not another tab.

/** A taxon change, started from a species or not. */
export const actionHref = (type: ChangeType, from?: string) => `${TX_ROOT}/new?type=${type}${from ? `&from=${encodeURIComponent(from)}` : ""}`;
export const speciesHref = (id: string) => `${TX_ROOT}/${encodeURIComponent(id)}`;

const statusBadge = (t: Taxon) => (
  <Badge size="sm" color={t.current ? "success" : "gray"}>
    {t.current ? "Current" : "Superseded"}
  </Badge>
);

/** A two or three way view switch, the project page's Tree / Table switch (segmented.ts). */
function ViewSwitch<T extends string>({ label, value, onChange, items }: { label: string; value: T; onChange: (v: T) => void; items: { id: T; label: string; icon?: FC<{ className?: string }>; count?: number }[] }) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const next = Array.from(keys)[0];
        if (next) onChange(String(next) as T);
      }}
      className={segmentTrayClass}
    >
      {items.map(({ id, label: itemLabel, icon: Icon, count }) => (
        <ToggleButton key={id} id={id} className={segmentClass}>
          {Icon && <Icon className="size-4" />}
          {itemLabel}
          {count != null && <span className="font-medium text-quaternary tabular-nums">{count}</span>}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** "Update taxonomy": a menu of the four changes, each opening its guided change at the first step it needs. */
function NewChangeMenu() {
  const router = useRouter();
  const roleHref = useRoleHref();
  const icons: Record<ChangeType, FC<{ className?: string }>> = { rename: PencilLine, combine: GitMerge, split: GitBranch01, append: Plus };
  return (
    <Dropdown.Root>
      <Button color="primary" iconLeading={Plus} iconTrailing={ChevronDown}>
        Update taxonomy
      </Button>
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu aria-label="Update taxonomy" onAction={(key) => router.push(roleHref(actionHref(key as ChangeType)))}>
          {CHANGE_TYPES.map((t) => (
            <Dropdown.Item key={t} id={t} icon={icons[t]} label={CHANGE_META[t].title} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}

const PAGE_SIZE = 10;

export function SpeciesList({ kingdom }: { kingdom: Kingdom | null }) {
  const roleHref = useRoleHref();
  const router = useRouter();
  const all = useTaxa();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "hierarchy">("list");
  const [filters, setFilters] = useState<FilterSelection>({ status: new Set(["current"]) });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const scoped = all.filter((t) => !kingdom || t.kingdom === kingdom);
  const q = search.trim().toLowerCase();
  const sections: FilterSection[] = [
    { id: "group", label: "Group", options: [...new Set(scoped.map((t) => GROUP_PLURAL[t.group]))].sort().map((g) => ({ id: g, label: g })) },
    { id: "status", label: "Status", options: [{ id: "current", label: "Current" }, { id: "superseded", label: "Superseded" }] },
  ];
  const getters: FilterGetters<Taxon> = { group: (t) => GROUP_PLURAL[t.group], status: (t) => (t.current ? "current" : "superseded") };
  const rows = scoped.filter((t) => matchesQuery(t, q) && matchesFilters(t, filters, getters)).sort((a, b) => (a.common || a.scientific).localeCompare(b.common || b.scientific));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const title = kingdom ? `${kingdom} species` : "Species";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{title}</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Open a species to view and edit its taxonomy, or to rename, combine or split it.</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <NewChangeMenu />
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search species"
            placeholder="Search by name, NSX code, family or synonym"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <div>
            <ListFilterButton
              sections={sections}
              selection={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
          </div>
          <div className="ml-auto">
            <ViewSwitch
              label="Show species as"
              value={view}
              onChange={setView}
              items={[
                { id: "list", label: "List", icon: TableIcon },
                { id: "hierarchy", label: "Hierarchy", icon: Dataflow03 },
              ]}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">{q ? `No species match "${search.trim()}".` : "No species match your filters."}</p>
        ) : view === "hierarchy" ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <TaxonomyTree key={`${q}:${rows.length}`} taxa={rows} selectedId={null} openAll={!!q} onSelect={(id) => router.push(roleHref(speciesHref(id)))} />
          </div>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table bodyScrollable aria-label={title}>
              <Table.Header sticky>
                <Table.Head id="name" label="Species" isRowHeader />
                <Table.Head id="nsx" label="NSX Code" />
                <Table.Head id="family" label="Family" />
                <Table.Head id="group" label="Group" />
                <Table.Head id="synonyms" label="Synonyms" />
                <Table.Head id="status" label="Status" />
              </Table.Header>
              <Table.Body items={paged}>
                {(t) => (
                  <Table.Row id={t.id} href={roleHref(speciesHref(t.id))} textValue={t.scientific} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{t.common || t.scientific}</p>
                        <p className="text-sm text-tertiary italic">{t.scientific}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={t.nsx ? "text-sm text-tertiary tabular-nums" : "text-sm text-quaternary"}>{t.nsx ?? NOT_PROVIDED}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{t.ranks.family || NOT_PROVIDED}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{GROUP_PLURAL[t.group]}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary tabular-nums">{t.synonyms.length}</span>
                    </Table.Cell>
                    <Table.Cell>{statusBadge(t)}</Table.Cell>
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

// ── The species record ──

function ReadTable({ label, columns, rows }: { label: string; columns: FieldDef[]; rows: Record<string, string>[] }) {
  const filled = rows.filter((r) => Object.values(r).some(Boolean));
  if (!filled.length) return <p className="text-sm text-tertiary">Nothing recorded yet.</p>;
  const cols = columns.filter((c) => filled.some((r) => r[c.id]));
  return (
    <div className="overflow-x-auto">
      <Table aria-label={label} size="sm">
        <Table.Header>
          {cols.map((c, i) => (
            <Table.Head key={c.id} id={c.id} label={c.label} isRowHeader={i === 0} />
          ))}
        </Table.Header>
        <Table.Body items={filled.map((r, i) => ({ ...r, __id: String(i) }) as Record<string, string>)}>
          {(r) => (
            <Table.Row id={r.__id}>
              {cols.map((c) => (
                <Table.Cell key={c.id}>
                  <span className="text-sm whitespace-nowrap text-secondary">{r[c.id] || <span className="text-quaternary">{NOT_PROVIDED}</span>}</span>
                </Table.Cell>
              ))}
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

/** A record card. Editing, it takes the one editing treatment (4.8): brand border, brand-50 halo, "Editing". */
function Card({ title, editing, actions, children }: { title?: React.ReactNode; editing?: boolean; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={editing ? "flex flex-col rounded-xl border border-[var(--color-brand-500)] bg-primary ring-4 ring-[var(--color-brand-50)]" : "flex flex-col rounded-xl border border-secondary bg-primary"}>
      {(title || editing || actions) && (
        <div className="flex min-h-[3.25rem] items-center justify-between gap-3 border-b border-secondary px-5 py-3">
          {title && <div className="min-w-0 text-sm font-semibold text-primary">{title}</div>}
          <div className="flex shrink-0 items-center gap-2">
            {editing && <p className="text-xs font-medium text-brand-secondary">Editing</p>}
            {actions}
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function TabView({ tab, taxon, taxa }: { tab: TabDef; taxon: Taxon; taxa: Taxon[] }) {
  if (tab.kind === "grid")
    return (
      <Card title={tab.label}>
        <FieldGridView sections={tab.sections} values={taxon.values} />
      </Card>
    );
  if (tab.kind === "attributes")
    return (
      <Card title="Attributes">
        <ReadTable label="Attributes" columns={ATTRIBUTE_COLUMNS} rows={taxon.tables.attributes ?? []} />
      </Card>
    );
  return (
    <div className="flex flex-col gap-4">
      {tab.tables.map((table) => {
        const rows = table.id === "linkedParents" ? linkedRows(taxon, taxa, "parents") : table.id === "linkedChildren" ? linkedRows(taxon, taxa, "children") : (taxon.tables[table.id] ?? []);
        return (
          <Card key={table.id} title={table.title}>
            <ReadTable label={table.title} columns={table.columns} rows={rows} />
          </Card>
        );
      })}
    </div>
  );
}

/** The fields a synonym carries: its own NSX facts, then the name parts and qualifiers. */
const synonymValues = (s: Synonym) => ({ ...s.values, nsx: s.values.nsx ?? "" });

/**
 * Synonyms: every old name of the species, one open at a time. The list says how many there are and
 * adds one ("+"); the open synonym is read in the Figma's grid, and edited or removed ("-") from its card.
 */
function SynonymsView({
  taxon,
  selectedId,
  onSelect,
  draft,
  onDraft,
  onAdd,
  onRemove,
}: {
  taxon: Taxon;
  selectedId: string | null;
  onSelect: (id: string) => void;
  draft: Synonym | null;
  onDraft: (s: Synonym) => void;
  onAdd: () => void;
  onRemove: (s: Synonym) => void;
}) {
  const enrich = useDynamicOptions(taxon.kingdom);
  const fields = synonymFieldsFor(taxon.kingdom);
  const isNew = !!draft && !taxon.synonyms.some((s) => s.id === draft.id);
  const list = isNew && draft ? [...taxon.synonyms, draft] : taxon.synonyms;
  const open = draft ?? taxon.synonyms.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <section aria-label="Synonyms" className="flex flex-col rounded-xl border border-secondary bg-primary">
        <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3">
          <p className="text-sm font-semibold text-primary">All synonyms</p>
          <Button color="secondary" size="sm" iconLeading={Plus} onClick={onAdd} isDisabled={!!draft}>
            Add
          </Button>
        </div>
        {list.length === 0 ? (
          <p className="px-4 py-4 text-sm text-balance text-tertiary">No synonyms recorded. Add the species&apos; earlier names here.</p>
        ) : (
          <ListBox
            aria-label="Synonyms of this species"
            selectionMode="single"
            selectionBehavior="replace"
            disallowEmptySelection
            disabledKeys={draft ? list.filter((s) => s.id !== draft.id).map((s) => s.id) : []}
            selectedKeys={open ? [open.id] : []}
            onSelectionChange={(keys) => {
              const id = [...(keys as Set<string>)][0];
              if (id) onSelect(String(id));
            }}
            className="flex flex-col gap-0.5 p-2 outline-hidden"
          >
            {list.map((s) => (
              <ListBoxItem
                key={s.id}
                id={s.id}
                textValue={s.name}
                className={({ isSelected, isFocusVisible, isDisabled }) =>
                  cx(
                    "flex cursor-pointer flex-col rounded-lg px-3 py-2 outline-hidden transition duration-100 ease-linear hover:bg-primary_hover",
                    isSelected && "bg-brand-50 hover:bg-brand-50",
                    isFocusVisible && "ring-2 ring-brand ring-inset",
                    isDisabled && "cursor-default opacity-50 hover:bg-transparent",
                  )
                }
              >
                {({ isSelected }) => (
                  <>
                    <span className={cx("text-sm font-medium italic", isSelected ? "text-brand-secondary" : "text-primary")}>{s.name || "New synonym"}</span>
                    {s.values.author && <span className="text-xs text-tertiary">{s.values.author}</span>}
                  </>
                )}
              </ListBoxItem>
            ))}
          </ListBox>
        )}
      </section>

      {open ? (
        draft ? (
          <Card title={<span className="italic">{draft.name || "New synonym"}</span>} editing>
            <FieldGrid
              sections={fields.map((sec) => ({ ...sec, rows: sec.rows.map((row) => row.map((d) => enrich(d, draft.values))) }))}
              values={synonymValues(draft)}
              onChange={(id, v) => {
                const values = withValue(draft.values, id, v);
                onDraft({ ...draft, values, name: [values.genus, values.species].filter(Boolean).join(" ") });
              }}
            />
          </Card>
        ) : (
          <Card
            title={<span className="italic">{open.name}</span>}
            actions={
              <>
                <Button color="secondary" size="sm" iconLeading={Edit02} onClick={() => onDraft(open)}>
                  Edit
                </Button>
                <Button color="tertiary" size="sm" iconLeading={Trash01} onClick={() => onRemove(open)}>
                  Remove
                </Button>
              </>
            }
          >
            <FieldGridView sections={fields} values={synonymValues(open)} />
          </Card>
        )
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-secondary p-6">
          <p className="text-sm text-balance text-tertiary">A synonym is an earlier name for this same species. Add one to record it.</p>
          <Button color="secondary" size="sm" iconLeading={Plus} onClick={onAdd}>
            Add synonym
          </Button>
        </div>
      )}
    </div>
  );
}

export function SpeciesRecord({ id }: { id: string }) {
  const taxon = useTaxon(id);
  const taxa = useTaxa();
  const hydrated = useTaxaHydrated();
  const router = useRouter();
  const roleHref = useRoleHref();
  const [view, setView] = useState<"details" | "synonyms">("details");
  const [tab, setTab] = useState("main");
  const [draft, setDraft] = useState<Taxon | null>(null);
  const [synId, setSynId] = useState<string | null>(null);
  const [synDraft, setSynDraft] = useState<Synonym | null>(null);
  const [confirm, setConfirm] = useState<"cancel" | null>(null);
  const [removing, setRemoving] = useState<Synonym | null>(null);

  if (!taxon)
    return hydrated ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">Species not found</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">There is no taxon with the id &ldquo;{id}&rdquo;.</p>
        <Button color="link-color" size="sm" href={roleHref(TX_ROOT)}>
          All species
        </Button>
      </div>
    ) : null;

  const tabs = tabsFor(taxon.kingdom);
  const successors = taxon.children.map((c) => taxa.find((t) => t.id === c)).filter((t): t is Taxon => !!t);
  const synSaved = synDraft ? taxon.synonyms.find((s) => s.id === synDraft.id) : undefined;
  const editing = draft ? "species" : synDraft ? "synonym" : null;
  const dirty = editing === "species" ? JSON.stringify(draft) !== JSON.stringify(taxon) : editing === "synonym" ? !synSaved || JSON.stringify(synDraft) !== JSON.stringify(synSaved) : false;
  const openSynId = synId ?? taxon.synonyms[0]?.id ?? null;

  const stopEditing = () => {
    setDraft(null);
    setSynDraft(null);
  };
  const save = () => {
    if (draft) {
      saveTaxon(draft);
      toast.success("Species saved", { description: taxon.scientific });
    } else if (synDraft) {
      if (!synDraft.name.trim()) {
        toast.error("Name the synonym first", { description: "Choose its Genus and Species." });
        return;
      }
      saveSynonym(taxon.id, synDraft);
      setSynId(synDraft.id);
      toast.success(synSaved ? "Synonym saved" : "Synonym added", { description: synDraft.name });
    }
    stopEditing();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <RecordBackLink href={roleHref(TX_ROOT)}>All species</RecordBackLink>
        <RecordHero
          eyebrow={`${taxon.kingdom} species`}
          title={taxon.common || taxon.scientific}
          subtitle={<span className="italic">{taxon.scientific}</span>}
          actions={
            <RecordActionBar
              onDark
              primary={{
                id: "edit",
                label: "Edit species",
                icon: Edit02,
                isDisabled: !!editing,
                onPress: () => {
                  setView("details");
                  setDraft(taxon);
                },
              }}
              menu={[
                { id: "rename", label: "Rename", icon: PencilLine, onPress: () => router.push(roleHref(actionHref("rename", taxon.id))), isDisabled: !taxon.current || !taxon.nsx },
                { id: "combine", label: "Combine with another taxon", icon: GitMerge, onPress: () => router.push(roleHref(actionHref("combine", taxon.id))), isDisabled: !taxon.current || !taxon.nsx },
                { id: "split", label: "Split", icon: GitBranch01, onPress: () => router.push(roleHref(actionHref("split", taxon.id))), isDisabled: !taxon.current || !taxon.nsx },
              ]}
            />
          }
        >
          {/* The Figma's header facts: NSX Code, NSX Desc, and ScientificNameID for flora. */}
          <HeroMeta label="NSX Code">{taxon.nsx ?? NOT_PROVIDED}</HeroMeta>
          <HeroMeta label="NSX Desc">{taxon.values.nsxDesc || NOT_PROVIDED}</HeroMeta>
          {taxon.kingdom === "Flora" && <HeroMeta label="ScientificNameID">{taxon.values.scientificNameId || NOT_PROVIDED}</HeroMeta>}
          <HeroMeta label="Status">{taxon.current ? "Current" : "Superseded"}</HeroMeta>
        </RecordHero>

        {!taxon.current && (
          <div className="px-6 pt-4">
            <AlertFullWidth
              contained
              wrap
              color="gray"
              title="This taxon is no longer current"
              description={successors.length ? `It became ${successors.map((s) => s.scientific).join(", ")}. It can be viewed, but not renamed, combined or split.` : "It can be viewed, but not renamed, combined or split."}
              confirmLabel={successors.length ? `Open ${successors[0].scientific}` : "All species"}
              onConfirm={() => router.push(roleHref(successors.length ? speciesHref(successors[0].id) : TX_ROOT))}
            />
          </div>
        )}

        <div className="flex px-6 pt-6">
          <ViewSwitch
            label="Show"
            value={view}
            onChange={(v) => !editing && setView(v)}
            items={[
              { id: "details", label: "Species details" },
              { id: "synonyms", label: "Synonyms", count: taxon.synonyms.length },
            ]}
          />
        </div>

        {view === "details" ? (
          <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} className="px-6 pt-4">
            <div className="overflow-x-auto">
              <TabList aria-label="Species details" type="underline" items={tabs.map((t) => ({ id: t.id, label: t.label }))} className="w-max min-w-full">
                {(item) => <Tab id={item.id} label={item.label} />}
              </TabList>
            </div>
            {tabs.map((t) => (
              <TabPanel key={t.id} id={t.id} className="pt-4">
                {draft ? (
                  // One editing card per card shown in view mode, titled the same, so no heading repeats.
                  t.kind === "table" ? (
                    <div className="flex flex-col gap-4">
                      {t.tables.map((table) => (
                        <Card key={table.id} title={table.title} editing>
                          <TaxonTableEditor table={table} draft={draft} onChange={setDraft} />
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card title={t.label} editing>
                      <TaxonTabContent tab={t} draft={draft} onChange={setDraft} bare />
                    </Card>
                  )
                ) : (
                  <TabView tab={t} taxon={taxon} taxa={taxa} />
                )}
              </TabPanel>
            ))}
          </Tabs>
        ) : (
          <div className="px-6 pt-4">
            <SynonymsView
              taxon={taxon}
              selectedId={openSynId}
              onSelect={setSynId}
              draft={synDraft}
              onDraft={setSynDraft}
              onAdd={() => setSynDraft({ id: `${taxon.id}-syn-${Date.now()}`, name: "", values: {} })}
              onRemove={setRemoving}
            />
          </div>
        )}
      </div>

      {editing && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary px-6 py-4">
          <p className="text-sm text-tertiary">
            Editing{" "}
            <span className="font-semibold text-primary">{editing === "species" ? taxon.common || taxon.scientific : synSaved ? synDraft?.name : "a new synonym"}</span>
            {dirty ? " · Unsaved changes" : ""}
          </p>
          <div className="flex items-center gap-3">
            <Button color="secondary" onClick={() => (dirty ? setConfirm("cancel") : stopEditing())}>
              Cancel
            </Button>
            <Button color="primary" isDisabled={!dirty} onClick={save}>
              {editing === "synonym" && !synSaved ? "Add synonym" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirm === "cancel"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Discard your changes?"
        description={editing === "synonym" ? "What you entered for this synonym will be lost." : "The changes you made to this species will be lost."}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          stopEditing();
          setConfirm(null);
        }}
      />
      <DestructiveModal
        isOpen={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this synonym?"
        description={`${removing?.name ?? ""} will no longer be listed as a synonym of ${taxon.scientific}.`}
        confirmLabel="Remove synonym"
        onConfirm={() => {
          if (removing) {
            deleteSynonym(taxon.id, removing.id);
            toast.success("Synonym removed", { description: removing.name });
            setSynId(taxon.synonyms.find((s) => s.id !== removing.id)?.id ?? null);
          }
          setRemoving(null);
        }}
      />
    </div>
  );
}

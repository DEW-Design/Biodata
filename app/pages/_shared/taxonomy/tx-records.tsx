"use client";

import { useState, type FC } from "react";
import { useRouter } from "next/navigation";
import { ListBox, ListBoxItem, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { ChevronDown, Edit05, GitBranch01, GitMerge, PencilLine, Plus, Trash01, Flag01, ArrowLeft, Save01, XClose, File06, Type01, Map02, Globe01, MarkerPin04, BookClosed, List } from "@untitledui/icons";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { DestructiveModal } from "@/components/application/modals/modal";
import { Table } from "@/components/application/table/table";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { toast } from "@/components/application/toast/toast";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { segmentClass, segmentTrayClass } from "@/app/pages/project-detail/segmented";
import { FieldGrid, FieldGridView, NOT_PROVIDED, withValue } from "@/app/pages/_shared/taxonomy/tx-fields";
import { TaxonTabContent, TaxonTableEditor, linkedRows, useDynamicOptions } from "@/app/pages/_shared/taxonomy/tx-editor";
import { nodeHref, useTaxonNodes } from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { deleteSynonym, saveSynonym, saveTaxon, useTaxa, useTaxaHydrated, useTaxon } from "@/app/pages/_shared/taxonomy/tx-store";
import { ATTRIBUTE_COLUMNS, CHANGE_META, TX_ROOT, CHANGE_TYPES, synonymFieldsFor, tabsFor, type ChangeType, type FieldDef, type Kingdom, type Synonym, type TabDef, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// An icon for each species tab (CONTRACTS 3.13), the one the app uses for the same thing; the tabs themselves come from
// the Figma field definitions (tx-data.ts), unchanged.
export const TAB_ICON: Record<string, FC<{ className?: string }>> = {
  main: File06,
  speciesStatus: Flag01,
  commonName: Type01,
  saRegions: Map02,
  ausDistribution: Globe01,
  regionalData: MarkerPin04,
  speciesReference: BookClosed,
  attributes: List,
};

// Taxonomy Management shows a species the way every collection in the app does ("List -> deep dive",
// ref-shell.md): a species record laid out like the project page (4.6), edited in place (4.8), opened from the
// list of every rank (tx-v2-list.tsx). A species' Rename, Combine and Split, and "Update taxonomy" on the
// list, open each change on its own page (tx-v2-rename.tsx and the others). The species-only list and guided
// change that were here were retired on 26 Oct 2026.
//
// Designer review, Sept 30 2026 (Option 3 chosen; Options 1 and 2 retired Oct 1 2026):
// - the toolbar is search, then Filter on the left, and the List / Hierarchy switch on the right, drawn
//   like the project page's Tree / Table switch (the same segmented classes and icons), spaced like
//   User Management's lists;
// - "Update taxonomy" is a menu of the four changes;
// - a record's cards read in the Figma's grid, label over value, the same columns as when edited;
// - Synonyms is its own view of the record (the team's Figma comment: see them all, add one with "+",
//   remove the one shown with "-"), not another tab.

/** A taxon change's page (Append, Rename, Combine or Split), opened on a kingdom's taxa when one is given. */
export const actionHref = (type: ChangeType, kingdom?: Kingdom) => `${TX_ROOT}/${type}${kingdom ? `?kingdom=${kingdom}` : ""}`;

export const statusBadge = (t: { current: boolean }) => (
  <Badge size="sm" color={t.current ? "success" : "gray"}>
    {t.current ? "Current" : "Superseded"}
  </Badge>
);

/** A two or three way view switch, the project page's Tree / Table switch (segmented.ts). */
export function ViewSwitch<T extends string>({ label, value, onChange, items }: { label: string; value: T; onChange: (v: T) => void; items: { id: T; label: string; icon?: FC<{ className?: string }>; count?: number }[] }) {
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

/** "Update taxonomy": a menu of the four changes, each opening its own page. `hrefFor` sends a change elsewhere. */
export function NewChangeMenu({ hrefFor = (t: ChangeType) => actionHref(t), labelFor = (t: ChangeType) => CHANGE_META[t].title }: { hrefFor?: (type: ChangeType) => string; labelFor?: (type: ChangeType) => string }) {
  const router = useRouter();
  const roleHref = useRoleHref();
  const icons: Record<ChangeType, FC<{ className?: string }>> = { rename: PencilLine, combine: GitMerge, split: GitBranch01, append: Plus };
  return (
    <Dropdown.Root>
      <Button color="primary" iconLeading={Plus} iconTrailing={ChevronDown}>
        Update taxonomy
      </Button>
      <Dropdown.Popover placement="bottom right">
        <Dropdown.Menu aria-label="Update taxonomy" onAction={(key) => router.push(roleHref(hrefFor(key as ChangeType)))}>
          {CHANGE_TYPES.map((t) => (
            <Dropdown.Item key={t} id={t} icon={icons[t]} label={labelFor(t)} />
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
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

/** A record card. Editing, it takes the one editing treatment (4.8): brand border and brand-50 halo, with no label. */
export function Card({ title, editing, actions, children }: { title?: React.ReactNode; editing?: boolean; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={editing ? "flex flex-col rounded-xl border border-[var(--color-brand-500)] bg-primary ring-4 ring-[var(--color-brand-50)]" : "flex flex-col rounded-xl border border-secondary bg-primary"}>
      {(title || actions) && (
        <div className="flex min-h-[3.25rem] items-center justify-between gap-3 border-b border-secondary px-5 py-3">
          {title && <div className="min-w-0 text-sm font-semibold text-primary">{title}</div>}
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function TabView({ tab, taxon, taxa }: { tab: TabDef; taxon: Taxon; taxa: Taxon[] }) {
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
                <Button color="secondary" size="sm" iconLeading={Edit05} onClick={() => onDraft(open)}>
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

/** A species' page, opened from the list of every rank; its Back link returns there. */
export function SpeciesRecord({ id }: { id: string }) {
  const taxon = useTaxon(id);
  const taxa = useTaxa();
  const nodes = useTaxonNodes();
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
          All taxa
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
        <RecordBackLink href={roleHref(TX_ROOT)}>All taxa</RecordBackLink>
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
                icon: Edit05,
                isDisabled: !!editing,
                onPress: () => {
                  setView("details");
                  setDraft(taxon);
                },
              }}
              menu={[
                { id: "rename", label: "Rename", icon: PencilLine, onPress: () => router.push(roleHref(actionHref("rename", taxon.kingdom))), isDisabled: !taxon.current || !taxon.nsx },
                { id: "combine", label: "Combine with another taxon", icon: GitMerge, onPress: () => router.push(roleHref(actionHref("combine", taxon.kingdom))), isDisabled: !taxon.current || !taxon.nsx },
                { id: "split", label: "Split", icon: GitBranch01, onPress: () => router.push(roleHref(actionHref("split", taxon.kingdom))), isDisabled: !taxon.current || !taxon.nsx },
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
              confirmLabel={successors.length ? `Open ${successors[0].scientific}` : "All taxa"}
              onConfirm={() => router.push(roleHref(successors.length ? nodeHref(nodes.find((n) => n.taxon?.id === successors[0].id)?.id ?? successors[0].id) : TX_ROOT))}
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
            <div className="-mb-1.5 overflow-x-auto pb-1.5">
              <TabList aria-label="Species details" type="underline" items={tabs.map((t) => ({ id: t.id, label: t.label, icon: TAB_ICON[t.id] ?? File06 }))} className="w-max min-w-full">
                {(item) => <Tab id={item.id} label={item.label} icon={item.icon} />}
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
            {dirty ? ", unsaved changes" : ""}
          </p>
          <div className="flex items-center gap-3">
            <Button iconLeading={XClose} color="secondary" onClick={() => (dirty ? setConfirm("cancel") : stopEditing())}>
              Cancel
            </Button>
            <Button iconLeading={editing === "synonym" && !synSaved ? Plus : Save01} color="primary" isDisabled={!dirty} onClick={save}>
              {editing === "synonym" && !synSaved ? "Add synonym" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
      <DestructiveModal
        confirmIcon={Trash01}
        cancelIcon={ArrowLeft}
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
        confirmIcon={Trash01}
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

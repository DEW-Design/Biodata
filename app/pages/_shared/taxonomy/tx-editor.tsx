"use client";

import { AttributesPanel, FieldGrid, FieldTable, withValue } from "@/app/pages/_shared/taxonomy/tx-fields";
import { useTaxa } from "@/app/pages/_shared/taxonomy/tx-store";
import { nameOptions, type FieldDef, type GridSection, type Kingdom, type Row, type TabDef, type TableDef, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { } from "@/utils/cx";

// The editable panels of a species record: one tab's fields (`TaxonTabContent`) or one of its tables
// (`TaxonTableEditor`), with the option lists that come from the taxa themselves.

/** Option lists that come from the taxa themselves (the genus and species pickers, Linked Species). */
export function useDynamicOptions(kingdom: Kingdom | null) {
  const taxa = useTaxa();
  const opts = nameOptions(taxa, kingdom);
  const names = taxa.map((t) => t.scientific).sort((a, b) => a.localeCompare(b));
  return (def: FieldDef, values: Record<string, string> = {}): FieldDef => {
    if (def.options) return def;
    const byId: Record<string, string[]> = {
      family: opts.families,
      genus: opts.genera,
      species: def.kind === "text" ? [] : names.length && def.label === "Linked species" ? names : opts.species,
      author: opts.authors,
      order: opts.orders,
      higherTaxaName: opts.higherNames(values.higherTaxaLevel || "Order"),
    };
    return byId[def.id]?.length ? { ...def, options: byId[def.id] } : def;
  };
}

const withGridOptions = (sections: GridSection[], values: Record<string, string>, enrich: ReturnType<typeof useDynamicOptions>) =>
  sections.map((s) => ({ ...s, rows: s.rows.map((row) => row.map((d) => enrich(d, values))) }));

/** Linked Species rows start from the taxon's recorded parents and children. */
export function linkedRows(t: Taxon, taxa: Taxon[], which: "parents" | "children"): Row[] {
  const tableId = which === "parents" ? "linkedParents" : "linkedChildren";
  if (t.tables[tableId]) return t.tables[tableId];
  return t[which].map((id) => {
    const other = taxa.find((x) => x.id === id);
    return { code: other?.nsx ?? "", species: other?.scientific ?? "" };
  });
}

/** One table of a table tab, editable. */
export function TaxonTableEditor({ table, draft, onChange }: { table: TableDef; draft: Taxon; onChange: (next: Taxon) => void }) {
  const taxa = useTaxa();
  const enrich = useDynamicOptions(draft.kingdom);
  const rows = table.id === "linkedParents" ? linkedRows(draft, taxa, "parents") : table.id === "linkedChildren" ? linkedRows(draft, taxa, "children") : (draft.tables[table.id] ?? []);
  return <FieldTable table={{ ...table, columns: table.columns.map((c) => enrich(c)) }} rows={rows} onChange={(next) => onChange({ ...draft, tables: { ...draft.tables, [table.id]: next } })} />;
}

/**
 * One tab's fields, editable, writing into `draft`. `bare` leaves out the headings a surrounding card
 * already gives (a record's editing card is titled with the tab or table).
 */
export function TaxonTabContent({ tab, draft, onChange, bare = false }: { tab: TabDef; draft: Taxon; onChange: (next: Taxon) => void; bare?: boolean }) {
  const enrich = useDynamicOptions(draft.kingdom);
  if (tab.kind === "grid")
    return <FieldGrid sections={withGridOptions(tab.sections, draft.values, enrich)} values={draft.values} onChange={(id, v) => onChange({ ...draft, values: withValue(draft.values, id, v) })} />;
  if (tab.kind === "attributes")
    return (
      <AttributesPanel
        rows={draft.tables.attributes ?? []}
        notifications={draft.tables.notifications ?? []}
        onRowsChange={(rows) => onChange({ ...draft, tables: { ...draft.tables, attributes: rows } })}
        onNotificationsChange={(rows) => onChange({ ...draft, tables: { ...draft.tables, notifications: rows } })}
        showHeading={!bare}
      />
    );
  return (
    <div className="flex flex-col gap-8">
      {tab.tables.map((table) => (
        <div key={table.id} className="flex flex-col gap-4">
          {!bare && <p className="border-b border-secondary pb-3 text-sm font-semibold text-primary">{table.title}</p>}
          <TaxonTableEditor table={table} draft={draft} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}

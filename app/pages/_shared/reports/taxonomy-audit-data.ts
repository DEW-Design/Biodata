// The rows of the Taxonomy Report's "Taxonomy list Audit Log Report" (the designer, 15 Oct 2026): one row for each thing that happened to a
// taxon, oldest first, numbered from 1 (Seq#), and the parameters above the sheet's columns (NSX Code, Species Code & Name, Common Name, Audit
// log Duration as a start and an end date, Modified By, Modified Date).
//
// What the app knows is two things, and the log is those: the changes a person committed in Taxonomy Management (a Rename, Combine, Split or
// Append: `useChanges`), and the days and people a taxon itself records (Created On and By, and Edited or Modified On and By). Nothing
// is invented to fill the sheet. A taxon's own record of a day is left out when a change on the same taxon the same day already says it, so
// one Rename is one row. The app keeps no field-by-field history of a taxon, no source of a change and no second or third person to
// comment, so Source Type, Source, and the later User and Comments columns are empty.

import { adelaide } from "@/app/pages/_shared/reports/taxonomy-management-data";
import { isoDay, joined } from "@/app/pages/_shared/reports/taxonomy-report-data";
import type { Taxon, TaxonChange } from "@/app/pages/_shared/taxonomy/tx-data";

export interface AuditRow {
  id: string;
  seq: number;
  /** The time as the sheet writes it: a day and time for a change, a day for what a taxon records. */
  timestamp: string;
  ms: number;
  day: string;
  nsx: string;
  nsxDescription: string;
  common: string;
  commonNames: string;
  entityType: string;
  modifiedEntity: string;
  previous: string;
  current: string;
  action: string;
  user: string;
}

const ACTION: Record<TaxonChange["type"], string> = { rename: "Rename", combine: "Combine", split: "Split", append: "Append" };

const dayFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function auditRowsFor(taxa: Taxon[], changes: TaxonChange[]): AuditRow[] {
  const taxon = new Map(taxa.map((t) => [t.id, t]));
  const rows: Omit<AuditRow, "seq">[] = [];
  const said = new Set<string>();

  const facts = (id: string | undefined) => {
    const t = id ? taxon.get(id) : undefined;
    return { nsx: t?.nsx ?? "", nsxDescription: t?.scientific ?? "", common: t?.common ?? "", commonNames: joined((t?.tables.commonName ?? []).map((n) => n.name)) };
  };

  for (const change of changes) {
    const when = adelaide(change.at);
    const before = joined(change.inputs.map((i) => i.name), " + ");
    for (const t of [...change.inputs, ...change.outputs]) said.add(`${t.id}|${when.day}`);
    change.outputs.forEach((out, i) => {
      rows.push({
        ...facts(out.id),
        id: `${change.id}:${i}`,
        timestamp: when.text,
        ms: when.ms,
        day: when.day,
        entityType: "Taxon",
        modifiedEntity: out.name,
        // A rename and a split are from one species, a combine from every species it took in, an append from nothing.
        previous: before,
        current: out.name,
        action: ACTION[change.type],
        user: change.by,
      });
    });
  }

  for (const t of taxa) {
    const v = t.values;
    const own: { written: string | undefined; by: string | undefined; action: string; previous: string; current: string }[] = [
      { written: v.createdOn, by: v.createdBy, action: "Create", previous: "", current: t.scientific },
      { written: v.renamedOn, by: v.renamedBy, action: "Rename", previous: "", current: t.scientific },
      { written: v.editedOn ?? v.modifiedOn, by: v.editedBy ?? v.modifiedBy, action: "Update", previous: "", current: t.scientific },
    ];
    own.forEach((e, i) => {
      const day = e.written ? isoDay(e.written) : null;
      if (!e.written || !day || said.has(`${t.id}|${day}`)) return;
      rows.push({
        ...facts(t.id),
        id: `${t.id}:own${i}`,
        timestamp: dayFormat.format(Date.parse(`${day}T12:00:00Z`)),
        ms: Date.parse(`${day}T12:00:00Z`),
        day,
        entityType: "Taxon",
        modifiedEntity: t.scientific,
        previous: e.previous,
        current: e.current,
        action: e.action,
        user: e.by ?? "",
      });
    });
  }

  return rows.sort((a, b) => a.ms - b.ms).map((r, i) => ({ ...r, seq: i + 1 }));
}

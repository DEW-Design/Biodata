// The rows of the Taxonomy Report's "Taxonomy list Audit Log Report" (the designer, 15 Oct 2026): one row for each thing that happened to a
// taxon, oldest first, numbered from 1 (Seq#), and the parameters above the sheet's columns (NSX Code, Species Code & Name, Common Name, Audit
// log Duration as a start and an end date, Modified By, Modified Date).
//
// What the app knows is two things, and the log is those: the changes a person committed in Taxonomy Management (a Rename, Combine, Split or
// Append: `useChanges`), all four rolled up here and in no other tab (the designer, 16 Oct 2026: "I need Combine, Split, Append, and Rename rolled up in the audit
// log. Remove the split, append and rename tabs"), and the days and people a taxon itself records (Created On and By, and Edited or Modified On and By). A change
// is written the way the designer's capture of the Project Audit Log shows an entry (16 Oct 2026): one row for each name it produced (a Split of a species into
// three is three rows), the Entity type "Concept", the Modified entity the rank of the name ("Genus", "Species", "Subspecies"), the Previous details the name
// before (every name a Combine took in, joined with " + ") and the Current details the name after, the Action, the Source type "Portal" and the timestamp as
// "16/10/2026 12:00:00 AM". A taxon's own record of a day is left out when a change on the same taxon the same day already says it, so one Rename is one row,
// and is written at the start of that day. The app keeps no field-by-field history of a taxon and no second or third person to comment, so the Comments
// columns are empty. The Source is the role that made the change: Taxonomy Management is BioData Admin and above, so it is "BioData Admin" (mock).

import { adelaide, parseScientific } from "@/app/pages/_shared/reports/taxonomy-management-data";
import { isoDay, joined } from "@/app/pages/_shared/reports/taxonomy-report-data";
import type { MockAuditEvent } from "@/app/pages/_shared/reports/taxonomy-audit-mock";
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
  sourceType: string;
  source: string;
  user: string;
}

const ACTION: Record<TaxonChange["type"], string> = { rename: "Rename", combine: "Combine", split: "Split", append: "Append" };

/** Every action an audit log can hold: the Filter's Action attribute always offers all of them (the designer, 16 Oct 2026: add Combine, Rename, Split and Append to the actions filter), whether or not a row has one yet. */
export const AUDIT_ACTIONS = ["Combine", "Rename", "Split", "Append", "Create", "Update"];

const moment = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Adelaide", day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });

/** An instant as the capture writes it: the day, then the time to the second, in Adelaide ("16/10/2026 3:42:09 PM"). */
const timestampOf = (ms: number) => moment.format(ms).replace(",", "").replace(/\b([ap])m\b/i, (m) => m.toUpperCase());

/** A day as the capture writes a moment with no time: its start ("16/10/2026 12:00:00 AM"). */
const startOf = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} 12:00:00 AM`;

const INFRA_RANK: Record<string, string> = { "subsp.": "Subspecies", "ssp.": "Subspecies", "var.": "Variety", "f.": "Form", "forma.": "Form", "subvar.": "Subvariety" };

/** What a name is a name of: a Genus (one word), a Species (two), or the rank of its last infraspecific part. */
export function rankOf(name: string): string {
  const { genus, species, infra } = parseScientific(name);
  if (infra.length > 0) return INFRA_RANK[infra[infra.length - 1].rank.toLowerCase()] ?? "Infraspecific";
  return species ? "Species" : genus ? "Genus" : "";
}

/** Every row is made by a BioData Admin through the web portal: Taxonomy Management is not offered to any other role. */
const PORTAL = { sourceType: "Portal", source: "BioData Admin" };

export function auditRowsFor(taxa: Taxon[], changes: TaxonChange[], mock: MockAuditEvent[] = []): AuditRow[] {
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
        timestamp: timestampOf(when.ms),
        ms: when.ms,
        day: when.day,
        entityType: "Concept",
        modifiedEntity: rankOf(out.name),
        // A rename and a split are from one species, a combine from every species it took in, an append from nothing.
        previous: before,
        current: out.name,
        action: ACTION[change.type],
        ...PORTAL,
        user: change.by,
      });
    });
  }

  // Mock entries (taxonomy-audit-mock.ts), written like a committed change.
  mock.forEach((event, e) => {
    const ms = Date.parse(event.at);
    event.made.forEach((out, i) => {
      rows.push({
        id: `mock:${e}:${i}`,
        timestamp: timestampOf(ms),
        ms,
        day: adelaide(event.at).day,
        nsx: out.nsx,
        nsxDescription: out.name,
        common: out.common,
        commonNames: out.common,
        entityType: "Concept",
        modifiedEntity: rankOf(out.name),
        previous: joined(event.before, " + "),
        current: out.name,
        action: event.action,
        ...PORTAL,
        user: event.by,
      });
    });
  });

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
        timestamp: startOf(day),
        ms: Date.parse(`${day}T12:00:00Z`),
        day,
        entityType: "Concept",
        modifiedEntity: rankOf(t.scientific),
        previous: e.previous,
        current: e.current,
        action: e.action,
        ...PORTAL,
        user: e.by ?? "",
      });
    });
  }

  return rows.sort((a, b) => a.ms - b.ms).map((r, i) => ({ ...r, seq: i + 1 }));
}

// The rows of the Flora Taxonomy Report's "Taxonomy list Management Report" sheet that is still a tab, Species Synonym (the designer, 15 Oct 2026), and the parameters
// that sit above its columns (NSX Code, Species Name, Common Name, Created On as a start and an end date, Created By). A row is read from each taxon's synonyms (the
// names it was known by). The Rename, Split and Append sheets are no longer tabs: what a person commits in Taxonomy Management is rolled up in the audit log
// (taxonomy-audit-data.ts), the designer's decision of 16 Oct 2026. The app does not record who edited a synonym or when, so Modified By and Modified On are empty.

import { dayText, isoDay, joined } from "@/app/pages/_shared/reports/taxonomy-report-data";
import type { Synonym, Taxon } from "@/app/pages/_shared/taxonomy/tx-data";

export interface Infra {
  rank: string;
  name: string;
}

/** "Genus species subsp. name var. name", taken apart: the genus, the species and up to three infraspecific ranks with their names. */
export function parseScientific(name: string): { genus: string; species: string; infra: Infra[] } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const [genus = "", species = "", ...rest] = words;
  const infra: Infra[] = [];
  for (const word of rest) {
    if (/^(subsp|ssp|var|f|forma|subvar)\.?$/i.test(word)) infra.push({ rank: word.endsWith(".") ? word : `${word}.`, name: "" });
    else if (infra.length > 0) infra[infra.length - 1].name = joined([infra[infra.length - 1].name, word], " ");
  }
  return { genus, species, infra };
}

export interface ManagementRow {
  id: string;
  seq: number;
  nsx: string;
  /** The species the row is about, for the Species Name parameter and the search. */
  speciesName: string;
  common: string;
  commonNames: string;
  family: string;
  order: string;
  majorGroup: string;
  genus: string;
  species: string;
  rank1: string;
  infra1: string;
  rank2: string;
  infra2: string;
  rank3: string;
  infra3: string;
  createdBy: string;
  createdOn: string;
  comments: string;
  modifiedBy: string;
  modifiedOn: string;
  /** The day the row was created, as an ISO day: what the Created On parameter reads. */
  days: string[];
  createdMs: number | null;
}

const adelaideDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Adelaide", year: "numeric", month: "2-digit", day: "2-digit" });
const adelaideText = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Adelaide", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

/** An instant as an Adelaide day (ISO) and as the sheet writes it ("15 Oct 2026, 1:27 pm"). */
export function adelaide(instant: string): { day: string; text: string; ms: number } {
  const ms = Date.parse(instant);
  return { day: adelaideDay.format(ms), text: adelaideText.format(ms).replace(/\s?([ap])m$/i, " $1m"), ms };
}

/** The columns a row takes from a taxon and the name a change produced. */
function base(taxon: Taxon | undefined, produced: string, nsxOf: string | null | undefined): Omit<ManagementRow, "id" | "seq" | "createdBy" | "createdOn" | "days" | "createdMs" | "speciesName"> {
  const p = parseScientific(produced);
  const [a, b, c] = [p.infra[0], p.infra[1], p.infra[2]];
  return {
    nsx: nsxOf ?? taxon?.nsx ?? "",
    common: taxon?.common ?? "",
    commonNames: joined((taxon?.tables.commonName ?? []).map((n) => n.name)),
    family: taxon?.ranks.family ?? "",
    order: taxon?.ranks.order ?? "",
    majorGroup: taxon?.values.majorGroup ?? "",
    genus: p.genus,
    species: p.species,
    rank1: a?.rank ?? "",
    infra1: a?.name ?? "",
    rank2: b?.rank ?? "",
    infra2: b?.name ?? "",
    rank3: c?.rank ?? "",
    infra3: c?.name ?? "",
    comments: "",
    modifiedBy: "",
    modifiedOn: "",
  };
}

// ── Species Synonym ──

export interface SynonymRow extends ManagementRow {
  synPartly: string;
  questionably: string;
  asMs: string;
  hybrid: string;
  hybridRank: string;
  hybridFormula: string;
  hybridParent2: string;
  published: string;
  matchesCc: string;
  date: string;
  comment: string;
}

/** One row for each name a taxon was known by. The NSX code, common name and classification are the taxon's own: a synonym carries no code of its own here. */
export function synonymRowsFor(taxa: Taxon[]): SynonymRow[] {
  const rows: Omit<SynonymRow, "seq">[] = [];
  for (const t of taxa) {
    t.synonyms.forEach((s: Synonym) => {
      const v = s.values;
      const written = v.creationDate ?? v.date ?? "";
      const day = written ? isoDay(written) : null;
      const infra = (n: number) => ({ rank: v[`infraRank${n}`] ?? "", name: v[`infraName${n}`] ?? "" });
      const [a, b, c] = [infra(1), infra(2), infra(3)];
      rows.push({
        ...base(t, s.name, t.nsx),
        id: s.id,
        speciesName: s.name,
        family: v.family || t.ranks.family,
        order: v.order || t.ranks.order,
        majorGroup: v.majorGroup ?? "",
        genus: v.genus || parseScientific(s.name).genus,
        species: v.species || parseScientific(s.name).species,
        rank1: a.rank,
        infra1: a.name,
        rank2: b.rank,
        infra2: b.name,
        rank3: c.rank,
        infra3: c.name,
        // The app records no creator for a synonym; Fauna's has a creation and a modified date.
        createdBy: "",
        createdOn: dayText(v.creationDate ?? ""),
        modifiedBy: "",
        modifiedOn: dayText(v.modifiedDate ?? ""),
        comments: v.comments ?? "",
        days: day ? [day] : [],
        createdMs: day ? Date.parse(`${day}T12:00:00Z`) : null,
        synPartly: v.synPartly ?? "",
        questionably: v.questionably ?? "",
        asMs: v.asMs ?? "",
        hybrid: v.hybrid ?? "",
        hybridRank: v.hybridRank ?? "",
        hybridFormula: v.hybridFormula ?? "",
        hybridParent2: joined([v.hybridParent2, v.hybridParent2__text], " - "),
        published: v.published1 || v.published2 || "",
        matchesCc: v.matchesCc ?? "",
        date: dayText(v.date ?? ""),
        comment: v.comments ?? "",
      });
    });
  }
  return rows.map((r, i) => ({ ...r, seq: i + 1 }));
}

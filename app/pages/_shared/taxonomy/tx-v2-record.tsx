"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertFullWidth } from "@/components/application/alerts/alerts";
import { File06 } from "@untitledui/icons";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { HeroMeta, RecordBackLink, RecordHero } from "@/app/pages/_shared/record-hero";
import { TX_ROOT, tabsFor, type TabDef, type Taxon } from "@/app/pages/_shared/taxonomy/tx-data";
import { NOT_PROVIDED } from "@/app/pages/_shared/taxonomy/tx-fields";
import { lineage, nsxOf, rankIndex, useTaxonNodes, type TaxonNode } from "@/app/pages/_shared/taxonomy/tx-hierarchy";
import { useTaxaHydrated } from "@/app/pages/_shared/taxonomy/tx-store";
import { SpeciesRecord, TAB_ICON, TabView } from "@/app/pages/_shared/taxonomy/tx-records";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// A taxon's page in version 2, at any rank (the designer, 14 Oct 2026: "all new ranks will have a detail page just the
// same as species detail page ... the higher ranks will now show the lower rank details"). A species or infraspecies is
// the species record itself. A higher taxon is laid out the same way (4.6): Back link, the card with its NSX Code and
// Status, then the species tabs for its kingdom, the species-only ones kept (the designer: "leave the species only as
// well"). Every tab keeps its fields, except a field that names a rank below the taxon's own (an order has no Family,
// Genus, Species, Author or infraspecific fields): the designer, "I only wanted you to remove details related to lower
// ranks".
// Open: editing a higher taxon, and its Synonyms view; Rename, Combine and Split for higher ranks.

/** Facts read as label over value, the record's view treatment (tx-fields.tsx, "readonly"). */
export function ValueGrid({ items, className }: { items: { label: string; value: string; italic?: boolean }[]; className?: string }) {
  return (
    <dl className={cx("grid gap-x-6 gap-y-5 sm:grid-cols-3", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col gap-1.5">
          <dt className="text-sm font-medium text-secondary">{it.label}</dt>
          <dd className={cx("m-0 text-sm break-words", it.value ? "text-primary" : "text-quaternary", it.value && it.italic && "italic")}>{it.value || NOT_PROVIDED}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The rank each name field belongs to; a field whose rank is below the taxon's own is left off its page. */
const FIELD_RANK: Record<string, TaxonNode["rank"]> = {
  order: "Order",
  family: "Family",
  // A subfamily sits between Family and Genus, so only a genus (or lower) has one to show.
  subFamily: "Genus",
  genus: "Genus",
  species: "Species",
  author: "Species",
  subspecific: "Infraspecies",
  subspecificAuthor: "Infraspecies",
  infraspecific: "Infraspecies",
  infraspecificAuthor: "Infraspecies",
  ...Object.fromEntries([1, 2, 3].flatMap((n) => [`infraRank${n}`, `infraName${n}`, `infraAuthor${n}`].map((id) => [id, "Infraspecies" as const]))),
};

/** A kingdom's tabs without the fields of ranks below `rank`; a row or section left empty goes too. */
function tabsAt(tabs: TabDef[], rank: TaxonNode["rank"]): TabDef[] {
  const shown = (id: string) => !FIELD_RANK[id] || rankIndex(FIELD_RANK[id]) <= rankIndex(rank);
  return tabs.map((t) =>
    t.kind === "grid"
      ? { ...t, sections: t.sections.map((sec) => ({ ...sec, rows: sec.rows.map((row) => row.filter((d) => shown(d.id))).filter((row) => row.length) })).filter((sec) => sec.rows.length) }
      : t,
  );
}

function higherTaxa(n: TaxonNode, path: TaxonNode[]) {
  const level = n.kingdom === "Flora" ? "Class" : "Order";
  const at = rankIndex(n.rank) > rankIndex(level) ? path.find((a) => a.rank === level) : path[path.length - 2];
  return { higherTaxaLevel: at?.rank ?? "", higherTaxaName: at?.name ?? "" };
}

/** An infraspecies' name parts in its kingdom's Main fields: "Malurus cyaneus leggei" (fauna), "Eucalyptus leucoxylon subsp. megalocarpa" (flora). */
function infraValues(n: TaxonNode): Record<string, string> {
  const [, species = "", ...rest] = n.name.split(" ");
  if (n.kingdom === "Fauna") return { species, subspecific: rest.join(" ") };
  const pairs = Array.from({ length: Math.ceil(rest.length / 2) }, (_, i) => rest.slice(i * 2, i * 2 + 2));
  return { species, ...Object.fromEntries(pairs.flatMap(([rank, name], i) => [[`infraRank${i + 1}`, rank], [`infraName${i + 1}`, name ?? ""]])) };
}

/** A higher taxon as a taxon record, so the species tabs can show it: its place in the hierarchy, code and who made it. */
const asTaxon = (n: TaxonNode, path: TaxonNode[]): Taxon => ({
  id: n.id,
  nsx: nsxOf(n),
  kingdom: n.kingdom,
  group: "Plant",
  common: "",
  scientific: n.name,
  ranks: { phylum: "", cls: "", order: "", family: "", genus: "" },
  author: "",
  current: n.current,
  values: {
    // Higher Taxa as a species record holds it: its order (fauna) or class (flora); a taxon at or above that rank takes
    // the rank above it instead.
    ...higherTaxa(n, path),
    ...Object.fromEntries((["Order", "Family", "Genus"] as const).map((r) => [r.toLowerCase(), path.find((a) => a.rank === r)?.name ?? ""])),
    ...(n.rank === "Infraspecies" ? infraValues(n) : {}),
    createdOn: n.createdOn ?? "",
    createdBy: n.createdBy ?? "",
  },
  tables: {},
  synonyms: [],
  parents: [],
  children: [],
});

function HigherRecord({ node, nodes }: { node: TaxonNode; nodes: TaxonNode[] }) {
  const roleHref = useRoleHref();
  const router = useRouter();
  const successors = (node.became ?? []).map((id) => nodes.find((n) => n.id === id)).filter((n): n is TaxonNode => !!n);
  const [tab, setTab] = useState("main");
  const tabs = tabsAt(tabsFor(node.kingdom), node.rank);
  const path = lineage(nodes, node.id);
  const taxon = asTaxon(node, path);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-6">
      <RecordBackLink href={roleHref(TX_ROOT)}>All taxa</RecordBackLink>
      <RecordHero eyebrow={`${node.kingdom} ${node.rank.toLowerCase()}`} title={node.name}>
        <HeroMeta label="NSX Code">{nsxOf(node) ?? NOT_PROVIDED}</HeroMeta>
        <HeroMeta label="Status">{node.current ? "Current" : "Superseded"}</HeroMeta>
      </RecordHero>
      {!node.current && (
        <div className="px-6 pt-4">
          <AlertFullWidth
            contained
            wrap
            color="gray"
            title="This taxon is no longer current"
            description={successors.length ? `It was split into ${successors.map((s) => s.name).join(", ")}.` : "It can be viewed, but not changed."}
            confirmLabel={successors.length ? `Open ${successors[0].name}` : "All taxa"}
            onConfirm={() => router.push(roleHref(successors.length ? `${TX_ROOT}/record?id=${encodeURIComponent(successors[0].id)}` : TX_ROOT))}
          />
        </div>
      )}
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} className="px-6 pt-6">
        <div className="-mb-1.5 overflow-x-auto pb-1.5">
          <TabList aria-label={`${node.rank} details`} type="underline" items={tabs.map((t) => ({ id: t.id, label: t.label, icon: TAB_ICON[t.id] ?? File06 }))} className="w-max min-w-full">
            {(item) => <Tab id={item.id} label={item.label} icon={item.icon} />}
          </TabList>
        </div>
        {tabs.map((t) => (
          <TabPanel key={t.id} id={t.id} className="pt-4">
            <TabView tab={t} taxon={taxon} taxa={[]} />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

export function TaxonNodeRecord({ id }: { id: string }) {
  const nodes = useTaxonNodes();
  const hydrated = useTaxaHydrated();
  const roleHref = useRoleHref();
  const node = nodes.find((n) => n.id === id);

  if (!node)
    return hydrated ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-lg font-semibold text-primary">Taxon not found</h1>
        <p className="max-w-sm text-sm text-balance text-tertiary">There is no taxon at &ldquo;{id}&rdquo;.</p>
        <Button color="link-color" size="sm" href={roleHref(TX_ROOT)}>
          All taxa
        </Button>
      </div>
    ) : null;
  if (node.taxon) return <SpeciesRecord id={node.taxon.id} />;
  return <HigherRecord node={node} nodes={nodes} />;
}

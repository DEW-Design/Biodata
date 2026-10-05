"use client";

import { useMemo, type FC } from "react";
import { Tag01 } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import type { AttributeFilterApi } from "@/app/pages/_shared/attribute-filter";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import { datasetTemplates, type DatasetTemplate } from "@/app/pages/_shared/template-finder/template-data";
import { TEMPLATE_FINDER_SECTION_LABEL } from "@/lib/registered-user-nav";

// Column 2 of the Template Finder: where you are in the templates, as local navigation (the designer chose "grouped
// facets" from /proto/column-2, 5 Oct 2026). "All templates" first, then the species types and the collection
// methods under small-caps group headings, each with a count, like Docusign's and Remote's section lists.
//
// These items are the Filter menu, not a second filter (CONTRACTS 4.2d): choosing one sets that attribute in the same
// filter state the list uses, so the chip under the toolbar, the Filter menu and column 2 always agree. "All templates"
// clears every filter. The two groups combine (Flora and Systematic). A group highlights its item only when that
// attribute has exactly one value chosen; with two or none, none of its items is highlighted. Counts are the whole
// list's, so they do not move as you choose.
type Attr = "species" | "method";

const NONE = "__none__"; // matches no item: a group with nothing chosen (null would make the list pick its first item)
const labelStyle = "mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase";

/** The one value chosen for an attribute, or null when none or several are. */
export function chosenFacet(filter: AttributeFilterApi<DatasetTemplate>, attr: Attr): string | null {
  const value = filter.applied.find((f) => f.id === attr)?.value;
  return value?.kind === "options" && value.ids.length === 1 ? value.ids[0] : null;
}

/** Narrows an attribute to one value (or clears it), leaving the other attribute as it is. */
export function chooseFacet(filter: AttributeFilterApi<DatasetTemplate>, attr: Attr, value: string | null) {
  filter.setValue(attr, value ? { kind: "options", ids: [value] } : null);
}

/** Flora and Fauna take the species group icons (CONTRACTS 3.13): the plant and the animal. */
export const speciesIcon = (value: string): FC<{ className?: string }> => (value === "Fauna" ? SPECIES_GROUP_ICON.Mammal : SPECIES_GROUP_ICON.Plant);

export function useTemplateFacets(templates: DatasetTemplate[]) {
  return useMemo(() => {
    const count = (get: (t: DatasetTemplate) => string) => {
      const map = new Map<string, number>();
      for (const t of templates) map.set(get(t), (map.get(get(t)) ?? 0) + 1);
      return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    };
    return { species: count((t) => t.speciesType), method: count((t) => t.collectionMethod) };
  }, [templates]);
}

type Item = { id: string; label: string; icon: FC<{ className?: string }>; badge: number };

function NavList({ label, items, selected, onSelect }: { label: string; items: Item[]; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <Tabs orientation="vertical" selectedKey={selected ?? NONE} onSelectionChange={(key) => onSelect(String(key))}>
      <TabList aria-label={label} orientation="vertical" type="button-brand" fullWidth className="w-full">
        {items.map((item) => (
          <Tab key={item.id} id={item.id} label={item.label} icon={item.icon} badge={item.badge} />
        ))}
      </TabList>
    </Tabs>
  );
}

export function TemplateNav({ filter, templates = datasetTemplates }: { filter: AttributeFilterApi<DatasetTemplate>; templates?: DatasetTemplate[] }) {
  const { species, method } = useTemplateFacets(templates);
  const AllIcon = sectionIcons[TEMPLATE_FINDER_SECTION_LABEL];
  const group = (heading: string, attr: Attr, icon: (value: string) => FC<{ className?: string }>, rows: [string, number][]) => (
    <div className="flex flex-col gap-1 border-t border-secondary pt-4">
      <p className={labelStyle}>{heading}</p>
      <NavList label={heading} items={rows.map(([v, n]) => ({ id: v, label: v, icon: icon(v), badge: n }))} selected={chosenFacet(filter, attr)} onSelect={(v) => chooseFacet(filter, attr, v)} />
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <NavList label="Templates" items={[{ id: "all", label: "All templates", icon: AllIcon, badge: templates.length }]} selected={filter.count === 0 ? "all" : null} onSelect={() => filter.clear()} />
      {group("Species type", "species", speciesIcon, species)}
      {group("Collection method", "method", () => Tag01, method)}
    </div>
  );
}

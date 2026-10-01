"use client";

import { Fragment, useRef, useState, type FC } from "react";
import { Autocomplete, Button as AriaButton, Dialog, Input as AriaInput, SearchField, SubmenuTrigger } from "react-aria-components";
import { Building02, Calendar, Feather, File06, FilterLines, Flag01, Folder, MarkerPin04, SearchLg, Tag01, User01, XClose } from "@untitledui/icons";
import { CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Popover } from "@/components/base/select/popover";
import { DATE_PRESETS, DatePicker, needsSearch, type Attribute, type AttributeFilterApi, type DatePreset, type OptionsAttribute } from "@/app/pages/_shared/attribute-filter";
import { boundedOptions } from "@/app/pages/_shared/option-checklist";

// The one filter for every table that can be filtered (CONTRACTS 4.2d; chosen by the designer from the filter-options lab,
// 1 Oct 2026, option A). A "Filter" button opens a contextual menu of the attributes, an icon and a name each and a count where
// a filter is on; the attribute you point at opens its values in a submenu beside it, with a tick after the ones that are on.
// Nothing to confirm: a choice applies at once, and the filters that are on show as chips under the toolbar
// (`AttributeFilterChips`). A date attribute's submenu is its presets, and "Custom range" drops a small date popover from the
// same button. A list that grows with the data (a project, a person) is still a submenu, with a search box at the top of it
// (typing narrows the menu, the arrow keys move from the box into it) and the first 50 matches under it, ticked ones first, so a
// list of thousands is searched, not scrolled. A list of values in groups (Events: Site, Visit) is one section per group.
// Related attributes sit together with a line between the groups (`group` on the attribute), as a macOS or iOS menu does.

type Icon = FC<{ className?: string }>;

// An attribute names its own icon; one that does not gets the icon for what its name says it is.
const ICON_BY_WORD: [RegExp, Icon][] = [
  [/project/, Folder],
  [/status|stage|state|validation/, Flag01],
  [/date|time|updated|created|ingested|opened|period|month|recorded|\bon\b/, Calendar],
  [/organisation|department|partner|agency/, Building02],
  [/\bby\b|user|person|contributor|requestor|requester|reviewer|owner|manager|author|creator|identified|nominator/, User01],
  [/template|file|artefact|attachment|document/, File06],
  [/species|taxon|family|genus|group/, Feather],
  [/site|location|region|area|place/, MarkerPin04],
  [/type|kind|category|class|access|protection|level/, Tag01],
];
export const attributeIcon = <T,>(attribute: Attribute<T>): Icon => {
  if (attribute.icon) return attribute.icon;
  const text = `${attribute.id} ${attribute.label}`.toLowerCase();
  return ICON_BY_WORD.find(([word]) => word.test(text))?.[1] ?? FilterLines;
};

export function FilterMenu<T>({ filter }: { filter: AttributeFilterApi<T> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customFor, setCustomFor] = useState<string | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const valueOf = (id: string) => filter.applied.find((f) => f.id === id)?.value;
  const customValue = customFor ? valueOf(customFor) : undefined;

  return (
    <div ref={anchor} className="inline-flex">
      <Dropdown.Root isOpen={menuOpen} onOpenChange={setMenuOpen}>
        <Button color="secondary" size="sm" iconLeading={FilterLines}>
          <span className="flex items-center gap-1.5">
            Filter
            {filter.count > 0 && <CountBadge count={filter.count} color="brand" />}
          </span>
        </Button>
        <Dropdown.Popover placement="bottom start" className="w-64">
          <Dropdown.Menu aria-label="Filter by">
            {filter.attributes.map((attribute, index) => {
              const value = valueOf(attribute.id);
              const on = value?.kind === "options" ? value.ids.length : value ? 1 : 0;
              const startsGroup = index > 0 && attribute.group !== undefined && attribute.group !== filter.attributes[index - 1].group;
              return (
                <Fragment key={attribute.id}>
                  {startsGroup && <Dropdown.Separator />}
                <SubmenuTrigger>
                  <Dropdown.Item id={attribute.id} label={attribute.label} icon={attributeIcon(attribute)} addon={on > 0 && attribute.kind === "options" ? String(on) : undefined} />
                  <Dropdown.SubmenuPopover className={attribute.kind === "options" && needsSearch(attribute) ? "w-80" : "w-60"} crossOffset={attribute.kind === "options" && needsSearch(attribute) ? 0 : undefined}>
                    {attribute.kind === "options" && needsSearch(attribute) ? (
                      <SearchableValues attribute={attribute} ids={value?.kind === "options" ? value.ids : []} onChange={(ids) => filter.setValue(attribute.id, { kind: "options", ids })} />
                    ) : attribute.kind === "options" ? (
                      <Dropdown.Menu
                        aria-label={attribute.label}
                        selectionMode="multiple"
                        className="max-h-72"
                        selectedKeys={new Set(value?.kind === "options" ? value.ids : [])}
                        onSelectionChange={(keys) => filter.setValue(attribute.id, { kind: "options", ids: keys === "all" ? attribute.options.flatMap((o) => o.children ?? [o]).map((o) => o.id) : [...keys].map(String) })}
                      >
                        {attribute.options.some((o) => o.children)
                          ? attribute.options.map((group) => (
                              <Dropdown.Section key={group.id}>
                                <Dropdown.SectionHeader className="px-3.5 pt-2 pb-1 text-xs font-semibold text-quaternary">{group.label}</Dropdown.SectionHeader>
                                {(group.children ?? [group]).map((o) => (
                                  <Dropdown.Item key={o.id} id={o.id} label={o.label} selectionIndicator="checkmark-end" />
                                ))}
                              </Dropdown.Section>
                            ))
                          : attribute.options.map((o) => <Dropdown.Item key={o.id} id={o.id} label={o.label} selectionIndicator="checkmark-end" />)}
                      </Dropdown.Menu>
                    ) : (
                      <Dropdown.Menu
                        aria-label={attribute.label}
                        selectionMode="single"
                        selectedKeys={new Set(value?.kind === "date" ? [value.preset] : [])}
                        onSelectionChange={(keys) => {
                          const key = [...keys][0] as DatePreset | undefined;
                          // Choosing the one that is on again turns it off.
                          if (!key) return filter.remove(attribute.id);
                          if (key === "custom") {
                            setMenuOpen(false);
                            setCustomFor(attribute.id);
                            return;
                          }
                          filter.setValue(attribute.id, { kind: "date", preset: key, from: "", to: "" });
                        }}
                      >
                        {DATE_PRESETS.map((p) => (
                          <Dropdown.Item key={p.id} id={p.id} label={p.label} selectionIndicator="checkmark-end" />
                        ))}
                      </Dropdown.Menu>
                    )}
                  </Dropdown.SubmenuPopover>
                </SubmenuTrigger>
                </Fragment>
              );
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>

      <Popover size="auto" triggerRef={anchor} isOpen={customFor !== null} onOpenChange={(open) => !open && setCustomFor(null)} placement="bottom start" offset={12} className="w-72 py-0">
        <Dialog aria-label="Custom date range" className="outline-hidden">
          {customFor && (
            <DatePicker
              value={{ kind: "date", preset: "custom", from: customValue?.kind === "date" ? customValue.from : "", to: customValue?.kind === "date" ? customValue.to : "" }}
              onChange={(next) => filter.setValue(customFor, next)}
            />
          )}
        </Dialog>
      </Popover>
    </div>
  );
}

/** The submenu of a list that grows with the data: a search box, then the matching values as a menu of ticks. */
function SearchableValues<T>({ attribute, ids, onChange }: { attribute: OptionsAttribute<T>; ids: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const chosen = new Set(ids);
  const { visible, matches, shown, waiting, picked } = boundedOptions(attribute.options, chosen, query);
  return (
    // The menu is filtered here, not by the autocomplete (which only moves focus between the box and the menu).
    // The box sits inside the menu's tree, so a typed letter would reach the parent menu's type-to-select and jump or
    // close the submenu: letters stop here, while arrows, Enter and Escape carry on to where they belong.
    <div onKeyDown={(e) => e.key.length === 1 && e.stopPropagation()} className="flex flex-col">
    <Autocomplete inputValue={query} onInputChange={setQuery} filter={() => true}>
      <SearchField aria-label={`Search ${attribute.label.toLowerCase()}`} autoFocus className="group/search border-b border-secondary">
        <div className="flex items-center gap-2 px-3 py-2 *:data-icon:size-4 *:data-icon:stroke-[2.25px]">
          <SearchLg data-icon aria-hidden="true" className="shrink-0 text-fg-quaternary" />
          <AriaInput placeholder="Search" className="w-full appearance-none bg-transparent text-sm text-primary caret-[var(--ui-text-primary)] outline-hidden placeholder:text-placeholder" />
          <AriaButton
            aria-label="Clear search"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 group-data-empty/search:hidden"
          >
            <XClose aria-hidden="true" className="size-4 stroke-[2.25px]" />
          </AriaButton>
        </div>
      </SearchField>
      <Dropdown.Menu
        aria-label={attribute.label}
        selectionMode="multiple"
        shouldCloseOnSelect={false}
        className="max-h-72"
        selectedKeys={chosen}
        onSelectionChange={(keys) => {
          // A search only draws some of the values: the ticked ones that are not drawn stay ticked.
          const drawn = new Set(visible.map((o) => o.id));
          const kept = ids.filter((id) => !drawn.has(id));
          onChange([...kept, ...(keys === "all" ? visible.map((o) => o.id) : [...keys].map(String).filter((id) => drawn.has(id)))]);
        }}
        renderEmptyState={() => <p className="m-0 px-3 py-2 text-sm text-tertiary">No matches</p>}
      >
        {visible.map((o) => (
          <Dropdown.Item key={o.id} id={o.id} label={o.label} selectionIndicator="checkmark-end" />
        ))}
      </Dropdown.Menu>
      {(waiting > 0 || (query && matches.length === 0 && picked.length > 0)) && (
        <p className="m-0 border-t border-secondary px-3 py-2 text-xs text-tertiary tabular-nums">
          {waiting > 0
            ? query
              ? `${shown.length} of ${matches.length} matches shown. Type more to narrow them.`
              : `${shown.length} of ${matches.length} shown. Search to find the rest.`
            : "No other matches"}
        </p>
      )}
    </Autocomplete>
    </div>
  );
}

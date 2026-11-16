"use client";

import { useState } from "react";
import type React from "react";
import { BarChart01, Download01, Folder, Map01, Plus, Upload01 } from "@untitledui/icons";
import type { Selection } from "react-aria-components";
import { PageHeader } from "@/components/PageHeader";
import { ContextualConfigPanel } from "@/components/ContextualConfigPanel";
import { CommandMenu, type CommandMenuGroupType } from "@/components/application/command-menus/command-menu";
import type { CommandDropdownMenuItemProps } from "@/components/application/command-menus/base-components/command-menu-item";
import { ScaffoldButton, ScaffoldCheckbox, ScaffoldLabel, SegmentedControl } from "@/components/scaffold/controls";
import { isFeatureEnabled } from "@/config/design-system.config";
import { useConfig } from "@/lib/config-context";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-secondary bg-secondary p-6">
    <p className="mb-1 w-full text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">{label}</p>
    {children}
  </div>
);

const sectionToggles = [
  { key: "playground", label: "Component Playground" },
  { key: "itemTypes", label: "Item types" },
  { key: "sections", label: "Sections" },
  { key: "preview", label: "Preview and footer" },
  { key: "emptyState", label: "Empty state" },
  { key: "usage", label: "Usage" },
  { key: "figma", label: "Figma" },
];

type ItemType = "default" | "icon" | "avatar" | "dot";

// The real interfaces of components/application/command-menus. CommandMenu also takes every React Aria ListBox prop except children, selectedKeys and className
// (selectionMode, onAction, ...), the Autocomplete's inputValue and onInputChange, and the DialogTrigger's isOpen, defaultOpen and onOpenChange.
const rootProps = [
  { name: "items", type: "CommandMenuGroupType[]  ({ id, title?, items })", default: "-" },
  { name: "defaultItems", type: "CommandMenuGroupType[]  (seeds the list when items is not given)", default: "-" },
  { name: "isOpen, defaultOpen, onOpenChange", type: "boolean, boolean, (isOpen: boolean) => void", default: "-" },
  { name: "onSelectionChange", type: "(keys: Selection) => void", default: "-" },
  { name: "defaultSelectedKeys", type: "Iterable<Key>", default: "empty" },
  { name: "inputValue, onInputChange", type: "string, (value: string) => void", default: "-" },
  { name: "placeholder", type: "string", default: '"Search"' },
  { name: "emptyState", type: "ReactNode  (shown in place of the list when nothing matches)", default: "-" },
  { name: "shortcut", type: "string | null  (focuses the search; also drawn inside it)", default: "null" },
  { name: "sensitivity", type: '"base" | "accent" | "case" | "variant"', default: '"base"' },
  { name: "filter", type: "false | (textValue: string, inputValue: string) => boolean", default: "contains" },
  { name: "dialogClassName, overlayClassName", type: "string | (state) => string  (the panel, and the blurred backdrop)", default: "-" },
];
const partProps = [
  { part: "CommandMenu.List", name: "selectionMode", type: '"single" | "multiple" | "none"', default: '"single"' },
  { part: "CommandMenu.Section", name: "title, items", type: "string, Iterable<item>", default: "-" },
  { part: "CommandMenu.Item", name: "id, label", type: "string (label is also the search text)", default: "required" },
  { part: "CommandMenu.Item", name: "type", type: '"default" | "icon" | "avatar" | "dot"', default: '"default"' },
  { part: "CommandMenu.Item", name: "icon", type: "FC<{ className?: string }>  (type icon)", default: "required for icon" },
  { part: "CommandMenu.Item", name: "src, alt", type: "string, string  (type avatar)", default: "required for avatar" },
  { part: "CommandMenu.Item", name: "dotColor", type: '"green"  (type dot)', default: "required for dot" },
  { part: "CommandMenu.Item", name: "description", type: "string", default: "-" },
  { part: "CommandMenu.Item", name: "stacked", type: "boolean  (description under the label; icon in a FeaturedIcon)", default: "false" },
  { part: "CommandMenu.Item", name: "shortcutKeys", type: 'string[]  (["⌘E"] is Cmd and E, and is bound while the menu is mounted)', default: "-" },
  { part: "CommandMenu.Preview", name: "children", type: "({ selectedId }) => ReactNode", default: "required" },
  { part: "CommandMenu.Preview", name: "asChild", type: "boolean", default: "false" },
  { part: "CommandMenu.Footer", name: "className", type: "string", default: "-" },
];

const people = [
  { id: "olivia", label: "Olivia Wyatt", description: "olivia@dew.design" },
  { id: "phoenix", label: "Phoenix Baker", description: "phoenix@dew.design" },
  { id: "lana", label: "Lana Steiner", description: "lana@dew.design" },
];

/** The items a demo menu holds, in groups. Actions and places are the product's own; the people are the design system's placeholder people. */
function buildGroups({ type, sections, stacked, itemShortcuts, descriptions }: { type: ItemType; sections: boolean; stacked: boolean; itemShortcuts: boolean; descriptions: boolean }): CommandMenuGroupType[] {
  if (type === "avatar" || type === "dot") {
    const items = people.map((p): CommandDropdownMenuItemProps =>
      type === "avatar"
        ? { type: "avatar", id: p.id, label: p.label, description: descriptions ? p.description : undefined, stacked, src: "", alt: p.label }
        : { type: "dot", id: p.id, label: p.label, description: descriptions ? "Online" : undefined, stacked, dotColor: "green" },
    );
    return [{ id: "people", title: sections ? "People" : undefined, items }];
  }
  const icon = (Icon: typeof Plus) => (type === "icon" ? { type: "icon" as const, icon: Icon } : { type: "default" as const });
  const actions: CommandDropdownMenuItemProps[] = [
    { ...icon(Plus), id: "add-project", label: "Add project", description: descriptions ? "Start a new project" : undefined, stacked, shortcutKeys: itemShortcuts ? ["⌘E"] : undefined },
    { ...icon(Upload01), id: "upload-dataset", label: "Upload dataset", description: descriptions ? "Add a file to a project" : undefined, stacked, shortcutKeys: itemShortcuts ? ["⌘Y"] : undefined },
    { ...icon(Download01), id: "download-records", label: "Download records", description: descriptions ? "Export what you can see" : undefined, stacked },
  ];
  const places: CommandDropdownMenuItemProps[] = [
    { ...icon(Folder), id: "projects", label: "Projects", description: descriptions ? "Browse and open projects" : undefined, stacked },
    { ...icon(Map01), id: "explore", label: "Explore", description: descriptions ? "Search records on the map" : undefined, stacked },
    { ...icon(BarChart01), id: "reports", label: "Reports", description: descriptions ? "Open a report" : undefined, stacked },
  ];
  return sections
    ? [
        { id: "actions", title: "Actions", items: actions },
        { id: "places", title: "Go to", items: places },
      ]
    : [{ id: "all", items: [...actions, ...places] }];
}

type DemoProps = {
  trigger: string;
  type?: ItemType;
  sections?: boolean;
  stacked?: boolean;
  itemShortcuts?: boolean;
  descriptions?: boolean;
  footer?: boolean;
  preview?: boolean;
  searchShortcut?: boolean;
  startEmpty?: boolean;
};

/** A real CommandMenu behind a Scaffold button, and a line under it saying what was last chosen (so Enter, a click and a shortcut can be told apart). */
function Demo({ trigger, type = "icon", sections = true, stacked = false, itemShortcuts = false, descriptions = false, footer = true, preview = false, searchShortcut = false, startEmpty = false }: DemoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [last, setLast] = useState("nothing yet");
  // Only the empty-state demo holds the search text itself, so it can open on a search that matches nothing. The others leave it to the menu, which starts empty each time it opens.
  const [query, setQuery] = useState("zzz");
  const groups = buildGroups({ type, sections, stacked, itemShortcuts, descriptions });

  const onSelect = (keys: Selection) => {
    if (keys === "all") return;
    const id = Array.from(keys)[0];
    const item = groups.flatMap((g) => g.items).find((i) => i.id === id);
    if (!item) return;
    setLast(item.label);
    if (!preview) setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <ScaffoldButton onClick={() => setIsOpen(true)}>{trigger}</ScaffoldButton>
      <p className="text-xs text-tertiary text-balance">Last chosen: {last}.</p>
      <CommandMenu
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setQuery("zzz");
        }}
        items={groups}
        onSelectionChange={onSelect}
        inputValue={startEmpty ? query : undefined}
        onInputChange={startEmpty ? setQuery : undefined}
        shortcut={searchShortcut ? "⌘/" : null}
        placeholder="Search"
        emptyState={<p className="px-4.5 py-10 text-center text-sm text-tertiary text-balance">No results</p>}
      >
        <CommandMenu.Group>
          <CommandMenu.List>
            {(group: CommandMenuGroupType) => (
              <CommandMenu.Section id={group.id} title={group.title} items={group.items}>
                {(item: CommandDropdownMenuItemProps) => <CommandMenu.Item {...item} />}
              </CommandMenu.Section>
            )}
          </CommandMenu.List>
        </CommandMenu.Group>
        {preview && (
          <CommandMenu.Preview className="border-t border-secondary px-4.5 py-4 pb-14">
            {({ selectedId }) => {
              const item = groups.flatMap((g) => g.items).find((i) => i.id === selectedId);
              return (
                <p className="text-sm text-secondary text-balance">
                  Chosen: <span className="font-medium text-primary">{item?.label}</span>
                </p>
              );
            }}
          </CommandMenu.Preview>
        )}
        {footer && <CommandMenu.Footer />}
      </CommandMenu>
    </div>
  );
}

export default function CommandMenuPage() {
  const { config: liveConfig } = useConfig();
  const config = liveConfig["command-menu"];

  const defaults = { type: "icon" as ItemType, sections: true, stacked: false, descriptions: false, itemShortcuts: false, footer: true, preview: false, searchShortcut: false };
  const [type, setType] = useState(defaults.type);
  const [sections, setSections] = useState(defaults.sections);
  const [stacked, setStacked] = useState(defaults.stacked);
  const [descriptions, setDescriptions] = useState(defaults.descriptions);
  const [itemShortcuts, setItemShortcuts] = useState(defaults.itemShortcuts);
  const [footer, setFooter] = useState(defaults.footer);
  const [preview, setPreview] = useState(defaults.preview);
  const [searchShortcut, setSearchShortcut] = useState(defaults.searchShortcut);

  const isDefault =
    type === defaults.type &&
    sections === defaults.sections &&
    stacked === defaults.stacked &&
    descriptions === defaults.descriptions &&
    itemShortcuts === defaults.itemShortcuts &&
    footer === defaults.footer &&
    preview === defaults.preview &&
    searchShortcut === defaults.searchShortcut;
  const resetPreview = () => {
    setType(defaults.type);
    setSections(defaults.sections);
    setStacked(defaults.stacked);
    setDescriptions(defaults.descriptions);
    setItemShortcuts(defaults.itemShortcuts);
    setFooter(defaults.footer);
    setPreview(defaults.preview);
    setSearchShortcut(defaults.searchShortcut);
  };
  const playgroundKey = [type, sections, stacked, descriptions, itemShortcuts, footer, preview, searchShortcut].join("-");

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Command menu"
        description="A search box over a list of actions and records, in an overlay. Typing filters the list, the arrow keys move through it, Enter chooses and Escape closes. Items carry an icon, an avatar or a dot, a description and shortcut keys, and sit in sections. Built on React Aria."
        actions={<ContextualConfigPanel slug="command-menu" title="Command menu" sections={sectionToggles} />}
      />

      {isFeatureEnabled(config, "playground") && (
        <>
          <h2 className="text-balance">Component Playground</h2>
          <p className="text-balance">Live instance. Open the menu, type to filter, and choose with Enter or a click; the line under the button says what was chosen.</p>
          <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
            <div className="grid md:grid-cols-[1fr_300px]">
              <div
                className="relative flex min-h-[320px] flex-col items-center justify-center bg-primary_alt p-12"
                style={{ backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              >
                <div className="rounded-xl bg-primary p-6 shadow-md">
                  <Demo
                    key={playgroundKey}
                    trigger="Open command menu"
                    type={type}
                    sections={sections}
                    stacked={stacked}
                    descriptions={descriptions}
                    itemShortcuts={itemShortcuts}
                    footer={footer}
                    preview={preview}
                    searchShortcut={searchShortcut}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5 border-l border-secondary bg-primary p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold tracking-widest text-quaternary uppercase text-balance">Controls</p>
                  <button
                    type="button"
                    onClick={resetPreview}
                    disabled={isDefault}
                    className="text-xs font-medium text-brand-secondary transition-opacity hover:text-brand-secondary_hover disabled:opacity-40"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <ScaffoldLabel>Item type</ScaffoldLabel>
                  <SegmentedControl
                    options={[
                      { key: "default", label: "Text" },
                      { key: "icon", label: "Icon" },
                      { key: "avatar", label: "Avatar" },
                      { key: "dot", label: "Dot" },
                    ]}
                    value={type}
                    onChange={setType}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <ScaffoldCheckbox label="Sections" checked={sections} onChange={setSections} />
                  <ScaffoldCheckbox label="Descriptions" checked={descriptions} onChange={setDescriptions} />
                  <ScaffoldCheckbox label="Stacked" checked={stacked} onChange={setStacked} />
                  <ScaffoldCheckbox label="Shortcut keys on items" checked={itemShortcuts} onChange={setItemShortcuts} />
                  <ScaffoldCheckbox label="Search shortcut (⌘/)" checked={searchShortcut} onChange={setSearchShortcut} />
                  <ScaffoldCheckbox label="Footer" checked={footer} onChange={setFooter} />
                  <ScaffoldCheckbox label="Preview" checked={preview} onChange={setPreview} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isFeatureEnabled(config, "itemTypes") && (
        <>
          <h2 className="text-balance">Item types</h2>
          <p className="text-balance">
            An item is plain text, or leads with an <code>icon</code>, an <code>avatar</code> or a green <code>dot</code>. <code>stacked</code> puts the description under the label and sets the icon in a
            featured icon. The people are the design system&apos;s placeholder people, and have no photo, so the avatar shows its placeholder.
          </p>
          <Section label="Text, icon, avatar, dot, and stacked">
            <Demo trigger="Text" type="default" sections={false} descriptions />
            <Demo trigger="Icon" type="icon" sections={false} descriptions />
            <Demo trigger="Avatar" type="avatar" descriptions />
            <Demo trigger="Dot" type="dot" descriptions />
            <Demo trigger="Stacked icon" type="icon" stacked descriptions />
          </Section>
        </>
      )}

      {isFeatureEnabled(config, "sections") && (
        <>
          <h2 className="text-balance">Sections</h2>
          <p className="text-balance">
            Groups with a <code>title</code> are drawn under a small heading with a divider between them. A group with no <code>title</code> has no heading. Items with <code>shortcutKeys</code> are bound for as long as the menu is mounted, open or not, so choosing an item by its key
            works from anywhere on the screen; try <kbd>⌘E</kbd> and <kbd>⌘Y</kbd> on this page.
          </p>
          <Section label="With and without section titles, and shortcut keys">
            <Demo trigger="Sections" sections />
            <Demo trigger="No titles" sections={false} />
            <Demo trigger="Shortcut keys" itemShortcuts />
          </Section>
        </>
      )}

      {isFeatureEnabled(config, "preview") && (
        <>
          <h2 className="text-balance">Preview and footer</h2>
          <p className="text-balance">
            <code>CommandMenu.Preview</code> draws content for the chosen item and nothing while none is chosen. <code>CommandMenu.Footer</code> lists the three keys that work in every menu: the arrows, Enter and Escape. It is hidden on a phone.
          </p>
          <Section label="Preview, and no footer">
            <Demo trigger="Preview" preview />
            <Demo trigger="No footer" footer={false} />
          </Section>
        </>
      )}

      {isFeatureEnabled(config, "emptyState") && (
        <>
          <h2 className="text-balance">Empty state</h2>
          <p className="text-balance">
            When the search matches nothing the list is replaced by <code>emptyState</code>. This one opens with a search that matches nothing; edit it to bring the list back.
          </p>
          <Section label="No matches">
            <Demo trigger="No matches" startEmpty />
          </Section>
        </>
      )}

      <h2 className="text-balance">API</h2>
      <p className="text-balance">
        <code>CommandMenu</code> is the root. <code>CommandMenu.List</code>, <code>.Section</code>, <code>.Item</code>, <code>.Group</code>, <code>.Preview</code> and <code>.Footer</code> go inside it, and
        <code>.Trigger</code> and <code>.Collection</code> are React Aria&apos;s <code>DialogTrigger</code> and <code>Collection</code>. The list, its sections and its items are React Aria collections, so each takes a render function over its items.
      </p>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {rootProps.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Part</th>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {partProps.map((p) => (
            <tr key={`${p.part}-${p.name}`}>
              <td style={{ color: "var(--ui-text-secondary)" }}>{p.part}</td>
              <td><code>{p.name}</code></td>
              <td><code style={{ fontSize: "11px" }}>{p.type}</code></td>
              <td><code>{p.default}</code></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-balance">Behaviour</h2>
      <ul className="text-balance">
        <li>
          <strong>Keyboard.</strong> Focus starts in the search. The arrow keys move through the items, Enter chooses one, Escape closes the menu and a press on the backdrop does too. The menu does not close itself when an item is chosen:
          <code>onSelectionChange</code> says which, and the screen decides what happens next.
        </li>
        <li>
          <strong>Shortcuts are opt-in (CONTRACTS 2.10).</strong> The search shortcut hint is off unless <code>shortcut</code> is passed, and an item shows its keys only if it has <code>shortcutKeys</code>, which are bound as well as drawn. A screen passes only keys it handles.
        </li>
        <li>
          <strong>Changes from the ingested source</strong> (OVR-018), listed in each file: <code>font-barlow</code> on the portaled overlay (2.2); four utility classes that are not defined here (a type size, two backgrounds and a divider colour) replaced with defined ones (2.1);
          <code>shortcut</code> off by default (2.10); the footer&apos;s settings button and &quot;return to parent&quot; hint removed, as nothing is wired to them (2.10, 2.12).
        </li>
      </ul>

      {isFeatureEnabled(config, "usage") && (
        <>
          <h2 className="text-balance">Usage</h2>
          <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
            <code className="font-mono text-[13px] text-secondary">
{`import { CommandMenu, type CommandMenuGroupType } from "@/components/application/command-menus/command-menu";

const groups: CommandMenuGroupType[] = [
  { id: "actions", title: "Actions", items: [{ type: "icon", id: "add-project", label: "Add project", icon: Plus, shortcutKeys: ["⌘E"] }] },
];

<CommandMenu isOpen={isOpen} onOpenChange={setIsOpen} items={groups} onSelectionChange={(keys) => run(Array.from(keys)[0])}>
  <CommandMenu.Group>
    <CommandMenu.List>
      {(group) => (
        <CommandMenu.Section id={group.id} title={group.title} items={group.items}>
          {(item) => <CommandMenu.Item {...item} />}
        </CommandMenu.Section>
      )}
    </CommandMenu.List>
  </CommandMenu.Group>
  <CommandMenu.Footer />
</CommandMenu>`}
            </code>
          </pre>
        </>
      )}

      {isFeatureEnabled(config, "figma") && (
        <>
          <h2 className="text-balance">Figma</h2>
          <p className="text-balance">No linked Figma file yet. This component came from the Untitled UI source, not from a Figma design.</p>
        </>
      )}
    </div>
  );
}

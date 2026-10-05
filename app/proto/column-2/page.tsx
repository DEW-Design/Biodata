"use client";

import { Suspense, useMemo, useState, type FC, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Columns03, Database01, Download01, BarChart01, Folder, Key01, Tag01, User01, UserCheck01, Users01, BookOpen01 } from "@untitledui/icons";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { ActionsGroup } from "@/app/pages/_shared/agreement-actions";
import { datasetTemplates, type DatasetTemplate } from "@/app/pages/_shared/template-finder/template-data";
import type { AttributeFilterApi } from "@/app/pages/_shared/attribute-filter";
import { TemplateList, useTemplateFilter } from "@/app/pages/_shared/template-finder/template-list";
import { TemplateNav, chooseFacet, chosenFacet, speciesIcon, useTemplateFacets } from "@/app/pages/_shared/template-finder/template-nav";
import { TEMPLATE_FINDER_SECTION_LABEL, keyHref, navForRole } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";

// LAB: what column 2 holds once the user's actions have moved onto the page. The designer (5 Oct 2026): column 2 is
// "a local navigation + user actions" column, but on the Template Finder the actions (Download) are on the table, so
// what is left is local navigation, and that is "pretty good". The question is what local navigation means when a
// section has one view, and whether the rule (navigation in column 2, actions on the page) holds on every screen.
//
// Prior art in this repo: /proto/collection-sidebar (status tabs, My items, Actions: Actions stayed in column 2),
// /proto/layouts option C (column 2 folds behind an edge handle), CONTRACTS 3.7 (column 2 always exists) and 3.10
// (navigation and actions only). Mobbin patterns this lab is taken from (ideas only, CONTRACTS 2.6):
//   - Docusign Templates, HoneyBook Templates: a short list of views with an icon each (My, Shared, Favourites, All),
//     and under a rule a second group (folders, smart files). The list is navigation; "Create" is on the page.
//   - Featurebase, Canny, Remote: the left list IS the facets, grouped under small-caps headings (Statuses, Quick
//     filters; Payroll and payments, Reports and analytics), each with a count.
//   - Heidi, Langdock: categories are a row of chips with counts above the cards, and there is no second column.
//   - Resend, Linear: a section with one view has no second list; the title and its actions sit in the page header.
//
// Four treatments of the Template Finder, on the real list with the real shell:
//   A  Today              the section label and nothing under it
//   B  Views and facets   All templates, then the species types and collection methods in one list, counts after each
//   C  Grouped facets     the same items under small-caps group headings (Docusign, Remote)
//   D  Chips, no column   column 2 folds away; the same items are chips above the table (Heidi, Langdock)
// and E, "Across screens": the rule (navigation stays, Actions move to the page) drawn on five other screens' column 2.
//
// The Template Finder has one real value for each fact (every template is Flora, collection method Others), so B to D
// would show the same eight templates three times. The "Template data" tool switches on lab sample values so the
// treatments can be judged with variation; the sample is invented for this lab only and never reaches the product.
// DECIDED (5 Oct 2026): C. It is the Template Finder's column 2 in production (`TemplateNav`, wired to the list's own
// filter so it is the Filter menu drawn as places, not a second filter). The other treatments stay here as the record
// of what was compared; E is still open and applies to every screen.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file.
type Option = "today" | "flat" | "grouped" | "chips" | "across";
const OPTIONS: { id: Option; label: string; short: string; description: string }[] = [
  { id: "today", label: "A: Today", short: "A", description: "The section label and nothing under it" },
  { id: "flat", label: "B: Views and facets", short: "B", description: "All templates, then species types and methods, with counts" },
  { id: "grouped", label: "C: Grouped facets", short: "C", description: "The same items under small-caps group headings" },
  { id: "chips", label: "D: Chips, no column 2", short: "D", description: "Column 2 folds away; the items are chips above the table" },
  { id: "across", label: "E: Across screens", short: "E", description: "Navigation stays in column 2, Actions move to the page" },
];

type Data = "real" | "sample";

// Lab sample values (invented, lab only): which species type and method each template would carry if the wireframe's
// filters had real choices. The vocabularies are the product's own (Flora/Fauna; the collection methods in data.ts).
const SAMPLE: Record<string, Pick<DatasetTemplate, "collectionMethod" | "speciesType">> = {
  "site-visit-species-load": { collectionMethod: "Systematic", speciesType: "Flora" },
  "site-visit-species-load-custom": { collectionMethod: "Systematic", speciesType: "Flora" },
  "species-data-return": { collectionMethod: "Incidental", speciesType: "Fauna" },
  "waterbug-bioblitz": { collectionMethod: "Incidental", speciesType: "Fauna" },
  "bushland-assessment-method": { collectionMethod: "Systematic", speciesType: "Flora" },
  "rangeland-assessment-method": { collectionMethod: "Systematic", speciesType: "Flora" },
  ramble: { collectionMethod: "Incidental", speciesType: "Flora" },
  "bushland-condition-monitoring": { collectionMethod: "Systematic", speciesType: "Flora" },
};

const labelStyle = "mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase";

// A key that matches no item: a group with nothing selected in it (null would make the list select its first item).
const NONE = "__none__";

type NavItem = { id: string; label: string; icon: FC<{ className?: string }>; badge?: number };

// A vertical list of local navigation items: the same `Tabs` (button-brand) as every column 2.
function NavList({ label, items, selected, onSelect }: { label: string; items: NavItem[]; selected: string | null; onSelect: (id: string) => void }) {
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

// ── Template Finder column 2 (B and C) ──
// Both drive the list's own filter (the same state as the Filter menu and its chips), so they are the Filter menu drawn
// as places, not a second filter (CONTRACTS 4.2d). C is the production component (`TemplateNav`), kept here as the
// option that was chosen.
type Filter = AttributeFilterApi<DatasetTemplate>;
const facetId = (attr: "species" | "method", value: string) => `${attr}:${value}`;
const chosenId = (filter: Filter) => {
  const species = chosenFacet(filter, "species");
  const method = chosenFacet(filter, "method");
  return species ? facetId("species", species) : method ? facetId("method", method) : null;
};

function FlatNav({ templates, filter }: { templates: DatasetTemplate[]; filter: Filter }) {
  const { species, method } = useTemplateFacets(templates);
  const AllIcon = sectionIcons[TEMPLATE_FINDER_SECTION_LABEL];
  const items: NavItem[] = [
    { id: "all", label: "All templates", icon: AllIcon, badge: templates.length },
    ...species.map(([v, n]) => ({ id: facetId("species", v), label: v, icon: speciesIcon(v), badge: n })),
    ...method.map(([v, n]) => ({ id: facetId("method", v), label: v, icon: Tag01, badge: n })),
  ];
  return (
    <div className="flex flex-col gap-1">
      <p className={labelStyle}>{TEMPLATE_FINDER_SECTION_LABEL}</p>
      <NavList
        label="Templates"
        items={items}
        selected={filter.count === 0 ? "all" : chosenId(filter)}
        onSelect={(id) => {
          filter.clear();
          const [attr, ...rest] = id.split(":");
          if (attr === "species" || attr === "method") chooseFacet(filter, attr, rest.join(":"));
        }}
      />
    </div>
  );
}

// Option D: the same items as a row of chips above the table, no column 2 at all.
function Chips({ templates, filter }: { templates: DatasetTemplate[]; filter: Filter }) {
  const { species, method } = useTemplateFacets(templates);
  const chips: { id: string; attr?: "species" | "method"; value?: string; label: string; n: number }[] = [
    { id: "all", label: "All", n: templates.length },
    ...species.map(([v, n]) => ({ id: facetId("species", v), attr: "species" as const, value: v, label: v, n })),
    ...method.map(([v, n]) => ({ id: facetId("method", v), attr: "method" as const, value: v, label: v, n })),
  ];
  return (
    <div role="group" aria-label="Templates" className="flex shrink-0 flex-wrap items-center gap-2">
      {chips.map((chip) => {
        const on = chip.attr ? chosenFacet(filter, chip.attr) === chip.value : filter.count === 0;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              if (chip.attr) chooseFacet(filter, chip.attr, chip.value ?? null);
              else filter.clear();
            }}
            className={cx(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium outline-focus-ring transition-colors duration-100 ease-linear focus-visible:outline-2",
              on ? "bg-brand-primary text-brand-secondary" : "bg-secondary text-tertiary hover:bg-tertiary hover:text-primary",
            )}
          >
            {chip.label}
            <span className="text-xs tabular-nums opacity-70">{chip.n}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── The shell the lab draws (the real header and rail; column 2 is what is being compared) ──
function LabShell({ columnTwo, aside, children }: { columnTwo: boolean; aside: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const goTo = (s: { key?: string; items?: { key?: string }[] }) => {
    const key = s.key ?? s.items?.find((i) => i.key)?.key;
    if (key) router.push(roleHref(keyHref(key as Parameters<typeof keyHref>[0])));
  };
  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={TEMPLATE_FINDER_SECTION_LABEL}
            onSelectSection={(l) => {
              const s = nav.find((n) => n.label === l);
              if (s) goTo(s);
            }}
          />
        }
        section={TEMPLATE_FINDER_SECTION_LABEL}
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail sections={nav} activeSection={TEMPLATE_FINDER_SECTION_LABEL} onSelectSection={goTo} />
        {columnTwo ? (
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            {aside}
          </aside>
        ) : null}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── E: the rule drawn on other screens ──
// Each screen's real column 2 today (items taken from its shell), and the same column with the Actions group moved to
// the page: Export CSV and Create report in a "..." menu at the right of the list's header, as a record page keeps its
// other actions (CONTRACTS 4.6).
type Screen = { name: string; label: string; items: { label: string; icon: FC<{ className?: string }> }[]; actions: boolean; note: string };
const SCREENS: Screen[] = [
  { name: "Projects", label: "Projects", items: [{ label: "All projects", icon: Folder }, { label: "My projects", icon: User01 }], actions: true, note: "Export CSV and Create report move to the header's menu." },
  { name: "Data Sharing Agreements", label: "Data Sharing Agreements", items: [{ label: "All agreements", icon: Database01 }, { label: "My agreements", icon: User01 }], actions: true, note: "Same two items, same move." },
  { name: "User Management", label: "User Management", items: [{ label: "All users", icon: Users01 }, { label: "All roles", icon: UserCheck01 }, { label: "All permissions", icon: Key01 }], actions: true, note: "Three areas stay: this is navigation in the strict sense." },
  { name: "Controlled Vocabulary", label: "Controlled Vocabulary", items: [{ label: "All vocabularies", icon: BookOpen01 }], actions: true, note: "One view plus a category list that scrolls; Actions leave." },
  { name: "Template Finder", label: "Template Finder", items: [{ label: "All templates", icon: sectionIcons[TEMPLATE_FINDER_SECTION_LABEL] }], actions: false, note: "No Actions group today. Download is on each row." },
];

function MockColumn({ screen, withActions }: { screen: Screen; withActions: boolean }) {
  return (
    <div className="flex w-[286px] shrink-0 flex-col gap-1 rounded-lg border border-secondary bg-secondary p-4">
      <p className={labelStyle}>{screen.label}</p>
      <NavList label={screen.name} items={screen.items.map((i, n) => ({ id: String(n), label: i.label, icon: i.icon }))} selected="0" onSelect={() => {}} />
      {withActions && screen.actions ? <ActionsGroup onExportCsv={() => {}} /> : null}
    </div>
  );
}

function MockHeader({ screen }: { screen: Screen }) {
  return (
    <div className="flex w-[286px] shrink-0 flex-col gap-3 rounded-lg border border-secondary bg-primary p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-sm font-semibold text-primary">{screen.items[0].label}</p>
          <p className="m-0 text-xs text-tertiary">The list header</p>
        </div>
        {screen.actions ? (
          <Dropdown.Root>
            <Dropdown.DotsButton aria-label={`More actions on ${screen.name}`} />
            <Dropdown.Popover placement="bottom right">
              <Dropdown.Menu aria-label="More actions">
                <Dropdown.Item id="export" label="Export CSV" icon={Download01} />
                <Dropdown.Item id="report" label="Create report" icon={BarChart01} />
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        ) : null}
      </div>
    </div>
  );
}

function AcrossScreens() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6 [scrollbar-gutter:stable]">
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="m-0 text-lg font-semibold text-primary">One rule across the screens</h1>
        <p className="m-0 text-sm text-balance text-tertiary">
          Column 2 is where you are and where else you can go in this section. What you can do (export, report, download) sits on the page, with the thing it acts on. Left: column 2 today. Middle: the same column without the Actions group. Right: where the actions go.
        </p>
      </div>
      {SCREENS.map((screen) => (
        <section key={screen.name} aria-label={screen.name} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="m-0 text-sm font-semibold text-primary">{screen.name}</h2>
            <p className="m-0 text-sm text-tertiary">{screen.note}</p>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <MockColumn screen={screen} withActions />
            <MockColumn screen={screen} withActions={false} />
            <MockHeader screen={screen} />
          </div>
        </section>
      ))}
    </div>
  );
}

function Lab() {
  const [option, setOption] = useState<Option>("grouped");
  const [data, setData] = useState<Data>("sample");

  const templates = useMemo(() => (data === "real" ? datasetTemplates : datasetTemplates.map((t) => ({ ...t, ...SAMPLE[t.id] }))), [data]);
  const filter = useTemplateFilter(templates);
  const current = OPTIONS.find((o) => o.id === option)!;

  useRegisterTool({
    id: "layout",
    label: "Column 2 treatment to show",
    barLabel: "Column 2",
    barValue: current.short,
    icon: Columns03,
    options: OPTIONS.map(({ id, label, description }) => ({ id, label, description })),
    value: option,
    onChange: (id) => {
      setOption(id as Option);
      filter.clear();
    },
  });
  useRegisterTool(
    option === "across"
      ? null
      : {
          id: "data",
          label: "Template data",
          barLabel: "Data",
          barValue: data === "real" ? "Real" : "Lab sample",
          icon: Database01,
          options: [
            { id: "real", label: "Real", description: "Every template is Flora and Others, so the facets repeat the whole list" },
            { id: "sample", label: "Lab sample", description: "Invented values (Flora and Fauna; Systematic and Incidental) to judge the treatments with variation" },
          ],
          value: data,
          onChange: (id) => {
            setData(id as Data);
            filter.clear();
          },
        },
  );

  if (option === "across") {
    return (
      <LabShell columnTwo={false} aside={null}>
        <AcrossScreens />
      </LabShell>
    );
  }

  const aside =
    option === "today" ? (
      <p className={labelStyle}>{TEMPLATE_FINDER_SECTION_LABEL}</p>
    ) : option === "flat" ? (
      <FlatNav templates={templates} filter={filter} />
    ) : option === "grouped" ? (
      <div className="flex flex-col gap-1">
        <p className={labelStyle}>{TEMPLATE_FINDER_SECTION_LABEL}</p>
        <TemplateNav filter={filter} templates={templates} />
      </div>
    ) : null;

  return (
    <LabShell columnTwo={option !== "chips"} aside={aside}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TemplateList filter={filter} templates={templates} beforeTable={option === "chips" ? <Chips templates={templates} filter={filter} /> : undefined} />
      </div>
    </LabShell>
  );
}

export default function ColumnTwoLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

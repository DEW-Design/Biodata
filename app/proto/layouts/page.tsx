"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Columns03, RefreshCcw01 } from "@untitledui/icons";
import { Disclosure, DisclosurePanel, Heading as AriaHeading } from "react-aria-components";
import { useRegisterTool } from "@/app/_prototype-tools/tools";
import { PrototypeTools } from "@/app/_prototype-tools/prototype-tools";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { AppHeader } from "@/app/pages/_shared/app-header";
import { MobileNavTrigger } from "@/app/pages/_shared/mobile-nav";
import { PrimaryRail } from "@/app/pages/_shared/primary-rail";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { RecordBackLink } from "@/app/pages/_shared/record-hero";
import type { AttributeFilterApi, OptionsAttribute } from "@/app/pages/_shared/attribute-filter";
import { DataValidationErrorReport, type ReportChrome } from "@/app/pages/_shared/reports/data-validation-error-report";
import type { ErrorRow } from "@/app/pages/_shared/reports/data-validation-error-report-data";
import { REPORTS } from "@/app/pages/_shared/reports/reports-data";
import { ReportSwitcher } from "@/app/pages/_shared/reports/report-switcher";
import { REPORTS_SECTION_LABEL, keyHref, navForRole } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// LAB: how much room the table gets on a report's record page. The Data Validation Error Report at a 1440 x 900 window
// gives the table about half the height (the header, the gradient card, the counts and the toolbar sit above it) and
// column 2 is a 286px column holding one word. Four directions, on the real report with the real shell, taken from
// Vercel (Deployments, Logs, Observability) and Supabase:
//   A  Today                         the gradient card, the count tiles, the Filter menu, column 2 at full width
//   B  Slim header                   the list screens' title and subheading, the facts on one line, the counts on one
//                                    line, the actions in a plain bar (Vercel Deployments: title, then the table)
//   C  Slim header, column 2 folds   B, and the near-empty column 2 folds away behind a handle on its edge (the
//                                    collapse control on the Vercel and Supabase sidebars); the handle brings it back
//   B to D also put the Project and Dataset selects in the toolbar (the selects question's second layout), because the
//   labelled row of fields is 100px of the height this lab is about; A keeps them as they are today.
//   D  Facet panel                   B, and the Filter menu becomes a panel of checkbox facets with counts beside the table
//                                    (Vercel Logs): everything you can narrow by is on screen, none of it above the table
// The Prototype tools bar reads the table's real size in the window you are looking at, so the comparison is a number.
// Lab only (CONTRACTS 5.4): nothing outside app/proto imports this file; it uses the product pieces and the opt-in props
// they gained for it (`header`, `filterPanel`, `ReportTiles compact`), which are removed if no option is chosen.
type Option = "today" | "slim" | "fold" | "facets";
const OPTIONS: { id: Option; label: string; short: string; description: string }[] = [
  { id: "today", label: "A: Today", short: "A", description: "Gradient card, count tiles, Filter menu" },
  { id: "slim", label: "B: Slim header", short: "B", description: "Title line, facts on one line, counts on one line" },
  { id: "fold", label: "C: Slim header, column 2 folds", short: "C", description: "B, with column 2 folded behind an edge handle" },
  { id: "facets", label: "D: Facet panel", short: "D", description: "B, with the filters as a panel beside the table" },
];

// A chevron that turns when its Disclosure is open.
const Turning = ({ className }: { className?: string }) => <ChevronDown className={`${className ?? ""} transition duration-100 ease-linear group-data-expanded:rotate-180`} />;

// ── The facet panel (option D) ──
function Facets({ filter, rows }: { filter: AttributeFilterApi<ErrorRow>; rows: ErrorRow[] }) {
  const attributes = filter.attributes.filter((a): a is OptionsAttribute<ErrorRow> => a.kind === "options");
  const counts = (attribute: OptionsAttribute<ErrorRow>) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const value = attribute.get(row);
      for (const v of Array.isArray(value) ? value : [value]) map.set(v, (map.get(v) ?? 0) + 1);
    }
    return map;
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="mb-1 flex items-center justify-between">
        <p className="m-0 text-sm font-semibold text-primary">Filters</p>
        <Button color="tertiary" size="sm" iconLeading={RefreshCcw01} isDisabled={filter.count === 0} onPress={filter.clear}>
          Reset
        </Button>
      </div>
      {attributes.map((attribute, i) => {
        const chosen = new Set(filter.applied.find((f) => f.id === attribute.id)?.value.kind === "options" ? (filter.applied.find((f) => f.id === attribute.id)!.value as { ids: string[] }).ids : []);
        const tally = counts(attribute);
        return (
          <Disclosure key={attribute.id} defaultExpanded={i < 3} className="group border-t border-secondary py-2">
            <AriaHeading className="m-0">
              <Button slot="trigger" color="tertiary" size="sm" className="w-full justify-between" iconTrailing={Turning}>
                {attribute.label}
                {chosen.size > 0 ? <span className="ml-2 text-xs text-brand-secondary tabular-nums">{chosen.size}</span> : null}
              </Button>
            </AriaHeading>
            <DisclosurePanel>
              <div className="flex flex-col gap-1.5 px-2 pt-1 pb-1">
                {attribute.options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between gap-2">
                    <Checkbox
                      size="sm"
                      label={option.label}
                      isSelected={chosen.has(option.id)}
                      onChange={(on) => {
                        const next = new Set(chosen);
                        if (on) next.add(option.id);
                        else next.delete(option.id);
                        filter.setValue(attribute.id, next.size ? { kind: "options", ids: [...next] } : null);
                      }}
                    />
                    <span className="text-xs text-tertiary tabular-nums">{(tally.get(option.id) ?? 0).toLocaleString("en-AU")}</span>
                  </div>
                ))}
              </div>
            </DisclosurePanel>
          </Disclosure>
        );
      })}
    </div>
  );
}

// ── The shell: the product's header and rail, with column 2 able to fold ──
function LabShell({ children, columnTwo, onToggleColumnTwo, foldable }: { children: ReactNode; columnTwo: boolean; onToggleColumnTwo: () => void; foldable: boolean }) {
  const router = useRouter();
  const role = useUserRole();
  const roleHref = useRoleHref();
  const nav = navForRole(role);
  const label = nav.find((s) => s.key === "reports")?.label ?? REPORTS_SECTION_LABEL;
  const report = REPORTS.find((r) => r.id === "data-validation-error");
  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden">
      <PrototypeTools />
      <AppHeader
        mobileNav={
          <MobileNavTrigger
            sections={nav}
            sectionIcons={sectionIcons}
            activeSection={label}
            onSelectSection={(l) => {
              const s = nav.find((n) => n.label === l);
              const key = s?.key ?? s?.items?.find((i) => i.key)?.key;
              if (key) router.push(roleHref(keyHref(key)));
            }}
          />
        }
        section={<ReportSwitcher label={label} currentReportId={report?.id} />}
        current={report?.title}
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryRail
          sections={nav}
          activeSection={label}
          onSelectSection={(s) => {
            const key = s.key ?? s.items?.find((i) => i.key)?.key;
            if (key) router.push(roleHref(keyHref(key)));
          }}
        />
        {columnTwo ? (
          <aside aria-label="Section" className="hidden w-[286px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-secondary bg-secondary p-4 lg:flex">
            <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Reports</p>
          </aside>
        ) : null}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {foldable ? (
            <div className="absolute top-1/2 left-0 z-30 -translate-x-1/2">
              <ButtonUtility
                size="xs"
                color="secondary"
                className="rounded-full"
                icon={columnTwo ? ChevronLeft : ChevronRight}
                tooltip={columnTwo ? "Fold the section column" : "Show the section column"}
                tooltipPlacement="right"
                onPress={onToggleColumnTwo}
              />
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

// The table's real size in this window: its scroll area, and how many rows fit in it.
function useTableSize() {
  const [size, setSize] = useState<{ w: number; h: number; rows: number } | null>(null);
  useEffect(() => {
    const read = () => {
      const grid = document.querySelector<HTMLElement>('main [role="grid"]');
      if (!grid) return;
      let box: HTMLElement | null = grid.parentElement;
      while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
      if (!box) return;
      const head = grid.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      const row = grid.querySelector("tbody tr")?.getBoundingClientRect().height || 61;
      const next = { w: Math.round(box.clientWidth), h: Math.round(box.clientHeight), rows: Math.floor((box.clientHeight - head) / row) };
      setSize((cur) => (cur && cur.w === next.w && cur.h === next.h && cur.rows === next.rows ? cur : next));
    };
    read();
    const id = window.setInterval(read, 400);
    window.addEventListener("resize", read);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", read);
    };
  }, []);
  return size;
}

function Lab() {
  const params = useSearchParams();
  const initial = (OPTIONS.find((o) => o.id === params.get("option"))?.id ?? "today") as Option;
  const [option, setOption] = useState<Option>(initial);
  const [folded, setFolded] = useState(initial === "fold");
  const roleHref = useRoleHref();
  const size = useTableSize();

  const choose = (id: string) => {
    setOption(id as Option);
    setFolded(id === "fold");
  };
  const current = OPTIONS.find((o) => o.id === option)!;
  useRegisterTool({
    id: "layout",
    label: "Report layout to show",
    barLabel: "Layout",
    barValue: `${current.short}${size ? ` · table ${size.w} x ${size.h}px, ${size.rows} rows` : ""}`,
    icon: Columns03,
    options: OPTIONS.map(({ id, label, description }) => ({ id, label, description })),
    value: option,
    onChange: choose,
  });

  const chrome: ReportChrome = option === "today" ? {} : option === "facets" ? { header: "line", filterPanel: (filter, rows) => <Facets filter={filter} rows={rows} /> } : { header: "line" };

  return (
    <LabShell columnTwo={!folded} onToggleColumnTwo={() => setFolded((f) => !f)} foldable={option === "fold"}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <RecordBackLink href={roleHref("/pages/reports")}>Back to reports</RecordBackLink>
        <DataValidationErrorReport chrome={chrome} layout={option === "today" ? "option-1" : "option-2"} />
      </div>
    </LabShell>
  );
}

export default function LayoutsLab() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type FC, type ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { DataReport } from "@/app/pages/_shared/reports/report-table";
import type { SheetProps } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";

// The tabs of a Taxonomy Report, shared by the Flora Taxonomy Report (taxonomy-report.tsx) and the Fauna Taxonomy Report (fauna-taxonomy-report.tsx): the
// designer's wish is "same UI structure as the flora report" (16 Oct 2026), so the structure is one component and each report is only its tabs and the
// sheet each one shows. A tab is `?tab=`, an underline tab with the icon of what it holds (CONTRACTS 3.13), and every sheet is drawn by the same `DataReport`, so
// one report stays on screen across tabs and the tab list keeps its keyboard focus. The search is the report's, not a tab's: a code typed on one tab (the designer, 16 Oct 2026: "say I search for NSX Code P04411") is still in the box, and still narrowing the rows, on the next. The filters, the sort and the page start again on each tab, because each has its own. The strip scrolls inside itself when its tabs are wider than main, never the
// page, and keeps the open tab in view (a frame after it changes: the tab list marks its selection as it mounts).

export interface ReportTab<T extends string> {
  id: T;
  label: string;
  icon: FC<{ className?: string }>;
}

/** Draws one sheet as the report's body, inside the tab list. */
export type ViewSheet = <R>(sheet: SheetProps<R>) => ReactNode;

function SheetView<R>({ sheet, tab, tabs }: { sheet: SheetProps<R>; tab: string; tabs: ReactNode }) {
  return (
    <DataReport<R>
      {...sheet}
      resetKey={tab}
      keepSearch
      belowHeader={tabs}
      wrapBody={(body) => (
        <TabPanel id={tab} className="flex min-h-0 flex-1 flex-col">
          {body}
        </TabPanel>
      )}
    />
  );
}

export function TaxonomyTabs<T extends string>({ tabs, label, render }: { tabs: ReportTab<T>[]; label: string; render: (tab: T, view: ViewSheet) => ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabs.find((t) => t.id === tabParam)?.id ?? tabs[0].id;

  const setTab = (next: T) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tab", next);
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  };

  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => strip.current?.querySelector<HTMLElement>("[aria-selected=true]")?.scrollIntoView({ block: "nearest", inline: "center" }));
    return () => cancelAnimationFrame(frame);
  }, [tab]);

  const list = (
    <div ref={strip} className="shrink-0 overflow-x-auto px-6 pt-4">
      <TabList type="underline" aria-label={label}>
        {tabs.map((t) => (
          <Tab key={t.id} id={t.id} icon={t.icon}>
            {t.label}
          </Tab>
        ))}
      </TabList>
    </div>
  );

  const view: ViewSheet = (sheet) => <SheetView sheet={sheet} tab={tab} tabs={list} />;
  return (
    <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as T)} className="min-h-0 flex-1">
      {render(tab, view)}
    </Tabs>
  );
}

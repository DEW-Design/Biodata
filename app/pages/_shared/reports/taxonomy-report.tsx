"use client";

import type { ReactNode } from "react";
import { ClockRewind, Copy01, File06, Globe01, List, Map02, Microscope } from "@untitledui/icons";
import { useAusWorldTab } from "@/app/pages/_shared/reports/taxonomy-aus-world-tab";
import { useAuditTab } from "@/app/pages/_shared/reports/taxonomy-audit-tab";
import { useAttributesTab, useRefHerbTab } from "@/app/pages/_shared/reports/taxonomy-herb-attributes-tabs";
import { useListDetailTab } from "@/app/pages/_shared/reports/taxonomy-list-detail-tab";
import { useSynonymTab } from "@/app/pages/_shared/reports/taxonomy-management-tabs";
import { useSaRegionsTab } from "@/app/pages/_shared/reports/taxonomy-sa-regions-tab";
import { TaxonomyTabs, type ReportTab } from "@/app/pages/_shared/reports/taxonomy-tabs-shell";

// The Taxonomy Report (the designer, 15 Oct 2026): "Biodata taxonomy report has multiple reports within it", built like the Events,
// Occurrences and Observations Report (records-report.tsx): one report on the Reports landing page with a tab for each report inside it
// (`?tab=`), each tab its own columns, parameters, filters, search and sort. A tab is a sheet of the designer's; each is a file of its own
// (taxonomy-*-tab.tsx, taxonomy-*-tabs.tsx), built by hand for the first three and by `useSheetTab` (taxonomy-sheet-tab.tsx) after them, and
// a new sheet is an entry in TABS and a view below. BioData Admin and above only (the `taxonomyManagement` feature, reports-data.ts).
// The tab labels are short because the tabs in a row must fit beside the rail and column 2 (the full names, "BioData - Taxonomy list - SA
// Regions" and the rest, are the sheets' titles and are written on the first row of each export): at their full length they were 1,840px wide
// and pushed the report page sideways. They fit from 1440px; a narrower window scrolls the strip inside itself, never the page, and
// keeps the open tab in view.
// The icons are the ones the app uses elsewhere for the same thing (CONTRACTS 2.4, 3.13): File06 for the Main details of a taxon,
// Map02 and Globe01 for its SA Regions and its Australian and Overseas Distribution, Microscope for a herbarium specimen, List for its Attributes,
// ClockRewind for an audit log, which also rolls up the Rename, Combine, Split and Append committed in Taxonomy Management (the designer, 16 Oct 2026: they
// are not tabs of their own), Copy01 for a name it is also known by. A search typed on one tab is kept on the next (`TaxonomyTabs`). Every tab's state is held here, and the tab strip and the page of each sheet are `TaxonomyTabs`
// (taxonomy-tabs-shell.tsx), shared with the Fauna Taxonomy Report.

type TabId = "list-detail" | "sa-regions" | "aus-world" | "ref-herb" | "attributes" | "audit-log" | "synonym";

const TABS: ReportTab<TabId>[] = [
  { id: "list-detail", label: "List detail", icon: File06 },
  { id: "sa-regions", label: "SA regions", icon: Map02 },
  { id: "aus-world", label: "Aus / World", icon: Globe01 },
  { id: "ref-herb", label: "Reg herb data", icon: Microscope },
  { id: "attributes", label: "Species attributes", icon: List },
  { id: "audit-log", label: "Audit log", icon: ClockRewind },
  { id: "synonym", label: "Species synonym", icon: Copy01 },
];

export function TaxonomyReport() {
  const listDetail = useListDetailTab();
  const saRegions = useSaRegionsTab();
  const ausWorld = useAusWorldTab();
  const refHerb = useRefHerbTab();
  const attributes = useAttributesTab();
  const audit = useAuditTab();
  const synonym = useSynonymTab();

  return (
    <TaxonomyTabs
      tabs={TABS}
      label="Taxonomy reports"
      render={(tab, view): ReactNode => {
        switch (tab) {
          case "list-detail":
            return view(listDetail);
          case "sa-regions":
            return view(saRegions);
          case "aus-world":
            return view(ausWorld);
          case "ref-herb":
            return view(refHerb);
          case "attributes":
            return view(attributes);
          case "audit-log":
            return view(audit);
          case "synonym":
            return view(synonym);
        }
      }}
    />
  );
}

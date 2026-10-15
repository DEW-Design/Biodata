"use client";

import type { ReactNode } from "react";
import { BookClosed, ClockRewind, File06, Flag01, Globe01, List, MarkerPin04 } from "@untitledui/icons";
import { useFaunaAusDistributionTab, useFaunaRegionalDataTab, useFaunaSpeciesReferenceTab } from "@/app/pages/_shared/reports/fauna-taxonomy-place-tabs";
import { useFaunaAttributesTab, useFaunaAuditTab } from "@/app/pages/_shared/reports/fauna-taxonomy-record-tabs";
import { useFaunaListDetailTab, useFaunaStatusTab } from "@/app/pages/_shared/reports/fauna-taxonomy-tabs";
import { TaxonomyTabs, type ReportTab } from "@/app/pages/_shared/reports/taxonomy-tabs-shell";

// The Fauna Taxonomy Report (the designer, 16 Oct 2026: "same UI structure as the flora report"): one report on the Reports landing page with a tab for each sheet
// (`?tab=`), built by the same `TaxonomyTabs` as the Flora Taxonomy Report (taxonomy-report.tsx). The designer is sending the sheets a few at a time, so it has seven
// tabs so far: the list in detail and the species status (fauna-taxonomy-tabs.tsx), the Australian distribution, regional data and species reference
// (fauna-taxonomy-place-tabs.tsx), and the species attributes and audit log (fauna-taxonomy-record-tabs.tsx); a new sheet is an entry in TABS and a view below.
// The tabs follow the sheets' order, which is also the order of a Fauna taxon's own tabs in Taxonomy Management, apart from Common Name, which is a column here.
// BioData Admin and above only (`taxonomyManagement`, as Taxonomy Management and the Flora report). The icons are the ones the app uses for the same thing (CONTRACTS 2.4,
// 3.13), those of a taxon's own tabs (tx-records.tsx): File06, Flag01, Globe01, MarkerPin04, BookClosed and List, and ClockRewind for an audit log as elsewhere.

type TabId = "list-detail" | "species-status" | "aus-distribution" | "regional-data" | "species-reference" | "attributes" | "audit-log";

const TABS: ReportTab<TabId>[] = [
  { id: "list-detail", label: "List detail", icon: File06 },
  { id: "species-status", label: "Species status", icon: Flag01 },
  { id: "aus-distribution", label: "Australian distribution", icon: Globe01 },
  { id: "regional-data", label: "Regional data", icon: MarkerPin04 },
  { id: "species-reference", label: "Species reference", icon: BookClosed },
  { id: "attributes", label: "Species attributes", icon: List },
  { id: "audit-log", label: "Audit log", icon: ClockRewind },
];

export function FaunaTaxonomyReport() {
  const listDetail = useFaunaListDetailTab();
  const status = useFaunaStatusTab();
  const ausDistribution = useFaunaAusDistributionTab();
  const regionalData = useFaunaRegionalDataTab();
  const speciesReference = useFaunaSpeciesReferenceTab();
  const attributes = useFaunaAttributesTab();
  const audit = useFaunaAuditTab();
  return (
    <TaxonomyTabs
      tabs={TABS}
      label="Fauna taxonomy reports"
      render={(tab, view): ReactNode => {
        switch (tab) {
          case "list-detail":
            return view(listDetail);
          case "species-status":
            return view(status);
          case "aus-distribution":
            return view(ausDistribution);
          case "regional-data":
            return view(regionalData);
          case "species-reference":
            return view(speciesReference);
          case "attributes":
            return view(attributes);
          case "audit-log":
            return view(audit);
        }
      }}
    />
  );
}

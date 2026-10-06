"use client";

import type { FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart01, FileCheck02, Folder, Microscope, UploadCloud02 } from "@untitledui/icons";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { ActionRow } from "@/app/pages/_shared/agreement-actions";
import { AgreementScopeNav } from "@/app/pages/_shared/agreement-scope";
import { useCreateReportDialog } from "@/app/pages/_shared/reports/create-report-modal";
import { REPORT_CATEGORIES, type ReportCategoryId } from "@/app/pages/_shared/reports/reports-data";
import { REPORTS_SECTION_LABEL } from "@/lib/registered-user-nav";
import { useRoleHref } from "@/lib/use-role-href";

// Column 2 of the Reports landing, fixed (the designer, 6 Oct 2026: "Fixed nav: All reports, My reports. User actions: Create a
// report"): the same All / My switch as the DLA, DSA and nominations lists (`AgreementScopeNav`, `?scope=`), then the Actions
// group with Create a report, which opens the choose-a-report dialog (`CreateReportModal`). All reports is the catalogue (cards
// or table, with the category tabs in the page); My reports is the reports the person has generated. A report's own page has
// no column 2 (3.7). The category tabs share `?category=` (`useChooseReportsTab`).

export type ReportsTab = "all" | "favourites" | ReportCategoryId;

/** One icon per category (the report cards and rows name the category in a badge). */
export const CATEGORY_ICONS: Record<ReportCategoryId, FC<{ className?: string }>> = {
  uploads: UploadCloud02,
  specimens: Microscope,
  "project-data": Folder,
  agreements: FileCheck02,
};

/** The chosen item, from `?category=` ("favourites" or a category id); anything else is "all". */
export function useReportsTab(): ReportsTab {
  const value = useSearchParams().get("category");
  return value === "favourites" || REPORT_CATEGORIES.some((c) => c.id === value) ? (value as ReportsTab) : "all";
}

/** Chooses an item (from column 2 or from the tabs above the cards): it is the address's `?category=`, so both always agree. */
export function useChooseReportsTab() {
  const router = useRouter();
  const roleHref = useRoleHref();
  return (key: string) => router.push(roleHref(key === "all" ? "/pages/reports" : `/pages/reports?category=${key}`));
}

export function ReportsNav() {
  const openCreate = useCreateReportDialog();
  const AllIcon = sectionIcons[REPORTS_SECTION_LABEL];
  return (
    <div className="flex flex-col gap-1">
      <AgreementScopeNav heading="Reports" basePath="/pages/reports" defaultScope="all" allLabel="All reports" myLabel="My reports" allIcon={AllIcon} />
      <div className="mt-4 flex flex-col gap-1 border-t border-secondary pt-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">Actions</p>
        <ActionRow icon={BarChart01} onClick={() => openCreate(true)}>
          Create a report
        </ActionRow>
      </div>
    </div>
  );
}

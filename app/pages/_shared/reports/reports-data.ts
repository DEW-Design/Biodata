import type { FC } from "react";
import { AlertTriangle, Database01, Folder, Lock01, Microscope, RefreshCw01, Rows01, Tag01, UploadCloud02 } from "@untitledui/icons";

// The reports the Reports landing page (/pages/reports) offers, one card each. A report is added here
// once, when the designer supplies it: its card, its route under /pages/reports/<id> and its page. Only
// the reports that exist are listed; the admin IA's "Application and System Reports" and "Audit Log
// Reports" are not, until they are built.

/** How the landing groups the reports (designer, 1 Oct 2026: "Grouped into categories, yep"). The names are the build's. */
export type ReportCategoryId = "uploads" | "specimens" | "project-data";

export const REPORT_CATEGORIES: { id: ReportCategoryId; label: string }[] = [
  { id: "uploads", label: "Uploads" },
  { id: "specimens", label: "Specimens and restrictions" },
  { id: "project-data", label: "Project data" },
];

export interface ReportEntry {
  id: string;
  /** The report's name, as the designer gave it. */
  title: string;
  /** One line on what the report answers, for the card. */
  description: string;
  icon: FC<{ className?: string }>;
  category: ReportCategoryId;
  /** Path under /pages/reports (the role is added by `useRoleHref`). */
  path: string;
}

export const REPORTS: ReportEntry[] = [
  {
    id: "data-ingestion",
    category: "uploads",
    title: "Data Ingestion Report Pre-Flight Validation",
    description: "Every dataset upload, from pre-flight validation through submission to review and approval, with the error and successful files.",
    icon: UploadCloud02,
    path: "/pages/reports/data-ingestion",
  },
  {
    id: "post-ingestion",
    category: "uploads",
    title: "Project Dataset Post Ingestion",
    description: "Every dataset submission beside the facts of the project it went into: its dates, restrictions, template, and who reviewed and approved it.",
    icon: Database01,
    path: "/pages/reports/post-ingestion",
  },
  {
    id: "sensitive-restriction",
    category: "specimens",
    title: "Project Sensitive and Restriction Report",
    description: "Every embargo, sensitive species, sensitive location and other restriction on a project, with who reviewed it and how it is treated.",
    icon: Lock01,
    path: "/pages/reports/sensitive-restriction",
  },
  {
    id: "voucher-id-update",
    category: "specimens",
    title: "Voucher ID Update Report",
    description: "Voucher details held by a museum or herbarium beside the ones BioData holds for the same specimen, with the field that disagrees.",
    icon: Tag01,
    path: "/pages/reports/voucher-id-update",
  },
  {
    id: "data-validation-error",
    category: "uploads",
    title: "Data Validation Error Report",
    description: "The errors found in one dataset: which records failed, which rule they broke, and how serious it is.",
    icon: AlertTriangle,
    path: "/pages/reports/data-validation-error",
  },
  {
    id: "specimendb-refresh",
    category: "specimens",
    title: "SpecimenDB Refresh Report",
    description: "The batches of specimen records refreshed from SpecimenDB into BioData, in Darwin Core, with any error.",
    icon: RefreshCw01,
    path: "/pages/reports/specimendb-refresh",
  },
  {
    id: "project-detail",
    category: "project-data",
    title: "Project Detail Report",
    description: "Every project's registration in one table: owner, managers, permits, restrictions and how many records it holds.",
    icon: Folder,
    path: "/pages/reports/project-detail",
  },
  {
    id: "species-detail",
    category: "project-data",
    title: "Species Detail Report",
    description: "Every species record with its class, codes, voucher and field measurements, across the projects you can report on.",
    icon: Microscope,
    path: "/pages/reports/species-detail",
  },
  {
    id: "events-occurrences-observations",
    category: "project-data",
    title: "Events, Occurrences and Observations Report",
    description: "The survey records of your projects, at each level: events, the occurrences under them and their observations.",
    icon: Rows01,
    path: "/pages/reports/events-occurrences-observations",
  },
];

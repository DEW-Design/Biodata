import type { FC } from "react";
import { AlertTriangle, Bell01, ClockRewind, Database01, FileCheck02, Folder, Key01, Key02, Lock01, Microscope, RefreshCw01, Rows01, Share07, Tag01, UploadCloud02, UserCheck01, Users01, UsersCheck } from "@untitledui/icons";
import { sectionIcons } from "@/app/pages/_shared/nav-icons";
import { TAXONOMY_SECTION_LABEL } from "@/lib/registered-user-nav";
import { hasFeatureAccess, type FeatureKey } from "@/config/role-access.config";
import type { UserRole } from "@/lib/user-role";
import { FAUNA_TAXONOMY_REPORT_TITLE, TAXONOMY_REPORT_TITLE } from "@/app/pages/_shared/reports/taxonomy-report-title";

// The reports the Reports landing page (/pages/reports) offers, one card each. A report is added here
// once, when the designer supplies it: its card, its route under /pages/reports/<id> and its page. Only
// the reports that exist are listed; the admin IA's "Application and System Reports" is not, until it is built. The
// "Audit Log Reports" are one so far, the Project Audit Log Report.

/** How the landing groups the reports (designer, 1 Oct 2026: "Grouped into categories, yep"). The names are the build's. */
export type ReportCategoryId = "uploads" | "specimens" | "project-data" | "taxonomy" | "agreements" | "users-access" | "system" | "audit-log";

export const REPORT_CATEGORIES: { id: ReportCategoryId; label: string }[] = [
  { id: "uploads", label: "Uploads" },
  { id: "specimens", label: "Specimens and restrictions" },
  { id: "project-data", label: "Project data" },
  { id: "taxonomy", label: "Taxonomy" },
  { id: "agreements", label: "Agreements" },
  { id: "users-access", label: "Users and access" },
  { id: "system", label: "Application and system" },
  { id: "audit-log", label: "Audit log" },
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
  /** A feature a role needs for the report to be offered at all (the role-access matrix). Left out, every role that has Reports is offered it. */
  feature?: FeatureKey;
  /** The report can be limited to one project (it has a project scope), so Create a report offers the choice and a generated report keeps it. */
  scoped?: boolean;
}

/** The reports a role is offered: a report whose feature the role lacks is not listed, switched to or counted. */
export const reportsFor = (role: UserRole): ReportEntry[] => REPORTS.filter((r) => !r.feature || hasFeatureAccess(r.feature, role));

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
    feature: "specimenReports",
  },
  {
    id: "voucher-id-update",
    category: "specimens",
    title: "Voucher ID Update Report",
    description: "Voucher details held by a museum or herbarium beside the ones BioData holds for the same specimen, with the concept that disagrees.",
    icon: Tag01,
    path: "/pages/reports/voucher-id-update",
    feature: "specimenReports",
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
    feature: "specimenReports",
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
    scoped: true,
  },
  {
    id: "events-occurrences-observations",
    category: "project-data",
    title: "Events, Occurrences and Observations Report",
    description: "The survey records of your projects, at each level: events, the occurrences under them and their observations.",
    icon: Rows01,
    path: "/pages/reports/events-occurrences-observations",
    scoped: true,
  },
  {
    id: "taxonomy",
    category: "taxonomy",
    title: TAXONOMY_REPORT_TITLE,
    description: "The taxa BioData holds, one report for each view: the taxonomy list in detail, its regions and areas, herbarium data, attributes, audit log (with every rename, combine, split and append) and synonyms.",
    icon: sectionIcons[TAXONOMY_SECTION_LABEL],
    path: "/pages/reports/taxonomy",
    feature: "taxonomyManagement",
  },
  {
    id: "fauna-taxonomy",
    category: "taxonomy",
    title: FAUNA_TAXONOMY_REPORT_TITLE,
    description: "The fauna BioData holds, one report for each view: the taxonomy list in detail, species status, Australian distribution, regional data, species reference, species attributes and audit log.",
    icon: sectionIcons[TAXONOMY_SECTION_LABEL],
    path: "/pages/reports/fauna-taxonomy",
    feature: "taxonomyManagement",
  },
  {
    id: "dla-agreement",
    category: "agreements",
    title: "Data Licence Agreement Report",
    description: "Every data licence request and agreement: who asked, what for, who approved it and for how long.",
    icon: FileCheck02,
    path: "/pages/reports/dla-agreement",
    feature: "dlaAccess",
  },
  {
    id: "dsa-agreement",
    category: "agreements",
    title: "Data Sharing Agreement Report",
    description: "Every data sharing agreement with a partner: who asked, who approved it, for how long and how it connects.",
    icon: Share07,
    path: "/pages/reports/dsa-agreement",
    feature: "dsaManagement",
  },
  {
    id: "user-detail",
    category: "users-access",
    title: "User Detail Report",
    description: "Every user account: who they are, how to reach them, their organisation, type and status.",
    icon: Users01,
    path: "/pages/reports/user-detail",
    feature: "userManagement",
  },
  {
    id: "role-detail",
    category: "users-access",
    title: "Role Detail Report",
    description: "Every role: what it is for, the department it belongs to, its type and when it is valid.",
    icon: UserCheck01,
    path: "/pages/reports/role-detail",
    feature: "userManagement",
  },
  {
    id: "user-role-detail",
    category: "users-access",
    title: "User - Role Detail Report",
    description: "The roles each user holds, one row for each user and role, beside the status of both.",
    icon: UsersCheck,
    path: "/pages/reports/user-role-detail",
    feature: "userManagement",
  },
  {
    id: "permission-detail",
    category: "users-access",
    title: "Permission Detail Report",
    description: "Every permission: what it allows, its type, its status and when it is valid.",
    icon: Key01,
    path: "/pages/reports/permission-detail",
    feature: "userManagement",
  },
  {
    id: "role-permission-detail",
    category: "users-access",
    title: "Role - Permission Detail Report",
    description: "The permissions each role holds, one row for each role and permission, beside the status of the role.",
    icon: Key02,
    path: "/pages/reports/role-permission-detail",
    feature: "userManagement",
  },
  {
    id: "notification-config-detail",
    category: "system",
    title: "Notification Config Detail Report",
    description: "Every automated email BioData SA sends: what triggers it, who receives it, what it says and when it runs.",
    icon: Bell01,
    path: "/pages/reports/notification-config-detail",
    feature: "notificationManagement",
  },
  {
    id: "ctrl-vocab-detail",
    category: "system",
    title: "Control Vocab Detail Report",
    description: "Every controlled vocabulary entry beside its vocabulary: the category, type and status, its title, name and order.",
    icon: Database01,
    path: "/pages/reports/ctrl-vocab-detail",
    feature: "ctrlVocabManagement",
  },
  {
    id: "project-audit-log",
    category: "audit-log",
    title: "Project Audit Log Report",
    description: "Every change to a project, one row per concept: what it was, what it is now, who changed it and where from.",
    icon: ClockRewind,
    path: "/pages/reports/project-audit-log",
    feature: "projectAuditLog",
  },
];

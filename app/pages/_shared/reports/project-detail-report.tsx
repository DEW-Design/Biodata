"use client";

import { useMemo } from "react";
import { Folder } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { datasetCountsByProject, reportBundlesFor } from "@/app/pages/_shared/reports/report-records";
import { projectRowFor, type ProjectRow } from "@/app/pages/_shared/reports/project-detail-report-data";
import { DataReport } from "@/app/pages/_shared/reports/report-table";
import { csvExportAction, REPORT_WIDTH as W, emptyColumn, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { useUserRole } from "@/lib/use-user-role";

// The Project Detail Report (Figma YMproGZfrFB5jUqPHPxMhk frame 1583:31154, columns list 1583:31033): one row per
// project, all 41 of the wireframe's columns, in its order, in a table that scrolls sideways. Fitted into the
// shared report pattern (report-table.tsx) with these departures from the wireframe, on purpose:
//   - labels are sentence case and spelled out; "Oraganisation/Institution" is "Organisation/institution" and
//     "Owner Organization" is "Owner organisation";
//   - "Seq #" is the project's place in the platform's project order (Explore's Project events), the same for every
//     role, so a registered user's two projects read 1 and 3, not 1 and 2;
//   - Project ID and title are covered by the search box, so the attribute filter does not offer them;
//   - no project scope: the rows are the projects, and search and the Status filter do that job. The tiles count
//     the projects in view;
//   - the wireframe's "Export as" is Export CSV: the rows in the table, every column;
//   - a contact's role sits in "Owner role" beside the owner contact because the wireframe lists columns flat
//     (CONTRACTS 4.7); there is no separate role-of-the-person-who-registered column. "Project created by" is the
//     project's contributor, which the app holds.
// The owner is the data owner's first contact (the project page's "Published by" card), the contact column is that
// person's phone number, and the owner organisation is their own team when it differs from the publisher.

const columns: ViewColumn<ProjectRow>[] = [
  numberColumn("seq", "Seq #", W.xs, (r) => r.seq, { sticky: true }),
  idColumn("code", "Project ID", W.sm, (r) => r.code),
  textColumn("title", "Project title", W.xl, (r) => r.title, { strong: true }),
  textColumn("description", "Project description", W.xl, (r) => r.description, { clamp: true }),
  {
    id: "status",
    label: "Status",
    width: W.sm,
    sort: (r) => r.status,
    cell: (r) => (
      <Badge size="sm" color={r.statusColor}>
        {r.status}
      </Badge>
    ),
    text: (r) => r.status,
  },
  numberColumn("events", "Events", W.xs, (r) => r.events),
  numberColumn("occurrences", "Occurrences", W.sm, (r) => r.occurrences),
  numberColumn("observations", "Observations", W.sm, (r) => r.observations),
  { ...numberColumn<ProjectRow>("start", "Start date", W.sm, (r) => r.start), sort: (r) => r.startIso },
  { ...numberColumn<ProjectRow>("end", "End date", W.sm, (r) => r.end), sort: (r) => r.endIso || "9999-12-31" },
  textColumn("organisation", "Organisation/institution", W.lg, (r) => r.organisation),
  textColumn("owner", "Project owner", W.md, (r) => r.owner),
  textColumn("ownerEmail", "Project owner email", W.xl, (r) => r.ownerEmail),
  textColumn("ownerContact", "Owner contact", W.md, (r) => r.ownerContact),
  textColumn("ownerRole", "Owner role", W.md, (r) => r.ownerRole),
  textColumn("ownerOrganisation", "Owner organisation", W.lg, (r) => r.ownerOrganisation),
  textColumn("manager", "Project manager", W.lg, (r) => r.manager),
  textColumn("managerEmail", "Project manager email", W.xxl, (r) => r.managerEmail, { clamp: true }),
  textColumn("managerContact", "Manager contact", W.lg, (r) => r.managerContact),
  textColumn("managerRole", "Manager role", W.lg, (r) => r.managerRole),
  textColumn("managerOrganisation", "Manager organisation", W.xl, (r) => r.managerOrganisation),
  textColumn("location", "Project location", W.xl, (r) => r.location, { clamp: true }),
  textColumn("speciesGroup", "Species group", W.lg, (r) => r.speciesGroups.join(", ")),
  textColumn("targetedSpecies", "Targeted species", W.xl, (r) => r.targetedSpecies, { clamp: true }),
  textColumn("method", "Data collection method", W.lg, (r) => r.method),
  textColumn("permitType", "Permit type", W.lg, (r) => r.permitTypes.join("; ")),
  textColumn("permitNumber", "Permit number", W.md, (r) => r.permitNumbers),
  textColumn("uriDoi", "URI/DOI number", W.md, (r) => r.uriDoi),
  textColumn("limitations", "Limitations and biases", W.xl, (r) => r.limitations, { clamp: true }),
  textColumn("restricted", "Project restriction", W.md, (r) => r.restricted),
  textColumn("embargo", "Embargo", W.sm, (r) => r.embargo),
  textColumn("embargoType", "Embargo type", W.lg, (r) => r.embargoTypes.join(", ")),
  textColumn("restrictedMetadata", "Restricted project metadata", W.lg, (r) => r.restrictedMetadata, { clamp: true }),
  textColumn("restrictedSpecies", "Restricted species", W.lg, (r) => r.restrictedSpecies, { clamp: true }),
  textColumn("restrictedAttributes", "Restricted species attributes", W.lg, (r) => r.restrictedAttributes, { clamp: true }),
  textColumn("restrictedLocation", "Restricted location", W.lg, (r) => r.restrictedLocation, { clamp: true }),
  textColumn("otherRestrictions", "Other restrictions", W.lg, (r) => r.otherRestrictions, { clamp: true }),
  textColumn("createdBy", "Project created by", W.md, (r) => r.createdBy),
  emptyColumn("createdOn", "Project created on", W.md),
  emptyColumn("updatedBy", "Last updated by", W.md),
  textColumn("updatedOn", "Last updated on", W.md, (r) => r.updatedOn, { noSort: true }),
];

const rowId = (r: ProjectRow) => r.id;
const searchText = (r: ProjectRow) => [r.code, r.title, r.organisation, r.owner, r.manager];

export function ProjectDetailReport() {
  const role = useUserRole();
  const datasets = useDatasets();
  const rows = useMemo(() => reportBundlesFor(role).map(projectRowFor), [role]);
  const datasetCounts = useMemo(() => datasetCountsByProject(datasets), [datasets]);

  const attributes = useMemo(() => {
    const options = (get: (r: ProjectRow) => string[]) => optionsFromValues(rows.flatMap(get));
    const one = (id: string, label: string, list: { id: string; label: string }[], get: (r: ProjectRow) => string | string[], searchable?: boolean): Attribute<ProjectRow>[] => (list.length > 0 ? [{ id, kind: "options", label, options: list, get, searchable }] : []);
    return [
      ...one("status", "Status", options((r) => [r.status]), (r) => r.status),
      ...one("speciesGroup", "Species group", options((r) => r.speciesGroups), (r) => r.speciesGroups),
      ...one("method", "Data collection method", options((r) => [r.method]), (r) => r.method),
      ...one("permitType", "Permit type", options((r) => r.permitTypes), (r) => r.permitTypes),
      ...one("restricted", "Project restriction", [{ id: "Yes", label: "Yes" }, { id: "No", label: "No" }], (r) => r.restricted),
      ...one("embargoType", "Embargo type", options((r) => r.embargoTypes), (r) => r.embargoTypes),
      ...one("organisation", "Project owner organisation", options((r) => [r.organisation]), (r) => r.organisation, true),
    ];
  }, [rows]);

  const isAdmin = role === "biodata-admin";
  return (
    <DataReport
      title="Project Detail Report"
      subtitle="Every project, one row each, with its owner, manager, data collection and restrictions."
      scope={isAdmin ? "All projects" : "Your projects"}
      icon={Folder}
      rows={rows}
      rowId={rowId}
      columns={columns}
      attributes={attributes}
      searchText={searchText}
      searchLabel="Search the report"
      searchPlaceholder="Search by project ID, title, organisation or person"
      tableLabel="Projects, one row each"
      noun="projects"
      emptyDescription="Projects you contribute to appear here, with their owner, manager, data collection and restrictions."
      initialSort={{ column: "seq", direction: "ascending" }}
      facts={(inView) => [
        { label: "Datasets", value: inView.reduce((n, r) => n + (datasetCounts.get(r.id) ?? 0), 0).toLocaleString("en-AU") },
        { label: "Events", value: inView.reduce((n, r) => n + r.events, 0).toLocaleString("en-AU") },
        { label: "Occurrences", value: inView.reduce((n, r) => n + r.occurrences, 0).toLocaleString("en-AU") },
        { label: "Observations", value: inView.reduce((n, r) => n + r.observations, 0).toLocaleString("en-AU") },
      ]}
      actions={(inView) => <RecordActionBar onDark menu={[csvExportAction(inView, columns, "project-detail-report.csv")]} />}
    />
  );
}

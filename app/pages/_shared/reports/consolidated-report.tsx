"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LayersThree01 } from "@untitledui/icons";
import type { AppliedFilter, Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { consolidatedRowsFor, type ConsolidatedRow } from "@/app/pages/_shared/reports/consolidated-report-data";
import { REPORT_WIDTH as W, emptyColumn, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { reportBundlesFor } from "@/app/pages/_shared/reports/report-records";
import { DataReport, NumberCell, SpeciesCell } from "@/app/pages/_shared/reports/report-table";
import { useSheetTab, type FilterSpec } from "@/app/pages/_shared/reports/taxonomy-sheet-tab";
import { useUserRole } from "@/lib/use-user-role";

// The Consolidated report (the designer's sheet, 29 Oct 2026): one row per species sighting, with the visit and the site it was made at and
// the project it belongs to. It is built the way the Flora Taxonomy Report's sheets are (taxonomy-sheet-tab.tsx), because it is a sheet too:
//   - Its metadata (the ten lines at the head of the sheet) is not a form of its own. A line a person types (an NSX code, a name, a site, a
//     location, coordinates) is the table's search, which matches them; a line chosen from the rows (Visit Observers, Site Type) and the Sighting
//     Period are attributes of the one Filter menu (CONTRACTS 4.2d). The sheet's title and its ten lines are written above the columns of Export
//     CSV and Export XLSX, from the search and the filters in view.
//   - "Add filters" (Project Owner, Sites, Species) are the Filter's further attributes. Source Type is not offered: no record in the app has a
//     source type, and a filter on a value the data does not have cannot filter anything (4.2d).
//   - The columns are the sheet's list, in its order. The four it offers under "Add columns" (Project owner email, Land form pattern, Bare earth
//     estimate, Tissue and description) are in the Columns chooser and start hidden. A column the app holds no value for (Zone, Easting, Northing, Site
//     type, Generated location, Photos, Tissue and description) is in the table and empty, never filled with a guess (0.3). The sheet lists "Common
//     Name" twice; it is here once.
//   - It has no Parameters button: it is a sheet, and a sheet's inputs are the search and the Filter (report-parameters.tsx). The project is one more
//     Filter attribute, and a generated report (My reports, `?project=`) opens with that project's chip on, which can be removed.
//   - Labels are sentence case, as the other reports write theirs; "Scientific name" is in italics.

const METADATA: FilterSpec<ConsolidatedRow> = {
  labels: [
    "NSX Code",
    "Scientific Name",
    "Common Name",
    "Sighting Period",
    "Visit Observers",
    "Site ID / Site Property",
    "Location",
    "Site Type",
    "Geographic Coordinates (GCS)",
    "Projected Coordinates (PCS)",
  ],
  selects: [
    { id: "observers", label: "Visit Observers", get: (r) => r.observers, searchable: true },
    { id: "siteType", label: "Site Type", get: (r) => r.siteType },
  ],
  date: { label: "Sighting Period", days: (r) => (r.visitDay ? [r.visitDay] : []) },
};

const columns: ViewColumn<ConsolidatedRow>[] = [
  numberColumn("visitSeq", "Visit seq #", W.sm, (r) => r.visitSeq, { sticky: true }),
  textColumn("project", "Project ID and title", W.xl, (r) => r.project),
  textColumn("site", "Site ID and title", W.xl, (r) => r.site),
  idColumn("visitId", "Visit ID", W.sm, (r) => r.visitId),
  {
    id: "visitDate",
    label: "Visit date and time",
    width: W.md,
    sort: (r) => r.visitDay,
    cell: (r) => <NumberCell value={r.visitDate} />,
    text: (r) => r.visitDate,
  },
  idColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  {
    id: "scientific",
    label: "Scientific name",
    width: W.lg,
    sort: (r) => r.scientific,
    cell: (r) => <SpeciesCell scientific={r.scientific} />,
    text: (r) => r.scientific,
  },
  textColumn("common", "Common name", W.lg, (r) => r.common, { strong: true }),
  textColumn("released", "Released/planted", W.md, (r) => r.released),
  textColumn("accuracy", "Accuracy/reliability", W.md, (r) => r.accuracy),
  textColumn("sighting", "Sighting #", W.md, (r) => r.sighting),
  numberColumn("numberObserved", "Number observed", W.md, (r) => r.numberObserved),
  textColumn("sourceId", "Source ID", W.sm, (r) => r.sourceId),
  textColumn("siteProperty", "Site property", W.lg, (r) => r.siteProperty, { clamp: true }),
  numberColumn("altitude", "Altitude", W.sm, (r) => r.altitude),
  textColumn("paddock", "Paddock", W.md, (r) => r.paddock),
  textColumn("siteType", "Site type", W.md, (r) => r.siteType),
  textColumn("camp", "Camp/group", W.md, (r) => r.camp),
  emptyColumn("zone", "Zone", W.xs),
  emptyColumn("easting", "Easting", W.sm),
  emptyColumn("northing", "Northing", W.sm),
  numberColumn("latitude", "Latitude (GDA 2020)", W.md, (r) => r.latitude),
  numberColumn("longitude", "Longitude (GDA 2020)", W.md, (r) => r.longitude),
  textColumn("locationMethod", "Location method", W.md, (r) => r.locationMethod),
  textColumn("methodName", "Method name", W.lg, (r) => r.methodName),
  textColumn("datum", "Datum", W.md, (r) => r.datum),
  textColumn("reliability", "Reliability", W.md, (r) => r.reliability),
  textColumn("locationComments", "Location comments", W.xl, (r) => r.locationComments, { clamp: true }),
  emptyColumn("generatedLocation", "Generated location", W.lg),
  emptyColumn("photos", "Photos", W.sm),
  // The sheet's "Add columns": offered in the chooser, hidden until a person adds them.
  textColumn("ownerEmail", "Project owner email", W.xl, (r) => r.ownerEmail, { clamp: true }),
  textColumn("landForm", "Land form pattern", W.md, (r) => r.landForm),
  numberColumn("bareEarth", "Bare earth estimate", W.md, (r) => r.bareEarth),
  emptyColumn("tissue", "Tissue and description", W.lg),
];

const ADDED_COLUMNS = ["ownerEmail", "landForm", "bareEarth", "tissue"];

const rowId = (r: ConsolidatedRow) => r.id;
const searchText = (r: ConsolidatedRow) => [r.nsx, r.scientific, r.common, r.site, r.siteProperty, r.project, r.visitId, r.sighting, r.latitude, r.longitude, r.locationComments];
const distinct = (values: string[]) => new Set(values.filter(Boolean)).size;

export function ConsolidatedReport() {
  const role = useUserRole();
  const bundles = useMemo(() => reportBundlesFor(role), [role]);
  const rows = useMemo(() => bundles.flatMap(consolidatedRowsFor), [bundles]);
  // A generated report (My reports) opens with the project it was made for, `?project=`, as a filter that is on (only a project the role can report on).
  const fromLink = useSearchParams().get("project");
  const initialFilters = useMemo((): AppliedFilter[] => (fromLink && bundles.some((b) => b.project.id === fromLink) ? [{ id: "project", value: { kind: "options", ids: [fromLink] } }] : []), [fromLink, bundles]);

  // "Add filters": the facets the metadata does not cover, and the project (Source Type has no value in any record, so it is not offered).
  const attributes = useMemo((): Attribute<ConsolidatedRow>[] => {
    const projects = [...new Map(rows.map((r) => [r.projectId, r.project])).entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
    const owners = optionsFromValues(rows.map((r) => r.owner));
    const sites = [...new Map(rows.filter((r) => r.siteId).map((r) => [r.siteId, r.site])).entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
    const species = optionsFromValues(rows.map((r) => r.scientific));
    return [
      ...(projects.length > 0 ? [{ id: "project", kind: "options" as const, label: "Project", options: projects, searchable: true, get: (r: ConsolidatedRow) => r.projectId }] : []),
      ...(owners.length > 0 ? [{ id: "owner", kind: "options" as const, label: "Project Owner", options: owners, get: (r: ConsolidatedRow) => r.owner }] : []),
      ...(sites.length > 0 ? [{ id: "site", kind: "options" as const, label: "Sites", options: sites, searchable: true, get: (r: ConsolidatedRow) => r.siteId }] : []),
      ...(species.length > 0 ? [{ id: "species", kind: "options" as const, label: "Species", options: species, searchable: true, get: (r: ConsolidatedRow) => r.scientific }] : []),
    ];
  }, [rows]);

  const sheet = useSheetTab<ConsolidatedRow>({
    reportTitle: "Consolidated report",
    reportSubtitle: "Every species sighting with the visit, the site and the project it was made in.",
    sheetTitle: "Consolidated report",
    spec: METADATA,
    rows,
    attributes,
    columns,
    rowId,
    searchText,
    searchPlaceholder: "Search by species, NSX code, site, visit or coordinates",
    tableLabel: "Species sightings, one row each",
    noun: "sightings",
    emptyDescription: "Species sightings recorded in your projects appear here, with the visit and the site each was made at.",
    initialSort: { column: "visitDate", direction: "descending" },
    latest: (r) => r.visitDay,
    facts: (inView) => [
      { label: "Visits", value: distinct(inView.map((r) => `${r.projectId}:${r.visitId}`)).toLocaleString("en-AU") },
      { label: "Sites", value: distinct(inView.map((r) => r.siteId)).toLocaleString("en-AU") },
      { label: "Species", value: distinct(inView.map((r) => r.scientific)).toLocaleString("en-AU") },
    ],
    exportName: "consolidated-report",
  });

  return <DataReport {...sheet} icon={LayersThree01} hiddenColumns={ADDED_COLUMNS} initialFilters={initialFilters} />;
}

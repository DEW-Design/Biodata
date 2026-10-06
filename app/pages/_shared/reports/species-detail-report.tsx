"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Feather } from "@untitledui/icons";
import { SPECIES_GROUP_ICON } from "@/app/pages/_shared/map-search/species-group-icons";
import type { SpeciesGroup } from "@/app/pages/_shared/map-search/search-data";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { countKinds, reportBundlesFor, sumCounts } from "@/app/pages/_shared/reports/report-records";
import { ALL_PROJECTS, activeScope, ReportScopeSelect } from "@/app/pages/_shared/reports/report-scope-select";
import { speciesRowsFor, type SpeciesRow } from "@/app/pages/_shared/reports/species-detail-report-data";
import { DataReport, ReportTiles, SpeciesCell } from "@/app/pages/_shared/reports/report-table";
import { REPORT_WIDTH as W, emptyColumn, idColumn, numberColumn, textColumn, type ViewColumn } from "@/app/pages/_shared/reports/report-columns";
import { useUserRole } from "@/lib/use-user-role";

// The Species Detail Report (Figma YMproGZfrFB5jUqPHPxMhk frame 1583:31367, columns list 1594:65311): one row per
// species record, all 45 of the wireframe's columns, in its order, in a table that scrolls sideways. Fitted into the
// shared report pattern (report-table.tsx) with these departures from the wireframe, on purpose:
//   - the project scope is a Select above the tiles ("All Projects"); it limits the rows and the tile counts, so
//     the attribute filter does not offer a Project attribute;
//   - the wireframe's nine species-group tiles are the five groups the app has records for (Plants, Mammals, Birds,
//     Reptiles, Amphibians). Algae, Fungi, Invertebrates and Fish have no record anywhere, and search-data.ts keeps
//     "no buckets with zero members". The group tiles are read-only counts, not buttons;
//   - labels are sentence case and spelled out ("Dominace" is "Association dominance"); "scientific name" is in italics;
//   - "Class" is the species group the app holds (Mammal, Bird ...), not a taxonomic class;
//   - the wireframe's "Export as" is Export CSV: the rows in the table, every column.
// Columns the app has no value for (NSL code, Time, Not in quadrat, the tissue and length-method columns, LnkVch #,
// Source ID, Created date, Introduced species, Past record) are in the table and left empty.

const columns: ViewColumn<SpeciesRow>[] = [
  numberColumn("seq", "Species seq #", W.sm, (r) => r.seq, { sticky: true }),
  textColumn("project", "Projects", W.lg, (r) => r.project),
  textColumn("common", "Species", W.lg, (r) => r.common, { strong: true }),
  textColumn("group", "Class", W.sm, (r) => r.group),
  textColumn("status", "Species status", W.md, (r) => r.status),
  idColumn("nsx", "NSX code", W.sm, (r) => r.nsx),
  emptyColumn("nsl", "NSL code", W.sm),
  {
    id: "scientific",
    label: "Scientific name",
    width: W.lg,
    sort: (r) => r.scientific,
    cell: (r) => <SpeciesCell scientific={r.scientific} />,
    text: (r) => r.scientific,
  },
  textColumn("dateAccuracy", "Date accuracy", W.lg, (r) => r.dateAccuracy),
  textColumn("voucherId", "Voucher ID", W.md, (r) => r.voucherId),
  textColumn("treeHealth", "Tree health", W.xl, (r) => r.treeHealth, { clamp: true }),
  emptyColumn("time", "Time", W.xs),
  textColumn("dominance", "Association dominance", W.lg, (r) => r.dominance),
  textColumn("legacy", "Legacy sighting #", W.lg, (r) => r.legacy),
  numberColumn("numberObserved", "Number observed", W.md, (r) => r.numberObserved),
  emptyColumn("sourceId", "Source ID", W.sm),
  numberColumn("line", "Line", W.xs, (r) => r.line),
  emptyColumn("notInQuadrat", "Not in quadrat", W.md),
  textColumn("lifeForm", "Life form and description", W.lg, (r) => r.lifeForm),
  textColumn("cover", "Cover/abundance and description", W.lg, (r) => r.cover),
  textColumn("activity", "Activity", W.md, (r) => r.activity),
  textColumn("collection", "Collection method and description", W.lg, (r) => r.collection),
  textColumn("strata", "Strata and description", W.lg, (r) => r.strata),
  textColumn("macroHabitat", "Macro habitat and description", W.lg, (r) => r.macroHabitat),
  textColumn("microHabitat", "Micro habitat and description", W.lg, (r) => r.microHabitat),
  emptyColumn("tissueDescription", "Tissue and description", W.lg),
  emptyColumn("lengthMethodDescription", "Length method and description", W.lg),
  emptyColumn("tissue", "Tissue", W.sm),
  textColumn("sex", "Sex", W.md, (r) => r.sex),
  numberColumn("weight", "Weight (g)", W.sm, (r) => r.weight),
  numberColumn("length", "Length (mm)", W.sm, (r) => r.length),
  emptyColumn("lengthMethod", "Length method", W.md),
  emptyColumn("linkedVoucher", "LnkVch #", W.sm),
  numberColumn("snoutVent", "Snout-vent length (mm)", W.md, (r) => r.snoutVent),
  textColumn("gravid", "Gravid?", W.sm, (r) => r.gravid),
  textColumn("teats", "Teats", W.sm, (r) => r.teats),
  textColumn("vagina", "Vagina", W.sm, (r) => r.vagina),
  textColumn("pouch", "Pouch", W.md, (r) => r.pouch),
  textColumn("testes", "Testes", W.sm, (r) => r.testes),
  textColumn("inPouch", "No. in pouch", W.sm, (r) => r.inPouch),
  textColumn("comments", "Comments", W.xl, (r) => r.comments, { clamp: true }),
  emptyColumn("createdDate", "Created date", W.md),
  emptyColumn("introduced", "Introduced species", W.md),
  textColumn("annualHerb", "Annual herbs", W.sm, (r) => r.annualHerb),
  emptyColumn("pastRecord", "Past record", W.sm),
];

/** The species groups the wireframe shows as tiles, in its order, named as it names them. The app holds five of them. */
const GROUP_TILES: { group: SpeciesGroup; label: string }[] = [
  { group: "Plant", label: "Plants" },
  { group: "Mammal", label: "Mammals" },
  { group: "Bird", label: "Birds" },
  { group: "Reptile", label: "Reptiles" },
  { group: "Amphibian", label: "Amphibians" },
];

const rowId = (r: SpeciesRow) => r.id;
const searchText = (r: SpeciesRow) => [r.common, r.scientific, r.nsx, r.project, r.legacy, r.voucherId];

export function SpeciesDetailReport() {
  const role = useUserRole();
  // A generated report (My reports) opens with the project it was made for, `?project=`.
  const [scope, setScope] = useState(useSearchParams().get("project") ?? ALL_PROJECTS);
  const bundles = useMemo(() => reportBundlesFor(role), [role]);
  const projects = useMemo(() => bundles.map((b) => b.project), [bundles]);
  const allRows = useMemo(() => bundles.flatMap(speciesRowsFor), [bundles]);

  const active = activeScope(scope, projects);
  const rows = useMemo(() => (active === ALL_PROJECTS ? allRows : allRows.filter((r) => r.projectId === active)), [allRows, active]);
  const counts = useMemo(() => sumCounts(bundles.filter((b) => active === ALL_PROJECTS || b.project.id === active).map((b) => countKinds(b.seed))), [bundles, active]);

  const attributes = useMemo(() => {
    const one = (id: string, label: string, get: (r: SpeciesRow) => string): Attribute<SpeciesRow>[] => {
      const options = optionsFromValues(allRows.map(get));
      return options.length > 0 ? [{ id, kind: "options", label, options, get }] : [];
    };
    return [
      ...one("group", "Class", (r) => r.group),
      ...one("status", "Species status", (r) => r.status),
      ...one("dateAccuracy", "Date accuracy", (r) => r.dateAccuracy),
      ...one("sex", "Sex", (r) => r.sex),
      ...one("activity", "Activity", (r) => r.activity),
    ];
  }, [allRows]);

  const groupTiles = GROUP_TILES.filter((t) => allRows.some((r) => r.group === t.group)).map((t) => ({ label: t.label, icon: SPECIES_GROUP_ICON[t.group], value: rows.filter((r) => r.group === t.group).length }));

  return (
    <DataReport
      title="Species Detail Report"
      subtitle="Every species record, with the observation made for it."
      scopeControl={<ReportScopeSelect projects={projects} value={scope} onChange={setScope} />}
      facts={[
        { label: "Events", value: counts.events.toLocaleString("en-AU") },
        { label: "Occurrences", value: counts.occurrences.toLocaleString("en-AU") },
        { label: "Observations", value: counts.observations.toLocaleString("en-AU") },
      ]}
      icon={Feather}
      rows={rows}
      rowId={rowId}
      columns={columns}
      attributes={attributes}
      searchText={searchText}
      searchLabel="Search the report"
      searchPlaceholder="Search by species, NSX code, project or sighting"
      tableLabel="Species records, one row each"
      noun="species records"
      emptyDescription="Species recorded in your projects appear here, with the observation made for each."
      initialSort={{ column: "common", direction: "ascending" }}
      belowHeader={<ReportTiles label="Species records by group" tiles={groupTiles} />}
      exportName="species-detail-report"
    />
  );
}

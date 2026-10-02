"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, AlertTriangle, CheckCircle, Download01, Map01, MarkerPin01, Rows01, Tag01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Select } from "@/components/base/select/select";
import { RecordHero } from "@/app/pages/_shared/record-hero";
import { LayoutOptionSwitcher } from "@/app/pages/_shared/layout-option-switcher";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { Clamped, DataReport, SpeciesCell, TextCell, IdCell, ReportTiles, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
import { RecordActionBar } from "@/app/pages/_shared/record-action-bar";
import { useIngestionRuns } from "@/app/pages/_shared/reports/use-ingestion-runs";
import {
  ERROR_CATEGORIES,
  ERROR_SEVERITIES,
  errorReportCsv,
  errorRowsFor,
  errorTilesFor,
  hasErrors,
  rulesFor,
  severityColor,
  severityRank,
  type ErrorRow,
} from "@/app/pages/_shared/reports/data-validation-error-report-data";
import { formatDateTime } from "@/app/pages/_shared/reports/ingestion-report-data";

// The Data Validation Error Report (Figma YMproGZfrFB5jUqPHPxMhk node 1520:12791): the errors found in ONE dataset,
// chosen by project and then by dataset. Six counts for the chosen dataset, then a table of its errors with the
// wireframe's eight columns, in the shared report table. Fitted into the collection pattern (CONTRACTS 4.2), with these
// departures from the wireframe, on purpose:
//   - the always-open filters and "Apply Filter" are the attribute filter (4.2d); the free-text filters are the search box;
//   - "Download source dataset" and "Map visualise" are shown but disabled, with a "Not available in this preview yet"
//     tooltip, the way the template downloads are: uploaded files are never read, so there is no source file to download
//     and no coordinates to map, and neither is faked;
//   - only projects and datasets that had errors are offered, so the page opens on the newest one instead of empty.
// Choosing another dataset keeps the search, filters, sort and page as they are (the report is one table whose rows change),
// so the chips under the toolbar always say what is narrowing it.
// Which datasets a person sees (a registered user theirs, BioData Admin all) is the ingestion report's `visibleTo`.

const WIDTH = {
  record: "w-[128px]",
  project: "w-[120px]",
  species: "w-[248px]",
  category: "w-[172px]",
  rule: "w-[212px]",
  field: "w-[168px]",
  severity: "w-[120px]",
  description: "w-[520px]",
} as const;

const columns: ReportColumn<ErrorRow>[] = [
  { id: "record", label: "Record ID", width: WIDTH.record, sticky: true, sort: (r) => r.recordNumber, cell: (r) => <IdCell>{r.recordId}</IdCell> },
  { id: "project", label: "Project", width: WIDTH.project, sort: (r) => r.projectCode, cell: (r) => <TextCell>{r.projectCode}</TextCell> },
  { id: "species", label: "Species", width: WIDTH.species, sort: (r) => r.scientificName, cell: (r) => <SpeciesCell scientific={r.scientificName} common={r.commonName} /> },
  { id: "category", label: "Category", width: WIDTH.category, sort: (r) => r.category, cell: (r) => <TextCell>{r.category}</TextCell> },
  { id: "rule", label: "Rule", width: WIDTH.rule, sort: (r) => r.rule, cell: (r) => <TextCell>{r.rule}</TextCell> },
  { id: "field", label: "Field", width: WIDTH.field, sort: (r) => r.field, cell: (r) => <TextCell>{r.field}</TextCell> },
  {
    id: "severity",
    label: "Severity",
    width: WIDTH.severity,
    sort: (r) => severityRank(r.severity),
    cell: (r) => (
      <Badge size="sm" color={severityColor[r.severity]}>
        {r.severity}
      </Badge>
    ),
  },
  { id: "description", label: "Description", width: WIDTH.description, sort: (r) => r.description, cell: (r) => <Clamped text={r.description} max="max-w-[496px]" /> },
];

// One icon per tile, in the order `errorTilesFor` lists them: total, clean, with errors, business rule, coordinate, metadata.
const TILE_ICONS = [Rows01, CheckCircle, AlertTriangle, AlertCircle, MarkerPin01, Tag01];

// Two ways to choose the dataset, compared while the screen is explored (CONTRACTS 4.4):
//   option-1: the Project and Dataset selects in a row between the card and the counts;
//   option-2: the same two selects in the toolbar, right after the search and before Filter, which is where a report's
//     project scope already lives (Species Detail, Events), so the card keeps only the title and the facts.
export type ValidationErrorLayout = "option-1" | "option-2";

const LAYOUT_OPTIONS = [
  { id: "option-1", label: "Option 1", description: "Selects between the card and the counts", href: "/pages/reports/data-validation-error" },
  { id: "option-2", label: "Option 2", description: "Selects in the toolbar", href: "/pages/reports/data-validation-error/option-2" },
];

/** What the layout lab (/proto/layouts) changes around the table; the product screens pass nothing. */
export interface ReportChrome {
  header?: "card" | "line";
  filterPanel?: ComponentProps<typeof DataReport<ErrorRow>>["filterPanel"];
}

export function DataValidationErrorReport({ layout = "option-1", chrome }: { layout?: ValidationErrorLayout; chrome?: ReportChrome }) {
  const { runs } = useIngestionRuns();
  const requested = useSearchParams().get("dataset");
  const [picked, setPicked] = useState<string | null>(requested);

  // The runs with errors, newest first. The chosen one is the one asked for, or else the newest.
  const errored = useMemo(() => runs.filter(hasErrors).sort((a, b) => b.at - a.at), [runs]);
  const run = errored.find((r) => r.id === picked) ?? errored[0] ?? null;
  const errors = useMemo(() => (run ? errorRowsFor(run) : []), [run]);
  const tiles = useMemo(() => (run ? errorTilesFor(run, errors) : []), [run, errors]);

  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of errored) if (!seen.has(r.projectId)) seen.set(r.projectId, `${r.projectTitle} (${r.projectCode})`);
    return [...seen].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [errored]);
  const datasetOptions = useMemo(
    () => errored.filter((r) => r.projectId === run?.projectId).map((r) => ({ id: r.id, label: r.id, supportingText: r.fileName })),
    [errored, run?.projectId],
  );

  // The rules and fields a dataset of this kind can have errors on: the same list for every dataset of a kind, so a filter
  // that is on stays meaningful when another dataset is chosen.
  const rules = useMemo(() => rulesFor(run), [run]);
  const attributes: Attribute<ErrorRow>[] = useMemo(
    () => [
      { id: "category", kind: "options", label: "Category", options: ERROR_CATEGORIES.map((c) => ({ id: c, label: c })), get: (r) => r.category },
      { id: "severity", kind: "options", label: "Severity", options: ERROR_SEVERITIES.map((s) => ({ id: s, label: s })), get: (r) => r.severity },
      { id: "rule", kind: "options", label: "Rule", options: optionsFromValues(rules.map((r) => r.id)), get: (r) => r.rule },
      { id: "field", kind: "options", label: "Field", options: optionsFromValues(rules.map((r) => r.field)), get: (r) => r.field },
    ],
    [rules],
  );

  const title = "Data Validation Error Report";
  const subtitle = "The errors found in a dataset during validation, record by record.";

  if (!run) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <RecordHero eyebrow="Report" title={title} description={subtitle} />
        <ListEmptyState icon={AlertTriangle} title="No datasets with errors" description="Datasets with validation errors, yours and those on your projects, appear here with each error listed." />
      </div>
    );
  }

  // Option 1: fields with a label above, in a row under the card. Option 2: the toolbar's own small selects (as the project
  // scope on Species Detail), named by aria-label.
  const inToolbar = layout === "option-2";
  const projectSelect = (
    <Select
      size={inToolbar ? "sm" : "md"}
      label={inToolbar ? undefined : "Select project"}
      aria-label="Project"
      placeholder="Select project"
      popoverClassName={inToolbar ? "min-w-[24rem]" : undefined}
      items={projectOptions}
      selectedKey={run.projectId}
      onSelectionChange={(key) => {
        const next = errored.find((r) => r.projectId === key);
        if (next && next.id !== run.id) setPicked(next.id);
      }}
    >
      {(item) => <Select.Item id={item.id} label={item.label} />}
    </Select>
  );
  // In the toolbar the dataset field shows its ID alone (the file name would push the ID out of a narrow field); the list
  // still shows each file name beside its ID.
  const fileNames = new Map(datasetOptions.map((d) => [d.id, d.supportingText]));
  const datasetSelect = (
    <Select
      size={inToolbar ? "sm" : "md"}
      label={inToolbar ? undefined : "Select dataset"}
      aria-label="Dataset"
      placeholder="Select dataset"
      popoverClassName={inToolbar ? "min-w-[24rem]" : undefined}
      items={inToolbar ? datasetOptions.map(({ id, label }) => ({ id, label })) : datasetOptions}
      selectedKey={run.id}
      onSelectionChange={(key) => {
        if (key && key !== run.id) setPicked(String(key));
      }}
    >
      {(item) => <Select.Item id={item.id} label={item.label} supportingText={inToolbar ? fileNames.get(String(item.id)) : item.supportingText} />}
    </Select>
  );

  return (
    <>
      {!chrome && <LayoutOptionSwitcher ariaLabel="Data Validation Error Report layout to show" options={LAYOUT_OPTIONS} current={layout} />}
      <DataReport<ErrorRow>
      header={chrome?.header}
      filterPanel={chrome?.filterPanel}
      title={title}
      subtitle={subtitle}
      facts={[
        { label: "Ingested", value: formatDateTime(run.at) },
        { label: "Total records", value: tiles[0].value.toLocaleString("en-AU") },
        { label: "Clean records", value: tiles[1].value.toLocaleString("en-AU") },
        { label: "Records with errors", value: tiles[2].value.toLocaleString("en-AU") },
      ]}
      icon={AlertTriangle}
      rows={errors}
      rowId={(r) => r.recordId}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.recordId, r.projectCode, r.scientificName, r.commonName, r.category, r.rule, r.field, r.description]}
      searchLabel="Search the errors"
      searchPlaceholder="Search by record, species, rule or field"
      tableLabel={`Validation errors in ${run.fileName}`}
      noun="errors"
      emptyDescription="Errors found in this dataset appear here."
      initialSort={{ column: "record", direction: "ascending" }}
      scopeControl={
        inToolbar ? (
          <>
            <div className="w-56 max-w-full shrink-0">{projectSelect}</div>
            <div className="w-40 max-w-full shrink-0">{datasetSelect}</div>
          </>
        ) : undefined
      }
      belowHeader={
        <>
          {!inToolbar && (
            <div className="flex shrink-0 flex-wrap items-start gap-4 px-6 pb-4">
              <div className="w-full max-w-sm">{projectSelect}</div>
              <div className="w-full max-w-lg">{datasetSelect}</div>
            </div>
          )}
          <ReportTiles compact={chrome?.header === "line"} tiles={tiles.slice(3).map((t, i) => ({ ...t, icon: TILE_ICONS[i + 3] }))} label={`Errors in ${run.id} by kind`} />
        </>
      }
      actions={
        // Map visualise is the card's one next step, the white button where the project page has Upload dataset; the downloads
        // are in the menu. The source dataset and the map have nothing to show in the preview (uploaded files are never read), so
        // they are disabled rather than promised.
        <RecordActionBar
          onDark
          primary={{ id: "map-visualise", label: "Map visualise", icon: Map01, onPress: () => {}, isDisabled: true }}
          menu={[
            {
              id: "download-error-report",
              label: "Download error report",
              icon: Download01,
              onPress: () => {
                const { header, rows } = errorReportCsv(errors);
                downloadCsv(`${run.id}-error-report.csv`, header, rows);
              },
            },
            { id: "download-source", label: "Download source dataset", icon: Download01, onPress: () => {}, isDisabled: true },
          ]}
        />
      }
      />
    </>
  );
}

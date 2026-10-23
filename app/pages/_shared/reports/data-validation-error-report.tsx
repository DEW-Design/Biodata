"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Download01, Map01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Select } from "@/components/base/select/select";
import { RecordHero } from "@/app/pages/_shared/record-hero";
import { downloadCsv } from "@/app/pages/_shared/agreement-actions";
import type { Attribute } from "@/app/pages/_shared/attribute-filter";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { optionsFromValues } from "@/app/pages/_shared/list-filter";
import { Clamped, DataReport, SpeciesCell, TextCell, IdCell, type ReportColumn } from "@/app/pages/_shared/reports/report-table";
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
import { useRoleHref } from "@/lib/use-role-href";
import { splitFileName } from "@/utils/split-file-name";

// The Data Validation Error Report (Figma YMproGZfrFB5jUqPHPxMhk node 1520:12791): the errors found in ONE dataset,
// chosen by project and then by dataset. Seven facts for the chosen dataset in the card (when it was ingested, the three totals, and the errors by
// kind: business rule, coordinate, metadata; the errors by kind were tiles under the card until the designer moved them in, 23 Oct 2026), then a table of its errors with the
// wireframe's eight columns, in the shared report table. Fitted into the collection pattern (CONTRACTS 4.2), with these
// departures from the wireframe, on purpose:
//   - the always-open filters and "Apply Filter" are the attribute filter (4.2d); the free-text filters are the search box;
//   - "Download source dataset" is shown but disabled: uploaded files are never read, so there is no source file to download,
//     and it is not faked;
//   - "Map visualise" opens Explore on the dataset (/pages/observations?dataset=, observations/dataset-error-map.tsx): the
//     dataset's error records over the map, coordinate outliers called out, and a way back to this report. Where a record is
//     comes from the report's data (derived, never read from a file);
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
  concept: "w-[168px]",
  severity: "w-[120px]",
  description: "w-[520px]",
} as const;

const columns: ReportColumn<ErrorRow>[] = [
  { id: "record", label: "Record ID", width: WIDTH.record, sticky: true, sort: (r) => r.recordNumber, cell: (r) => <IdCell>{r.recordId}</IdCell> },
  { id: "project", label: "Project", width: WIDTH.project, sort: (r) => r.projectCode, cell: (r) => <TextCell>{r.projectCode}</TextCell> },
  { id: "species", label: "Species", width: WIDTH.species, sort: (r) => r.scientificName, cell: (r) => <SpeciesCell scientific={r.scientificName} common={r.commonName} /> },
  { id: "category", label: "Category", width: WIDTH.category, sort: (r) => r.category, cell: (r) => <TextCell>{r.category}</TextCell> },
  { id: "rule", label: "Rule", width: WIDTH.rule, sort: (r) => r.rule, cell: (r) => <TextCell>{r.rule}</TextCell> },
  { id: "concept", label: "Concept", width: WIDTH.concept, sort: (r) => r.concept, cell: (r) => <TextCell>{r.concept}</TextCell> },
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

// The project and the dataset the report is on are its Parameters (report-parameters.tsx), drawn inline: two dropdowns on the toolbar's row, to the right of Filter, each showing what it is set to. Every other report
// has its parameters as one button and a popover (the designer chose that for every report on 15 Oct 2026, and the selects between the card and the counts were removed, CONTRACTS 4.4); this report's are two
// linked choices that it is about as a whole and that are changed often, and the designer asked for them as dropdowns on 23 Oct 2026 ("I feel having parameters is weird. What if they sat as drop downs").

/** What the layout lab (/proto/layouts) changes around the table; the product screens pass nothing. */
export interface ReportChrome {
  header?: "card" | "line";
  filterPanel?: ComponentProps<typeof DataReport<ErrorRow>>["filterPanel"];
}

export function DataValidationErrorReport({ chrome }: { chrome?: ReportChrome }) {
  const { runs } = useIngestionRuns();
  const router = useRouter();
  const roleHref = useRoleHref();
  const requested = useSearchParams().get("dataset");
  const [picked, setPicked] = useState<string | null>(requested);

  // The runs with errors, newest first. The chosen one is the one asked for, or else the newest.
  const errored = useMemo(() => runs.filter(hasErrors).sort((a, b) => b.at - a.at), [runs]);
  const run = errored.find((r) => r.id === picked) ?? errored[0] ?? null;
  const errors = useMemo(() => (run ? errorRowsFor(run) : []), [run]);
  const tiles = useMemo(() => (run ? errorTilesFor(run, errors) : []), [run, errors]);

  // A project is its code and its name, a dataset its id and its file, in one line each: the code and the id lead, and they are what tells one from the next. A cut has a strategy by what the text is: the project's name is cut
  // at a word, the dataset's file name in the middle, so that its version and extension stay ("flinders_bush...01.xlsx"); `splitFileName` says which end stays. (As a label with supporting text the dropdown cut the label first.)
  const projectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of errored) if (!seen.has(r.projectId)) seen.set(r.projectId, `${r.projectCode} \u00b7 ${r.projectTitle}`);
    return [...seen].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [errored]);
  const datasetOptions = useMemo(
    () =>
      errored
        .filter((r) => r.projectId === run?.projectId)
        .map((r) => {
          const { head, tail } = splitFileName(r.fileName);
          return { id: r.id, label: `${r.id} \u00b7 ${head}`, labelEnd: tail };
        }),
    [errored, run?.projectId],
  );

  // The rules and concepts a dataset of this kind can have errors on: the same list for every dataset of a kind, so a filter
  // that is on stays meaningful when another dataset is chosen.
  const rules = useMemo(() => rulesFor(run), [run]);
  const attributes: Attribute<ErrorRow>[] = useMemo(
    () => [
      { id: "category", kind: "options", label: "Category", options: ERROR_CATEGORIES.map((c) => ({ id: c, label: c })), get: (r) => r.category },
      { id: "severity", kind: "options", label: "Severity", options: ERROR_SEVERITIES.map((s) => ({ id: s, label: s })), get: (r) => r.severity },
      { id: "rule", kind: "options", label: "Rule", options: optionsFromValues(rules.map((r) => r.id)), get: (r) => r.rule },
      { id: "concept", kind: "options", label: "Concept", options: optionsFromValues(rules.map((r) => r.concept)), get: (r) => r.concept },
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

  // The open list is as wide as its longest row (never narrower than the dropdown, never wider than 40rem or the window), so a row is shown whole before any of it is cut.
  const LIST_FITS_ITS_ROWS = "w-max min-w-(--trigger-width) max-w-[min(40rem,calc(100vw-2rem))]";
  // 256px at the least (the row still fits one line at 1280px), growing into the room a wide window leaves, up to 384px, so the name after the code is cut as little as the window allows.
  const projectSelect = (
    <Select
      size="sm"
      label="Project"
      placeholder="Select project"
      truncateAtWords
      popoverClassName={LIST_FITS_ITS_ROWS}
      items={projectOptions}
      selectedKey={run.projectId}
      className="w-64 max-w-[min(24rem,100%)] shrink-0 grow"
      onSelectionChange={(key) => {
        const next = errored.find((r) => r.projectId === key);
        if (next && next.id !== run.id) setPicked(next.id);
      }}
    >
      {(item) => <Select.Item id={item.id} label={item.label} />}
    </Select>
  );
  const datasetSelect = (
    <Select
      size="sm"
      label="Dataset"
      placeholder="Select dataset"
      popoverClassName={LIST_FITS_ITS_ROWS}
      items={datasetOptions}
      selectedKey={run.id}
      className="w-64 max-w-[min(24rem,100%)] shrink-0 grow"
      onSelectionChange={(key) => {
        if (key && key !== run.id) setPicked(String(key));
      }}
    >
      {(item) => <Select.Item id={item.id} label={item.label} labelEnd={item.labelEnd} />}
    </Select>
  );

  return (
    <>
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
        // The errors by kind (business rule, coordinate, metadata) are facts of the card, after the totals they add up to. They were a row of tiles under the card (CONTRACTS 4.6 item 4); the designer moved
        // them into it on 23 Oct 2026 ("move business rule failure, coordinate mismatch and metadata mismatch into the gradient card"), an override of that clause for this report only.
        ...tiles.slice(3).map((t) => ({ label: t.label, value: t.value.toLocaleString("en-AU") })),
      ]}
      icon={AlertTriangle}
      rows={errors}
      rowId={(r) => r.recordId}
      columns={columns}
      attributes={attributes}
      searchText={(r) => [r.recordId, r.projectCode, r.scientificName, r.commonName, r.category, r.rule, r.concept, r.description]}
      searchLabel="Search the errors"
      searchPlaceholder="Search by record, species, rule or concept"
      tableLabel={`Validation errors in ${run.fileName}`}
      noun="errors"
      emptyDescription="Errors found in this dataset appear here."
      initialSort={{ column: "record", direction: "ascending" }}
      // The two choices the report is about, a project and then one of its datasets, are dropdowns on the toolbar, to the right of Filter (designer, 23 Oct 2026: "I feel having parameters is weird. What if they sat as
      // drop downs instead"). They are two linked choices that are changed often and say what the whole page is about, so what each is set to is on the toolbar and not behind a button and in chips.
      parameters={{
        inline: true,
        fields: (
          <>
            {projectSelect}
            {datasetSelect}
          </>
        ),
        summary: [],
      }}
      exportName={`${run.id}-errors`}
      // Map visualise is the card's one next step, the white button where the project page has Upload dataset; the downloads
      // are in the menu after the exports. The source dataset has nothing to download in the preview (uploaded files are never
      // read), so it is disabled rather than promised.
      extraActions={{
        primary: { id: "map-visualise", label: "Map visualise", icon: Map01, onPress: () => router.push(roleHref(`/pages/observations?dataset=${encodeURIComponent(run.id)}`)) },
        menu: [
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
        ],
      }}
      />
    </>
  );
}

"use client";

// The project's Datasets page (30 Sept 2026): a report of every dataset uploaded to this project,
// opened from the Datasets box in "Project at a glance" (`?view=datasets`, same route so the session's
// edits stay, like the flagged concepts review). It follows the collection pattern: a section header
// with the count and Upload dataset, then search and a table whose rows open the dataset
// (`&dataset=<id>`), laid out like every record page (back link, identity card, tabs).
//
// The upload in progress sits above the table: the same progress, stages and problems as the
// project card's upload chip (IngestionDetail), so pre-flight validation (checking against the data
// model) can be followed here as well. Nothing reads a real file: ingestion is simulated
// (dataset-upload/ingestion.ts).
//
// Datasets come from two places: the ones uploaded in this browser (the dataset store), and
// SAMPLE_DATASETS below, three earlier uploads so the report has a history to show.

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Database01, RefreshCcw01, ClipboardCheck, File06, ClockRewind } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { UploadDatasetButton } from "@/app/pages/_shared/upload-dataset-button";
import { HeroMeta, RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import { formatShortDate } from "@/app/pages/_shared/dla/dla-data";
import {
  classificationLabel,
  datasetStatusFor,
  datasetStatusMeta,
  firstNationsLabel,
  formatFileSize,
  licenceLabel,
  type Dataset,
  type DatasetStatus,
} from "@/app/pages/_shared/dataset-upload/dataset-data";
import { restartIngestion, useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { TOTAL_MS, rowsFromSize, viewAt, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { IngestionDetail, isSystemFault, placedRows } from "@/app/pages/_shared/dataset-upload/ingestion-views";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";
import { useEditStore } from "./edit-store";

// The project the sample uploads belong to. Every other project shows only its own uploads.
const SAMPLE_PROJECT = { id: "adelaide-hills", code: "BD-5039" };

// SAMPLE: three earlier uploads to BD-5039, one per way a run can end (added, partly added, not
// ingested), uploaded by the placeholder people. Illustrative, like the project records themselves.
const SAMPLE_DATASETS: Dataset[] = [
  {
    id: "DS-2025-00012",
    projectId: SAMPLE_PROJECT.id,
    projectCode: SAMPLE_PROJECT.code,
    files: [{ name: "AHL_spring_survey_2025.xlsx", size: 421_888 }],
    licence: "ccby",
    classification: "official",
    firstNations: "none",
    status: "approved",
    uploadedBy: "Phoenix Baker",
    uploadedAt: "2025-10-18",
    history: [
      { status: "file_uploaded", at: "2025-10-18", by: "Phoenix Baker" },
      { status: "validation_in_progress", at: "2025-10-18", by: "System" },
      { status: "processing", at: "2025-10-18", by: "System" },
      { status: "under_review", at: "2025-10-18", by: "System" },
      { status: "approved", at: "2025-10-24", by: "Maya Dewitt" },
    ],
    ingestion: { outcome: "success", startedAt: 0 },
  },
  {
    id: "DS-2025-00018",
    projectId: SAMPLE_PROJECT.id,
    projectCode: SAMPLE_PROJECT.code,
    files: [{ name: "AHL_bandicoot_trapping_Nov2025.xlsx", size: 98_304 }],
    licence: "ccby",
    classification: "official_sensitive",
    firstNations: "none",
    status: "under_review",
    uploadedBy: "Lana Steiner",
    uploadedAt: "2025-11-22",
    history: [
      { status: "file_uploaded", at: "2025-11-22", by: "Lana Steiner" },
      { status: "validation_in_progress", at: "2025-11-22", by: "System" },
      { status: "processing", at: "2025-11-22", by: "System" },
      { status: "under_review", at: "2025-11-22", by: "System" },
    ],
    ingestion: { outcome: "partial", startedAt: 0 },
  },
  {
    id: "DS-2026-00003",
    projectId: SAMPLE_PROJECT.id,
    projectCode: SAMPLE_PROJECT.code,
    files: [{ name: "AHL_summer_vegetation_2026.xlsx", size: 161_792 }],
    licence: "cc0",
    classification: "official",
    firstNations: "none",
    status: "validation_failed",
    uploadedBy: "Olivia Wyatt",
    uploadedAt: "2026-02-09",
    history: [
      { status: "file_uploaded", at: "2026-02-09", by: "Olivia Wyatt" },
      { status: "validation_in_progress", at: "2026-02-09", by: "System" },
      { status: "validation_failed", at: "2026-02-09", by: "System" },
    ],
    ingestion: { outcome: "fail-model", startedAt: 0 },
  },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const SAMPLE_IDS = new Set(SAMPLE_DATASETS.map((d) => d.id));

/** A dataset with its run worked out: where it is now, and its workflow status. */
export interface DatasetRow {
  dataset: Dataset;
  view: RunView | null;
  status: DatasetStatus;
}

function rowFor(dataset: Dataset, now: number): DatasetRow {
  if (!dataset.ingestion) return { dataset, view: null, status: dataset.status };
  const subject = {
    fileName: dataset.files[0]?.name ?? dataset.id,
    rows: rowsFromSize(dataset.files.reduce((n, f) => n + f.size, 0)),
    projectCode: dataset.projectCode,
  };
  // A sample finished long ago; an upload from this browser is where its clock says it is.
  const sample = SAMPLE_IDS.has(dataset.id);
  const elapsed = sample ? TOTAL_MS * 2 : Math.max(0, now - dataset.ingestion.startedAt);
  const view = viewAt(dataset.ingestion.outcome, elapsed, subject);
  return { dataset, view, status: sample ? dataset.status : datasetStatusFor(view) };
}

/** Every dataset on this project, newest first, ticking while an upload runs. */
export function useProjectDatasets(projectId: string): DatasetRow[] {
  const stored = useDatasets();
  const [now, setNow] = useState(() => Date.now());
  const all = useMemo(
    () =>
      [...SAMPLE_DATASETS, ...stored].filter((d) => d.projectId === projectId).sort((a, b) =>
        a.uploadedAt === b.uploadedAt ? b.id.localeCompare(a.id) : b.uploadedAt.localeCompare(a.uploadedAt),
      ),
    [stored, projectId],
  );
  const rows = all.map((d) => rowFor(d, now));
  const running = rows.some((r) => r.view && !r.view.done);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  return rows;
}

/** The upload still in progress, or the latest one whose problems are not yet dealt with. */
function currentUpload(rows: DatasetRow[]): DatasetRow | null {
  const latest = rows.find((r) => !SAMPLE_IDS.has(r.dataset.id) && r.view);
  if (!latest?.view) return null;
  return !latest.view.done || latest.view.failed || latest.view.partial ? latest : null;
}

function StatusBadge({ status }: { status: DatasetStatus }) {
  const meta = datasetStatusMeta[status];
  return (
    <Badge size="sm" color={meta.badgeColor}>
      {meta.label}
    </Badge>
  );
}

function recordsAdded(view: RunView | null): string {
  if (!view) return "Not provided";
  if (!view.done) return "In progress";
  return view.failed ? "None" : String(placedRows(view));
}

function retry(id: string) {
  // A fault on our side is transient: the second attempt succeeds.
  restartIngestion(id, "success");
}

// ── The list ──

export function DatasetsScreen({
  datasetId,
  projectHref,
  datasetsHref,
  datasetHref,
}: {
  datasetId: string | null;
  projectHref: string;
  datasetsHref: string;
  datasetHref: (id: string) => string;
}) {
  const { meta } = useEditStore();
  const rows = useProjectDatasets(meta.id);
  if (datasetId) {
    const row = rows.find((r) => r.dataset.id === datasetId);
    return <DatasetDetail row={row ?? null} datasetId={datasetId} backHref={datasetsHref} />;
  }
  return <DatasetsList rows={rows} projectHref={projectHref} datasetHref={datasetHref} />;
}

function DatasetsList({ rows, projectHref, datasetHref }: { rows: DatasetRow[]; projectHref: string; datasetHref: (id: string) => string }) {
  const { meta } = useEditStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const current = currentUpload(rows);

  const query = search.trim().toLowerCase();
  const matches = query
    ? rows.filter((r) => [r.dataset.id, r.dataset.uploadedBy, ...r.dataset.files.map((f) => f.name)].some((v) => v.toLowerCase().includes(query)))
    : rows;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordBackLink href={projectHref}>Back to project</RecordBackLink>
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Datasets</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" />
            </div>
            <SectionHeader.Subheading>Every dataset uploaded to {meta.code}, the checks it went through and where it is now.</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <UploadDatasetButton projectId={meta.id} color="primary" size="md" />
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {/* The area scrolls when the card above and the table together are taller than the window; the table keeps a floor of its own. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 [scrollbar-gutter:stable]">
        {current?.view && (
          <section aria-label="Current upload" className="flex shrink-0 flex-col gap-4 rounded-xl border border-secondary bg-primary p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-primary">{current.view.done ? "Latest upload" : "Uploading now"}</h3>
                <p className="truncate text-sm text-tertiary" title={current.view.subject.fileName}>
                  {current.dataset.id} · {current.view.subject.fileName} · {current.view.subject.rows} rows
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={current.status} />
                <Button color="link-color" size="sm" href={datasetHref(current.dataset.id)}>
                  View dataset
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <IngestionDetail split view={current.view} projectId={meta.id} datasetId={current.dataset.id} onRetry={() => retry(current.dataset.id)} />
            </div>
          </section>
        )}

        <ToolbarSearch
          label="Search datasets"
          placeholder="Search ID, file or uploader"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        {matches.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">No datasets match your search.</p>
        ) : (
          <TableCard.Root className="flex min-h-[24rem] flex-1 flex-col">
            <Table layout="fixed" className="min-w-[1000px]" bodyScrollable aria-label="Datasets">
              <Table.Header sticky>
                <Table.Head id="id" label="Dataset" isRowHeader className="w-[14%]" />
                <Table.Head id="file" label="File" className="w-[28%]" />
                <Table.Head id="by" label="Uploaded by" className="w-[16%]" />
                <Table.Head id="at" label="Uploaded" className="w-[12%]" />
                <Table.Head id="added" label="Records added" className="w-[14%]" />
                <Table.Head id="status" label="Status" className="w-[16%]" />
              </Table.Header>
              <Table.Body items={paged.map((r) => ({ ...r, id: r.dataset.id }))}>
                {(r) => (
                  <Table.Row id={r.id} href={datasetHref(r.id)} textValue={r.id} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{r.id}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">
                        {r.dataset.files[0]?.name ?? "Not provided"}
                        {r.dataset.files.length > 1 && <span className="text-tertiary"> and {r.dataset.files.length - 1} more</span>}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{r.dataset.uploadedBy}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(r.dataset.uploadedAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary tabular-nums">{recordsAdded(r.view)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge status={r.status} />
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <TableCard.PaginationNumbered
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              totalCount={matches.length}
            />
          </TableCard.Root>
        )}
      </div>
    </div>
  );
}

// ── One dataset ──

function DatasetDetail({ row, datasetId, backHref }: { row: DatasetRow | null; datasetId: string; backHref: string }) {
  const [tab, setTab] = useState<string | number>("validation");
  if (!row) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <RecordBackLink href={backHref}>Back to datasets</RecordBackLink>
        <div className="flex flex-col gap-1 p-6">
          <h1 className="text-lg font-semibold text-primary">Dataset not found</h1>
          <p className="text-sm text-tertiary">{datasetId} isn&apos;t a dataset on this project.</p>
        </div>
      </div>
    );
  }
  const { dataset: d, view, status } = row;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordBackLink href={backHref}>Back to datasets</RecordBackLink>
      <RecordHero eyebrow="Dataset" title={d.id}>
        <HeroMeta label="Project">{d.projectCode}</HeroMeta>
        <HeroMeta label="Uploaded by">{d.uploadedBy}</HeroMeta>
        <HeroMeta label="Uploaded">{formatShortDate(d.uploadedAt)}</HeroMeta>
        <HeroMeta label="Status">
          <StatusBadge status={status} />
        </HeroMeta>
      </RecordHero>

      <Tabs selectedKey={tab} onSelectionChange={setTab}>
        <div className="px-6 pt-4">
          <TabList aria-label="Dataset sections" type="underline" size="md">
            <Tab id="validation" label="Validation" icon={ClipboardCheck} />
            <Tab id="details" label="Details" icon={File06} />
            <Tab id="history" label="History" icon={ClockRewind} />
          </TabList>
        </div>

        <TabPanel id="validation" className="p-6">
          {/* The same card as the Datasets list's latest upload: full width, the run beside what went wrong. The dataset's one status is the
              hero's; the card does not say it again in a second vocabulary ("Not ingested" under "Validation failed"). */}
          <section aria-label="Validation" className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-5">
            <h3 className="text-sm font-semibold text-primary">Pre-flight validation and ingestion</h3>
            {view ? (
              <IngestionDetail split view={view} projectId={d.projectId} datasetId={d.id} onRetry={() => retry(d.id)} />
            ) : (
              <p className="text-sm text-quaternary">Not provided</p>
            )}
          </section>
        </TabPanel>

        <TabPanel id="details" className="p-6">
          <div className="max-w-3xl rounded-lg border border-secondary">
            <RecordRow label={d.files.length > 1 ? "Files" : "File"}>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {d.files.map((f) => (
                  <li key={f.name}>
                    {f.name} <span className="text-tertiary">· {formatFileSize(f.size)}</span>
                  </li>
                ))}
              </ul>
            </RecordRow>
            <RecordRow label="Rows">{view ? view.subject.rows : "Not provided"}</RecordRow>
            <RecordRow label="Records added">{recordsAdded(view)}</RecordRow>
            <RecordRow label="Data licence">{licenceLabel(d.licence)}</RecordRow>
            <RecordRow label="Security classification">{classificationLabel(d.classification)}</RecordRow>
            <RecordRow label="First Nations consideration">{firstNationsLabel(d.firstNations)}</RecordRow>
            {d.iiaReference && <RecordRow label="IIA reference">{d.iiaReference}</RecordRow>}
          </div>
        </TabPanel>

        <TabPanel id="history" className="p-6">
          <AuditLog id={d.id} idLabel="Dataset ID" items={milestones(d.history, { label: "Approved", is: (e) => e.status === "approved" || e.status === "auto_approved" })} changeCount={d.history.length}>
            <div className="max-w-3xl rounded-lg border border-secondary">
              {[...d.history].reverse().map((e, i) => (
                <RecordRow key={`${e.status}-${e.at}-${i}`} label={formatShortDate(e.at)}>
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={e.status} />
                    <span className="text-tertiary">{e.by}</span>
                  </span>
                </RecordRow>
              ))}
            </div>
          </AuditLog>
        </TabPanel>
      </Tabs>
    </div>
  );
}


// ── The Datasets card (Project at a glance, Option 3) ──
// Its own card above the records card, since datasets are the feed and not part of the records. The
// header names it with its count and holds its actions (View all, Upload dataset); one row under it is
// the last upload: the file and, in a few words, what is happening with it (live while it runs),
// opening that dataset. The full journey (stages, problems, what to fix) is on the dataset's page.

type Snapshot = { tone: "brand" | "success" | "warning" | "error" | "gray"; state: string; running: boolean };

function snapshotOf({ view, status }: DatasetRow): Snapshot {
  if (!view) return { tone: "gray", state: "Waiting for pre-flight validation", running: false };
  if (!view.done) {
    const validating = view.stageIndex === 0;
    const pct = validating ? view.stagePercents[0] : Math.round(((view.stagePercents[1] + view.stagePercents[2]) / 200) * 100);
    return { tone: "brand", state: `${validating ? "Pre-flight validation" : "Adding records"} · ${pct}%`, running: true };
  }
  if (view.failed) {
    if (isSystemFault(view)) return { tone: "error", state: "Not added · something went wrong on our side", running: false };
    const problems = plural(view.reasons.length, "problem", "problems");
    return { tone: "error", state: view.failedStage === 0 ? `Failed pre-flight validation · ${problems}` : `Not added · ${problems} with the rows`, running: false };
  }
  const added = placedRows(view);
  if (view.partial) return { tone: "warning", state: `${added} records added · ${view.unmapped} rows not placed`, running: false };
  const approved = status === "approved" || status === "auto_approved";
  return { tone: approved ? "success" : "brand", state: `${added} records added · ${approved ? "approved" : "in review"}`, running: false };
}

export function DatasetsCard({ onOpenDataset, onOpenDatasets }: { onOpenDataset: (id: string) => void; onOpenDatasets: () => void }) {
  const { meta } = useEditStore();
  const rows = useProjectDatasets(meta.id);
  const last = rows[0];
  const snap = last ? snapshotOf(last) : null;
  return (
    <section aria-label="Datasets" className="overflow-hidden rounded-xl border border-secondary bg-primary">
      {/* The card's header: what it is, how many, and its two actions (the project-tab card heading). */}
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
          Datasets
          <CountBadge count={rows.length} color="brand" />
        </h3>
        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <Button color="link-color" size="sm" onClick={onOpenDatasets}>
              View all
            </Button>
          )}
          <UploadDatasetButton projectId={meta.id} />
        </div>
      </div>
      {/* The last upload: one row, the same row as the records card's, opening that dataset. */}
      {last && snap ? (
        <button
          type="button"
          onClick={() => onOpenDataset(last.dataset.id)}
          title={`${last.dataset.files[0]?.name ?? last.dataset.id}: ${snap.state}`}
          className="group/row flex w-full items-center gap-3 border-t border-secondary px-5 py-3 text-left text-sm outline-focus-ring transition-colors hover:bg-primary_hover focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
          <FeaturedIcon icon={Database01} color={snap.tone} theme="modern" size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-tertiary">Last upload · {formatShortDate(last.dataset.uploadedAt)}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              {snap.running && <RefreshCcw01 aria-hidden className="size-3.5 shrink-0 text-fg-brand-primary motion-safe:animate-spin" />}
              <span className="truncate font-semibold text-primary">{last.dataset.files[0]?.name ?? last.dataset.id}</span>
              <span className={cx("shrink-0 tabular-nums", snap.tone === "error" ? "text-error-primary" : snap.tone === "warning" ? "text-fg-warning-primary" : "text-tertiary")}>{snap.state}</span>
            </span>
          </span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-quaternary transition-transform group-hover/row:translate-x-0.5" />
        </button>
      ) : (
        <p className="border-t border-secondary px-5 py-3 text-sm text-tertiary">No datasets yet. Uploading one adds its records to this project.</p>
      )}
    </section>
  );
}

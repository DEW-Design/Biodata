"use client";

// The project's Datasets: a tab of the project page (26 Oct 2026, the designer: "can we bring in dataset as a tab? A list of all the associated
// datasets?"), a table of every dataset uploaded to this project, and each dataset's own page (`?view=datasets&dataset=<id>`, same route so the session's
// edits stay, like the flagged concepts review), laid out like every record page (back link, identity card with its next step, tabs: Overview, the
// dataset's own facts, then Validation and Audit Log; 30 Oct 2026). It was a page of its own
// (`?view=datasets`, 30 Sept 2026) opened from a Datasets box in "Project at a glance", which the designer removed; the old address now opens the tab.
// The tab follows the collection pattern as the Artefacts tab does: search, then the table, whose rows open the dataset. It has no line of its own
// on what it holds (the tab's name says it; the designer, 30 Oct 2026: such lines read as generated).
// Uploading is the header's Upload menu, so the tab does not repeat it (one control per action, 3.12).
//
// A run is drawn in two places and not a third (4.3, never restate a fact in two treatments): the upload chip in the project's header, which is
// there on every tab while it runs and has its problems to deal with, and the dataset's own Validation tab, its permanent record. The tab
// is the list, so the dataset that is running is its row, with its status; it has no card of its own for the run (the designer, 30 Oct 2026:
// "Why double up on the same info?"). Nothing reads a real file here: ingestion is simulated (dataset-upload/ingestion.ts).
//
// Datasets come from two places: the ones uploaded in this browser (the dataset store), and
// SAMPLE_DATASETS below, three earlier uploads so the report has a history to show.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart01, CheckCircle, ClipboardCheck, ClockRewind, Grid01, RefreshCcw01, SearchLg, Upload01, UploadCloud02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Table, TableCard } from "@/components/application/table/table";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { UploadDatasetButton } from "@/app/pages/_shared/upload-dataset-button";
import { HeroMeta, RecordBackLink, RecordHero, RecordRow } from "@/app/pages/_shared/record-hero";
import { RecordActionBar, type RecordAction } from "@/app/pages/_shared/record-action-bar";
import { formatShortDate } from "@/app/pages/_shared/dla/dla-data";
import {
  classificationLabel,
  datasetStatusFor,
  datasetStatusMeta,
  isProcessingStatus,
  firstNationsLabel,
  formatFileSize,
  licenceLabel,
  type Dataset,
  type DatasetStatus,
} from "@/app/pages/_shared/dataset-upload/dataset-data";
import { approveDataset, restartIngestion, useDatasetApprovals, useDatasets } from "@/app/pages/_shared/dataset-upload/dataset-store";
import { TOTAL_MS, rowsFromSize, viewAt, type RunView } from "@/app/pages/_shared/dataset-upload/ingestion";
import { IngestionDetail, isSystemFault, placedRows } from "@/app/pages/_shared/dataset-upload/ingestion-views";
import { AuditLog, milestones } from "@/app/pages/_shared/audit-log";
import { AuditFeed } from "@/app/pages/_shared/audit-feed";
import { BreadcrumbSwitcher } from "@/app/pages/_shared/breadcrumb-switcher";
import { useFeatureAccess } from "@/lib/use-feature-access";
import { uploadPath } from "@/app/pages/_shared/project-routes";
import { useRoleHref } from "@/lib/use-role-href";
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

/** A dataset a BioData Admin approved reads as approved, with the approval in its history, whatever its run says. */
function withApproval(row: DatasetRow, approval: { at: string; by: string } | undefined): DatasetRow {
  if (!approval) return row;
  const history = [...row.dataset.history, { status: "approved" as const, at: approval.at, by: approval.by }];
  return { ...row, status: "approved", dataset: { ...row.dataset, status: "approved", history } };
}

/** A project's datasets, newest first: the sample uploads and the ones uploaded in this browser. */
function datasetsOf(stored: Dataset[], projectId: string): Dataset[] {
  return [...SAMPLE_DATASETS, ...stored].filter((d) => d.projectId === projectId).sort((a, b) =>
    a.uploadedAt === b.uploadedAt ? b.id.localeCompare(a.id) : b.uploadedAt.localeCompare(a.uploadedAt),
  );
}

/** Every dataset on this project, newest first, ticking while an upload runs. */
export function useProjectDatasets(projectId: string): DatasetRow[] {
  const stored = useDatasets();
  const approvals = useDatasetApprovals();
  const [now, setNow] = useState(() => Date.now());
  const all = useMemo(() => datasetsOf(stored, projectId), [stored, projectId]);
  const rows = all.map((d) => withApproval(rowFor(d, now), approvals[d.id]));
  const running = rows.some((r) => r.view && !r.view.done);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  return rows;
}

function StatusBadge({ status }: { status: DatasetStatus }) {
  const meta = datasetStatusMeta[status];
  return (
    <Badge size="sm" color={meta.badgeColor} isLoading={isProcessingStatus(status)}>
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

// ── The tab ──

/** How many datasets this project has, for the tab's count: no clock, so the page does not redraw while an upload runs. */
export function useProjectDatasetCount(projectId: string): number {
  const stored = useDatasets();
  return useMemo(() => datasetsOf(stored, projectId).length, [stored, projectId]);
}

/** "Datasets" in the breadcrumb of a dataset's page: a searchable switcher over this project's datasets (A-Z by ID, the file beside it, the
 *  same set the Datasets tab lists), the current one ticked and a "View all datasets" bar to the tab, as `ProjectSwitcher` is for the project
 *  (4.6 item 5). Picking a dataset opens its page. No clock, so the header does not redraw while an upload runs. */
export function DatasetSwitcher({ projectId, currentId, datasetHref, datasetsHref }: { projectId: string; currentId?: string; datasetHref: (id: string) => string; datasetsHref: string }) {
  const router = useRouter();
  const stored = useDatasets();
  const items = useMemo(
    () =>
      datasetsOf(stored, projectId)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((d) => ({ id: d.id, label: d.id, addon: d.files[0]?.name })),
    [stored, projectId],
  );
  return (
    <BreadcrumbSwitcher
      label="Datasets"
      ariaLabel="Switch dataset"
      placeholder="Search datasets"
      items={items}
      currentId={currentId}
      onSelect={(id) => router.push(datasetHref(id))}
      viewAllLabel="View all datasets"
      onViewAll={() => router.push(datasetsHref)}
    />
  );
}

export function DatasetsTab({ datasetHref }: { datasetHref: (id: string) => string }) {
  const { meta } = useEditStore();
  const rows = useProjectDatasets(meta.id);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const query = search.trim().toLowerCase();
  const matches = query
    ? rows.filter((r) => [r.dataset.id, r.dataset.uploadedBy, ...r.dataset.files.map((f) => f.name)].some((v) => v.toLowerCase().includes(query)))
    : rows;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        // The same card and the same way forward as the Records tab's empty state: nothing has been uploaded, and uploading is what fills this tab.
        <div className="flex min-h-[560px] flex-col rounded-xl border border-secondary bg-primary">
          <ListEmptyState icon={UploadCloud02} title="No datasets yet" description="Upload a dataset and it appears here.">
            <UploadDatasetButton projectId={meta.id} color="primary" size="md" />
          </ListEmptyState>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ToolbarSearch
              label="Search datasets"
              placeholder="Search ID, file or uploader"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
          {matches.length === 0 ? (
            <div className="flex flex-col rounded-xl border border-secondary bg-primary">
              <ListEmptyState
                icon={SearchLg}
                title="No datasets match"
                description="No dataset fits this search."
                action={{
                  label: "Show all datasets",
                  onPress: () => {
                    setSearch("");
                    setPage(1);
                  },
                }}
              />
            </div>
          ) : (
            <TableCard.Root className="flex max-h-[calc(100dvh-16rem)] min-h-48 flex-col">
              <Table layout="fixed" className="min-w-[1200px]" bodyScrollable aria-label="Datasets">
                <Table.Header sticky>
                  <Table.Head id="id" label="Dataset" isRowHeader className="w-[12%]" />
                  <Table.Head id="file" label="File" className="w-[24%]" />
                  <Table.Head id="by" label="Uploaded by" className="w-[13%]" />
                  <Table.Head id="at" label="Uploaded" className="w-[11%]" />
                  <Table.Head id="added" label="Records added" className="w-[11%]" />
                  <Table.Head id="status" label="Status" className="w-[29%]" />
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
        </>
      )}
    </div>
  );
}

/** One dataset's own page, opened from the tab's rows (`?view=datasets&dataset=<id>`); its Back link returns to the tab. */
export function DatasetScreen({ datasetId, datasetsHref, recordsHref }: { datasetId: string; datasetsHref: string; recordsHref: string }) {
  const { meta } = useEditStore();
  const rows = useProjectDatasets(meta.id);
  const row = rows.find((r) => r.dataset.id === datasetId);
  return <DatasetDetail row={row ?? null} datasetId={datasetId} backHref={datasetsHref} recordsHref={recordsHref} />;
}

// ── One dataset ──

function DatasetDetail({ row, datasetId, backHref, recordsHref }: { row: DatasetRow | null; datasetId: string; backHref: string; recordsHref: string }) {
  const [tab, setTab] = useState<string | number>("overview");
  const router = useRouter();
  const roleHref = useRoleHref();
  const canReview = useFeatureAccess("datasetReview");
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

  // The next step sits in the card, as on every record page (4.6 item 2), and not inside the Validation tab: a reviewer approves a dataset
  // that is under review, and the uploader fixes one that did not go in (the same step the run's own problems used to offer).
  const problem = !!view && view.done && (view.failed || view.partial);
  const fix: RecordAction | undefined = !view || !problem
    ? undefined
    : isSystemFault(view)
      ? { id: "retry", label: "Try again", icon: RefreshCcw01, onPress: () => retry(d.id) }
      : { id: "upload", label: "Upload a corrected file", icon: Upload01, onPress: () => router.push(roleHref(uploadPath(d.projectId))) };
  const approve: RecordAction | undefined = canReview && status === "under_review"
    ? { id: "approve", label: "Approve", icon: CheckCircle, onPress: () => approveDataset(d.id) }
    : undefined;
  const reports: RecordAction | undefined = problem
    ? { id: "reports", label: "View in Reports", icon: BarChart01, onPress: () => router.push(roleHref(`/pages/reports/data-ingestion?q=${d.id}`)) }
    : undefined;
  const menu = [approve ? fix : undefined, reports].filter((a): a is RecordAction => !!a);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RecordBackLink href={backHref}>Back to datasets</RecordBackLink>
      <RecordHero eyebrow="Dataset" title={d.id} actions={<RecordActionBar onDark primary={approve ?? fix} menu={menu} />}>
        <HeroMeta label="File">{d.files.length === 0 ? "Not provided" : d.files.length === 1 ? d.files[0].name : `${d.files.length} files`}</HeroMeta>
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
            <Tab id="overview" label="Overview" icon={Grid01} />
            <Tab id="validation" label="Validation" icon={ClipboardCheck} />
            <Tab id="history" label="Audit Log" icon={ClockRewind} />
          </TabList>
        </div>

        {/* The dataset's own facts: what it holds and what was agreed when it was uploaded. They are the dataset's, not the project's (the
            designer, 30 Oct 2026: "Dataset has its own metadata"); what the card above already says (who, when, status) is not said again. */}
        <TabPanel id="overview" className="p-6">
          <div className="rounded-lg border border-secondary">
            <RecordRow label={d.files.length > 1 ? "Files" : "File"}>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {d.files.map((f) => (
                  <li key={f.name}>
                    {f.name}<span className="text-tertiary">, {formatFileSize(f.size)}</span>
                  </li>
                ))}
              </ul>
            </RecordRow>
            <RecordRow label="Rows">{view ? view.subject.rows : "Not provided"}</RecordRow>
            <RecordRow label="Records added">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {recordsAdded(view)}
                {view?.done && !view.failed && (
                  <Button color="link-color" size="sm" href={recordsHref}>
                    Open project records
                  </Button>
                )}
              </span>
            </RecordRow>
            <RecordRow label="Data licence">{licenceLabel(d.licence)}</RecordRow>
            <RecordRow label="Security classification">{classificationLabel(d.classification)}</RecordRow>
            <RecordRow label="First Nations consideration">{firstNationsLabel(d.firstNations)}</RecordRow>
            {d.iiaReference && <RecordRow label="IIA reference">{d.iiaReference}</RecordRow>}
          </div>
        </TabPanel>

        <TabPanel id="validation" className="p-6">
          {/* The same card as the Datasets list's latest upload: full width, the run beside what went wrong. The dataset's one status is the
              hero's; the card does not say it again in a second vocabulary ("Not ingested" under "Validation failed"), and the next step
              is the hero's, so the card does not offer it a second time. */}
          <section aria-label="Validation" className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-5">
            <h3 className="text-sm font-semibold text-primary">Pre-flight validation and ingestion</h3>
            {view ? (
              <IngestionDetail split actions={false} view={view} projectId={d.projectId} datasetId={d.id} onRetry={() => retry(d.id)} />
            ) : (
              <p className="text-sm text-quaternary">Not provided</p>
            )}
          </section>
        </TabPanel>

        <TabPanel id="history" className="p-6">
          <AuditLog id={d.id} idLabel="Dataset ID" items={milestones(d.history, { label: "Approved", is: (e) => e.status === "approved" || e.status === "auto_approved" })} changeCount={d.history.length}>
            <AuditFeed events={d.history} statusMeta={datasetStatusMeta} noun="dataset" />
          </AuditLog>
        </TabPanel>
      </Tabs>
    </div>
  );
}

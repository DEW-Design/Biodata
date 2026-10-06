"use client";

import { useMemo, useState } from "react";
import { BarChart01, Trash01 } from "@untitledui/icons";
import type { SortDescriptor } from "react-aria-components";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { CountBadge } from "@/components/base/badges/badges";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { toast } from "@/components/application/toast/toast";
import { sortRows } from "@/app/pages/_shared/agreement-scope";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { useCreateReportDialog } from "@/app/pages/_shared/reports/create-report-modal";
import { deleteGeneratedReport, useGeneratedReports, type GeneratedReport } from "@/app/pages/_shared/reports/generated-reports-store";
import { formatDateTime } from "@/app/pages/_shared/reports/ingestion-report-data";
import { reportBundlesFor } from "@/app/pages/_shared/reports/report-records";
import { ALL_PROJECTS } from "@/app/pages/_shared/reports/report-scope-select";
import { reportsFor } from "@/app/pages/_shared/reports/reports-data";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";

// My reports (/pages/reports?scope=mine): the reports this person generated with Create a report, newest first. A list like
// the others (4.2): section header, then the table in a card with the numbered footer, each row a link that opens the report
// (with the project it was made for, if it has one), and a "..." menu to open it or delete it from the list. Deleting a generated
// report removes the entry, never the report itself. It lists only reports the role is still offered.
type Row = GeneratedReport & { title: string; path: string; project: string };

export function MyReports() {
  const role = useUserRole();
  const roleHref = useRoleHref();
  const openCreate = useCreateReportDialog();
  const runs = useGeneratedReports();
  const [sort, setSort] = useState<SortDescriptor>({ column: "generated", direction: "descending" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const rows: Row[] = useMemo(() => {
    const offered = new Map(reportsFor(role).map((r) => [r.id, r]));
    const projects = new Map(reportBundlesFor(role).map((b) => [b.project.id, b.project.name]));
    return runs.flatMap((run) => {
      const report = offered.get(run.reportId);
      if (!report) return [];
      return [{ ...run, title: report.title, path: report.path, project: !report.scoped ? "" : run.projectId === ALL_PROJECTS ? "All projects" : (projects.get(run.projectId) ?? "A project you can no longer report on") }];
    });
  }, [runs, role]);

  const sorted = useMemo(() => sortRows(rows, sort, { report: (r: Row) => r.title, project: (r: Row) => r.project, generated: (r: Row) => r.createdAt }), [rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hrefFor = (r: Row) => roleHref(r.project && r.projectId !== ALL_PROJECTS ? `${r.path}?project=${r.projectId}` : r.path);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 px-6 pt-6 pb-4">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>My reports</SectionHeader.Heading>
              <CountBadge count={rows.length} color="brand" className="min-w-5 w-auto px-1.5" />
            </div>
            <SectionHeader.Subheading>The reports you have generated. Each opens the report as it is now.</SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>
      {rows.length === 0 ? (
        <ListEmptyState icon={BarChart01} title="No reports generated yet" description="Choose a report and generate it, and it is kept here." action={{ label: "Create a report", onPress: () => openCreate(true) }} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-6">
          <TableCard.Root size="xs" className="flex min-h-48 flex-1 flex-col">
            <Table
              bodyScrollable
              layout="fixed"
              className="min-w-[700px]"
              aria-label="My reports"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="report" label="Report" isRowHeader allowsSorting className="w-[46%]" />
                <Table.Head id="project" label="Project" allowsSorting className="w-[26%]" />
                <Table.Head id="generated" label="Generated" allowsSorting className="w-[20%]" />
                <Table.Head id="actions" label="" className="w-[8%]" />
              </Table.Header>
              <Table.Body items={paged}>
                {(row) => (
                  <Table.Row id={row.id} href={hrefFor(row)} textValue={row.title} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <span className="text-sm font-medium text-primary group-hover:text-brand-700 group-hover:underline">{row.title}</span>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      <span className="text-sm text-secondary">{row.project}</span>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      <span className="text-sm text-secondary tabular-nums">{formatDateTime(row.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown.Root>
                        <Dropdown.DotsButton aria-label={`Actions for ${row.title}`} className="p-1" />
                        <Dropdown.Popover placement="bottom right">
                          <Dropdown.Menu
                            aria-label={`Actions for ${row.title}`}
                            onAction={() => {
                              deleteGeneratedReport(row.id);
                              toast.success("Removed from My reports", { description: row.title });
                            }}
                          >
                            <Dropdown.Item id="delete" label="Remove from My reports" icon={Trash01} />
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </Dropdown.Root>
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
              totalCount={sorted.length}
            />
          </TableCard.Root>
        </div>
      )}
    </div>
  );
}

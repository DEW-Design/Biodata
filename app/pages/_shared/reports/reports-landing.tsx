"use client";

import { useMemo, useState, type FC } from "react";
import type { SortDescriptor } from "react-aria-components";
import { LayoutGrid01, Star01, Table as TableIcon, Grid01, UploadCloud02, Microscope, Folder } from "@untitledui/icons";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Table, TableCard } from "@/components/application/table/table";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { segmentClass, segmentTrayClass } from "@/app/pages/project-detail/segmented";
import { sortRows } from "@/app/pages/_shared/agreement-scope";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ReportMenu, openedLabel } from "@/app/pages/_shared/reports/report-actions";
import { ReportCard } from "@/app/pages/_shared/reports/report-card";
import { REPORTS, REPORT_CATEGORIES, type ReportCategoryId, type ReportEntry } from "@/app/pages/_shared/reports/reports-data";
import { useReportPrefs } from "@/app/pages/_shared/reports/reports-store";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";

// /pages/reports: the reports, as cards or as a table (the same Cards / Table switch the project page's Species tab has),
// grouped into categories and with Favourites as a tab of its own. Each report has a star, a "..." menu of its actions
// (open, favourite, copy link) and when it was last opened. What a role sees inside a report is the report's own rule (the
// ingestion report shows a registered user their runs and BioData Admin all of them); the landing lists every report to
// every signed-in role.
type View = "cards" | "table";
type TabId = "all" | "favourites" | ReportCategoryId;

// One icon per category, on its tab (the report cards and rows name the category in a badge).
const CATEGORY_ICONS: Record<ReportCategoryId, FC<{ className?: string }>> = {
  uploads: UploadCloud02,
  specimens: Microscope,
  "project-data": Folder,
};
const categoryLabel = (id: ReportCategoryId) => REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function ReportsLanding() {
  const isAdmin = useUserRole() === "biodata-admin";
  const roleHref = useRoleHref();
  const { favourites, opened } = useReportPrefs();
  const [view, setView] = useState<View>("cards");
  const [tab, setTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortDescriptor>({ column: "report", direction: "ascending" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const inTab = useMemo(() => REPORTS.filter((r) => (tab === "all" ? true : tab === "favourites" ? favourites.includes(r.id) : r.category === tab)), [tab, favourites]);
  const rows = useMemo(
    () =>
      sortRows(inTab, sort, {
        report: (r: ReportEntry) => r.title,
        category: (r: ReportEntry) => categoryLabel(r.category),
        opened: (r: ReportEntry) => opened[r.id] ?? null,
      }),
    [inTab, sort, opened],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const empty = (
    <ListEmptyState
      icon={Star01}
      title="No favourite reports yet"
      description="Star a report to keep it here."
    />
  );

  const cards = (list: ReportEntry[]) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((report) => (
        <ReportCard key={report.id} report={report} isFavourite={favourites.includes(report.id)} openedAt={opened[report.id]} />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 px-6 pt-6 pb-4">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Reports</SectionHeader.Heading>
              <CountBadge count={REPORTS.length} color="brand" className="min-w-5 w-auto px-1.5" />
            </div>
            <SectionHeader.Subheading>{isAdmin ? "Reports across BioData SA." : "Reports on your uploads and the projects you contribute to."}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <ToggleButtonGroup
              aria-label="Reports view"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[view]}
              onSelectionChange={(keys) => {
                const next = Array.from(keys)[0];
                if (next === "cards" || next === "table") setView(next);
              }}
              className={segmentTrayClass}
            >
              <ToggleButton id="cards" className={segmentClass}>
                <LayoutGrid01 className="size-4" />
                Cards
              </ToggleButton>
              <ToggleButton id="table" className={segmentClass}>
                <TableIcon className="size-4" />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => {
          setTab(key as TabId);
          setPage(1);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 px-6 pt-4">
          <TabList type="underline" aria-label="Report categories">
            <Tab id="all" icon={Grid01}>
              All
            </Tab>
            <Tab id="favourites" icon={Star01}>
              Favourites
            </Tab>
            {REPORT_CATEGORIES.map((c) => (
              <Tab key={c.id} id={c.id} icon={CATEGORY_ICONS[c.id]}>
                {c.label}
              </Tab>
            ))}
          </TabList>
        </div>
        <TabPanel id={tab} className="flex min-h-0 flex-1 flex-col">
          {rows.length === 0 ? (
            empty
          ) : view === "cards" ? (
            <div className="flex flex-col gap-8 p-6">
              {tab === "all"
                ? REPORT_CATEGORIES.map((c) => (
                    <section key={c.id} aria-label={c.label} className="flex flex-col gap-3">
                      <h2 className="m-0 text-xs font-semibold tracking-wide text-tertiary uppercase">{c.label}</h2>
                      {cards(REPORTS.filter((r) => r.category === c.id))}
                    </section>
                  ))
                : cards(rows)}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col p-6">
              <TableCard.Root size="xs" className="flex min-h-48 flex-1 flex-col">
                <Table
                  bodyScrollable
                  layout="fixed"
                  className="min-w-[700px]"
                  aria-label="Reports"
                  sortDescriptor={sort}
                  onSortChange={(next) => {
                    setSort(next);
                    setPage(1);
                  }}
                >
                  <Table.Header sticky>
                    <Table.Head id="report" label="Report" isRowHeader allowsSorting className="w-[50%]" />
                    <Table.Head id="category" label="Category" allowsSorting className="w-[23%]" />
                    <Table.Head id="opened" label="Last opened" allowsSorting className="w-[18%]" />
                    <Table.Head id="actions" label="" className="w-[9%]" />
                  </Table.Header>
                  <Table.Body items={paged} dependencies={[favourites, opened]}>
                    {(report) => {
                      const isFavourite = favourites.includes(report.id);
                      return (
                        <Table.Row id={report.id} href={roleHref(report.path)} textValue={report.title} className="group data-[href]:cursor-pointer">
                          <Table.Cell>
                            <span className="flex items-center gap-3">
                              <FeaturedIcon icon={report.icon} theme="light" color="brand" size="sm" />
                              <span className="flex min-w-0 flex-col">
                                <span className={cx("text-sm font-medium text-primary", "group-hover:text-brand-700 group-hover:underline")}>{report.title}</span>
                                <span className="max-w-xl text-sm text-balance text-tertiary">{report.description}</span>
                              </span>
                            </span>
                          </Table.Cell>
                          <Table.Cell className="whitespace-nowrap">
                            <Badge size="sm" color="gray" className="max-w-full">
                              <span className="truncate" title={categoryLabel(report.category)}>
                                {categoryLabel(report.category)}
                              </span>
                            </Badge>
                          </Table.Cell>
                          <Table.Cell className="whitespace-nowrap">
                            <span className="text-sm text-secondary tabular-nums">{openedLabel(opened[report.id])}</span>
                          </Table.Cell>
                          <Table.Cell>
                            <ReportMenu report={report} isFavourite={isFavourite} />
                          </Table.Cell>
                        </Table.Row>
                      );
                    }}
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
                  totalCount={rows.length}
                />
              </TableCard.Root>
            </div>
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { LayoutGrid01, Star01, Table as TableIcon, Grid01 } from "@untitledui/icons";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Table, TableCard } from "@/components/application/table/table";
import { segmentClass, segmentTrayClass } from "@/app/pages/project-detail/segmented";
import { sortRows, useAgreementScope } from "@/app/pages/_shared/agreement-scope";
import { MyReports } from "@/app/pages/_shared/reports/my-reports";
import { ListEmptyState } from "@/app/pages/_shared/list-empty-state";
import { ReportMenu, openedLabel } from "@/app/pages/_shared/reports/report-actions";
import { ReportCard } from "@/app/pages/_shared/reports/report-card";
import { CATEGORY_ICONS, useChooseReportsTab, useReportsTab } from "@/app/pages/_shared/reports/reports-nav";
import { REPORT_CATEGORIES, reportsFor, type ReportEntry } from "@/app/pages/_shared/reports/reports-data";
import { useReportPrefs } from "@/app/pages/_shared/reports/reports-store";
import { useRoleHref } from "@/lib/use-role-href";
import { useUserRole } from "@/lib/use-user-role";
import { cx } from "@/utils/cx";

// /pages/reports: the reports, as cards or as a table (the same Cards / Table switch the project page's Species tab has),
// grouped into categories, with Favourites a tab of its own; the same choice is also in column 2 (`ReportsNav`), from `?category=`. Each report has a star, a "..." menu of its actions
// (open, favourite, copy link) and when it was last opened. What a role sees inside a report is the report's own rule (the
// ingestion report shows a registered user their runs and BioData Admin all of them); the landing lists the reports the role is
// offered (a report with a `feature` the role lacks is left out, `reportsFor`).
type View = "cards" | "table";
const categoryLabel = (id: ReportEntry["category"]) => REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;

function ReportsCatalogue() {
  const role = useUserRole();
  const isAdmin = role === "biodata-admin";
  // Only the reports this role is offered (the DSA report is BioData Admin's alone).
  const reports = useMemo(() => reportsFor(role), [role]);
  const roleHref = useRoleHref();
  const { favourites, opened } = useReportPrefs();
  const [view, setView] = useState<View>("cards");
  const tab = useReportsTab();
  const choose = useChooseReportsTab();
  const [sort, setSort] = useState<SortDescriptor>({ column: "report", direction: "ascending" });
  const [pageFor, setPageFor] = useState({ tab, page: 1 });
  // The page number belongs to the item chosen in column 2: choosing another starts at page 1.
  const page = pageFor.tab === tab ? pageFor.page : 1;
  const setPage = (next: number) => setPageFor({ tab, page: next });
  const [pageSize, setPageSize] = useState(50);

  const inTab = useMemo(() => reports.filter((r) => (tab === "all" ? true : tab === "favourites" ? favourites.includes(r.id) : r.category === tab)), [reports, tab, favourites]);
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
              <CountBadge count={rows.length} color="brand" className="min-w-5 w-auto px-1.5" />
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

      <Tabs selectedKey={tab} onSelectionChange={(key) => choose(String(key))} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-6 pt-4">
          <TabList type="underline" aria-label="Report categories">
            <Tab id="all" icon={Grid01}>
              All
            </Tab>
            <Tab id="favourites" icon={Star01}>
              Favourites
            </Tab>
            {REPORT_CATEGORIES.filter((c) => reports.some((r) => r.category === c.id)).map((c) => (
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
                ? REPORT_CATEGORIES.filter((c) => reports.some((r) => r.category === c.id)).map((c) => (
                    <section key={c.id} aria-label={c.label} className="flex flex-col gap-3">
                      <h2 className="m-0 text-xs font-semibold tracking-wide text-tertiary uppercase">{c.label}</h2>
                      {cards(reports.filter((r) => r.category === c.id))}
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
                            <span className="flex min-w-0 flex-col">
                              <span className={cx("text-sm font-medium text-primary", "group-hover:text-brand-700 group-hover:underline")}>{report.title}</span>
                              <span className="max-w-xl text-sm text-balance text-tertiary">{report.description}</span>
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

/** All reports (the catalogue) or My reports (the ones the person generated), by column 2's `?scope=`. */
export function ReportsLanding() {
  return useAgreementScope("all") === "mine" ? <MyReports /> : <ReportsCatalogue />;
}

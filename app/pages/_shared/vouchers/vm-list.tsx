"use client";

import { useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { sortRows, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { ListFilterButton, matchesFilters, monthOptions, type FilterGetters, type FilterSection, type FilterSelection } from "@/app/pages/_shared/list-filter";
import { ToolbarSearch } from "@/app/pages/_shared/toolbar-search";
import { BATCHES, BATCH_STATUS, BATCH_STATUS_ORDER, SOURCE_LABEL, readDate, type VmBatch, type VmSource } from "@/app/pages/_shared/vouchers/vm-data";
import { useVmRoot } from "@/app/pages/_shared/vouchers/vm-root";
import { useBatchSummaries, type BatchSummary } from "@/app/pages/_shared/vouchers/vm-store";
import { useRoleHref } from "@/lib/use-role-href";

// Voucher Management's list: every scan batch, newest first (Figma "Species record review", node
// 1584:10220, re-fitted into the list pattern, CONTRACTS 4.2).
//
//   - Status (Needs review, Reviewed, No differences) is a filter, not tabs (the designer, 1 Oct 2026:
//     "put the tab options under filters"); the Status column says where each batch stands.
//   - The Figma's "Mismatched fields" and "Null fields" read as one "Differences" cell (fields that
//     differ, then how many of them BioData has no value for); "Updated & pushed" and "Ignored" are
//     one "Decided" cell. Nine columns did not fit at 1512px. A count of nothing is a muted 0, never a
//     stray "-" (2.3).
//   - "Needs review" says how many records are still waiting, so the eye goes to the work.

type Row = VmBatch & { s: BatchSummary };

const sortKeys: Record<string, (r: Row) => SortValue> = {
  id: (r) => r.id,
  ranOn: (r) => r.ranOn,
  checked: (r) => r.checked,
  different: (r) => r.s.different,
  decided: (r) => r.s.updated + r.s.ignored,
  status: (r) => BATCH_STATUS_ORDER.indexOf(r.s.status),
};

const filterGetters: FilterGetters<Row> = {
  status: (r) => r.s.status,
  ran: (r) => r.ranOn.slice(0, 7),
};

function Count({ n }: { n: number }) {
  return <span className={`text-sm tabular-nums ${n ? "text-secondary" : "text-quaternary"}`}>{n.toLocaleString("en-AU")}</span>;
}

export function VmList({ source }: { source: VmSource | "" }) {
  const summaries = useBatchSummaries();
  const roleHref = useRoleHref();
  const root = useVmRoot();
  const all: Row[] = BATCHES.filter((b) => !source || b.source === source).map((b) => ({ ...b, s: summaries.get(b.id)! }));
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterSelection>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "ranOn", direction: "descending" });
  const resetPage = () => setPage(1);

  const filterSections: FilterSection[] = [
    { id: "status", label: "Status", options: BATCH_STATUS_ORDER.map((s) => ({ id: s, label: BATCH_STATUS[s].label })) },
    { id: "ran", label: "Ran in", options: monthOptions(all.map((r) => r.ranOn)) },
  ];

  const query = search.trim().toLowerCase();
  const narrowedBySearch = all.filter((r) => matchesFilters(r, filters, filterGetters)).filter((r) => !query || r.id.includes(query));
  const rows = sortRows(narrowedBySearch, sort, sortKeys);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const narrowed = !!query || Object.values(filters).some((set) => set.size > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>{source ? `${SOURCE_LABEL[source]} batches` : "Scan batches"}</SectionHeader.Heading>
              <CountBadge count={all.length} color="brand" />
            </div>
            <SectionHeader.Subheading>
              {source
                ? `Each scan compares BioData's vouchered records with the ${SOURCE_LABEL[source]}'s. Open a batch to update BioData or ignore what differs.`
                : "The Herbarium and the SA Museum are scanned separately. Open a batch to update BioData or ignore what differs."}
            </SectionHeader.Subheading>
          </div>
        </SectionHeader.Group>
      </SectionHeader.Root>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ToolbarSearch
            label="Search batches"
            placeholder="Search by batch ID"
            value={search}
            onChange={(next) => {
              setSearch(next);
              resetPage();
            }}
          />
          <div>
            <ListFilterButton
              sections={filterSections}
              selection={filters}
              onChange={(next) => {
                setFilters(next);
                resetPage();
              }}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-tertiary">
              {query ? `No batch matches “${search.trim()}”.` : narrowed ? "No batches match your filters." : "No batches have run yet."}
            </p>
            {narrowed && (
              <Button
                color="link-color"
                size="sm"
                onPress={() => {
                  setSearch("");
                  setFilters({});
                  resetPage();
                }}
              >
                Clear search and filters
              </Button>
            )}
          </div>
        ) : (
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table
              bodyScrollable
              aria-label="Scan batches"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                resetPage();
              }}
            >
              <Table.Header sticky>
                <Table.Head id="id" label="Batch" isRowHeader allowsSorting />
                <Table.Head id="ranOn" label="Ran on" allowsSorting />
                {!source ? <Table.Head id="source" label="Source" /> : null}
                <Table.Head id="checked" label="Records checked" allowsSorting />
                <Table.Head id="different" label="Differences" tooltip="Fields whose values differ between the source and BioData" allowsSorting />
                <Table.Head id="decided" label="Decided" allowsSorting />
                <Table.Head id="status" label="Status" allowsSorting />
              </Table.Header>
              <Table.Body items={paged} dependencies={[summaries, source]}>
                {(r) => (
                  <Table.Row id={r.id} href={roleHref(`${root}/${r.id}`)} textValue={`Batch ${r.id}`} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium whitespace-nowrap text-primary tabular-nums group-hover:text-brand-700 group-hover:underline">Batch {r.id}</p>
                        {r.s.toReview > 0 && (
                          <p className="text-xs whitespace-nowrap text-tertiary">
                            {r.s.toReview} {r.s.toReview === 1 ? "record" : "records"} to review
                          </p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-secondary">{readDate(r.ranOn)}</span>
                    </Table.Cell>
                    {!source ? (
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-secondary">{SOURCE_LABEL[r.source]}</span>
                      </Table.Cell>
                    ) : null}
                    <Table.Cell>
                      <Count n={r.checked} />
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <Count n={r.s.different} />
                        {r.s.missing > 0 && <span className="text-xs whitespace-nowrap text-tertiary">{r.s.missing} missing in BioData</span>}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {r.s.updated + r.s.ignored === 0 ? (
                        <Count n={0} />
                      ) : (
                        <span className="text-sm whitespace-nowrap text-secondary tabular-nums">{[r.s.updated && `${r.s.updated} updated`, r.s.ignored && `${r.s.ignored} ignored`].filter(Boolean).join(" · ")}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" color={BATCH_STATUS[r.s.status].color}>
                        {BATCH_STATUS[r.s.status].label}
                      </Badge>
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
                resetPage();
              }}
              totalCount={rows.length}
            />
          </TableCard.Root>
        )}
      </div>
    </div>
  );
}

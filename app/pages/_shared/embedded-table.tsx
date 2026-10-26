"use client";

import { useState, type ReactNode } from "react";
import { Table as BasicTable, Cell as BasicCell, Column as BasicColumn, Row as BasicRow, TableBody as BasicBody, TableHeader as BasicHeader } from "@/components/base/table/table";
import { Table, TableCard } from "@/components/application/table/table";
import { cx } from "@/utils/cx";

// An embedded table (in a form, a review step, a record's tab) that follows CONTRACTS 4.2h: while its rows fit one page (10 or
// fewer, the smallest page size) it is the basic Table primitive in a bordered container with no pagination; past that, the
// TableCard with numbered pagination. The switch is made on the row count. The columns and cells are given once and drawn in
// either. Collection screens keep TableCard whatever their count (4.2).

export const ONE_PAGE = 10;

export interface EmbeddedColumn {
  id: string;
  label: string;
  /** A width (`w-[20%]`): the table is a fixed layout (4.2f). */
  className?: string;
  isRowHeader?: boolean;
}

export function EmbeddedTable<T extends { id: string }>({
  ariaLabel,
  columns,
  rows,
  cell,
  minWidth,
}: {
  ariaLabel: string;
  columns: EmbeddedColumn[];
  rows: T[];
  /** The content of one cell. */
  cell: (row: T, columnId: string) => ReactNode;
  /** A narrow window scrolls the table sideways instead of crushing a column (`min-w-[720px]`). */
  minWidth?: string;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ONE_PAGE);

  if (rows.length <= ONE_PAGE)
    return (
      <div className="overflow-hidden rounded-lg border border-secondary bg-primary">
        <div className="overflow-x-auto">
          <BasicTable aria-label={ariaLabel} className={cx("table-fixed", minWidth)}>
            <BasicHeader>
              {columns.map((c) => (
                <BasicColumn key={c.id} id={c.id} isRowHeader={c.isRowHeader} className={c.className}>
                  {c.label}
                </BasicColumn>
              ))}
            </BasicHeader>
            <BasicBody items={rows}>
              {(row) => (
                <BasicRow id={row.id} className="hover:bg-transparent">
                  {columns.map((c) => (
                    <BasicCell key={c.id}>{cell(row, c.id)}</BasicCell>
                  ))}
                </BasicRow>
              )}
            </BasicBody>
          </BasicTable>
        </div>
      </div>
    );

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const paged = rows.slice((current - 1) * pageSize, current * pageSize);
  return (
    <TableCard.Root size="sm">
      {/* 4.2: in a form or a tab the page scrolls and nothing bounds the card's height, so the rows keep their natural height. */}
      <Table aria-label={ariaLabel} layout="fixed" bodyScrollable className={minWidth}>
        <Table.Header sticky>
          {columns.map((c) => (
            <Table.Head key={c.id} id={c.id} label={c.label} isRowHeader={c.isRowHeader} className={c.className} />
          ))}
        </Table.Header>
        <Table.Body items={paged}>
          {(row) => (
            <Table.Row id={row.id} textValue={row.id}>
              {columns.map((c) => (
                <Table.Cell key={c.id} className="align-top">
                  {cell(row, c.id)}
                </Table.Cell>
              ))}
            </Table.Row>
          )}
        </Table.Body>
      </Table>
      <TableCard.PaginationNumbered
        page={current}
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
  );
}

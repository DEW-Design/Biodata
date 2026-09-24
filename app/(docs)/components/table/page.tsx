"use client";

import { useState } from "react";
import type React from "react";
import type { SortDescriptor } from "react-aria-components";
import { Check, FlipBackward, X } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "@/components/base/table/table";
import { Table as DataTable, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { ScaffoldCheckbox, ScaffoldLabel, ScaffoldNumberInput, SegmentedControl } from "@/components/scaffold/controls";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-secondary p-6">
    <p className="text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">{label}</p>
    {children}
  </div>
);

const projects = [
  { id: "adelaide-hills", name: "Adelaide Hills Bushland Survey", org: "Adelaide Hills Landcare", status: "Active" as const },
  { id: "coorong", name: "Coorong Wetlands Bird Count", org: "Birds SA", status: "Under review" as const },
  { id: "flinders", name: "Flinders Ranges Reptile Atlas", org: "DEW Biodiversity Team", status: "Draft" as const },
];

const statusColor = {
  Active: "success",
  "Under review": "warning",
  Draft: "gray",
} as const;

const members = [
  { id: 1, name: "Olivia Rhye", email: "olivia@untitledui.com", status: "Active" as const },
  { id: 2, name: "Phoenix Baker", email: "phoenix@untitledui.com", status: "Inactive" as const },
];

// Playground pool - a superset of `members` above, with the extra fields (role, teams) the
// "Data table" static example doesn't demonstrate, so toggling the Teams column on has real
// content to show.
const playgroundPool = [
  { id: 1, name: "Olivia Rhye", email: "olivia@untitledui.com", status: "Active" as const, role: "Product Designer", teams: ["Design", "Product", "Marketing"] },
  { id: 2, name: "Phoenix Baker", email: "phoenix@untitledui.com", status: "Active" as const, role: "Product Manager", teams: ["Engineering", "Product"] },
  { id: 3, name: "Lana Steiner", email: "lana@untitledui.com", status: "Inactive" as const, role: "Frontend Developer", teams: ["Design"] },
  { id: 4, name: "Demi Wilkinson", email: "demi@untitledui.com", status: "Active" as const, role: "Backend Developer", teams: ["Marketing", "Sales"] },
  { id: 5, name: "Candice Wu", email: "candice@untitledui.com", status: "Inactive" as const, role: "UX Designer", teams: ["Engineering"] },
  { id: 6, name: "Natali Craig", email: "natali@untitledui.com", status: "Active" as const, role: "QA Engineer", teams: ["Product", "Design", "Engineering"] },
];

const playgroundDefaults = {
  size: "md" as "sm" | "md",
  rows: 3,
  selectable: true,
  sortableName: true,
  showStatus: true,
  showTeams: false,
  rowActions: true,
  sortDescriptor: { column: "name", direction: "ascending" } as SortDescriptor,
};

export default function TablePage() {
  const [size, setSize] = useState(playgroundDefaults.size);
  const [rows, setRows] = useState(playgroundDefaults.rows);
  const [selectable, setSelectable] = useState(playgroundDefaults.selectable);
  const [sortableName, setSortableName] = useState(playgroundDefaults.sortableName);
  const [showStatus, setShowStatus] = useState(playgroundDefaults.showStatus);
  const [showTeams, setShowTeams] = useState(playgroundDefaults.showTeams);
  const [rowActions, setRowActions] = useState(playgroundDefaults.rowActions);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(playgroundDefaults.sortDescriptor);
  const [page, setPage] = useState(1);
  const [numberedPage, setNumberedPage] = useState(1);
  const [numberedPageSize, setNumberedPageSize] = useState(50);

  const isDefault =
    size === playgroundDefaults.size &&
    rows === playgroundDefaults.rows &&
    selectable === playgroundDefaults.selectable &&
    sortableName === playgroundDefaults.sortableName &&
    showStatus === playgroundDefaults.showStatus &&
    showTeams === playgroundDefaults.showTeams &&
    rowActions === playgroundDefaults.rowActions &&
    sortDescriptor.column === playgroundDefaults.sortDescriptor.column &&
    sortDescriptor.direction === playgroundDefaults.sortDescriptor.direction;

  const resetPlayground = () => {
    setSize(playgroundDefaults.size);
    setRows(playgroundDefaults.rows);
    setSelectable(playgroundDefaults.selectable);
    setSortableName(playgroundDefaults.sortableName);
    setShowStatus(playgroundDefaults.showStatus);
    setShowTeams(playgroundDefaults.showTeams);
    setRowActions(playgroundDefaults.rowActions);
    setSortDescriptor(playgroundDefaults.sortDescriptor);
    setPage(1);
  };

  // `allowsSorting` only makes a column header clickable and shows the chevron - React Aria's
  // Table has no idea how to compare consumer data, so it never sorts anything on its own. The
  // consumer supplies `sortDescriptor`/`onSortChange` and re-orders `items` itself, same as here.
  const sortedPool = [...playgroundPool].sort((a, b) => {
    if (sortDescriptor.column !== "name") return 0;
    const cmp = a.name.localeCompare(b.name);
    return sortDescriptor.direction === "descending" ? -cmp : cmp;
  });

  const previewRows = sortedPool.slice(0, rows);

  // A single source of truth for which columns exist, threaded to both `DataTable.Header` and
  // every `DataTable.Row` via their `columns` prop. React Aria's Table builds the header's and
  // each row's cells as separate collections - conditionally rendering a different number of
  // static `Head`/`Cell` children per toggle desyncs them ("Cell count must match column count"
  // at runtime, only surfacing on the specific render where a column is added/removed). Driving
  // both from the same `columns` array via the dynamic per-column render function is the pattern
  // that keeps them in lockstep instead.
  const columns = [
    { key: "name", label: "Name" },
    ...(showStatus ? [{ key: "status", label: "Status" }] : []),
    ...(showTeams ? [{ key: "teams", label: "Teams" }] : []),
    ...(rowActions ? [{ key: "actions", label: "" }] : []),
  ];

  return (
    <div className="prose-doc">
      <PageHeader
        section="Components"
        title="Table"
        description="Two layers on React Aria's Table: a plain Table primitive for a simple list, and TableCard - the batteries-included data table with row selection, sortable columns, a tooltip'd header, and row-actions dropdown."
      />

      <h2 className="text-balance">Component Playground</h2>
      <p className="text-balance">
        Build a table from the pieces below - size, row count, selection, sorting, which columns show, and row
        actions - all wired to the real <code>TableCard</code>/<code>Table</code> from
        <code> components/application/table/table.tsx</code>.
      </p>
      <div className="overflow-hidden rounded-2xl border border-secondary shadow-xs">
        <div className="grid md:grid-cols-[1fr_300px]">
          <div
            className="relative flex min-h-[420px] items-center justify-center overflow-x-auto bg-primary_alt p-8"
            style={{
              backgroundImage: "radial-gradient(var(--ui-border-secondary) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div className="w-full max-w-xl">
              <TableCard.Root size={size}>
                <TableCard.Header
                  title="Team members"
                  badge={`${previewRows.length}`}
                  description="Everyone with access to this workspace."
                />
                <DataTable
                  key={columns.map((c) => c.key).join("-")}
                  aria-label="Team members"
                  size={size}
                  selectionMode={selectable ? "multiple" : "none"}
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                >
                  <DataTable.Header columns={columns}>
                    {(column) =>
                      column.key === "name" ? (
                        <DataTable.Head id={column.key} isRowHeader allowsSorting={sortableName}>
                          {column.label}
                        </DataTable.Head>
                      ) : column.key === "status" ? (
                        <DataTable.Head id={column.key} tooltip="Whether the member can sign in.">
                          {column.label}
                        </DataTable.Head>
                      ) : (
                        <DataTable.Head id={column.key}>{column.label}</DataTable.Head>
                      )
                    }
                  </DataTable.Header>
                  <DataTable.Body items={previewRows}>
                    {(row) => (
                      <DataTable.Row id={row.id} columns={columns}>
                        {(column) =>
                          column.key === "name" ? (
                            <DataTable.Cell>
                              <div className="flex items-center gap-3">
                                <Avatar size="sm" alt={row.name} />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-primary">{row.name}</span>
                                  <span className="text-sm text-tertiary">{row.email}</span>
                                </div>
                              </div>
                            </DataTable.Cell>
                          ) : column.key === "status" ? (
                            <DataTable.Cell>
                              <BadgeWithDot color={row.status === "Active" ? "success" : "gray"} size="sm">
                                {row.status}
                              </BadgeWithDot>
                            </DataTable.Cell>
                          ) : column.key === "teams" ? (
                            <DataTable.Cell>
                              <div className="flex flex-wrap gap-1">
                                {row.teams.map((team) => (
                                  <Badge key={team} size="sm">
                                    {team}
                                  </Badge>
                                ))}
                              </div>
                            </DataTable.Cell>
                          ) : (
                            <DataTable.Cell>
                              <TableRowActionsDropdown />
                            </DataTable.Cell>
                          )
                        }
                      </DataTable.Row>
                    )}
                  </DataTable.Body>
                </DataTable>
                <TableCard.Pagination page={page} pageCount={4} onPageChange={setPage} />
              </TableCard.Root>
            </div>
          </div>

          <div className="flex flex-col gap-5 border-l border-secondary bg-primary p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold text-quaternary uppercase tracking-widest text-balance">Controls</p>
              <button
                type="button"
                onClick={resetPlayground}
                disabled={isDefault}
                className="text-xs font-medium text-brand-secondary transition-opacity hover:text-brand-secondary_hover disabled:opacity-40"
              >
                Reset
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <ScaffoldLabel>Size</ScaffoldLabel>
              <SegmentedControl
                options={[
                  { key: "sm", label: "sm" },
                  { key: "md", label: "md" },
                ]}
                value={size}
                onChange={setSize}
              />
            </div>

            <ScaffoldNumberInput label="Rows" value={rows} onChange={setRows} min={1} max={playgroundPool.length} />

            <div className="flex flex-col gap-2.5">
              <ScaffoldLabel>Columns</ScaffoldLabel>
              <ScaffoldCheckbox label="Status" checked={showStatus} onChange={setShowStatus} />
              <ScaffoldCheckbox label="Teams" checked={showTeams} onChange={setShowTeams} />
            </div>

            <div className="flex flex-col gap-2.5">
              <ScaffoldLabel>Behaviour</ScaffoldLabel>
              <ScaffoldCheckbox label="Row selection" checked={selectable} onChange={setSelectable} />
              <ScaffoldCheckbox label="Sortable name column" checked={sortableName} onChange={setSortableName} />
              <ScaffoldCheckbox label="Row actions menu" checked={rowActions} onChange={setRowActions} />
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-balance">Table (primitive)</h2>
      <p className="text-balance">
        <code>components/base/table/table.tsx</code> - just <code>Table</code>/<code>TableHeader</code>/
        <code>Column</code>/<code>TableBody</code>/<code>Row</code>/<code>Cell</code>, styled with this system&apos;s
        tokens. Use it when you don&apos;t need selection, sorting, or a card wrapper - a <code>Row</code> can take{" "}
        <code>href</code> to make the whole row a link.
      </p>
      <Section label="Basic table">
        <div className="overflow-hidden rounded-lg border border-secondary bg-primary">
          <Table aria-label="Projects">
            <TableHeader>
              <Column isRowHeader>Project</Column>
              <Column>Organisation</Column>
              <Column>Status</Column>
            </TableHeader>
            <TableBody items={projects}>
              {(project) => (
                <Row id={project.id} textValue={project.name}>
                  <Cell className="font-medium text-primary">{project.name}</Cell>
                  <Cell>{project.org}</Cell>
                  <Cell>
                    <Badge size="sm" color={statusColor[project.status]}>
                      {project.status}
                    </Badge>
                  </Cell>
                </Row>
              )}
            </TableBody>
          </Table>
        </div>
      </Section>

      <h2 className="text-balance">Data table (TableCard)</h2>
      <p className="text-balance">
        <code>components/application/table/table.tsx</code> - wrap rows in <code>TableCard.Root</code> for the card
        chrome, add a <code>TableCard.Header</code>, and use <code>Table</code>/<code>Table.Header</code>/
        <code>Table.Head</code>/<code>Table.Row</code>/<code>Table.Cell</code> for the grid itself. Set{" "}
        <code>selectionMode=&quot;multiple&quot;</code> on <code>Table</code> to get a selection checkbox column for
        free - it composes the same <code>Checkbox</code> used everywhere else. The Name column below is clickable
        (<code>allowsSorting</code>) but this specific example doesn&apos;t actually reorder rows - React Aria&apos;s
        Table has no idea how to compare your data, so <code>allowsSorting</code> alone only renders the chevron and
        makes the header interactive. Sorting only works once you also supply <code>sortDescriptor</code>/
        <code>onSortChange</code> and re-order <code>items</code> yourself - see the Playground above for a real,
        working example.
      </p>
      <Section label="Team members">
        <TableCard.Root>
          <TableCard.Header title="Team members" badge={`${members.length}`} description="Everyone with access to this workspace." />
          <DataTable aria-label="Team members" selectionMode="multiple">
            <DataTable.Header>
              <DataTable.Head id="name" isRowHeader allowsSorting>
                Name
              </DataTable.Head>
              <DataTable.Head id="status" tooltip="Whether the member can sign in.">
                Status
              </DataTable.Head>
              <DataTable.Head id="actions" />
            </DataTable.Header>
            <DataTable.Body items={members}>
              {(row) => (
                <DataTable.Row id={row.id}>
                  <DataTable.Cell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" alt={row.name} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">{row.name}</span>
                        <span className="text-sm text-tertiary">{row.email}</span>
                      </div>
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <BadgeWithDot color={row.status === "Active" ? "success" : "gray"} size="sm">
                      {row.status}
                    </BadgeWithDot>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <TableRowActionsDropdown />
                  </DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable.Body>
          </DataTable>
          <TableCard.Pagination page={1} pageCount={5} onPageChange={() => {}} />
        </TableCard.Root>
      </Section>
      <p className="text-balance">
        <code>TableRowActionsDropdown</code> is a ready-made Edit/Copy link/Delete menu built on{" "}
        <Link href="/components/dropdown">Dropdown</Link> - see that page for building a custom one. Figma&apos;s own
        &quot;Team members&quot; reference documents two other row-action treatments this system doesn&apos;t have a
        ready-made component for yet - bare &quot;Action icons&quot; (a row of icon-only buttons, no dropdown) and
        &quot;Action buttons&quot; (text links). Both are real, valid Untitled UI patterns; only the dropdown one
        has been built here so far.
      </p>

      <h2 className="text-balance">Numbered pagination</h2>
      <p className="text-balance">
        <code>TableCard.PaginationNumbered</code> is the richer footer Figma&apos;s Sales example shows: a Rows per
        page control, Previous/Next, a page list that always keeps the first and last three pages (1 2 3 … 8 9 10), and
        a &quot;1-50 of 250&quot; summary. It sits alongside <code>TableCard.Pagination</code> rather than replacing it,
        so every table using the simple &quot;Page X of Y&quot; footer is unaffected. The row slicing is the caller&apos;s
        job - it only reports the page and page size.
      </p>
      <Section label="TableCard.PaginationNumbered">
        <TableCard.Root>
          <TableCard.PaginationNumbered
            page={numberedPage}
            pageCount={Math.ceil(250 / numberedPageSize)}
            onPageChange={setNumberedPage}
            pageSize={numberedPageSize}
            onPageSizeChange={(size) => {
              setNumberedPageSize(size);
              setNumberedPage(1);
            }}
            totalCount={250}
          />
        </TableCard.Root>
      </Section>

      <h2 className="text-balance">Status badges</h2>
      <p className="text-balance">
        Figma&apos;s table examples use two different status treatments depending on what the status actually
        means - <code>BadgeWithDot</code> for a simple on/off state (Active/Inactive), <code>BadgeWithIcon</code> for
        an outcome (Paid/Refunded/Cancelled). Both are real, already-shipped <Link href="/components/badge">Badge</Link>{" "}
        variants - picking the wrong one for the context is the mismatch to avoid, not a missing component.
      </p>
      <Section label="BadgeWithDot (on/off) / BadgeWithIcon (outcome)">
        <div className="flex flex-col gap-2">
          <BadgeWithDot size="sm" color="success">Active</BadgeWithDot>
          <BadgeWithDot size="sm" color="gray">Inactive</BadgeWithDot>
        </div>
        <div className="flex flex-col gap-2">
          <BadgeWithIcon size="sm" color="success" iconLeading={Check}>Paid</BadgeWithIcon>
          <BadgeWithIcon size="sm" color="gray" iconLeading={FlipBackward}>Refunded</BadgeWithIcon>
          <BadgeWithIcon size="sm" color="error" iconLeading={X}>Cancelled</BadgeWithIcon>
        </div>
      </Section>

      <h2 className="text-balance">Usage</h2>
      <pre className="overflow-x-auto rounded-xl border border-secondary bg-secondary p-5">
        <code className="font-mono text-[13px] text-secondary">
{`// Plain table
import { Table, TableHeader, Column, TableBody, Row, Cell } from "@/components/base/table/table";

<Table aria-label="Projects">
  <TableHeader>
    <Column isRowHeader>Project</Column>
    <Column>Status</Column>
  </TableHeader>
  <TableBody items={projects}>
    {(project) => (
      <Row id={project.id} href={project.href} textValue={project.name}>
        <Cell>{project.name}</Cell>
        <Cell><Badge color={project.statusColor}>{project.status}</Badge></Cell>
      </Row>
    )}
  </TableBody>
</Table>

// Data table with selection + row actions
import { Table, TableCard, TableRowActionsDropdown } from "@/components/application/table/table";

<TableCard.Root>
  <TableCard.Header title="Team members" badge={String(members.length)} />
  <Table aria-label="Team members" selectionMode="multiple">
    <Table.Header>
      <Table.Head id="name" isRowHeader allowsSorting>Name</Table.Head>
      <Table.Head id="actions" />
    </Table.Header>
    <Table.Body items={members}>
      {(row) => (
        <Table.Row id={row.id}>
          <Table.Cell>{row.name}</Table.Cell>
          <Table.Cell><TableRowActionsDropdown /></Table.Cell>
        </Table.Row>
      )}
    </Table.Body>
  </Table>
</TableCard.Root>`}
        </code>
      </pre>

      <h2 className="text-balance">API</h2>
      <table className="token-table mt-4">
        <thead>
          <tr>
            <th>Component</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Table (base)", notes: "React Aria TableProps. Composes TableHeader/Column/TableBody/Row/Cell." },
            { name: "TableCard.Root", notes: "size (\"xs\" | \"sm\" | \"md\", default \"md\") - propagates to the Table inside it via context, and wins over a size passed only to the nested Table. \"xs\" is the dense 34px header / 44px row size from Figma's results-table reference." },
            { name: "TableCard.Header", notes: "title, badge (string or element), description, contentTrailing." },
            { name: "TableCard.Pagination", notes: "page, pageCount, onPageChange - the simple \"Page X of Y\" + Previous/Next footer." },
            { name: "TableCard.PaginationNumbered", notes: "page (1-indexed), pageCount, onPageChange, pageSize, onPageSizeChange, totalCount, pageSizeOptions (default 10 / 25 / 50 / 100), className - Rows per page, Previous/Next, a 1 2 3 … 8 9 10 page list and a \"1-50 of 250\" summary. The page list builder is also exported as tableCardPaginationRange." },
            {
              name: "Table (application)",
              notes: "React Aria TableProps + size. Table.Header/Table.Head/Table.Row/Table.Cell auto-render a selection checkbox column when selectionMode is set. sortDescriptor/onSortChange are required to make allowsSorting actually reorder rows - the Table has no built-in comparator.",
            },
            { name: "Table (application) - bodyScrollable", notes: "Opt-in, default false. Makes the table's own wrapper scroll vertically (min-h-0 flex-1 overflow-y-auto) instead of growing to its full content height - use it only when the table's container already has a fixed height, so a toolbar and pagination can stay on screen while only the rows scroll. Pair with Table.Header sticky." },
            { name: "Table.Header - sticky", notes: "Opt-in, default false. Pins the header row to the top of a scrolling table (sticky top-0). A no-op when the table is not inside a scrolling ancestor." },
            { name: "Table.Head", notes: "label, tooltip (renders a help-icon Tooltip next to the label), plus Column's allowsSorting/isRowHeader." },
            { name: "Table.Row", notes: "highlightSelectedRow (default true), size override." },
            { name: "TableRowActionsDropdown", notes: "No props - a fixed Edit/Copy link/Delete menu. Build a custom one from Dropdown for other actions." },
          ].map((r) => (
            <tr key={r.name}>
              <td>
                <code>{r.name}</code>
              </td>
              <td style={{ fontSize: "13px" }}>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-balance">Figma</h2>
      <p className="text-balance">
        <a href="https://www.figma.com/design/R6eV90XaudweMGqPEfTbwk/Application-Components?node-id=1-83267" target="_blank" rel="noreferrer">
          Application Components - Tables
        </a>{" "}
        documents header cells (help-icon tooltip, sort chevron, checkbox), the full cell-type catalog (text, avatar,
        file type icon, badge, badges-multiple, trend, avatar group, select dropdown, progress bar, star rating, and
        three row-action treatments), and{" "}
        <a href="https://www.figma.com/design/R6eV90XaudweMGqPEfTbwk/Application-Components?node-id=1-84599" target="_blank" rel="noreferrer">
          full table examples
        </a>{" "}
        (Team members, Sales, Companies, Files - both divider-line and alternating-fill row styles, desktop and
        mobile). This page&apos;s &quot;Data table&quot; example mirrors Figma&apos;s own &quot;Team members&quot;
        reference; <code>TableCard.Pagination</code> mirrors the Previous/Next footer every one of those examples
        ships with.
      </p>
      <p className="text-balance">
        Not yet built, found auditing against the fuller examples above - real, valuable, and each a separate
        piece of work rather than a style fix, so logged here instead of built speculatively:
      </p>
      <ul className="w-full list-disc pl-5 text-sm text-secondary" style={{ lineHeight: "1.9" }}>
        <li>
          <strong>A filters bar</strong> (segmented view tabs + search input + a &quot;Filters&quot; button, sitting
          between the card header and the grid) - achievable today by composing{" "}
          <Link href="/components/tabs">Tabs</Link>, <Link href="/components/input">Input</Link>, and{" "}
          <Link href="/components/button">Button</Link> directly rather than a new bespoke component.
        </li>
        <li>
          <strong>An avatar-group cell</strong> (4-5 overlapping avatars + a &quot;+N&quot; overflow badge, seen in
          the Companies example&apos;s &quot;Users&quot; column) - <code>AvatarLabelGroup</code> is one avatar plus a
          title/subtitle, not a stacked multi-avatar group; no component renders this shape yet.
        </li>
        <li>
          <strong>A progress-bar cell</strong> (a track + fill + percentage, the Companies example&apos;s
          &quot;License use&quot; column) - no DEW progress bar component exists yet.
        </li>
        <li>
          <strong>A file-type-icon cell</strong> (a coloured PDF/JPG/MP4/etc. badge next to a filename, the Files
          example) - would need a small file-type icon set; none exists yet.
        </li>
      </ul>
    </div>
  );
}

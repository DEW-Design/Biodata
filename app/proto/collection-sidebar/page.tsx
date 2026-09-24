"use client";

import { Suspense, useState } from "react";
import type { FC, ReactNode } from "react";
import type { Key, Selection } from "react-aria-components";
import { BarChart01, CheckCircle, Clock, Download01, Edit05, FileCheck02, FileLock01, MinusCircle, PauseCircle, Plus, SearchMd, Send01, SlashCircle01, XCircle } from "@untitledui/icons";
import { toast } from "@/components/application/toast/toast";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { TaskItem } from "@/app/pages/_shared/home-dashboard";
import { contactName, dsaStatusMeta, dsaStatusOrder, formatShortDate as formatDsaDate, type Dsa, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { DsaListContent } from "@/app/pages/_shared/dsa/dsa-list";
import { dlaStatusMeta, dlaStatusOrder, formatShortDate as formatDlaDate, requestorName, type Dla, type DlaStatus } from "@/app/pages/_shared/dla/dla-data";
import { useDlas } from "@/app/pages/_shared/dla/dla-store";
import { DlaListContent } from "@/app/pages/_shared/dla/dla-list";
import { useRoleHref } from "@/lib/use-role-href";
import { cx } from "@/utils/cx";

// /proto/collection-sidebar - what column 2 should show for a List -> deep dive collection (DSA,
// DLA). "Actions" (Export CSV, Create report, the two `TaskItem` notifications now living in
// column 3 above the table) is the Baseline, confirmed directly. This round adds two real
// variants on top of it, per direct instruction ("make actions the baseline and come up with some
// variants from the above patterns") and the Mobbin research that grounded them:
//
//   - **Status Tabs** - status moves out of column 2 into a real horizontal `underline` Tabs row
//     above the table (Xero's "Quotes": All/Draft/Sent/Declined/Accepted/Invoiced; Remote's
//     "Team's expenses": Pending/Approved/Declined/All requests), using `DsaListContent`/
//     `DlaListContent`'s own additive `statusTabs` slot. Column 2 becomes Actions alone - nothing
//     else needs to live there once status has somewhere else to be.
//   - **My Items** - a real view switcher in column 2, the same `Tabs` component/type/orientation
//     as Home's own My BioData / Flora and Fauna Dashboard switch (`orientation="vertical"
//     type="button-brand" fullWidth`, see app/pages/dashboard/page.tsx), scoped to "mine" (the
//     current placeholder user, Olivia Wyatt) vs. "all". Employment Hero's "Goals" page (My Goals /
//     Team Goals / Company Goals) is the closest real precedent for this personal-vs-org-wide axis;
//     for DLA, "My Requests"/"All Requests" is domain-accurate (a request has a real requestor).
//     Corrected from an earlier assumption: DSA is NOT submitter-less - `dsa-data.ts`'s own seed
//     data gives every agreement a real `requestedBy` contact (including Olivia Wyatt), so "My
//     Agreements"/"All Agreements" is exactly as real for DSA as "My Requests" is for DLA. Status
//     still needs to move out of column 2 for this switcher to have room, so this variant carries
//     Status Tabs' own change forward too, rather than stacking a second nav list under it.
//
// `ProtoPicker` compares all three side by side, same convention as every other `/proto/*` lab.

type Dataset = "dsa" | "dla";
type Scope = "mine" | "all";

const VARIANTS = ["Baseline", "Status Tabs", "My Items"] as const;
type Variant = (typeof VARIANTS)[number];

// DSA and DLA now share one status vocabulary (agreement-status.ts), so one icon map covers both -
// same set used in dsa-shell.tsx/dla-shell.tsx.
const statusIcons: Record<DsaStatus, FC<{ className?: string }>> = {
  draft: Edit05,
  submitted: Send01,
  under_review: Clock,
  on_hold: PauseCircle,
  approved: CheckCircle,
  rejected: XCircle,
  active: CheckCircle,
  closed: SlashCircle01,
  cancelled: MinusCircle,
};
const dsaStatusIcons = statusIcons;
const dlaStatusIcons: Record<DlaStatus, FC<{ className?: string }>> = statusIcons;

// A small picker, same convention as every other `/proto/*` lab with more than one direction to
// compare. Sits in the header itself, not a fixed corner overlay - the dev-only Agentation
// feedback toolbar and RoleSwitcher's own FAB both already occupy bottom-right, and the primary
// icon rail runs the full height of the left edge, so there's no free fixed corner left to use.
function ProtoPicker({ variant, onChange }: { variant: Variant; onChange: (v: Variant) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {VARIANTS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cx(
            "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-100 ease-linear",
            variant === v ? "bg-primary text-primary shadow-xs" : "text-quaternary hover:text-primary",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const csv = [header, ...rows].map((line) => line.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// `mb-3`, no horizontal padding - matches `StatusNavColumn`'s own label exactly (was `mb-1 px-2`,
// flagged directly by the user off a screenshot as inconsistent with the status list above it).
function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{children}</p>;
}

const shortcutRowClassName =
  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-quaternary outline-focus-ring transition-colors duration-100 ease-linear hover:bg-tertiary hover:text-primary focus-visible:outline-2";

// A direct visual mirror of `StatusNav` in dsa-shell.tsx/dla-shell.tsx - same list shape, same
// per-status icon, same count badge, same active styling. Local `onSelect` state here instead of
// the real `Link`/`router` navigation those shells use, since this lab has no `?status=` URL of
// its own to drive. `after` renders the real "Actions" group below the status list.
function StatusNavColumn<S extends string>({
  label,
  order,
  meta,
  icons,
  counts,
  active,
  onSelect,
  after,
}: {
  label: string;
  order: S[];
  meta: Record<S, { tabLabel: string; badgeColor: BadgeColors }>;
  icons: Record<S, FC<{ className?: string }>>;
  counts: Record<S, number>;
  active: S;
  onSelect: (status: S) => void;
  after?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 p-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</p>
      {order.map((status) => {
        const Icon: FC<{ className?: string }> = icons[status];
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            aria-current={isActive ? "page" : undefined}
            className={cx(
              "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold outline-focus-ring transition-colors duration-100 ease-linear focus-visible:outline-2",
              isActive ? "bg-brand-secondary text-brand-secondary" : "text-quaternary hover:bg-tertiary hover:text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{meta[status].tabLabel}</span>
            <CountBadge count={counts[status]} color={isActive ? "brand" : "gray"} />
          </button>
        );
      })}
      {after}
    </div>
  );
}

// ── Status Tabs (column 3, above the table) - Xero's "Quotes" / Remote's "Team's expenses". ──

function StatusTabsRow<S extends string>({
  order,
  meta,
  counts,
  active,
  onSelect,
}: {
  order: S[];
  meta: Record<S, { tabLabel: string }>;
  counts: Record<S, number>;
  active: S;
  onSelect: (status: S) => void;
}) {
  return (
    <div className="px-6 pt-4">
      <Tabs selectedKey={active} onSelectionChange={(key) => onSelect(key as S)}>
        <TabList aria-label="Filter by status" type="underline" size="md" className="gap-6">
          {order.map((status) => (
            <Tab key={status} id={status} label={meta[status].tabLabel} badge={counts[status]} />
          ))}
        </TabList>
      </Tabs>
    </div>
  );
}

// ── My Items scope switcher (column 2) - the exact same `Tabs` component/type/orientation as
// Home's own My BioData / Flora and Fauna Dashboard switch (app/pages/dashboard/page.tsx). ──

function ScopeSwitcher({ scope, onScopeChange, myLabel, allLabel }: { scope: Scope; onScopeChange: (scope: Scope) => void; myLabel: string; allLabel: string }) {
  return (
    <Tabs orientation="vertical" selectedKey={scope} onSelectionChange={(key) => onScopeChange(key as Scope)}>
      <TabList aria-label="Scope" orientation="vertical" type="button-brand" fullWidth className="w-full">
        <Tab id="mine" label={myLabel} />
        <Tab id="all" label={allLabel} />
      </TabList>
    </Tabs>
  );
}

// ── Column 2's "Actions" group ──

// Real urgency, not just "whichever active record's `validTo` sorts first" - a record expiring
// two years out doesn't belong flagged as urgent. 60 days mirrors the same threshold the earlier
// "Needs Attention" exploration used for its own "Expiring soon" list.
const EXPIRY_WARNING_WINDOW_DAYS = 60;

function nearestToExpiry<T extends { status: string; validTo: string }>(records: T[]): T | undefined {
  const now = Date.now();
  return records
    .filter((r) => r.status === "active" && r.validTo)
    .map((r) => ({ record: r, daysLeft: Math.round((new Date(r.validTo).getTime() - now) / (1000 * 60 * 60 * 24)) }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= EXPIRY_WARNING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0]?.record;
}

function CreateReportButton() {
  return (
    <button
      type="button"
      onClick={() => toast.brand("Reports aren't wired up yet", { description: "Report generation isn't stored in this preview - see CONTEXT.md's Admin IA cross-check." })}
      className={shortcutRowClassName}
    >
      <BarChart01 className="size-4 shrink-0" />
      Create report
    </button>
  );
}

// `withTopRule` (default true, unchanged for Baseline where Actions follows the status list) -
// false when Actions is the first or only thing in column 2 (Status Tabs' own column 2, and My
// Items' column 2 below its own divider), so there's no floating rule with nothing above it.
// `flex flex-col gap-1` on the outer wrapper, matching `StatusNavColumn`'s own structure exactly -
// its label-to-first-row gap is `gap-1` (4px) plus the label's own `mb-3` (12px) = 16px, not the
// label's margin alone, so `GroupLabel` needs the same wrapper gap to actually match, not just the
// same margin (flagged directly by the user off a screenshot as inconsistent).
function DsaActions({ dsas, withTopRule = true }: { dsas: Dsa[]; withTopRule?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-1", withTopRule && "mt-4 border-t border-secondary pt-4")}>
      <GroupLabel>Actions</GroupLabel>
      <button
        type="button"
        onClick={() =>
          downloadCsv(
            "data-sharing-agreements.csv",
            ["ID", "Data partner", "Status", "Valid to"],
            dsas.map((d) => [d.id, d.partner, dsaStatusMeta[d.status].tabLabel, d.validTo]),
          )
        }
        className={shortcutRowClassName}
      >
        <Download01 className="size-4 shrink-0" />
        Export CSV
      </button>
      <CreateReportButton />
    </div>
  );
}

function DlaActions({ dlas, withTopRule = true }: { dlas: Dla[]; withTopRule?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-1", withTopRule && "mt-4 border-t border-secondary pt-4")}>
      <GroupLabel>Actions</GroupLabel>
      <button
        type="button"
        onClick={() =>
          downloadCsv(
            "data-licencing-agreements.csv",
            ["ID", "Requestor", "Status", "Valid to"],
            dlas.map((d) => [d.id, requestorName(d.requestor), dlaStatusMeta[d.status].tabLabel, d.validTo]),
          )
        }
        className={shortcutRowClassName}
      >
        <Download01 className="size-4 shrink-0" />
        Export CSV
      </button>
      <CreateReportButton />
    </div>
  );
}

// ── Column 3 banners, rendered above the search bar via `DsaListContent`/`DlaListContent`'s own
// additive `banner` prop. Real `TaskItem` (`app/pages/_shared/home-dashboard.tsx`) - see the
// file-header comment for why, not `AlertFullWidth`. Render nothing when there's nothing to say.

function DsaBanner({ dsas, roleHrefBase, onViewStatus }: { dsas: Dsa[]; roleHrefBase: string; onViewStatus: (status: DsaStatus) => void }) {
  const expiring = nearestToExpiry(dsas);
  const draftCount = dsas.filter((d) => d.status === "draft").length;
  if (draftCount === 0 && !expiring) return null;
  return (
    <div className="flex flex-col gap-3">
      {draftCount > 0 && (
        <TaskItem
          icon={Edit05}
          title="Drafts to finish"
          detail={`${draftCount} draft${draftCount === 1 ? "" : "s"} still need${draftCount === 1 ? "s" : ""} to be finished.`}
          status={dsaStatusMeta.draft.label}
          statusColor={dsaStatusMeta.draft.badgeColor}
          actionLabel="Review drafts"
          onActionClick={() => onViewStatus("draft")}
        />
      )}
      {expiring && (
        <TaskItem
          icon={Clock}
          title={expiring.id}
          detail={`${expiring.partner || "No partner set"} - expires ${formatDsaDate(expiring.validTo)}.`}
          status={dsaStatusMeta[expiring.status].label}
          statusColor={dsaStatusMeta[expiring.status].badgeColor}
          actionLabel="View agreement"
          actionHref={`${roleHrefBase}/${expiring.id}?userRole=biodata-admin`}
        />
      )}
    </div>
  );
}

function DlaBanner({ dlas, roleHrefBase, onViewStatus }: { dlas: Dla[]; roleHrefBase: string; onViewStatus: (status: DlaStatus) => void }) {
  const expiring = nearestToExpiry(dlas);
  const reviewCount = dlas.filter((d) => d.status === "under_review").length;
  if (reviewCount === 0 && !expiring) return null;
  return (
    <div className="flex flex-col gap-3">
      {reviewCount > 0 && (
        <TaskItem
          icon={Clock}
          title="Requests awaiting review"
          detail={`${reviewCount} request${reviewCount === 1 ? "" : "s"} awaiting your decision.`}
          status={dlaStatusMeta.under_review.label}
          statusColor={dlaStatusMeta.under_review.badgeColor}
          actionLabel="Review requests"
          onActionClick={() => onViewStatus("under_review")}
        />
      )}
      {expiring && (
        <TaskItem
          icon={Clock}
          title={expiring.id}
          detail={`${requestorName(expiring.requestor) || "No requestor set"} - expires ${formatDlaDate(expiring.validTo)}.`}
          status={dlaStatusMeta[expiring.status].label}
          statusColor={dlaStatusMeta[expiring.status].badgeColor}
          actionLabel="View request"
          actionHref={`${roleHrefBase}/${expiring.id}?userRole=biodata-admin`}
        />
      )}
    </div>
  );
}

// ── "My Items" column 3: My/All is a scope, not a status bucket, so this variant's own table
// shows every status at once instead of the real `DsaListContent`/`DlaListContent` (which are
// built around exactly one status bucket, per the "no Status column, column 2 already says the
// bucket" contract in CONTEXT.md). A real `MultiSelect` status filter (defaulting to no
// selection = every status shown) plus a real Status `Badge` column replace that contract here,
// since there is no longer a single bucket for a Status column to be redundant with. Proto-local,
// not a change to the real list components - same "build a local mirror for an unvalidated
// direction, don't touch the shared production component for a lab-only need" precedent as
// `StatusNavColumn`/`StatusTabsRow`/`ScopeSwitcher` above.

function StatusFilterSelect<S extends string>({
  order,
  meta,
  selected,
  onChange,
}: {
  order: S[];
  meta: Record<S, { label: string }>;
  selected: Set<Key>;
  onChange: (keys: Set<Key>) => void;
}) {
  const items = order.map((id) => ({ id, label: meta[id].label }));
  return (
    <MultiSelect
      aria-label="Filter by status"
      label="Status"
      size="sm"
      placeholder="All statuses"
      items={items}
      selectedKeys={selected}
      onSelectionChange={(keys: Selection) => onChange(keys === "all" ? new Set(order) : new Set(keys))}
      onReset={() => onChange(new Set())}
      onSelectAll={() => onChange(new Set(order))}
    >
      {(item) => <MultiSelect.Item {...item} selectionIndicator="checkbox" selectionIndicatorAlign="left" />}
    </MultiSelect>
  );
}

function DsaAllStatusesTable({ dsas, scope }: { dsas: Dsa[]; scope: Scope }) {
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<Key>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const query = search.trim().toLowerCase();
  const filtered = dsas
    .filter((d) => statusFilter.size === 0 || statusFilter.has(d.status))
    .filter((d) => !query || [d.id, d.partner, contactName(d.requestedBy)].some((v) => v.toLowerCase().includes(query)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <SectionHeader.Root className="p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Data Sharing Agreements</SectionHeader.Heading>
              <CountBadge count={filtered.length} color="brand" />
            </div>
            <SectionHeader.Subheading>{scope === "mine" ? "Agreements you requested, across every status." : "Every agreement, across every status."}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/dsa/new")}>
              New agreement
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-sm">
            <Input
              aria-label="Search agreements"
              size="sm"
              icon={SearchMd}
              placeholder="Search ID, organisation or requester"
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full max-w-xs">
            <StatusFilterSelect
              order={dsaStatusOrder}
              meta={dsaStatusMeta}
              selected={statusFilter}
              onChange={(keys) => {
                setStatusFilter(keys);
                setPage(1);
              }}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">No agreements match your search and filters.</p>
        ) : (
          <TableCard.Root>
            <Table aria-label="Data Sharing Agreements">
              <Table.Header>
                <Table.Head id="id" label="Agreement" isRowHeader />
                <Table.Head id="partner" label="Data partner" />
                <Table.Head id="status" label="Status" />
                <Table.Head id="requester" label="Requested by" />
                <Table.Head id="updated" label="Updated" />
              </Table.Header>
              <Table.Body items={paged}>
                {(dsa) => (
                  <Table.Row id={dsa.id} href={roleHref(`/pages/dsa/${dsa.id}`)} textValue={dsa.id} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{dsa.id}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{dsa.partner || <span className="text-quaternary">Not provided</span>}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" color={dsaStatusMeta[dsa.status].badgeColor}>
                        {dsaStatusMeta[dsa.status].label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-secondary">{contactName(dsa.requestedBy) || <span className="text-quaternary">Not provided</span>}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{formatDsaDate(dsa.updatedAt)}</span>
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
              totalCount={filtered.length}
            />
          </TableCard.Root>
        )}
      </div>
    </>
  );
}

function DlaAllStatusesTable({ dlas, scope }: { dlas: Dla[]; scope: Scope }) {
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<Key>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const query = search.trim().toLowerCase();
  const filtered = dlas
    .filter((d) => statusFilter.size === 0 || statusFilter.has(d.status))
    .filter((d) => !query || [d.id, d.requestor.organisation, requestorName(d.requestor)].some((v) => v.toLowerCase().includes(query)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <SectionHeader.Root className="p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Data Licencing Agreements</SectionHeader.Heading>
              <CountBadge count={filtered.length} color="brand" />
            </div>
            <SectionHeader.Subheading>{scope === "mine" ? "Requests you submitted, across every status." : "Every request, across every status."}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/dla/new")}>
              New request
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-sm">
            <Input
              aria-label="Search requests"
              size="sm"
              icon={SearchMd}
              placeholder="Search ID, organisation or requestor"
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full max-w-xs">
            <StatusFilterSelect
              order={dlaStatusOrder}
              meta={dlaStatusMeta}
              selected={statusFilter}
              onChange={(keys) => {
                setStatusFilter(keys);
                setPage(1);
              }}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-tertiary">No requests match your search and filters.</p>
        ) : (
          <TableCard.Root>
            <Table aria-label="Data Licencing Agreements">
              <Table.Header>
                <Table.Head id="id" label="Request" isRowHeader />
                <Table.Head id="requestor" label="Requestor" />
                <Table.Head id="status" label="Status" />
                <Table.Head id="locations" label="Locations" />
                <Table.Head id="updated" label="Updated" />
              </Table.Header>
              <Table.Body items={paged}>
                {(dla) => (
                  <Table.Row id={dla.id} href={roleHref(`/pages/dla/${dla.id}`)} textValue={dla.id} className="group data-[href]:cursor-pointer">
                    <Table.Cell>
                      <span className="text-sm font-medium whitespace-nowrap text-primary group-hover:text-brand-700 group-hover:underline">{dla.id}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="text-sm text-secondary">{requestorName(dla.requestor) || <span className="text-quaternary">Not provided</span>}</span>
                        <span className="text-xs text-quaternary">{dla.requestor.organisation}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" color={dlaStatusMeta[dla.status].badgeColor}>
                        {dlaStatusMeta[dla.status].label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-tertiary">
                        {dla.locations[0]?.name ?? "No locations"}
                        {dla.locations.length > 1 ? ` +${dla.locations.length - 1} more` : ""}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-tertiary">{formatDlaDate(dla.updatedAt)}</span>
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
              totalCount={filtered.length}
            />
          </TableCard.Root>
        )}
      </div>
    </>
  );
}

// ── Page ──
// `DsaListContent`/`DlaListContent` call `useRoleHref`, which reads `useSearchParams` -
// `<Suspense>` is required around anything that does, same as `app/pages/dashboard/page.tsx`.

export default function CollectionSidebarProtoPage() {
  return (
    <Suspense fallback={null}>
      <CollectionSidebarProto />
    </Suspense>
  );
}

function CollectionSidebarProto() {
  const [dataset, setDataset] = useState<Dataset>("dsa");
  const [variant, setVariant] = useState<Variant>("Baseline");
  const [dsaStatus, setDsaStatus] = useState<DsaStatus>("active");
  const [dlaStatus, setDlaStatus] = useState<DlaStatus>("active");
  const [scope, setScope] = useState<Scope>("all");

  const dsas = useDsas();
  const dlas = useDlas();

  // Status moves out of column 2 once it has a real home above the table - "Status Tabs" moves it
  // into a Tabs row above the table (still one bucket at a time); "My Items" moves it into its own
  // filter + Status column instead, since My/All is a scope, not a status bucket, and there is no
  // longer a single status this variant's own table is naturally organised around.
  const statusInColumn3 = variant === "Status Tabs";
  const isMine = variant === "My Items" && scope === "mine";
  const scopedDsas = isMine ? dsas.filter((d) => contactName(d.requestedBy) === "Olivia Wyatt") : dsas;
  const scopedDlas = isMine ? dlas.filter((d) => requestorName(d.requestor) === "Olivia Wyatt") : dlas;

  const dsaCounts = Object.fromEntries(dsaStatusOrder.map((s) => [s, dsas.filter((d) => d.status === s).length])) as Record<DsaStatus, number>;
  const dlaCounts = Object.fromEntries(dlaStatusOrder.map((s) => [s, dlas.filter((d) => d.status === s).length])) as Record<DlaStatus, number>;

  return (
    <div className="font-barlow flex h-screen flex-col overflow-hidden bg-primary">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-secondary px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-[17px] font-semibold tracking-tight text-primary">BioData SA</p>
          <div className="h-5 w-px bg-secondary" />
          <p className="text-sm text-tertiary">Column 2 exploration - DSA / DLA</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dataset toggle - a lab-only control. */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["dsa", "dla"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDataset(d)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-100 ease-linear",
                  dataset === d ? "bg-primary text-primary shadow-xs" : "text-quaternary hover:text-primary",
                )}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-secondary" />
          <ProtoPicker variant={variant} onChange={setVariant} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-secondary py-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-brand-solid text-white">
            {dataset === "dsa" ? <FileCheck02 className="size-5" /> : <FileLock01 className="size-5" />}
          </div>
        </nav>

        <aside aria-label="Section" className="w-[286px] shrink-0 overflow-y-auto border-r border-secondary bg-secondary">
          {variant === "Baseline" &&
            (dataset === "dsa" ? (
              <StatusNavColumn
                label="Agreements"
                order={dsaStatusOrder}
                meta={dsaStatusMeta}
                icons={dsaStatusIcons}
                counts={dsaCounts}
                active={dsaStatus}
                onSelect={setDsaStatus}
                after={<DsaActions dsas={dsas} />}
              />
            ) : (
              <StatusNavColumn
                label="Requests"
                order={dlaStatusOrder}
                meta={dlaStatusMeta}
                icons={dlaStatusIcons}
                counts={dlaCounts}
                active={dlaStatus}
                onSelect={setDlaStatus}
                after={<DlaActions dlas={dlas} />}
              />
            ))}

          {variant === "Status Tabs" && <div className="p-4">{dataset === "dsa" ? <DsaActions dsas={dsas} withTopRule={false} /> : <DlaActions dlas={dlas} withTopRule={false} />}</div>}

          {variant === "My Items" && (
            <div className="flex flex-col gap-1 p-4">
              <p className="mb-3 text-xs font-semibold tracking-wide text-quaternary uppercase">{dataset === "dsa" ? "Agreements" : "Requests"}</p>
              <ScopeSwitcher
                scope={scope}
                onScopeChange={setScope}
                myLabel={dataset === "dsa" ? "My Agreements" : "My Requests"}
                allLabel={dataset === "dsa" ? "All Agreements" : "All Requests"}
              />
              {dataset === "dsa" ? <DsaActions dsas={dsas} /> : <DlaActions dlas={dlas} />}
            </div>
          )}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {variant === "My Items" ? (
            dataset === "dsa" ? (
              <DsaAllStatusesTable dsas={scopedDsas} scope={scope} />
            ) : (
              <DlaAllStatusesTable dlas={scopedDlas} scope={scope} />
            )
          ) : dataset === "dsa" ? (
            <DsaListContent
              status={dsaStatus}
              banner={<DsaBanner dsas={dsas} roleHrefBase="/pages/dsa" onViewStatus={setDsaStatus} />}
              statusTabs={statusInColumn3 ? <StatusTabsRow order={dsaStatusOrder} meta={dsaStatusMeta} counts={dsaCounts} active={dsaStatus} onSelect={setDsaStatus} /> : undefined}
            />
          ) : (
            <DlaListContent
              status={dlaStatus}
              banner={<DlaBanner dlas={dlas} roleHrefBase="/pages/dla" onViewStatus={setDlaStatus} />}
              statusTabs={statusInColumn3 ? <StatusTabsRow order={dlaStatusOrder} meta={dlaStatusMeta} counts={dlaCounts} active={dlaStatus} onSelect={setDlaStatus} /> : undefined}
            />
          )}
        </main>
      </div>
    </div>
  );
}

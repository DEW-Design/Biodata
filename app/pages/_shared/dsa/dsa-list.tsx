"use client";

import { useState, type ReactNode } from "react";
import type { Key, SortDescriptor } from "react-aria-components";
import { CURRENT_USER_NAME, StatusFilterButton, sortRows, type AgreementScope, type SortValue } from "@/app/pages/_shared/agreement-scope";
import { dsaStatusOrder } from "@/app/pages/_shared/dsa/dsa-data";

import { Clock, Edit05, Plus, SearchMd } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, CountBadge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SectionHeader } from "@/components/application/section-headers/section-headers";
import { Table, TableCard } from "@/components/application/table/table";
import { nearestToExpiry } from "@/app/pages/_shared/agreement-status";
import { DsaEmptyState } from "@/app/pages/_shared/dsa/dsa-detail";
import { contactName, dsaStatusMeta, formatShortDate, type Dsa, type DsaStatus } from "@/app/pages/_shared/dsa/dsa-data";
import { useDsas } from "@/app/pages/_shared/dsa/dsa-store";
import { TaskItem } from "@/app/pages/_shared/home-dashboard";
import { useRoleHref } from "@/lib/use-role-href";

// The DSA list: a table of agreements in one status bucket (chosen in column 2), each row linking to
// that agreement's deep dive at /pages/dsa/<id>. Same shape as the Projects list
// (project-list-content.tsx): a SectionHeader, then a TableCard with numbered pagination, rows are
// links. There is no Status column - the bucket is already chosen in column 2, so a column of
// identical badges would state the same fact twice.
//
// `banner`, `statusTabs`, and `extraFilter` are additive, opt-in slots (all default undefined, no
// change for any existing consumer) - same convention as `Table`'s own `bodyScrollable`/`sticky`
// props. `banner` renders above the search input, per direct feedback moving
// `/proto/collection-sidebar`'s column-2 alerts into column 3 instead ("shouldn't this sit above
// the DSA table, above the search bar?") - `DsaBanner` below is the real, folded-in version,
// rendered from `app/pages/dsa/page.tsx`. `statusTabs` renders directly under the header, for a
// lab exploring status-as-tabs (Xero/Remote's own real pattern) instead of a column-2 nav list.
// `extraFilter` narrows `inStatus` further (e.g. "My Agreements only") before search/pagination
// ever see it, so the count badge/empty state/pagination all stay honest about what's actually
// showing.

const subheadings: Record<DsaStatus, string> = {
  draft: "Drafts that haven't been submitted yet.",
  submitted: "Agreements submitted, waiting for a reviewer to pick them up.",
  under_review: "Agreements a reviewer is currently assessing.",
  on_hold: "Agreements paused pending information from the requester.",
  approved: "Agreements approved and waiting on their own start date.",
  rejected: "Agreements a reviewer formally rejected.",
  active: "Agreements in effect between DEW and partner organisations.",
  closed: "Agreements that have run their course, automatically or manually.",
  cancelled: "Agreements cancelled by the requester or an admin.",
};

const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

/**
 * Column-3 banner (via `DsaListContent`'s own `banner` prop) - folded in directly from
 * /proto/collection-sidebar's own "Actions" baseline (see CONTEXT.md). Real `TaskItem`
 * (`app/pages/_shared/home-dashboard.tsx`), not `AlertFullWidth` - a computed fact about other
 * records pointing elsewhere is a `TaskItem`, per that component's own established precedent.
 * Renders nothing when there's nothing to say.
 */
export function DsaBanner() {
  const dsas = useDsas();
  const roleHref = useRoleHref();
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
          actionHref={roleHref("/pages/dsa?status=draft")}
        />
      )}
      {expiring && (
        <TaskItem
          icon={Clock}
          title={expiring.id}
          detail={`${expiring.partner || "No partner set"} - expires ${formatShortDate(expiring.validTo)}.`}
          status={dsaStatusMeta[expiring.status].label}
          statusColor={dsaStatusMeta[expiring.status].badgeColor}
          actionLabel="View agreement"
          actionHref={roleHref(`/pages/dsa/${expiring.id}`)}
        />
      )}
    </div>
  );
}

export function DsaListContent({
  status,
  banner,
  statusTabs,
  extraFilter,
}: {
  status: DsaStatus;
  banner?: ReactNode;
  statusTabs?: ReactNode;
  extraFilter?: (dsa: Dsa) => boolean;
}) {
  const roleHref = useRoleHref();
  const dsas = useDsas();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const statusMatches = dsas.filter((d) => d.status === status);
  const inStatus = (extraFilter ? statusMatches.filter(extraFilter) : statusMatches).sort((a, b) =>
    a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt),
  );
  const query = search.trim().toLowerCase();
  const rows = query ? inStatus.filter((d) => [d.id, d.partner, contactName(d.requestedBy)].some((v) => v.toLowerCase().includes(query))) : inStatus;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
        <SectionHeader.Group>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <SectionHeader.Heading>Data Sharing Agreements</SectionHeader.Heading>
              <CountBadge count={inStatus.length} color="brand" />
            </div>
            <SectionHeader.Subheading>{subheadings[status]}</SectionHeader.Subheading>
          </div>
          <SectionHeader.Actions>
            <Button color="primary" iconLeading={Plus} href={roleHref("/pages/dsa/new")}>
              New agreement
            </Button>
          </SectionHeader.Actions>
        </SectionHeader.Group>
      </SectionHeader.Root>

      {statusTabs}

      {inStatus.length === 0 ? (
        <DsaEmptyState status={status} newHref={roleHref("/pages/dsa/new")} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
          {banner}
          <div className="w-full max-w-sm shrink-0">
            <Input
              aria-label="Search agreements"
              size="sm"
              icon={SearchMd}
              placeholder="Search ID, organisation or requester"
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-tertiary">No {dsaStatusMeta[status].label.toLowerCase()} agreements match your search.</p>
          ) : (
            <TableCard.Root className="flex min-h-48 flex-1 flex-col">
              <Table bodyScrollable aria-label={`${dsaStatusMeta[status].label} Data Sharing Agreements`}>
                <Table.Header sticky>
                  {/* `label` (not children) - Table.Head only applies the header treatment to the prop. */}
                  <Table.Head id="id" label="Agreement" isRowHeader />
                  <Table.Head id="partner" label="Data partner" />
                  <Table.Head id="period" label="Agreement period" />
                  <Table.Head id="requester" label="Requested by" />
                  <Table.Head id="via" label="Shared via" />
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
                        {dsa.validFrom && dsa.validTo ? (
                          <span className="text-sm whitespace-nowrap text-tertiary">
                            {formatShortDate(dsa.validFrom)} to {formatShortDate(dsa.validTo)}
                          </span>
                        ) : (
                          <span className="text-sm text-quaternary">Not set</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {contactName(dsa.requestedBy) ? (
                          <div className="flex items-center gap-2">
                            <Avatar size="xs" initials={initials(dsa.requestedBy.firstName, dsa.requestedBy.lastName)} alt={contactName(dsa.requestedBy)} />
                            <span className="text-sm text-secondary">{contactName(dsa.requestedBy)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-quaternary">Not provided</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-1.5">
                          {dsa.sharedOffline && <Badge size="sm" color="gray">Offline</Badge>}
                          {dsa.sharedViaSystem && (
                            <Badge size="sm" color="brand">
                              System{dsa.systems.length > 0 ? ` (${dsa.systems.length})` : ""}
                            </Badge>
                          )}
                          {!dsa.sharedOffline && !dsa.sharedViaSystem && <span className="text-sm text-quaternary">Not set</span>}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(dsa.updatedAt)}</span>
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
                totalCount={rows.length}
              />
            </TableCard.Root>
          )}
        </div>
      )}
    </div>
  );
}

// ── All statuses, scoped My / All (rolled in from /proto/collection-sidebar's "My Items") ──
// The production list. My/All is a scope chosen in column 2 (`AgreementScopeNav`); this table shows
// every status at once, with a status filter (`?status=` seeds it, so banner links still land on a
// status) and a Status column. The one-bucket list above stays for the lab that still uses it.

// What each sortable column sorts by. Agreement ID is deliberately not sortable (an identifier, not a
// range you scan); Status sorts by its place in the workflow, not alphabetically.
const dsaSortKeys: Record<string, (d: Dsa) => SortValue> = {
  partner: (d) => d.partner,
  status: (d) => dsaStatusOrder.indexOf(d.status),
  requester: (d) => contactName(d.requestedBy),
  updated: (d) => d.updatedAt,
};

export function DsaAllList({ scope, initialStatuses = [], banner }: { scope: AgreementScope; initialStatuses?: DsaStatus[]; banner?: ReactNode }) {
  const all = useDsas();
  const scoped = scope === "mine" ? all.filter((d) => contactName(d.requestedBy) === CURRENT_USER_NAME) : all;
  const roleHref = useRoleHref();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<Key>>(new Set(initialStatuses));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState<SortDescriptor>({ column: "updated", direction: "descending" });

  const query = search.trim().toLowerCase();
  const matching = scoped
    .filter((d) => statusFilter.size === 0 || statusFilter.has(d.status))
    .filter((d) => !query || [d.id, d.partner, contactName(d.requestedBy)].some((v) => v.toLowerCase().includes(query)));
  const filtered = sortRows(matching, sort, dsaSortKeys);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader.Root className="shrink-0 p-6">
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
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        {banner}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="w-full max-w-sm shrink-0">
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
          <div>
            <StatusFilterButton
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
          <TableCard.Root className="flex min-h-48 flex-1 flex-col">
            <Table
              bodyScrollable
              aria-label="Data Sharing Agreements"
              sortDescriptor={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
            >
              <Table.Header sticky>
                <Table.Head id="id" label="Agreement" isRowHeader />
                <Table.Head id="partner" label="Data partner" allowsSorting />
                <Table.Head id="status" label="Status" allowsSorting />
                <Table.Head id="requester" label="Requested by" allowsSorting />
                <Table.Head id="updated" label="Updated" allowsSorting />
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
                      <span className="text-sm whitespace-nowrap text-tertiary">{formatShortDate(dsa.updatedAt)}</span>
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
    </div>
  );
}

